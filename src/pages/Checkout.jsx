import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStayByIdApi, checkoutStayApi } from '../api/stayApi';
import InvoicePreviewModal from '../components/InvoicePreviewModal';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/dateUtils';

const Checkout = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [stay, setStay] = useState(null);
  const [loading, setLoading] = useState(true);

  // Discount & Final Payment state
  const [discountType, setDiscountType] = useState('FIXED');
  const [discountValue, setDiscountValue] = useState(0);
  const [discountReason, setDiscountReason] = useState('');

  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [transactionRef, setTransactionRef] = useState('');
  const [roomNextStatus, setRoomNextStatus] = useState('AVAILABLE');

  const [showInvoice, setShowInvoice] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStay();
  }, [id]);

  const loadStay = async () => {
    setLoading(true);
    try {
      const data = await getStayByIdApi(id);
      setStay(data);
      setDiscountType(data.discount_type || 'FIXED');
      setDiscountValue(data.discount_value || 0);
      setDiscountReason(data.discount_reason || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Live Bill & Discount Calculations
  const bill = stay?.bill_summary || {};
  const roomAmount = parseFloat(bill.room_amount || bill.total_room_charge || 0);
  const extraCharges = parseFloat(bill.extra_charges_total || bill.total_extra_charges || 0);
  const grossSubtotal = roomAmount + extraCharges;

  const numDiscVal = parseFloat(discountValue || 0);
  let liveDiscountAmount = 0;
  if (discountType === 'PERCENTAGE') {
    liveDiscountAmount = Math.round((grossSubtotal * numDiscVal) / 100);
  } else {
    liveDiscountAmount = numDiscVal;
  }
  liveDiscountAmount = Math.min(grossSubtotal, Math.max(0, liveDiscountAmount));

  const taxableAmount = Math.max(0, grossSubtotal - liveDiscountAmount);

  // GST percentage (preserve ratio from server or default 12%)
  const gstRatio = (bill.taxable_amount && bill.gst_amount !== undefined && bill.taxable_amount > 0)
    ? (bill.gst_amount / bill.taxable_amount)
    : 0.12;

  const liveGstAmount = Math.round(taxableAmount * gstRatio);
  const liveGrandTotal = taxableAmount + liveGstAmount;

  const totalPaid = parseFloat(bill.total_paid || 0);
  const liveBalance = Math.max(0, liveGrandTotal - totalPaid);

  // Auto-sync final payment input to calculated live balance
  useEffect(() => {
    setPaymentAmount(liveBalance);
  }, [discountType, discountValue, stay]);

  const extractErrorMessage = (err, defaultMsg = 'Error completing checkout.') => {
    if (!err) return defaultMsg;
    if (typeof err === 'string') return err;
    if (err.response && err.response.data) {
      const d = err.response.data;
      if (typeof d === 'string') return d;
      let summaryMsg = d.message || d.error || d.detail || '';
      if (d.errors && typeof d.errors === 'object') {
        const keys = Object.keys(d.errors);
        if (keys.length > 0) {
          const detailList = keys.map(k => {
            const v = d.errors[k];
            const vStr = Array.isArray(v) ? v.join(', ') : String(v);
            return `${k.toUpperCase()}: ${vStr}`;
          }).join(' | ');
          return `${summaryMsg ? summaryMsg + ' — ' : ''}${detailList}`;
        }
      }
      if (typeof d === 'object') {
        const keys = Object.keys(d).filter(k => k !== 'success');
        if (keys.length > 0) {
          const detailList = keys.map(k => {
            const v = d[k];
            const vStr = Array.isArray(v) ? v.join(', ') : (typeof v === 'object' ? JSON.stringify(v) : String(v));
            return `${k.toUpperCase()}: ${vStr}`;
          }).join(' | ');
          return detailList;
        }
      }
      if (summaryMsg) return summaryMsg;
    }
    if (err.message) return err.message;
    return defaultMsg;
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const payload = {
        discount_type: discountType,
        discount_value: parseFloat(discountValue || 0),
        discount_reason: discountReason,
        payment_amount: parseFloat(paymentAmount || 0),
        payment_method: paymentMethod,
        transaction_reference: transactionRef,
        room_status: roomNextStatus,
      };

      const res = await checkoutStayApi(id, payload);
      setShowInvoice(true);
    } catch (err) {
      console.error(err);
      setError(extractErrorMessage(err, 'Error completing checkout.'));
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  if (!stay) {
    return <div className="alert alert-danger">Stay record not found.</div>;
  }

  return (
    <div className="row justify-content-center">
      <div className="col-xl-8 col-lg-10">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h4 className="fw-bold m-0 text-dark">Checkout & Final Bill Settlement</h4>
            <span className="text-muted small">Stay #{stay.stay_number} | Room {stay.room_detail?.room_number}</span>
          </div>
          <button className="btn btn-outline-secondary" onClick={() => navigate(`/stays/${stay.id}`)}>
            <i className="bi bi-arrow-left me-1"></i> Back to Stay Details
          </button>
        </div>

        {error && <div className="alert alert-danger shadow-sm mb-4">{error}</div>}

        <form onSubmit={handleCheckoutSubmit}>
          {/* Guest & Stay Summary */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-dark text-white py-3">
              <h5 className="m-0 fw-bold"><i className="bi bi-person-check me-2"></i>Guest & Stay Overview</h5>
            </div>
            <div className="card-body p-4">
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="fw-bold fs-5 text-dark">{stay.primary_customer_detail?.full_name}</div>
                  <div className="text-muted small">Mobile: {stay.primary_customer_detail?.mobile}</div>
                  <div className="text-muted small">ID: {stay.primary_customer_detail?.id_type} ({stay.primary_customer_detail?.id_number || 'N/A'})</div>
                </div>
                <div className="col-md-6 text-md-end">
                  <div className="badge bg-primary fs-6 px-3 py-2">Room {stay.room_detail?.room_number} ({stay.room_detail?.room_type_name})</div>
                  <div className="small text-muted mt-2">Check-In: {formatDate(stay.check_in_date)}</div>
                  <div className="small text-muted">Check-Out Today: {formatDate(new Date())}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bill Breakdown & Discount Adjustment */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white py-3">
              <h5 className="m-0 fw-bold"><i className="bi bi-receipt-cutoff me-2 text-primary"></i>Bill Breakdown & Discount</h5>
            </div>
            <div className="card-body p-4">
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Discount Type</label>
                  <select className="form-select" value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
                    <option value="FIXED">Fixed Amount (₹)</option>
                    <option value="PERCENTAGE">Percentage (%)</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Discount Value</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Discount Reason</label>
                  <select className="form-select" value={discountReason} onChange={(e) => setDiscountReason(e.target.value)}>
                    <option value="">-- Select Reason --</option>
                    <option value="Regular Customer">Regular Customer</option>
                    <option value="Corporate Customer">Corporate Customer</option>
                    <option value="Manager Discount">Manager Discount</option>
                    <option value="Festival Offer">Festival Offer</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-light rounded border">
                <div className="d-flex justify-content-between mb-2">
                  <span>Room Charges ({bill.stay_days || bill.room_days || 1} nights):</span>
                  <strong>{formatCurrency(roomAmount)}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Extra Charges:</span>
                  <strong>{formatCurrency(extraCharges)}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2 border-top pt-2">
                  <span className="fw-bold">Subtotal:</span>
                  <strong className="fw-bold">{formatCurrency(grossSubtotal)}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2 text-danger">
                  <span>Discount {discountReason ? `(${discountReason})` : (discountType === 'PERCENTAGE' ? `(${discountValue}%)` : '')}:</span>
                  <strong className="text-danger">-{formatCurrency(liveDiscountAmount)}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2 text-muted small">
                  <span>Estimated GST ({Math.round(gstRatio * 100)}%):</span>
                  <strong>{formatCurrency(liveGstAmount)}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2 border-top pt-2 fs-5">
                  <span className="fw-bold">Grand Total Bill:</span>
                  <strong className="text-primary fw-bold">{formatCurrency(liveGrandTotal)}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2 text-success">
                  <span>Total Already Paid:</span>
                  <strong className="text-success">{formatCurrency(totalPaid)}</strong>
                </div>
                <div className="d-flex justify-content-between border-top pt-2 fs-5">
                  <span className="fw-bold text-dark">Remaining Balance:</span>
                  <strong className="text-danger fw-bold">{formatCurrency(liveBalance)}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Final Payment & Room Status After Checkout */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white py-3">
              <h5 className="m-0 fw-bold"><i className="bi bi-cash-coin me-2 text-success"></i>Final Payment & Room Status</h5>
            </div>
            <div className="card-body p-4">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Final Payment Received (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control form-control-lg fw-bold text-success"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Payment Method</label>
                  <select className="form-select form-select-lg" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="CARD">Card</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Transaction Reference / UTR</label>
                  <input type="text" className="form-control" value={transactionRef} onChange={(e) => setTransactionRef(e.target.value)} placeholder="Optional transaction reference" />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Set Room Status After Checkout</label>
                  <select className="form-select" value={roomNextStatus} onChange={(e) => setRoomNextStatus(e.target.value)}>
                    <option value="AVAILABLE">AVAILABLE (Immediately ready)</option>
                    <option value="CLEANING">CLEANING (Housekeeping needed)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="d-flex justify-content-end gap-3 mb-5">
            <button type="button" className="btn btn-secondary btn-lg" onClick={() => navigate(`/stays/${stay.id}`)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-danger btn-lg fw-bold shadow">
              <i className="bi bi-box-arrow-right me-2"></i> COMPLETE CHECKOUT & PRINT INVOICE
            </button>
          </div>
        </form>

        <InvoicePreviewModal
          show={showInvoice}
          onClose={() => {
            setShowInvoice(false);
            navigate('/current-stays');
          }}
          stayId={stay.id}
        />
      </div>
    </div>
  );
};

export default Checkout;
