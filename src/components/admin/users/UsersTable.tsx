import { Table2 } from '@/icons';
import { Badge } from '../../ui/Badge';
import { Card } from '../../ui/Card';
import { Table } from '../../ui/Table';
import { TableEntityLink } from '../../ui/TableEntityLink';
import { UserRowActions } from './UserRowActions';
import { roleLabels, roleVariant, statusLabels, statusVariant } from './userShared';

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
  return (
    <Card className="reports-table-card">
      <div className="section-heading reports-table-head">
        <h2>
          <span className="reports-table-title-icon" aria-hidden="true">
            <Table2 size={20} />
          </span>
          قائمة المستخدمين
        </h2>
        <span className="muted-count">{items.length.toLocaleString('ar-EG')} سجل</span>
      </div>
      <Table<UserTableRow>
        className="admin-users-table"
        loading={loading}
        stickyHeader
        compact
        maxHeight="min(72vh, 760px)"
        emptyTitle="لا يوجد مستخدمون"
        emptyDescription="أضف مستخدماً جديداً للبدء."
        data={items}
        onRowClick={(row) => onDetail(row._raw)}
        columns={[
          { key: 'id', header: 'رقم المستخدم', width: '6.5rem', align: 'center' },
          {
            key: 'fullName',
            header: 'الاسم',
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
            header: 'البريد',
            width: '18rem',
            className: 'admin-col-email',
            truncate: false,
            hideOnMobile: true,
            render: (row) => <span dir="ltr" className="admin-cell-email">{row.email}</span>,
          },
          {
            key: 'phone',
            header: 'الهاتف',
            width: '11rem',
            className: 'admin-col-phone',
            truncate: false,
            hideOnMobile: true,
            render: (row) => <span dir="ltr">{row.phone}</span>,
          },
          {
            key: 'role',
            header: 'الدور',
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
            header: 'الحالة',
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
          { key: 'wallet', header: 'المحفظة', width: '8rem', align: 'center', hideOnMobile: true },
          { key: 'activity', header: 'النشاط', width: '10rem', hideOnMobile: true },
          {
            key: 'joinedAt',
            header: 'التسجيل',
            width: '10rem',
            className: 'admin-col-date',
            truncate: false,
            hideOnMobile: true,
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
              />
            ),
          },
        ]}
      />
    </Card>
  );
}
