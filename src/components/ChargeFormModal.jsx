import React, { useState, useEffect } from 'react';
import { getChargeTypesApi } from '../api/billingApi';
import { Clock, Calendar, RefreshCw } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

const ChargeFormModal = ({ show, onClose, onSubmit, stayId }) => {
  const [chargeTypes, setChargeTypes] = useState([]);
  const [selectedChargeTypeId, setSelectedChargeTypeId] = useState('CUSTOM');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);

  // Date & Time States
  const [chargeDate, setChargeDate] = useState('');
  const [chargeTime, setChargeTime] = useState('');

  const setToLiveDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');

    setChargeDate(`${year}-${month}-${day}`);
    setChargeTime(`${hours}:${mins}`);
  };

  useEffect(() => {
    if (show) {
      setToLiveDateTime();
      getChargeTypesApi()
        .then((data) => {
          setChargeTypes(data);
          if (data && data.length > 0) {
            setSelectedChargeTypeId('CUSTOM');
          }
        })
        .catch(console.error);
    }
  }, [show]);

  const handleChargeTypeSelect = (e) => {
    const ctId = e.target.value;
    setSelectedChargeTypeId(ctId);
    if (ctId && ctId !== 'CUSTOM') {
      const selected = chargeTypes.find((item) => item.id === parseInt(ctId));
      if (selected) {
        setDescription(selected.name);
        setUnitPrice(selected.default_price);
      }
    } else {
      setDescription('');
      setUnitPrice(0);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description.trim()) return;

    const payload = {
      stay: stayId,
      charge_type: selectedChargeTypeId && selectedChargeTypeId !== 'CUSTOM' ? parseInt(selectedChargeTypeId) : null,
      description: description.trim(),
      quantity: parseInt(quantity || 1),
      unit_price: parseFloat(unitPrice || 0),
    };

    if (chargeDate) {
      const timeStr = chargeTime || '12:00';
      payload.charge_date = `${chargeDate}T${timeStr}:00`;
    }

    onSubmit(payload);
  };

  if (!show) return null;

  const totalAmount = (parseInt(quantity || 0) * parseFloat(unitPrice || 0)).toFixed(2);
  const isCustom = !selectedChargeTypeId || selectedChargeTypeId === 'CUSTOM';

  return (
    <div className="modal fade show d-block modal-backdrop-animated" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1060 }} tabIndex="-1" onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered modal-dialog-animated" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden modal-content-animated">
          
          <div className="modal-header bg-warning text-dark py-3.5 px-4">
            <h5 className="modal-title fw-bold d-flex align-items-center gap-2 m-0" style={{ fontSize: '1.1rem' }}>
              <i className="bi bi-cart-plus-fill me-1"></i> Add Extra Charge / Service
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4 bg-white">
              
              {/* Editable Charge Date & Time Section */}
              <div className="p-3 bg-light rounded-3 border mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label small fw-bold text-dark m-0 d-flex align-items-center gap-1.5">
                    <Calendar size={15} className="text-warning-emphasis" /> Charge Date & Time *
                  </label>
                  <button
                    type="button"
                    className="btn btn-xs btn-outline-dark py-0.5 px-2 rounded-2 text-decoration-none d-flex align-items-center gap-1"
                    style={{ fontSize: '0.725rem' }}
                    onClick={setToLiveDateTime}
                    title="Reset to current live system datetime"
                  >
                    <RefreshCw size={12} /> Set Live Time
                  </button>
                </div>

                <div className="row g-2">
                  <div className="col-7">
                    <label className="form-label extra-small text-muted mb-1">Date</label>
                    <input
                      type="date"
                      className="form-control form-control-sm font-semibold"
                      required
                      value={chargeDate}
                      onChange={(e) => setChargeDate(e.target.value)}
                    />
                  </div>
                  <div className="col-5">
                    <label className="form-label extra-small text-muted mb-1">Time</label>
                    <input
                      type="time"
                      className="form-control form-control-sm font-semibold"
                      required
                      value={chargeTime}
                      onChange={(e) => setChargeTime(e.target.value)}
                    />
                  </div>
                </div>
                <div className="extra-small text-muted mt-1.5">
                  🕒 Recorded Datetime: <strong>{formatDate(chargeDate)} @ {chargeTime || '12:00'}</strong>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold text-dark">Select Charge Item / Category</label>
                <select className="form-select border-warning-subtle" value={selectedChargeTypeId} onChange={handleChargeTypeSelect}>
                  <option value="CUSTOM">✨ + Enter Custom Item / Other Charge</option>
                  {chargeTypes.map((ct) => (
                    <option key={ct.id} value={ct.id}>
                      {ct.name} (Default: ₹{ct.default_price})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold text-dark">
                  {isCustom ? 'Custom Charge Title / Service Name *' : 'Item Description / Title *'}
                </label>
                <input
                  type="text"
                  className={`form-control ${isCustom ? 'border-primary fw-bold' : ''}`}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    isCustom
                      ? 'e.g. Airport Transfer / Broken Glass / Special Meal / Doctor Fee'
                      : 'Enter charge description'
                  }
                />
                {isCustom && (
                  <div className="form-text text-primary extra-small mt-1">
                    <i className="bi bi-info-circle me-1"></i>
                    You can type any custom charge or service name here.
                  </div>
                )}
              </div>

              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="form-label small fw-semibold text-dark">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-semibold text-dark">Unit Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control fw-bold text-dark"
                    required
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-3 bg-light rounded-3 border text-end">
                <span className="text-muted me-2 small">Total Amount:</span>
                <span className="fs-4 fw-bold text-success">₹{totalAmount}</span>
              </div>
            </div>

            <div className="modal-footer bg-light px-4 py-3 d-flex justify-content-between">
              <button type="button" className="btn btn-light border fw-semibold px-4" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-warning fw-bold px-4 shadow-sm">
                <i className="bi bi-plus-lg me-1"></i> Add Charge to Bill
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

export default ChargeFormModal;
