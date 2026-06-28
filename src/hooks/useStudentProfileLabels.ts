import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../utils/localeFormat';
import {
  EDUCATION_LEVEL_VALUES,
  getPasswordStrength,
  type PasswordStrength,
  type ProfileFormState,
} from '../components/student/profile/profileUtils';

export function useStudentProfileLabels() {
  const { t, i18n } = useTranslation('profile');
  const lang = i18n.language;

  const educationOptions = useMemo(
    () => EDUCATION_LEVEL_VALUES.map((value) => ({
      label: value
        ? t(`student.educationLevels.${value}`, { defaultValue: value })
        : t('student.educationLevels._empty'),
      value,
    })),
    [t, lang],
  );

  const languageOptions = useMemo(
    () => [
      { label: t('student.languages.ar'), value: 'ar' },
      { label: t('student.languages.en'), value: 'en' },
    ],
    [t, lang],
  );

  const suggestedInterestKeys = useMemo(
    () => ['programming', 'design', 'business', 'marketing', 'ai', 'languages'] as const,
    [],
  );

  const suggestedInterests = useMemo(
    () => suggestedInterestKeys.map((key) => t(`student.interests.suggested.${key}`)),
    [t, lang, suggestedInterestKeys],
  );

  const educationLabel = useCallback(
    (value?: string) => {
      if (!value?.trim()) return '—';
      return t(`student.educationLevels.${value}`, { defaultValue: value });
    },
    [t, lang],
  );

  const passwordStrengthLabel = useCallback(
    (strength: Exclude<PasswordStrength, 'empty'>) => t(`student.password.strength.${strength}`),
    [t, lang],
  );

  const fmtProfileDate = useCallback(
    (value?: string) => {
      if (!value) return '—';
      return formatDate(value, { year: 'numeric', month: 'long', day: 'numeric' }, lang);
    },
    [lang],
  );

  const completionHint = useCallback(
    (value: number) => {
      if (value >= 100) return t('student.completion.done');
      if (value >= 60) return t('student.completion.almost');
      return t('student.completion.start');
    },
    [t, lang],
  );

  const statsCompletionHint = useCallback(
    (completion: number) => (
      completion >= 100 ? t('student.stats.completionDone') : t('student.stats.completionPending')
    ),
    [t, lang],
  );

  return {
    t,
    lang,
    educationOptions,
    languageOptions,
    suggestedInterests,
    educationLabel,
    passwordStrengthLabel,
    fmtProfileDate,
    completionHint,
    statsCompletionHint,
    getPasswordStrength,
  };
}

export type { ProfileFormState };
