import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Code2,
  Download,
  CheckCircle2,
  Printer,
  ShieldCheck,
  Settings,
  X,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { exportReportToExcel, exportReportToJSON } from '../utils/reportExportUtils';

const ReportExportModal = ({
  show,
  onClose,
  reportData,
  filterInfo,
  lodgeInfo,
  hiddenColumns = {},
  onOpenPrintPreview
}) => {
  const [selectedFormat, setSelectedFormat] = useState('excel'); // 'excel' | 'pdf' | 'json'
  const [includeKPIs, setIncludeKPIs] = useState(true);
  const [includeTotals, setIncludeTotals] = useState(true);
  const [includeHeader, setIncludeHeader] = useState(true);
  const [visibleOnly, setVisibleOnly] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!show || !reportData) return null;

  const rowCount = reportData.rows?.length || 0;
  const dateLabel = reportData.date_label || filterInfo?.date_label || 'All Time';

  const handleExecuteExport = () => {
    if (selectedFormat === 'excel') {
      exportReportToExcel(reportData, filterInfo, lodgeInfo, {
        includeKPIs,
        includeTotals,
        includeHeader,
        visibleColumnsOnly: visibleOnly,
        hiddenColumns
      });
      setDownloadSuccess(true);
      setTimeout(() => {
        setDownloadSuccess(false);
        onClose();
      }, 1500);
    } else if (selectedFormat === 'pdf') {
      onClose();
      if (onOpenPrintPreview) {
        onOpenPrintPreview();
      }
    } else if (selectedFormat === 'json') {
      exportReportToJSON(reportData, lodgeInfo);
      setDownloadSuccess(true);
      setTimeout(() => {
        setDownloadSuccess(false);
        onClose();
      }, 1500);
    }
  };

  return (
    <div
      className="modal fade show d-block modal-backdrop-animated"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', zIndex: 1075 }}
      tabIndex="-1"
    >
      <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-animated">
        <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden modal-content-animated">
          
          {/* HEADER */}
          <div className="modal-header bg-dark text-white py-3 px-4 d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <Download size={20} className="text-primary" />
              <div>
                <h5 className="modal-title fw-bold fs-6 m-0">Export &amp; Document Center</h5>
                <span className="text-white-50 extra-small">
                  Download audit-ready reports in multiple structured formats
                </span>
              </div>
            </div>
            <button type="button" className="btn-close btn-close-white shadow-none" onClick={onClose}></button>
          </div>

          {/* BODY */}
          <div className="modal-body p-4 p-md-5 bg-white">
            
            {/* SUCCESS BANNER */}
            {downloadSuccess && (
              <div className="alert alert-success d-flex align-items-center gap-2 rounded-3 py-2 px-3 mb-4 shadow-sm">
                <CheckCircle2 size={16} className="text-success" />
                <span className="small fw-semibold">Report successfully exported and downloaded!</span>
              </div>
            )}

            {/* REPORT SUMMARY CARD */}
            <div className="p-3 bg-light rounded-3 border mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div>
                <h6 className="fw-bold text-dark m-0">{reportData.title}</h6>
                <div className="text-secondary extra-small mt-0.5">{reportData.description}</div>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-white text-dark border px-2.5 py-1 extra-small fw-semibold d-flex align-items-center gap-1">
                  <Calendar size={13} className="text-primary" /> {dateLabel}
                </span>
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1 extra-small fw-bold">
                  {rowCount} Records
                </span>
              </div>
            </div>

            {/* FORMAT SELECTOR CARDS */}
            <div className="mb-4">
              <label className="form-label extra-small fw-bold text-secondary text-uppercase mb-2">
                1. Select Export Format
              </label>

              <div className="row g-3">
                
                {/* EXCEL / CSV CARD */}
                <div className="col-md-4">
                  <div
                    className={`card h-100 p-3 rounded-4 border-2 cursor-pointer transition-all ${
                      selectedFormat === 'excel' ? 'border-primary bg-primary bg-opacity-10 shadow-sm' : 'border-light-subtle hover-bg-light'
                    }`}
                    onClick={() => setSelectedFormat('excel')}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="p-2 bg-success text-white rounded-3">
                        <FileSpreadsheet size={20} />
                      </div>
                      <input
                        type="radio"
                        name="exportFormat"
                        className="form-check-input"
                        checked={selectedFormat === 'excel'}
                        onChange={() => setSelectedFormat('excel')}
                      />
                    </div>
                    <h6 className="fw-bold text-dark mb-1">Executive Excel (.csv)</h6>
                    <p className="text-secondary extra-small m-0" style={{ lineHeight: 1.4 }}>
                      Structured spreadsheet with KPI headers, formatted amounts, and Grand Totals row.
                    </p>
                  </div>
                </div>

                {/* PDF PRINT CARD */}
                <div className="col-md-4">
                  <div
                    className={`card h-100 p-3 rounded-4 border-2 cursor-pointer transition-all ${
                      selectedFormat === 'pdf' ? 'border-primary bg-primary bg-opacity-10 shadow-sm' : 'border-light-subtle hover-bg-light'
                    }`}
                    onClick={() => setSelectedFormat('pdf')}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="p-2 bg-primary text-white rounded-3">
                        <FileText size={20} />
                      </div>
                      <input
                        type="radio"
                        name="exportFormat"
                        className="form-check-input"
                        checked={selectedFormat === 'pdf'}
                        onChange={() => setSelectedFormat('pdf')}
                      />
                    </div>
                    <h6 className="fw-bold text-dark mb-1">Official PDF / Print</h6>
                    <p className="text-secondary extra-small m-0" style={{ lineHeight: 1.4 }}>
                      Printable audit document with official seal, QR verification code, and signature blocks.
                    </p>
                  </div>
                </div>

                {/* JSON DATA CARD */}
                <div className="col-md-4">
                  <div
                    className={`card h-100 p-3 rounded-4 border-2 cursor-pointer transition-all ${
                      selectedFormat === 'json' ? 'border-primary bg-primary bg-opacity-10 shadow-sm' : 'border-light-subtle hover-bg-light'
                    }`}
                    onClick={() => setSelectedFormat('json')}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="p-2 bg-dark text-white rounded-3">
                        <Code2 size={20} />
                      </div>
                      <input
                        type="radio"
                        name="exportFormat"
                        className="form-check-input"
                        checked={selectedFormat === 'json'}
                        onChange={() => setSelectedFormat('json')}
                      />
                    </div>
                    <h6 className="fw-bold text-dark mb-1">Accounting JSON</h6>
                    <p className="text-secondary extra-small m-0" style={{ lineHeight: 1.4 }}>
                      Raw structured dataset for importing into Tally, ERP, or external accounting software.
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* EXPORT CONFIGURATION OPTIONS */}
            {selectedFormat === 'excel' && (
              <div className="p-3 bg-light rounded-3 border">
                <div className="fw-bold text-dark extra-small text-uppercase mb-2.5 d-flex align-items-center gap-1">
                  <Settings size={14} className="text-primary" /> Spreadsheet Customization Options
                </div>

                <div className="row g-2">
                  <div className="col-sm-6">
                    <label className="form-check form-check-sm d-flex align-items-center gap-2 cursor-pointer m-0">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={includeKPIs}
                        onChange={(e) => setIncludeKPIs(e.target.checked)}
                      />
                      <span className="small text-dark fw-medium">Include Executive KPI Metrics Header</span>
                    </label>
                  </div>

                  <div className="col-sm-6">
                    <label className="form-check form-check-sm d-flex align-items-center gap-2 cursor-pointer m-0">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={includeTotals}
                        onChange={(e) => setIncludeTotals(e.target.checked)}
                      />
                      <span className="small text-dark fw-medium">Include Grand Totals Calculation Row</span>
                    </label>
                  </div>

                  <div className="col-sm-6">
                    <label className="form-check form-check-sm d-flex align-items-center gap-2 cursor-pointer m-0">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={includeHeader}
                        onChange={(e) => setIncludeHeader(e.target.checked)}
                      />
                      <span className="small text-dark fw-medium">Include Lodge GSTIN &amp; Header Block</span>
                    </label>
                  </div>

                  <div className="col-sm-6">
                    <label className="form-check form-check-sm d-flex align-items-center gap-2 cursor-pointer m-0">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={visibleOnly}
                        onChange={(e) => setVisibleOnly(e.target.checked)}
                      />
                      <span className="small text-dark fw-medium">Export only customized visible columns</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* FOOTER */}
          <div className="modal-footer bg-light border-top px-4 py-3 d-flex justify-content-between align-items-center">
            <span className="text-muted extra-small">
              UTF-8 Encoded &bull; Compatible with MS Excel, Google Sheets, LibreOffice &amp; Tally
            </span>
            <div className="d-flex align-items-center gap-2">
              <button type="button" className="btn btn-light border fw-semibold px-3 py-1.5 rounded-3" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary fw-bold px-4 py-1.5 rounded-3 shadow-xs d-flex align-items-center gap-1.5"
                onClick={handleExecuteExport}
                disabled={rowCount === 0}
              >
                {selectedFormat === 'pdf' ? (
                  <>
                    <Printer size={15} /> Open Print / PDF Dialog
                  </>
                ) : (
                  <>
                    <Download size={15} /> Download {selectedFormat === 'excel' ? 'Spreadsheet' : 'JSON'}
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ReportExportModal;
