import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Bell, BellOff, Download, Send } from '@/icons';
import { adminApi } from '../../api/admin';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { FilterBar } from '../../components/ui/FilterBar';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { Table } from '../../components/ui/Table';
import { Textarea } from '../../components/ui/Textarea';
import { useToast } from '../../components/ui/Toast';
import { exportTableToExcel } from '../../utils/exportExcel';

const typeLabels: Record<string, string> = {
  WELCOME: 'ترحيب',
  LIVE_SESSION: 'جلسة مباشرة',
  CERTIFICATE: 'شهادة',
  REWARD: 'مكافأة',
  PAYMENT: 'دفع',
  COMMUNITY: 'مجتمع',
  SUBSCRIPTION: 'اشتراك',
  EARNING: 'أرباح',
  REVIEW: 'تقييم',
  WITHDRAWAL: 'سحب',
  COURSE: 'كورس',
  INSTRUCTOR_REQUEST: 'طلب محاضر',
  COURSE_REVIEW: 'مراجعة كورس',
  SUPPORT: 'دعم فني',
  ADMIN: 'إداري',
};

const roleLabels: Record<string, string> = {
  STUDENT: 'طالب',
  INSTRUCTOR: 'محاضر',
  SUPER_ADMIN: 'مشرف',
};

