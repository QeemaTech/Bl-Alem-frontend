import * as XLSX from 'xlsx';

interface ExportColumn {
  key: string;
  header: string;
}

interface ExportTable {
  title: string;
  columns: ExportColumn[];
  rows: Record<string, unknown>[];
}

interface ExportSummary {
  [key: string]: number | string;
}

interface ExportLabels {
  summarySheet: string;
  detailsSheet: string;
  summaryItem: string;
  summaryValue: string;
}

export function exportReportToExcel(
  reportTitle: string,
  summary: ExportSummary,
  summaryLabels: Record<string, string>,
  table: ExportTable,
  labels?: ExportLabels,
) {
  const summaryItem = labels?.summaryItem ?? 'Item';
  const summaryValue = labels?.summaryValue ?? 'Value';
  const summarySheet = labels?.summarySheet ?? 'Summary';
  const detailsSheet = labels?.detailsSheet ?? 'Details';

  const summaryRows = Object.entries(summary).map(([key, value]) => ({
    [summaryItem]: summaryLabels[key] || key,
    [summaryValue]: value,
  }));

  const detailRows = table.rows.map((row) => {
    const mapped: Record<string, unknown> = {};
    table.columns.forEach((col) => {
      mapped[col.header] = row[col.key] ?? '';
    });
    return mapped;
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summaryRows), summarySheet);
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(detailRows), detailsSheet);

  const safeName = reportTitle.replace(/[^\u0600-\u06FFa-zA-Z0-9\s-]/g, '').trim() || 'report';
  XLSX.writeFile(workbook, `${safeName}-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportTableToExcel(
  filename: string,
  columns: ExportColumn[],
  rows: Record<string, unknown>[],
) {
  const detailRows = rows.map((row) => {
    const mapped: Record<string, unknown> = {};
    columns.forEach((col) => {
      mapped[col.header] = row[col.key] ?? '';
    });
    return mapped;
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(detailRows), 'البيانات');
  const safeName = filename.replace(/[^\u0600-\u06FFa-zA-Z0-9\s-]/g, '').trim() || 'export';
  XLSX.writeFile(workbook, `${safeName}-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
