import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Sliders,
  X,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  BedDouble,
  DollarSign,
  Receipt,
  FileText,
  Moon,
  Info,
  Smartphone
} from 'lucide-react';
import { updateUserPermissionsApi } from '../api/authApi';

const PERMISSION_GROUPS = [
  {
    key: 'rooms',
    title: 'Rooms & Tariffs',
    icon: BedDouble,
    color: '#0D9488',
    items: [
      { key: 'can_view', label: 'View Room Grid & Details', type: 'boolean' },
      { key: 'can_create', label: 'Create New Room Assets', type: 'boolean' },
      { key: 'can_edit_tariffs', label: 'Edit Tariffs & Pricing Overrides', type: 'boolean' },
      { key: 'can_change_status', label: 'Change Room Housekeeping Status', type: 'boolean' }
    ]
  },
  {
    key: 'bookings',
    title: 'Bookings & Reservations',
    icon: Calendar,
    color: '#2563EB',
    items: [
      { key: 'can_view', label: 'View Reservations & Calendar', type: 'boolean' },
      { key: 'can_create', label: 'Create New Booking Reservations', type: 'boolean' },
      { key: 'can_edit', label: 'Modify Reservation Dates / Details', type: 'boolean' },
      { key: 'can_cancel', label: 'Cancel Reservations', type: 'boolean' },
      { key: 'can_delete', label: 'Permanently Void / Delete Bookings', type: 'boolean' }
    ]
  },
  {
    key: 'stays',
    title: 'Stays & Front-Desk Check-Ins',
    icon: Building2,
    color: '#6366F1',
    items: [
      { key: 'can_checkin', label: 'Process Walk-in Check-Ins', type: 'boolean' },
      { key: 'can_checkout', label: 'Process Guest Check-Outs', type: 'boolean' },
      { key: 'can_checkout_with_balance', label: 'Allow Check-Out with Unsettled Balance', type: 'boolean' },
      { key: 'can_extend', label: 'Extend Stay Dates & Transfer Rooms', type: 'boolean' }
    ]
  },
  {
    key: 'billing',
    title: 'Billing, Discounts & Payments',
    icon: DollarSign,
    color: '#16A34A',
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
    color: '#D97706',
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
    color: '#0284C7',
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
    color: '#475569',
    items: [
      { key: 'can_run_night_audit', label: 'Execute Daily Night Audit Roll', type: 'boolean' },
      { key: 'can_rollback_audit', label: 'Rollback Completed Night Audit', type: 'boolean' }
    ]
  }
];

