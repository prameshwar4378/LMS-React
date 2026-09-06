import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { addShiftExpenseApi } from '../api/shiftApi';
import { getSettingsApi } from '../api/settingsApi';
import { formatCurrency } from '../utils/formatCurrency';
import { generateExpenseThermalHtml, printThermalContent } from '../utils/thermalPrinter';
import {
  DollarSign,
  Receipt,
  AlertCircle,
  CheckCircle2,
  X,
  Upload,
  Printer,
  ShieldAlert,
  ShieldCheck,
  Key
} from 'lucide-react';

const CATEGORIES = [
  { value: 'CLEANING_SUPPLIES', label: 'Cleaning Supplies (Broom, Phenyl, Detergent)' },
  { value: 'REFRESHMENTS', label: 'Tea / Staff Refreshments' },
  { value: 'MAINTENANCE', label: 'Small Maintenance / Hardware Fix' },
  { value: 'TRANSPORT', label: 'Local Transport / Auto' },
  { value: 'PRINTING_STATIONERY', label: 'Printing, Paper & Stationery' },
  { value: 'OTHER', label: 'Other Operational Expense' }
];

const ShiftExpenseModal = ({ isOpen, onClose, onSuccess, shift }) => {
  const { hasRole, hasPermission, getPermissionLimit } = useAuth();
  const isManager = hasRole(['SUPER_ADMIN', 'MANAGER']);
  const canRecordExpense = hasPermission('counter_till', 'can_record_expense');
  const matrixExpenseLimit = getPermissionLimit('counter_till', 'max_expense_limit', 500);

  const [category, setCategory] = useState('CLEANING_SUPPLIES');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [managerPin, setManagerPin] = useState('');
  const [autoPrintVoucher, setAutoPrintVoucher] = useState(true);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setCategory('CLEANING_SUPPLIES');
      setAmount('');
      setDescription('');
      setReceiptFile(null);
      setManagerPin('');
      setError(null);
      getSettingsApi().then(setSettings).catch(console.error);
    }
  }, [isOpen]);

  // Spending calculations
  const defaultSettingLimit = parseFloat(settings?.max_cash_expense_without_approval ?? 500);
  const maxLimit = Math.min(
    defaultSettingLimit,
    matrixExpenseLimit !== undefined ? matrixExpenseLimit : defaultSettingLimit
  );
  const dailyCap = parseFloat(settings?.daily_petty_cash_cap ?? 2000);
  const currentSpent = parseFloat(shift?.cash_expenses || 0);
  const val = parseFloat(amount || 0);
  const newTotal = currentSpent + val;
  const percentUsed = Math.min(100, Math.round((newTotal / (dailyCap || 1)) * 100));

  const isSingleOperator = settings?.shift_operation_mode === 'SINGLE_OPERATOR';
  const exceedsSingle = val > maxLimit;
  const exceedsCap = newTotal > dailyCap;
  const requiresApproval = !isManager && !isSingleOperator && (exceedsSingle || exceedsCap);

  if (!isOpen || !shift) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canRecordExpense) {
      setError('Permission Denied: Your staff role is not authorized to record cash expenses.');
      return;
    }
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      setError('Please enter a valid positive expense amount.');
      return;
    }
    if (!description.trim()) {
      setError('Please enter an expense description.');
      return;
    }
    if (requiresApproval && !managerPin.trim()) {
      setError(`Manager Override PIN is required for expenses exceeding ₹${maxLimit} or daily cap.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('amount', val);
      formData.append('description', description.trim());
      if (managerPin.trim()) {
        formData.append('manager_pin', managerPin.trim());
      }
      if (receiptFile) {
        formData.append('receipt', receiptFile);
      }

      const res = await addShiftExpenseApi(shift.id, formData);
      
      // Auto-print thermal voucher if option was enabled
      if (autoPrintVoucher && res.data) {
        try {
          const html = generateExpenseThermalHtml(res.data, shift, settings, '80mm');
          printThermalContent(html, `Voucher_EXP_${res.data.id}`);
        } catch (printErr) {
          console.error('Thermal print error:', printErr);
        }
      }

      if (onSuccess) {
        onSuccess(res.data);
      }
      onClose();
    } catch (err) {
      console.error('Failed to add shift expense:', err);
      const errMsg = err.response?.data?.message || 'Failed to record expense. Please check inputs.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '500px' }}>
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          
          <div className="modal-header border-0 text-white p-4" style={{ background: 'linear-gradient(135deg, #09204c 0%, #1E3A8A 100%)' }}>
            <div className="d-flex align-items-center gap-3">
              <div
                className="d-flex align-items-center justify-content-center text-white rounded-3 shadow-xs"
                style={{ width: '40px', height: '40px', backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
              >
                <Receipt size={20} />
              </div>
              <div>
                <h5 className="modal-title fw-bold text-white mb-0" style={{ letterSpacing: '-0.02em' }}>
                  Record Petty Cash Expense
                </h5>
                <span className="text-white-50 small" style={{ fontSize: '0.8rem' }}>
                  Shift #{shift.shift_number} &bull; Reduces expected drawer cash
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
              
              {/* Daily Petty Cash Cap Progress Bar */}
              <div className="card border-0 shadow-xs p-3 rounded-3 bg-white mb-3" style={{ border: '1px solid #E2E8F0' }}>
                <div className="d-flex justify-content-between align-items-center mb-1.5 extra-small">
                  <span className="text-secondary fw-semibold">
                    Shift Spent: <strong className="text-dark">{formatCurrency(currentSpent)}</strong> {val > 0 && <span className="text-primary font-monospace"> + {formatCurrency(val)}</span>}
                  </span>
                  <span className="fw-bold text-dark font-monospace">
                    Daily Cap: {formatCurrency(dailyCap)}
                  </span>
                </div>
                <div className="progress" style={{ height: '6px' }}>
                  <div
                    className={`progress-bar rounded-pill ${
                      percentUsed > 100 ? 'bg-danger' : percentUsed >= 75 ? 'bg-warning' : 'bg-primary'
                    }`}
                    role="progressbar"
                    style={{ width: `${Math.min(100, percentUsed)}%` }}
                  ></div>
                </div>
                <div className="d-flex justify-content-between align-items-center mt-1.5 extra-small text-muted" style={{ fontSize: '0.725rem' }}>
                  <span>Max single without PIN: <strong>{formatCurrency(maxLimit)}</strong></span>
                  <span className={percentUsed >= 100 ? 'text-danger fw-bold' : ''}>{percentUsed}% used</span>
                </div>
              </div>

              {error && (
                <div className="alert alert-danger border-danger d-flex align-items-start gap-2 rounded-3 p-3 mb-3 small">
                  <AlertCircle size={16} className="text-danger flex-shrink-0 mt-0.5" />
                  <div>{error}</div>
                </div>
              )}

              {/* Expense Category */}
              <div className="mb-3">
                <label className="form-label fw-bold text-dark small mb-1">
                  Expense Category <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select rounded-3"
                  style={{ borderColor: '#CBD5E1', fontSize: '0.875rem' }}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={loading}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Amount Paid from Drawer */}
              <div className="mb-3">
                <label className="form-label fw-bold text-dark small mb-1">
                  Cash Amount Paid (₹) <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0 fw-bold text-secondary">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    className="form-control fw-bold fs-5 border-start-0 font-monospace"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    disabled={loading}
                    autoFocus
                  />
                </div>
              </div>

              {/* Manager Authorization PIN prompt (if exceeds threshold) */}
              {requiresApproval && (
                <div className="card border-warning-subtle p-3 rounded-3 mb-3 shadow-xs" style={{ backgroundColor: '#FFFDF5', border: '1px solid #FDE68A' }}>
                  <div className="d-flex align-items-start gap-2.5 mb-2">
                    <ShieldAlert size={18} className="text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="fw-bold text-dark extra-small">Manager Authorization Required</div>
                      <div className="text-secondary extra-small">
                        {exceedsSingle
                          ? `Expense exceeds threshold limit of ${formatCurrency(maxLimit)}.`
                          : `Total expenses exceed daily limit of ${formatCurrency(dailyCap)}.`}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="form-label extra-small fw-bold text-dark mb-1 d-flex align-items-center gap-1">
                      <Key size={13} className="text-primary" /> Manager Override PIN <span className="text-danger">*</span>
                    </label>
                    <input
                      type="password"
                      className="form-control form-control-sm rounded-3 font-monospace fw-bold"
                      style={{ letterSpacing: '0.2em', maxWidth: '180px', borderColor: '#CBD5E1' }}
                      placeholder="••••"
                      value={managerPin}
                      onChange={(e) => setManagerPin(e.target.value)}
                      required={requiresApproval}
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              {/* Description / Item */}
              <div className="mb-3">
                <label className="form-label fw-bold text-dark small mb-1">
                  Description / Purpose <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control rounded-3"
                  style={{ borderColor: '#CBD5E1', fontSize: '0.875rem' }}
                  placeholder="e.g. 2 Bottles Phenyl + 1 packet dusters for housekeeping"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {/* Optional Receipt Attachment */}
              <div className="mb-3">
                <label className="form-label fw-semibold text-secondary extra-small mb-1">
                  Bill / Voucher Receipt Scan (Optional)
                </label>
                <input
                  type="file"
                  className="form-control form-control-sm rounded-3"
                  style={{ borderColor: '#CBD5E1' }}
                  accept="image/*,.pdf"
                  onChange={(e) => setReceiptFile(e.target.files[0] || null)}
                  disabled={loading}
                />
              </div>

              {/* Auto Thermal Print Checkbox */}
              <div className="p-2.5 rounded-3 bg-white border d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <Printer size={15} className="text-primary flex-shrink-0" />
                  <label htmlFor="autoPrintVoucherToggle" className="fw-semibold text-dark extra-small mb-0 cursor-pointer">
                    Print Thermal POS Voucher (80mm)
                  </label>
                </div>
                <div className="form-check form-switch m-0">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="autoPrintVoucherToggle"
                    checked={autoPrintVoucher}
                    onChange={(e) => setAutoPrintVoucher(e.target.checked)}
                    disabled={loading}
                  />
                </div>
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
                    Recording...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} /> Record Cash Expense
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

export default ShiftExpenseModal;
