import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { parseStudyTags } from '../database/studyStorage';
import { useStudyTheme } from '../theme/ThemeContext';
import type { AppPalette } from '../theme/colors';
import type { StudyItem } from '../types/study';
import { formatDateTime } from '../utils/date';

type StudyCardProps = {
  item: StudyItem;
  onPress: () => void;
  onTogglePinned?: () => void;
};

export function StudyCard({ item, onPress, onTogglePinned }: StudyCardProps) {
  const { colors } = useStudyTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const styles = createStyles(colors);
  const tags = parseStudyTags(item.tags);

  const animateScale = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      friction: 8,
      tension: 120,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => animateScale(0.98)}
        onPressOut={() => animateScale(1)}
        style={styles.pressArea}>
        <View style={styles.header}>
          <Text numberOfLines={1} style={styles.title}>
            {item.title}
          </Text>
          {item.pinned ? <Text style={styles.pinBadge}>置顶</Text> : null}
        </View>

        <Text numberOfLines={2} style={styles.preview}>
          {item.content.trim() || '暂无正文内容'}
        </Text>

        <View style={styles.chipRow}>
          {tags.length > 0 ? (
            tags.slice(0, 4).map((tag) => (
              <Text key={tag} numberOfLines={1} style={styles.chip}>
                #{tag}
              </Text>
            ))
          ) : (
            <Text style={styles.mutedChip}>暂无标签</Text>
          )}
        </View>

        <Text style={styles.dateText}>更新于 {formatDateTime(item.updatedAt)}</Text>
      </Pressable>

      {onTogglePinned ? (
        <TouchableOpacity activeOpacity={0.82} style={styles.pinButton} onPress={onTogglePinned}>
          <Text style={styles.pinButtonText}>{item.pinned ? '取消置顶' : '置顶'}</Text>
        </TouchableOpacity>
      ) : null}
    </Animated.View>
  );
}

function createStyles(colors: AppPalette) {
  return StyleSheet.create({
    card: {
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.surface,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: colors.mode === 'dark' ? 0.2 : 0.08,
      shadowRadius: 16,
      elevation: 3,
      overflow: 'hidden',
    },
    pressArea: {
      padding: 16,
      paddingBottom: 12,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    title: {
      flex: 1,
      color: colors.text,
      fontSize: 17,
      fontWeight: '800',
      lineHeight: 24,
    },
    pinBadge: {
      borderRadius: 6,
      backgroundColor: colors.chip,
      paddingHorizontal: 8,
      paddingVertical: 4,
      color: colors.chipText,
      fontSize: 12,
      fontWeight: '700',
    },
    preview: {
      marginTop: 10,
      color: colors.mutedText,
      fontSize: 14,
      lineHeight: 21,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 12,
    },
    chip: {
      maxWidth: '48%',
      borderRadius: 6,
      backgroundColor: colors.chip,
      paddingHorizontal: 8,
      paddingVertical: 4,
      color: colors.chipText,
      fontSize: 13,
    },
    mutedChip: {
      borderRadius: 6,
      backgroundColor: colors.input,
      paddingHorizontal: 8,
      paddingVertical: 4,
      color: colors.subtleText,
      fontSize: 13,
    },
    dateText: {
      marginTop: 12,
      color: colors.subtleText,
      fontSize: 13,
    },
    pinButton: {
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.elevated,
      paddingVertical: 10,
    },
    pinButtonText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '700',
    },
  });
}