const fmtDate = (value: string) => new Date(value).toLocaleDateString('ar-SA', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const exportColumns = [
  { key: 'id', header: 'رقم الإشعار' },
  { key: 'recipient', header: 'المستلم' },
  { key: 'email', header: 'البريد' },
  { key: 'role', header: 'الدور' },
  { key: 'title', header: 'العنوان' },
  { key: 'body', header: 'النص' },
  { key: 'type', header: 'النوع' },
  { key: 'readStatus', header: 'حالة القراءة' },
  { key: 'createdAt', header: 'التاريخ' },
];

export default function AdminNotificationsPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [readFilter, setReadFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({
    targetType: 'ALL',
    userId: '',
    titleAr: '',
    bodyAr: '',
    type: 'ADMIN',
  });

  const load = async () => {
    setLoading(true);
    setItems(await adminApi.notifications());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filteredItems = useMemo(() => {
    let result = items;
    if (typeFilter) result = result.filter((i) => i.type === typeFilter);
    if (readFilter === 'read') result = result.filter((i) => i.isRead);
    if (readFilter === 'unread') result = result.filter((i) => !i.isRead);
    if (roleFilter) result = result.filter((i) => i.user?.role === roleFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((i) =>
        [i.titleAr, i.bodyAr, i.user?.fullName, i.user?.email, typeLabels[i.type], String(i.id)]
          .some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return result;
  }, [items, typeFilter, readFilter, roleFilter, search]);

  const stats = useMemo(() => ({
    total: items.length,
    unread: items.filter((i) => !i.isRead).length,
    read: items.filter((i) => i.isRead).length,
    adminSent: items.filter((i) => i.type === 'ADMIN').length,
  }), [items]);

  const typeOptions = useMemo(() => {
    const types = [...new Set(items.map((i) => i.type).filter(Boolean))].sort();
    return [
      { label: 'كل الأنواع', value: '' },
      ...types.map((type) => ({ label: typeLabels[type] || type, value: type })),
    ];
  }, [items]);

  const tableRows = useMemo(() => filteredItems.map((row) => ({
    id: row.id,
    recipient: row.user?.fullName || '—',
    email: row.user?.email || '—',
    role: roleLabels[row.user?.role] || row.user?.role || '—',
    title: row.titleAr,
    body: row.bodyAr?.length > 50 ? `${row.bodyAr.slice(0, 50)}...` : row.bodyAr,
    type: typeLabels[row.type] || row.type || '—',
    readStatus: row.isRead ? 'مقروء' : 'غير مقروء',
    createdAt: fmtDate(row.createdAt),
    _raw: row,
  })), [filteredItems]);

  const sendNotification = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await adminApi.sendNotification(form);
      showToast(`تم إرسال الإشعار إلى ${result?.sent ?? ''} مستخدم.`, 'success');
      setSendOpen(false);
      setForm({ targetType: 'ALL', userId: '', titleAr: '', bodyAr: '', type: 'ADMIN' });
      load();
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = () => {
    exportTableToExcel(
      'الإشعارات',
      exportColumns,
      tableRows.map(({ _raw, body, ...row }) => ({
        ...row,
        body: _raw.bodyAr || body,
      })),
    );
  };

  return (
    <div className="page-grid">
      <div className="reports-header">
        <PageHeader
          title="الإشعارات"
          subtitle="إدارة وإرسال إشعارات المنصة للمستخدمين"
        />
        <div className="chip-row">
          <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!items.length}>
            تصدير Excel
          </Button>
          <Button icon={<Send size={18} />} onClick={() => setSendOpen(true)}>
            إرسال إشعار
          </Button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="إجمالي الإشعارات" value={String(stats.total)} icon={Bell} />
        <StatCard title="غير مقروء" value={String(stats.unread)} icon={BellOff} />
        <StatCard title="مقروء" value={String(stats.read)} icon={Bell} />
        <StatCard title="إشعارات إدارية" value={String(stats.adminSent)} icon={Send} />
      </div>

      <FilterBar
        searchValue={search}
        searchPlaceholder="بحث بالعنوان، النص، المستلم، أو البريد..."
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setTypeFilter(''); setReadFilter(''); setRoleFilter(''); }}
      >
        <Select
          label="النوع"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          options={typeOptions}
        />
        <Select
          label="حالة القراءة"
          value={readFilter}
          onChange={(e) => setReadFilter(e.target.value)}
          options={[
            { label: 'الكل', value: '' },
            { label: 'غير مقروء', value: 'unread' },
            { label: 'مقروء', value: 'read' },
          ]}
        />
        <Select
          label="دور المستلم"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          options={[
            { label: 'الكل', value: '' },
            { label: 'طلاب', value: 'STUDENT' },
            { label: 'محاضرين', value: 'INSTRUCTOR' },
            { label: 'مشرفين', value: 'SUPER_ADMIN' },
          ]}
        />
      </FilterBar>

      <Card>
        <Table
          loading={loading}
          data={tableRows}
          emptyTitle="لا توجد إشعارات"
          emptyDescription="لم يتم إرسال أي إشعارات بعد."
          columns={[
            { key: 'id', header: 'رقم الإشعار' },
            { key: 'recipient', header: 'المستلم' },
            { key: 'role', header: 'الدور' },
            { key: 'title', header: 'العنوان' },
            { key: 'type', header: 'النوع' },
            {
              key: 'readStatus',
              header: 'الحالة',
              render: (row) => (
                <Badge variant={row._raw?.isRead ? 'default' : 'info'}>
                  {row.readStatus}
                </Badge>
              ),
            },
            { key: 'createdAt', header: 'التاريخ' },
            {
              key: 'actions',
              header: 'الإجراءات',
              render: (row) => (
                <Button variant="secondary" size="sm" onClick={() => setSelected(row._raw)}>
                  التفاصيل
                </Button>
              ),
            },
          ]}
        />
      </Card>

      <Modal isOpen={Boolean(selected)} title="تفاصيل الإشعار" onClose={() => setSelected(null)}>
        {selected ? (
          <div className="stack-sm withdrawal-detail">
            <div className="detail-row"><span>رقم الإشعار</span><strong>{selected.id}</strong></div>
            <div className="detail-row"><span>المستلم</span><strong>{selected.user?.fullName}</strong></div>
            <div className="detail-row"><span>البريد</span><strong>{selected.user?.email}</strong></div>
            <div className="detail-row"><span>الدور</span><strong>{roleLabels[selected.user?.role] || selected.user?.role}</strong></div>
            <div className="detail-row"><span>النوع</span><strong>{typeLabels[selected.type] || selected.type}</strong></div>
            <div className="detail-row">
              <span>الحالة</span>
              <Badge variant={selected.isRead ? 'default' : 'info'}>{selected.isRead ? 'مقروء' : 'غير مقروء'}</Badge>
            </div>
            <div className="detail-row"><span>التاريخ</span><strong>{fmtDate(selected.createdAt)}</strong></div>
            <div className="admin-notification-body">
              <strong>{selected.titleAr}</strong>
              <p>{selected.bodyAr}</p>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal isOpen={sendOpen} title="إرسال إشعار" onClose={() => setSendOpen(false)}>
        <form className="stack-sm" onSubmit={sendNotification}>
          <Select
            label="الفئة المستهدفة"
            value={form.targetType}
            onChange={(e) => setForm({ ...form, targetType: e.target.value })}
            options={[
              { label: 'جميع المستخدمين', value: 'ALL' },
              { label: 'الطلاب', value: 'STUDENTS' },
              { label: 'المحاضرون', value: 'INSTRUCTORS' },
              { label: 'مستخدم محدد', value: 'SPECIFIC_USER' },
            ]}
          />
          {form.targetType === 'SPECIFIC_USER' ? (
            <Input
              label="معرف المستخدم"
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
              required
            />
          ) : null}
          <Select
            label="نوع الإشعار"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            options={[
              { label: 'إداري', value: 'ADMIN' },
              { label: 'ترحيب', value: 'WELCOME' },
              { label: 'جلسة مباشرة', value: 'LIVE_SESSION' },
              { label: 'دفع', value: 'PAYMENT' },
              { label: 'كورس', value: 'COURSE' },
            ]}
          />
          <Input
            label="العنوان"
            value={form.titleAr}
            onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
            required
          />
          <Textarea
            label="نص الإشعار"
            value={form.bodyAr}
            onChange={(e) => setForm({ ...form, bodyAr: e.target.value })}
            required
          />
          <Button loading={submitting}>إرسال الإشعار</Button>
        </form>
      </Modal>
    </div>
  );
}
