import { router } from 'expo-router';

import { StudyForm } from '../components/StudyForm';
import { createStudyItem } from '../database/studyStorage';
import type { StudyItemInput } from '../types/study';

export function AddStudyScreen() {
  const handleSubmit = async (input: StudyItemInput) => {
    const item = await createStudyItem(input);
    router.replace(`/study/${item.id}`);
  };

  return <StudyForm submitLabel="保存" onSubmit={handleSubmit} />;
}
