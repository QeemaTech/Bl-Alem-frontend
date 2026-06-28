import { useTranslation } from 'react-i18next';
import { Bell, Check } from '@/icons';
import { cn } from '@/lib/cn';
import { useInstructorNotificationLabels } from '../../../hooks/useInstructorNotificationLabels';
import {
  TONE_GRADIENT,
  TONE_PILL,
  TYPE_VISUAL,
  type InstructorNotification,
  type NotificationTone,
} from './types';

interface NotificationCardProps {
  item: InstructorNotification;
  busy?: boolean;
  onMarkRead: (id: number) => void;
}

export function NotificationCard({ item, busy, onMarkRead }: NotificationCardProps) {
  const { t } = useTranslation('notifications');
  const { typeLabel, notificationTitle, notificationBody, fmtRelative } = useInstructorNotificationLabels();
  const visual = TYPE_VISUAL[item.type] || { tone: 'system' as NotificationTone, icon: Bell };
  const Icon = visual.icon;
  const tone = visual.tone;
  const label = typeLabel(item.type);
  const isUnread = !item.isRead;

  return (
    <article
      aria-labelledby={`ntf-title-${item.id}`}
      className={cn(
        'group relative flex flex-wrap items-center gap-x-3 gap-y-2 overflow-hidden rounded-[20px] border p-3 sm:flex-nowrap sm:gap-4 sm:p-4',
        'min-h-[90px] backdrop-blur-xl transition-all duration-[250ms]',
        'shadow-[0_8px_32px_rgba(15,23,42,0.06)] hover:-translate-y-[3px]',
        'hover:border-sky-500/30 hover:shadow-[0_16px_40px_rgba(14,165,233,0.12)]',
        'focus-within:ring-2 focus-within:ring-sky-500/40 focus-within:ring-offset-2 focus-within:ring-offset-transparent',
        'dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] dark:hover:shadow-[0_16px_40px_rgba(14,165,233,0.18)]',
        isUnread
          ? 'border-sky-500/25 border-s-sky-500 border-s-4 bg-sky-500/[0.06] dark:bg-sky-500/10'
          : 'border-white/50 bg-white/55 opacity-90 dark:border-white/10 dark:bg-slate-900/35',
      )}
    >
      <div
        className={cn(
          'grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br text-white shadow-lg',
          'transition-transform duration-[250ms] group-hover:scale-[1.03]',
          TONE_GRADIENT[tone],
        )}
        aria-hidden="true"
      >
        <Icon size={18} />
      </div>

      <div className="min-w-0 flex-1 basis-[calc(100%-3.5rem)] pe-1 text-start sm:basis-auto">
        <h3
          id={`ntf-title-${item.id}`}
          dir="auto"
          className={cn(
            'truncate text-base leading-tight text-slate-900 sm:text-[18px] dark:text-slate-50',
            isUnread ? 'font-bold' : 'font-semibold',
          )}
        >
          {notificationTitle(item)}
        </h3>
        <p
          dir="auto"
          className="mt-0.5 line-clamp-1 text-sm leading-snug text-slate-500 dark:text-slate-400"
        >
          {notificationBody(item)}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <time
            className="text-xs font-medium text-slate-400 dark:text-slate-500"
            dateTime={item.createdAt}
          >
            {fmtRelative(item.createdAt)}
          </time>
          <div className="flex flex-wrap items-center gap-1.5 sm:hidden">
            <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-semibold', TONE_PILL[tone])}>
              {label}
            </span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                isUnread
                  ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
                  : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
              )}
            >
              {isUnread ? t('instructor.labels.readStatus.unread') : t('instructor.labels.readStatus.read')}
            </span>
          </div>
        </div>
      </div>

      <div className="hidden shrink-0 flex-col items-end gap-2 sm:flex">
        <span
          className={cn(
            'rounded-full border px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-md',
            TONE_PILL[tone],
          )}
        >
          {label}
        </span>
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-opacity duration-[250ms]',
            isUnread
              ? 'bg-sky-500/15 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300'
              : 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
          )}
        >
          {isUnread ? t('instructor.labels.readStatus.unread') : t('instructor.labels.readStatus.read')}
        </span>
      </div>

      <div
        className={cn(
          'flex shrink-0 items-center gap-1 sm:opacity-0 sm:transition-all sm:duration-[250ms]',
          'sm:group-hover:opacity-100 sm:group-focus-within:opacity-100',
          !isUnread && 'sm:opacity-100',
        )}
      >
        {isUnread ? (
          <button
            type="button"
            aria-label={t('instructor.actions.markRead')}
            disabled={busy}
            onClick={() => onMarkRead(item.id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border border-sky-500/25 bg-white/70 px-2.5 py-1.5',
              'text-xs font-semibold text-sky-700 backdrop-blur-md transition-all duration-[250ms]',
              'hover:scale-[1.03] hover:border-sky-500/40 hover:bg-sky-500/10',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50',
              'disabled:cursor-not-allowed disabled:opacity-60',
              'dark:border-sky-400/30 dark:bg-slate-900/60 dark:text-sky-300 dark:hover:bg-sky-500/15',
            )}
          >
            {busy ? (
              <span
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-sky-500/30 border-t-sky-600"
                aria-hidden="true"
              />
            ) : (
              <Check size={14} aria-hidden="true" />
            )}
            <span className="hidden md:inline">{t('instructor.actions.markRead')}</span>
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <Check size={14} aria-hidden="true" />
            <span className="hidden md:inline">{t('instructor.actions.readDone')}</span>
          </span>
        )}
      </div>
    </article>
  );
}
