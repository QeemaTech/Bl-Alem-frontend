import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { BookOpen, Eye } from '@/icons';
import { useAdminCategoryLabels } from '../../../hooks/useAdminCategoryLabels';
import { useAdminCourseLabels } from '../../../hooks/useAdminCourseLabels';
import { formatNumber } from '../../../utils/localeFormat';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Table } from '../../ui/Table';
import { TableEntityLink } from '../../ui/TableEntityLink';

interface CategoryCoursesTableProps {
  courses: any[];
}

export function CategoryCoursesTable({ courses }: CategoryCoursesTableProps) {
  const { t, i18n } = useTranslation(['categories', 'courses']);
  const { fmtDate, empty } = useAdminCategoryLabels();
  const { statusLabels, statusVariant, fmtMoney } = useAdminCourseLabels();
  const cols = t('admin.categories.coursesTable.columns', { returnObjects: true }) as Record<string, string>;

  const rows = useMemo(() => courses.map((course) => ({
    id: course.id,
    title: course.titleAr,
    instructor: course.instructor?.fullName || empty,
    students: String(course._count?.enrollments ?? course.totalStudents ?? 0),
    lessons: String(course._count?.lessons ?? 0),
    price: fmtMoney(course),
    status: statusLabels[course.status] || course.status,
    updatedAt: fmtDate(course.updatedAt),
    _raw: course,
  })), [courses, empty, fmtDate, fmtMoney, statusLabels]);

  return (
    <Card className="reports-table-card admin-category-courses-card">
      <div className="section-heading reports-table-head">
        <h2>
          <span className="reports-table-title-icon" aria-hidden="true">
            <BookOpen size={20} />
          </span>
          {t('admin.categories.coursesTable.title')}
        </h2>
        <span className="muted-count">
          {t('admin.categories.coursesTable.count', {
            count: formatNumber(courses.length, undefined, i18n.language),
          })}
        </span>
      </div>
      <Table
        className="admin-users-table"
        fluid
        hideScrollNotice
        data={rows}
        emptyTitle={t('admin.categories.coursesTable.emptyTitle')}
        emptyDescription={t('admin.categories.coursesTable.emptyDescription')}
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
          { key: 'instructor', header: cols.instructor, width: '12rem', hideOnMobile: true },
          { key: 'students', header: cols.students, width: '6rem', align: 'center' },
          { key: 'lessons', header: cols.lessons, width: '6rem', align: 'center', hideOnMobile: true },
          { key: 'price', header: cols.price, width: '8rem', align: 'center', hideOnMobile: true },
          {
            key: 'status',
            header: cols.status,
            width: '10rem',
            align: 'center',
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
          { key: 'updatedAt', header: cols.updatedAt, width: '10rem', hideOnMobile: true },
          {
            key: 'actions',
            header: cols.actions,
            width: '8rem',
            render: (row) => (
              <Link to={`/admin/courses/${row._raw.id}`}>
                <Button variant="outline" size="sm" icon={<Eye size={16} />}>
                  {t('actions.review')}
                </Button>
              </Link>
            ),
          },
        ]}
      />
    </Card>
  );
}
