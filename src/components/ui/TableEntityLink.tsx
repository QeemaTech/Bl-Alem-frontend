import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function TableEntityLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="table-entity-link" onClick={(e) => e.stopPropagation()}>
      {children}
    </Link>
  );
}
