import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Copy, Download, Gift, Share2, Tag, TrendingUp, UserPlus, Users, Wallet,
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
import { formatMoney } from '../../utils/formatMoney';

const rewardVariant = (status: string) => {
  if (status === 'APPROVED' || status === 'REWARDED') return 'success' as const;
  if (status === 'PENDING') return 'pending' as const;
  if (status === 'REJECTED') return 'rejected' as const;
  return 'default' as const;
};

const statusLabels: Record<string, string> = {
  PENDING: 'قيد المراجعة',
  APPROVED: 'معتمدة',
  REWARDED: 'مكافأة مُصدَرة',
  REJECTED: 'مرفوضة',
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
  { key: 'amount', header: 'المبلغ' },
  { key: 'reason', header: 'السبب' },
  { key: 'createdAt', header: 'التاريخ' },
];

export default function StudentRewardsPage() {
  const { showToast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('transactions');
  const [txSearch, setTxSearch] = useState('');
  const [txType, setTxType] = useState('');
  const [refSearch, setRefSearch] = useState('');
  const [refStatus, setRefStatus] = useState('');

  useEffect(() => {
    studentApi.rewards().then(setData).finally(() => setLoading(false));
  }, []);

  const invited = data?.invitedUsers || [];
  const transactions = data?.transactions || [];
  const coupons = data?.coupons || [];

  const stats = useMemo(() => ({
    balance: Number(data?.walletBalance || 0),
    invited: invited.length,
    approved: invited.filter((i: any) => ['APPROVED', 'REWARDED'].includes(i.rewardStatus)).length,
    pending: invited.filter((i: any) => i.rewardStatus === 'PENDING').length,
    credits: transactions.filter((t: any) => t.type === 'CREDIT').length,
  }), [data, invited, transactions]);

  const filteredTx = useMemo(() => {
    let rows = transactions;
    if (txType) rows = rows.filter((t: any) => t.type === txType);
    if (txSearch.trim()) {
      const q = txSearch.trim().toLowerCase();
      rows = rows.filter((t: any) =>
        [t.reason, t.type, String(t.amount)].some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return rows;
  }, [transactions, txType, txSearch]);

  const filteredReferrals = useMemo(() => {
    let rows = invited;
    if (refStatus) rows = rows.filter((r: any) => r.rewardStatus === refStatus);
    if (refSearch.trim()) {
      const q = refSearch.trim().toLowerCase();
      rows = rows.filter((r: any) =>
        [r.referredUser?.fullName, r.referredUser?.email, r.code]
          .some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return rows;
  }, [invited, refStatus, refSearch]);

  const txRows = filteredTx.map((row: any) => ({
    ...row,
    type: row.type === 'CREDIT' ? 'إيداع' : 'خصم',
    amount: formatMoney(row.amount),
    createdAt: fmtDate(row.createdAt),
  }));

  const copyCode = async () => {
    const code = data?.referralCode || '';
    if (!code) return;
    await navigator.clipboard.writeText(code);
    showToast('تم نسخ كود الإحالة.', 'success');
  };

  const shareCode = async () => {
    const code = data?.referralCode || '';
    if (!code) return;
    const text = `انضم إلى منصة بيلعلم باستخدام كود الإحالة: ${code}`;
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
    exportTableToExcel('سجل المحفظة', txExportColumns, txRows);
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="page-grid student-rewards-page">
      <PageHeader
        title="المكافآت والإحالات"
        subtitle="ادعُ أصدقاءك واحصل على مكافآت عند اشتراكهم"
      />

      <div className="stats-grid">
        <StatCard title="رصيد المكافآت" value={formatMoney(stats.balance)} icon={Wallet} />
        <StatCard title="المدعوون" value={String(stats.invited)} icon={Users} />
        <StatCard title="إحالات معتمدة" value={String(stats.approved)} icon={UserPlus} hint={`${stats.pending} قيد المراجعة`} />
        <StatCard title="عمليات إيداع" value={String(stats.credits)} icon={TrendingUp} />
      </div>

      <div className="student-rewards-hero">
        <Card className="student-referral-card">
          <div className="student-referral-icon"><Gift size={28} /></div>
          <div className="student-referral-body">
            <span className="student-referral-label">كود الإحالة الخاص بك</span>
            <strong className="student-referral-code" dir="ltr">{data?.referralCode || '—'}</strong>
            <p>شارك الكود مع أصدقائك — تحصل على مكافأة عند اعتماد اشتراكهم.</p>
          </div>
          <div className="student-referral-actions">
            <Button icon={<Copy size={16} />} onClick={copyCode}>نسخ</Button>
            <Button variant="secondary" icon={<Share2 size={16} />} onClick={shareCode}>مشاركة</Button>
          </div>
        </Card>

        <Card className="student-wallet-card">
          <div className="student-wallet-icon"><Wallet size={28} /></div>
          <div className="student-wallet-body">
            <span className="student-wallet-label">رصيد المحفظة</span>
            <strong>{formatMoney(stats.balance)}</strong>
            <p>استخدم الرصيد للاشتراك في الكورسات أو الخطط.</p>
          </div>
          <Link to="/student/wallet">
            <Button variant="secondary">عرض المحفظة</Button>
          </Link>
        </Card>
      </div>

      <Tabs
        variant="pills"
        activeTab={tab}
        onChange={setTab}
        tabs={[
          { id: 'transactions', label: `سجل المحفظة (${transactions.length})` },
          { id: 'referrals', label: `المدعوون (${invited.length})` },
          { id: 'coupons', label: `الكوبونات (${coupons.length})` },
        ]}
      />

      {tab === 'transactions' ? (
        <>
          <div className="reports-header">
            <FilterBar
              searchValue={txSearch}
              searchPlaceholder="بحث بالسبب أو المبلغ..."
              onSearchChange={setTxSearch}
              onReset={() => { setTxSearch(''); setTxType(''); }}
            >
              <Select
                label="النوع"
                value={txType}
                onChange={(e) => setTxType(e.target.value)}
                options={[
                  { label: 'الكل', value: '' },
                  { label: 'إيداع', value: 'CREDIT' },
                  { label: 'خصم', value: 'DEBIT' },
                ]}
              />
            </FilterBar>
            <Button variant="outline" icon={<Download size={16} />} onClick={exportTx} disabled={!filteredTx.length}>
              تصدير
            </Button>
          </div>
          <Card>
            <Table
              data={filteredTx}
              emptyTitle="لا توجد معاملات"
              emptyDescription="ستظهر عمليات الإيداع والخصم هنا."
              columns={[
                {
                  key: 'type',
                  header: 'النوع',
                  render: (row) => (
                    <Badge variant={row.type === 'CREDIT' ? 'success' : 'warning'}>
                      {row.type === 'CREDIT' ? 'إيداع' : 'خصم'}
                    </Badge>
                  ),
                },
                {
                  key: 'amount',
                  header: 'المبلغ',
                  render: (row) => (
                    <span className={row.type === 'CREDIT' ? 'amount-credit' : 'amount-debit'}>
                      {row.type === 'CREDIT' ? '+' : '−'}{formatMoney(Number(row.amount))}
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
            onReset={() => { setRefSearch(''); setRefStatus(''); }}
          >
            <Select
              label="حالة المكافأة"
              value={refStatus}
              onChange={(e) => setRefStatus(e.target.value)}
              options={[
                { label: 'الكل', value: '' },
                { label: 'قيد المراجعة', value: 'PENDING' },
                { label: 'معتمدة', value: 'APPROVED' },
                { label: 'مرفوضة', value: 'REJECTED' },
              ]}
            />
          </FilterBar>
          <Card>
            <Table
              data={filteredReferrals}
              emptyTitle="لا يوجد مدعوون"
              emptyDescription="شارك كود الإحالة لدعوة أصدقائك."
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
                  key: 'rewardStatus',
                  header: 'حالة المكافأة',
                  render: (row) => (
                    <Badge variant={rewardVariant(String(row.rewardStatus))}>
                      {statusLabels[String(row.rewardStatus)] || String(row.rewardStatus)}
                    </Badge>
                  ),
                },
                {
                  key: 'createdAt',
                  header: 'تاريخ الدعوة',
                  render: (row) => fmtDate(String(row.createdAt)),
                },
              ]}
            />
          </Card>
        </>
      ) : null}

      {tab === 'coupons' ? (
        coupons.length ? (
          <div className="student-coupons-grid">
            {coupons.map((coupon: any) => (
              <Card key={coupon.id} className="student-coupon-card">
                <div className="student-coupon-icon"><Tag size={22} /></div>
                <div className="student-coupon-body">
                  <strong dir="ltr">{coupon.code}</strong>
                  <span>
                    {coupon.type === 'PERCENTAGE'
                      ? `${Number(coupon.value)}% خصم`
                      : `${formatMoney(coupon.value)} خصم`}
                  </span>
                  {coupon.expiresAt ? (
                    <small>ينتهي: {fmtDate(coupon.expiresAt)}</small>
                  ) : (
                    <small>بدون تاريخ انتهاء</small>
                  )}
                </div>
                <Badge variant="info">فعّال</Badge>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              title="لا توجد كوبونات"
              description="ستظهر الكوبونات المتاحة للاستخدام هنا."
              icon={Tag}
            />
          </Card>
        )
      ) : null}
    </div>
  );
}
