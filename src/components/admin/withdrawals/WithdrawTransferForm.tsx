import { useRef, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { ImagePlus, Trash2, Upload } from '@/icons';
import { useAdminWithdrawalLabels } from '../../../hooks/useAdminWithdrawalLabels';
import { Button } from '../../ui/Button';
import type { WithdrawalItem } from './types';

interface WithdrawTransferFormProps {
  item: WithdrawalItem | null;
  preview: string;
  submitting: boolean;
  onFileSelect: (file: File) => void;
  onRemoveFile: () => void;
  onCancel: () => void;
  onSubmit: (event: FormEvent) => void;
}

export function WithdrawTransferForm({
  item,
  preview,
  submitting,
  onFileSelect,
  onRemoveFile,
  onCancel,
  onSubmit,
}: WithdrawTransferFormProps) {
  const { t } = useTranslation(['withdrawals', 'common']);
  const { fmtWithdrawalMoney, empty } = useAdminWithdrawalLabels();
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => inputRef.current?.click();

  const handleDrop = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file?.type.startsWith('image/')) onFileSelect(file);
  };

  return (
    <form className="withdraw-transfer-form" onSubmit={onSubmit}>
      <div className="withdraw-transfer-summary">
        <p className="withdraw-transfer-lead">
          {t('admin.transferModal.lead', {
            amount: fmtWithdrawalMoney(item?.amount || 0),
            name: item?.instructor?.fullName || empty,
          })}
        </p>
        {item?.phone || item?.transferType ? (
          <dl className="withdraw-transfer-meta">
            {item.phone ? (
              <div>
                <dt>{t('admin.transferModal.phone')}</dt>
                <dd dir="ltr">{item.phone}</dd>
              </div>
            ) : null}
            {item.transferType ? (
              <div>
                <dt>{t('admin.transferModal.transferType')}</dt>
                <dd>{t(`admin.labels.transferTypes.${item.transferType}`, { defaultValue: item.transferType })}</dd>
              </div>
            ) : null}
          </dl>
        ) : null}
      </div>

      <div className="withdraw-transfer-upload">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/jpg"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileSelect(file);
          }}
        />

        {preview ? (
          <div className="withdraw-transfer-preview">
            <img src={preview} alt={t('admin.transferModal.previewAlt')} />
            <div className="withdraw-transfer-preview-actions">
              <Button type="button" variant="outline" size="sm" icon={<Upload size={16} />} onClick={openPicker}>
                {t('admin.transferModal.replaceImage')}
              </Button>
              <Button type="button" variant="ghost" size="sm" icon={<Trash2 size={16} />} onClick={onRemoveFile}>
                {t('admin.transferModal.remove')}
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="withdraw-transfer-dropzone"
            onClick={openPicker}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <span className="withdraw-transfer-dropzone-icon" aria-hidden="true">
              <ImagePlus size={28} />
            </span>
            <span className="withdraw-transfer-dropzone-title">{t('admin.transferModal.dropzoneTitle')}</span>
            <span className="withdraw-transfer-dropzone-hint">{t('admin.transferModal.dropzoneHint')}</span>
          </button>
        )}
      </div>

      <div className="modal-actions">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          {t('actions.cancel', { ns: 'common' })}
        </Button>
        <Button type="submit" loading={submitting} icon={<Upload size={16} />}>
          {t('admin.transferModal.confirmPayment')}
        </Button>
      </div>
    </form>
  );
}
