import { CheckCircle2 } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';

interface SuccessModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  actionLabel?: string;
  onAction: () => void;
}

export function SuccessModal({ isOpen, title, message, actionLabel = 'حسناً', onAction }: SuccessModalProps) {
  return (
    <Modal isOpen={isOpen} title="" onClose={onAction}>
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <div className="empty-state-icon" style={{ margin: '0 auto 20px', width: 72, height: 72 }}>
          <CheckCircle2 size={36} color="var(--success)" />
        </div>
        <h3 style={{ margin: '0 0 8px', fontWeight: 800, fontSize: '1.2rem' }}>{title}</h3>
        <p style={{ margin: '0 0 24px', color: 'var(--muted)' }}>{message}</p>
        <Button fullWidth onClick={onAction}>{actionLabel}</Button>
      </div>
    </Modal>
  );
}
