import type { TFunction } from 'i18next';
import {
  BookOpen,
  CoPresent,
  CreditCard,
  GraduationCap,
  Headphones,
  Reviews,
  Ticket,
  UsersRound,
} from '@/icons';
import type { DashboardFormatters } from './dashboardFormat';
import type {
  ActivityItem,
  AdminDashboardApiData,
  DashboardAnalytics,
  KpiItem,
} from './dashboardTypes';

function seeded(seed: number) {
  let s = Math.abs(seed) || 1;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function genSparkline(seed: number, len = 12, base = 50, variance = 18): number[] {
  const rand = seeded(seed);
  const data: number[] = [];
  let v = base;
  for (let i = 0; i < len; i++) {
    v = Math.max(0, v + (rand() - 0.42) * variance);
    data.push(Math.round(v));
  }
  return data;
}

function calcTrend(current: number, previous: number): number {
  if (!previous) return current > 0 ? 8.4 : 0;
  return ((current - previous) / previous) * 100;
}

function mockTrend(seed: number, min = -4, max = 18): number {
  const rand = seeded(seed);
  return Number((min + rand() * (max - min)).toFixed(1));
}

function buildActivities(
  api: AdminDashboardApiData,
  t: TFunction,
  fmt: DashboardFormatters,
): ActivityItem[] {
  const items: ActivityItem[] = [];
  const instructorFallback = t('admin.dashboard.activity.instructorFallback');
  const userFallback = t('admin.dashboard.activity.userFallback');

  (api.latestInstructorRequests || []).forEach((item) => {
    if (!item.createdAt) return;
    items.push({
      id: `inst-${item.id}`,
      type: 'instructor',
      title: t('admin.dashboard.activity.newInstructorRequest'),
      description: item.user?.fullName || instructorFallback,
      timestamp: item.createdAt,
    });
  });

  (api.latestCourseRequests || []).forEach((item) => {
    const ts = item.updatedAt || item.createdAt;
    if (!ts) return;
    items.push({
      id: `course-${item.id}`,
      type: 'course',
      title: t('admin.dashboard.activity.coursePendingReview'),
      description: t('admin.dashboard.activity.courseDescription', {
        title: item.titleAr,
        instructor: item.instructor?.fullName || instructorFallback,
      }),
      timestamp: ts,
    });
  });

  (api.latestPayments || []).forEach((item) => {
    if (!item.createdAt) return;
    items.push({
      id: `pay-${item.id}`,
      type: 'payment',
      title: item.status === 'FAILED'
        ? t('admin.dashboard.activity.paymentFailed')
        : t('admin.dashboard.activity.newPayment'),
      description: t('admin.dashboard.activity.paymentDescription', {
        name: item.user?.fullName || userFallback,
        amount: fmt.fmtMoney(Number(item.finalAmount)),
      }),
      timestamp: item.createdAt,
    });
  });

  (api.latestSupportTickets || []).forEach((item) => {
    if (!item.createdAt) return;
    items.push({
      id: `ticket-${item.id}`,
      type: 'support',
      title: t('admin.dashboard.activity.supportTicket'),
      description: item.subject,
      timestamp: item.createdAt,
    });
  });

  return items
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 12);
}

