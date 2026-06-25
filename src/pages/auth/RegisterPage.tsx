import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, CoPresent, GraduationCap, Lock, Mail, Phone, User } from '@/icons';
import { cn } from '@/lib/cn';
import { BrandMark } from '../../components/ui/BrandMark';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../store/AuthContext';
import { getDashboardPath } from '../../utils/roleRedirect';
import type { MaterialIcon } from '@/icons';
import type { RegisterInput } from '../../utils/types';

type Role = 'STUDENT' | 'INSTRUCTOR';

const roleOptions: { value: Role; label: string; desc: string; icon: MaterialIcon }[] = [
  { value: 'STUDENT', label: 'طالب', desc: 'تعلّم واكتسب مهارات جديدة', icon: GraduationCap },
  { value: 'INSTRUCTOR', label: 'محاضر', desc: 'أنشئ دوراتك وشارك خبرتك', icon: CoPresent },
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

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState<RegisterInput & { confirmPassword: string; acceptTerms: boolean }>({
    fullName: '', email: '', phone: '', password: '', confirmPassword: '', role: 'STUDENT', acceptTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (key: string, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.fullName.trim()) next.fullName = 'الاسم الكامل مطلوب';
    if (!form.email.trim()) next.email = 'البريد الإلكتروني مطلوب';
    if (!form.password) next.password = 'كلمة المرور مطلوبة';
    else if (form.password.length < 8) next.password = 'كلمة المرور 8 أحرف على الأقل';
    if (form.password !== form.confirmPassword) next.confirmPassword = 'كلمتا المرور غير متطابقتين';
    if (!form.acceptTerms) next.acceptTerms = 'يجب الموافقة على الشروط والأحكام';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const { confirmPassword: _, acceptTerms: __, ...payload } = form;
      const user = await register(payload);
      showToast(
        user.role === 'INSTRUCTOR' ? 'تم إنشاء حساب المحاضر وهو بانتظار الموافقة' : 'تم إنشاء الحساب بنجاح',
        'success',
      );
      navigate(getDashboardPath(user.role), {
        replace: true,
        state: user.role === 'STUDENT' && user.referralCode
          ? { welcomeReferral: true, referralCode: user.referralCode }
          : undefined,
      });
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'حدث خطأ، حاول مرة أخرى';
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
          <h1 className="mb-1 text-2xl font-extrabold text-on-surface sm:text-3xl">إنشاء حساب جديد</h1>
          <p className="text-on-surface-variant">ابدأ رحلتك التعليمية داخل منصّة بالعِلم في أقل من دقيقة.</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <motion.div variants={item}>
            <Field
              label="الاسم الكامل"
              icon={User}
              placeholder="أدخل اسمك الكامل"
              value={form.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
              error={errors.fullName}
            />
          </motion.div>

          <motion.div variants={item}>
            <Field
              label="البريد الإلكتروني"
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
              label="رقم الجوال"
              icon={Phone}
              type="tel"
              placeholder="05xxxxxxxx"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
            />
          </motion.div>

          <motion.div variants={item}>
            <span className="mb-2 block text-sm font-semibold text-on-surface">نوع الحساب</span>
            <div className="grid grid-cols-2 gap-4">
              {roleOptions.map(({ value, label, desc, icon: Icon }) => {
                const active = form.role === value;
                return (
                  <motion.button
                    key={value}
                    type="button"
                    onClick={() => updateField('role', value)}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className={cn(
                      'relative rounded-2xl border-2 p-5 text-center transition-colors duration-200',
                      active
                        ? 'border-primary bg-primary-container/40 ring-4 ring-primary/10'
                        : 'border-outline bg-surface-container hover:border-primary/60',
                    )}
                  >
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

          <motion.div variants={item}>
            <Field
              label="كلمة المرور"
              icon={Lock}
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => updateField('password', e.target.value)}
              error={errors.password}
              helper="8 أحرف على الأقل"
            />
          </motion.div>

          <motion.div variants={item}>
            <Field
              label="تأكيد كلمة المرور"
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
                أوافق على{' '}
                <a href="/terms" target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">
                  الشروط والأحكام
                </a>
              </span>
            </label>
            {errors.acceptTerms ? <small className="mt-1 block text-xs font-semibold text-error">{errors.acceptTerms}</small> : null}
          </motion.div>

          <motion.div variants={item}>
            <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
              {isSubmitting ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
            </Button>
          </motion.div>
        </form>

        <motion.p variants={item} className="mt-6 text-center text-sm text-on-surface-variant">
          لديك حساب بالفعل؟{' '}
          <Link to="/login" className="font-bold text-primary hover:underline">تسجيل الدخول</Link>
        </motion.p>
      </div>
    </motion.div>
  );
}
