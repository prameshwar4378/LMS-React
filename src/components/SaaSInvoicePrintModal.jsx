import React, { useState, useRef } from 'react';
import { Printer, X, Copy, Check, ExternalLink, Download, FileText, CheckCircle2 } from 'lucide-react';

/**
 * Utility to convert Indian Rupees into words (e.g., 9999 -> "Nine Thousand Nine Hundred Ninety-Nine Rupees Only")
 */
function numberToWordsINR(num) {
  if (num === null || num === undefined || isNaN(num)) return '';
  const n = Math.floor(Math.abs(Number(num)));
  if (n === 0) return 'Zero Rupees Only';

  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(val) {
    if (val < 20) return a[val];
    const digit = val % 10;
    return b[Math.floor(val / 10)] + (digit ? ' ' + a[digit] : '');
  }

  let words = '';
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const hundred = Math.floor((n % 1000) / 100);
  const rest = n % 100;

  if (crore) words += inWords(crore) + ' Crore ';
  if (lakh) words += inWords(lakh) + ' Lakh ';
  if (thousand) words += inWords(thousand) + ' Thousand ';
  if (hundred) words += inWords(hundred) + ' Hundred ';
  if (rest) words += (words ? 'and ' : '') + inWords(rest) + ' ';

  return words.trim() + ' Rupees Only';
}

