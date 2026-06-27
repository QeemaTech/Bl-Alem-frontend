import { useEffect, useMemo, useState } from 'react';
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

const rewardVariant = (status: string) => {
  if (status === 'APPROVED' || status === 'REWARDED') return 'success' as const;
  if (status === 'PENDING') return 'pending' as const;
  if (status === 'REJECTED') return 'rejected' as const;
  return 'default' as const;
};

const statusLabels: Record<string, string> = {
  PENDING: 'قيد الانتظار',
  APPROVED: 'معتمدة',
  REWARDED: 'مُكافأ',
  REJECTED: 'مرفوضة',
};

const txTypeLabels: Record<string, string> = {
  EARNED: 'مكتسبة',
  SPENT: 'مُنفقة',
  REDEEMED: 'مُستبدلة',
  ADJUSTMENT: 'تعديل',
};

const fmtDate = (value: string) => new Date(value).toLocaleDateString('ar-SA', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const txExportColumns = [
  { key: 'type', header: 'النوع' },
  { key: 'points', header: 'النقاط' },
  { key: 'reason', header: 'السبب' },
  { key: 'createdAt', header: 'التاريخ' },
];

const referralInfoFallback = 'كود الإحالة يُستخدم عند التسجيل فقط — منفصل تماماً عن كوبونات الخصم.';

export default function StudentRewardsPage() {
  const { showToast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('points');
  const [txSearch, setTxSearch] = useState('');
  const [txType, setTxType] = useState('');
  const [refSearch, setRefSearch] = useState('');

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
      rows = rows.filter((t: any) =>
        [t.reason, t.type, String(t.points)].some((v) => String(v || '').toLowerCase().includes(q)),
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
    showToast('تم نسخ كود الإحالة.', 'success');
  };

  const shareCode = async () => {
    const code = data?.referralCode || '';
    if (!code) return;
    const text = `انضم إلى منصة بالعِلم باستخدام كود الإحالة: ${code}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'كود الإحالة', text });
        return;
      } catch {
        /* cancelled */
      }
    }
    await navigator.clipboard.writeText(text);
    showToast('تم نسخ رسالة المشاركة.', 'success');
  };

  const exportTx = () => {
    exportTableToExcel('سجل النقاط', txExportColumns, filteredTx.map((row: any) => ({
      type: txTypeLabels[row.type] || row.type,
      points: row.points > 0 ? `+${row.points}` : String(row.points),
      reason: row.reason || '—',
      createdAt: fmtDate(row.createdAt),
    })));
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="page-grid">
      <div className="reports-header">
        <PageHeader
          title="المكافآت والإحالات"
          subtitle="ادعُ أصدقاءك عند التسجيل واحصل على نقاط مكافآت"
        />
        <div className="reports-header-actions">
          <Button
            variant="outline"
            icon={<Download size={18} />}
            onClick={exportTx}
            disabled={tab !== 'points' || !filteredTx.length}
          >
            تصدير Excel
          </Button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="النقاط المتاحة" value={String(stats.available)} icon={Star} />
        <StatCard title="نقاط مكتسبة" value={String(stats.earned)} icon={TrendingUp} />
        <StatCard title="نقاط مُستبدلة" value={String(stats.spent)} icon={Gift} />
        <StatCard title="المدعوون" value={String(stats.invited)} icon={Users} hint={`${stats.rewarded} إحالة ناجحة`} />
      </div>

      <Card className="student-referral-card">
        <div className="student-referral-icon"><Gift size={28} /></div>
        <div className="student-referral-body">
          <span className="student-referral-label">كود الإحالة الخاص بك</span>
          <strong className="student-referral-code" dir="ltr">{data?.referralCode || '—'}</strong>
          <p>
            شارك الكود مع أصدقائك عند التسجيل — تحصل على نقاط مكافآت فوراً.
            {data?.referralCodeEnabled === false ? ' (الكود معطّل حالياً)' : ''}
          </p>
        </div>
        <div className="student-referral-actions">
          <Button icon={<Copy size={16} />} onClick={copyCode} disabled={!data?.referralCode}>نسخ</Button>
          <Button variant="secondary" icon={<Share2 size={16} />} onClick={shareCode} disabled={!data?.referralCode}>مشاركة</Button>
        </div>
      </Card>

      <Card className="admin-reward-info">
        <p>{data?.referralProgramNote || referralInfoFallback}</p>
      </Card>

      <Tabs
        variant="pills"
        activeTab={tab}
        onChange={setTab}
        tabs={[
          { id: 'points', label: `سجل النقاط (${pointTransactions.length})` },
          { id: 'referrals', label: `المدعوون (${invited.length})` },
        ]}
      />

      {tab === 'points' ? (
        <>
          <FilterBar
            searchValue={txSearch}
            searchPlaceholder="بحث بالسبب أو النقاط..."
            onSearchChange={setTxSearch}
            onReset={() => { setTxSearch(''); setTxType(''); }}
            resetDisabled={!hasTxFilters}
          >
            <Select
              label="النوع"
              value={txType}
              onChange={(e) => setTxType(e.target.value)}
              options={[
                { label: 'الكل', value: '' },
                { label: 'مكتسبة', value: 'EARNED' },
                { label: 'مُستبدلة', value: 'REDEEMED' },
                { label: 'مُنفقة', value: 'SPENT' },
                { label: 'تعديل', value: 'ADJUSTMENT' },
              ]}
            />
          </FilterBar>
          <Card className="reports-table-card">
            <div className="section-heading reports-table-head">
              <h2>
                <span className="reports-table-title-icon" aria-hidden="true">
                  <Table2 size={20} />
                </span>
                سجل النقاط
              </h2>
              <span className="muted-count">{filteredTx.length.toLocaleString('ar-EG')} حركة</span>
            </div>
            <Table
              fluid
              hideScrollNotice
              data={filteredTx}
              emptyTitle="لا توجد حركات نقاط"
              emptyDescription="ستظهر النقاط المكتسبة والمُستبدلة هنا."
              columns={[
                {
                  key: 'type',
                  header: 'النوع',
                  render: (row: any) => (
                    <Badge variant={Number(row.points) > 0 ? 'success' : 'warning'}>
                      {txTypeLabels[String(row.type)] || String(row.type)}
                    </Badge>
                  ),
                },
                {
                  key: 'points',
                  header: 'النقاط',
                  render: (row: any) => (
                    <span className={Number(row.points) > 0 ? 'amount-credit' : 'amount-debit'}>
                      {Number(row.points) > 0 ? '+' : ''}{row.points}
                    </span>
                  ),
                },
                { key: 'reason', header: 'السبب', render: (row) => String(row.reason || '—') },
                { key: 'createdAt', header: 'التاريخ', render: (row) => fmtDate(String(row.createdAt)) },
              ]}
            />
          </Card>
        </>
      ) : null}

      {tab === 'referrals' ? (
        <>
          <FilterBar
            searchValue={refSearch}
            searchPlaceholder="بحث بالاسم أو البريد..."
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
                المدعوون
              </h2>
              <span className="muted-count">{filteredReferrals.length.toLocaleString('ar-EG')} مدعو</span>
            </div>
            <Table
              fluid
              hideScrollNotice
              data={filteredReferrals}
              emptyTitle="لا يوجد مدعوون"
              emptyDescription="شارك كود الإحالة لدعوة أصدقائك عند التسجيل."
              columns={[
                {
                  key: 'referredUser',
                  header: 'المستخدم',
                  render: (row) => (
                    <div className="student-cell">
                      <span className="student-cell-avatar">
                        {String((row.referredUser as any)?.fullName || '?').slice(0, 1)}
                      </span>
                      <div>
                        <strong>{(row.referredUser as any)?.fullName || '—'}</strong>
                        <small dir="ltr">{(row.referredUser as any)?.email || ''}</small>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'rewardPoints',
                  header: 'النقاط',
                  render: (row: any) => <span>+{row.rewardPoints ?? 0}</span>,
                },
                {
                  key: 'rewardStatus',
                  header: 'الحالة',
                  render: (row) => (
                    <Badge variant={rewardVariant(String(row.rewardStatus))}>
                      {statusLabels[String(row.rewardStatus)] || String(row.rewardStatus)}
                    </Badge>
                  ),
                },
                {
                  key: 'createdAt',
                  header: 'تاريخ التسجيل',
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
            title="كود الإحالة غير متاح"
            description="تواصل مع الدعم إذا لم يظهر كود الإحالة الخاص بك."
            icon={UserPlus}
          />
        </Card>
      ) : null}
    </div>
  );
}
