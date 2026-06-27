import { useTranslation } from 'react-i18next';
import { CheckCircle2, Table2, XCircle } from '@/icons';
import { useAdminUserLabels } from '../../../hooks/useAdminUserLabels';
import { formatNumber } from '../../../utils/localeFormat';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Table } from '../../ui/Table';
import { TableEntityLink } from '../../ui/TableEntityLink';
import { UserRowActions } from './UserRowActions';

function CountBadge({ value, ariaLabel }: { value: string | number; ariaLabel: string }) {
  return (
    <span className="admin-count-badge" aria-label={ariaLabel}>
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
  const { t, i18n } = useTranslation(['users', 'common']);
  const { approvalLabels, statusLabels, approvalVariant, statusVariant } = useAdminUserLabels();
  const cols = t('admin.instructors.table.columns', { returnObjects: true }) as Record<string, string>;

  return (
    <Card className="reports-table-card">
      <div className="section-heading reports-table-head">
        <h2>
          <span className="reports-table-title-icon" aria-hidden="true">
            <Table2 size={20} />
          </span>
          {t('admin.instructors.table.title')}
        </h2>
        <span className="muted-count">
          {t('common:table.recordCount', {
            count: formatNumber(items.length, undefined, i18n.language),
          })}
        </span>
      </div>
      <Table<InstructorTableRow>
        className="admin-users-table"
        loading={loading}
        stickyHeader
        compact
        maxHeight="min(72vh, 760px)"
        emptyTitle={t('admin.instructors.table.emptyTitle')}
        emptyDescription={t('admin.instructors.table.emptyDescription')}
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
              <TableEntityLink to={`/admin/instructors/${row._raw.id}`}>
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
          { key: 'specialization', header: cols.specialization, width: '14rem', wrap: true, hideOnMobile: true },
          {
            key: 'courses',
            header: cols.courses,
            width: '6.5rem',
            align: 'center',
            render: (row) => (
              <CountBadge
                value={row.courses}
                ariaLabel={t('actions.countAria', { value: row.courses })}
              />
            ),
          },
          {
            key: 'students',
            header: cols.students,
            width: '6.5rem',
            align: 'center',
            hideOnMobile: true,
            render: (row) => (
              <CountBadge
                value={row.students}
                ariaLabel={t('actions.countAria', { value: row.students })}
              />
            ),
          },
          {
            key: 'earnings',
            header: cols.earnings,
            width: '9rem',
            align: 'center',
            hideOnMobile: true,
          },
          {
            key: 'approvalStatus',
            header: cols.approval,
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
            header: cols.account,
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
            header: cols.actions,
            width: '26rem',
            minWidth: '26rem',
            truncate: false,
            render: (row) => {
              const instructor = row._raw;
              const approval = instructor.instructorProfile?.approvalStatus;
              const extra = (
                <>
                  {approval === 'PENDING' ? (
                    <>
                      <Button variant="primary" size="sm" icon={<CheckCircle2 size={16} />} onClick={() => onApprove(instructor)}>
                        {t('actions.approve')}
                      </Button>
                      <Button variant="danger" size="sm" icon={<XCircle size={16} />} onClick={() => onReject(instructor)}>
                        {t('actions.reject')}
                      </Button>
                    </>
                  ) : null}
                  {['APPROVED', 'ACTIVE'].includes(String(approval)) && instructor.status === 'ACTIVE' ? (
                    <Button variant="secondary" size="sm" icon={<CheckCircle2 size={16} />} onClick={() => onSuspend(instructor)}>
                      {t('actions.suspend')}
                    </Button>
                  ) : null}
                  {['SUSPENDED', 'REJECTED'].includes(String(approval)) || instructor.status === 'SUSPENDED' ? (
                    <Button variant="secondary" size="sm" icon={<CheckCircle2 size={16} />} onClick={() => onActivate(instructor)}>
                      {t('actions.activate')}
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
