import { useTranslation } from 'react-i18next';
import { Table2 } from '@/icons';
import { useAdminCategoryLabels } from '../../../hooks/useAdminCategoryLabels';
import { formatNumber } from '../../../utils/localeFormat';
import { Badge } from '../../ui/Badge';
import { Card } from '../../ui/Card';
import { Table } from '../../ui/Table';
import { TableEntityLink } from '../../ui/TableEntityLink';
import { UserRowActions } from '../users/UserRowActions';
import { CategoryIcon } from './CategoryIcon';

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
  const { t, i18n } = useTranslation(['categories', 'common']);
  const { statusLabels, statusVariant } = useAdminCategoryLabels();
  const cols = t('admin.categories.table.columns', { returnObjects: true }) as Record<string, string>;

  return (
    <Card className="reports-table-card">
      <div className="section-heading reports-table-head">
        <h2>
          <span className="reports-table-title-icon" aria-hidden="true">
            <Table2 size={20} />
          </span>
          {t('admin.categories.table.title')}
        </h2>
        <span className="muted-count">
          {t('admin.categories.table.count', {
            count: formatNumber(items.length, undefined, i18n.language),
          })}
        </span>
      </div>
      <Table<CategoryTableRow>
        className="admin-users-table admin-categories-table"
        loading={loading}
        stickyHeader
        compact
        fluid
        hideScrollNotice
        maxHeight="min(72vh, 760px)"
        emptyTitle={t('admin.categories.table.emptyTitle')}
        emptyDescription={t('admin.categories.table.emptyDescription')}
        data={items}
        onRowClick={(row) => onDetail(row._raw)}
        columns={[
          { key: 'id', header: cols.id, width: '6.5rem', align: 'center' },
          {
            key: 'icon',
            header: cols.icon,
            width: '5rem',
            align: 'center',
            render: (row) => (
              <CategoryIcon icon={row._raw?.icon} size={22} className="category-table-icon" />
            ),
          },
          {
            key: 'nameAr',
            header: cols.nameAr,
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
            header: cols.nameEn,
            width: '14rem',
            hideOnMobile: true,
            truncate: false,
          },
          {
            key: 'slug',
            header: cols.slug,
            width: '11rem',
            hideOnMobile: true,
            render: (row) => <span dir="ltr">{row.slug}</span>,
          },
          {
            key: 'courses',
            header: cols.courses,
            width: '6.5rem',
            align: 'center',
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
            key: 'createdAt',
            header: cols.createdAt,
            width: '10rem',
            className: 'admin-col-date',
            hideOnMobile: true,
            truncate: false,
          },
          {
            key: 'actions',
            header: cols.actions,
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
