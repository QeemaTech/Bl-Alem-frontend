import type { CSSProperties, ReactNode } from 'react';
import { EmptyState } from './EmptyState';
import { LoadingSkeleton } from './LoadingSkeleton';

export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => ReactNode;
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  align?: 'start' | 'center' | 'end';
  sticky?: 'start' | 'end';
  className?: string;
  hideOnMobile?: boolean;
  truncate?: boolean;
  wrap?: boolean;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  rowKey?: keyof T | ((row: T, index: number) => string | number);
  stickyHeader?: boolean;
  maxHeight?: string | number;
  compact?: boolean;
  fluid?: boolean;
  showFooter?: boolean;
  className?: string;
  onRowClick?: (row: T) => void;
  hideScrollNotice?: boolean;
}

const MOBILE_SECONDARY_KEYS = new Set([
  'phone',
  'activity',
  'joinedAt',
  'createdAt',
  'updatedAt',
  'lastLogin',
  'lastActiveAt',
  'iban',
  'wallet',
]);

const colgroupStyle = (col: TableColumn<Record<string, unknown>>): CSSProperties => {
  if (col.width != null) return { width: col.width };
  return {};
};

const resolveAlign = (col: TableColumn<Record<string, unknown>>) => {
  if (col.align) return col.align;
  if (String(col.key) === 'actions') return 'end' as const;
  if (String(col.key) === 'id') return 'center' as const;
  return 'start' as const;
};

const alignClass = (align: 'start' | 'center' | 'end') => {
  if (align === 'center') return 'col-align-center';
  if (align === 'end') return 'col-align-end';
  return 'col-align-start';
};

const resolveSticky = (
  col: TableColumn<Record<string, unknown>>,
  index: number,
  total: number,
  isWide: boolean,
) => {
  if (String(col.key) === 'actions') return undefined;
  if (col.sticky) return col.sticky;
  if (!isWide) return undefined;
  if (index === 0) return 'start' as const;
  if (index === total - 1) return 'end' as const;
  return undefined;
};

const cellClass = (
  col: TableColumn<Record<string, unknown>>,
  index: number,
  total: number,
  isWide: boolean,
) => {
  const sticky = resolveSticky(col, index, total, isWide);
  const align = resolveAlign(col);
  const parts = ['data-table-cell', alignClass(align)];
  if (col.className) parts.push(col.className);
  if (sticky === 'start') parts.push('col-sticky-start');
  if (sticky === 'end') parts.push('col-sticky-end');
  if (String(col.key) === 'actions') parts.push('col-actions');
  if (col.truncate !== false && !col.wrap && String(col.key) !== 'actions') parts.push('col-truncate');
  if (col.wrap) parts.push('col-wrap');
  return parts.join(' ');
};

