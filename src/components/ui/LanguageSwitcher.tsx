import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import { Languages } from '@/icons';
import type { SupportedLanguage } from '@/i18n/config';

const LANG_OPTIONS: { code: SupportedLanguage; labelKey: string }[] = [
  { code: 'ar', labelKey: 'language.ar' },
  { code: 'en', labelKey: 'language.en' },
];

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'toggle' | 'dropdown';
}

function resolveLanguage(lang: string): SupportedLanguage {
  return lang.startsWith('en') ? 'en' : 'ar';
}

export function LanguageSwitcher({ className, variant = 'dropdown' }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = resolveLanguage(i18n.resolvedLanguage || i18n.language);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const switchTo = (lang: SupportedLanguage) => {
    if (lang !== current) {
      void i18n.changeLanguage(lang);
    }
    setOpen(false);
  };

  if (variant === 'toggle') {
    const next = current === 'ar' ? 'en' : 'ar';
    const nextLabel = t(`language.${next}`);
    return (
      <button
        type="button"
        className={cn('icon-btn language-switcher-toggle', className)}
        onClick={() => switchTo(next)}
        aria-label={t('language.switchTo', { lang: nextLabel })}
        title={nextLabel}
      >
        <Languages size={20} />
        <span className="language-switcher-code">{current.toUpperCase()}</span>
      </button>
    );
  }

  return (
    <div
      ref={rootRef}
      className={cn('language-switcher', open && 'is-open', className)}
    >
      <button
        type="button"
        className="icon-btn language-switcher-trigger"
        aria-label={t('language.ariaLabel')}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        title={t('language.label')}
      >
        <Languages size={20} />
        <span className="language-switcher-code">{current.toUpperCase()}</span>
      </button>
      <ul
        className="language-switcher-menu"
        role="listbox"
        aria-label={t('language.label')}
      >
        {LANG_OPTIONS.map(({ code, labelKey }) => (
          <li key={code}>
            <button
              type="button"
              role="option"
              aria-selected={current === code}
              className={cn('language-switcher-option', current === code && 'is-active')}
              onClick={() => switchTo(code)}
            >
              {t(labelKey)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
