import React, { useState, useEffect } from 'react';

const PaymentFormModal = ({ show, onClose, onSubmit, stayId, currentBalance = 0, initialData = null }) => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialData) {
      setAmount(initialData.amount || '');
      setPaymentMethod(initialData.payment_method || 'CASH');
      setTransactionRef(initialData.transaction_reference || '');
      setNotes(initialData.notes || '');
    } else {
      setAmount(currentBalance > 0 ? currentBalance : '');
      setPaymentMethod('CASH');
      setTransactionRef('');
      setNotes('');
    }
  }, [initialData, currentBalance, show]);

  if (!show) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    onSubmit({
      stay: stayId,
      amount: parseFloat(amount),
      payment_method: paymentMethod,
      transaction_reference: transactionRef,
      notes: notes,
    });
  };

  const isEdit = Boolean(initialData);

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow">
          <div className="modal-header bg-success text-white">
            <h5 className="modal-title">
              <i className="bi bi-cash-coin me-2"></i>
              {isEdit ? `Edit Payment ${initialData.payment_number || ''}` : 'Record Payment'}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              {!isEdit && currentBalance > 0 && (
                <div className="alert alert-info py-2 mb-3 d-flex justify-content-between align-items-center">
                  <span>Current Outstanding Balance:</span>
                  <strong className="fs-5">₹{parseFloat(currentBalance).toFixed(2)}</strong>
                </div>
              )}

              <div className="mb-3">
                <label className="form-label fw-semibold">Payment Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  className="form-control form-control-lg fw-bold text-success"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Payment Method *</label>
                <select className="form-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Transaction Reference / UTR Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="e.g. UPI/1234567890 or Card Txn Ref"
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Notes / Description</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes"
                ></textarea>
              </div>
            </div>
            <div className="modal-footer bg-light">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-success">
                <i className="bi bi-check-circle me-1"></i> {isEdit ? 'Save Payment Changes' : 'Submit Payment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentFormModal;
