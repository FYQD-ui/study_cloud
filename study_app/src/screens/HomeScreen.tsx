import * as DocumentPicker from 'expo-document-picker';
import { File as ExpoFile } from 'expo-file-system';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StudyCard } from '../components/StudyCard';
import {
  extractAllTags,
  filterStudyItems,
  getStudyItems,
  importStudyItems,
  setStudyItemPinned,
} from '../database/studyStorage';
import { useStudyTheme } from '../theme/ThemeContext';
import type { AppPalette } from '../theme/colors';
import type { StudyItem } from '../types/study';
import { exportStudyItems } from '../utils/exportStudyItems';

function decodeBase64Text(base64: string) {
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function readPickedDocumentText(asset: DocumentPicker.DocumentPickerAsset) {
  if (Platform.OS === 'web') {
    if (asset.file) {
      return asset.file.text();
    }

    if (asset.base64) {
      return decodeBase64Text(asset.base64);
    }
  }

  const file = new ExpoFile(asset.uri);
  return file.text();
}

export function HomeScreen() {
  const { colors, mode, toggleTheme } = useStudyTheme();
  const [items, setItems] = useState<StudyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<'import' | 'export' | null>(null);
  const styles = createStyles(colors);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const loadItems = useCallback(async () => {
    setLoading(true);

    try {
      const savedItems = await getStudyItems();
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setItems(savedItems);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems])
  );

  const tags = useMemo(() => extractAllTags(items), [items]);
  const visibleItems = useMemo(
    () => filterStudyItems(items, query, selectedTag),
    [items, query, selectedTag]
  );

  const handleTogglePinned = async (item: StudyItem) => {
    const updatedItem = await setStudyItemPinned(item.id, !item.pinned);

    if (updatedItem) {
      await loadItems();
    }
  };

  const handleExport = async () => {
    setBusyAction('export');

    try {
      await exportStudyItems(items);
      Alert.alert('导出完成', `已导出 ${items.length} 条资料。`);
    } catch {
      Alert.alert('导出失败', '生成 JSON 文件时出现问题，请稍后再试。');
    } finally {
      setBusyAction(null);
    }
  };

  const handleImport = async () => {
    setBusyAction('import');

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
        base64: Platform.OS === 'web',
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const rawText = await readPickedDocumentText(result.assets[0]);
      const importResult = await importStudyItems(rawText);

      await loadItems();
      Alert.alert(
        '导入完成',
        `成功导入 ${importResult.imported} 条资料${
          importResult.skipped > 0 ? `，跳过 ${importResult.skipped} 条异常数据` : ''
        }。`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : '导入 JSON 时出现问题，请检查文件格式。';
      Alert.alert('导入失败', message);
    } finally {
      setBusyAction(null);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerArea}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="搜索标题、正文或标签"
        placeholderTextColor={colors.subtleText}
        style={styles.searchInput}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}>
        <TouchableOpacity
          activeOpacity={0.82}
          style={[styles.filterChip, !selectedTag && styles.activeFilterChip]}
          onPress={() => setSelectedTag(null)}>
          <Text style={[styles.filterText, !selectedTag && styles.activeFilterText]}>全部</Text>
        </TouchableOpacity>

        {tags.map((tag) => {
          const active = selectedTag === tag;

          return (
            <TouchableOpacity
              key={tag}
              activeOpacity={0.82}
              style={[styles.filterChip, active && styles.activeFilterChip]}
              onPress={() => setSelectedTag(active ? null : tag)}>
              <Text style={[styles.filterText, active && styles.activeFilterText]}>{tag}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.actionRow}>
        <TouchableOpacity
          activeOpacity={0.82}
          disabled={busyAction !== null}
          style={styles.secondaryButton}
          onPress={handleImport}>
          <Text style={styles.secondaryButtonText}>
            {busyAction === 'import' ? '导入中...' : '导入'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.82}
          disabled={busyAction !== null || items.length === 0}
          style={[styles.secondaryButton, items.length === 0 && styles.disabledButton]}
          onPress={handleExport}>
          <Text style={styles.secondaryButtonText}>
            {busyAction === 'export' ? '导出中...' : '全量导出'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.centerBox}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.hintText}>正在读取本地资料...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={styles.navActions}>
              <TouchableOpacity
                accessibilityRole="button"
                style={styles.navTextButton}
                onPress={toggleTheme}>
                <Text style={styles.navText}>{mode === 'dark' ? '浅色' : '深色'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                style={styles.addButton}
                onPress={() => router.push('/add')}>
                <Text style={styles.addButtonText}>新增</Text>
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
        {renderHeader()}
        {visibleItems.length > 0 ? (
          visibleItems.map((item) => (
            <StudyCard
              key={item.id}
              item={item}
              onPress={() => router.push(`/study/${item.id}`)}
              onTogglePinned={() => handleTogglePinned(item)}
            />
          ))
        ) : (
          <View style={styles.emptyContent}>
            <Text style={styles.emptyIcon}>+</Text>
            <Text style={styles.emptyTitle}>
              {items.length === 0 ? '还没有学习资料' : '未找到相关资料'}
            </Text>
            <Text style={styles.hintText}>
              {items.length === 0
                ? '点击右上角“新增”保存第一条复习内容。'
                : '换个关键词，或切回“全部”再试试。'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: AppPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    list: {
      width: '100%',
      maxWidth: 760,
      alignSelf: 'center',
      flexGrow: 1,
      padding: 16,
      paddingBottom: 28,
    },
    headerArea: {
      gap: 12,
      marginBottom: 16,
    },
    searchInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.input,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: colors.text,
      fontSize: 15,
    },
    filterRow: {
      gap: 8,
      paddingRight: 4,
    },
    filterChip: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    activeFilterChip: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    filterText: {
      color: colors.mutedText,
      fontSize: 13,
      fontWeight: '700',
    },
    activeFilterText: {
      color: '#FFFFFF',
    },
    actionRow: {
      flexDirection: 'row',
      gap: 10,
    },
    secondaryButton: {
      alignItems: 'center',
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      backgroundColor: colors.surface,
      paddingVertical: 10,
    },
    secondaryButtonText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
    },
    disabledButton: {
      opacity: 0.48,
    },
    centerBox: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      backgroundColor: colors.background,
      paddingHorizontal: 24,
    },
    emptyContent: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    emptyIcon: {
      marginBottom: 14,
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.chip,
      color: colors.primary,
      fontSize: 34,
      fontWeight: '300',
      lineHeight: 48,
      textAlign: 'center',
    },
    emptyTitle: {
      marginBottom: 8,
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
    },
    hintText: {
      color: colors.mutedText,
      fontSize: 14,
      lineHeight: 21,
      textAlign: 'center',
    },
    navActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    navTextButton: {
      paddingHorizontal: 8,
      paddingVertical: 6,
    },
    navText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '700',
    },
    addButton: {
      borderRadius: 8,
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    addButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
  });
}
