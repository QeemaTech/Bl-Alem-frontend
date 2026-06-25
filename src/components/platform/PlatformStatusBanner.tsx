import { Link } from 'react-router-dom';
import { CoPresent, AlertTriangle, GraduationCap, Settings, Shield } from '@/icons';
import { cn } from '@/lib/cn';
import { useSiteSettings } from '../../store/SiteSettingsContext';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

type Props = { variant: 'student' | 'admin' };

function PolicyCard({
  icon: Icon,
  label,
  enabled,
  helper,
  tone = 'neutral',
}: {
  icon: typeof Shield;
  label: string;
  enabled: boolean;
  helper: string;
  tone?: 'neutral' | 'warning';
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-2xl border p-4',
        tone === 'warning' && enabled
          ? 'border-warning/50 bg-warning-container/30'
          : 'border-outline/70 bg-surface-container-low',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            'grid h-11 w-11 shrink-0 place-items-center rounded-xl',
            enabled ? 'bg-primary-container text-primary' : 'bg-surface-container-highest text-on-surface-variant',
          )}
        >
          <Icon size={22} />
        </span>
        <Badge variant={enabled ? 'success' : 'rejected'}>{enabled ? 'مفعّل' : 'معطّل'}</Badge>
      </div>
      <div>
        <p className="font-bold text-on-surface">{label}</p>
        <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">{helper}</p>
      </div>
    </div>
  );
}

export function PlatformStatusBanner({ variant }: Props) {
  const { platform, loaded } = useSiteSettings();
  if (!loaded) return null;

  if (variant === 'student' && platform.maintenanceMode) {
    return (
      <div className="platform-status-banner mb-5 flex items-start gap-3 rounded-2xl border border-warning/50 bg-warning-container/35 p-4 text-on-surface">
        <AlertTriangle size={26} className="mt-0.5 shrink-0 text-warning" />
        <div>
          <p className="font-extrabold">المنصة في وضع الصيانة</p>
          <p className="mt-1 text-sm text-on-surface-variant">
            قد تتأثر بعض الخدمات مؤقتاً. يمكنك متابعة التعلّم، وسنعود قريباً بتحسينات جديدة.
          </p>
        </div>
      </div>
    );
  }

  if (variant === 'admin') {
    const allOpen = !platform.maintenanceMode
      && platform.registrationEnabled
      && platform.instructorRegistrationEnabled;

    return (
      <section className="platform-status-banner mb-5 rounded-2xl border border-outline bg-surface-container-lowest p-5 shadow-1">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">سياسات المنصة</p>
            <h3 className="mt-1 text-lg font-extrabold text-on-surface">الحالة الحية للتسجيل والصيانة</h3>
            <p className="mt-1 text-sm text-on-surface-variant">
              {allOpen
                ? 'كل الخدمات مفتوحة للزوار والتسجيل.'
                : 'بعض القيود مفعّلة — راجع البطاقات أدناه.'}
            </p>
          </div>
          <Link to="/admin/settings">
            <Button variant="outline" size="sm" icon={<Settings size={16} />}>
              تعديل الإعدادات
            </Button>
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <PolicyCard
            icon={Shield}
            label="وضع الصيانة"
            enabled={platform.maintenanceMode}
            helper={platform.maintenanceMode
              ? 'الزوار يرون رسالة صيانة؛ التسجيل مغلق.'
              : 'المنصة تعمل بشكل طبيعي للجميع.'}
            tone="warning"
          />
          <PolicyCard
            icon={GraduationCap}
            label="تسجيل الطلاب"
            enabled={platform.registrationEnabled}
            helper={platform.registrationEnabled
              ? 'يمكن للطلاب إنشاء حسابات جديدة.'
              : 'خيار «طالب» مخفي في صفحة التسجيل.'}
          />
          <PolicyCard
            icon={CoPresent}
            label="تسجيل المحاضرين"
            enabled={platform.instructorRegistrationEnabled}
            helper={platform.instructorRegistrationEnabled
              ? 'يمكن للمحاضرين التقديم عبر التسجيل.'
              : 'خيار «محاضر» مخفي في صفحة التسجيل.'}
          />
        </div>
      </section>
    );
  }

  return null;
}
