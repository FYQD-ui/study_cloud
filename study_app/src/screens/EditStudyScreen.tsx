import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { StudyForm } from '../components/StudyForm';
import { getStudyItemById, updateStudyItem } from '../database/studyStorage';
import { useStudyTheme } from '../theme/ThemeContext';
import type { AppPalette } from '../theme/colors';
import type { StudyItem, StudyItemInput } from '../types/study';

export function EditStudyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useStudyTheme();
  const [item, setItem] = useState<StudyItem | null>(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    loadItem();
  }, [loadItem]);

  const handleSubmit = async (input: StudyItemInput) => {
    if (!id) {
      return;
    }

    const updatedItem = await updateStudyItem(id, input);

    if (updatedItem) {
      router.replace(`/study/${updatedItem.id}`);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.hintText}>正在加载资料...</Text>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.centerBox}>
        <Text style={styles.emptyTitle}>资料不存在</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryButtonText}>返回</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <StudyForm initialValues={item} submitLabel="保存修改" onSubmit={handleSubmit} />;
}

function createStyles(colors: AppPalette) {
  return StyleSheet.create({
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
  });
}
