import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, Table2, Trash2 } from '@/icons';
import { useAdminReviewLabels } from '../../../hooks/useAdminReviewLabels';
import { formatNumber } from '../../../utils/localeFormat';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Table } from '../../ui/Table';
import type { ReviewItem } from './reviewShared';
import { ReviewStars } from './ReviewStars';

interface ReviewsTableProps {
  items: ReviewItem[];
  loading?: boolean;
  onDetail: (item: ReviewItem) => void;
  onDelete: (item: ReviewItem) => void;
}

export function ReviewsTable({
  items,
  loading,
  onDetail,
  onDelete,
}: ReviewsTableProps) {
  const { t, i18n } = useTranslation(['reviews', 'common']);
  const { fmtReviewDate, ratingOf, empty } = useAdminReviewLabels();
  const cols = t('table.columns', { returnObjects: true, ns: 'reviews' }) as Record<string, string>;

  const rows = useMemo(() => items.map((item) => ({
    id: item.id,
    student: item.user?.fullName || empty,
    course: item.course?.titleAr || empty,
    instructor: item.course?.instructor?.fullName || empty,
    ratingLabel: ratingOf(item.rating),
    commentPreview: item.comment?.trim()
      ? (item.comment.length > 48 ? `${item.comment.slice(0, 48)}...` : item.comment)
      : empty,
    dateLabel: fmtReviewDate(item.createdAt),
    _raw: item,
  })), [items, fmtReviewDate, ratingOf, empty]);

  return (
    <Card className="reports-table-card">
      <div className="section-heading reports-table-head">
        <h2>
          <span className="reports-table-title-icon" aria-hidden="true">
            <Table2 size={20} />
          </span>
          {t('table.title', { ns: 'reviews' })}
        </h2>
        <span className="muted-count">
          {t('common:table.recordCount', {
            count: formatNumber(items.length, undefined, i18n.language),
          })}
        </span>
      </div>
      <Table
        loading={loading}
        stickyHeader
        compact
        fluid
        hideScrollNotice
        maxHeight="min(72vh, 760px)"
        emptyTitle={t('table.emptyTitle', { ns: 'reviews' })}
        emptyDescription={t('table.emptyDescription', { ns: 'reviews' })}
        data={rows}
        onRowClick={(row) => onDetail(row._raw)}
        columns={[
          { key: 'id', header: cols.id, width: '6.5rem', align: 'center' },
          { key: 'student', header: cols.student, width: '14%' },
          { key: 'course', header: cols.course, width: '18%', className: 'col-primary' },
          {
            key: 'instructor',
            header: cols.instructor,
            width: '14%',
            hideOnMobile: true,
          },
          {
            key: 'ratingLabel',
            header: cols.rating,
            width: '8.75rem',
            minWidth: '8.75rem',
            align: 'center',
            truncate: false,
            className: 'review-col-rating',
            render: (row) => (
              <ReviewStars rating={Number(row._raw.rating)} size={16} />
            ),
          },
          {
            key: 'commentPreview',
            header: cols.comment,
            width: '22%',
            truncate: true,
            hideOnMobile: true,
          },
          { key: 'dateLabel', header: cols.date, width: '14%', hideOnMobile: true },
          {
            key: 'actions',
            header: cols.actions,
            width: '13rem',
            wrap: true,
            truncate: false,
            render: (row) => (
              <div className="table-actions review-row-actions">
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Eye size={16} />}
                  onClick={() => onDetail(row._raw)}
                >
                  {t('actions.details', { ns: 'reviews' })}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  icon={<Trash2 size={16} />}
                  onClick={() => onDelete(row._raw)}
                >
                  {t('actions.delete', { ns: 'reviews' })}
                </Button>
              </div>
            ),
          },
        ]}
      />
    </Card>
  );
}