const cellInner = <T extends Record<string, unknown>>(col: TableColumn<T>, row: T) => {
  const content = col.render ? col.render(row) : String(row[col.key as keyof T] ?? '—');
  const title = col.render ? undefined : String(row[col.key as keyof T] ?? '');

  if (String(col.key) === 'actions') {
    return (
      <div
        className="table-actions"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {content}
      </div>
    );
  }

  if (col.wrap) {
    return <div className="td-wrap">{content}</div>;
  }

  if (col.truncate !== false || col.className?.includes('col-primary') || /title|name/i.test(String(col.key))) {
    return (
      <div className="td-content" title={title}>
        {content}
      </div>
    );
  }

  return <span className="td-plain">{content}</span>;
};

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  loading,
  emptyTitle = 'لا توجد بيانات حالياً',
  emptyDescription,
  rowKey,
  stickyHeader = true,
  maxHeight,
  compact = false,
  fluid = false,
  showFooter = true,
  className = '',
  onRowClick,
  hideScrollNotice = false,
}: TableProps<T>) {
  const normalizedColumns = columns as TableColumn<Record<string, unknown>>[];
  const isCompact = compact || normalizedColumns.length >= 6;
  const isWide = !fluid && normalizedColumns.length >= 8;
  const columnCount = normalizedColumns.length;

  const resolveKey = (row: T, index: number) => {
    if (typeof rowKey === 'function') return rowKey(row, index);
    if (rowKey && row[rowKey] != null) return String(row[rowKey]);
    return index;
  };

  if (loading) {
    return (
      <div className={`table-shell ${isCompact ? 'is-compact' : ''} ${fluid ? 'is-fluid' : ''} ${className}`.trim()}>
        <div className="table-scroll-wrap">
          <div className="table-scroll">
            <div className="table-loading">
              {Array.from({ length: 6 }).map((_, i) => (
                <LoadingSkeleton key={i} variant="row" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className={`table-shell is-empty ${className}`.trim()}>
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  const mobileColumns = normalizedColumns.filter(
    (col) => !col.hideOnMobile && !MOBILE_SECONDARY_KEYS.has(String(col.key)),
  );
  const primaryColumn = mobileColumns[0];

  return (
    <div className={`table-shell ${isCompact ? 'is-compact' : ''} ${fluid ? 'is-fluid' : ''} ${isWide ? 'is-wide' : ''} ${className}`.trim()}>
      {isWide && !hideScrollNotice ? (
        <div className="table-scroll-notice" aria-hidden="true">
          <span className="table-scroll-notice-icon">⇤⇥</span>
          <span>مرّر أفقياً لعرض جميع الأعمدة</span>
        </div>
      ) : null}

      <div className="table-scroll-wrap">
        <div
          className={`table-scroll ${stickyHeader ? 'has-sticky-head' : ''} ${maxHeight ? 'is-scrollable' : ''}`.trim()}
          style={maxHeight ? { maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight } : undefined}
        >
          <table className={`data-table ${fluid ? 'is-fluid' : ''}`.trim()}>
            <colgroup>
              {normalizedColumns.map((col) => (
                <col key={String(col.key)} style={colgroupStyle(col)} />
              ))}
            </colgroup>
            <thead className="data-table-head">
              <tr>
                {normalizedColumns.map((col, index) => (
                  <th
                    key={String(col.key)}
                    className={cellClass(col, index, columnCount, isWide)}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="data-table-body">
              {data.map((row, index) => {
                const clickable = Boolean(onRowClick);
                return (
                  <tr
                    key={resolveKey(row, index)}
                    className={`data-table-row ${clickable ? 'is-clickable' : ''}`.trim()}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    onKeyDown={onRowClick ? (event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onRowClick(row);
                      }
                    } : undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                    role={onRowClick ? 'button' : undefined}
                  >
                    {normalizedColumns.map((col, colIndex) => (
                      <td
                        key={String(col.key)}
                        className={cellClass(col, colIndex, columnCount, isWide)}
                      >
                        {cellInner(col, row)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showFooter ? (
        <div className="table-footer">
          <span>{data.length.toLocaleString('ar-SA')} سجل</span>
        </div>
      ) : null}

      <div className="table-mobile-cards">
        {data.map((row, index) => {
          const primary = primaryColumn ? cellInner(primaryColumn, row) : null;
          const rest = mobileColumns.filter((col) => col.key !== primaryColumn?.key);

          return (
            <article key={resolveKey(row, index)} className="table-mobile-card">
              {primaryColumn ? (
                <div className="table-mobile-card-header">
                  <span className="table-mobile-card-label">{primaryColumn.header}</span>
                  <div className="table-mobile-card-primary">{primary}</div>
                </div>
              ) : null}
              <div className="table-mobile-card-body">
                {rest.map((col) => (
                  <div key={String(col.key)} className="table-mobile-row">
                    <span className="table-mobile-row-label">{col.header}</span>
                    <span className="table-mobile-row-value">{cellInner(col, row)}</span>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
