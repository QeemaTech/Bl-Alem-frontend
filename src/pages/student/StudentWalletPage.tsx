import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownLeft, ArrowUpRight, Download, Gift, TrendingDown, TrendingUp, Wallet,
} from 'lucide-react';
import { studentApi } from '../../api/student';
import { ReportChart } from '../../components/reports/ReportChart';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import { FilterBar } from '../../components/ui/FilterBar';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { Table } from '../../components/ui/Table';
import { useToast } from '../../components/ui/Toast';
import { exportTableToExcel } from '../../utils/exportExcel';
import { formatMoney, roundMoney } from '../../utils/formatMoney';

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

export default function StudentWalletPage() {
  const { showToast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    studentApi.wallet().then(setData).finally(() => setLoading(false));
  }, []);

  const transactions = data?.transactions || [];

  const stats = useMemo(() => {
    const credits = transactions
      .filter((t: any) => t.type === 'CREDIT')
      .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
    const debits = transactions
      .filter((t: any) => t.type === 'DEBIT')
      .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
    return {
      balance: Number(data?.balance || 0),
      credits: roundMoney(credits),
      debits: roundMoney(debits),
      count: transactions.length,
    };
  }, [data, transactions]);

  const typeChart = useMemo(() => [
    { label: 'إيداعات', value: stats.credits },
    { label: 'خصومات', value: stats.debits },
  ].filter((item) => item.value > 0), [stats]);

  const filtered = useMemo(() => {
    let rows = transactions;
    if (typeFilter) rows = rows.filter((t: any) => t.type === typeFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((t: any) =>
        [t.reason, t.type, String(t.amount)].some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return rows;
  }, [transactions, typeFilter, search]);

  const exportRows = filtered.map((row: any) => ({
    type: row.type === 'CREDIT' ? 'إيداع' : 'خصم',
    amount: formatMoney(row.amount),
    reason: row.reason || '—',
    createdAt: fmtDate(row.createdAt),
  }));

  const handleExport = () => {
    exportTableToExcel('سجل المحفظة', txExportColumns, exportRows);
    showToast('تم تصدير السجل.', 'success');
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="page-grid student-wallet-page">
      <div className="reports-header">
        <PageHeader title="المحفظة" subtitle="رصيدك وسجل المعاملات المالية" />
        <div className="reports-actions">
          <Link to="/student/rewards">
            <Button variant="secondary" icon={<Gift size={16} />}>المكافآت والإحالات</Button>
          </Link>
          <Button variant="outline" icon={<Download size={16} />} onClick={handleExport} disabled={!filtered.length}>
            تصدير Excel
          </Button>
        </div>
      </div>

      <Card className="student-wallet-hero">
        <div className="student-wallet-hero-icon"><Wallet size={32} /></div>
        <div className="student-wallet-hero-body">
          <span>الرصيد الحالي</span>
          <strong>{formatMoney(stats.balance)}</strong>
          <p>يمكنك استخدام الرصيد للاشتراك في الكورسات والخطط التعليمية.</p>
        </div>
        <div className="student-wallet-hero-meta">
          <div>
            <ArrowDownLeft size={16} />
            <span>إيداعات</span>
            <strong className="amount-credit">{formatMoney(stats.credits)}</strong>
          </div>
          <div>
            <ArrowUpRight size={16} />
            <span>خصومات</span>
            <strong className="amount-debit">{formatMoney(stats.debits)}</strong>
          </div>
        </div>
      </Card>

      <div className="stats-grid">
        <StatCard title="الرصيد المتاح" value={formatMoney(stats.balance)} icon={Wallet} />
        <StatCard title="إجمالي الإيداعات" value={formatMoney(stats.credits)} icon={TrendingUp} />
        <StatCard title="إجمالي الخصومات" value={formatMoney(stats.debits)} icon={TrendingDown} />
        <StatCard title="عدد المعاملات" value={String(stats.count)} icon={Wallet} />
      </div>

      {typeChart.length ? (
        <div className="reports-charts-grid">
          <ReportChart title="توزيع الحركات المالية" type="pie" data={typeChart} />
        </div>
      ) : null}

      <FilterBar
        searchValue={search}
        searchPlaceholder="بحث بالسبب أو المبلغ..."
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setTypeFilter(''); }}
      >
        <Select
          label="النوع"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          options={[
            { label: 'الكل', value: '' },
            { label: 'إيداع', value: 'CREDIT' },
            { label: 'خصم', value: 'DEBIT' },
          ]}
        />
      </FilterBar>

      <Card>
        <div className="section-heading">
          <h2>سجل المعاملات</h2>
          <span className="muted-count">{filtered.length} معاملة</span>
        </div>
        <Table
          data={filtered}
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
                <span className={`wallet-amount ${row.type === 'CREDIT' ? 'amount-credit' : 'amount-debit'}`}>
                  {row.type === 'CREDIT' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                  {row.type === 'CREDIT' ? '+' : '−'}{formatMoney(Number(row.amount))}
                </span>
              ),
            },
            { key: 'reason', header: 'السبب', render: (row) => String(row.reason || '—') },
            { key: 'createdAt', header: 'التاريخ', render: (row) => fmtDate(String(row.createdAt)) },
          ]}
        />
      </Card>
    </div>
  );
}
