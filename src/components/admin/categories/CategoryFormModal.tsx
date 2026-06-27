import { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdminCategoryLabels } from '../../../hooks/useAdminCategoryLabels';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Modal } from '../../ui/Modal';
import { Select } from '../../ui/Select';

interface CategoryFormModalProps {
  isOpen: boolean;
  editing: any | null;
  form: {
    nameAr: string;
    nameEn: string;
    slug: string;
    icon: string;
    image: string;
    status: string;
  };
  submitting: boolean;
  onClose: () => void;
  onChange: (form: CategoryFormModalProps['form']) => void;
  onSubmit: (e: FormEvent) => void;
}

export function CategoryFormModal({
  isOpen,
  editing,
  form,
  submitting,
  onClose,
  onChange,
  onSubmit,
}: CategoryFormModalProps) {
  const { t } = useTranslation('categories');
  const { statusLabels } = useAdminCategoryLabels();

  return (
    <Modal
      isOpen={isOpen}
      title={editing ? t('admin.categories.editCategory') : t('admin.categories.addCategory')}
      onClose={onClose}
    >
      <form className="stack-sm" onSubmit={onSubmit}>
        <Input
          label={t('admin.categories.form.nameAr')}
          value={form.nameAr}
          onChange={(e) => onChange({ ...form, nameAr: e.target.value })}
          required
        />
        <Input
          label={t('admin.categories.form.nameEn')}
          value={form.nameEn}
          onChange={(e) => onChange({ ...form, nameEn: e.target.value })}
        />
        <Input
          label={t('admin.categories.form.slug')}
          value={form.slug}
          onChange={(e) => onChange({ ...form, slug: e.target.value })}
          placeholder={t('admin.categories.form.slugPlaceholder')}
          dir="ltr"
          disabled={Boolean(editing)}
        />
        <Input
          label={t('admin.categories.form.icon')}
          value={form.icon}
          onChange={(e) => onChange({ ...form, icon: e.target.value })}
          placeholder={t('admin.categories.form.iconPlaceholder')}
        />
        <Input
          label={t('admin.categories.form.image')}
          value={form.image}
          onChange={(e) => onChange({ ...form, image: e.target.value })}
          placeholder={t('admin.categories.form.imagePlaceholder')}
        />
        <Select
          label={t('admin.categories.form.status')}
          value={form.status}
          onChange={(e) => onChange({ ...form, status: e.target.value })}
          options={[
            { label: statusLabels.ACTIVE, value: 'ACTIVE' },
            { label: statusLabels.INACTIVE, value: 'INACTIVE' },
          ]}
        />
        <Button loading={submitting}>
          {editing ? t('admin.categories.saveChanges') : t('admin.categories.createCategory')}
        </Button>
      </form>
    </Modal>
  );
}
