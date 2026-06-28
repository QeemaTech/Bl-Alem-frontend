import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Copy, Download, Gift, Share2, Star, Table2, TrendingUp, UserPlus, Users,
} from '@/icons';
import { studentApi } from '../../api/student';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { FilterBar } from '../../components/ui/FilterBar';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { Table } from '../../components/ui/Table';
import { Tabs } from '../../components/ui/Tabs';
import { useToast } from '../../components/ui/Toast';
import { exportTableToExcel } from '../../utils/exportExcel';
import { formatDateTime, formatNumber } from '../../utils/localeFormat';

const rewardVariant = (status: string) => {
  if (status === 'APPROVED' || status === 'REWARDED') return 'success' as const;
  if (status === 'PENDING') return 'pending' as const;
  if (status === 'REJECTED') return 'rejected' as const;
  return 'default' as const;
};

export default function StudentRewardsPage() {
  const { t, i18n } = useTranslation('rewards');
  const lang = i18n.language;
  const { showToast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('points');
  const [txSearch, setTxSearch] = useState('');
  const [txType, setTxType] = useState('');
  const [refSearch, setRefSearch] = useState('');

  const fmtDate = (value: string) => formatDateTime(value, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }, lang);

  const referralStatusLabel = useCallback(
    (status: string) => t(`student.labels.referralStatus.${status}`, { defaultValue: status }),
    [t, lang],
  );

  const txTypeLabel = useCallback(
    (type: string) => t(`student.labels.txType.${type}`, { defaultValue: type }),
    [t, lang],
  );

  const txExportColumns = useMemo(() => [
    { key: 'type', header: t('student.export.columns.type') },
    { key: 'points', header: t('student.export.columns.points') },
    { key: 'reason', header: t('student.export.columns.reason') },
    { key: 'createdAt', header: t('student.export.columns.createdAt') },
  ], [t, lang]);

  useEffect(() => {
    studentApi.rewards().then(setData).finally(() => setLoading(false));
  }, []);

  const invited = data?.invitedUsers || [];
  const pointTransactions = data?.pointTransactions || [];
  const pointsSummary = data?.pointsSummary || { available: 0, earned: 0, spent: 0 };

  const stats = useMemo(() => ({
    available: Number(pointsSummary.available || 0),
    earned: Number(pointsSummary.earned || 0),
    spent: Number(pointsSummary.spent || 0),
    invited: invited.length,
    rewarded: invited.filter((i: any) => ['APPROVED', 'REWARDED'].includes(i.rewardStatus)).length,
  }), [data, invited, pointsSummary]);

  const filteredTx = useMemo(() => {
    let rows = pointTransactions;
    if (txType) rows = rows.filter((t: any) => t.type === txType);
    if (txSearch.trim()) {
      const q = txSearch.trim().toLowerCase();
      rows = rows.filter((row: any) =>
        [row.reason, row.type, String(row.points)].some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return rows;
  }, [pointTransactions, txType, txSearch]);

  const filteredReferrals = useMemo(() => {
    let rows = invited;
    if (refSearch.trim()) {
      const q = refSearch.trim().toLowerCase();
      rows = rows.filter((r: any) =>
        [r.referredUser?.fullName, r.referredUser?.email, r.code]
          .some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return rows;
  }, [invited, refSearch]);

  const hasTxFilters = Boolean(txSearch.trim() || txType);
  const hasRefFilters = Boolean(refSearch.trim());

  const copyCode = async () => {
    const code = data?.referralCode || '';
    if (!code) return;
    await navigator.clipboard.writeText(code);
    showToast(t('student.toast.codeCopied'), 'success');
  };

  const shareCode = async () => {
    const code = data?.referralCode || '';
    if (!code) return;
    const text = t('student.share.message', { code });
    if (navigator.share) {
      try {
        await navigator.share({ title: t('student.share.title'), text });
        return;
      } catch {
        /* cancelled */
      }
    }
    await navigator.clipboard.writeText(text);
    showToast(t('student.toast.shareCopied'), 'success');
  };

  const exportTx = () => {
    exportTableToExcel(t('student.export.sheetName'), txExportColumns, filteredTx.map((row: any) => ({
      type: txTypeLabel(row.type),
      points: row.points > 0 ? `+${row.points}` : String(row.points),
      reason: row.reason || t('empty'),
      createdAt: fmtDate(row.createdAt),
    })));
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="page-grid">
      <div className="reports-header">
        <PageHeader
          title={t('student.title')}
          subtitle={t('student.subtitle')}
        />
        <div className="reports-header-actions">
          <Button
            variant="outline"
            icon={<Download size={18} />}
            onClick={exportTx}
            disabled={tab !== 'points' || !filteredTx.length}
          >
            {t('student.actions.exportExcel')}
          </Button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title={t('student.stats.available')} value={String(stats.available)} icon={Star} />
        <StatCard title={t('student.stats.earned')} value={String(stats.earned)} icon={TrendingUp} />
        <StatCard title={t('student.stats.spent')} value={String(stats.spent)} icon={Gift} />
        <StatCard
          title={t('student.stats.invited')}
          value={String(stats.invited)}
          icon={Users}
          hint={t('student.stats.successfulHint', { count: stats.rewarded })}
        />
      </div>

      <Card className="student-referral-card">
        <div className="student-referral-icon"><Gift size={28} /></div>
        <div className="student-referral-body">
          <span className="student-referral-label">{t('student.referral.label')}</span>
          <strong className="student-referral-code" dir="ltr">{data?.referralCode || t('empty')}</strong>
          <p>
            {t('student.referral.description')}
            {data?.referralCodeEnabled === false ? t('student.referral.disabledSuffix') : ''}
          </p>
        </div>
        <div className="student-referral-actions">
          <Button icon={<Copy size={16} />} onClick={copyCode} disabled={!data?.referralCode}>{t('student.actions.copy')}</Button>
          <Button variant="secondary" icon={<Share2 size={16} />} onClick={shareCode} disabled={!data?.referralCode}>{t('student.actions.share')}</Button>
        </div>
      </Card>

      <Card className="admin-reward-info">
        <p>{t('student.referral.infoFallback')}</p>
      </Card>

      <Tabs
        variant="pills"
        activeTab={tab}
        onChange={setTab}
        tabs={[
          { id: 'points', label: t('student.tabs.points', { count: pointTransactions.length }) },
          { id: 'referrals', label: t('student.tabs.referrals', { count: invited.length }) },
        ]}
      />

      {tab === 'points' ? (
        <>
          <FilterBar
            searchValue={txSearch}
            searchPlaceholder={t('student.filters.txSearchPlaceholder')}
            onSearchChange={setTxSearch}
            onReset={() => { setTxSearch(''); setTxType(''); }}
            resetDisabled={!hasTxFilters}
          >
            <Select
              label={t('student.filters.type')}
              value={txType}
              onChange={(e) => setTxType(e.target.value)}
              options={[
                { label: t('student.filters.all'), value: '' },
                { label: txTypeLabel('EARNED'), value: 'EARNED' },
                { label: txTypeLabel('REDEEMED'), value: 'REDEEMED' },
                { label: txTypeLabel('SPENT'), value: 'SPENT' },
                { label: txTypeLabel('ADJUSTMENT'), value: 'ADJUSTMENT' },
              ]}
            />
          </FilterBar>
          <Card className="reports-table-card">
            <div className="section-heading reports-table-head">
              <h2>
                <span className="reports-table-title-icon" aria-hidden="true">
                  <Table2 size={20} />
                </span>
                {t('student.table.pointsTitle')}
              </h2>
              <span className="muted-count">{t('student.table.pointsCount', { count: formatNumber(filteredTx.length, undefined, lang) })}</span>
            </div>
            <Table
              fluid
              hideScrollNotice
              data={filteredTx}
              emptyTitle={t('student.table.pointsEmptyTitle')}
              emptyDescription={t('student.table.pointsEmptyDescription')}
              columns={[
                {
                  key: 'type',
                  header: t('student.table.columns.type'),
                  render: (row: any) => (
                    <Badge variant={Number(row.points) > 0 ? 'success' : 'warning'}>
                      {txTypeLabel(String(row.type))}
                    </Badge>
                  ),
                },
                {
                  key: 'points',
                  header: t('student.table.columns.points'),
                  render: (row: any) => (
                    <span className={Number(row.points) > 0 ? 'amount-credit' : 'amount-debit'}>
                      {Number(row.points) > 0 ? '+' : ''}{row.points}
                    </span>
                  ),
                },
                { key: 'reason', header: t('student.table.columns.reason'), render: (row) => String(row.reason || t('empty')) },
                { key: 'createdAt', header: t('student.table.columns.createdAt'), render: (row) => fmtDate(String(row.createdAt)) },
              ]}
            />
          </Card>
        </>
      ) : null}

      {tab === 'referrals' ? (
        <>
          <FilterBar
            searchValue={refSearch}
            searchPlaceholder={t('student.filters.refSearchPlaceholder')}
            onSearchChange={setRefSearch}
            onReset={() => setRefSearch('')}
            resetDisabled={!hasRefFilters}
          />
          <Card className="reports-table-card">
            <div className="section-heading reports-table-head">
              <h2>
                <span className="reports-table-title-icon" aria-hidden="true">
                  <Table2 size={20} />
                </span>
                {t('student.table.referralsTitle')}
              </h2>
              <span className="muted-count">{t('student.table.referralsCount', { count: formatNumber(filteredReferrals.length, undefined, lang) })}</span>
            </div>
            <Table
              fluid
              hideScrollNotice
              data={filteredReferrals}
              emptyTitle={t('student.table.referralsEmptyTitle')}
              emptyDescription={t('student.table.referralsEmptyDescription')}
              columns={[
                {
                  key: 'referredUser',
                  header: t('student.table.columns.user'),
                  render: (row) => (
                    <div className="student-cell">
                      <span className="student-cell-avatar">
                        {String((row.referredUser as any)?.fullName || '?').slice(0, 1)}
                      </span>
                      <div>
                        <strong>{(row.referredUser as any)?.fullName || t('empty')}</strong>
                        <small dir="ltr">{(row.referredUser as any)?.email || ''}</small>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'rewardPoints',
                  header: t('student.table.columns.points'),
                  render: (row: any) => <span>+{row.rewardPoints ?? 0}</span>,
                },
                {
                  key: 'rewardStatus',
                  header: t('student.table.columns.rewardStatus'),
                  render: (row) => (
                    <Badge variant={rewardVariant(String(row.rewardStatus))}>
                      {referralStatusLabel(String(row.rewardStatus))}
                    </Badge>
                  ),
                },
                {
                  key: 'createdAt',
                  header: t('student.table.columns.registeredAt'),
                  render: (row) => fmtDate(String(row.createdAt)),
                },
              ]}
            />
          </Card>
        </>
      ) : null}

      {!data?.referralCode ? (
        <Card>
          <EmptyState
            title={t('student.empty.noCodeTitle')}
            description={t('student.empty.noCodeDescription')}
            icon={UserPlus}
          />
        </Card>
      ) : null}
    </div>
  );
}
