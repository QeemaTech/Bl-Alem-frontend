import { Eye, Table2, Trash2 } from '@/icons';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Table } from '../../ui/Table';
import { fmtReviewDate, type ReviewItem } from './reviewShared';
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
  const rows = items.map((item) => ({
    id: item.id,
    student: item.user?.fullName || '—',
    course: item.course?.titleAr || '—',
    instructor: item.course?.instructor?.fullName || '—',
    ratingLabel: `${item.rating}/5`,
    commentPreview: item.comment?.trim()
      ? (item.comment.length > 48 ? `${item.comment.slice(0, 48)}...` : item.comment)
      : '—',
    dateLabel: fmtReviewDate(item.createdAt),
    _raw: item,
  }));

  return (
    <Card className="reports-table-card">
      <div className="section-heading reports-table-head">
        <h2>
          <span className="reports-table-title-icon" aria-hidden="true">
            <Table2 size={20} />
          </span>
          تقييمات الطلاب
        </h2>
        <span className="muted-count">{items.length.toLocaleString('ar-EG')} سجل</span>
      </div>
      <Table
        loading={loading}
        stickyHeader
        compact
        fluid
        hideScrollNotice
        maxHeight="min(72vh, 760px)"
        emptyTitle="لا توجد تقييمات"
        emptyDescription="لم يتم إضافة أي تقييمات بعد، أو لا توجد نتائج مطابقة للفلاتر."
        data={rows}
        onRowClick={(row) => onDetail(row._raw)}
        columns={[
          { key: 'id', header: 'رقم التقييم', width: '6.5rem', align: 'center' },
          { key: 'student', header: 'الطالب', width: '14%' },
          { key: 'course', header: 'الكورس', width: '18%', className: 'col-primary' },
          {
            key: 'instructor',
            header: 'المحاضر',
            width: '14%',
            hideOnMobile: true,
          },
          {
            key: 'ratingLabel',
            header: 'التقييم',
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
            header: 'التعليق',
            width: '22%',
            truncate: true,
            hideOnMobile: true,
          },
          { key: 'dateLabel', header: 'التاريخ', width: '14%', hideOnMobile: true },
          {
            key: 'actions',
            header: 'الإجراءات',
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
                  التفاصيل
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  icon={<Trash2 size={16} />}
                  onClick={() => onDelete(row._raw)}
                >
                  حذف
                </Button>
              </div>
            ),
          },
        ]}
      />
    </Card>
  );
}
