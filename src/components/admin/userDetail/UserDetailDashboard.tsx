import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock3,
  Download,
  GraduationCap,
  KeyRound,
  Mail,
  MapPin,
  Pencil,
  Phone,
  PlayCircle,
  Shield,
  Star,
  Target,
  Trash2,
  TrendingUp,
  User,
  Wallet,
} from '@/icons';
import { ReportChart } from '../../reports/ReportChart';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { EmptyState } from '../../ui/EmptyState';
import { ProgressBar } from '../../ui/ProgressBar';
import { StatCard } from '../../ui/StatCard';
import {
  accountStatusLabels,
  accountStatusVariant,
  approvalLabels,
  approvalVariant,
  fmtDate,
  fmtMoney,
  formatInterests,
  paymentStatusLabels,
  roleLabels,
  roleVariant,
  subscriptionStatusLabels,
  ticketStatusLabels,
  walletTxLabels,
  withdrawalStatusLabels,
} from '../../../utils/adminFormatters';
import { mediaUrl } from '../../../utils/mediaUrl';
import { AdminDataTable } from './AdminDataTable';
import { UserDetailRadarChart } from './UserDetailRadarChart';
import { buildUserDetailMetrics } from './userDetailMetrics';

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
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={`admin-user-section-card ${className}`.trim()}>
      <div className="admin-user-section-head">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      </div>
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
  const metrics = useMemo(() => buildUserDetailMetrics(data), [data]);

  const paymentRows = useMemo(() => (data.payments || []).map((payment: any) => ({
    id: payment.id,
    item: payment.course?.titleAr || payment.learningPath?.titleAr || '—',
    amount: fmtMoney(Number(payment.finalAmount)),
    status: paymentStatusLabels[payment.status] || payment.status,
    date: fmtDate(payment.createdAt),
    _raw: payment,
  })), [data.payments]);

  const quizRows = useMemo(() => (data.quizAttempts || []).map((attempt: any) => ({
    id: attempt.id,
    quiz: attempt.quiz?.titleAr || '—',
    score: `${Number(attempt.score)}%`,
    result: attempt.isPassed ? 'ناجح' : attempt.completedAt ? 'راسب' : 'قيد التنفيذ',
    date: fmtDate(attempt.completedAt || attempt.startedAt),
    _raw: attempt,
  })), [data.quizAttempts]);

  const walletRows = useMemo(() => (data.wallet?.transactions || []).map((tx: any) => ({
    id: tx.id,
    type: walletTxLabels[tx.type] || tx.type,
    reason: tx.reason || '—',
    amount: fmtMoney(Number(tx.amount)),
    date: fmtDate(tx.createdAt),
    _raw: tx,
  })), [data.wallet?.transactions]);

  const isActive = data.status === 'ACTIVE';

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
              <Badge variant={accountStatusVariant(data.status)} dot className="status-badge">
                {accountStatusLabels[data.status] || data.status}
              </Badge>
              <Badge variant={roleVariant(data.role)} dot className="status-badge">{roleLabels[data.role] || data.role}</Badge>
              {data.instructorProfile?.approvalStatus ? (
                <Badge variant={approvalVariant(data.instructorProfile.approvalStatus)} dot className="status-badge">
                  {approvalLabels[data.instructorProfile.approvalStatus] || data.instructorProfile.approvalStatus}
                </Badge>
              ) : null}
            </div>
            <div className="admin-user-hero-meta">
              <span><strong>#{data.id}</strong></span>
              <span><Mail size={15} /> {data.email}</span>
              <span><Phone size={15} /> <span dir="ltr">{data.phone || '—'}</span></span>
              <span><MapPin size={15} /> {data.preferredLanguage === 'ar' ? 'العربية' : data.preferredLanguage || '—'}</span>
              <span><Calendar size={15} /> انضم {fmtDate(data.createdAt)}</span>
            </div>
          </div>
        </div>
        <div className="admin-user-hero-actions">
          {extraHeroActions}
          <Button variant="outline" size="sm" icon={<Pencil size={16} />} onClick={onEdit}>تعديل</Button>
          {showStatusToggle ? (
            isActive ? (
              <Button variant="secondary" size="sm" icon={<Shield size={16} />} onClick={onSuspend}>إيقاف</Button>
            ) : (
              <Button variant="secondary" size="sm" icon={<CheckCircle2 size={16} />} onClick={onActivate}>تفعيل</Button>
            )
          ) : null}
          <Button variant="outline" size="sm" icon={<KeyRound size={16} />} onClick={onResetPassword}>إعادة كلمة المرور</Button>
          <Button variant="outline" size="sm" icon={<Bell size={16} />} onClick={onSendNotification}>إرسال إشعار</Button>
          <Button variant="danger" size="sm" icon={<Trash2 size={16} />} onClick={onDelete} disabled={deleteDisabled}>حذف</Button>
        </div>
      </Card>

      <div className="admin-user-kpi-grid">
        <StatCard title="إجمالي الدورات" value={String(metrics.kpis.totalCourses)} icon={BookOpen} />
        <StatCard title="مكتملة" value={String(metrics.kpis.completed)} icon={CheckCircle2} />
        <StatCard title="قيد التعلم" value={String(metrics.kpis.inProgress)} icon={PlayCircle} />
        <StatCard title="الشهادات" value={String(metrics.kpis.certificates)} icon={Award} />
        <StatCard title="متوسط الدرجات" value={`${metrics.kpis.avgScore}%`} icon={Star} />
        <StatCard title="نسبة الإكمال" value={`${metrics.kpis.completionPct}%`} icon={Target} />
        <StatCard title="معدل الحضور" value={`${metrics.kpis.avgAttendance}%`} icon={TrendingUp} />
        <StatCard title="ساعات التعلم" value={String(metrics.kpis.learningHours)} icon={Clock3} hint="تقدير من التقدم" />
      </div>

      <div className="admin-user-analytics-grid">
        <ReportChart title="توزيع الدورات" type="pie" data={metrics.learningDonut} height={240} />
        <ReportChart title="التقدم عبر الزمن" type="line" data={metrics.learningProgressLine} height={240} />
        <ReportChart title="الإكمال الشهري" type="area" data={metrics.completionArea} height={240} />
      </div>

      <SectionCard title="أداء الدورات" subtitle="مقارنة نسب الإكمال والدرجات لكل دورة">
        <div className="admin-user-split-grid">
          <ReportChart title="نسب الإكمال" type="bar" data={metrics.courseBarChart} height={Math.max(260, metrics.courseBarChart.length * 42)} />
          <AdminDataTable
            searchPlaceholder="بحث باسم الدورة..."
            searchKeys={['title', 'statusLabel']}
            data={metrics.coursePerformance.map((row) => ({
              id: row.id,
              courseId: row.courseId,
              title: row.title,
              progress: `${row.progress}%`,
              avgScore: row.avgScore != null ? `${row.avgScore}%` : '—',
              statusLabel: row.statusLabel,
              enrolledAt: fmtDate(row.enrolledAt),
              _progress: row.progress,
            }))}
            columns={[
              {
                key: 'title',
                header: 'الدورة',
                render: (row) => row.courseId ? (
                  <Link to={`/admin/courses/${row.courseId}`} className="admin-detail-list-link">
                    {row.title}
                  </Link>
                ) : row.title,
              },
              { key: 'progress', header: 'التقدم', render: (row) => <ProgressBar value={Number((row as any)._progress || 0)} size="sm" /> },
              { key: 'avgScore', header: 'متوسط الدرجة' },
              { key: 'statusLabel', header: 'الحالة' },
              { key: 'enrolledAt', header: 'تاريخ الاشتراك' },
            ]}
            emptyTitle="لا توجد دورات"
          />
        </div>
      </SectionCard>

      <SectionCard title="الاختبارات" subtitle="تحليل الأداء في الاختبارات" className="admin-user-quizzes-section">
        <div className="admin-user-quiz-stats">
          <div className="admin-user-quiz-stat">
            <span>المحاولات</span>
            <strong>{metrics.quizStats.attempts}</strong>
          </div>
          <div className="admin-user-quiz-stat">
            <span>ناجح</span>
            <strong>{metrics.quizStats.passed}</strong>
          </div>
          <div className="admin-user-quiz-stat">
            <span>راسب</span>
            <strong>{metrics.quizStats.failed}</strong>
          </div>
          <div className="admin-user-quiz-stat">
            <span>متوسط الدرجة</span>
            <strong>{metrics.quizStats.avgScore}%</strong>
          </div>
        </div>
        <div className="admin-user-quiz-charts">
          <ReportChart
            title="ملخص الدرجات"
            type="bar"
            data={metrics.quizScoreBar}
            height={metrics.quizScoreBar.length ? Math.max(200, metrics.quizScoreBar.length * 56 + 48) : 200}
            barDomain={[0, 100]}
            hideTotal
          />
          <ReportChart
            title="نتائج الاختبارات"
            type="pie"
            data={metrics.quizDonut}
            height={240}
          />
        </div>
        <AdminDataTable
          compact
          data={quizRows}
          searchKeys={['quiz', 'result']}
          searchPlaceholder="بحث في الاختبارات..."
          columns={[
            { key: 'quiz', header: 'الاختبار' },
            { key: 'score', header: 'الدرجة' },
            { key: 'result', header: 'النتيجة' },
            { key: 'date', header: 'التاريخ' },
          ]}
          emptyTitle="لا توجد محاولات اختبار"
        />
      </SectionCard>

      <div className="admin-user-analytics-grid">
        <SectionCard title="الشهادات" subtitle="الشهادات الصادرة للمستخدم">
          {data.certificates?.length ? (
            <div className="admin-user-cert-grid">
              {data.certificates.map((cert: any) => (
                <article key={cert.id} className="admin-user-cert-card">
                  <div className="admin-user-cert-icon"><Award size={22} /></div>
                  <div>
                    <strong>{cert.course?.titleAr || 'شهادة'}</strong>
                    <p dir="ltr">{cert.certificateNumber}</p>
                    <small>صدرت {fmtDate(cert.issuedAt)}</small>
                  </div>
                  <div className="admin-user-cert-actions">
                    <Badge variant="success">صادرة</Badge>
                    {cert.pdfUrl ? (
                      <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={() => window.open(mediaUrl(cert.pdfUrl), '_blank')}>
                        تحميل
                      </Button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="لا توجد شهادات" description="لم يحصل المستخدم على شهادات بعد." icon={Award} />
          )}
        </SectionCard>
      </div>

      <SectionCard title="المدفوعات والإيرادات" subtitle="ملخص مالي وحركة الدفع">
        <div className="admin-user-payment-stats">
          <StatCard title="إجمالي المدفوع" value={fmtMoney(metrics.payments.totalPaid)} icon={Wallet} />
          <StatCard title="معلق" value={fmtMoney(metrics.payments.pendingPaid)} icon={Clock3} />
          <StatCard title="مسترد" value={fmtMoney(metrics.payments.refunded)} icon={TrendingUp} />
          <StatCard title="الإيراد" value={fmtMoney(metrics.payments.revenue)} icon={Target} />
        </div>
        <div className="admin-user-mini-charts">
          <ReportChart title="المدفوعات الشهرية" type="area" data={metrics.payments.monthlyPayments} height={240} />
          <ReportChart title="حالات الدفع" type="pie" data={metrics.payments.statusPie} height={240} />
        </div>
        <AdminDataTable
          data={paymentRows}
          searchKeys={['item', 'status', 'date']}
          searchPlaceholder="بحث في المدفوعات..."
          columns={[
            { key: 'id', header: '#' },
            { key: 'item', header: 'العنصر' },
            { key: 'amount', header: 'المبلغ' },
            { key: 'status', header: 'الحالة' },
            { key: 'date', header: 'التاريخ' },
          ]}
          emptyTitle="لا توجد مدفوعات"
        />
      </SectionCard>

      <div className="admin-user-analytics-grid">
        <SectionCard title="النشاط والجلسات" subtitle="آخر نشاط مسجّل على الحساب">
          <div className="admin-user-login-panel">
            <div className="admin-user-login-item">
              <span>آخر تحديث</span>
              <strong>{fmtDate(data.updatedAt)}</strong>
            </div>
            <div className="admin-user-login-item">
              <span>تاريخ التسجيل</span>
              <strong>{fmtDate(data.createdAt)}</strong>
            </div>
            <div className="admin-user-login-item">
              <span>اللغة المفضلة</span>
              <strong>{data.preferredLanguage === 'ar' ? 'العربية' : data.preferredLanguage}</strong>
            </div>
            <div className="admin-user-login-item">
              <span>رصيد المحفظة</span>
              <strong>{fmtMoney(metrics.kpis.walletBalance)}</strong>
            </div>
            <div className="admin-user-login-item">
              <span>نقاط المكافآت</span>
              <strong>{metrics.kpis.rewardPoints}</strong>
            </div>
            <div className="admin-user-login-item">
              <span>كود الإحالة</span>
              <strong dir="ltr">{data.referralCode || '—'}</strong>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="الحضور والمشاركة" subtitle="مؤشرات مشاركة تعليمية مستمدة من التقدم">
          <ReportChart title="توزيع المشاركة" type="bar" data={metrics.attendanceBar} height={240} />
        </SectionCard>
      </div>

      <SectionCard
        title="المهارات والاهتمامات"
        subtitle="اهتمامات الطالب وتوزيع النشاط على المنصة"
        className="admin-user-interests-section"
      >
        {data.studentProfile?.educationLevel ? (
          <p className="admin-user-education-level">
            المستوى التعليمي: <strong>{data.studentProfile.educationLevel}</strong>
          </p>
        ) : null}

        {!metrics.interests.length && !metrics.categoryChart.length ? (
          <EmptyState
            title="لا توجد مهارات أو اهتمامات"
            description="لم يُسجَّل للطالب اهتمامات بعد، ولا يوجد نشاط كافٍ لعرض التوزيع."
            icon={Target}
          />
        ) : (
          <div className={`admin-user-interests-layout${metrics.interests.length && metrics.categoryChart.length ? '' : ' is-single'}`}>
            {metrics.interests.length ? (
              <div className="admin-user-interests-panel">
                <h4 className="admin-user-panel-title">اهتمامات الطالب</h4>
                <div className="admin-user-interest-pills">
                  {metrics.interests.map((interest) => (
                    <span key={interest} className="admin-user-interest-pill">{interest}</span>
                  ))}
                </div>
                <UserDetailRadarChart
                  embedded
                  title="خريطة الاهتمامات"
                  data={metrics.skillChart}
                  height={260}
                />
              </div>
            ) : null}

            {metrics.categoryChart.length ? (
              <div className="admin-user-interests-panel">
                <h4 className="admin-user-panel-title">
                  {metrics.interests.length ? 'توزيع النشاط' : 'نشاط المستخدم'}
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

      <SectionCard title="الشارات والإنجازات" subtitle="إنجازات مستمدة من الشهادات والنقاط">
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
          <EmptyState title="لا توجد شارات بعد" description="ستظهر الإنجازات عند إكمال الدورات أو كسب النقاط." icon={Award} />
        )}
      </SectionCard>

      <SectionCard title="الخط الزمني للنشاط" subtitle="أهم الأحداث مرتبة زمنياً">
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
          <EmptyState title="لا يوجد نشاط" description="لم يُسجَّل نشاط على هذا الحساب بعد." icon={Clock3} />
        )}
      </SectionCard>

      {data.role === 'STUDENT' && data.studentProfile ? (
        <SectionCard title="بيانات الطالب">
          <div className="admin-detail-grid">
            <div className="detail-row"><span className="detail-row-label">المستوى التعليمي</span><div className="detail-row-value">{data.studentProfile.educationLevel || '—'}</div></div>
            <div className="detail-row"><span className="detail-row-label">الاهتمامات</span><div className="detail-row-value">{formatInterests(data.studentProfile.interests)}</div></div>
            {data.studentProfile.bio ? (
              <div className="detail-row"><span className="detail-row-label">نبذة</span><div className="detail-row-value">{data.studentProfile.bio}</div></div>
            ) : null}
          </div>
        </SectionCard>
      ) : null}

      {data.role === 'INSTRUCTOR' && data.instructorProfile ? (
        <SectionCard title="بيانات المحاضر">
          <div className="admin-detail-grid">
            <div className="detail-row"><span className="detail-row-label">حالة الاعتماد</span><div className="detail-row-value"><Badge variant={approvalVariant(data.instructorProfile.approvalStatus)}>{approvalLabels[data.instructorProfile.approvalStatus]}</Badge></div></div>
            <div className="detail-row"><span className="detail-row-label">التخصص</span><div className="detail-row-value">{data.instructorProfile.specialization || '—'}</div></div>
            <div className="detail-row"><span className="detail-row-label">المسمى</span><div className="detail-row-value">{data.instructorProfile.title || '—'}</div></div>
            <div className="detail-row"><span className="detail-row-label">سنوات الخبرة</span><div className="detail-row-value">{data.instructorProfile.yearsOfExperience ?? '—'}</div></div>
            <div className="detail-row"><span className="detail-row-label">إجمالي الطلاب</span><div className="detail-row-value">{data.instructorProfile.totalStudents ?? 0}</div></div>
            <div className="detail-row"><span className="detail-row-label">إجمالي الأرباح</span><div className="detail-row-value">{fmtMoney(Number(data.instructorProfile.totalEarnings || 0))}</div></div>
          </div>
        </SectionCard>
      ) : null}

      <div className="admin-user-analytics-grid">
        <SectionCard title={`المسارات التعليمية (${data.learningPathEnrollments?.length ?? 0})`}>
          {data.learningPathEnrollments?.length ? (
            <AdminDataTable
              data={data.learningPathEnrollments.map((row: any) => ({
                id: row.id,
                title: row.learningPath?.titleAr || '—',
                enrolledAt: fmtDate(row.enrolledAt),
              }))}
              searchKeys={['title']}
              columns={[
                { key: 'title', header: 'المسار' },
                { key: 'enrolledAt', header: 'تاريخ الاشتراك' },
              ]}
              emptyTitle="لا توجد مسارات"
            />
          ) : <p className="admin-detail-empty">لا توجد مسارات تعليمية.</p>}
        </SectionCard>

        <SectionCard title={`حركات المحفظة (${data.wallet?.transactions?.length ?? 0})`}>
          <AdminDataTable
            data={walletRows}
            searchKeys={['type', 'reason']}
            columns={[
              { key: 'type', header: 'النوع' },
              { key: 'reason', header: 'السبب' },
              { key: 'amount', header: 'المبلغ' },
              { key: 'date', header: 'التاريخ' },
            ]}
            emptyTitle="لا توجد حركات محفظة"
          />
        </SectionCard>
      </div>

      {data.role === 'INSTRUCTOR' && data.courses?.length ? (
        <SectionCard title={`كورسات المحاضر (${data.courses.length})`}>
          <AdminDataTable
            data={data.courses.map((course: any) => ({
              id: course.id,
              title: course.titleAr,
              students: course.totalStudents ?? 0,
              status: course.status,
              price: fmtMoney(Number(course.price || 0)),
            }))}
            searchKeys={['title', 'status']}
            columns={[
              {
                key: 'title',
                header: 'الدورة',
                render: (row) => (
                  <Link to={`/admin/courses/${row.id}`} className="admin-detail-list-link">{String(row.title)}</Link>
                ),
              },
              { key: 'students', header: 'الطلاب' },
              { key: 'status', header: 'الحالة' },
              { key: 'price', header: 'السعر' },
            ]}
            emptyTitle="لا توجد كورسات"
          />
        </SectionCard>
      ) : null}

      <div className="admin-user-analytics-grid">
        <SectionCard title="الإحالات والمكافآت" className="admin-user-referrals-section">
          <div className="admin-user-quiz-stats admin-user-quiz-stats--pair">
            <div className="admin-user-quiz-stat">
              <span>إحالات قام بها</span>
              <strong>{data._count?.referralsMade ?? 0}</strong>
            </div>
            <div className="admin-user-quiz-stat">
              <span>نقاط المكافآت</span>
              <strong>{data.rewardPoints ?? 0}</strong>
            </div>
          </div>
          {data.referralReceived ? (
            <p className="admin-user-referral-note">أُحيل بواسطة: {data.referralReceived.referrer?.fullName} ({data.referralReceived.referrer?.email})</p>
          ) : null}
          {data.referralsMade?.length ? (
            <AdminDataTable
              data={data.referralsMade.map((ref: any) => ({
                id: ref.id,
                name: ref.referredUser?.fullName || '—',
                email: ref.referredUser?.email || '—',
                points: ref.rewardPoints ?? 0,
                date: fmtDate(ref.createdAt),
              }))}
              searchKeys={['name', 'email']}
              columns={[
                { key: 'name', header: 'المُحال' },
                { key: 'email', header: 'البريد' },
                { key: 'points', header: 'النقاط' },
                { key: 'date', header: 'التاريخ' },
              ]}
              emptyTitle="لا توجد إحالات"
            />
          ) : null}
        </SectionCard>

        <SectionCard title={`تذاكر الدعم (${data.supportTickets?.length ?? 0})`}>
          <AdminDataTable
            data={(data.supportTickets || []).map((ticket: any) => ({
              id: ticket.id,
              subject: ticket.subject,
              status: ticketStatusLabels[ticket.status] || ticket.status,
              replies: ticket._count?.replies ?? 0,
            }))}
            searchKeys={['subject', 'status']}
            columns={[
              { key: 'subject', header: 'الموضوع' },
              { key: 'status', header: 'الحالة' },
              { key: 'replies', header: 'الردود' },
            ]}
            emptyTitle="لا توجد تذاكر دعم"
          />
        </SectionCard>
      </div>

      {data.withdrawals?.length ? (
        <SectionCard title={`طلبات السحب (${data.withdrawals.length})`}>
          <AdminDataTable
            data={data.withdrawals.map((w: any) => ({
              id: w.id,
              amount: fmtMoney(Number(w.amount)),
              bank: w.bankName || '—',
              status: withdrawalStatusLabels[w.status] || w.status,
              date: fmtDate(w.createdAt),
            }))}
            searchKeys={['bank', 'status']}
            columns={[
              { key: 'amount', header: 'المبلغ' },
              { key: 'bank', header: 'البنك' },
              { key: 'status', header: 'الحالة' },
              { key: 'date', header: 'التاريخ' },
            ]}
            emptyTitle="لا توجد طلبات سحب"
          />
        </SectionCard>
      ) : null}

      {data.subscriptions?.length ? (
        <SectionCard title={`الاشتراكات (${data.subscriptions.length})`}>
          <AdminDataTable
            data={data.subscriptions.map((sub: any) => ({
              id: sub.id,
              plan: sub.plan?.nameAr || '—',
              status: subscriptionStatusLabels[sub.status] || sub.status,
            }))}
            searchKeys={['plan', 'status']}
            columns={[
              { key: 'plan', header: 'الخطة' },
              { key: 'status', header: 'الحالة' },
            ]}
            emptyTitle="لا توجد اشتراكات"
          />
        </SectionCard>
      ) : null}

      {data.couponUsages?.length ? (
        <SectionCard title={`استخدام الكوبونات (${data.couponUsages.length})`}>
          <AdminDataTable
            data={data.couponUsages.map((usage: any) => ({
              id: usage.id,
              code: usage.coupon?.code || '—',
              payment: `#${usage.payment?.id}`,
              date: fmtDate(usage.usedAt),
            }))}
            searchKeys={['code']}
            columns={[
              { key: 'code', header: 'الكوبون' },
              { key: 'payment', header: 'الدفعة' },
              { key: 'date', header: 'التاريخ' },
            ]}
            emptyTitle="لا يوجد استخدام للكوبونات"
          />
        </SectionCard>
      ) : null}

      {data.reviews?.length ? (
        <SectionCard title={`التقييمات (${data.reviews.length})`}>
          <AdminDataTable
            data={data.reviews.map((review: any) => ({
              id: review.id,
              course: review.course?.titleAr || '—',
              rating: `${review.rating}/5`,
              date: fmtDate(review.createdAt),
            }))}
            searchKeys={['course']}
            columns={[
              { key: 'course', header: 'الدورة' },
              { key: 'rating', header: 'التقييم' },
              { key: 'date', header: 'التاريخ' },
            ]}
            emptyTitle="لا توجد تقييمات"
          />
        </SectionCard>
      ) : null}

      {data.liveSessions?.length ? (
        <SectionCard title={`الجلسات المباشرة (${data.liveSessions.length})`}>
          <AdminDataTable
            data={data.liveSessions.map((session: any) => ({
              id: session.id,
              title: session.titleAr,
              course: session.course?.titleAr || '—',
              date: fmtDate(session.startAt),
              status: session.status,
            }))}
            searchKeys={['title', 'course']}
            columns={[
              { key: 'title', header: 'الجلسة' },
              { key: 'course', header: 'الدورة' },
              { key: 'date', header: 'الموعد' },
              { key: 'status', header: 'الحالة' },
            ]}
            emptyTitle="لا توجد جلسات"
          />
        </SectionCard>
      ) : null}

      {data.communityPosts?.length ? (
        <SectionCard title={`منشورات المجتمع (${data.communityPosts.length})`}>
          <AdminDataTable
            data={data.communityPosts.map((post: any) => ({
              id: post.id,
              title: post.titleAr,
              comments: post._count?.comments ?? 0,
              date: fmtDate(post.createdAt),
            }))}
            searchKeys={['title']}
            columns={[
              { key: 'title', header: 'العنوان' },
              { key: 'comments', header: 'التعليقات' },
              { key: 'date', header: 'التاريخ' },
            ]}
            emptyTitle="لا توجد منشورات"
          />
        </SectionCard>
      ) : null}

      {data.rewardTransactions?.length ? (
        <SectionCard title="سجل النقاط">
          <AdminDataTable
            data={data.rewardTransactions.map((tx: any) => ({
              id: tx.id,
              reason: tx.reason || '—',
              points: `${tx.points > 0 ? '+' : ''}${tx.points}`,
              date: fmtDate(tx.createdAt),
            }))}
            searchKeys={['reason']}
            columns={[
              { key: 'reason', header: 'السبب' },
              { key: 'points', header: 'النقاط' },
              { key: 'date', header: 'التاريخ' },
            ]}
            emptyTitle="لا يوجد سجل نقاط"
          />
        </SectionCard>
      ) : null}

      <SectionCard title="ملخص الإحصائيات">
        <div className="admin-user-summary-grid">
          {[
            ['اشتراكات كورسات', data._count?.enrollments],
            ['مسارات تعليمية', data._count?.learningPathEnrollments],
            ['كورسات (محاضر)', data._count?.courses],
            ['مدفوعات', data._count?.payments],
            ['شهادات', data._count?.certificates],
            ['اختبارات', data._count?.quizAttempts],
            ['تقييمات', data._count?.reviews],
            ['جلسات مباشرة', data._count?.liveSessions],
            ['تذاكر دعم', data._count?.supportTickets],
            ['إشعارات', data._count?.notifications],
          ].map(([label, value]) => (
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
