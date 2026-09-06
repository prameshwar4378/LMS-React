import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { createShiftHandoverApi, getHandoverRecipientsApi } from '../api/shiftApi';
import { formatCurrency } from '../utils/formatCurrency';
import {
  Users,
  Send,
  AlertCircle,
  CheckCircle2,
  X,
  Clock,
  LogOut,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

const ShiftHandoverModal = ({ isOpen, onClose, onSuccess, shift, expectedCash = 0 }) => {
  const { user: currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [toUser, setToUser] = useState('');
  const [amount, setAmount] = useState(expectedCash || 0);
  const [closeFromShift, setCloseFromShift] = useState(true);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState(null);
  const [handoverResult, setHandoverResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setAmount(expectedCash || 0);
      setCloseFromShift(true);
      setNotes('');
      setError(null);
      setHandoverResult(null);
      loadStaffUsers();
    }
  }, [isOpen, expectedCash]);

  const loadStaffUsers = async () => {
    setLoadingUsers(true);
    try {
      let list = [];
      try {
        const res = await getHandoverRecipientsApi();
        list = res?.results || res?.data || (Array.isArray(res) ? res : []);
      } catch (e) {
        console.warn('Fallback to /users/ for handover staff:', e);
        const res = await api.get('/users/');
        list = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      }

      // Filter out current shift user and currently logged in user
      const currentUserId = currentUser?.id || (typeof shift?.user === 'object' ? shift?.user?.id : shift?.user);
      const otherStaff = list.filter((u) => String(u.id) !== String(currentUserId));
      setUsers(otherStaff);
      if (otherStaff.length > 0) {
        setToUser(otherStaff[0].id);
      } else {
        setToUser('');
      }
    } catch (err) {
      console.error('Failed to load staff users:', err);
      setUsers([]);
      setToUser('');
    } finally {
      setLoadingUsers(false);
    }
  };

  if (!isOpen || !shift) return null;

  const val = parseFloat(amount || 0);
  const diff = val - parseFloat(expectedCash || 0);
  const hasVariance = Math.abs(diff) > 0.01;

  const sameBranchStaff = users.filter((u) => u.is_same_branch === true);
  const otherBranchStaff = users.filter((u) => u.is_same_branch === false);
  const hasBranchGroups = sameBranchStaff.length > 0 && otherBranchStaff.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!toUser) {
      setError('Please select an incoming receptionist to receive the handover.');
      return;
    }
    if (isNaN(val) || val < 0) {
      setError('Please enter a valid non-negative handover amount.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        to_user: toUser,
        amount: val,
        close_from_shift: closeFromShift,
        notes: notes.trim() || undefined
      };

      const res = await createShiftHandoverApi(shift.id, payload);
      setHandoverResult(res);
      if (onSuccess) {
        onSuccess(res);
      }
    } catch (err) {
      console.error('Failed to create shift handover:', err);
      const data = err.response?.data;
      let errMsg = data?.message || data?.detail;
      if (!errMsg && data?.errors) {
        const firstKey = Object.keys(data.errors)[0];
        if (firstKey) {
          const v = data.errors[firstKey];
          errMsg = Array.isArray(v) ? v[0] : String(v);
        }
      }
      setError(errMsg || 'Failed to initiate handover. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchStaff = () => {
    logout();
    navigate('/login');
  };

  const selectedTargetUser = users.find((u) => String(u.id) === String(toUser));
  const targetName = selectedTargetUser ? (selectedTargetUser.first_name ? `${selectedTargetUser.first_name} ${selectedTargetUser.last_name || ''}` : selectedTargetUser.username) : 'Incoming Staff';

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '500px' }}>
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          
          <div className="modal-header border-0 text-white p-4" style={{ background: 'linear-gradient(135deg, #09204c 0%, #1E3A8A 100%)' }}>
            <div className="d-flex align-items-center gap-3">
              <div
                className="d-flex align-items-center justify-content-center text-white rounded-3 shadow-xs"
                style={{ width: '42px', height: '42px', backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
              >
                <Users size={22} />
              </div>
              <div>
                <h5 className="modal-title fw-bold text-white mb-0" style={{ letterSpacing: '-0.02em' }}>
                  Shift &amp; Till Handover
                </h5>
                <span className="text-white-50 small" style={{ fontSize: '0.8rem' }}>
                  Hand over drawer cash &amp; duty to next receptionist
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

          {handoverResult ? (
            /* Success & Staff Switch View */
            <div className="p-4 bg-white text-center">
              <div
                className="p-3 bg-success-subtle text-success rounded-circle d-inline-flex mb-3"
                style={{ width: '64px', height: '64px', alignItems: 'center', justifyContent: 'center' }}
              >
                <CheckCircle2 size={32} />
              </div>

              <h5 className="fw-bold text-dark mb-1">Handover Initiated Successfully!</h5>
              <p className="text-secondary small mb-3">
                <strong>{formatCurrency(val)}</strong> has been transferred to <strong>{targetName}</strong>.
                {closeFromShift && ' Your shift has been cleanly finalized and closed.'}
              </p>

              <div className="alert alert-light border rounded-3 p-3 text-start small mb-4">
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-secondary">Outgoing Shift:</span>
                  <strong className="text-dark">#{shift.shift_number}</strong>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-secondary">Incoming Cashier:</span>
                  <strong className="text-dark">{targetName}</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-secondary">Cash Transferred:</span>
                  <strong className="text-success font-monospace fs-6">{formatCurrency(val)}</strong>
                </div>
              </div>

              <div className="d-flex flex-column gap-2">
                <button
                  type="button"
                  className="btn btn-primary fw-bold py-2.5 rounded-3 shadow-xs d-flex align-items-center justify-content-center gap-2 text-white"
                  style={{ backgroundColor: '#1E3A8A', borderColor: '#1E3A8A' }}
                  onClick={handleSwitchStaff}
                >
                  <LogOut size={16} /> Switch Staff &amp; Open Login Screen
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary py-2 rounded-3 small fw-semibold"
                  onClick={onClose}
                >
                  Stay Logged In / Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="modal-body p-4 bg-light">
                
                {error && (
                  <div className="alert alert-danger border-danger d-flex align-items-start gap-2 rounded-3 p-3 mb-3 small">
                    <AlertCircle size={16} className="text-danger flex-shrink-0 mt-0.5" />
                    <div>{error}</div>
                  </div>
                )}

                {/* Target Staff Selector */}
                <div className="mb-3">
                  <label className="form-label fw-bold text-dark small mb-1">
                    Incoming Receptionist (Next Shift Employee) <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select rounded-3"
                    style={{ borderColor: '#CBD5E1', fontSize: '0.875rem' }}
                    value={toUser}
                    onChange={(e) => setToUser(e.target.value)}
                    disabled={loading || loadingUsers}
                    required
                  >
                    {loadingUsers ? (
                      <option value="">Loading staff members...</option>
                    ) : users.length === 0 ? (
                      <option value="">No other staff found in this hotel or branch</option>
                    ) : hasBranchGroups ? (
                      <>
                        {sameBranchStaff.length > 0 && (
                          <optgroup label="🏢 Same Branch Employees">
                            {sameBranchStaff.map((u) => {
                              const roleLabel = u.role_display || u.role || 'Staff';
                              const name = u.full_name || (u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : u.username);
                              return (
                                <option key={u.id} value={u.id}>
                                  {name} ({roleLabel}) — {u.property_name || 'Current Branch'}
                                </option>
                              );
                            })}
                          </optgroup>
                        )}
                        {otherBranchStaff.length > 0 && (
                          <optgroup label="🏨 Other Branches of Same Hotel">
                            {otherBranchStaff.map((u) => {
                              const roleLabel = u.role_display || u.role || 'Staff';
                              const name = u.full_name || (u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : u.username);
                              return (
                                <option key={u.id} value={u.id}>
                                  {name} ({roleLabel}) — {u.property_name || 'Branch'}
                                </option>
                              );
                            })}
                          </optgroup>
                        )}
                      </>
                    ) : (
                      users.map((u) => {
                        const branchName = u.property_name || u.property?.name;
                        const roleLabel = u.role_display || u.role || 'Staff';
                        const name = u.full_name || (u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : u.username);
                        return (
                          <option key={u.id} value={u.id}>
                            {name} ({roleLabel}){branchName ? ` — ${branchName}` : ''}
                          </option>
                        );
                      })
                    )}
                  </select>
                </div>

                {/* Handover Cash Amount */}
                <div className="mb-3">
                  <label className="form-label fw-bold text-dark small mb-1">
                    Cash Amount Handed Over (₹) <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 fw-bold text-secondary">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control fw-bold fs-5 border-start-0"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="d-flex justify-content-between align-items-center extra-small mt-1 text-secondary">
                    <span>Expected Drawer Float: <strong>{formatCurrency(expectedCash)}</strong></span>
                    {hasVariance && (
                      <span className={`fw-bold ${diff < 0 ? 'text-danger' : 'text-primary'}`}>
                        {diff < 0 ? `Shortage: -₹${Math.abs(diff).toFixed(2)}` : `Excess: +₹${diff.toFixed(2)}`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Close Outgoing Shift Checkbox */}
                <div className="card border-0 p-3 rounded-3 bg-white mb-3 shadow-xs" style={{ border: '1px solid #E2E8F0' }}>
                  <div className="form-check d-flex align-items-start gap-2 m-0">
                    <input
                      className="form-check-input mt-1"
                      type="checkbox"
                      id="closeFromShiftCheck"
                      checked={closeFromShift}
                      onChange={(e) => setCloseFromShift(e.target.checked)}
                      disabled={loading}
                    />
                    <label className="form-check-label small" htmlFor="closeFromShiftCheck">
                      <strong className="text-dark d-block">Finalize &amp; Close My Shift Upon Handover</strong>
                      <span className="text-secondary extra-small">
                        Concludes your duty shift, records closing cash reconciliation, and passes active drawer control to the incoming employee.
                      </span>
                    </label>
                  </div>
                </div>

                {/* Handover Remarks */}
                <div className="mb-1">
                  <label className="form-label fw-semibold text-secondary extra-small mb-1">
                    Handover Notes / Instructions (Optional)
                  </label>
                  <textarea
                    className="form-control form-control-sm rounded-3"
                    rows={2}
                    style={{ borderColor: '#CBD5E1', fontSize: '0.85rem' }}
                    placeholder="e.g. Key handover confirmed, counted drawer cash in presence of incoming staff..."
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
                  className="btn btn-primary px-4 py-2 rounded-3 small fw-bold shadow-xs d-flex align-items-center gap-1.5"
                  disabled={loading || !toUser}
                  style={{ backgroundColor: '#2563EB', borderColor: '#2563EB' }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      Transferring...
                    </>
                  ) : (
                    <>
                      <Send size={16} /> Handover &amp; Proceed
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default ShiftHandoverModal;
