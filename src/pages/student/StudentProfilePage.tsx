import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { studentApi } from '../../api/student';
import { PageHeader } from '../../components/ui/PageHeader';
import { useToast } from '../../components/ui/Toast';
import {
  calcProfileCompletion,
  PasswordCard,
  PersonalInfoForm,
  ProfilePageSkeleton,
  ProfileStatisticsCards,
  ProfileSummaryCard,
  type ProfileFormState,
} from '../../components/student/profile';

export default function StudentProfilePage() {
  const { t } = useTranslation('profile');
  const { showToast } = useToast();
  const [profile, setProfile] = useState<ProfileFormState>({ interests: [] });
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
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
        interests: profileData.studentProfile?.interests || [],
      });
      setStats(dashboardData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const completion = useMemo(() => calcProfileCompletion(profile), [profile]);

  const update = (key: keyof ProfileFormState, value: string | string[]) => {
    setProfile((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key as string]) return current;
      const next = { ...current };
      delete next[key as string];
      return next;
    });
  };

  const validateProfile = () => {
    const next: Record<string, string> = {};
    if (!profile.fullName?.trim()) next.fullName = t('student.validation.fullName');
    if (!profile.phone?.trim()) next.phone = t('student.validation.phone');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!validateProfile()) {
      showToast(t('student.validation.reviewFields'), 'error');
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
        interests: profile.interests || [],
      });
      setProfile({
        ...updated,
        bio: updated.studentProfile?.bio || '',
        educationLevel: updated.studentProfile?.educationLevel || '',
        interests: updated.studentProfile?.interests || [],
      });
      showToast(t('student.toast.saved'), 'success');
    } catch {
      showToast(t('student.toast.saveFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (payload: { currentPassword: string; newPassword: string }) => {
    setPasswordSaving(true);
    try {
      await studentApi.changePassword(payload);
      showToast(t('student.toast.passwordChanged'), 'success');
    } catch {
      showToast(t('student.toast.passwordFailed'), 'error');
      throw new Error('password-change-failed');
    } finally {
      setPasswordSaving(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    setUploadingAvatar(true);
    try {
      const uploaded = await studentApi.upload('image', file);
      update('avatar', uploaded.url);
      showToast(t('student.toast.avatarUploaded'), 'success');
    } catch {
      showToast(t('student.toast.avatarFailed'), 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const copyReferral = async () => {
    const code = stats?.rewardsSummary?.referralCode;
    if (!code) return;
    await navigator.clipboard.writeText(code);
    showToast(t('student.toast.referralCopied'), 'success');
  };

  if (loading) return <ProfilePageSkeleton />;

  const walletBalance = Number(stats?.rewardsSummary?.walletBalance || profile.wallet?.balance || 0);
  const rewardPoints = Number(stats?.rewardsSummary?.rewardPoints || 0);

  return (
    <div className="page-grid student-profile-page">
      <PageHeader
        title={t('student.title')}
        subtitle={t('student.subtitle')}
      />

      <ProfileStatisticsCards stats={stats} completion={completion} />

      <div className="student-profile-layout">
        <aside className="student-profile-summary" aria-label={t('student.summaryAria')}>
          <ProfileSummaryCard
            profile={profile}
            completion={completion}
            walletBalance={walletBalance}
            rewardPoints={rewardPoints}
            referralCode={stats?.rewardsSummary?.referralCode}
            uploadingAvatar={uploadingAvatar}
            onUploadAvatar={uploadAvatar}
            onRemoveAvatar={() => update('avatar', '')}
            onCopyReferral={copyReferral}
          />
        </aside>

        <div className="student-profile-main">
          <PersonalInfoForm
            profile={profile}
            errors={errors}
            saving={saving}
            onChange={update}
            onSubmit={save}
          />
          <PasswordCard saving={passwordSaving} onSubmit={changePassword} />
        </div>
      </div>
    </div>
  );
}
