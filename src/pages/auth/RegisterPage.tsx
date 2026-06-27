import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, CoPresent, GraduationCap, Lock, Mail, Phone, User, AlertTriangle } from '@/icons';
import { cn } from '@/lib/cn';
import { BrandMark } from '../../components/ui/BrandMark';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../store/AuthContext';
import { useSiteSettings } from '../../store/SiteSettingsContext';
import { getDashboardPath } from '../../utils/roleRedirect';
import type { MaterialIcon } from '@/icons';
import type { RegisterInput } from '../../utils/types';

type Role = 'STUDENT' | 'INSTRUCTOR';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
};

function Field({
  label, icon: Icon, error, helper, ...props
}: {
  label: string;
  icon: MaterialIcon;
  error?: string;
  helper?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-on-surface">{label}</span>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 grid -translate-y-1/2 place-items-center text-on-surface-variant" style={{ insetInlineStart: '0.875rem' }}>
          <Icon size={20} />
        </span>
        <input
          className={cn(
            'h-13 w-full rounded-xl border bg-surface-container text-on-surface outline-none transition-all duration-200',
            'focus:border-primary focus:ring-4 focus:ring-primary/15',
            error ? 'border-error' : 'border-outline hover:border-outline-variant',
          )}
          style={{ paddingInlineStart: '2.75rem', paddingInlineEnd: '0.875rem' }}
          {...props}
        />
      </div>
      {error ? <small className="mt-1 block text-xs font-semibold text-error">{error}</small>
        : helper ? <small className="mt-1 block text-xs text-on-surface-variant">{helper}</small> : null}
    </label>
  );
}

