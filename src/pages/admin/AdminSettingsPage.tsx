import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  Award, Globe, Mail, Palette, RefreshCw, Save, Settings2, Shield, Upload, Wallet, Wrench,
} from '@/icons';
import { adminApi } from '../../api/admin';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import { Input } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { Tabs } from '../../components/ui/Tabs';
import { Textarea } from '../../components/ui/Textarea';
import { useToast } from '../../components/ui/Toast';
import { useSiteSettings } from '../../store/SiteSettingsContext';
import { mediaUrl, normalizeHexColor, normalizeStoredMediaPath } from '../../utils/mediaUrl';

type FieldType = 'text' | 'number' | 'email' | 'url' | 'color' | 'select' | 'toggle' | 'textarea';

interface SettingField {
  key: string;
  label: string;
  type: FieldType;
  helper?: string;
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  placeholder?: string;
}

interface SettingSection {
  id: string;
  label: string;
  title: string;
  description: string;
  fields: SettingField[];
}

const DEFAULTS: Record<string, string> = {
  platformName: 'BI-ALEM / بالعِلم',
  platformTagline: 'منصة تعليمية متكاملة',
  logo: '',
  favicon: '',
  primaryColor: '#22A6BC',
  secondaryColor: '#1E293B',
  platformCommissionPercentage: '20',
  currency: 'SAR',
  taxPercentage: '15',
  certificatePrefix: 'BI',
  supportEmail: 'support@bi-alem.com',
  supportPhone: '',
  whatsappNumber: '',
  paymentGatewayPlaceholder: 'SIMULATED',
  defaultLanguage: 'ar',
  timezone: 'Asia/Riyadh',
  minWithdrawalAmount: '100',
  referralRewardAmount: '50',
  referralEnabled: 'true',
  maxUploadSizeMB: '200',
  maintenanceMode: 'false',
  registrationEnabled: 'true',
  instructorRegistrationEnabled: 'true',
  termsUrl: '/terms',
  privacyUrl: '/privacy',
  metaTitle: '',
  metaDescription: '',
  facebookUrl: '',
  twitterUrl: '',
  instagramUrl: '',
  linkedinUrl: '',
  youtubeUrl: '',
  googleAnalyticsId: '',
  otpExpiryMinutes: '10',
  sessionTimeoutMinutes: '60',
};

