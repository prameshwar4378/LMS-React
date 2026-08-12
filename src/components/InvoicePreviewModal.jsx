import React, { useEffect, useState } from 'react';
import { getInvoiceByStayApi } from '../api/billingApi';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/dateUtils';
import { Printer, X, Receipt, CheckCircle, FileText } from 'lucide-react';

const InvoicePreviewModal = ({ show, onClose, stayId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (show && stayId) {
      setLoading(true);
      getInvoiceByStayApi(stayId)
        .then((res) => {
          setData(res);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [show, stayId]);

  if (!show) return null;

  const handlePrint = () => {
    const printContent = document.querySelector('.printable-invoice');
    if (!printContent) {
      window.print();
      return;
    }

    const printWindow = window.open('', '_blank', 'width=920,height=850');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Tax Invoice - ${data?.invoice?.invoice_number || 'Official Bill'}</title>
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
            <style>
              @page {
                size: A4 portrait;
                margin: 10mm;
              }
              body {
                font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
                color: #0f172a;
                background-color: #ffffff;
                padding: 16px;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .table { font-size: 11px; }
              .table th, .table td { padding: 6px 10px; }
              .bg-light { background-color: #f8fafc !important; }
              .text-primary { color: #2563eb !important; }
              .text-success { color: #16a34a !important; }
              .text-danger { color: #dc2626 !important; }
              .border { border-color: #e2e8f0 !important; }
              .printable-invoice { width: 100% !important; background: #fff !important; }
            </style>
          </head>
          <body>
            <div className="printable-invoice">
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
      }, 400);
    } else {
      window.print();
    }
  };

  return (
    <div className="modal fade show d-block no-print-backdrop" style={{ backgroundColor: 'rgba(15,23,42,0.7)', zIndex: 1055 }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered modal-lg" style={{ maxWidth: '840px' }}>
        <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden">
          <div className="modal-header bg-dark text-white py-3 no-print border-0">
            <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
              <Receipt size={20} className="text-primary" /> Tax Invoice / Official Bill
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <div className="modal-body p-4 bg-white" style={{ maxHeight: '82vh', overflowY: 'auto' }}>
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <div className="mt-2 text-muted small">Generating A4 Tax Invoice...</div>
              </div>
            ) : !data ? (
              <div className="alert alert-danger">Unable to load invoice data.</div>
            ) : (
              <div className="printable-invoice bg-white">
                {/* 1. Lodge Branding & Invoice Header */}
                <div className="invoice-header d-flex justify-content-between align-items-start border-bottom pb-3 mb-3">
                  <div>
                    <h3 className="fw-bold text-dark m-0" style={{ letterSpacing: '-0.5px' }}>
                      {data.settings.lodge_name}
                    </h3>
                    <div className="text-secondary small">{data.settings.address}</div>
                    <div className="text-secondary small">Phone: {data.settings.phone} | Email: {data.settings.email}</div>
                    {data.settings.gst_number && (
                      <div className="fw-bold text-dark small mt-1">GSTIN: {data.settings.gst_number}</div>
                    )}
                  </div>
                  <div className="text-end">
                    <div className="border border-dark rounded-3 px-3 py-2 bg-light shadow-xs">
                      <div className="text-uppercase text-muted fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>
                        TAX INVOICE
                      </div>
                      <div className="fw-bold text-primary fs-5">{data.invoice.invoice_number}</div>
                      <div className="small text-muted">
                        Date: <strong>{formatDate(data.invoice.generated_at)}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Guest & Stay Details Grid */}
                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <div className="p-3 bg-light rounded-3 border h-100">
                      <div className="fw-bold text-dark border-bottom pb-1 mb-2 small text-uppercase" style={{ letterSpacing: '0.5px' }}>
                        <i className="bi bi-person-fill me-1 text-primary"></i>Guest Information
                      </div>
                      <div className="fw-bold fs-6 text-dark">{data.stay_details.customer_name}</div>
                      <div className="small text-muted">Mobile: {data.stay_details.customer_mobile}</div>
                      <div className="small text-muted">Address: {data.stay_details.customer_address || 'N/A'}</div>
                      <div className="small text-muted">
                        ID: {data.stay_details.customer_id_type} {data.stay_details.customer_id_number ? `- ${data.stay_details.customer_id_number}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-3 bg-light rounded-3 border h-100">
                      <div className="fw-bold text-dark border-bottom pb-1 mb-2 small text-uppercase" style={{ letterSpacing: '0.5px' }}>
                        <i className="bi bi-door-open-fill me-1 text-primary"></i>Stay Details
                      </div>
                      <div className="d-flex justify-content-between small mb-1">
                        <span className="text-muted">Stay Number:</span>
                        <strong className="text-dark">{data.stay_details.stay_number}</strong>
                      </div>
                      <div className="d-flex justify-content-between small mb-1">
                        <span className="text-muted">Assigned Room:</span>
                        <strong className="text-primary">Room {data.stay_details.room_number} ({data.stay_details.room_type})</strong>
                      </div>
                      <div className="d-flex justify-content-between small mb-1">
                        <span className="text-muted">Check-In:</span>
                        <span>{formatDate(data.stay_details.check_in_date)} @ {data.stay_details.check_in_time}</span>
                      </div>
                      <div className="d-flex justify-content-between small mb-1">
                        <span className="text-muted">Check-Out:</span>
                        <span>{formatDate(data.stay_details.checkout_date)} @ {data.stay_details.checkout_time}</span>
                      </div>
                      <div className="d-flex justify-content-between small">
                        <span className="text-muted">Stay Duration:</span>
                        <strong className="text-dark">{data.bill.room_days} Night(s)</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Itemized Charges Table */}
                <table className="table table-bordered align-middle mb-3 invoice-table">
                  <thead className="table-secondary text-dark fw-bold">
                    <tr>
                      <th style={{ width: '40px' }} className="text-center">#</th>
                      <th>Item Description / Service</th>
                      <th className="text-center" style={{ width: '90px' }}>Qty / Days</th>
                      <th className="text-end" style={{ width: '120px' }}>Rate (₹)</th>
                      <th className="text-end" style={{ width: '130px' }}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="text-center">1</td>
                      <td>
                        <strong className="text-dark">Room Rent - Room {data.stay_details.room_number}</strong>
                        <div className="text-muted small">{data.stay_details.room_type} ({data.bill.room_days} Nights @ {formatCurrency(data.bill.room_rate)}/night)</div>
                      </td>
                      <td className="text-center fw-semibold">{data.bill.room_days}</td>
                      <td className="text-end">{formatCurrency(data.bill.room_rate)}</td>
                      <td className="text-end fw-bold text-dark">{formatCurrency(data.bill.room_amount)}</td>
                    </tr>
                    {data.stay_details.extra_charges.map((item, idx) => (
                      <tr key={idx}>
                        <td className="text-center">{idx + 2}</td>
                        <td>{item.description}</td>
                        <td className="text-center fw-semibold">{item.quantity}</td>
                        <td className="text-end">{formatCurrency(item.price)}</td>
                        <td className="text-end fw-bold text-dark">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* 4. Financial Summary & Ledger */}
                <div className="row justify-content-end mb-3">
                  <div className="col-6">
                    <div className="border rounded-3 p-3 bg-light">
                      <div className="d-flex justify-content-between py-1 border-bottom small">
                        <span className="text-muted">Subtotal:</span>
                        <strong className="text-dark">{formatCurrency(data.bill.subtotal)}</strong>
                      </div>
                      {data.bill.discount_amount > 0 && (
                        <div className="d-flex justify-content-between py-1 border-bottom small text-danger">
                          <span>Discount {data.bill.discount_reason ? `(${data.bill.discount_reason})` : ''}:</span>
                          <strong className="text-danger">-{formatCurrency(data.bill.discount_amount)}</strong>
                        </div>
                      )}
                      {data.bill.tax_amount > 0 && (
                        <div className="d-flex justify-content-between py-1 border-bottom small">
                          <span className="text-muted">GST Tax ({data.bill.tax_percentage}%):</span>
                          <strong className="text-dark">{formatCurrency(data.bill.tax_amount)}</strong>
                        </div>
                      )}
                      <div className="d-flex justify-content-between py-2 border-bottom fw-bold fs-6">
                        <span className="text-dark">Grand Total:</span>
                        <strong className="text-primary">{formatCurrency(data.bill.grand_total)}</strong>
                      </div>
                      <div className="d-flex justify-content-between py-1 border-bottom small text-success">
                        <span className="fw-semibold">Total Paid Amount:</span>
                        <strong className="text-success">{formatCurrency(data.bill.total_paid)}</strong>
                      </div>
                      <div className="d-flex justify-content-between py-2 pt-2 fw-bold">
                        <span className="text-dark">Balance Due:</span>
                        <strong className={data.bill.balance > 0 ? 'text-danger fs-6' : 'text-success fs-6'}>
                          {formatCurrency(data.bill.balance)}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. Payment Ledger Transactions */}
                {data.stay_details.payments.length > 0 && (
                  <div className="mb-3">
                    <div className="fw-bold text-dark small text-uppercase mb-2 border-bottom pb-1" style={{ letterSpacing: '0.5px' }}>
                      <i className="bi bi-wallet2 me-1 text-success"></i>Payment Transactions History
                    </div>
                    <table className="table table-sm table-bordered align-middle small invoice-table mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Payment #</th>
                          <th>Date & Time</th>
                          <th>Method</th>
                          <th className="text-end">Amount Paid</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.stay_details.payments.map((p, idx) => (
                          <tr key={idx}>
                            <td className="fw-bold">{p.payment_number}</td>
                            <td>{p.date}</td>
                            <td><span className="badge bg-light text-dark border">{p.method}</span></td>
                            <td className="text-end fw-bold text-success">{formatCurrency(p.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 6. Professional Footer */}
                <div className="pt-3 border-top text-center text-muted small mt-3">
                  <div className="fw-semibold text-dark">Thank you for staying with us! Have a safe and pleasant journey.</div>
                  <div className="text-secondary" style={{ fontSize: '0.75rem' }}>This is a computer-generated official lodge invoice.</div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer bg-light no-print justify-content-between border-top">
            <button className="btn btn-light border fw-semibold" onClick={onClose}>Close</button>
            <button className="btn btn-primary fw-bold px-4 shadow-sm d-flex align-items-center gap-2" onClick={handlePrint} disabled={!data}>
              <Printer size={18} /> Print Invoice (A4 Page)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreviewModal;
