import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight } from '@/icons';
import { adminApi } from '../../api/admin';
import { PaymentDetail } from '../../components/admin/payments/PaymentDetail';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import { useToast } from '../../components/ui/Toast';

export default function AdminPaymentDetailPage() {
  const { t } = useTranslation('payments');
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!paymentId) return;
      setLoading(true);
      try {
        setPayment(await adminApi.payment(paymentId));
      } catch {
        showToast(t('toast.loadError'), 'error');
        setPayment(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [paymentId, showToast, t]);

  if (loading) return <DashboardSkeleton />;

  if (!payment) {
    return (
      <div className="page-grid admin-payment-detail-page">
        <EmptyState
          title={t('notFound.title')}
          description={t('notFound.description')}
        />
        <Button variant="outline" onClick={() => navigate('/admin/payments')}>
          {t('backToPayments')}
        </Button>
      </div>
    );
  }

  return (
    <div className="page-grid admin-payment-detail-page">
      <Link to="/admin/payments" className="support-ticket-back">
        <ArrowRight size={18} aria-hidden="true" />
        {t('backToPayments')}
      </Link>

      <Card className="support-ticket-page-card">
        <PaymentDetail payment={payment} />
      </Card>
    </div>
  );
}
