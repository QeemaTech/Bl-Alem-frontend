# BI-ALEM Frontend i18n Audit Report

**Date:** 2026-06-27  
**Scope:** Initial i18n infrastructure + priority migrations

## Summary

Full i18n foundation is in place with `i18next` + `react-i18next`. Arabic remains the default language; English is available via the header language switcher. Language and text direction persist in `localStorage` (`bi-alem-language`) and are restored before first paint in `index.html`.

**Build status:** `npm run build` passes (TypeScript + Vite).

---

## Infrastructure Created

| Path | Purpose |
|------|---------|
| `src/i18n/config.ts` | `STORAGE_KEY`, supported langs, `applyDocumentDirection()` |
| `src/i18n/index.ts` | i18next init, namespace registration, language change handler |
| `src/i18n/locales/{ar,en}/*.json` | 11 namespaces per language |
| `src/utils/localeFormat.ts` | `formatDate`, `formatDateTime`, `formatTime`, `formatNumber` |
| `src/components/ui/LanguageSwitcher.tsx` | AR/EN toggle in dashboard header |
| `src/styles/rtl-ltr.css` | LTR layout/typography overrides |
| `src/components/dashboard/sidebar/adminNavConfig.ts` | Admin nav with `labelKey` pattern |

### Namespaces

`common`, `nav`, `auth`, `dashboard`, `courses`, `users`, `settings`, `validation`, `notifications`, `support`, `errors`

---

## Files Modified (Migration Wave 1)

### Core wiring
- `index.html` — FOUC script restores lang/dir; removed hardcoded `dir=rtl`
- `src/main.tsx` — imports `./i18n` before App
- `package.json` — added `i18next`, `react-i18next`
- `src/styles/index.css` — direction via `html[dir=rtl|ltr]`
- `src/icons/index.tsx` — `Languages` icon

### Navigation & layout
- `src/components/dashboard/sidebar/types.ts`
- `src/components/dashboard/sidebar/studentNavConfig.ts`
- `src/components/dashboard/sidebar/instructorNavConfig.ts`
- `src/components/dashboard/sidebar/adminNavConfig.ts` *(new)*
- `src/components/dashboard/sidebar/SidebarSection.tsx`
- `src/components/dashboard/sidebar/SidebarItem.tsx`
- `src/components/dashboard/sidebar/SimpleSidebar.tsx`
- `src/components/dashboard/sidebar/StudentSidebar.tsx`
- `src/components/dashboard/sidebar/InstructorSidebar.tsx`
- `src/components/dashboard/sidebar/SidebarFooter.tsx`
- `src/components/dashboard/sidebar/SidebarProfile.tsx`
- `src/components/dashboard/sidebar/SidebarHeader.tsx`
- `src/components/dashboard/Header.tsx`
- `src/layouts/DashboardLayout.tsx`
- `src/layouts/StudentLayout.tsx`
- `src/layouts/InstructorLayout.tsx`
- `src/layouts/AdminLayout.tsx`
- `src/layouts/AuthLayout.tsx`

### Shared UI
- `src/components/ui/FilterBar.tsx`
- `src/components/ui/ConfirmDialog.tsx`
- `src/components/ui/PageHeader.tsx`
- `src/components/ui/LanguageSwitcher.tsx` *(new)*

### Auth (fully migrated)
- `src/pages/auth/LoginPage.tsx`
- `src/pages/auth/RegisterPage.tsx`

### Priority feature pages (partial or full)
- `src/pages/instructor/InstructorDashboardPage.tsx` *(full)*
- `src/pages/instructor/InstructorCoursesPage.tsx` *(full)*
- `src/pages/instructor/InstructorCourseFormPage.tsx` *(partial — steps, cover, header)*
- `src/pages/student/StudentDashboardPage.tsx` *(partial — header, stats, search, continue, rewards, sessions)*
- `src/pages/admin/AdminDashboardPage.tsx` *(error state)*

---

## Remaining Hardcoded Arabic

Grep pattern `[\u0600-\u06FF]` on `src/` (excluding locale JSON):

| Category | Approx. files | Notes |
|----------|---------------|-------|
| **Locale JSON (`src/i18n/locales/ar/`)** | 11 | Expected — source of truth for Arabic |
| **Student pages** | ~25 | courses, live, profile, player, quiz, etc. |
| **Instructor pages** | ~15 | builder, earnings, students, live, profile, forms |
| **Admin pages & components** | ~60 | dashboards analytics, tables, settings, withdrawals |
| **Shared components** | ~20 | `PlatformStatusBanner`, `Table`, `Modal`, course cards |
| **Utils/formatters** | ~5 | `adminFormatters.ts`, `currency.ts`, `localeFormat.ts` (relative time AR strings) |
| **Partially migrated** | 2 | `InstructorCourseFormPage.tsx` (~71 strings), `StudentDashboardPage.tsx` (~21 strings) |

