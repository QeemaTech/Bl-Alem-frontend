import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export function useStudentCourseLabels() {
  const { t, i18n } = useTranslation('courses');
  const lang = i18n.language;

  return useMemo(() => {
    const levelLabels: Record<string, string> = {
      BEGINNER: t('form.levels.BEGINNER'),
      INTERMEDIATE: t('form.levels.INTERMEDIATE'),
      ADVANCED: t('form.levels.ADVANCED'),
    };

    const typeLabels: Record<string, string> = {
      RECORDED: t('form.types.RECORDED'),
      LIVE: t('form.types.LIVE'),
      MIXED: t('form.types.MIXED'),
    };

    const enrollmentLabels = {
      enrolled: t('student.labels.enrollment.enrolled'),
      available: t('student.labels.enrollment.available'),
    };

    const badgeLabels = {
      enrolled: t('student.labels.badges.enrolled'),
      free: t('student.labels.badges.free'),
      discount: t('student.labels.badges.discount'),
    };

    const actionLabels = {
      continue: t('student.labels.actions.continue'),
      enroll: t('student.labels.actions.enroll'),
      viewCourse: t('student.labels.actions.viewCourse'),
      review: t('student.labels.actions.review'),
      details: t('student.labels.actions.details'),
    };

    const getLevelLabel = (level: string) => levelLabels[level] || level;
    const getTypeLabel = (type: string) => typeLabels[type] || type;
    const getEnrollmentLabel = (isEnrolled: boolean) => (
      isEnrolled ? enrollmentLabels.enrolled : enrollmentLabels.available
    );
    const fmtLessons = (count: number) => t('student.labels.lessons', { count });
    const getPrimaryActionLabel = (isEnrolled: boolean, isFree: boolean) => {
      if (isEnrolled) return actionLabels.continue;
      if (isFree) return actionLabels.enroll;
      return actionLabels.viewCourse;
    };

    return {
      lang,
      levelLabels,
      typeLabels,
      enrollmentLabels,
      badgeLabels,
      actionLabels,
      getLevelLabel,
      getTypeLabel,
      getEnrollmentLabel,
      fmtLessons,
      getPrimaryActionLabel,
      courseFallback: t('student.labels.courseFallback'),
      otherCategory: t('student.labels.otherCategory'),
      freePrice: t('student.labels.freePrice'),
      progress: t('student.labels.progress'),
    };
  }, [t, lang]);
}
