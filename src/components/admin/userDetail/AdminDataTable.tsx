import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { MaterialIcon } from '@/icons';
import { Search } from '@/icons';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Table, type TableColumn } from '../../ui/Table';
import { formatNumber } from '../../../utils/localeFormat';

interface AdminDataTableProps<T extends Record<string, unknown>> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  searchPlaceholder?: string;
  searchKeys?: (keyof T | string)[];
  pageSize?: number;
  className?: string;
  compact?: boolean;
  title?: string;
  icon?: MaterialIcon;
  layout?: 'default' | 'split';
}

export function AdminDataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading,
  emptyTitle,
  emptyDescription,
  searchPlaceholder,
  searchKeys,
  pageSize: defaultPageSize = 10,
  className = '',
  compact = false,
  title,
  icon: Icon,
  layout = 'default',
}: AdminDataTableProps<T>) {
  const { t, i18n } = useTranslation(['users', 'common']);
  const lang = i18n.language;
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const sortableKeys = columns
    .map((col) => String(col.key))
    .filter((key) => key !== 'actions');

  const keys = searchKeys?.length ? searchKeys : sortableKeys;

  const filtered = useMemo(() => {
    let rows = [...data];
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter((row) => keys.some((key) => String(row[key as keyof T] ?? '').toLowerCase().includes(q)));
    }
    if (sortKey) {
      rows.sort((a, b) => {
        const av = a[sortKey as keyof T];
        const bv = b[sortKey as keyof T];
        const left = typeof av === 'number' ? av : String(av ?? '').toLowerCase();
        const right = typeof bv === 'number' ? bv : String(bv ?? '').toLowerCase();
        if (left < right) return sortDir === 'asc' ? -1 : 1;
        if (left > right) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return rows;
  }, [data, keys, search, sortDir, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const defaultSearchPlaceholder = searchPlaceholder ?? t('common:filter.searchPlaceholder');

  return (
    <div className={`admin-data-table ${compact ? 'is-compact' : ''} ${layout === 'split' ? 'is-split-panel' : ''} ${className}`.trim()}>
      {title ? (
        <div className="admin-data-table-head">
          {Icon ? (
            <span className="admin-data-table-head-icon" aria-hidden="true">
              <Icon size={20} />
            </span>
          ) : null}
          <h3>{title}</h3>
        </div>
      ) : null}
      <div className={`admin-data-table-toolbar ${compact ? 'is-compact' : ''}`.trim()}>
        <Input
          label={t('common:filter.searchLabel')}
          placeholder={defaultSearchPlaceholder}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          icon={<Search size={18} />}
        />
        {!compact && layout !== 'split' ? (
          <>
            <Select
              label={t('users:admin.detail.tableToolbar.sortBy')}
              value={sortKey}
              onChange={(e) => { setSortKey(e.target.value); setPage(1); }}
              options={[
                { label: t('users:admin.detail.tableToolbar.noSort'), value: '' },
                ...sortableKeys.map((key) => {
                  const col = columns.find((c) => String(c.key) === key);
                  return { label: col?.header || key, value: key };
                }),
              ]}
            />
            <Select
              label={t('users:admin.detail.tableToolbar.direction')}
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value as 'asc' | 'desc')}
              options={[
                { label: t('users:admin.detail.tableToolbar.asc'), value: 'asc' },
                { label: t('users:admin.detail.tableToolbar.desc'), value: 'desc' },
              ]}
            />
            <Select
              label={t('users:admin.detail.tableToolbar.rowsPerPage')}
              value={String(pageSize)}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              options={[
                { label: '5', value: '5' },
                { label: '10', value: '10' },
                { label: '20', value: '20' },
              ]}
            />
          </>
        ) : null}
      </div>
      <Table
        columns={columns}
        data={pageRows}
        loading={loading}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        stickyHeader
        maxHeight={420}
        showFooter={false}
        showHeadersWhenEmpty
        fluid
      />
      <div className="admin-data-table-footer">
        <span>{t('common:table.recordCount', { count: formatNumber(filtered.length, undefined, lang) })}</span>
        <div className="admin-data-table-pagination">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            {t('common:pagination.previous')}
          </Button>
          <span>{currentPage} / {totalPages}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            {t('common:pagination.next')}
          </Button>
        </div>
      </div>
    </div>
  );
}
