import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Table, type TableColumn } from '../../ui/Table';

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
}

export function AdminDataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading,
  emptyTitle,
  emptyDescription,
  searchPlaceholder = 'بحث...',
  searchKeys,
  pageSize: defaultPageSize = 10,
  className = '',
  compact = false,
}: AdminDataTableProps<T>) {
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

  return (
    <div className={`admin-data-table ${compact ? 'is-compact' : ''} ${className}`.trim()}>
      <div className={`admin-data-table-toolbar ${compact ? 'is-compact' : ''}`.trim()}>
        <Input
          label="بحث"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          icon={<Search size={16} />}
        />
        {!compact ? (
          <>
            <Select
              label="الترتيب حسب"
              value={sortKey}
              onChange={(e) => { setSortKey(e.target.value); setPage(1); }}
              options={[
                { label: 'بدون ترتيب', value: '' },
                ...sortableKeys.map((key) => {
                  const col = columns.find((c) => String(c.key) === key);
                  return { label: col?.header || key, value: key };
                }),
              ]}
            />
            <Select
              label="الاتجاه"
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value as 'asc' | 'desc')}
              options={[
                { label: 'تصاعدي', value: 'asc' },
                { label: 'تنازلي', value: 'desc' },
              ]}
            />
            <Select
              label="عدد الصفوف"
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
      />
      <div className="admin-data-table-footer">
        <span>{filtered.length.toLocaleString('ar-SA')} سجل</span>
        <div className="admin-data-table-pagination">
          <button type="button" disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}>السابق</button>
          <span>{currentPage} / {totalPages}</span>
          <button type="button" disabled={currentPage >= totalPages} onClick={() => setPage((p) => p + 1)}>التالي</button>
        </div>
      </div>
    </div>
  );
}
