import { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, UserRound } from '@/icons';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Textarea } from '../../ui/Textarea';
import { useStudentProfileLabels } from '../../../hooks/useStudentProfileLabels';
import type { ProfileFormState } from './profileUtils';
import { InterestChips } from './InterestChips';

interface PersonalInfoFormProps {
  profile: ProfileFormState;
  errors: Record<string, string>;
  saving: boolean;
  onChange: (key: keyof ProfileFormState, value: string | string[]) => void;
  onSubmit: (event: FormEvent) => void;
}

export function PersonalInfoForm({
  profile,
  errors,
  saving,
  onChange,
  onSubmit,
}: PersonalInfoFormProps) {
  const { t } = useTranslation('profile');
  const { educationOptions, languageOptions } = useStudentProfileLabels();

  return (
    <Card className="student-profile-form-card support-ticket-page-card">
      <header className="student-profile-section-head">
        <span className="student-profile-section-icon" aria-hidden>
          <UserRound size={22} />
        </span>
        <div>
          <h2 className="student-profile-section-title">{t('student.personal.title')}</h2>
          <p className="student-profile-section-desc">{t('student.personal.desc')}</p>
        </div>
      </header>

      <form className="form-grid student-profile-form" onSubmit={onSubmit} noValidate>
        <Input
          label={t('student.personal.fullName')}
          value={profile.fullName || ''}
          onChange={(e) => onChange('fullName', e.target.value)}
          error={errors.fullName}
          required
          autoComplete="name"
        />
        <Input
          label={t('student.personal.phone')}
          value={profile.phone || ''}
          onChange={(e) => onChange('phone', e.target.value)}
          placeholder="+9665XXXXXXXX"
          error={errors.phone}
          required
          autoComplete="tel"
          inputMode="tel"
        />
        <Select
          label={t('student.personal.educationLevel')}
          value={profile.educationLevel || ''}
          onChange={(e) => onChange('educationLevel', e.target.value)}
          options={educationOptions}
        />
        <Select
          label={t('student.personal.preferredLanguage')}
          value={profile.preferredLanguage || 'ar'}
          onChange={(e) => onChange('preferredLanguage', e.target.value)}
          options={languageOptions}
        />
        <Textarea
          label={t('student.personal.bio')}
          value={profile.bio || ''}
          onChange={(e) => onChange('bio', e.target.value)}
          placeholder={t('student.personal.bioPlaceholder')}
          rows={4}
          className="student-profile-bio-field"
        />
        <div className="student-profile-interests-field">
          <InterestChips
            value={profile.interests || []}
            onChange={(interests) => onChange('interests', interests)}
          />
        </div>
        <div className="student-profile-form-actions">
          <Button type="submit" loading={saving} icon={<Save size={16} aria-hidden />}>
            {t('student.personal.save')}
          </Button>
        </div>
      </form>
    </Card>
  );
}