export default function RegisterPage() {
  const { t } = useTranslation('auth');
  const { t: tv } = useTranslation('validation');
  const { t: te } = useTranslation('errors');
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showToast } = useToast();
  const { platform, loaded: settingsLoaded } = useSiteSettings();
  const [form, setForm] = useState<RegisterInput & { confirmPassword: string; acceptTerms: boolean }>({
    fullName: '', email: '', phone: '', password: '', confirmPassword: '', role: 'STUDENT', referralCode: '', acceptTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roleOptions: { value: Role; label: string; desc: string; icon: MaterialIcon }[] = [
    { value: 'STUDENT', label: t('register.student'), desc: t('register.studentDesc'), icon: GraduationCap },
    { value: 'INSTRUCTOR', label: t('register.instructor'), desc: t('register.instructorDesc'), icon: CoPresent },
  ];

  const studentOpen = platform.registrationEnabled;
  const instructorOpen = platform.instructorRegistrationEnabled;
  const registrationClosed = platform.maintenanceMode || (!studentOpen && !instructorOpen);

  useEffect(() => {
    if (!settingsLoaded) return;
    if (form.role === 'STUDENT' && !studentOpen && instructorOpen) {
      setForm((current) => ({ ...current, role: 'INSTRUCTOR' }));
    } else if (form.role === 'INSTRUCTOR' && !instructorOpen && studentOpen) {
      setForm((current) => ({ ...current, role: 'STUDENT' }));
    }
  }, [settingsLoaded, studentOpen, instructorOpen, form.role]);

  const updateField = (key: string, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.fullName.trim()) next.fullName = tv('required.fullName');
    if (!form.email.trim()) next.email = tv('required.email');
    if (!form.password) next.password = tv('required.password');
    else if (form.password.length < 8) next.password = tv('password.minLength');
    if (form.password !== form.confirmPassword) next.confirmPassword = tv('password.mismatch');
    if (!form.acceptTerms) next.acceptTerms = tv('required.terms');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (registrationClosed) {
      showToast(platform.maintenanceMode ? t('register.maintenanceToast') : t('register.closedToast'), 'error');
      return;
    }
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const { confirmPassword: _, acceptTerms: __, referralCode, ...rest } = form;
      const payload = {
        ...rest,
        ...(form.role === 'STUDENT' && referralCode?.trim() ? { referralCode: referralCode.trim().toUpperCase() } : {}),
      };
      const user = await register(payload);
      showToast(
        user.role === 'INSTRUCTOR' ? t('register.successInstructor') : t('register.successStudent'),
        'success',
      );
      navigate(getDashboardPath(user.role), {
        replace: true,
        state: user.role === 'STUDENT' && user.referralCode
          ? { welcomeReferral: true, referralCode: user.referralCode }
          : undefined,
      });
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message || te('generic');
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="w-full max-w-[500px]">
      <div className="rounded-3xl border border-outline/70 bg-surface-container/90 p-6 shadow-3 backdrop-blur-xl sm:p-8">
        <motion.div variants={item} className="mb-7">
          <BrandMark variant="compact" />
        </motion.div>

        <motion.div variants={item} className="mb-8">
          <h1 className="mb-1 text-2xl font-extrabold text-on-surface sm:text-3xl">{t('register.title')}</h1>
          <p className="text-on-surface-variant">{t('register.subtitle')}</p>
        </motion.div>

        {settingsLoaded && platform.maintenanceMode ? (
          <motion.div
            variants={item}
            className="mb-6 flex items-start gap-3 rounded-2xl border border-warning/50 bg-warning-container/35 p-4"
          >
            <AlertTriangle size={22} className="mt-0.5 shrink-0 text-warning" />
            <div>
              <p className="font-bold text-on-surface">{t('register.maintenanceTitle')}</p>
              <p className="mt-1 text-sm text-on-surface-variant">{t('register.maintenanceDesc')}</p>
            </div>
          </motion.div>
        ) : null}

        {settingsLoaded && !platform.maintenanceMode && !studentOpen && !instructorOpen ? (
          <motion.div variants={item} className="mb-6 rounded-2xl border border-error/40 bg-error-container/25 p-4">
            <p className="font-bold text-error">{t('register.closedTitle')}</p>
            <p className="mt-1 text-sm text-on-surface-variant">{t('register.closedDesc')}</p>
          </motion.div>
        ) : null}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <motion.div variants={item}>
            <Field
              label={t('register.fullName')}
              icon={User}
              placeholder={t('register.fullNamePlaceholder')}
              value={form.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
              error={errors.fullName}
            />
          </motion.div>

          <motion.div variants={item}>
            <Field
              label={t('register.email')}
              icon={Mail}
              type="email"
              placeholder="example@email.com"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              error={errors.email}
            />
          </motion.div>

          <motion.div variants={item}>
            <Field
              label={t('register.phone')}
              icon={Phone}
              type="tel"
              placeholder={t('register.phonePlaceholder')}
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
            />
          </motion.div>

          <motion.div variants={item}>
            <span className="mb-2 block text-sm font-semibold text-on-surface">{t('register.accountType')}</span>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {roleOptions.map(({ value, label, desc, icon: Icon }) => {
                const active = form.role === value;
                const disabled = platform.maintenanceMode
                  || (value === 'STUDENT' && !studentOpen)
                  || (value === 'INSTRUCTOR' && !instructorOpen);
                const closedLabel = value === 'STUDENT' ? t('register.studentClosed') : t('register.instructorClosed');
                return (
                  <motion.button
                    key={value}
                    type="button"
                    disabled={disabled}
                    onClick={() => !disabled && updateField('role', value)}
                    whileHover={disabled ? undefined : { scale: 1.02, y: -2 }}
                    whileTap={disabled ? undefined : { scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className={cn(
                      'relative rounded-2xl border-2 p-4 text-center transition-colors duration-200 sm:p-5',
                      disabled && 'cursor-not-allowed opacity-55',
                      active && !disabled
                        ? 'border-primary bg-primary-container/40 ring-4 ring-primary/10'
                        : 'border-outline bg-surface-container hover:border-primary/60',
                    )}
                  >
                    {disabled && !platform.maintenanceMode ? (
                      <span
                        className="absolute top-2 rounded-full bg-error-container px-2 py-0.5 text-[10px] font-bold text-error"
                        style={{ insetInlineStart: '0.5rem' }}
                      >
                        {closedLabel}
                      </span>
                    ) : null}
                    <motion.span
                      initial={false}
                      animate={{ scale: active ? 1 : 0, opacity: active ? 1 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      className="absolute top-3 grid h-6 w-6 place-items-center rounded-full bg-primary text-on-primary"
                      style={{ insetInlineStart: '0.75rem' }}
                    >
                      <Check size={16} />
                    </motion.span>
                    <span className={cn(
                      'mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl transition-colors duration-200',
                      active ? 'bg-primary text-on-primary' : 'bg-primary-container/50 text-primary',
                    )}>
                      <Icon size={28} />
                    </span>
                    <span className="block text-[1.02rem] font-bold text-on-surface">{label}</span>
                    <span className="mt-1 block text-xs text-on-surface-variant">{desc}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {form.role === 'STUDENT' ? (
            <motion.div variants={item}>
              <Field
                label={t('register.referralCode')}
                icon={User}
                placeholder={t('register.referralPlaceholder')}
                value={form.referralCode || ''}
                onChange={(e) => updateField('referralCode', e.target.value.toUpperCase())}
                helper={t('register.referralHelper')}
              />
            </motion.div>
          ) : null}

          <motion.div variants={item}>
            <Field
              label={t('register.password')}
              icon={Lock}
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => updateField('password', e.target.value)}
              error={errors.password}
              helper={t('register.passwordHelper')}
            />
          </motion.div>

          <motion.div variants={item}>
            <Field
              label={t('register.confirmPassword')}
              icon={Lock}
              type="password"
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={(e) => updateField('confirmPassword', e.target.value)}
              error={errors.confirmPassword}
            />
          </motion.div>

          <motion.div variants={item}>
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={form.acceptTerms}
                onChange={(e) => updateField('acceptTerms', e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-primary"
              />
              <span className="text-sm text-on-surface">
                {t('register.acceptTerms')}{' '}
                <a href="/terms" target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">
                  {t('register.termsLink')}
                </a>
              </span>
            </label>
            {errors.acceptTerms ? <small className="mt-1 block text-xs font-semibold text-error">{errors.acceptTerms}</small> : null}
          </motion.div>

          <motion.div variants={item}>
            <Button type="submit" size="lg" fullWidth loading={isSubmitting} disabled={registrationClosed}>
              {registrationClosed ? t('register.unavailable') : isSubmitting ? t('register.submitting') : t('register.submit')}
            </Button>
          </motion.div>
        </form>

        <motion.p variants={item} className="mt-6 text-center text-sm text-on-surface-variant">
          {t('register.hasAccount')}{' '}
          <Link to="/login" className="font-bold text-primary hover:underline">{t('register.signIn')}</Link>
        </motion.p>
      </div>
    </motion.div>
  );
}
