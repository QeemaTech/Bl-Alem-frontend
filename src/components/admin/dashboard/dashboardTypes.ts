import type { MaterialIcon } from '@/icons';

export interface AdminDashboardApiData {
  totalUsers: number;
  totalStudents: number;
  totalInstructors: number;
  pendingInstructors: number;
  approvedInstructors: number;
  totalCourses: number;
  pendingCourses: number;
  publishedCourses: number;
  rejectedCourses: number;
  totalRevenue: number;
  monthRevenue: number;
  totalEnrollments: number;
  upcomingLiveSessions?: unknown[];
  latestPayments?: PaymentItem[];
  latestSupportTickets?: SupportTicketItem[];
  latestInstructorRequests?: InstructorRequestItem[];
  latestCourseRequests?: CourseRequestItem[];
}

export interface PaymentItem {
  id: number;
  finalAmount: number | string;
  status?: string;
  createdAt?: string;
  user?: { fullName?: string };
  course?: { titleAr?: string };
}

export interface SupportTicketItem {
  id: number;
  subject: string;
  status: string;
  priority?: string;
  createdAt?: string;
  user?: { fullName?: string; role?: string };
}

export interface InstructorRequestItem {
  id: number;
  approvalStatus: string;
  createdAt?: string;
  user?: { id?: number; fullName?: string; email?: string };
}

export interface CourseRequestItem {
  id: number;
  titleAr: string;
  status?: string;
  updatedAt?: string;
  createdAt?: string;
  instructor?: { fullName?: string };
  category?: { nameAr?: string };
}

export interface TrendPoint {
  label: string;
  value: number;
}

export interface DualTrendPoint {
  label: string;
  students: number;
  instructors: number;
}

export interface NamedValue {
  name: string;
  value: number;
  color?: string;
}

export interface KpiItem {
  id: string;
  title: string;
  value: number;
  displayValue: string;
  trend: number;
  trendLabel: string;
  sparkline: number[];
  icon: MaterialIcon;
  variant?: 'primary' | 'success' | 'warning';
}

export interface InsightItem {
  id: string;
  title: string;
  value: string;
  trend: number;
  supporting: string;
}

export interface OperationItem {
  id: string;
  title: string;
  count: number;
  priority: 'high' | 'medium' | 'low';
  href: string;
  description: string;
}

export type ActivityType =
  | 'registration'
  | 'course'
  | 'payment'
  | 'support'
  | 'instructor';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
}

export interface DashboardAnalytics {
  hero: {
    revenue: { value: number; trend: number };
    students: { value: number; trend: number };
    instructors: { value: number; trend: number };
    courses: { value: number; trend: number };
  };
  revenueTrend: TrendPoint[];
  revenueGrowth: number;
  userGrowth: DualTrendPoint[];
  courseActivity: NamedValue[];
  subscriptionDistribution: NamedValue[];
  kpis: KpiItem[];
  insights: InsightItem[];
  operations: OperationItem[];
  activities: ActivityItem[];
  revenue: {
    total: number;
    monthly: number;
    expected: number;
    refundRate: number;
    totalTrend: number;
    monthlyTrend: number;
    expectedTrend: number;
    refundTrend: number;
    monthlySparkline: number[];
    expectedSparkline: number[];
  };
  users: {
    dau: number;
    wau: number;
    mau: number;
    dauTrend: number;
    wauTrend: number;
    mauTrend: number;
    dauSparkline: number[];
    wauSparkline: number[];
    mauSparkline: number[];
  };
  openSupportTickets: number;
  failedPayments: number;
}
