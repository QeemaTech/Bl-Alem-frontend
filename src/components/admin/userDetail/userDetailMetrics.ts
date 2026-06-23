import type { ChartItem } from '../../reports/ReportChart';

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description?: string;
  tone: 'primary' | 'success' | 'warning' | 'muted';
}

export interface CoursePerformanceRow {
  id: number;
  title: string;
  progress: number;
  avgScore: number | null;
  status: string;
  statusLabel: string;
  enrolledAt: string;
  completedAt?: string | null;
  courseId?: number;
}

const monthKey = (value: string) => {
  const date = new Date(value);
  return {
    label: date.toLocaleDateString('ar-SA', { month: 'short', year: '2-digit' }),
    ts: new Date(date.getFullYear(), date.getMonth(), 1).getTime(),
  };
};

const groupByMonth = (items: any[], dateKey: string): ChartItem[] => {
  const map = new Map<string, { value: number; ts: number }>();
  items.forEach((item) => {
    const raw = item?.[dateKey];
    if (!raw) return;
    const { label, ts } = monthKey(raw);
    const prev = map.get(label);
    map.set(label, { value: (prev?.value || 0) + 1, ts });
  });
  return Array.from(map.entries())
    .sort((a, b) => a[1].ts - b[1].ts)
    .map(([label, row]) => ({ label, value: row.value }));
};

const parseInterests = (interests: unknown): string[] => {
  if (!interests) return [];
  if (Array.isArray(interests)) return interests.map(String).filter(Boolean);
  if (typeof interests === 'object' && interests !== null) {
    return Object.values(interests as Record<string, unknown>).map(String).filter(Boolean);
  }
  return String(interests).split(/[,،]/).map((s) => s.trim()).filter(Boolean);
};

const enrollmentBucket = (enrollment: any) => {
  const progress = Number(enrollment.progressPercentage || 0);
  if (enrollment.status === 'COMPLETED' || progress >= 100) return 'completed';
  if (enrollment.status === 'CANCELLED') return 'cancelled';
  if (progress > 0) return 'inProgress';
  return 'notStarted';
};

