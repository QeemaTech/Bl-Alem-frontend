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
  return (
    <section
      className={`student-my-courses-toolbar${categories.length <= 1 ? ' student-my-courses-toolbar--no-category' : ''}`}
      aria-label="فلاتر الدورات"
    >
      <div className="student-my-courses-toolbar-search">
        <Input
          label="بحث"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="بحث باسم الدورة أو المحاضر..."
          icon={<Search size={18} aria-hidden />}
        />
      </div>

      <div className="student-my-courses-toolbar-sort">
        <Select
          label="الترتيب"
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          options={[
            { label: 'الأحدث اشتراكاً', value: 'recent' },
            { label: 'الأعلى تقدماً', value: 'progress' },
            { label: 'الاسم', value: 'name' },
          ]}
        />
      </div>

      {categories.length > 1 ? (
        <div className="student-my-courses-toolbar-category">
          <Select
            label="التصنيف"
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
        إعادة تعيين
      </button>

      <div className="student-my-courses-toolbar-tabs">
        <Tabs
          variant="pills"
          activeTab={tab}
          onChange={onTabChange}
          tabs={[
            { id: 'all', label: `الكل (${stats.total})` },
            { id: 'active', label: `قيد التعلم (${stats.active})` },
            { id: 'completed', label: `مكتمل (${stats.completed})` },
            { id: 'not_started', label: `لم يبدأ (${stats.notStarted})` },
          ]}
        />
      </div>

      <div className="student-my-courses-toolbar-view">
        <Tabs
          variant="pills"
          activeTab={viewMode}
          onChange={onViewModeChange}
          tabs={[
            { id: 'cards', label: `البطاقات (${resultCount})` },
            { id: 'table', label: `الجدول (${resultCount})` },
          ]}
        />
      </div>
    </section>
  );
}
