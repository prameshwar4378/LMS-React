import React from 'react';
import { X, Printer, Download, Building2, Calendar, FileText, ShieldCheck, QrCode } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import { exportReportToExcel } from '../utils/reportExportUtils';

const ReportPreviewModal = ({ show, onClose, reportData, filterInfo, lodgeInfo }) => {
  if (!show || !reportData) return null;

  const lodgeName = lodgeInfo?.lodge_name || 'LODGE MANAGEMENT SYSTEM';
  const gstNumber = lodgeInfo?.gst_number || 'N/A';
  const address = lodgeInfo?.address || 'Lodge Premises';
  const phone = lodgeInfo?.phone || '';
  const dateLabel = reportData.date_label || filterInfo?.date_label || 'All Time';
  const generatedAt = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const columns = reportData.columns || [];
  const rows = reportData.rows || [];
  const kpis = reportData.kpis || [];

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    exportReportToExcel(reportData, filterInfo, lodgeInfo);
  };

  return (
    <div className="modal fade show d-block modal-backdrop-animated" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', zIndex: 1070 }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered modal-xl modal-dialog-animated">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden modal-content-animated">
          
          {/* MODAL HEADER - NO PRINT */}
          <div className="modal-header bg-dark text-white py-3 px-4 d-flex align-items-center justify-content-between no-print">
            <div className="d-flex align-items-center gap-2">
              <FileText size={20} className="text-primary" />
              <h5 className="modal-title fw-bold fs-6 m-0">Executive Report Preview &amp; Verification</h5>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button type="button" className="btn btn-sm btn-outline-light d-flex align-items-center gap-1.5" onClick={handleExport}>
                <Download size={14} /> Export Excel / CSV
              </button>
              <button type="button" className="btn btn-sm btn-primary fw-bold d-flex align-items-center gap-1.5" onClick={handlePrint}>
                <Printer size={14} /> Print / Save PDF
              </button>
              <button type="button" className="btn-close btn-close-white shadow-none ms-2" onClick={onClose}></button>
            </div>
          </div>

          {/* PRINTABLE DOCUMENT BODY */}
          <div className="modal-body p-4 p-md-5 bg-white" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
            
            {/* 1. LODGE HEADER */}
            <div className="d-flex justify-content-between align-items-start border-bottom pb-3 mb-4">
              <div>
                <h4 className="fw-bold text-dark m-0">{lodgeName}</h4>
                <div className="text-secondary small mt-0.5">{address}</div>
                {phone && <div className="text-secondary small">Tel: {phone}</div>}
              </div>
              <div className="text-end d-flex align-items-start gap-3">
                {/* DIGITAL STAMP & QR */}
                <div className="d-none d-sm-flex flex-column align-items-center border p-1.5 rounded-2 bg-light">
                  <QrCode size={40} className="text-dark" />
                  <span className="text-muted" style={{ fontSize: '9px' }}>DOC-VERIFIED</span>
                </div>
                <div>
                  <span className="badge bg-primary text-white rounded-pill px-3 py-1 mb-1 fw-bold extra-small">
                    STATUTORY AUDIT REPORT
                  </span>
                  <div className="fw-bold text-dark small mt-1">GSTIN: {gstNumber}</div>
                  <div className="text-muted extra-small">Generated: {generatedAt}</div>
                </div>
              </div>
            </div>

            {/* 2. REPORT TITLE & FILTER METADATA */}
            <div className="bg-light p-3 rounded-3 border mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div>
                <h5 className="fw-bold text-dark m-0">{reportData.title}</h5>
                <div className="text-secondary extra-small mt-0.5">{reportData.description}</div>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-white text-dark border px-2.5 py-1.5 small fw-semibold d-flex align-items-center gap-1">
                  <Calendar size={13} className="text-primary" /> {dateLabel}
                </span>
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1.5 small fw-bold">
                  {rows.length} Records
                </span>
              </div>
            </div>

            {/* 3. EXECUTIVE KPI CARDS */}
            {kpis.length > 0 && (
              <div className="row g-2 mb-4">
                {kpis.map((kpi, idx) => (
                  <div key={idx} className="col">
                    <div className="p-3 bg-light rounded-3 border text-center">
                      <div className="text-secondary extra-small text-uppercase fw-bold mb-1">{kpi.label}</div>
                      <div className={`fw-bold fs-6 text-${kpi.color || 'dark'}`}>
                        {kpi.format === 'currency' ? formatCurrency(kpi.value) : kpi.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 4. DATA TABLE */}
            <div className="table-responsive">
              <table className="table table-bordered table-striped align-middle m-0 small">
                <thead className="table-dark">
                  <tr>
                    {columns.map((col, idx) => (
                      <th key={idx} className={`text-${col.align || 'left'} py-2 px-2.5 text-nowrap`}>
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="text-center py-4 text-muted">
                        No transactional records found for this period.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {columns.map((col, cIdx) => {
                          const val = row[col.key];
                          let displayVal = val;
                          if (col.format === 'currency') {
                            displayVal = formatCurrency(val);
                          } else if (val === null || val === undefined || val === '') {
                            displayVal = '—';
                          }

                          return (
                            <td key={cIdx} className={`text-${col.align || 'left'} py-2 px-2.5 text-nowrap`}>
                              {col.badgeStyle === 'status' ? (
                                <span className={`badge ${
                                  val === 'CONFIRMED' || val === 'CHECKED_IN' || val === 'COLLECTION' ? 'bg-success-subtle text-success border border-success-subtle' :
                                  val === 'CHECKED_OUT' || val === 'COMPLETED' ? 'bg-primary-subtle text-primary border border-primary-subtle' :
                                  val === 'CANCELLED' || val === 'NO_SHOW' || val === 'REFUND' ? 'bg-danger-subtle text-danger border border-danger-subtle' :
                                  'bg-light text-dark border'
                                } px-2 py-0.5 extra-small fw-bold`}>
                                  {val}
                                </span>
                              ) : (
                                displayVal
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 5. OFFICIAL SIGNATURE & DIGITAL SEAL BLOCK */}
            <div className="d-flex justify-content-between align-items-end mt-5 pt-4 border-top">
              <div className="text-center">
                <div className="border-bottom pb-4 mb-1" style={{ width: '180px' }}></div>
                <span className="text-muted extra-small">Prepared By (Staff / Operator)</span>
              </div>

              {/* OFFICIAL STAMP */}
              <div className="text-center p-2 px-3 border border-2 border-primary border-opacity-50 rounded-3 text-primary d-flex flex-column align-items-center">
                <ShieldCheck size={20} />
                <span className="fw-bold extra-small text-uppercase mt-0.5">OFFICIAL AUDIT SEAL</span>
                <span className="extra-small text-muted" style={{ fontSize: '9px' }}>{lodgeName}</span>
              </div>

              <div className="text-center">
                <div className="border-bottom pb-4 mb-1" style={{ width: '180px' }}></div>
                <span className="text-muted extra-small">Manager / Auditor Authorization</span>
              </div>
            </div>

            {/* 6. AUDIT FOOTER */}
            <div className="d-flex justify-content-between align-items-center mt-3 pt-2 text-muted extra-small">
              <div>System Generated Audit Document &bull; {lodgeName}</div>
              <div>Page 1 of 1</div>
            </div>

          </div>

          {/* MODAL FOOTER - NO PRINT */}
          <div className="modal-footer bg-light border-top px-4 py-3 d-flex justify-content-between align-items-center no-print">
            <span className="text-muted extra-small">
              Showing {rows.length} records filtered by {dateLabel}
            </span>
            <div className="d-flex align-items-center gap-2">
              <button type="button" className="btn btn-light border fw-semibold px-3 py-1.5 rounded-3" onClick={onClose}>
                Close
              </button>
              <button type="button" className="btn btn-primary fw-bold px-3 py-1.5 rounded-3 d-flex align-items-center gap-1.5" onClick={handlePrint}>
                <Printer size={15} /> Print Document
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ReportPreviewModal;
