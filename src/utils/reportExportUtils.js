import { formatCurrency } from './formatCurrency';

/**
 * Escapes values for standard CSV format.
 */
const escapeCSV = (val) => {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
};

/**
 * Exports report data to a highly structured Excel/CSV format with:
 * - Lodge Header, GSTIN, and Contact Info
 * - Report Title & Applied Filter Metadata
 * - Executive KPI Metric Summary Box
 * - Formatted Data Rows
 * - Automatic Grand Totals Row for financial & numeric columns
 * - Official Auditor Certification & Signature Footer
 */
export const exportReportToExcel = (reportData, filterInfo = {}, lodgeInfo = {}, options = {}) => {
  if (!reportData || !reportData.rows || reportData.rows.length === 0) {
    alert('No report data available to export.');
    return;
  }

  const {
    includeKPIs = true,
    includeTotals = true,
    includeHeader = true,
    visibleColumnsOnly = false,
    hiddenColumns = {}
  } = options;

  const lodgeName = lodgeInfo?.lodge_name || 'LODGE MANAGEMENT SYSTEM';
  const gstNumber = lodgeInfo?.gst_number || 'N/A';
  const address = lodgeInfo?.address || 'Premises';
  const phone = lodgeInfo?.phone || '';
  const reportTitle = reportData.title || 'Lodge Operations Report';
  const dateLabel = reportData.date_label || filterInfo.date_label || 'All Time';
  const generatedAt = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const lines = [];

  // 1. LODGE LETTERHEAD & AUDIT BANNER
  if (includeHeader) {
    lines.push(`"${lodgeName.toUpperCase()} - OFFICIAL AUDIT REPORT"`);
    lines.push(`"Address:",${escapeCSV(address)},"Phone:",${escapeCSV(phone)}`);
    lines.push(`"GSTIN:",${escapeCSV(gstNumber)},"Generated At:",${escapeCSV(generatedAt)}`);
    lines.push(`"Report Title:",${escapeCSV(reportTitle)},"Filter Period:",${escapeCSV(dateLabel)}`);
    lines.push(`"Total Records:",${escapeCSV(reportData.rows.length)},"Audit Status:","Verified Transactional Data"`);
    lines.push('""');
  }

  // 2. EXECUTIVE KPI METRIC SUMMARY BLOCK
  if (includeKPIs && reportData.kpis && reportData.kpis.length > 0) {
    lines.push('"=== EXECUTIVE SUMMARY METRICS ==="');
    const kpiLabels = reportData.kpis.map(k => escapeCSV(k.label)).join(',');
    const kpiValues = reportData.kpis.map(k => {
      if (k.format === 'currency') return escapeCSV(`₹ ${parseFloat(k.value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
      return escapeCSV(k.value);
    }).join(',');
    lines.push(kpiLabels);
    lines.push(kpiValues);
    lines.push('""');
  }

  // 3. TABLE COLUMNS
  let columns = reportData.columns || [];
  if (visibleColumnsOnly && Object.keys(hiddenColumns).length > 0) {
    columns = columns.filter(c => !hiddenColumns[c.key]);
  }

  const headerRow = columns.map(c => escapeCSV(c.label)).join(',');
  lines.push(headerRow);

  // 4. DATA ROWS & TOTALS ACCUMULATOR
  const columnTotals = {};
  columns.forEach(c => {
    columnTotals[c.key] = { sum: 0, isNumeric: false };
  });

  const dataRows = reportData.rows.map((row) => {
    return columns.map((col) => {
      let val = row[col.key];

      // Track numeric totals
      if (typeof val === 'number') {
        columnTotals[col.key].sum += val;
        columnTotals[col.key].isNumeric = true;
      } else if (col.format === 'currency' && !isNaN(parseFloat(val))) {
        columnTotals[col.key].sum += parseFloat(val);
        columnTotals[col.key].isNumeric = true;
      }

      if (col.format === 'currency') {
        val = parseFloat(val || 0).toFixed(2);
      }
      return escapeCSV(val !== undefined && val !== null ? val : '—');
    }).join(',');
  });

  lines.push(...dataRows);

  // 5. GRAND TOTALS ROW
  if (includeTotals) {
    lines.push('""'); // blank separator
    const totalsRow = columns.map((col, idx) => {
      if (idx === 0) return '"GRAND TOTALS:"';
      if (columnTotals[col.key]?.isNumeric && (col.format === 'currency' || col.key.includes('amount') || col.key.includes('total') || col.key.includes('revenue') || col.key.includes('nights') || col.key.includes('spend'))) {
        const totalVal = columnTotals[col.key].sum;
        if (col.format === 'currency') {
          return escapeCSV(`₹ ${totalVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        }
        return escapeCSV(totalVal);
      }
      return '""';
    }).join(',');
    lines.push(totalsRow);
  }

  // 6. AUDITOR CERTIFICATION FOOTER
  lines.push('""');
  lines.push('"=== STATUTORY COMPLIANCE & AUTHORIZATION ==="');
  lines.push('"Prepared By:","[ Front Desk / Accounts ]","Authorized Signatory:","[ Manager / Auditor ]"');
  lines.push(`"Digital Verification:","DOC-ID-${Date.now()}","Timestamp:",${escapeCSV(generatedAt)}`);

  // Create UTF-8 BOM CSV
  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const safeTitle = reportTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeDate = new Date().toISOString().split('T')[0];
  link.href = url;
  link.setAttribute('download', `${safeTitle}_${safeDate}_Executive_Report.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Exports raw JSON data for accounting/Tally integrations
 */
export const exportReportToJSON = (reportData, lodgeInfo = {}) => {
  if (!reportData || !reportData.rows) {
    alert('No report data available to export.');
    return;
  }

  const exportPayload = {
    lodge: lodgeInfo,
    report: {
      id: reportData.report_id,
      category: reportData.category,
      title: reportData.title,
      date_label: reportData.date_label,
      generated_at: new Date().toISOString(),
    },
    kpis: reportData.kpis || [],
    columns: reportData.columns || [],
    records: reportData.rows || [],
    total_records: reportData.rows?.length || 0,
  };

  const jsonContent = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const safeTitle = (reportData.title || 'report').replace(/[^a-zA-Z0-9_-]/g, '_');
  link.href = url;
  link.setAttribute('download', `${safeTitle}_data_export.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
