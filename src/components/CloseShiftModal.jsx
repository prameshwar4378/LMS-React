import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatCurrency';
import { closeShiftApi } from '../api/shiftApi';
import { getSettingsApi } from '../api/settingsApi';
import { generateShiftThermalHtml, printThermalContent } from '../utils/thermalPrinter';
import ThermalSlipModal from './ThermalSlipModal';
import {
  Lock,
  Calculator,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  X,
  Printer,
  FileText,
  Shield,
  ShieldCheck
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

const CloseShiftModal = ({ isOpen, onClose, onSuccess, shift, financials = {} }) => {
  const [counts, setCounts] = useState({
    '500': 0,
    '200': 0,
    '100': 0,
    '50': 0,
    '20': 0,
    '10': 0,
    '5': 0,
    'COINS': 0
  });

  const [useDirectEntry, setUseDirectEntry] = useState(false);
  const [directCash, setDirectCash] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [differenceReason, setDifferenceReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Post-close success & thermal slip state
  const [closedResult, setClosedResult] = useState(null);
  const [showThermalPreview, setShowThermalPreview] = useState(false);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    if (isOpen) {
      setCounts({
        '500': 0,
        '200': 0,
        '100': 0,
        '50': 0,
        '20': 0,
        '10': 0,
        '5': 0,
        'COINS': 0
      });
      setDirectCash('');
      setClosingNotes('');
      setDifferenceReason('');
      setError(null);
      setClosedResult(null);
      getSettingsApi().then(setSettings).catch(console.error);
    }
  }, [isOpen]);

  const { hasRole } = useAuth();
  const isManagerOrAdmin = hasRole(['SUPER_ADMIN', 'MANAGER']);
  const isBlindMode = !!settings?.enable_blind_till_closing && !isManagerOrAdmin;

  const expectedCash = parseFloat(financials?.expected_cash ?? shift?.financials?.expected_cash ?? shift?.expected_cash ?? 0);

  // Calculate counted physical cash
  const countedCash = useMemo(() => {
    if (useDirectEntry) {
      return parseFloat(directCash || 0);
    }
    return STANDARD_DENOMINATIONS.reduce((sum, d) => {
      const qty = parseInt(counts[d.key] || 0, 10);
      return sum + (qty * d.value);
    }, 0);
  }, [counts, useDirectEntry, directCash]);

  const difference = countedCash - expectedCash;
  const isReconciled = Math.abs(difference) < 0.01;
  const isShortage = difference < -0.01;
  const isExcess = difference > 0.01;

  if (!isOpen || !shift) return null;

  const handleQtyChange = (key, value) => {
    const parsed = parseInt(value, 10);
    setCounts((prev) => ({
      ...prev,
      [key]: isNaN(parsed) || parsed < 0 ? 0 : parsed
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isBlindMode && !isReconciled && !differenceReason.trim()) {
      setError('A mandatory reason is required for any cash shortage or excess discrepancy.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const denominationsList = STANDARD_DENOMINATIONS.map((d) => ({
        denomination: d.key,
        unit_value: d.value,
        quantity: parseInt(counts[d.key] || 0, 10)
      })).filter((item) => item.quantity > 0);

      const payload = {
        denominations: useDirectEntry ? [] : denominationsList,
        actual_cash: countedCash,
        closing_notes: closingNotes,
        difference_reason: !isReconciled ? differenceReason : undefined
      };

      const res = await closeShiftApi(shift.id, payload);
      setClosedResult(res.data);
      if (onSuccess) {
        onSuccess(res.data);
      }
    } catch (err) {
      console.error('Failed to close shift:', err);
      const errMsg = err.response?.data?.message || 'Failed to submit shift closing. Please check inputs.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickThermalPrint = () => {
    const shiftData = closedResult?.data || shift;
    const html = generateShiftThermalHtml(shiftData, settings, '80mm');
    printThermalContent(html, `Shift_${shiftData.shift_number}`);
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg" style={{ maxWidth: '780px' }}>
        <div className="modal-content border-0 shadow-xl rounded-4 overflow-hidden">
          
          {/* Header Banner */}
          <div className="modal-header border-0 text-white p-4" style={{ background: 'linear-gradient(135deg, #09204c 0%, #1E3A8A 100%)' }}>
            <div className="d-flex align-items-center gap-3">
              <div
                className="d-flex align-items-center justify-content-center text-white rounded-3 shadow-xs"
                style={{ width: '44px', height: '44px', backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
              >
                <Lock size={22} />
              </div>
              <div>
                <div className="d-flex align-items-center gap-2">
                  <h5 className="modal-title fw-bold text-white mb-0" style={{ letterSpacing: '-0.02em' }}>
                    Close Shift &amp; Till Reconciliation
                  </h5>
                  <span className="badge bg-white bg-opacity-20 text-white px-2 py-0.5 rounded-pill extra-small">
                    #{shift.shift_number}
                  </span>
                </div>
                <span className="text-white-50 small" style={{ fontSize: '0.8rem' }}>
                  Count physical drawer cash &amp; reconcile with expected shift totals
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

          {closedResult ? (
            <div className="modal-body p-4 bg-light text-center">
              <div className="card border-0 shadow-sm p-4 rounded-4 bg-white mb-3" style={{ border: '1px solid #E2E8F0' }}>
                <div
                  className={`p-3 rounded-circle d-inline-flex mb-3 mx-auto ${
                    closedResult.is_reconciled ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning-emphasis'
                  }`}
                  style={{ width: '64px', height: '64px', alignItems: 'center', justifyContent: 'center' }}
                >
                  <CheckCircle2 size={32} />
                </div>
                
                <h4 className="fw-bold text-dark mb-1">
                  Shift #{closedResult.data?.shift_number || shift.shift_number} Submitted
                </h4>
                <p className="text-secondary small mb-3">
                  {closedResult.message}
                </p>

                <div className="row g-2 p-3 bg-light rounded-3 text-center mb-3">
                  <div className="col-4 border-end">
                    <div className="text-secondary extra-small">Expected</div>
                    <div className="fw-bold text-dark font-monospace">{formatCurrency(closedResult.data?.expected_cash || 0)}</div>
                  </div>
                  <div className="col-4 border-end">
                    <div className="text-secondary extra-small">Actual Counted</div>
                    <div className="fw-bold text-dark font-monospace">{formatCurrency(closedResult.data?.actual_cash || 0)}</div>
                  </div>
                  <div className="col-4">
                    <div className="text-secondary extra-small">Difference</div>
                    <div className={`fw-bold font-monospace ${closedResult.is_reconciled ? 'text-success' : 'text-danger'}`}>
                      {formatCurrency(closedResult.difference || 0)}
                    </div>
                  </div>
                </div>

                {/* Print Options */}
                <div className="d-flex flex-column flex-sm-row justify-content-center gap-2 mt-2">
                  <button
                    type="button"
                    className="btn btn-primary fw-bold px-4 py-2.5 rounded-3 shadow-xs d-flex align-items-center justify-content-center gap-2 text-white"
                    style={{ backgroundColor: '#2563EB', borderColor: '#2563EB' }}
                    onClick={handleQuickThermalPrint}
                  >
                    <Printer size={17} /> Print 80mm Thermal Slip
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-secondary bg-white fw-semibold px-3.5 py-2.5 rounded-3 shadow-xs d-flex align-items-center justify-content-center gap-1.5"
                    onClick={() => setShowThermalPreview(true)}
                  >
                    <FileText size={16} /> Preview / 58mm Options
                  </button>
                </div>
              </div>

              <div className="text-center mt-2">
                <button
                  type="button"
                  className="btn btn-light text-secondary border px-4 py-2 rounded-3 small fw-semibold"
                  onClick={onClose}
                >
                  Done &amp; Return
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="modal-body p-4 bg-light" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                
                {/* Financial Ledger Summary Box (or Blind Mode Shield) */}
                {!isBlindMode ? (
                  <>
                    <div className="card border-0 shadow-xs p-3.5 rounded-3 bg-white mb-3" style={{ border: '1px solid #E2E8F0' }}>
                      <div className="d-flex justify-content-between align-items-center mb-2.5 pb-2 border-bottom">
                        <div className="d-flex align-items-center gap-2">
                          <span className="text-secondary extra-small fw-bold text-uppercase tracking-wider">
                            PHYSICAL CASH DRAWER RECONCILIATION
                          </span>
                        </div>
                        <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill extra-small px-2 py-0.5 fw-bold">
                          💵 Cash Drawer Only
                        </span>
                      </div>

                      <div className="row g-2 text-center" style={{ fontSize: '0.825rem' }}>
                        <div className="col-4 col-md-2 border-end">
                          <div className="text-secondary extra-small">Opening Float</div>
                          <div className="fw-bold text-dark mt-0.5 font-monospace">{formatCurrency(financials.opening_cash || 0)}</div>
                        </div>
                        <div className="col-4 col-md-2 border-end">
                          <div className="text-secondary extra-small">+ Cash Received</div>
                          <div className="fw-bold text-success mt-0.5 font-monospace">+{formatCurrency(financials.cash_collections || 0)}</div>
                        </div>
                        <div className="col-4 col-md-2 border-end">
                          <div className="text-secondary extra-small">+ Float Added</div>
                          <div className="fw-bold text-primary mt-0.5 font-monospace">+{formatCurrency(financials.cash_added || 0)}</div>
                        </div>
                        <div className="col-4 col-md-2 border-end">
                          <div className="text-secondary extra-small">- Cash Expenses</div>
                          <div className="fw-bold text-danger mt-0.5 font-monospace">-{formatCurrency(financials.cash_expenses || 0)}</div>
                        </div>
                        <div className="col-4 col-md-2 border-end">
                          <div className="text-secondary extra-small">
                            {parseFloat(financials.cash_handed_over || 0) > 0 ? '- Handover/Drop' : '- Float Drops'}
                          </div>
                          <div className="fw-bold text-danger mt-0.5 font-monospace">
                            -{formatCurrency(parseFloat(financials.cash_removed || 0) + parseFloat(financials.cash_handed_over || 0))}
                          </div>
                        </div>
                        <div className="col-4 col-md-2 bg-primary-subtle rounded-2 p-1 border border-primary-subtle">
                          <div className="text-primary fw-bold extra-small">Expected Drawer Cash</div>
                          <div className="fw-bolder text-primary fs-6 mt-0.5 font-monospace">{formatCurrency(expectedCash)}</div>
                        </div>
                      </div>
                    </div>

                    {/* Dedicated Digital / Online Collections Card */}
                    <div className="card border-0 shadow-xs p-3 rounded-3 mb-4" style={{ backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD' }}>
                      <div className="d-flex justify-content-between align-items-center mb-2 pb-1.5 border-bottom border-info-subtle">
                        <span className="text-primary extra-small fw-bold text-uppercase tracking-wider d-flex align-items-center gap-1">
                          🌐 DIGITAL &amp; ONLINE SETTLEMENTS (BANK DEPOSITS)
                        </span>
                        <span className="badge bg-white text-secondary border extra-small px-2 py-0.5">
                          Not In Cash Drawer
                        </span>
                      </div>

                      <div className="row g-2 text-center" style={{ fontSize: '0.8rem' }}>
                        <div className="col-4 border-end border-info-subtle">
                          <div className="text-secondary extra-small">UPI / QR Scans</div>
                          <div className="fw-bold text-primary font-monospace mt-0.5">{formatCurrency(financials.upi_collections || 0)}</div>
                        </div>
                        <div className="col-4 border-end border-info-subtle">
                          <div className="text-secondary extra-small">Card POS Swipes</div>
                          <div className="fw-bold text-indigo font-monospace mt-0.5" style={{ color: '#4F46E5' }}>{formatCurrency(financials.card_collections || 0)}</div>
                        </div>
                        <div className="col-4">
                          <div className="text-secondary extra-small">Bank / Net Banking</div>
                          <div className="fw-bold text-dark font-monospace mt-0.5">{formatCurrency(parseFloat(financials.bank_collections || 0) + parseFloat(financials.other_collections || 0))}</div>
                        </div>
                      </div>
                      <div className="extra-small text-secondary mt-2 pt-1 border-top border-info-subtle d-flex align-items-center justify-content-between">
                        <span>Total Digital Settled to Bank: <strong className="text-dark font-monospace">{formatCurrency(parseFloat(financials.upi_collections || 0) + parseFloat(financials.card_collections || 0) + parseFloat(financials.bank_collections || 0) + parseFloat(financials.other_collections || 0))}</strong></span>
                        <span className="text-muted fst-italic">Do not count digital receipts into physical drawer</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="card border-0 shadow-xs p-3.5 rounded-3 mb-4" style={{ border: '1px solid #FDE68A', backgroundColor: '#FFFDF5' }}>
                    <div className="d-flex align-items-center gap-3">
                      <div className="p-2.5 rounded-3 bg-warning text-dark flex-shrink-0 shadow-xs">
                        <Shield size={22} />
                      </div>
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-0.5">
                          <span className="fw-bold text-dark small">Blind Till Closing Active</span>
                          <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill extra-small">Anti-Theft Security</span>
                        </div>
                        <div className="text-secondary extra-small">
                          Please physically count all notes and coins in the cash drawer and enter their counts below. Expected drawer totals are hidden for audit verification and will be reconciled upon submission.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Message */}
              {error && (
                <div className="alert alert-danger border-danger d-flex align-items-start gap-2 rounded-3 p-3 mb-3 small">
                  <AlertCircle size={16} className="text-danger flex-shrink-0 mt-0.5" />
                  <div>{error}</div>
                </div>
              )}

              {/* Denomination Counter Section */}
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="form-label fw-bold text-dark mb-0 d-flex align-items-center gap-1.5 small">
                  <Calculator size={15} className="text-primary" />
                  Physical Cash Count Breakdown
                </label>
                <button
                  type="button"
                  className="btn btn-link text-secondary p-0 extra-small text-decoration-none"
                  onClick={() => setUseDirectEntry(!useDirectEntry)}
                >
                  {useDirectEntry ? 'Switch to Note Counting Calculator' : 'Enter Direct Total Amount'}
                </button>
              </div>

              {!useDirectEntry ? (
                <div className="card border-0 shadow-xs rounded-3 bg-white overflow-hidden mb-3" style={{ border: '1px solid #E2E8F0' }}>
                  <div className="table-responsive">
                    <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: '0.825rem' }}>
                      <thead className="table-light text-secondary extra-small">
                        <tr>
                          <th className="ps-3 py-2">Denomination</th>
                          <th className="text-center py-2" style={{ width: '130px' }}>Quantity</th>
                          <th className="text-end pe-3 py-2" style={{ width: '150px' }}>Line Total (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {STANDARD_DENOMINATIONS.map((d) => {
                          const qty = counts[d.key] || 0;
                          const lineTotal = qty * d.value;
                          return (
                            <tr key={d.key}>
                              <td className="ps-3 fw-semibold text-dark">
                                {d.label}
                              </td>
                              <td className="text-center">
                                <input
                                  type="number"
                                  min="0"
                                  className="form-control form-control-sm text-center fw-bold text-dark mx-auto"
                                  style={{ maxWidth: '100px', borderColor: '#CBD5E1' }}
                                  value={qty || ''}
                                  placeholder="0"
                                  onChange={(e) => handleQtyChange(d.key, e.target.value)}
                                  disabled={loading}
                                />
                              </td>
                              <td className="text-end pe-3 font-monospace fw-bold text-dark">
                                {formatCurrency(lineTotal)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="card border-0 shadow-xs rounded-3 bg-white p-3 mb-3" style={{ border: '1px solid #E2E8F0' }}>
                  <label className="form-label fw-bold text-dark extra-small mb-1">
                    Total Physical Cash Counted in Drawer (₹)
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 fw-bold text-secondary">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control fw-bold fs-5 border-start-0"
                      value={directCash}
                      onChange={(e) => setDirectCash(e.target.value)}
                      placeholder="0.00"
                      required={useDirectEntry}
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                </div>
              )}

              {/* Live Count vs Expected Comparison Verdict Banner (or Blind Count Summary) */}
              {!isBlindMode ? (
                <div
                  className={`card border p-3 rounded-3 mb-3 d-flex flex-column gap-2 ${
                    isReconciled ? 'bg-success-subtle border-success text-success-emphasis' :
                    isShortage ? 'bg-danger-subtle border-danger text-danger-emphasis' :
                    'bg-warning-subtle border-warning text-warning-emphasis'
                  }`}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="extra-small fw-bold text-uppercase">PHYSICAL CASH COUNTED</div>
                      <div className="fs-4 fw-bolder lh-1 mt-0.5 font-monospace">{formatCurrency(countedCash)}</div>
                    </div>
                    <div className="text-end">
                      <div className="extra-small fw-bold text-uppercase">RECONCILIATION VERDICT</div>
                      <div className="mt-0.5">
                        {isReconciled ? (
                          <span className="badge bg-success text-white px-3 py-1.5 rounded-pill fw-bold d-inline-flex align-items-center gap-1.5 shadow-xs">
                            <CheckCircle2 size={14} /> Reconciled (₹0 Diff)
                          </span>
                        ) : isShortage ? (
                          <span className="badge bg-danger text-white px-3 py-1.5 rounded-pill fw-bold d-inline-flex align-items-center gap-1.5 shadow-xs">
                            <TrendingDown size={14} /> Shortage: {formatCurrency(Math.abs(difference))}
                          </span>
                        ) : (
                          <span className="badge bg-warning text-dark px-3 py-1.5 rounded-pill fw-bold d-inline-flex align-items-center gap-1.5 shadow-xs">
                            <TrendingUp size={14} /> Excess: +{formatCurrency(difference)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card border p-3 rounded-3 mb-3 bg-white d-flex flex-row justify-content-between align-items-center shadow-xs" style={{ borderColor: '#E2E8F0' }}>
                  <div>
                    <div className="extra-small fw-bold text-secondary text-uppercase">PHYSICAL CASH COUNTED</div>
                    <div className="fs-4 fw-bolder text-dark lh-1 mt-0.5 font-monospace">{formatCurrency(countedCash)}</div>
                  </div>
                  <div className="text-end">
                    <span className="badge bg-light text-secondary border rounded-pill extra-small px-3 py-1.5 fw-semibold d-inline-flex align-items-center gap-1">
                      <Lock size={12} /> Reconciled on submission
                    </span>
                  </div>
                </div>
              )}

              {/* Mandatory Explanation Field for Discrepancies (Manager / Normal Mode only) */}
              {!isBlindMode && !isReconciled && (
                <div className="mb-3">
                  <label className="form-label fw-bold text-danger small mb-1 d-flex align-items-center gap-1">
                    <AlertTriangle size={14} />
                    Discrepancy Justification Reason <span className="text-danger">* (Required for Manager Approval)</span>
                  </label>
                  <textarea
                    className="form-control rounded-3 border-danger"
                    rows={2}
                    style={{ fontSize: '0.85rem' }}
                    placeholder="Provide a detailed operational explanation for why actual cash differs from expected cash..."
                    value={differenceReason}
                    onChange={(e) => setDifferenceReason(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              )}

              {/* Closing Notes */}
              <div className="mb-1">
                <label className="form-label fw-semibold text-secondary extra-small mb-1">
                  Closing Remarks / Handover Notes (Optional)
                </label>
                <textarea
                  className="form-control form-control-sm rounded-3"
                  rows={2}
                  style={{ borderColor: '#CBD5E1', fontSize: '0.85rem' }}
                  placeholder="e.g. Handing over till keys and cash envelope..."
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  disabled={loading}
                />
              </div>

            </div>

            {/* Modal Footer */}
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
                className={`btn px-4 py-2 rounded-3 small fw-bold shadow-xs d-flex align-items-center gap-2 text-white ${
                  !isBlindMode && isReconciled ? 'btn-success' : 'btn-primary'
                }`}
                style={{ backgroundColor: !isBlindMode && isReconciled ? '#16A34A' : '#2563EB', borderColor: !isBlindMode && isReconciled ? '#16A34A' : '#2563EB' }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    Submitting Closing...
                  </>
                ) : isBlindMode ? (
                  <>
                    <Lock size={16} /> Submit Count &amp; Close Till
                  </>
                ) : isReconciled ? (
                  <>
                    <CheckCircle2 size={16} /> Close &amp; Reconcile Shift
                  </>
                ) : (
                  <>
                    <Lock size={16} /> Submit for Manager Approval
                  </>
                )}
              </button>
            </div>
          </form>
          )}

        </div>
      </div>

      {/* Thermal Preview Modal */}
      <ThermalSlipModal
        isOpen={showThermalPreview}
        onClose={() => setShowThermalPreview(false)}
        shift={closedResult?.data || shift}
        mode="shift"
      />
    </div>
  );
};

export default CloseShiftModal;
