import { Link } from 'react-router-dom';
import { BookOpen, Eye } from '@/icons';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Table } from '../../ui/Table';
import { TableEntityLink } from '../../ui/TableEntityLink';
import {
  courseStatusLabels,
  courseStatusVariant,
  fmtCategoryDate,
} from './categoryShared';

interface CategoryCoursesTableProps {
  courses: any[];
}

const fmtMoney = (course: any) => {
  const price = Number(course.discountPrice ?? course.price ?? 0);
  if (!price) return 'مجاني';
  return `${price.toLocaleString('ar-SA')} ج.م`;
};

export function CategoryCoursesTable({ courses }: CategoryCoursesTableProps) {
  const rows = courses.map((course) => ({
    id: course.id,
    title: course.titleAr,
    instructor: course.instructor?.fullName || '—',
    students: String(course._count?.enrollments ?? course.totalStudents ?? 0),
    lessons: String(course._count?.lessons ?? 0),
    price: fmtMoney(course),
    status: courseStatusLabels[course.status] || course.status,
    updatedAt: fmtCategoryDate(course.updatedAt),
    _raw: course,
  }));

  return (
    <Card className="reports-table-card admin-category-courses-card">
      <div className="section-heading reports-table-head">
        <h2>
          <span className="reports-table-title-icon" aria-hidden="true">
            <BookOpen size={20} />
          </span>
          الكورسات في هذا التصنيف
        </h2>
        <span className="muted-count">{courses.length.toLocaleString('ar-EG')} كورس</span>
      </div>
      <Table
        className="admin-users-table"
        fluid
        hideScrollNotice
        data={rows}
        emptyTitle="لا توجد كورسات"
        emptyDescription="لم يتم ربط أي دورة بهذا التصنيف بعد."
        columns={[
          { key: 'id', header: 'رقم الكورس', width: '6.5rem', align: 'center' },
          {
            key: 'title',
            header: 'العنوان',
            width: '16rem',
            className: 'col-primary admin-col-name',
            truncate: false,
            render: (row) => (
              <TableEntityLink to={`/admin/courses/${row._raw.id}`}>
                {row.title}
              </TableEntityLink>
            ),
          },
          { key: 'instructor', header: 'المحاضر', width: '12rem', hideOnMobile: true },
          { key: 'students', header: 'الطلاب', width: '6rem', align: 'center' },
          { key: 'lessons', header: 'الدروس', width: '6rem', align: 'center', hideOnMobile: true },
          { key: 'price', header: 'السعر', width: '8rem', align: 'center', hideOnMobile: true },
          {
            key: 'status',
            header: 'الحالة',
            width: '10rem',
            align: 'center',
            render: (row) => (
              <Badge
                variant={courseStatusVariant(String(row._raw?.status))}
                dot
                className="status-badge"
              >
                {courseStatusLabels[String(row._raw?.status)] || row.status}
              </Badge>
            ),
          },
          { key: 'updatedAt', header: 'آخر تحديث', width: '10rem', hideOnMobile: true },
          {
            key: 'actions',
            header: 'الإجراءات',
            width: '8rem',
            render: (row) => (
              <Link to={`/admin/courses/${row._raw.id}`}>
                <Button variant="outline" size="sm" icon={<Eye size={16} />}>
                  مراجعة
                </Button>
              </Link>
            ),
          },
        ]}
      />
    </Card>
  );
}
