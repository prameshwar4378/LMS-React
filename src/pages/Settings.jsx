import React, { useEffect, useState } from 'react';
import { getSettingsApi, updateSettingsApi } from '../api/settingsApi';
import { useNotification } from '../context/NotificationContext';
import PageLoader from '../components/PageLoader';

const Settings = () => {
  const { showSuccess, showError } = useNotification();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getSettingsApi();
      setSettings(data);
    } catch (err) {
      console.error(err);
      showError('Failed to load lodge settings.', 'Load Error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const updated = await updateSettingsApi(settings);
      setSettings(updated);
      showSuccess('Lodge settings updated successfully!', 'Settings Saved');
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
              <h5 className="m-0 fw-bold fs-6"><i className="bi bi-building me-2"></i>Lodge Property Information</h5>
            </div>
            <div className="card-body p-4">
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

          {/* Stay & Check-In/Out Settings */}
          <div className="card border-0 shadow-sm mb-4 rounded-4 overflow-hidden">
            <div className="card-header bg-white py-3 px-4 border-bottom">
              <h5 className="m-0 fw-bold fs-6 text-dark"><i className="bi bi-clock me-2 text-primary"></i>Check-In & Check-Out Time Settings</h5>
            </div>
            <div className="card-body p-4">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Default Check-In Time</label>
                  <input type="time" className="form-control py-2.5" style={{ height: '46px' }} value={settings.default_checkin_time || '12:00'} onChange={(e) => handleChange('default_checkin_time', e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Default Check-Out Time</label>
                  <input type="time" className="form-control py-2.5" style={{ height: '46px' }} value={settings.default_checkout_time || '11:00'} onChange={(e) => handleChange('default_checkout_time', e.target.value)} />
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
    </div>
  );
};

export default Settings;
