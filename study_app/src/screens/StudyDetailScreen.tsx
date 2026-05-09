import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MarkdownContent } from '../components/MarkdownContent';
import {
  deleteStudyItem,
  getStudyItemById,
  parseStudyTags,
  setStudyItemPinned,
} from '../database/studyStorage';
import { useStudyTheme } from '../theme/ThemeContext';
import type { AppPalette } from '../theme/colors';
import type { StudyItem } from '../types/study';
import { formatDateTime } from '../utils/date';
import { exportStudyItems } from '../utils/exportStudyItems';

export function StudyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useStudyTheme();
  const [item, setItem] = useState<StudyItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [busyAction, setBusyAction] = useState<'export' | null>(null);
  const fade = useRef(new Animated.Value(1)).current;
  const styles = createStyles(colors);

  const loadItem = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const savedItem = await getStudyItemById(id);
      setItem(savedItem);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadItem();
    }, [loadItem])
  );

  const handleTogglePinned = async () => {
    if (!item) {
      return;
    }

    const updatedItem = await setStudyItemPinned(item.id, !item.pinned);

    if (updatedItem) {
      setItem(updatedItem);
      Alert.alert(updatedItem.pinned ? '已置顶' : '已取消置顶', '置顶状态已保存。');
    }
  };

  const runDelete = useCallback(() => {
    if (!item) {
      return;
    }

    setDeleting(true);
    Animated.timing(fade, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(async () => {
      try {
        await deleteStudyItem(item.id);
        Alert.alert('删除成功', '资料已从本地删除。');
        router.replace('/');
      } catch {
        fade.setValue(1);
        setDeleting(false);
        Alert.alert('删除失败', '删除资料时出现问题，请稍后再试。');
      }
    });
  }, [fade, item]);

  const handleDelete = () => {
    if (!item || deleting) {
      return;
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm('确定要删除这条学习资料吗？')) {
        runDelete();
      }
      return;
    }

    Alert.alert('删除资料', '确定要删除这条学习资料吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: runDelete,
      },
    ]);
  };

  const handleExportCurrent = async () => {
    if (!item) {
      return;
    }

    setBusyAction('export');

    try {
      await exportStudyItems([item], { single: true });
      Alert.alert('导出完成', '当前资料已导出为 JSON。');
    } catch {
      Alert.alert('导出失败', '生成当前资料 JSON 时出现问题，请稍后再试。');
    } finally {
      setBusyAction(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.centerBox}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.hintText}>正在读取资料...</Text>
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.centerBox}>
        <Text style={styles.emptyTitle}>资料不存在</Text>
        <Text style={styles.hintText}>它可能已经被删除，或本地数据还没有完成刷新。</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/')}>
          <Text style={styles.primaryButtonText}>返回首页</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const tags = parseStudyTags(item.tags);

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.headerButton}
              onPress={() => router.push(`/study/${item.id}/edit`)}>
              <Text style={styles.headerButtonText}>编辑</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Animated.View style={[styles.container, { opacity: fade }]}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{item.title}</Text>
              {item.pinned ? <Text style={styles.pinBadge}>置顶</Text> : null}
            </View>
            <Text style={styles.meta}>更新时间：{formatDateTime(item.updatedAt)}</Text>
            <Text style={styles.meta}>创建时间：{formatDateTime(item.createdAt)}</Text>

            <View style={styles.tagRow}>
              {tags.length > 0 ? (
                tags.map((tag) => (
                  <Text key={tag} style={styles.tag}>
                    #{tag}
                  </Text>
                ))
              ) : (
                <Text style={styles.meta}>暂无标签</Text>
              )}
            </View>
          </View>

          <View style={styles.contentCard}>
            <MarkdownContent content={item.content} />
          </View>

          <TouchableOpacity
            activeOpacity={0.82}
            style={styles.pinButton}
            onPress={handleTogglePinned}>
            <Text style={styles.pinButtonText}>{item.pinned ? '取消置顶' : '置顶资料'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.82}
            disabled={busyAction !== null}
            style={[styles.exportButton, busyAction && styles.disabledButton]}
            onPress={handleExportCurrent}>
            <Text style={styles.exportButtonText}>
              {busyAction === 'export' ? '导出中...' : '导出此条'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.82}
            disabled={deleting}
            style={[styles.deleteButton, deleting && styles.disabledButton]}
            onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>{deleting ? '删除中...' : '删除资料'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

function createStyles(colors: AppPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      width: '100%',
      maxWidth: 820,
      alignSelf: 'center',
      gap: 16,
      padding: 16,
      paddingBottom: 32,
    },
    card: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.surface,
      padding: 16,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: colors.mode === 'dark' ? 0.2 : 0.08,
      shadowRadius: 16,
      elevation: 3,
    },
    contentCard: {
      minHeight: 260,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.surface,
      padding: 16,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    title: {
      flex: 1,
      marginBottom: 12,
      color: colors.text,
      fontSize: 24,
      fontWeight: '800',
      lineHeight: 32,
    },
    pinBadge: {
      marginTop: 2,
      borderRadius: 6,
      backgroundColor: colors.chip,
      paddingHorizontal: 8,
      paddingVertical: 4,
      color: colors.chipText,
      fontSize: 12,
      fontWeight: '700',
    },
    meta: {
      marginTop: 6,
      color: colors.mutedText,
      fontSize: 14,
      lineHeight: 20,
    },
    tagRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 12,
    },
    tag: {
      borderRadius: 6,
      backgroundColor: colors.chip,
      paddingHorizontal: 8,
      paddingVertical: 5,
      color: colors.chipText,
      fontSize: 13,
    },
    centerBox: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      backgroundColor: colors.background,
      paddingHorizontal: 24,
    },
    hintText: {
      color: colors.mutedText,
      fontSize: 14,
      lineHeight: 21,
      textAlign: 'center',
    },
    emptyTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
    },
    primaryButton: {
      borderRadius: 8,
      backgroundColor: colors.primary,
      paddingHorizontal: 18,
      paddingVertical: 10,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
    },
    headerButton: {
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    headerButtonText: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: '700',
    },
    pinButton: {
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 13,
    },
    pinButtonText: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: '700',
    },
    exportButton: {
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      backgroundColor: colors.surface,
      paddingVertical: 13,
    },
    exportButtonText: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '700',
    },
    deleteButton: {
      alignItems: 'center',
      borderRadius: 10,
      backgroundColor: colors.dangerSurface,
      paddingVertical: 13,
    },
    disabledButton: {
      opacity: 0.62,
    },
    deleteButtonText: {
      color: colors.danger,
      fontSize: 15,
      fontWeight: '800',
    },
  });
}
