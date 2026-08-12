import React, { useState, useEffect } from 'react';
import { getChargeTypesApi } from '../api/billingApi';

const ChargeFormModal = ({ show, onClose, onSubmit, stayId }) => {
  const [chargeTypes, setChargeTypes] = useState([]);
  const [selectedChargeTypeId, setSelectedChargeTypeId] = useState('CUSTOM');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);

  useEffect(() => {
    if (show) {
      getChargeTypesApi()
        .then((data) => {
          setChargeTypes(data);
          if (data && data.length > 0) {
            // Default to custom or first charge type
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
    onSubmit({
      stay: stayId,
      charge_type: selectedChargeTypeId && selectedChargeTypeId !== 'CUSTOM' ? parseInt(selectedChargeTypeId) : null,
      description: description.trim(),
      quantity: parseInt(quantity || 1),
      unit_price: parseFloat(unitPrice || 0),
    });
  };

  if (!show) return null;

  const totalAmount = (parseInt(quantity || 0) * parseFloat(unitPrice || 0)).toFixed(2);
  const isCustom = !selectedChargeTypeId || selectedChargeTypeId === 'CUSTOM';

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow">
          <div className="modal-header bg-warning text-dark">
            <h5 className="modal-title fw-bold">
              <i className="bi bi-cart-plus-fill me-2"></i>Add Extra Charge / Service
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              <div className="mb-3">
                <label className="form-label fw-semibold">Select Charge Item / Category</label>
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
                <label className="form-label fw-semibold">
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
                  <div className="form-text text-primary">
                    <i className="bi bi-info-circle me-1"></i>
                    You can type any custom charge or service name here.
                  </div>
                )}
              </div>

              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="form-label fw-semibold">Quantity *</label>
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
                  <label className="form-label fw-semibold">Unit Price (₹) *</label>
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

              <div className="p-3 bg-light rounded border text-end">
                <span className="text-muted me-2">Total Amount:</span>
                <span className="fs-4 fw-bold text-success">₹{totalAmount}</span>
              </div>
            </div>
            <div className="modal-footer bg-light">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-warning fw-bold">
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
