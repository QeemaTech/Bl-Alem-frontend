import { useState } from 'react';
import { useLandingLocale } from '../../hooks/useLandingLocale';
import { Icon } from '../ui/Icon';

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`lp-faq-item${open ? ' open' : ''}`}>
      <button
        className="lp-faq-trigger"
        onClick={() => setOpen(p => !p)}
        aria-expanded={open}
      >
        <span style={{ flex: 1, textAlign: 'start', lineHeight: 1.5 }}>{question}</span>
        <span
          className={`lp-faq-chevron${open ? ' open' : ''}`}
          style={{
            width: 28, height: 28,
            borderRadius: 8,
            background: open ? '#EAF8FB' : '#F1F5F9',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Icon name="expand_more" size={18} style={{ color: open ? '#22A6BC' : '#64748B' }} />
        </span>
      </button>

      <div className={`lp-faq-body${open ? ' open' : ''}`}>
        <div style={{
          padding: '0 24px 20px',
          fontSize: '0.9rem',
          color: '#475569',
          lineHeight: 1.8,
          borderTop: '1px solid #F1F5F9',
          paddingTop: 16,
        }}>
          {answer}
        </div>
      </div>
    </div>
  );
}

export default function FAQSection() {
  const { t } = useLandingLocale();
  const items = t('faq.items', { returnObjects: true }) as Array<{ q: string; a: string }>;

  return (
    <section id="faq" className="lp-section lp-section-alt">
      <div className="lp-container">
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div className="lp-badge">{t('faq.badge')}</div>
          <h2 className="lp-section-title" style={{ margin: '0 auto 14px' }}>
            {t('faq.title')}
          </h2>
          <p className="lp-section-desc" style={{ margin: '0 auto', textAlign: 'center' }}>
            {t('faq.desc')}
          </p>
        </div>

        <div style={{
          maxWidth: 760,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          {items.map((faq, i) => (
            <FAQItem key={i} question={faq.q} answer={faq.a} />
          ))}
        </div>

        <div style={{
          textAlign: 'center',
          background: 'white',
          border: '1px solid #E6EEF2',
          borderRadius: 20, padding: '32px',
          maxWidth: 480, margin: '48px auto 0',
          boxShadow: '0 4px 20px rgba(34,166,188,0.06)',
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: '#EAF8FB',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
          }}>
            <Icon name="support_agent" size={26} style={{ color: '#22A6BC' }} filled />
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
            {t('faq.supportTitle')}
          </div>
          <div style={{ fontSize: '0.88rem', color: '#64748B', marginBottom: 18 }}>
            {t('faq.supportDesc')}
          </div>
          <a
            href="mailto:support@bialem.com"
            className="lp-btn-primary"
            style={{ justifyContent: 'center', borderRadius: 12 }}
          >
            <Icon name="mail" size={17} style={{ color: 'white' }} />
            {t('faq.supportCta')}
          </a>
        </div>
      </div>
    </section>
  );
}
