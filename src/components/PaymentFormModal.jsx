import React, { useState, useEffect } from 'react';
import { Clock, Calendar, RefreshCw } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

const PaymentFormModal = ({ show, onClose, onSubmit, stayId, currentBalance = 0, initialData = null }) => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');

  // Date & Time States
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentTime, setPaymentTime] = useState('');

  const setToLiveDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');

    setPaymentDate(`${year}-${month}-${day}`);
    setPaymentTime(`${hours}:${mins}`);
  };

  useEffect(() => {
    if (initialData) {
      setAmount(initialData.amount || '');
      setPaymentMethod(initialData.payment_method || 'CASH');
      setTransactionRef(initialData.transaction_reference || '');
      setNotes(initialData.notes || '');

      if (initialData.payment_date) {
        const d = new Date(initialData.payment_date);
        if (!isNaN(d.getTime())) {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const hours = String(d.getHours()).padStart(2, '0');
          const mins = String(d.getMinutes()).padStart(2, '0');
          setPaymentDate(`${year}-${month}-${day}`);
          setPaymentTime(`${hours}:${mins}`);
        } else {
          setToLiveDateTime();
        }
      } else {
        setToLiveDateTime();
      }
    } else {
      setAmount(currentBalance > 0 ? currentBalance : '');
      setPaymentMethod('CASH');
      setTransactionRef('');
      setNotes('');
      setToLiveDateTime();
    }
  }, [initialData, currentBalance, show]);

  if (!show) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    const payload = {
      stay: stayId,
      amount: parseFloat(amount),
      payment_method: paymentMethod,
      transaction_reference: transactionRef,
      notes: notes,
    };

    if (paymentDate) {
      const timeStr = paymentTime || '12:00';
      payload.payment_date = `${paymentDate}T${timeStr}:00`;
    }

    onSubmit(payload);
  };

  const isEdit = Boolean(initialData);

  return (
    <div className="modal fade show d-block modal-backdrop-animated" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1060 }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered modal-dialog-animated" style={{ maxWidth: '520px' }}>
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden modal-content-animated">
          
          <div className="modal-header bg-success text-white py-3 px-4">
            <h5 className="modal-title fw-bold d-flex align-items-center gap-2 m-0" style={{ fontSize: '1.1rem' }}>
              <i className="bi bi-cash-coin fs-5"></i>
              {isEdit ? `Edit Payment ${initialData.payment_number || ''}` : 'Record Payment Settlement'}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4 bg-white">
              {!isEdit && currentBalance > 0 && (
                <div className="alert alert-info border-0 bg-info-subtle text-info-emphasis py-2.5 px-3 mb-4 rounded-3 d-flex justify-content-between align-items-center">
                  <span className="small font-medium">Outstanding Balance:</span>
                  <strong className="fs-5 text-primary">₹{parseFloat(currentBalance).toFixed(2)}</strong>
                </div>
              )}

              {/* Editable Payment Datetime Section */}
              <div className="p-3 bg-light rounded-3 border mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label small fw-bold text-dark m-0 d-flex align-items-center gap-1.5">
                    <Calendar size={15} className="text-primary" /> Payment Date & Time *
                  </label>
                  <button
                    type="button"
                    className="btn btn-xs btn-outline-primary py-0.5 px-2 rounded-2 text-decoration-none d-flex align-items-center gap-1"
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
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                    />
                  </div>
                  <div className="col-5">
                    <label className="form-label extra-small text-muted mb-1">Time</label>
                    <input
                      type="time"
                      className="form-control form-control-sm font-semibold"
                      required
                      value={paymentTime}
                      onChange={(e) => setPaymentTime(e.target.value)}
                    />
                  </div>
                </div>
                <div className="extra-small text-muted mt-1.5">
                  🕒 Recorded Datetime: <strong>{formatDate(paymentDate)} @ {paymentTime || '12:00'}</strong>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold text-dark">Payment Amount (₹) *</label>
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
                <label className="form-label small fw-semibold text-dark">Payment Method *</label>
                <select className="form-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="CASH">Cash Collection</option>
                  <option value="UPI">UPI / GPay / PhonePe / QR</option>
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                  <option value="OTHER">Other Method</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold text-dark">Transaction Reference / UTR Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="e.g. UPI/1234567890 or Card Txn Ref"
                />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold text-dark">Notes / Description</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional payment notes"
                ></textarea>
              </div>
            </div>

            <div className="modal-footer bg-light px-4 py-3 d-flex justify-content-between">
              <button type="button" className="btn btn-light border fw-semibold px-4" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-success fw-bold px-4 shadow-sm d-flex align-items-center gap-1.5">
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
