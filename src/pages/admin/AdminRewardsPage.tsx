import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2, Clock, Download, Gift, Star, Table2, Users, XCircle,
} from '@/icons';
import { adminApi } from '../../api/admin';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { FilterBar } from '../../components/ui/FilterBar';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { Table } from '../../components/ui/Table';
import { Tabs } from '../../components/ui/Tabs';
import { useToast } from '../../components/ui/Toast';
import { useAdminRewardLabels } from '../../hooks/useAdminRewardLabels';
import { exportTableToExcel } from '../../utils/exportExcel';
import { formatNumber } from '../../utils/localeFormat';

export default function AdminRewardsPage() {
  const { t, i18n } = useTranslation(['rewards', 'common']);
  const { showToast } = useToast();
  const {
    referralStatusLabels,
    fmtDate,
    getReferralStatusLabel,
    getCodeStatusLabel,
    referralStatusVariant,
    empty,
  } = useAdminRewardLabels();

  const [tab, setTab] = useState('students');
  const [stats, setStats] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentStatus, setStudentStatus] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatus, setHistoryStatus] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentHistory, setStudentHistory] = useState<any>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | 'disable' | 'enable' | 'reset'>(null);
  const [submitting, setSubmitting] = useState(false);

  const cols = t('table.columns', { returnObjects: true, ns: 'rewards' }) as Record<string, string>;

  const studentsExportColumns = useMemo(() => {
    const exportCols = t('export.studentsColumns', { returnObjects: true, ns: 'rewards' }) as Record<string, string>;
    return [
      { key: 'fullName', header: exportCols.fullName },
      { key: 'email', header: exportCols.email },
      { key: 'referralCode', header: exportCols.referralCode },
      { key: 'status', header: exportCols.status },
      { key: 'rewardPoints', header: exportCols.rewardPoints },
      { key: 'successfulReferrals', header: exportCols.successfulReferrals },
      { key: 'createdAt', header: exportCols.createdAt },
    ];
  }, [t]);

  const historyExportColumns = useMemo(() => {
    const exportCols = t('export.historyColumns', { returnObjects: true, ns: 'rewards' }) as Record<string, string>;
    return [
      { key: 'referrer', header: exportCols.referrer },
      { key: 'referredUser', header: exportCols.referredUser },
      { key: 'code', header: exportCols.code },
      { key: 'rewardPoints', header: exportCols.rewardPoints },
      { key: 'status', header: exportCols.status },
      { key: 'createdAt', header: exportCols.createdAt },
    ];
  }, [t]);

  const load = async () => {
    setLoading(true);
    try {
      const [statsData, studentsData, historyData] = await Promise.all([
        adminApi.rewardStats(),
        adminApi.referralStudents(),
        adminApi.referrals(),
      ]);
      setStats(statsData);
      setStudents(studentsData);
      setHistory(historyData);
    } catch {
      showToast(t('toast.loadFailed', { ns: 'rewards' }), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredStudents = useMemo(() => {
    let result = students;
    if (studentStatus === 'active') result = result.filter((s) => s.referralCodeEnabled);
    if (studentStatus === 'disabled') result = result.filter((s) => !s.referralCodeEnabled);
    if (studentSearch.trim()) {
      const q = studentSearch.trim().toLowerCase();
      result = result.filter((s) =>
        [s.fullName, s.email, s.referralCode].some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return result;
  }, [students, studentSearch, studentStatus]);

  const filteredHistory = useMemo(() => {
    let result = history;
    if (historyStatus) result = result.filter((row) => row.rewardStatus === historyStatus);
    if (historySearch.trim()) {
      const q = historySearch.trim().toLowerCase();
      result = result.filter((row) =>
        [row.code, row.referrer?.fullName, row.referrer?.email, row.referredUser?.fullName, row.referredUser?.email]
          .some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return result;
  }, [history, historySearch, historyStatus]);

  const studentRows = useMemo(() => filteredStudents.map((row) => ({
    fullName: row.fullName,
    email: row.email,
    referralCode: row.referralCode || empty,
    status: getCodeStatusLabel(row.referralCodeEnabled),
    rewardPoints: String(row.rewardPoints ?? 0),
    successfulReferrals: String(row.successfulReferrals ?? row._count?.referralsMade ?? 0),
    createdAt: fmtDate(row.createdAt),
    _raw: row,
  })), [filteredStudents, fmtDate, getCodeStatusLabel, empty]);

  const historyRows = useMemo(() => filteredHistory.map((row) => ({
    referrer: row.referrer?.fullName || empty,
    referredUser: row.referredUser?.fullName || empty,
    code: row.code,
    rewardPoints: String(row.rewardPoints ?? 0),
    status: getReferralStatusLabel(row.rewardStatus),
    createdAt: fmtDate(row.createdAt),
    _raw: row,
  })), [filteredHistory, fmtDate, getReferralStatusLabel, empty]);

  const openStudentHistory = async (student: any) => {
    setSelectedStudent(student);
    setHistoryLoading(true);
    try {
      const data = await adminApi.referralStudentHistory(student.id);
      setStudentHistory(data);
    } catch {
      showToast(t('toast.loadHistoryFailed', { ns: 'rewards' }), 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  const runConfirmAction = async () => {
    if (!selectedStudent || !confirmAction) return;
    setSubmitting(true);
    try {
      if (confirmAction === 'disable') {
        await adminApi.setStudentReferralStatus(selectedStudent.id, false);
        showToast(t('toast.disabled', { ns: 'rewards' }), 'success');
      } else if (confirmAction === 'enable') {
        await adminApi.setStudentReferralStatus(selectedStudent.id, true);
        showToast(t('toast.enabled', { ns: 'rewards' }), 'success');
      } else if (confirmAction === 'reset') {
        await adminApi.resetStudentRewardPoints(selectedStudent.id);
        showToast(t('toast.reset', { ns: 'rewards' }), 'success');
      }
      setConfirmAction(null);
      setSelectedStudent(null);
      setStudentHistory(null);
      await load();
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message
        || t('toast.actionFailed', { ns: 'rewards' });
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = () => {
    if (tab === 'students') {
      exportTableToExcel(
        t('export.studentsSheet', { ns: 'rewards' }),
        studentsExportColumns,
        studentRows.map(({ _raw, ...row }) => row),
      );
    } else {
      exportTableToExcel(
        t('export.historySheet', { ns: 'rewards' }),
        historyExportColumns,
        historyRows.map(({ _raw, ...row }) => row),
      );
    }
  };

  return (
    <div className="page-grid">
      <div className="reports-header">
        <PageHeader title={t('title', { ns: 'rewards' })} subtitle={t('subtitle', { ns: 'rewards' })} />
        <div className="reports-header-actions">
          <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={loading}>
            {t('actions.exportExcel', { ns: 'rewards' })}
          </Button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title={t('stats.totalCodes', { ns: 'rewards' })} value={String(stats?.totalReferralCodes ?? 0)} icon={Users} />
        <StatCard title={t('stats.activeCodes', { ns: 'rewards' })} value={String(stats?.activeReferralCodes ?? 0)} icon={CheckCircle2} />
        <StatCard title={t('stats.disabledCodes', { ns: 'rewards' })} value={String(stats?.disabledReferralCodes ?? 0)} icon={XCircle} />
        <StatCard title={t('stats.totalPoints', { ns: 'rewards' })} value={String(stats?.totalPointsAvailable ?? 0)} icon={Star} />
        <StatCard title={t('stats.redeemedPoints', { ns: 'rewards' })} value={String(stats?.totalPointsRedeemed ?? 0)} icon={Gift} />
        <StatCard title={t('stats.pendingReferrals', { ns: 'rewards' })} value={String(stats?.totalPending ?? 0)} icon={Clock} />
      </div>

      <Card className="admin-reward-info">
        <p>{t('info', { ns: 'rewards' })}</p>
      </Card>

      <Tabs
        variant="pills"
        activeTab={tab}
        onChange={setTab}
        tabs={[
          { id: 'students', label: t('tabs.students', { ns: 'rewards', count: students.length }) },
          { id: 'history', label: t('tabs.history', { ns: 'rewards', count: history.length }) },
        ]}
      />

      {tab === 'students' ? (
        <>
          <FilterBar
            searchValue={studentSearch}
            searchPlaceholder={t('filters.studentSearchPlaceholder', { ns: 'rewards' })}
            onSearchChange={setStudentSearch}
            onReset={() => { setStudentSearch(''); setStudentStatus(''); }}
          >
            <Select
              label={t('filters.codeStatus', { ns: 'rewards' })}
              value={studentStatus}
              onChange={(e) => setStudentStatus(e.target.value)}
              options={[
                { label: t('filters.all', { ns: 'rewards' }), value: '' },
                { label: t('filters.active', { ns: 'rewards' }), value: 'active' },
                { label: t('filters.disabled', { ns: 'rewards' }), value: 'disabled' },
              ]}
            />
          </FilterBar>
          <Card className="reports-table-card">
            <div className="section-heading reports-table-head">
              <h2>
                <span className="reports-table-title-icon" aria-hidden="true">
                  <Table2 size={20} />
                </span>
                {t('table.studentsTitle', { ns: 'rewards' })}
              </h2>
              <span className="muted-count">
                {t('table.studentCount', {
                  ns: 'rewards',
                  count: formatNumber(filteredStudents.length, undefined, i18n.language),
                })}
              </span>
            </div>
            <Table
              className="admin-users-table"
              loading={loading}
              stickyHeader
              compact
              fluid
              hideScrollNotice
              maxHeight="min(72vh, 760px)"
              data={studentRows}
              emptyTitle={t('table.studentsEmptyTitle', { ns: 'rewards' })}
              emptyDescription={t('table.studentsEmptyDescription', { ns: 'rewards' })}
              columns={[
                { key: 'fullName', header: cols.fullName, width: '14rem', className: 'col-primary admin-col-name', truncate: false },
                {
                  key: 'email',
                  header: cols.email,
                  width: '16rem',
                  className: 'admin-col-email',
                  truncate: false,
                  hideOnMobile: true,
                  render: (row) => <span dir="ltr" className="admin-cell-email">{row.email}</span>,
                },
                { key: 'referralCode', header: cols.referralCode, width: '9rem', truncate: false },
                {
                  key: 'status',
                  header: cols.codeStatus,
                  width: '10.5rem',
                  minWidth: '10.5rem',
                  align: 'center',
                  truncate: false,
                  className: 'wd-col-status',
                  render: (row) => (
                    <Badge variant={row._raw?.referralCodeEnabled ? 'success' : 'warning'} dot className="status-badge">
                      {row.status}
                    </Badge>
                  ),
                },
                { key: 'rewardPoints', header: cols.rewardPoints, width: '7rem', align: 'center' },
                { key: 'successfulReferrals', header: cols.successfulReferrals, hideOnMobile: true, align: 'center' },
                { key: 'createdAt', header: cols.createdAt, hideOnMobile: true },
                {
                  key: 'actions',
                  header: cols.actions,
                  width: '26rem',
                  minWidth: '26rem',
                  truncate: false,
                  render: (row) => {
                    const student = row._raw;
                    return (
                      <div className="table-actions user-row-actions">
                        <Button variant="ghost" size="sm" onClick={() => openStudentHistory(student)}>
                          {t('actions.view', { ns: 'rewards' })}
                        </Button>
                        {student.referralCodeEnabled ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => { setSelectedStudent(student); setConfirmAction('disable'); }}
                          >
                            {t('actions.disable', { ns: 'rewards' })}
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => { setSelectedStudent(student); setConfirmAction('enable'); }}
                          >
                            {t('actions.enable', { ns: 'rewards' })}
                          </Button>
                        )}
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => { setSelectedStudent(student); setConfirmAction('reset'); }}
                        >
                          {t('actions.resetPoints', { ns: 'rewards' })}
                        </Button>
                      </div>
                    );
                  },
                },
              ]}
            />
          </Card>
        </>
      ) : null}

      {tab === 'history' ? (
        <>
          <FilterBar
            searchValue={historySearch}
            searchPlaceholder={t('filters.historySearchPlaceholder', { ns: 'rewards' })}
            onSearchChange={setHistorySearch}
            onReset={() => { setHistorySearch(''); setHistoryStatus(''); }}
          >
            <Select
              label={t('filters.status', { ns: 'rewards' })}
              value={historyStatus}
              onChange={(e) => setHistoryStatus(e.target.value)}
              options={[
                { label: t('filters.all', { ns: 'rewards' }), value: '' },
                { label: referralStatusLabels.REWARDED, value: 'REWARDED' },
                { label: referralStatusLabels.PENDING, value: 'PENDING' },
                { label: referralStatusLabels.APPROVED, value: 'APPROVED' },
                { label: referralStatusLabels.REJECTED, value: 'REJECTED' },
              ]}
            />
          </FilterBar>
          <Card className="reports-table-card">
            <div className="section-heading reports-table-head">
              <h2>
                <span className="reports-table-title-icon" aria-hidden="true">
                  <Table2 size={20} />
                </span>
                {t('table.historyTitle', { ns: 'rewards' })}
              </h2>
              <span className="muted-count">
                {t('table.referralCount', {
                  ns: 'rewards',
                  count: formatNumber(filteredHistory.length, undefined, i18n.language),
                })}
              </span>
            </div>
            <Table
              className="admin-users-table"
              loading={loading}
              stickyHeader
              compact
              fluid
              hideScrollNotice
              maxHeight="min(72vh, 760px)"
              data={historyRows}
              emptyTitle={t('table.historyEmptyTitle', { ns: 'rewards' })}
              emptyDescription={t('table.historyEmptyDescription', { ns: 'rewards' })}
              columns={[
                { key: 'referrer', header: cols.referrer, width: '14rem', className: 'col-primary admin-col-name', truncate: false },
                { key: 'referredUser', header: cols.referredUser, width: '14rem', truncate: false },
                { key: 'code', header: cols.referralCode, width: '9rem', truncate: false },
                { key: 'rewardPoints', header: cols.rewardPoints, width: '7rem', align: 'center' },
                {
                  key: 'status',
                  header: cols.status,
                  width: '10.5rem',
                  minWidth: '10.5rem',
                  align: 'center',
                  truncate: false,
                  className: 'wd-col-status',
                  render: (row) => (
                    <Badge variant={referralStatusVariant(String(row._raw?.rewardStatus))} dot className="status-badge">
                      {getReferralStatusLabel(String(row._raw?.rewardStatus))}
                    </Badge>
                  ),
                },
                { key: 'createdAt', header: cols.date },
              ]}
            />
          </Card>
        </>
      ) : null}

      <Modal
        isOpen={Boolean(studentHistory) || (Boolean(selectedStudent) && historyLoading)}
        title={studentHistory
          ? t('modal.historyTitle', { ns: 'rewards', name: studentHistory.fullName })
          : t('modal.loading', { ns: 'rewards' })}
        onClose={() => { setStudentHistory(null); setSelectedStudent(null); }}
      >
        {historyLoading ? (
          <p className="text-sm text-on-surface-variant">{t('modal.loadingHistory', { ns: 'rewards' })}</p>
        ) : studentHistory ? (
          <div className="stack-sm withdrawal-detail">
            <div className="detail-row">
              <span>{t('modal.referralCode', { ns: 'rewards' })}</span>
              <strong dir="ltr">{studentHistory.referralCode || empty}</strong>
            </div>
            <div className="detail-row">
              <span>{t('modal.availablePoints', { ns: 'rewards' })}</span>
              <strong>{studentHistory.rewardPoints ?? 0}</strong>
            </div>
            <div className="detail-row">
              <span>{t('modal.codeStatus', { ns: 'rewards' })}</span>
              <Badge variant={studentHistory.referralCodeEnabled ? 'success' : 'warning'}>
                {getCodeStatusLabel(studentHistory.referralCodeEnabled)}
              </Badge>
            </div>
            {studentHistory.referralsMade?.length ? (
              <div className="mt-4">
                <strong className="mb-2 block">
                  {t('modal.referrals', { ns: 'rewards', count: studentHistory.referralsMade.length })}
                </strong>
                <Table
                  compact
                  data={studentHistory.referralsMade.map((ref: any) => ({
                    user: ref.referredUser?.fullName || empty,
                    points: ref.rewardPoints ?? 0,
                    status: getReferralStatusLabel(ref.rewardStatus),
                    date: fmtDate(ref.createdAt),
                  }))}
                  columns={[
                    { key: 'user', header: cols.user },
                    { key: 'points', header: cols.points },
                    { key: 'status', header: cols.status },
                    { key: 'date', header: cols.date },
                  ]}
                />
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant">{t('modal.noReferrals', { ns: 'rewards' })}</p>
            )}
            {studentHistory.rewardTransactions?.length ? (
              <div className="mt-4">
                <strong className="mb-2 block">{t('modal.pointTransactions', { ns: 'rewards' })}</strong>
                <Table
                  compact
                  data={studentHistory.rewardTransactions.map((tx: any) => ({
                    type: tx.type,
                    points: tx.points > 0 ? `+${tx.points}` : String(tx.points),
                    reason: tx.reason || empty,
                    date: fmtDate(tx.createdAt),
                  }))}
                  columns={[
                    { key: 'type', header: cols.type },
                    { key: 'points', header: cols.points },
                    { key: 'reason', header: cols.reason },
                    { key: 'date', header: cols.date },
                  ]}
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        isOpen={confirmAction === 'disable'}
        title={t('confirm.disableTitle', { ns: 'rewards' })}
        message={t('confirm.disableMessage', { ns: 'rewards', name: selectedStudent?.fullName })}
        confirmLabel={t('actions.disable', { ns: 'rewards' })}
        onConfirm={runConfirmAction}
        onCancel={() => { setConfirmAction(null); setSelectedStudent(null); }}
        loading={submitting}
      />

      <ConfirmDialog
        isOpen={confirmAction === 'enable'}
        title={t('confirm.enableTitle', { ns: 'rewards' })}
        message={t('confirm.enableMessage', { ns: 'rewards', name: selectedStudent?.fullName })}
        confirmLabel={t('actions.enable', { ns: 'rewards' })}
        onConfirm={runConfirmAction}
        onCancel={() => { setConfirmAction(null); setSelectedStudent(null); }}
        loading={submitting}
      />

      <ConfirmDialog
        isOpen={confirmAction === 'reset'}
        title={t('confirm.resetTitle', { ns: 'rewards' })}
        message={t('confirm.resetMessage', { ns: 'rewards', name: selectedStudent?.fullName })}
        confirmLabel={t('confirm.resetConfirm', { ns: 'rewards' })}
        onConfirm={runConfirmAction}
        onCancel={() => { setConfirmAction(null); setSelectedStudent(null); }}
        loading={submitting}
      />
    </div>
  );
}
