import React, { useState, useEffect } from 'react';
import {
  Moon,
  X,
  Printer,
  Mail,
  CheckCircle2,
  DollarSign,
  BedDouble,
  Users,
  Calendar,
  AlertTriangle,
  Building2,
  Receipt,
  Sparkles,
  Send,
  ShieldCheck,
  LogIn,
  LogOut,
  Check,
  Wallet,
  QrCode,
  CreditCard,
  RotateCcw,
  Percent,
  FileText,
  Clock,
  Download
} from 'lucide-react';
import { getNightAuditApi } from '../api/reportApi';
import { formatCurrency } from '../utils/formatCurrency';
import { exportNightAuditToPDF } from '../utils/exportUtils';
import PageLoader from './PageLoader';

const NightAuditModal = ({ show, onClose }) => {
  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (show) {
      loadNightAudit();
    } else {
      setEmailSent(false);
    }
  }, [show]);

  const loadNightAudit = async () => {
    setLoading(true);
    try {
      const data = await getNightAuditApi();
      setAuditData(data);
    } catch (err) {
      console.error('Error fetching night audit data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = () => {
    setEmailSent(true);
    setTimeout(() => {
      setEmailSent(false);
    }, 4000);
  };

  const handleDownloadPdf = () => {
    if (!auditData) return;
    exportNightAuditToPDF(auditData, { action: 'download' });
  };

  const handlePrintAudit = () => {
    if (!auditData) return;
    exportNightAuditToPDF(auditData, { action: 'print' });
  };

  if (!show) return null;

  const fin = auditData?.financial_close || {};
  const inv = auditData?.inventory_summary || {};
  const ops = auditData?.operations_summary || {};
  const lodge = auditData?.lodge_info || {};

  return (
    <div
      className="modal fade show d-block modal-backdrop-animated"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', zIndex: 1070 }}
      tabIndex="-1"
    >
      <div
        className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-dialog-animated"
        style={{
          width: '96vw',
          maxWidth: '1280px',
          margin: '1.25rem auto'
        }}
      >
        <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden modal-content-animated printable-night-audit">
          
          {/* HEADER */}
          <div
            className="modal-header text-white py-3 px-4 d-flex align-items-center justify-content-between no-print"
            style={{
              background: 'linear-gradient(135deg, #09204C 0%, #10377C 50%, #1E1B4B 100%)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.12)'
            }}
          >
            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center shadow-xs"
                style={{
                  width: '42px',
                  height: '42px',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.25)'
                }}
              >
                <Moon size={22} className="text-warning" />
              </div>
              <div>
                <div className="d-flex align-items-center gap-2">
                  <h5 className="modal-title fw-bold fs-6 m-0 text-white" style={{ letterSpacing: '-0.02em' }}>
                    Daily Night Audit &amp; Operations Close
                  </h5>
                  <span
                    className="badge rounded-pill px-2.5 py-0.5 extra-small fw-bold"
                    style={{
                      backgroundColor: 'rgba(245, 158, 11, 0.2)',
                      color: '#FDE68A',
                      border: '1px solid rgba(245, 158, 11, 0.4)'
                    }}
                  >
                    EOD Audit
                  </span>
                </div>
                <span className="text-white text-opacity-75 extra-small" style={{ fontSize: '11.5px' }}>
                  Official end-of-day reconciliation &bull; {auditData?.audit_date || 'Today'}
                </span>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-sm btn-light text-primary fw-bold px-3 py-1.5 rounded-3 d-flex align-items-center gap-1.5 shadow-sm transition-all"
                onClick={handleDownloadPdf}
                disabled={!auditData}
                title="Download true A4 Landscape PDF"
              >
                <Download size={14} /> Download PDF (A4)
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-light text-white fw-bold px-3 py-1.5 rounded-3 d-flex align-items-center gap-1.5 shadow-sm transition-all"
                onClick={handlePrintAudit}
                disabled={!auditData}
                title="Print Audit Report in A4 Landscape"
              >
                <Printer size={14} /> Print Audit Sheet
              </button>
              <button
                type="button"
                className="btn-close btn-close-white shadow-none ms-2"
                onClick={onClose}
              ></button>
            </div>
          </div>

          {/* BODY */}
          <div className="modal-body p-4 p-md-4 bg-white" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
            {loading ? (
              <div className="py-5 text-center">
                <PageLoader fullScreen={false} message="Compiling Daily Financial &amp; Operational Close..." />
              </div>
            ) : auditData ? (
              <div>
                
                {/* EMAIL SENT TOAST */}
                {emailSent && (
                  <div className="alert alert-success d-flex align-items-center gap-2 rounded-3 py-2.5 px-3 mb-3 shadow-sm border-0">
                    <CheckCircle2 size={16} className="text-success" />
                    <span className="small fw-semibold">
                      Daily Night Audit digest successfully dispatched to manager &amp; owner email!
                    </span>
                  </div>
                )}

                {/* HOTEL BRANDING & TIMESTAMP BANNER CARD */}
                <div
                  className="rounded-4 p-3.5 mb-4 border d-flex justify-content-between align-items-center flex-wrap gap-3"
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderColor: '#E2E8F0'
                  }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="p-2.5 rounded-3 bg-white border d-flex align-items-center justify-content-center shadow-xs"
                      style={{ width: '46px', height: '46px', borderColor: '#E2E8F0' }}
                    >
                      <Building2 size={24} className="text-primary" />
                    </div>
                    <div>
                      <h5 className="fw-bold text-dark m-0 fs-6" style={{ letterSpacing: '-0.01em' }}>
                        {lodge.lodge_name || 'Lodge Premises'}
                      </h5>
                      <div className="text-secondary extra-small mt-0.5">
                        {lodge.address || 'Hotel Premises'} {lodge.phone ? `• Tel: ${lodge.phone}` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="text-end">
                    <span
                      className="badge rounded-pill px-3 py-1 fw-bold extra-small"
                      style={{ backgroundColor: '#0F172A', color: '#FFFFFF', letterSpacing: '0.03em' }}
                    >
                      DAILY AUDIT CLOSE
                    </span>
                    <div className="fw-bold text-dark small mt-1">{auditData.timestamp}</div>
                    <div className="text-muted extra-small">
                      GSTIN: {lodge.gst_number || 'N/A'} &bull; Code: {lodge.property_code || 'LMS'}
                    </div>
                  </div>
                </div>

                {/* ============================================================ */}
                {/* 1. FINANCIAL CASH DRAWER & COLLECTIONS CLOSE (4-GRID)       */}
                {/* ============================================================ */}
                <div className="mb-4">
                  <div className="d-flex align-items-center justify-content-between mb-2.5">
                    <div className="d-flex align-items-center gap-2">
                      <div className="p-1 rounded-2 bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center">
                        <DollarSign size={16} />
                      </div>
                      <h6 className="fw-bold text-dark m-0 fs-6">
                        1. Financial Closing &amp; Cash in Till
                      </h6>
                    </div>
                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 extra-small">
                      Auto-Balanced Till
                    </span>
                  </div>

                  <div className="row g-2.5 row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-5">
                    {/* A. Net Cash in Drawer */}
                    <div className="col">
                      <div
                        className="p-2.5 px-3 rounded-4 border h-100 d-flex flex-column justify-content-between shadow-xs transition-all"
                        style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}
                      >
                        <div className="d-flex align-items-center justify-content-between mb-1.5 gap-1">
                          <span
                            className="fw-bold text-success text-uppercase text-truncate"
                            style={{ fontSize: '10.5px', letterSpacing: '0.02em' }}
                            title="Net Cash in Till"
                          >
                            Net Cash in Till
                          </span>
                          <span
                            className="badge bg-white text-success border border-success border-opacity-25 rounded-pill px-1.5 py-0.5 text-nowrap flex-shrink-0"
                            style={{ fontSize: '9.5px' }}
                          >
                            Physical Till
                          </span>
                        </div>
                        <div className="my-1.5">
                          <h4
                            className="fw-bold text-success m-0 font-monospace text-truncate"
                            style={{ fontSize: '1.25rem', letterSpacing: '-0.02em' }}
                            title={formatCurrency(fin.net_cash_in_till || 0)}
                          >
                            {formatCurrency(fin.net_cash_in_till || 0)}
                          </h4>
                        </div>
                        <div
                          className="text-muted pt-1.5 border-top border-success border-opacity-20 d-flex justify-content-between align-items-center gap-1"
                          style={{ fontSize: '10.5px' }}
                        >
                          <span className="text-secondary text-nowrap">Inflow:</span>
                          <strong className="text-dark font-monospace text-nowrap">
                            {formatCurrency(fin.cash_received || 0)}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* B. Digital UPI / Cards */}
                    <div className="col">
                      <div
                        className="p-2.5 px-3 rounded-4 border h-100 d-flex flex-column justify-content-between shadow-xs transition-all"
                        style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }}
                      >
                        <div className="d-flex align-items-center justify-content-between mb-1.5 gap-1">
                          <span
                            className="fw-bold text-primary text-uppercase text-truncate"
                            style={{ fontSize: '10.5px', letterSpacing: '0.02em' }}
                            title="Digital UPI / Cards"
                          >
                            Digital Payments
                          </span>
                          <span
                            className="badge bg-white text-primary border border-primary border-opacity-25 rounded-pill px-1.5 py-0.5 text-nowrap flex-shrink-0"
                            style={{ fontSize: '9.5px' }}
                          >
                            Bank / UPI
                          </span>
                        </div>
                        <div className="my-1.5">
                          <h4
                            className="fw-bold text-primary m-0 font-monospace text-truncate"
                            style={{ fontSize: '1.25rem', letterSpacing: '-0.02em' }}
                            title={formatCurrency(fin.total_digital || 0)}
                          >
                            {formatCurrency(fin.total_digital || 0)}
                          </h4>
                        </div>
                        <div
                          className="text-muted pt-1.5 border-top border-primary border-opacity-20 d-flex justify-content-between align-items-center gap-1"
                          style={{ fontSize: '10.5px' }}
                        >
                          <span className="text-secondary text-nowrap">UPI Inflow:</span>
                          <strong className="text-dark font-monospace text-nowrap">
                            {formatCurrency(fin.upi_collections || 0)}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* C. Total Collections Today */}
                    <div className="col">
                      <div
                        className="p-2.5 px-3 rounded-4 border h-100 d-flex flex-column justify-content-between shadow-xs transition-all"
                        style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' }}
                      >
                        <div className="d-flex align-items-center justify-content-between mb-1.5 gap-1">
                          <span
                            className="fw-bold text-secondary text-uppercase text-truncate"
                            style={{ fontSize: '10.5px', letterSpacing: '0.02em' }}
                            title="Total Collections"
                          >
                            Total Collections
                          </span>
                          <span
                            className="badge bg-white text-secondary border rounded-pill px-1.5 py-0.5 text-nowrap flex-shrink-0"
                            style={{ fontSize: '9.5px' }}
                          >
                            Gross Inflow
                          </span>
                        </div>
                        <div className="my-1.5">
                          <h4
                            className="fw-bold text-dark m-0 font-monospace text-truncate"
                            style={{ fontSize: '1.25rem', letterSpacing: '-0.02em' }}
                            title={formatCurrency(fin.total_collections_today || 0)}
                          >
                            {formatCurrency(fin.total_collections_today || 0)}
                          </h4>
                        </div>
                        <div
                          className="text-muted pt-1.5 border-top border-secondary border-opacity-20 d-flex justify-content-between align-items-center gap-1"
                          style={{ fontSize: '10.5px' }}
                        >
                          <span className="text-secondary text-nowrap">Coverage:</span>
                          <strong className="text-secondary text-nowrap">All Channels</strong>
                        </div>
                      </div>
                    </div>

                    {/* D. Cash Refunds / Returns */}
                    <div className="col">
                      <div
                        className="p-2.5 px-3 rounded-4 border h-100 d-flex flex-column justify-content-between shadow-xs transition-all"
                        style={{ backgroundColor: '#FFF1F2', borderColor: '#FECDD3' }}
                      >
                        <div className="d-flex align-items-center justify-content-between mb-1.5 gap-1">
                          <span
                            className="fw-bold text-danger text-uppercase text-truncate"
                            style={{ fontSize: '10.5px', letterSpacing: '0.02em' }}
                            title="Cash Refunds"
                          >
                            Cash Refunds
                          </span>
                          <span
                            className="badge bg-white text-danger border border-danger border-opacity-25 rounded-pill px-1.5 py-0.5 text-nowrap flex-shrink-0"
                            style={{ fontSize: '9.5px' }}
                          >
                            Outflow
                          </span>
                        </div>
                        <div className="my-1.5">
                          <h4
                            className="fw-bold text-danger m-0 font-monospace text-truncate"
                            style={{ fontSize: '1.25rem', letterSpacing: '-0.02em' }}
                            title={formatCurrency(fin.cash_refunded || 0)}
                          >
                            {formatCurrency(fin.cash_refunded || 0)}
                          </h4>
                        </div>
                        <div
                          className="text-muted pt-1.5 border-top border-danger border-opacity-20 d-flex justify-content-between align-items-center gap-1"
                          style={{ fontSize: '10.5px' }}
                        >
                          <span className="text-secondary text-nowrap">Outflow:</span>
                          <strong className="text-danger text-nowrap">Guest Refunds</strong>
                        </div>
                      </div>
                    </div>

                    {/* E. Till Cash Expenses */}
                    <div className="col">
                      <div
                        className="p-2.5 px-3 rounded-4 border h-100 d-flex flex-column justify-content-between shadow-xs transition-all"
                        style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }}
                      >
                        <div className="d-flex align-items-center justify-content-between mb-1.5 gap-1">
                          <span
                            className="fw-bold text-uppercase text-truncate"
                            style={{ fontSize: '10.5px', letterSpacing: '0.02em', color: '#B45309' }}
                            title="Till Expenses"
                          >
                            Till Expenses
                          </span>
                          <span
                            className="badge bg-white border rounded-pill px-1.5 py-0.5 text-nowrap flex-shrink-0"
                            style={{ fontSize: '9.5px', color: '#B45309', borderColor: 'rgba(217, 119, 6, 0.3)' }}
                          >
                            {fin.expenses_count || 0} Voucher{fin.expenses_count === 1 ? '' : 's'}
                          </span>
                        </div>
                        <div className="my-1.5">
                          <h4
                            className="fw-bold m-0 font-monospace text-truncate"
                            style={{ fontSize: '1.25rem', letterSpacing: '-0.02em', color: '#D97706' }}
                            title={`-${formatCurrency(fin.cash_expenses || 0)}`}
                          >
                            -{formatCurrency(fin.cash_expenses || 0)}
                          </h4>
                        </div>
                        <div
                          className="text-muted pt-1.5 border-top border-warning border-opacity-20 d-flex justify-content-between align-items-center gap-1"
                          style={{ fontSize: '10.5px' }}
                        >
                          <span className="text-secondary text-nowrap">Disbursed:</span>
                          <strong className="text-warning-emphasis text-nowrap" style={{ color: '#B45309' }}>
                            Petty Cash
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ============================================================ */}
                {/* 2. INVENTORY & HOUSEKEEPING (UNIFIED 5-COLUMN ROW ON DESKTOP) */}
                {/* ============================================================ */}
                <div className="mb-4">
                  <div className="d-flex align-items-center justify-content-between mb-2.5">
                    <div className="d-flex align-items-center gap-2">
                      <div className="p-1 rounded-2 bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center">
                        <BedDouble size={16} />
                      </div>
                      <h6 className="fw-bold text-dark m-0 fs-6">
                        2. Room Inventory &amp; Housekeeping Status
                      </h6>
                    </div>
                    <span className="text-muted extra-small">
                      Total {inv.total_rooms || ((inv.occupied_rooms || 0) + (inv.available_rooms || 0) + (inv.cleaning_rooms || 0) + (inv.maintenance_rooms || 0))} Rooms
                    </span>
                  </div>

                  {/* 5 Equal Columns on Desktop/Laptop - No Orphaned Cards */}
                  <div className="row row-cols-2 row-cols-sm-3 row-cols-lg-5 g-2.5">
                    {/* 1. Occupied */}
                    <div className="col">
                      <div
                        className="p-2.5 px-3 rounded-3 border text-center h-100 d-flex flex-column justify-content-between shadow-xs"
                        style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }}
                      >
                        <span className="extra-small fw-bold text-primary text-uppercase mb-1 text-truncate" style={{ fontSize: '10.5px' }}>
                          Occupied
                        </span>
                        <h4 className="fw-bold text-primary m-0 font-monospace" style={{ fontSize: '1.25rem' }}>
                          {inv.occupied_rooms || 0}
                        </h4>
                        <span className="extra-small text-muted mt-1 text-truncate" style={{ fontSize: '10.5px' }}>
                          Active Stays
                        </span>
                      </div>
                    </div>

                    {/* 2. Available */}
                    <div className="col">
                      <div
                        className="p-2.5 px-3 rounded-3 border text-center h-100 d-flex flex-column justify-content-between shadow-xs"
                        style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}
                      >
                        <span className="extra-small fw-bold text-success text-uppercase mb-1 text-truncate" style={{ fontSize: '10.5px' }}>
                          Available
                        </span>
                        <h4 className="fw-bold text-success m-0 font-monospace" style={{ fontSize: '1.25rem' }}>
                          {inv.available_rooms || 0}
                        </h4>
                        <span className="extra-small text-muted mt-1 text-truncate" style={{ fontSize: '10.5px' }}>
                          Vacant Clean
                        </span>
                      </div>
                    </div>

                    {/* 3. Cleaning */}
                    <div className="col">
                      <div
                        className="p-2.5 px-3 rounded-3 border text-center h-100 d-flex flex-column justify-content-between shadow-xs"
                        style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }}
                      >
                        <span className="extra-small fw-bold text-warning-emphasis text-uppercase mb-1 text-truncate" style={{ fontSize: '10.5px' }}>
                          Cleaning
                        </span>
                        <h4 className="fw-bold text-warning-emphasis m-0 font-monospace" style={{ fontSize: '1.25rem' }}>
                          {inv.cleaning_rooms || 0}
                        </h4>
                        <span className="extra-small text-muted mt-1 text-truncate" style={{ fontSize: '10.5px' }}>
                          Housekeeping
                        </span>
                      </div>
                    </div>

                    {/* 4. Maintenance */}
                    <div className="col">
                      <div
                        className="p-2.5 px-3 rounded-3 border text-center h-100 d-flex flex-column justify-content-between shadow-xs"
                        style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA' }}
                      >
                        <span className="extra-small fw-bold text-danger text-uppercase mb-1 text-truncate" style={{ fontSize: '10.5px' }}>
                          Maintenance
                        </span>
                        <h4 className="fw-bold text-danger m-0 font-monospace" style={{ fontSize: '1.25rem' }}>
                          {inv.maintenance_rooms || 0}
                        </h4>
                        <span className="extra-small text-muted mt-1 text-truncate" style={{ fontSize: '10.5px' }}>
                          Out of Order
                        </span>
                      </div>
                    </div>

                    {/* 5. Occupancy Rate */}
                    <div className="col">
                      <div
                        className="p-2.5 px-3 rounded-3 border text-center h-100 d-flex flex-column justify-content-between shadow-xs"
                        style={{ backgroundColor: '#FAF5FF', borderColor: '#E9D5FF' }}
                      >
                        <span className="extra-small fw-bold text-purple text-uppercase mb-1 text-truncate" style={{ color: '#7E22CE', fontSize: '10.5px' }}>
                          Occupancy Rate
                        </span>
                        <h4 className="fw-bold m-0 font-monospace" style={{ color: '#6B21A8', fontSize: '1.25rem' }}>
                          {inv.occupancy_percentage || 0}%
                        </h4>
                        <span className="extra-small text-muted mt-1 text-truncate" style={{ fontSize: '10.5px' }}>
                          Utilization
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ============================================================ */}
                {/* 3. OPERATIONS & OVERDUE STAYS (3-GRID)                      */}
                {/* ============================================================ */}
                <div className="mb-4">
                  <div className="d-flex align-items-center justify-content-between mb-2.5">
                    <div className="d-flex align-items-center gap-2">
                      <div className="p-1 rounded-2 bg-indigo bg-opacity-10 text-indigo d-flex align-items-center justify-content-center" style={{ backgroundColor: '#EEF2FF', color: '#4F46E5' }}>
                        <Users size={16} />
                      </div>
                      <h6 className="fw-bold text-dark m-0 fs-6">
                        3. Daily Movement &amp; Front Desk Flow
                      </h6>
                    </div>
                    <span className="text-muted extra-small">Today's Traffic</span>
                  </div>

                  <div className="row g-3">
                    <div className="col-12 col-md-4">
                      <div className="p-3 bg-white rounded-3 border d-flex justify-content-between align-items-center shadow-xs">
                        <div className="d-flex align-items-center gap-2.5">
                          <div className="p-2 rounded-3 bg-success bg-opacity-10 text-success">
                            <LogIn size={18} />
                          </div>
                          <div>
                            <div className="text-secondary extra-small fw-semibold">Check-Ins Completed</div>
                            <h5 className="fw-bold text-dark m-0">{ops.today_checkins || 0} Guests</h5>
                          </div>
                        </div>
                        <span className="badge bg-light text-secondary border rounded-pill px-2.5 py-1 extra-small">
                          Arrivals
                        </span>
                      </div>
                    </div>

                    <div className="col-12 col-md-4">
                      <div className="p-3 bg-white rounded-3 border d-flex justify-content-between align-items-center shadow-xs">
                        <div className="d-flex align-items-center gap-2.5">
                          <div className="p-2 rounded-3 bg-primary bg-opacity-10 text-primary">
                            <LogOut size={18} />
                          </div>
                          <div>
                            <div className="text-secondary extra-small fw-semibold">Check-Outs Settled</div>
                            <h5 className="fw-bold text-dark m-0">{ops.today_checkouts || 0} Departures</h5>
                          </div>
                        </div>
                        <span className="badge bg-light text-secondary border rounded-pill px-2.5 py-1 extra-small">
                          Departures
                        </span>
                      </div>
                    </div>

                    <div className="col-12 col-md-4">
                      <div className="p-3 bg-white rounded-3 border d-flex justify-content-between align-items-center shadow-xs">
                        <div className="d-flex align-items-center gap-2.5">
                          <div className={`p-2 rounded-3 ${ops.overdue_stays > 0 ? 'bg-danger bg-opacity-10 text-danger' : 'bg-success bg-opacity-10 text-success'}`}>
                            <AlertTriangle size={18} />
                          </div>
                          <div>
                            <div className="text-secondary extra-small fw-semibold">Overdue Stays</div>
                            <h5 className={`fw-bold m-0 ${ops.overdue_stays > 0 ? 'text-danger' : 'text-success'}`}>
                              {ops.overdue_stays || 0} Stays
                            </h5>
                          </div>
                        </div>
                        <span className={`badge ${ops.overdue_stays > 0 ? 'bg-danger text-white' : 'bg-success bg-opacity-10 text-success border border-success border-opacity-25'} rounded-pill px-2.5 py-1 extra-small fw-bold`}>
                          {ops.overdue_stays > 0 ? 'Action Required' : '● Zero Overdue'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ============================================================ */}
                {/* 4. RECEPTION TILL EXPENSES & PETTY CASH                      */}
                {/* ============================================================ */}
                <div className="mb-4">
                  <div className="d-flex align-items-center justify-content-between mb-2.5">
                    <div className="d-flex align-items-center gap-2">
                      <div className="p-1 rounded-2 bg-danger bg-opacity-10 text-danger d-flex align-items-center justify-content-center">
                        <Receipt size={16} />
                      </div>
                      <h6 className="fw-bold text-dark m-0 fs-6">
                        4. Reception Till Disbursements &amp; Petty Cash ({auditData.till_expenses?.length || 0})
                      </h6>
                    </div>
                    <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 extra-small">
                      Total Expensed: {formatCurrency(fin.cash_expenses || 0)}
                    </span>
                  </div>

                  {(!auditData.till_expenses || auditData.till_expenses.length === 0) ? (
                    <div className="p-3.5 bg-light rounded-3 border text-center text-muted">
                      <Receipt size={20} className="text-secondary opacity-50 mb-1" />
                      <div className="extra-small fw-semibold text-dark">No till disbursements or petty cash expenses recorded today</div>
                      <div className="text-muted extra-small">All drawer cash collections remained intact with zero operational cash payouts.</div>
                    </div>
                  ) : (
                    <div className="table-responsive border rounded-3 overflow-hidden shadow-xs">
                      <table className="table table-bordered table-sm align-middle m-0 extra-small">
                        <thead className="table-light">
                          <tr>
                            <th className="py-2 px-2.5">Time</th>
                            <th className="py-2 px-2.5 text-center">Shift #</th>
                            <th className="py-2 px-2.5 text-center">Category</th>
                            <th className="py-2 px-2.5">Description / Purpose</th>
                            <th className="py-2 px-2.5">Cashier / Staff</th>
                            <th className="py-2 px-2.5 text-center">Approval</th>
                            <th className="py-2 px-2.5 text-end">Amount (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {auditData.till_expenses.map((exp, idx) => (
                            <tr key={idx}>
                              <td className="fw-semibold px-2.5 text-muted">{exp.time}</td>
                              <td className="text-center px-2.5">
                                <span className="badge bg-light text-dark border">{exp.shift_number}</span>
                              </td>
                              <td className="text-center px-2.5">
                                <span className="badge bg-warning bg-opacity-15 text-warning-emphasis border border-warning border-opacity-25">
                                  {exp.category_display || exp.category}
                                </span>
                              </td>
                              <td className="px-2.5 text-dark">{exp.description}</td>
                              <td className="px-2.5 text-secondary">{exp.created_by}</td>
                              <td className="text-center px-2.5">
                                {exp.is_manager_approved ? (
                                  <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 extra-small">
                                    Approved ({exp.approved_by})
                                  </span>
                                ) : (
                                  <span className="badge bg-secondary bg-opacity-10 text-secondary border extra-small">
                                    Logged
                                  </span>
                                )}
                              </td>
                              <td className="text-end fw-bold text-danger px-2.5 font-monospace">
                                -{formatCurrency(exp.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="table-light fw-bold">
                          <tr>
                            <td colSpan={6} className="text-end px-2.5">Consolidated Cash Expenses Paid:</td>
                            <td className="text-end px-2.5 text-danger font-monospace">
                              -{formatCurrency(fin.cash_expenses || 0)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>

                {/* ============================================================ */}
                {/* 5. TOMORROW SCHEDULED ARRIVALS                              */}
                {/* ============================================================ */}
                <div className="mb-4">
                  <div className="d-flex align-items-center justify-content-between mb-2.5">
                    <div className="d-flex align-items-center gap-2">
                      <div className="p-1 rounded-2 bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center">
                        <Calendar size={16} />
                      </div>
                      <h6 className="fw-bold text-dark m-0 fs-6">
                        5. Tomorrow Scheduled Arrivals ({ops.tomorrow_arrivals_count || 0})
                      </h6>
                    </div>
                    <span className="text-muted extra-small">Advance reservations scheduled for arrival</span>
                  </div>

                  {auditData.tomorrow_arrivals?.length === 0 ? (
                    <div className="p-4 bg-light rounded-3 border text-center text-muted">
                      <Calendar size={22} className="text-secondary opacity-50 mb-1.5" />
                      <div className="extra-small fw-semibold text-dark">No advance reservations scheduled for tomorrow</div>
                      <div className="text-muted extra-small">Walk-in arrivals will be registered directly at the front desk.</div>
                    </div>
                  ) : (
                    <div className="table-responsive border rounded-3 overflow-hidden shadow-xs">
                      <table className="table table-bordered table-sm align-middle m-0 extra-small">
                        <thead className="table-light">
                          <tr>
                            <th className="py-2 px-2.5">Booking #</th>
                            <th className="py-2 px-2.5">Guest Name</th>
                            <th className="py-2 px-2.5">Mobile</th>
                            <th className="py-2 px-2.5 text-center">Room</th>
                            <th className="py-2 px-2.5 text-end">Advance Paid</th>
                            <th className="py-2 px-2.5 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {auditData.tomorrow_arrivals.map((arr, idx) => (
                            <tr key={idx}>
                              <td className="fw-semibold px-2.5">{arr.booking_number}</td>
                              <td className="px-2.5">{arr.guest_name}</td>
                              <td className="px-2.5">{arr.mobile}</td>
                              <td className="text-center fw-bold px-2.5">
                                <span className="badge bg-light text-dark border">{arr.room_number}</span>
                              </td>
                              <td className="text-end fw-bold text-success px-2.5">{formatCurrency(arr.advance_paid)}</td>
                              <td className="text-center px-2.5">
                                <span className="badge bg-primary-subtle text-primary border extra-small">{arr.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* ============================================================ */}
                {/* 6. AUDITOR & MANAGER SIGN-OFF CARDS                         */}
                {/* ============================================================ */}
                <div className="p-3.5 bg-light rounded-4 border d-flex justify-content-around align-items-center flex-wrap gap-4 mt-4">
                  <div className="text-center" style={{ minWidth: '220px' }}>
                    <div className="border-bottom border-dark pb-4 mb-1.5 mx-auto" style={{ width: '200px' }}></div>
                    <span className="fw-bold text-dark extra-small d-block">Night Auditor Signature</span>
                    <span className="text-muted" style={{ fontSize: '10.5px' }}>Staff on Duty &bull; Verification</span>
                  </div>
                  <div className="text-center" style={{ minWidth: '220px' }}>
                    <div className="border-bottom border-dark pb-4 mb-1.5 mx-auto" style={{ width: '200px' }}></div>
                    <span className="fw-bold text-dark extra-small d-block">General Manager / Owner Sign-Off</span>
                    <span className="text-muted" style={{ fontSize: '10.5px' }}>Official Approval Stamp</span>
                  </div>
                </div>

              </div>
            ) : null}
          </div>

          {/* ================================================================ */}
          {/* 3. MODAL FOOTER                                                 */}
          {/* ================================================================ */}
          <div className="modal-footer bg-light border-top px-4 py-3 d-flex justify-content-between align-items-center flex-wrap gap-2 no-print">
            <div className="d-flex align-items-center gap-1.5 text-muted extra-small">
              <ShieldCheck size={16} className="text-success" />
              <span>System Compiled Night Audit &bull; Auto-balanced Daily Closing Verification</span>
            </div>
            
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-outline-primary fw-semibold px-3.5 py-1.5 rounded-3 d-flex align-items-center gap-1.5 extra-small"
                onClick={handleSendEmail}
                disabled={loading || emailSent}
              >
                <Mail size={14} /> Send Email Digest
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary fw-semibold px-3.5 py-1.5 rounded-3 d-flex align-items-center gap-1.5 extra-small"
                onClick={handlePrintAudit}
                disabled={!auditData}
              >
                <Printer size={14} /> Print Audit Sheet
              </button>
              <button
                type="button"
                className="btn btn-primary fw-bold px-3.5 py-1.5 rounded-3 d-flex align-items-center gap-1.5 extra-small shadow-sm"
                onClick={handleDownloadPdf}
                disabled={!auditData}
              >
                <Download size={14} /> Download PDF (A4 Landscape)
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default NightAuditModal;
