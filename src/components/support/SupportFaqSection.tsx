import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, HelpCircle } from '@/icons';
import { cn } from '@/lib/cn';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { localizedText } from '../../utils/localizedContent';

export interface SupportFaqItem {
  id: number;
  questionAr: string;
  questionEn?: string | null;
  answerAr: string;
  answerEn?: string | null;
}

interface SupportFaqSectionProps {
  items: SupportFaqItem[];
  loading?: boolean;
  onNeedHelp?: () => void;
}

export function SupportFaqSection({ items, loading = false, onNeedHelp }: SupportFaqSectionProps) {
  const { t, i18n } = useTranslation('support');
  const lang = i18n.language;
  const [openId, setOpenId] = useState<number | null>(null);

  const entries = useMemo(() => items.map((item) => ({
    id: item.id,
    question: localizedText({ ar: item.questionAr, en: item.questionEn }, lang),
    answer: localizedText({ ar: item.answerAr, en: item.answerEn }, lang),
  })), [items, lang]);

  if (loading) {
    return (
      <Card className="support-faq-card">
        <div className="support-faq-header">
          <HelpCircle size={22} />
          <h2>{t('faq.title')}</h2>
        </div>
        <p className="field-helper">{t('faq.loading')}</p>
      </Card>
    );
  }

  return (
    <Card className="support-faq-card">
      <div className="support-faq-header">
        <HelpCircle size={22} />
        <div>
          <h2>{t('faq.title')}</h2>
          <p>{t('faq.subtitle')}</p>
        </div>
      </div>

      {entries.length ? (
        <div className="support-faq-list">
          {entries.map((entry) => {
            const isOpen = openId === entry.id;
            return (
              <article key={entry.id} className={cn('support-faq-item', isOpen && 'is-open')}>
                <button
                  type="button"
                  className="support-faq-question"
                  onClick={() => setOpenId(isOpen ? null : entry.id)}
                  aria-expanded={isOpen}
                >
                  <span>{entry.question}</span>
                  <ChevronDown size={18} className={cn('support-faq-chevron', isOpen && 'is-open')} />
                </button>
                {isOpen ? (
                  <div className="support-faq-answer">
                    <p>{entry.answer}</p>
                    {onNeedHelp ? (
                      <button type="button" className="support-faq-need-help" onClick={onNeedHelp}>
                        {t('faq.stillNeedHelp')}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title={t('faq.emptyTitle')}
          description={t('faq.emptyDescription')}
          icon={HelpCircle}
        />
      )}
    </Card>
  );
}
