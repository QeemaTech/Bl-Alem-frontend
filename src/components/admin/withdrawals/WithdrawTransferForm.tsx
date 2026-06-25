import { useRef, type FormEvent } from 'react';
import { ImagePlus, Trash2, Upload } from '@/icons';
import { Button } from '../../ui/Button';
import { fmtWithdrawalMoney, type WithdrawalItem } from './types';

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
          أكّد تحويل مبلغ{' '}
          <strong>{fmtWithdrawalMoney(item?.amount || 0)}</strong>{' '}
          إلى المحاضر <strong>{item?.instructor?.fullName || '—'}</strong>
        </p>
        {item?.bankName || item?.iban ? (
          <dl className="withdraw-transfer-meta">
            {item.bankName ? (
              <div>
                <dt>البنك</dt>
                <dd>{item.bankName}</dd>
              </div>
            ) : null}
            {item.accountName ? (
              <div>
                <dt>اسم الحساب</dt>
                <dd>{item.accountName}</dd>
              </div>
            ) : null}
            {item.iban ? (
              <div>
                <dt>IBAN</dt>
                <dd dir="ltr">{item.iban}</dd>
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
            <img src={preview} alt="معاينة إيصال التحويل" />
            <div className="withdraw-transfer-preview-actions">
              <Button type="button" variant="outline" size="sm" icon={<Upload size={16} />} onClick={openPicker}>
                استبدال الصورة
              </Button>
              <Button type="button" variant="ghost" size="sm" icon={<Trash2 size={16} />} onClick={onRemoveFile}>
                إزالة
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
            <span className="withdraw-transfer-dropzone-title">إرفاق صورة التحويل</span>
            <span className="withdraw-transfer-dropzone-hint">اسحب الصورة هنا أو اضغط للاختيار — PNG أو JPG (اختياري)</span>
          </button>
        )}
      </div>

      <div className="modal-actions">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          إلغاء
        </Button>
        <Button type="submit" loading={submitting} icon={<Upload size={16} />}>
          تأكيد الدفع
        </Button>
      </div>
    </form>
  );
}