const SECTIONS: SettingSection[] = [
  {
    id: 'general',
    label: 'عام',
    title: 'الإعدادات العامة',
    description: 'اسم المنصة، اللغة، وضوابط التسجيل والصيانة.',
    fields: [
      { key: 'platformName', label: 'اسم المنصة', type: 'text', placeholder: 'BI-ALEM / بالعِلم' },
      { key: 'platformTagline', label: 'الشعار النصي', type: 'text', helper: 'يظهر في الصفحة الرئيسية ونتائج البحث' },
      {
        key: 'defaultLanguage',
        label: 'اللغة الافتراضية',
        type: 'select',
        options: [{ label: 'العربية', value: 'ar' }, { label: 'English', value: 'en' }],
      },
      {
        key: 'timezone',
        label: 'المنطقة الزمنية',
        type: 'select',
        options: [
          { label: 'الرياض (GMT+3)', value: 'Asia/Riyadh' },
          { label: 'دبي (GMT+4)', value: 'Asia/Dubai' },
          { label: 'UTC', value: 'UTC' },
        ],
      },
      { key: 'maintenanceMode', label: 'وضع الصيانة', type: 'toggle', helper: 'عند التفعيل تُعرض رسالة صيانة للزوار' },
      { key: 'registrationEnabled', label: 'تسجيل الطلاب', type: 'toggle' },
      { key: 'instructorRegistrationEnabled', label: 'تسجيل المحاضرين', type: 'toggle' },
    ],
  },
  {
    id: 'branding',
    label: 'الهوية',
    title: 'الهوية البصرية',
    description: 'الشعار، الألوان، والمظهر العام للمنصة.',
    fields: [
      { key: 'logo', label: 'رابط الشعار', type: 'text', helper: 'ارفع صورة أو أدخل رابطاً مباشراً' },
      { key: 'favicon', label: 'أيقونة المتصفح (Favicon)', type: 'text' },
      { key: 'primaryColor', label: 'اللون الأساسي', type: 'color' },
      { key: 'secondaryColor', label: 'اللون الثانوي', type: 'color' },
    ],
  },
  {
    id: 'financial',
    label: 'مالي',
    title: 'الإعدادات المالية',
    description: 'العمولات، العملة، السحوبات، وبوابة الدفع.',
    fields: [
      { key: 'platformCommissionPercentage', label: 'نسبة عمولة المنصة (%)', type: 'number', min: 0, max: 100 },
      { key: 'currency', label: 'العملة', type: 'select', options: [{ label: 'ريال سعودي (SAR)', value: 'SAR' }, { label: 'دولار (USD)', value: 'USD' }] },
      { key: 'taxPercentage', label: 'نسبة الضريبة (%)', type: 'number', min: 0, max: 100 },
      { key: 'minWithdrawalAmount', label: 'الحد الأدنى للسحب (ر.س)', type: 'number', min: 0 },
      { key: 'paymentGatewayPlaceholder', label: 'بوابة الدفع', type: 'text', helper: 'SIMULATED للتجربة — استبدلها بمزود حقيقي لاحقاً' },
    ],
  },
  {
    id: 'certificates',
    label: 'شهادات',
    title: 'الشهادات والإحالات',
    description: 'بادئة الشهادات ومكافآت برنامج الإحالة.',
    fields: [
      { key: 'certificatePrefix', label: 'بادئة الشهادات', type: 'text', placeholder: 'BI', helper: 'مثال: BI-2026-00001' },
      { key: 'referralRewardAmount', label: 'مكافأة الإحالة (ر.س)', type: 'number', min: 0 },
      { key: 'referralEnabled', label: 'تفعيل برنامج الإحالة', type: 'toggle' },
    ],
  },
  {
    id: 'contact',
    label: 'تواصل',
    title: 'التواصل والدعم',
    description: 'قنوات التواصل مع الطلاب والمحاضرين.',
    fields: [
      { key: 'supportEmail', label: 'بريد الدعم', type: 'email' },
      { key: 'supportPhone', label: 'هاتف الدعم', type: 'text', placeholder: '+966500000000' },
      { key: 'whatsappNumber', label: 'واتساب', type: 'text', placeholder: '+966500000000' },
      { key: 'facebookUrl', label: 'فيسبوك', type: 'url', placeholder: 'https://facebook.com/...' },
      { key: 'twitterUrl', label: 'X (تويتر)', type: 'url' },
      { key: 'instagramUrl', label: 'إنستغرام', type: 'url' },
      { key: 'linkedinUrl', label: 'لينكدإن', type: 'url' },
      { key: 'youtubeUrl', label: 'يوتيوب', type: 'url' },
    ],
  },
  {
    id: 'legal',
    label: 'SEO',
    title: 'SEO والصفحات القانونية',
    description: 'تحسين محركات البحث وروابط الشروط والخصوصية.',
    fields: [
      { key: 'metaTitle', label: 'عنوان SEO', type: 'text' },
      { key: 'metaDescription', label: 'وصف SEO', type: 'textarea' },
      { key: 'termsUrl', label: 'رابط الشروط والأحكام', type: 'text' },
      { key: 'privacyUrl', label: 'رابط سياسة الخصوصية', type: 'text' },
      { key: 'googleAnalyticsId', label: 'Google Analytics ID', type: 'text', placeholder: 'G-XXXXXXXXXX', helper: 'اختياري' },
    ],
  },
  {
    id: 'system',
    label: 'تقني',
    title: 'الإعدادات التقنية',
    description: 'حدود الرفع، OTP، ومهلة الجلسة.',
    fields: [
      { key: 'maxUploadSizeMB', label: 'الحد الأقصى لحجم الرفع (MB)', type: 'number', min: 1, max: 2048 },
      { key: 'otpExpiryMinutes', label: 'مدة صلاحية OTP (دقيقة)', type: 'number', min: 1, max: 60 },
      { key: 'sessionTimeoutMinutes', label: 'مهلة الجلسة (دقيقة)', type: 'number', min: 5, max: 1440 },
    ],
  },
];

const ALL_KEYS = SECTIONS.flatMap((s) => s.fields.map((f) => f.key));

const isTruthy = (value?: string) => value === 'true' || value === '1';

