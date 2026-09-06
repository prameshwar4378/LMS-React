import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from './formatCurrency';

/**
 * Format currency with Rs. prefix safe for all standard PDF fonts
 */
const formatPdfCurrency = (val, showPlus = false) => {
  const num = parseFloat(val) || 0;
  const formatted = Math.abs(num).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  if (num < -0.001) return `-Rs. ${formatted}`;
  if (num > 0.001 && showPlus) return `+Rs. ${formatted}`;
  return `Rs. ${formatted}`;
};

/**
 * XML entity escaper for SpreadsheetML Excel exports
 */
const escapeXml = (str) => {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

/**
 * Exports individual guest transaction list to Excel (.xls) with built-in Landscape page setup.
 */
export const exportTransactionsToExcel = (transactions, customer, filterInfo = {}) => {
  if (!transactions || transactions.length === 0) {
    alert('No transactions available to export.');
    return;
  }

  const guestName = customer?.full_name || 'Guest';
  const mobile = customer?.mobile || 'N/A';
  const safeName = guestName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeDate = new Date().toISOString().split('T')[0];
  const nowStr = new Date().toLocaleString('en-IN');
  const totalAmount = transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const xmlRows = transactions.map((t, idx) => {
    const formattedDate = new Date(t.payment_date).toLocaleString('en-IN');
    const isNegative = parseFloat(t.amount || 0) < 0;
    let stayRoom = '';
    if (t.stay_id) {
      stayRoom = `Stay #${t.stay_number} (Room ${t.room_number})`;
    } else if (isNegative) {
      stayRoom = 'Wallet Debit / Refund';
    } else {
      stayRoom = 'Wallet Deposit / Credit';
    }

    return `
      <Row ss:Height="20">
        <Cell ss:StyleID="CellCenter"><Data ss:Type="Number">${idx + 1}</Data></Cell>
        <Cell ss:StyleID="CellText"><Data ss:Type="String">${escapeXml(formattedDate)}</Data></Cell>
        <Cell ss:StyleID="CellTextBold"><Data ss:Type="String">${escapeXml(t.payment_number)}</Data></Cell>
        <Cell ss:StyleID="CellText"><Data ss:Type="String">${escapeXml(stayRoom)}</Data></Cell>
        <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${escapeXml(t.payment_method)}</Data></Cell>
        <Cell ss:StyleID="CellText"><Data ss:Type="String">${escapeXml(t.transaction_reference || 'N/A')}</Data></Cell>
        <Cell ss:StyleID="${isNegative ? 'CellCurrencyDues' : 'CellCurrencyCredit'}"><Data ss:Type="Number">${parseFloat(t.amount || 0).toFixed(2)}</Data></Cell>
        <Cell ss:StyleID="CellText"><Data ss:Type="String">${escapeXml(t.received_by || 'Staff')}</Data></Cell>
        <Cell ss:StyleID="CellText"><Data ss:Type="String">${escapeXml(t.notes || '—')}</Data></Cell>
      </Row>
    `;
  }).join('');

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Color="#0F172A"/>
  </Style>
  <Style ss:ID="TitleStyle">
   <Font ss:FontName="Segoe UI" ss:Size="14" ss:Bold="1" ss:Color="#0F172A"/>
  </Style>
  <Style ss:ID="ColHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="CellText">
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Color="#0F172A"/>
   <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders>
  </Style>
  <Style ss:ID="CellTextBold">
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1" ss:Color="#0F172A"/>
   <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders>
  </Style>
  <Style ss:ID="CellCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Color="#0F172A"/>
   <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders>
  </Style>
  <Style ss:ID="CellCurrencyCredit">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1" ss:Color="#15803D"/>
   <NumberFormat ss:Format="&quot;+₹&quot;#,##0.00"/>
   <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders>
  </Style>
  <Style ss:ID="CellCurrencyDues">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1" ss:Color="#B91C1C"/>
   <NumberFormat ss:Format="&quot;-₹&quot;#,##0.00"/>
   <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders>
  </Style>
  <Style ss:ID="TotalLabel">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="TotalVal">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#15803D"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="&quot;₹&quot;#,##0.00"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Statement">
  <Table ss:DefaultRowHeight="18">
   <Column ss:Width="30"/>
   <Column ss:Width="130"/>
   <Column ss:Width="90"/>
   <Column ss:Width="140"/>
   <Column ss:Width="65"/>
   <Column ss:Width="120"/>
   <Column ss:Width="95"/>
   <Column ss:Width="80"/>
   <Column ss:Width="150"/>
   <Row ss:Height="24">
    <Cell ss:StyleID="TitleStyle"><Data ss:Type="String">GUEST PAYMENT AUDIT STATEMENT</Data></Cell>
   </Row>
   <Row ss:Height="18">
    <Cell><Data ss:Type="String">Guest: ${escapeXml(guestName)} | Mobile: ${escapeXml(mobile)} | Exported: ${escapeXml(nowStr)}</Data></Cell>
   </Row>
   <Row ss:Height="10"/>
   <Row ss:Height="22">
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">#</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Date &amp; Time</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Payment #</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Stay / Wallet</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Method</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Ref / URN</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Amount (INR)</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Staff</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Notes</Data></Cell>
   </Row>
   ${xmlRows}
   <Row ss:Height="22">
    <Cell ss:MergeAcross="5" ss:StyleID="TotalLabel"><Data ss:Type="String">NET SETTLED AMOUNT:</Data></Cell>
    <Cell ss:StyleID="TotalVal"><Data ss:Type="Number">${totalAmount.toFixed(2)}</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="TotalLabel"><Data ss:Type="String"></Data></Cell>
   </Row>
  </Table>
  <!-- EXCEL NATIVE LANDSCAPE PRINT SETUP -->
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <PageSetup><Layout x:Orientation="Landscape"/></PageSetup>
   <FitToPage/>
   <Print><FitWidth>1</FitWidth><FitHeight>0</FitHeight><PaperSizeIndex>9</PaperSizeIndex></Print>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${safeName}_Payment_Transactions_${safeDate}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Generates an executive PDF report for individual guest transaction audit.
 * Supports landscape or portrait with true A4 dimensions.
 */
export const exportTransactionsToPDF = (transactions, customer, filterInfo = {}, orientation = 'landscape') => {
  if (!transactions || transactions.length === 0) {
    alert('No transactions available to export.');
    return;
  }

  const isLandscape = orientation === 'landscape';
  const guestName = customer?.full_name || 'Guest';
  const mobile = customer?.mobile || 'N/A';
  const idType = customer?.id_type || 'Aadhaar';
  const idNumber = customer?.id_number || 'N/A';
  const totalAmount = transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  const totalWalletCredit = customer?.total_available_credit || customer?.advance_credit || 0;

  const nowStr = new Date().toLocaleString('en-IN');
  const safeName = guestName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeDate = new Date().toISOString().split('T')[0];

  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('PAYMENT AUDIT STATEMENT', 14, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Guest: ${guestName} | Mobile: ${mobile} | ID: ${idType} ${idNumber}`, 14, 19);

  // Meta Right
  doc.setFontSize(8);
  doc.text(`Generated: ${nowStr}`, pageWidth - 14, 14, { align: 'right' });
  doc.text(`Total Records: ${transactions.length}`, pageWidth - 14, 19, { align: 'right' });

  // Divider
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.4);
  doc.line(14, 22, pageWidth - 14, 22);

  // Info Cards
  const kpiY = 25;
  const kpiH = 12;
  const kpiW = isLandscape ? (pageWidth - 28 - 6) / 3 : (pageWidth - 28 - 4) / 2;

  // Card 1: Total Amount
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, kpiY, kpiW, kpiH, 1.5, 1.5, 'FD');
  doc.setFillColor(5, 150, 105);
  doc.rect(14, kpiY, 1.8, kpiH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL AMOUNT SETTLED', 18, kpiY + 4.5);
  doc.setFontSize(9.5);
  doc.setTextColor(5, 150, 105);
  doc.text(formatPdfCurrency(totalAmount, totalAmount > 0), 18, kpiY + 9.5);

  // Card 2: Wallet Credit
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14 + kpiW + 3, kpiY, kpiW, kpiH, 1.5, 1.5, 'FD');
  doc.setFillColor(37, 99, 235);
  doc.rect(14 + kpiW + 3, kpiY, 1.8, kpiH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('AVAILABLE WALLET CREDIT', 18 + kpiW + 3, kpiY + 4.5);
  doc.setFontSize(9.5);
  doc.setTextColor(37, 99, 235);
  doc.text(formatPdfCurrency(totalWalletCredit, true), 18 + kpiW + 3, kpiY + 9.5);

  // Table
  const tableHeaders = [
    ['#', 'Date & Time', 'Payment #', 'Stay / Wallet', 'Method', 'Ref / URN', 'Amount', 'Staff', 'Notes']
  ];

  const tableRows = transactions.map((t, idx) => {
    const formattedDate = new Date(t.payment_date).toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    const isNegative = parseFloat(t.amount || 0) < 0;
    let stayRoom = '';
    if (t.stay_id) {
      stayRoom = `Stay #${t.stay_number} (Room ${t.room_number || '—'})`;
    } else if (isNegative) {
      stayRoom = 'Wallet Debit / Refund';
    } else {
      stayRoom = 'Wallet Deposit / Credit';
    }

    return [
      String(idx + 1),
      formattedDate,
      t.payment_number,
      stayRoom,
      t.payment_method,
      t.transaction_reference || '—',
      formatPdfCurrency(t.amount, !isNegative),
      t.received_by || 'Staff',
      t.notes || '—'
    ];
  });

  autoTable(doc, {
    startY: 40,
    head: tableHeaders,
    body: tableRows,
    foot: [
      ['', '', '', '', '', 'Net Total:', formatPdfCurrency(totalAmount, totalAmount > 0), '', '']
    ],
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 2,
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
      valign: 'middle',
      textColor: [15, 23, 42]
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8
    },
    didParseCell: function(data) {
      if (data.section === 'body' && data.column.index === 6) {
        const rawT = transactions[data.row.index];
        if (parseFloat(rawT?.amount || 0) < 0) {
          data.cell.styles.textColor = [185, 28, 28];
        } else {
          data.cell.styles.textColor = [21, 128, 61];
        }
      }
      if (data.section === 'foot' && data.column.index === 5) {
        data.cell.styles.halign = 'right';
      }
      if (data.section === 'foot' && data.column.index === 6) {
        data.cell.styles.textColor = totalAmount >= 0 ? [21, 128, 61] : [185, 28, 28];
        data.cell.styles.halign = 'right';
      }
    },
    margin: { left: 14, right: 14, bottom: 20 }
  });

  // Footer on all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Official Hotel Finance Statement - Generated from LodgeMaster PMS', 14, pageHeight - 5);
    doc.text(`Confidential - Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 5, { align: 'right' });
  }

  doc.save(`${safeName}_Payment_Transactions_${safeDate}.pdf`);
  return doc;
};

/**
 * Exports customer wallets list to Excel (.xls XML Spreadsheet) with built-in Landscape page setup.
 */
export const exportWalletsToExcel = (wallets, summary = {}, hotelInfo = {}) => {
  if (!wallets || wallets.length === 0) {
    alert('No wallet records available to export.');
    return;
  }

  const hotelName = hotelInfo?.name || 'Hotel & Lodge PMS';
  const hotelCode = hotelInfo?.code || '';
  const nowStr = new Date().toLocaleString('en-IN');
  const safeDate = new Date().toISOString().split('T')[0];

  const xmlRows = wallets.map((w, idx) => {
    const lastTx = w.last_transaction;
    const lastTxStr = lastTx
      ? `${new Date(lastTx.payment_date).toLocaleDateString('en-IN')} (${lastTx.payment_method} ₹${Math.abs(parseFloat(lastTx.amount)).toFixed(2)})`
      : 'No activity';

    let statusText = 'Settled';
    if (w.has_credit && !w.has_dues) statusText = 'Credit Active';
    else if (w.has_dues && !w.has_credit) statusText = 'Dues Pending';
    else if (w.has_credit && w.has_dues) statusText = 'Partially Settled';

    return `
      <Row ss:Height="20">
        <Cell ss:StyleID="CellCenter"><Data ss:Type="Number">${idx + 1}</Data></Cell>
        <Cell ss:StyleID="CellTextBold"><Data ss:Type="String">${escapeXml(w.full_name)}</Data></Cell>
        <Cell ss:StyleID="CellCenter"><Data ss:Type="String">#${w.id}${w.active_stays_count > 0 ? ' (In-House)' : ''}</Data></Cell>
        <Cell ss:StyleID="CellText"><Data ss:Type="String">${escapeXml(w.mobile || 'N/A')}</Data></Cell>
        <Cell ss:StyleID="CellText"><Data ss:Type="String">${escapeXml(w.city || w.state || w.email || '—')}</Data></Cell>
        <Cell ss:StyleID="CellCurrencyCredit"><Data ss:Type="Number">${(w.total_available_credit || 0).toFixed(2)}</Data></Cell>
        <Cell ss:StyleID="CellCurrencyDues"><Data ss:Type="Number">${(w.pending_dues || 0).toFixed(2)}</Data></Cell>
        <Cell ss:StyleID="${(w.net_balance || 0) >= 0 ? 'CellCurrencyCredit' : 'CellCurrencyDues'}"><Data ss:Type="Number">${(w.net_balance || 0).toFixed(2)}</Data></Cell>
        <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${statusText}</Data></Cell>
        <Cell ss:StyleID="CellCenter"><Data ss:Type="Number">${w.total_stays_count || 0}</Data></Cell>
        <Cell ss:StyleID="CellText"><Data ss:Type="String">${escapeXml(lastTxStr)}</Data></Cell>
      </Row>
    `;
  }).join('');

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>${escapeXml(hotelName)} - Customer Wallets Directory</Title>
  <Subject>Customer Advance Credit and Dues Directory</Subject>
  <Author>LodgeMaster PMS</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Color="#0F172A"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="TitleStyle">
   <Font ss:FontName="Segoe UI" ss:Size="14" ss:Bold="1" ss:Color="#0F172A"/>
  </Style>
  <Style ss:ID="SubTitleStyle">
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Italic="1" ss:Color="#475569"/>
  </Style>
  <Style ss:ID="MetaLabel">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="8" ss:Bold="1" ss:Color="#64748B"/>
  </Style>
  <Style ss:ID="MetaValue">
   <Font ss:FontName="Segoe UI" ss:Size="8" ss:Color="#0F172A"/>
  </Style>
  <Style ss:ID="KpiCardCredit">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#059669"/>
   <Interior ss:Color="#ECFDF5" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A7F3D0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#059669"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A7F3D0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A7F3D0"/>
   </Borders>
  </Style>
  <Style ss:ID="KpiCardDues">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#DC2626"/>
   <Interior ss:Color="#FEF2F2" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FECACA"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#DC2626"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FECACA"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FECACA"/>
   </Borders>
  </Style>
  <Style ss:ID="KpiCardNet">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#2563EB"/>
   <Interior ss:Color="#EFF6FF" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFDBFE"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#2563EB"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFDBFE"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFDBFE"/>
   </Borders>
  </Style>
  <Style ss:ID="ColHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F172A"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F172A"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F172A"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F172A"/>
   </Borders>
  </Style>
  <Style ss:ID="CellText">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Color="#0F172A"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="CellTextBold">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1" ss:Color="#0F172A"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="CellCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Color="#0F172A"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="CellCurrencyCredit">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1" ss:Color="#15803D"/>
   <NumberFormat ss:Format="&quot;₹&quot;#,##0.00"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="CellCurrencyDues">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1" ss:Color="#B91C1C"/>
   <NumberFormat ss:Format="&quot;₹&quot;#,##0.00"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="TotalLabel">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F172A"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F172A"/>
   </Borders>
  </Style>
  <Style ss:ID="TotalValueCredit">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#15803D"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="&quot;+₹&quot;#,##0.00"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F172A"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F172A"/>
   </Borders>
  </Style>
  <Style ss:ID="TotalValueDues">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#B91C1C"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="&quot;₹&quot;#,##0.00"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F172A"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F172A"/>
   </Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="Customer Wallets">
  <Table ss:DefaultRowHeight="18">
   <Column ss:Width="30"/>
   <Column ss:Width="140"/>
   <Column ss:Width="70"/>
   <Column ss:Width="100"/>
   <Column ss:Width="130"/>
   <Column ss:Width="100"/>
   <Column ss:Width="95"/>
   <Column ss:Width="95"/>
   <Column ss:Width="85"/>
   <Column ss:Width="65"/>
   <Column ss:Width="160"/>
   <Row ss:Height="24">
    <Cell ss:StyleID="TitleStyle"><Data ss:Type="String">${escapeXml(hotelName.toUpperCase())}</Data></Cell>
    <Cell ss:Index="9" ss:StyleID="MetaLabel"><Data ss:Type="String">Property Code:</Data></Cell>
    <Cell ss:StyleID="MetaValue"><Data ss:Type="String">${escapeXml(hotelCode || 'HOTEL-PMS')}</Data></Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:StyleID="SubTitleStyle"><Data ss:Type="String">Customer Wallets &amp; Advance Credit Directory</Data></Cell>
    <Cell ss:Index="9" ss:StyleID="MetaLabel"><Data ss:Type="String">Generated:</Data></Cell>
    <Cell ss:StyleID="MetaValue"><Data ss:Type="String">${escapeXml(nowStr)}</Data></Cell>
   </Row>
   <Row ss:Height="10"/>
   <Row ss:Height="24">
    <Cell ss:MergeAcross="2" ss:StyleID="KpiCardCredit"><Data ss:Type="String">ADVANCE CREDIT HELD: ₹${(summary.total_advance_credit_held || 0).toFixed(2)}</Data></Cell>
    <Cell ss:Index="4" ss:MergeAcross="2" ss:StyleID="KpiCardDues"><Data ss:Type="String">OUTSTANDING DUES: ₹${(summary.total_pending_dues || 0).toFixed(2)}</Data></Cell>
    <Cell ss:Index="7" ss:MergeAcross="2" ss:StyleID="KpiCardNet"><Data ss:Type="String">NET POSITION: ₹${(summary.net_position || 0).toFixed(2)}</Data></Cell>
    <Cell ss:Index="10" ss:MergeAcross="1" ss:StyleID="CellCenter"><Data ss:Type="String">Active Wallets: ${wallets.length}</Data></Cell>
   </Row>
   <Row ss:Height="12"/>
   <Row ss:Height="24">
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">#</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Guest Full Name</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Guest ID</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Contact Number</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">City / Location</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Available Credit</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Pending Stay Dues</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Net Hotel Position</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Account Status</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Total Stays</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Latest Transaction Activity</Data></Cell>
   </Row>
   ${xmlRows}
   <Row ss:Height="22">
    <Cell ss:MergeAcross="4" ss:StyleID="TotalLabel"><Data ss:Type="String">CONSOLIDATED TOTALS:</Data></Cell>
    <Cell ss:Index="6" ss:StyleID="TotalValueCredit"><Data ss:Type="Number">${(summary.total_advance_credit_held || 0).toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="TotalValueDues"><Data ss:Type="Number">${(summary.total_pending_dues || 0).toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="${(summary.net_position || 0) >= 0 ? 'TotalValueCredit' : 'TotalValueDues'}"><Data ss:Type="Number">${(summary.net_position || 0).toFixed(2)}</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="TotalLabel"><Data ss:Type="String"></Data></Cell>
   </Row>
  </Table>
  <!-- EXCEL NATIVE LANDSCAPE PRINT SETUP -->
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <PageSetup>
    <Layout x:Orientation="Landscape"/>
    <Header x:Margin="0.3"/>
    <Footer x:Margin="0.3"/>
    <PageMargins x:Bottom="0.5" x:Left="0.5" x:Right="0.5" x:Top="0.5"/>
   </PageSetup>
   <FitToPage/>
   <Print>
    <FitWidth>1</FitWidth>
    <FitHeight>0</FitHeight>
    <ValidPrinterInfo/>
    <PaperSizeIndex>9</PaperSizeIndex>
    <HorizontalResolution>600</HorizontalResolution>
    <VerticalResolution>600</VerticalResolution>
   </Print>
   <Selected/>
   <Panes>
    <Pane>
     <Number>3</Number>
     <ActiveRow>1</ActiveRow>
    </Pane>
   </Panes>
   <ProtectObjects>False</ProtectObjects>
   <ProtectScenarios>False</ProtectScenarios>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Customer_Wallets_Directory_${safeDate}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Fallback CSV export for customer wallets.
 */
export const exportWalletsToCSV = (wallets, summary = {}, hotelInfo = {}) => {
  if (!wallets || wallets.length === 0) {
    alert('No wallet records available to export.');
    return;
  }

  const hotelName = hotelInfo?.name || 'Hotel & Lodge PMS';
  const hotelCode = hotelInfo?.code || '';
  const nowStr = new Date().toLocaleString('en-IN');
  const safeDate = new Date().toISOString().split('T')[0];

  const metadataLines = [
    `"${hotelName.toUpperCase()} - CUSTOMER WALLETS DIRECTORY"`,
    `"Property Code:",${escapeCSV(hotelCode)},"Generated On:",${escapeCSV(nowStr)}`,
    `"Total Active Wallets:",${escapeCSV(summary.total_active_wallets || wallets.length)},"Total Advance Credit Held (INR):",${escapeCSV((summary.total_advance_credit_held || 0).toFixed(2))}`,
    `"Total Outstanding Dues (INR):",${escapeCSV((summary.total_pending_dues || 0).toFixed(2))},"Net Hotel Position (INR):",${escapeCSV((summary.net_position || 0).toFixed(2))}`,
    `""`
  ];

  const headers = [
    'Guest ID',
    'Guest Name',
    'Mobile Number',
    'Email Address',
    'ID Document',
    'City / State',
    'Available Advance Credit (INR)',
    'Stay Overpayment Credit (INR)',
    'Pending Stay Dues (INR)',
    'Net Balance Position (INR)',
    'Wallet Status',
    'Total Stays',
    'Last Transaction Date',
    'Last Payment Method',
    'Last Payment Amount (INR)'
  ];

  const rows = wallets.map((w) => {
    const lastTx = w.last_transaction;
    const lastDate = lastTx ? new Date(lastTx.payment_date).toLocaleString('en-IN') : 'N/A';
    const lastMethod = lastTx ? lastTx.payment_method : 'N/A';
    const lastAmt = lastTx ? parseFloat(lastTx.amount || 0).toFixed(2) : '0.00';

    return [
      escapeCSV(w.id),
      escapeCSV(w.full_name),
      escapeCSV(w.mobile),
      escapeCSV(w.email || ''),
      escapeCSV(`${w.id_type || ''} ${w.id_number || ''}`.trim() || 'N/A'),
      escapeCSV(w.city || w.state || '—'),
      escapeCSV((w.total_available_credit || 0).toFixed(2)),
      escapeCSV((w.stay_credits || 0).toFixed(2)),
      escapeCSV((w.pending_dues || 0).toFixed(2)),
      escapeCSV((w.net_balance || 0).toFixed(2)),
      escapeCSV(w.status || 'ACTIVE'),
      escapeCSV(w.total_stays_count || 0),
      escapeCSV(lastDate),
      escapeCSV(lastMethod),
      escapeCSV(lastAmt)
    ].join(',');
  });

  const csvContent = '\uFEFF' + [...metadataLines, headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Customer_Wallets_Directory_${safeDate}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// =============================================================================
// 2. CUSTOMER WALLETS: NATIVE A4 LANDSCAPE VECTOR PDF EXPORT & PRINT
// =============================================================================

/**
 * Generates an executive, 100% compliant A4 LANDSCAPE PDF report for Customer Wallets.
 * Guaranteed horizontal landscape aspect ratio (297mm x 210mm) in all PDF viewers.
 * 
 * @param {Array} wallets 
 * @param {Object} summary 
 * @param {Object} hotelInfo 
 * @param {Object} options { action: 'download' | 'print' }
 */
export const exportWalletsToPDF = (wallets, summary = {}, hotelInfo = {}, options = {}) => {
  if (!wallets || wallets.length === 0) {
    alert('No wallet records available to export.');
    return null;
  }

  const { action = 'download' } = options;
  const hotelName = hotelInfo?.name || 'Hotel & Lodge PMS';
  const hotelCode = hotelInfo?.code || '';
  const nowStr = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  const safeDate = new Date().toISOString().split('T')[0];
  const safeName = hotelName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `Customer_Wallets_Report_${safeName}_${safeDate}.pdf`;

  // Initialize jsPDF in TRUE A4 LANDSCAPE (297mm x 210mm)
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 210mm

  // --- 1. Header Area ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42); // #0f172a
  doc.text(hotelName.toUpperCase(), 14, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // #475569
  doc.text('Customer Wallets - Advance Credit & Dues Directory', 14, 19);

  // Metadata on Right
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Property Code: ${hotelCode || 'HOTEL-PMS'}`, pageWidth - 14, 11, { align: 'right' });
  doc.text(`Generated Date: ${nowStr}`, pageWidth - 14, 15, { align: 'right' });
  doc.text(`Records Exported: ${wallets.length} Active Account(s)`, pageWidth - 14, 19, { align: 'right' });

  // Divider Line
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.5);
  doc.line(14, 22, pageWidth - 14, 22);

  // --- 2. KPI Executive Overview Cards ---
  const cardY = 25;
  const cardH = 13;
  const totalW = pageWidth - 28; // 269mm
  const cardW = (totalW - 9) / 4; // ~65mm each

  const kpis = [
    {
      label: 'TOTAL ADVANCE CREDIT HELD',
      value: formatPdfCurrency(summary.total_advance_credit_held || 0, true),
      color: [5, 150, 105] // Emerald
    },
    {
      label: 'TOTAL OUTSTANDING DUES',
      value: formatPdfCurrency(summary.total_pending_dues || 0, false),
      color: [220, 38, 38] // Red
    },
    {
      label: 'NET HOTEL POSITION',
      value: formatPdfCurrency(summary.net_position || 0, (summary.net_position || 0) > 0),
      color: (summary.net_position || 0) >= 0 ? [37, 99, 235] : [234, 88, 12] // Blue / Orange
    },
    {
      label: 'ACTIVE WALLETS FILTERED',
      value: String(wallets.length),
      color: [124, 58, 237] // Purple
    }
  ];

  kpis.forEach((kpi, idx) => {
    const cx = 14 + idx * (cardW + 3);
    // Background card
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(cx, cardY, cardW, cardH, 1.5, 1.5, 'FD');

    // Left accent stripe
    doc.setFillColor(...kpi.color);
    doc.rect(cx, cardY, 1.8, cardH, 'F');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, cx + 4, cardY + 4.5);

    // Value
    doc.setFontSize(10);
    doc.setTextColor(...kpi.color);
    doc.text(kpi.value, cx + 4, cardY + 10);
  });

  // --- 3. Table Rows & Headers ---
  const tableHeaders = [
    ['#', 'Guest Name & ID', 'Contact Details', 'Available Credit', 'Stay Dues', 'Net Position', 'Status', 'Last Activity']
  ];

  const tableRows = wallets.map((w, idx) => {
    const hasCredit = w.total_available_credit > 0.01;
    const hasDues = w.pending_dues > 0.01;
    const lastTx = w.last_transaction;
    const lastTxStr = lastTx
      ? `${new Date(lastTx.payment_date).toLocaleDateString('en-IN')}\n(${lastTx.payment_method} Rs. ${Math.abs(parseFloat(lastTx.amount)).toFixed(2)})`
      : 'No activity';

    let statusText = 'Settled';
    if (hasCredit && !hasDues) statusText = 'Credit Active';
    else if (hasDues && !hasCredit) statusText = 'Dues Pending';
    else if (hasCredit && hasDues) statusText = 'Partially Settled';

    const guestLine = `${w.full_name}\nID #${w.id}${w.active_stays_count > 0 ? ' (In-House)' : ''}`;
    const contactLine = `${w.mobile || 'N/A'}\n${w.city || w.state || w.email || '—'}`;

    return [
      String(idx + 1),
      guestLine,
      contactLine,
      hasCredit ? formatPdfCurrency(w.total_available_credit, true) : 'Rs. 0.00',
      hasDues ? formatPdfCurrency(w.pending_dues, false) : 'Rs. 0.00',
      formatPdfCurrency(w.net_balance, w.net_balance > 0),
      statusText,
      lastTxStr
    ];
  });

  const totCreditStr = formatPdfCurrency(summary.total_advance_credit_held || 0, true);
  const totDuesStr = formatPdfCurrency(summary.total_pending_dues || 0, false);
  const totNetStr = formatPdfCurrency(summary.net_position || 0, (summary.net_position || 0) > 0);

  autoTable(doc, {
    startY: 41,
    head: tableHeaders,
    body: tableRows,
    foot: [
      ['', 'Consolidated Totals:', '', totCreditStr, totDuesStr, totNetStr, '', '']
    ],
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 2.2,
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
      valign: 'middle',
      textColor: [15, 23, 42]
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left'
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8,
      lineColor: [203, 213, 225],
      lineWidth: 0.2
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 46 },
      2: { cellWidth: 50 },
      3: { cellWidth: 35, halign: 'right', fontStyle: 'bold', textColor: [21, 128, 61] },
      4: { cellWidth: 32, halign: 'right', fontStyle: 'bold', textColor: [185, 28, 28] },
      5: { cellWidth: 34, halign: 'right', fontStyle: 'bold' },
      6: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
      7: { cellWidth: 36, fontSize: 7 }
    },
    didParseCell: function(data) {
      if (data.section === 'foot') {
        if (data.column.index === 1) {
          data.cell.styles.halign = 'right';
        }
        if (data.column.index === 3) {
          data.cell.styles.textColor = [21, 128, 61];
        }
        if (data.column.index === 4) {
          data.cell.styles.textColor = [185, 28, 28];
        }
        if (data.column.index === 5) {
          data.cell.styles.textColor = (summary.net_position || 0) >= 0 ? [21, 128, 61] : [185, 28, 28];
        }
      }
      if (data.section === 'body') {
        if (data.column.index === 5) {
          const rawRow = wallets[data.row.index];
          if (rawRow && rawRow.net_balance < 0) {
            data.cell.styles.textColor = [185, 28, 28];
          } else {
            data.cell.styles.textColor = [21, 128, 61];
          }
        }
        if (data.column.index === 6) {
          const rawRow = wallets[data.row.index];
          if (rawRow?.has_credit && !rawRow?.has_dues) {
            data.cell.styles.textColor = [21, 128, 61];
          } else if (rawRow?.has_dues && !rawRow?.has_credit) {
            data.cell.styles.textColor = [185, 28, 28];
          } else {
            data.cell.styles.textColor = [180, 83, 9];
          }
        }
      }
    },
    margin: { left: 14, right: 14, bottom: 22 }
  });

  // --- 4. Official Signatures ---
  const finalY = (doc.lastAutoTable?.finalY || 100) + 12;
  const sigY = finalY > pageHeight - 24 ? pageHeight - 24 : finalY;
  const sigWidth = 55;
  const colGap = (pageWidth - 28 - (3 * sigWidth)) / 2;

  const sigs = [
    'Prepared By / Front Desk Staff',
    'Verified By / Duty Manager',
    'Authorized Hotel Owner / GM'
  ];

  sigs.forEach((title, i) => {
    const sx = 14 + i * (sigWidth + colGap);
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.3);
    doc.line(sx, sigY, sx + sigWidth, sigY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(51, 65, 85);
    doc.text(title, sx + sigWidth / 2, sigY + 4, { align: 'center' });
  });

  // --- 5. Running Page Footer ---
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(14, pageHeight - 9, pageWidth - 14, pageHeight - 9);
    doc.text('Official Hotel Finance Statement - Generated from LodgeMaster PMS', 14, pageHeight - 5);
    doc.text(`Confidential - Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 5, { align: 'right' });
  }

  if (action === 'print') {
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const win = window.open(pdfUrl, '_blank');
    if (!win) {
      doc.save(fileName);
    }
  } else {
    doc.save(fileName);
  }

  return doc;
};

/**
 * Dedicated clean HTML print window fallback for browser printing.
 */
export const printWalletsReport = (wallets, summary = {}, hotelInfo = {}) => {
  return exportWalletsToPDF(wallets, summary, hotelInfo, { action: 'print' });
};

// =============================================================================
// 3. PAYMENT TRANSACTIONS LOG: LANDSCAPE PDF, EXCEL & CSV EXPORTS
// =============================================================================

/**
 * Generates an executive A4 LANDSCAPE PDF report for Payment Transactions Log.
 */
export const exportPaymentsToPDF = (payments, summary = {}, hotelInfo = {}, filters = {}, options = {}) => {
  if (!payments || payments.length === 0) {
    alert('No payment records available to export.');
    return;
  }

  const action = options.action || 'download';
  const hotelName = hotelInfo?.name || 'Hotel & Lodge PMS';
  const hotelCode = hotelInfo?.code || hotelInfo?.property_code || '';
  const nowStr = new Date().toLocaleString('en-IN');
  const safeDate = new Date().toISOString().split('T')[0];
  const fileName = `Payment_Transactions_Log_${safeDate}.pdf`;

  const totalCollections = summary.totalCollections ?? payments.filter(p => parseFloat(p.amount || 0) > 0).reduce((acc, p) => acc + parseFloat(p.amount || 0), 0);
  const totalRefunds = summary.totalRefunds ?? payments.filter(p => parseFloat(p.amount || 0) < 0).reduce((acc, p) => acc + Math.abs(parseFloat(p.amount || 0)), 0);
  const netInflow = summary.netInflow ?? (totalCollections - totalRefunds);
  const collectionCount = summary.collectionCount ?? payments.filter(p => parseFloat(p.amount || 0) > 0).length;
  const refundCount = summary.refundCount ?? payments.filter(p => parseFloat(p.amount || 0) < 0).length;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 297;
  const pageHeight = 210;

  // 1. Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(hotelName.toUpperCase(), 14, 14);

  doc.setFontSize(9.5);
  doc.setTextColor(37, 99, 235);
  doc.text('PAYMENT TRANSACTIONS & AUDIT LOG', 14, 19.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const filterDesc = [
    hotelCode ? `Property: ${hotelCode}` : '',
    filters.method ? `Method: ${filters.method}` : '',
    filters.datePreset ? `Period: ${filters.datePreset}` : '',
    `Generated: ${nowStr}`
  ].filter(Boolean).join(' | ');
  doc.text(filterDesc, 14, 24);

  // Meta Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Total Records: ${payments.length}`, pageWidth - 14, 14, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Official Financial Audit Feed', pageWidth - 14, 19, { align: 'right' });

  // Divider
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.4);
  doc.line(14, 26, pageWidth - 14, 26);

  // 2. KPI Cards
  const kpiY = 29;
  const kpiH = 13.5;
  const kpiW = (pageWidth - 28 - 9) / 4;

  // Card 1: Gross Collections (Green)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.roundedRect(14, kpiY, kpiW, kpiH, 1.5, 1.5, 'FD');
  doc.setFillColor(5, 150, 105);
  doc.rect(14, kpiY, 2.2, kpiH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL GROSS COLLECTIONS', 18, kpiY + 4.5);
  doc.setFontSize(10.5);
  doc.setTextColor(5, 150, 105);
  doc.text(`+Rs. ${totalCollections.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 18, kpiY + 9.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(100, 116, 139);
  doc.text(`${collectionCount} Inflow Receipts`, 18, kpiY + 12.5);

  // Card 2: Total Refunds (Red)
  const c2x = 14 + kpiW + 3;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(c2x, kpiY, kpiW, kpiH, 1.5, 1.5, 'FD');
  doc.setFillColor(220, 38, 38);
  doc.rect(c2x, kpiY, 2.2, kpiH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL REFUNDS / DEBITS', c2x + 4, kpiY + 4.5);
  doc.setFontSize(10.5);
  doc.setTextColor(220, 38, 38);
  doc.text(`-Rs. ${totalRefunds.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, c2x + 4, kpiY + 9.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(100, 116, 139);
  doc.text(`${refundCount} Outflow Adjustments`, c2x + 4, kpiY + 12.5);

  // Card 3: Net Cash Inflow (Blue)
  const c3x = 14 + (kpiW + 3) * 2;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(c3x, kpiY, kpiW, kpiH, 1.5, 1.5, 'FD');
  doc.setFillColor(37, 99, 235);
  doc.rect(c3x, kpiY, 2.2, kpiH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('NET INFLOW POSITION', c3x + 4, kpiY + 4.5);
  doc.setFontSize(10.5);
  doc.setTextColor(netInflow >= 0 ? 37 : 220, netInflow >= 0 ? 99 : 38, netInflow >= 0 ? 235 : 38);
  doc.text(`Rs. ${netInflow.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, c3x + 4, kpiY + 9.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(100, 116, 139);
  doc.text(netInflow >= 0 ? 'Net Positive Inflow' : 'Net Negative Cash Flow', c3x + 4, kpiY + 12.5);

  // Card 4: Total Records (Purple)
  const c4x = 14 + (kpiW + 3) * 3;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(c4x, kpiY, kpiW, kpiH, 1.5, 1.5, 'FD');
  doc.setFillColor(124, 58, 237);
  doc.rect(c4x, kpiY, 2.2, kpiH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL TRANSACTIONS', c4x + 4, kpiY + 4.5);
  doc.setFontSize(10.5);
  doc.setTextColor(124, 58, 237);
  doc.text(String(payments.length), c4x + 4, kpiY + 9.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(100, 116, 139);
  doc.text('Audit Trail Entries', c4x + 4, kpiY + 12.5);

  // 3. Table
  const tableHeaders = [
    ['#', 'Date & Time', 'Payment #', 'Stay #', 'Room', 'Guest Name', 'Method', 'Txn Ref / Notes', 'Received By', 'Type', 'Amount']
  ];

  const tableRows = payments.map((p, idx) => {
    const formattedDate = p.payment_date ? new Date(p.payment_date).toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }) : '—';

    const amt = parseFloat(p.amount || 0);
    const isNegative = amt < 0;
    const typeStr = isNegative ? 'REFUND' : p.stay_number ? 'STAY BILL' : 'ADVANCE';
    const amountStr = isNegative ? `-Rs. ${Math.abs(amt).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `+Rs. ${amt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return [
      String(idx + 1),
      formattedDate,
      p.payment_number || `PAY-${p.id}`,
      p.stay_number || 'Direct Wallet',
      p.room_number ? `Rm ${p.room_number}` : '—',
      p.customer_name || 'Walk-in Guest',
      p.payment_method || 'CASH',
      p.transaction_reference || p.notes || '—',
      p.received_by_name || 'Front Desk',
      typeStr,
      amountStr
    ];
  });

  autoTable(doc, {
    startY: kpiY + kpiH + 5,
    head: tableHeaders,
    body: tableRows,
    theme: 'grid',
    margin: { left: 14, right: 14, bottom: 32 },
    styles: {
      font: 'helvetica',
      fontSize: 7.2,
      cellPadding: 1.8,
      textColor: [15, 23, 42],
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
      valign: 'middle'
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
      cellPadding: 2.2
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 9 },
      1: { cellWidth: 26 },
      2: { fontStyle: 'bold', cellWidth: 28 },
      3: { cellWidth: 24 },
      4: { halign: 'center', cellWidth: 14 },
      5: { cellWidth: 36 },
      6: { halign: 'center', fontStyle: 'bold', cellWidth: 18 },
      7: { cellWidth: 32 },
      8: { cellWidth: 26 },
      9: { halign: 'center', cellWidth: 20 },
      10: { halign: 'right', fontStyle: 'bold', cellWidth: 26 }
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const rawAmt = payments[data.row.index]?.amount;
        const isNeg = parseFloat(rawAmt || 0) < 0;
        if (data.column.index === 10) {
          if (isNeg) {
            data.cell.styles.textColor = [185, 28, 28];
          } else {
            data.cell.styles.textColor = [21, 128, 61];
          }
        }
        if (data.column.index === 9) {
          if (isNeg) {
            data.cell.styles.textColor = [220, 38, 38];
          } else {
            data.cell.styles.textColor = [37, 99, 235];
          }
        }
      }
    },
    foot: [
      [
        { content: 'CONSOLIDATED NET REVENUE TOTAL:', colSpan: 10, styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42], fontSize: 8 } },
        { content: `Rs. ${netInflow.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249], textColor: netInflow >= 0 ? [21, 128, 61] : [185, 28, 28], fontSize: 8.5 } }
      ]
    ]
  });

  // 4. Signatures
  const finalY = (doc.lastAutoTable?.finalY || 100) + 12;
  const sigY = finalY > pageHeight - 24 ? pageHeight - 24 : finalY;
  const sigWidth = 55;
  const colGap = (pageWidth - 28 - (3 * sigWidth)) / 2;

  const sigs = [
    'Prepared By / Cashier',
    'Verified By / Duty Manager',
    'Authorized Signatory / Hotel Owner'
  ];

  sigs.forEach((title, i) => {
    const sx = 14 + i * (sigWidth + colGap);
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.3);
    doc.line(sx, sigY, sx + sigWidth, sigY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(51, 65, 85);
    doc.text(title, sx + sigWidth / 2, sigY + 4, { align: 'center' });
  });

  // 5. Page Footers
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(14, pageHeight - 9, pageWidth - 14, pageHeight - 9);
    doc.text('Official Hotel Finance Statement - Generated from LodgeMaster PMS', 14, pageHeight - 5);
    doc.text(`Confidential - Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 5, { align: 'right' });
  }

  if (action === 'print') {
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const win = window.open(pdfUrl, '_blank');
    if (!win) {
      doc.save(fileName);
    }
  } else {
    doc.save(fileName);
  }

  return doc;
};

/**
 * Generates an executive Microsoft Excel SpreadsheetML (.xls) file for Payment Transactions Log.
 * Configured natively for Landscape printing and auto column width.
 */
export const exportPaymentsToExcel = (payments, summary = {}, hotelInfo = {}, filters = {}) => {
  if (!payments || payments.length === 0) {
    alert('No payment records available to export.');
    return;
  }

  const hotelName = hotelInfo?.name || 'Hotel & Lodge PMS';
  const hotelCode = hotelInfo?.code || hotelInfo?.property_code || '';
  const nowStr = new Date().toLocaleString('en-IN');
  const safeDate = new Date().toISOString().split('T')[0];

  const totalCollections = summary.totalCollections ?? payments.filter(p => parseFloat(p.amount || 0) > 0).reduce((acc, p) => acc + parseFloat(p.amount || 0), 0);
  const totalRefunds = summary.totalRefunds ?? payments.filter(p => parseFloat(p.amount || 0) < 0).reduce((acc, p) => acc + Math.abs(parseFloat(p.amount || 0)), 0);
  const netInflow = summary.netInflow ?? (totalCollections - totalRefunds);

  const xmlRows = payments.map((p, idx) => {
    const formattedDate = p.payment_date ? new Date(p.payment_date).toLocaleString('en-IN') : '—';
    const amt = parseFloat(p.amount || 0);
    const isNegative = amt < 0;
    const typeStr = isNegative ? 'REFUND' : p.stay_number ? 'STAY BILL' : 'ADVANCE';

    return `
      <Row ss:Height="20">
        <Cell ss:StyleID="CellCenter"><Data ss:Type="Number">${idx + 1}</Data></Cell>
        <Cell ss:StyleID="CellText"><Data ss:Type="String">${escapeXml(formattedDate)}</Data></Cell>
        <Cell ss:StyleID="CellTextBold"><Data ss:Type="String">${escapeXml(p.payment_number || `PAY-${p.id}`)}</Data></Cell>
        <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${escapeXml(p.stay_number || 'Direct Wallet')}</Data></Cell>
        <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${escapeXml(p.room_number ? `Room ${p.room_number}` : '—')}</Data></Cell>
        <Cell ss:StyleID="CellText"><Data ss:Type="String">${escapeXml(p.customer_name || 'Walk-in Guest')}</Data></Cell>
        <Cell ss:StyleID="CellText"><Data ss:Type="String">${escapeXml(p.customer_mobile || '—')}</Data></Cell>
        <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${escapeXml(p.payment_method || 'CASH')}</Data></Cell>
        <Cell ss:StyleID="CellText"><Data ss:Type="String">${escapeXml(p.transaction_reference || p.notes || '—')}</Data></Cell>
        <Cell ss:StyleID="CellText"><Data ss:Type="String">${escapeXml(p.received_by_name || 'Front Desk')}</Data></Cell>
        <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${escapeXml(typeStr)}</Data></Cell>
        <Cell ss:StyleID="${isNegative ? 'CellCurrencyDues' : 'CellCurrencyCredit'}"><Data ss:Type="Number">${amt.toFixed(2)}</Data></Cell>
      </Row>
    `;
  }).join('');

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>${escapeXml(hotelName)} - Payment Transactions Log</Title>
  <Subject>Financial Audit Trail</Subject>
  <Author>LodgeMaster PMS</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Color="#0F172A"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="TitleStyle">
   <Font ss:FontName="Segoe UI" ss:Size="14" ss:Bold="1" ss:Color="#0F172A"/>
  </Style>
  <Style ss:ID="SubTitleStyle">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#2563EB"/>
  </Style>
  <Style ss:ID="MetaLabel">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="8" ss:Bold="1" ss:Color="#64748B"/>
  </Style>
  <Style ss:ID="MetaValue">
   <Font ss:FontName="Segoe UI" ss:Size="8" ss:Color="#0F172A"/>
  </Style>
  <Style ss:ID="KpiCardCredit">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#059669"/>
   <Interior ss:Color="#ECFDF5" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A7F3D0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A7F3D0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A7F3D0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#A7F3D0"/>
   </Borders>
  </Style>
  <Style ss:ID="KpiCardDues">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#DC2626"/>
   <Interior ss:Color="#FEF2F2" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FECACA"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FECACA"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FECACA"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FECACA"/>
   </Borders>
  </Style>
  <Style ss:ID="KpiCardNet">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#2563EB"/>
   <Interior ss:Color="#EFF6FF" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFDBFE"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFDBFE"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFDBFE"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFDBFE"/>
   </Borders>
  </Style>
  <Style ss:ID="ColHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#334155"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#334155"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#334155"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#334155"/>
   </Borders>
  </Style>
  <Style ss:ID="CellText">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Color="#0F172A"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="CellTextBold">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1" ss:Color="#0F172A"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="CellCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Color="#0F172A"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="CellCurrencyCredit">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1" ss:Color="#15803D"/>
   <NumberFormat ss:Format="&quot;+₹&quot;#,##0.00"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="CellCurrencyDues">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1" ss:Color="#B91C1C"/>
   <NumberFormat ss:Format="&quot;-₹&quot;#,##0.00"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="TotalLabel">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="9" ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F172A"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F172A"/>
   </Borders>
  </Style>
  <Style ss:ID="TotalValueNet">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="&quot;₹&quot;#,##0.00"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F172A"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F172A"/>
   </Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="Payments Log">
  <Table ss:DefaultRowHeight="18">
   <Column ss:Width="30"/>
   <Column ss:Width="115"/>
   <Column ss:Width="110"/>
   <Column ss:Width="105"/>
   <Column ss:Width="65"/>
   <Column ss:Width="130"/>
   <Column ss:Width="95"/>
   <Column ss:Width="65"/>
   <Column ss:Width="120"/>
   <Column ss:Width="95"/>
   <Column ss:Width="80"/>
   <Column ss:Width="105"/>
   <Row ss:Height="24">
    <Cell ss:StyleID="TitleStyle"><Data ss:Type="String">${escapeXml(hotelName.toUpperCase())}</Data></Cell>
    <Cell ss:Index="10" ss:StyleID="MetaLabel"><Data ss:Type="String">Property Code:</Data></Cell>
    <Cell ss:StyleID="MetaValue"><Data ss:Type="String">${escapeXml(hotelCode || 'HOTEL-PMS')}</Data></Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:StyleID="SubTitleStyle"><Data ss:Type="String">Payment Transactions &amp; Financial Audit Log</Data></Cell>
    <Cell ss:Index="10" ss:StyleID="MetaLabel"><Data ss:Type="String">Generated:</Data></Cell>
    <Cell ss:StyleID="MetaValue"><Data ss:Type="String">${escapeXml(nowStr)}</Data></Cell>
   </Row>
   <Row ss:Height="10"/>
   <Row ss:Height="24">
    <Cell ss:MergeAcross="2" ss:StyleID="KpiCardCredit"><Data ss:Type="String">COLLECTIONS: ₹${totalCollections.toFixed(2)}</Data></Cell>
    <Cell ss:Index="4" ss:MergeAcross="2" ss:StyleID="KpiCardDues"><Data ss:Type="String">REFUNDS: ₹${totalRefunds.toFixed(2)}</Data></Cell>
    <Cell ss:Index="7" ss:MergeAcross="2" ss:StyleID="KpiCardNet"><Data ss:Type="String">NET INFLOW: ₹${netInflow.toFixed(2)}</Data></Cell>
    <Cell ss:Index="10" ss:MergeAcross="1" ss:StyleID="CellCenter"><Data ss:Type="String">Transactions: ${payments.length}</Data></Cell>
   </Row>
   <Row ss:Height="12"/>
   <Row ss:Height="24">
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">#</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Date &amp; Time</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Payment #</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Stay #</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Room</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Guest Name</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Mobile</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Method</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Txn Reference</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Received By</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Type</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Amount (INR)</Data></Cell>
   </Row>
   ${xmlRows}
   <Row ss:Height="22">
    <Cell ss:MergeAcross="10" ss:StyleID="TotalLabel"><Data ss:Type="String">CONSOLIDATED NET REVENUE TOTAL:</Data></Cell>
    <Cell ss:Index="12" ss:StyleID="TotalValueNet"><Data ss:Type="Number">${netInflow.toFixed(2)}</Data></Cell>
   </Row>
  </Table>
  <!-- EXCEL NATIVE LANDSCAPE PRINT SETUP -->
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <PageSetup>
    <Layout x:Orientation="Landscape"/>
    <Header x:Margin="0.3"/>
    <Footer x:Margin="0.3"/>
    <PageMargins x:Bottom="0.5" x:Left="0.5" x:Right="0.5" x:Top="0.5"/>
   </PageSetup>
   <FitToPage/>
   <Print>
    <FitWidth>1</FitWidth>
    <FitHeight>0</FitHeight>
    <ValidPrinterInfo/>
    <PaperSizeIndex>9</PaperSizeIndex>
    <HorizontalResolution>600</HorizontalResolution>
    <VerticalResolution>600</VerticalResolution>
   </Print>
   <Selected/>
   <Panes>
    <Pane>
     <Number>3</Number>
     <ActiveRow>1</ActiveRow>
    </Pane>
   </Panes>
   <ProtectObjects>False</ProtectObjects>
   <ProtectScenarios>False</ProtectScenarios>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Payment_Transactions_Log_${safeDate}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Fallback CSV export for Payment Transactions Log.
 */
export const exportPaymentsToCSV = (payments, summary = {}, hotelInfo = {}) => {
  if (!payments || payments.length === 0) {
    alert('No payment records available to export.');
    return;
  }

  const hotelName = hotelInfo?.name || 'Hotel & Lodge PMS';
  const hotelCode = hotelInfo?.code || '';
  const nowStr = new Date().toLocaleString('en-IN');
  const safeDate = new Date().toISOString().split('T')[0];

  const totalCollections = summary.totalCollections ?? payments.filter(p => parseFloat(p.amount || 0) > 0).reduce((acc, p) => acc + parseFloat(p.amount || 0), 0);
  const totalRefunds = summary.totalRefunds ?? payments.filter(p => parseFloat(p.amount || 0) < 0).reduce((acc, p) => acc + Math.abs(parseFloat(p.amount || 0)), 0);
  const netInflow = summary.netInflow ?? (totalCollections - totalRefunds);

  const metadataLines = [
    `"${hotelName.toUpperCase()} - PAYMENT TRANSACTIONS LOG"`,
    `"Property Code:",${escapeCSV(hotelCode)},"Generated On:",${escapeCSV(nowStr)}`,
    `"Total Transactions:",${escapeCSV(payments.length)},"Gross Collections (INR):",${escapeCSV(totalCollections.toFixed(2))}`,
    `"Total Refunds / Debits (INR):",${escapeCSV(totalRefunds.toFixed(2))},"Net Inflow (INR):",${escapeCSV(netInflow.toFixed(2))}`,
    `""`
  ];

  const headers = [
    '#',
    'Date & Time',
    'Payment Number',
    'Stay Number',
    'Room Number',
    'Guest Name',
    'Guest Mobile',
    'Payment Method',
    'Transaction Reference',
    'Received By',
    'Transaction Type',
    'Amount (INR)'
  ];

  const rows = payments.map((p, idx) => {
    const formattedDate = p.payment_date ? new Date(p.payment_date).toLocaleString('en-IN') : 'N/A';
    const amt = parseFloat(p.amount || 0);
    const isNegative = amt < 0;
    const typeStr = isNegative ? 'REFUND' : p.stay_number ? 'STAY BILL' : 'ADVANCE';

    return [
      escapeCSV(idx + 1),
      escapeCSV(formattedDate),
      escapeCSV(p.payment_number || `PAY-${p.id}`),
      escapeCSV(p.stay_number || 'Direct Wallet'),
      escapeCSV(p.room_number || 'N/A'),
      escapeCSV(p.customer_name || 'Walk-in Guest'),
      escapeCSV(p.customer_mobile || 'N/A'),
      escapeCSV(p.payment_method || 'CASH'),
      escapeCSV(p.transaction_reference || p.notes || '—'),
      escapeCSV(p.received_by_name || 'Front Desk'),
      escapeCSV(typeStr),
      escapeCSV(amt.toFixed(2))
    ].join(',');
  });

  const csvContent = '\uFEFF' + [...metadataLines, headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Payment_Transactions_Log_${safeDate}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const printPaymentsReport = (payments, summary = {}, hotelInfo = {}, filters = {}) => {
  return exportPaymentsToPDF(payments, summary, hotelInfo, filters, { action: 'print' });
};

// ============================================================================
// SHIFT DOSSIER & REPORT ENGINE EXPORT UTILITIES (A4 LANDSCAPE & SPREADSHEETML)
// ============================================================================

/**
 * Generates true A4 Landscape Vector PDF for complete Shift Activity Dossier (Z-Report).
 */
export const exportShiftDossierToPDF = (shiftInfo, hotelInfo = {}, options = {}) => {
  if (!shiftInfo) {
    alert('No shift audit data available to export.');
    return;
  }

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const marginLeft = 14;
  const marginRight = 14;
  const contentWidth = pageWidth - marginLeft - marginRight; // 269mm

  const lodgeName = (hotelInfo?.lodge_name || 'LODGE MANAGEMENT SYSTEM').toUpperCase();
  const address = hotelInfo?.address || 'Hotel Premises';
  const phone = hotelInfo?.phone || '';
  const gstin = hotelInfo?.gst_number ? `GSTIN: ${hotelInfo.gst_number}` : '';
  const shiftNumber = shiftInfo.shift_number || 'N/A';
  const cashierName = shiftInfo.cashier_name || 'Staff';
  const drawerCode = shiftInfo.drawer_code || 'Till';
  const duration = shiftInfo.duration_display || 'N/A';
  const statusStr = (shiftInfo.status_display || shiftInfo.status || 'CLOSED').toUpperCase();
  const openedAt = shiftInfo.opened_at || '—';
  const closedAt = shiftInfo.closed_at || 'Active';
  const financials = shiftInfo.financials || {};

  // 1. TOP HEADER BAND
  doc.setFillColor(15, 23, 42); // #0F172A Dark Slate
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setFillColor(37, 99, 235); // Blue Accent
  doc.rect(0, 28, pageWidth, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(lodgeName, marginLeft, 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  const contactText = [address, phone ? `Phone: ${phone}` : '', gstin].filter(Boolean).join(' | ');
  doc.text(contactText, marginLeft, 15);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('SHIFT ACTIVITY AUDIT & Z-REPORT', pageWidth - marginRight, 10, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Shift #${shiftNumber} • Cashier: ${cashierName} • Drawer: ${drawerCode}`, pageWidth - marginRight, 15, { align: 'right' });
  doc.text(`Window: ${openedAt} to ${closedAt} (${duration}) • Status: ${statusStr}`, pageWidth - marginRight, 20, { align: 'right' });

  let currentY = 34;

  // 2. 4 EXECUTIVE KPI SUMMARY CARDS
  const cardWidth = (contentWidth - 9) / 4; // 4 cards with 3mm gaps
  const cardHeight = 18;
  const openingFloat = financials.opening_cash || 0;
  const totalColl = financials.total_collections || 0;
  const cashColl = financials.cash_collections || 0;
  const expectedCash = financials.expected_cash || 0;
  const actualCash = financials.actual_cash;
  const diff = financials.cash_difference || 0;
  const discrepancyType = financials.discrepancy_type || (Math.abs(diff) < 0.01 ? 'EXACT' : diff > 0 ? 'EXCESS' : 'SHORTAGE');

  const kpis = [
    { label: 'OPENING FLOAT TILL', val: formatPdfCurrency(openingFloat), sub: `Drawer: ${drawerCode}`, stripeColor: [59, 130, 246] },
    { label: 'SHIFT COLLECTIONS', val: formatPdfCurrency(totalColl), sub: `Cash: ${formatPdfCurrency(cashColl)}`, stripeColor: [16, 185, 129] },
    { label: 'EXPECTED TILL CASH', val: formatPdfCurrency(expectedCash), sub: actualCash !== null && actualCash !== undefined ? `Counted: ${formatPdfCurrency(actualCash)}` : 'Pending Count', stripeColor: [14, 165, 233] },
    { label: 'TILL DISCREPANCY', val: formatPdfCurrency(diff, true), sub: `Status: ${discrepancyType}`, stripeColor: Math.abs(diff) < 0.01 ? [16, 185, 129] : [239, 68, 68] },
  ];

  kpis.forEach((kpi, idx) => {
    const cardX = marginLeft + idx * (cardWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 1.5, 1.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 1.5, 1.5, 'S');

    doc.setFillColor(...kpi.stripeColor);
    doc.rect(cardX, currentY, 2.5, cardHeight, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, cardX + 5, currentY + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(kpi.val, cardX + 5, currentY + 11.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(kpi.sub, cardX + 5, currentY + 15.5);
  });

  currentY += cardHeight + 5;

  // 3. TABLE: PAYMENTS & COLLECTIONS IN SHIFT
  const payments = shiftInfo.payments || [];
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`1. Itemized Shift Collections & Receipts (${payments.length} Transactions)`, marginLeft, currentY);
  currentY += 2;

  const paymentHeaders = [['#', 'Time', 'Receipt #', 'Guest Name', 'Room #', 'Stay #', 'Method', 'Reference / UTR', 'Amount (Rs.)']];
  const paymentRows = payments.map((p, idx) => [
    idx + 1,
    p.time || '—',
    p.payment_number || '—',
    p.guest_name || 'Guest',
    p.room_number || '—',
    p.stay_number || '—',
    p.payment_method_display || p.method || 'CASH',
    p.reference || '—',
    formatPdfCurrency(p.amount)
  ]);

  if (paymentRows.length === 0) {
    paymentRows.push(['—', '—', '—', 'No collections recorded during this shift', '—', '—', '—', '—', 'Rs. 0.00']);
  }

  autoTable(doc, {
    startY: currentY,
    head: paymentHeaders,
    body: paymentRows,
    theme: 'grid',
    margin: { left: marginLeft, right: marginRight },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 6.8,
      cellPadding: 1.5,
      textColor: [51, 65, 85]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 32 },
      3: { cellWidth: 48 },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 24, halign: 'center' },
      6: { cellWidth: 25, halign: 'center' },
      7: { cellWidth: 50 },
      8: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
    },
    didDrawPage: () => {
      // Auto-numbered footer
      const str = `Page ${doc.internal.getNumberOfPages()} of {total_pages_count_string}`;
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(str, pageWidth - marginRight, pageHeight - 6, { align: 'right' });
      doc.text(`Shift #${shiftNumber} Activity Audit • Printed: ${new Date().toLocaleString('en-IN')}`, marginLeft, pageHeight - 6);
    }
  });

  currentY = doc.lastAutoTable.finalY + 6;

  // 4. CHECK-INS AND CHECK-OUTS SIDE-BY-SIDE OR SEQUENTIAL
  const checkins = shiftInfo.checkins || [];
  const checkouts = shiftInfo.checkouts || [];

  if (currentY + 35 > pageHeight - 25) {
    doc.addPage();
    currentY = 15;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`2. Shift Front-Desk Operations (Arrivals: ${checkins.length} | Departures: ${checkouts.length})`, marginLeft, currentY);
  currentY += 2;

  const checkinHeaders = [['#', 'Time', 'Stay #', 'Guest Name', 'Mobile', 'Room #', 'Rate (Rs.)', 'Advance (Rs.)']];
  const checkinRows = checkins.slice(0, 10).map((c, idx) => [
    idx + 1,
    c.check_in_time || '—',
    c.stay_number || '—',
    c.guest_name || 'Guest',
    c.mobile || '—',
    c.room_number || '—',
    formatPdfCurrency(c.room_rate),
    formatPdfCurrency(c.advance_paid)
  ]);

  if (checkinRows.length === 0) {
    checkinRows.push(['—', '—', '—', 'No check-ins during this shift window', '—', '—', '—', '—']);
  }

  autoTable(doc, {
    startY: currentY,
    head: checkinHeaders,
    body: checkinRows,
    theme: 'grid',
    margin: { left: marginLeft, right: marginRight },
    headStyles: { fillColor: [30, 41, 59], fontSize: 6.8 },
    bodyStyles: { fontSize: 6.5, cellPadding: 1.4 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 65 },
      4: { cellWidth: 35 },
      5: { cellWidth: 25, halign: 'center' },
      6: { cellWidth: 42, halign: 'right' },
      7: { cellWidth: 42, halign: 'right', fontStyle: 'bold' }
    }
  });

  currentY = doc.lastAutoTable.finalY + 6;

  // 5. EXPENSES & DENOMINATIONS
  const expenses = shiftInfo.expenses || [];
  const denominations = (shiftInfo.denominations || []).filter(d => d.quantity > 0);

  if (currentY + 40 > pageHeight - 25) {
    doc.addPage();
    currentY = 15;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`3. Petty Cash Expenses & Cash Till Denominations Count`, marginLeft, currentY);
  currentY += 2;

  const expenseHeaders = [['Category', 'Description', 'Approved By', 'Time', 'Amount (Rs.)']];
  const expenseRows = expenses.map(e => [
    e.category_display || e.category,
    e.description,
    e.approved_by || 'Staff',
    e.time || '—',
    formatPdfCurrency(e.amount)
  ]);
  if (expenseRows.length === 0) {
    expenseRows.push(['—', 'No petty cash disbursements recorded in this shift', '—', '—', 'Rs. 0.00']);
  }

  autoTable(doc, {
    startY: currentY,
    head: expenseHeaders,
    body: expenseRows,
    theme: 'grid',
    margin: { left: marginLeft, right: marginRight },
    headStyles: { fillColor: [51, 65, 85], fontSize: 6.8 },
    bodyStyles: { fontSize: 6.5, cellPadding: 1.4 },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 110 },
      2: { cellWidth: 45 },
      3: { cellWidth: 30, halign: 'center' },
      4: { cellWidth: 44, halign: 'right', fontStyle: 'bold' }
    }
  });

  currentY = doc.lastAutoTable.finalY + 8;

  // 6. SIGN-OFF BLOCK
  if (currentY + 22 > pageHeight - 15) {
    doc.addPage();
    currentY = 20;
  }

  const sigBlockY = currentY;
  const sigColWidth = contentWidth / 3;

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);

  // Signatures
  doc.line(marginLeft + 10, sigBlockY + 12, marginLeft + sigColWidth - 10, sigBlockY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Cashier Handover: ${cashierName}`, marginLeft + sigColWidth / 2, sigBlockY + 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('I certify the physical cash counted is accurate', marginLeft + sigColWidth / 2, sigBlockY + 19.5, { align: 'center' });

  doc.line(marginLeft + sigColWidth + 10, sigBlockY + 12, marginLeft + sigColWidth * 2 - 10, sigBlockY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Approved By: ${shiftInfo.manager_approved_by || 'Front Desk Manager'}`, marginLeft + sigColWidth * 1.5, sigBlockY + 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Shift Discrepancy & Till Verification', marginLeft + sigColWidth * 1.5, sigBlockY + 19.5, { align: 'center' });

  doc.line(marginLeft + sigColWidth * 2 + 10, sigBlockY + 12, marginLeft + contentWidth - 10, sigBlockY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Internal Auditor / GM Sign-Off', marginLeft + sigColWidth * 2.5, sigBlockY + 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Verified for Financial Books', marginLeft + sigColWidth * 2.5, sigBlockY + 19.5, { align: 'center' });

  // Page count replacement
  if (typeof doc.putTotalPages === 'function') {
    doc.putTotalPages('{total_pages_count_string}');
  }

  const safeShift = shiftNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Shift_Dossier_ZReport_${safeShift}.pdf`;

  if (options.action === 'print') {
    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(blobUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    }
    return;
  }

  doc.save(filename);
};

/**
 * Generates true Landscape SpreadsheetML Excel (.xls) for Shift Activity Dossier.
 */
export const exportShiftDossierToExcel = (shiftInfo, hotelInfo = {}) => {
  if (!shiftInfo) {
    alert('No shift audit data available to export.');
    return;
  }

  const lodgeName = escapeXml((hotelInfo?.lodge_name || 'LODGE MANAGEMENT SYSTEM').toUpperCase());
  const address = escapeXml(hotelInfo?.address || 'Premises');
  const gstin = escapeXml(hotelInfo?.gst_number || 'N/A');
  const shiftNumber = escapeXml(shiftInfo.shift_number || 'N/A');
  const cashierName = escapeXml(shiftInfo.cashier_name || 'Staff');
  const drawerCode = escapeXml(shiftInfo.drawer_code || 'Till');
  const duration = escapeXml(shiftInfo.duration_display || 'N/A');
  const statusStr = escapeXml((shiftInfo.status_display || shiftInfo.status || 'CLOSED').toUpperCase());
  const openedAt = escapeXml(shiftInfo.opened_at || '—');
  const closedAt = escapeXml(shiftInfo.closed_at || 'Active');
  const safeShift = shiftInfo.shift_number ? shiftInfo.shift_number.replace(/[^a-zA-Z0-9_-]/g, '_') : 'Shift';
  const financials = shiftInfo.financials || {};

  const payments = shiftInfo.payments || [];
  const checkins = shiftInfo.checkins || [];
  const checkouts = shiftInfo.checkouts || [];
  const expenses = shiftInfo.expenses || [];
  const denominations = shiftInfo.denominations || [];

  const paymentRowsXml = payments.map((p, idx) => `
    <Row>
      <Cell ss:StyleID="TextCellCenter"><Data ss:Type="Number">${idx + 1}</Data></Cell>
      <Cell ss:StyleID="TextCellCenter"><Data ss:Type="String">${escapeXml(p.time)}</Data></Cell>
      <Cell ss:StyleID="TextCell"><Data ss:Type="String">${escapeXml(p.payment_number)}</Data></Cell>
      <Cell ss:StyleID="TextCell"><Data ss:Type="String">${escapeXml(p.guest_name)}</Data></Cell>
      <Cell ss:StyleID="TextCellCenter"><Data ss:Type="String">${escapeXml(p.room_number)}</Data></Cell>
      <Cell ss:StyleID="TextCellCenter"><Data ss:Type="String">${escapeXml(p.stay_number)}</Data></Cell>
      <Cell ss:StyleID="TextCellCenter"><Data ss:Type="String">${escapeXml(p.payment_method_display || p.method)}</Data></Cell>
      <Cell ss:StyleID="TextCell"><Data ss:Type="String">${escapeXml(p.reference)}</Data></Cell>
      <Cell ss:StyleID="CurrencyCell"><Data ss:Type="Number">${parseFloat(p.amount || 0).toFixed(2)}</Data></Cell>
    </Row>
  `).join('');

  const checkinRowsXml = checkins.map((c, idx) => `
    <Row>
      <Cell ss:StyleID="TextCellCenter"><Data ss:Type="Number">${idx + 1}</Data></Cell>
      <Cell ss:StyleID="TextCellCenter"><Data ss:Type="String">${escapeXml(c.check_in_time)}</Data></Cell>
      <Cell ss:StyleID="TextCellCenter"><Data ss:Type="String">${escapeXml(c.stay_number)}</Data></Cell>
      <Cell ss:StyleID="TextCell"><Data ss:Type="String">${escapeXml(c.guest_name)}</Data></Cell>
      <Cell ss:StyleID="TextCellCenter"><Data ss:Type="String">${escapeXml(c.mobile)}</Data></Cell>
      <Cell ss:StyleID="TextCellCenter"><Data ss:Type="String">${escapeXml(c.room_number)}</Data></Cell>
      <Cell ss:StyleID="CurrencyCell"><Data ss:Type="Number">${parseFloat(c.room_rate || 0).toFixed(2)}</Data></Cell>
      <Cell ss:StyleID="CurrencyCell"><Data ss:Type="Number">${parseFloat(c.advance_paid || 0).toFixed(2)}</Data></Cell>
    </Row>
  `).join('');

  const expenseRowsXml = expenses.map((e, idx) => `
    <Row>
      <Cell ss:StyleID="TextCellCenter"><Data ss:Type="Number">${idx + 1}</Data></Cell>
      <Cell ss:StyleID="TextCell"><Data ss:Type="String">${escapeXml(e.category_display || e.category)}</Data></Cell>
      <Cell ss:StyleID="TextCell"><Data ss:Type="String">${escapeXml(e.description)}</Data></Cell>
      <Cell ss:StyleID="TextCell"><Data ss:Type="String">${escapeXml(e.created_by)}</Data></Cell>
      <Cell ss:StyleID="TextCell"><Data ss:Type="String">${escapeXml(e.approved_by)}</Data></Cell>
      <Cell ss:StyleID="CurrencyCell"><Data ss:Type="Number">${parseFloat(e.amount || 0).toFixed(2)}</Data></Cell>
    </Row>
  `).join('');

  const excelXml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="LodgeTitle">
   <Font ss:FontName="Calibri" ss:Size="14" ss:Bold="1" ss:Color="#0F172A"/>
  </Style>
  <Style ss:ID="SubHeader">
   <Font ss:FontName="Calibri" ss:Size="9" ss:Color="#475569"/>
  </Style>
  <Style ss:ID="SectionHeader">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#1E3A8A"/>
   <Interior ss:Color="#EFF6FF" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="ColHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F172A"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="9.5" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="TextCell">
   <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders>
   <Font ss:FontName="Calibri" ss:Size="9" ss:Color="#1E293B"/>
  </Style>
  <Style ss:ID="TextCellCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders>
   <Font ss:FontName="Calibri" ss:Size="9" ss:Color="#1E293B"/>
  </Style>
  <Style ss:ID="CurrencyCell">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders>
   <Font ss:FontName="Calibri" ss:Size="9" ss:Color="#0F172A"/>
   <NumberFormat ss:Format="&#34;₹&#34;#,##0.00"/>
  </Style>
  <Style ss:ID="KpiLabel">
   <Font ss:FontName="Calibri" ss:Size="8" ss:Bold="1" ss:Color="#64748B"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="KpiVal">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="&#34;₹&#34;#,##0.00"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Shift Dossier">
  <Table ss:DefaultColumnWidth="85">
   <Column ss:Width="30"/>
   <Column ss:Width="80"/>
   <Column ss:Width="110"/>
   <Column ss:Width="130"/>
   <Column ss:Width="65"/>
   <Column ss:Width="75"/>
   <Column ss:Width="85"/>
   <Column ss:Width="130"/>
   <Column ss:Width="105"/>

   <Row ss:Height="22">
    <Cell ss:MergeAcross="8" ss:StyleID="LodgeTitle"><Data ss:Type="String">${lodgeName} — SHIFT ACTIVITY AUDIT &amp; Z-REPORT</Data></Cell>
   </Row>
   <Row>
    <Cell ss:MergeAcross="8" ss:StyleID="SubHeader"><Data ss:Type="String">Address: ${address} | GSTIN: ${gstin} | Shift #${shiftNumber} | Cashier: ${cashierName} | Till: ${drawerCode}</Data></Cell>
   </Row>
   <Row>
    <Cell ss:MergeAcross="8" ss:StyleID="SubHeader"><Data ss:Type="String">Window: ${openedAt} to ${closedAt} (${duration}) | Status: ${statusStr}</Data></Cell>
   </Row>
   <Row ss:Height="6"/>

   <!-- KPI Block -->
   <Row ss:Height="16">
    <Cell ss:MergeAcross="1" ss:StyleID="KpiLabel"><Data ss:Type="String">OPENING FLOAT TILL</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="KpiLabel"><Data ss:Type="String">TOTAL SHIFT COLLECTIONS</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="KpiLabel"><Data ss:Type="String">EXPECTED PHYSICAL CASH</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="KpiLabel"><Data ss:Type="String">TILL DISCREPANCY / VARIANCE</Data></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:MergeAcross="1" ss:StyleID="KpiVal"><Data ss:Type="Number">${financials.opening_cash || 0}</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="KpiVal"><Data ss:Type="Number">${financials.total_collections || 0}</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="KpiVal"><Data ss:Type="Number">${financials.expected_cash || 0}</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="KpiVal"><Data ss:Type="Number">${financials.cash_difference || 0}</Data></Cell>
   </Row>
   <Row ss:Height="8"/>

   <!-- Section 1 -->
   <Row ss:Height="18">
    <Cell ss:MergeAcross="8" ss:StyleID="SectionHeader"><Data ss:Type="String">1. ITEMISED SHIFT COLLECTIONS &amp; RECEIPTS (${payments.length} Records)</Data></Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">#</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Time</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Receipt #</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Guest Name</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Room</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Stay #</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Method</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Ref / UTR</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Amount (₹)</Data></Cell>
   </Row>
   ${paymentRowsXml}
   <Row ss:Height="10"/>

   <!-- Section 2 -->
   <Row ss:Height="18">
    <Cell ss:MergeAcross="7" ss:StyleID="SectionHeader"><Data ss:Type="String">2. SHIFT ARRIVALS &amp; CHECK-INS (${checkins.length} Guests)</Data></Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">#</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Time</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Stay #</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Guest Name</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Mobile</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Room</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Room Rate (₹)</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Advance Paid (₹)</Data></Cell>
   </Row>
   ${checkinRowsXml}
   <Row ss:Height="10"/>

   <!-- Section 3 -->
   <Row ss:Height="18">
    <Cell ss:MergeAcross="5" ss:StyleID="SectionHeader"><Data ss:Type="String">3. SHIFT PETTY CASH EXPENSES (${expenses.length} Items)</Data></Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">#</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Category</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Description</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Recorded By</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Approved By</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Amount (₹)</Data></Cell>
   </Row>
   ${expenseRowsXml}

  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <PageSetup>
    <Layout x:Orientation="Landscape"/>
   </PageSetup>
   <FitToPage/>
   <Print>
    <FitWidth>1</FitWidth>
    <FitHeight>0</FitHeight>
    <ValidPrinterInfo/>
    <PaperSizeIndex>9</PaperSizeIndex>
   </Print>
   <Selected/>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([excelXml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Shift_Dossier_${safeShift}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Generates true A4 Landscape Vector PDF for any report generated by the report engine.
 */
export const exportGenericReportToPDF = (reportData, hotelInfo = {}, options = {}) => {
  if (!reportData || !reportData.rows || reportData.rows.length === 0) {
    alert('No report data available to export.');
    return;
  }

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const marginLeft = 14;
  const marginRight = 14;
  const contentWidth = pageWidth - marginLeft - marginRight;

  const lodgeName = (hotelInfo?.lodge_name || 'LODGE MANAGEMENT SYSTEM').toUpperCase();
  const address = hotelInfo?.address || 'Hotel Premises';
  const phone = hotelInfo?.phone || '';
  const gstin = hotelInfo?.gst_number ? `GSTIN: ${hotelInfo.gst_number}` : '';
  const reportTitle = (reportData.title || 'LODGE AUDIT REPORT').toUpperCase();
  const dateLabel = reportData.date_label || 'All Time';

  // 1. TOP HEADER BAND
  doc.setFillColor(15, 23, 42); // Dark Slate #0F172A
  doc.rect(0, 0, pageWidth, 26, 'F');

  doc.setFillColor(37, 99, 235); // Blue Accent
  doc.rect(0, 26, pageWidth, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(lodgeName, marginLeft, 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  const contactText = [address, phone ? `Phone: ${phone}` : '', gstin].filter(Boolean).join(' | ');
  doc.text(contactText, marginLeft, 15);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(reportTitle, pageWidth - marginRight, 10, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Period: ${dateLabel} • Verified Transactions: ${reportData.rows.length}`, pageWidth - marginRight, 15, { align: 'right' });

  let currentY = 32;

  // 2. 4 EXECUTIVE KPI SUMMARY BLOCKS (IF AVAILABLE)
  if (reportData.kpis && reportData.kpis.length > 0) {
    const visibleKpis = reportData.kpis.slice(0, 4);
    const cardWidth = (contentWidth - (visibleKpis.length - 1) * 3) / visibleKpis.length;
    const cardHeight = 16;

    visibleKpis.forEach((kpi, idx) => {
      const cardX = marginLeft + idx * (cardWidth + 3);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 1.5, 1.5, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 1.5, 1.5, 'S');

      doc.setFillColor(37, 99, 235);
      doc.rect(cardX, currentY, 2.5, cardHeight, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text((kpi.label || '').toUpperCase(), cardX + 5, currentY + 5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      const valStr = kpi.format === 'currency' ? formatPdfCurrency(kpi.value) : String(kpi.value ?? '—');
      doc.text(valStr, cardX + 5, currentY + 11.5);
    });

    currentY += cardHeight + 5;
  }

  // 3. TABLE RENDERING WITH AUTOTABLE
  const visibleCols = (reportData.columns || []).filter(c => !options.hiddenColumns?.[c.key]);
  const tableHeaders = [visibleCols.map(c => c.label)];
  const tableRows = reportData.rows.map(row => {
    return visibleCols.map(c => {
      const val = row[c.key];
      if (c.format === 'currency') return formatPdfCurrency(val);
      if (val === null || val === undefined || val === '') return '—';
      return String(val);
    });
  });

  autoTable(doc, {
    startY: currentY,
    head: tableHeaders,
    body: tableRows,
    theme: 'grid',
    margin: { left: marginLeft, right: marginRight },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.2,
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 6.8,
      cellPadding: 1.6,
      textColor: [51, 65, 85]
    },
    didDrawPage: () => {
      const str = `Page ${doc.internal.getNumberOfPages()} of {total_pages_count_string}`;
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(str, pageWidth - marginRight, pageHeight - 6, { align: 'right' });
      doc.text(`${reportTitle} • Printed: ${new Date().toLocaleString('en-IN')}`, marginLeft, pageHeight - 6);
    }
  });

  // Page total replacement
  if (typeof doc.putTotalPages === 'function') {
    doc.putTotalPages('{total_pages_count_string}');
  }

  const safeTitle = (reportData.title || 'Report').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${safeTitle}_${dateLabel.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

  if (options.action === 'print') {
    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(blobUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    }
    return;
  }

  doc.save(filename);
};

