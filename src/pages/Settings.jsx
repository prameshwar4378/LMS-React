import React, { useEffect, useState } from 'react';
import { getSettingsApi, updateSettingsApi } from '../api/settingsApi';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import PageLoader from '../components/PageLoader';
import RolePermissionMatrixModal from '../components/RolePermissionMatrixModal';

const Settings = () => {
  const { showSuccess, showError } = useNotification();
  const { isHotelOwner } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPermModal, setShowPermModal] = useState(false);

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getSettingsApi();
      setSettings(data);
      if (data?.logo) {
        setLogoPreview(data.logo);
      }
    } catch (err) {
      console.error(err);
      showError('Failed to load lodge settings.', 'Load Error');
    } finally {
      setLoading(false);
    }
  };

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
      let payload;
      if (logoFile) {
        payload = new FormData();
        Object.keys(settings).forEach((k) => {
          if (settings[k] !== null && settings[k] !== undefined && k !== 'logo') {
            payload.append(k, settings[k]);
          }
        });
        payload.append('logo', logoFile);
      } else {
        payload = { ...settings };
      }

      const updated = await updateSettingsApi(payload);
      setSettings(updated);
      if (updated?.logo) {
        setLogoPreview(updated.logo);
      }
      showSuccess('Lodge settings and branding updated successfully!', 'Settings Saved');
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.error || 'Failed to update settings.', 'Save Failed');
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
            <h4 className="fw-bold m-0 text-dark">Lodge Settings & Configuration</h4>
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
          <div className="card border-0 shadow-sm mb-4 rounded-4 overflow-hidden">
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

          {/* Operational Workflow & Shift Mode Selector */}
          <div className="card border-0 shadow-sm mb-4 rounded-4 overflow-hidden">
            <div className="card-header bg-white py-3 px-4 border-bottom d-flex justify-content-between align-items-center">
              <h5 className="m-0 fw-bold fs-6 text-dark">
                <i className="bi bi-sliders me-2 text-primary"></i>Operational Workflow &amp; Cashier Mode
              </h5>
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill extra-small px-2.5 py-1">
                Property Architecture
              </span>
            </div>
            <div className="card-body p-4">
              <p className="text-secondary small mb-3">
                Select how your property handles cash drawers, front-desk staffing, and daily revenue accounting:
              </p>

              <div className="row g-3">
                {/* 1. Multi-Cashier Shift Mode */}
                <div className="col-md-6">
                  <div
                    className={`p-3.5 rounded-3 border h-100 ${settings.shift_operation_mode !== 'SINGLE_OPERATOR' ? 'border-primary bg-primary-subtle bg-opacity-25' : 'bg-white'}`}
                    style={{ borderColor: settings.shift_operation_mode !== 'SINGLE_OPERATOR' ? '#2563EB' : '#E2E8F0', cursor: 'pointer' }}
                    onClick={() => handleChange('shift_operation_mode', 'STRICT_SHIFT')}
                  >
                    <div className="d-flex align-items-start gap-2.5">
                      <input
                        type="radio"
                        name="shift_operation_mode"
                        className="form-check-input mt-1"
                        checked={settings.shift_operation_mode !== 'SINGLE_OPERATOR'}
                        onChange={() => handleChange('shift_operation_mode', 'STRICT_SHIFT')}
                      />
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <strong className="text-dark fs-6">Shift-Wise Multi-Cashier Mode</strong>
                          <span className="badge bg-primary text-white extra-small">Staff Rotation</span>
                        </div>
                        <p className="text-secondary extra-small mb-2">
                          Ideal for hotels &amp; lodges with multiple receptionists working in shifts (Morning / Evening / Night).
                        </p>
                        <ul className="text-secondary extra-small ps-3 mb-0">
                          <li>Mandatory shift opening with cash floats &amp; handovers</li>
                          <li>Individual cashier closing with denomination counting</li>
                          <li>Shortage / Excess routing to Manager approval queue</li>
                          <li>Multi-drawer POS stations &amp; PIN expense overrides</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Single-User / Owner-Managed Mode */}
                <div className="col-md-6">
                  <div
                    className={`p-3.5 rounded-3 border h-100 ${settings.shift_operation_mode === 'SINGLE_OPERATOR' ? 'border-success bg-success-subtle bg-opacity-25' : 'bg-white'}`}
                    style={{ borderColor: settings.shift_operation_mode === 'SINGLE_OPERATOR' ? '#10B981' : '#E2E8F0', cursor: 'pointer' }}
                    onClick={() => handleChange('shift_operation_mode', 'SINGLE_OPERATOR')}
                  >
                    <div className="d-flex align-items-start gap-2.5">
                      <input
                        type="radio"
                        name="shift_operation_mode"
                        className="form-check-input mt-1"
                        checked={settings.shift_operation_mode === 'SINGLE_OPERATOR'}
                        onChange={() => handleChange('shift_operation_mode', 'SINGLE_OPERATOR')}
                      />
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <strong className="text-dark fs-6">Single-User / Owner-Managed Mode</strong>
                          <span className="badge bg-success text-white extra-small">Continuous Till</span>
                        </div>
                        <p className="text-secondary extra-small mb-2">
                          Ideal for small lodges, homestays, guest houses, or properties managed by a single operator/owner.
                        </p>
                        <ul className="text-secondary extra-small ps-3 mb-0">
                          <li><strong>Zero friction:</strong> Take payments 24/7 without opening shifts manually</li>
                          <li>Continuous rolling daily cash register with auto-rollover</li>
                          <li>No annoying overdue/stale shift alarms</li>
                          <li>Frictionless petty cash disbursements &amp; simplified Night Audit</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Owner Role & Dynamic Permission Matrix Control */}
          <div className="card border-0 shadow-sm mb-4 rounded-4 overflow-hidden" style={{ border: '1px solid #E2E8F0' }}>
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

      {/* Role Permission Matrix Modal */}
      <RolePermissionMatrixModal
        isOpen={showPermModal}
        onClose={() => setShowPermModal(false)}
      />
    </div>
  );
};

export default Settings;
