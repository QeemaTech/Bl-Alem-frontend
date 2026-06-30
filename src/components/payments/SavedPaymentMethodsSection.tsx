import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard, Plus, Star, Trash2 } from '@/icons';
import { cn } from '@/lib/cn';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { EmptyState } from '../ui/EmptyState';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';

export interface SavedPaymentMethod {
  id: number;
  label?: string | null;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  gateway: string;
  isDefault: boolean;
}

interface SavedPaymentMethodsSectionProps {
  methods: SavedPaymentMethod[];
  loading?: boolean;
  onCreate: (payload: {
    cardNumber: string;
    expMonth: number;
    expYear: number;
    label?: string;
    isDefault?: boolean;
  }) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onSetDefault: (id: number) => Promise<void>;
}

const brandClass = (brand: string) => {
  const key = String(brand || '').toLowerCase();
  if (key === 'visa') return 'is-visa';
  if (key === 'mastercard') return 'is-mastercard';
  if (key === 'mada') return 'is-mada';
  if (key === 'amex') return 'is-amex';
  return 'is-other';
};

export function SavedPaymentMethodsSection({
  methods,
  loading = false,
  onCreate,
  onDelete,
  onSetDefault,
}: SavedPaymentMethodsSectionProps) {
  const { t } = useTranslation('payments');
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SavedPaymentMethod | null>(null);
  const [form, setForm] = useState({
    label: '',
    cardNumber: '',
    expMonth: '',
    expYear: '',
    isDefault: false,
  });

  const gatewayLabel = (gateway: string) => t(`student.labels.gateway.${gateway}`, { defaultValue: gateway });
  const brandLabel = (brand: string) => t(`student.paymentMethods.brands.${brand}`, { defaultValue: brand });

  const resetForm = () => {
    setForm({ label: '', cardNumber: '', expMonth: '', expYear: '', isDefault: false });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onCreate({
        label: form.label.trim() || undefined,
        cardNumber: form.cardNumber.trim(),
        expMonth: Number(form.expMonth),
        expYear: Number(form.expYear),
        isDefault: form.isDefault,
      });
      setOpen(false);
      resetForm();
      showToast(t('student.paymentMethods.toast.added'), 'success');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message
        || t('student.paymentMethods.toast.addFailed');
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await onDelete(deleteTarget.id);
      showToast(t('student.paymentMethods.toast.deleted'), 'success');
      setDeleteTarget(null);
    } catch {
      showToast(t('student.paymentMethods.toast.deleteFailed'), 'error');
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await onSetDefault(id);
      showToast(t('student.paymentMethods.toast.defaultUpdated'), 'success');
    } catch {
      showToast(t('student.paymentMethods.toast.defaultFailed'), 'error');
    }
  };

  return (
    <Card className="saved-payment-methods-card">
      <div className="saved-payment-methods-head">
        <div>
          <h2>
            <CreditCard size={20} />
            {t('student.paymentMethods.title')}
          </h2>
          <p>{t('student.paymentMethods.subtitle')}</p>
        </div>
        <Button icon={<Plus size={18} />} onClick={() => setOpen(true)}>
          {t('student.paymentMethods.add')}
        </Button>
      </div>

      {loading ? (
        <p className="field-helper">{t('student.paymentMethods.loading')}</p>
      ) : methods.length ? (
        <div className="saved-payment-methods-grid">
          {methods.map((method) => (
            <article
              key={method.id}
              className={cn('saved-payment-method-item', brandClass(method.brand), method.isDefault && 'is-default')}
            >
              <div className="saved-payment-method-top">
                <div>
                  <span className="saved-payment-method-brand">{brandLabel(method.brand)}</span>
                  <strong dir="ltr">•••• •••• •••• {method.last4}</strong>
                  {method.label ? <small>{method.label}</small> : null}
                </div>
                {method.isDefault ? (
                  <Badge variant="success">{t('student.paymentMethods.default')}</Badge>
                ) : null}
              </div>
              <div className="saved-payment-method-meta">
                <span dir="ltr">{String(method.expMonth).padStart(2, '0')}/{method.expYear}</span>
                <span>{gatewayLabel(method.gateway)}</span>
              </div>
              <div className="saved-payment-method-actions">
                {!method.isDefault ? (
                  <Button variant="outline" size="sm" icon={<Star size={14} />} onClick={() => handleSetDefault(method.id)}>
                    {t('student.paymentMethods.setDefault')}
                  </Button>
                ) : null}
                <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => setDeleteTarget(method)}>
                  {t('student.paymentMethods.remove')}
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title={t('student.paymentMethods.emptyTitle')}
          description={t('student.paymentMethods.emptyDescription')}
          icon={CreditCard}
          actionLabel={t('student.paymentMethods.add')}
          onAction={() => setOpen(true)}
        />
      )}

      <Modal isOpen={open} title={t('student.paymentMethods.modal.title')} onClose={() => !submitting && setOpen(false)}>
        <form className="stack-sm" onSubmit={submit}>
          <Input
            label={t('student.paymentMethods.modal.label')}
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder={t('student.paymentMethods.modal.labelPlaceholder')}
          />
          <Input
            label={t('student.paymentMethods.modal.cardNumber')}
            value={form.cardNumber}
            onChange={(e) => setForm({ ...form, cardNumber: e.target.value })}
            placeholder="4242 4242 4242 4242"
            dir="ltr"
            inputMode="numeric"
            autoComplete="cc-number"
            required
          />
          <div className="form-grid-2">
            <Input
              label={t('student.paymentMethods.modal.expMonth')}
              type="number"
              min={1}
              max={12}
              value={form.expMonth}
              onChange={(e) => setForm({ ...form, expMonth: e.target.value })}
              placeholder="12"
              dir="ltr"
              required
            />
            <Input
              label={t('student.paymentMethods.modal.expYear')}
              type="number"
              min={new Date().getFullYear()}
              max={2100}
              value={form.expYear}
              onChange={(e) => setForm({ ...form, expYear: e.target.value })}
              placeholder="2028"
              dir="ltr"
              required
            />
          </div>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
            />
            <span>{t('student.paymentMethods.modal.makeDefault')}</span>
          </label>
          <p className="field-helper">{t('student.paymentMethods.modal.securityNote')}</p>
          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={submitting}>
              {t('student.paymentMethods.modal.cancel')}
            </Button>
            <Button type="submit" loading={submitting}>
              {t('student.paymentMethods.modal.save')}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title={t('student.paymentMethods.delete.title')}
        message={t('student.paymentMethods.delete.message', {
          last4: deleteTarget?.last4 || '****',
        })}
        confirmLabel={t('student.paymentMethods.delete.confirm')}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Card>
  );
}