// =============================================================================
// 6. DAILY NIGHT AUDIT & OPERATIONS CLOSE: TRUE A4 LANDSCAPE PDF
// =============================================================================

/**
 * Generates true A4 Landscape Vector PDF for the Daily Night Audit & Operations Close.
 */
export const exportNightAuditToPDF = (auditData, options = {}) => {
  if (!auditData) {
    alert('No night audit data available to export.');
    return null;
  }

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const marginLeft = 14;
  const marginRight = 14;
  const contentWidth = pageWidth - marginLeft - marginRight; // 269mm

  const fin = auditData.financial_close || {};
  const inv = auditData.inventory_summary || {};
  const ops = auditData.operations_summary || {};
  const lodge = auditData.lodge_info || {};

  const lodgeName = (lodge.lodge_name || 'LODGE MANAGEMENT SYSTEM').toUpperCase();
  const address = lodge.address || 'Hotel Premises';
  const phone = lodge.phone || '';
  const gstin = lodge.gst_number ? `GSTIN: ${lodge.gst_number}` : '';
  const auditDate = auditData.audit_date || new Date().toISOString().split('T')[0];
  const timestamp = auditData.timestamp || new Date().toLocaleString('en-IN');

  // --- 1. Top Header Banner (Dark Navy #0F172A) ---
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 26, 'F');

  doc.setFillColor(37, 99, 235); // Blue Accent line
  doc.rect(0, 26, pageWidth, 1.5, 'F');

  // Hotel info on left
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(lodgeName, marginLeft, 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  const contactText = [address, phone ? `Phone: ${phone}` : '', gstin].filter(Boolean).join('  |  ');
  doc.text(contactText, marginLeft, 15);

  // Night Audit title on right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('DAILY NIGHT AUDIT & OPERATIONS CLOSE', pageWidth - marginRight, 10, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Audit Date: ${auditDate}  |  Generated: ${timestamp}`, pageWidth - marginRight, 15, { align: 'right' });

  let currentY = 32;

  // --- 2. 6 Executive KPI Summary Cards ---
  const kpiCount = 6;
  const cardGap = 2.5;
  const cardWidth = (contentWidth - ((kpiCount - 1) * cardGap)) / kpiCount; // ~42.75mm
  const cardHeight = 15;

  const totalRev = parseFloat(fin.total_collections_today) || 0;
  const netCash = parseFloat(fin.net_cash_in_till) || 0;
  const totDigital = parseFloat(fin.total_digital) || 0;
  const cashIn = parseFloat(fin.cash_received) || 0;
  const cashOut = parseFloat(fin.cash_refunded) || 0;
  const cashExpenses = parseFloat(fin.cash_expenses) || 0;
  const occPct = parseFloat(inv.occupancy_percentage) || 0;

  const kpis = [
    {
      label: 'NET CASH IN DRAWER',
      val: formatPdfCurrency(netCash),
      sub: `In: ${formatPdfCurrency(cashIn)} | Out: ${formatPdfCurrency(cashOut)}`,
      color: [5, 150, 105] // Emerald
    },
    {
      label: 'DIGITAL SETTLED',
      val: formatPdfCurrency(totDigital),
      sub: `UPI: ${formatPdfCurrency(fin.upi_collections || 0)} | POS: ${formatPdfCurrency(fin.card_collections || 0)}`,
      color: [2, 132, 199] // Sky Blue
    },
    {
      label: 'TOTAL REVENUE',
      val: formatPdfCurrency(totalRev),
      sub: 'Net Till Cash + Digital Settlements',
      color: [79, 70, 229] // Indigo
    },
    {
      label: 'TILL CASH EXPENSES',
      val: formatPdfCurrency(cashExpenses),
      sub: `${fin.expenses_count || 0} Petty Cash Voucher(s)`,
      color: [217, 119, 6] // Amber
    },
    {
      label: 'ROOM OCCUPANCY',
      val: `${occPct}%`,
      sub: `${inv.occupied_rooms || 0}/${inv.total_rooms || 0} Units Occupied`,
      color: [124, 58, 237] // Purple
    },
    {
      label: 'GUEST MOVEMENTS',
      val: `${ops.today_checkins || 0} In / ${ops.today_checkouts || 0} Out`,
      sub: `${ops.tomorrow_arrivals_count || 0} Tomorrow | ${ops.overdue_stays || 0} Overdue`,
      color: [71, 85, 105] // Slate
    }
  ];

  kpis.forEach((kpi, idx) => {
    const cardX = marginLeft + idx * (cardWidth + cardGap);
    // Background card
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 1.5, 1.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 1.5, 1.5, 'S');

    // Left Stripe
    doc.setFillColor(...kpi.color);
    doc.rect(cardX, currentY, 2.0, cardHeight, 'F');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, cardX + 3.8, currentY + 4.2);

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.8);
    doc.setTextColor(...kpi.color);
    doc.text(kpi.val, cardX + 3.8, currentY + 9.2);

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.0);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.sub, cardX + 3.8, currentY + 13);
  });

  currentY += cardHeight + 4;

  // --- 3. Table 1: Financial Reconciliation & Payment Channel Settlement ---
  const finHeaders = [
    ['Payment Channel / Cash Drawer', 'Opening / Collections (Rs.)', 'Refunds & Expenses (Rs.)', 'Net Settled (Rs.)', '% Share of Revenue', 'Audit Status']
  ];

  const calcPct = (amt) => {
    const n = parseFloat(amt) || 0;
    if (totalRev <= 0) return '0.0%';
    return `${((n / totalRev) * 100).toFixed(1)}%`;
  };

  const finRows = [
    [
      'Cash in Drawer (Physical Till)',
      formatPdfCurrency(cashIn),
      formatPdfCurrency(cashOut + cashExpenses),
      formatPdfCurrency(netCash),
      calcPct(netCash),
      'DRAWER BALANCED & AUDITED'
    ],
    [
      '  ↳ Operational Till Cash Expenses',
      'Rs. 0.00',
      formatPdfCurrency(cashExpenses),
      `-${formatPdfCurrency(cashExpenses)}`,
      '—',
      `${fin.expenses_count || 0} VOUCHER(S) PAID FROM TILL`
    ],
    [
      'Digital UPI (PhonePe, GPay, Paytm, QR)',
      formatPdfCurrency(fin.upi_collections || 0),
      'Rs. 0.00',
      formatPdfCurrency(fin.upi_collections || 0),
      calcPct(fin.upi_collections || 0),
      'SETTLED TO LINKED BANK ACCOUNT'
    ],
    [
      'POS Cards (Debit / Credit Terminals)',
      formatPdfCurrency(fin.card_collections || 0),
      'Rs. 0.00',
      formatPdfCurrency(fin.card_collections || 0),
      calcPct(fin.card_collections || 0),
      'SETTLED VIA PAYMENT GATEWAY'
    ],
    [
      'Bank Transfer / Direct NEFT / RTGS',
      formatPdfCurrency(fin.bank_collections || 0),
      'Rs. 0.00',
      formatPdfCurrency(fin.bank_collections || 0),
      calcPct(fin.bank_collections || 0),
      'DIRECT BANK CLEARING VERIFIED'
    ]
  ];

  autoTable(doc, {
    startY: currentY,
    head: finHeaders,
    body: finRows,
    foot: [
      [
        'Total Consolidated Daily Revenue',
        formatPdfCurrency(cashIn + totDigital),
        formatPdfCurrency(cashOut + cashExpenses),
        formatPdfCurrency(totalRev),
        '100.0%',
        'CLOSING BALANCED & VERIFIED'
      ]
    ],
    theme: 'grid',
    margin: { left: marginLeft, right: marginRight },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.2,
      halign: 'left',
      cellPadding: 1.8
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 7.5,
      cellPadding: 1.8
    },
    bodyStyles: {
      fontSize: 7,
      cellPadding: 1.6,
      textColor: [51, 65, 85]
    },
    columnStyles: {
      0: { cellWidth: 70, fontStyle: 'bold' },
      1: { cellWidth: 42, halign: 'right' },
      2: { cellWidth: 38, halign: 'right', textColor: [185, 28, 28] },
      3: { cellWidth: 38, halign: 'right', fontStyle: 'bold', textColor: [21, 128, 61] },
      4: { cellWidth: 33, halign: 'center' },
      5: { cellWidth: 48, halign: 'center', fontStyle: 'bold', textColor: [37, 99, 235], fontSize: 6.5 }
    }
  });

  currentY = (doc.lastAutoTable?.finalY || currentY) + 4;

  // --- 4. Table 2: Reception Till Disbursements & Petty Cash Expenses ---
  const expHeaders = [
    ['#', 'Time', 'Shift #', 'Category', 'Description / Purpose', 'Cashier / Staff', 'Approval Status', 'Amount (Rs.)']
  ];

  const tillExpensesList = auditData.till_expenses || [];
  const expRows = tillExpensesList.length > 0
    ? tillExpensesList.map((e, idx) => [
        String(idx + 1),
        e.time || '—',
        String(e.shift_number || '—'),
        (e.category_display || e.category || 'EXPENSE').toUpperCase(),
        e.description || '—',
        e.created_by || 'Staff',
        e.is_manager_approved ? `APPROVED (${e.approved_by || 'Mgr'})` : 'LOGGED',
        `-${formatPdfCurrency(e.amount || 0)}`
      ])
    : [
        ['—', '—', '—', 'CLEAR', 'No till disbursements or petty cash expenses recorded today', '—', 'VERIFIED', 'Rs. 0.00']
      ];

  autoTable(doc, {
    startY: currentY,
    head: expHeaders,
    body: expRows,
    foot: tillExpensesList.length > 0 ? [
      [
        'Total Till Cash Expenses Disbursed',
        '', '', '', '', '', '',
        `-${formatPdfCurrency(cashExpenses)}`
      ]
    ] : undefined,
    theme: 'grid',
    margin: { left: marginLeft, right: marginRight },
    headStyles: {
      fillColor: [180, 83, 9],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.2,
      halign: 'left',
      cellPadding: 1.8
    },
    footStyles: {
      fillColor: [254, 243, 199],
      textColor: [180, 83, 9],
      fontStyle: 'bold',
      fontSize: 7.2,
      cellPadding: 1.8
    },
    bodyStyles: {
      fontSize: 7,
      cellPadding: 1.5,
      textColor: [51, 65, 85]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 22 },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 36, fontStyle: 'bold' },
      4: { cellWidth: 85 },
      5: { cellWidth: 34 },
      6: { cellWidth: 30, halign: 'center', fontSize: 6.5 },
      7: { cellWidth: 30, halign: 'right', fontStyle: 'bold', textColor: [185, 28, 28] }
    }
  });

  currentY = (doc.lastAutoTable?.finalY || currentY) + 4;

  // --- 5. Table 3: Room Inventory & Operations Breakdown ---
  const invHeaders = [
    ['Operational Domain', 'Metric Indicator', 'Value / Count', 'Operational Status & Breakdown']
  ];

  const invRows = [
    ['Room Inventory', 'Occupied Rooms', `${inv.occupied_rooms || 0} Rooms`, `Occupancy: ${inv.occupancy_percentage || 0}% of ${inv.total_rooms || 0} total units`],
    ['Room Inventory', 'Available for Sale', `${inv.available_rooms || 0} Rooms`, 'Vacant, inspected and ready for immediate guest check-in'],
    ['Housekeeping', 'Cleaning / Dirty Rooms', `${inv.cleaning_rooms || 0} Rooms`, 'Rooms undergoing housekeeping cleaning and sanitized turnaround'],
    ['Housekeeping', 'Maintenance Block', `${inv.maintenance_rooms || 0} Rooms`, 'Under repair, maintenance, or temporary administrative block'],
    ['Guest Movements', 'Check-ins Completed Today', `${ops.today_checkins || 0} Arrivals`, 'Front desk guest registration and room assignment completed'],
    ['Guest Movements', 'Check-outs Completed Today', `${ops.today_checkouts || 0} Departures`, 'Folio billing settled, room keys returned, guest departure logged'],
    ['Risk & Oversight', 'Overdue Stays', `${ops.overdue_stays || 0} Stays`, (ops.overdue_stays || 0) > 0 ? 'ALERT: Checked-in guest(s) past expected checkout date' : 'Clear: Zero overdue check-outs']
  ];

  autoTable(doc, {
    startY: currentY,
    head: invHeaders,
    body: invRows,
    theme: 'grid',
    margin: { left: marginLeft, right: marginRight },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.2,
      halign: 'left',
      cellPadding: 1.8
    },
    bodyStyles: {
      fontSize: 7,
      cellPadding: 1.5,
      textColor: [51, 65, 85]
    },
    columnStyles: {
      0: { cellWidth: 45, fontStyle: 'bold' },
      1: { cellWidth: 55 },
      2: { cellWidth: 35, fontStyle: 'bold', textColor: [15, 23, 42] },
      3: { cellWidth: 134 }
    }
  });

  currentY = (doc.lastAutoTable?.finalY || currentY) + 4;

  // --- 5. Table 3: Tomorrow's Scheduled Arrivals ---
  const arrHeaders = [
    ['#', 'Booking Reference', 'Guest Name', 'Contact Mobile', 'Assigned Room', 'Advance Paid (Rs.)', 'Reservation Status']
  ];

  const tomorrowList = auditData.tomorrow_arrivals || [];
  const arrRows = tomorrowList.length > 0
    ? tomorrowList.map((a, idx) => [
        String(idx + 1),
        a.booking_number || '—',
        a.guest_name || 'Guest',
        a.mobile || '—',
        a.room_number || 'Unassigned',
        formatPdfCurrency(a.advance_paid || 0),
        (a.status || 'CONFIRMED').toUpperCase()
      ])
    : [
        ['—', 'None Scheduled', 'No advance bookings scheduled for arrival tomorrow', '—', '—', 'Rs. 0.00', 'CLEAR']
      ];

  autoTable(doc, {
    startY: currentY,
    head: arrHeaders,
    body: arrRows,
    theme: 'grid',
    margin: { left: marginLeft, right: marginRight },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.2,
      halign: 'left',
      cellPadding: 1.8
    },
    bodyStyles: {
      fontSize: 7,
      cellPadding: 1.5,
      textColor: [51, 65, 85]
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 42, fontStyle: 'bold' },
      2: { cellWidth: 62 },
      3: { cellWidth: 42 },
      4: { cellWidth: 38 },
      5: { cellWidth: 38, halign: 'right', fontStyle: 'bold', textColor: [21, 128, 61] },
      6: { cellWidth: 35, halign: 'center', fontStyle: 'bold', textColor: [37, 99, 235], fontSize: 6.5 }
    }
  });

  // --- 6. Official 3-Tier Signatures ---
  const lastY = doc.lastAutoTable?.finalY || currentY;
  let sigY = lastY + 12;
  if (sigY > pageHeight - 22) {
    doc.addPage();
    sigY = 30;
  }

  const sigWidth = 65;
  const sigGap = (contentWidth - (3 * sigWidth)) / 2;
  const sigs = [
    'Duty Night Auditor (System Confirmed)',
    'Front Office Manager / Supervisor',
    'General Manager / Hotel Owner Approval'
  ];

  sigs.forEach((title, i) => {
    const sx = marginLeft + i * (sigWidth + sigGap);
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.3);
    doc.line(sx, sigY, sx + sigWidth, sigY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(51, 65, 85);
    doc.text(title, sx + sigWidth / 2, sigY + 3.8, { align: 'center' });
  });

  // --- 7. Running Page Footer Across All Pages ---
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(marginLeft, pageHeight - 7, pageWidth - marginRight, pageHeight - 7);
    doc.text('LodgeMaster PMS • Official Daily Night Audit Close • Confidential', marginLeft, pageHeight - 3.8);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - marginRight, pageHeight - 3.8, { align: 'right' });
  }

  // --- 8. File Dispatch ---
  const safeDate = String(auditDate).replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeHotel = lodgeName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `Daily_Night_Audit_${safeHotel}_${safeDate}.pdf`;

  if (options.action === 'print') {
    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(blobUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    } else {
      doc.save(fileName);
    }
    return doc;
  }

  doc.save(fileName);
  return doc;
};

