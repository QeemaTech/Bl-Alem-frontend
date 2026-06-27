import { useTranslation } from 'react-i18next';
import { CheckCircle2, Info, Pencil, Shield, Trash2 } from '@/icons';
import { useAdminCategoryLabels } from '../../../hooks/useAdminCategoryLabels';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { CategoryIcon } from './CategoryIcon';

interface CategoryDetailProps {
  category: any;
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  deleteDisabled?: boolean;
  submitting?: boolean;
}

export function CategoryDetail({
  category,
  onEdit,
  onToggleStatus,
  onDelete,
  deleteDisabled,
  submitting,
}: CategoryDetailProps) {
  const { t } = useTranslation('categories');
  const { statusLabels, statusVariant, fmtDate, empty } = useAdminCategoryLabels();
  const courseCount = category._count?.courses ?? category.courses?.length ?? 0;

  return (
    <div className="support-ticket-detail admin-category-detail admin-entity-detail">
      <div className="admin-entity-detail-header support-ticket-detail-header">
        <div className="admin-category-detail-heading">
          <span className="support-ticket-id">#{category.id}</span>
          <div className="admin-category-title-row">
            <span className="admin-entity-detail-icon" aria-hidden="true">
              <CategoryIcon icon={category.icon} size={24} filled />
            </span>
            <h2>{category.nameAr}</h2>
          </div>
          {category.nameEn ? <p className="admin-category-subtitle">{category.nameEn}</p> : null}
        </div>
        <Badge
          variant={statusVariant(category.status)}
          dot
          className="status-badge"
        >
          {statusLabels[category.status] || category.status}
        </Badge>
      </div>

      <section className="admin-entity-meta" aria-label={t('admin.categories.detail.metaAriaLabel')}>
        <div className="admin-entity-meta-head">
          <span className="admin-entity-meta-head-icon" aria-hidden="true">
            <Info size={20} />
          </span>
          <h3>{t('admin.categories.detail.metaTitle')}</h3>
        </div>
        <div className="admin-entity-meta-grid">
          <div className="detail-row">
            <span className="detail-row-label">{t('admin.categories.detail.slug')}</span>
            <div className="detail-row-value" dir="ltr">{category.slug}</div>
          </div>
          <div className="detail-row">
            <span className="detail-row-label">{t('admin.categories.detail.courseCount')}</span>
            <div className="detail-row-value">{courseCount}</div>
          </div>
          <div className="detail-row">
            <span className="detail-row-label">{t('admin.categories.detail.icon')}</span>
            <div className="detail-row-value admin-category-icon-label">
              <CategoryIcon icon={category.icon} size={18} />
              <span dir="ltr">{category.icon || empty}</span>
            </div>
          </div>
          {category.image ? (
            <div className="detail-row">
              <span className="detail-row-label">{t('admin.categories.detail.image')}</span>
              <div className="detail-row-value admin-category-image-url" dir="ltr">{category.image}</div>
            </div>
          ) : null}
          <div className="detail-row">
            <span className="detail-row-label">{t('admin.categories.detail.createdAt')}</span>
            <div className="detail-row-value">{fmtDate(category.createdAt)}</div>
          </div>
          <div className="detail-row">
            <span className="detail-row-label">{t('admin.categories.detail.updatedAt')}</span>
            <div className="detail-row-value">{fmtDate(category.updatedAt)}</div>
          </div>
        </div>
      </section>

      <div className="admin-entity-detail-actions">
        <Button variant="outline" size="sm" icon={<Pencil size={16} />} onClick={onEdit} disabled={submitting}>
          {t('actions.edit')}
        </Button>
        {category.status === 'ACTIVE' ? (
          <Button variant="secondary" size="sm" icon={<Shield size={16} />} onClick={onToggleStatus} disabled={submitting}>
            {t('actions.deactivate')}
          </Button>
        ) : (
          <Button variant="secondary" size="sm" icon={<CheckCircle2 size={16} />} onClick={onToggleStatus} disabled={submitting}>
            {t('actions.activate')}
          </Button>
        )}
        <Button
          variant="danger"
          size="sm"
          icon={<Trash2 size={16} />}
          onClick={onDelete}
          disabled={deleteDisabled || submitting}
        >
          {t('actions.delete')}
        </Button>
      </div>
    </div>
  );
}
