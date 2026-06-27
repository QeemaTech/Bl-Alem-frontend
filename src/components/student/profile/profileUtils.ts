export const educationOptions = [
  { label: 'اختر المستوى', value: '' },
  { label: 'ثانوي', value: 'ثانوي' },
  { label: 'جامعي', value: 'جامعي' },
  { label: 'دراسات عليا', value: 'دراسات عليا' },
  { label: 'مهني / تقني', value: 'مهني' },
  { label: 'تعلم ذاتي', value: 'تعلم ذاتي' },
  { label: 'أخرى', value: 'أخرى' },
];

export const languageOptions = [
  { label: 'العربية', value: 'ar' },
  { label: 'English', value: 'en' },
];

export interface ProfileFormState {
  fullName?: string;
  email?: string;
  phone?: string;
  bio?: string;
  educationLevel?: string;
  preferredLanguage?: string;
  avatar?: string;
  interests: string[];
  createdAt?: string;
  wallet?: { balance?: number };
  studentProfile?: {
    bio?: string;
    educationLevel?: string;
    interests?: string[];
  };
}

export function calcProfileCompletion(profile: ProfileFormState): number {
  let filled = 0;
  if (profile.fullName?.trim()) filled += 1;
  if (profile.phone?.trim()) filled += 1;
  if (profile.bio?.trim()) filled += 1;
  if (profile.educationLevel?.trim()) filled += 1;
  if (profile.interests?.length) filled += 1;
  if (profile.avatar) filled += 1;
  return Math.round((filled / 6) * 100);
}

export type PasswordStrength = 'empty' | 'weak' | 'fair' | 'good' | 'strong';

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return 'empty';
  if (password.length < 8) return 'weak';

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const variety = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;

  if (password.length >= 12 && variety >= 3) return 'strong';
  if (variety >= 2) return 'good';
  return 'fair';
}

export const passwordStrengthLabels: Record<Exclude<PasswordStrength, 'empty'>, string> = {
  weak: 'ضعيفة — 8 أحرف على الأقل',
  fair: 'مقبولة — أضف أرقاماً أو رموزاً',
  good: 'جيدة',
  strong: 'قوية جداً',
};

export const fmtProfileDate = (value?: string) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
