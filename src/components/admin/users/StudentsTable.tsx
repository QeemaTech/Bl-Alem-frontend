import { Table2 } from '@/icons';
import { Badge } from '../../ui/Badge';
import { Card } from '../../ui/Card';
import { Table } from '../../ui/Table';
import { TableEntityLink } from '../../ui/TableEntityLink';
import { UserRowActions } from './UserRowActions';
import { statusLabels, statusVariant } from './userShared';

export interface StudentTableRow extends Record<string, unknown> {
  id: number | string;
  fullName: string;
  email: string;
  phone: string;
  educationLevel: string;
  enrollments: string;
  payments: string;
  certificates: string;
  wallet: string;
  status: string;
  joinedAt: string;
  _raw: any;
}

interface StudentsTableProps {
  items: StudentTableRow[];
  loading?: boolean;
  onDetail: (student: any) => void;
  onEdit: (student: any) => void;
  onToggleStatus: (student: any) => void;
  onDelete: (student: any) => void;
}

export function StudentsTable({
  items,
  loading,
  onDetail,
  onEdit,
  onToggleStatus,
  onDelete,
}: StudentsTableProps) {
  return (
    <Card className="reports-table-card">
      <div className="section-heading reports-table-head">
        <h2>
          <span className="reports-table-title-icon" aria-hidden="true">
            <Table2 size={20} />
          </span>
          قائمة الطلاب
        </h2>
        <span className="muted-count">{items.length.toLocaleString('ar-EG')} سجل</span>
      </div>
      <Table<StudentTableRow>
        className="admin-users-table"
        loading={loading}
        stickyHeader
        compact
        maxHeight="min(72vh, 760px)"
        emptyTitle="لا يوجد طلاب"
        emptyDescription="أضف طالباً جديداً أو انتظر التسجيلات."
        data={items}
        onRowClick={(row) => onDetail(row._raw)}
        columns={[
          { key: 'id', header: 'رقم الطالب', width: '6.5rem', align: 'center' },
          {
            key: 'fullName',
            header: 'الاسم',
            width: '16rem',
            className: 'col-primary admin-col-name',
            truncate: false,
            render: (row) => (
              <TableEntityLink to={`/admin/students/${row._raw.id}`}>
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
          { key: 'educationLevel', header: 'المستوى', width: '11rem', hideOnMobile: true },
          { key: 'enrollments', header: 'الاشتراكات', width: '6.5rem', align: 'center' },
          { key: 'certificates', header: 'الشهادات', width: '6.5rem', align: 'center', hideOnMobile: true },
          { key: 'wallet', header: 'المحفظة', width: '8rem', align: 'center', hideOnMobile: true },
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
            key: 'joinedAt',
            header: 'الانضمام',
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
