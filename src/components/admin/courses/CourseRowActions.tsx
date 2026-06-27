import { useTranslation } from 'react-i18next';
import type { KeyboardEvent, MouseEvent } from 'react';
import {
  CheckCircle2,
  Eye,
  Send,
  Shield,
  Trash2,
  XCircle,
} from '@/icons';
import { Button } from '../../ui/Button';
import {
  canApproveCourse,
  canPublishCourse,
  canRejectCourse,
  canSuspendCourse,
} from './courseShared';

function stopRowClick(e: MouseEvent | KeyboardEvent) {
  e.stopPropagation();
}

interface CourseRowActionsProps {
  course: any;
  onDetail: () => void;
  onApprove?: () => void;
  onPublish?: () => void;
  onReject?: () => void;
  onSuspend?: () => void;
  onDelete?: () => void;
}

export function CourseRowActions({
  course,
  onDetail,
  onApprove,
  onPublish,
  onReject,
  onSuspend,
  onDelete,
}: CourseRowActionsProps) {
  const { t } = useTranslation('courses');
  const status = String(course?.status || '');

  return (
    <div
      className="table-actions course-row-actions"
      onClick={stopRowClick}
      onKeyDown={stopRowClick}
      role="presentation"
    >
      <Button variant="outline" size="sm" icon={<Eye size={16} />} onClick={onDetail}>
        {t('admin.actions.detail')}
      </Button>
      {canApproveCourse(status) && onApprove ? (
        <Button variant="secondary" size="sm" icon={<CheckCircle2 size={16} />} onClick={onApprove}>
          {t('admin.actions.approve')}
        </Button>
      ) : null}
      {canPublishCourse(status) && onPublish ? (
        <Button size="sm" icon={<Send size={16} />} onClick={onPublish}>
          {t('admin.actions.publish')}
        </Button>
      ) : null}
      {canSuspendCourse(status) && onSuspend ? (
        <Button variant="secondary" size="sm" icon={<Shield size={16} />} onClick={onSuspend}>
          {t('admin.actions.suspend')}
        </Button>
      ) : null}
      {canRejectCourse(status) && onReject ? (
        <Button variant="danger" size="sm" icon={<XCircle size={16} />} onClick={onReject}>
          {t('admin.actions.reject')}
        </Button>
      ) : null}
      {onDelete ? (
        <Button variant="danger" size="sm" icon={<Trash2 size={16} />} onClick={onDelete}>
          {t('admin.actions.delete')}
        </Button>
      ) : null}
    </div>
  );
}
