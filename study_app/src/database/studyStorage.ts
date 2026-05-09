import AsyncStorage from '@react-native-async-storage/async-storage';

import type { StudyImportResult, StudyItem, StudyItemInput } from '../types/study';
import { getNowISOString } from '../utils/date';

const STUDY_ITEMS_KEY = 'study_app:study_items';

function createStudyId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function normalizeTags(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((tag): tag is string => typeof tag === 'string').join(', ');
  }

  return normalizeText(value);
}

function normalizeBoolean(value: unknown) {
  return value === true || value === 1;
}

function normalizeDate(value: unknown, fallback: string) {
  const text = normalizeText(value);
  const time = new Date(text).getTime();
  return Number.isNaN(time) ? fallback : text;
}

function normalizeStudyItem(value: unknown): StudyItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const now = getNowISOString();
  const category = normalizeText(value.category).trim();

  return {
    id: normalizeText(value.id).trim() || createStudyId(),
    title: normalizeText(value.title).trim() || '未命名资料',
    content: normalizeText(value.content),
    tags: normalizeTags(value.tags).trim(),
    pinned: normalizeBoolean(value.pinned ?? value.favorite),
    createdAt: normalizeDate(value.createdAt, now),
    updatedAt: normalizeDate(value.updatedAt, now),
    ...(category ? { category } : {}),
  };
}

function sortStudyItems(items: StudyItem[]) {
  return [...items].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }

    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

async function saveStudyItemsRaw(items: StudyItem[]) {
  await AsyncStorage.setItem(STUDY_ITEMS_KEY, JSON.stringify(items));
}

export async function getStudyItems() {
  const rawItems = await AsyncStorage.getItem(STUDY_ITEMS_KEY);

  if (!rawItems) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawItems);
    const sourceItems = Array.isArray(parsed)
      ? parsed
      : isRecord(parsed) && Array.isArray(parsed.items)
        ? parsed.items
        : [];
    const items = sourceItems
      .map((item) => normalizeStudyItem(item))
      .filter((item): item is StudyItem => item !== null);

    return sortStudyItems(items);
  } catch {
    return [];
  }
}

export async function saveStudyItems(items: StudyItem[]) {
  await saveStudyItemsRaw(sortStudyItems(items));
}

export async function createStudyItem(input: StudyItemInput) {
  const items = await getStudyItems();
  const now = getNowISOString();
  const item: StudyItem = {
    id: createStudyId(),
    title: input.title,
    content: input.content,
    tags: input.tags,
    pinned: false,
    createdAt: now,
    updatedAt: now,
  };

  await saveStudyItems([item, ...items]);

  return item;
}

export async function getStudyItemById(id: string) {
  const items = await getStudyItems();
  return items.find((item) => item.id === id) ?? null;
}

export async function updateStudyItem(id: string, input: StudyItemInput) {
  const items = await getStudyItems();
  const updatedAt = getNowISOString();
  const itemIndex = items.findIndex((item) => item.id === id);

  if (itemIndex < 0) {
    return null;
  }

  const updatedItem: StudyItem = {
    ...items[itemIndex],
    title: input.title,
    content: input.content,
    tags: input.tags,
    updatedAt,
  };
  const nextItems = [...items];
  nextItems[itemIndex] = updatedItem;

  await saveStudyItems(nextItems);
  return updatedItem;
}

export async function setStudyItemPinned(id: string, pinned: boolean) {
  const items = await getStudyItems();
  const itemIndex = items.findIndex((item) => item.id === id);

  if (itemIndex < 0) {
    return null;
  }

  const updatedItem: StudyItem = {
    ...items[itemIndex],
    pinned,
  };
  const nextItems = [...items];
  nextItems[itemIndex] = updatedItem;

  await saveStudyItems(nextItems);
  return updatedItem;
}

export async function deleteStudyItem(id: string) {
  const items = await getStudyItems();
  const nextItems = items.filter((item) => item.id !== id);

  if (nextItems.length === items.length) {
    throw new Error('资料不存在或已被删除');
  }

  await saveStudyItems(nextItems);
}

export function parseStudyTags(tags: string) {
  return tags
    .split(/[,，#\s]+/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function extractAllTags(items: StudyItem[]) {
  return Array.from(new Set(items.flatMap((item) => parseStudyTags(item.tags)))).sort((a, b) =>
    a.localeCompare(b, 'zh-Hans-CN')
  );
}

export function filterStudyItems(items: StudyItem[], query: string, selectedTag: string | null) {
  const normalizedQuery = query.trim().toLowerCase();

  return items.filter((item) => {
    const tagList = parseStudyTags(item.tags);
    const matchesTag = selectedTag ? tagList.includes(selectedTag) : true;
    const searchableText = [item.title, item.content, item.tags, item.category ?? '']
      .join(' ')
      .toLowerCase();
    const matchesQuery = normalizedQuery ? searchableText.includes(normalizedQuery) : true;

    return matchesTag && matchesQuery;
  });
}

export function buildExportPayload(items: StudyItem[]) {
  return {
    app: 'study_app',
    version: 1,
    exportedAt: getNowISOString(),
    items: sortStudyItems(items),
  };
}

export function validateImportedStudyItems(rawText: string) {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error('JSON 文件无法解析，请确认文件内容完整。');
  }

  const sourceItems = Array.isArray(parsed)
    ? parsed
    : isRecord(parsed) && Array.isArray(parsed.items)
      ? parsed.items
      : null;

  if (!sourceItems) {
    throw new Error('JSON 格式不正确，请导入资料数组或包含 items 数组的对象。');
  }

  const normalizedItems = sourceItems.map((item) => normalizeStudyItem(item));

  return {
    items: normalizedItems.filter((item): item is StudyItem => item !== null),
    skipped: normalizedItems.filter((item) => item === null).length,
  };
}

export async function importStudyItems(rawText: string): Promise<StudyImportResult> {
  const { items: importedItems, skipped } = validateImportedStudyItems(rawText);

  if (importedItems.length === 0) {
    throw new Error('没有找到可导入的资料。');
  }

  const currentItems = await getStudyItems();
  const usedIds = new Set(currentItems.map((item) => item.id));

  const nextImportedItems = importedItems.map((item) => {
    const id = usedIds.has(item.id) ? createStudyId() : item.id;
    usedIds.add(id);

    return {
      ...item,
      id,
    };
  });

  await saveStudyItems([...nextImportedItems, ...currentItems]);

  return {
    imported: nextImportedItems.length,
    skipped,
  };
}