**Total non-locale TS/TSX files with Arabic:** ~150 (down from ~235; ~40 files fully/partially migrated)

### High-priority next files
1. `src/components/platform/PlatformStatusBanner.tsx`
2. `src/pages/auth/OtpPlaceholderPage.tsx`
3. `src/pages/shared/NotFoundPage.tsx`, `UnauthorizedPage.tsx`
4. `src/components/admin/dashboard/*` (hero, KPIs, analytics labels)
5. `src/pages/student/StudentCoursesPage.tsx`, `StudentMyCoursesPage.tsx`
6. Remainder of `InstructorCourseFormPage.tsx`

---

## Backend API Error Messages

**Policy:** API error `message` fields from the server are displayed as-is in toasts/forms. The backend currently returns Arabic messages.

**Client-side fallbacks** use `errors.json`:
- `errors.generic` when no API message is present (login, register, etc.)

**Optional future work:** Map known error codes in an `errors.api.*` namespace, e.g.:

```typescript
const code = error.response?.data?.code;
const message = code ? t(`errors.api.${code}`, { defaultValue: apiMessage }) : apiMessage;
```

Do not replace API messages blindly — users may depend on exact server wording during the Arabic-only period.

---

## Date & Number Formatting

Use `src/utils/localeFormat.ts`:

```typescript
import { formatDate, formatNumber } from '@/utils/localeFormat';

formatDate(isoString, { year: 'numeric', month: 'short', day: 'numeric' });
formatNumber(1234.56, { maximumFractionDigits: 2 });
```

Locale tag: `ar-SA` for Arabic, `en-US` for English (derived from `i18n.language`).

Replace remaining `toLocaleString('ar-EG')` / `toLocaleDateString('ar-SA')` calls incrementally.

---

## How to Add New Translation Keys

1. **Choose a namespace** (e.g. `courses` for course-specific UI, `common` for reusable buttons).

2. **Add keys to both locales:**
   - `src/i18n/locales/ar/<namespace>.json`
   - `src/i18n/locales/en/<namespace>.json`

   Use nested objects for grouping:
   ```json
   {
     "form": {
       "title": "عنوان"
     }
   }
   ```

3. **Use in components:**
   ```tsx
   import { useTranslation } from 'react-i18next';

   const { t } = useTranslation('courses');
   return <h1>{t('form.title')}</h1>;
   ```

4. **Navigation items:** use `labelKey` in nav config, not raw strings:
   ```typescript
   { labelKey: 'student.dashboard', path: '/student/dashboard', icon: LayoutDashboard }
   ```

5. **No hardcoded user-visible strings** in migrated files — including aria-labels and placeholders.

6. **Register new namespaces** in `src/i18n/index.ts` if you add a new JSON file.

---

## LTR / RTL Notes

- Document direction is set by `applyDocumentDirection()` on init and language change.
- `html[dir=ltr]` rules live in `src/styles/rtl-ltr.css`.
- Many legacy CSS rules in `pages.css` still use physical `text-align: right`; LTR overrides cover common dashboard patterns. A broader pass to replace with logical properties (`text-align: start`) is recommended.

---

## Recommendations

1. **Migrate by domain:** student → instructor → admin, one namespace extension at a time.
2. **Extract shared status enums** (course status, payment status) into `common.status` or domain namespaces — avoid duplicating in each page.
3. **Admin analytics:** migrate `buildDashboardAnalytics.ts` labels in one pass — high string density.
4. **Keep API content in Arabic fields** (`titleAr`, `nameAr`) as data, not UI chrome.
5. **Add ESLint rule** (optional): flag Arabic Unicode in `.tsx` files outside `locales/ar/`.
6. **Complete `InstructorCourseFormPage`** — largest remaining instructor surface (~71 strings).

---

## Verification Checklist

- [x] `npm install i18next react-i18next`
- [x] Language switcher in dashboard header
- [x] localStorage persistence + FOUC prevention
- [x] Nav `labelKey` pattern (student, instructor, admin)
- [x] Auth pages fully translated
- [x] Priority dashboards migrated (instructor full, student partial)
- [x] `npm run build` green
- [ ] Full codebase migration (~150 files remaining)
