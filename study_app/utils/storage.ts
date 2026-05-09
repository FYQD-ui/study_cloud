import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CreateNoteInput, Note } from '@/types/note';

export const STUDY_NOTES_KEY = 'STUDY_NOTES';

function getTodayText() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function createNoteId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function getNotes(): Promise<Note[]> {
  const rawNotes = await AsyncStorage.getItem(STUDY_NOTES_KEY);

  if (!rawNotes) {
    return [];
  }

  try {
    const notes = JSON.parse(rawNotes) as Note[];
    return Array.isArray(notes) ? notes : [];
  } catch {
    // 本地数据异常时返回空数组，避免 APP 直接崩溃。
    return [];
  }
}

export async function saveNotes(notes: Note[]) {
  await AsyncStorage.setItem(STUDY_NOTES_KEY, JSON.stringify(notes));
}

export async function addNote(input: CreateNoteInput) {
  const notes = await getNotes();
  const today = getTodayText();
  const newNote: Note = {
    id: createNoteId(),
    title: input.title,
    category: input.category,
    content: input.content,
    createdAt: today,
    updatedAt: today,
  };

  await saveNotes([newNote, ...notes]);

  return newNote;
}

export async function getNoteById(id: string) {
  const notes = await getNotes();
  return notes.find((note) => note.id === id) ?? null;
}

export async function deleteNote(id: string) {
  const notes = await getNotes();
  await saveNotes(notes.filter((note) => note.id !== id));
}
