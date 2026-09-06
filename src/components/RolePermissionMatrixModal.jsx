import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Save,
  RotateCcw,
  X,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  BedDouble,
  DollarSign,
  Receipt,
  FileText,
  Moon,
  Info
} from 'lucide-react';
import { getRolePermissionsApi, updateRolePermissionsApi, resetRolePermissionsApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';


const PERMISSION_GROUPS = [
  {
    key: 'rooms',
    title: 'Rooms & Tariffs',
    icon: BedDouble,
    color: 'teal',
    items: [
      { key: 'can_view', label: 'View Room Grid & Details', type: 'boolean' },
      { key: 'can_create', label: 'Create New Room Assets', type: 'boolean' },
      { key: 'can_edit_tariffs', label: 'Edit Standard Tariffs & Seasonal Pricing', type: 'boolean' },
      { key: 'can_change_status', label: 'Change Room Housekeeping Status', type: 'boolean' }
    ]
  },
  {
    key: 'bookings',
    title: 'Bookings & Reservations',
    icon: Calendar,
    color: 'primary',
    items: [
      { key: 'can_view', label: 'View Reservations Calendar', type: 'boolean' },
      { key: 'can_create', label: 'Create New Booking Reservations', type: 'boolean' },
      { key: 'can_edit', label: 'Modify Reservation Dates / Details', type: 'boolean' },
      { key: 'can_cancel', label: 'Cancel Reservations', type: 'boolean' },
      { key: 'can_delete', label: 'Permanently Delete / Void Bookings', type: 'boolean' }
    ]
  },
  {
    key: 'stays',
    title: 'Stays & Front-Desk Check-Ins',
    icon: Building2,
    color: 'indigo',
    items: [
      { key: 'can_checkin', label: 'Process Walk-in Check-Ins', type: 'boolean' },
      { key: 'can_checkout', label: 'Process Guest Check-Outs', type: 'boolean' },
      { key: 'can_checkout_with_balance', label: 'Allow Check-Out with Unsettled Balance', type: 'boolean' },
      { key: 'can_extend', label: 'Extend Stay Dates & Reassign Rooms', type: 'boolean' }
    ]
  },
  {
    key: 'billing',
    title: 'Billing, Discounts & Payments',
    icon: DollarSign,
    color: 'success',
    items: [
      { key: 'can_collect_payment', label: 'Collect Cash, UPI & Card Payments', type: 'boolean' },
      { key: 'can_give_discount', label: 'Apply Manual Folio Discounts', type: 'boolean' },
      { key: 'max_discount_percent', label: 'Maximum Discount Allowed (%)', type: 'number', min: 0, max: 100 },
      { key: 'can_refund', label: 'Process Payment Refunds', type: 'boolean' },
      { key: 'can_void', label: 'Void Invoices & Extra Charges', type: 'boolean' }
    ]
  },
  {
    key: 'counter_till',
    title: 'Front Desk Counter Till',
    icon: Receipt,
    color: 'warning',
    items: [
      { key: 'can_record_expense', label: 'Disburse Counter Petty Cash', type: 'boolean' },
      { key: 'max_expense_limit', label: 'Single Expense Limit Without Approval (₹)', type: 'number', min: 0 },
      { key: 'can_adjust_float', label: 'Perform Safe Drops & Float Adjustments', type: 'boolean' },
      { key: 'can_close_till', label: 'Submit End-of-Day Till Closing', type: 'boolean' }
    ]
  },
  {
    key: 'reports',
    title: 'Reports & Revenue Audits',
    icon: FileText,
    color: 'info',
    items: [
      { key: 'can_view_revenue', label: 'View Financial Revenue & P&L Reports', type: 'boolean' },
      { key: 'can_view_police_gazette', label: 'View Statutory Police Gazette / Form C', type: 'boolean' },
      { key: 'can_export_excel', label: 'Export Data to Excel / CSV', type: 'boolean' }
    ]
  },
  {
    key: 'night_audit',
    title: 'Daily Night Audit',
    icon: Moon,
    color: 'dark',
    items: [
      { key: 'can_run_night_audit', label: 'Execute Daily Night Audit Roll', type: 'boolean' },
      { key: 'can_rollback_audit', label: 'Rollback Completed Night Audit', type: 'boolean' }
    ]
  }
];

const RolePermissionMatrixModal = ({ isOpen, onClose }) => {
  const { refreshProfile } = useAuth();
  const [selectedRole, setSelectedRole] = useState('RECEPTIONIST');
  const [permissionsMatrix, setPermissionsMatrix] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadPermissions();
    }
  }, [isOpen]);

  const loadPermissions = async () => {
    setLoading(true);
    try {
      const res = await getRolePermissionsApi();
      setPermissionsMatrix(res.matrix || {});
    } catch (err) {
      console.error('Failed to load permission matrix:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentRolePerms = permissionsMatrix[selectedRole] || {};

  const handleToggle = (groupKey, itemKey, value) => {
    setPermissionsMatrix(prev => {
      const roleCopy = { ...(prev[selectedRole] || {}) };
      const groupCopy = { ...(roleCopy[groupKey] || {}) };
      groupCopy[itemKey] = value;
      roleCopy[groupKey] = groupCopy;
      return { ...prev, [selectedRole]: roleCopy };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateRolePermissionsApi(selectedRole, currentRolePerms);
      try { await refreshProfile?.(); } catch {}
      setToast(`Permissions for ${selectedRole} saved successfully!`);
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      console.error('Failed to save permissions:', err);
      alert('Failed to save permission matrix. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    if (!window.confirm(`Reset all permissions for ${selectedRole} back to factory defaults?`)) return;
    setSaving(true);
    try {
      await resetRolePermissionsApi(selectedRole);
      await loadPermissions();
      try { await refreshProfile?.(); } catch {}
      setToast(`Permissions for ${selectedRole} reset to defaults.`);
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      console.error('Failed to reset permissions:', err);
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered modal-xl">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
          
          {/* Header */}
          <div className="modal-header border-0 text-white p-4" style={{ background: 'linear-gradient(135deg, #09204c 0%, #1E3A8A 100%)' }}>
            <div className="d-flex align-items-center gap-3">
              <div className="p-2.5 rounded-3 bg-white bg-opacity-15 text-white">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h5 className="modal-title fw-bold text-white mb-0" style={{ letterSpacing: '-0.02em' }}>
                  Owner Staff Permission &amp; CRUD Control Matrix
                </h5>
                <span className="text-white-50 extra-small">
                  Configure feature privileges, rate overrides &amp; database actions per staff role
                </span>
              </div>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} disabled={saving}></button>
          </div>

          {/* Role Tab Switcher Bar */}
          <div className="bg-light px-4 py-3 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div className="d-flex align-items-center gap-2">
              <span className="text-secondary extra-small fw-bold text-uppercase">Configuring Role:</span>
              <div className="btn-group shadow-xs rounded-3 overflow-hidden" role="group">
                <button
                  type="button"
                  className={`btn btn-sm px-3.5 fw-bold ${selectedRole === 'RECEPTIONIST' ? 'btn-primary' : 'btn-white bg-white text-secondary border'}`}
                  onClick={() => setSelectedRole('RECEPTIONIST')}
                >
                  💼 Receptionist
                </button>
                <button
                  type="button"
                  className={`btn btn-sm px-3.5 fw-bold ${selectedRole === 'MANAGER' ? 'btn-primary' : 'btn-white bg-white text-secondary border'}`}
                  onClick={() => setSelectedRole('MANAGER')}
                >
                  👔 Manager
                </button>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary rounded-3 extra-small fw-semibold d-flex align-items-center gap-1.5"
                onClick={handleResetDefaults}
                disabled={loading || saving}
              >
                <RotateCcw size={13} /> Reset Factory Defaults
              </button>
              <button
                type="button"
                className="btn btn-sm btn-success text-white rounded-3 extra-small fw-bold px-3 d-flex align-items-center gap-1.5 shadow-xs"
                onClick={handleSave}
                disabled={loading || saving}
              >
                <Save size={14} /> {saving ? 'Saving...' : 'Save Permission Matrix'}
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="modal-body p-4 bg-slate-50 overflow-y-auto" style={{ backgroundColor: '#F8FAFC' }}>
            
            {/* Toast Notification */}
            {toast && (
              <div className="alert alert-success border-success d-flex align-items-center gap-2 rounded-3 p-3 mb-3 small shadow-sm">
                <CheckCircle2 size={16} className="text-success" />
                <span className="fw-bold text-dark">{toast}</span>
              </div>
            )}

            {/* Note banner */}
            <div className="alert alert-primary-subtle border border-primary-subtle rounded-3 p-3 mb-4 d-flex align-items-start gap-2.5">
              <Info size={18} className="text-primary flex-shrink-0 mt-0.5" />
              <div className="extra-small text-secondary">
                <strong className="text-dark d-block mb-0.5">Hotel Owner Full Authority Notice:</strong>
                As the <strong>Hotel Owner</strong>, you always possess unrestricted 100% access across all modules.
                The toggles below strictly dictate what staff members logged in as <strong>{selectedRole}</strong> are permitted to view, create, edit, delete, or discount.
              </div>
            </div>

            {loading ? (
              <div className="p-5 text-center text-secondary small">
                Loading permission matrix...
              </div>
            ) : (
              <div className="row g-3">
                {PERMISSION_GROUPS.map((group) => {
                  const Icon = group.icon;
                  const groupPerms = currentRolePerms[group.key] || {};

                  return (
                    <div key={group.key} className="col-12 col-md-6">
                      <div className="card border-0 shadow-xs bg-white rounded-3 h-100 overflow-hidden" style={{ border: '1px solid #E2E8F0' }}>
                        <div className="p-3 bg-light border-bottom d-flex align-items-center justify-content-between">
                          <div className="d-flex align-items-center gap-2">
                            <span className="p-1.5 rounded-2 bg-primary text-white">
                              <Icon size={14} />
                            </span>
                            <span className="fw-bold text-dark small">{group.title}</span>
                          </div>
                        </div>

                        <div className="p-3 d-flex flex-column gap-2.5">
                          {group.items.map((item) => {
                            const val = groupPerms[item.key];

                            if (item.type === 'number') {
                              return (
                                <div key={item.key} className="d-flex justify-content-between align-items-center py-1">
                                  <span className="text-dark extra-small fw-semibold">{item.label}</span>
                                  <div className="input-group input-group-sm" style={{ width: '130px' }}>
                                    <input
                                      type="number"
                                      min={item.min ?? 0}
                                      max={item.max}
                                      className="form-control text-end font-monospace fw-bold"
                                      value={val ?? 0}
                                      onChange={(e) => handleToggle(group.key, item.key, parseFloat(e.target.value) || 0)}
                                    />
                                    <span className="input-group-text extra-small">{item.key.includes('percent') ? '%' : '₹'}</span>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div key={item.key} className="d-flex justify-content-between align-items-center py-1 border-bottom-subtle">
                                <label className="text-dark extra-small cursor-pointer m-0" htmlFor={`${selectedRole}-${group.key}-${item.key}`}>
                                  {item.label}
                                </label>
                                <div className="form-check form-switch m-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`${selectedRole}-${group.key}-${item.key}`}
                                    checked={Boolean(val)}
                                    onChange={(e) => handleToggle(group.key, item.key, e.target.checked)}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer bg-white border-top p-3 d-flex justify-content-between align-items-center">
            <span className="text-secondary extra-small">
              Changes take effect immediately for all active {selectedRole.toLowerCase()} sessions.
            </span>
            <div className="d-flex align-items-center gap-2">
              <button type="button" className="btn btn-sm btn-light border" onClick={onClose} disabled={saving}>
                Close
              </button>
              <button type="button" className="btn btn-sm btn-primary px-3 fw-bold" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save & Apply Permissions'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RolePermissionMatrixModal;