const SaaSInvoicePrintModal = ({ show, onClose, billData, hotelData }) => {
  const defaultLogoUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${import.meta.env.BASE_URL || '/'}logo.png`
    : '/logo.png';

  const [logoUrl, setLogoUrl] = useState(defaultLogoUrl);
  const [copied, setCopied] = useState(false);
  const [showLogoConfig, setShowLogoConfig] = useState(false);
  const invoiceRef = useRef(null);

  if (!show || !billData) return null;

  // Resolve hotel and bill fields
  const currentYear = new Date().getFullYear();
  const defaultExpiryDate = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const invoiceNo = billData.invoice_no || `INV-LIC-${hotelData?.code || 'PROP'}-${currentYear}-01`;
  const billingDate = billData.billing_date || new Date().toISOString().split('T')[0];
  const validUntil = billData.valid_until || hotelData?.subscription?.valid_until || defaultExpiryDate();
  const description = billData.description || `SaaS Subscription - ${billData.plan_name || 'Starter'} (${billData.billing_cycle || 'ANNUAL'})`;
  const amount = Number(billData.amount || 9999);
  const status = (billData.status || 'PAID').toUpperCase();

  const clientName = hotelData?.name || billData.hotel_name || 'Client Property';
  const clientCode = hotelData?.code || billData.hotel_code || 'PROP-ALPHA-01';
  const ownerName = hotelData?.owner_name || billData.owner_name || 'Hotel Owner';
  const ownerPhone = hotelData?.owner_phone || billData.owner_phone || 'N/A';
  const ownerEmail = hotelData?.owner_email || billData.owner_email || 'N/A';
  const clientAddress = hotelData?.address || billData.address || 'Address Unset';
  const clientCity = hotelData?.city || billData.city || '';
  const clientState = hotelData?.state || billData.state || 'India';
  const clientPincode = hotelData?.pincode || billData.pincode || '';
  const clientGstin = hotelData?.gstin || billData.gstin || 'Unregistered / Retail B2B';
  const totalRooms = hotelData?.total_rooms || billData.rooms_allowed || 15;
  const planName = billData.plan_name || hotelData?.subscription?.plan_name || 'Starter Plan';
  const billingCycle = billData.billing_cycle || hotelData?.subscription?.billing_cycle || 'ANNUAL';

  const subtotal = amount;
  const grandTotal = amount;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(logoUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printContent = invoiceRef.current;
    if (!printContent) {
      window.print();
      return;
    }

    const printWindow = window.open('', '_blank', 'width=950,height=900');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <title>Tax Invoice - ${invoiceNo} - Untoxy Technologies</title>
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
            <style>
              @page {
                size: A4 portrait;
                margin: 12mm 14mm 14mm 14mm;
              }
              * {
                box-sizing: border-box;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                background-color: #ffffff;
                color: #1e293b;
                margin: 0;
                padding: 0;
                font-size: 12px;
                line-height: 1.45;
              }
              .a4-page {
                width: 100%;
                max-width: 210mm;
                margin: 0 auto;
                background: #ffffff;
              }
              .company-title {
                font-size: 22px;
                font-weight: 800;
                color: #0f172a;
                letter-spacing: -0.5px;
                line-height: 1.1;
              }
              .invoice-badge-title {
                font-size: 11px;
                letter-spacing: 1.5px;
                text-transform: uppercase;
                font-weight: 700;
                color: #475569;
              }
              .invoice-number-display {
                font-size: 16px;
                font-weight: 800;
                color: #1e40af;
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
              }
              .box-card {
                border: 1px solid #cbd5e1;
                border-radius: 6px;
                padding: 10px 12px;
                background-color: #f8fafc;
              }
              .table-custom th {
                background-color: #0f172a !important;
                color: #ffffff !important;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                padding: 7px 10px;
                font-weight: 600;
              }
              .table-custom td {
                padding: 8px 10px;
                font-size: 11.5px;
                vertical-align: middle;
                border-color: #e2e8f0;
              }
              .paid-stamp {
                display: inline-block;
                border: 2px solid #16a34a;
                color: #16a34a;
                font-weight: 800;
                font-size: 13px;
                letter-spacing: 2px;
                text-transform: uppercase;
                padding: 3px 12px;
                border-radius: 4px;
                transform: rotate(-4deg);
              }
              .footer-terms {
                font-size: 10px;
                color: #64748b;
                line-height: 1.4;
              }
              .signatory-box {
                border-top: 1px solid #0f172a;
                width: 190px;
                text-align: center;
                margin-top: 40px;
                padding-top: 4px;
                font-size: 11px;
                font-weight: 700;
                color: #0f172a;
              }
              @media print {
                body {
                  padding: 0 !important;
                  background: #ffffff !important;
                }
                .no-print {
                  display: none !important;
                }
              }
            </style>
          </head>
          <body>
            <div class="a4-page">
              ${printContent.innerHTML}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    } else {
      window.print();
    }
  };

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: 'rgba(15,23,42,0.75)', zIndex: 1060 }}
      tabIndex="-1"
    >
      <div className="modal-dialog modal-dialog-centered modal-xl" style={{ maxWidth: '980px' }}>
        <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden">
          {/* Top Modal Action Toolbar */}
          <div className="modal-header bg-dark text-white px-4 py-3 border-0 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <div className="p-2 bg-primary bg-opacity-25 rounded-3 text-primary-light">
                <FileText size={20} className="text-info" />
              </div>
              <div>
                <h5 className="modal-title fw-bold m-0 fs-6 text-white">
                  Official SaaS Subscription Bill (A4 Print Format)
                </h5>
                <p className="text-secondary extra-small m-0">
                  Untoxy technologies official B2B software license invoice
                </p>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-light d-flex align-items-center gap-1.5 extra-small px-3 py-1.5"
                onClick={() => setShowLogoConfig(!showLogoConfig)}
              >
                <ExternalLink size={13} />
                <span>Logo Settings</span>
              </button>

              <button
                type="button"
                className="btn btn-sm btn-primary d-flex align-items-center gap-1.5 extra-small fw-bold px-3 py-1.5 shadow-sm"
                onClick={handlePrint}
              >
                <Printer size={15} />
                <span>Print Bill (A4)</span>
              </button>

              <button
                type="button"
                className="btn-close btn-close-white ms-2"
                onClick={onClose}
              ></button>
            </div>
          </div>

          {/* Collapsible Logo URL & Link Controls */}
          {showLogoConfig && (
            <div className="bg-light border-bottom px-4 py-2.5 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
              <div className="d-flex align-items-center gap-2 flex-grow-1">
                <span className="extra-small fw-bold text-dark text-nowrap">Print Logo Link:</span>
                <input
                  type="text"
                  className="form-control form-control-sm font-monospace extra-small"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="Paste direct URL to company logo"
                />
              </div>
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary extra-small d-flex align-items-center gap-1 px-2.5 py-1"
                  onClick={handleCopyLink}
                >
                  {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                  <span>{copied ? 'Copied Link!' : 'Copy Logo Link'}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-link extra-small text-decoration-none text-muted p-0"
                  onClick={() => setLogoUrl(defaultLogoUrl)}
                >
                  Reset Default
                </button>
              </div>
            </div>
          )}

          {/* Modal Body: A4 Paper Preview */}
          <div
            className="modal-body p-3 p-md-4 bg-secondary-subtle"
            style={{ maxHeight: '82vh', overflowY: 'auto' }}
          >
            {/* A4 Sheet Container */}
            <div
              ref={invoiceRef}
              className="bg-white shadow-lg mx-auto rounded-1 p-4 p-md-5"
              style={{
                maxWidth: '820px',
                minHeight: '1050px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                color: '#1e293b',
              }}
            >
              {/* 1. Header Section: Logo + Untoxy Info + Document Title */}
              <div className="d-flex justify-content-between align-items-start border-bottom pb-4 mb-3 gap-3">
                {/* Left: Logo & Company Contact Details */}
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="d-flex align-items-center justify-content-center overflow-hidden rounded-3 border bg-white flex-shrink-0"
                    style={{ width: '76px', height: '76px' }}
                  >
                    <img
                      src={logoUrl}
                      alt="Untoxy technologies"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = defaultLogoUrl;
                      }}
                    />
                  </div>
                  <div>
                    <h2
                      className="m-0 fw-bold text-dark"
                      style={{ fontSize: '1.45rem', letterSpacing: '-0.5px' }}
                    >
                      Untoxy technologies
                    </h2>
                    <p className="m-0 text-secondary extra-small fw-semibold mt-0.5">
                      Enterprise Cloud Solutions &amp; PMS SaaS Platform
                    </p>
                    <div className="small text-dark mt-1" style={{ fontSize: '0.8rem' }}>
                      <span>Phone: <strong>7776824564</strong></span>
                      <span className="mx-2 text-muted">|</span>
                      <span>Email: <strong>ultoxy.tech@gmail.com</strong></span>
                    </div>
                  </div>
                </div>

                {/* Right: Tax Invoice Document Badge */}
                <div className="text-end">
                  <div className="border border-dark-subtle rounded-3 px-3 py-2 bg-light shadow-xs text-end">
                    <div
                      className="text-uppercase text-secondary fw-bold"
                      style={{ fontSize: '0.65rem', letterSpacing: '1.5px' }}
                    >
                      TAX INVOICE / OFFICIAL BILL
                    </div>
                    <div
                      className="fw-bold text-primary font-monospace mt-0.5"
                      style={{ fontSize: '0.95rem' }}
                    >
                      {invoiceNo}
                    </div>
                    <div className="extra-small text-muted mt-1">
                      Billing Date: <strong>{billingDate}</strong>
                    </div>
                    <div className="extra-small text-muted">
                      License Term: <strong>{validUntil}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Client ("Billed To") & License Terms Cards */}
              <div className="row g-3 mb-3">
                {/* Billed To Client Card */}
                <div className="col-7">
                  <div className="p-3 bg-light rounded-2 border h-100">
                    <div
                      className="fw-bold text-secondary border-bottom pb-1 mb-2 extra-small text-uppercase"
                      style={{ letterSpacing: '0.5px' }}
                    >
                      BILLED TO (LICENSEE / CLIENT)
                    </div>
                    <div className="fw-bold fs-6 text-dark">{clientName}</div>
                    <div className="extra-small font-monospace text-primary fw-semibold mb-1">
                      Property Code: {clientCode}
                    </div>
                    <div className="small text-secondary mb-0.5">
                      <strong>Contact:</strong> {ownerName}
                    </div>
                    <div className="small text-secondary mb-0.5">
                      <strong>Phone:</strong> {ownerPhone} &bull; <strong>Email:</strong> {ownerEmail}
                    </div>
                    <div className="small text-secondary mb-0.5">
                      <strong>Address:</strong> {clientAddress}
                      {clientCity && `, ${clientCity}`}
                      {clientState && `, ${clientState}`}
                      {clientPincode && ` - ${clientPincode}`}
                    </div>
                    <div className="extra-small text-dark fw-bold mt-1">
                      GSTIN: <span className="font-monospace">{clientGstin}</span>
                    </div>
                  </div>
                </div>

                {/* License & Subscription Details Card */}
                <div className="col-5">
                  <div className="p-3 bg-light rounded-2 border h-100 d-flex flex-column justify-content-between">
                    <div>
                      <div
                        className="fw-bold text-secondary border-bottom pb-1 mb-2 extra-small text-uppercase"
                        style={{ letterSpacing: '0.5px' }}
                      >
                        SUBSCRIPTION ENTITLEMENTS
                      </div>
                      <div className="d-flex justify-content-between extra-small mb-1">
                        <span className="text-muted">Software Plan:</span>
                        <strong className="text-dark">{planName}</strong>
                      </div>
                      <div className="d-flex justify-content-between extra-small mb-1">
                        <span className="text-muted">Licensed Capacity:</span>
                        <strong className="text-primary">{totalRooms} Rooms Quota</strong>
                      </div>
                      <div className="d-flex justify-content-between extra-small mb-1">
                        <span className="text-muted">Billing Frequency:</span>
                        <strong className="text-dark">{billingCycle}</strong>
                      </div>
                      <div className="d-flex justify-content-between extra-small mb-1">
                        <span className="text-muted">SAC Code:</span>
                        <span className="font-monospace fw-semibold text-secondary">998313 (IT SaaS)</span>
                      </div>
                    </div>

                    <div className="pt-2 border-top d-flex justify-content-between align-items-center">
                      <span className="extra-small text-muted fw-bold">Settlement:</span>
                      <span
                        className="border border-success text-success fw-bold extra-small text-uppercase px-2.5 py-0.5 rounded"
                        style={{ letterSpacing: '1px' }}
                      >
                        ● {status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Itemized Software Services Table */}
              <div className="table-responsive mb-3">
                <table className="table table-bordered align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                  <thead className="table-dark text-white text-uppercase" style={{ fontSize: '0.75rem' }}>
                    <tr>
                      <th style={{ width: '40px' }} className="text-center">#</th>
                      <th>Service / License Description</th>
                      <th className="text-center" style={{ width: '90px' }}>SAC</th>
                      <th className="text-center" style={{ width: '90px' }}>Cycle</th>
                      <th className="text-center" style={{ width: '60px' }}>Qty</th>
                      <th className="text-end" style={{ width: '130px' }}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="text-center fw-bold">1</td>
                      <td>
                        <strong className="text-dark">
                          LMS Cloud Hotel Management System - Software License
                        </strong>
                        <div className="text-muted extra-small mt-0.5">
                          {description}
                        </div>
                        <div className="text-secondary extra-small mt-0.5">
                          Entitlement: Multi-Tenant PMS Core, Branch Management, Shift &amp; Till Controls, Live Inventory.
                        </div>
                        <div className="font-monospace extra-small text-primary mt-0.5">
                          Validity Term: {billingDate} to {validUntil}
                        </div>
                      </td>
                      <td className="text-center font-monospace small">998313</td>
                      <td className="text-center small fw-semibold">{billingCycle}</td>
                      <td className="text-center small">1</td>
                      <td className="text-end fw-bold font-monospace fs-6 text-dark">
                        ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 4. Financial Calculation Summary */}
              <div className="row justify-content-between align-items-start mb-3">
                {/* Left: Amount in Words & Payment Acknowledgement */}
                <div className="col-7">
                  <div className="p-3 border rounded-2 bg-light mb-2">
                    <div className="extra-small text-muted fw-bold text-uppercase mb-1">
                      Amount in Words:
                    </div>
                    <div className="small fw-bold text-dark font-italic">
                      {numberToWordsINR(grandTotal)}
                    </div>
                  </div>

                  <div className="p-3 border rounded-2 bg-white small">
                    <div className="d-flex align-items-center gap-1.5 text-success fw-bold extra-small text-uppercase mb-1">
                      <CheckCircle2 size={15} /> Payment Acknowledgement
                    </div>
                    <div className="extra-small text-muted">
                      Payment received in full for the commercial software subscription period. No further balance due.
                    </div>
                  </div>
                </div>

                {/* Right: Subtotal, Taxes, and Grand Total */}
                <div className="col-5">
                  <div className="border rounded-2 p-3 bg-light">
                    <div className="d-flex justify-content-between py-1 border-bottom extra-small">
                      <span className="text-muted">Taxable Base Amount:</span>
                      <strong className="text-dark font-monospace">
                        ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>

                    <div className="d-flex justify-content-between py-1 border-bottom extra-small text-secondary">
                      <span>GST (SAC 998313 Software):</span>
                      <span className="fw-semibold">Included / Nil</span>
                    </div>

                    <div className="d-flex justify-content-between py-2 border-bottom fw-bold fs-6">
                      <span className="text-dark">Total Invoiced:</span>
                      <strong className="text-primary font-monospace">
                        ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>

                    <div className="d-flex justify-content-between py-1 pt-2 extra-small text-success fw-bold">
                      <span>Settled Status:</span>
                      <span>{status}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Terms & Conditions and Authorized Signatory */}
              <div className="border-top pt-3 mt-3">
                <div className="row align-items-end">
                  {/* Left: Terms and Conditions */}
                  <div className="col-8">
                    <div className="extra-small fw-bold text-secondary text-uppercase mb-1">
                      Terms &amp; Conditions:
                    </div>
                    <ul className="extra-small text-muted ps-3 mb-0" style={{ lineHeight: '1.45', fontSize: '0.72rem' }}>
                      <li>This invoice certifies the active SaaS software license for the specified property quota and period.</li>
                      <li>Cloud infrastructure, daily data backups, updates, and maintenance are included during valid subscription.</li>
                      <li>For technical inquiries or custom expansions, contact Untoxy technologies at <strong>7776824564</strong> or <strong>ultoxy.tech@gmail.com</strong>.</li>
                    </ul>
                  </div>

                  {/* Right: Authorized Signatory */}
                  <div className="col-4 text-center">
                    <div
                      className="border-top border-dark mx-auto pt-1 mt-4"
                      style={{ width: '180px', fontSize: '0.75rem', fontWeight: '700' }}
                    >
                      Untoxy technologies
                      <div className="text-muted fw-normal" style={{ fontSize: '0.65rem' }}>
                        Authorized Signatory &amp; Digital Seal
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center text-muted mt-3 extra-small border-top pt-2" style={{ fontSize: '0.68rem' }}>
                  This is a computer-generated tax invoice issued by <strong>Untoxy technologies</strong>. All rights reserved.
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer bg-light px-4 py-2.5 border-0 d-flex justify-content-between">
            <span className="extra-small text-muted font-monospace">
              Formatted for ISO A4 portrait paper (210mm &times; 297mm)
            </span>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-sm btn-outline-secondary px-3" onClick={onClose}>
                Close
              </button>
              <button type="button" className="btn btn-sm btn-primary px-3 fw-bold d-flex align-items-center gap-1.5" onClick={handlePrint}>
                <Printer size={14} /> Print Bill / Save PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaaSInvoicePrintModal;
