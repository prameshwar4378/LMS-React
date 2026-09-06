/**
 * Thermal POS Receipt Printer Utility for 80mm & 58mm Roll Printers.
 * Formats ESC/POS-ready HTML print streams with exact millimeter dimensions.
 */

import { formatCurrency } from './formatCurrency';

/**
 * Generates the HTML string for a Shift Closing Thermal Slip.
 */
export const generateShiftThermalHtml = (shift, settings = {}, width = '80mm') => {
  const lodgeName = settings.lodge_name || 'LODGE MANAGEMENT SYSTEM';
  const address = settings.address || '';
  const phone = settings.phone || '';
  const gstin = settings.gst_number || '';
  const is58mm = width === '58mm';

  const fin = shift.financials || {};
  const diff = parseFloat(shift.cash_difference || 0);
  const isShortage = diff < -0.01;
  const isExcess = diff > 0.01;
  const isReconciled = shift.actual_cash !== null && !isShortage && !isExcess;

  const openDate = shift.opened_at ? new Date(shift.opened_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
  const closeDate = shift.closed_at ? new Date(shift.closed_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'STILL OPEN';

  const durationMin = shift.duration_minutes || 0;
  const durationText = `${Math.floor(durationMin / 60)}h ${durationMin % 60}m`;

  const denominations = shift.denominations || [];
  const expenses = shift.expenses || [];
  const adjustments = shift.adjustments || [];

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Shift_Slip_${shift.shift_number}</title>
        <style>
          @page {
            size: ${width} auto;
            margin: 0mm;
          }
          @media print {
            body {
              margin: 0;
              padding: ${is58mm ? '2mm 1mm' : '4mm 2mm'};
            }
            .no-print { display: none !important; }
          }
          body {
            font-family: 'Courier New', Courier, monospace, system-ui, sans-serif;
            font-size: ${is58mm ? '10px' : '12px'};
            line-height: 1.25;
            color: #000;
            background: #fff;
            margin: 0 auto;
            padding: ${is58mm ? '3mm 2mm' : '5mm 3mm'};
            max-width: ${width};
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-left { text-align: left; }
          .bold { font-weight: bold; }
          .uppercase { text-transform: uppercase; }
          
          .divider {
            border-top: 1px dashed #000;
            margin: 4px 0;
          }
          .divider-double {
            border-top: 2px double #000;
            margin: 5px 0;
          }
          
          .row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin: 3px 0;
          }
          .table th {
            border-bottom: 1px dashed #000;
            padding: 2px 0;
            font-size: ${is58mm ? '9px' : '11px'};
          }
          .table td {
            padding: 2px 0;
            font-size: ${is58mm ? '9px' : '11px'};
          }
          
          .badge {
            display: inline-block;
            padding: 2px 5px;
            font-weight: bold;
            border: 1px solid #000;
            font-size: ${is58mm ? '9px' : '11px'};
            margin: 2px 0;
          }
          .sig-box {
            margin-top: 12px;
            padding-top: 4px;
          }
          .sig-line {
            border-top: 1px dashed #000;
            margin-top: 22px;
            font-size: ${is58mm ? '8px' : '10px'};
            text-align: center;
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="text-center">
          <div class="bold" style="font-size: ${is58mm ? '13px' : '15px'};">${lodgeName}</div>
          ${address ? `<div style="font-size: ${is58mm ? '8px' : '10px'};">${address}</div>` : ''}
          ${phone ? `<div style="font-size: ${is58mm ? '8px' : '10px'};">Tel: ${phone}</div>` : ''}
          ${gstin ? `<div style="font-size: ${is58mm ? '8px' : '10px'};">GSTIN: ${gstin}</div>` : ''}
          <div class="divider"></div>
          <div class="bold uppercase" style="font-size: ${is58mm ? '11px' : '13px'};">RECEPTION TILL CLOSING SLIP</div>
        </div>

        <div class="divider"></div>

        <!-- Shift Metadata -->
        <div class="row">
          <span>Shift #:</span>
          <span class="bold">${shift.shift_number}</span>
        </div>
        <div class="row">
          <span>Cashier:</span>
          <span class="bold">${shift.user_name}</span>
        </div>
        <div class="row">
          <span>Opened:</span>
          <span>${openDate}</span>
        </div>
        <div class="row">
          <span>Closed:</span>
          <span>${closeDate}</span>
        </div>
        <div class="row">
          <span>Duration:</span>
          <span>${durationText}</span>
        </div>

        <div class="divider-double"></div>

        <!-- Physical Cash Ledger -->
        <div class="bold uppercase text-center" style="font-size: ${is58mm ? '9px' : '11px'};">PHYSICAL CASH MOVEMENTS</div>
        <div class="divider"></div>

        <div class="row">
          <span>(+) Opening Float:</span>
          <span class="bold">${formatCurrency(shift.opening_balance)}</span>
        </div>
        <div class="row">
          <span>(+) Cash Collections:</span>
          <span class="bold">+${formatCurrency(fin.cash_collections || 0)}</span>
        </div>
        ${(fin.cash_added || 0) > 0 ? `
          <div class="row">
            <span>(+) Cash Float Added:</span>
            <span class="bold">+${formatCurrency(fin.cash_added)}</span>
          </div>
        ` : ''}
        ${(fin.cash_expenses || 0) > 0 ? `
          <div class="row">
            <span>(-) Petty Expenses:</span>
            <span class="bold">-${formatCurrency(fin.cash_expenses)}</span>
          </div>
        ` : ''}
        ${(fin.cash_removed || 0) > 0 ? `
          <div class="row">
            <span>(-) Cash Drops/Removed:</span>
            <span class="bold">-${formatCurrency(fin.cash_removed)}</span>
          </div>
        ` : ''}
        ${(fin.cash_handed_over || 0) > 0 ? `
          <div class="row">
            <span>(-) Cash Handed Over:</span>
            <span class="bold">-${formatCurrency(fin.cash_handed_over)}</span>
          </div>
        ` : ''}

        <div class="divider"></div>
        <div class="row" style="font-size: ${is58mm ? '11px' : '13px'}; font-weight: bold;">
          <span>EXPECTED CASH:</span>
          <span>${formatCurrency(shift.expected_cash || 0)}</span>
        </div>
        <div class="row" style="font-size: ${is58mm ? '11px' : '13px'}; font-weight: bold;">
          <span>ACTUAL COUNTED:</span>
          <span>${shift.actual_cash !== null ? formatCurrency(shift.actual_cash) : 'NOT COUNTED'}</span>
        </div>
        <div class="divider"></div>

        <!-- Reconciliation Status Badge -->
        <div class="text-center" style="margin: 4px 0;">
          ${isReconciled ? `
            <div class="badge">*** BALANCED (₹0.00 DIFF) ***</div>
          ` : isShortage ? `
            <div class="badge">*** SHORTAGE: -${formatCurrency(Math.abs(diff))} ***</div>
          ` : isExcess ? `
            <div class="badge">*** EXCESS: +${formatCurrency(diff)} ***</div>
          ` : `
            <div class="badge">*** ACTIVE SESSION ***</div>
          `}
        </div>

        ${shift.difference_reason ? `
          <div style="font-size: ${is58mm ? '8px' : '10px'}; margin: 3px 0;">
            <span class="bold">Reason:</span> ${shift.difference_reason}
          </div>
        ` : ''}

        <!-- Denominations Table -->
        ${denominations.length > 0 ? `
          <div class="divider"></div>
          <div class="bold uppercase text-center" style="font-size: ${is58mm ? '9px' : '11px'};">DENOMINATION COUNT</div>
          <table class="table">
            <thead>
              <tr>
                <th class="text-left">Note</th>
                <th class="text-center">Qty</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${denominations.map(d => `
                <tr>
                  <td class="text-left">₹${d.denomination}</td>
                  <td class="text-center">x ${d.quantity}</td>
                  <td class="text-right">${formatCurrency(d.total)}</td>
                </tr>
              `).join('')}
              <tr style="border-top: 1px dashed #000; font-weight: bold;">
                <td class="text-left" colspan="2">TOTAL COUNTED:</td>
                <td class="text-right">${formatCurrency(shift.actual_cash || 0)}</td>
              </tr>
            </tbody>
          </table>
        ` : ''}

        <!-- Digital & Total Revenue Summary -->
        <div class="divider-double"></div>
        <div class="bold uppercase text-center" style="font-size: ${is58mm ? '9px' : '11px'};">DIGITAL & TOTAL REVENUE</div>
        <div class="divider"></div>
        <div class="row">
          <span>UPI / QR Code:</span>
          <span>${formatCurrency(fin.upi_collections || 0)}</span>
        </div>
        <div class="row">
          <span>Credit / Debit Card:</span>
          <span>${formatCurrency(fin.card_collections || 0)}</span>
        </div>
        <div class="row">
          <span>Bank Transfer / Other:</span>
          <span>${formatCurrency((fin.bank_collections || 0) + (fin.other_collections || 0))}</span>
        </div>
        <div class="divider"></div>
        <div class="row bold" style="font-size: ${is58mm ? '10px' : '12px'};">
          <span>TOTAL SHIFT REVENUE:</span>
          <span>${formatCurrency(fin.total_collections || 0)}</span>
        </div>

        <!-- Operational Room Productivity -->
        ${shift.operational_metrics ? `
          <div class="divider-double"></div>
          <div class="bold uppercase text-center" style="font-size: ${is58mm ? '9px' : '11px'};">ROOM ACTIVITY & PRODUCTIVITY</div>
          <div class="divider"></div>
          <div class="row">
            <span>Check-ins Processed:</span>
            <span class="bold">${shift.operational_metrics.total_checkins}</span>
          </div>
          <div class="row">
            <span>Check-outs Cleared:</span>
            <span class="bold">${shift.operational_metrics.total_checkouts}</span>
          </div>
          <div class="row">
            <span>New Bookings Created:</span>
            <span class="bold">${shift.operational_metrics.total_bookings}</span>
          </div>
          <div class="row">
            <span>Shift ADR (Avg Rate):</span>
            <span class="bold">${formatCurrency(shift.operational_metrics.adr || 0)}</span>
          </div>
        ` : ''}
        <div style="font-size: ${is58mm ? '7px' : '9px'}; text-align: center; margin-top: 2px;">
          (Digital revenue is received in bank, not in till)
        </div>

        <!-- Itemized Petty Cash Expenses (if any) -->
        ${expenses.length > 0 ? `
          <div class="divider"></div>
          <div class="bold uppercase text-center" style="font-size: ${is58mm ? '9px' : '11px'};">PETTY CASH EXPENSES</div>
          <table class="table">
            <tbody>
              ${expenses.map(e => `
                <tr>
                  <td class="text-left">${e.description}</td>
                  <td class="text-right bold">-${formatCurrency(e.amount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        <!-- Signatures & Audit Timestamp -->
        <div class="divider-double"></div>
        <div class="sig-box">
          <div class="row" style="margin-bottom: 0;">
            <div style="width: 48%;">
              <div class="sig-line">Cashier Signature</div>
            </div>
            <div style="width: 48%;">
              <div class="sig-line">Manager Signature</div>
            </div>
          </div>
        </div>

        <div class="text-center" style="font-size: ${is58mm ? '7px' : '9px'}; margin-top: 10px;">
          Printed: ${new Date().toLocaleString('en-IN')}<br>
          LMS Till Verification System
        </div>
      </body>
    </html>
  `;
};

/**
 * Generates the HTML string for a Petty Cash Voucher Thermal Slip.
 */
export const generateExpenseThermalHtml = (expense, shift = {}, settings = {}, width = '80mm') => {
  const lodgeName = settings.lodge_name || 'LODGE MANAGEMENT SYSTEM';
  const address = settings.address || '';
  const phone = settings.phone || '';
  const is58mm = width === '58mm';

  const expDate = expense.created_at ? new Date(expense.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleString('en-IN');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Voucher_EXP_${expense.id}</title>
        <style>
          @page {
            size: ${width} auto;
            margin: 0mm;
          }
          @media print {
            body {
              margin: 0;
              padding: ${is58mm ? '2mm 1mm' : '4mm 2mm'};
            }
          }
          body {
            font-family: 'Courier New', Courier, monospace, system-ui, sans-serif;
            font-size: ${is58mm ? '10px' : '12px'};
            line-height: 1.25;
            color: #000;
            background: #fff;
            margin: 0 auto;
            padding: ${is58mm ? '3mm 2mm' : '5mm 3mm'};
            max-width: ${width};
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-left { text-align: left; }
          .bold { font-weight: bold; }
          .uppercase { text-transform: uppercase; }
          .divider { border-top: 1px dashed #000; margin: 4px 0; }
          .divider-double { border-top: 2px double #000; margin: 5px 0; }
          .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
          .sig-line { border-top: 1px dashed #000; margin-top: 22px; font-size: ${is58mm ? '8px' : '10px'}; text-align: center; }
        </style>
      </head>
      <body>
        <div class="text-center">
          <div class="bold" style="font-size: ${is58mm ? '13px' : '15px'};">${lodgeName}</div>
          ${address ? `<div style="font-size: ${is58mm ? '8px' : '10px'};">${address}</div>` : ''}
          ${phone ? `<div style="font-size: ${is58mm ? '8px' : '10px'};">Tel: ${phone}</div>` : ''}
          <div class="divider"></div>
          <div class="bold uppercase" style="font-size: ${is58mm ? '11px' : '13px'};">PETTY CASH PAYMENT VOUCHER</div>
        </div>

        <div class="divider"></div>
        <div class="row">
          <span>Voucher #:</span>
          <span class="bold">EXP-${expense.id}</span>
        </div>
        <div class="row">
          <span>Date &amp; Time:</span>
          <span>${expDate}</span>
        </div>
        <div class="row">
          <span>Shift #:</span>
          <span>${shift.shift_number || 'N/A'}</span>
        </div>
        <div class="row">
          <span>Paid By Staff:</span>
          <span>${expense.created_by_name || shift.user_name || 'Cashier'}</span>
        </div>
        <div class="row">
          <span>Category:</span>
          <span class="bold">${expense.category_display || expense.category || 'Expense'}</span>
        </div>

        <div class="divider-double"></div>
        <div class="row" style="font-size: ${is58mm ? '12px' : '14px'}; font-weight: bold;">
          <span>AMOUNT PAID:</span>
          <span>${formatCurrency(expense.amount)}</span>
        </div>
        <div class="divider-double"></div>

        <div style="margin: 6px 0;">
          <div class="bold">Purpose / Particulars:</div>
          <div style="margin-top: 2px; padding: 2px 0;">${expense.description}</div>
        </div>

        <div class="divider"></div>
        <div style="margin-top: 14px;">
          <div class="row">
            <div style="width: 48%;">
              <div class="sig-line">Receiver's Signature</div>
            </div>
            <div style="width: 48%;">
              <div class="sig-line">Cashier / Approver</div>
            </div>
          </div>
        </div>

        <div class="text-center" style="font-size: ${is58mm ? '7px' : '9px'}; margin-top: 10px;">
          Printed: ${new Date().toLocaleString('en-IN')}
        </div>
      </body>
    </html>
  `;
};

/**
 * Generates the HTML string for a Guest Payment Thermal Receipt (80mm/58mm).
 */
export const generatePaymentThermalReceipt = (payment, stay = {}, settings = {}, width = '80mm') => {
  const lodgeName = settings.lodge_name || 'LODGE MANAGEMENT SYSTEM';
  const address = settings.address || '';
  const phone = settings.phone || '';
  const gstin = settings.gst_number || '';
  const is58mm = width === '58mm';

  const payDate = payment.payment_date ? new Date(payment.payment_date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleString('en-IN');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Receipt_${payment.payment_number || payment.id}</title>
        <style>
          @page { size: ${width} auto; margin: 0mm; }
          @media print {
            body { margin: 0; padding: ${is58mm ? '2mm 1mm' : '4mm 2mm'}; }
            .no-print { display: none !important; }
          }
          body {
            font-family: 'Courier New', Courier, monospace, system-ui, sans-serif;
            font-size: ${is58mm ? '10px' : '12px'};
            line-height: 1.25;
            color: #000;
            background: #fff;
            margin: 0 auto;
            padding: ${is58mm ? '3mm 2mm' : '5mm 3mm'};
            max-width: ${width};
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-left { text-align: left; }
          .bold { font-weight: bold; }
          .uppercase { text-transform: uppercase; }
          .divider { border-top: 1px dashed #000; margin: 4px 0; }
          .divider-double { border-top: 2px double #000; margin: 5px 0; }
          .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
          .sig-line { border-top: 1px dashed #000; margin-top: 22px; font-size: ${is58mm ? '8px' : '10px'}; text-align: center; }
        </style>
      </head>
      <body>
        <div class="text-center">
          <div class="bold" style="font-size: ${is58mm ? '13px' : '15px'};">${lodgeName}</div>
          ${address ? `<div style="font-size: ${is58mm ? '8px' : '10px'};">${address}</div>` : ''}
          ${phone ? `<div style="font-size: ${is58mm ? '8px' : '10px'};">Tel: ${phone}</div>` : ''}
          ${gstin ? `<div style="font-size: ${is58mm ? '8px' : '10px'};">GSTIN: ${gstin}</div>` : ''}
          <div class="divider"></div>
          <div class="bold uppercase" style="font-size: ${is58mm ? '11px' : '13px'};">PAYMENT RECEIPT</div>
        </div>

        <div class="divider"></div>
        <div class="row">
          <span>Receipt #:</span>
          <span class="bold">${payment.payment_number || `PAY-${payment.id}`}</span>
        </div>
        <div class="row">
          <span>Date:</span>
          <span>${payDate}</span>
        </div>
        ${stay.stay_number ? `
          <div class="row">
            <span>Stay Folio #:</span>
            <span class="bold">${stay.stay_number}</span>
          </div>
        ` : ''}
        ${stay.room_number ? `
          <div class="row">
            <span>Room Number:</span>
            <span class="bold">${stay.room_number}</span>
          </div>
        ` : ''}
        ${stay.primary_customer_name || payment.customer_name ? `
          <div class="row">
            <span>Guest Name:</span>
            <span class="bold">${stay.primary_customer_name || payment.customer_name}</span>
          </div>
        ` : ''}
        <div class="row">
          <span>Payment Method:</span>
          <span class="bold">${payment.payment_method_display || payment.payment_method || 'CASH'}</span>
        </div>
        ${payment.transaction_reference ? `
          <div class="row">
            <span>Txn Ref:</span>
            <span>${payment.transaction_reference}</span>
          </div>
        ` : ''}

        <div class="divider-double"></div>
        <div class="row bold" style="font-size: ${is58mm ? '13px' : '15px'};">
          <span>AMOUNT RECEIVED:</span>
          <span>${formatCurrency(payment.amount)}</span>
        </div>
        <div class="divider-double"></div>

        ${payment.notes ? `
          <div style="font-size: ${is58mm ? '8px' : '10px'}; margin: 4px 0;">
            <span class="bold">Notes:</span> ${payment.notes}
          </div>
          <div class="divider"></div>
        ` : ''}

        <div style="margin-top: 14px;">
          <div class="row">
            <div style="width: 48%;">
              <div class="sig-line">Guest Signature</div>
            </div>
            <div style="width: 48%;">
              <div class="sig-line">Authorized Signatory</div>
            </div>
          </div>
        </div>

        <div class="text-center" style="font-size: ${is58mm ? '7px' : '9px'}; margin-top: 12px;">
          Thank You for Staying with Us!<br>
          Printed: ${new Date().toLocaleString('en-IN')}
        </div>
      </body>
    </html>
  `;
};

/**
 * Generates the HTML string for a Guest Key / Check-in Welcome Slip (80mm/58mm).
 */
export const generateGuestKeySlipHtml = (stay, settings = {}, width = '80mm') => {
  const lodgeName = settings.lodge_name || 'LODGE MANAGEMENT SYSTEM';
  const address = settings.address || '';
  const phone = settings.phone || '';
  const is58mm = width === '58mm';

  const checkIn = stay.check_in_date ? `${stay.check_in_date} ${stay.check_in_time || '12:00'}` : '—';
  const checkOut = stay.expected_checkout_date ? `${stay.expected_checkout_date} ${stay.expected_checkout_time || settings.default_checkout_time?.substring(0, 5) || '11:00'}` : '—';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Key_Slip_${stay.stay_number || stay.id}</title>
        <style>
          @page { size: ${width} auto; margin: 0mm; }
          @media print {
            body { margin: 0; padding: ${is58mm ? '2mm 1mm' : '4mm 2mm'}; }
            .no-print { display: none !important; }
          }
          body {
            font-family: 'Courier New', Courier, monospace, system-ui, sans-serif;
            font-size: ${is58mm ? '10px' : '12px'};
            line-height: 1.25;
            color: #000;
            background: #fff;
            margin: 0 auto;
            padding: ${is58mm ? '3mm 2mm' : '5mm 3mm'};
            max-width: ${width};
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-left { text-align: left; }
          .bold { font-weight: bold; }
          .uppercase { text-transform: uppercase; }
          .divider { border-top: 1px dashed #000; margin: 4px 0; }
          .divider-double { border-top: 2px double #000; margin: 5px 0; }
          .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
        </style>
      </head>
      <body>
        <div class="text-center">
          <div class="bold" style="font-size: ${is58mm ? '13px' : '15px'};">${lodgeName}</div>
          ${address ? `<div style="font-size: ${is58mm ? '8px' : '10px'};">${address}</div>` : ''}
          ${phone ? `<div style="font-size: ${is58mm ? '8px' : '10px'};">Front Desk: ${phone}</div>` : ''}
          <div class="divider"></div>
          <div class="bold uppercase" style="font-size: ${is58mm ? '11px' : '13px'};">GUEST WELCOME KEY SLIP</div>
        </div>

        <div class="divider"></div>

        <div class="text-center" style="margin: 6px 0; padding: 4px 0; border: 1px solid #000;">
          <div style="font-size: ${is58mm ? '9px' : '11px'};">ALLOCATED ROOM</div>
          <div class="bold" style="font-size: ${is58mm ? '20px' : '24px'};">${stay.room_number || stay.room?.room_number || '—'}</div>
          <div style="font-size: ${is58mm ? '8px' : '10px'};">${stay.room_type_name || stay.room?.room_type?.name || ''}</div>
        </div>

        <div class="row">
          <span>Guest Name:</span>
          <span class="bold">${stay.primary_customer_name || stay.primary_customer?.full_name || 'Guest'}</span>
        </div>
        <div class="row">
          <span>Stay Folio:</span>
          <span class="bold">${stay.stay_number}</span>
        </div>
        <div class="row">
          <span>Check-In:</span>
          <span>${checkIn}</span>
        </div>
        <div class="row">
          <span>Check-Out:</span>
          <span class="bold">${checkOut}</span>
        </div>

        <div class="divider-double"></div>
        <div style="font-size: ${is58mm ? '8px' : '10px'}; text-align: center;">
          Wi-Fi Network: Guest-WiFi<br>
          Dial 9 from room phone for Reception
        </div>
        <div class="divider"></div>

        <div class="text-center" style="font-size: ${is58mm ? '7px' : '9px'}; margin-top: 8px;">
          Please return room key upon check-out.<br>
          We wish you a pleasant stay!
        </div>
      </body>
    </html>
  `;
};

/**
 * Triggers direct thermal printing via a dedicated popup iframe/window.
 */
export const printThermalContent = (htmlContent, title = 'Thermal_Slip') => {
  const printWindow = window.open('', '_blank', 'width=420,height=600,menubar=no,toolbar=no,location=no,status=no');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 350);
  } else {
    // Fallback if popup blocker is active
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();
    iframe.contentWindow.focus();
    setTimeout(() => {
      iframe.contentWindow.print();
      document.body.removeChild(iframe);
    }, 400);
  }
};
