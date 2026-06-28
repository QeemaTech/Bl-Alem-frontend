import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Award, BookOpen, Copy, Download, ExternalLink, GraduationCap, Search, Share2,
} from '@/icons';
import { studentApi } from '../../api/student';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { FilterBar } from '../../components/ui/FilterBar';
import { CourseGridSkeleton } from '../../components/ui/LoadingSkeleton';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { Tabs } from '../../components/ui/Tabs';
import { Table } from '../../components/ui/Table';
import { useToast } from '../../components/ui/Toast';
import { certificatePdfUrl, certificateVerifyUrl } from '../../utils/certificateUrls';
import { exportTableToExcel } from '../../utils/exportExcel';
import { localizedCourseTitle } from '../../utils/localizedContent';
import { formatDate } from '../../utils/localeFormat';
import { mediaUrl } from '../../utils/mediaUrl';

export default function StudentCertificatesPage() {
  const { t, i18n } = useTranslation('certificates');
  const lang = i18n.language;
  const { showToast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('grid');
  const [selected, setSelected] = useState<any>(null);

  const fmtDate = (value: string) => formatDate(value, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }, lang);

  const courseTitle = (course: any) => localizedCourseTitle(course, lang);

  const exportColumns = useMemo(() => [
    { key: 'course', header: t('student.export.columns.course') },
    { key: 'certificateNumber', header: t('student.export.columns.certificateNumber') },
    { key: 'issuedAt', header: t('student.export.columns.issuedAt') },
    { key: 'verifyUrl', header: t('student.export.columns.verifyUrl') },
  ], [t, lang]);

  useEffect(() => {
    studentApi.certificates().then(setItems).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.trim().toLowerCase();
    return items.filter((c) =>
      [courseTitle(c.course), c.certificateNumber]
        .some((v) => String(v || '').toLowerCase().includes(q)),
    );
  }, [items, search, lang]);

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const courses = new Set(items.map((i) => i.courseId));
    return {
      total: items.length,
      thisMonth: items.filter((i) => new Date(i.issuedAt) >= monthStart).length,
      courses: courses.size,
    };
  }, [items]);

  const copyLink = async (url: string) => {
    await navigator.clipboard.writeText(`${window.location.origin}${url}`);
    showToast(t('student.toast.linkCopied'), 'success');
  };

  const shareCertificate = async (certificate: any) => {
    const verify = `${window.location.origin}${certificateVerifyUrl(certificate.certificateNumber)}`;
    const text = t('student.share.message', {
      course: courseTitle(certificate.course),
      url: verify,
    });
    if (navigator.share) {
      try {
        await navigator.share({ title: t('student.share.title'), text, url: verify });
        return;
      } catch {
        /* cancelled */
      }
    }
    await navigator.clipboard.writeText(text);
    showToast(t('student.toast.shareCopied'), 'success');
  };

  const handleExport = () => {
    exportTableToExcel(t('student.export.sheetName'), exportColumns, filtered.map((c) => ({
      course: courseTitle(c.course) || t('empty'),
      certificateNumber: c.certificateNumber,
      issuedAt: fmtDate(c.issuedAt),
      verifyUrl: `${window.location.origin}${certificateVerifyUrl(c.certificateNumber)}`,
    })));
    showToast(t('student.toast.exported'), 'success');
  };

  return (
    <div className="page-grid student-certificates-page">
      <div className="reports-header">
        <PageHeader
          title={t('student.title')}
          subtitle={t('student.subtitle')}
        />
        <div className="reports-actions">
          <Button variant="outline" onClick={handleExport} disabled={!filtered.length}>
            {t('student.actions.export')}
          </Button>
          <Link to="/student/my-courses">
            <Button variant="secondary" icon={<BookOpen size={16} />}>{t('student.actions.myCourses')}</Button>
          </Link>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title={t('student.stats.total')} value={String(stats.total)} icon={Award} />
        <StatCard title={t('student.stats.thisMonth')} value={String(stats.thisMonth)} icon={GraduationCap} />
        <StatCard title={t('student.stats.coursesCompleted')} value={String(stats.courses)} icon={BookOpen} />
      </div>

      <FilterBar
        searchValue={search}
        searchPlaceholder={t('student.filters.searchPlaceholder')}
        onSearchChange={setSearch}
        onReset={() => setSearch('')}
      />

      <Tabs
        variant="pills"
        activeTab={view}
        onChange={setView}
        tabs={[
          { id: 'grid', label: t('student.tabs.grid') },
          { id: 'list', label: t('student.tabs.list') },
        ]}
      />

      {loading ? (
        <CourseGridSkeleton />
      ) : filtered.length ? (
        view === 'grid' ? (
          <div className="student-certificates-grid">
            {filtered.map((certificate) => {
              const verify = certificateVerifyUrl(certificate.certificateNumber);
              const pdf = certificatePdfUrl(certificate.certificateNumber);
              const cover = mediaUrl(certificate.course?.coverImage);
              return (
                <article key={certificate.id} className="student-certificate-card">
                  <div className="student-certificate-visual">
                    {cover ? (
                      <img src={cover} alt="" className="student-certificate-cover" />
                    ) : (
                      <div className="student-certificate-cover-fallback">
                        <Award size={40} />
                      </div>
                    )}
                    <div className="student-certificate-badge">
                      <Award size={16} />
                      <span>{t('student.badge.completion')}</span>
                    </div>
                  </div>
                  <div className="student-certificate-body">
                    <h3>{courseTitle(certificate.course) || t('empty')}</h3>
                    <p className="student-certificate-date">
                      {t('student.issuedAt', { date: fmtDate(certificate.issuedAt) })}
                    </p>
                    <p className="student-certificate-number" dir="ltr">
                      {certificate.certificateNumber}
                    </p>
                    <div className="student-certificate-actions">
                      <Button size="sm" icon={<Download size={16} />} onClick={() => window.open(pdf, '_blank')}>
                        {t('student.actions.downloadPdf')}
                      </Button>
                      <Button variant="secondary" size="sm" icon={<ExternalLink size={16} />} onClick={() => window.open(verify, '_blank')}>
                        {t('student.actions.verify')}
                      </Button>
                      <Button variant="ghost" size="sm" icon={<Copy size={16} />} onClick={() => copyLink(verify)}>
                        {t('student.actions.copy')}
                      </Button>
                      <Button variant="ghost" size="sm" icon={<Share2 size={16} />} onClick={() => shareCertificate(certificate)}>
                        {t('student.actions.share')}
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <Card>
            <Table
              data={filtered}
              emptyTitle={t('student.table.emptyTitle')}
              columns={[
                {
                  key: 'course',
                  header: t('student.table.columns.course'),
                  render: (row) => courseTitle((row.course as any)) || t('empty'),
                },
                {
                  key: 'certificateNumber',
                  header: t('student.table.columns.certificateNumber'),
                  render: (row) => <span dir="ltr">{String(row.certificateNumber)}</span>,
                },
                {
                  key: 'issuedAt',
                  header: t('student.table.columns.issuedAt'),
                  render: (row) => fmtDate(String(row.issuedAt)),
                },
                {
                  key: 'pdf',
                  header: t('student.table.columns.pdf'),
                  render: (row) => (
                    <Badge variant={row.pdfUrl ? 'success' : 'pending'}>
                      {row.pdfUrl ? t('student.pdf.available') : t('student.pdf.generatedOnDownload')}
                    </Badge>
                  ),
                },
                {
                  key: 'actions',
                  header: t('student.table.columns.actions'),
                  render: (row) => (
                    <div className="table-actions">
                      <Button variant="ghost" size="sm" onClick={() => setSelected(row)}>{t('student.actions.details')}</Button>
                      <Button variant="outline" size="sm" onClick={() => window.open(certificatePdfUrl(String(row.certificateNumber)), '_blank')}>
                        PDF
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        )
      ) : items.length ? (
        <Card>
          <EmptyState title={t('student.table.noResultsTitle')} description={t('student.table.noResultsDescription')} icon={Search} />
        </Card>
      ) : (
        <Card>
          <EmptyState
            title={t('student.table.emptyTitle')}
            description={t('student.table.emptyDescription')}
            icon={Award}
            actionLabel={t('student.table.emptyAction')}
            onAction={() => { window.location.href = '/student/my-courses'; }}
          />
        </Card>
      )}

      <Modal isOpen={Boolean(selected)} title={t('student.modal.detailTitle')} onClose={() => setSelected(null)}>
        {selected ? (
          <div className="stack-sm withdrawal-detail">
            <div className="detail-row"><span>{t('student.modal.fields.course')}</span><strong>{courseTitle(selected.course) || t('empty')}</strong></div>
            <div className="detail-row"><span>{t('student.modal.fields.certificateNumber')}</span><strong dir="ltr">{selected.certificateNumber}</strong></div>
            <div className="detail-row"><span>{t('student.modal.fields.issuedAt')}</span><strong>{fmtDate(selected.issuedAt)}</strong></div>
            <div className="detail-row">
              <span>{t('student.modal.fields.pdf')}</span>
              <Badge variant={selected.pdfUrl ? 'success' : 'pending'}>
                {selected.pdfUrl ? t('student.pdf.available') : t('student.pdf.generatedOnDownload')}
              </Badge>
            </div>
            <div className="card-actions">
              <Button icon={<Download size={16} />} onClick={() => window.open(certificatePdfUrl(selected.certificateNumber), '_blank')}>
                {t('student.actions.downloadPdf')}
              </Button>
              <Button variant="secondary" icon={<ExternalLink size={16} />} onClick={() => window.open(certificateVerifyUrl(selected.certificateNumber), '_blank')}>
                {t('student.actions.verifyPage')}
              </Button>
              <Button variant="ghost" icon={<Copy size={16} />} onClick={() => copyLink(certificateVerifyUrl(selected.certificateNumber))}>
                {t('student.actions.copyLink')}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
