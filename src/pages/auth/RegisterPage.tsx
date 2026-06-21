import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Lock, Mail, Phone, User } from 'lucide-react';
import { BrandMark } from '../../components/ui/BrandMark';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../store/AuthContext';
import { getDashboardPath } from '../../utils/roleRedirect';
import type { RegisterInput } from '../../utils/types';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState<RegisterInput & { confirmPassword: string; acceptTerms: boolean }>({
    fullName: '', email: '', phone: '', password: '', confirmPassword: '', role: 'STUDENT', referralCode: '', acceptTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (key: string, value: string) =>
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
        'success'
      );
      navigate(getDashboardPath(user.role), { replace: true });
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'حدث خطأ، حاول مرة أخرى';
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="auth-card">
      <BrandMark variant="compact" />
      <h2>إنشاء حساب</h2>
      <p>اختر نوع حسابك للبدء داخل منصة بالعِلم.</p>
      <form onSubmit={handleSubmit}>
        <Input
          label="الاسم الكامل"
          placeholder="أدخل اسمك الكامل"
          value={form.fullName}
          onChange={(e) => updateField('fullName', e.target.value)}
          error={errors.fullName}
          icon={<User size={18} />}
        />
        <Input
          label="البريد الإلكتروني"
          type="email"
          placeholder="example@email.com"
          value={form.email}
          onChange={(e) => updateField('email', e.target.value)}
          error={errors.email}
          icon={<Mail size={18} />}
        />
        <Input
          label="رقم الجوال"
          type="tel"
          placeholder="05xxxxxxxx"
          value={form.phone}
          onChange={(e) => updateField('phone', e.target.value)}
          icon={<Phone size={18} />}
        />

        <div className="field">
          <span>نوع الحساب</span>
          <div className="role-cards">
            <button
              type="button"
              className={`role-card ${form.role === 'STUDENT' ? 'active' : ''}`}
              onClick={() => updateField('role', 'STUDENT')}
            >
              <div className="role-card-icon"><GraduationCap size={24} /></div>
              <strong>طالب</strong>
              <small>تعلّم واكتسب مهارات جديدة</small>
            </button>
            <button
              type="button"
              className={`role-card ${form.role === 'INSTRUCTOR' ? 'active' : ''}`}
              onClick={() => updateField('role', 'INSTRUCTOR')}
            >
              <div className="role-card-icon"><User size={24} /></div>
              <strong>محاضر</strong>
              <small>أنشئ دوراتك وشارك خبرتك</small>
            </button>
          </div>
        </div>

        <Input
          label="كلمة المرور"
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => updateField('password', e.target.value)}
          error={errors.password}
          helper="8 أحرف على الأقل"
          icon={<Lock size={18} />}
        />
        <Input
          label="تأكيد كلمة المرور"
          type="password"
          placeholder="••••••••"
          value={form.confirmPassword}
          onChange={(e) => updateField('confirmPassword', e.target.value)}
          error={errors.confirmPassword}
          icon={<Lock size={18} />}
        />
        <Input
          label="كود الإحالة (اختياري)"
          placeholder="BA-00002"
          value={form.referralCode}
          onChange={(e) => updateField('referralCode', e.target.value)}
        />
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={form.acceptTerms}
            onChange={(e) => setForm((current) => ({ ...current, acceptTerms: e.target.checked }))}
          />
          <span>أوافق على <a href="/terms" target="_blank" rel="noreferrer">الشروط والأحكام</a></span>
        </label>
        {errors.acceptTerms ? <p className="field-error">{errors.acceptTerms}</p> : null}
        <Button fullWidth loading={isSubmitting}>
          {isSubmitting ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
        </Button>
      </form>
      <div className="auth-card-footer">
        لديك حساب بالفعل؟ <Link to="/login">تسجيل الدخول</Link>
      </div>
    </Card>
  );
}
