import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPaymentApi } from '../api/billingApi';
import { formatCurrency } from '../utils/formatCurrency';
import { useNotification } from '../context/NotificationContext';

const CheckoutPendingModal = ({ show, stay, onClose, onPaymentSuccess }) => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('Checkout settlement payment');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const bill = stay?.bill_summary || {};
  const balanceDue = parseFloat(bill.balance || 0);
  const roomNumber = stay?.room_detail?.room_number || stay?.room || '—';
  const stayNumber = stay?.stay_number || '—';
  const guestName = stay?.primary_customer_detail?.full_name || stay?.primary_customer?.full_name || 'Guest';
  const guestMobile = stay?.primary_customer_detail?.mobile || stay?.primary_customer?.mobile || 'N/A';
  const advanceCredit = parseFloat(stay?.primary_customer_detail?.advance_credit || 0);

  useEffect(() => {
    if (show && stay) {
      setAmount(balanceDue > 0 ? balanceDue.toFixed(2) : '');
      setPaymentMethod('CASH');
      setTransactionRef('');
      setNotes('Checkout settlement payment');
      setError('');
    }
  }, [show, stay, balanceDue]);

  if (!show || !stay) return null;

  const handleReceiveAndCheckout = async (e) => {
    e.preventDefault();
    setError('');

    const numericAmount = parseFloat(amount || 0);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid payment amount greater than 0, or click "Skip & Direct Checkout".');
      return;
    }

    setSubmitting(true);
    try {
      await createPaymentApi({
        stay: stay.id,
        amount: numericAmount,
        payment_method: paymentMethod,
        transaction_reference: transactionRef || undefined,
        notes: notes || 'Checkout settlement payment'
      });
      showSuccess(`Payment of ${formatCurrency(numericAmount)} received successfully!`, 'Payment Received');
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
      onClose();
      navigate(`/checkout/${stay.id}`);
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || err.response?.data?.message || err.response?.data?.detail || 'Failed to record payment.';
      setError(errMsg);
      showError(errMsg, 'Payment Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDirectCheckoutWithoutPayment = () => {
    onClose();
    navigate(`/checkout/${stay.id}`);
  };

  return (
    <div className="modal fade show d-block modal-backdrop-animated" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered modal-dialog-animated" style={{ maxWidth: '540px' }}>
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden modal-content-animated">
          {/* Header */}
          <div className="modal-header bg-danger text-white py-3 px-4 d-flex align-items-center justify-content-between">
            <h5 className="modal-title fw-bold m-0 d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-octagon-fill fs-5"></i> Pending Due Amount at Checkout
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <form onSubmit={handleReceiveAndCheckout}>
            <div className="modal-body p-4">
              {error && <div className="alert alert-danger py-2 px-3 small mb-3">{error}</div>}

              {/* Outstanding Balance Banner */}
              <div className="alert alert-danger border-danger-subtle bg-danger-subtle text-danger p-3 rounded-3 mb-3 d-flex align-items-center justify-content-between">
                <div>
                  <div className="extra-small text-uppercase fw-bold tracking-wider">Room {roomNumber} Pending Due</div>
                  <div className="fs-4 fw-bold">{formatCurrency(balanceDue)}</div>
                  <div className="extra-small text-dark mt-0.5">
                    Stay <strong>#{stayNumber}</strong> &bull; Guest: <strong>{guestName}</strong> ({guestMobile})
                  </div>
                </div>
                <div className="text-end">
                  <span className="badge bg-danger fs-6 px-2.5 py-1.5 shadow-xs">Payment Due</span>
                </div>
              </div>

              {/* Payment Input Fields */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label small fw-semibold text-dark mb-0">Receive Payment Amount (₹) *</label>
                  <button
                    type="button"
                    className="btn btn-sm btn-link p-0 text-decoration-none extra-small fw-bold text-primary"
                    onClick={() => setAmount(balanceDue.toFixed(2))}
                  >
                    Set Full Balance ({formatCurrency(balanceDue)})
                  </button>
                </div>
                <div className="input-group">
                  <span className="input-group-text bg-white fw-bold text-success">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-control form-control-lg fw-bold text-success"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <span className="text-muted extra-small mt-1 d-block">
                  <i className="bi bi-info-circle me-1"></i>Enter received amount to settle room dues before proceeding.
                </span>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-dark mb-1">Payment Method *</label>
                  <select
                    className="form-select"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="CARD">Credit / Debit Card</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    {advanceCredit > 0 && (
                      <option value="WALLET">Guest Wallet ({formatCurrency(advanceCredit)})</option>
                    )}
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-dark mb-1">Transaction Ref / UTR</label>
                  <input
                    type="text"
                    className="form-control"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g. UPI Ref / Cash Receipt #"
                  />
                </div>
              </div>

              <div className="mb-2">
                <label className="form-label small fw-semibold text-dark mb-1">Notes / Remarks</label>
                <input
                  type="text"
                  className="form-control"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Received at reception counter"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="modal-footer bg-light border-top px-4 py-3 d-flex flex-column gap-2">
              <div className="d-flex w-100 justify-content-between align-items-center gap-2">
                <button type="button" className="btn btn-light border fw-semibold px-3" onClick={onClose}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-success fw-bold px-4 shadow-sm d-flex align-items-center gap-1.5"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      Recording Payment...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle-fill"></i> Receive & Proceed to Checkout
                    </>
                  )}
                </button>
              </div>

              <button
                type="button"
                className="btn btn-outline-secondary btn-sm w-100 fw-semibold text-center border-0 text-decoration-underline mt-1"
                onClick={handleDirectCheckoutWithoutPayment}
              >
                Skip & Proceed to Direct Checkout (Keep Balance Due) &rarr;
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPendingModal;