export function buildUserDetailMetrics(data: any) {
  const enrollments = data.enrollments || [];
  const quizAttempts = data.quizAttempts || [];
  const payments = data.payments || [];
  const certificates = data.certificates || [];

  const completedEnrollments = enrollments.filter((e: any) => enrollmentBucket(e) === 'completed');
  const inProgressEnrollments = enrollments.filter((e: any) => enrollmentBucket(e) === 'inProgress');
  const notStartedEnrollments = enrollments.filter((e: any) => enrollmentBucket(e) === 'notStarted');

  const avgProgress = enrollments.length
    ? Math.round(enrollments.reduce((sum: number, e: any) => sum + Number(e.progressPercentage || 0), 0) / enrollments.length)
    : 0;

  const completedQuizAttempts = quizAttempts.filter((a: any) => a.completedAt);
  const quizScores = completedQuizAttempts.map((a: any) => Number(a.score || 0));
  const avgQuizScore = quizScores.length
    ? Math.round(quizScores.reduce((sum: number, score: number) => sum + score, 0) / quizScores.length)
    : 0;

  const quizByCourse = new Map<number, number[]>();
  quizAttempts.forEach((attempt: any) => {
    const courseId = attempt.quiz?.courseId;
    if (!courseId) return;
    const list = quizByCourse.get(courseId) || [];
    list.push(Number(attempt.score || 0));
    quizByCourse.set(courseId, list);
  });

  const coursePerformance: CoursePerformanceRow[] = enrollments.map((enrollment: any) => {
    const courseId = enrollment.course?.id;
    const scores = courseId ? quizByCourse.get(courseId) : undefined;
    const avgScore = scores?.length
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : null;
    const bucket = enrollmentBucket(enrollment);
    const statusLabel = bucket === 'completed'
      ? 'مكتمل'
      : bucket === 'inProgress'
        ? 'قيد التعلم'
        : bucket === 'notStarted'
          ? 'لم يبدأ'
          : 'ملغي';
    return {
      id: enrollment.id,
      title: enrollment.course?.titleAr || '—',
      progress: Number(enrollment.progressPercentage || 0),
      avgScore,
      status: enrollment.status,
      statusLabel,
      enrolledAt: enrollment.enrolledAt,
      completedAt: enrollment.completedAt,
      courseId,
    };
  });

  const paymentAmount = (status: string) => payments
    .filter((p: any) => p.status === status)
    .reduce((sum: number, p: any) => sum + Number(p.finalAmount || 0), 0);

  const totalPaid = paymentAmount('PAID');
  const pendingPaid = paymentAmount('PENDING');
  const refunded = paymentAmount('REFUNDED');
  const revenue = totalPaid;

  const passedQuizzes = completedQuizAttempts.filter((a: any) => a.isPassed).length;
  const failedQuizzes = completedQuizAttempts.filter((a: any) => !a.isPassed).length;
  const pendingQuizzes = quizAttempts.filter((a: any) => !a.completedAt).length;

  const interests = parseInterests(data.studentProfile?.interests);
  const skillChart: ChartItem[] = interests.map((label, index) => ({
    label,
    value: Math.max(40, 100 - index * 12),
  }));

  const categoryChart: ChartItem[] = interests.length
    ? interests.map((label) => ({ label, value: 1 }))
    : [
        { label: 'كورسات', value: data._count?.enrollments ?? enrollments.length },
        { label: 'مدفوعات', value: data._count?.payments ?? payments.length },
        { label: 'شهادات', value: data._count?.certificates ?? certificates.length },
        { label: 'اختبارات', value: data._count?.quizAttempts ?? quizAttempts.length },
      ].filter((item) => item.value > 0);

  const badges = [
    ...certificates.map((cert: any) => ({
      id: `cert-${cert.id}`,
      title: cert.course?.titleAr || 'شهادة',
      subtitle: cert.certificateNumber,
      date: cert.issuedAt,
      type: 'certificate' as const,
    })),
    ...(data.rewardPoints >= 100 ? [{
      id: 'reward-100',
      title: '100+ نقطة مكافأة',
      subtitle: `${data.rewardPoints} نقطة`,
      date: data.updatedAt,
      type: 'reward' as const,
    }] : []),
    ...(completedEnrollments.length >= 3 ? [{
      id: 'learner-3',
      title: 'متعلّم نشط',
      subtitle: `${completedEnrollments.length} دورات مكتملة`,
      date: completedEnrollments[0]?.completedAt || data.updatedAt,
      type: 'milestone' as const,
    }] : []),
  ];

  const timeline: TimelineEvent[] = [
    {
      id: 'joined',
      date: data.createdAt,
      title: 'انضم للمنصة',
      description: `تسجيل حساب جديد — ${data.email}`,
      tone: 'primary',
    },
    ...payments.slice(0, 8).map((payment: any) => ({
      id: `payment-${payment.id}`,
      date: payment.createdAt,
      title: 'عملية شراء',
      description: payment.course?.titleAr || payment.learningPath?.titleAr || `دفعة #${payment.id}`,
      tone: 'warning' as const,
    })),
    ...enrollments.slice(0, 8).map((enrollment: any) => ({
      id: `enroll-${enrollment.id}`,
      date: enrollment.enrolledAt,
      title: 'اشتراك في دورة',
      description: enrollment.course?.titleAr || '—',
      tone: 'muted' as const,
    })),
    ...completedQuizAttempts.slice(0, 8).map((attempt: any) => ({
      id: `quiz-${attempt.id}`,
      date: attempt.completedAt || attempt.startedAt,
      title: attempt.isPassed ? 'اجتياز اختبار' : 'محاولة اختبار',
      description: `${attempt.quiz?.titleAr || '—'} — ${Number(attempt.score)}%`,
      tone: attempt.isPassed ? 'success' as const : 'warning' as const,
    })),
    ...certificates.map((cert: any) => ({
      id: `certificate-${cert.id}`,
      date: cert.issuedAt,
      title: 'إصدار شهادة',
      description: cert.course?.titleAr || cert.certificateNumber,
      tone: 'success' as const,
    })),
  ]
    .filter((event) => event.date)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 20);

  const learningProgressLine = groupByMonth(enrollments, 'enrolledAt');
  const completionArea = groupByMonth(
    completedEnrollments.filter((e: any) => e.completedAt),
    'completedAt',
  );
  const monthlyPayments = groupByMonth(payments.filter((p: any) => p.status === 'PAID'), 'createdAt')
    .map((item) => ({ ...item, value: payments
      .filter((p: any) => {
        if (p.status !== 'PAID') return false;
        const { label } = monthKey(p.createdAt);
        return label === item.label;
      })
      .reduce((sum: number, p: any) => sum + Number(p.finalAmount || 0), 0) }));

  const courseBarChart: ChartItem[] = coursePerformance
    .slice(0, 8)
    .map((row) => ({ label: row.title, value: row.progress }));

  const quizScoreBar: ChartItem[] = quizScores.length
    ? [
        { label: 'الأعلى', value: Math.max(...quizScores) },
        { label: 'المتوسط', value: avgQuizScore },
        { label: 'الأدنى', value: Math.min(...quizScores) },
      ]
    : [];

  const quizDonut: ChartItem[] = quizAttempts.length
    ? [
        { label: 'ناجح', value: passedQuizzes },
        { label: 'راسب', value: failedQuizzes },
        { label: 'قيد التنفيذ', value: pendingQuizzes },
      ].filter((item) => item.value > 0)
    : [];

  const attendanceProxy = {
    present: completedEnrollments.length,
    inProgress: inProgressEnrollments.length,
    absent: notStartedEnrollments.length,
    total: enrollments.length || 1,
  };

  return {
    kpis: {
      totalCourses: enrollments.length,
      completed: completedEnrollments.length,
      inProgress: inProgressEnrollments.length,
      certificates: certificates.length,
      avgScore: avgQuizScore,
      avgAttendance: enrollments.length
        ? Math.round((completedEnrollments.length / enrollments.length) * 100)
        : 0,
      completionPct: avgProgress,
      learningHours: Math.round(enrollments.reduce((sum: number, e: any) => sum + Number(e.progressPercentage || 0), 0) / 10),
      walletBalance: Number(data.wallet?.balance || 0),
      rewardPoints: data.rewardPoints ?? 0,
      paymentsCount: payments.length,
      supportTickets: data._count?.supportTickets ?? 0,
    },
    learningDonut: [
      { label: 'مكتملة', value: completedEnrollments.length },
      { label: 'قيد التعلم', value: inProgressEnrollments.length },
      { label: 'لم يبدأ', value: notStartedEnrollments.length },
    ].filter((item) => item.value > 0),
    learningProgressLine,
    completionArea,
    coursePerformance,
    courseBarChart,
    quizScoreBar,
    quizDonut,
    quizStats: {
      attempts: quizAttempts.length,
      passed: passedQuizzes,
      failed: failedQuizzes,
      pending: pendingQuizzes,
      avgScore: avgQuizScore,
    },
    payments: {
      totalPaid,
      pendingPaid,
      refunded,
      revenue,
      monthlyPayments,
      statusPie: [
        { label: 'مدفوع', value: payments.filter((p: any) => p.status === 'PAID').length },
        { label: 'معلق', value: payments.filter((p: any) => p.status === 'PENDING').length },
        { label: 'مسترد', value: payments.filter((p: any) => p.status === 'REFUNDED').length },
        { label: 'فشل', value: payments.filter((p: any) => p.status === 'FAILED').length },
      ].filter((item) => item.value > 0),
    },
    attendanceBar: [
      { label: 'إكمال', value: attendanceProxy.present },
      { label: 'قيد التعلم', value: attendanceProxy.inProgress },
      { label: 'لم يبدأ', value: attendanceProxy.absent },
    ].filter((item) => item.value > 0),
    skillChart,
    categoryChart,
    badges,
    timeline,
    interests,
  };
}
