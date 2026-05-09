import type { ThemeMode } from '../types/study';

export const palettes = {
  light: {
    mode: 'light' as ThemeMode,
    background: '#F6F7FB',
    surface: '#FFFFFF',
    elevated: '#FFFFFF',
    text: '#111827',
    mutedText: '#6B7280',
    subtleText: '#9CA3AF',
    border: '#E5E7EB',
    input: '#FFFFFF',
    chip: '#EEF2FF',
    chipText: '#3730A3',
    primary: '#2563EB',
    primaryPressed: '#1D4ED8',
    danger: '#DC2626',
    dangerSurface: '#FEE2E2',
    success: '#059669',
    shadow: '#111827',
  },
  dark: {
    mode: 'dark' as ThemeMode,
    background: '#111827',
    surface: '#1F2937',
    elevated: '#253142',
    text: '#F9FAFB',
    mutedText: '#D1D5DB',
    subtleText: '#9CA3AF',
    border: '#374151',
    input: '#172033',
    chip: '#26334A',
    chipText: '#BFDBFE',
    primary: '#60A5FA',
    primaryPressed: '#3B82F6',
    danger: '#F87171',
    dangerSurface: '#3F1D25',
    success: '#34D399',
    shadow: '#000000',
  },
};

export type AppPalette = typeof palettes.light;
