import React, { useState, useEffect } from 'react';
import { addShiftAdjustmentApi } from '../api/shiftApi';
import {
  ArrowLeftRight,
  PlusCircle,
  MinusCircle,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';

const ShiftAdjustmentModal = ({ isOpen, onClose, onSuccess, shift }) => {
  const [adjustmentType, setAdjustmentType] = useState('ADD_CASH');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setAdjustmentType('ADD_CASH');
      setAmount('');
      setReason('');
      setNotes('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || !shift) return null;

  const isAdd = adjustmentType === 'ADD_CASH';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      setError('Please enter a valid positive adjustment amount.');
      return;
    }
    if (!reason.trim()) {
      setError('Please enter a mandatory justification reason.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        adjustment_type: adjustmentType,
        amount: val,
        reason: reason.trim(),
        notes: notes.trim() || undefined
      };

      const res = await addShiftAdjustmentApi(shift.id, payload);
      if (onSuccess) {
        onSuccess(res.data);
      }
      onClose();
    } catch (err) {
      console.error('Failed to add cash adjustment:', err);
      const errMsg = err.response?.data?.message || 'Failed to record cash adjustment. Please check inputs.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '480px' }}>
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          
          <div className="modal-header border-0 text-white p-4" style={{ background: 'linear-gradient(135deg, #09204c 0%, #1E3A8A 100%)' }}>
            <div className="d-flex align-items-center gap-3">
              <div
                className="d-flex align-items-center justify-content-center text-white rounded-3 shadow-xs"
                style={{ width: '40px', height: '40px', backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
              >
                <ArrowLeftRight size={20} />
              </div>
              <div>
                <h5 className="modal-title fw-bold text-white mb-0" style={{ letterSpacing: '-0.02em' }}>
                  Cash Adjustment (Float In / Out)
                </h5>
                <span className="text-white-50 small" style={{ fontSize: '0.8rem' }}>
                  Shift #{shift.shift_number} &bull; Adjust physical till cash
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
                  <AlertCircle size={16} className="text-danger flex-shrink-0 mt-0.5" />
                  <div>{error}</div>
                </div>
              )}

              {/* Adjustment Type Switcher */}
              <div className="mb-3">
                <label className="form-label fw-bold text-dark small mb-1.5">
                  Adjustment Type <span className="text-danger">*</span>
                </label>
                <div className="row g-2">
                  <div className="col-6">
                    <button
                      type="button"
                      className={`btn w-100 p-2.5 rounded-3 d-flex align-items-center justify-content-center gap-2 border fw-bold text-start ${
                        isAdd ? 'btn-success text-white shadow-xs border-success' : 'btn-white bg-white text-secondary'
                      }`}
                      style={{ fontSize: '0.85rem' }}
                      onClick={() => setAdjustmentType('ADD_CASH')}
                    >
                      <PlusCircle size={16} /> Add Cash (Float In)
                    </button>
                  </div>
                  <div className="col-6">
                    <button
                      type="button"
                      className={`btn w-100 p-2.5 rounded-3 d-flex align-items-center justify-content-center gap-2 border fw-bold text-start ${
                        !isAdd ? 'btn-danger text-white shadow-xs border-danger' : 'btn-white bg-white text-secondary'
                      }`}
                      style={{ fontSize: '0.85rem' }}
                      onClick={() => setAdjustmentType('REMOVE_CASH')}
                    >
                      <MinusCircle size={16} /> Remove (Bank Drop)
                    </button>
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div className="mb-3">
                <label className="form-label fw-bold text-dark small mb-1">
                  Cash Amount (₹) <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0 fw-bold text-secondary">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    className="form-control fw-bold fs-5 border-start-0"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    disabled={loading}
                    autoFocus
                  />
                </div>
              </div>

              {/* Justification Reason */}
              <div className="mb-3">
                <label className="form-label fw-bold text-dark small mb-1">
                  Reason <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control rounded-3"
                  style={{ borderColor: '#CBD5E1', fontSize: '0.875rem' }}
                  placeholder={isAdd ? 'e.g. Additional float injected by Manager' : 'e.g. Mid-day cash drop to safety locker'}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {/* Additional Notes */}
              <div className="mb-1">
                <label className="form-label fw-semibold text-secondary extra-small mb-1">
                  Internal Remarks (Optional)
                </label>
                <textarea
                  className="form-control form-control-sm rounded-3"
                  rows={2}
                  style={{ borderColor: '#CBD5E1', fontSize: '0.85rem' }}
                  placeholder="Additional till audit details..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                  isAdd ? 'btn-success' : 'btn-danger'
                }`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} /> {isAdd ? 'Add Cash to Till' : 'Remove Cash from Till'}
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

export default ShiftAdjustmentModal;
