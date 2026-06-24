import { CheckCircle2 } from '@/icons';
import { Button } from './Button';
import { Modal } from './Modal';

interface SuccessModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose?: () => void;
  actionLabel?: string;
  onAction?: () => void;
}

export function SuccessModal({
  isOpen,
  title,
  message,
  onClose = () => {},
  actionLabel = 'حسناً',
  onAction,
}: SuccessModalProps) {
  const handleAction = () => {
    if (onAction) onAction();
    else onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      title={title}
      onClose={onClose}
      footer={<Button onClick={handleAction}>{actionLabel}</Button>}
    >
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-success-container text-success">
          <CheckCircle2 size={32} />
        </div>
        <p className="m-0 text-on-surface-variant">{message}</p>
      </div>
    </Modal>
  );
}
