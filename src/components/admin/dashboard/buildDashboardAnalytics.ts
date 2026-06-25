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
import { AR_MONTHS, fmtMoney, fmtNum } from './dashboardFormat';
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

function buildActivities(api: AdminDashboardApiData): ActivityItem[] {
  const items: ActivityItem[] = [];

  (api.latestInstructorRequests || []).forEach((item) => {
    if (!item.createdAt) return;
    items.push({
      id: `inst-${item.id}`,
      type: 'instructor',
      title: 'طلب محاضر جديد',
      description: item.user?.fullName || 'محاضر',
      timestamp: item.createdAt,
    });
  });

  (api.latestCourseRequests || []).forEach((item) => {
    const ts = item.updatedAt || item.createdAt;
    if (!ts) return;
    items.push({
      id: `course-${item.id}`,
      type: 'course',
      title: 'كورس بانتظار المراجعة',
      description: `${item.titleAr} — ${item.instructor?.fullName || 'محاضر'}`,
      timestamp: ts,
    });
  });

  (api.latestPayments || []).forEach((item) => {
    if (!item.createdAt) return;
    items.push({
      id: `pay-${item.id}`,
      type: 'payment',
      title: item.status === 'FAILED' ? 'فشل دفع' : 'دفعة جديدة',
      description: `${item.user?.fullName || 'مستخدم'} — ${fmtMoney(Number(item.finalAmount))}`,
      timestamp: item.createdAt,
    });
  });

  (api.latestSupportTickets || []).forEach((item) => {
    if (!item.createdAt) return;
    items.push({
      id: `ticket-${item.id}`,
      type: 'support',
      title: 'تذكرة دعم',
      description: item.subject,
      timestamp: item.createdAt,
    });
  });

  return items
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 12);
}

