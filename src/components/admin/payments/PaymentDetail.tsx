import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { BookOpen, CreditCard, Info, Route, User } from '@/icons';
import { useAdminPaymentLabels } from '../../../hooks/useAdminPaymentLabels';
import { Badge } from '../../ui/Badge';
import { fmtMoney } from '../../../utils/adminFormatters';

interface PaymentDetailProps {
  payment: any;
}

export function PaymentDetail({ payment }: PaymentDetailProps) {
  const { t } = useTranslation('payments');
  const {
    statusLabels,
    gatewayLabels,
    itemTypeLabels,
    fmtPaymentDate,
    paymentStatusVariant,
    empty,
  } = useAdminPaymentLabels();

  const fields = t('detail.fields', { returnObjects: true }) as Record<string, string>;

  const itemLabel = payment.itemType === 'LEARNING_PATH'
    ? payment.learningPath?.titleAr || empty
    : payment.course?.titleAr || payment.course?.titleEn || empty;

  const itemHref = payment.itemType === 'LEARNING_PATH' && payment.learningPathId
    ? `/admin/learning-paths/${payment.learningPathId}`
    : payment.courseId
      ? `/admin/courses/${payment.courseId}`
      : null;

  const studentHref = payment.user?.role === 'STUDENT' && payment.userId
    ? `/admin/students/${payment.userId}`
    : payment.userId
      ? `/admin/users/${payment.userId}`
      : null;

  return (
    <div className="support-ticket-detail admin-entity-detail admin-payment-detail">
      <div className="admin-entity-detail-header support-ticket-detail-header">
        <div className="admin-payment-detail-heading">
          <span className="support-ticket-id">#{payment.id}</span>
          <div className="admin-payment-title-row">
            <span className="admin-entity-detail-icon" aria-hidden="true">
              <CreditCard size={24} />
            </span>
            <h2>{t('detail.heading')}</h2>
          </div>
          <p className="admin-payment-subtitle">
            {itemTypeLabels[payment.itemType] || payment.itemType || itemTypeLabels.COURSE}
            {' · '}
            {fmtPaymentDate(payment.createdAt)}
          </p>
        </div>
        <Badge variant={paymentStatusVariant(payment.status)} dot className="status-badge">
          {statusLabels[payment.status] || payment.status}
        </Badge>
      </div>

      <section className="admin-entity-meta" aria-label={t('detail.studentSection')}>
        <div className="admin-entity-meta-head">
          <span className="admin-entity-meta-head-icon" aria-hidden="true">
            <User size={20} />
          </span>
          <h3>{t('detail.studentSection')}</h3>
        </div>
        <div className="admin-entity-meta-grid">
          <div className="detail-row">
            <span className="detail-row-label">{fields.name}</span>
            <div className="detail-row-value">
              {studentHref ? (
                <Link to={studentHref} className="admin-detail-list-link">{payment.user?.fullName || empty}</Link>
              ) : (payment.user?.fullName || empty)}
            </div>
          </div>
          <div className="detail-row">
            <span className="detail-row-label">{fields.email}</span>
            <div className="detail-row-value" dir="ltr">{payment.user?.email || empty}</div>
          </div>
          <div className="detail-row">
            <span className="detail-row-label">{fields.phone}</span>
            <div className="detail-row-value" dir="ltr">{payment.user?.phone || empty}</div>
          </div>
        </div>
      </section>

      <section className="admin-entity-meta" aria-label={t('detail.productSection')}>
        <div className="admin-entity-meta-head">
          <span className="admin-entity-meta-head-icon" aria-hidden="true">
            {payment.itemType === 'LEARNING_PATH' ? <Route size={20} /> : <BookOpen size={20} />}
          </span>
          <h3>{t('detail.productSection')}</h3>
        </div>
        <div className="admin-entity-meta-grid">
          <div className="detail-row">
            <span className="detail-row-label">{fields.type}</span>
            <div className="detail-row-value">{itemTypeLabels[payment.itemType] || empty}</div>
          </div>
          <div className="detail-row">
            <span className="detail-row-label">{fields.title}</span>
            <div className="detail-row-value">
              {itemHref ? (
                <Link to={itemHref} className="admin-detail-list-link">{itemLabel}</Link>
              ) : itemLabel}
            </div>
          </div>
          {payment.course?.instructor?.fullName ? (
            <div className="detail-row">
              <span className="detail-row-label">{fields.instructor}</span>
              <div className="detail-row-value">{payment.course.instructor.fullName}</div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="admin-entity-meta" aria-label={t('detail.paymentSection')}>
        <div className="admin-entity-meta-head">
          <span className="admin-entity-meta-head-icon" aria-hidden="true">
            <Info size={20} />
          </span>
          <h3>{t('detail.paymentSection')}</h3>
        </div>
        <div className="admin-entity-meta-grid">
          <div className="detail-row">
            <span className="detail-row-label">{fields.amount}</span>
            <div className="detail-row-value">{fmtMoney(Number(payment.amount))}</div>
          </div>
          <div className="detail-row">
            <span className="detail-row-label">{fields.discount}</span>
            <div className="detail-row-value">{fmtMoney(Number(payment.discountAmount))}</div>
          </div>
          <div className="detail-row">
            <span className="detail-row-label">{fields.pointsUsed}</span>
            <div className="detail-row-value">{payment.pointsUsed ?? 0}</div>
          </div>
          <div className="detail-row">
            <span className="detail-row-label">{fields.finalAmount}</span>
            <div className="detail-row-value">{fmtMoney(Number(payment.finalAmount))}</div>
          </div>
          {payment.coupon ? (
            <div className="detail-row">
              <span className="detail-row-label">{fields.coupon}</span>
              <div className="detail-row-value" dir="ltr">{payment.coupon.code}</div>
            </div>
          ) : null}
          <div className="detail-row">
            <span className="detail-row-label">{fields.gateway}</span>
            <div className="detail-row-value">{gatewayLabels[payment.gateway] || payment.gateway || empty}</div>
          </div>
          <div className="detail-row">
            <span className="detail-row-label">{fields.transactionRef}</span>
            <div className="detail-row-value" dir="ltr">{payment.transactionRef || empty}</div>
          </div>
          <div className="detail-row">
            <span className="detail-row-label">{fields.platformShare}</span>
            <div className="detail-row-value">{fmtMoney(Number(payment.platformShare || 0))}</div>
          </div>
          <div className="detail-row">
            <span className="detail-row-label">{fields.instructorShare}</span>
            <div className="detail-row-value">{fmtMoney(Number(payment.instructorShare || 0))}</div>
          </div>
          <div className="detail-row">
            <span className="detail-row-label">{fields.createdAt}</span>
            <div className="detail-row-value">{fmtPaymentDate(payment.createdAt)}</div>
          </div>
        </div>
      </section>
    </div>
  );
}
