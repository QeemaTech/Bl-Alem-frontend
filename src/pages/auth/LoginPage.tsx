import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, Phone } from '@/icons';
import { cn } from '@/lib/cn';
import { Button } from '../../components/ui/Button';
import { BrandMark } from '../../components/ui/BrandMark';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../store/AuthContext';
import { getDashboardPath } from '../../utils/roleRedirect';
import type { MaterialIcon } from '@/icons';

type LoginMode = 'email' | 'phone';

const socialProviders = [
  { id: 'google' as const, label: 'Google' },
  { id: 'facebook' as const, label: 'Facebook' },
  { id: 'apple' as const, label: 'Apple' },
  { id: 'twitter' as const, label: 'X' },
];

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

export default function LoginPage() {
  const { t } = useTranslation('auth');
  const { t: tv } = useTranslation('validation');
  const { t: te } = useTranslation('errors');
  const { t: tc } = useTranslation('common');
  const navigate = useNavigate();
  const { login, socialLogin } = useAuth();
  const { showToast } = useToast();
  const [mode, setMode] = useState<LoginMode>('email');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!identifier.trim()) {
      next.identifier = mode === 'email' ? tv('required.email') : tv('required.phone');
    }
    if (mode === 'email' && !password) next.password = tv('required.password');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    if (mode === 'phone') {
      navigate('/otp', { state: { phone: identifier } });
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await login({ identifier, password });
      showToast(t('login.success'), 'success');
      navigate(getDashboardPath(user.role), { replace: true });
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message || te('generic');
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocial = async (provider: typeof socialProviders[number]['id']) => {
    setIsSubmitting(true);
    try {
      const demoEmail = `demo.${provider}@bi-alem.com`;
      const user = await socialLogin({
        provider,
        email: demoEmail,
        fullName: t('login.demoUser', { provider }),
      });
      showToast(t('login.socialSuccess', { provider }), 'success');
      navigate(getDashboardPath(user.role), { replace: true });
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message || t('login.socialFail');
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="w-full max-w-[440px]">
      <div className="rounded-3xl border border-outline/70 bg-surface-container/90 p-6 shadow-3 backdrop-blur-xl sm:p-8">
        <motion.div variants={item} className="mb-7">
          <BrandMark variant="compact" />
        </motion.div>

        <motion.div variants={item} className="mb-7">
          <h1 className="mb-1 text-2xl font-extrabold text-on-surface sm:text-3xl">{t('login.title')}</h1>
          <p className="text-on-surface-variant">{t('login.subtitle')}</p>
        </motion.div>

        <motion.div variants={item} className="mb-6 grid grid-cols-2 gap-1 rounded-2xl bg-surface-container-high p-1">
          {(['email', 'phone'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={cn(
                'rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-200',
                mode === value ? 'bg-surface-container text-primary shadow-1' : 'text-on-surface-variant',
              )}
            >
              {value === 'email' ? t('login.emailTab') : t('login.phoneTab')}
            </button>
          ))}
        </motion.div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {mode === 'email' ? (
            <>
              <motion.div variants={item}>
                <Field
                  label={t('login.emailLabel')}
                  icon={Mail}
                  type="email"
                  placeholder="example@email.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  error={errors.identifier}
                />
              </motion.div>
              <motion.div variants={item}>
                <Field
                  label={t('login.passwordLabel')}
                  icon={Lock}
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                />
              </motion.div>
            </>
          ) : (
            <motion.div variants={item}>
              <Field
                label={t('login.phoneLabel')}
                icon={Phone}
                type="tel"
                placeholder="+966500000002"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                error={errors.identifier}
                helper={t('login.phoneHelper')}
              />
            </motion.div>
          )}
          <motion.div variants={item}>
            <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
              {mode === 'phone' ? t('login.submitOtp') : isSubmitting ? t('login.submitting') : t('login.submit')}
            </Button>
          </motion.div>
        </form>

        <motion.div variants={item} className="my-6 flex items-center gap-3 text-on-surface-variant">
          <span className="h-px flex-1 bg-outline" />
          <span className="text-xs font-semibold">{tc('or')}</span>
          <span className="h-px flex-1 bg-outline" />
        </motion.div>

        <motion.div variants={item} className="grid grid-cols-2 gap-2">
          {socialProviders.map((provider) => (
            <Button
              key={provider.id}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSocial(provider.id)}
              disabled={isSubmitting}
            >
              {provider.label}
            </Button>
          ))}
        </motion.div>

        <motion.p variants={item} className="mt-6 text-center text-sm text-on-surface-variant">
          {t('login.noAccount')}{' '}
          <Link to="/register" className="font-bold text-primary hover:underline">{t('login.createAccount')}</Link>
        </motion.p>
      </div>
    </motion.div>
  );
}
