export type CurriculumItemType = 'lesson' | 'resources' | 'quiz';

export interface CurriculumItem {
  key: string;
  type: CurriculumItemType;
  sectionId: number;
  lessonId?: number;
  lesson?: any;
  resources?: any[];
  quiz?: any;
  title: string;
  meta?: string;
}

export interface SectionCurriculum {
  section: any;
  items: CurriculumItem[];
  progress: {
    completed: number;
    total: number;
    percent: number;
  };
}

const fmtDuration = (seconds?: number) => {
  const mins = Math.round((seconds || 0) / 60);
  if (mins < 60) return `${mins || 0} د`;
  return `${Math.floor(mins / 60)} س ${mins % 60} د`;
};

export function buildSectionCurriculum(
  section: any,
  quizzes: any[],
  options?: { includeCourseQuizzes?: boolean },
): CurriculumItem[] {
  const lessons = [...(section.lessons || [])].sort((a, b) => a.order - b.order);
  const lessonIds = new Set(lessons.map((lesson) => lesson.id));
  const items: CurriculumItem[] = [];

  lessons.forEach((lesson) => {
    items.push({
      key: `lesson-${lesson.id}`,
      type: 'lesson',
      sectionId: section.id,
      lessonId: lesson.id,
      lesson,
      title: lesson.titleAr,
      meta: fmtDuration(lesson.duration),
    });
  });

  const sectionResources = lessons.flatMap((lesson) =>
    (lesson.resources || []).map((resource: any) => ({
      ...resource,
      lessonId: lesson.id,
      lessonTitle: lesson.titleAr,
    })),
  );

  if (sectionResources.length) {
    items.push({
      key: `resources-${section.id}`,
      type: 'resources',
      sectionId: section.id,
      resources: sectionResources,
      title: 'موارد الجلسة',
      meta: `${sectionResources.length} ملف`,
    });
  }

  const sectionQuizzes = quizzes.filter((quiz) => quiz.lessonId && lessonIds.has(quiz.lessonId));
  if (options?.includeCourseQuizzes) {
    sectionQuizzes.push(...quizzes.filter((quiz) => !quiz.lessonId));
  }

  sectionQuizzes.forEach((quiz) => {
    items.push({
      key: `quiz-${quiz.id}`,
      type: 'quiz',
      sectionId: section.id,
      quiz,
      title: quiz.titleAr,
      meta: `${quiz.questionCount || 0} سؤال · ${quiz.durationMinutes || 10} د`,
    });
  });

  return items;
}

export function getItemCompletion(
  item: CurriculumItem,
  completedLessonIds: Set<number>,
): boolean {
  if (item.type === 'lesson') {
    return completedLessonIds.has(item.lessonId!);
  }
  if (item.type === 'resources') {
    const lessonIds = [...new Set((item.resources || []).map((resource) => resource.lessonId))];
    return lessonIds.length > 0 && lessonIds.every((id) => completedLessonIds.has(id));
  }
  if (item.type === 'quiz') {
    return Boolean(item.quiz?.isCompleted);
  }
  return false;
}

export function getSectionProgress(items: CurriculumItem[], completedLessonIds: Set<number>) {
  const total = items.length;
  const completed = items.filter((item) => getItemCompletion(item, completedLessonIds)).length;
  return {
    completed,
    total,
    percent: total ? Math.round((completed / total) * 100) : 0,
  };
}

export function buildCourseCurriculum(
  sections: any[],
  quizzes: any[],
): SectionCurriculum[] {
  const sortedSections = [...(sections || [])].sort((a, b) => a.order - b.order);
  const lastSectionId = sortedSections[sortedSections.length - 1]?.id;

  return sortedSections.map((section) => {
    const items = buildSectionCurriculum(section, quizzes, {
      includeCourseQuizzes: section.id === lastSectionId,
    });
    return {
      section,
      items,
      progress: getSectionProgress(items, new Set()),
    };
  });
}

export function getCourseProgress(
  curriculum: SectionCurriculum[],
  completedLessonIds: Set<number>,
) {
  const items = curriculum.flatMap((entry) => entry.items);
  return getSectionProgress(items, completedLessonIds);
}

export function findSectionIdForLesson(sections: any[], lessonId: number | null) {
  if (!lessonId) return null;
  for (const section of sections || []) {
    if (section.lessons?.some((lesson: any) => lesson.id === lessonId)) {
      return section.id;
    }
  }
  return null;
}

export function isQuizUnlocked(sectionItems: CurriculumItem[], completedLessonIds: Set<number>) {
  const lessons = sectionItems.filter((item) => item.type === 'lesson');
  return lessons.length === 0 || lessons.every((item) => completedLessonIds.has(item.lessonId!));
}

export function isLessonLocked(lesson: any, enrolled: boolean) {
  return Boolean(lesson?.isLocked && !enrolled);
}

export { fmtDuration };
