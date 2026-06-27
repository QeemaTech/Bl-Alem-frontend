import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Eye, Pencil, Shield, Trash2 } from '@/icons';
import { Button } from '../../ui/Button';

function stopRowClick(e: MouseEvent | KeyboardEvent) {
  e.stopPropagation();
}

interface UserRowActionsProps {
  onDetail: () => void;
  onEdit: () => void;
  onToggleStatus?: () => void;
  isActive?: boolean;
  onDelete?: () => void;
  deleteDisabled?: boolean;
  extra?: ReactNode;
}

export function UserRowActions({
  onDetail,
  onEdit,
  onToggleStatus,
  isActive = true,
  onDelete,
  deleteDisabled,
  extra,
}: UserRowActionsProps) {
  const { t } = useTranslation('users');

  return (
    <div
      className="table-actions user-row-actions"
      onClick={stopRowClick}
      onKeyDown={stopRowClick}
      role="presentation"
    >
      <Button variant="outline" size="sm" icon={<Eye size={16} />} onClick={onDetail}>
        {t('actions.detail')}
      </Button>
      <Button variant="ghost" size="sm" icon={<Pencil size={16} />} onClick={onEdit}>
        {t('actions.edit')}
      </Button>
      {extra}
      {onToggleStatus ? (
        isActive ? (
          <Button variant="secondary" size="sm" icon={<Shield size={16} />} onClick={onToggleStatus}>
            {t('actions.suspend')}
          </Button>
        ) : (
          <Button variant="secondary" size="sm" icon={<CheckCircle2 size={16} />} onClick={onToggleStatus}>
            {t('actions.activate')}
          </Button>
        )
      ) : null}
      {onDelete ? (
        <Button
          variant="danger"
          size="sm"
          icon={<Trash2 size={16} />}
          onClick={onDelete}
          disabled={deleteDisabled}
        >
          {t('actions.delete')}
        </Button>
      ) : null}
    </div>
  );
}
