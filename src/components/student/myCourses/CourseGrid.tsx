import type { CSSProperties, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen } from '@/icons';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { EmptyState } from '../../ui/EmptyState';
import { CourseCard } from './CourseCard';
import type { MyCourseEnrollment } from './types';

const PAGE_SIZE = 12;

interface CourseGridProps {
  items: MyCourseEnrollment[];
  page: number;
  onPageChange: (page: number) => void;
  emptyTitle: string;
  emptyDescription: string;
  showBrowseAction?: boolean;
  onBrowse?: () => void;
  tableView?: ReactNode;
  viewMode: string;
}

export function CourseGrid({
  items,
  page,
  onPageChange,
  emptyTitle,
  emptyDescription,
  showBrowseAction,
  onBrowse,
  tableView,
  viewMode,
}: CourseGridProps) {
  const { t } = useTranslation(['courses', 'common']);
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (viewMode === 'table') {
    return (
      <>
        {tableView}
        {items.length > PAGE_SIZE ? (
          <CoursePagination
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        ) : null}
      </>
    );
  }

  if (!items.length) {
    return (
      <Card className="student-my-courses-empty">
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          icon={BookOpen}
          actionLabel={showBrowseAction ? t('courses:student.myCourses.actions.browseCourses') : undefined}
          onAction={showBrowseAction ? onBrowse : undefined}
        />
      </Card>
    );
  }

  return (
    <>
      <div className="student-my-courses-grid">
        {pageItems.map((item, index) => {
          const style: CSSProperties = { animationDelay: `${Math.min(index, 8) * 45}ms` };
          return <CourseCard key={item.id} item={item} style={style} />;
        })}
      </div>
      {items.length > PAGE_SIZE ? (
        <CoursePagination
          currentPage={safePage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      ) : null}
    </>
  );
}

function CoursePagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const { t } = useTranslation('common');

  return (
    <div className="student-my-courses-pagination">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        {t('actions.previous')}
      </Button>
      <span>{currentPage} / {totalPages}</span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        {t('actions.next')}
      </Button>
    </div>
  );
}

export { PAGE_SIZE };
