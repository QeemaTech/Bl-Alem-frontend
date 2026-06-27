import { useTranslation } from 'react-i18next';
import { Table2 } from '@/icons';
import { useAdminUserLabels } from '../../../hooks/useAdminUserLabels';
import { formatNumber } from '../../../utils/localeFormat';
import { Badge } from '../../ui/Badge';
import { Card } from '../../ui/Card';
import { Table } from '../../ui/Table';
import { TableEntityLink } from '../../ui/TableEntityLink';
import { UserRowActions } from './UserRowActions';

export interface UserTableRow extends Record<string, unknown> {
  id: number | string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  wallet: string;
  activity: string;
  joinedAt: string;
  _raw: any;
}

interface UsersTableProps {
  items: UserTableRow[];
  loading?: boolean;
  onDetail: (user: any) => void;
  onEdit: (user: any) => void;
  onToggleStatus: (user: any) => void;
  onDelete: (user: any) => void;
}

export function UsersTable({
  items,
  loading,
  onDetail,
  onEdit,
  onToggleStatus,
  onDelete,
}: UsersTableProps) {
  const { t, i18n } = useTranslation(['users', 'common']);
  const { roleLabels, statusLabels, roleVariant, statusVariant } = useAdminUserLabels();
  const cols = t('admin.users.table.columns', { returnObjects: true }) as Record<string, string>;

  return (
    <Card className="reports-table-card">
      <div className="section-heading reports-table-head">
        <h2>
          <span className="reports-table-title-icon" aria-hidden="true">
            <Table2 size={20} />
          </span>
          {t('admin.users.table.title')}
        </h2>
        <span className="muted-count">
          {t('common:table.recordCount', {
            count: formatNumber(items.length, undefined, i18n.language),
          })}
        </span>
      </div>
      <Table<UserTableRow>
        className="admin-users-table"
        loading={loading}
        stickyHeader
        compact
        maxHeight="min(72vh, 760px)"
        emptyTitle={t('admin.users.table.emptyTitle')}
        emptyDescription={t('admin.users.table.emptyDescription')}
        data={items}
        onRowClick={(row) => onDetail(row._raw)}
        columns={[
          { key: 'id', header: cols.id, width: '6.5rem', align: 'center' },
          {
            key: 'fullName',
            header: cols.fullName,
            width: '16rem',
            className: 'col-primary admin-col-name',
            truncate: false,
            render: (row) => (
              <TableEntityLink to={`/admin/users/${row._raw.id}`}>
                {row.fullName}
              </TableEntityLink>
            ),
          },
          {
            key: 'email',
            header: cols.email,
            width: '18rem',
            className: 'admin-col-email',
            truncate: false,
            hideOnMobile: true,
            render: (row) => <span dir="ltr" className="admin-cell-email">{row.email}</span>,
          },
          {
            key: 'phone',
            header: cols.phone,
            width: '11rem',
            className: 'admin-col-phone',
            truncate: false,
            hideOnMobile: true,
            render: (row) => <span dir="ltr">{row.phone}</span>,
          },
          {
            key: 'role',
            header: cols.role,
            width: '10.5rem',
            minWidth: '10.5rem',
            align: 'center',
            truncate: false,
            className: 'wd-col-status',
            render: (row) => (
              <Badge variant={roleVariant(String(row._raw?.role))} dot className="status-badge">
                {roleLabels[String(row._raw?.role)] || row.role}
              </Badge>
            ),
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
              <Badge variant={statusVariant(String(row._raw?.status))} dot className="status-badge">
                {statusLabels[String(row._raw?.status)] || row.status}
              </Badge>
            ),
          },
          { key: 'wallet', header: cols.wallet, width: '8rem', align: 'center', hideOnMobile: true },
          { key: 'activity', header: cols.activity, width: '10rem', hideOnMobile: true },
          {
            key: 'joinedAt',
            header: cols.joinedAt,
            width: '10rem',
            className: 'admin-col-date',
            truncate: false,
            hideOnMobile: true,
          },
          {
            key: 'actions',
            header: cols.actions,
            width: '26rem',
            minWidth: '26rem',
            truncate: false,
            render: (row) => (
              <UserRowActions
                onDetail={() => onDetail(row._raw)}
                onEdit={() => onEdit(row._raw)}
                onToggleStatus={() => onToggleStatus(row._raw)}
                isActive={row._raw?.status === 'ACTIVE'}
                onDelete={() => onDelete(row._raw)}
              />
            ),
          },
        ]}
      />
    </Card>
  );
}
