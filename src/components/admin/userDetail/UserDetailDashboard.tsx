import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  AccountBalance,
  Award,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock3,
  CoPresent,
  Crown,
  Download,
  Gift,
  GraduationCap,
  Headphones,
  KeyRound,
  LiveTv,
  Mail,
  MapPin,
  MessageCircle,
  PenLine,
  Pencil,
  Phone,
  PlayCircle,
  Receipt,
  Reviews,
  Route,
  Share2,
  Shield,
  Star,
  Target,
  Ticket,
  Trash2,
  TrendingUp,
  User,
  Wallet,
} from '@/icons';
import { useAdminPaymentLabels } from '../../../hooks/useAdminPaymentLabels';
import { useAdminSupportLabels } from '../../../hooks/useAdminSupportLabels';
import { useAdminUserLabels } from '../../../hooks/useAdminUserLabels';
import { useAdminWithdrawalLabels } from '../../../hooks/useAdminWithdrawalLabels';
import { useUserDetailMetrics } from '../../../hooks/useUserDetailMetrics';
import { certificatePdfUrl } from '../../../utils/certificateUrls';
import { mediaUrl } from '../../../utils/mediaUrl';
import { ReportChart } from '../../reports/ReportChart';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { EmptyState } from '../../ui/EmptyState';
import { ProgressBar } from '../../ui/ProgressBar';
import { StatCard } from '../../ui/StatCard';
import { AdminDataTable } from './AdminDataTable';
import { UserDetailRadarChart } from './UserDetailRadarChart';

interface UserDetailDashboardProps {
  data: any;
  onEdit: () => void;
  onSuspend: () => void;
  onActivate: () => void;
  onResetPassword: () => void;
  onSendNotification: () => void;
  onDelete: () => void;
  extraHeroActions?: ReactNode;
  deleteDisabled?: boolean;
  showStatusToggle?: boolean;
}

function SectionCard({
  title,
  subtitle,
  children,
  className = '',
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={`admin-user-section-card ${className}`.trim()}>
      {title ? (
        <div className="admin-user-section-head">
          <div>
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
        </div>
      ) : null}
      {children}
    </Card>
  );
}

