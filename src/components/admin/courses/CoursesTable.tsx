import { useTranslation } from 'react-i18next';
import { Table2 } from '@/icons';
import { useAdminCourseLabels } from '../../../hooks/useAdminCourseLabels';
import { formatNumber } from '../../../utils/localeFormat';
import { Badge } from '../../ui/Badge';
import { Card } from '../../ui/Card';
import { Table } from '../../ui/Table';
import { TableEntityLink } from '../../ui/TableEntityLink';
import { CourseRowActions } from './CourseRowActions';

export interface CourseTableRow extends Record<string, unknown> {
  id: number | string;
  title: string;
  instructor: string;
  category: string;
  level: string;
  price: string;
  students: string;
  lessons: string;
  status: string;
  updatedAt: string;
  _raw: any;
}

interface CoursesTableProps {
  items: CourseTableRow[];
  loading?: boolean;
  onDetail: (course: any) => void;
  onApprove: (course: any) => void;
  onPublish: (course: any) => void;
  onReject: (course: any) => void;
  onSuspend: (course: any) => void;
  onDelete: (course: any) => void;
}

export function CoursesTable({
  items,
  loading,
  onDetail,
  onApprove,
  onPublish,
  onReject,
  onSuspend,
  onDelete,
}: CoursesTableProps) {
  const { t, i18n } = useTranslation(['courses', 'common']);
  const { statusLabels, statusVariant } = useAdminCourseLabels();
  const cols = t('admin.courses.table.columns', { returnObjects: true }) as Record<string, string>;

  return (
    <Card className="reports-table-card">
      <div className="section-heading reports-table-head">
        <h2>
          <span className="reports-table-title-icon" aria-hidden="true">
            <Table2 size={20} />
          </span>
          {t('admin.courses.table.title')}
        </h2>
        <span className="muted-count">
          {t('admin.courses.table.count', {
            count: formatNumber(items.length, undefined, i18n.language),
          })}
        </span>
      </div>
      <Table<CourseTableRow>
        className="admin-users-table admin-courses-table"
        loading={loading}
        stickyHeader
        compact
        fluid
        hideScrollNotice
        maxHeight="min(72vh, 760px)"
        emptyTitle={t('admin.courses.table.emptyTitle')}
        emptyDescription={t('admin.courses.table.emptyDescription')}
        data={items}
        onRowClick={(row) => onDetail(row._raw)}
        columns={[
          { key: 'id', header: cols.id, width: '6.5rem', align: 'center' },
          {
            key: 'title',
            header: cols.title,
            width: '16rem',
            className: 'col-primary admin-col-name',
            truncate: false,
            render: (row) => (
              <TableEntityLink to={`/admin/courses/${row._raw.id}`}>
                {row.title}
              </TableEntityLink>
            ),
          },
          {
            key: 'instructor',
            header: cols.instructor,
            width: '12rem',
            className: 'admin-col-name',
            truncate: false,
            hideOnMobile: true,
          },
          {
            key: 'category',
            header: cols.category,
            width: '10rem',
            hideOnMobile: true,
          },
          {
            key: 'level',
            header: cols.level,
            width: '7rem',
            align: 'center',
            hideOnMobile: true,
          },
          {
            key: 'price',
            header: cols.price,
            width: '8rem',
            align: 'center',
          },
          {
            key: 'students',
            header: cols.students,
            width: '6rem',
            align: 'center',
          },
          {
            key: 'lessons',
            header: cols.lessons,
            width: '6rem',
            align: 'center',
            hideOnMobile: true,
          },
          {
            key: 'status',
            header: cols.status,
            width: '10.5rem',
            minWidth: '10.5rem',
            align: 'center',
            truncate: false,
            className: 'wd-col-status',
            render: (row) => (
              <Badge
                variant={statusVariant(String(row._raw?.status))}
                dot
                className="status-badge"
              >
                {statusLabels[String(row._raw?.status)] || row.status}
              </Badge>
            ),
          },
          {
            key: 'updatedAt',
            header: cols.updatedAt,
            width: '10rem',
            className: 'admin-col-date',
            truncate: false,
            hideOnMobile: true,
          },
          {
            key: 'actions',
            header: cols.actions,
            width: '24rem',
            wrap: true,
            truncate: false,
            render: (row) => (
              <CourseRowActions
                course={row._raw}
                onDetail={() => onDetail(row._raw)}
                onApprove={() => onApprove(row._raw)}
                onPublish={() => onPublish(row._raw)}
                onReject={() => onReject(row._raw)}
                onSuspend={() => onSuspend(row._raw)}
                onDelete={() => onDelete(row._raw)}
              />
            ),
          },
        ]}
      />
    </Card>
  );
}
