import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Check, Crown, Sparkles, Star, Wallet, Zap,
} from 'lucide-react';
import { studentApi } from '../../api/student';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { useToast } from '../../components/ui/Toast';
import { formatMoney } from '../../utils/formatMoney';

const fmtDate = (value?: string | null) => (value
  ? new Date(value).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })
  : '—');

export default function StudentPricingPage() {
  const { showToast } = useToast();
  const [data, setData] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<number | null>(null);
  const [confirmPlan, setConfirmPlan] = useState<{ id: number; gateway: string; name: string; price: number } | null>(null);

  const load = async () => {
    const [pricing, wallet] = await Promise.all([
      studentApi.pricingPlans(),
      studentApi.wallet().catch(() => ({ balance: 0 })),
    ]);
    setData(pricing);
    setWalletBalance(Number(wallet?.balance || 0));
  };

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, []);

  const plans = data?.plans || [];
  const active = data?.activeSubscription;

  const daysLeft = useMemo(() => {
    if (!active?.endAt) return null;
    const diff = new Date(active.endAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [active]);

  const subscribe = async () => {
    if (!confirmPlan) return;
    setSubscribing(confirmPlan.id);
    try {
      await studentApi.subscribePlan(confirmPlan.id, { gateway: confirmPlan.gateway });
      showToast('تم الاشتراك في الخطة بنجاح.', 'success');
      setConfirmPlan(null);
      await load();
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'تعذّر إتمام الاشتراك.';
      showToast(message, 'error');
    } finally {
      setSubscribing(null);
    }
  };

  const openConfirm = (plan: any, gateway: string) => {
    if (active?.planId === plan.id) {
      showToast('أنت مشترك في هذه الخطة حالياً.', 'info');
      return;
    }
    if (gateway === 'WALLET' && walletBalance < Number(plan.price)) {
      showToast('رصيد المحفظة غير كافٍ.', 'error');
      return;
    }
    setConfirmPlan({
      id: plan.id,
      gateway,
      name: plan.nameAr,
      price: Number(plan.price),
    });
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="page-grid student-pricing-page">
      <PageHeader
        title="خطط الاشتراك"
        subtitle="اختر الخطة المناسبة لرحلتك التعليمية"
      />

      <div className="stats-grid">
        <StatCard title="الخطط المتاحة" value={String(plans.length)} icon={Star} />
        <StatCard
          title="اشتراكك الحالي"
          value={active?.plan?.nameAr || 'لا يوجد'}
          icon={Crown}
          hint={active ? 'نشط' : 'اختر خطة'}
        />
        <StatCard
          title="رصيد المحفظة"
          value={formatMoney(walletBalance)}
          icon={Wallet}
        />
        <StatCard
          title="الأيام المتبقية"
          value={daysLeft != null ? `${daysLeft} يوم` : '—'}
          icon={Calendar}
          hint={active?.endAt ? `ينتهي ${fmtDate(active.endAt)}` : undefined}
        />
      </div>

      {active ? (
        <Card className="pricing-active-banner student-pricing-active">
          <div className="student-pricing-active-icon">
            <Sparkles size={36} />
          </div>
          <div className="student-pricing-active-body">
            <Badge variant="success">اشتراك نشط</Badge>
            <h3>{active.plan?.nameAr}</h3>
            <p>ينتهي في: {fmtDate(active.endAt)}</p>
            {daysLeft != null ? (
              <span className="student-pricing-days-left">{daysLeft} يوم متبقٍ</span>
            ) : null}
          </div>
        </Card>
      ) : (
        <Card className="student-pricing-cta">
          <Zap size={24} />
          <div>
            <strong>ابدأ رحلتك التعليمية</strong>
            <p>اختر خطة للوصول إلى دورات أكثر، جلسات مباشرة، وشهادات معتمدة.</p>
          </div>
        </Card>
      )}

      {plans.length ? (
        <div className="pricing-plans-grid">
          {plans.map((plan: any, index: number) => {
            const isFeatured = plan.isFeatured || index === Math.floor(plans.length / 2);
            const isCurrent = active?.planId === plan.id;
            const features = Array.isArray(plan.features) ? plan.features : [];
            const canAffordWallet = walletBalance >= Number(plan.price);

            return (
              <Card
                key={plan.id}
                className={`pricing-plan-card ${isFeatured ? 'featured' : ''} ${isCurrent ? 'current' : ''}`}
              >
                {isFeatured ? <span className="pricing-plan-badge">الأكثر شيوعاً</span> : null}
                {isCurrent ? <span className="pricing-plan-current-badge">خطتك الحالية</span> : null}

                <div className="pricing-plan-icon">
                  <Crown size={26} />
                </div>

                <h3 className="pricing-plan-title">{plan.nameAr}</h3>
                <p className="pricing-plan-desc">{plan.descriptionAr}</p>

                <div className="pricing-plan-price">
                  <strong>{formatMoney(plan.price).replace(' ر.س', '')}</strong>
                  <span>ر.س / {plan.durationDays} يوم</span>
                </div>

                <ul className="pricing-plan-features">
                  {features.map((feature: string) => (
                    <li key={feature}>
                      <Check size={16} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="pricing-plan-actions">
                  <Button
                    fullWidth
                    loading={subscribing === plan.id}
                    disabled={isCurrent}
                    onClick={() => openConfirm(plan, 'SIMULATED')}
                  >
                    {isCurrent ? 'مشترك حالياً' : 'اشترك الآن'}
                  </Button>
                  <Button
                    fullWidth
                    variant="secondary"
                    loading={subscribing === plan.id}
                    disabled={isCurrent}
                    icon={<Wallet size={16} />}
                    onClick={() => openConfirm(plan, 'WALLET')}
                  >
                    {canAffordWallet ? 'من المحفظة' : 'رصيد غير كافٍ'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <EmptyState
            title="لا توجد خطط"
            description="لم تُفعّل أي خطط اشتراك بعد. تواصل مع الإدارة."
            icon={Crown}
          />
        </Card>
      )}

      <Card className="student-pricing-wallet-hint">
        <Wallet size={22} />
        <div>
          <strong>الدفع من المحفظة</strong>
          <p>
            رصيدك الحالي {formatMoney(walletBalance)} —
            {' '}
            <Link to="/student/wallet">عرض المحفظة</Link>
            {' '}
            أو
            {' '}
            <Link to="/student/rewards">المكافآت والإحالات</Link>
            لزيادة الرصيد.
          </p>
        </div>
      </Card>

      <ConfirmDialog
        isOpen={Boolean(confirmPlan)}
        title="تأكيد الاشتراك"
        message={
          confirmPlan
            ? `هل تريد الاشتراك في "${confirmPlan.name}" بمبلغ ${formatMoney(confirmPlan.price)}${confirmPlan.gateway === 'WALLET' ? ' من المحفظة' : ''}؟`
            : ''
        }
        confirmLabel="تأكيد الاشتراك"
        variant="primary"
        loading={Boolean(subscribing)}
        onConfirm={subscribe}
        onCancel={() => setConfirmPlan(null)}
      />
    </div>
  );
}
