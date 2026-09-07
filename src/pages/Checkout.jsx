import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStayByIdApi, checkoutStayApi } from '../api/stayApi';
import { createPaymentApi } from '../api/billingApi';
import InvoicePreviewModal from '../components/InvoicePreviewModal';
import PaymentFormModal from '../components/PaymentFormModal';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/dateUtils';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import PageLoader from '../components/PageLoader';

import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Phone,
  ArrowLeft,
  Receipt,
  DoorOpen,
  Check,
  Building2,
  Tag,
  Info,
  FileCheck2,
  RefreshCw,
  Wallet,
  RotateCcw,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Moon
} from 'lucide-react';

const Checkout = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useNotification();
  const { hasPermission, getPermissionLimit } = useAuth();

  const canCheckoutWithBalance = hasPermission('stays', 'can_checkout_with_balance');
  const canGiveDiscount = hasPermission('billing', 'can_give_discount');
  const maxDiscountPercent = getPermissionLimit('billing', 'max_discount_percent', 10);
  const canCollectPayment = hasPermission('billing', 'can_collect_payment');
  const canRefund = hasPermission('billing', 'can_refund');

  const [submitting, setSubmitting] = useState(false);

  // Custom Checkout Date & Time
  const [actualCheckoutDate, setActualCheckoutDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [actualCheckoutTime, setActualCheckoutTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [customNights, setCustomNights] = useState(null);

  // Fetch stay data for checkout using TanStack Query
  const {
    data: stay = null,
    isLoading: loading,
    refetch: loadStay,
  } = useQuery({
    queryKey: ['checkout', id],
    queryFn: () => getStayByIdApi(id),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!id,
  });

  // Auto-reset custom nights to calendar baseline when actual checkout date changes
  useEffect(() => {
    if (stay) {
      setCustomNights(null);
    }
  }, [actualCheckoutDate]);

  // Discount configuration
  const [discountType, setDiscountType] = useState('FIXED');
  const [discountValue, setDiscountValue] = useState(0);
  const [discountReason, setDiscountReason] = useState('');

  // Room status after checkout
  const [roomNextStatus, setRoomNextStatus] = useState('AVAILABLE');

  // Receive Payment, Confirmation & Invoice Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showTxnHistory, setShowTxnHistory] = useState(false); // Default collapsed
  const [error, setError] = useState('');

  // Return / Refund Modal States
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundMethod, setRefundMethod] = useState('CASH');
  const [refundRef, setRefundRef] = useState('');
  const [refundNotes, setRefundNotes] = useState('');
  const [refundDate, setRefundDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [refundTime, setRefundTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [refundError, setRefundError] = useState('');

  // Sync stay data to local discount and checkout configuration states when stay is loaded
  useEffect(() => {
    if (stay) {
      setDiscountType(stay.discount_type || 'FIXED');
      setDiscountValue(stay.discount_value || 0);
      setDiscountReason(stay.discount_reason || '');

      // Set initial actual checkout date to today
      const todayStr = new Date().toISOString().split('T')[0];
      setActualCheckoutDate(todayStr);

      if (stay.chargeable_nights) {
        setCustomNights(stay.chargeable_nights);
      }
    }
  }, [stay?.id]);

  // Expected Duration (Nights)
  const expectedNights = (() => {
    if (!stay?.check_in_date || !stay?.expected_checkout_date) return 1;
    const d1 = new Date(stay.check_in_date);
    const d2 = new Date(stay.expected_checkout_date);
    const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  })();

  // 1. Calendar Baseline Duration (Nights) based strictly on calendar dates
  const calendarNights = (() => {
    if (!stay?.check_in_date || !actualCheckoutDate) return expectedNights;
    const d1 = new Date(stay.check_in_date);
    const d2 = new Date(actualCheckoutDate);
    const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  })();

  // 2. Standard hotel checkout time (11:00 AM)
  const stdCheckoutTime = '11:00';
  const stdOutDt = actualCheckoutDate ? new Date(`${actualCheckoutDate}T${stdCheckoutTime}:00`) : null;
  const actualOutDt = (actualCheckoutDate && actualCheckoutTime) ? new Date(`${actualCheckoutDate}T${actualCheckoutTime}:00`) : null;
  const lateCheckoutHours = (stdOutDt && actualOutDt) ? Math.max(0, (actualOutDt - stdOutDt) / (1000 * 60 * 60)) : 0;
  const isExtendedLate = lateCheckoutHours > 6;

  // 3. Bounded allowed options: [calendarNights - 1 (min 1), calendarNights, calendarNights + 1]
  const minAllowedNights = Math.max(1, calendarNights - 1);
  const maxAllowedNights = calendarNights + 1;
  const allowedNightsOptions = [];
  for (let n = minAllowedNights; n <= maxAllowedNights; n++) {
    if (!allowedNightsOptions.includes(n)) {
      allowedNightsOptions.push(n);
    }
  }

  // 4. Effective nights count for billing and folio calculation
  const actualNights = (customNights !== null && customNights >= minAllowedNights && customNights <= maxAllowedNights)
    ? customNights
    : calendarNights;

  // Date Discrepancy Evaluation
  const dateDiscrepancy = (() => {
    if (!stay?.expected_checkout_date || !actualCheckoutDate) return 'ON_SCHEDULE';
    if (actualCheckoutDate < stay.expected_checkout_date) return 'EARLY';
    if (actualCheckoutDate > stay.expected_checkout_date) return 'OVERDUE';
    return 'ON_SCHEDULE';
  })();

  // Live Bill & Discount Calculations
  const bill = stay?.bill_summary || {};
  const roomRate = parseFloat(stay?.room_rate || stay?.room_detail?.base_price || bill.room_rate || 0);
  const liveRoomAmount = actualNights * roomRate;
  const extraCharges = parseFloat(bill.extra_charges_total || bill.total_extra_charges || 0);
  const grossSubtotal = liveRoomAmount + extraCharges;

  const numDiscVal = parseFloat(discountValue || 0);
  let liveDiscountAmount = 0;
  if (discountType === 'PERCENTAGE') {
    liveDiscountAmount = Math.round((grossSubtotal * numDiscVal) / 100);
  } else {
    liveDiscountAmount = numDiscVal;
  }
  liveDiscountAmount = Math.min(grossSubtotal, Math.max(0, liveDiscountAmount));

  const taxableAmount = Math.max(0, grossSubtotal - liveDiscountAmount);

  // Tax calculation using server settings from bill_summary
  const taxEnabled = Boolean(bill.tax_enabled);
  const taxPct = taxEnabled ? parseFloat(bill.tax_percentage || 0) : 0;
  const liveGstAmount = taxEnabled && taxPct > 0 ? (taxableAmount * taxPct) / 100 : 0;

  const liveGrandTotal = taxableAmount + liveGstAmount;
  const totalPaid = (stay?.payments && stay.payments.length > 0)
    ? stay.payments.reduce((acc, p) => acc + parseFloat(p.amount || 0), 0)
    : parseFloat(bill.total_paid || 0);

  const liveBalance = liveGrandTotal - totalPaid;
  const excessPaid = Math.max(0, totalPaid - liveGrandTotal);
  const isExcessPaid = excessPaid > 0.01;
  const isPendingDue = liveBalance > 0.01;
  const isFullyBalanced = !isExcessPaid && !isPendingDue;

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
          const detailList = keys.map((k) => {
            const v = d.errors[k];
            const vStr = Array.isArray(v) ? v.join(', ') : String(v);
            return `${k.toUpperCase()}: ${vStr}`;
          }).join(' | ');
          return `${summaryMsg ? summaryMsg + ' — ' : ''}${detailList}`;
        }
      }
      if (typeof d === 'object') {
        const keys = Object.keys(d).filter((k) => k !== 'success');
        if (keys.length > 0) {
          const detailList = keys.map((k) => {
            const v = d[k];
            const vStr = Array.isArray(v) ? v.join(', ') : typeof v === 'object' ? JSON.stringify(v) : String(v);
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

  // Open Pre-Checkout Confirmation Dialog
  const handleOpenConfirmModal = (e) => {
    if (e) e.preventDefault();
    setError('');

    if (actualCheckoutDate < stay.check_in_date) {
      setError(`Checkout Date (${formatDate(actualCheckoutDate)}) cannot be earlier than Check-In Date (${formatDate(stay.check_in_date)}).`);
      return;
    }

    if (liveBalance > 0.01 && !canCheckoutWithBalance) {
      const msg = `Permission Denied: Checkout with an outstanding balance of ₹${liveBalance.toFixed(2)} is not allowed for your role. Please settle the balance first or request Owner authorization.`;
      setError(msg);
      showError(msg, 'Checkout Blocked');
      return;
    }

    setShowConfirmModal(true);
  };

  // Open Return / Refund Excess Amount Modal with Auto-calculated remaining excess
  const openRefundModal = () => {
    const excess = Math.max(0, totalPaid - liveGrandTotal);
    setRefundAmount(excess > 0 ? excess.toFixed(2) : '0.00');
    setRefundMethod('CASH');
    setRefundRef('');
    setRefundNotes(`Excess payment return of ₹${excess.toFixed(2)} due to early departure / excess advance on Stay #${stay?.stay_number}`);

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    setRefundDate(`${year}-${month}-${day}`);
    setRefundTime(`${hours}:${mins}`);
    setRefundError('');
    setShowRefundModal(true);
  };

  // Execute Refund / Return Amount (Records Debit Payment Transaction)
  const handleExecuteRefund = async (e) => {
    if (e) e.preventDefault();
    setRefundError('');
    const amt = parseFloat(refundAmount);
    if (!amt || amt <= 0) {
      setRefundError('Please enter a valid refund amount.');
      return;
    }

    setRefundSubmitting(true);
    try {
      const payload = {
        stay: stay.id,
        customer: stay.primary_customer,
        amount: -Math.abs(amt), // Negative amount creates a debit transaction in backend ledger
        payment_method: refundMethod,
        transaction_reference: refundRef || 'EXCESS-REFUND',
        notes: refundNotes || `Excess payment refund of ₹${amt.toFixed(2)} on checkout`,
      };
      if (refundDate) {
        const timeStr = refundTime || '12:00';
        payload.payment_date = `${refundDate}T${timeStr}:00`;
      }

      setShowRefundModal(false);
      await createPaymentApi(payload);
      showSuccess(`Refund of ₹${amt.toFixed(2)} returned to guest and logged as debit transaction!`, 'Refund Processed');
      queryClient.invalidateQueries({ queryKey: ['checkout', id] });
      queryClient.invalidateQueries({ queryKey: ['current-stays'], refetchType: 'none' });
      queryClient.invalidateQueries({ queryKey: ['stays'], refetchType: 'none' });
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to process refund transaction.';
      setRefundError(errMsg);
      showError(errMsg, 'Refund Failed');
    } finally {
      setRefundSubmitting(false);
    }
  };

  // Handle Add Received Payment
  const handleRecordPayment = async (payData) => {
    try {
      await createPaymentApi(payData);
      showSuccess('Payment transaction recorded successfully!', 'Payment Received');
      setShowPaymentModal(false);
      queryClient.invalidateQueries({ queryKey: ['checkout', id] });
      queryClient.invalidateQueries({ queryKey: ['current-stays'], refetchType: 'none' });
      queryClient.invalidateQueries({ queryKey: ['stays'], refetchType: 'none' });
    } catch (err) {
      const errMsg = err.response?.data?.error || err.response?.data?.payment_method?.[0] || err.response?.data?.detail || 'Error recording payment.';
      showError(errMsg, 'Payment Failed');
    }
  };

  // Execute Final Checkout API Call
  const handleExecuteFinalCheckout = async () => {
    setShowConfirmModal(false);
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        actual_checkout_date: actualCheckoutDate,
        actual_checkout_time: actualCheckoutTime,
        chargeable_nights: actualNights,
        discount_type: discountType,
        discount_value: parseFloat(discountValue || 0),
        discount_reason: discountReason,
        payment_amount: 0,
        payment_method: 'CASH',
        transaction_reference: '',
        room_status: roomNextStatus,
      };

      // Optimistically update room housekeeping status in inventory
      const roomNum = stay?.room_detail?.id || stay?.room;
      if (roomNum) {
        queryClient.setQueriesData({ queryKey: ['rooms'] }, (old) => {
          if (!Array.isArray(old)) return old;
          return old.map((r) => (r.id === roomNum ? { ...r, status: roomNextStatus } : r));
        });
      }

      await checkoutStayApi(id, payload);
      queryClient.invalidateQueries({ queryKey: ['checkout', id] });
      queryClient.invalidateQueries({ queryKey: ['current-stays'], refetchType: 'none' });
      queryClient.invalidateQueries({ queryKey: ['stays'], refetchType: 'none' });
      queryClient.invalidateQueries({ queryKey: ['rooms'], refetchType: 'none' });
      queryClient.invalidateQueries({ queryKey: ['dashboard'], refetchType: 'none' });
      showSuccess(`Checkout for Room ${stay?.room_detail?.room_number || stay?.room} completed successfully!`, 'Checkout Successful');
      setShowInvoice(true);
    } catch (err) {
      console.error(err);
      const errMsg = extractErrorMessage(err, 'Error completing checkout.');
      setError(errMsg);
      showError(errMsg, 'Checkout Failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <PageLoader fullScreen={false} message="Loading Stay & Checkout Summary..." />;
  }

  if (!stay) {
    return <div className="alert alert-danger">Stay record not found.</div>;
  }

  return (
    <div className="container-fluid px-0 pb-5" style={{ maxWidth: '1440px' }}>
      
      {/* 1. TOP EXECUTIVE HEADER BAR */}
      <div className="card border-0 shadow-sm rounded-4 mb-4 bg-white overflow-hidden">
        <div className="card-body p-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div className="d-flex align-items-center gap-3">
            <div
              className="p-3 bg-danger-subtle text-danger rounded-4 d-flex align-items-center justify-content-center shadow-xs"
              style={{ width: '56px', height: '56px' }}
            >
              <Receipt size={28} />
            </div>
            <div>
              <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                <span className="badge bg-danger text-white rounded-pill px-2.5 py-1 text-uppercase fw-bold" style={{ fontSize: '0.675rem', letterSpacing: '0.05em' }}>
                  Departure Terminal
                </span>
                <span className="badge bg-light text-secondary border rounded-pill px-2.5 py-1" style={{ fontSize: '0.725rem' }}>
                  Stay #{stay.stay_number}
                </span>
                {stay.booking && (
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2.5 py-1" style={{ fontSize: '0.725rem' }}>
                    Booking #{stay.booking_detail?.booking_number || stay.booking}
                  </span>
                )}
              </div>
              <h3 className="fw-bold text-dark m-0" style={{ letterSpacing: '-0.025em' }}>
                Checkout &amp; Folio Settlement
              </h3>
              <p className="text-secondary small m-0 mt-0.5">
                Review stay charges, apply concessions, record settlement payments, and release room inventory.
              </p>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-light border fw-semibold px-3 py-2 rounded-3 shadow-xs d-flex align-items-center gap-2 text-secondary hover-bg-light"
              onClick={() => navigate(`/stays/${stay.id}`)}
            >
              <ArrowLeft size={16} /> Back to Stay Details
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger shadow-sm rounded-4 mb-4 d-flex align-items-center gap-2 p-3 border-danger">
          <AlertOctagon className="text-danger flex-shrink-0" size={20} />
          <div className="small fw-semibold">{error}</div>
        </div>
      )}

      {/* 2. DATE DISCREPANCY EXECUTIVE ALERTS */}
      {dateDiscrepancy === 'EARLY' && (
        <div className="alert alert-warning border-warning shadow-xs mb-4 rounded-4 d-flex align-items-start gap-3 p-3">
          <div className="p-2 bg-warning-subtle text-warning-emphasis rounded-circle flex-shrink-0 mt-0.5">
            <AlertTriangle size={20} />
          </div>
          <div className="flex-grow-1">
            <div className="fw-bold text-dark mb-0.5" style={{ fontSize: '0.95rem' }}>
              Early Departure Notice ({expectedNights - actualNights} Night{expectedNights - actualNights > 1 ? 's' : ''} Prior)
            </div>
            <div className="small text-secondary" style={{ lineHeight: 1.5 }}>
              Guest was scheduled to stay until <strong>{formatDate(stay.expected_checkout_date)}</strong> ({expectedNights} nights total).
              Guest is checking out early today on <strong>{formatDate(actualCheckoutDate)}</strong> ({actualNights} night{actualNights > 1 ? 's' : ''} actual).
              Room charges in the Folio have been automatically adjusted for <strong>{actualNights} night(s)</strong>.
            </div>
          </div>
        </div>
      )}

      {dateDiscrepancy === 'OVERDUE' && (
        <div className="alert alert-danger border-danger shadow-xs mb-4 rounded-4 d-flex align-items-start gap-3 p-3">
          <div className="p-2 bg-danger-subtle text-danger rounded-circle flex-shrink-0 mt-0.5">
            <AlertOctagon size={20} />
          </div>
          <div className="flex-grow-1">
            <div className="fw-bold text-dark mb-0.5" style={{ fontSize: '0.95rem' }}>
              Overdue Departure Notice ({actualNights - expectedNights} Extra Night{actualNights - expectedNights > 1 ? 's' : ''})
            </div>
            <div className="small text-secondary" style={{ lineHeight: 1.5 }}>
              Guest scheduled checkout was <strong>{formatDate(stay.expected_checkout_date)}</strong> ({expectedNights} nights).
              Guest stayed {actualNights - expectedNights} extra night(s) until <strong>{formatDate(actualCheckoutDate)}</strong> (Total: {actualNights} nights).
              Folio charges have been updated to reflect <strong>{actualNights} nights</strong>.
            </div>
          </div>
        </div>
      )}

      {dateDiscrepancy === 'ON_SCHEDULE' && (
        <div className="alert alert-success bg-success-subtle border-success-subtle shadow-xs mb-4 rounded-4 d-flex align-items-center gap-2 py-2.5 px-3">
          <CheckCircle2 className="text-success flex-shrink-0" size={18} />
          <div className="small text-dark">
            <strong>On-Schedule Departure:</strong> Scheduled checkout date is <strong>{formatDate(stay.expected_checkout_date)}</strong> ({actualNights} night{actualNights > 1 ? 's' : ''}). Note: Same-day departure time (e.g. 11:00 AM, 2:00 PM, or 8:00 PM) does not alter room billing.
          </div>
        </div>
      )}

      {/* 3. TWO-COLUMN WORKSPACE LAYOUT */}
      <form onSubmit={handleOpenConfirmModal}>
        <div className="row g-4 align-items-start">
          
          {/* ========================================================== */}
          {/* LEFT COLUMN: GUEST CONTEXT, SCHEDULE & HANDOVER CONTROLS   */}
          {/* ========================================================== */}
          <div className="col-lg-7 col-xl-7">
            
            {/* Card A: Room & Guest Identity Overview */}
            <div className="card border-0 shadow-sm rounded-4 mb-4 bg-white overflow-hidden">
              <div className="card-header bg-white py-3 px-4 border-bottom d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                  <Building2 size={18} className="text-primary" />
                  <h6 className="m-0 fw-bold text-dark">Room &amp; Guest Summary</h6>
                </div>
                <span className="badge bg-primary text-white rounded-pill px-3 py-1.5 fw-semibold shadow-xs" style={{ fontSize: '0.8rem' }}>
                  Room {stay.room_detail?.room_number} &bull; {stay.room_detail?.room_type_name || 'Standard'}
                </span>
              </div>

              <div className="card-body p-4">
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="d-flex align-items-center gap-3 mb-2">
                      <div
                        className="p-2 bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold fs-5 flex-shrink-0"
                        style={{ width: '46px', height: '46px' }}
                      >
                        {stay.primary_customer_detail?.full_name ? stay.primary_customer_detail.full_name.charAt(0).toUpperCase() : 'G'}
                      </div>
                      <div>
                        <div className="fw-bold fs-6 text-dark">{stay.primary_customer_detail?.full_name}</div>
                        <div className="text-secondary small d-flex align-items-center gap-1">
                          <Phone size={13} className="text-primary" />
                          {stay.primary_customer_detail?.mobile || 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="p-2.5 bg-light rounded-3 border small">
                      <div className="text-secondary extra-small text-uppercase fw-bold mb-0.5">Statutory Identity Proof</div>
                      <div className="fw-semibold text-dark">
                        {stay.primary_customer_detail?.id_type}: <strong>{stay.primary_customer_detail?.id_number || 'Not Recorded'}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded-3 border h-100 d-flex flex-column justify-content-between">
                      <div>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="text-secondary small">Check-In:</span>
                          <strong className="text-dark small">{formatDate(stay.check_in_date)} ({stay.check_in_time ? String(stay.check_in_time).substring(0, 5) : '12:00'})</strong>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="text-secondary small">Scheduled Out:</span>
                          <strong className="text-dark small">{formatDate(stay.expected_checkout_date)}</strong>
                        </div>
                      </div>
                      <div className="border-top pt-2 mt-2 d-flex justify-content-between align-items-center">
                        <span className="text-secondary small fw-medium">Agreed Nightly Tariff:</span>
                        <strong className="text-primary">{formatCurrency(roomRate)} / night</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card B: Departure Datetime Controls & Segmented Quick Chips */}
            <div className="card border-0 shadow-sm rounded-4 mb-4 bg-white overflow-hidden">
              <div className="card-header bg-white py-3 px-4 border-bottom d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                  <Clock size={18} className="text-primary" />
                  <h6 className="m-0 fw-bold text-dark">Departure Schedule Controls</h6>
                </div>
                <span className="badge bg-light text-secondary border rounded-pill px-2.5 py-1 small">
                  {actualNights} Night{actualNights > 1 ? 's' : ''} Duration
                </span>
              </div>

              <div className="card-body p-4">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-dark small mb-1.5 d-flex align-items-center gap-1.5">
                      <Calendar size={14} className="text-primary" /> Actual Check-Out Date *
                    </label>
                    <input
                      type="date"
                      className="form-control form-control-lg font-semibold border"
                      style={{ fontSize: '0.95rem' }}
                      required
                      value={actualCheckoutDate}
                      min={stay.check_in_date}
                      onChange={(e) => setActualCheckoutDate(e.target.value)}
                    />
                    <span className="text-muted extra-small d-block mt-1">
                      Scheduled: <strong>{formatDate(stay.expected_checkout_date)}</strong>
                    </span>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-dark small mb-1.5 d-flex align-items-center gap-1.5">
                      <Clock size={14} className="text-primary" /> Actual Check-Out Time *
                    </label>
                    <input
                      type="time"
                      className="form-control form-control-lg font-semibold border"
                      style={{ fontSize: '0.95rem' }}
                      required
                      value={actualCheckoutTime}
                      onChange={(e) => setActualCheckoutTime(e.target.value)}
                    />
                    
                    {/* Segmented Quick Preset Buttons */}
                    <div className="d-flex gap-1.5 mt-2 flex-wrap">
                      <button
                        type="button"
                        className="btn btn-xs btn-outline-secondary py-1 px-2.5 rounded-2 d-flex align-items-center gap-1"
                        style={{ fontSize: '0.725rem' }}
                        onClick={() => {
                          const now = new Date();
                          setActualCheckoutTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
                        }}
                      >
                        <RefreshCw size={11} /> Now
                      </button>
                      <button
                        type="button"
                        className="btn btn-xs btn-outline-secondary py-1 px-2.5 rounded-2"
                        style={{ fontSize: '0.725rem' }}
                        onClick={() => setActualCheckoutTime('11:00')}
                      >
                        11:00 AM (Standard)
                      </button>
                      <button
                        type="button"
                        className="btn btn-xs btn-outline-secondary py-1 px-2.5 rounded-2"
                        style={{ fontSize: '0.725rem' }}
                        onClick={() => setActualCheckoutTime('14:00')}
                      >
                        2:00 PM (Late)
                      </button>
                      <button
                        type="button"
                        className="btn btn-xs btn-outline-secondary py-1 px-2.5 rounded-2"
                        style={{ fontSize: '0.725rem' }}
                        onClick={() => setActualCheckoutTime('20:00')}
                      >
                        8:00 PM (Evening)
                      </button>
                    </div>
                  </div>
                </div>

                {/* SMART STAY DURATION & BOUNDED NIGHTS SELECTOR */}
                <div className="p-3 bg-light rounded-3 border mt-3">
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                        <span className="fw-bold text-dark fs-6 d-flex align-items-center gap-1.5">
                          <Moon size={16} className="text-primary" /> Stay Duration:
                        </span>
                        <span className="badge bg-primary rounded-pill px-2.5 py-1">
                          {actualNights} Night{actualNights > 1 ? 's' : ''} Charged
                        </span>
                        {actualNights !== calendarNights && (
                          <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle rounded-pill px-2 py-0.5 small">
                            Customized ({actualNights > calendarNights ? `+${actualNights - calendarNights} extra` : `${actualNights - calendarNights}`})
                          </span>
                        )}
                      </div>
                      <div className="small text-muted d-flex flex-wrap align-items-center gap-2">
                        <span>
                          Calendar baseline: <strong>{calendarNights} Night{calendarNights > 1 ? 's' : ''}</strong> ({formatDate(stay.check_in_date)} to {formatDate(actualCheckoutDate)})
                        </span>
                        {lateCheckoutHours > 0.1 && (
                          <span className={`badge ${isExtendedLate ? 'bg-warning-subtle text-warning-emphasis border border-warning-subtle' : 'bg-white text-secondary border'}`}>
                            {isExtendedLate ? '⚡' : '⏱️'} Late Departure: {lateCheckoutHours.toFixed(1)}h after standard {stdCheckoutTime} {isExtendedLate ? '(>6h - Extra Night Allowed)' : '(Standard window)'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bounded Pill Selector */}
                    <div className="d-flex align-items-center gap-1.5 flex-wrap">
                      <span className="text-muted small fw-semibold me-1">Consider Nights:</span>
                      {allowedNightsOptions.map((n) => {
                        const isSelected = actualNights === n;
                        const isStandard = n === calendarNights;
                        const isExtra = n > calendarNights;
                        return (
                          <button
                            key={n}
                            type="button"
                            className={`btn btn-sm rounded-pill px-3 py-1 fw-semibold transition-all ${
                              isSelected
                                ? 'btn-primary text-white shadow-xs'
                                : 'btn-outline-secondary bg-white text-secondary'
                            }`}
                            onClick={() => setCustomNights(n)}
                            title={
                              isStandard
                                ? `Standard ${n}-night calendar stay`
                                : isExtra
                                ? `Charge ${n} nights (accounting for extended stay / late departure)`
                                : `Reduced to ${n} night`
                            }
                          >
                            {n} Night{n > 1 ? 's' : ''}
                            {isStandard ? ' (Standard)' : isExtra ? ' (+1 Extra)' : ' (-1 Day)'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-light rounded-3 border mt-3 text-secondary extra-small d-flex align-items-center gap-2">
                  <Info size={15} className="text-primary flex-shrink-0" />
                  <div>
                    <strong>Hospitality Calculation:</strong> Room charges are billed per calendar night. Standard checkout is 11:00 AM. Departure up to 6 hours after standard checkout does not require extra night charges, but you can choose <strong>(+1 Extra)</strong> if an extra night is being charged for extended late departure.
                  </div>
                </div>
              </div>
            </div>

            {/* Card C: Concessions & Discount Adjustments */}
            <div className="card border-0 shadow-sm rounded-4 mb-4 bg-white overflow-hidden">
              <div className="card-header bg-white py-3 px-4 border-bottom d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                  <Tag size={18} className="text-primary" />
                  <h6 className="m-0 fw-bold text-dark">Concession &amp; Discount Adjustments</h6>
                </div>
                <div className="d-flex align-items-center gap-2">
                  {!canGiveDiscount && (
                    <span className="badge bg-secondary-subtle text-secondary border rounded-pill px-2.5 py-1 extra-small fw-semibold">
                      Discount Not Permitted
                    </span>
                  )}
                  {canGiveDiscount && maxDiscountPercent < Infinity && (
                    <span className="badge bg-info-subtle text-info border border-info-subtle rounded-pill px-2.5 py-1 extra-small fw-semibold">
                      Max {maxDiscountPercent}%
                    </span>
                  )}
                  {liveDiscountAmount > 0 && (
                    <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-2.5 py-1 fw-bold">
                      -{formatCurrency(liveDiscountAmount)} Applied
                    </span>
                  )}
                </div>
              </div>

              <div className="card-body p-4">
                {!canGiveDiscount ? (
                  <div className="alert alert-secondary py-2 px-3 small mb-0 d-flex align-items-center gap-2">
                    <Info size={16} />
                    <span>Your staff role does not have authorization to grant billing concessions or discounts.</span>
                  </div>
                ) : (
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label fw-semibold small text-dark mb-1">Discount Mode</label>
                      <select className="form-select form-select-md" value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
                        <option value="FIXED">Fixed Amount (₹)</option>
                        <option value="PERCENTAGE">Percentage (%)</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold small text-dark mb-1">
                        Discount Value {discountType === 'PERCENTAGE' ? `(%, max ${maxDiscountPercent < Infinity ? maxDiscountPercent + '%' : '100%'})` : '(₹)'}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={discountType === 'PERCENTAGE' && maxDiscountPercent < Infinity ? maxDiscountPercent : undefined}
                        className="form-control form-control-md font-semibold"
                        value={discountValue}
                        onChange={(e) => {
                          let val = parseFloat(e.target.value) || 0;
                          if (discountType === 'PERCENTAGE' && maxDiscountPercent < Infinity && val > maxDiscountPercent) {
                            val = maxDiscountPercent;
                          }
                          setDiscountValue(e.target.value === '' ? '' : val);
                        }}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold small text-dark mb-1">Concession Reason</label>
                      <input
                        type="text"
                        className="form-control form-control-md"
                        placeholder="e.g. Corporate / Offer"
                        value={discountReason}
                        onChange={(e) => setDiscountReason(e.target.value)}
                      />
                    </div>

                    <div className="col-12">
                      <div className="d-flex gap-1.5 flex-wrap">
                        {['Regular Guest', 'Corporate Tariff', 'Manager Discretion', 'Festival Offer'].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            className={`btn btn-xs ${discountReason === preset ? 'btn-primary' : 'btn-outline-secondary'} py-1 px-2.5 rounded-pill`}
                            style={{ fontSize: '0.725rem' }}
                            onClick={() => setDiscountReason(preset)}
                          >
                            + {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Card D: Post-Checkout Room Status Workflow */}
            <div className="card border-0 shadow-sm rounded-4 mb-4 bg-white overflow-hidden">
              <div className="card-header bg-white py-3 px-4 border-bottom d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                  <DoorOpen size={18} className="text-primary" />
                  <h6 className="m-0 fw-bold text-dark">Post-Checkout Room Status Workflow</h6>
                </div>
              </div>

              <div className="card-body p-4">
                <div className="row g-3">
                  <div className="col-md-6">
                    <div
                      className={`p-3 rounded-4 border position-relative transition-all h-100 cursor-pointer d-flex flex-column justify-content-between ${
                        roomNextStatus === 'AVAILABLE' ? 'border-primary bg-primary-subtle shadow-xs' : 'border-light-subtle bg-white hover-bg-light'
                      }`}
                      onClick={() => setRoomNextStatus('AVAILABLE')}
                      style={{ cursor: 'pointer', minHeight: '92px' }}
                    >
                      <div className="d-flex align-items-center justify-content-between gap-2 mb-1.5">
                        <div className="d-flex align-items-center gap-2.5">
                          <input
                            type="radio"
                            name="roomNextStatus"
                            className="form-check-input mt-0 cursor-pointer"
                            checked={roomNextStatus === 'AVAILABLE'}
                            onChange={() => setRoomNextStatus('AVAILABLE')}
                          />
                          <span className="fw-bold text-dark small">AVAILABLE</span>
                        </div>
                        <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2.5 py-1 extra-small fw-semibold">
                          Ready
                        </span>
                      </div>
                      <div className="text-secondary extra-small ps-4">
                        Ready for immediate guest check-in
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div
                      className={`p-3 rounded-4 border position-relative transition-all h-100 cursor-pointer d-flex flex-column justify-content-between ${
                        roomNextStatus === 'CLEANING' ? 'border-warning bg-warning-subtle shadow-xs' : 'border-light-subtle bg-white hover-bg-light'
                      }`}
                      onClick={() => setRoomNextStatus('CLEANING')}
                      style={{ cursor: 'pointer', minHeight: '92px' }}
                    >
                      <div className="d-flex align-items-center justify-content-between gap-2 mb-1.5">
                        <div className="d-flex align-items-center gap-2.5">
                          <input
                            type="radio"
                            name="roomNextStatus"
                            className="form-check-input mt-0 cursor-pointer"
                            checked={roomNextStatus === 'CLEANING'}
                            onChange={() => setRoomNextStatus('CLEANING')}
                          />
                          <span className="fw-bold text-dark small">CLEANING / HOUSEKEEPING</span>
                        </div>
                        <span className="badge bg-warning-subtle text-warning border border-warning-subtle rounded-pill px-2.5 py-1 extra-small fw-semibold">
                          Service
                        </span>
                      </div>
                      <div className="text-secondary extra-small ps-4">
                        Requires sanitization &amp; linen change
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* ========================================================== */}
          {/* RIGHT COLUMN: STICKY GUEST FOLIO & INSTANT SETTLEMENT HUB  */}
          {/* ========================================================== */}
          <div className="col-lg-5 col-xl-5">
            <div style={{ position: 'sticky', top: '1rem', zIndex: 10 }}>
              
              {/* Luxury Guest Folio Statement Card */}
              <div className="card border-0 shadow-lg rounded-4 overflow-hidden bg-white mb-4">
                <div className="card-header bg-dark text-white py-3 px-4 d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-2">
                    <Receipt size={18} className="text-primary" />
                    <h6 className="m-0 fw-bold">Guest Folio Statement</h6>
                  </div>
                  <span className="badge bg-light text-dark px-2.5 py-1 rounded-pill extra-small fw-bold">
                    Room {stay.room_detail?.room_number}
                  </span>
                </div>

                <div className="card-body p-4">
                  
                  {/* Folio Itemized Breakdown Table */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                      <div>
                        <div className="fw-semibold text-dark small d-flex align-items-center gap-1.5">
                          Room Tariff
                          {actualNights !== calendarNights && (
                            <span className="badge bg-info-subtle text-info border border-info-subtle rounded-pill extra-small px-1.5 py-0.5">
                              {actualNights > calendarNights ? `+${actualNights - calendarNights} Extra` : `${actualNights - calendarNights}`}
                            </span>
                          )}
                        </div>
                        <div className="text-secondary extra-small">
                          {actualNights} Night{actualNights > 1 ? 's' : ''} &times; {formatCurrency(roomRate)}
                        </div>
                      </div>
                      <strong className="text-dark small">{formatCurrency(liveRoomAmount)}</strong>
                    </div>

                    <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                      <div>
                        <div className="fw-semibold text-dark small">Extra Charges &amp; Services</div>
                        <div className="text-secondary extra-small">Food, Laundry &amp; Amenities</div>
                      </div>
                      <strong className="text-dark small">{formatCurrency(extraCharges)}</strong>
                    </div>

                    <div className="d-flex justify-content-between align-items-center py-2 border-bottom bg-light px-2 rounded-2 my-1">
                      <span className="fw-bold text-dark small">Subtotal</span>
                      <strong className="fw-bold text-dark small">{formatCurrency(grossSubtotal)}</strong>
                    </div>

                    {liveDiscountAmount > 0 && (
                      <div className="d-flex justify-content-between align-items-center py-2 border-bottom text-danger">
                        <div>
                          <div className="fw-semibold small">Discount Concession</div>
                          <div className="extra-small">{discountReason || (discountType === 'PERCENTAGE' ? `${discountValue}% Off` : 'Special Discount')}</div>
                        </div>
                        <strong className="text-danger small">-{formatCurrency(liveDiscountAmount)}</strong>
                      </div>
                    )}

                    {taxEnabled && taxPct > 0 && (
                      <div className="d-flex justify-content-between align-items-center py-2 border-bottom text-secondary">
                        <div>
                          <div className="fw-semibold small">GST Tax ({taxPct}%)</div>
                          <div className="extra-small">Statutory tax on taxable folio</div>
                        </div>
                        <strong className="text-dark small">+{formatCurrency(liveGstAmount)}</strong>
                      </div>
                    )}

                    <div className="d-flex justify-content-between align-items-center pt-3 pb-2 fs-5 border-top">
                      <span className="fw-bold text-dark">Grand Total Folio</span>
                      <strong className="text-primary fw-bold">{formatCurrency(liveGrandTotal)}</strong>
                    </div>

                    <div className="d-flex justify-content-between align-items-center py-2 text-success border-top border-light-subtle">
                      <div className="d-flex align-items-center gap-1.5">
                        <Check size={16} />
                        <span className="small fw-semibold">Total Paid to Date</span>
                      </div>
                      <strong className="text-success small">{formatCurrency(totalPaid)}</strong>
                    </div>

                    {/* Stay Payments & Refund Audit Trail (Default Collapsed) */}
                    {stay.payments && stay.payments.length > 0 && (
                      <div className="mt-2 pt-2 border-top">
                        <button
                          type="button"
                          className="btn btn-sm p-0 w-100 d-flex justify-content-between align-items-center text-decoration-none shadow-none"
                          onClick={() => setShowTxnHistory((prev) => !prev)}
                          style={{ background: 'none', border: 'none' }}
                        >
                          <div className="d-flex align-items-center gap-1.5 extra-small fw-bold text-secondary text-uppercase">
                            <Receipt size={13} className="text-primary" />
                            <span>Transaction History ({stay.payments.length})</span>
                          </div>
                          <div className="d-flex align-items-center gap-1 extra-small text-primary fw-semibold">
                            <span>{showTxnHistory ? 'Collapse' : 'Expand'}</span>
                            {showTxnHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </div>
                        </button>

                        {showTxnHistory && (
                          <div className="d-flex flex-column gap-1 mt-2 transition-all" style={{ maxHeight: '160px', overflowY: 'auto' }}>
                            {stay.payments.map((p) => {
                              const amt = parseFloat(p.amount || 0);
                              const isDebit = amt < 0;
                              return (
                                <div key={p.id} className="d-flex justify-content-between align-items-center extra-small bg-light p-2 rounded-2 border">
                                  <div className="text-truncate me-2">
                                    <span className="fw-bold text-dark">{p.payment_number}</span>
                                    <span className="badge bg-white text-secondary border ms-1.5" style={{ fontSize: '0.65rem' }}>{p.payment_method}</span>
                                    {p.payment_date && (
                                      <div className="text-muted extra-small" style={{ fontSize: '0.675rem' }}>
                                        {new Date(p.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-end flex-shrink-0">
                                    <strong className={isDebit ? 'text-danger' : 'text-success'}>
                                      {isDebit ? `-₹${Math.abs(amt).toFixed(2)}` : `+₹${amt.toFixed(2)}`}
                                    </strong>
                                    {isDebit && (
                                      <div className="badge bg-danger-subtle text-danger border border-danger-subtle d-block extra-small mt-0.5" style={{ fontSize: '0.625rem' }}>
                                        Debit / Refund
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* SETTLEMENT STATUS & RECEIVE / RETURN MONEY HERO BOX */}
                  <div
                    className={`rounded-4 border mb-4 transition-all ${
                      isExcessPaid
                        ? 'bg-warning-subtle border-warning'
                        : isPendingDue
                        ? 'bg-danger-subtle border-danger-subtle'
                        : 'bg-success-subtle border-success-subtle'
                    }`}
                    style={{ padding: '1.25rem' }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="extra-small text-uppercase fw-bold text-secondary tracking-wider" style={{ fontSize: '0.72rem', letterSpacing: '0.05em' }}>
                        Folio Settlement Status
                      </span>
                      {isExcessPaid ? (
                        <span className="badge bg-warning text-dark border border-warning-subtle rounded-pill px-3 py-1 extra-small fw-bold d-inline-flex align-items-center gap-1">
                          <AlertTriangle size={12} /> Excess Paid / Refund Due
                        </span>
                      ) : isPendingDue ? (
                        <span className="badge bg-danger text-white rounded-pill px-3 py-1 extra-small fw-bold">
                          Pending Balance
                        </span>
                      ) : (
                        <span className="badge bg-success text-white rounded-pill px-3 py-1 extra-small fw-bold d-inline-flex align-items-center gap-1">
                          <Check size={12} /> Fully Settled
                        </span>
                      )}
                    </div>

                    {isExcessPaid ? (
                      <>
                        <div className="d-flex justify-content-between align-items-baseline mb-2">
                          <span className="fw-bold text-dark fs-6">Return Amount:</span>
                          <strong className="fs-3 fw-bold text-danger" style={{ letterSpacing: '-0.02em' }}>
                            {formatCurrency(excessPaid)}
                          </strong>
                        </div>
                        <div className="text-muted extra-small mb-3 bg-white p-2 rounded-2 border">
                          💡 <strong>Excess Payment:</strong> Customer paid {formatCurrency(totalPaid)} vs {formatCurrency(liveGrandTotal)} folio charges. Return remaining {formatCurrency(excessPaid)} to balance this stay.
                        </div>
                        {canRefund ? (
                          <button
                            type="button"
                            className="btn btn-warning btn-lg w-100 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 rounded-3 py-2.5 text-dark"
                            onClick={openRefundModal}
                          >
                            <RotateCcw size={18} /> Return Amount ({formatCurrency(excessPaid)})
                          </button>
                        ) : (
                          <div className="alert alert-warning py-2 px-3 small d-flex align-items-center gap-2 mb-0">
                            <AlertTriangle size={16} />
                            <span>Refunds require Owner authorization.</span>
                          </div>
                        )}
                      </>
                    ) : isPendingDue ? (
                      <>
                        <div className="d-flex justify-content-between align-items-baseline mb-3">
                          <span className="fw-bold text-dark fs-6">Remaining Due:</span>
                          <strong className="fs-3 fw-bold text-danger" style={{ letterSpacing: '-0.02em' }}>
                            {formatCurrency(liveBalance)}
                          </strong>
                        </div>
                        {canCollectPayment ? (
                          <button
                            type="button"
                            className="btn btn-success btn-lg w-100 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 rounded-3 py-2.5"
                            onClick={() => setShowPaymentModal(true)}
                          >
                            <Wallet size={18} /> Receive Money / Settle Payment
                          </button>
                        ) : (
                          <div className="alert alert-secondary py-2 px-3 small d-flex align-items-center gap-2 mb-0">
                            <Info size={16} />
                            <span>Payment collection not permitted for your role.</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="d-flex justify-content-between align-items-baseline mb-3">
                          <span className="fw-bold text-dark fs-6">Remaining Due:</span>
                          <strong className="fs-3 fw-bold text-success" style={{ letterSpacing: '-0.02em' }}>
                            ₹0.00
                          </strong>
                        </div>
                        {canCollectPayment && (
                          <button
                            type="button"
                            className="btn btn-outline-success btn-sm w-100 fw-semibold rounded-3 py-2 d-flex align-items-center justify-content-center gap-1.5"
                            onClick={() => setShowPaymentModal(true)}
                          >
                            <Wallet size={15} /> + Record Additional Payment
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {liveBalance > 0.01 && !canCheckoutWithBalance && (
                    <div className="alert alert-danger py-2.5 px-3 rounded-3 small mb-3 d-flex align-items-start gap-2">
                      <AlertOctagon size={18} className="text-danger flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Checkout Blocked:</strong> Balance of {formatCurrency(liveBalance)} is pending. Your role cannot check out guests with an unsettled balance. Please collect payment or contact the Hotel Owner.
                      </div>
                    </div>
                  )}

                  {/* MASTER COMPLETE CHECKOUT ACTION BUTTON */}
                  <button
                    type="submit"
                    className="btn btn-danger btn-lg w-100 fw-bold shadow d-flex align-items-center justify-content-center gap-2 rounded-4 py-3 text-uppercase"
                    style={{ letterSpacing: '0.025em' }}
                    disabled={submitting || (liveBalance > 0.01 && !canCheckoutWithBalance)}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        Finalizing Checkout...
                      </>
                    ) : (
                      <>
                        <FileCheck2 size={20} /> Finalize Checkout &amp; Print Invoice
                      </>
                    )}
                  </button>

                  <p className="text-secondary extra-small text-center mt-2.5 mb-0">
                    Completing checkout checks out the stay, unlocks room for cleaning/re-booking, and archives the invoice.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </form>

      {/* ========================================================= */}
      {/* 4. PRE-CHECKOUT CONFIRMATION MODAL                        */}
      {/* ========================================================= */}
      {showConfirmModal && (
        <div className="modal fade show d-block modal-backdrop-animated" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-animated" style={{ maxWidth: '540px' }}>
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              
              {/* Modal Header */}
              <div className="modal-header bg-dark text-white py-3.5 px-4 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2.5">
                  <div className="p-2 bg-danger text-white rounded-3 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                    <Receipt size={20} />
                  </div>
                  <div>
                    <h6 className="modal-title fw-bold text-white m-0" style={{ fontSize: '1.05rem' }}>
                      Confirm Guest Checkout
                    </h6>
                    <span className="text-white-50 extra-small">
                      Stay #{stay.stay_number} &bull; Room {stay.room_detail?.room_number}
                    </span>
                  </div>
                </div>
                <button type="button" className="btn-close btn-close-white shadow-none" onClick={() => setShowConfirmModal(false)}></button>
              </div>

              {/* Modal Body */}
              <div className="modal-body p-4 bg-white">
                
                {/* Notice if Early or Overdue */}
                {dateDiscrepancy === 'EARLY' && (
                  <div className="p-3 bg-warning-subtle border border-warning-subtle rounded-3 small text-dark mb-3.5 d-flex align-items-start gap-2">
                    <AlertTriangle size={17} className="text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Early Checkout:</strong> Guest is checking out on <strong>{formatDate(actualCheckoutDate)}</strong> ({actualNights} night{actualNights > 1 ? 's' : ''} vs scheduled {expectedNights} nights).
                    </div>
                  </div>
                )}

                {dateDiscrepancy === 'OVERDUE' && (
                  <div className="p-3 bg-danger-subtle border border-danger-subtle rounded-3 small text-dark mb-3.5 d-flex align-items-start gap-2">
                    <AlertOctagon size={17} className="text-danger flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Overdue Checkout:</strong> Guest stayed until <strong>{formatDate(actualCheckoutDate)}</strong> ({actualNights} nights vs scheduled {expectedNights} nights).
                    </div>
                  </div>
                )}

                {/* Summary Grid */}
                <div className="p-4 bg-light rounded-3 border mb-4">
                  <div className="d-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', columnGap: '28px', rowGap: '16px' }}>
                    <div>
                      <span className="text-secondary extra-small d-block mb-1">Primary Guest</span>
                      <strong className="text-dark small d-block">{stay.primary_customer_detail?.full_name}</strong>
                    </div>
                    <div>
                      <span className="text-secondary extra-small d-block mb-1">Allocated Room</span>
                      <strong className="text-dark small d-block">Room {stay.room_detail?.room_number} ({stay.room_detail?.room_type_name})</strong>
                    </div>
                    <div>
                      <span className="text-secondary extra-small d-block mb-1">Check-In</span>
                      <strong className="text-dark small d-block">{formatDate(stay.check_in_date)}</strong>
                    </div>
                    <div>
                      <span className="text-secondary extra-small d-block mb-1">Actual Check-Out</span>
                      <strong className="text-dark small d-block">{formatDate(actualCheckoutDate)} ({actualCheckoutTime})</strong>
                    </div>
                    <div>
                      <span className="text-secondary extra-small d-block mb-1">Total Stay Duration</span>
                      <strong className="text-primary small fw-bold d-flex align-items-center gap-1.5">
                        {actualNights} Night{actualNights > 1 ? 's' : ''}
                        {actualNights !== calendarNights && (
                          <span className="badge bg-info-subtle text-info border border-info-subtle rounded-pill extra-small">
                            Customized
                          </span>
                        )}
                      </strong>
                    </div>
                    <div>
                      <span className="text-secondary extra-small d-block mb-1">Post-Checkout Room Status</span>
                      <strong className="text-dark small d-block">{roomNextStatus}</strong>
                    </div>
                  </div>
                </div>

                {/* Financial Settlement */}
                <div
                  className="p-4 rounded-3 border d-flex align-items-center justify-content-between"
                  style={{
                    backgroundColor: liveBalance > 0.01 ? '#FEF2F2' : '#F0FDF4',
                    borderColor: liveBalance > 0.01 ? '#FEE2E2' : '#DCFCE7'
                  }}
                >
                  <div>
                    <span className="text-secondary extra-small text-uppercase fw-bold d-block mb-1">Settlement Status</span>
                    <strong className="fs-6 text-dark">
                      Total: {formatCurrency(liveGrandTotal)} &bull; Paid: {formatCurrency(totalPaid)}
                    </strong>
                  </div>
                  <div className="text-end">
                    <span className="text-secondary extra-small d-block mb-1">Balance Due:</span>
                    <strong className={`fs-5 fw-bold ${liveBalance > 0.01 ? 'text-danger' : 'text-success'}`}>
                      {liveBalance > 0.01 ? formatCurrency(liveBalance) : '₹0.00 (Settled)'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="modal-footer bg-light border-top px-4 py-3 d-flex justify-content-between align-items-center">
                <button
                  type="button"
                  className="btn btn-light border fw-semibold px-3.5 py-2 rounded-3 shadow-xs"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={submitting}
                >
                  Review Again
                </button>
                <button
                  type="button"
                  className="btn btn-danger fw-bold px-4 py-2 rounded-3 shadow-sm d-flex align-items-center gap-2"
                  onClick={handleExecuteFinalCheckout}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      Finalizing Checkout...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} /> Confirm &amp; Finalize Checkout
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Receive Payment Modal */}
      <PaymentFormModal
        show={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSubmit={handleRecordPayment}
        stayId={stay.id}
        currentBalance={liveBalance > 0 ? liveBalance : 0}
        customerWalletCredit={stay.primary_customer_detail?.advance_credit || 0}
      />

      {/* Invoice Preview Modal */}
      <InvoicePreviewModal
        show={showInvoice}
        onClose={() => {
          setShowInvoice(false);
          navigate('/current-stays');
        }}
        stayId={stay.id}
      />

      {/* RETURN / REFUND AMOUNT MODAL */}
      {showRefundModal && (
        <div className="modal fade show d-block modal-backdrop-animated" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1060 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-dialog-animated" style={{ maxWidth: '520px' }}>
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden modal-content-animated">
              
              <div className="modal-header bg-warning text-dark py-3 px-4 d-flex align-items-center justify-content-between">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2 m-0" style={{ fontSize: '1.1rem' }}>
                  <RotateCcw size={20} /> Return / Refund Excess Amount
                </h5>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowRefundModal(false)}></button>
              </div>

              <form onSubmit={handleExecuteRefund}>
                <div className="modal-body p-4 bg-white">
                  {refundError && (
                    <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3">
                      <AlertTriangle size={15} className="me-1 inline" /> {refundError}
                    </div>
                  )}

                  {/* Excess Calculation Info Card */}
                  <div className="bg-light p-3 rounded-3 border mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="text-muted small">Guest Name:</span>
                      <strong className="text-dark">{stay.primary_customer_detail?.full_name || 'Guest'}</strong>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="text-muted small">Grand Total Folio:</span>
                      <span className="fw-semibold text-dark">{formatCurrency(liveGrandTotal)}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="text-muted small">Total Paid to Date:</span>
                      <span className="fw-semibold text-success">{formatCurrency(totalPaid)}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                      <span className="text-dark small fw-bold">Remaining Return Amount:</span>
                      <strong className="fs-5 text-danger">{formatCurrency(excessPaid)}</strong>
                    </div>
                  </div>

                  {/* Return Amount Input */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label small fw-semibold text-dark mb-0">Return Amount (₹) *</label>
                      <button
                        type="button"
                        className="btn btn-link p-0 text-danger extra-small text-decoration-none fw-bold"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => setRefundAmount(excessPaid.toFixed(2))}
                      >
                        Set Remaining ({formatCurrency(excessPaid)})
                      </button>
                    </div>
                    <div className="input-group">
                      <span className="input-group-text bg-white text-danger fw-bold">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        className="form-control form-control-lg fw-bold text-danger"
                        required
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <span className="text-muted extra-small mt-1 d-block">
                      This will be recorded as a debit refund transaction in the customer ledger and stay history.
                    </span>
                  </div>

                  {/* Refund Method & Ref */}
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-dark mb-1">Return Method *</label>
                      <select
                        className="form-select"
                        value={refundMethod}
                        onChange={(e) => setRefundMethod(e.target.value)}
                      >
                        <option value="CASH">Cash</option>
                        <option value="UPI">UPI / GPay / PhonePe</option>
                        <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                        <option value="CARD">Card Reversal</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-dark mb-1">Transaction Ref / Voucher #</label>
                      <input
                        type="text"
                        className="form-control"
                        value={refundRef}
                        onChange={(e) => setRefundRef(e.target.value)}
                        placeholder="e.g. UPI Ref / Cash Voucher"
                      />
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-dark mb-1">Return Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={refundDate}
                        onChange={(e) => setRefundDate(e.target.value)}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-dark mb-1">Return Time</label>
                      <input
                        type="time"
                        className="form-control"
                        value={refundTime}
                        onChange={(e) => setRefundTime(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="mb-2">
                    <label className="form-label small fw-semibold text-dark mb-1">Notes / Remarks</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={refundNotes}
                      onChange={(e) => setRefundNotes(e.target.value)}
                      placeholder="e.g. Early departure excess amount return"
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer bg-light border-top px-4 py-3 d-flex justify-content-between align-items-center">
                  <button type="button" className="btn btn-light border fw-semibold px-4" onClick={() => setShowRefundModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-warning fw-bold px-4 shadow-sm text-dark d-flex align-items-center gap-2"
                    disabled={refundSubmitting}
                  >
                    {refundSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        Processing Return...
                      </>
                    ) : (
                      <>
                        <RotateCcw size={16} /> Confirm Return &amp; Debit Transaction
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
