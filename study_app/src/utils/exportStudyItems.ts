import { Alert, Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { buildExportPayload } from '../database/studyStorage';
import type { StudyItem } from '../types/study';

function createExportFilename(prefix: string) {
  const dateText = new Date().toISOString().slice(0, 10);
  return `${prefix}-${dateText}.json`;
}

function downloadJsonOnWeb(json: string, filename: string) {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function exportStudyItems(items: StudyItem[], options?: { single?: boolean }) {
  const filename = createExportFilename(options?.single ? 'study-material' : 'study-materials');
  const payload = buildExportPayload(items);
  const json = JSON.stringify(payload, null, 2);

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    downloadJsonOnWeb(json, filename);
    return;
  }

  const file = new File(Paths.cache, filename);
  file.create({ overwrite: true });
  file.write(json);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: options?.single ? '导出当前资料' : '导出全部学习资料',
    });
    return;
  }

  Alert.alert('导出完成', `JSON 文件已保存到：${file.uri}`);
}