export function UserDetailDashboard({
  data,
  onEdit,
  onSuspend,
  onActivate,
  onResetPassword,
  onSendNotification,
  onDelete,
  extraHeroActions,
  deleteDisabled = false,
  showStatusToggle = true,
}: UserDetailDashboardProps) {
  const { t, i18n } = useTranslation('users');
  const lang = i18n.language;
  const {
    fmtDate,
    fmtMoney,
    formatInterests,
    getRoleLabel,
    getStatusLabel,
    getApprovalLabel,
    roleVariant,
    statusVariant,
    approvalVariant,
    empty,
  } = useAdminUserLabels();
  const { getStatusLabel: getPaymentStatusLabel } = useAdminPaymentLabels();
  const { getStatusLabel: getTicketStatusLabel } = useAdminSupportLabels();
  const { getStatusLabel: getWithdrawalStatusLabel } = useAdminWithdrawalLabels();
  const metrics = useUserDetailMetrics(data);
  const { localizedTitle } = metrics;

  const walletTxLabel = (type: string) => (
    t(`admin.detail.walletTx.${type}`, { defaultValue: type })
  );
  const subscriptionStatusLabel = (status: string) => (
    t(`admin.detail.subscriptionStatus.${status}`, { defaultValue: status })
  );
  const planName = (plan: { nameAr?: string; nameEn?: string } | null | undefined) => {
    if (!plan) return empty;
    if (lang === 'en') return plan.nameEn || plan.nameAr || empty;
    return plan.nameAr || plan.nameEn || empty;
  };

  const paymentRows = useMemo(() => (data.payments || []).map((payment: any) => ({
    id: payment.id,
    item: localizedTitle(payment.course) !== empty
      ? localizedTitle(payment.course)
      : localizedTitle(payment.learningPath),
    amount: fmtMoney(Number(payment.finalAmount)),
    status: getPaymentStatusLabel(payment.status),
    date: fmtDate(payment.createdAt),
    _raw: payment,
  })), [data.payments, localizedTitle, fmtMoney, fmtDate, getPaymentStatusLabel, empty]);

  const quizRows = useMemo(() => (data.quizAttempts || []).map((attempt: any) => ({
    id: attempt.id,
    quiz: localizedTitle(attempt.quiz),
    score: `${Number(attempt.score)}%`,
    result: attempt.isPassed
      ? t('admin.detail.quizResult.passed')
      : attempt.completedAt
        ? t('admin.detail.quizResult.failed')
        : t('admin.detail.quizResult.inProgress'),
    date: fmtDate(attempt.completedAt || attempt.startedAt),
    _raw: attempt,
  })), [data.quizAttempts, localizedTitle, fmtDate, t]);

  const walletRows = useMemo(() => (data.wallet?.transactions || []).map((tx: any) => ({
    id: tx.id,
    type: walletTxLabel(tx.type),
    reason: tx.reason || empty,
    amount: fmtMoney(Number(tx.amount)),
    date: fmtDate(tx.createdAt),
    _raw: tx,
  })), [data.wallet?.transactions, fmtMoney, fmtDate, empty, lang]);

  const preferredLanguageLabel = data.preferredLanguage === 'ar'
    ? t('admin.detail.preferredLanguage.ar')
    : data.preferredLanguage === 'en'
      ? t('admin.detail.preferredLanguage.en')
      : data.preferredLanguage || empty;

  const isActive = data.status === 'ACTIVE';
  const cols = 'admin.detail.tables.columns';

  const summaryItems = [
    [t('admin.detail.summary.courseEnrollments'), data._count?.enrollments],
    [t('admin.detail.summary.learningPaths'), data._count?.learningPathEnrollments],
    [t('admin.detail.summary.instructorCourses'), data._count?.courses],
    [t('admin.detail.summary.payments'), data._count?.payments],
    [t('admin.detail.summary.certificates'), data._count?.certificates],
    [t('admin.detail.summary.quizzes'), data._count?.quizAttempts],
    [t('admin.detail.summary.reviews'), data._count?.reviews],
    [t('admin.detail.summary.liveSessions'), data._count?.liveSessions],
    [t('admin.detail.summary.supportTickets'), data._count?.supportTickets],
    [t('admin.detail.summary.notifications'), data._count?.notifications],
  ] as const;

  return (
    <div className="admin-user-dashboard">
      <Card className="admin-user-hero">
        <div className="admin-user-hero-body">
          <div className="admin-user-hero-avatar">
            {data.avatar ? (
              <img src={mediaUrl(data.avatar)} alt="" />
            ) : (
              <span><User size={34} /></span>
            )}
          </div>
          <div className="admin-user-hero-copy">
            <div className="admin-user-hero-title-row">
              <h1>{data.fullName}</h1>
              <Badge variant={statusVariant(data.status)} dot className="status-badge">
                {getStatusLabel(data.status)}
              </Badge>
              <Badge variant={roleVariant(data.role)} dot className="status-badge">
                {getRoleLabel(data.role)}
              </Badge>
              {data.instructorProfile?.approvalStatus ? (
                <Badge variant={approvalVariant(data.instructorProfile.approvalStatus)} dot className="status-badge">
                  {getApprovalLabel(data.instructorProfile.approvalStatus)}
                </Badge>
              ) : null}
            </div>
            <div className="admin-user-hero-meta">
              <span><strong>#{data.id}</strong></span>
              <span><Mail size={15} /> {data.email}</span>
              <span><Phone size={15} /> <span dir="ltr">{data.phone || empty}</span></span>
              <span><MapPin size={15} /> {preferredLanguageLabel}</span>
              <span><Calendar size={15} /> {t('admin.detail.hero.joined', { date: fmtDate(data.createdAt) })}</span>
            </div>
          </div>
        </div>
        <div className="admin-user-hero-actions">
          {extraHeroActions}
          <Button variant="outline" size="sm" icon={<Pencil size={16} />} onClick={onEdit}>{t('actions.edit')}</Button>
          {showStatusToggle ? (
            isActive ? (
              <Button variant="secondary" size="sm" icon={<Shield size={16} />} onClick={onSuspend}>{t('actions.suspend')}</Button>
            ) : (
              <Button variant="secondary" size="sm" icon={<CheckCircle2 size={16} />} onClick={onActivate}>{t('actions.activate')}</Button>
            )
          ) : null}
          <Button variant="outline" size="sm" icon={<KeyRound size={16} />} onClick={onResetPassword}>{t('admin.detail.hero.resetPassword')}</Button>
          <Button variant="outline" size="sm" icon={<Bell size={16} />} onClick={onSendNotification}>{t('admin.detail.hero.sendNotification')}</Button>
          <Button variant="danger" size="sm" icon={<Trash2 size={16} />} onClick={onDelete} disabled={deleteDisabled}>{t('actions.delete')}</Button>
        </div>
      </Card>

      <div className="admin-user-kpi-grid">
        <StatCard title={t('admin.detail.kpis.totalCourses')} value={String(metrics.kpis.totalCourses)} icon={BookOpen} />
        <StatCard title={t('admin.detail.kpis.completed')} value={String(metrics.kpis.completed)} icon={CheckCircle2} />
        <StatCard title={t('admin.detail.kpis.inProgress')} value={String(metrics.kpis.inProgress)} icon={PlayCircle} />
        <StatCard title={t('admin.detail.kpis.certificates')} value={String(metrics.kpis.certificates)} icon={Award} />
        <StatCard title={t('admin.detail.kpis.avgScore')} value={`${metrics.kpis.avgScore}%`} icon={Star} />
        <StatCard title={t('admin.detail.kpis.completionPct')} value={`${metrics.kpis.completionPct}%`} icon={Target} />
        <StatCard title={t('admin.detail.kpis.avgAttendance')} value={`${metrics.kpis.avgAttendance}%`} icon={TrendingUp} />
        <StatCard title={t('admin.detail.kpis.learningHours')} value={String(metrics.kpis.learningHours)} icon={Clock3} hint={t('admin.detail.kpis.learningHoursHint')} />
      </div>

      <div className="admin-user-analytics-grid">
        <ReportChart title={t('admin.detail.charts.courseDistribution')} type="pie" data={metrics.learningDonut} height={240} />
        <ReportChart title={t('admin.detail.charts.progressOverTime')} type="line" data={metrics.learningProgressLine} height={240} />
        <ReportChart title={t('admin.detail.charts.monthlyCompletion')} type="area" data={metrics.completionArea} height={240} />
      </div>

      <SectionCard title={t('admin.detail.sections.coursePerformance.title')} subtitle={t('admin.detail.sections.coursePerformance.subtitle')}>
        <div className="admin-user-split-grid">
          <ReportChart title={t('admin.detail.charts.completionRates')} type="bar" data={metrics.courseBarChart} height={Math.max(260, metrics.courseBarChart.length * 42)} hideTotal />
          <AdminDataTable
            title={t('admin.detail.tables.courses')}
            icon={BookOpen}
            layout="split"
            searchPlaceholder={t('admin.detail.tables.coursesSearch')}
            searchKeys={['title', 'statusLabel']}
            data={metrics.coursePerformance.map((row) => ({
              id: row.id,
              courseId: row.courseId,
              title: row.title,
              progress: `${row.progress}%`,
              avgScore: row.avgScore != null ? `${row.avgScore}%` : empty,
              statusLabel: row.statusLabel,
              enrolledAt: fmtDate(row.enrolledAt),
              _progress: row.progress,
            }))}
            columns={[
              {
                key: 'title',
                header: t(`${cols}.course`),
                minWidth: '10rem',
                truncate: false,
                render: (row) => row.courseId ? (
                  <Link to={`/admin/courses/${row.courseId}`} className="admin-detail-list-link">
                    {row.title}
                  </Link>
                ) : row.title,
              },
              { key: 'progress', header: t(`${cols}.progress`), width: '7rem', align: 'center', render: (row) => <ProgressBar value={Number((row as any)._progress || 0)} size="sm" /> },
              { key: 'avgScore', header: t(`${cols}.avgScore`), width: '7rem', align: 'center' },
              { key: 'statusLabel', header: t(`${cols}.status`), width: '6.5rem', align: 'center' },
              { key: 'enrolledAt', header: t(`${cols}.enrolledAt`), width: '8rem', align: 'center' },
            ]}
            emptyTitle={t('admin.detail.tables.coursesEmpty')}
          />
        </div>
      </SectionCard>

      <SectionCard title={t('admin.detail.sections.quizzes.title')} subtitle={t('admin.detail.sections.quizzes.subtitle')} className="admin-user-quizzes-section">
        <div className="admin-user-quiz-stats">
          <div className="admin-user-quiz-stat">
            <span>{t('admin.detail.quizStats.attempts')}</span>
            <strong>{metrics.quizStats.attempts}</strong>
          </div>
          <div className="admin-user-quiz-stat">
            <span>{t('admin.detail.quizStats.passed')}</span>
            <strong>{metrics.quizStats.passed}</strong>
          </div>
          <div className="admin-user-quiz-stat">
            <span>{t('admin.detail.quizStats.failed')}</span>
            <strong>{metrics.quizStats.failed}</strong>
          </div>
          <div className="admin-user-quiz-stat">
            <span>{t('admin.detail.quizStats.avgScore')}</span>
            <strong>{metrics.quizStats.avgScore}%</strong>
          </div>
        </div>
        <div className="admin-user-quiz-charts">
          <ReportChart
            title={t('admin.detail.charts.scoreSummary')}
            type="bar"
            data={metrics.quizScoreBar}
            height={metrics.quizScoreBar.length ? Math.max(200, metrics.quizScoreBar.length * 56 + 48) : 200}
            barDomain={[0, 100]}
            hideTotal
          />
          <ReportChart
            title={t('admin.detail.charts.quizResults')}
            type="pie"
            data={metrics.quizDonut}
            height={240}
          />
        </div>
        <AdminDataTable
          title={t('admin.detail.tables.quizLog')}
          icon={PenLine}
          compact
          data={quizRows}
          searchKeys={['quiz', 'result']}
          searchPlaceholder={t('admin.detail.tables.quizSearch')}
          columns={[
            { key: 'quiz', header: t(`${cols}.quiz`), minWidth: '9rem', truncate: false },
            { key: 'score', header: t(`${cols}.score`), width: '5.5rem', align: 'center' },
            { key: 'result', header: t(`${cols}.result`), width: '6.5rem', align: 'center' },
            { key: 'date', header: t(`${cols}.date`), width: '7.5rem', align: 'center' },
          ]}
          emptyTitle={t('admin.detail.tables.quizEmpty')}
        />
      </SectionCard>

      <div className="admin-user-analytics-grid">
        <SectionCard title={t('admin.detail.sections.certificates.title')} subtitle={t('admin.detail.sections.certificates.subtitle')}>
          {data.certificates?.length ? (
            <div className="admin-user-cert-grid">
              {data.certificates.map((cert: any) => (
                <article key={cert.id} className="admin-user-cert-card">
                  <div className="admin-user-cert-icon"><Award size={22} /></div>
                  <div>
                    <strong>{localizedTitle(cert.course) !== empty ? localizedTitle(cert.course) : t('admin.detail.certificates.defaultTitle')}</strong>
                    <p dir="ltr">{cert.certificateNumber}</p>
                    <small>{t('admin.detail.certificates.issued', { date: fmtDate(cert.issuedAt) })}</small>
                  </div>
                  <div className="admin-user-cert-actions">
                    <Badge variant="success">{t('admin.detail.certificates.issuedBadge')}</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Download size={14} />}
                      onClick={() => window.open(certificatePdfUrl(cert.certificateNumber), '_blank')}
                    >
                      {t('admin.detail.certificates.download')}
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title={t('admin.detail.certificates.emptyTitle')} description={t('admin.detail.certificates.emptyDescription')} icon={Award} />
          )}
        </SectionCard>
      </div>

      <SectionCard title={t('admin.detail.sections.payments.title')} subtitle={t('admin.detail.sections.payments.subtitle')}>
        <div className="admin-user-payment-stats">
          <StatCard title={t('admin.detail.paymentKpis.totalPaid')} value={fmtMoney(metrics.payments.totalPaid)} icon={Wallet} />
          <StatCard title={t('admin.detail.paymentKpis.pending')} value={fmtMoney(metrics.payments.pendingPaid)} icon={Clock3} />
          <StatCard title={t('admin.detail.paymentKpis.refunded')} value={fmtMoney(metrics.payments.refunded)} icon={TrendingUp} />
          <StatCard title={t('admin.detail.paymentKpis.revenue')} value={fmtMoney(metrics.payments.revenue)} icon={Target} />
        </div>
        <div className="admin-user-mini-charts">
          <ReportChart title={t('admin.detail.charts.monthlyPayments')} type="area" data={metrics.payments.monthlyPayments} height={240} />
          <ReportChart title={t('admin.detail.charts.paymentStatus')} type="pie" data={metrics.payments.statusPie} height={240} />
        </div>
        <AdminDataTable
          title={t('admin.detail.tables.paymentsLog')}
          icon={Wallet}
          data={paymentRows}
          searchKeys={['item', 'status', 'date']}
          searchPlaceholder={t('admin.detail.tables.paymentsSearch')}
          columns={[
            { key: 'id', header: t(`${cols}.id`), width: '3.5rem', align: 'center' },
            { key: 'item', header: t(`${cols}.item`), minWidth: '9rem', truncate: false },
            { key: 'amount', header: t(`${cols}.amount`), width: '6.5rem', align: 'center' },
            { key: 'status', header: t(`${cols}.status`), width: '6rem', align: 'center' },
            { key: 'date', header: t(`${cols}.date`), width: '7.5rem', align: 'center' },
          ]}
          emptyTitle={t('admin.detail.tables.paymentsEmpty')}
        />
      </SectionCard>

      <div className="admin-user-analytics-grid">
        <SectionCard title={t('admin.detail.sections.activity.title')} subtitle={t('admin.detail.sections.activity.subtitle')}>
          <div className="admin-user-login-panel">
            <div className="admin-user-login-item">
              <span>{t('admin.detail.activityPanel.lastUpdated')}</span>
              <strong>{fmtDate(data.updatedAt)}</strong>
            </div>
            <div className="admin-user-login-item">
              <span>{t('admin.detail.activityPanel.registeredAt')}</span>
              <strong>{fmtDate(data.createdAt)}</strong>
            </div>
            <div className="admin-user-login-item">
              <span>{t('admin.detail.activityPanel.preferredLanguage')}</span>
              <strong>{preferredLanguageLabel}</strong>
            </div>
            <div className="admin-user-login-item">
              <span>{t('admin.detail.activityPanel.walletBalance')}</span>
              <strong>{fmtMoney(metrics.kpis.walletBalance)}</strong>
            </div>
            <div className="admin-user-login-item">
              <span>{t('admin.detail.activityPanel.rewardPoints')}</span>
              <strong>{metrics.kpis.rewardPoints}</strong>
            </div>
            <div className="admin-user-login-item">
              <span>{t('admin.detail.activityPanel.referralCode')}</span>
              <strong dir="ltr">{data.referralCode || empty}</strong>
            </div>
          </div>
        </SectionCard>

        <SectionCard title={t('admin.detail.sections.attendance.title')} subtitle={t('admin.detail.sections.attendance.subtitle')}>
          <ReportChart title={t('admin.detail.charts.participationDistribution')} type="bar" data={metrics.attendanceBar} height={240} />
        </SectionCard>
      </div>

      <SectionCard
        title={t('admin.detail.sections.skills.title')}
        subtitle={t('admin.detail.sections.skills.subtitle')}
        className="admin-user-interests-section"
      >
        {data.studentProfile?.educationLevel ? (
          <p className="admin-user-education-level">
            {t('admin.detail.skills.educationLevel', { level: data.studentProfile.educationLevel })}
          </p>
        ) : null}

        {!metrics.interests.length && !metrics.categoryChart.length ? (
          <EmptyState
            title={t('admin.detail.skills.emptyTitle')}
            description={t('admin.detail.skills.emptyDescription')}
            icon={Target}
          />
        ) : (
          <div className={`admin-user-interests-layout${metrics.interests.length && metrics.categoryChart.length ? '' : ' is-single'}`}>
            {metrics.interests.length ? (
              <div className="admin-user-interests-panel">
                <h4 className="admin-user-panel-title">{t('admin.detail.skills.studentInterests')}</h4>
                <div className="admin-user-interest-pills">
                  {metrics.interests.map((interest) => (
                    <span key={interest} className="admin-user-interest-pill">{interest}</span>
                  ))}
                </div>
                <UserDetailRadarChart
                  embedded
                  title={t('admin.detail.charts.interestsMap')}
                  data={metrics.skillChart}
                  height={260}
                />
              </div>
            ) : null}

            {metrics.categoryChart.length ? (
              <div className="admin-user-interests-panel">
                <h4 className="admin-user-panel-title">
                  {metrics.interests.length ? t('admin.detail.skills.activityDistribution') : t('admin.detail.skills.userActivity')}
                </h4>
                <ReportChart
                  embedded
                  title=""
                  type="pie"
                  data={metrics.categoryChart}
                  height={260}
                  hideTotal
                />
              </div>
            ) : null}
          </div>
        )}
      </SectionCard>

      <SectionCard title={t('admin.detail.sections.badges.title')} subtitle={t('admin.detail.sections.badges.subtitle')}>
        {metrics.badges.length ? (
          <div className="admin-user-badge-grid">
            {metrics.badges.map((badge) => (
              <article key={badge.id} className="admin-user-badge-card">
                <span className="admin-user-badge-icon"><GraduationCap size={20} /></span>
                <strong>{badge.title}</strong>
                <p>{badge.subtitle}</p>
                <small>{fmtDate(badge.date)}</small>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title={t('admin.detail.badges.emptyTitle')} description={t('admin.detail.badges.emptyDescription')} icon={Award} />
        )}
      </SectionCard>

      <SectionCard title={t('admin.detail.sections.timeline.title')} subtitle={t('admin.detail.sections.timeline.subtitle')}>
        {metrics.timeline.length ? (
          <ol className="admin-user-timeline">
            {metrics.timeline.map((event) => (
              <li key={event.id} className={`admin-user-timeline-item tone-${event.tone}`}>
                <span className="admin-user-timeline-dot" aria-hidden="true" />
                <div>
                  <strong>{event.title}</strong>
                  {event.description ? <p>{event.description}</p> : null}
                  <small>{fmtDate(event.date)}</small>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState title={t('admin.detail.timeline.emptyTitle')} description={t('admin.detail.timeline.emptyDescription')} icon={Clock3} />
        )}
      </SectionCard>

      {data.role === 'STUDENT' && data.studentProfile ? (
        <SectionCard title={t('admin.detail.sections.studentProfile')}>
          <div className="admin-detail-grid">
            <div className="detail-row"><span className="detail-row-label">{t('admin.detail.profiles.educationLevel')}</span><div className="detail-row-value">{data.studentProfile.educationLevel || empty}</div></div>
            <div className="detail-row"><span className="detail-row-label">{t('admin.detail.profiles.interests')}</span><div className="detail-row-value">{formatInterests(data.studentProfile.interests)}</div></div>
            {data.studentProfile.bio ? (
              <div className="detail-row"><span className="detail-row-label">{t('admin.detail.profiles.bio')}</span><div className="detail-row-value">{data.studentProfile.bio}</div></div>
            ) : null}
          </div>
        </SectionCard>
      ) : null}

      {data.role === 'INSTRUCTOR' && data.instructorProfile ? (
        <SectionCard title={t('admin.detail.sections.instructorProfile')}>
          <div className="admin-detail-grid">
            <div className="detail-row"><span className="detail-row-label">{t('admin.detail.profiles.approvalStatus')}</span><div className="detail-row-value"><Badge variant={approvalVariant(data.instructorProfile.approvalStatus)}>{getApprovalLabel(data.instructorProfile.approvalStatus)}</Badge></div></div>
            <div className="detail-row"><span className="detail-row-label">{t('admin.detail.profiles.specialization')}</span><div className="detail-row-value">{data.instructorProfile.specialization || empty}</div></div>
            <div className="detail-row"><span className="detail-row-label">{t('admin.detail.profiles.title')}</span><div className="detail-row-value">{data.instructorProfile.title || empty}</div></div>
            <div className="detail-row"><span className="detail-row-label">{t('admin.detail.profiles.yearsOfExperience')}</span><div className="detail-row-value">{data.instructorProfile.yearsOfExperience ?? empty}</div></div>
            <div className="detail-row"><span className="detail-row-label">{t('admin.detail.profiles.totalStudents')}</span><div className="detail-row-value">{data.instructorProfile.totalStudents ?? 0}</div></div>
            <div className="detail-row"><span className="detail-row-label">{t('admin.detail.profiles.totalEarnings')}</span><div className="detail-row-value">{fmtMoney(Number(data.instructorProfile.totalEarnings || 0))}</div></div>
          </div>
        </SectionCard>
      ) : null}

      <div className="admin-user-analytics-grid">
        <SectionCard>
          <AdminDataTable
            title={t('admin.detail.tables.learningPathsTitle', { count: data.learningPathEnrollments?.length ?? 0 })}
            icon={Route}
            data={(data.learningPathEnrollments || []).map((row: any) => ({
              id: row.id,
              title: localizedTitle(row.learningPath),
              enrolledAt: fmtDate(row.enrolledAt),
            }))}
            searchKeys={['title']}
            searchPlaceholder={t('admin.detail.tables.learningPathsSearch')}
            columns={[
              { key: 'title', header: t(`${cols}.path`), minWidth: '10rem', truncate: false },
              { key: 'enrolledAt', header: t(`${cols}.enrolledAt`), width: '8rem', align: 'center' },
            ]}
            emptyTitle={t('admin.detail.tables.learningPathsEmpty')}
          />
        </SectionCard>

        <SectionCard>
          <AdminDataTable
            title={t('admin.detail.tables.walletTxTitle', { count: data.wallet?.transactions?.length ?? 0 })}
            icon={Receipt}
            data={walletRows}
            searchKeys={['type', 'reason']}
            searchPlaceholder={t('admin.detail.tables.walletTxSearch')}
            columns={[
              { key: 'type', header: t(`${cols}.type`), width: '6.5rem', align: 'center' },
              { key: 'reason', header: t(`${cols}.reason`), minWidth: '9rem', truncate: false },
              { key: 'amount', header: t(`${cols}.amount`), width: '6.5rem', align: 'center' },
              { key: 'date', header: t(`${cols}.date`), width: '7.5rem', align: 'center' },
            ]}
            emptyTitle={t('admin.detail.tables.walletTxEmpty')}
          />
        </SectionCard>
      </div>

      {data.role === 'INSTRUCTOR' && data.courses?.length ? (
        <SectionCard>
          <AdminDataTable
            title={t('admin.detail.tables.instructorCoursesTitle', { count: data.courses.length })}
            icon={CoPresent}
            data={data.courses.map((course: any) => ({
              id: course.id,
              title: localizedTitle(course),
              students: course.totalStudents ?? 0,
              status: course.status,
              price: fmtMoney(Number(course.price || 0)),
            }))}
            searchKeys={['title', 'status']}
            columns={[
              {
                key: 'title',
                header: t(`${cols}.course`),
                render: (row) => (
                  <Link to={`/admin/courses/${row.id}`} className="admin-detail-list-link">{String(row.title)}</Link>
                ),
              },
              { key: 'students', header: t(`${cols}.students`) },
              { key: 'status', header: t(`${cols}.status`) },
              { key: 'price', header: t(`${cols}.price`) },
            ]}
            emptyTitle={t('admin.detail.tables.instructorCoursesEmpty')}
          />
        </SectionCard>
      ) : null}

      <div className="admin-user-analytics-grid">
        <SectionCard title={t('admin.detail.sections.referrals')} className="admin-user-referrals-section">
          <div className="admin-user-quiz-stats admin-user-quiz-stats--pair">
            <div className="admin-user-quiz-stat">
              <span>{t('admin.detail.referrals.made')}</span>
              <strong>{data._count?.referralsMade ?? 0}</strong>
            </div>
            <div className="admin-user-quiz-stat">
              <span>{t('admin.detail.referrals.rewardPoints')}</span>
              <strong>{data.rewardPoints ?? 0}</strong>
            </div>
          </div>
          {data.referralReceived ? (
            <p className="admin-user-referral-note">
              {t('admin.detail.referrals.referredBy', {
                name: data.referralReceived.referrer?.fullName,
                email: data.referralReceived.referrer?.email,
              })}
            </p>
          ) : null}
          {data.referralsMade?.length ? (
            <AdminDataTable
              title={t('admin.detail.tables.referrals')}
              icon={Share2}
              data={data.referralsMade.map((ref: any) => ({
                id: ref.id,
                name: ref.referredUser?.fullName || empty,
                email: ref.referredUser?.email || empty,
                points: ref.rewardPoints ?? 0,
                date: fmtDate(ref.createdAt),
              }))}
              searchKeys={['name', 'email']}
              columns={[
                { key: 'name', header: t(`${cols}.referred`) },
                { key: 'email', header: t(`${cols}.email`) },
                { key: 'points', header: t(`${cols}.points`) },
                { key: 'date', header: t(`${cols}.date`) },
              ]}
              emptyTitle={t('admin.detail.tables.referralsEmpty')}
            />
          ) : null}
        </SectionCard>

        <SectionCard>
          <AdminDataTable
            title={t('admin.detail.tables.supportTicketsTitle', { count: data.supportTickets?.length ?? 0 })}
            icon={Headphones}
            data={(data.supportTickets || []).map((ticket: any) => ({
              id: ticket.id,
              subject: ticket.subject,
              status: getTicketStatusLabel(ticket.status),
              replies: ticket._count?.replies ?? 0,
            }))}
            searchKeys={['subject', 'status']}
            columns={[
              { key: 'subject', header: t(`${cols}.subject`) },
              { key: 'status', header: t(`${cols}.status`) },
              { key: 'replies', header: t(`${cols}.replies`) },
            ]}
            emptyTitle={t('admin.detail.tables.supportTicketsEmpty')}
          />
        </SectionCard>
      </div>

      {data.withdrawals?.length ? (
        <SectionCard>
          <AdminDataTable
            title={t('admin.detail.tables.withdrawalsTitle', { count: data.withdrawals.length })}
            icon={AccountBalance}
            data={data.withdrawals.map((w: any) => ({
              id: w.id,
              amount: fmtMoney(Number(w.amount)),
              phone: w.phone || empty,
              transferType: t(`admin.labels.transferTypes.${w.transferType}`, { ns: 'withdrawals', defaultValue: w.transferType || empty }),
              status: getWithdrawalStatusLabel(w.status),
              date: fmtDate(w.createdAt),
            }))}
            searchKeys={['phone', 'transferType', 'status']}
            columns={[
              { key: 'amount', header: t(`${cols}.amount`) },
              { key: 'phone', header: t(`${cols}.phone`) },
              { key: 'transferType', header: t(`${cols}.transferType`) },
              { key: 'status', header: t(`${cols}.status`) },
              { key: 'date', header: t(`${cols}.date`) },
            ]}
            emptyTitle={t('admin.detail.tables.withdrawalsEmpty')}
          />
        </SectionCard>
      ) : null}

      {data.subscriptions?.length ? (
        <SectionCard>
          <AdminDataTable
            title={t('admin.detail.tables.subscriptionsTitle', { count: data.subscriptions.length })}
            icon={Crown}
            data={data.subscriptions.map((sub: any) => ({
              id: sub.id,
              plan: planName(sub.plan),
              status: subscriptionStatusLabel(sub.status),
            }))}
            searchKeys={['plan', 'status']}
            columns={[
              { key: 'plan', header: t(`${cols}.plan`) },
              { key: 'status', header: t(`${cols}.status`) },
            ]}
            emptyTitle={t('admin.detail.tables.subscriptionsEmpty')}
          />
        </SectionCard>
      ) : null}

      {data.couponUsages?.length ? (
        <SectionCard>
          <AdminDataTable
            title={t('admin.detail.tables.couponUsagesTitle', { count: data.couponUsages.length })}
            icon={Ticket}
            data={data.couponUsages.map((usage: any) => ({
              id: usage.id,
              code: usage.coupon?.code || empty,
              payment: `#${usage.payment?.id}`,
              date: fmtDate(usage.usedAt),
            }))}
            searchKeys={['code']}
            columns={[
              { key: 'code', header: t(`${cols}.coupon`) },
              { key: 'payment', header: t(`${cols}.payment`) },
              { key: 'date', header: t(`${cols}.date`) },
            ]}
            emptyTitle={t('admin.detail.tables.couponUsagesEmpty')}
          />
        </SectionCard>
      ) : null}

      {data.reviews?.length ? (
        <SectionCard>
          <AdminDataTable
            title={t('admin.detail.tables.reviewsTitle', { count: data.reviews.length })}
            icon={Reviews}
            data={data.reviews.map((review: any) => ({
              id: review.id,
              course: localizedTitle(review.course),
              rating: `${review.rating}/5`,
              date: fmtDate(review.createdAt),
            }))}
            searchKeys={['course']}
            columns={[
              { key: 'course', header: t(`${cols}.course`) },
              { key: 'rating', header: t(`${cols}.rating`) },
              { key: 'date', header: t(`${cols}.date`) },
            ]}
            emptyTitle={t('admin.detail.tables.reviewsEmpty')}
          />
        </SectionCard>
      ) : null}

      {data.liveSessions?.length ? (
        <SectionCard>
          <AdminDataTable
            title={t('admin.detail.tables.liveSessionsTitle', { count: data.liveSessions.length })}
            icon={LiveTv}
            data={data.liveSessions.map((session: any) => ({
              id: session.id,
              title: localizedTitle(session),
              course: localizedTitle(session.course),
              date: fmtDate(session.startAt),
              status: session.status,
            }))}
            searchKeys={['title', 'course']}
            columns={[
              { key: 'title', header: t(`${cols}.session`) },
              { key: 'course', header: t(`${cols}.course`) },
              { key: 'date', header: t(`${cols}.appointment`) },
              { key: 'status', header: t(`${cols}.status`) },
            ]}
            emptyTitle={t('admin.detail.tables.liveSessionsEmpty')}
          />
        </SectionCard>
      ) : null}

      {data.communityPosts?.length ? (
        <SectionCard>
          <AdminDataTable
            title={t('admin.detail.tables.communityPostsTitle', { count: data.communityPosts.length })}
            icon={MessageCircle}
            data={data.communityPosts.map((post: any) => ({
              id: post.id,
              title: localizedTitle(post),
              comments: post._count?.comments ?? 0,
              date: fmtDate(post.createdAt),
            }))}
            searchKeys={['title']}
            columns={[
              { key: 'title', header: t(`${cols}.title`) },
              { key: 'comments', header: t(`${cols}.comments`) },
              { key: 'date', header: t(`${cols}.date`) },
            ]}
            emptyTitle={t('admin.detail.tables.communityPostsEmpty')}
          />
        </SectionCard>
      ) : null}

      {data.rewardTransactions?.length ? (
        <SectionCard>
          <AdminDataTable
            title={t('admin.detail.tables.rewardTxTitle', { count: data.rewardTransactions.length })}
            icon={Gift}
            data={data.rewardTransactions.map((tx: any) => ({
              id: tx.id,
              reason: tx.reason || empty,
              points: `${tx.points > 0 ? '+' : ''}${tx.points}`,
              date: fmtDate(tx.createdAt),
            }))}
            searchKeys={['reason']}
            columns={[
              { key: 'reason', header: t(`${cols}.reason`) },
              { key: 'points', header: t(`${cols}.points`) },
              { key: 'date', header: t(`${cols}.date`) },
            ]}
            emptyTitle={t('admin.detail.tables.rewardTxEmpty')}
          />
        </SectionCard>
      ) : null}

      <SectionCard title={t('admin.detail.sections.statsSummary')}>
        <div className="admin-user-summary-grid">
          {summaryItems.map(([label, value]) => (
            <div key={String(label)} className="admin-user-summary-item">
              <span>{label}</span>
              <strong>{value ?? 0}</strong>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
