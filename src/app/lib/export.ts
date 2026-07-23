type CsvCell = string | number | boolean | null | undefined;

type CsvColumn<T> = {
  key: keyof T;
  label: string;
  format?: (value: T[keyof T], row: T) => CsvCell;
};

const escapeCsvValue = (value: CsvCell) => {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
};

export const downloadTextFile = (filename: string, content: string, mimeType: string) => {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const exportCsv = <T extends Record<string, unknown>>(params: {
  filename: string;
  rows: T[];
  columns: CsvColumn<T>[];
}) => {
  const header = params.columns.map((column) => escapeCsvValue(column.label)).join(',');
  const lines = params.rows.map((row) =>
    params.columns
      .map((column) => {
        const value = column.format ? column.format(row[column.key], row) : (row[column.key] as CsvCell);
        return escapeCsvValue(value);
      })
      .join(',')
  );

  downloadTextFile(params.filename, [header, ...lines].join('\n'), 'text/csv');
};

export const openPrintWindow = (title: string, bodyHtml: string) => {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1024,height=768');

  if (!printWindow) {
    throw new Error('Popup diblokir browser');
  }

  printWindow.document.open();
  printWindow.document.write(`
    <!doctype html>
    <html lang="id">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${title}</title>
        <style>
          :root { color-scheme: light; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            margin: 40px;
            color: #1F2937;
            line-height: 1.5;
            background-color: #FFFFFF;
          }
          
          /* Header */
          .report-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 3px solid #1F6B3A;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .company-info h1 {
            margin: 0;
            font-size: 26px;
            font-weight: 800;
            color: #1F6B3A;
            letter-spacing: -0.5px;
          }
          .company-info p {
            margin: 4px 0 0;
            font-size: 13px;
            color: #4B5563;
          }
          .report-meta {
            text-align: right;
            font-size: 11px;
            color: #6B7280;
            line-height: 1.6;
          }
          
          /* Summary cards grid */
          .summary {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin: 24px 0;
          }
          .card {
            background: #FFFFFF;
            border: 1px solid #E5E7EB;
            border-top: 4px solid #1F6B3A;
            border-radius: 12px;
            padding: 14px 16px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          }
          .card.expense { border-top-color: #EF4444; }
          .card.net { border-top-color: #3B82F6; }
          .card.margin { border-top-color: #F59E0B; }
          .card p { margin: 0; }
          .card .label {
            color: #6B7280;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .card .value {
            margin-top: 6px;
            font-size: 18px;
            font-weight: 800;
            color: #111827;
          }
          
          /* Table styling */
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 24px;
            font-size: 13px;
          }
          th, td {
            padding: 10px 14px;
            border-bottom: 1px solid #E5E7EB;
          }
          th {
            background: #F9FAFB;
            color: #374151;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 10px;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #E2E8F0;
          }
          
          /* Alignment classes */
          .text-left { text-align: left; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          
          tbody tr:nth-child(even) {
            background-color: #FAFBFC;
          }
          
          /* Total Row */
          .total-row td {
            border-top: 2px solid #1F6B3A;
            border-bottom: 3px double #1F6B3A;
            background-color: #F0FDF4 !important;
            font-weight: 700;
            color: #1F6B3A;
          }
          
          @media print {
            body { margin: 20px; }
            .card {
              box-shadow: none;
              page-break-inside: avoid;
            }
            tr { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        ${bodyHtml}
        <script>
          window.addEventListener('load', () => {
            window.focus();
            window.print();
          });
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};
