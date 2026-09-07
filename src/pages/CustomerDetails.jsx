import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getCustomerHistoryApi, updateCustomerApi, deleteCustomerApi, recordCustomerPaymentApi, refundCustomerCreditApi } from '../api/customerApi';
import { cancelBookingApi, deleteBookingApi } from '../api/bookingApi';
import StatusBadge from '../components/StatusBadge';
import CameraCaptureModal from '../components/CameraCaptureModal';
import ConfirmModal from '../components/ConfirmModal';
import PageLoader from '../components/PageLoader';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/dateUtils';
import { getMediaUrl } from '../utils/mediaUtils';
import { exportTransactionsToExcel, exportTransactionsToPDF } from '../utils/exportUtils';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { compressImage } from '../utils/imageCompressor';

const CustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.is_superuser;

  const { data: customer = null, isLoading: loading, refetch: loadHistory } = useQuery({
    queryKey: ['customer-details', id],
    queryFn: () => getCustomerHistoryApi(id),
    enabled: !!id,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
  });

  const [photoError, setPhotoError] = useState(false);

  // Selected Reservation Modal for View / Manage
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Record Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('CASH');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [payError, setPayError] = useState('');

  // Return / Refund Amount Modal State
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundMethod, setRefundMethod] = useState('CASH');
  const [refundRef, setRefundRef] = useState('');
  const [refundNotes, setRefundNotes] = useState('Cash refund of advance credit balance');
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [refundError, setRefundError] = useState('');

  // Transaction History Modal State & Date Filters (Collapsed by default)
  const [showTxnModal, setShowTxnModal] = useState(false);
  const [showTxnDateFilter, setShowTxnDateFilter] = useState(false);
  const [txnStartDate, setTxnStartDate] = useState('');
  const [txnEndDate, setTxnEndDate] = useState('');

  const handleSetDatePreset = (preset) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    if (preset === 'today') {
      setTxnStartDate(todayStr);
      setTxnEndDate(todayStr);
    } else if (preset === '7days') {
      const past = new Date();
      past.setDate(past.getDate() - 7);
      setTxnStartDate(past.toISOString().split('T')[0]);
      setTxnEndDate(todayStr);
    } else if (preset === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setTxnStartDate(firstDay.toISOString().split('T')[0]);
      setTxnEndDate(todayStr);
    } else if (preset === 'all') {
      setTxnStartDate('');
      setTxnEndDate('');
    }
  };

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [altMobile, setAltMobile] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('Male');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [idType, setIdType] = useState('Aadhaar');
  const [idNumber, setIdNumber] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [docPreview, setDocPreview] = useState('');
  const [docBackFile, setDocBackFile] = useState(null);
  const [docBackPreview, setDocBackPreview] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [previewModalDoc, setPreviewModalDoc] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete Confirm Modal State
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null,
    loading: false,
  });

  // History Tab Switcher: 'stays' | 'bookings'
  const [activeHistoryTab, setActiveHistoryTab] = useState('stays');

  const formatDisplayTime = (t) => {
    if (!t) return '';
    const parts = String(t).split(':');
    if (parts.length < 2) return t;
    let h = parseInt(parts[0], 10);
    const m = parts[1].padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  };


  const handleCancelBooking = (booking) => {
    setConfirmModal({
      show: true,
      title: 'Cancel Reservation Confirmation',
      message: `Are you sure you want to cancel Reservation #${booking.booking_number} for Room ${booking.room_number}? The assigned room will be made available for other bookings.`,
      confirmText: 'Yes, Cancel Reservation',
      confirmVariant: 'warning',
      loading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, loading: true }));
        try {
          await cancelBookingApi(booking.id);
          setConfirmModal({ show: false, loading: false });
          setSelectedBooking(null);
          showSuccess(`Reservation #${booking.booking_number} cancelled successfully.`, 'Reservation Cancelled');
          queryClient.invalidateQueries({ queryKey: ['customer-details', id] });
          queryClient.invalidateQueries({ queryKey: ['bookings'] });
        } catch (err) {
          setConfirmModal({ show: false, loading: false });
          showError(err.response?.data?.message || err.response?.data?.error || 'Failed to cancel reservation.', 'Cancellation Failed');
        }
      }
    });
  };

  const handleDeleteBooking = (booking) => {
    setConfirmModal({
      show: true,
      title: 'Delete Reservation Record',
      message: `Are you sure you want to permanently DELETE Reservation #${booking.booking_number}? This action cannot be undone.`,
      confirmText: 'Yes, Delete Record',
      confirmVariant: 'danger',
      loading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, loading: true }));
        try {
          await deleteBookingApi(booking.id);
          setConfirmModal({ show: false, loading: false });
          setSelectedBooking(null);
          showSuccess(`Reservation #${booking.booking_number} deleted successfully.`, 'Record Deleted');
          queryClient.invalidateQueries({ queryKey: ['customer-details', id] });
          queryClient.invalidateQueries({ queryKey: ['bookings'] });
        } catch (err) {
          setConfirmModal({ show: false, loading: false });
          showError(err.response?.data?.message || err.response?.data?.error || 'Failed to delete reservation.', 'Deletion Failed');
        }
      }
    });
  };

  const openCustomerDocPreview = (urlOrFile, title) => {
    if (!urlOrFile) return;
    let url = '';
    let isPdf = false;
    if (typeof urlOrFile === 'string') {
      url = urlOrFile;
      isPdf = url.toLowerCase().endsWith('.pdf');
    } else if (urlOrFile instanceof File || urlOrFile instanceof Blob) {
      url = URL.createObjectURL(urlOrFile);
      isPdf = urlOrFile.type === 'application/pdf';
    }
    setPreviewModalDoc({ show: true, url, title, isPdf });
  };

  const handleDocChange = (file) => {
    if (!file) return;
    setDocFile(file);
    if (file.type.startsWith('image/')) {
      setDocPreview(URL.createObjectURL(file));
    } else {
      setDocPreview(URL.createObjectURL(file));
    }
  };

  const handleDocBackChange = (file) => {
    if (!file) return;
    setDocBackFile(file);
    if (file.type.startsWith('image/')) {
      setDocBackPreview(URL.createObjectURL(file));
    } else {
      setDocBackPreview(URL.createObjectURL(file));
    }
  };

  const handleOpenEdit = () => {
    if (!customer) return;
    setFormError('');
    setFirstName(customer.first_name || '');
    setMiddleName(customer.middle_name || '');
    setLastName(customer.last_name || '');
    setMobile(customer.mobile || '');
    setAltMobile(customer.alternate_mobile || '');
    setEmail(customer.email || '');
    setGender(customer.gender || 'Male');
    setAddress(customer.address || '');
    setCity(customer.city || '');
    setState(customer.state || '');
    setIdType(customer.id_type || 'Aadhaar');
    setIdNumber(customer.id_number || '');
    setPhotoFile(null);
    setPhotoPreview(customer.photo || '');
    setDocFile(null);
    setDocPreview(customer.id_document || '');
    setDocBackFile(null);
    setDocBackPreview(customer.id_document_back || '');
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!firstName || !mobile) {
      setFormError('First name and mobile number are required.');
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('first_name', firstName);
    if (middleName) formData.append('middle_name', middleName);
    if (lastName) formData.append('last_name', lastName);
    formData.append('mobile', mobile);
    if (altMobile) formData.append('alternate_mobile', altMobile);
    if (email) formData.append('email', email);
    formData.append('gender', gender);
    if (address) formData.append('address', address);
    if (city) formData.append('city', city);
    if (state) formData.append('state', state);
    formData.append('id_type', idType);
    if (idNumber) formData.append('id_number', idNumber);

    try {
      // Compress photos/documents for fast upload
      if (photoFile) {
        const compressedPhoto = await compressImage(photoFile);
        formData.append('photo', compressedPhoto);
      }
      if (docFile) {
        const compressedDoc = await compressImage(docFile);
        formData.append('id_document', compressedDoc);
      }
      if (docBackFile) {
        const compressedDocBack = await compressImage(docBackFile);
        formData.append('id_document_back', compressedDocBack);
      }

      const updatedCustomer = await updateCustomerApi(customer.id, formData);
      setShowEditModal(false);
      showSuccess(`Customer profile updated successfully.`, 'Profile Updated');

      // Direct cache updates for instant refresh without re-download
      queryClient.setQueryData(['customer-details', id], (old) => (old ? { ...old, ...updatedCustomer } : updatedCustomer));
      queryClient.setQueriesData({ queryKey: ['customers'] }, (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((c) => (c.id === updatedCustomer.id ? { ...c, ...updatedCustomer } : c));
      });
      queryClient.invalidateQueries({ queryKey: ['customer-details', id], refetchType: 'none' });
      queryClient.invalidateQueries({ queryKey: ['customers'], refetchType: 'none' });
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.first_name?.[0] || err.response?.data?.mobile?.[0] || err.response?.data?.error || err.response?.data?.detail || 'Error saving customer profile.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCustomer = () => {
    if (!customer) return;
    setConfirmModal({
      show: true,
      title: 'Delete Customer Profile',
      message: `Are you sure you want to permanently delete customer "${customer.full_name}" (${customer.mobile})? All associated records will be removed.`,
      loading: false,
      onConfirm: async () => {
        // Optimistic delete: Close modal and navigate immediately in 0.0s
        setConfirmModal({ show: false });
        queryClient.setQueriesData({ queryKey: ['customers'] }, (old) => {
          if (!Array.isArray(old)) return old;
          return old.filter((c) => c.id !== customer.id);
        });
        showSuccess(`Customer profile '${customer.full_name}' deleted successfully.`, 'Customer Deleted');
        navigate('/customers');

        try {
          await deleteCustomerApi(customer.id);
          queryClient.invalidateQueries({ queryKey: ['customers'], refetchType: 'none' });
        } catch (err) {
          showError(err.response?.data?.error || 'Error deleting customer record.', 'Deletion Failed');
          queryClient.invalidateQueries({ queryKey: ['customers'] });
        }
      },
    });
  };

  const pendingStays = customer?.stays?.filter((s) => parseFloat(s.balance || 0) > 0) || [];
  const totalPendingBalance = pendingStays.reduce((sum, s) => sum + parseFloat(s.balance || 0), 0);
  const pendingStaysCount = pendingStays.length;

  const totalWalletCredit = (customer?.overall_account_status?.advance_credit !== undefined)
    ? parseFloat(customer.overall_account_status.advance_credit)
    : (parseFloat(customer?.advance_credit || 0) + (customer?.stays ? customer.stays.reduce((acc, s) => acc + (s.credit_balance || (s.raw_balance < 0 ? Math.abs(s.raw_balance) : 0)), 0) : 0));

  const handleOpenRecordPayment = () => {
    setPayError('');
    setPayAmount(totalPendingBalance > 0 ? totalPendingBalance.toFixed(2) : '');
    setPayMethod('CASH');
    setPayRef('');
    setPayNotes('Lump-sum balance settlement');
    setShowPaymentModal(true);
  };

  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    setPayError('');

    const numericAmount = parseFloat(payAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setPayError('Please enter a valid payment amount greater than 0.');
      return;
    }

    setPaySubmitting(true);
    try {
      const res = await recordCustomerPaymentApi(customer.id, {
        amount: numericAmount,
        payment_method: payMethod,
        transaction_reference: payRef,
        notes: payNotes
      });
      setShowPaymentModal(false);
      showSuccess(
        res.message || `Payment of ${formatCurrency(numericAmount)} recorded successfully!`,
        'Payment Recorded'
      );
      queryClient.invalidateQueries({ queryKey: ['customer-details', id] });
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.response?.data?.error || err.response?.data?.detail || 'Failed to record customer payment.';
      setPayError(errMsg);
    } finally {
      setPaySubmitting(false);
    }
  };

  const handleOpenRefundModal = () => {
    setRefundError('');
    setRefundAmount(totalWalletCredit > 0 ? totalWalletCredit.toFixed(2) : '');
    setRefundMethod('CASH');
    setRefundRef('');
    setRefundNotes('Cash refund of advance credit balance');
    setShowRefundModal(true);
  };

  const handleRefundSubmit = async (e) => {
    e.preventDefault();
    setRefundError('');

    const numericAmount = parseFloat(refundAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setRefundError('Please enter a valid refund amount greater than 0.');
      return;
    }
    if (numericAmount > totalWalletCredit + 0.001) {
      setRefundError(`Refund amount cannot exceed available wallet credit of ${formatCurrency(totalWalletCredit)}.`);
      return;
    }

    setRefundSubmitting(true);
    try {
      const res = await refundCustomerCreditApi(customer.id, {
        amount: numericAmount,
        payment_method: refundMethod,
        transaction_reference: refundRef,
        notes: refundNotes
      });
      setShowRefundModal(false);
      showSuccess(
        res.message || `Successfully returned ${formatCurrency(numericAmount)} to guest!`,
        'Refund Processed'
      );
      queryClient.invalidateQueries({ queryKey: ['customer-details', id] });
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to process refund.';
      setRefundError(errMsg);
    } finally {
      setRefundSubmitting(false);
    }
  };

  if (loading) {
    return <PageLoader fullScreen={false} message="Loading Customer Profile & Stay History..." />;
  }

  if (!customer) {
    return <div className="alert alert-danger">Customer record not found.</div>;
  }

  return (
    <div className="container-fluid p-0">
      {/* Page Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h3 className="fw-bold text-dark m-0">
            <i className="bi bi-person-lines-fill text-primary me-2"></i>Customer Profile & History
          </h3>
          <span className="text-muted small">Guest details, statutory ID proof documents, and stay records</span>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          {/* Transaction History Button */}
          <button className="btn btn-outline-dark fw-bold d-flex align-items-center gap-1.5 shadow-sm" onClick={() => setShowTxnModal(true)}>
            <i className="bi bi-clock-history me-1 text-primary"></i> Transaction History
            {customer.transactions?.length > 0 && (
              <span className="badge bg-primary text-white ms-1">{customer.transactions.length}</span>
            )}
          </button>

          {/* Edit Customer Button */}
          <button className="btn btn-outline-primary fw-bold" onClick={handleOpenEdit}>
            <i className="bi bi-pencil-square me-1"></i> Edit Profile
          </button>

          {/* Delete Customer Button (Admin Only) */}
          {isAdmin && (
            <button className="btn btn-outline-danger fw-bold" onClick={handleDeleteCustomer}>
              <i className="bi bi-trash me-1"></i> Delete Record
            </button>
          )}

          <Link to="/customers" className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left me-1"></i> Back to Directory
          </Link>
        </div>
      </div>

      {/* OVERALL ACCOUNT BALANCE STATUS BANNER */}
      {totalPendingBalance > 0 && totalWalletCredit > 0 ? (
        <div className="alert alert-warning border-warning p-3.5 rounded-3 mb-4 shadow-sm">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-3">
              <div className="p-2.5 bg-warning text-dark rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                <i className="bi bi-wallet2 fs-4"></i>
              </div>
              <div>
                <div className="extra-small fw-bold text-uppercase text-warning-emphasis tracking-wider mb-1">Customer Account Balance Summary</div>
                <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                  <span className="badge bg-danger fs-6 px-3 py-1.5">
                    <i className="bi bi-exclamation-triangle-fill me-1"></i> Pending Due: {formatCurrency(totalPendingBalance)}
                  </span>
                  <span className="badge bg-success fs-6 px-3 py-1.5">
                    <i className="bi bi-wallet-fill me-1"></i> Total Wallet Credit: {formatCurrency(totalWalletCredit)}
                  </span>
                  <span className="badge bg-dark fs-6 px-3 py-1.5">
                    Net Balance: {formatCurrency(Math.abs(totalPendingBalance - totalWalletCredit))} {totalPendingBalance >= totalWalletCredit ? 'Due' : 'Credit'}
                  </span>
                </div>
                <span className="small text-secondary">
                  Guest has pending stay dues of <strong>{formatCurrency(totalPendingBalance)}</strong> AND total advance credit of <strong>{formatCurrency(totalWalletCredit)}</strong>.
                </span>
              </div>
            </div>
            <div className="d-flex flex-wrap gap-2">
              <button
                className="btn btn-success fw-bold shadow-sm px-3 py-2 d-flex align-items-center gap-1.5"
                onClick={() => {
                  setPayError('');
                  setPayMethod('WALLET');
                  setPayAmount(Math.min(totalWalletCredit, totalPendingBalance).toString());
                  setPayRef('CUSTOMER_WALLET_CREDIT');
                  setPayNotes('Paid using Guest Advance Credit Wallet');
                  setShowPaymentModal(true);
                }}
              >
                <i className="bi bi-check-circle-fill"></i> Apply Wallet Credit ({formatCurrency(Math.min(totalWalletCredit, totalPendingBalance))})
              </button>
              <button className="btn btn-outline-danger fw-bold shadow-sm px-3 py-2 d-flex align-items-center gap-1.5" onClick={handleOpenRefundModal}>
                <i className="bi bi-arrow-counterclockwise"></i> Return Amount
              </button>
              <button className="btn btn-outline-primary fw-bold shadow-sm px-3 py-2" onClick={handleOpenRecordPayment}>
                <i className="bi bi-cash-stack me-1"></i> Record Payment
              </button>
            </div>
          </div>
        </div>
      ) : totalPendingBalance > 0 ? (
        <div className="alert alert-danger border-danger p-3 rounded-3 d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 shadow-sm">
          <div className="d-flex align-items-center gap-3">
            <div className="p-2.5 bg-danger text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '44px', height: '44px' }}>
              <i className="bi bi-exclamation-triangle-fill fs-4"></i>
            </div>
            <div>
              <div className="extra-small fw-bold text-uppercase text-danger-emphasis tracking-wider">Overall Account Balance</div>
              <h5 className="fw-bold text-danger m-0">
                {formatCurrency(totalPendingBalance)} <span className="badge bg-danger text-white fs-6 ms-2">Pending Due</span>
              </h5>
              <span className="small text-secondary">
                Guest has a combined pending balance across {pendingStaysCount} stay(s). Click to record payment settlement.
              </span>
            </div>
          </div>
          <button className="btn btn-danger fw-bold shadow-sm px-4 py-2" onClick={handleOpenRecordPayment}>
            <i className="bi bi-cash-stack me-1.5"></i> Settle Pending Balance ({formatCurrency(totalPendingBalance)})
          </button>
        </div>
      ) : totalWalletCredit > 0 ? (
        <div className="alert alert-success border-success p-3 rounded-3 d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 shadow-sm">
          <div className="d-flex align-items-center gap-3">
            <div className="p-2.5 bg-success text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '44px', height: '44px' }}>
              <i className="bi bi-wallet-fill fs-4"></i>
            </div>
            <div>
              <div className="extra-small fw-bold text-uppercase text-success-emphasis tracking-wider">Overall Account Balance</div>
              <h5 className="fw-bold text-success m-0">
                {formatCurrency(totalWalletCredit)} <span className="badge bg-success text-white fs-6 ms-2"><i className="bi bi-check-circle-fill me-1"></i>Advance Credit Wallet</span>
              </h5>
              <span className="small text-secondary">
                Guest has <strong>{formatCurrency(totalWalletCredit)}</strong> advance credit. This credit will be automatically applied as an advance payment on their next check-in!
              </span>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-outline-danger fw-bold shadow-sm px-3 py-2 d-flex align-items-center gap-1.5" onClick={handleOpenRefundModal}>
              <i className="bi bi-arrow-counterclockwise"></i> Return Amount
            </button>
            <button className="btn btn-outline-success fw-bold shadow-sm px-3 py-2 d-flex align-items-center gap-1.5" onClick={handleOpenRecordPayment}>
              <i className="bi bi-plus-circle"></i> Add Advance Credit
            </button>
          </div>
        </div>
      ) : (
        <div className="alert alert-light border p-3 rounded-3 d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 shadow-sm">
          <div className="d-flex align-items-center gap-3">
            <div className="p-2.5 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '44px', height: '44px' }}>
              <i className="bi bi-shield-check fs-4"></i>
            </div>
            <div>
              <div className="extra-small fw-bold text-uppercase text-muted tracking-wider">Overall Account Balance</div>
              <h5 className="fw-bold text-dark m-0">
                ₹0.00 <span className="badge bg-secondary text-white fs-6 ms-2">Fully Settled</span>
              </h5>
              <span className="small text-muted">
                No pending dues or advance credit balance recorded for this guest.
              </span>
            </div>
          </div>
          <button className="btn btn-outline-primary fw-bold shadow-sm px-3 py-2" onClick={handleOpenRecordPayment}>
            <i className="bi bi-plus-circle me-1"></i> Record Payment / Advance Credit
          </button>
        </div>
      )}

      <div className="row g-4 mb-4">
        {/* Customer Info Sidebar Card */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm text-center p-4 rounded-3">
            <div className="position-relative d-inline-block mx-auto mb-3">
              {customer.photo && !photoError ? (
                <img
                  src={getMediaUrl(customer.photo)}
                  alt={customer.full_name}
                  onError={() => setPhotoError(true)}
                  className="rounded-circle border border-3 border-primary shadow"
                  style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                />
              ) : (
                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold fs-1 mx-auto shadow" style={{ width: '120px', height: '120px' }}>
                  {customer.first_name ? customer.first_name[0].toUpperCase() : 'G'}
                </div>
              )}
            </div>

            <h4 className="fw-bold m-0 text-dark">{customer.full_name}</h4>
            <div className="text-primary fw-semibold mt-1">
              <i className="bi bi-telephone me-1"></i>{customer.mobile}
            </div>
            {customer.alternate_mobile && (
              <div className="text-muted small">Alt: {customer.alternate_mobile}</div>
            )}
            {customer.email && <div className="text-muted small">{customer.email}</div>}

            {/* In-House vs Checked Out Status Pill */}
            <div className="mt-2.5 mb-1">
              {customer.is_checked_in ? (
                <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-1.5 rounded-pill fw-bold" style={{ fontSize: '0.785rem' }}>
                  <i className="bi bi-door-open-fill me-1"></i> Currently In-House (Room {customer.active_stay?.room_number || 'N/A'})
                </span>
              ) : (
                <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-1.5 rounded-pill fw-bold" style={{ fontSize: '0.785rem' }}>
                  <i className="bi bi-check-circle-fill me-1"></i> Checked Out / Not In-House
                </span>
              )}
            </div>

            <hr className="my-3" />

            <div className="text-start small">
              <div className="mb-2"><strong>ID Proof Type:</strong> <span className="badge bg-light text-dark border ms-1">{customer.id_type}</span></div>
              <div className="mb-2"><strong>ID Proof Number:</strong> <span className="fw-bold text-dark">{customer.id_number || 'Not provided'}</span></div>
              <div className="mb-2"><strong>Gender:</strong> {customer.gender}</div>
              <div className="mb-2"><strong>Address:</strong> {customer.address || 'N/A'}{customer.city ? `, ${customer.city}` : ''} {customer.state ? `, ${customer.state}` : ''}</div>
            </div>

            {customer.id_document && (
              <div className="mt-3">
                <a href={getMediaUrl(customer.id_document)} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary w-100 fw-bold">
                  <i className="bi bi-file-earmark-medical me-1"></i> View Uploaded ID Document
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Previous Stays & Reservation Records Card */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden" style={{ border: '1px solid rgba(226, 232, 240, 0.85)' }}>
            <div className="card-header bg-white py-3 px-3.5 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-3">
              <div className="btn-group btn-group-sm p-1 rounded-3 border" style={{ backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' }}>
                <button
                  type="button"
                  className={`btn btn-sm px-3.5 py-1.5 fw-bold rounded-2 transition-all d-flex align-items-center gap-2 ${
                    activeHistoryTab === 'stays' ? 'bg-white text-dark shadow-xs' : 'text-secondary border-0 bg-transparent'
                  }`}
                  onClick={() => setActiveHistoryTab('stays')}
                >
                  <i className="bi bi-clock-history text-primary"></i>
                  <span>Stay History</span>
                  <span
                    className={`badge rounded-pill ${
                      activeHistoryTab === 'stays' ? 'bg-primary text-white' : 'bg-secondary-subtle text-secondary'
                    }`}
                    style={{ fontSize: '0.7rem' }}
                  >
                    {customer.stays?.length || 0}
                  </span>
                </button>
                <button
                  type="button"
                  className={`btn btn-sm px-3.5 py-1.5 fw-bold rounded-2 transition-all d-flex align-items-center gap-2 ${
                    activeHistoryTab === 'bookings' ? 'bg-white text-dark shadow-xs' : 'text-secondary border-0 bg-transparent'
                  }`}
                  onClick={() => setActiveHistoryTab('bookings')}
                >
                  <i className="bi bi-calendar-check text-primary"></i>
                  <span>Reservation Records</span>
                  <span
                    className={`badge rounded-pill ${
                      activeHistoryTab === 'bookings' ? 'bg-primary text-white' : 'bg-secondary-subtle text-secondary'
                    }`}
                    style={{ fontSize: '0.7rem' }}
                  >
                    {customer.bookings?.length || 0}
                  </span>
                </button>
              </div>

              {activeHistoryTab === 'bookings' ? (
                <Link
                  to={`/bookings/create?customer_id=${customer.id}&name=${encodeURIComponent(customer.full_name || '')}&mobile=${encodeURIComponent(customer.mobile || '')}`}
                  className="btn btn-sm btn-primary fw-semibold px-3 py-1.5 rounded-3 d-flex align-items-center gap-1.5 shadow-xs"
                  style={{ backgroundColor: '#2563EB', borderColor: '#2563EB', fontSize: '0.825rem' }}
                >
                  <i className="bi bi-calendar-plus"></i> New Reservation
                </Link>
              ) : (
                <Link
                  to={`/check-in?customer_id=${customer.id}`}
                  className="btn btn-sm btn-outline-primary fw-semibold px-3 py-1.5 rounded-3 d-flex align-items-center gap-1.5 shadow-xs"
                  style={{ fontSize: '0.825rem' }}
                >
                  <i className="bi bi-person-check-fill"></i> New Check-In
                </Link>
              )}
            </div>

            <div className="card-body p-0">
              {activeHistoryTab === 'stays' ? (
                <div className="table-responsive" style={{ maxHeight: '560px' }}>
                  <table className="table table-hover align-middle m-0" style={{ minWidth: '780px' }}>
                    <thead className="table-light border-bottom text-secondary" style={{ backgroundColor: '#F8FAFC', fontSize: '0.725rem', letterSpacing: '0.04em' }}>
                      <tr className="text-uppercase fw-bold">
                        <th className="ps-4 py-3 text-nowrap">Stay #</th>
                        <th className="py-3 text-nowrap">Room</th>
                        <th className="py-3 text-nowrap">Check-In</th>
                        <th className="py-3 text-nowrap">Check-Out</th>
                        <th className="py-3 text-nowrap">Grand Total</th>
                        <th className="py-3 text-nowrap">Paid</th>
                        <th className="py-3 text-nowrap">Balance</th>
                        <th className="py-3 text-nowrap">Status</th>
                        <th className="pe-4 py-3 text-end text-nowrap">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customer.stays?.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="text-center text-muted py-5">
                            <div className="py-3">
                              <i className="bi bi-inbox fs-2 text-secondary opacity-50 d-block mb-2"></i>
                              No previous stay records found for this guest.
                            </div>
                          </td>
                        </tr>
                      ) : (
                        customer.stays?.map((s) => (
                          <tr
                            key={s.id}
                            onClick={() => navigate(`/stays/${s.id}`)}
                            className="transition-all"
                            style={{ cursor: 'pointer' }}
                            title="Click to view stay details"
                          >
                            <td className="ps-4 fw-bold text-dark text-nowrap font-monospace" style={{ fontSize: '0.85rem' }}>
                              <span className="text-primary text-decoration-underline hover-underline me-1">{s.stay_number}</span>
                              <i className="bi bi-box-arrow-up-right text-muted extra-small" style={{ fontSize: '0.7rem' }}></i>
                            </td>
                            <td className="text-nowrap">
                              <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2.5 py-1 fw-bold">
                                Room {s.room_number}
                              </span>
                            </td>
                            <td className="text-nowrap">
                              <div className="fw-semibold text-dark small">{formatDate(s.check_in_date)}</div>
                            </td>
                            <td className="text-nowrap">
                              {s.status === 'CHECKED_IN' ? (
                                <div>
                                  <div className="fw-semibold text-warning-emphasis small d-flex align-items-center gap-1">
                                    <i className="bi bi-clock-history"></i>
                                    <span>Exp: {formatDate(s.expected_checkout_date || s.checkout_date)}</span>
                                  </div>
                                  <span className="text-muted extra-small">In-House</span>
                                </div>
                              ) : (
                                <div>
                                  <div className="fw-semibold text-dark small d-flex align-items-center gap-1">
                                    <i className="bi bi-check2-circle text-success"></i>
                                    <span>{formatDate(s.actual_checkout_date || s.checkout_date)}</span>
                                  </div>
                                  <span className="text-muted extra-small">Departed</span>
                                </div>
                              )}
                            </td>
                            <td className="fw-semibold text-dark text-nowrap">{formatCurrency(s.grand_total)}</td>
                            <td className="text-success fw-semibold text-nowrap">{formatCurrency(s.total_paid)}</td>
                            <td className="text-nowrap">
                              {s.balance > 0 ? (
                                <span className="fw-bold text-danger">{formatCurrency(s.balance)}</span>
                              ) : (s.credit_balance > 0 || s.raw_balance < 0) ? (
                                <div className="d-flex align-items-center gap-1.5">
                                  <span className="fw-bold text-success">{formatCurrency(0)}</span>
                                  <span className="badge bg-success-subtle text-success border border-success extra-small fw-bold">
                                    +{formatCurrency(s.credit_balance || Math.abs(s.raw_balance))} Credit
                                  </span>
                                </div>
                              ) : (
                                <span className="fw-semibold text-success">{formatCurrency(0)}</span>
                              )}
                            </td>
                            <td className="text-nowrap">
                              <StatusBadge status={s.status} />
                            </td>
                            <td className="pe-4 text-end text-nowrap" onClick={(e) => e.stopPropagation()}>
                              <div className="btn-group btn-group-sm">
                                <Link
                                  to={`/stays/${s.id}`}
                                  className="btn btn-sm btn-outline-secondary px-2.5 py-1"
                                  title="View Full Stay Details"
                                >
                                  <i className="bi bi-eye me-1"></i>View
                                </Link>
                                {s.status === 'CHECKED_IN' && (
                                  <Link
                                    to={`/checkout/${s.id}`}
                                    className="btn btn-sm btn-danger fw-bold px-2.5 py-1 shadow-xs"
                                    title="Process Stay Check-Out"
                                  >
                                    <i className="bi bi-box-arrow-right me-1"></i>Check Out
                                  </Link>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="table-responsive" style={{ maxHeight: '560px' }}>
                  <table className="table table-hover align-middle m-0" style={{ minWidth: '750px' }}>
                    <thead className="table-light border-bottom text-secondary" style={{ backgroundColor: '#F8FAFC', fontSize: '0.725rem', letterSpacing: '0.04em' }}>
                      <tr className="text-uppercase fw-bold">
                        <th className="ps-4 py-3 text-nowrap">Booking #</th>
                        <th className="py-3 text-nowrap">Room & Category</th>
                        <th className="py-3 text-nowrap">Check-In</th>
                        <th className="py-3 text-nowrap">Exp. Check-Out</th>
                        <th className="py-3 text-nowrap">Room Rate</th>
                        <th className="py-3 text-nowrap">Advance Paid</th>
                        <th className="pe-4 py-3 text-nowrap">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!customer.bookings || customer.bookings.length === 0) ? (
                        <tr>
                          <td colSpan="7" className="text-center text-muted py-5">
                            <div className="py-3">
                              <i className="bi bi-calendar-x fs-2 text-secondary opacity-50 d-block mb-2"></i>
                              No advance reservation records found for this guest.
                            </div>
                          </td>
                        </tr>
                      ) : (
                        customer.bookings.map((b) => (
                          <tr
                            key={b.id}
                            onClick={() => setSelectedBooking(b)}
                            className="transition-all"
                            style={{ cursor: 'pointer' }}
                            title="Click to view and manage reservation"
                          >
                            <td className="ps-4 fw-bold text-dark text-nowrap font-monospace" style={{ fontSize: '0.85rem' }}>
                              <span className="text-primary text-decoration-underline hover-underline me-1">#{b.booking_number}</span>
                              <i className="bi bi-sliders text-muted extra-small" style={{ fontSize: '0.75rem' }}></i>
                            </td>
                            <td className="text-nowrap">
                              <div className="d-flex align-items-center gap-2">
                                <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle fw-bold rounded-pill px-2.5 py-1">
                                  Room {b.room_number}
                                </span>
                                <span className="text-secondary small fw-medium">{b.room_type}</span>
                              </div>
                            </td>
                            <td className="text-nowrap">
                              <div className="fw-semibold text-dark small">{formatDate(b.check_in_date)}</div>
                              <div className="text-muted extra-small">{formatDisplayTime(b.check_in_time)}</div>
                            </td>
                            <td className="text-nowrap">
                              <div className="fw-semibold text-dark small">{formatDate(b.expected_checkout_date)}</div>
                              <div className="text-muted extra-small">{formatDisplayTime(b.expected_checkout_time)}</div>
                            </td>
                            <td className="fw-semibold text-dark text-nowrap">
                              {formatCurrency(b.room_rate)}
                              <span className="text-muted extra-small fw-normal ms-1">/night</span>
                            </td>
                            <td className="text-nowrap">
                              {b.advance_amount > 0 ? (
                                <span className="text-success fw-bold">{formatCurrency(b.advance_amount)}</span>
                              ) : (
                                <span className="text-muted small">₹0.00</span>
                              )}
                            </td>
                            <td className="pe-4 text-nowrap">
                              <StatusBadge status={b.status} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* EDIT CUSTOMER MODAL */}
      {showEditModal && (
        <div className="modal fade show d-block tab-modal-backdrop" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header bg-primary text-white p-3">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-pencil-square me-2"></i>Edit Customer Profile — {customer.full_name}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowEditModal(false)}></button>
              </div>

              <form onSubmit={handleSaveEdit}>
                <div className="modal-body p-4">
                  {formError && (
                    <div className="alert alert-danger d-flex align-items-center mb-3">
                      <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                      <div>{formError}</div>
                    </div>
                  )}

                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">First Name *</label>
                      <input type="text" className="form-control" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">Middle Name</label>
                      <input type="text" className="form-control" value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">Last Name</label>
                      <input type="text" className="form-control" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">Mobile Number *</label>
                      <input type="text" className="form-control fw-bold" required value={mobile} onChange={(e) => setMobile(e.target.value)} />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">Alternate Mobile</label>
                      <input type="text" className="form-control" value={altMobile} onChange={(e) => setAltMobile(e.target.value)} />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">Email Address</label>
                      <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">Gender</label>
                      <select className="form-select" value={gender} onChange={(e) => setGender(e.target.value)}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted">Residential Address</label>
                      <textarea className="form-control" rows="2" value={address} onChange={(e) => setAddress(e.target.value)}></textarea>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">City</label>
                      <input type="text" className="form-control" value={city} onChange={(e) => setCity(e.target.value)} />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">State</label>
                      <input type="text" className="form-control" value={state} onChange={(e) => setState(e.target.value)} />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">ID Proof Type *</label>
                      <select className="form-select" value={idType} onChange={(e) => setIdType(e.target.value)}>
                        <option value="Aadhaar">Aadhaar</option>
                        <option value="PAN">PAN</option>
                        <option value="Passport">Passport</option>
                        <option value="Driving Licence">Driving Licence</option>
                        <option value="Voter ID">Voter ID</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">ID Proof Number</label>
                      <input type="text" className="form-control" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
                    </div>

                    {/* Camera Capture / Photo Upload */}
                    <div className="col-md-12">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="form-label small fw-bold text-dark m-0">Customer Photo</label>
                        {(photoFile || photoPreview) && (
                          <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2.5 py-0.5 extra-small fw-bold d-inline-flex align-items-center gap-1">
                            <i className="bi bi-check-circle-fill"></i> {photoFile ? 'New Photo Attached' : '✓ Photo Verified'}
                          </span>
                        )}
                      </div>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <button type="button" className="btn btn-outline-primary btn-sm fw-bold" onClick={() => setShowCamera(true)}>
                          <i className="bi bi-camera me-1"></i> Open Webcam
                        </button>
                        <label className="btn btn-light border btn-sm fw-semibold m-0 cursor-pointer d-inline-flex align-items-center gap-1">
                          <i className="bi bi-upload"></i> Upload File
                          <input
                            type="file"
                            accept="image/*"
                            className="d-none"
                            onChange={(e) => {
                              if (e.target.files[0]) {
                                setPhotoFile(e.target.files[0]);
                                setPhotoPreview(URL.createObjectURL(e.target.files[0]));
                              }
                            }}
                          />
                        </label>
                        {(photoFile || photoPreview) && (
                          <div className="d-flex align-items-center gap-2 bg-light p-1 rounded-3 border ms-auto">
                            <img
                              src={photoPreview}
                              alt="Preview"
                              className="rounded-circle object-fit-cover cursor-pointer border"
                              style={{ height: '40px', width: '40px' }}
                              onClick={() => openCustomerDocPreview(photoFile || photoPreview, 'Customer Photo')}
                            />
                            <button
                              type="button"
                              className="btn btn-xs btn-outline-primary py-0.5 px-2 extra-small fw-semibold rounded-2 d-inline-flex align-items-center gap-1"
                              onClick={() => openCustomerDocPreview(photoFile || photoPreview, 'Customer Photo')}
                            >
                              <i className="bi bi-eye"></i> Preview
                            </button>
                            <button
                              type="button"
                              className="btn btn-xs btn-light border text-danger py-0.5 px-1.5 extra-small rounded-2"
                              onClick={() => { setPhotoFile(null); setPhotoPreview(''); }}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ID Document Front Side */}
                    <div className="col-md-6">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="form-label small fw-bold text-dark m-0">ID Document (Front Side)</label>
                        {(docFile || docPreview) && (
                          <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2 py-0.5 extra-small fw-bold d-inline-flex align-items-center gap-1">
                            <i className="bi bi-check-circle-fill"></i> {docFile ? 'New' : '✓ Verified'}
                          </span>
                        )}
                      </div>

                      {docFile || docPreview ? (
                        <div className="p-2 bg-light rounded-3 border border-success-subtle">
                          <div className="d-flex align-items-center justify-content-between gap-2">
                            <div className="d-flex align-items-center gap-2 overflow-hidden text-start">
                              {((docFile && docFile.type && docFile.type.startsWith('image/')) || (typeof docPreview === 'string' && (docPreview.startsWith('blob:') || docPreview.match(/\.(jpeg|jpg|png|webp|gif)/i)))) ? (
                                <img
                                  src={docPreview}
                                  alt="Front ID"
                                  className="rounded border object-fit-cover flex-shrink-0 cursor-pointer"
                                  style={{ width: '48px', height: '36px' }}
                                  onClick={() => openCustomerDocPreview(docFile || docPreview, 'Front ID Document')}
                                />
                              ) : (
                                <div className="bg-white text-danger p-1 rounded border d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '40px', height: '36px' }}>
                                  <i className="bi bi-file-earmark-pdf-fill fs-5"></i>
                                </div>
                              )}
                              <div className="overflow-hidden">
                                <div className="text-truncate extra-small fw-bold text-dark" style={{ maxWidth: '120px' }}>
                                  {docFile ? docFile.name : (docPreview.split('/').pop() || 'Front_ID_Document')}
                                </div>
                                <div className="text-muted extra-small" style={{ fontSize: '0.675rem' }}>
                                  {docFile ? `New File` : 'On File'}
                                </div>
                              </div>
                            </div>

                            <div className="d-flex align-items-center gap-1 flex-shrink-0">
                              <button
                                type="button"
                                className="btn btn-xs btn-outline-primary py-0.5 px-2 extra-small fw-semibold rounded-2"
                                onClick={() => openCustomerDocPreview(docFile || docPreview, 'Front ID Document')}
                                title="Preview Document"
                              >
                                <i className="bi bi-eye"></i> View
                              </button>
                              <label
                                className="btn btn-xs btn-light border py-0.5 px-1.5 extra-small fw-semibold rounded-2 m-0 cursor-pointer"
                                title="Replace Document"
                              >
                                <i className="bi bi-arrow-repeat"></i>
                                <input
                                  type="file"
                                  accept="image/*,application/pdf"
                                  className="d-none"
                                  onChange={(e) => {
                                    if (e.target.files[0]) handleDocChange(e.target.files[0]);
                                  }}
                                />
                              </label>
                              <button
                                type="button"
                                className="btn btn-xs btn-light border text-danger py-0.5 px-1.5 extra-small rounded-2"
                                onClick={() => { setDocFile(null); setDocPreview(''); }}
                                title="Remove Document"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="border border-dashed p-2.5 rounded-3 text-center bg-light position-relative hover-bg-white transition-all">
                          <i className="bi bi-cloud-arrow-up text-primary fs-5 d-block mb-0.5"></i>
                          <div className="extra-small fw-semibold text-dark">Upload ID Front</div>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="opacity-0 position-absolute start-0 top-0 w-100 h-100 cursor-pointer"
                            onChange={(e) => {
                              if (e.target.files[0]) handleDocChange(e.target.files[0]);
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* ID Document Back Side */}
                    <div className="col-md-6">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="form-label small fw-bold text-dark m-0">ID Document (Back Side)</label>
                        {(docBackFile || docBackPreview) && (
                          <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2 py-0.5 extra-small fw-bold d-inline-flex align-items-center gap-1">
                            <i className="bi bi-check-circle-fill"></i> {docBackFile ? 'New' : '✓ Verified'}
                          </span>
                        )}
                      </div>

                      {docBackFile || docBackPreview ? (
                        <div className="p-2 bg-light rounded-3 border border-success-subtle">
                          <div className="d-flex align-items-center justify-content-between gap-2">
                            <div className="d-flex align-items-center gap-2 overflow-hidden text-start">
                              {((docBackFile && docBackFile.type && docBackFile.type.startsWith('image/')) || (typeof docBackPreview === 'string' && (docBackPreview.startsWith('blob:') || docBackPreview.match(/\.(jpeg|jpg|png|webp|gif)/i)))) ? (
                                <img
                                  src={docBackPreview}
                                  alt="Back ID"
                                  className="rounded border object-fit-cover flex-shrink-0 cursor-pointer"
                                  style={{ width: '48px', height: '36px' }}
                                  onClick={() => openCustomerDocPreview(docBackFile || docBackPreview, 'Back ID Document')}
                                />
                              ) : (
                                <div className="bg-white text-danger p-1 rounded border d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '40px', height: '36px' }}>
                                  <i className="bi bi-file-earmark-pdf-fill fs-5"></i>
                                </div>
                              )}
                              <div className="overflow-hidden">
                                <div className="text-truncate extra-small fw-bold text-dark" style={{ maxWidth: '120px' }}>
                                  {docBackFile ? docBackFile.name : (docBackPreview.split('/').pop() || 'Back_ID_Document')}
                                </div>
                                <div className="text-muted extra-small" style={{ fontSize: '0.675rem' }}>
                                  {docBackFile ? `New File` : 'On File'}
                                </div>
                              </div>
                            </div>

                            <div className="d-flex align-items-center gap-1 flex-shrink-0">
                              <button
                                type="button"
                                className="btn btn-xs btn-outline-primary py-0.5 px-2 extra-small fw-semibold rounded-2"
                                onClick={() => openCustomerDocPreview(docBackFile || docBackPreview, 'Back ID Document')}
                                title="Preview Document"
                              >
                                <i className="bi bi-eye"></i> View
                              </button>
                              <label
                                className="btn btn-xs btn-light border py-0.5 px-1.5 extra-small fw-semibold rounded-2 m-0 cursor-pointer"
                                title="Replace Document"
                              >
                                <i className="bi bi-arrow-repeat"></i>
                                <input
                                  type="file"
                                  accept="image/*,application/pdf"
                                  className="d-none"
                                  onChange={(e) => {
                                    if (e.target.files[0]) handleDocBackChange(e.target.files[0]);
                                  }}
                                />
                              </label>
                              <button
                                type="button"
                                className="btn btn-xs btn-light border text-danger py-0.5 px-1.5 extra-small rounded-2"
                                onClick={() => { setDocBackFile(null); setDocBackPreview(''); }}
                                title="Remove Document"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="border border-dashed p-2.5 rounded-3 text-center bg-light position-relative hover-bg-white transition-all">
                          <i className="bi bi-cloud-arrow-up text-primary fs-5 d-block mb-0.5"></i>
                          <div className="extra-small fw-semibold text-dark">Upload ID Back</div>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="opacity-0 position-absolute start-0 top-0 w-100 h-100 cursor-pointer"
                            onChange={(e) => {
                              if (e.target.files[0]) handleDocBackChange(e.target.files[0]);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light p-3">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary fw-bold px-4" disabled={submitting}>
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-1"></i>Save Profile Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        show={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={(file, previewUrl) => {
          setPhotoFile(file);
          setPhotoPreview(previewUrl);
        }}
      />

      {/* RESERVATION DETAILS & MANAGEMENT MODAL */}
      {selectedBooking && (() => {
        const nights = (() => {
          if (!selectedBooking.check_in_date || !selectedBooking.expected_checkout_date) return 1;
          const start = new Date(selectedBooking.check_in_date);
          const end = new Date(selectedBooking.expected_checkout_date);
          const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
          return diff > 0 ? diff : 1;
        })();
        const estTotal = (selectedBooking.room_rate || 0) * nights;
        const estBalance = Math.max(0, estTotal - (selectedBooking.advance_amount || 0));

        return (
          <div
            className="modal fade show d-block modal-backdrop-animated"
            tabIndex="-1"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1060 }}
          >
            <div className="modal-dialog modal-dialog-centered modal-dialog-animated" style={{ maxWidth: '520px' }}>
              <div
                className="modal-content border-0 shadow-lg overflow-hidden modal-content-animated"
                style={{ backgroundColor: '#ffffff', borderRadius: '16px' }}
              >
                {/* Header */}
                <div
                  className="modal-header bg-white border-bottom d-flex align-items-center justify-content-between"
                  style={{ padding: '14px 18px', borderColor: '#F1F5F9' }}
                >
                  <div className="d-flex align-items-center gap-2.5">
                    <div
                      className="d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '10px',
                        backgroundColor: '#EFF6FF',
                        color: '#2563EB',
                        border: '1px solid #DBEAFE'
                      }}
                    >
                      <i className="bi bi-calendar2-check fs-6"></i>
                    </div>
                    <div>
                      <div className="d-flex align-items-center gap-1.5 mb-0.5">
                        <h6 className="modal-title fw-bold text-dark m-0" style={{ fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
                          Reservation #{selectedBooking.booking_number}
                        </h6>
                        <StatusBadge status={selectedBooking.status} />
                      </div>
                      <span className="text-secondary" style={{ fontSize: '0.7rem' }}>
                        {selectedBooking.created_at ? (
                          <>Booked on {new Date(selectedBooking.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} &bull; </>
                        ) : null}
                        Guest: <strong className="text-dark">{customer.full_name}</strong>
                      </span>
                    </div>
                  </div>
                  <button type="button" className="btn-close shadow-none" style={{ transform: 'scale(0.85)' }} onClick={() => setSelectedBooking(null)}></button>
                </div>

                {/* Body */}
                <div className="modal-body p-3.5 bg-white" style={{ maxHeight: 'calc(100vh - 160px)', overflowY: 'auto' }}>
                  
                  {/* Guest Profile Strip */}
                  <div
                    className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3"
                    style={{
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '10px',
                      padding: '10px 14px'
                    }}
                  >
                    <div className="d-flex align-items-center gap-2.5">
                      <div
                        className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                        style={{ width: '30px', height: '30px', fontSize: '0.75rem' }}
                      >
                        {customer.first_name ? customer.first_name[0].toUpperCase() : 'G'}
                      </div>
                      <div>
                        <div className="fw-bold text-dark" style={{ fontSize: '0.825rem' }}>{customer.full_name}</div>
                        <div className="text-secondary d-flex align-items-center gap-1.5" style={{ fontSize: '0.7rem' }}>
                          <a href={`tel:${customer.mobile}`} className="text-decoration-none text-primary fw-semibold">
                            <i className="bi bi-telephone me-0.5"></i>{customer.mobile}
                          </a>
                          {customer.id_type && (
                            <span className="text-muted">&bull; {customer.id_type}: <strong className="text-dark">{customer.id_number || 'N/A'}</strong></span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span
                      className="badge bg-white text-secondary border px-2 py-1 rounded-pill"
                      style={{ fontSize: '0.65rem', borderColor: '#E2E8F0' }}
                    >
                      ID #{customer.id}
                    </span>
                  </div>

                  {/* 2x2 Key Schedule & Room Tiles with proper grid gap and margins */}
                  <div className="row g-2.5 mb-3">
                    {/* Room */}
                    <div className="col-6">
                      <div
                        className="h-100 d-flex flex-column justify-content-between"
                        style={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          borderRadius: '10px',
                          padding: '11px 13px'
                        }}
                      >
                        <div className="d-flex align-items-center gap-1 mb-1.5 text-secondary text-uppercase fw-bold" style={{ fontSize: '0.625rem', letterSpacing: '0.04em' }}>
                          <i className="bi bi-door-closed text-primary"></i> Room Assigned
                        </div>
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-1 mt-auto">
                          <span className="fw-bold text-dark lh-1" style={{ fontSize: '0.875rem' }}>Room {selectedBooking.room_number}</span>
                          <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle rounded-pill px-1.5 py-0.5" style={{ fontSize: '0.625rem' }}>
                            {selectedBooking.room_type || 'Standard'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Occupancy */}
                    <div className="col-6">
                      <div
                        className="h-100 d-flex flex-column justify-content-between"
                        style={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          borderRadius: '10px',
                          padding: '11px 13px'
                        }}
                      >
                        <div className="d-flex align-items-center gap-1 mb-1.5 text-secondary text-uppercase fw-bold" style={{ fontSize: '0.625rem', letterSpacing: '0.04em' }}>
                          <i className="bi bi-people text-primary"></i> Guest Count
                        </div>
                        <div className="fw-bold text-dark mt-auto" style={{ fontSize: '0.825rem' }}>
                          {selectedBooking.adults || 1} Adult{selectedBooking.adults > 1 ? 's' : ''}
                          {(selectedBooking.children || 0) > 0 && <span className="text-secondary fw-normal"> &bull; {selectedBooking.children} Child</span>}
                        </div>
                      </div>
                    </div>

                    {/* Scheduled Check-In */}
                    <div className="col-6">
                      <div
                        className="h-100 d-flex flex-column justify-content-between"
                        style={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          borderRadius: '10px',
                          padding: '11px 13px'
                        }}
                      >
                        <div className="d-flex align-items-center gap-1 mb-1.5 text-secondary text-uppercase fw-bold" style={{ fontSize: '0.625rem', letterSpacing: '0.04em' }}>
                          <i className="bi bi-box-arrow-in-right text-success"></i> Check-In
                        </div>
                        <div>
                          <div className="fw-bold text-dark" style={{ fontSize: '0.825rem' }}>{formatDate(selectedBooking.check_in_date)}</div>
                          <div className="text-secondary mt-0.5" style={{ fontSize: '0.7rem' }}>
                            {formatDisplayTime(selectedBooking.check_in_time)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Scheduled Check-Out */}
                    <div className="col-6">
                      <div
                        className="h-100 d-flex flex-column justify-content-between"
                        style={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          borderRadius: '10px',
                          padding: '11px 13px'
                        }}
                      >
                        <div className="d-flex align-items-center justify-content-between mb-1.5">
                          <span className="d-flex align-items-center gap-1 text-secondary text-uppercase fw-bold" style={{ fontSize: '0.625rem', letterSpacing: '0.04em' }}>
                            <i className="bi bi-box-arrow-right text-danger"></i> Check-Out
                          </span>
                          <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-1.5 py-0.5 fw-bold" style={{ fontSize: '0.625rem' }}>
                            {nights}N
                          </span>
                        </div>
                        <div>
                          <div className="fw-bold text-dark" style={{ fontSize: '0.825rem' }}>{formatDate(selectedBooking.expected_checkout_date)}</div>
                          <div className="text-secondary mt-0.5" style={{ fontSize: '0.7rem' }}>
                            {formatDisplayTime(selectedBooking.expected_checkout_time)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Financial Overview Card */}
                  <div
                    className="mb-3"
                    style={{
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '10px',
                      padding: '11px 14px'
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-1.5">
                      <span className="text-uppercase fw-bold text-secondary" style={{ fontSize: '0.625rem', letterSpacing: '0.04em' }}>
                        Tariff & Deposit Breakdown
                      </span>
                      <span className="text-muted" style={{ fontSize: '0.65rem' }}>
                        {nights} Night{nights > 1 ? 's' : ''} Stay
                      </span>
                    </div>
                    <div className="row g-2 align-items-center">
                      <div className="col-4">
                        <span className="text-secondary d-block" style={{ fontSize: '0.65rem' }}>Agreed Rate</span>
                        <div className="fw-bold text-dark" style={{ fontSize: '0.825rem' }}>
                          {formatCurrency(selectedBooking.room_rate)} <span className="text-muted fw-normal" style={{ fontSize: '0.65rem' }}>/nt</span>
                        </div>
                      </div>
                      <div className="col-4">
                        <span className="text-secondary d-block" style={{ fontSize: '0.65rem' }}>Advance Deposit</span>
                        <div className="fw-bold" style={{ fontSize: '0.825rem' }}>
                          {selectedBooking.advance_amount > 0 ? (
                            <span className="text-success">{formatCurrency(selectedBooking.advance_amount)}</span>
                          ) : (
                            <span className="text-muted">₹0.00</span>
                          )}
                        </div>
                      </div>
                      <div className="col-4">
                        <span className="text-secondary d-block" style={{ fontSize: '0.65rem' }}>Est. Due at Check-In</span>
                        <div className="fw-bold text-primary" style={{ fontSize: '0.85rem' }}>
                          {formatCurrency(estBalance)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Special Notes (if any) */}
                  {selectedBooking.notes && (
                    <div
                      className="mb-1"
                      style={{
                        backgroundColor: '#FEFCE8',
                        border: '1px solid #FEF08A',
                        borderRadius: '8px',
                        padding: '8px 12px'
                      }}
                    >
                      <div className="fw-bold text-uppercase mb-0.5 d-flex align-items-center gap-1" style={{ color: '#854D0E', fontSize: '0.625rem', letterSpacing: '0.04em' }}>
                        <i className="bi bi-chat-left-text"></i> Special Notes
                      </div>
                      <p className="m-0" style={{ color: '#713F12', fontSize: '0.75rem', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                        {selectedBooking.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Streamlined Footer with Soft Toned Icon Buttons */}
                <div
                  className="modal-footer d-flex align-items-center justify-content-between"
                  style={{
                    padding: '12px 18px',
                    backgroundColor: '#F8FAFC',
                    borderTop: '1px solid #F1F5F9'
                  }}
                >
                  {/* Left Side: Soft Toned Icon Actions */}
                  <div className="d-flex align-items-center gap-1.5">
                    {isAdmin && (
                      <button
                        type="button"
                        className="btn d-inline-flex align-items-center justify-content-center p-0 transition-all shadow-xs"
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: '#FEF2F2',
                          color: '#DC2626',
                          border: '1px solid #FEE2E2',
                          fontSize: '0.85rem'
                        }}
                        onClick={() => handleDeleteBooking(selectedBooking)}
                        title="Delete Reservation Record"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    )}
                    
                    {(selectedBooking.status === 'CONFIRMED' || selectedBooking.status === 'PENDING') && (
                      <button
                        type="button"
                        className="btn d-inline-flex align-items-center justify-content-center p-0 transition-all shadow-xs"
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: '#FFFBEB',
                          color: '#D97706',
                          border: '1px solid #FEF3C7',
                          fontSize: '0.85rem'
                        }}
                        onClick={() => handleCancelBooking(selectedBooking)}
                        title="Cancel Reservation"
                      >
                        <i className="bi bi-x-circle"></i>
                      </button>
                    )}

                    <Link
                      to="/bookings"
                      className="btn d-inline-flex align-items-center justify-content-center p-0 transition-all shadow-xs"
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: '#FFFFFF',
                        color: '#475569',
                        border: '1px solid #E2E8F0',
                        fontSize: '0.85rem'
                      }}
                      onClick={() => setSelectedBooking(null)}
                      title="Open Bookings Management"
                    >
                      <i className="bi bi-box-arrow-up-right"></i>
                    </Link>
                  </div>

                  {/* Right Side: Clean Dismiss & Primary CTA */}
                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      className="btn fw-semibold shadow-xs transition-all"
                      style={{
                        height: '32px',
                        padding: '0 14px',
                        borderRadius: '8px',
                        backgroundColor: '#FFFFFF',
                        color: '#475569',
                        border: '1px solid #E2E8F0',
                        fontSize: '0.775rem'
                      }}
                      onClick={() => setSelectedBooking(null)}
                    >
                      Close
                    </button>

                    {(selectedBooking.status === 'CONFIRMED' || selectedBooking.status === 'PENDING') && (
                      <button
                        type="button"
                        className="btn fw-bold shadow-xs d-flex align-items-center gap-1.5 transition-all text-white"
                        style={{
                          height: '32px',
                          padding: '0 16px',
                          borderRadius: '8px',
                          backgroundColor: '#2563EB',
                          border: 'none',
                          fontSize: '0.775rem',
                          boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)'
                        }}
                        onClick={() => {
                          const bId = selectedBooking.id;
                          setSelectedBooking(null);
                          navigate(`/check-in?booking_id=${bId}`);
                        }}
                      >
                        <i className="bi bi-person-check-fill"></i> Check-In Now &rarr;
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        );
      })()}

      {/* Delete / Action Confirmation Modal */}
      <ConfirmModal
        show={confirmModal.show}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText || 'Yes, Proceed'}
        confirmVariant={confirmModal.confirmVariant || 'danger'}
        loading={confirmModal.loading}
        onClose={() => setConfirmModal({ show: false, loading: false })}
        onConfirm={confirmModal.onConfirm}
      />

      {/* RECORD CUSTOMER PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="modal fade show d-block modal-backdrop-animated" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-animated" style={{ maxWidth: '600px' }}>
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden modal-content-animated" style={{ backgroundColor: '#ffffff' }}>
              
              <div className="modal-header bg-white border-bottom py-3 px-4 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <div className="p-2.5 bg-success-subtle text-success rounded-3 d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                    <i className="bi bi-cash-coin fs-4"></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-dark m-0" style={{ fontSize: '1.15rem' }}>
                      Record Customer Payment
                    </h5>
                    <span className="text-secondary extra-small">
                      Settle outstanding balances for <strong>{customer.full_name}</strong>
                    </span>
                  </div>
                </div>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowPaymentModal(false)}></button>
              </div>

              <form onSubmit={handleRecordPaymentSubmit}>
                <div className="modal-body p-4 bg-white">
                  {payError && (
                    <div className="alert alert-danger border-danger py-2 rounded-3 small mb-3">
                      <i className="bi bi-exclamation-triangle-fill me-1.5"></i>{payError}
                    </div>
                  )}

                  {/* Wallet Credit Available Banner */}
                  {totalWalletCredit > 0 && (
                    <div className="p-3 bg-success-subtle rounded-3 border border-success-subtle mb-3 d-flex justify-content-between align-items-center">
                      <div>
                        <div className="text-success extra-small fw-bold text-uppercase">Available Guest Wallet Balance</div>
                        <div className="fs-5 fw-bold text-success">{formatCurrency(totalWalletCredit)}</div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-success fw-bold shadow-xs px-3"
                        onClick={() => {
                          setPayMethod('WALLET');
                          setPayAmount(Math.min(totalWalletCredit, totalPendingBalance > 0 ? totalPendingBalance : totalWalletCredit).toString());
                          setPayRef('CUSTOMER_WALLET_CREDIT');
                          setPayNotes('Paid using Guest Advance Credit Wallet');
                        }}
                      >
                        <i className="bi bi-wallet-fill me-1"></i> Use Wallet Credit
                      </button>
                    </div>
                  )}

                  {/* Outstanding Balance Info Banner */}
                  <div className="p-3 bg-light rounded-3 border mb-3 d-flex justify-content-between align-items-center">
                    <div>
                      <div className="text-muted extra-small font-normal">Total Outstanding Customer Balance</div>
                      <div className="fs-4 fw-bold text-danger">{formatCurrency(totalPendingBalance)}</div>
                      <div className="text-muted extra-small">{pendingStaysCount} Pending Stay(s)</div>
                    </div>
                    {totalPendingBalance > 0 && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger fw-bold"
                        onClick={() => setPayAmount(totalPendingBalance.toString())}
                      >
                        Settle Full ₹{totalPendingBalance.toLocaleString()}
                      </button>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark mb-1">Payment Amount Received (₹) *</label>
                    <div className="input-group">
                      <span className="input-group-text bg-white fw-bold">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        className="form-control form-control-lg fw-bold text-success"
                        required
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <span className="text-muted extra-small mt-1 d-block">
                      <i className="bi bi-info-circle me-1"></i>Payment will be automatically allocated across pending stays in FIFO order (oldest stay first).
                    </span>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-dark mb-1">Payment Method *</label>
                      <select
                        className="form-select"
                        value={payMethod}
                        onChange={(e) => setPayMethod(e.target.value)}
                      >
                        <option value="CASH">Cash</option>
                        <option value="UPI">UPI / GPay / PhonePe</option>
                        <option value="CARD">Credit / Debit Card</option>
                        <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                        {totalWalletCredit > 0 && (
                          <option value="WALLET">Customer Wallet Credit ({formatCurrency(totalWalletCredit)})</option>
                        )}
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-dark mb-1">Transaction Ref / URN</label>
                      <input
                        type="text"
                        className="form-control"
                        value={payRef}
                        onChange={(e) => setPayRef(e.target.value)}
                        placeholder="e.g. UPI Ref / Cheque #"
                      />
                    </div>
                  </div>

                  <div className="mb-2">
                    <label className="form-label small fw-semibold text-dark mb-1">Notes / Remarks</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={payNotes}
                      onChange={(e) => setPayNotes(e.target.value)}
                      placeholder="e.g. Received via PhonePe lump-sum settlement"
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer bg-light border-top px-4 py-3 d-flex justify-content-between align-items-center">
                  <button type="button" className="btn btn-light border fw-semibold px-4" onClick={() => setShowPaymentModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success fw-bold px-4 shadow-sm d-flex align-items-center gap-2" disabled={paySubmitting}>
                    {paySubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        Recording Payment...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle-fill me-1"></i> Confirm & Record Payment
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* RETURN / REFUND ADVANCE CREDIT MODAL */}
      {showRefundModal && (
        <div className="modal fade show d-block modal-backdrop-animated" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-animated">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden modal-content-animated">
              <div className="modal-header bg-danger text-white py-3 px-4 d-flex align-items-center justify-content-between">
                <h5 className="modal-title fw-bold m-0 d-flex align-items-center gap-2">
                  <i className="bi bi-arrow-counterclockwise fs-5"></i> Return / Refund Amount
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowRefundModal(false)}></button>
              </div>
              <form onSubmit={handleRefundSubmit}>
                <div className="modal-body p-4">
                  {refundError && <div className="alert alert-danger py-2 px-3 small mb-3">{refundError}</div>}

                  {/* Guest & Wallet Credit Summary Box */}
                  <div className="bg-light p-3 rounded-3 border mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="text-muted small">Guest Name:</span>
                      <span className="fw-bold text-dark">{customer.full_name}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="text-muted small">Mobile:</span>
                      <span className="text-dark">{customer.mobile}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                      <span className="text-muted small fw-semibold">Available Wallet Credit:</span>
                      <span className="fs-5 fw-bold text-success">{formatCurrency(totalWalletCredit)}</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label small fw-semibold text-dark mb-0">Return / Refund Amount (₹) *</label>
                      <button
                        type="button"
                        className="btn btn-sm btn-link p-0 text-decoration-none extra-small fw-bold text-danger"
                        onClick={() => setRefundAmount(totalWalletCredit.toFixed(2))}
                      >
                        Refund Full Balance ({formatCurrency(totalWalletCredit)})
                      </button>
                    </div>
                    <div className="input-group">
                      <span className="input-group-text bg-white fw-bold text-danger">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={totalWalletCredit}
                        className="form-control form-control-lg fw-bold text-danger"
                        required
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <span className="text-muted extra-small mt-1 d-block">
                      <i className="bi bi-info-circle me-1"></i>Max refundable amount is {formatCurrency(totalWalletCredit)}.
                    </span>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-dark mb-1">Refund Method *</label>
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
                      <label className="form-label small fw-semibold text-dark mb-1">Transaction Ref / URN</label>
                      <input
                        type="text"
                        className="form-control"
                        value={refundRef}
                        onChange={(e) => setRefundRef(e.target.value)}
                        placeholder="e.g. UPI Ref / Cash Receipt #"
                      />
                    </div>
                  </div>

                  <div className="mb-2">
                    <label className="form-label small fw-semibold text-dark mb-1">Reason / Remarks</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={refundNotes}
                      onChange={(e) => setRefundNotes(e.target.value)}
                      placeholder="e.g. Returned unused advance credit deposit upon guest request"
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer bg-light border-top px-4 py-3 d-flex justify-content-between align-items-center">
                  <button type="button" className="btn btn-light border fw-semibold px-4" onClick={() => setShowRefundModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-danger fw-bold px-4 shadow-sm d-flex align-items-center gap-2" disabled={refundSubmitting}>
                    {refundSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        Processing Refund...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-arrow-counterclockwise me-1"></i> Confirm & Return Amount
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TRANSACTION HISTORY AUDIT LOG MODAL */}
      {showTxnModal && (
        <div className="modal fade show d-block modal-backdrop-animated" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-xl modal-dialog-animated">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden modal-content-animated">
              
              <div className="modal-header bg-white border-bottom py-3 px-4 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <div className="p-2.5 bg-primary-subtle text-primary rounded-3 d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                    <i className="bi bi-receipt-cutoff fs-4"></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-dark m-0" style={{ fontSize: '1.15rem' }}>
                      Payment Transaction History Audit Log
                    </h5>
                    <span className="text-secondary extra-small">
                      Complete payment logs for <strong>{customer.full_name}</strong> ({customer.mobile})
                    </span>
                  </div>
                </div>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowTxnModal(false)}></button>
              </div>

              <div className="modal-body p-4 bg-white">
                {/* Summary Metrics Row */}
                {(() => {
                  const filteredTransactions = (customer?.transactions || []).filter((t) => {
                    if (!t.payment_date) return true;
                    const pDate = new Date(t.payment_date);
                    if (txnStartDate) {
                      const sDate = new Date(`${txnStartDate}T00:00:00`);
                      if (pDate < sDate) return false;
                    }
                    if (txnEndDate) {
                      const eDate = new Date(`${txnEndDate}T23:59:59`);
                      if (pDate > eDate) return false;
                    }
                    return true;
                  });

                  const filteredTotalPaid = filteredTransactions.reduce(
                    (sum, t) => sum + parseFloat(t.amount || 0),
                    0
                  );

                  return (
                    <>
                      <div className="row g-3 mb-3">
                        <div className="col-md-4">
                          <div className="p-3 bg-light rounded-3 border">
                            <div className="text-muted extra-small font-normal">
                              Total Payment Transactions {(txnStartDate || txnEndDate) && <span className="text-primary fw-bold">(Filtered)</span>}
                            </div>
                            <div className="fs-4 fw-bold text-dark">
                              {filteredTransactions.length} Record(s)
                              {(txnStartDate || txnEndDate) && customer?.transactions?.length !== filteredTransactions.length && (
                                <span className="text-muted fs-6 fw-normal ms-2">of {customer?.transactions?.length || 0}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="p-3 bg-light rounded-3 border">
                            <div className="text-muted extra-small font-normal">
                              Total Amount Paid {(txnStartDate || txnEndDate) && <span className="text-success fw-bold">(Filtered)</span>}
                            </div>
                            <div className="fs-4 fw-bold text-success">
                              {formatCurrency(filteredTotalPaid)}
                            </div>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="p-3 bg-light rounded-3 border">
                            <div className="text-muted extra-small font-normal">Current Wallet Credit Balance</div>
                            <div className="fs-4 fw-bold text-primary">{formatCurrency(totalWalletCredit)}</div>
                          </div>
                        </div>
                      </div>

                      {/* Toolbar: Collapsible Date Filter Toggle + Export Buttons */}
                      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 p-2.5 bg-light rounded-3 border mb-3">
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            className={`btn btn-sm ${showTxnDateFilter ? 'btn-primary text-white' : 'btn-outline-primary'} fw-semibold d-flex align-items-center gap-2`}
                            onClick={() => setShowTxnDateFilter(!showTxnDateFilter)}
                          >
                            <i className="bi bi-funnel"></i>
                            <span>Filter by Date Range</span>
                            {(txnStartDate || txnEndDate) && (
                              <span className="badge bg-white text-primary ms-1">
                                {txnStartDate || 'Start'} &rarr; {txnEndDate || 'End'}
                              </span>
                            )}
                            <i className={`bi bi-chevron-${showTxnDateFilter ? 'up' : 'down'} small`}></i>
                          </button>

                          {(txnStartDate || txnEndDate) && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger fw-semibold d-flex align-items-center gap-1"
                              onClick={() => handleSetDatePreset('all')}
                              title="Clear Date Filters"
                            >
                              <i className="bi bi-x-circle"></i> Clear Filter
                            </button>
                          )}
                        </div>

                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-success fw-bold d-flex align-items-center gap-1.5 shadow-xs"
                            onClick={() => exportTransactionsToExcel(filteredTransactions, customer, { startDate: txnStartDate, endDate: txnEndDate })}
                            title="Download Transactions in Excel / CSV Format"
                          >
                            <i className="bi bi-file-earmark-excel-fill text-success"></i> Export Excel
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger fw-bold d-flex align-items-center gap-1.5 shadow-xs"
                            onClick={() => exportTransactionsToPDF(filteredTransactions, customer, { startDate: txnStartDate, endDate: txnEndDate }, 'landscape')}
                            title="Export Transactions in Horizontal Landscape A4 PDF Format"
                          >
                            <i className="bi bi-file-earmark-pdf-fill text-danger"></i> PDF (Landscape)
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary fw-bold d-flex align-items-center gap-1.5 shadow-xs"
                            onClick={() => exportTransactionsToPDF(filteredTransactions, customer, { startDate: txnStartDate, endDate: txnEndDate }, 'portrait')}
                            title="Export Transactions in Upright Vertical A4 PDF Format"
                          >
                            <i className="bi bi-file-text-fill text-secondary"></i> PDF (Portrait)
                          </button>
                        </div>
                      </div>

                      {/* Collapsible Date Filter Controls Panel */}
                      {showTxnDateFilter && (
                        <div className="p-3 bg-white rounded-3 border mb-3 shadow-xs">
                          <div className="row g-3 align-items-end">
                            <div className="col-sm-4 col-md-3">
                              <label className="form-label extra-small fw-bold text-secondary text-uppercase mb-1">
                                <i className="bi bi-calendar-event me-1 text-primary"></i>Start Date
                              </label>
                              <input
                                type="date"
                                className="form-control form-control-sm"
                                value={txnStartDate}
                                onChange={(e) => setTxnStartDate(e.target.value)}
                              />
                            </div>
                            <div className="col-sm-4 col-md-3">
                              <label className="form-label extra-small fw-bold text-secondary text-uppercase mb-1">
                                <i className="bi bi-calendar-check me-1 text-primary"></i>End Date
                              </label>
                              <input
                                type="date"
                                className="form-control form-control-sm"
                                value={txnEndDate}
                                onChange={(e) => setTxnEndDate(e.target.value)}
                              />
                            </div>
                            <div className="col-sm-12 col-md-6 d-flex align-items-center gap-1.5 flex-wrap">
                              <span className="extra-small fw-semibold text-muted me-1">Presets:</span>
                              <button
                                type="button"
                                className="btn btn-xs btn-outline-secondary px-2.5 py-1"
                                style={{ fontSize: '0.75rem' }}
                                onClick={() => handleSetDatePreset('today')}
                              >
                                Today
                              </button>
                              <button
                                type="button"
                                className="btn btn-xs btn-outline-secondary px-2.5 py-1"
                                style={{ fontSize: '0.75rem' }}
                                onClick={() => handleSetDatePreset('7days')}
                              >
                                Last 7 Days
                              </button>
                              <button
                                type="button"
                                className="btn btn-xs btn-outline-secondary px-2.5 py-1"
                                style={{ fontSize: '0.75rem' }}
                                onClick={() => handleSetDatePreset('month')}
                              >
                                This Month
                              </button>
                              <button
                                type="button"
                                className="btn btn-xs btn-outline-secondary px-2.5 py-1"
                                style={{ fontSize: '0.75rem' }}
                                onClick={() => handleSetDatePreset('all')}
                              >
                                All Time
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Transactions Table */}
                      <div className="table-responsive border rounded-3 overflow-hidden">
                        <table className="table table-hover align-middle m-0">
                          <thead className="table-light text-muted small text-uppercase fw-bold">
                            <tr>
                              <th className="ps-3">Date & Time</th>
                              <th>Payment #</th>
                              <th>Stay / Room</th>
                              <th>Method</th>
                              <th>Ref / URN</th>
                              <th>Amount Paid</th>
                              <th>Received By</th>
                              <th className="pe-3">Notes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredTransactions.length === 0 ? (
                              <tr>
                                <td colSpan="8" className="text-center text-muted py-5">
                                  <i className="bi bi-inbox fs-1 d-block mb-2 text-secondary opacity-50"></i>
                                  {txnStartDate || txnEndDate ? (
                                    <div>
                                      <div className="fw-semibold text-dark">No payment transactions found in selected date range.</div>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-link text-primary mt-1"
                                        onClick={() => handleSetDatePreset('all')}
                                      >
                                        Reset Date Filter to view all records
                                      </button>
                                    </div>
                                  ) : (
                                    'No payment transactions recorded for this guest yet.'
                                  )}
                                </td>
                              </tr>
                            ) : (
                              filteredTransactions.map((t) => (
                                <tr key={t.id}>
                                  <td className="ps-3 text-muted small whitespace-nowrap">
                                    {new Date(t.payment_date).toLocaleString('en-IN', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      hour12: true
                                    })}
                                  </td>
                                  <td className="fw-bold text-dark">{t.payment_number}</td>
                                  <td>
                                    {t.stay_id ? (
                                      <Link to={`/stays/${t.stay_id}`} className="badge bg-primary text-decoration-none" onClick={() => setShowTxnModal(false)}>
                                        Stay #{t.stay_number} (Room {t.room_number})
                                      </Link>
                                    ) : parseFloat(t.amount || 0) < 0 ? (
                                      <span className="badge bg-danger-subtle text-danger border border-danger-subtle fw-bold d-inline-flex align-items-center gap-1">
                                        <i className="bi bi-arrow-counterclockwise"></i> Wallet Debit / Refund
                                      </span>
                                    ) : (
                                      <span className="badge bg-success-subtle text-success border border-success-subtle fw-bold d-inline-flex align-items-center gap-1">
                                        <i className="bi bi-wallet2"></i> Wallet Deposit / Credit
                                      </span>
                                    )}
                                  </td>
                                  <td>
                                    <span className={`badge ${
                                      t.payment_method === 'CASH' ? 'bg-success' :
                                      t.payment_method === 'UPI' ? 'bg-info text-dark' :
                                      t.payment_method === 'CARD' ? 'bg-primary' : 'bg-secondary'
                                    }`}>
                                      {t.payment_method}
                                    </span>
                                  </td>
                                  <td className="small text-muted font-monospace">{t.transaction_reference || 'N/A'}</td>
                                  <td className={`fw-bold fs-6 ${parseFloat(t.amount || 0) < 0 ? 'text-danger' : 'text-success'}`}>
                                    {parseFloat(t.amount || 0) < 0 ? (
                                      <span>-₹{Math.abs(parseFloat(t.amount || 0)).toFixed(2)}</span>
                                    ) : (
                                      <span>+{formatCurrency(t.amount)}</span>
                                    )}
                                  </td>
                                  <td className="small text-dark fw-semibold">{t.received_by}</td>
                                  <td className="pe-3 small text-secondary">{t.notes || '—'}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="modal-footer bg-light border-top px-4 py-3">
                <button type="button" className="btn btn-secondary fw-semibold px-4" onClick={() => setShowTxnModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document & Photo Fullscreen Preview Modal */}
      {previewModalDoc && previewModalDoc.show && (
        <div className="modal fade show d-block modal-backdrop-animated" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', zIndex: 1080 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-animated">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden modal-content-animated">
              <div className="modal-header bg-dark text-white py-3 px-4 d-flex align-items-center justify-content-between">
                <h5 className="modal-title fw-bold fs-6 d-flex align-items-center gap-2 m-0">
                  <i className="bi bi-file-earmark-text text-primary"></i> {previewModalDoc.title}
                </h5>
                <div className="d-flex align-items-center gap-2">
                  {previewModalDoc.url && (
                    <a
                      href={previewModalDoc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-sm btn-outline-light py-1 px-2.5 extra-small fw-semibold d-inline-flex align-items-center gap-1"
                    >
                      <i className="bi bi-box-arrow-up-right"></i> Open in New Tab
                    </a>
                  )}
                  <button type="button" className="btn-close btn-close-white shadow-none" onClick={() => setPreviewModalDoc(null)}></button>
                </div>
              </div>
              <div className="modal-body p-3 bg-light text-center" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                {previewModalDoc.isPdf ? (
                  <iframe src={previewModalDoc.url} title={previewModalDoc.title} className="w-100 rounded border bg-white" style={{ height: '600px' }}></iframe>
                ) : (
                  <img
                    src={previewModalDoc.url}
                    alt={previewModalDoc.title}
                    className="img-fluid rounded border shadow-sm"
                    style={{ maxHeight: '65vh', objectFit: 'contain' }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDetails;