const UserPermissionsModal = ({ isOpen, onClose, targetUser, onSuccess }) => {
  const [customPerms, setCustomPerms] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeGroup, setActiveGroup] = useState('rooms');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (isOpen && targetUser) {
      setCustomPerms(targetUser.custom_permissions ? JSON.parse(JSON.stringify(targetUser.custom_permissions)) : {});
    }
  }, [isOpen, targetUser]);

  if (!isOpen || !targetUser) return null;

  // Get current override state: 'DEFAULT', 'ALLOW', 'DENY'
  const getOverrideState = (groupKey, itemKey) => {
    const group = customPerms[groupKey];
    if (!group || !(itemKey in group)) return 'DEFAULT';
    return group[itemKey] ? 'ALLOW' : 'DENY';
  };

  const handleSetOverride = (groupKey, itemKey, state) => {
    setCustomPerms(prev => {
      const copy = { ...prev };
      const groupCopy = { ...(copy[groupKey] || {}) };

      if (state === 'DEFAULT') {
        delete groupCopy[itemKey];
        if (Object.keys(groupCopy).length === 0) {
          delete copy[groupKey];
        } else {
          copy[groupKey] = groupCopy;
        }
      } else if (state === 'ALLOW') {
        groupCopy[itemKey] = true;
        copy[groupKey] = groupCopy;
      } else if (state === 'DENY') {
        groupCopy[itemKey] = false;
        copy[groupKey] = groupCopy;
      }
      return copy;
    });
  };

  const handleNumericChange = (groupKey, itemKey, val) => {
    setCustomPerms(prev => {
      const copy = { ...prev };
      const groupCopy = { ...(copy[groupKey] || {}) };
      if (val === '' || val === null || val === undefined) {
        delete groupCopy[itemKey];
        if (Object.keys(groupCopy).length === 0) {
          delete copy[groupKey];
        } else {
          copy[groupKey] = groupCopy;
        }
      } else {
        groupCopy[itemKey] = Number(val);
        copy[groupKey] = groupCopy;
      }
      return copy;
    });
  };

  const handleResetToDefaults = async () => {
    if (!window.confirm(`Reset all custom permissions for ${targetUser.username} back to default role permissions?`)) return;
    setSaving(true);
    try {
      await updateUserPermissionsApi(targetUser.id, {});
      setCustomPerms({});
      setToast('Custom permission overrides cleared.');
      if (onSuccess) onSuccess({ ...targetUser, custom_permissions: {} });
      setTimeout(() => setToast(null), 2000);
    } catch (err) {
      console.error(err);
      alert('Failed to reset custom permissions.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateUserPermissionsApi(targetUser.id, customPerms);
      setToast(`Custom permissions saved for ${targetUser.username}!`);
      if (onSuccess) onSuccess({ ...targetUser, custom_permissions: customPerms, permissions: res.effective_permissions });
      setTimeout(() => {
        setToast(null);
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to save custom permissions.');
    } finally {
      setSaving(false);
    }
  };

  const currentGroupObj = PERMISSION_GROUPS.find(g => g.key === activeGroup) || PERMISSION_GROUPS[0];
  const overrideCount = Object.keys(customPerms).reduce((acc, g) => acc + Object.keys(customPerms[g] || {}).length, 0);

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', zIndex: 1065 }}>
      <div className="modal-dialog modal-dialog-centered modal-xl">
        <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden" style={{ maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
          
          {/* Header */}
          <div className="modal-header border-0 text-white p-4" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)' }}>
            <div className="d-flex align-items-center gap-3">
              <div className="p-2.5 rounded-3 bg-white bg-opacity-15 text-white">
                <Sliders size={24} />
              </div>
              <div>
                <div className="d-flex align-items-center gap-2">
                  <h5 className="modal-title fw-bold text-white mb-0">
                    Custom Permission Overrides: <span className="font-monospace text-warning">{targetUser.username}</span>
                  </h5>
                  <span className="badge bg-primary text-white extra-small">{targetUser.role}</span>
                  {overrideCount > 0 && (
                    <span className="badge bg-warning text-dark extra-small fw-bold">
                      {overrideCount} Active Override{overrideCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <span className="text-white-50 extra-small">
                  Fine-tune individual manager privileges. Overrides set here take precedence over general role defaults.
                </span>
              </div>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          {/* Toast Notification */}
          {toast && (
            <div className="bg-success text-white py-2 px-4 d-flex align-items-center justify-content-between shadow-xs">
              <div className="d-flex align-items-center gap-2 extra-small fw-bold">
                <CheckCircle2 size={16} />
                <span>{toast}</span>
              </div>
              <button className="btn btn-link text-white p-0" onClick={() => setToast(null)}>
                <X size={14} />
              </button>
            </div>
          )}

          {/* Body */}
          <div className="modal-body p-0 d-flex flex-column flex-md-row" style={{ overflow: 'hidden', flex: 1 }}>
            
            {/* Sidebar Module Navigation */}
            <div className="bg-light border-end p-3 d-flex flex-column gap-1.5" style={{ width: '280px', overflowY: 'auto' }}>
              <div className="extra-small text-uppercase fw-bold text-muted px-2 mb-1">Permission Modules</div>
              {PERMISSION_GROUPS.map((grp) => {
                const Icon = grp.icon;
                const isActive = activeGroup === grp.key;
                const grpOverrides = Object.keys(customPerms[grp.key] || {}).length;

                return (
                  <button
                    key={grp.key}
                    type="button"
                    className={`btn text-start p-2.5 rounded-3 d-flex align-items-center justify-content-between transition-all ${
                      isActive ? 'bg-white shadow-xs fw-bold text-dark border-start border-3 border-primary' : 'text-secondary hover-bg-white border-0'
                    }`}
                    onClick={() => setActiveGroup(grp.key)}
                  >
                    <div className="d-flex align-items-center gap-2.5">
                      <div className="p-1.5 rounded-2" style={{ backgroundColor: `${grp.color}18`, color: grp.color }}>
                        <Icon size={16} />
                      </div>
                      <span className="small">{grp.title}</span>
                    </div>
                    {grpOverrides > 0 && (
                      <span className="badge rounded-pill bg-warning text-dark extra-small" style={{ fontSize: '0.65rem' }}>
                        {grpOverrides}
                      </span>
                    )}
                  </button>
                );
              })}

              <div className="mt-auto pt-3 border-top">
                <div className="p-2.5 rounded-3 bg-info-subtle text-dark extra-small">
                  <div className="fw-bold mb-1 d-flex align-items-center gap-1">
                    <Info size={13} className="text-info" />
                    <span>Override Legend:</span>
                  </div>
                  <div><strong>Default:</strong> Uses role default</div>
                  <div><strong>Grant:</strong> Force allowed for this user</div>
                  <div><strong>Deny:</strong> Force blocked for this user</div>
                </div>
              </div>
            </div>

            {/* Permission Items Panel */}
            <div className="p-4 flex-grow-1" style={{ overflowY: 'auto', backgroundColor: '#FAFAFA' }}>
              <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <div className="p-2 rounded-2" style={{ backgroundColor: `${currentGroupObj.color}20`, color: currentGroupObj.color }}>
                    {React.createElement(currentGroupObj.icon, { size: 20 })}
                  </div>
                  <div>
                    <h6 className="fw-bold mb-0 text-dark">{currentGroupObj.title}</h6>
                    <span className="extra-small text-muted">Configure manager overrides for this module</span>
                  </div>
                </div>
              </div>

              <div className="d-flex flex-column gap-2.5">
                {currentGroupObj.items.map((item) => {
                  const currentState = getOverrideState(currentGroupObj.key, item.key);
                  const isOverridden = currentState !== 'DEFAULT';
                  const isNumber = item.type === 'number';
                  const numericVal = customPerms[currentGroupObj.key]?.[item.key] ?? '';

                  return (
                    <div
                      key={item.key}
                      className={`p-3 rounded-3 border bg-white transition-all ${
                        isOverridden ? 'border-warning shadow-xs' : 'border-secondary-subtle'
                      }`}
                    >
                      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                        <div style={{ maxWidth: '420px' }}>
                          <div className="fw-bold text-dark small d-flex align-items-center gap-2">
                            <span>{item.label}</span>
                            {isOverridden && (
                              <span className="badge bg-warning-subtle text-warning-emphasis border border-warning extra-small py-0.5">
                                Overridden
                              </span>
                            )}
                          </div>
                          <span className="extra-small text-muted font-monospace">{currentGroupObj.key}.{item.key}</span>
                        </div>

                        {/* Control Elements */}
                        {isNumber ? (
                          <div className="d-flex align-items-center gap-2">
                            <span className="extra-small text-muted">Custom Limit:</span>
                            <input
                              type="number"
                              min={item.min ?? 0}
                              max={item.max ?? 999999}
                              className="form-control form-control-sm text-end font-monospace"
                              style={{ width: '110px' }}
                              placeholder="Default"
                              value={numericVal}
                              onChange={(e) => handleNumericChange(currentGroupObj.key, item.key, e.target.value)}
                            />
                            {numericVal !== '' && (
                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm py-0 px-1.5 extra-small"
                                onClick={() => handleNumericChange(currentGroupObj.key, item.key, '')}
                                title="Reset to role default"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="btn-group btn-group-sm" role="group">
                            <button
                              type="button"
                              className={`btn btn-sm extra-small px-2.5 ${
                                currentState === 'DEFAULT' ? 'btn-secondary text-white fw-bold' : 'btn-outline-secondary'
                              }`}
                              onClick={() => handleSetOverride(currentGroupObj.key, item.key, 'DEFAULT')}
                            >
                              Role Default
                            </button>
                            <button
                              type="button"
                              className={`btn btn-sm extra-small px-2.5 ${
                                currentState === 'ALLOW' ? 'btn-success text-white fw-bold' : 'btn-outline-success'
                              }`}
                              onClick={() => handleSetOverride(currentGroupObj.key, item.key, 'ALLOW')}
                            >
                              Allow
                            </button>
                            <button
                              type="button"
                              className={`btn btn-sm extra-small px-2.5 ${
                                currentState === 'DENY' ? 'btn-danger text-white fw-bold' : 'btn-outline-danger'
                              }`}
                              onClick={() => handleSetOverride(currentGroupObj.key, item.key, 'DENY')}
                            >
                              Deny
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer border-top px-4 py-3 bg-white d-flex justify-content-between align-items-center">
            <button
              type="button"
              className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1.5 extra-small fw-semibold"
              onClick={handleResetToDefaults}
              disabled={saving || overrideCount === 0}
            >
              <RotateCcw size={14} />
              <span>Reset All to Role Defaults</span>
            </button>

            <div className="d-flex align-items-center gap-2">
              <button type="button" className="btn btn-light btn-sm fw-semibold" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm fw-bold px-4 text-white d-flex align-items-center gap-2 shadow-sm"
                onClick={handleSave}
                disabled={saving}
                style={{ background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)' }}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Saving Overrides...
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    <span>Save Custom Permissions</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default UserPermissionsModal;
