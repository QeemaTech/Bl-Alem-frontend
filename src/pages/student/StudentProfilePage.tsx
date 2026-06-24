import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  Award, BookOpen, Copy, GraduationCap, KeyRound, Mail, Phone, Save,
  ShieldCheck, Upload, UserRound, Wallet,
} from '@/icons';
import { studentApi } from '../../api/student';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import { Input } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { Textarea } from '../../components/ui/Textarea';
import { useToast } from '../../components/ui/Toast';
import { formatMoney } from '../../utils/formatMoney';
import { mediaUrl } from '../../utils/mediaUrl';

const educationOptions = [
  { label: 'اختر المستوى', value: '' },
  { label: 'ثانوي', value: 'ثانوي' },
  { label: 'جامعي', value: 'جامعي' },
  { label: 'دراسات عليا', value: 'دراسات عليا' },
  { label: 'مهني / تقني', value: 'مهني' },
  { label: 'تعلم ذاتي', value: 'تعلم ذاتي' },
  { label: 'أخرى', value: 'أخرى' },
];

const languageOptions = [
  { label: 'العربية', value: 'ar' },
  { label: 'English', value: 'en' },
];

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
          <img src={previewSrc} alt={name || 'صورة الملف'} />
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

export default function StudentProfilePage() {
  const { showToast } = useToast();
  const [profile, setProfile] = useState<any>({});
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    try {
      const [profileData, dashboardData] = await Promise.all([
        studentApi.profile(),
        studentApi.dashboard().catch(() => null),
      ]);
      setProfile({
        ...profileData,
        bio: profileData.studentProfile?.bio || '',
        educationLevel: profileData.studentProfile?.educationLevel || '',
        interestsText: (profileData.studentProfile?.interests || []).join('، '),
      });
      setStats(dashboardData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const completion = useMemo(() => {
    let filled = 0;
    if (profile.fullName?.trim()) filled += 1;
    if (profile.phone?.trim()) filled += 1;
    if (profile.bio?.trim()) filled += 1;
    if (profile.educationLevel?.trim()) filled += 1;
    if (profile.interestsText?.trim()) filled += 1;
    if (profile.avatar) filled += 1;
    return Math.round((filled / 6) * 100);
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

  const validateProfile = () => {
    const next: Record<string, string> = {};
    if (!profile.fullName?.trim()) next.fullName = 'أدخل الاسم الكامل.';
    if (!profile.phone?.trim()) next.phone = 'أدخل رقم الجوال.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!validateProfile()) {
      showToast('راجع الحقول المطلوبة.', 'error');
      return;
    }
    setSaving(true);
    try {
      const updated = await studentApi.updateProfile({
        fullName: profile.fullName,
        phone: profile.phone,
        bio: profile.bio,
        educationLevel: profile.educationLevel,
        preferredLanguage: profile.preferredLanguage,
        avatar: profile.avatar || '',
        interests: String(profile.interestsText || '')
          .split(/[,،]/)
          .map((item) => item.trim())
          .filter(Boolean),
      });
      setProfile({
        ...updated,
        bio: updated.studentProfile?.bio || '',
        educationLevel: updated.studentProfile?.educationLevel || '',
        interestsText: (updated.studentProfile?.interests || []).join('، '),
      });
      showToast('تم تحديث الملف الشخصي.', 'success');
    } catch {
      showToast('تعذّر حفظ التعديلات.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (!passwords.currentPassword || !passwords.newPassword) {
      showToast('أدخل كلمة المرور الحالية والجديدة.', 'error');
      return;
    }
    if (passwords.newPassword.length < 8) {
      showToast('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل.', 'error');
      return;
    }
    setPasswordSaving(true);
    try {
      await studentApi.changePassword(passwords);
      setPasswords({ currentPassword: '', newPassword: '' });
      showToast('تم تغيير كلمة المرور.', 'success');
    } catch {
      showToast('تعذّر تغيير كلمة المرور. تحقق من كلمة المرور الحالية.', 'error');
    } finally {
      setPasswordSaving(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    setUploadingAvatar(true);
    try {
      const uploaded = await studentApi.upload('image', file);
      update('avatar', uploaded.url);
      showToast('تم رفع الصورة.', 'success');
    } catch {
      showToast('تعذّر رفع الصورة.', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const copyReferral = async () => {
    const code = stats?.rewardsSummary?.referralCode;
    if (!code) return;
    await navigator.clipboard.writeText(code);
    showToast('تم نسخ كود الإحالة.', 'success');
  };

  if (loading) return <DashboardSkeleton />;

  const walletBalance = Number(stats?.rewardsSummary?.walletBalance || profile.wallet?.balance || 0);

  return (
    <div className="page-grid student-profile-page">
      <PageHeader
        title="الملف الشخصي"
        subtitle="حدّث بياناتك وتفضيلات التعلم"
      />

      {stats ? (
        <div className="stats-grid">
          <StatCard title="كورساتي" value={String(stats.totalEnrolledCourses || 0)} icon={BookOpen} hint={`${stats.activeCourses || 0} نشطة`} />
          <StatCard title="مكتملة" value={String(stats.completedCourses || 0)} icon={GraduationCap} />
          <StatCard title="الشهادات" value={String(stats.certificatesCount || 0)} icon={Award} />
          <StatCard title="اكتمال الملف" value={`${completion}%`} icon={ShieldCheck} hint={completion >= 100 ? 'ملف مكتمل' : 'أكمل بياناتك'} />
        </div>
      ) : null}

      <div className="instructor-profile-layout">
        <Card className="instructor-profile-sidebar">
          <ProfileAvatarField
            value={profile.avatar || ''}
            name={profile.fullName}
            uploading={uploadingAvatar}
            onUpload={uploadAvatar}
            onRemove={() => update('avatar', '')}
          />
          <h2 className="instructor-profile-name">{profile.fullName || '—'}</h2>
          <Badge variant="info">طالب</Badge>
          <p className="instructor-profile-hint">حدّث ملفك لتحصل على توصيات تعلم أفضل.</p>

          <div className="instructor-profile-contact">
            <span><Mail size={15} /> {profile.email || '—'}</span>
            <span><Phone size={15} /> {profile.phone || '—'}</span>
            {profile.educationLevel ? (
              <span><GraduationCap size={15} /> {profile.educationLevel}</span>
            ) : null}
            <span><Wallet size={15} /> {formatMoney(walletBalance)}</span>
          </div>

          {stats?.rewardsSummary?.referralCode ? (
            <div className="student-referral-box">
              <span>كود الإحالة</span>
              <strong dir="ltr">{stats.rewardsSummary.referralCode}</strong>
              <Button variant="ghost" size="sm" icon={<Copy size={14} />} onClick={copyReferral}>
                نسخ
              </Button>
            </div>
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

        <div className="student-profile-main">
          <Card className="instructor-profile-form-card">
            <h2 className="course-form-section-title">البيانات الشخصية</h2>
            <p className="course-form-section-desc">تُستخدم لتخصيص تجربتك التعليمية وتوصيات الكورسات.</p>

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
              <Select
                label="المستوى التعليمي"
                value={profile.educationLevel || ''}
                onChange={(e) => update('educationLevel', e.target.value)}
                options={educationOptions}
              />
              <Select
                label="لغة الواجهة المفضلة"
                value={profile.preferredLanguage || 'ar'}
                onChange={(e) => update('preferredLanguage', e.target.value)}
                options={languageOptions}
              />
              <Textarea
                label="نبذة عنك"
                value={profile.bio || ''}
                onChange={(e) => update('bio', e.target.value)}
                placeholder="عرّف بنفسك واهتماماتك التعليمية..."
                rows={4}
              />
              <Input
                label="الاهتمامات"
                value={profile.interestsText || ''}
                onChange={(e) => update('interestsText', e.target.value)}
                placeholder="البرمجة، التصميم، الأعمال"
                helper="افصل بين الاهتمامات بفاصلة."
              />
              <div className="instructor-profile-form-actions">
                <Button type="submit" loading={saving} icon={<Save size={16} />}>
                  حفظ التعديلات
                </Button>
              </div>
            </form>
          </Card>

          <Card className="student-password-card">
            <div className="student-password-head">
              <KeyRound size={22} />
              <div>
                <h2 className="course-form-section-title">تغيير كلمة المرور</h2>
                <p className="course-form-section-desc">استخدم كلمة مرور قوية لا تقل عن 8 أحرف.</p>
              </div>
            </div>
            <form className="form-grid student-password-form" onSubmit={changePassword}>
              <Input
                label="كلمة المرور الحالية"
                type="password"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords((c) => ({ ...c, currentPassword: e.target.value }))}
                autoComplete="current-password"
              />
              <Input
                label="كلمة المرور الجديدة"
                type="password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords((c) => ({ ...c, newPassword: e.target.value }))}
                autoComplete="new-password"
                helper="8 أحرف على الأقل."
              />
              <div className="instructor-profile-form-actions">
                <Button type="submit" variant="secondary" loading={passwordSaving}>
                  تحديث كلمة المرور
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
