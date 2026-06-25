import { CheckCircle2, Table2, XCircle } from '@/icons';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Table } from '../../ui/Table';
import { TableEntityLink } from '../../ui/TableEntityLink';
import { UserRowActions } from './UserRowActions';
import { approvalLabels, approvalVariant, statusLabels, statusVariant } from './userShared';

function CountBadge({ value }: { value: string | number }) {
  return (
    <span className="admin-count-badge" aria-label={`العدد: ${value}`}>
      {value}
    </span>
  );
}

export interface InstructorTableRow extends Record<string, unknown> {
  id: number | string;
  fullName: string;
  email: string;
  phone: string;
  title: string;
  specialization: string;
  courses: string;
  students: string;
  earnings: string;
  approvalStatus: string;
  accountStatus: string;
  joinedAt: string;
  _raw: any;
}

interface InstructorsTableProps {
  items: InstructorTableRow[];
  loading?: boolean;
  onDetail: (instructor: any) => void;
  onEdit: (instructor: any) => void;
  onApprove: (instructor: any) => void;
  onReject: (instructor: any) => void;
  onSuspend: (instructor: any) => void;
  onActivate: (instructor: any) => void;
  onDelete: (instructor: any) => void;
}

export function InstructorsTable({
  items,
  loading,
  onDetail,
  onEdit,
  onApprove,
  onReject,
  onSuspend,
  onActivate,
  onDelete,
}: InstructorsTableProps) {
  return (
    <Card className="reports-table-card">
      <div className="section-heading reports-table-head">
        <h2>
          <span className="reports-table-title-icon" aria-hidden="true">
            <Table2 size={20} />
          </span>
          قائمة المحاضرين
        </h2>
        <span className="muted-count">{items.length.toLocaleString('ar-EG')} سجل</span>
      </div>
      <Table<InstructorTableRow>
        className="admin-users-table"
        loading={loading}
        stickyHeader
        compact
        maxHeight="min(72vh, 760px)"
        emptyTitle="لا يوجد محاضرون"
        emptyDescription="أضف محاضراً جديداً أو انتظر طلبات التسجيل."
        data={items}
        onRowClick={(row) => onDetail(row._raw)}
        columns={[
          { key: 'id', header: 'رقم المحاضر', width: '6.5rem', align: 'center' },
          {
            key: 'fullName',
            header: 'الاسم',
            width: '16rem',
            className: 'col-primary admin-col-name',
            truncate: false,
            render: (row) => (
              <TableEntityLink to={`/admin/instructors/${row._raw.id}`}>
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
          { key: 'specialization', header: 'التخصص', width: '14rem', wrap: true, hideOnMobile: true },
          {
            key: 'courses',
            header: 'الكورسات',
            width: '6.5rem',
            align: 'center',
            render: (row) => <CountBadge value={row.courses} />,
          },
          {
            key: 'students',
            header: 'الطلاب',
            width: '6.5rem',
            align: 'center',
            hideOnMobile: true,
            render: (row) => <CountBadge value={row.students} />,
          },
          {
            key: 'earnings',
            header: 'الأرباح',
            width: '9rem',
            align: 'center',
            hideOnMobile: true,
          },
          {
            key: 'approvalStatus',
            header: 'الاعتماد',
            width: '10.5rem',
            minWidth: '10.5rem',
            align: 'center',
            truncate: false,
            className: 'wd-col-status',
            render: (row) => (
              <Badge
                variant={approvalVariant(String(row._raw?.instructorProfile?.approvalStatus))}
                dot
                className="status-badge"
              >
                {approvalLabels[String(row._raw?.instructorProfile?.approvalStatus)] || row.approvalStatus}
              </Badge>
            ),
          },
          {
            key: 'accountStatus',
            header: 'الحساب',
            width: '10.5rem',
            minWidth: '10.5rem',
            align: 'center',
            truncate: false,
            className: 'wd-col-status',
            hideOnMobile: true,
            render: (row) => (
              <Badge
                variant={statusVariant(String(row._raw?.status))}
                dot
                className="status-badge"
              >
                {statusLabels[String(row._raw?.status)] || row.accountStatus}
              </Badge>
            ),
          },
          {
            key: 'actions',
            header: 'الإجراءات',
            width: '26rem',
            wrap: true,
            truncate: false,
            render: (row) => {
              const instructor = row._raw;
              const approval = instructor.instructorProfile?.approvalStatus;
              const extra = (
                <>
                  {approval === 'PENDING' ? (
                    <>
                      <Button variant="primary" size="sm" icon={<CheckCircle2 size={16} />} onClick={() => onApprove(instructor)}>
                        اعتماد
                      </Button>
                      <Button variant="danger" size="sm" icon={<XCircle size={16} />} onClick={() => onReject(instructor)}>
                        رفض
                      </Button>
                    </>
                  ) : null}
                  {['APPROVED', 'ACTIVE'].includes(String(approval)) && instructor.status === 'ACTIVE' ? (
                    <Button variant="secondary" size="sm" icon={<CheckCircle2 size={16} />} onClick={() => onSuspend(instructor)}>
                      إيقاف
                    </Button>
                  ) : null}
                  {['SUSPENDED', 'REJECTED'].includes(String(approval)) || instructor.status === 'SUSPENDED' ? (
                    <Button variant="secondary" size="sm" icon={<CheckCircle2 size={16} />} onClick={() => onActivate(instructor)}>
                      تفعيل
                    </Button>
                  ) : null}
                </>
              );

              return (
                <UserRowActions
                  onDetail={() => onDetail(instructor)}
                  onEdit={() => onEdit(instructor)}
                  extra={extra}
                  onDelete={() => onDelete(instructor)}
                  deleteDisabled={Number(instructor._count?.courses || 0) > 0}
                />
              );
            },
          },
        ]}
      />
    </Card>
  );
}
