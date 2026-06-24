import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Phone, ShieldCheck } from '@/icons';
import { authApi } from '../../api/auth';
import { BrandMark } from '../../components/ui/BrandMark';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../store/AuthContext';
import { getDashboardPath } from '../../utils/roleRedirect';

export default function OtpPlaceholderPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOtp } = useAuth();
  const { showToast } = useToast();
  const [phone, setPhone] = useState((location.state as { phone?: string })?.phone || '');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const sendCode = async () => {
    if (!phone.trim()) {
      showToast('أدخل رقم الهاتف أولاً', 'error');
      return;
    }
    setSending(true);
    try {
      const result = await authApi.sendOtp({ phone });
      if (result.devCode) {
        setDevCode(result.devCode);
        setCode(result.devCode);
        showToast('تم إرسال رمز التحقق (وضع التطوير)', 'success');
      } else {
        showToast('تم إرسال رمز التحقق إلى هاتفك', 'success');
      }
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'فشل إرسال الرمز';
      showToast(message, 'error');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (phone) sendCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerify = async (event: FormEvent) => {
    event.preventDefault();
    if (!phone || !code) {
      showToast('أدخل رقم الهاتف ورمز التحقق', 'error');
      return;
    }
    setVerifying(true);
    try {
      const user = await verifyOtp({ phone, code });
      showToast('تم التحقق وتسجيل الدخول بنجاح', 'success');
      navigate(getDashboardPath(user.role), { replace: true });
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'رمز التحقق غير صحيح';
      showToast(message, 'error');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Card className="auth-card">
      <BrandMark variant="compact" />
      <h2>التحقق برمز OTP</h2>
      <p>أدخل الرمز المرسل إلى هاتفك للمتابعة.</p>

      <form onSubmit={handleVerify}>
        <Input
          label="رقم الهاتف"
          type="tel"
          placeholder="+966500000002"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          icon={<Phone size={18} />}
        />
        <Input
          label="رمز التحقق"
          placeholder="12345"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          icon={<ShieldCheck size={18} />}
          helper={devCode ? `رمز التطوير: ${devCode}` : undefined}
        />
        <div className="chip-row">
          <Button type="button" variant="secondary" loading={sending} onClick={sendCode}>إعادة الإرسال</Button>
          <Button fullWidth loading={verifying}>تحقق ودخول</Button>
        </div>
      </form>

      <div className="auth-card-footer">
        <Link to="/login">العودة لتسجيل الدخول</Link>
      </div>
    </Card>
  );
}
