export type ThemeMode = 'light' | 'dark';

export type StudyItem = {
  id: string;
  title: string;
  content: string;
  tags: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  category?: string;
};

export type StudyItemInput = {
  title: string;
  content: string;
  tags: string;
};

export type StudyImportResult = {
  imported: number;
  skipped: number;
};
