import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  status?: ReactNode;
  action?: ReactNode;
  breadcrumb?: { label: string; to?: string }[];
}

export function PageHeader({ title, subtitle, status, action, breadcrumb }: PageHeaderProps) {
  const { t } = useTranslation('common');

  return (
    <div className="page-header">
      <div>
        {breadcrumb && breadcrumb.length > 0 ? (
          <nav className="breadcrumb" aria-label={t('breadcrumb.ariaLabel')}>
            {breadcrumb.map((item, i) => (
              <span key={i}>
                {item.to ? <Link to={item.to}>{item.label}</Link> : <span>{item.label}</span>}
                {i < breadcrumb.length - 1 ? ' / ' : ''}
              </span>
            ))}
          </nav>
        ) : null}
        <div className="page-header-title-row">
          <h1>{title}</h1>
          {status ? <div className="page-header-status">{status}</div> : null}
        </div>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {action ? <div className="page-header-actions">{action}</div> : null}
    </div>
  );
}
