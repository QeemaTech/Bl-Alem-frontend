import { FormEvent, useId, useMemo, useState } from 'react';
import { Eye, EyeOff, KeyRound } from '@/icons';
import { cn } from '@/lib/cn';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import {
  getPasswordStrength,
  passwordStrengthLabels,
  type PasswordStrength,
} from './profileUtils';

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  error?: string;
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  error,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <label className={cn('field', error && 'has-error')} htmlFor={id}>
      <span>{label}</span>
      <div className="student-password-input-wrap">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className={cn('input', error && 'input-error')}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <button
          type="button"
          className="student-password-toggle"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
          aria-pressed={visible}
        >
          {visible ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
        </button>
      </div>
      {error ? <small id={`${id}-error`} className="field-error">{error}</small> : null}
    </label>
  );
}

const strengthClass: Record<Exclude<PasswordStrength, 'empty'>, string> = {
  weak: 'is-weak',
  fair: 'is-fair',
  good: 'is-good',
  strong: 'is-strong',
};

function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = getPasswordStrength(password);
  const segments = 4;
  const filled =
    strength === 'empty' ? 0 :
    strength === 'weak' ? 1 :
    strength === 'fair' ? 2 :
    strength === 'good' ? 3 : 4;

  if (!password) return null;

  return (
    <div className="student-password-strength" aria-live="polite">
      <div className="student-password-strength-bars" aria-hidden>
        {Array.from({ length: segments }).map((_, index) => (
          <span
            key={index}
            className={cn(
              'student-password-strength-bar',
              index < filled && strength !== 'empty' && strengthClass[strength],
            )}
          />
        ))}
      </div>
      {strength !== 'empty' ? (
        <p className={cn('student-password-strength-label', strengthClass[strength])}>
          {passwordStrengthLabels[strength]}
        </p>
      ) : null}
    </div>
  );
}

interface PasswordCardProps {
  saving: boolean;
  onSubmit: (payload: { currentPassword: string; newPassword: string }) => Promise<void>;
}

export function PasswordCard({ saving, onSubmit }: PasswordCardProps) {
  const baseId = useId();
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const canSubmit = useMemo(
    () => passwords.currentPassword && passwords.newPassword && passwords.confirmPassword,
    [passwords],
  );

  const validate = () => {
    const next: Record<string, string> = {};
    if (!passwords.currentPassword) next.currentPassword = 'أدخل كلمة المرور الحالية.';
    if (!passwords.newPassword) next.newPassword = 'أدخل كلمة المرور الجديدة.';
    else if (passwords.newPassword.length < 8) next.newPassword = '8 أحرف على الأقل.';
    if (!passwords.confirmPassword) next.confirmPassword = 'أكّد كلمة المرور الجديدة.';
    else if (passwords.confirmPassword !== passwords.newPassword) {
      next.confirmPassword = 'كلمتا المرور غير متطابقتين.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    try {
      await onSubmit({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setErrors({});
    } catch {
      /* keep fields on failure */
    }
  };

  const update = (key: keyof typeof passwords, value: string) => {
    setPasswords((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  return (
    <Card className="student-profile-password-card support-ticket-page-card">
      <header className="student-profile-section-head">
        <span className="student-profile-section-icon" aria-hidden>
          <KeyRound size={22} />
        </span>
        <div>
          <h2 className="student-profile-section-title">تغيير كلمة المرور</h2>
          <p className="student-profile-section-desc">
            استخدم كلمة مرور قوية لا تقل عن 8 أحرف مع أرقام ورموز.
          </p>
        </div>
      </header>

      <form className="form-grid student-profile-password-form" onSubmit={handleSubmit} noValidate>
        <PasswordField
          id={`${baseId}-current`}
          label="كلمة المرور الحالية"
          value={passwords.currentPassword}
          onChange={(value) => update('currentPassword', value)}
          autoComplete="current-password"
          error={errors.currentPassword}
        />
        <PasswordField
          id={`${baseId}-new`}
          label="كلمة المرور الجديدة"
          value={passwords.newPassword}
          onChange={(value) => update('newPassword', value)}
          autoComplete="new-password"
          error={errors.newPassword}
        />
        <div className="student-profile-password-strength-wrap">
          <PasswordStrengthMeter password={passwords.newPassword} />
        </div>
        <PasswordField
          id={`${baseId}-confirm`}
          label="تأكيد كلمة المرور"
          value={passwords.confirmPassword}
          onChange={(value) => update('confirmPassword', value)}
          autoComplete="new-password"
          error={errors.confirmPassword}
        />
        <div className="student-profile-form-actions">
          <Button type="submit" variant="secondary" loading={saving} disabled={!canSubmit}>
            تحديث كلمة المرور
          </Button>
        </div>
      </form>
    </Card>
  );
}
