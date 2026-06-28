import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import {
  applyDocumentDirection,
  defaultLanguage,
  readStoredLanguage,
  STORAGE_KEY,
  supportedLanguages,
} from './config';

import arCommon from './locales/ar/common.json';
import arNav from './locales/ar/nav.json';
import arAuth from './locales/ar/auth.json';
import arDashboard from './locales/ar/dashboard.json';
import arCourses from './locales/ar/courses.json';
import arCategories from './locales/ar/categories.json';
import arLearningPaths from './locales/ar/learningPaths.json';
import arUsers from './locales/ar/users.json';
import arSettings from './locales/ar/settings.json';
import arReports from './locales/ar/reports.json';
import arValidation from './locales/ar/validation.json';
import arNotifications from './locales/ar/notifications.json';
import arSupport from './locales/ar/support.json';
import arWithdrawals from './locales/ar/withdrawals.json';
import arErrors from './locales/ar/errors.json';
import arLiveSessions from './locales/ar/liveSessions.json';
import arPayments from './locales/ar/payments.json';
import arCoupons from './locales/ar/coupons.json';
import arRewards from './locales/ar/rewards.json';
import arCertificates from './locales/ar/certificates.json';
import arReviews from './locales/ar/reviews.json';
import arCommunity from './locales/ar/community.json';
import arProfile from './locales/ar/profile.json';

import enCommon from './locales/en/common.json';
import enNav from './locales/en/nav.json';
import enAuth from './locales/en/auth.json';
import enDashboard from './locales/en/dashboard.json';
import enCourses from './locales/en/courses.json';
import enCategories from './locales/en/categories.json';
import enLearningPaths from './locales/en/learningPaths.json';
import enUsers from './locales/en/users.json';
import enSettings from './locales/en/settings.json';
import enReports from './locales/en/reports.json';
import enValidation from './locales/en/validation.json';
import enNotifications from './locales/en/notifications.json';
import enSupport from './locales/en/support.json';
import enWithdrawals from './locales/en/withdrawals.json';
import enErrors from './locales/en/errors.json';
import enLiveSessions from './locales/en/liveSessions.json';
import enPayments from './locales/en/payments.json';
import enCoupons from './locales/en/coupons.json';
import enRewards from './locales/en/rewards.json';
import enCertificates from './locales/en/certificates.json';
import enReviews from './locales/en/reviews.json';
import enCommunity from './locales/en/community.json';
import enProfile from './locales/en/profile.json';

export { applyDocumentDirection, supportedLanguages, STORAGE_KEY } from './config';
export type { SupportedLanguage } from './config';

const initialLanguage = readStoredLanguage();

void i18n
  .use(initReactI18next)
  .init({
    resources: {
      ar: {
        common: arCommon,
        nav: arNav,
        auth: arAuth,
        dashboard: arDashboard,
        courses: arCourses,
        categories: arCategories,
        learningPaths: arLearningPaths,
        users: arUsers,
        settings: arSettings,
        reports: arReports,
        validation: arValidation,
        notifications: arNotifications,
        support: arSupport,
        withdrawals: arWithdrawals,
        errors: arErrors,
        liveSessions: arLiveSessions,
        payments: arPayments,
        coupons: arCoupons,
        rewards: arRewards,
        certificates: arCertificates,
        reviews: arReviews,
        community: arCommunity,
        profile: arProfile,
      },
      en: {
        common: enCommon,
        nav: enNav,
        auth: enAuth,
        dashboard: enDashboard,
        courses: enCourses,
        categories: enCategories,
        learningPaths: enLearningPaths,
        users: enUsers,
        settings: enSettings,
        reports: enReports,
        validation: enValidation,
        notifications: enNotifications,
        support: enSupport,
        withdrawals: enWithdrawals,
        errors: enErrors,
        liveSessions: enLiveSessions,
        payments: enPayments,
        coupons: enCoupons,
        rewards: enRewards,
        certificates: enCertificates,
        reviews: enReviews,
        community: enCommunity,
        profile: enProfile,
      },
    },
    lng: initialLanguage,
    fallbackLng: defaultLanguage,
    defaultNS: 'common',
    ns: [
      'common',
      'nav',
      'auth',
      'dashboard',
      'courses',
      'categories',
      'learningPaths',
      'users',
      'settings',
      'reports',
      'validation',
      'notifications',
      'support',
      'withdrawals',
      'errors',
      'liveSessions',
      'payments',
      'coupons',
      'rewards',
      'certificates',
      'reviews',
      'community',
      'profile',
    ],
    interpolation: { escapeValue: false },
    react: {
      useSuspense: false,
      bindI18n: 'languageChanged',
      bindI18nStore: 'added removed',
    },
  });

applyDocumentDirection(initialLanguage);

i18n.on('languageChanged', (lang) => {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
  applyDocumentDirection(lang);
});

export default i18n;
