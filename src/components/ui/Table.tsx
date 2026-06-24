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

const cellStyle = (
  col: TableColumn<Record<string, unknown>>,
  isCompact: boolean,
): CSSProperties => {
  const minWidth = resolveMinWidth(col, isCompact);
  return {
    ...(col.width != null ? { width: col.width } : {}),
    ...(minWidth != null ? { minWidth: minWidth } : {}),
    ...(col.maxWidth != null ? { maxWidth: col.maxWidth } : {}),
  };
};

const resolveSticky = (
  col: TableColumn<Record<string, unknown>>,
  index: number,
  total: number,
  isWide: boolean,
) => {
  if (col.sticky) return col.sticky;
  if (!isWide) return undefined;
  if (index === 0) return 'start' as const;
  if (String(col.key) === 'actions' || index === total - 1) return 'end' as const;
  return undefined;
};

const resolveMinWidth = (col: TableColumn<Record<string, unknown>>, isCompact: boolean) => {
  if (col.minWidth != null) return col.minWidth;
<<<<<<< Updated upstream
  if (col.width != null) return undefined;
  if (String(col.key) === 'actions') return 240;
  if (String(col.key).includes('email')) return 168;
  if (String(col.key).includes('phone')) return 128;
  return 96;
=======
  if (String(col.key) === 'actions') return isCompact ? '7.5rem' : '9rem';
  if (String(col.key).includes('email')) return isCompact ? '7rem' : '8.5rem';
  if (String(col.key).includes('phone')) return isCompact ? '5.5rem' : '6.5rem';
  return isCompact ? '4.5rem' : '5.5rem';
>>>>>>> Stashed changes
};

const cellClass = (
  col: TableColumn<Record<string, unknown>>,
  index: number,
  total: number,
  isWide: boolean,
) => {
  const sticky = resolveSticky(col, index, total, isWide);
  const parts = ['data-table-cell'];
  if (col.className) parts.push(col.className);
  if (sticky === 'start') parts.push('col-sticky-start');
  if (sticky === 'end') parts.push('col-sticky-end');
  if (String(col.key) === 'actions') parts.push('col-actions');
  if (col.align === 'center') parts.push('col-align-center');
  if (col.align === 'end') parts.push('col-align-end');
  if (col.truncate !== false && !col.wrap && String(col.key) !== 'actions') parts.push('col-truncate');
  if (col.wrap) parts.push('col-wrap');
  return parts.join(' ');
};

const renderValue = <T extends Record<string, unknown>>(col: TableColumn<T>, row: T) => {
  const content = col.render ? col.render(row) : String(row[col.key as keyof T] ?? '—');
  if (String(col.key) === 'actions') {
    return <div className="table-actions">{content}</div>;
  }
  if (col.wrap) {
    return <div className="td-wrap">{content}</div>;
  }
  if (col.truncate !== false && !col.render) {
    return <div className="td-content" title={String(row[col.key as keyof T] ?? '')}>{content}</div>;
  }
  return content;
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
<<<<<<< Updated upstream
  const isWide = !fluid && normalizedColumns.length >= 6;
=======
  const isCompact = compact || normalizedColumns.length >= 6;
  const isWide = normalizedColumns.length >= 8;
>>>>>>> Stashed changes

  const resolveKey = (row: T, index: number) => {
    if (typeof rowKey === 'function') return rowKey(row, index);
    if (rowKey && row[rowKey] != null) return String(row[rowKey]);
    return index;
  };

  if (loading) {
    return (
<<<<<<< Updated upstream
      <div className={`table-shell ${compact ? 'is-compact' : ''} ${fluid ? 'is-fluid' : ''} ${className}`.trim()}>
=======
      <div className={`table-shell ${isCompact ? 'is-compact' : ''} ${className}`.trim()}>
>>>>>>> Stashed changes
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
  const columnCount = normalizedColumns.length;

  return (
<<<<<<< Updated upstream
    <div className={`table-shell ${compact ? 'is-compact' : ''} ${fluid ? 'is-fluid' : ''} ${isWide ? 'is-wide' : ''} ${className}`.trim()}>
      {isWide && !hideScrollNotice ? (
=======
    <div className={`table-shell ${isCompact ? 'is-compact' : ''} ${isWide ? 'is-wide' : ''} ${className}`.trim()}>
      {isWide ? (
>>>>>>> Stashed changes
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
            <thead className="data-table-head">
              <tr>
                {normalizedColumns.map((col, index) => (
                  <th
                    key={String(col.key)}
                    className={cellClass(col, index, columnCount, isWide)}
                    style={cellStyle(col, isCompact)}
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
                      style={cellStyle(col, isCompact)}
                    >
                      {renderValue(col, row)}
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
          const primary = primaryColumn
            ? renderValue(primaryColumn, row)
            : null;
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
                    <span className="table-mobile-row-value">{renderValue(col, row)}</span>
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