// =============================================================================
// 7. CASHIER RECONCILIATION & DISCREPANCY AUDIT: TRUE A4 LANDSCAPE PDF
// =============================================================================

/**
 * Generates true A4 Landscape Vector PDF for Cashier Reconciliation & Discrepancy Analytics.
 */
export const exportShiftReconciliationToPDF = (data, hotelInfo = {}, options = {}) => {
  if (!data || !data.summary) {
    alert('No shift reconciliation data available to export.');
    return null;
  }

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const marginLeft = 14;
  const marginRight = 14;
  const contentWidth = pageWidth - marginLeft - marginRight; // 269mm

  const summary = data.summary || {};
  const leaderboard = data.staff_leaderboard || [];
  const lodgeName = (hotelInfo?.lodge_name || 'LODGE MANAGEMENT SYSTEM').toUpperCase();
  const address = hotelInfo?.address || 'Hotel Premises';
  const phone = hotelInfo?.phone || '';
  const gstin = hotelInfo?.gst_number ? `GSTIN: ${hotelInfo.gst_number}` : '';
  const startDate = data.start_date || 'N/A';
  const endDate = data.end_date || 'N/A';

  // 1. Header Band
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 26, 'F');

  doc.setFillColor(37, 99, 235);
  doc.rect(0, 26, pageWidth, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(lodgeName, marginLeft, 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  const contactText = [address, phone ? `Phone: ${phone}` : '', gstin].filter(Boolean).join('  |  ');
  doc.text(contactText, marginLeft, 15);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('CASHIER RECONCILIATION & DISCREPANCY AUDIT', pageWidth - marginRight, 10, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Period: ${startDate} to ${endDate}  |  Audited Drawers: ${summary.audited_drawers || 0}`, pageWidth - marginRight, 15, { align: 'right' });

  let currentY = 32;

  // 2. 5 Executive KPI Cards
  const kpiCount = 5;
  const cardGap = 3;
  const cardWidth = (contentWidth - ((kpiCount - 1) * cardGap)) / kpiCount; // ~51.4mm
  const cardHeight = 15;

  const totalPettyCash = parseFloat(data.total_expense_amount || summary.total_petty_cash_expenses) || 0;
  const voucherCount = summary.petty_cash_vouchers_count || (data.itemized_expenses ? data.itemized_expenses.length : 0);

  const kpis = [
    {
      label: 'OVERALL CASH ACCURACY RATE',
      val: `${summary.accuracy_rate || 100}%`,
      sub: `${summary.total_shifts_closed || summary.closed_shifts || 0} Total Shifts Audited`,
      color: [37, 99, 235]
    },
    {
      label: 'NET DRAWER VARIANCE',
      val: formatPdfCurrency(summary.net_drawer_variance || summary.net_variance || 0, true),
      sub: (summary.net_drawer_variance || summary.net_variance || 0) === 0 ? 'Exact Till Match' : (summary.net_drawer_variance || summary.net_variance || 0) < 0 ? 'Net Cash Shortage' : 'Net Cash Excess',
      color: (summary.net_drawer_variance || summary.net_variance || 0) === 0 ? [5, 150, 105] : (summary.net_drawer_variance || summary.net_variance || 0) < 0 ? [220, 38, 38] : [5, 150, 105]
    },
    {
      label: 'TOTAL CASH SHORTAGES',
      val: formatPdfCurrency(summary.total_shortages || summary.total_shortage || 0),
      sub: 'Cumulative Shortages Reported',
      color: [220, 38, 38]
    },
    {
      label: 'TOTAL CASH EXCESS',
      val: formatPdfCurrency(summary.total_excesses || summary.total_excess || 0),
      sub: 'Cumulative Drawer Overages',
      color: [5, 150, 105]
    },
    {
      label: 'TILL PETTY CASH EXPENSES',
      val: formatPdfCurrency(totalPettyCash),
      sub: `${voucherCount} Voucher(s) Paid from Till`,
      color: [217, 119, 6] // Amber
    }
  ];

  kpis.forEach((kpi, idx) => {
    const cardX = marginLeft + idx * (cardWidth + cardGap);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 1.5, 1.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 1.5, 1.5, 'S');

    doc.setFillColor(...kpi.color);
    doc.rect(cardX, currentY, 2.2, cardHeight, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.0);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, cardX + 4.2, currentY + 4.2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.0);
    doc.setTextColor(...kpi.color);
    doc.text(kpi.val, cardX + 4.2, currentY + 9.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.2);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.sub, cardX + 4.2, currentY + 13);
  });

  currentY += cardHeight + 4;

  // 3. Cashier Leaderboard Table
  const headers = [
    ['#', 'Cashier Name', 'Designation / Role', 'Shifts', 'Exact', 'Short', 'Excess', 'Total Shortage', 'Total Excess', 'Net Variance', 'Accuracy']
  ];

  const rows = leaderboard.map((s, idx) => [
    String(idx + 1),
    s.user_name || 'Staff',
    s.role || 'Cashier',
    String(s.total_shifts || 0),
    String(s.exact_closings || 0),
    String(s.shortage_shifts || 0),
    String(s.excess_shifts || 0),
    formatPdfCurrency(s.total_shortage || 0),
    formatPdfCurrency(s.total_excess || 0),
    formatPdfCurrency(s.net_variance || 0, true),
    `${s.accuracy_rate || 0}%`
  ]);

  autoTable(doc, {
    startY: currentY,
    head: headers,
    body: rows,
    theme: 'grid',
    margin: { left: marginLeft, right: marginRight },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.2,
      halign: 'left',
      cellPadding: 1.8
    },
    bodyStyles: {
      fontSize: 7,
      cellPadding: 1.6,
      textColor: [51, 65, 85]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 42, fontStyle: 'bold' },
      2: { cellWidth: 32 },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 18, halign: 'center', textColor: [21, 128, 61], fontStyle: 'bold' },
      5: { cellWidth: 18, halign: 'center', textColor: [185, 28, 28], fontStyle: 'bold' },
      6: { cellWidth: 18, halign: 'center', textColor: [21, 128, 61], fontStyle: 'bold' },
      7: { cellWidth: 30, halign: 'right', textColor: [185, 28, 28] },
      8: { cellWidth: 30, halign: 'right', textColor: [21, 128, 61] },
      9: { cellWidth: 31, halign: 'right', fontStyle: 'bold' },
      10: { cellWidth: 22, halign: 'center', fontStyle: 'bold', textColor: [37, 99, 235] }
    }
  });

  currentY = (doc.lastAutoTable?.finalY || currentY) + 4;

  // 4. Till Cash Disbursements & Petty Cash Expense Ledger Table
  const itemizedExpenses = data.itemized_expenses || [];
  const expHeaders = [
    ['#', 'Voucher #', 'Date & Time', 'Shift #', 'Cashier / Staff', 'Category', 'Description / Purpose', 'Approval Status', 'Amount (Rs.)']
  ];

  const expRows = itemizedExpenses.length > 0
    ? itemizedExpenses.map((e, idx) => [
        String(idx + 1),
        e.voucher_no || `EXP-${e.id || idx + 1}`,
        e.datetime || `${e.date || ''} ${e.time || ''}`.trim() || '—',
        String(e.shift_number || '—'),
        e.cashier_name || 'Staff',
        (e.category_display || e.category || 'EXPENSE').toUpperCase(),
        e.description || '—',
        e.is_approved ? `APPROVED (${e.approved_by || 'Mgr'})` : 'PENDING',
        `-${formatPdfCurrency(e.amount || 0)}`
      ])
    : [
        ['—', '—', '—', '—', '—', 'CLEAR', 'No petty cash disbursements recorded in this period', 'VERIFIED', 'Rs. 0.00']
      ];

  autoTable(doc, {
    startY: currentY,
    head: expHeaders,
    body: expRows,
    foot: itemizedExpenses.length > 0 ? [
      [
        'Total Petty Cash Disbursed from Reception Drawers',
        '', '', '', '', '', '', '',
        `-${formatPdfCurrency(totalPettyCash)}`
      ]
    ] : undefined,
    theme: 'grid',
    margin: { left: marginLeft, right: marginRight },
    headStyles: {
      fillColor: [180, 83, 9], // Dark amber
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.2,
      halign: 'left',
      cellPadding: 1.8
    },
    footStyles: {
      fillColor: [254, 243, 199],
      textColor: [180, 83, 9],
      fontStyle: 'bold',
      fontSize: 7.2,
      cellPadding: 1.8
    },
    bodyStyles: {
      fontSize: 7,
      cellPadding: 1.5,
      textColor: [51, 65, 85]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 24, fontStyle: 'bold' },
      2: { cellWidth: 32 },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 35 },
      5: { cellWidth: 32, fontStyle: 'bold' },
      6: { cellWidth: 58 },
      7: { cellWidth: 28, halign: 'center', fontSize: 6.5 },
      8: { cellWidth: 28, halign: 'right', fontStyle: 'bold', textColor: [185, 28, 28] }
    }
  });

  // 5. Signatures
  const lastY = doc.lastAutoTable?.finalY || currentY;
  let sigY = lastY + 14;
  if (sigY > pageHeight - 22) {
    doc.addPage();
    sigY = 30;
  }

  const sigWidth = 65;
  const sigGap = (contentWidth - (3 * sigWidth)) / 2;
  const sigs = [
    'Chief Cashier / Duty Staff',
    'Internal Accounts Auditor',
    'General Manager / Management Approval'
  ];

  sigs.forEach((title, i) => {
    const sx = marginLeft + i * (sigWidth + sigGap);
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.3);
    doc.line(sx, sigY, sx + sigWidth, sigY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(51, 65, 85);
    doc.text(title, sx + sigWidth / 2, sigY + 3.8, { align: 'center' });
  });

  // 5. Page Footers
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(marginLeft, pageHeight - 7, pageWidth - marginRight, pageHeight - 7);
    doc.text('LodgeMaster PMS • Cashier Reconciliation Analytics • Confidential', marginLeft, pageHeight - 3.8);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - marginRight, pageHeight - 3.8, { align: 'right' });
  }

  const safeStart = String(startDate).replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeEnd = String(endDate).replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `Cashier_Reconciliation_${safeStart}_to_${safeEnd}.pdf`;

  if (options.action === 'print') {
    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(blobUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    } else {
      doc.save(fileName);
    }
    return doc;
  }

  doc.save(fileName);
  return doc;
};