function BrandPreview({ settings }: { settings: Record<string, string> }) {
  const primary = normalizeHexColor(settings.primaryColor || '', '#22A6BC');
  const secondary = normalizeHexColor(settings.secondaryColor || '', '#1E293B');
  const logoSrc = mediaUrl(settings.logo);

  return (
    <div
      className="settings-brand-preview"
      style={{
        background: `linear-gradient(180deg, color-mix(in srgb, ${primary} 10%, #fff), #fff)`,
        borderColor: primary,
      }}
    >
      <div className="settings-brand-header">
        {logoSrc ? (
          <img src={logoSrc} alt="معاينة الشعار" className="settings-brand-logo" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        ) : (
          <div className="settings-brand-logo-placeholder">شعار</div>
        )}
        <div>
          <strong>{settings.platformName || 'اسم المنصة'}</strong>
          <small>{settings.platformTagline || 'الشعار النصي'}</small>
        </div>
      </div>
      <div className="settings-brand-swatches">
        <span style={{ background: primary }}>أساسي</span>
        <span style={{ background: secondary }}>ثانوي</span>
      </div>
      <button type="button" className="settings-brand-btn" style={{ backgroundColor: primary }}>
        زر تجريبي
      </button>
    </div>
  );
}

function LogoUploadField({
  label,
  helper,
  value,
  uploading,
  onChange,
  onUpload,
}: {
  label: string;
  helper?: string;
  value: string;
  uploading: boolean;
  onChange: (v: string) => void;
  onUpload: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewSrc = mediaUrl(value);

  return (
    <div className="settings-logo-field">
      <label className="field">
        <span>{label}</span>
        <div className="settings-logo-dropzone">
          <div className="settings-logo-preview-box">
            {previewSrc ? (
              <img src={previewSrc} alt="" className="settings-logo-preview-img" />
            ) : (
              <div className="settings-logo-preview-empty">
                <Upload size={28} />
                <span>لا يوجد شعار</span>
              </div>
            )}
          </div>
          <div className="settings-logo-meta">
            <input
              className="input"
              value={value}
              placeholder="/uploads/logo.png أو https://..."
              onChange={(e) => onChange(e.target.value)}
            />
            {helper ? <small className="field-helper">{helper}</small> : null}
            <div className="settings-logo-actions">
              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUpload(file);
                  e.target.value = '';
                }}
              />
              <Button type="button" variant="secondary" loading={uploading} icon={<Upload size={16} />} onClick={() => inputRef.current?.click()}>
                {previewSrc ? 'تغيير الصورة' : 'رفع شعار'}
              </Button>
              {previewSrc ? (
                <Button type="button" variant="outline" onClick={() => onChange('')}>
                  إزالة
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </label>
    </div>
  );
}

function ToggleField({ label, helper, checked, onChange }: {
  label: string;
  helper?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="field settings-toggle-field">
      <span>{label}</span>
      <div className="settings-toggle-row">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          className={`settings-toggle ${checked ? 'active' : ''}`}
          onClick={() => onChange(!checked)}
        >
          <span className="settings-toggle-thumb" />
        </button>
        <span className="settings-toggle-label">{checked ? 'مفعّل' : 'معطّل'}</span>
      </div>
      {helper ? <small className="field-helper">{helper}</small> : null}
    </label>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const safe = normalizeHexColor(value, '#22A6BC');

  return (
    <label className="field">
      <span>{label}</span>
      <div className="settings-color-row">
        <input
          type="color"
          className="settings-color-picker"
          value={safe}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
        />
        <input
          className="input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => onChange(normalizeHexColor(value, safe))}
          placeholder="#22A6BC"
          maxLength={7}
        />
        <span className="settings-color-chip" style={{ backgroundColor: safe }} aria-hidden="true" />
      </div>
    </label>
  );
}

export default function AdminSettingsPage() {
  const { showToast } = useToast();
  const { refreshSettings } = useSiteSettings();
  const [settings, setSettings] = useState<Record<string, string>>({ ...DEFAULTS });
  const [savedSnapshot, setSavedSnapshot] = useState<Record<string, string>>({ ...DEFAULTS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const load = async () => {
    setLoading(true);
    const rows = await adminApi.settings();
    const merged = { ...DEFAULTS, ...Object.fromEntries(rows.map((s: { key: string; value: string }) => [s.key, s.value ?? ''])) };
    setSettings(merged);
    setSavedSnapshot(merged);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const currentSection = SECTIONS.find((s) => s.id === activeTab) ?? SECTIONS[0];
  const sectionKeys = currentSection.fields.map((f) => f.key);

  const dirty = useMemo(
    () => sectionKeys.some((key) => (settings[key] ?? '') !== (savedSnapshot[key] ?? '')),
    [settings, savedSnapshot, sectionKeys],
  );

  const totalDirty = useMemo(
    () => ALL_KEYS.some((key) => (settings[key] ?? '') !== (savedSnapshot[key] ?? '')),
    [settings, savedSnapshot],
  );

  const set = (key: string, value: string) => setSettings((c) => ({ ...c, [key]: value }));

  const validateSection = (keys: string[]) => {
    const email = settings.supportEmail?.trim();
    if (keys.includes('supportEmail') && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('بريد الدعم غير صالح.', 'error');
      return false;
    }
    const commission = Number(settings.platformCommissionPercentage);
    if (keys.includes('platformCommissionPercentage') && (Number.isNaN(commission) || commission < 0 || commission > 100)) {
      showToast('نسبة العمولة يجب أن تكون بين 0 و 100.', 'error');
      return false;
    }
    const colorKeys = ['primaryColor', 'secondaryColor'].filter((k) => keys.includes(k));
    for (const key of colorKeys) {
      const val = settings[key]?.trim();
      if (val && !/^#?[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?$/.test(val)) {
        showToast(`اللون ${key === 'primaryColor' ? 'الأساسي' : 'الثانوي'} يجب أن يكون بصيغة #RRGGBB.`, 'error');
        return false;
      }
    }
    return true;
  };

  const saveKeys = async (keys: string[]) => {
    if (!validateSection(keys)) return;
    setSaving(true);
    try {
      const payload = Object.fromEntries(keys.map((key) => {
        let val = settings[key] ?? '';
        if (key === 'primaryColor' || key === 'secondaryColor') {
          val = normalizeHexColor(String(val), key === 'primaryColor' ? '#22A6BC' : '#1E293B');
        }
        if (key === 'logo' || key === 'favicon') {
          val = normalizeStoredMediaPath(String(val));
        }
        return [key, val];
      }));
      await adminApi.updateSettings(payload);
      setSettings((c) => ({ ...c, ...payload }));
      setSavedSnapshot((c) => ({ ...c, ...payload }));
      await refreshSettings();
      showToast('تم حفظ الإعدادات وتطبيقها على المنصة.', 'success');
    } catch {
      showToast('تعذّر حفظ الإعدادات. تحقق من الاتصال وحاول مجدداً.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveSection = (e: FormEvent) => {
    e.preventDefault();
    saveKeys(sectionKeys);
  };

  const saveAll = () => saveKeys(ALL_KEYS);

  const resetSection = () => {
    setSettings((c) => {
      const next = { ...c };
      sectionKeys.forEach((key) => { next[key] = savedSnapshot[key] ?? DEFAULTS[key] ?? ''; });
      return next;
    });
  };

  const uploadImageSetting = async (key: 'logo' | 'favicon', file: File, setBusy: (v: boolean) => void) => {
    setBusy(true);
    try {
      const uploaded = await adminApi.upload('image', file);
      const url = normalizeStoredMediaPath(uploaded?.url || '');
      if (!url) throw new Error('missing url');
      set(key, url);
      const payload = { [key]: url };
      await adminApi.updateSettings(payload);
      setSavedSnapshot((c) => ({ ...c, ...payload }));
      await refreshSettings();
      showToast(key === 'logo' ? 'تم رفع الشعار وتطبيقه على المنصة.' : 'تم رفع الأيقونة وتطبيقها على المنصة.', 'success');
    } catch {
      showToast('تعذّر رفع الصورة. تأكد من أن Backend يعمل وأن الملف صورة صالحة.', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  const maintenance = isTruthy(settings.maintenanceMode);

  return (
    <div className="page-grid">
      <div className="reports-header">
        <PageHeader title="الإعدادات" subtitle="تهيئة شاملة لإعدادات المنصة — عام، مالي، تواصل، SEO، وتقني" />
        <div className="reports-actions">
          <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={load} disabled={loading || saving}>
            تحديث
          </Button>
          <Button icon={<Save size={16} />} onClick={saveAll} loading={saving} disabled={!totalDirty}>
            حفظ الكل
          </Button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="إعدادات محفوظة" value={String(ALL_KEYS.filter((k) => savedSnapshot[k]?.trim()).length)} icon={Settings2} />
        <StatCard
          title="حالة المنصة"
          value={maintenance ? 'صيانة' : 'نشطة'}
          icon={Shield}
          hint={maintenance ? 'الزوار يرون رسالة صيانة' : 'المنصة متاحة للجميع'}
        />
        <StatCard title="عمولة المنصة" value={`${savedSnapshot.platformCommissionPercentage || '0'}%`} icon={Wallet} />
        <StatCard title="مكافأة الإحالة" value={`${savedSnapshot.referralRewardAmount || '0'} ر.س`} icon={Award} />
      </div>

      <Tabs
        variant="pills"
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={SECTIONS.map((s) => ({ id: s.id, label: s.label }))}
      />

      <div className="settings-layout">
        <Card className="settings-form-card">
          <div className="settings-section-head">
            <div>
              <h3>{currentSection.title}</h3>
              <p>{currentSection.description}</p>
            </div>
            {dirty ? <Badge variant="warning">تغييرات غير محفوظة</Badge> : null}
          </div>

          <form className="form-grid" onSubmit={saveSection}>
            {activeTab === 'branding' ? (
              <div className="settings-inline-preview">
                <BrandPreview settings={settings} />
              </div>
            ) : null}
            {currentSection.fields.map((field) => {
              const value = settings[field.key] ?? '';

              if (field.type === 'toggle') {
                return (
                  <ToggleField
                    key={field.key}
                    label={field.label}
                    helper={field.helper}
                    checked={isTruthy(value)}
                    onChange={(v) => set(field.key, v ? 'true' : 'false')}
                  />
                );
              }

              if (field.type === 'color') {
                return (
                  <ColorField
                    key={field.key}
                    label={field.label}
                    value={value}
                    onChange={(v) => set(field.key, v)}
                  />
                );
              }

              if (field.type === 'select' && field.options) {
                return (
                  <Select
                    key={field.key}
                    label={field.label}
                    options={field.options}
                    value={value}
                    helper={field.helper}
                    onChange={(e) => set(field.key, e.target.value)}
                  />
                );
              }

              if (field.type === 'textarea') {
                return (
                  <Textarea
                    key={field.key}
                    label={field.label}
                    value={value}
                    rows={3}
                    helper={field.helper}
                    placeholder={field.placeholder}
                    onChange={(e) => set(field.key, e.target.value)}
                  />
                );
              }

              if (field.key === 'logo' && activeTab === 'branding') {
                return (
                  <LogoUploadField
                    key={field.key}
                    label={field.label}
                    helper={field.helper}
                    value={value}
                    uploading={uploadingLogo}
                    onChange={(v) => set('logo', v)}
                    onUpload={(file) => uploadImageSetting('logo', file, setUploadingLogo)}
                  />
                );
              }

              if (field.key === 'favicon' && activeTab === 'branding') {
                return (
                  <LogoUploadField
                    key={field.key}
                    label={field.label}
                    helper="ارفع أيقونة مربعة (PNG/WebP) — 32×32 أو 64×64"
                    value={value}
                    uploading={uploadingFavicon}
                    onChange={(v) => set('favicon', v)}
                    onUpload={(file) => uploadImageSetting('favicon', file, setUploadingFavicon)}
                  />
                );
              }

              return (
                <Input
                  key={field.key}
                  label={field.label}
                  type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
                  value={value}
                  min={field.min}
                  max={field.max}
                  helper={field.helper}
                  placeholder={field.placeholder}
                  onChange={(e) => set(field.key, e.target.value)}
                />
              );
            })}

            <div className="settings-form-actions">
              <Button type="button" variant="secondary" onClick={resetSection} disabled={!dirty || saving}>
                تراجع
              </Button>
              <Button type="submit" loading={saving} disabled={!dirty}>
                حفظ {currentSection.label}
              </Button>
            </div>
          </form>
        </Card>

        <aside className="settings-sidebar">
          {activeTab === 'branding' ? (
            <Card className="settings-preview-card">
              <h4>معاينة الهوية</h4>
              <BrandPreview settings={settings} />
            </Card>
          ) : null}

          <Card className="settings-summary-card">
            <h4>ملخص سريع</h4>
            <ul className="settings-summary-list">
              <li><Globe size={14} /> {settings.defaultLanguage === 'ar' ? 'العربية' : 'English'}</li>
              <li><Mail size={14} /> {settings.supportEmail || '—'}</li>
              <li><Palette size={14} /> {normalizeHexColor(settings.primaryColor || '', '#22A6BC')}</li>
              <li><Wrench size={14} /> {maintenance ? 'وضع الصيانة مفعّل' : 'المنصة تعمل'}</li>
            </ul>
          </Card>

          <Card className="settings-keys-card">
            <h4>مفاتيح هذا القسم</h4>
            <div className="settings-key-tags">
              {sectionKeys.map((key) => (
                <code key={key}>{key}</code>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
