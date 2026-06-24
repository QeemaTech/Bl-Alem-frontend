import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, Phone } from '@/icons';
import { Button } from '../../components/ui/Button';
import { BrandMark } from '../../components/ui/BrandMark';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../store/AuthContext';
import { getDashboardPath } from '../../utils/roleRedirect';

type LoginMode = 'email' | 'phone';

const socialProviders = [
  { id: 'google' as const, label: 'Google', color: '#ea4335' },
  { id: 'facebook' as const, label: 'Facebook', color: '#1877f2' },
  { id: 'apple' as const, label: 'Apple', color: '#111' },
  { id: 'twitter' as const, label: 'X', color: '#000' },
];

export default function LoginPage() {
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
    if (!identifier.trim()) next.identifier = mode === 'email' ? 'البريد الإلكتروني مطلوب' : 'رقم الهاتف مطلوب';
    if (mode === 'email' && !password) next.password = 'كلمة المرور مطلوبة';
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
      showToast('تم تسجيل الدخول بنجاح', 'success');
      navigate(getDashboardPath(user.role), { replace: true });
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'حدث خطأ، حاول مرة أخرى';
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocial = async (provider: typeof socialProviders[number]['id']) => {
    setIsSubmitting(true);
    try {
      const demoEmail = `demo.${provider}@bi-alem.com`;
      const user = await socialLogin({ provider, email: demoEmail, fullName: `مستخدم ${provider}` });
      showToast(`تم تسجيل الدخول عبر ${provider}`, 'success');
      navigate(getDashboardPath(user.role), { replace: true });
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'فشل تسجيل الدخول الاجتماعي';
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="auth-card">
      <BrandMark variant="compact" />
      <h2>تسجيل الدخول</h2>
      <p>ادخل بياناتك للوصول إلى لوحة التحكم.</p>

      <div className="segmented-control">
        <button type="button" className={mode === 'email' ? 'active' : ''} onClick={() => setMode('email')}>بالبريد</button>
        <button type="button" className={mode === 'phone' ? 'active' : ''} onClick={() => setMode('phone')}>بالهاتف</button>
      </div>

      <form onSubmit={handleSubmit}>
        {mode === 'email' ? (
          <>
            <Input
              label="البريد الإلكتروني"
              type="email"
              placeholder="example@email.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              error={errors.identifier}
              icon={<Mail size={18} />}
            />
            <Input
              label="كلمة المرور"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              icon={<Lock size={18} />}
            />
          </>
        ) : (
          <Input
            label="رقم الهاتف"
            type="tel"
            placeholder="+966500000002"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            error={errors.identifier}
            icon={<Phone size={18} />}
            helper="سيتم إرسال رمز تحقق OTP"
          />
        )}
        <Button fullWidth loading={isSubmitting}>
          {mode === 'phone' ? 'متابعة برمز OTP' : isSubmitting ? 'جاري الدخول...' : 'دخول'}
        </Button>
      </form>

      <div className="auth-divider"><span>أو</span></div>
      <div className="social-login-grid">
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
      </div>

      <div className="auth-card-footer">
        ليس لديك حساب؟ <Link to="/register">إنشاء حساب جديد</Link>
      </div>
    </Card>
  );
}
