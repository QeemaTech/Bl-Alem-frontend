import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCcw, Search } from '@/icons';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Tabs } from '../../ui/Tabs';

interface CourseFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  sort: string;
  onSortChange: (value: string) => void;
  tab: string;
  onTabChange: (value: string) => void;
  viewMode: string;
  onViewModeChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  categories: { label: string; value: string }[];
  stats: { total: number; active: number; completed: number; notStarted: number };
  resultCount: number;
  onReset: () => void;
  resetDisabled: boolean;
}

export function CourseFilters({
  search,
  onSearchChange,
  sort,
  onSortChange,
  tab,
  onTabChange,
  viewMode,
  onViewModeChange,
  category,
  onCategoryChange,
  categories,
  stats,
  resultCount,
  onReset,
  resetDisabled,
}: CourseFiltersProps) {
  const { t, i18n } = useTranslation('courses');
  const lang = i18n.language;

  const sortOptions = useMemo(() => [
    { label: t('student.myCourses.filters.sortRecent'), value: 'recent' },
    { label: t('student.myCourses.filters.sortProgress'), value: 'progress' },
    { label: t('student.myCourses.filters.sortName'), value: 'name' },
  ], [t, lang]);

  const statusTabs = useMemo(() => [
    { id: 'all', label: t('student.myCourses.filters.tabs.all', { count: stats.total }) },
    { id: 'active', label: t('student.myCourses.filters.tabs.active', { count: stats.active }) },
    { id: 'completed', label: t('student.myCourses.filters.tabs.completed', { count: stats.completed }) },
    { id: 'not_started', label: t('student.myCourses.filters.tabs.notStarted', { count: stats.notStarted }) },
  ], [t, lang, stats]);

  const viewTabs = useMemo(() => [
    { id: 'cards', label: t('student.myCourses.filters.view.cards', { count: resultCount }) },
    { id: 'table', label: t('student.myCourses.filters.view.table', { count: resultCount }) },
  ], [t, lang, resultCount]);

  return (
    <section
      className={`student-my-courses-toolbar${categories.length <= 1 ? ' student-my-courses-toolbar--no-category' : ''}`}
      aria-label={t('student.myCourses.filters.ariaLabel')}
    >
      <div className="student-my-courses-toolbar-search">
        <Input
          label={t('student.myCourses.filters.search')}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('student.myCourses.filters.searchPlaceholder')}
          icon={<Search size={18} aria-hidden />}
        />
      </div>

      <div className="student-my-courses-toolbar-sort">
        <Select
          label={t('student.myCourses.filters.sort')}
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          options={sortOptions}
        />
      </div>

      {categories.length > 1 ? (
        <div className="student-my-courses-toolbar-category">
          <Select
            label={t('student.myCourses.filters.category')}
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            options={categories}
          />
        </div>
      ) : null}

      <button
        type="button"
        className="student-my-courses-toolbar-reset"
        onClick={onReset}
        disabled={resetDisabled}
      >
        <RotateCcw size={16} aria-hidden />
        {t('student.myCourses.filters.reset')}
      </button>

      <div className="student-my-courses-toolbar-tabs">
        <Tabs
          variant="pills"
          activeTab={tab}
          onChange={onTabChange}
          tabs={statusTabs}
        />
      </div>

      <div className="student-my-courses-toolbar-view">
        <Tabs
          variant="pills"
          activeTab={viewMode}
          onChange={onViewModeChange}
          tabs={viewTabs}
        />
      </div>
    </section>
  );
}
