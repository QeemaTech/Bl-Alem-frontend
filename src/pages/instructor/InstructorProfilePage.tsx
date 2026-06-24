import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  Award, BookOpen, Briefcase, FileText, Mail, Phone, RefreshCw, Save,
  ShieldCheck, Upload, UserRound, UsersRound,
} from '@/icons';
import { instructorApi } from '../../api/instructor';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import { Input } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { Textarea } from '../../components/ui/Textarea';
import { useToast } from '../../components/ui/Toast';
import { formatMoney } from '../../utils/formatMoney';
import { mediaUrl } from '../../utils/mediaUrl';

const approvalLabels: Record<string, string> = {
  APPROVED: 'معتمد',
  PENDING: 'قيد المراجعة',
  REJECTED: 'مرفوض',
};

const approvalVariant = (status: string) => {
  if (status === 'APPROVED') return 'success' as const;
  if (status === 'PENDING') return 'pending' as const;
  if (status === 'REJECTED') return 'rejected' as const;
  return 'default' as const;
};

const approvalHint: Record<string, string> = {
  APPROVED: 'حسابك معتمد — يمكنك إدارة الكورسات والجلسات والأرباح.',
  PENDING: 'طلبك قيد المراجعة من الإدارة. يمكنك تحديث بياناتك في هذه الأثناء.',
  REJECTED: 'تم رفض الطلب. حدّث بياناتك ثم أعد الإرسال للمراجعة.',
};

