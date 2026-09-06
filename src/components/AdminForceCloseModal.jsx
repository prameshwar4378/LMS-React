import React, { useState } from 'react';
import { formatCurrency } from '../utils/formatCurrency';
import {
  ShieldAlert,
  AlertTriangle,
  Lock,
  CheckCircle2,
  X
} from 'lucide-react';
import { forceCloseShiftApi } from '../api/shiftApi';

const AdminForceCloseModal = ({ isOpen, onClose, onSuccess, shift }) => {
  const [reason, setReason] = useState('');
  const [actualCash, setActualCash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !shift) return null;

  const expectedCash = parseFloat(shift?.financials?.expected_cash ?? shift?.expected_cash ?? 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a mandatory administrative reason for force closing this shift.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        reason: reason.trim(),
        actual_cash: actualCash !== '' ? parseFloat(actualCash) : expectedCash
      };

      const res = await forceCloseShiftApi(shift.id, payload);
      if (onSuccess) {
        onSuccess(res.data || res);
      }
      onClose();
    } catch (err) {
      console.error('Failed to force close shift:', err);
      const errMsg = err.response?.data?.message || 'Failed to force close shift.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '480px' }}>
        <div className="modal-content border-0 shadow-xl rounded-4 overflow-hidden">
          
          <div className="modal-header border-0 text-white p-4" style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)' }}>
            <div className="d-flex align-items-center gap-3">
              <div
                className="d-flex align-items-center justify-content-center text-white rounded-3 shadow-xs"
                style={{ width: '42px', height: '42px', backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              >
                <ShieldAlert size={22} />
              </div>
              <div>
                <h5 className="modal-title fw-bold text-white mb-0" style={{ letterSpacing: '-0.02em' }}>
                  Admin Forced Till Closure
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
              
              <div className="alert alert-warning border-warning d-flex align-items-start gap-2.5 rounded-3 p-3 mb-3 small">
                <AlertTriangle size={17} className="text-warning-emphasis flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Emergency Administrative Action:</strong> Use this only when a cashier has left without reconciling their drawer till or the shift has been abandoned.
                </div>
              </div>

              {error && (
                <div className="alert alert-danger border-danger d-flex align-items-start gap-2 rounded-3 p-3 mb-3 small">
                  <X size={16} className="text-danger flex-shrink-0 mt-0.5" />
                  <div>{error}</div>
                </div>
              )}

              <div className="card border-0 shadow-xs p-3 rounded-3 bg-white mb-3" style={{ border: '1px solid #E2E8F0' }}>
                <div className="row g-2 text-center" style={{ fontSize: '0.85rem' }}>
                  <div className="col-6 border-end">
                    <div className="text-secondary extra-small">Expected Drawer Cash</div>
                    <div className="fw-bold text-primary fs-5 mt-0.5 font-monospace">{formatCurrency(expectedCash)}</div>
                  </div>
                  <div className="col-6">
                    <div className="text-secondary extra-small">Shift Session Duration</div>
                    <div className="fw-bold text-dark fs-5 mt-0.5 font-monospace">
                      {Math.floor((shift.duration_minutes || 0) / 60)}h {(shift.duration_minutes || 0) % 60}m
                    </div>
                  </div>
                </div>
              </div>

              {/* Physical Cash Counted (Optional override) */}
              <div className="mb-3">
                <label className="form-label fw-bold text-dark small mb-1">
                  Physically Counted Cash (Optional)
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0 fw-bold text-secondary">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control fw-bold font-monospace border-start-0"
                    placeholder={`Defaults to expected ${formatCurrency(expectedCash)}`}
                    value={actualCash}
                    onChange={(e) => setActualCash(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <span className="text-muted extra-small mt-1 d-block">
                  If left empty, system uses expected balance of {formatCurrency(expectedCash)}.
                </span>
              </div>

              {/* Administrative Reason */}
              <div className="mb-2">
                <label className="form-label fw-bold text-dark small mb-1">
                  Administrative Force-Close Reason <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control rounded-3"
                  rows={2}
                  style={{ borderColor: '#CBD5E1', fontSize: '0.85rem' }}
                  placeholder="e.g. Receptionist left for day without closing shift. Till keys verified by Duty Manager."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
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
                className="btn btn-danger px-4 py-2 rounded-3 small fw-bold shadow-xs d-flex align-items-center gap-1.5"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    Force Closing...
                  </>
                ) : (
                  <>
                    <Lock size={16} /> Confirm Forced Close
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

export default AdminForceCloseModal;
