import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Note } from '@/types/note';

type NoteCardProps = {
  note: Note;
  onPress: () => void;
};

export function NoteCard({ note, onPress }: NoteCardProps) {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={onPress}>
      <View style={styles.header}>
        <Text numberOfLines={1} style={styles.title}>
          {note.title}
        </Text>
        <Text style={styles.date}>{note.createdAt}</Text>
      </View>

      <Text numberOfLines={2} style={styles.content}>
        {note.content}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 10,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pressed: {
    opacity: 0.75,
  },
  header: {
    gap: 6,
  },
  title: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '700',
  },
  date: {
    color: '#6B7280',
    fontSize: 12,
  },
  content: {
    color: '#4B5563',
    fontSize: 14,
    lineHeight: 20,
  },
});
