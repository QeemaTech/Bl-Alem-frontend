import { X } from '@/icons';
import type { ReactNode } from 'react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  actions?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ isOpen, title, onClose, children, footer, actions, size = 'md' }: ModalProps) {
  if (!isOpen) return null;

  const maxWidth = size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-2xl' : 'max-w-lg';
  const footerContent = footer ?? actions;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className={`modal-panel ${maxWidth}`}>
        <div className="modal-header">
          <h3 id="modal-title">{title}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="إغلاق">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footerContent ? <div className="modal-actions">{footerContent}</div> : null}
      </div>
    </div>
  );
}

interface ModalFooterProps {
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  variant?: 'primary' | 'danger';
}

export function ModalFooter({
  onCancel,
  onConfirm,
  confirmLabel = 'حفظ',
  cancelLabel = 'إلغاء',
  loading,
  variant = 'primary',
}: ModalFooterProps) {
  return (
    <>
      <Button variant="ghost" onClick={onCancel} disabled={loading}>{cancelLabel}</Button>
      <Button variant={variant} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
    </>
  );
}
