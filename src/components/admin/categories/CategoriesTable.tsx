import { Table2 } from '@/icons';
import { Badge } from '../../ui/Badge';
import { Card } from '../../ui/Card';
import { Table } from '../../ui/Table';
import { TableEntityLink } from '../../ui/TableEntityLink';
import { UserRowActions } from '../users/UserRowActions';
import { CategoryIcon } from './CategoryIcon';
import { fmtCategoryDate, statusLabels, statusVariant } from './categoryShared';

export interface CategoryTableRow extends Record<string, unknown> {
  id: number | string;
  nameAr: string;
  nameEn: string;
  slug: string;
  icon: string;
  courses: string;
  status: string;
  createdAt: string;
  _raw: any;
}

interface CategoriesTableProps {
  items: CategoryTableRow[];
  loading?: boolean;
  onDetail: (category: any) => void;
  onEdit: (category: any) => void;
  onToggleStatus: (category: any) => void;
  onDelete: (category: any) => void;
}

export function CategoriesTable({
  items,
  loading,
  onDetail,
  onEdit,
  onToggleStatus,
  onDelete,
}: CategoriesTableProps) {
  return (
    <Card className="reports-table-card">
      <div className="section-heading reports-table-head">
        <h2>
          <span className="reports-table-title-icon" aria-hidden="true">
            <Table2 size={20} />
          </span>
          قائمة التصنيفات
        </h2>
        <span className="muted-count">{items.length.toLocaleString('ar-EG')} تصنيف</span>
      </div>
      <Table<CategoryTableRow>
        className="admin-users-table admin-categories-table"
        loading={loading}
        stickyHeader
        compact
        fluid
        hideScrollNotice
        maxHeight="min(72vh, 760px)"
        emptyTitle="لا توجد تصنيفات"
        emptyDescription="أضف تصنيفاً جديداً لتنظيم الدورات."
        data={items}
        onRowClick={(row) => onDetail(row._raw)}
        columns={[
          { key: 'id', header: 'رقم التصنيف', width: '6.5rem', align: 'center' },
          {
            key: 'icon',
            header: 'الأيقونة',
            width: '5rem',
            align: 'center',
            render: (row) => (
              <CategoryIcon icon={row._raw?.icon} size={22} className="category-table-icon" />
            ),
          },
          {
            key: 'nameAr',
            header: 'الاسم العربي',
            width: '14rem',
            className: 'col-primary admin-col-name',
            truncate: false,
            render: (row) => (
              <TableEntityLink to={`/admin/categories/${row._raw.id}`}>
                {row.nameAr}
              </TableEntityLink>
            ),
          },
          {
            key: 'nameEn',
            header: 'الاسم الإنجليزي',
            width: '14rem',
            hideOnMobile: true,
            truncate: false,
          },
          {
            key: 'slug',
            header: 'الرابط',
            width: '11rem',
            hideOnMobile: true,
            render: (row) => <span dir="ltr">{row.slug}</span>,
          },
          {
            key: 'courses',
            header: 'الكورسات',
            width: '6.5rem',
            align: 'center',
          },
          {
            key: 'status',
            header: 'الحالة',
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
            key: 'createdAt',
            header: 'تاريخ الإنشاء',
            width: '10rem',
            className: 'admin-col-date',
            hideOnMobile: true,
            truncate: false,
          },
          {
            key: 'actions',
            header: 'الإجراءات',
            width: '22rem',
            wrap: true,
            truncate: false,
            render: (row) => (
              <UserRowActions
                onDetail={() => onDetail(row._raw)}
                onEdit={() => onEdit(row._raw)}
                onToggleStatus={() => onToggleStatus(row._raw)}
                isActive={row._raw?.status === 'ACTIVE'}
                onDelete={() => onDelete(row._raw)}
                deleteDisabled={Number(row._raw?._count?.courses || 0) > 0}
              />
            ),
          },
        ]}
      />
    </Card>
  );
}

export function buildCategoryTableRows(categories: any[]): CategoryTableRow[] {
  return categories.map((row) => ({
    id: row.id,
    nameAr: row.nameAr,
    nameEn: row.nameEn || '—',
    slug: row.slug,
    icon: row.icon || '—',
    courses: String(row._count?.courses ?? 0),
    status: statusLabels[row.status] || row.status,
    createdAt: fmtCategoryDate(row.createdAt),
    _raw: row,
  }));
}
