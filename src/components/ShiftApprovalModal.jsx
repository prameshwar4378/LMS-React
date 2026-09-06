import React, { useState, useEffect } from 'react';
import { approveShiftDiscrepancyApi, rejectShiftDiscrepancyApi } from '../api/shiftApi';
import { formatCurrency } from '../utils/formatCurrency';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  User,
  Clock
} from 'lucide-react';

const ShiftApprovalModal = ({ isOpen, onClose, onSuccess, shift }) => {
  const [approvalNotes, setApprovalNotes] = useState('');
  const [actionType, setActionType] = useState('APPROVE'); // 'APPROVE' | 'REJECT'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setApprovalNotes('');
      setActionType('APPROVE');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || !shift) return null;

  const fin = shift.financials || {};
  const diff = shift.cash_difference || 0;
  const isShortage = diff < 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (actionType === 'REJECT' && !approvalNotes.trim()) {
      setError('A mandatory explanation note is required when rejecting shift reconciliation.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (actionType === 'APPROVE') {
        const res = await approveShiftDiscrepancyApi(shift.id, { approval_notes: approvalNotes });
        if (onSuccess) onSuccess(res.data);
      } else {
        const res = await rejectShiftDiscrepancyApi(shift.id, { rejection_notes: approvalNotes });
        if (onSuccess) onSuccess(res.data);
      }
      onClose();
    } catch (err) {
      console.error('Failed to process shift approval/rejection:', err);
      const errMsg = err.response?.data?.message || 'Failed to submit decision. Please try again.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '520px' }}>
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          
          <div className="modal-header border-0 text-white p-4" style={{ background: 'linear-gradient(135deg, #09204c 0%, #1E3A8A 100%)' }}>
            <div className="d-flex align-items-center gap-3">
              <div
                className="d-flex align-items-center justify-content-center text-white rounded-3 shadow-xs"
                style={{ width: '40px', height: '40px', backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
              >
                <ShieldCheck size={22} />
              </div>
              <div>
                <h5 className="modal-title fw-bold text-white mb-0" style={{ letterSpacing: '-0.02em' }}>
                  Manager Discrepancy Review
                </h5>
                <span className="text-white-50 small" style={{ fontSize: '0.8rem' }}>
                  Shift #{shift.shift_number} &bull; {shift.user_name}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              disabled={loading}
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4 bg-light">
              
              {error && (
                <div className="alert alert-danger border-danger d-flex align-items-start gap-2 rounded-3 p-3 mb-3 small">
                  <AlertTriangle size={16} className="text-danger flex-shrink-0 mt-0.5" />
                  <div>{error}</div>
                </div>
              )}

              {/* Discrepancy Card */}
              <div className="card border-0 shadow-xs p-3 rounded-3 bg-white mb-3" style={{ border: '1px solid #E2E8F0' }}>
                <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                  <span className="text-secondary extra-small fw-bold text-uppercase">TILL RECONCILIATION SUMMARY</span>
                  <span className={`badge px-2.5 py-1 rounded-pill extra-small fw-bold ${isShortage ? 'bg-danger text-white' : 'bg-warning text-dark'}`}>
                    {isShortage ? `Shortage: ${formatCurrency(Math.abs(diff))}` : `Excess: +${formatCurrency(diff)}`}
                  </span>
                </div>

                <div className="row g-2 text-center small mb-2">
                  <div className="col-4 border-end">
                    <div className="text-secondary extra-small">Expected Cash</div>
                    <div className="fw-bold text-dark">{formatCurrency(shift.expected_cash || 0)}</div>
                  </div>
                  <div className="col-4 border-end">
                    <div className="text-secondary extra-small">Actual Counted</div>
                    <div className="fw-bold text-dark">{formatCurrency(shift.actual_cash || 0)}</div>
                  </div>
                  <div className="col-4">
                    <div className="text-secondary extra-small">Difference</div>
                    <div className={`fw-bold ${isShortage ? 'text-danger' : 'text-warning-emphasis'}`}>
                      {isShortage ? formatCurrency(diff) : `+${formatCurrency(diff)}`}
                    </div>
                  </div>
                </div>

                {shift.difference_reason && (
                  <div className="p-2.5 rounded-2 bg-light border extra-small text-dark mt-1">
                    <strong>Receptionist Explanation:</strong>
                    <div className="text-secondary mt-0.5 fst-italic">"{shift.difference_reason}"</div>
                  </div>
                )}
              </div>

              {/* Action Selector */}
              <div className="mb-3">
                <label className="form-label fw-bold text-dark small mb-1.5">
                  Managerial Decision <span className="text-danger">*</span>
                </label>
                <div className="row g-2">
                  <div className="col-6">
                    <button
                      type="button"
                      className={`btn w-100 p-2.5 rounded-3 d-flex align-items-center justify-content-center gap-2 border fw-bold text-start ${
                        actionType === 'APPROVE' ? 'btn-success text-white shadow-xs border-success' : 'btn-white bg-white text-secondary'
                      }`}
                      style={{ fontSize: '0.85rem' }}
                      onClick={() => setActionType('APPROVE')}
                    >
                      <CheckCircle2 size={16} /> Approve &amp; Close Shift
                    </button>
                  </div>
                  <div className="col-6">
                    <button
                      type="button"
                      className={`btn w-100 p-2.5 rounded-3 d-flex align-items-center justify-content-center gap-2 border fw-bold text-start ${
                        actionType === 'REJECT' ? 'btn-danger text-white shadow-xs border-danger' : 'btn-white bg-white text-secondary'
                      }`}
                      style={{ fontSize: '0.85rem' }}
                      onClick={() => setActionType('REJECT')}
                    >
                      <XCircle size={16} /> Reject (Send for Recount)
                    </button>
                  </div>
                </div>
              </div>

              {/* Manager Notes */}
              <div className="mb-1">
                <label className="form-label fw-semibold text-secondary extra-small mb-1">
                  Manager Sign-off Remarks {actionType === 'REJECT' && <span className="text-danger">* (Required for rejection)</span>}
                </label>
                <textarea
                  className="form-control form-control-sm rounded-3"
                  rows={2}
                  style={{ borderColor: '#CBD5E1', fontSize: '0.85rem' }}
                  placeholder={actionType === 'APPROVE' ? 'e.g. Discrepancy reviewed and approved due to minor rounding variance.' : 'e.g. Please recount drawer cash and check physical vouchers again.'}
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  disabled={loading}
                />
              </div>

            </div>

            <div className="modal-footer border-top bg-white px-4 py-3 d-flex justify-content-between">
              <button
                type="button"
                className="btn btn-light text-secondary border px-3 py-2 rounded-3 small fw-semibold"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`btn px-4 py-2 rounded-3 small fw-bold shadow-xs d-flex align-items-center gap-1.5 text-white ${
                  actionType === 'APPROVE' ? 'btn-success' : 'btn-danger'
                }`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    Submitting...
                  </>
                ) : actionType === 'APPROVE' ? (
                  <>
                    <CheckCircle2 size={16} /> Approve &amp; Finalize Close
                  </>
                ) : (
                  <>
                    <XCircle size={16} /> Reject Reconciliation
                  </>
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

export default ShiftApprovalModal;
