import React, { useState, useEffect } from 'react';
import {
  Building2,
  DollarSign,
  MapPin,
  Tag,
  Users,
  X,
  AlertTriangle,
  Save,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { createCashDrawerApi, updateCashDrawerApi } from '../api/shiftApi';
import { useAuth } from '../context/AuthContext';

const CashDrawerModal = ({
  isOpen,
  onClose,
  drawer = null,
  defaultPropertyId = null,
  targetPropertyName = '',
  branches: propBranches = [],
  onSuccess,
  onNavigateSettings
}) => {
  const { branches: authBranches, selectedProperty } = useAuth();
  const branchList = propBranches && propBranches.length > 0 ? propBranches : (authBranches || []);

  const isEdit = Boolean(drawer && drawer.id);

  const [propertyId, setPropertyId] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [location, setLocation] = useState('');
  const [defaultFloat, setDefaultFloat] = useState('1000');
  const [allowShared, setAllowShared] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (drawer) {
        setName(drawer.name || '');
        setCode(drawer.code || '');
        setLocation(drawer.location || '');
        setDefaultFloat(drawer.default_float !== undefined && drawer.default_float !== null ? String(drawer.default_float) : '1000');
        setAllowShared(Boolean(drawer.allow_shared_users));
        setIsActive(drawer.is_active !== false);
        const drawerProp = drawer.property || drawer.property_id || defaultPropertyId || selectedProperty?.id || '';
        setPropertyId(drawerProp ? String(drawerProp) : '');
      } else {
        setName('');
        setCode('');
        setLocation('');
        setDefaultFloat('1000');
        setAllowShared(false);
        setIsActive(true);
        const defaultProp = defaultPropertyId || selectedProperty?.id || (branchList[0]?.id ? String(branchList[0].id) : '');
        setPropertyId(defaultProp ? String(defaultProp) : '');
      }
      setError(null);
    }
  }, [isOpen, drawer, defaultPropertyId, selectedProperty]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a desk or counter name (e.g. Main Reception Till #1).');
      return;
    }

    const floatVal = parseFloat(defaultFloat);
    if (isNaN(floatVal) || floatVal < 0) {
      setError('Default opening float must be zero or a positive amount.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload = {
      name: name.trim(),
      code: code.trim() || undefined,
      location: location.trim() || '',
      default_float: floatVal,
      allow_shared_users: allowShared,
      is_active: isActive
    };
    if (propertyId) {
      payload.property = Number(propertyId);
    }

    try {
      let saved;
      if (isEdit) {
        saved = await updateCashDrawerApi(drawer.id, payload);
      } else {
        saved = await createCashDrawerApi(payload);
      }
      if (onSuccess) {
        onSuccess(saved);
      }
      onClose();
    } catch (err) {
      console.error('Failed to save cash drawer desk:', err);
      let errMsg = 'Failed to save counter desk. Please verify inputs.';
      const resData = err.response?.data;
      if (typeof resData === 'string') {
        errMsg = resData;
      } else if (resData?.error) {
        errMsg = resData.error;
      } else if (resData?.message) {
        errMsg = resData.message;
      } else if (resData?.code?.[0]) {
        errMsg = `Counter Code Error: ${resData.code[0]}`;
      } else if (resData?.name?.[0]) {
        errMsg = `Name Error: ${resData.name[0]}`;
      } else if (typeof resData === 'object') {
        const details = Object.entries(resData)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' | ');
        if (details) errMsg = details;
      }
      setError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 1075
      }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '480px' }}>
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          {/* Header Banner */}
          <div
            className="modal-header border-0 text-white p-3.5"
            style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
          >
            <div className="d-flex align-items-center gap-2.5">
              <div
                className="d-flex align-items-center justify-content-center text-white rounded-3 shadow-xs"
                style={{ width: '38px', height: '38px', backgroundColor: 'rgba(255, 255, 255, 0.12)' }}
              >
                <Building2 size={20} />
              </div>
              <div>
                <h5 className="modal-title fw-bold text-white mb-0" style={{ fontSize: '1rem', letterSpacing: '-0.01em' }}>
                  {isEdit ? 'Change Counter / Desk' : 'Add New Counter / Desk'}
                </h5>
                <span className="text-white-50 extra-small" style={{ fontSize: '0.78rem' }}>
                  {isEdit ? 'Modify physical till details and float defaults' : 'Register a new front desk till or POS station'}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              disabled={submitting}
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-3.5 bg-light">
              {error && (
                <div className="alert alert-danger border-danger d-flex align-items-start gap-2 rounded-3 p-2.5 mb-3 small">
                  <AlertTriangle size={16} className="text-danger flex-shrink-0 mt-0.5" />
                  <div>{error}</div>
                </div>
              )}

              {/* Branch Assignment */}
              {branchList.length > 1 ? (
                <div className="mb-3">
                  <label className="form-label extra-small fw-bold text-secondary text-uppercase mb-1 d-flex align-items-center gap-1">
                    <Building2 size={13} className="text-primary" /> Target Branch / Property <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select form-select-sm rounded-3 py-1.5 px-3 extra-small fw-semibold"
                    value={propertyId}
                    onChange={(e) => setPropertyId(e.target.value)}
                    disabled={submitting}
                  >
                    {branchList.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code || b.property_code || 'Branch'}) {b.is_primary ? '• Main' : ''}
                      </option>
                    ))}
                  </select>
                  <span className="text-muted extra-small d-block mt-0.5" style={{ fontSize: '0.7rem' }}>
                    This counter desk belongs exclusively to this selected branch.
                  </span>
                </div>
              ) : (
                <div className="bg-white p-2.5 rounded-3 border mb-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <div className="d-flex align-items-center justify-content-center rounded-2 bg-primary-subtle text-primary p-1.5">
                      <Building2 size={14} />
                    </div>
                    <div>
                      <span className="text-muted extra-small d-block text-uppercase fw-bold" style={{ fontSize: '0.65rem' }}>Operating Branch</span>
                      <span className="extra-small fw-bold text-dark">
                        {branchList[0]?.name || selectedProperty?.name || targetPropertyName || 'Primary Lodge'}
                      </span>
                    </div>
                  </div>
                  <span className="badge bg-light text-muted border font-monospace extra-small px-2 py-0.5">
                    {branchList[0]?.code || branchList[0]?.property_code || selectedProperty?.code || selectedProperty?.property_code || 'MAIN'}
                  </span>
                </div>
              )}

              {/* Desk Name */}
              <div className="mb-3">
                <label className="form-label extra-small fw-bold text-secondary text-uppercase mb-1">
                  Counter / Desk Name <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0 text-muted">
                    <Building2 size={15} />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 ps-0"
                    style={{ fontSize: '0.875rem' }}
                    placeholder="e.g. Main Front Desk Till #1"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={submitting}
                    autoFocus
                  />
                </div>
              </div>

              {/* Desk Code & Location */}
              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label extra-small fw-bold text-secondary text-uppercase mb-1">
                    Desk Code
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted">
                      <Tag size={14} />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 ps-0 text-uppercase font-monospace"
                      style={{ fontSize: '0.825rem' }}
                      placeholder="e.g. POS-MAIN-01"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      disabled={submitting}
                    />
                  </div>
                  <span className="text-muted extra-small" style={{ fontSize: '0.7rem' }}>
                    Auto-generated if blank
                  </span>
                </div>

                <div className="col-6">
                  <label className="form-label extra-small fw-bold text-secondary text-uppercase mb-1">
                    Location
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted">
                      <MapPin size={14} />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 ps-0"
                      style={{ fontSize: '0.825rem' }}
                      placeholder="e.g. Lobby Entrance"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>

              {/* Default Opening Float */}
              <div className="mb-3">
                <label className="form-label extra-small fw-bold text-secondary text-uppercase mb-1">
                  Default Opening Float Amount (₹)
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0 fw-bold text-secondary">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control border-start-0 ps-0 fw-semibold"
                    style={{ fontSize: '0.875rem' }}
                    placeholder="1000.00"
                    value={defaultFloat}
                    onChange={(e) => setDefaultFloat(e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <span className="text-muted extra-small" style={{ fontSize: '0.72rem' }}>
                  Standard baseline cash supplied to drawer at start of each shift.
                </span>
              </div>

              {/* Options Card */}
              <div className="card border p-3 rounded-3 bg-white mb-2 shadow-xs">
                <div className="form-check form-switch mb-2.5">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="allowSharedUsersSwitch"
                    checked={allowShared}
                    onChange={(e) => setAllowShared(e.target.checked)}
                    disabled={submitting}
                  />
                  <label className="form-check-label small fw-semibold text-dark" htmlFor="allowSharedUsersSwitch">
                    Allow Multi-Cashier Shared Access
                  </label>
                  <span className="text-muted extra-small d-block mt-0.5" style={{ fontSize: '0.72rem' }}>
                    Permits multiple cashiers to operate simultaneously without till lockouts.
                  </span>
                </div>

                <div className="form-check form-switch mb-0">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="isDrawerActiveSwitch"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    disabled={submitting}
                  />
                  <label className="form-check-label small fw-semibold text-dark" htmlFor="isDrawerActiveSwitch">
                    Active for Shift Assignment
                  </label>
                  <span className="text-muted extra-small d-block mt-0.5" style={{ fontSize: '0.72rem' }}>
                    Uncheck to temporarily hide this counter from staff shift opening.
                  </span>
                </div>
              </div>

              {onNavigateSettings && (
                <div className="text-end pt-1">
                  <button
                    type="button"
                    className="btn btn-link p-0 text-decoration-none extra-small text-muted d-inline-flex align-items-center gap-1"
                    onClick={() => {
                      onClose();
                      onNavigateSettings();
                    }}
                  >
                    Manage all counters &amp; tills in Settings <ExternalLink size={12} />
                  </button>
                </div>
              )}
            </div>

            <div className="modal-footer border-0 bg-white p-3 d-flex justify-content-between">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm px-3 rounded-3"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm px-4 fw-bold rounded-3 shadow-xs d-inline-flex align-items-center gap-1.5"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    {isEdit ? 'Save Changes' : 'Create Counter Desk'}
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

export default CashDrawerModal;
