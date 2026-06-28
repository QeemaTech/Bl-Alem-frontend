import { useTranslation } from 'react-i18next';
import {
  Award, CalendarDays, Copy, GraduationCap, Mail, Phone, Trophy, User, Wallet,
} from '@/icons';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { formatMoney } from '../../../utils/formatMoney';
import { useStudentProfileLabels } from '../../../hooks/useStudentProfileLabels';
import type { ProfileFormState } from './profileUtils';
import { ProfileAvatar } from './ProfileAvatar';
import { ProfileCompletion } from './ProfileCompletion';

interface ProfileSummaryCardProps {
  profile: ProfileFormState;
  completion: number;
  walletBalance: number;
  rewardPoints: number;
  referralCode?: string;
  uploadingAvatar: boolean;
  onUploadAvatar: (file: File) => void;
  onRemoveAvatar: () => void;
  onCopyReferral: () => void;
}

export function ProfileSummaryCard({
  profile,
  completion,
  walletBalance,
  rewardPoints,
  referralCode,
  uploadingAvatar,
  onUploadAvatar,
  onRemoveAvatar,
  onCopyReferral,
}: ProfileSummaryCardProps) {
  const { t } = useTranslation('profile');
  const { educationLabel, fmtProfileDate, lang } = useStudentProfileLabels();
  const hasBio = Boolean(profile.bio?.trim());

  return (
    <Card className="student-profile-summary-card support-ticket-page-card">
      <ProfileAvatar
        value={profile.avatar || ''}
        name={profile.fullName || ''}
        uploading={uploadingAvatar}
        onUpload={onUploadAvatar}
        onRemove={onRemoveAvatar}
      />

      <div className="student-profile-summary-head">
        <h2 className="student-profile-summary-name">
          {profile.fullName?.trim() || '—'}
        </h2>
        <Badge variant="info">{t('student.roleBadge')}</Badge>
      </div>

      {!hasBio ? (
        <p className="student-profile-summary-empty" role="status">
          {t('student.emptyBio')}
        </p>
      ) : (
        <p className="student-profile-summary-bio">{profile.bio}</p>
      )}

      <div className="student-profile-meta" aria-label={t('student.metaAria')}>
        <div className="student-profile-meta-row">
          <span className="student-profile-meta-icon" aria-hidden><User size={18} /></span>
          <span className="student-profile-meta-label">{t('student.meta.name')}</span>
          <span className="student-profile-meta-value">{profile.fullName?.trim() || '—'}</span>
        </div>
        <div className="student-profile-meta-row">
          <span className="student-profile-meta-icon" aria-hidden><Mail size={18} /></span>
          <span className="student-profile-meta-label">{t('student.meta.email')}</span>
          <span className="student-profile-meta-value" dir="ltr">{profile.email || '—'}</span>
        </div>
        <div className="student-profile-meta-row">
          <span className="student-profile-meta-icon" aria-hidden><Phone size={18} /></span>
          <span className="student-profile-meta-label">{t('student.meta.phone')}</span>
          <span className="student-profile-meta-value" dir="ltr">{profile.phone?.trim() || '—'}</span>
        </div>
        <div className="student-profile-meta-row">
          <span className="student-profile-meta-icon" aria-hidden><GraduationCap size={18} /></span>
          <span className="student-profile-meta-label">{t('student.meta.education')}</span>
          <span className="student-profile-meta-value">{educationLabel(profile.educationLevel)}</span>
        </div>
        <div className="student-profile-meta-row">
          <span className="student-profile-meta-icon" aria-hidden><CalendarDays size={18} /></span>
          <span className="student-profile-meta-label">{t('student.meta.joinedAt')}</span>
          <span className="student-profile-meta-value">{fmtProfileDate(profile.createdAt)}</span>
        </div>
        <div className="student-profile-meta-row">
          <span className="student-profile-meta-icon" aria-hidden><Wallet size={18} /></span>
          <span className="student-profile-meta-label">{t('student.meta.wallet')}</span>
          <span className="student-profile-meta-value">{formatMoney(walletBalance, undefined, lang)}</span>
        </div>
        <div className="student-profile-meta-row">
          <span className="student-profile-meta-icon" aria-hidden><Trophy size={18} /></span>
          <span className="student-profile-meta-label">{t('student.meta.points')}</span>
          <span className="student-profile-meta-value">{t('student.meta.pointsUnit', { count: rewardPoints })}</span>
        </div>
        <div className="student-profile-meta-row">
          <span className="student-profile-meta-icon" aria-hidden><Award size={18} /></span>
          <span className="student-profile-meta-label">{t('student.meta.interests')}</span>
          <span className="student-profile-meta-value">
            {profile.interests?.length
              ? t('student.meta.interestsCount', { count: profile.interests.length })
              : t('student.meta.interestsEmpty')}
          </span>
        </div>
      </div>

      {referralCode ? (
        <div className="student-profile-referral">
          <span className="student-profile-referral-label">{t('student.meta.referralCode')}</span>
          <div className="student-profile-referral-row">
            <strong dir="ltr">{referralCode}</strong>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={<Copy size={14} aria-hidden />}
              onClick={onCopyReferral}
              aria-label={t('student.meta.copyReferral')}
            >
              {t('student.meta.copy')}
            </Button>
          </div>
        </div>
      ) : null}

      <ProfileCompletion value={completion} compact />
    </Card>
  );
}
