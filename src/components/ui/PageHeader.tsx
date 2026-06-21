import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  breadcrumb?: { label: string; to?: string }[];
}

export function PageHeader({ title, subtitle, action, breadcrumb }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div>
        {breadcrumb && breadcrumb.length > 0 ? (
          <nav className="breadcrumb" aria-label="مسار التنقل">
            {breadcrumb.map((item, i) => (
              <span key={i}>
                {item.to ? <Link to={item.to}>{item.label}</Link> : <span>{item.label}</span>}
                {i < breadcrumb.length - 1 ? ' / ' : ''}
              </span>
            ))}
          </nav>
        ) : null}
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {action ? <div className="page-header-actions">{action}</div> : null}
    </div>
  );
}
