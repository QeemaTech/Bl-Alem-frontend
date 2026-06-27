import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'danger',
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation('common');

  return (
    <Modal
      isOpen={isOpen}
      title={title}
      onClose={onCancel}
      actions={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel ?? t('dialog.cancel')}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmLabel ?? t('dialog.confirm')}
          </Button>
        </>
      }
    >
      <p style={{ margin: 0 }}>{message}</p>
    </Modal>
  );
}
