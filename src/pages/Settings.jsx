import React, { useEffect, useState } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSettingsApi, updateSettingsApi } from '../api/settingsApi';
import { getAllCashDrawersApi, deleteCashDrawerApi } from '../api/shiftApi';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import PageLoader from '../components/PageLoader';
import RolePermissionMatrixModal from '../components/RolePermissionMatrixModal';
import CashDrawerModal from '../components/CashDrawerModal';
import { compressImage } from '../utils/imageCompressor';
import {
  DEFAULT_WHATSAPP_BOOKING_TEMPLATE,
  DEFAULT_WHATSAPP_CHECKIN_TEMPLATE,
  DEFAULT_WHATSAPP_PAYMENT_TEMPLATE,
  DEFAULT_WHATSAPP_CHECKOUT_TEMPLATE,
  DEFAULT_WHATSAPP_CANCELLATION_TEMPLATE,
  DEFAULT_WHATSAPP_EXTRA_CHARGE_TEMPLATE,
  EVENT_VARIABLES,
  validateTemplate,
  interpolateTemplate,
  getSamplePreviewData,
  getPreferredWhatsAppMode,
  setPreferredWhatsAppMode,
} from '../utils/whatsappHelper';

const Settings = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { showSuccess, showError } = useNotification();
  const { isHotelOwner, isSuperUser, user, selectedProperty, branches } = useAuth();
  const queryClient = useQueryClient();

  const canManageDesks = Boolean(
    isHotelOwner ||
    isSuperUser ||
    user?.is_superuser ||
    ['HOTEL_OWNER', 'SUPER_ADMIN', 'SUPERUSER', 'MANAGER'].includes(user?.role)
  );

  const [settings, setSettings] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPermModal, setShowPermModal] = useState(false);
  const [activeWaEvent, setActiveWaEvent] = useState('BOOKING');
  const [waVarDropdownOpen, setWaVarDropdownOpen] = useState(false);

  // Cash Drawer Desk State with Branch-wise support
  const [selectedDrawerBranchId, setSelectedDrawerBranchId] = useState(
    selectedProperty?.id ? String(selectedProperty.id) : ''
  );
  const [cashDrawers, setCashDrawers] = useState([]);
  const [loadingDrawers, setLoadingDrawers] = useState(false);
  const [drawerModalData, setDrawerModalData] = useState(null); // { mode: 'add'|'edit', drawer: null|obj }
  const [deletingDrawerId, setDeletingDrawerId] = useState(null);

  useEffect(() => {
    if (selectedProperty?.id) {
      setSelectedDrawerBranchId(String(selectedProperty.id));
    }
  }, [selectedProperty?.id]);

  const activeDrawerBranch = (branches && branches.length > 0)
    ? (branches.find((b) => String(b.id) === String(selectedDrawerBranchId)) || selectedProperty || null)
    : selectedProperty || null;

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const {
    data: initialSettings,
    isLoading,
    error,
    refetch: loadSettings,
  } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettingsApi,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (initialSettings) {
      setSettings({
        ...initialSettings,
        whatsapp_booking_template: initialSettings.whatsapp_booking_template || DEFAULT_WHATSAPP_BOOKING_TEMPLATE,
        whatsapp_checkin_template: initialSettings.whatsapp_checkin_template || DEFAULT_WHATSAPP_CHECKIN_TEMPLATE,
        whatsapp_payment_template: initialSettings.whatsapp_payment_template || DEFAULT_WHATSAPP_PAYMENT_TEMPLATE,
        whatsapp_checkout_template: initialSettings.whatsapp_checkout_template || DEFAULT_WHATSAPP_CHECKOUT_TEMPLATE,
        whatsapp_cancellation_template: initialSettings.whatsapp_cancellation_template || DEFAULT_WHATSAPP_CANCELLATION_TEMPLATE,
        whatsapp_extra_charge_template: initialSettings.whatsapp_extra_charge_template || DEFAULT_WHATSAPP_EXTRA_CHARGE_TEMPLATE,
        whatsapp_default_country_code: initialSettings.whatsapp_default_country_code || '+91',
        whatsapp_open_mode: initialSettings.whatsapp_open_mode || 'universal',
        whatsapp_auto_close_tab: initialSettings.whatsapp_auto_close_tab !== false,
        whatsapp_close_delay_seconds: initialSettings.whatsapp_close_delay_seconds || 2,
      });
      if (initialSettings.logo) {
        setLogoPreview(initialSettings.logo);
      }
    }
  }, [initialSettings]);

  useEffect(() => {
    if (error) {
      console.error(error);
      showError('Failed to load lodge settings.', 'Load Error');
    }
  }, [error, showError]);

  const fetchDrawers = async (branchIdOverride) => {
    const targetBranchId = branchIdOverride !== undefined ? branchIdOverride : (selectedDrawerBranchId || selectedProperty?.id);
    try {
      setLoadingDrawers(true);
      const params = {};
      if (targetBranchId) {
        params.property = targetBranchId;
      }
      const list = await getAllCashDrawersApi(params);
      setCashDrawers(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load counter drawers:', err);
    } finally {
      setLoadingDrawers(false);
    }
  };

  useEffect(() => {
    if (canManageDesks) {
      fetchDrawers(selectedDrawerBranchId);
    }
  }, [canManageDesks, selectedDrawerBranchId]);

  useEffect(() => {
    const section = searchParams.get('section');
    if (section === 'counters' || location.hash === '#counters-settings') {
      setTimeout(() => {
        const el = document.getElementById('counters-settings');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.4)';
          setTimeout(() => {
            el.style.boxShadow = '';
          }, 2000);
        }
      }, 350);
    } else if (section === 'whatsapp' || location.hash === '#whatsapp-settings') {
      setTimeout(() => {
        const el = document.getElementById('whatsapp-settings');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.4)';
          setTimeout(() => {
            el.style.boxShadow = '';
          }, 2000);
        }
      }, 350);
    }
  }, [searchParams, location.hash]);

  const handleInsertVariable = (field, variableKey) => {
    const currentVal = settings?.[field] || '';
    const insertion = `{{${variableKey}}}`;
    const textarea = document.getElementById(`textarea-${field}`);
    if (textarea) {
      const start = textarea.selectionStart ?? currentVal.length;
      const end = textarea.selectionEnd ?? currentVal.length;
      const newVal = currentVal.substring(0, start) + insertion + currentVal.substring(end);
      handleChange(field, newVal);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + insertion.length, start + insertion.length);
      }, 50);
    } else {
      handleChange(field, currentVal + ' ' + insertion);
    }
    setWaVarDropdownOpen(false);
  };

  const handleRestoreDefault = (field, defaultTemplate, eventName) => {
    const confirmed = window.confirm(
      `Are you sure you want to restore the default template for ${eventName}?\n\nAny custom changes you made will be replaced with the system standard template.`
    );
    if (confirmed) {
      handleChange(field, defaultTemplate);
      showSuccess(`Default template restored for ${eventName}. Don't forget to click 'Save Settings' to apply.`, 'Template Restored');
    }
  };

  const handleDeleteDrawer = async (drawer) => {
    if (drawer.is_in_use) {
      showError(`Cannot delete counter desk "${drawer.name}" because a shift is actively open on it. Please close the active shift first.`, 'Desk Currently In Use');
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to permanently delete counter desk "${drawer.name}" (${drawer.code})?`);
    if (!confirmed) return;

    setDeletingDrawerId(drawer.id);
    try {
      await deleteCashDrawerApi(drawer.id, selectedDrawerBranchId || selectedProperty?.id);
      showSuccess(`Counter desk "${drawer.name}" deleted successfully.`, 'Desk Removed');
      fetchDrawers(selectedDrawerBranchId);
    } catch (err) {
      console.error('Failed to delete drawer:', err);
      const errMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to delete counter desk.';
      showError(errMsg, 'Delete Failed');
    } finally {
      setDeletingDrawerId(null);
    }
  };

  const handleDrawerSaved = (saved) => {
    showSuccess(`Counter desk "${saved?.name || 'desk'}" saved successfully!`, 'Desk Saved');
    fetchDrawers(selectedDrawerBranchId);
    setDrawerModalData(null);
  };

  const loading = isLoading || !settings;

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (settings?.whatsapp_open_mode) {
        setPreferredWhatsAppMode(settings.whatsapp_open_mode);
      }

      let payload;
      if (logoFile) {
        const compressedLogo = await compressImage(logoFile, { maxWidth: 800, maxHeight: 800 });
        payload = new FormData();
        Object.keys(settings).forEach((k) => {
          if (settings[k] !== null && settings[k] !== undefined && k !== 'logo') {
            payload.append(k, settings[k]);
          }
        });
        payload.append('logo', compressedLogo);
      } else {
        payload = { ...settings };
        delete payload.logo;
      }

      const updated = await updateSettingsApi(payload);
      setSettings(updated);
      if (updated?.logo) {
        setLogoPreview(updated.logo);
      }
      queryClient.setQueryData(['settings'], updated);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      showSuccess('Lodge settings and branding updated successfully!', 'Settings Saved');
    } catch (err) {
      console.error('Failed to update settings:', err);
      let errMsg = 'Failed to update settings.';
      const data = err.response?.data;
      if (typeof data === 'string') {
        errMsg = data;
      } else if (data?.error) {
        errMsg = data.error;
      } else if (data?.detail) {
        errMsg = data.detail;
      } else if (data && typeof data === 'object') {
        const errors = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
        if (errors.length > 0) {
          errMsg = errors.join(' | ');
        }
      }
      showError(errMsg, 'Save Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field, val) => {
    setSettings((prev) => ({ ...prev, [field]: val }));
  };

  if (loading) {
    return <PageLoader fullScreen={false} message="Loading System Settings & Configuration..." />;
  }

  return (
    <div className="row justify-content-center">
      <div className="col-xl-9 col-lg-10">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h4 data-spotlight-id="settings" className="fw-bold m-0 text-dark">Lodge Settings & Configuration</h4>
            <span className="text-muted small">Branding, tax rules, invoice prefixes, and default check-in/out times</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Lodge Branding Information */}
          <div className="card border-0 shadow-sm mb-4 rounded-4 overflow-hidden">
            <div className="card-header bg-primary text-white py-3 px-4">
              <h5 className="m-0 fw-bold fs-6"><i className="bi bi-building me-2"></i>Lodge Property Information & Branding</h5>
            </div>
            <div className="card-body p-4">
              {/* Logo Upload Section */}
              <div className="d-flex flex-column flex-sm-row align-items-sm-center gap-4 p-3 bg-light rounded-3 mb-4 border">
                <div
                  className="rounded-3 border d-flex align-items-center justify-content-center bg-white shadow-xs overflow-hidden flex-shrink-0"
                  style={{ width: '80px', height: '80px', minWidth: '80px' }}
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="Lodge Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <i className="bi bi-image fs-1 text-secondary"></i>
                  )}
                </div>
                <div className="flex-grow-1">
                  <label className="form-label small fw-bold text-dark mb-1">Lodge Logo (Invoices, Receipts, and Dashboard)</label>
                  <input
                    type="file"
                    className="form-control form-control-sm"
                    accept="image/*"
                    onChange={handleLogoChange}
                  />
                  <span className="text-muted extra-small d-block mt-1">
                    Upload PNG, JPG or SVG. This logo appears dynamically on POS thermal bills, invoices, and GRC cards.
                  </span>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Lodge Name *</label>
                  <input type="text" className="form-control py-2.5" style={{ height: '46px' }} required value={settings.lodge_name || ''} onChange={(e) => handleChange('lodge_name', e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">GSTIN / Tax Number</label>
                  <input type="text" className="form-control py-2.5" style={{ height: '46px' }} value={settings.gst_number || ''} onChange={(e) => handleChange('gst_number', e.target.value)} />
                </div>
                <div className="col-md-12">
                  <label className="form-label small fw-semibold">Lodge Address *</label>
                  <textarea className="form-control p-2.5" rows="2" required value={settings.address || ''} onChange={(e) => handleChange('address', e.target.value)}></textarea>
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-semibold">Phone Number</label>
                  <input type="text" className="form-control py-2.5" style={{ height: '46px' }} value={settings.phone || ''} onChange={(e) => handleChange('phone', e.target.value)} />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-semibold">Email Address</label>
                  <input type="email" className="form-control py-2.5" style={{ height: '46px' }} value={settings.email || ''} onChange={(e) => handleChange('email', e.target.value)} />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-semibold">Website</label>
                  <input type="text" className="form-control py-2.5" style={{ height: '46px' }} value={settings.website || ''} onChange={(e) => handleChange('website', e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Billing & Tax Settings */}
          <div data-spotlight-id="settings-invoice" className="card border-0 shadow-sm mb-4 rounded-4 overflow-hidden">
            <div className="card-header bg-white py-3 px-4 border-bottom">
              <h5 className="m-0 fw-bold fs-6 text-dark"><i className="bi bi-calculator me-2 text-primary"></i>Billing & Tax Configuration</h5>
            </div>
            <div className="card-body p-4">
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label small fw-semibold">Currency Symbol</label>
                  <input type="text" className="form-control py-2.5" style={{ height: '46px' }} value={settings.currency || '₹'} onChange={(e) => handleChange('currency', e.target.value)} />
                </div>
                <div className="col-md-4 d-flex align-items-center">
                  <div className="form-check form-switch mt-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="taxSwitch"
                      checked={settings.tax_enabled || false}
                      onChange={(e) => handleChange('tax_enabled', e.target.checked)}
                    />
                    <label className="form-check-label small fw-semibold" htmlFor="taxSwitch">Enable GST / Tax Calculation</label>
                  </div>
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-semibold">Tax Percentage (%)</label>
                  <input type="number" step="0.01" className="form-control py-2.5" style={{ height: '46px' }} value={settings.tax_percentage || 0} onChange={(e) => handleChange('tax_percentage', e.target.value)} disabled={!settings.tax_enabled} />
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-semibold">Invoice Number Prefix</label>
                  <input type="text" className="form-control py-2.5" style={{ height: '46px' }} value={settings.invoice_prefix || 'INV-'} onChange={(e) => handleChange('invoice_prefix', e.target.value)} />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-semibold">Booking Number Prefix</label>
                  <input type="text" className="form-control py-2.5" style={{ height: '46px' }} value={settings.booking_prefix || 'BK-'} onChange={(e) => handleChange('booking_prefix', e.target.value)} />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-semibold">Stay Number Prefix</label>
                  <input type="text" className="form-control py-2.5" style={{ height: '46px' }} value={settings.stay_prefix || 'STAY-'} onChange={(e) => handleChange('stay_prefix', e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Default Check-Out Time Setting */}
          <div className="card border-0 shadow-sm mb-4 rounded-4 overflow-hidden">
            <div className="card-header bg-white py-3 px-4 border-bottom">
              <h5 className="m-0 fw-bold fs-6 text-dark"><i className="bi bi-clock me-2 text-primary"></i>Default Check-Out Time Setting</h5>
            </div>
            <div className="card-body p-4">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Default Check-Out Time *</label>
                  <input type="time" className="form-control py-2.5" style={{ height: '46px' }} required value={settings.default_checkout_time ? settings.default_checkout_time.substring(0, 5) : '11:00'} onChange={(e) => handleChange('default_checkout_time', e.target.value)} />
                  <span className="text-muted extra-small mt-1.5 d-block">
                    Standard property checkout time used as default for walk-ins, reservations, and checkout schedules.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Owner Role & Dynamic Permission Matrix Control */}
          <div data-spotlight-id="settings-permissions" className="card border-0 shadow-sm mb-4 rounded-4 overflow-hidden" style={{ border: '1px solid #E2E8F0' }}>
            <div className="card-header bg-white py-3 px-4 border-bottom d-flex justify-content-between align-items-center">
              <h5 className="m-0 fw-bold fs-6 text-dark">
                <i className="bi bi-shield-check me-2 text-primary"></i>Staff Role Permissions &amp; Model CRUD Governance
              </h5>
              <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill extra-small px-2.5 py-1">
                Owner Access Control
              </span>
            </div>
            <div className="card-body p-4">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                <div>
                  <h6 className="fw-bold text-dark mb-1">Custom Staff Permissions &amp; Database Model CRUD Matrix</h6>
                  <p className="text-secondary small m-0" style={{ maxWidth: '650px' }}>
                    As the Hotel Owner, you have full authority to grant or revoke specific feature privileges, tariff overrides, discount limits, deletion rights, and counter expense caps for <strong>Managers</strong> and <strong>Receptionists</strong>.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-primary fw-bold px-3.5 py-2.5 rounded-3 shadow-xs d-flex align-items-center gap-2 text-white flex-shrink-0"
                  onClick={() => setShowPermModal(true)}
                >
                  <i className="bi bi-gear-wide-connected"></i> Configure Role Permissions Matrix
                </button>
              </div>
            </div>
          </div>

          {/* Front Desk Counters & Cash Drawers (Tills) - Owner Managed */}
          {canManageDesks && (
            <div
              className="card border-0 shadow-sm mb-4 rounded-4 overflow-hidden"
              id="counters-settings"
              style={{ transition: 'all 0.3s ease' }}
            >
              <div className="card-header bg-white py-3 px-4 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-3">
                <div>
                  <h5 className="m-0 fw-bold fs-6 text-dark d-flex align-items-center gap-2">
                    <i className="bi bi-display text-primary"></i> Front Desk Counters &amp; Cash Drawers
                  </h5>
                  <span className="text-secondary extra-small">
                    Configure reception desks, POS registers, and default cash floats for shift operations.
                  </span>
                </div>
                <div className="d-flex align-items-center flex-wrap gap-2">
                  {branches && branches.length > 1 ? (
                    <div className="d-flex align-items-center gap-1.5 bg-light px-2.5 py-1 rounded-3 border" style={{ minWidth: '220px' }}>
                      <i className="bi bi-geo-alt-fill text-primary small"></i>
                      <span className="extra-small fw-bold text-muted text-uppercase" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>Branch:</span>
                      <select
                        className="form-select form-select-sm border-0 bg-transparent fw-semibold text-dark p-0 ps-1 extra-small shadow-none"
                        style={{ cursor: 'pointer', fontSize: '0.8rem' }}
                        value={selectedDrawerBranchId}
                        onChange={(e) => setSelectedDrawerBranchId(e.target.value)}
                      >
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.code || b.property_code || 'Branch'}) {b.is_primary ? '• Main' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : activeDrawerBranch ? (
                    <span className="badge bg-light text-dark border extra-small px-2.5 py-1.5 d-inline-flex align-items-center gap-1.5 rounded-3">
                      <i className="bi bi-geo-alt-fill text-primary"></i>
                      <span>{activeDrawerBranch.name}</span>
                      {(activeDrawerBranch.code || activeDrawerBranch.property_code) && (
                        <span className="text-muted font-monospace">({activeDrawerBranch.code || activeDrawerBranch.property_code})</span>
                      )}
                    </span>
                  ) : null}

                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill extra-small px-2.5 py-1">
                    {cashDrawers.length} {cashDrawers.length === 1 ? 'Desk' : 'Desks'}
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary rounded-3 px-3 py-1.5 extra-small fw-bold d-inline-flex align-items-center gap-1.5 shadow-xs"
                    onClick={() => setDrawerModalData({ mode: 'add', drawer: null })}
                  >
                    <span style={{ color: '#86efac', fontWeight: 'bold', fontSize: '1rem', lineHeight: 1 }}>+</span> Add Counter / Desk
                  </button>
                </div>
              </div>

              <div className="card-body p-4">
                {loadingDrawers ? (
                  <div className="text-center py-4 text-muted small">
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Loading counter desks...
                  </div>
                ) : cashDrawers.length === 0 ? (
                  <div className="text-center py-4 px-3 bg-light rounded-3 border">
                    <i className="bi bi-inbox text-muted fs-2 d-block mb-2"></i>
                    <h6 className="fw-bold text-dark mb-1">
                      No Front Desk Counters Configured {activeDrawerBranch ? `for ${activeDrawerBranch.name}` : ''}
                    </h6>
                    <p className="text-secondary extra-small mb-3" style={{ maxWidth: '440px', margin: '0 auto' }}>
                      Add your physical front desk counters or POS cash registers for {activeDrawerBranch?.name || 'this branch'} so receptionists can open shifts and balance tills.
                    </p>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary rounded-3 px-3 py-1.5 extra-small fw-bold d-inline-flex align-items-center gap-1.5"
                      onClick={() => setDrawerModalData({ mode: 'add', drawer: null })}
                    >
                      <span style={{ color: '#86efac', fontWeight: 'bold' }}>+</span> Add Primary Counter Desk
                    </button>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                      <thead className="table-light">
                        <tr className="text-secondary extra-small text-uppercase">
                          <th className="py-2.5 ps-3">Counter / Desk Name</th>
                          <th className="py-2.5">Code</th>
                          {branches && branches.length > 1 && <th className="py-2.5">Branch</th>}
                          <th className="py-2.5">Location</th>
                          <th className="py-2.5 text-end">Default Float</th>
                          <th className="py-2.5 text-center">Multi-Cashier</th>
                          <th className="py-2.5 text-center">Status</th>
                          <th className="py-2.5">Live Shift Status</th>
                          <th className="py-2.5 text-end pe-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cashDrawers.map((d) => (
                          <tr key={d.id}>
                            <td className="ps-3">
                              <div className="fw-bold text-dark">{d.name}</div>
                            </td>
                            <td>
                              <span className="badge bg-secondary-subtle text-secondary font-monospace extra-small px-2 py-1">
                                {d.code || '—'}
                              </span>
                            </td>
                            {branches && branches.length > 1 && (
                              <td>
                                <span className="badge bg-light text-secondary border extra-small px-2 py-0.5 rounded-pill">
                                  {d.property_name || activeDrawerBranch?.name || '—'}
                                </span>
                              </td>
                            )}
                            <td className="text-secondary small">
                              {d.location || '—'}
                            </td>
                            <td className="text-end fw-bold font-monospace text-dark">
                              ₹{parseFloat(d.default_float || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="text-center">
                              {d.allow_shared_users ? (
                                <span className="badge bg-info-subtle text-info border border-info-subtle extra-small px-2 py-0.5 rounded-pill">
                                  Shared
                                </span>
                              ) : (
                                <span className="badge bg-light text-muted border extra-small px-2 py-0.5 rounded-pill">
                                  Dedicated
                                </span>
                              )}
                            </td>
                            <td className="text-center">
                              {d.is_active ? (
                                <span className="badge bg-success-subtle text-success border border-success-subtle extra-small px-2 py-0.5 rounded-pill">
                                  Active
                                </span>
                              ) : (
                                <span className="badge bg-danger-subtle text-danger border border-danger-subtle extra-small px-2 py-0.5 rounded-pill">
                                  Inactive
                                </span>
                              )}
                            </td>
                            <td>
                              {d.is_in_use ? (
                                <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle extra-small px-2 py-1 rounded-2 d-inline-flex align-items-center gap-1">
                                  <i className="bi bi-person-fill"></i> In Use ({d.current_cashier_name || 'Staff'})
                                </span>
                              ) : (
                                <span className="badge bg-light text-success border border-success-subtle extra-small px-2 py-1 rounded-2 d-inline-flex align-items-center gap-1">
                                  <i className="bi bi-check2"></i> Available
                                </span>
                              )}
                            </td>
                            <td className="text-end pe-3">
                              <div className="d-inline-flex align-items-center gap-1.5">
                                <button
                                  type="button"
                                  className="btn btn-outline-primary btn-sm py-1 px-2.5 extra-small fw-semibold rounded-2 d-inline-flex align-items-center gap-1"
                                  onClick={() => setDrawerModalData({ mode: 'edit', drawer: d })}
                                  title="Change / Edit Counter"
                                >
                                  <span style={{ color: '#ca8a04' }}>✏️</span> Change
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm py-1 px-2.5 extra-small fw-semibold rounded-2 d-inline-flex align-items-center gap-1"
                                  onClick={() => handleDeleteDrawer(d)}
                                  disabled={deletingDrawerId === d.id || d.is_in_use}
                                  title={d.is_in_use ? 'Cannot delete while a shift is open on this desk' : 'Delete Counter'}
                                >
                                  {deletingDrawerId === d.id ? (
                                    <span className="spinner-border spinner-border-sm" role="status"></span>
                                  ) : (
                                    <i className="bi bi-trash"></i>
                                  )}
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Shift & Till Security & Notifications */}
          <div className="card border-0 shadow-sm mb-4 rounded-4 overflow-hidden">
            <div className="card-header bg-white py-3 px-4 border-bottom d-flex justify-content-between align-items-center">
              <h5 className="m-0 fw-bold fs-6 text-dark">
                <i className="bi bi-shield-lock-fill me-2 text-primary"></i>Shift Security &amp; Executive Notifications
              </h5>
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill extra-small px-2.5 py-1">
                Till Governance
              </span>
            </div>
            <div className="card-body p-4">
              
              {/* Blind Cash Count Toggle Banner */}
              <div className="p-3 rounded-3 bg-light border mb-4 d-flex justify-content-between align-items-center">
                <div className="pe-3">
                  <div className="d-flex align-items-center gap-2">
                    <span className="fw-bold text-dark small">Enable Blind Till Closing (Hide Expected Cash from Cashiers)</span>
                    <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill extra-small">Anti-Theft Security</span>
                  </div>
                  <span className="text-secondary extra-small d-block mt-0.5">
                    When enabled, receptionists cannot see the system's expected cash during closing and must physically count all notes. Managers can still see all totals.
                  </span>
                </div>
                <div className="form-check form-switch m-0 flex-shrink-0">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="enableBlindTillToggle"
                    checked={!!settings.enable_blind_till_closing}
                    onChange={(e) => handleChange('enable_blind_till_closing', e.target.checked)}
                  />
                </div>
              </div>

              <div className="row g-4">
                {/* Email Alerts Toggle & Recipients */}
                <div className="col-md-6 border-end-md">
                  <div className="d-flex justify-content-between align-items-center mb-2.5">
                    <div>
                      <div className="fw-bold text-dark small mb-0.5">Send Shift Closing Email Alerts</div>
                      <span className="text-secondary extra-small">Instant executive till closing breakdown sent via Email</span>
                    </div>
                    <div className="form-check form-switch m-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="notifyShiftEmailToggle"
                        checked={!!settings.notify_shift_close_email}
                        onChange={(e) => handleChange('notify_shift_close_email', e.target.checked)}
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="form-label extra-small fw-bold text-secondary text-uppercase mb-1">
                      Manager &amp; Owner Alert Emails
                    </label>
                    <input
                      type="text"
                      className="form-control py-2"
                      style={{ fontSize: '0.85rem' }}
                      placeholder="owner@hotel.com, manager@hotel.com"
                      value={settings.shift_alert_emails || ''}
                      onChange={(e) => handleChange('shift_alert_emails', e.target.value)}
                      disabled={!settings.notify_shift_close_email}
                    />
                    <span className="text-muted extra-small mt-1 d-block">
                      Separate multiple emails with commas. If blank, defaults to property email.
                    </span>
                  </div>
                </div>

                {/* WhatsApp Alerts Toggle & Recipients */}
                <div className="col-md-6">
                  <div className="d-flex justify-content-between align-items-center mb-2.5">
                    <div>
                      <div className="fw-bold text-dark small mb-0.5">Send Shift Closing WhatsApp Alerts</div>
                      <span className="text-secondary extra-small">Instant mobile drawer summary &amp; discrepancy alerts</span>
                    </div>
                    <div className="form-check form-switch m-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="notifyShiftWaToggle"
                        checked={!!settings.notify_shift_close_whatsapp}
                        onChange={(e) => handleChange('notify_shift_close_whatsapp', e.target.checked)}
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="form-label extra-small fw-bold text-secondary text-uppercase mb-1">
                      Manager &amp; Owner WhatsApp Numbers
                    </label>
                    <input
                      type="text"
                      className="form-control py-2"
                      style={{ fontSize: '0.85rem' }}
                      placeholder="+919876543210, +919876543211"
                      value={settings.shift_alert_phones || ''}
                      onChange={(e) => handleChange('shift_alert_phones', e.target.value)}
                      disabled={!settings.notify_shift_close_whatsapp}
                    />
                    <span className="text-muted extra-small mt-1 d-block">
                      Include country code (e.g. +91). Separate multiple numbers with commas.
                    </span>
                  </div>
                </div>

                {/* Optional WhatsApp Gateway Settings */}
                {settings.notify_shift_close_whatsapp && (
                  <div className="col-12 pt-3 border-top">
                    <div className="p-3 bg-light rounded-3 border">
                      <div className="fw-bold text-dark extra-small text-uppercase mb-2">
                        Custom WhatsApp Webhook / Gateway Configuration (Optional)
                      </div>
                      <div className="row g-2">
                        <div className="col-md-7">
                          <label className="form-label extra-small fw-semibold text-secondary mb-1">Gateway API Endpoint URL</label>
                          <input
                            type="url"
                            className="form-control form-control-sm"
                            placeholder="https://api.whatsapp-gateway.com/send"
                            value={settings.whatsapp_api_url || ''}
                            onChange={(e) => handleChange('whatsapp_api_url', e.target.value)}
                          />
                        </div>
                        <div className="col-md-5">
                          <label className="form-label extra-small fw-semibold text-secondary mb-1">API Key / Bearer Token</label>
                          <input
                            type="password"
                            className="form-control form-control-sm"
                            placeholder="Token / Secret Key"
                            value={settings.whatsapp_api_key || ''}
                            onChange={(e) => handleChange('whatsapp_api_key', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Petty Cash Governance & Spending Limits */}
                <div className="col-12 pt-3 border-top">
                  <div className="fw-bold text-dark small mb-2 d-flex align-items-center gap-2">
                    <i className="bi bi-cash-stack text-primary"></i>
                    Petty Cash Spending Limits &amp; Manager Override PIN
                  </div>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label extra-small fw-bold text-secondary text-uppercase mb-1">
                        Max Expense Without Approval (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control py-2"
                        style={{ fontSize: '0.85rem' }}
                        value={settings.max_cash_expense_without_approval ?? 500}
                        onChange={(e) => handleChange('max_cash_expense_without_approval', e.target.value)}
                      />
                      <span className="text-muted extra-small mt-1 d-block">
                        Expenses exceeding this amount require manager PIN authorization.
                      </span>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label extra-small fw-bold text-secondary text-uppercase mb-1">
                        Daily Petty Cash Limit (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control py-2"
                        style={{ fontSize: '0.85rem' }}
                        value={settings.daily_petty_cash_cap ?? 2000}
                        onChange={(e) => handleChange('daily_petty_cash_cap', e.target.value)}
                      />
                      <span className="text-muted extra-small mt-1 d-block">
                        Maximum aggregate petty cash allowed per day/shift across property.
                      </span>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label extra-small fw-bold text-secondary text-uppercase mb-1">
                        Manager Override PIN
                      </label>
                      <input
                        type="password"
                        className="form-control py-2 font-monospace fw-bold"
                        style={{ fontSize: '0.85rem', letterSpacing: '0.15em' }}
                        placeholder="e.g. 1234"
                        value={settings.manager_override_pin || ''}
                        onChange={(e) => handleChange('manager_override_pin', e.target.value)}
                      />
                      <span className="text-muted extra-small mt-1 d-block">
                        PIN entered by cashiers for overriding expense or closing limits.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* WhatsApp Customer Messaging Configuration */}
          <div id="whatsapp-settings" className="card border-0 shadow-sm mb-4 rounded-4 overflow-hidden">
            <div className="card-header bg-white py-3 px-4 border-bottom d-flex justify-content-between align-items-center">
              <h5 className="m-0 fw-bold fs-6 text-dark d-flex align-items-center gap-2">
                <i className="bi bi-whatsapp fs-5" style={{ color: '#25D366' }}></i>
                <span>WhatsApp Customer Messages</span>
              </h5>
              <div className="d-flex align-items-center gap-2">
                <span className={`badge ${settings.whatsapp_enabled ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-light text-muted border'} rounded-pill extra-small px-2.5 py-1`}>
                  {settings.whatsapp_enabled ? 'Feature Active' : 'Feature Disabled'}
                </span>
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill extra-small px-2.5 py-1">
                  Manual Click-to-Chat
                </span>
              </div>
            </div>

            <div className="card-body p-4">
              {/* Master Toggle Banner */}
              <div className={`p-3.5 rounded-3 border mb-4 d-flex justify-content-between align-items-center ${settings.whatsapp_enabled ? 'bg-success-subtle border-success-subtle' : 'bg-light'}`}>
                <div className="pe-3">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span className="fw-bold text-dark small">Enable WhatsApp Customer Messaging</span>
                    <span className="badge bg-success text-white rounded-pill extra-small">Master Control</span>
                  </div>
                  <span className="text-secondary extra-small d-block">
                    Allow front desk staff to manually contact customers on WhatsApp after key events (Booking, Check-In, Payment, Check-Out).
                    {!settings.whatsapp_enabled && (
                      <span className="d-block text-muted mt-1 fw-semibold">
                        (Currently Disabled: WhatsApp buttons are completely hidden across the entire application).
                      </span>
                    )}
                  </span>
                </div>
                <div className="form-check form-switch m-0 flex-shrink-0">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="whatsappMasterToggle"
                    style={{ width: '2.75rem', height: '1.4rem', cursor: 'pointer' }}
                    checked={!!settings.whatsapp_enabled}
                    onChange={(e) => handleChange('whatsapp_enabled', e.target.checked)}
                  />
                </div>
              </div>

              {settings.whatsapp_enabled ? (
                <>
                  {/* Default Country Code Setting */}
                  <div className="p-3 bg-light rounded-3 border mb-3">
                    <div className="row align-items-center g-3">
                      <div className="col-md-7">
                        <label className="form-label extra-small fw-bold text-dark mb-0.5">
                          Default International Country Code
                        </label>
                        <span className="text-muted extra-small d-block">
                          Applied automatically when customer numbers are entered as 10 digits without an international prefix (e.g. <code>9876543210</code> → <code>+919876543210</code>).
                        </span>
                      </div>
                      <div className="col-md-5">
                        <div className="input-group input-group-sm">
                          <span className="input-group-text bg-white fw-bold text-secondary">
                            <i className="bi bi-globe2 me-1"></i> Country Code
                          </span>
                          <input
                            type="text"
                            className="form-control fw-bold font-monospace"
                            style={{ fontSize: '0.9rem' }}
                            placeholder="+91"
                            value={settings.whatsapp_default_country_code || '+91'}
                            onChange={(e) => handleChange('whatsapp_default_country_code', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Opening Destination Preference */}
                  <div className="p-3 bg-light rounded-3 border mb-3">
                    <div className="row align-items-center g-3">
                      <div className="col-md-7">
                        <label className="form-label extra-small fw-bold text-dark mb-0.5">
                          WhatsApp Opening Destination
                        </label>
                        <span className="text-muted extra-small d-block">
                          Choose how WhatsApp launches when clicking send buttons: WhatsApp Desktop App (with auto-closing tab), Direct App Launch, WhatsApp Web, or Universal Link (wa.me).
                        </span>
                      </div>
                      <div className="col-md-5">
                        <select
                          className="form-select form-select-sm fw-semibold"
                          value={getPreferredWhatsAppMode(settings)}
                          onChange={(e) => {
                            setPreferredWhatsAppMode(e.target.value);
                            handleChange('whatsapp_open_mode', e.target.value);
                          }}
                        >
                          <option value="universal">📱 Universal Link (wa.me) - Recommended (Reliable on all devices)</option>
                          <option value="web">🌐 WhatsApp Web (web.whatsapp.com) - Direct Browser Tab</option>
                          <option value="app_autoclose">🚀 WhatsApp App (Auto-Closes Launcher Tab)</option>
                          <option value="app_direct">⚡ Direct App Launch (No Tab Opened)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Auto-Close Browser Tab Setting */}
                  <div className="p-3 bg-light rounded-3 border mb-4">
                    <div className="row align-items-center g-3">
                      <div className="col-md-7">
                        <div className="d-flex align-items-center gap-2 mb-0.5">
                          <label className="form-label extra-small fw-bold text-dark mb-0">
                            Auto-Close Browser Tab After Launching App
                          </label>
                          <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill extra-small">
                            Auto Clean-Up
                          </span>
                        </div>
                        <span className="text-muted extra-small d-block">
                          Automatically closes the temporary launcher tab once the WhatsApp Desktop application opens, preventing unnecessary tabs from remaining open in your browser.
                        </span>
                      </div>
                      <div className="col-md-5">
                        <div className="d-flex align-items-center justify-content-between gap-3">
                          <div className="d-flex align-items-center gap-2">
                            <span className="extra-small text-muted fw-semibold">Delay:</span>
                            <select
                              className="form-select form-select-sm"
                              style={{ width: '90px' }}
                              value={settings.whatsapp_close_delay_seconds || 2}
                              onChange={(e) => handleChange('whatsapp_close_delay_seconds', parseInt(e.target.value, 10))}
                              disabled={settings.whatsapp_auto_close_tab === false}
                            >
                              <option value={1}>1 sec</option>
                              <option value={2}>2 secs</option>
                              <option value={3}>3 secs</option>
                              <option value={5}>5 secs</option>
                            </select>
                          </div>
                          <div className="form-check form-switch m-0 flex-shrink-0">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="autoCloseTabToggle"
                              style={{ width: '2.5rem', height: '1.3rem', cursor: 'pointer' }}
                              checked={settings.whatsapp_auto_close_tab !== false}
                              onChange={(e) => handleChange('whatsapp_auto_close_tab', e.target.checked)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Event Navigation Tabs */}
                  <div className="mb-3">
                    <label className="form-label extra-small fw-bold text-secondary text-uppercase mb-2">
                      Select Event to Configure Template &amp; Triggers
                    </label>
                    <div className="d-flex flex-wrap gap-2">
                      {[
                        { key: 'BOOKING', label: '1. Booking Confirmation', field: 'whatsapp_booking_enabled', icon: 'bi-calendar-check' },
                        { key: 'CHECK_IN', label: '2. Check-In Welcome', field: 'whatsapp_checkin_enabled', icon: 'bi-key-fill' },
                        { key: 'PAYMENT', label: '3. Payment Received', field: 'whatsapp_payment_enabled', icon: 'bi-credit-card-2-front-fill' },
                        { key: 'CHECK_OUT', label: '4. Check-Out Thank You', field: 'whatsapp_checkout_enabled', icon: 'bi-door-closed-fill' },
                        { key: 'CANCELLATION', label: '5. Booking Cancellation', field: 'whatsapp_cancellation_enabled', icon: 'bi-x-circle-fill' },
                        { key: 'EXTRA_CHARGE', label: '6. Extra Charges Added', field: 'whatsapp_extra_charge_enabled', icon: 'bi-cart-plus-fill' },
                      ].map((evt) => {
                        const isActive = activeWaEvent === evt.key;
                        const isEnabled = settings[evt.field] !== false;
                        return (
                          <button
                            key={evt.key}
                            type="button"
                            className={`btn btn-sm py-2 px-3 rounded-3 d-inline-flex align-items-center gap-2 fw-semibold transition-all ${
                              isActive
                                ? 'btn-primary shadow-xs'
                                : 'btn-light border text-dark'
                            }`}
                            onClick={() => setActiveWaEvent(evt.key)}
                          >
                            <i className={`bi ${evt.icon}`}></i>
                            <span>{evt.label}</span>
                            <span
                              className={`badge rounded-pill extra-small px-1.5 py-0.5 ${
                                isEnabled
                                  ? isActive
                                    ? 'bg-white text-primary'
                                    : 'bg-success-subtle text-success border border-success-subtle'
                                  : 'bg-secondary text-white'
                              }`}
                            >
                              {isEnabled ? 'ON' : 'OFF'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Event Template Configuration Card */}
                  {(() => {
                    let eventTitle = '';
                    let toggleField = '';
                    let templateField = '';
                    let defaultTemplate = '';
                    let eventVariables = [];

                    switch (activeWaEvent) {
                      case 'BOOKING':
                        eventTitle = 'Booking Created / Confirmed';
                        toggleField = 'whatsapp_booking_enabled';
                        templateField = 'whatsapp_booking_template';
                        defaultTemplate = DEFAULT_WHATSAPP_BOOKING_TEMPLATE;
                        eventVariables = EVENT_VARIABLES.BOOKING;
                        break;
                      case 'CHECK_IN':
                        eventTitle = 'Check-In Completed (Welcome Message)';
                        toggleField = 'whatsapp_checkin_enabled';
                        templateField = 'whatsapp_checkin_template';
                        defaultTemplate = DEFAULT_WHATSAPP_CHECKIN_TEMPLATE;
                        eventVariables = EVENT_VARIABLES.CHECK_IN;
                        break;
                      case 'PAYMENT':
                        eventTitle = 'Payment Received (Receipt Confirmation)';
                        toggleField = 'whatsapp_payment_enabled';
                        templateField = 'whatsapp_payment_template';
                        defaultTemplate = DEFAULT_WHATSAPP_PAYMENT_TEMPLATE;
                        eventVariables = EVENT_VARIABLES.PAYMENT;
                        break;
                      case 'CHECK_OUT':
                        eventTitle = 'Check-Out Completed (Thank You Message)';
                        toggleField = 'whatsapp_checkout_enabled';
                        templateField = 'whatsapp_checkout_template';
                        defaultTemplate = DEFAULT_WHATSAPP_CHECKOUT_TEMPLATE;
                        eventVariables = EVENT_VARIABLES.CHECK_OUT;
                        break;
                      case 'CANCELLATION':
                        eventTitle = 'Booking Cancellation Notice';
                        toggleField = 'whatsapp_cancellation_enabled';
                        templateField = 'whatsapp_cancellation_template';
                        defaultTemplate = DEFAULT_WHATSAPP_CANCELLATION_TEMPLATE;
                        eventVariables = EVENT_VARIABLES.CANCELLATION;
                        break;
                      case 'EXTRA_CHARGE':
                        eventTitle = 'Extra Charge Added to Stay';
                        toggleField = 'whatsapp_extra_charge_enabled';
                        templateField = 'whatsapp_extra_charge_template';
                        defaultTemplate = DEFAULT_WHATSAPP_EXTRA_CHARGE_TEMPLATE;
                        eventVariables = EVENT_VARIABLES.EXTRA_CHARGE;
                        break;
                      default:
                        break;
                    }

                    const currentTemplate = settings[templateField] !== undefined && settings[templateField] !== ''
                      ? settings[templateField]
                      : defaultTemplate;
                    const isEventEnabled = settings[toggleField] !== false;
                    const invalidVariables = validateTemplate(currentTemplate, eventVariables);
                    const previewSampleData = getSamplePreviewData(activeWaEvent, settings);
                    const previewRendered = interpolateTemplate(currentTemplate, previewSampleData, activeWaEvent);

                    return (
                      <div className="border rounded-3 p-3.5 bg-white shadow-xs">
                        {/* Event Enable Toggle */}
                        <div className="d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom flex-wrap gap-2">
                          <div>
                            <div className="fw-bold text-dark small mb-0.5">{eventTitle}</div>
                            <span className="text-secondary extra-small">
                              When enabled, a WhatsApp button appears after completing this action.
                            </span>
                          </div>
                          <div className="d-flex align-items-center gap-3">
                            <span className="extra-small fw-semibold text-muted">
                              {isEventEnabled ? 'Event Enabled' : 'Event Disabled'}
                            </span>
                            <div className="form-check form-switch m-0">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`toggle-${toggleField}`}
                                checked={isEventEnabled}
                                onChange={(e) => handleChange(toggleField, e.target.checked)}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Editor + Live Preview Two-Column Grid */}
                        <div className="row g-4">
                          {/* Left Column: Template Textarea & Variable Inserter */}
                          <div className="col-lg-7">
                            <div className="d-flex justify-content-between align-items-center mb-1.5 flex-wrap gap-2">
                              <label className="form-label extra-small fw-bold text-secondary text-uppercase mb-0">
                                Message Template Text
                              </label>
                              <div className="d-flex align-items-center gap-1.5 position-relative">
                                {/* Insert Variable Dropdown */}
                                <div className="dropdown">
                                  <button
                                    type="button"
                                    className="btn btn-outline-primary btn-sm py-1 px-2.5 extra-small fw-semibold rounded-2 d-inline-flex align-items-center gap-1"
                                    onClick={() => setWaVarDropdownOpen(!waVarDropdownOpen)}
                                  >
                                    <i className="bi bi-code-slash"></i>
                                    <span>Insert Variable</span>
                                    <i className="bi bi-chevron-down extra-small"></i>
                                  </button>
                                  {waVarDropdownOpen && (
                                    <ul
                                      className="dropdown-menu show shadow-lg border-0 rounded-3 p-2 extra-small position-absolute end-0 mt-1"
                                      style={{ zIndex: 1050, maxHeight: '280px', overflowY: 'auto', minWidth: '220px' }}
                                    >
                                      <li className="dropdown-header text-uppercase fw-bold pb-1" style={{ fontSize: '0.675rem' }}>
                                        Click to Insert Placeholder
                                      </li>
                                      {eventVariables.map((v) => (
                                        <li key={v.key}>
                                          <button
                                            type="button"
                                            className="dropdown-item py-1.5 px-2 rounded-2 d-flex justify-content-between align-items-center"
                                            onClick={() => handleInsertVariable(templateField, v.key)}
                                          >
                                            <span className="fw-semibold text-dark">{v.label}</span>
                                            <code className="text-primary bg-primary-subtle px-1 rounded">
                                              {`{{${v.key}}}`}
                                            </code>
                                          </button>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>

                                {/* Restore Default Button */}
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary btn-sm py-1 px-2.5 extra-small fw-semibold rounded-2 d-inline-flex align-items-center gap-1"
                                  onClick={() => handleRestoreDefault(templateField, defaultTemplate, eventTitle)}
                                  title="Reset template to system default"
                                >
                                  <i className="bi bi-arrow-counterclockwise"></i>
                                  <span>Restore Default</span>
                                </button>
                              </div>
                            </div>

                            {/* Textarea */}
                            <textarea
                              id={`textarea-${templateField}`}
                              className="form-control font-monospace p-3 rounded-3"
                              rows={8}
                              style={{ fontSize: '0.85rem', lineHeight: '1.45', backgroundColor: '#fdfdfd' }}
                              value={currentTemplate}
                              onChange={(e) => handleChange(templateField, e.target.value)}
                              placeholder="Write customized WhatsApp message template..."
                            />

                            {/* Validation Warning for Unsupported Variables */}
                            {invalidVariables.length > 0 && (
                              <div className="alert alert-warning border border-warning-subtle py-2 px-3 rounded-3 mt-2.5 mb-2 extra-small d-flex align-items-start gap-2">
                                <i className="bi bi-exclamation-triangle-fill text-warning mt-0.5 flex-shrink-0"></i>
                                <div>
                                  <span className="fw-bold">Unsupported placeholder detected: </span>
                                  {invalidVariables.map((inv) => (
                                    <code key={inv} className="bg-white border px-1.5 py-0.5 rounded text-danger me-1">
                                      {`{{${inv}}}`}
                                    </code>
                                  ))}
                                  <span className="d-block mt-0.5 text-muted">
                                    Unsupported placeholders will not be substituted with real data. Please choose from the allowed variables below.
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Available Variables Quick Chips */}
                            <div className="mt-2.5">
                              <span className="extra-small fw-bold text-muted text-uppercase d-block mb-1.5">
                                Available Dynamic Variables (Click chip to insert):
                              </span>
                              <div className="d-flex flex-wrap gap-1.5">
                                {eventVariables.map((v) => (
                                  <button
                                    key={v.key}
                                    type="button"
                                    className="badge bg-light text-secondary border extra-small px-2 py-1 rounded-2 text-decoration-none border-secondary-subtle hover-shadow transition-all"
                                    onClick={() => handleInsertVariable(templateField, v.key)}
                                    title={`Insert {{${v.key}}}`}
                                  >
                                    + {`{{${v.key}}}`}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Right Column: Live WhatsApp Message Preview */}
                          <div className="col-lg-5">
                            <label className="form-label extra-small fw-bold text-secondary text-uppercase mb-1.5">
                              Customer Live Preview (Sample Data)
                            </label>
                            
                            {/* Realistic WhatsApp Chat Preview Device Bubble */}
                            <div
                              className="rounded-4 border overflow-hidden shadow-xs"
                              style={{ backgroundColor: '#EFEAE2', maxWidth: '380px', margin: '0 auto' }}
                            >
                              {/* WhatsApp Top Bar */}
                              <div className="bg-success text-white px-3 py-2 d-flex align-items-center gap-2" style={{ backgroundColor: '#075E54' }}>
                                <div
                                  className="rounded-circle bg-white text-success fw-bold d-flex align-items-center justify-content-center flex-shrink-0"
                                  style={{ width: '32px', height: '32px', fontSize: '0.85rem' }}
                                >
                                  {(settings.lodge_name || 'L')[0]}
                                </div>
                                <div className="min-w-0 flex-grow-1">
                                  <div className="fw-bold extra-small text-truncate text-white">
                                    {settings.lodge_name || 'Lodge Front Desk'}
                                  </div>
                                  <div className="extra-small opacity-75" style={{ fontSize: '0.675rem' }}>
                                    Online • WhatsApp Business
                                  </div>
                                </div>
                                <i className="bi bi-whatsapp text-white fs-6"></i>
                              </div>

                              {/* WhatsApp Chat Body */}
                              <div className="p-3" style={{ minHeight: '230px', backgroundImage: 'radial-gradient(#d1d7db 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
                                {/* Date Stamp */}
                                <div className="text-center mb-2">
                                  <span className="badge bg-white text-muted shadow-xs px-2 py-0.5 rounded-pill" style={{ fontSize: '0.65rem' }}>
                                    TODAY
                                  </span>
                                </div>

                                {/* Message Bubble */}
                                <div
                                  className="bg-white p-2.5 rounded-3 shadow-xs position-relative"
                                  style={{
                                    borderTopLeftRadius: '2px',
                                    whiteSpace: 'pre-wrap',
                                    fontSize: '0.82rem',
                                    lineHeight: '1.4',
                                    color: '#111827',
                                    maxWidth: '92%',
                                  }}
                                >
                                  {previewRendered}
                                  
                                  <div className="d-flex justify-content-end align-items-center gap-1 mt-1 text-muted" style={{ fontSize: '0.65rem' }}>
                                    <span>10:30 AM</span>
                                    <i className="bi bi-check2-all text-primary" style={{ fontSize: '0.75rem' }}></i>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <span className="text-muted extra-small text-center d-block mt-2">
                              Preview automatically reflects your lodge name and real booking figures.
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </>
              ) : (
                <div className="p-4 text-center rounded-3 bg-light border border-dashed">
                  <i className="bi bi-whatsapp text-secondary opacity-50 display-6 d-block mb-2"></i>
                  <h6 className="fw-bold text-dark mb-1">WhatsApp Customer Messaging is Disabled</h6>
                  <p className="text-muted small mb-0" style={{ maxWidth: '480px', margin: '0 auto' }}>
                    Turn on the switch above to configure custom message templates, event triggers, and mobile pre-fill behaviors.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="d-flex justify-content-end mb-5">
            <button type="submit" className="btn btn-primary fw-bold px-4 py-2.5 rounded-3 shadow-sm" disabled={submitting}>
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Saving Settings...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle-fill me-2"></i> Save Settings
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Front Desk Counter Add/Edit Modal */}
      {drawerModalData && (
        <CashDrawerModal
          isOpen={Boolean(drawerModalData)}
          onClose={() => setDrawerModalData(null)}
          drawer={drawerModalData.drawer}
          defaultPropertyId={selectedDrawerBranchId || selectedProperty?.id}
          targetPropertyName={activeDrawerBranch?.name || selectedProperty?.name}
          branches={branches}
          onSuccess={handleDrawerSaved}
        />
      )}

      {/* Role Permission Matrix Modal */}
      <RolePermissionMatrixModal
        isOpen={showPermModal}
        onClose={() => setShowPermModal(false)}
      />
    </div>
  );
};

export default Settings;
