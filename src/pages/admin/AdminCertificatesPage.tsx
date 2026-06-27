import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Award, Copy, Download, ExternalLink, Plus, RefreshCw } from '@/icons';
import { adminApi } from '../../api/admin';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { FilterBar } from '../../components/ui/FilterBar';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { Table } from '../../components/ui/Table';
import { useToast } from '../../components/ui/Toast';
import { certificatePdfUrl, certificateVerifyUrl } from '../../utils/certificateUrls';
import { exportTableToExcel } from '../../utils/exportExcel';
import { formatDate } from '../../utils/localeFormat';

export default function AdminCertificatesPage() {
  const { t, i18n } = useTranslation('certificates');
  const { showToast } = useToast();
  const lang = i18n.language;

  const [items, setItems] = useState<any[]>([]);
  const [eligible, setEligible] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<number | null>(null);
  const [regenerating, setRegenerating] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [pdfFilter, setPdfFilter] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [issueOpen, setIssueOpen] = useState(false);

  const cols = t('table.columns', { returnObjects: true }) as Record<string, string>;
  const pdfLabels = t('labels.pdfStatus', { returnObjects: true }) as Record<string, string>;
  const detailLabels = t('modal.detail', { returnObjects: true }) as Record<string, string>;

  const fmtDate = (value: string) => formatDate(value, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }, lang);

  const exportColumns = useMemo(() => {
    const exportCols = t('export.columns', { returnObjects: true }) as Record<string, string>;
    return [
      { key: 'certificateNumber', header: exportCols.certificateNumber },
      { key: 'student', header: exportCols.student },
      { key: 'email', header: exportCols.email },
      { key: 'course', header: exportCols.course },
      { key: 'instructor', header: exportCols.instructor },
      { key: 'pdfStatus', header: exportCols.pdfStatus },
      { key: 'verifyUrl', header: exportCols.verifyUrl },
      { key: 'issuedAt', header: exportCols.issuedAt },
    ];
  }, [t]);

  const load = async () => {
    setLoading(true);
    const [certificates, pending] = await Promise.all([
      adminApi.certificates(),
      adminApi.certificateEligible(),
    ]);
    setItems(certificates);
    setEligible(pending);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filteredItems = useMemo(() => {
    let result = items;
    if (pdfFilter === 'yes') result = result.filter((i) => i.pdfUrl);
    if (pdfFilter === 'no') result = result.filter((i) => !i.pdfUrl);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((i) =>
        [i.certificateNumber, i.user?.fullName, i.user?.email, i.course?.titleAr, i.course?.instructor?.fullName]
          .some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return result;
  }, [items, pdfFilter, search]);

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      total: items.length,
      thisMonth: items.filter((i) => new Date(i.issuedAt) >= monthStart).length,
      withPdf: items.filter((i) => i.pdfUrl).length,
      pending: eligible.length,
    };
  }, [items, eligible]);

  const tableRows = useMemo(() => filteredItems.map((row) => ({
    certificateNumber: row.certificateNumber,
    student: row.user?.fullName || t('empty'),
    email: row.user?.email || t('empty'),
    course: row.course?.titleAr || t('empty'),
    instructor: row.course?.instructor?.fullName || t('empty'),
    pdfStatus: row.pdfUrl ? pdfLabels.available : pdfLabels.unavailable,
    verifyUrl: certificateVerifyUrl(row.certificateNumber),
    issuedAt: fmtDate(row.issuedAt),
    _raw: row,
  })), [filteredItems, fmtDate, pdfLabels, t]);

  const issueCertificate = async (enrollmentId: number) => {
    setGenerating(enrollmentId);
    try {
      await adminApi.generateCertificate(enrollmentId);
      showToast(t('toast.issued'), 'success');
      await load();
    } finally {
      setGenerating(null);
    }
  };

  const regenerateCertificate = async (certificateId: number) => {
    setRegenerating(certificateId);
    try {
      await adminApi.regenerateCertificate(certificateId);
      showToast(t('toast.regenerated'), 'success');
      await load();
    } finally {
      setRegenerating(null);
    }
  };

  const copyLink = async (url: string) => {
    await navigator.clipboard.writeText(url);
    showToast(t('toast.linkCopied'), 'success');
  };

  const handleExport = () => {
    exportTableToExcel(
      t('export.sheetName'),
      exportColumns,
      tableRows.map(({ _raw, ...row }) => row),
    );
  };

  return (
    <div className="page-grid">
      <div className="reports-header">
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <div className="chip-row">
          <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!items.length}>
            {t('actions.exportExcel')}
          </Button>
          <Button icon={<Plus size={18} />} onClick={() => setIssueOpen(true)}>
            {t('actions.issue')}
          </Button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title={t('stats.total')} value={String(stats.total)} icon={Award} />
        <StatCard title={t('stats.thisMonth')} value={String(stats.thisMonth)} icon={Award} />
        <StatCard title={t('stats.withPdf')} value={String(stats.withPdf)} icon={Download} />
        <StatCard title={t('stats.pending')} value={String(stats.pending)} icon={Plus} />
      </div>

      <FilterBar
        searchValue={search}
        searchPlaceholder={t('filters.searchPlaceholder')}
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setPdfFilter(''); }}
      >
        <Select
          label={t('filters.pdf')}
          value={pdfFilter}
          onChange={(e) => setPdfFilter(e.target.value)}
          options={[
            { label: t('filters.all'), value: '' },
            { label: t('filters.available'), value: 'yes' },
            { label: t('filters.unavailable'), value: 'no' },
          ]}
        />
      </FilterBar>

      <Card>
        <Table
          loading={loading}
          data={tableRows}
          emptyTitle={t('table.emptyTitle')}
          emptyDescription={t('table.emptyDescription')}
          columns={[
            { key: 'certificateNumber', header: cols.certificateNumber },
            { key: 'student', header: cols.student },
            { key: 'course', header: cols.course },
            { key: 'instructor', header: cols.instructor },
            {
              key: 'pdfStatus',
              header: cols.pdfStatus,
              render: (row) => (
                <Badge variant={row._raw?.pdfUrl ? 'success' : 'warning'}>
                  {row.pdfStatus}
                </Badge>
              ),
            },
            { key: 'issuedAt', header: cols.issuedAt },
            {
              key: 'actions',
              header: cols.actions,
              width: '26rem',
              minWidth: '26rem',
              truncate: false,
              render: (row) => {
                const cert = row._raw;
                const verify = certificateVerifyUrl(cert.certificateNumber);
                const pdf = certificatePdfUrl(cert.certificateNumber);
                return (
                  <div className="table-actions user-row-actions">
                    <Button variant="ghost" size="sm" onClick={() => setSelected(cert)}>
                      {t('actions.details')}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => window.open(verify, '_blank')}>
                      {t('actions.verify')}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => window.open(pdf, '_blank')}>
                      PDF
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={regenerating === cert.id}
                      onClick={() => regenerateCertificate(cert.id)}
                    >
                      <RefreshCw size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => copyLink(verify)}>
                      <Copy size={14} />
                    </Button>
                  </div>
                );
              },
            },
          ]}
        />
      </Card>

      <Modal isOpen={Boolean(selected)} title={t('modal.detailTitle')} onClose={() => setSelected(null)}>
        {selected ? (
          <div className="stack-sm withdrawal-detail">
            <div className="detail-row"><span>{detailLabels.certificateNumber}</span><strong>{selected.certificateNumber}</strong></div>
            <div className="detail-row"><span>{detailLabels.student}</span><strong>{selected.user?.fullName}</strong></div>
            <div className="detail-row"><span>{detailLabels.email}</span><strong>{selected.user?.email}</strong></div>
            <div className="detail-row"><span>{detailLabels.course}</span><strong>{selected.course?.titleAr}</strong></div>
            <div className="detail-row"><span>{detailLabels.instructor}</span><strong>{selected.course?.instructor?.fullName || t('empty')}</strong></div>
            <div className="detail-row"><span>{detailLabels.issuedAt}</span><strong>{fmtDate(selected.issuedAt)}</strong></div>
            <div className="detail-row">
              <span>{detailLabels.pdf}</span>
              <Badge variant={selected.pdfUrl ? 'success' : 'warning'}>
                {selected.pdfUrl ? pdfLabels.available : pdfLabels.unavailable}
              </Badge>
            </div>
            <div className="card-actions">
              <Button
                variant="secondary"
                icon={<ExternalLink size={16} />}
                onClick={() => window.open(certificateVerifyUrl(selected.certificateNumber), '_blank')}
              >
                {t('actions.verifyCertificate')}
              </Button>
              <Button
                icon={<Download size={16} />}
                onClick={() => window.open(certificatePdfUrl(selected.certificateNumber), '_blank')}
              >
                {t('actions.downloadPdf')}
              </Button>
              <Button
                variant="outline"
                icon={<RefreshCw size={16} />}
                loading={regenerating === selected.id}
                onClick={() => regenerateCertificate(selected.id)}
              >
                {t('actions.regeneratePdf')}
              </Button>
              <Button
                variant="outline"
                icon={<Copy size={16} />}
                onClick={() => copyLink(certificateVerifyUrl(selected.certificateNumber))}
              >
                {t('actions.copyVerifyLink')}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal isOpen={issueOpen} title={t('modal.issueTitle')} onClose={() => setIssueOpen(false)}>
        {eligible.length ? (
          <div className="stack-sm">
            <p>{t('modal.eligibleIntro')}</p>
            {eligible.map((enrollment) => (
              <div key={enrollment.id} className="session-card">
                <div className="session-card-info">
                  <h4>{enrollment.user?.fullName}</h4>
                  <p>{enrollment.course?.titleAr}</p>
                  <small>{t('labels.progress', { percent: Number(enrollment.progressPercentage) })}</small>
                </div>
                <Button
                  size="sm"
                  loading={generating === enrollment.id}
                  onClick={() => issueCertificate(enrollment.id)}
                >
                  {t('actions.issueOne')}
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title={t('eligibleEmpty.title')}
            description={t('eligibleEmpty.description')}
            icon={Award}
          />
        )}
      </Modal>
    </div>
  );
}