function ProfileAvatarField({
  value,
  name,
  uploading,
  onUpload,
  onRemove,
}: {
  value: string;
  name: string;
  uploading: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewSrc = mediaUrl(value);

  return (
    <div className="instructor-profile-avatar-wrap">
      <div className="instructor-profile-avatar">
        {previewSrc ? (
          <img src={previewSrc} alt={name || 'صورة المدرب'} />
        ) : (
          <UserRound size={48} />
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = '';
        }}
      />
      <div className="instructor-profile-avatar-actions">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={uploading}
          icon={<Upload size={14} />}
          onClick={() => inputRef.current?.click()}
        >
          {previewSrc ? 'تغيير الصورة' : 'رفع صورة'}
        </Button>
        {previewSrc ? (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            إزالة
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function CvUploadField({
  value,
  uploading,
  onUpload,
  onRemove,
}: {
  value: string;
  uploading: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileName = value ? value.split('/').pop() : '';

  return (
    <div className="instructor-cv-field">
      <label className="field">
        <span>ملف السيرة الذاتية</span>
        <div className="instructor-cv-box">
          <div className="instructor-cv-meta">
            <FileText size={22} />
            <div>
              {fileName ? (
                <>
                  <strong>{decodeURIComponent(fileName)}</strong>
                  <a href={mediaUrl(value)} target="_blank" rel="noreferrer">عرض الملف</a>
                </>
              ) : (
                <span>لم يُرفع ملف بعد — PDF أو DOCX</span>
              )}
            </div>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
              e.target.value = '';
            }}
          />
          <div className="instructor-cv-actions">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={uploading}
              icon={<Upload size={14} />}
              onClick={() => inputRef.current?.click()}
            >
              {value ? 'استبدال الملف' : 'رفع السيرة'}
            </Button>
            {value ? (
              <Button type="button" variant="outline" size="sm" onClick={onRemove}>
                إزالة
              </Button>
            ) : null}
          </div>
        </div>
        <small className="field-helper">يُستخدم من الإدارة عند مراجعة طلب الاعتماد.</small>
      </label>
    </div>
  );
}

export default function InstructorProfilePage() {
  const { showToast } = useToast();
  const [profile, setProfile] = useState<any>({});
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [confirmResubmit, setConfirmResubmit] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    try {
      const [profileData, dashboardData] = await Promise.all([
        instructorApi.profile(),
        instructorApi.dashboard().catch(() => null),
      ]);
      setProfile({ ...profileData, ...profileData.instructorProfile });
      setStats(dashboardData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const status = profile.approvalStatus || 'PENDING';

  const completion = useMemo(() => {
    let filled = 0;
    if (profile.fullName?.trim()) filled += 1;
    if (profile.phone?.trim()) filled += 1;
    if (profile.title?.trim()) filled += 1;
    if (profile.specialization?.trim()) filled += 1;
    if (profile.yearsOfExperience) filled += 1;
    if (profile.bio?.trim()) filled += 1;
    if (profile.profileImage) filled += 1;
    if (profile.cvFile) filled += 1;
    return Math.round((filled / 8) * 100);
  }, [profile]);

  const update = (key: string, value: string) => {
    setProfile((current: any) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!profile.fullName?.trim()) next.fullName = 'أدخل الاسم الكامل.';
    if (!profile.phone?.trim()) next.phone = 'أدخل رقم الجوال.';
    if (!profile.title?.trim()) next.title = 'أدخل المسمى المهني.';
    if (!profile.specialization?.trim()) next.specialization = 'أدخل التخصص.';
    if (!profile.bio?.trim()) next.bio = 'أضف نبذة تعريفية.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      showToast('راجع الحقول المطلوبة.', 'error');
      return;
    }
    setSaving(true);
    try {
      const updated = await instructorApi.updateProfile({
        fullName: profile.fullName,
        phone: profile.phone,
        title: profile.title,
        specialization: profile.specialization,
        yearsOfExperience: profile.yearsOfExperience,
        bio: profile.bio,
        profileImage: profile.profileImage,
        cvFile: profile.cvFile,
      });
      setProfile({ ...updated, ...updated.instructorProfile });
      showToast('تم تحديث الملف الشخصي.', 'success');
    } catch {
      showToast('تعذّر حفظ التعديلات.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const resubmit = async () => {
    setResubmitting(true);
    try {
      await instructorApi.resubmitProfile();
      setProfile((current: any) => ({ ...current, approvalStatus: 'PENDING', rejectionReason: null }));
      showToast('تمت إعادة الإرسال للمراجعة.', 'success');
      setConfirmResubmit(false);
    } catch {
      showToast('تعذّر إعادة الإرسال.', 'error');
    } finally {
      setResubmitting(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    setUploadingAvatar(true);
    try {
      const uploaded = await instructorApi.upload('image', file);
      update('profileImage', uploaded.url);
      showToast('تم رفع الصورة.', 'success');
    } catch {
      showToast('تعذّر رفع الصورة.', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const uploadCv = async (file: File) => {
    setUploadingCv(true);
    try {
      const uploaded = await instructorApi.upload('file', file);
      update('cvFile', uploaded.url);
      showToast('تم رفع ملف السيرة.', 'success');
    } catch {
      showToast('تعذّر رفع الملف.', 'error');
    } finally {
      setUploadingCv(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="page-grid instructor-profile-page">
      <PageHeader
        title="الملف الشخصي"
        subtitle="حدّث بياناتك المهنية وتابع حالة اعتماد حسابك"
      />

      {status === 'REJECTED' && profile.rejectionReason ? (
        <Card className="notice-card rejected">
          <div>
            <Badge variant="rejected">{approvalLabels.REJECTED}</Badge>
            <h2>سبب الرفض</h2>
            <p>{profile.rejectionReason}</p>
          </div>
          <Button icon={<RefreshCw size={16} />} onClick={() => setConfirmResubmit(true)}>
            إعادة الإرسال للمراجعة
          </Button>
        </Card>
      ) : null}

      {status === 'PENDING' ? (
        <Card className="notice-card pending">
          <div>
            <Badge variant="pending">{approvalLabels.PENDING}</Badge>
            <h2>حسابك قيد المراجعة</h2>
            <p>{approvalHint.PENDING}</p>
          </div>
        </Card>
      ) : null}

      {stats ? (
        <div className="stats-grid">
          <StatCard title="الكورسات" value={String(stats.totalCourses || 0)} icon={BookOpen} hint={`${stats.publishedCourses || 0} منشورة`} />
          <StatCard title="الطلاب" value={String(stats.totalStudents || 0)} icon={UsersRound} />
          <StatCard title="إجمالي الأرباح" value={formatMoney(stats.totalEarnings || 0)} icon={Award} />
          <StatCard title="اكتمال الملف" value={`${completion}%`} icon={ShieldCheck} hint={completion >= 100 ? 'ملف مكتمل' : 'أكمل بياناتك'} />
        </div>
      ) : null}

      <div className="instructor-profile-layout">
        <Card className="instructor-profile-sidebar">
          <ProfileAvatarField
            value={profile.profileImage || ''}
            name={profile.fullName}
            uploading={uploadingAvatar}
            onUpload={uploadAvatar}
            onRemove={() => update('profileImage', '')}
          />
          <h2 className="instructor-profile-name">{profile.fullName || '—'}</h2>
          {profile.title ? <p className="instructor-profile-title">{profile.title}</p> : null}
          <Badge variant={approvalVariant(status)}>{approvalLabels[status] || status}</Badge>
          <p className="instructor-profile-hint">{approvalHint[status] || ''}</p>

          <div className="instructor-profile-contact">
            <span><Mail size={15} /> {profile.email || '—'}</span>
            <span><Phone size={15} /> {profile.phone || '—'}</span>
            {profile.specialization ? (
              <span><Briefcase size={15} /> {profile.specialization}</span>
            ) : null}
            {profile.yearsOfExperience ? (
              <span>{profile.yearsOfExperience} سنوات خبرة</span>
            ) : null}
          </div>

          {status === 'REJECTED' ? (
            <Button
              className="instructor-profile-resubmit"
              variant="secondary"
              icon={<RefreshCw size={16} />}
              onClick={() => setConfirmResubmit(true)}
            >
              إعادة الإرسال للمراجعة
            </Button>
          ) : null}

          <div className="instructor-profile-completion">
            <div className="instructor-profile-completion-head">
              <span>اكتمال الملف</span>
              <strong>{completion}%</strong>
            </div>
            <div className="course-form-progress-bar">
              <div className="course-form-progress-fill" style={{ width: `${completion}%` }} />
            </div>
          </div>
        </Card>

        <Card className="instructor-profile-form-card">
          <h2 className="course-form-section-title">بيانات المدرب</h2>
          <p className="course-form-section-desc">هذه البيانات تظهر للطلاب والإدارة عند مراجعة حسابك.</p>

          <form className="form-grid instructor-profile-form" onSubmit={save}>
            <Input
              label="الاسم الكامل"
              value={profile.fullName || ''}
              onChange={(e) => update('fullName', e.target.value)}
              error={errors.fullName}
              required
            />
            <Input
              label="الجوال"
              value={profile.phone || ''}
              onChange={(e) => update('phone', e.target.value)}
              placeholder="+9665XXXXXXXX"
              error={errors.phone}
              required
            />
            <Input
              label="المسمى المهني"
              value={profile.title || ''}
              onChange={(e) => update('title', e.target.value)}
              placeholder="مثال: خبير React و JavaScript"
              error={errors.title}
              required
            />
            <Input
              label="التخصص"
              value={profile.specialization || ''}
              onChange={(e) => update('specialization', e.target.value)}
              placeholder="مثال: تطوير الويب والتعليم البرمجي"
              error={errors.specialization}
              required
            />
            <Input
              label="سنوات الخبرة"
              type="number"
              min={0}
              max={60}
              value={profile.yearsOfExperience || ''}
              onChange={(e) => update('yearsOfExperience', e.target.value)}
            />
            <Textarea
              label="نبذة تعريفية"
              value={profile.bio || ''}
              onChange={(e) => update('bio', e.target.value)}
              placeholder="عرّف بنفسك وخبراتك وأسلوبك في التدريس..."
              error={errors.bio}
              rows={5}
            />
            <CvUploadField
              value={profile.cvFile || ''}
              uploading={uploadingCv}
              onUpload={uploadCv}
              onRemove={() => update('cvFile', '')}
            />
            <div className="instructor-profile-form-actions">
              <Button type="submit" loading={saving} icon={<Save size={16} />}>
                حفظ التعديلات
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <ConfirmDialog
        isOpen={confirmResubmit}
        title="إعادة الإرسال للمراجعة"
        message="سيتم إرسال ملفك من جديد للإدارة للمراجعة. تأكد من تحديث جميع البيانات قبل المتابعة."
        onConfirm={resubmit}
        onCancel={() => setConfirmResubmit(false)}
        confirmLabel="إرسال"
        loading={resubmitting}
      />
    </div>
  );
}
