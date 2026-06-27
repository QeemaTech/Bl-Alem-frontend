import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Award, RefreshCw, Save, Settings2, Shield, Upload, Wallet,
} from '@/icons';
import { adminApi } from '../../api/admin';
import { cn } from '@/lib/cn';
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
import { DEFAULT_CURRENCY, currencySuffix, getCurrencySymbol } from '../../utils/currency';
import { isSettingTruthy } from '../../utils/platformSettings';

type FieldType = 'text' | 'number' | 'email' | 'url' | 'color' | 'select' | 'toggle' | 'textarea';

interface SettingFieldDef {
  key: string;
  type: FieldType;
  min?: number;
  max?: number;
  step?: number;
}

interface SettingSectionDef {
  id: string;
  fields: SettingFieldDef[];
}

interface SettingField {
  key: string;
  label: string;
  type: FieldType;
  helper?: string;
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  step?: number;
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
  currency: DEFAULT_CURRENCY,
  taxPercentage: '15',
  certificatePrefix: 'BI',
  supportEmail: 'support@bi-alem.com',
  supportPhone: '',
  whatsappNumber: '',
  paymentGatewayPlaceholder: 'SIMULATED',
  defaultLanguage: 'ar',
  timezone: 'Africa/Cairo',
  minWithdrawalAmount: '100',
  referralRewardPoints: '5',
  pointsPerEgp: '1',
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

const SECTION_DEFS: SettingSectionDef[] = [
  {
    id: 'general',
    fields: [
      { key: 'platformName', type: 'text' },
      { key: 'platformTagline', type: 'text' },
      { key: 'defaultLanguage', type: 'select' },
      { key: 'timezone', type: 'select' },
      { key: 'maintenanceMode', type: 'toggle' },
      { key: 'registrationEnabled', type: 'toggle' },
      { key: 'instructorRegistrationEnabled', type: 'toggle' },
    ],
  },
  {
    id: 'branding',
    fields: [
      { key: 'logo', type: 'text' },
      { key: 'favicon', type: 'text' },
      { key: 'primaryColor', type: 'color' },
      { key: 'secondaryColor', type: 'color' },
    ],
  },
  {
    id: 'financial',
    fields: [
      { key: 'platformCommissionPercentage', type: 'number', min: 0, max: 100 },
      { key: 'currency', type: 'select' },
      { key: 'taxPercentage', type: 'number', min: 0, max: 100 },
      { key: 'minWithdrawalAmount', type: 'number', min: 0 },
      { key: 'paymentGatewayPlaceholder', type: 'text' },
    ],
  },
  {
    id: 'certificates',
    fields: [
      { key: 'certificatePrefix', type: 'text' },
      { key: 'referralRewardPoints', type: 'number', min: 0 },
      { key: 'pointsPerEgp', type: 'number', min: 0.01, step: 0.01 },
      { key: 'referralEnabled', type: 'toggle' },
    ],
  },
  {
    id: 'contact',
    fields: [
      { key: 'supportEmail', type: 'email' },
      { key: 'supportPhone', type: 'text' },
      { key: 'whatsappNumber', type: 'text' },
      { key: 'facebookUrl', type: 'url' },
      { key: 'twitterUrl', type: 'url' },
      { key: 'instagramUrl', type: 'url' },
      { key: 'linkedinUrl', type: 'url' },
      { key: 'youtubeUrl', type: 'url' },
    ],
  },
  {
    id: 'legal',
    fields: [
      { key: 'metaTitle', type: 'text' },
      { key: 'metaDescription', type: 'textarea' },
      { key: 'termsUrl', type: 'text' },
      { key: 'privacyUrl', type: 'text' },
      { key: 'googleAnalyticsId', type: 'text' },
    ],
  },
  {
    id: 'system',
    fields: [
      { key: 'maxUploadSizeMB', type: 'number', min: 1, max: 2048 },
      { key: 'otpExpiryMinutes', type: 'number', min: 1, max: 60 },
      { key: 'sessionTimeoutMinutes', type: 'number', min: 5, max: 1440 },
    ],
  },
];

function fieldText(
  t: (key: string, opts?: Record<string, unknown>) => string,
  sectionId: string,
  fieldKey: string,
  prop: 'label' | 'helper' | 'placeholder',
) {
  const key = `admin.sections.${sectionId}.fields.${fieldKey}.${prop}`;
  const value = t(key, { defaultValue: '' });
  return value === key ? undefined : value;
}

function BrandPreview({
  settings,
  t,
}: {
  settings: Record<string, string>;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const primary = normalizeHexColor(settings.primaryColor || '', '#22A6BC');
  const secondary = normalizeHexColor(settings.secondaryColor || '', '#1E293B');
  const logoSrc = mediaUrl(settings.logo);

  return (
    <div
      className="settings-brand-preview"
      style={{
        background: `linear-gradient(180deg, color-mix(in srgb, ${primary} 10%, var(--color-surface-container)), var(--color-surface-container))`,
        borderColor: primary,
      }}
    >
      <div className="settings-brand-header">
        {logoSrc ? (
          <img
            src={logoSrc}
            alt={t('admin.preview.logoAlt')}
            className="settings-brand-logo"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <div className="settings-brand-logo-placeholder">{t('admin.preview.logoPlaceholder')}</div>
        )}
        <div>
          <strong>{settings.platformName || t('admin.preview.platformNameFallback')}</strong>
          <small>{settings.platformTagline || t('admin.preview.taglineFallback')}</small>
        </div>
      </div>
      <div className="settings-brand-swatches">
        <span style={{ background: primary }}>{t('admin.preview.primary')}</span>
        <span style={{ background: secondary }}>{t('admin.preview.secondary')}</span>
      </div>
      <button type="button" className="settings-brand-btn" style={{ backgroundColor: primary }}>
        {t('admin.preview.sampleButton')}
      </button>
    </div>
  );
}

function LogoUploadField({
  label,
  helper,
  placeholder,
  emptyLabel,
  changeLabel,
  uploadLabel,
  removeLabel,
  value,
  uploading,
  onChange,
  onUpload,
}: {
  label: string;
  helper?: string;
  placeholder: string;
  emptyLabel: string;
  changeLabel: string;
  uploadLabel: string;
  removeLabel: string;
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
                <span>{emptyLabel}</span>
              </div>
            )}
          </div>
          <div className="settings-logo-meta">
            <input
              className="input"
              value={value}
              placeholder={placeholder}
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
                {previewSrc ? changeLabel : uploadLabel}
              </Button>
              {previewSrc ? (
                <Button type="button" variant="outline" onClick={() => onChange('')}>
                  {removeLabel}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </label>
    </div>
  );
}

function ToggleField({
  label,
  helper,
  checked,
  onChange,
  enabledLabel,
  disabledLabel,
  enabledHint,
  disabledHint,
}: {
  label: string;
  helper?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  enabledLabel: string;
  disabledLabel: string;
  enabledHint: string;
  disabledHint: string;
}) {
  return (
    <div className="settings-toggle-field rounded-2xl border border-outline/80 bg-surface-container-low p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-bold text-on-surface">{label}</p>
          {helper ? <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">{helper}</p> : null}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={label}
          onClick={() => onChange(!checked)}
          className={cn(
            'relative h-8 w-14 shrink-0 rounded-full transition-colors duration-200',
            checked ? 'bg-primary' : 'bg-outline-variant',
          )}
        >
          <span
            className={cn(
              'absolute top-1 h-6 w-6 rounded-full bg-surface-container shadow-md transition-all duration-200',
              checked ? 'start-7' : 'start-1',
            )}
          />
        </button>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Badge variant={checked ? 'success' : 'warning'}>{checked ? enabledLabel : disabledLabel}</Badge>
        <span className="text-xs text-on-surface-variant">
          {checked ? enabledHint : disabledHint}
        </span>
      </div>
    </div>
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
  const { t } = useTranslation('settings');
  const { showToast } = useToast();
  const { refreshSettings } = useSiteSettings();
  const [settings, setSettings] = useState<Record<string, string>>({ ...DEFAULTS });
  const [savedSnapshot, setSavedSnapshot] = useState<Record<string, string>>({ ...DEFAULTS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const sections = useMemo<SettingSection[]>(() => SECTION_DEFS.map((section) => ({
    id: section.id,
    label: t(`admin.tabs.${section.id}`),
    title: t(`admin.sections.${section.id}.title`),
    description: t(`admin.sections.${section.id}.description`),
    fields: section.fields.map((field) => {
      const base: SettingField = {
        ...field,
        label: fieldText(t, section.id, field.key, 'label') || field.key,
        helper: fieldText(t, section.id, field.key, 'helper'),
        placeholder: fieldText(t, section.id, field.key, 'placeholder'),
      };

      if (field.key === 'defaultLanguage') {
        base.options = [
          { label: t('admin.options.language.ar'), value: 'ar' },
          { label: t('admin.options.language.en'), value: 'en' },
        ];
      } else if (field.key === 'timezone') {
        base.options = ['Africa/Cairo', 'Asia/Riyadh', 'Asia/Dubai', 'UTC'].map((value) => ({
          label: t(`admin.options.timezone.${value}`),
          value,
        }));
      } else if (field.key === 'currency') {
        base.options = ['EGP', 'SAR', 'USD'].map((value) => ({
          label: t(`admin.options.currency.${value}`),
          value,
        }));
      } else if (field.key === 'minWithdrawalAmount') {
        base.label = t(`admin.sections.${section.id}.fields.${field.key}.label`, {
          suffix: currencySuffix(settings.currency || DEFAULT_CURRENCY),
        });
      }

      return base;
    }),
  })), [t, settings.currency]);

  const allKeys = useMemo(() => sections.flatMap((s) => s.fields.map((f) => f.key)), [sections]);

  const load = async () => {
    setLoading(true);
    const rows = await adminApi.settings();
    const merged = { ...DEFAULTS, ...Object.fromEntries(rows.map((s: { key: string; value: string }) => [s.key, s.value ?? ''])) };
    setSettings(merged);
    setSavedSnapshot(merged);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const currentSection = sections.find((s) => s.id === activeTab) ?? sections[0];
  const sectionKeys = currentSection.fields.map((f) => f.key);

  const dirty = useMemo(
    () => sectionKeys.some((key) => (settings[key] ?? '') !== (savedSnapshot[key] ?? '')),
    [settings, savedSnapshot, sectionKeys],
  );

  const totalDirty = useMemo(
    () => allKeys.some((key) => (settings[key] ?? '') !== (savedSnapshot[key] ?? '')),
    [settings, savedSnapshot, allKeys],
  );

  const set = (key: string, value: string) => setSettings((c) => ({ ...c, [key]: value }));

  const validateSection = (keys: string[]) => {
    const email = settings.supportEmail?.trim();
    if (keys.includes('supportEmail') && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast(t('admin.toast.invalidEmail'), 'error');
      return false;
    }
    const commission = Number(settings.platformCommissionPercentage);
    if (keys.includes('platformCommissionPercentage') && (Number.isNaN(commission) || commission < 0 || commission > 100)) {
      showToast(t('admin.toast.invalidCommission'), 'error');
      return false;
    }
    const colorKeys = ['primaryColor', 'secondaryColor'].filter((k) => keys.includes(k));
    for (const key of colorKeys) {
      const val = settings[key]?.trim();
      if (val && !/^#?[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?$/.test(val)) {
        showToast(t('admin.toast.invalidColor', {
          color: key === 'primaryColor' ? t('admin.toast.primaryColor') : t('admin.toast.secondaryColor'),
        }), 'error');
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
      showToast(t('admin.toast.saved'), 'success');
    } catch {
      showToast(t('admin.toast.saveFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveSection = (e: FormEvent) => {
    e.preventDefault();
    saveKeys(sectionKeys);
  };

  const saveAll = () => saveKeys(allKeys);

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
      showToast(key === 'logo' ? t('admin.toast.logoUploaded') : t('admin.toast.faviconUploaded'), 'success');
    } catch {
      showToast(t('admin.toast.uploadFailed'), 'error');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  const maintenance = isSettingTruthy(settings.maintenanceMode);
  const logoUploadLabels = {
    placeholder: t('admin.logoUpload.placeholder'),
    empty: t('admin.logoUpload.empty'),
    change: t('admin.logoUpload.changeImage'),
    upload: t('admin.logoUpload.uploadLogo'),
    remove: t('admin.logoUpload.remove'),
  };

  return (
    <div className="page-grid">
      <div className="reports-header">
        <PageHeader title={t('admin.title')} subtitle={t('admin.subtitle')} />
        <div className="reports-actions">
          <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={load} disabled={loading || saving}>
            {t('admin.actions.refresh')}
          </Button>
          <Button icon={<Save size={16} />} onClick={saveAll} loading={saving} disabled={!totalDirty}>
            {t('admin.actions.saveAll')}
          </Button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          title={t('admin.stats.savedSettings')}
          value={String(allKeys.filter((k) => savedSnapshot[k]?.trim()).length)}
          icon={Settings2}
        />
        <StatCard
          title={t('admin.stats.platformStatus')}
          value={maintenance ? t('admin.stats.maintenance') : t('admin.stats.active')}
          icon={Shield}
          hint={maintenance ? t('admin.stats.maintenanceHint') : t('admin.stats.activeHint')}
        />
        <StatCard
          title={t('admin.stats.commission')}
          value={`${savedSnapshot.platformCommissionPercentage || '0'}%`}
          icon={Wallet}
        />
        <StatCard
          title={t('admin.stats.referralPoints')}
          value={`${savedSnapshot.referralRewardPoints || '5'} ${t('admin.stats.pointsUnit')}`}
          icon={Award}
        />
      </div>

      <Tabs
        variant="pills"
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={sections.map((s) => ({ id: s.id, label: s.label }))}
      />

      <div className="settings-layout settings-layout--full">
        <Card className="settings-form-card">
          <div className="settings-section-head">
            <div>
              <h3>{currentSection.title}</h3>
              <p>{currentSection.description}</p>
            </div>
            {dirty ? <Badge variant="warning">{t('admin.actions.unsavedChanges')}</Badge> : null}
          </div>

          <form className="form-grid" onSubmit={saveSection}>
            {activeTab === 'branding' ? (
              <div className="settings-inline-preview">
                <BrandPreview settings={settings} t={t} />
              </div>
            ) : null}
            {currentSection.fields.map((field) => {
              const value = settings[field.key] ?? '';

              if (field.type === 'toggle') {
                if (activeTab === 'general') return null;
                return (
                  <ToggleField
                    key={field.key}
                    label={field.label}
                    helper={field.helper}
                    checked={isSettingTruthy(value)}
                    onChange={(v) => set(field.key, v ? 'true' : 'false')}
                    enabledLabel={t('admin.toggle.enabled')}
                    disabledLabel={t('admin.toggle.disabled')}
                    enabledHint={t('admin.toggle.enabledHint')}
                    disabledHint={t('admin.toggle.disabledHint')}
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
                    placeholder={logoUploadLabels.placeholder}
                    emptyLabel={logoUploadLabels.empty}
                    changeLabel={logoUploadLabels.change}
                    uploadLabel={logoUploadLabels.upload}
                    removeLabel={logoUploadLabels.remove}
                  />
                );
              }

              if (field.key === 'favicon' && activeTab === 'branding') {
                return (
                  <LogoUploadField
                    key={field.key}
                    label={field.label}
                    helper={field.helper}
                    value={value}
                    uploading={uploadingFavicon}
                    onChange={(v) => set('favicon', v)}
                    onUpload={(file) => uploadImageSetting('favicon', file, setUploadingFavicon)}
                    placeholder={logoUploadLabels.placeholder}
                    emptyLabel={logoUploadLabels.empty}
                    changeLabel={logoUploadLabels.change}
                    uploadLabel={logoUploadLabels.upload}
                    removeLabel={logoUploadLabels.remove}
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
            {activeTab === 'general' ? (
              <div className="settings-platform-toggles">
                {currentSection.fields.filter((field) => field.type === 'toggle').map((field) => {
                  const value = settings[field.key] ?? '';
                  return (
                    <ToggleField
                      key={field.key}
                      label={field.label}
                      helper={field.helper}
                      checked={isSettingTruthy(value)}
                      onChange={(v) => set(field.key, v ? 'true' : 'false')}
                      enabledLabel={t('admin.toggle.enabled')}
                      disabledLabel={t('admin.toggle.disabled')}
                      enabledHint={t('admin.toggle.enabledHint')}
                      disabledHint={t('admin.toggle.disabledHint')}
                    />
                  );
                })}
              </div>
            ) : null}

            <div className="settings-form-actions">
              <Button type="button" variant="secondary" onClick={resetSection} disabled={!dirty || saving}>
                {t('admin.actions.revert')}
              </Button>
              <Button type="submit" loading={saving} disabled={!dirty}>
                {t('admin.actions.saveSection', { section: currentSection.label })}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
