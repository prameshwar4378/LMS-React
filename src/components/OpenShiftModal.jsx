import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatCurrency';
import { openShiftApi, getCashDrawersApi } from '../api/shiftApi';
import {
  Clock,
  DollarSign,
  AlertTriangle,
  User,
  Calendar,
  CheckCircle2,
  X,
  FileText,
  ArrowRight,
  Building2,
  Calculator
} from 'lucide-react';

const STANDARD_DENOMINATIONS = [
  { key: '500', label: '₹500 Notes', value: 500 },
  { key: '200', label: '₹200 Notes', value: 200 },
  { key: '100', label: '₹100 Notes', value: 100 },
  { key: '50', label: '₹50 Notes', value: 50 },
  { key: '20', label: '₹20 Notes', value: 20 },
  { key: '10', label: '₹10 Notes', value: 10 },
  { key: '5', label: '₹5 Coins / Notes', value: 5 },
  { key: 'COINS', label: '₹1 / ₹2 Loose Coins', value: 1 }
];

const OpenShiftModal = ({ isOpen, onClose, onSuccess, initialSuggestedBalance = 0, pendingHandovers = [] }) => {
  const { user } = useAuth();
  
  const [openingBalance, setOpeningBalance] = useState(0);
  const [showDenominations, setShowDenominations] = useState(false);
  const [counts, setCounts] = useState({
    '500': 0, '200': 0, '100': 0, '50': 0, '20': 0, '10': 0, '5': 0, 'COINS': 0
  });
  const [openingNotes, setOpeningNotes] = useState('');
  const [selectedHandoverId, setSelectedHandoverId] = useState('');
  const [cashDrawers, setCashDrawers] = useState([]);
  const [selectedDrawerId, setSelectedDrawerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      // Load Cash Drawers
      getCashDrawersApi()
        .then((res) => {
          const list = res.data || [];
          setCashDrawers(list);
          const firstAvail = list.find(d => !d.is_in_use || d.allow_shared_users);
          if (firstAvail) {
            setSelectedDrawerId(firstAvail.id);
          }
        })
        .catch(console.error);

      if (pendingHandovers && pendingHandovers.length > 0) {
        setSelectedHandoverId(pendingHandovers[0].id);
        setOpeningBalance(pendingHandovers[0].amount || 0);
        setOpeningNotes(`Opened via accepted handover of ₹${pendingHandovers[0].amount} from ${pendingHandovers[0].from_user_name}`);
      } else {
        setSelectedHandoverId('');
        const prevClosing = parseFloat(initialSuggestedBalance || 0);
        setOpeningBalance(prevClosing);
        setOpeningNotes('');
      }
      setError(null);
    }
  }, [isOpen, initialSuggestedBalance, pendingHandovers]);

  if (!isOpen) return null;

  const suggested = parseFloat(initialSuggestedBalance || 0);
  const entered = parseFloat(openingBalance || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (entered < 0 || isNaN(entered)) {
      setError('Opening cash balance cannot be negative.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        opening_balance: entered,
        opening_notes: openingNotes,
        handover_id: selectedHandoverId || undefined,
        cash_drawer: selectedDrawerId || undefined
      };
      const res = await openShiftApi(payload);
      if (onSuccess) {
        onSuccess(res.data);
      }
      onClose();
    } catch (err) {
      console.error('Failed to open shift:', err);
      const errMsg = err.response?.data?.message || err.response?.data?.errors?.shift?.[0] || err.response?.data?.errors?.cash_drawer?.[0] || 'Failed to open shift. Please try again.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const handleDenomChange = (key, value) => {
    const parsed = parseInt(value, 10);
    const validQty = isNaN(parsed) || parsed < 0 ? 0 : parsed;
    const newCounts = { ...counts, [key]: validQty };
    setCounts(newCounts);
    const total = STANDARD_DENOMINATIONS.reduce((sum, d) => sum + ((newCounts[d.key] || 0) * d.value), 0);
    setOpeningBalance(total);
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: showDenominations ? '620px' : '520px' }}>
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          
          {/* Header Banner */}
          <div className="modal-header border-0 text-white p-4" style={{ background: 'linear-gradient(135deg, #09204c 0%, #1E3A8A 100%)' }}>
            <div className="d-flex align-items-center gap-3">
              <div
                className="d-flex align-items-center justify-content-center text-white rounded-3 shadow-xs"
                style={{ width: '42px', height: '42px', backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
              >
                <Clock size={22} />
              </div>
              <div>
                <h5 className="modal-title fw-bold text-white mb-0" style={{ letterSpacing: '-0.02em' }}>
                  Open Reception Shift
                </h5>
                <span className="text-white-50 small" style={{ fontSize: '0.8rem' }}>
                  Initialize live drawer till &amp; begin duty session
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
              
              {/* Staff & Session Info Card */}
              <div className="card border-0 shadow-xs p-3 rounded-3 bg-white mb-3" style={{ border: '1px solid #E2E8F0' }}>
                <div className="row g-2">
                  <div className="col-6">
                    <div className="d-flex align-items-center gap-2 text-secondary extra-small mb-1">
                      <User size={13} className="text-primary" /> Receptionist
                    </div>
                    <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.875rem' }}>
                      {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username || 'Staff'}
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="d-flex align-items-center gap-2 text-secondary extra-small mb-1">
                      <Calendar size={13} className="text-primary" /> Date &amp; Time
                    </div>
                    <div className="fw-semibold text-dark" style={{ fontSize: '0.825rem' }}>
                      {dateStr} &bull; {timeStr}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pending Handover Alert (if any) */}
              {pendingHandovers && pendingHandovers.length > 0 && (
                <div className="alert alert-info border-info d-flex align-items-start gap-2.5 rounded-3 p-3 mb-3">
                  <CheckCircle2 size={18} className="text-info flex-shrink-0 mt-0.5" />
                  <div className="small">
                    <strong className="d-block text-dark fw-bold mb-1">Incoming Shift Handover Detected</strong>
                    <span>
                      {pendingHandovers[0].from_user_name} handed over <strong>{formatCurrency(pendingHandovers[0].amount)}</strong> cash.
                    </span>
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div className="alert alert-danger border-danger d-flex align-items-start gap-2 rounded-3 p-3 mb-3 small">
                  <AlertTriangle size={16} className="text-danger flex-shrink-0 mt-0.5" />
                  <div>{error}</div>
                </div>
              )}

              {/* POS Register / Cash Drawer Selection (Only shown if multiple physical counters exist) */}
              {cashDrawers.length > 1 && (
                <div className="mb-3">
                  <label className="form-label fw-bold text-dark small mb-1.5 d-flex align-items-center gap-1.5">
                    <Building2 size={14} className="text-primary" /> Assigned Counter / Desk
                  </label>
                  <select
                    className="form-select rounded-3"
                    style={{ borderColor: '#CBD5E1', fontSize: '0.875rem' }}
                    value={selectedDrawerId}
                    onChange={(e) => setSelectedDrawerId(e.target.value)}
                    disabled={loading}
                  >
                    {cashDrawers.map((d) => (
                      <option key={d.id} value={d.id} disabled={d.is_in_use && !d.allow_shared_users}>
                        {d.name} {d.is_in_use ? `(In Use by ${d.current_cashier_name || 'Staff'})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Previous Shift Reference & Quick Fill Options */}
              {!selectedHandoverId && suggested > 0 && (
                <div className="card border-0 p-3 rounded-3 bg-white mb-3 shadow-xs" style={{ border: '1px solid #E2E8F0' }}>
                  <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                    <span className="text-secondary extra-small fw-semibold">Previous Shift Closing Cash:</span>
                    <span className="fw-bold text-dark font-monospace small">{formatCurrency(suggested)}</span>
                  </div>

                  <div className="extra-small text-muted mb-2">
                    Quick fill options:
                  </div>

                  <div className="d-flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={`btn btn-sm rounded-2 py-1 px-2.5 extra-small fw-semibold d-flex align-items-center gap-1.5 ${
                        entered === suggested
                          ? 'btn-primary text-white shadow-xs'
                          : 'btn-outline-secondary bg-light text-dark'
                      }`}
                      onClick={() => {
                        setOpeningBalance(suggested);
                      }}
                    >
                      <Clock size={13} /> Carry Forward Previous ({formatCurrency(suggested)})
                    </button>

                    <button
                      type="button"
                      className={`btn btn-sm rounded-2 py-1 px-2.5 extra-small fw-semibold d-flex align-items-center gap-1.5 ${
                        entered === 0
                          ? 'btn-primary text-white shadow-xs'
                          : 'btn-outline-secondary bg-light text-dark'
                      }`}
                      onClick={() => {
                        setOpeningBalance(0);
                      }}
                    >
                      Zero Cash (₹0.00)
                    </button>
                  </div>
                </div>
              )}

              {/* Opening Cash Input Header with Denomination Calculator Toggle */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1.5">
                  <span className="fw-bold text-dark small">Opening Cash In Drawer (₹) <span className="text-danger">*</span></span>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm py-0.5 px-2 rounded-2 extra-small d-flex align-items-center gap-1"
                    onClick={() => setShowDenominations(!showDenominations)}
                  >
                    <Calculator size={13} className="text-primary" />
                    {showDenominations ? 'Direct Total' : 'Count Notes'}
                  </button>
                </div>

                <div className="input-group mb-2">
                  <span className="input-group-text bg-white border-end-0 fw-bold text-secondary" style={{ borderColor: '#CBD5E1' }}>
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control fw-bold fs-5 border-start-0 text-dark"
                    style={{ borderColor: '#CBD5E1' }}
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value)}
                    placeholder="0.00"
                    required
                    disabled={loading}
                    autoFocus
                  />
                </div>

                {/* Optional Note Counting Breakdown Calculator */}
                {showDenominations && (
                  <div className="card border shadow-xs rounded-3 bg-white p-2.5 mb-2" style={{ borderColor: '#CBD5E1' }}>
                    <div className="extra-small fw-bold text-secondary text-uppercase mb-2 pb-1 border-bottom">
                      Float Currency Denomination Counter
                    </div>
                    <div className="row g-2">
                      {STANDARD_DENOMINATIONS.map((d) => (
                        <div key={d.key} className="col-6 col-sm-3">
                          <div className="input-group input-group-sm">
                            <span className="input-group-text bg-light extra-small fw-semibold py-1 px-1.5" style={{ minWidth: '46px', fontSize: '0.72rem' }}>
                              ₹{d.key}
                            </span>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              className="form-control form-control-sm text-center fw-bold text-dark px-1"
                              value={counts[d.key] || ''}
                              onChange={(e) => handleDenomChange(d.key, e.target.value)}
                              disabled={loading}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Opening Notes */}
              <div className="mb-2">
                <label className="form-label fw-semibold text-secondary extra-small mb-1">
                  Opening Remarks / Float Notes (Optional)
                </label>
                <textarea
                  className="form-control form-control-sm rounded-3"
                  rows={2}
                  style={{ borderColor: '#CBD5E1', fontSize: '0.85rem' }}
                  placeholder="e.g. Received float from manager / morning opening notes..."
                  value={openingNotes}
                  onChange={(e) => setOpeningNotes(e.target.value)}
                  disabled={loading}
                />
              </div>

            </div>

            {/* Footer Buttons */}
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
                className="btn btn-primary px-4 py-2 rounded-3 small fw-bold shadow-xs d-flex align-items-center gap-2"
                style={{ backgroundColor: '#2563EB', borderColor: '#2563EB' }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    Opening Shift...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} /> Confirm &amp; Open Shift
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

export default OpenShiftModal;