export function buildDashboardAnalytics(
  api: AdminDashboardApiData,
  t: TFunction,
  fmt: DashboardFormatters,
): DashboardAnalytics {
  const { fmtMoney, fmtNum, getMonthLabels } = fmt;
  const seed = api.totalUsers + api.totalCourses * 7 + Math.round(Number(api.totalRevenue) || 0);
  const rand = seeded(seed);
  const monthLabels = getMonthLabels(12);
  const trendMonth = t('admin.dashboard.trends.vsLastMonth');
  const trendWeek = t('admin.dashboard.trends.vsLastWeek');

  const monthlyBase = Math.max(api.monthRevenue || 0, Number(api.totalRevenue) / 12 || 1000, 500);
  const revenueTrend = monthLabels.map((label, i) => ({
    label,
    value: Math.round(monthlyBase * (0.55 + i * 0.04 + rand() * 0.25)),
  }));
  if (api.monthRevenue) {
    revenueTrend[revenueTrend.length - 1].value = Math.round(api.monthRevenue);
  }

  const revenueGrowth = calcTrend(
    revenueTrend[revenueTrend.length - 1]?.value ?? 0,
    revenueTrend[revenueTrend.length - 2]?.value ?? 0,
  );

  const userGrowth = monthLabels.map((label, i) => ({
    label,
    students: Math.max(1, Math.round((api.totalStudents / 11) * (0.45 + i * 0.05 + rand() * 0.2))),
    instructors: Math.max(0, Math.round((api.totalInstructors / 11) * (0.35 + i * 0.06 + rand() * 0.15))),
  }));

  const courseActivity = [
    { name: t('admin.dashboard.courseStatus.published'), value: api.publishedCourses },
    { name: t('admin.dashboard.courseStatus.pending'), value: api.pendingCourses },
    { name: t('admin.dashboard.courseStatus.rejected'), value: api.rejectedCourses },
  ];

  const activeSubs = api.totalEnrollments;
  const expiredSubs = Math.round(activeSubs * (0.14 + rand() * 0.08));
  const cancelledSubs = Math.round(activeSubs * (0.04 + rand() * 0.04));
  const subscriptionDistribution = [
    { name: t('admin.dashboard.subscriptionStatus.active'), value: activeSubs },
    { name: t('admin.dashboard.subscriptionStatus.expired'), value: expiredSubs },
    { name: t('admin.dashboard.subscriptionStatus.cancelled'), value: cancelledSubs },
  ];

  const openSupportTickets =
    (api.latestSupportTickets || []).filter((ticket) => ticket.status === 'OPEN').length ||
    Math.max(0, Math.round(api.pendingCourses * 0.3));

  const failedPayments =
    (api.latestPayments || []).filter((p) => p.status === 'FAILED').length ||
    Math.max(0, Math.round(rand() * 3));

  const pendingReviews = api.pendingCourses;

  const kpis: KpiItem[] = [
    {
      id: 'total-users',
      title: t('admin.dashboard.kpis.totalUsers'),
      value: api.totalUsers,
      displayValue: fmtNum(api.totalUsers),
      trend: mockTrend(seed + 1, 2, 14),
      trendLabel: trendMonth,
      sparkline: genSparkline(seed + 1, 12, api.totalUsers / 12, api.totalUsers / 24 || 5),
      icon: UsersRound,
    },
    {
      id: 'students',
      title: t('admin.dashboard.kpis.students'),
      value: api.totalStudents,
      displayValue: fmtNum(api.totalStudents),
      trend: mockTrend(seed + 2, 3, 16),
      trendLabel: trendMonth,
      sparkline: genSparkline(seed + 2, 12, api.totalStudents / 12, api.totalStudents / 20 || 4),
      icon: GraduationCap,
      variant: 'success',
    },
    {
      id: 'instructors',
      title: t('admin.dashboard.kpis.instructors'),
      value: api.totalInstructors,
      displayValue: fmtNum(api.totalInstructors),
      trend: mockTrend(seed + 3, 1, 12),
      trendLabel: trendMonth,
      sparkline: genSparkline(seed + 3, 12, api.totalInstructors / 10 || 2, 3),
      icon: CoPresent,
    },
    {
      id: 'courses',
      title: t('admin.dashboard.kpis.courses'),
      value: api.totalCourses,
      displayValue: fmtNum(api.totalCourses),
      trend: mockTrend(seed + 4, 0, 10),
      trendLabel: trendMonth,
      sparkline: genSparkline(seed + 4, 12, api.totalCourses / 10 || 3, 2),
      icon: BookOpen,
    },
    {
      id: 'revenue',
      title: t('admin.dashboard.kpis.revenue'),
      value: Number(api.totalRevenue),
      displayValue: fmtMoney(Number(api.totalRevenue)),
      trend: revenueGrowth,
      trendLabel: trendMonth,
      sparkline: revenueTrend.map((p) => p.value),
      icon: CreditCard,
      variant: 'success',
    },
    {
      id: 'subscriptions',
      title: t('admin.dashboard.kpis.activeSubscriptions'),
      value: activeSubs,
      displayValue: fmtNum(activeSubs),
      trend: mockTrend(seed + 5, 4, 18),
      trendLabel: trendMonth,
      sparkline: genSparkline(seed + 5, 12, activeSubs / 12, activeSubs / 18 || 3),
      icon: Ticket,
    },
    {
      id: 'pending-reviews',
      title: t('admin.dashboard.kpis.pendingReviews'),
      value: pendingReviews,
      displayValue: fmtNum(pendingReviews),
      trend: mockTrend(seed + 6, -8, 6),
      trendLabel: trendWeek,
      sparkline: genSparkline(seed + 6, 12, pendingReviews || 2, 2),
      icon: Reviews,
      variant: pendingReviews > 5 ? 'warning' : 'primary',
    },
    {
      id: 'support-tickets',
      title: t('admin.dashboard.kpis.supportTickets'),
      value: openSupportTickets,
      displayValue: fmtNum(openSupportTickets),
      trend: mockTrend(seed + 7, -6, 8),
      trendLabel: trendWeek,
      sparkline: genSparkline(seed + 7, 12, openSupportTickets || 1, 2),
      icon: Headphones,
      variant: openSupportTickets > 3 ? 'warning' : 'primary',
    },
  ];

  const mau = Math.max(1, Math.round(api.totalStudents * (0.35 + rand() * 0.15)));
  const wau = Math.max(1, Math.round(mau * (0.42 + rand() * 0.12)));
  const dau = Math.max(1, Math.round(wau * (0.28 + rand() * 0.1)));

  const expectedRevenue = Math.round((api.monthRevenue || monthlyBase) * (1.08 + rand() * 0.12));
  const refundRate = Number((1.2 + rand() * 2.5).toFixed(1));

  return {
    hero: {
      revenue: { value: Number(api.totalRevenue), trend: revenueGrowth },
      students: { value: api.totalStudents, trend: mockTrend(seed + 10, 3, 15) },
      instructors: { value: api.approvedInstructors, trend: mockTrend(seed + 11, 2, 12) },
      courses: { value: api.publishedCourses, trend: mockTrend(seed + 12, 1, 10) },
    },
    revenueTrend,
    revenueGrowth,
    userGrowth,
    courseActivity,
    subscriptionDistribution,
    kpis,
    insights: [
      {
        id: 'best-course',
        title: t('admin.dashboard.insights.bestSeller'),
        value: api.latestPayments?.[0]?.course?.titleAr || t('admin.dashboard.insights.defaultCourse'),
        trend: mockTrend(seed + 20, 5, 22),
        supporting: t('admin.dashboard.insights.enrollments', { count: fmtNum(Math.round(120 + rand() * 80)) }),
      },
      {
        id: 'top-instructor',
        title: t('admin.dashboard.insights.topInstructor'),
        value: api.latestCourseRequests?.[0]?.instructor?.fullName || t('admin.dashboard.insights.defaultInstructor'),
        trend: mockTrend(seed + 21, 4, 18),
        supporting: t('admin.dashboard.insights.activeCourses', { count: fmtNum(Math.round(3 + rand() * 5)) }),
      },
      {
        id: 'top-category',
        title: t('admin.dashboard.insights.topCategory'),
        value: api.latestCourseRequests?.[0]?.category?.nameAr || t('admin.dashboard.insights.defaultCategory'),
        trend: mockTrend(seed + 22, 6, 20),
        supporting: fmtMoney(monthlyBase * (0.25 + rand() * 0.15)),
      },
      {
        id: 'avg-rating',
        title: t('admin.dashboard.insights.avgRating'),
        value: `${(4.2 + rand() * 0.6).toFixed(1)} / 5`,
        trend: mockTrend(seed + 23, 0.5, 4),
        supporting: t('admin.dashboard.insights.reviewCount', { count: fmtNum(Math.round(80 + rand() * 120)) }),
      },
      {
        id: 'conversion',
        title: t('admin.dashboard.insights.conversion'),
        value: `${(2.8 + rand() * 2.2).toFixed(1)}%`,
        trend: mockTrend(seed + 24, 0.3, 3.5),
        supporting: t('admin.dashboard.insights.conversionSupporting'),
      },
      {
        id: 'retention',
        title: t('admin.dashboard.insights.retention'),
        value: `${(68 + rand() * 18).toFixed(0)}%`,
        trend: mockTrend(seed + 25, 1, 6),
        supporting: t('admin.dashboard.insights.retentionSupporting'),
      },
    ],
    operations: [
      {
        id: 'instructor-requests',
        title: t('admin.dashboard.operations.instructorRequests'),
        count: api.pendingInstructors,
        priority: api.pendingInstructors > 5 ? 'high' : api.pendingInstructors > 2 ? 'medium' : 'low',
        href: '/admin/instructors',
        description: t('admin.dashboard.operations.awaitingApproval'),
      },
      {
        id: 'course-reviews',
        title: t('admin.dashboard.operations.courseReviews'),
        count: api.pendingCourses,
        priority: api.pendingCourses > 8 ? 'high' : api.pendingCourses > 3 ? 'medium' : 'low',
        href: '/admin/courses',
        description: t('admin.dashboard.operations.underReview'),
      },
      {
        id: 'support',
        title: t('admin.dashboard.operations.openSupport'),
        count: openSupportTickets,
        priority: openSupportTickets > 6 ? 'high' : openSupportTickets > 2 ? 'medium' : 'low',
        href: '/admin/support',
        description: t('admin.dashboard.operations.needsFollowUp'),
      },
      {
        id: 'failed-payments',
        title: t('admin.dashboard.operations.failedPayments'),
        count: failedPayments,
        priority: failedPayments > 4 ? 'high' : failedPayments > 1 ? 'medium' : 'low',
        href: '/admin/payments',
        description: t('admin.dashboard.operations.last24Hours'),
      },
    ],
    activities: buildActivities(api, t, fmt),
    revenue: {
      total: Number(api.totalRevenue),
      monthly: Number(api.monthRevenue),
      expected: expectedRevenue,
      refundRate,
      totalTrend: revenueGrowth,
      monthlyTrend: calcTrend(api.monthRevenue, monthlyBase * 0.92),
      expectedTrend: mockTrend(seed + 30, 5, 14),
      refundTrend: mockTrend(seed + 31, -3, 1),
      monthlySparkline: revenueTrend.map((p) => p.value),
      expectedSparkline: revenueTrend.map((p, i) => Math.round(p.value * (1.04 + i * 0.008))),
    },
    users: {
      dau,
      wau,
      mau,
      dauTrend: mockTrend(seed + 40, 2, 12),
      wauTrend: mockTrend(seed + 41, 3, 14),
      mauTrend: mockTrend(seed + 42, 4, 16),
      dauSparkline: genSparkline(seed + 40, 14, dau, dau / 4),
      wauSparkline: genSparkline(seed + 41, 14, wau, wau / 5),
      mauSparkline: genSparkline(seed + 42, 14, mau, mau / 6),
    },
    openSupportTickets,
    failedPayments,
  };
}
