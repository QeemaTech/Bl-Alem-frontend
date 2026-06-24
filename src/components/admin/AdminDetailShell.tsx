import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from '@/icons';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';

export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="detail-row">
      <span className="detail-row-label">{label}</span>
      <div className="detail-row-value">{children}</div>
    </div>
  );
}

export function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="admin-detail-section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

export function AdminDetailShell({
  title,
  subtitle,
  backTo,
  backLabel,
  loading,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  backTo: string;
  backLabel: string;
  loading?: boolean;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="page-grid admin-detail-page">
      <div className="admin-detail-top">
        <Link to={backTo} className="admin-detail-back">
          <ArrowRight size={18} aria-hidden="true" />
          {backLabel}
        </Link>
        <div className="admin-detail-header">
          <div className="admin-detail-heading">
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {actions ? <div className="admin-detail-actions">{actions}</div> : null}
        </div>
      </div>
      {loading ? (
        <LoadingSkeleton variant="card" count={2} />
      ) : (
        <div className="admin-detail-body">{children}</div>
      )}
    </div>
  );
}