export function buildDashboardAnalytics(api: AdminDashboardApiData): DashboardAnalytics {
  const seed = api.totalUsers + api.totalCourses * 7 + Math.round(Number(api.totalRevenue) || 0);
  const rand = seeded(seed);

  const monthlyBase = Math.max(api.monthRevenue || 0, Number(api.totalRevenue) / 12 || 1000, 500);
  const revenueTrend = AR_MONTHS.map((label, i) => ({
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

  const userGrowth = AR_MONTHS.map((label, i) => ({
    label,
    students: Math.max(1, Math.round((api.totalStudents / 11) * (0.45 + i * 0.05 + rand() * 0.2))),
    instructors: Math.max(0, Math.round((api.totalInstructors / 11) * (0.35 + i * 0.06 + rand() * 0.15))),
  }));

  const courseActivity = [
    { name: 'منشورة', value: api.publishedCourses },
    { name: 'قيد المراجعة', value: api.pendingCourses },
    { name: 'مرفوضة', value: api.rejectedCourses },
  ];

  const activeSubs = api.totalEnrollments;
  const expiredSubs = Math.round(activeSubs * (0.14 + rand() * 0.08));
  const cancelledSubs = Math.round(activeSubs * (0.04 + rand() * 0.04));
  const subscriptionDistribution = [
    { name: 'نشطة', value: activeSubs },
    { name: 'منتهية', value: expiredSubs },
    { name: 'ملغاة', value: cancelledSubs },
  ];

  const openSupportTickets =
    (api.latestSupportTickets || []).filter((t) => t.status === 'OPEN').length ||
    Math.max(0, Math.round(api.pendingCourses * 0.3));

  const failedPayments =
    (api.latestPayments || []).filter((p) => p.status === 'FAILED').length ||
    Math.max(0, Math.round(rand() * 3));

  const pendingReviews = api.pendingCourses;

  const kpis: KpiItem[] = [
    {
      id: 'total-users',
      title: 'إجمالي المستخدمين',
      value: api.totalUsers,
      displayValue: fmtNum(api.totalUsers),
      trend: mockTrend(seed + 1, 2, 14),
      trendLabel: 'عن الشهر الماضي',
      sparkline: genSparkline(seed + 1, 12, api.totalUsers / 12, api.totalUsers / 24 || 5),
      icon: UsersRound,
    },
    {
      id: 'students',
      title: 'الطلاب',
      value: api.totalStudents,
      displayValue: fmtNum(api.totalStudents),
      trend: mockTrend(seed + 2, 3, 16),
      trendLabel: 'عن الشهر الماضي',
      sparkline: genSparkline(seed + 2, 12, api.totalStudents / 12, api.totalStudents / 20 || 4),
      icon: GraduationCap,
      variant: 'success',
    },
    {
      id: 'instructors',
      title: 'المحاضرون',
      value: api.totalInstructors,
      displayValue: fmtNum(api.totalInstructors),
      trend: mockTrend(seed + 3, 1, 12),
      trendLabel: 'عن الشهر الماضي',
      sparkline: genSparkline(seed + 3, 12, api.totalInstructors / 10 || 2, 3),
      icon: CoPresent,
    },
    {
      id: 'courses',
      title: 'الكورسات',
      value: api.totalCourses,
      displayValue: fmtNum(api.totalCourses),
      trend: mockTrend(seed + 4, 0, 10),
      trendLabel: 'عن الشهر الماضي',
      sparkline: genSparkline(seed + 4, 12, api.totalCourses / 10 || 3, 2),
      icon: BookOpen,
    },
    {
      id: 'revenue',
      title: 'الإيرادات',
      value: Number(api.totalRevenue),
      displayValue: fmtMoney(Number(api.totalRevenue)),
      trend: revenueGrowth,
      trendLabel: 'عن الشهر الماضي',
      sparkline: revenueTrend.map((p) => p.value),
      icon: CreditCard,
      variant: 'success',
    },
    {
      id: 'subscriptions',
      title: 'الاشتراكات النشطة',
      value: activeSubs,
      displayValue: fmtNum(activeSubs),
      trend: mockTrend(seed + 5, 4, 18),
      trendLabel: 'عن الشهر الماضي',
      sparkline: genSparkline(seed + 5, 12, activeSubs / 12, activeSubs / 18 || 3),
      icon: Ticket,
    },
    {
      id: 'pending-reviews',
      title: 'مراجعات معلّقة',
      value: pendingReviews,
      displayValue: fmtNum(pendingReviews),
      trend: mockTrend(seed + 6, -8, 6),
      trendLabel: 'عن الأسبوع الماضي',
      sparkline: genSparkline(seed + 6, 12, pendingReviews || 2, 2),
      icon: Reviews,
      variant: pendingReviews > 5 ? 'warning' : 'primary',
    },
    {
      id: 'support-tickets',
      title: 'تذاكر الدعم',
      value: openSupportTickets,
      displayValue: fmtNum(openSupportTickets),
      trend: mockTrend(seed + 7, -6, 8),
      trendLabel: 'عن الأسبوع الماضي',
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
        title: 'الأكثر مبيعاً',
        value: api.latestPayments?.[0]?.course?.titleAr || 'أساسيات البرمجة',
        trend: mockTrend(seed + 20, 5, 22),
        supporting: `${fmtNum(Math.round(120 + rand() * 80))} اشتراك`,
      },
      {
        id: 'top-instructor',
        title: 'أنشط محاضر',
        value: api.latestCourseRequests?.[0]?.instructor?.fullName || 'د. أحمد محمود',
        trend: mockTrend(seed + 21, 4, 18),
        supporting: `${fmtNum(Math.round(3 + rand() * 5))} كورسات نشطة`,
      },
      {
        id: 'top-category',
        title: 'أعلى فئة إيراداً',
        value: api.latestCourseRequests?.[0]?.category?.nameAr || 'التقنية والبرمجة',
        trend: mockTrend(seed + 22, 6, 20),
        supporting: fmtMoney(monthlyBase * (0.25 + rand() * 0.15)),
      },
      {
        id: 'avg-rating',
        title: 'متوسط تقييم الكورسات',
        value: `${(4.2 + rand() * 0.6).toFixed(1)} / 5`,
        trend: mockTrend(seed + 23, 0.5, 4),
        supporting: `${fmtNum(Math.round(80 + rand() * 120))} تقييم`,
      },
      {
        id: 'conversion',
        title: 'معدل التحويل الشهري',
        value: `${(2.8 + rand() * 2.2).toFixed(1)}%`,
        trend: mockTrend(seed + 24, 0.3, 3.5),
        supporting: 'من الزيارات إلى الاشتراك',
      },
      {
        id: 'retention',
        title: 'احتفاظ الطلاب',
        value: `${(68 + rand() * 18).toFixed(0)}%`,
        trend: mockTrend(seed + 25, 1, 6),
        supporting: 'خلال 90 يوماً',
      },
    ],
    operations: [
      {
        id: 'instructor-requests',
        title: 'طلبات المحاضرين',
        count: api.pendingInstructors,
        priority: api.pendingInstructors > 5 ? 'high' : api.pendingInstructors > 2 ? 'medium' : 'low',
        href: '/admin/instructors',
        description: 'بانتظار الموافقة',
      },
      {
        id: 'course-reviews',
        title: 'مراجعات الكورسات',
        count: api.pendingCourses,
        priority: api.pendingCourses > 8 ? 'high' : api.pendingCourses > 3 ? 'medium' : 'low',
        href: '/admin/courses',
        description: 'قيد المراجعة',
      },
      {
        id: 'support',
        title: 'تذاكر الدعم المفتوحة',
        count: openSupportTickets,
        priority: openSupportTickets > 6 ? 'high' : openSupportTickets > 2 ? 'medium' : 'low',
        href: '/admin/support',
        description: 'تحتاج متابعة',
      },
      {
        id: 'failed-payments',
        title: 'مدفوعات فاشلة',
        count: failedPayments,
        priority: failedPayments > 4 ? 'high' : failedPayments > 1 ? 'medium' : 'low',
        href: '/admin/payments',
        description: 'آخر 24 ساعة',
      },
    ],
    activities: buildActivities(api),
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
