import { FormEvent } from 'react';
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
  return (
    <Modal
      isOpen={isOpen}
      title={editing ? 'تعديل التصنيف' : 'إضافة تصنيف'}
      onClose={onClose}
    >
      <form className="stack-sm" onSubmit={onSubmit}>
        <Input
          label="الاسم العربي"
          value={form.nameAr}
          onChange={(e) => onChange({ ...form, nameAr: e.target.value })}
          required
        />
        <Input
          label="الاسم الإنجليزي"
          value={form.nameEn}
          onChange={(e) => onChange({ ...form, nameEn: e.target.value })}
        />
        <Input
          label="الرابط (slug)"
          value={form.slug}
          onChange={(e) => onChange({ ...form, slug: e.target.value })}
          placeholder="programming"
          dir="ltr"
          disabled={Boolean(editing)}
        />
        <Input
          label="الأيقونة"
          value={form.icon}
          onChange={(e) => onChange({ ...form, icon: e.target.value })}
          placeholder="code"
        />
        <Input
          label="رابط الصورة (اختياري)"
          value={form.image}
          onChange={(e) => onChange({ ...form, image: e.target.value })}
          placeholder="https://..."
        />
        <Select
          label="الحالة"
          value={form.status}
          onChange={(e) => onChange({ ...form, status: e.target.value })}
          options={[
            { label: 'فعّال', value: 'ACTIVE' },
            { label: 'غير فعّال', value: 'INACTIVE' },
          ]}
        />
        <Button loading={submitting}>{editing ? 'حفظ التعديلات' : 'إنشاء التصنيف'}</Button>
      </form>
    </Modal>
  );
}
