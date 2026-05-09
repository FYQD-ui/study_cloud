import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';

import { useStudyTheme } from '../theme/ThemeContext';
import type { AppPalette } from '../theme/colors';
import type { StudyItemInput } from '../types/study';

type StudyFormProps = {
  initialValues?: Partial<StudyItemInput>;
  submitLabel: string;
  savingLabel?: string;
  onSubmit: (input: StudyItemInput) => Promise<void>;
};

export function StudyForm({
  initialValues,
  submitLabel,
  savingLabel = '保存中...',
  onSubmit,
}: StudyFormProps) {
  const { colors } = useStudyTheme();
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [tags, setTags] = useState(initialValues?.tags ?? '');
  const [content, setContent] = useState(initialValues?.content ?? '');
  const [saving, setSaving] = useState(false);
  const styles = createStyles(colors);

  const handleSave = async () => {
    const nextTitle = title.trim();

    if (!nextTitle) {
      Alert.alert('提示', '标题不能为空');
      return;
    }

    setSaving(true);

    try {
      await onSubmit({
        title: nextTitle,
        tags: tags.trim(),
        content,
      });
      Alert.alert('保存成功', '资料已经保存到本地。');
    } catch {
      Alert.alert('保存失败', '本地保存时出现问题，请稍后再试。');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>标题</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="例如：React Native 状态管理"
          placeholderTextColor={colors.subtleText}
          style={styles.input}
        />

        <Text style={styles.label}>标签</Text>
        <TextInput
          value={tags}
          onChangeText={setTags}
          placeholder="例如：React Native, TypeScript"
          placeholderTextColor={colors.subtleText}
          style={styles.input}
        />

        <Text style={styles.label}>正文内容</Text>
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="写下需要复习的重点内容，支持 Markdown..."
          placeholderTextColor={colors.subtleText}
          multiline
          textAlignVertical="top"
          style={[styles.input, styles.contentInput]}
        />

        <TouchableOpacity
          activeOpacity={0.82}
          disabled={saving}
          style={[styles.saveButton, saving && styles.disabledButton]}
          onPress={handleSave}>
          <Text style={styles.saveButtonText}>{saving ? savingLabel : submitLabel}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
      padding: 16,
      paddingBottom: 32,
    },
    label: {
      marginBottom: 8,
      color: colors.text,
      fontSize: 15,
      fontWeight: '700',
    },
    input: {
      marginBottom: 18,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      backgroundColor: colors.input,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: colors.text,
      fontSize: 16,
      lineHeight: 22,
    },
    contentInput: {
      minHeight: 300,
    },
    saveButton: {
      alignItems: 'center',
      borderRadius: 10,
      backgroundColor: colors.primary,
      paddingVertical: 14,
    },
    disabledButton: {
      opacity: 0.62,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },
  });
}
