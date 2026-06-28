import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { DisplayStatus, MyCoursesStats } from '../components/student/myCourses/types';
import { formatDate } from '../utils/localeFormat';

export function useStudentMyCourseLabels() {
  const { t, i18n } = useTranslation('courses');
  const lang = i18n.language;

  return useMemo(() => {
    const getStatusLabel = (status: DisplayStatus) => t(`student.myCourses.status.${status}`);

    const fmtDate = (value?: string | null) => (value
      ? formatDate(value, { year: 'numeric', month: 'short', day: 'numeric' }, lang)
      : '—');

    const formatDuration = (minutes?: number) => {
      const total = Number(minutes || 0);
      if (!total) return null;
      const hours = Math.floor(total / 60);
      const mins = total % 60;
      if (hours && mins) {
        return t('student.myCourses.duration.hoursMinutes', { hours, minutes: mins });
      }
      if (hours) return t('student.myCourses.duration.hours', { count: hours });
      return t('student.myCourses.duration.minutes', { count: mins });
    };

    const getJourneyMessage = (stats: MyCoursesStats) => {
      if (!stats.total) return t('student.myCourses.learningProgress.journey.empty');
      if (stats.avgProgress >= 100) return t('student.myCourses.learningProgress.journey.allDone');
      if (stats.avgProgress >= 50) return t('student.myCourses.learningProgress.journey.halfway');
      return t('student.myCourses.learningProgress.journey.starting');
    };

    return {
      lang,
      getStatusLabel,
      fmtDate,
      formatDuration,
      getJourneyMessage,
    };
  }, [t, lang]);
}
