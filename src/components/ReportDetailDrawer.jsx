import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Building2,
  User,
  Phone,
  CreditCard,
  Receipt,
  Calendar,
  Clock,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Tag,
  DollarSign,
  AlertCircle,
  FileText
} from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

const ReportDetailDrawer = ({ show, onClose, rowData, reportCategory }) => {
  const navigate = useNavigate();

  if (!show || !rowData) return null;

  const stayId = rowData.id && typeof rowData.id === 'number' ? rowData.id : null;
  const guestName = rowData.guest_name || rowData.customer_name || 'Guest Record';
  const mobile = rowData.mobile || '—';
  const roomNumber = rowData.room_number || '—';
  const stayNumber = rowData.stay_number || rowData.booking_number || '—';
  const status = rowData.status || 'Active';

  return (
    <div
      className="position-fixed top-0 end-0 bottom-0 start-0 d-flex justify-content-end"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)', zIndex: 1060, backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white h-100 shadow-2xl d-flex flex-column modal-dialog-animated"
        style={{ width: '100%', maxWidth: '480px', borderLeft: '1px solid #e2e8f0', zIndex: 1061 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* DRAWER HEADER */}
        <div className="p-4 border-bottom bg-dark text-white d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2.5 min-w-0">
            <div className="p-2.5 bg-primary text-white rounded-3 d-flex align-items-center justify-content-center flex-shrink-0">
              <Building2 size={20} />
            </div>
            <div className="min-w-0">
              <h6 className="fw-bold text-white m-0 text-truncate" style={{ fontSize: '1.05rem' }}>
                {stayNumber !== '—' ? `Record #${stayNumber}` : guestName}
              </h6>
              <span className="text-white-50 extra-small d-block mt-0.5">
                Room {roomNumber} &bull; {reportCategory?.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn-close btn-close-white shadow-none ms-2 flex-shrink-0"
            onClick={onClose}
          ></button>
        </div>

        {/* DRAWER BODY */}
        <div className="p-4 overflow-y-auto flex-grow-1 bg-light bg-opacity-30">
          
          {/* 1. GUEST IDENTITY CARD */}
          <div className="card border-0 shadow-sm rounded-4 mb-3 bg-white p-3.5">
            <div className="d-flex align-items-center gap-3 mb-2.5">
              <div
                className="p-2 bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold fs-5 flex-shrink-0"
                style={{ width: '46px', height: '46px' }}
              >
                {guestName ? guestName.charAt(0).toUpperCase() : 'G'}
              </div>
              <div className="min-w-0">
                <div className="fw-bold fs-6 text-dark text-truncate">{guestName}</div>
                <div className="text-secondary small d-flex align-items-center gap-1">
                  <Phone size={13} className="text-primary" /> {mobile}
                </div>
              </div>
            </div>

            {rowData.id_type && (
              <div className="p-2.5 bg-light rounded-3 border extra-small d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-1.5 text-secondary">
                  <ShieldCheck size={14} className="text-success" />
                  <span>{rowData.id_type}:</span>
                </div>
                <strong className="text-dark">{rowData.id_number || 'On File'}</strong>
              </div>
            )}
          </div>

          {/* 2. STAY / RESERVATION SCHEDULE */}
          <div className="card border-0 shadow-sm rounded-4 mb-3 bg-white p-3.5">
            <div className="fw-bold text-dark small mb-2.5 d-flex align-items-center gap-1.5">
              <Calendar size={15} className="text-primary" /> Stay Schedule &amp; Allocation
            </div>
            <div className="d-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="p-2.5 bg-light rounded-3 border">
                <span className="text-secondary extra-small d-block mb-0.5">Check-In</span>
                <strong className="text-dark small d-block">{rowData.check_in || rowData.check_in_date || rowData.arrival_date || '—'}</strong>
              </div>
              <div className="p-2.5 bg-light rounded-3 border">
                <span className="text-secondary extra-small d-block mb-0.5">Check-Out</span>
                <strong className="text-dark small d-block">{rowData.actual_checkout || rowData.expected_checkout || rowData.checkout_date || '—'}</strong>
              </div>
              <div className="p-2.5 bg-light rounded-3 border">
                <span className="text-secondary extra-small d-block mb-0.5">Room &amp; Type</span>
                <strong className="text-dark small d-block">Room {roomNumber}</strong>
              </div>
              <div className="p-2.5 bg-light rounded-3 border">
                <span className="text-secondary extra-small d-block mb-0.5">Status</span>
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle extra-small fw-bold">
                  {status}
                </span>
              </div>
            </div>
          </div>

          {/* 3. FINANCIAL & FOLIO BREAKDOWN */}
          {(rowData.grand_total !== undefined || rowData.amount !== undefined || rowData.total_spend !== undefined) && (
            <div className="card border-0 shadow-sm rounded-4 mb-3 bg-white p-3.5">
              <div className="fw-bold text-dark small mb-2.5 d-flex align-items-center gap-1.5">
                <Receipt size={15} className="text-primary" /> Financial Audit Ledger
              </div>

              <div className="d-flex flex-column gap-2 small">
                {rowData.room_rate !== undefined && (
                  <div className="d-flex justify-content-between text-secondary">
                    <span>Agreed Room Tariff:</span>
                    <strong className="text-dark">{formatCurrency(rowData.room_rate)} / night</strong>
                  </div>
                )}
                {rowData.nights !== undefined && (
                  <div className="d-flex justify-content-between text-secondary">
                    <span>Duration:</span>
                    <strong className="text-dark">{rowData.nights} Night(s)</strong>
                  </div>
                )}
                {rowData.extra_charges !== undefined && rowData.extra_charges > 0 && (
                  <div className="d-flex justify-content-between text-secondary">
                    <span>Extra Services / Add-ons:</span>
                    <span className="text-warning fw-semibold">+{formatCurrency(rowData.extra_charges)}</span>
                  </div>
                )}
                {rowData.discount !== undefined && rowData.discount > 0 && (
                  <div className="d-flex justify-content-between text-secondary">
                    <span>Discount Applied:</span>
                    <span className="text-danger fw-semibold">-{formatCurrency(rowData.discount)}</span>
                  </div>
                )}
                {rowData.tax_amount !== undefined && (
                  <div className="d-flex justify-content-between text-secondary">
                    <span>GST Output Tax:</span>
                    <span className="text-success fw-semibold">+{formatCurrency(rowData.tax_amount)}</span>
                  </div>
                )}

                <div className="border-top pt-2 mt-1 d-flex justify-content-between align-items-center">
                  <span className="fw-bold text-dark">Total Folio Value:</span>
                  <strong className="fs-6 text-dark">{formatCurrency(rowData.grand_total || rowData.total_revenue || rowData.amount || rowData.total_spend || 0)}</strong>
                </div>

                {rowData.total_paid !== undefined && (
                  <div className="d-flex justify-content-between text-success">
                    <span>Total Paid Collections:</span>
                    <strong>{formatCurrency(rowData.total_paid)}</strong>
                  </div>
                )}

                {rowData.balance !== undefined && (
                  <div className={`p-2.5 rounded-3 border d-flex justify-content-between align-items-center mt-1 ${rowData.balance > 0.01 ? 'bg-danger-subtle border-danger-subtle text-danger' : 'bg-success-subtle border-success-subtle text-success'}`}>
                    <span className="extra-small fw-bold text-uppercase">Balance Due:</span>
                    <strong className="fs-6 fw-bold">
                      {rowData.balance > 0.01 ? formatCurrency(rowData.balance) : '₹0.00 (Settled)'}
                    </strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. REMARKS / REASONS */}
          {(rowData.notes || rowData.reason || rowData.special_requests) && (
            <div className="card border-0 shadow-sm rounded-4 mb-3 bg-white p-3.5">
              <div className="fw-bold text-dark extra-small text-uppercase mb-1">Notes &amp; Remarks</div>
              <div className="text-secondary small" style={{ lineHeight: 1.5 }}>
                {rowData.notes || rowData.reason || rowData.special_requests}
              </div>
            </div>
          )}

        </div>

        {/* DRAWER FOOTER WITH ACTIONS */}
        <div className="p-3.5 border-top bg-white d-flex align-items-center justify-content-between gap-2">
          <button type="button" className="btn btn-light border fw-semibold py-2 px-3 rounded-3" onClick={onClose}>
            Close
          </button>

          {stayId && (
            <button
              type="button"
              className="btn btn-primary fw-bold py-2 px-3.5 rounded-3 shadow-xs d-flex align-items-center gap-1.5"
              onClick={() => {
                onClose();
                navigate(`/stays/${stayId}`);
              }}
            >
              <ExternalLink size={15} /> Open Stay Details
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default ReportDetailDrawer;
