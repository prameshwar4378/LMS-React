import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getStayByIdApi, updateStayApi, addStayGuestApi, deleteStayGuestApi } from '../api/stayApi';
import {
  updateCustomerApi,
  uploadCustomerDocumentApi,
  removeCustomerPhotoApi,
  removeCustomerIdFrontApi,
  removeCustomerIdBackApi,
  deleteCustomerDocumentApi,
} from '../api/customerApi';
import { createExtraChargeApi, deleteExtraChargeApi, createPaymentApi, updatePaymentApi, deletePaymentApi } from '../api/billingApi';
import StatusBadge from '../components/StatusBadge';
import GuestFormModal from '../components/GuestFormModal';
import ChargeFormModal from '../components/ChargeFormModal';
import PaymentFormModal from '../components/PaymentFormModal';
import InvoicePreviewModal from '../components/InvoicePreviewModal';
import ConfirmModal from '../components/ConfirmModal';
import CameraCaptureModal from '../components/CameraCaptureModal';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate, formatDateTime } from '../utils/dateUtils';

const StayDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [stay, setStay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Explicit Admin Override unlock state for completed stays
  const [adminOverrideUnlocked, setAdminOverrideUnlocked] = useState(false);

  // Modals
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editPayment, setEditPayment] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Professional Delete Confirm Modal state
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    confirmText: 'Delete',
    onConfirm: null,
    loading: false,
  });

  // 1. Edit Stay & Pricing Modal State
  const [showEditStayModal, setShowEditStayModal] = useState(false);
  const [editRoomRate, setEditRoomRate] = useState('');
  const [editDiscountType, setEditDiscountType] = useState('FIXED');
  const [editDiscountValue, setEditDiscountValue] = useState(0);
  const [editDiscountReason, setEditDiscountReason] = useState('');
  const [editAdults, setEditAdults] = useState(1);
  const [editChildren, setEditChildren] = useState(0);

  // 2. Edit Dates & Times Modal State
  const [showEditDatesModal, setShowEditDatesModal] = useState(false);
  const [editCheckInDate, setEditCheckInDate] = useState('');
  const [editCheckInTime, setEditCheckInTime] = useState('12:00');
  const [editCheckoutDate, setEditCheckoutDate] = useState('');
  const [editCheckoutTime, setEditCheckoutTime] = useState('11:00');

  // 3. Edit Primary Guest Profile & Photo / ID Front & Back Upload Modal State
  const [showEditGuestModal, setShowEditGuestModal] = useState(false);
  const [guestFirstName, setGuestFirstName] = useState('');
  const [guestLastName, setGuestLastName] = useState('');
  const [guestMobile, setGuestMobile] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestAddress, setGuestAddress] = useState('');
  const [guestIdType, setGuestIdType] = useState('Aadhaar');
  const [guestIdNumber, setGuestIdNumber] = useState('');
  const [guestPhotoFile, setGuestPhotoFile] = useState(null);
  const [guestPhotoPreview, setGuestPhotoPreview] = useState('');
  const [guestDocFile, setGuestDocFile] = useState(null);
  const [guestDocBackFile, setGuestDocBackFile] = useState(null);
  const [showGuestCamera, setShowGuestCamera] = useState(false);

  // 4. Upload Extra Document Modal State
  const [showExtraDocModal, setShowExtraDocModal] = useState(false);
  const [extraDocTitle, setExtraDocTitle] = useState('');
  const [extraDocFile, setExtraDocFile] = useState(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    loadStayDetails();
  }, [id]);

  const loadStayDetails = async () => {
    setLoading(true);
    try {
      const data = await getStayByIdApi(id);
      setStay(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isCompleted = stay?.status === 'CHECKED_OUT' || stay?.status === 'COMPLETED';
  // Strict rule: if completed, frozen for everyone by default unless Admin explicitly unlocks override
  const canEdit = !isCompleted || (isAdmin && adminOverrideUnlocked);

  // Open Stay & Pricing Edit Modal
  const openEditStayModal = () => {
    if (!canEdit) return;
    if (stay) {
      setEditRoomRate(stay.room_rate || '');
      setEditDiscountType(stay.discount_type || 'FIXED');
      setEditDiscountValue(stay.discount_value || 0);
      setEditDiscountReason(stay.discount_reason || '');
      setEditAdults(stay.adults || 1);
      setEditChildren(stay.children || 0);
      setActionError('');
      setShowEditStayModal(true);
    }
  };

  // Open Dates Edit Modal
  const openEditDatesModal = () => {
    if (!canEdit) return;
    if (stay) {
      setEditCheckInDate(stay.check_in_date || '');
      setEditCheckInTime(stay.check_in_time ? stay.check_in_time.substring(0, 5) : '12:00');
      setEditCheckoutDate(stay.expected_checkout_date || '');
      setEditCheckoutTime(stay.expected_checkout_time ? stay.expected_checkout_time.substring(0, 5) : '11:00');
      setActionError('');
      setShowEditDatesModal(true);
    }
  };

  // Open Primary Guest Edit Modal with Photo & Document controls
  const openEditGuestModal = () => {
    if (!canEdit) return;
    if (stay && stay.primary_customer_detail) {
      const c = stay.primary_customer_detail;
      setGuestFirstName(c.first_name || '');
      setGuestLastName(c.last_name || '');
      setGuestMobile(c.mobile || '');
      setGuestEmail(c.email || '');
      setGuestAddress(c.address || '');
      setGuestIdType(c.id_type || 'Aadhaar');
      setGuestIdNumber(c.id_number || '');
      setGuestPhotoFile(null);
      setGuestPhotoPreview(c.photo || '');
      setGuestDocFile(null);
      setGuestDocBackFile(null);
      setActionError('');
      setShowEditGuestModal(true);
    }
  };

  // Save Stay & Pricing Updates
  const handleSaveStayDetails = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError('');
    try {
      await updateStayApi(stay.id, {
        room_rate: parseFloat(editRoomRate),
        discount_type: editDiscountType,
        discount_value: parseFloat(editDiscountValue || 0),
        discount_reason: editDiscountReason,
        adults: parseInt(editAdults),
        children: parseInt(editChildren),
      });
      setShowEditStayModal(false);
      loadStayDetails();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to update stay details.');
    } finally {
      setActionLoading(false);
    }
  };

  // Save Dates & Times Updates
  const handleSaveDates = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError('');
    try {
      await updateStayApi(stay.id, {
        check_in_date: editCheckInDate,
        check_in_time: editCheckInTime,
        expected_checkout_date: editCheckoutDate,
        expected_checkout_time: editCheckoutTime,
      });
      setShowEditDatesModal(false);
      loadStayDetails();
    } catch (err) {
      setActionError(err.response?.data?.expected_checkout_date?.[0] || err.response?.data?.error || 'Failed to update stay dates & times.');
    } finally {
      setActionLoading(false);
    }
  };

  // Save Primary Guest Profile Updates + Photo & Front/Back ID Document Files
  const handleSavePrimaryGuest = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError('');
    try {
      const formData = new FormData();
      formData.append('first_name', guestFirstName);
      if (guestLastName) formData.append('last_name', guestLastName);
      formData.append('mobile', guestMobile);
      if (guestEmail) formData.append('email', guestEmail);
      if (guestAddress) formData.append('address', guestAddress);
      formData.append('id_type', guestIdType);
      if (guestIdNumber) formData.append('id_number', guestIdNumber);

      if (guestPhotoFile) formData.append('photo', guestPhotoFile);
      if (guestDocFile) formData.append('id_document', guestDocFile);
      if (guestDocBackFile) formData.append('id_document_back', guestDocBackFile);

      await updateCustomerApi(stay.primary_customer, formData);
      setShowEditGuestModal(false);
      loadStayDetails();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to update guest details and documents.');
    } finally {
      setActionLoading(false);
    }
  };

  // Upload Extra Document
  const handleUploadExtraDoc = async (e) => {
    e.preventDefault();
    if (!extraDocFile) {
      setActionError('Please select a document file.');
      return;
    }
    setActionLoading(true);
    setActionError('');
    try {
      await uploadCustomerDocumentApi(stay.primary_customer, extraDocTitle || 'Additional Document', extraDocFile);
      setShowExtraDocModal(false);
      setExtraDocTitle('');
      setExtraDocFile(null);
      loadStayDetails();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to upload document.');
    } finally {
      setActionLoading(false);
    }
  };

  // Document & Photo Delete Handlers
  const requestRemovePhoto = () => {
    if (!canEdit) return;
    setConfirmModal({
      show: true,
      title: 'Remove Guest Photo',
      message: 'Are you sure you want to remove the guest photo snapshot?',
      confirmText: 'Remove Photo',
      loading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, loading: true }));
        try {
          await removeCustomerPhotoApi(stay.primary_customer);
          setConfirmModal({ show: false });
          loadStayDetails();
        } catch (err) {
          alert('Error removing photo.');
          setConfirmModal({ show: false });
        }
      },
    });
  };

  const requestRemoveIdFront = () => {
    if (!canEdit) return;
    setConfirmModal({
      show: true,
      title: 'Remove Front ID Document',
      message: 'Are you sure you want to remove the Front ID document file?',
      confirmText: 'Remove Document',
      loading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, loading: true }));
        try {
          await removeCustomerIdFrontApi(stay.primary_customer);
          setConfirmModal({ show: false });
          loadStayDetails();
        } catch (err) {
          alert('Error removing Front ID document.');
          setConfirmModal({ show: false });
        }
      },
    });
  };

  const requestRemoveIdBack = () => {
    if (!canEdit) return;
    setConfirmModal({
      show: true,
      title: 'Remove Back ID Document',
      message: 'Are you sure you want to remove the Back ID document file?',
      confirmText: 'Remove Document',
      loading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, loading: true }));
        try {
          await removeCustomerIdBackApi(stay.primary_customer);
          setConfirmModal({ show: false });
          loadStayDetails();
        } catch (err) {
          alert('Error removing Back ID document.');
          setConfirmModal({ show: false });
        }
      },
    });
  };

  const requestDeleteExtraDocument = (docId, title) => {
    if (!canEdit) return;
    setConfirmModal({
      show: true,
      title: 'Delete Document Record',
      message: `Are you sure you want to delete '${title}'? This action cannot be undone.`,
      confirmText: 'Delete Document',
      loading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, loading: true }));
        try {
          await deleteCustomerDocumentApi(docId);
          setConfirmModal({ show: false });
          loadStayDetails();
        } catch (err) {
          alert('Error deleting document.');
          setConfirmModal({ show: false });
        }
      },
    });
  };

  const handleAddGuest = async (formData) => {
    if (!canEdit) return;
    try {
      await addStayGuestApi(formData);
      setShowGuestModal(false);
      loadStayDetails();
    } catch (err) {
      alert('Error adding guest.');
    }
  };

  // Trigger Professional Delete Guest Modal
  const requestDeleteGuest = (guestId, guestName) => {
    if (!canEdit) return;
    setConfirmModal({
      show: true,
      title: 'Remove Additional Guest',
      message: `Are you sure you want to remove '${guestName}' from this stay roster?`,
      confirmText: 'Remove Guest',
      loading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, loading: true }));
        try {
          await deleteStayGuestApi(guestId);
          setConfirmModal({ show: false });
          loadStayDetails();
        } catch (err) {
          alert('Error removing guest.');
          setConfirmModal({ show: false });
        }
      },
    });
  };

  const handleAddCharge = async (chargeData) => {
    if (!canEdit) return;
    try {
      await createExtraChargeApi(chargeData);
      setShowChargeModal(false);
      loadStayDetails();
    } catch (err) {
      alert('Error adding charge.');
    }
  };

  // Trigger Professional Delete Charge Modal
  const requestDeleteCharge = (chargeId, chargeName) => {
    if (!canEdit) return;
    setConfirmModal({
      show: true,
      title: 'Delete Extra Charge',
      message: `Are you sure you want to delete '${chargeName || 'this extra charge'}' from this stay bill? The financial breakdown will update automatically.`,
      confirmText: 'Delete Charge',
      loading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, loading: true }));
        try {
          await deleteExtraChargeApi(chargeId);
          setConfirmModal({ show: false });
          loadStayDetails();
        } catch (err) {
          alert('Error deleting charge.');
          setConfirmModal({ show: false });
        }
      },
    });
  };

  // Open Add Payment Modal
  const openRecordPaymentModal = () => {
    if (!canEdit) return;
    setEditPayment(null);
    setShowPaymentModal(true);
  };

  // Open Edit Payment Modal
  const openEditPaymentModal = (payment) => {
    if (!canEdit) return;
    setEditPayment(payment);
    setShowPaymentModal(true);
  };

  // Handle Add or Edit Payment Submit
  const handleAddOrUpdatePayment = async (payData) => {
    if (!canEdit) return;
    try {
      if (editPayment) {
        await updatePaymentApi(editPayment.id, payData);
      } else {
        await createPaymentApi(payData);
      }
      setShowPaymentModal(false);
      setEditPayment(null);
      loadStayDetails();
    } catch (err) {
      alert('Error saving payment record.');
    }
  };

  // Trigger Professional Delete Payment Modal
  const requestDeletePayment = (paymentId, paymentNumber, amount) => {
    if (!canEdit) return;
    setConfirmModal({
      show: true,
      title: 'Delete Payment Transaction',
      message: `Are you sure you want to delete Payment #${paymentNumber} (₹${parseFloat(amount).toFixed(2)})? The stay balance due will update automatically.`,
      confirmText: 'Delete Payment',
      loading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, loading: true }));
        try {
          await deletePaymentApi(paymentId);
          setConfirmModal({ show: false });
          loadStayDetails();
        } catch (err) {
          alert('Error deleting payment transaction.');
          setConfirmModal({ show: false });
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <div className="mt-2 text-muted small">Loading Stay Management Dashboard...</div>
      </div>
    );
  }

  if (!stay) {
    return <div className="alert alert-danger">Stay record not found.</div>;
  }

  const bill = stay.bill_summary || {};
  const cust = stay.primary_customer_detail || {};

  return (
    <div>
      {/* Role-Aware & Lock State Banners for Completed Stays */}
      {isCompleted && (
        <div className={`alert ${adminOverrideUnlocked ? 'alert-warning border-warning' : 'alert-secondary border-secondary'} d-flex align-items-center justify-content-between gap-3 shadow-sm mb-4`} style={{ borderRadius: '12px' }}>
          <div className="d-flex align-items-center gap-3">
            <div className={`${adminOverrideUnlocked ? 'bg-warning text-dark' : 'bg-dark text-white'} rounded-circle d-flex align-items-center justify-content-center flex-shrink-0`} style={{ width: '44px', height: '44px' }}>
              <i className={`bi ${adminOverrideUnlocked ? 'bi-unlock-fill' : 'bi-lock-fill'} fs-4`}></i>
            </div>
            <div>
              <h6 className="fw-bold text-dark mb-0">
                Completed Stay Record — {adminOverrideUnlocked ? 'Admin Override Unlocked' : 'Read-Only Frozen Mode'}
              </h6>
              <span className="small text-secondary">
                {adminOverrideUnlocked
                  ? 'Admin override mode is ACTIVE. You have authorization to edit pricing, stay dates, charges, and payments.'
                  : isAdmin
                  ? 'This stay is completed and locked. As Super Admin, click "Unlock Admin Edits" to make corrections.'
                  : 'This stay is completed and locked. Receptionist staff are restricted from editing completed records.'}
              </span>
            </div>
          </div>
          {isAdmin && (
            <button
              className={`btn btn-sm ${adminOverrideUnlocked ? 'btn-outline-dark fw-bold' : 'btn-warning text-dark fw-bold'} flex-shrink-0 shadow-sm`}
              onClick={() => setAdminOverrideUnlocked(!adminOverrideUnlocked)}
            >
              <i className={`bi ${adminOverrideUnlocked ? 'bi-lock-fill' : 'bi-unlock-fill'} me-1`}></i>
              {adminOverrideUnlocked ? 'Lock Stay Records' : 'Unlock Admin Edits'}
            </button>
          )}
        </div>
      )}

      {/* Top Professional Header Bar */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '14px', overflow: 'hidden' }}>
        <div className="card-body p-4 bg-white">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <div className="d-flex align-items-center gap-3 mb-1">
                <span className="badge bg-primary fs-6 px-3 py-2" style={{ borderRadius: '8px' }}>
                  Room {stay.room_detail?.room_number}
                </span>
                <h4 className="fw-bold m-0 text-dark" style={{ letterSpacing: '-0.5px' }}>
                  Stay #{stay.stay_number}
                </h4>
                <StatusBadge status={stay.status} />
              </div>
              <div className="text-muted small">
                <i className="bi bi-person-fill me-1 text-primary"></i>
                Primary Guest: <strong className="text-dark">{cust.full_name}</strong> ({cust.mobile}) | Room Type: <strong>{stay.room_detail?.room_type_name}</strong>
              </div>
            </div>

            {/* Top Action Suite */}
            <div className="d-flex gap-2 flex-wrap">
              {canEdit && (
                <button className="btn btn-outline-dark fw-semibold" onClick={openEditDatesModal}>
                  <i className="bi bi-calendar-event me-1 text-primary"></i> Edit Check-In/Out Times
                </button>
              )}
              <button className="btn btn-outline-primary fw-semibold" onClick={() => setShowInvoiceModal(true)}>
                <i className="bi bi-printer me-1"></i> Invoice
              </button>
              {stay.status === 'CHECKED_IN' && (
                <Link to={`/checkout/${stay.id}`} className="btn btn-danger fw-bold shadow">
                  <i className="bi bi-box-arrow-right me-1"></i> Proceed to Checkout
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Custom Styled Tabs */}
      <div className="mb-4">
        <ul className="nav nav-pills gap-2 p-1 bg-white rounded-3 shadow-sm border">
          <li className="nav-item">
            <button className={`nav-link fw-semibold px-3 py-2 ${activeTab === 'overview' ? 'active bg-primary' : 'text-dark'}`} onClick={() => setActiveTab('overview')}>
              <i className="bi bi-speedometer2 me-2"></i>Overview
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link fw-semibold px-3 py-2 ${activeTab === 'guests' ? 'active bg-primary' : 'text-dark'}`} onClick={() => setActiveTab('guests')}>
              <i className="bi bi-people me-2"></i>Guests <span className="badge bg-secondary ms-1">{1 + (stay.guests?.length || 0)}</span>
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link fw-semibold px-3 py-2 ${activeTab === 'charges' ? 'active bg-primary' : 'text-dark'}`} onClick={() => setActiveTab('charges')}>
              <i className="bi bi-cart3 me-2"></i>Charges <span className="badge bg-secondary ms-1">{stay.extra_charges?.length || 0}</span>
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link fw-semibold px-3 py-2 ${activeTab === 'payments' ? 'active bg-primary' : 'text-dark'}`} onClick={() => setActiveTab('payments')}>
              <i className="bi bi-credit-card me-2"></i>Payments <span className="badge bg-secondary ms-1">{stay.payments?.length || 0}</span>
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link fw-semibold px-3 py-2 ${activeTab === 'documents' ? 'active bg-primary' : 'text-dark'}`} onClick={() => setActiveTab('documents')}>
              <i className="bi bi-shield-check me-2"></i>Photos & Documents
            </button>
          </li>
        </ul>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
              <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center border-bottom">
                <h5 className="m-0 fw-bold text-dark"><i className="bi bi-info-circle-fill text-primary me-2"></i>Stay Information & Record</h5>
                {canEdit && (
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-outline-primary" onClick={openEditGuestModal}>
                      <i className="bi bi-person-gear me-1"></i> Edit Guest & Documents
                    </button>
                    <button className="btn btn-sm btn-outline-dark" onClick={openEditDatesModal}>
                      <i className="bi bi-pencil me-1"></i> Edit Dates & Times
                    </button>
                  </div>
                )}
              </div>
              <div className="card-body p-4">
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded border">
                      <div className="text-muted small fw-semibold">Assigned Room</div>
                      <div className="fw-bold fs-5 text-dark">Room {stay.room_detail?.room_number} ({stay.room_detail?.room_type_name})</div>
                      <div className="text-primary small fw-semibold mt-1">Rate: {formatCurrency(stay.room_rate)} / night</div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded border">
                      <div className="text-muted small fw-semibold">Primary Guest Details</div>
                      <div className="fw-bold fs-5 text-primary">{cust.full_name}</div>
                      <div className="small text-muted">{cust.mobile} | {cust.id_type}: {cust.id_number || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded border">
                      <div className="text-muted small fw-semibold">Check-In Date & Time</div>
                      <div className="fw-bold text-dark fs-6 mt-1">
                        <i className="bi bi-calendar-event me-2 text-primary"></i>
                        {formatDate(stay.check_in_date)} @ {stay.check_in_time?.substring(0, 5) || '12:00'}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded border">
                      <div className="text-muted small fw-semibold">Expected / Actual Check-Out</div>
                      <div className="fw-bold text-dark fs-6 mt-1">
                        <i className="bi bi-calendar-check me-2 text-danger"></i>
                        {formatDate(stay.actual_checkout_date || stay.expected_checkout_date)} @ {(stay.actual_checkout_time || stay.expected_checkout_time)?.substring(0, 5) || '11:00'}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded border">
                      <div className="text-muted small fw-semibold">Guest Occupancy</div>
                      <div className="fw-bold text-dark">{stay.adults} Adult(s), {stay.children} Child(ren)</div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded border">
                      <div className="text-muted small fw-semibold">Discount Configuration</div>
                      <div className="fw-bold text-dark">
                        {stay.discount_value > 0 ? (
                          <span className="text-success">
                            {stay.discount_type === 'PERCENTAGE' ? `${stay.discount_value}%` : formatCurrency(stay.discount_value)}
                            {stay.discount_reason ? ` (${stay.discount_reason})` : ''}
                          </span>
                        ) : (
                          <span className="text-muted">No discount applied</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Premium Financial Summary Card */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-lg bg-white" style={{ borderRadius: '14px', overflow: 'hidden' }}>
              <div className="card-header text-white py-3 px-4" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
                <div className="d-flex align-items-center justify-content-between">
                  <h5 className="m-0 fw-bold">
                    <i className="bi bi-calculator me-2 text-primary"></i>Financial Summary
                  </h5>
                  {canEdit && (
                    <button
                      className="btn btn-sm btn-outline-light fw-bold"
                      onClick={openEditStayModal}
                      title="Edit Room Rate & Discount"
                    >
                      <i className="bi bi-pencil-square me-1"></i> Edit Price
                    </button>
                  )}
                </div>
              </div>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                  <span className="text-muted">Room Charges ({bill.room_days} nights @ {formatCurrency(bill.room_rate)}):</span>
                  <strong className="text-dark">{formatCurrency(bill.room_amount)}</strong>
                </div>
                <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                  <span className="text-muted">Extra Charges:</span>
                  <strong className="text-dark">{formatCurrency(bill.extra_charges_total)}</strong>
                </div>
                <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                  <span className="text-muted fw-semibold">Subtotal:</span>
                  <strong className="text-dark fw-bold">{formatCurrency(bill.subtotal)}</strong>
                </div>

                {bill.discount_amount > 0 ? (
                  <div className="d-flex justify-content-between align-items-center py-2 border-bottom text-danger">
                    <span>Discount ({bill.discount_reason || 'Applied'}):</span>
                    <strong className="text-danger">-{formatCurrency(bill.discount_amount)}</strong>
                  </div>
                ) : null}

                {bill.tax_amount > 0 && (
                  <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span className="text-muted">GST Tax ({bill.tax_percentage}%):</span>
                    <strong className="text-dark">{formatCurrency(bill.tax_amount)}</strong>
                  </div>
                )}

                <div className="d-flex justify-content-between align-items-center py-3 border-bottom fs-5">
                  <span className="fw-bold text-dark">Grand Total:</span>
                  <strong className="text-primary fw-bold">{formatCurrency(bill.grand_total)}</strong>
                </div>

                {/* Edit Price & Discount Button in Card Body */}
                {canEdit && (
                  <button
                    type="button"
                    className="btn btn-outline-primary w-100 fw-bold my-2 py-2 shadow-sm"
                    onClick={openEditStayModal}
                  >
                    <i className="bi bi-sliders me-1"></i> Edit Room Rate & Discount
                  </button>
                )}

                <div className="d-flex justify-content-between align-items-center py-2 border-bottom text-success mt-1">
                  <span className="fw-semibold"><i className="bi bi-check-circle-fill me-1"></i>Total Paid:</span>
                  <strong className="text-success">{formatCurrency(bill.total_paid)}</strong>
                </div>

                <div className={`d-flex justify-content-between align-items-center py-3 px-3 rounded mt-3 border ${bill.balance > 0 ? 'bg-danger-subtle border-danger' : 'bg-success-subtle border-success'}`}>
                  <span className="fw-bold text-dark fs-6">Balance Due:</span>
                  <strong className={`fs-5 fw-bold ${bill.balance > 0 ? 'text-danger' : 'text-success'}`}>
                    {formatCurrency(bill.balance)}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GUESTS */}
      {activeTab === 'guests' && (
        <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
          <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center border-bottom">
            <h5 className="m-0 fw-bold text-dark"><i className="bi bi-people-fill me-2 text-primary"></i>Guest Roster</h5>
            {canEdit && (
              <button className="btn btn-primary fw-bold" onClick={() => setShowGuestModal(true)}>
                <i className="bi bi-person-plus-fill me-1"></i> Add Additional Guest
              </button>
            )}
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle m-0">
                <thead className="table-light">
                  <tr>
                    <th>Guest Role</th>
                    <th>Full Name</th>
                    <th>Relationship</th>
                    <th>Gender / Age</th>
                    <th>Mobile</th>
                    <th>ID Proof Details</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="table-primary-subtle">
                    <td><span className="badge bg-primary">Primary Guest</span></td>
                    <td className="fw-bold">{cust.full_name}</td>
                    <td>Self</td>
                    <td>{cust.gender}</td>
                    <td>{cust.mobile}</td>
                    <td>{cust.id_type}: {cust.id_number || 'N/A'}</td>
                    <td className="text-center">
                      {canEdit ? (
                        <button className="btn btn-sm btn-outline-primary" onClick={openEditGuestModal}>
                          <i className="bi bi-pencil me-1"></i> Edit Profile
                        </button>
                      ) : (
                        <span className="badge bg-light text-muted border">Locked</span>
                      )}
                    </td>
                  </tr>
                  {stay.guests?.map((g) => (
                    <tr key={g.id}>
                      <td><span className="badge bg-secondary">Additional Guest</span></td>
                      <td className="fw-semibold">{g.guest_name}</td>
                      <td>{g.relationship || 'Guest'}</td>
                      <td>{g.gender} / {g.age ? `${g.age} yrs` : 'N/A'}</td>
                      <td>{g.mobile || 'N/A'}</td>
                      <td>{g.id_type ? `${g.id_type}: ${g.id_number || ''}` : 'N/A'}</td>
                      <td className="text-center">
                        {canEdit ? (
                          <button className="btn btn-sm btn-outline-danger" onClick={() => requestDeleteGuest(g.id, g.guest_name)}>
                            <i className="bi bi-trash"></i> Remove
                          </button>
                        ) : (
                          <span className="badge bg-light text-muted border">Locked</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CHARGES */}
      {activeTab === 'charges' && (
        <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
          <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center border-bottom">
            <h5 className="m-0 fw-bold text-dark"><i className="bi bi-cart-plus-fill me-2 text-primary"></i>Extra Charges & Services</h5>
            {canEdit && (
              <button className="btn btn-primary fw-bold" onClick={() => setShowChargeModal(true)}>
                <i className="bi bi-plus-circle-fill me-1"></i> Add Extra Charge
              </button>
            )}
          </div>
          <div className="card-body p-0">
            {!stay.extra_charges || stay.extra_charges.length === 0 ? (
              <div className="text-center py-5 px-3">
                <i className="bi bi-cart-x text-muted mb-2 d-block" style={{ fontSize: '3rem' }}></i>
                <h5 className="fw-bold text-dark">No Extra Charges Added</h5>
                <p className="text-muted small max-w-md mx-auto">No extra beds, meals, laundry, or room service items were charged for this stay.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle m-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ minWidth: '150px' }}>Item / Service</th>
                      <th style={{ minWidth: '180px' }}>Date & Time</th>
                      <th style={{ minWidth: '200px' }}>Description</th>
                      <th className="text-center" style={{ width: '80px' }}>Qty</th>
                      <th className="text-end" style={{ minWidth: '120px' }}>Unit Price</th>
                      <th className="text-end" style={{ minWidth: '130px' }}>Total Amount</th>
                      <th className="text-center" style={{ width: '100px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stay.extra_charges.map((c) => (
                      <tr key={c.id}>
                        <td className="fw-bold text-dark">
                          <i className="bi bi-tag-fill me-2 text-primary"></i>
                          {c.charge_type_name || 'Extra Charge'}
                        </td>
                        <td className="text-dark font-medium">{formatDateTime(c.charge_date)}</td>
                        <td className="text-secondary">{c.description || '-'}</td>
                        <td className="text-center fw-semibold">{c.quantity}</td>
                        <td className="text-end">{formatCurrency(c.unit_price)}</td>
                        <td className="text-end fw-bold text-primary fs-6">{formatCurrency(c.amount)}</td>
                        <td className="text-center">
                          {canEdit ? (
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => requestDeleteCharge(c.id, c.charge_type_name)}
                              title="Delete Charge"
                            >
                              <i className="bi bi-trash"></i> Delete
                            </button>
                          ) : (
                            <span className="badge bg-light text-muted border">Locked</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: PAYMENTS */}
      {activeTab === 'payments' && (
        <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
          <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center border-bottom">
            <h5 className="m-0 fw-bold text-dark"><i className="bi bi-cash-stack me-2 text-success"></i>Payments Ledger</h5>
            {canEdit && (
              <button className="btn btn-success fw-bold" onClick={openRecordPaymentModal}>
                <i className="bi bi-plus-circle-fill me-1"></i> Record Payment
              </button>
            )}
          </div>
          <div className="card-body p-0">
            {!stay.payments || stay.payments.length === 0 ? (
              <div className="text-center py-5 px-3">
                <i className="bi bi-wallet2 text-muted mb-2 d-block" style={{ fontSize: '3rem' }}></i>
                <h5 className="fw-bold text-dark">No Payments Recorded</h5>
                <p className="text-muted small">No payment transactions recorded for this stay.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle m-0">
                  <thead className="table-light">
                    <tr>
                      <th>Payment #</th>
                      <th>Date & Time</th>
                      <th>Method</th>
                      <th>Ref / Txn ID</th>
                      <th className="text-end">Amount Paid</th>
                      <th className="text-center" style={{ width: '160px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stay.payments.map((p) => (
                      <tr key={p.id}>
                        <td className="fw-bold text-primary">{p.payment_number}</td>
                        <td>{formatDateTime(p.payment_date)}</td>
                        <td><span className="badge bg-secondary">{p.payment_method}</span></td>
                        <td>{p.transaction_reference || 'N/A'}</td>
                        <td className="text-end fw-bold text-success fs-6">{formatCurrency(p.amount)}</td>
                        <td className="text-center">
                          {canEdit ? (
                            <div className="btn-group btn-group-sm">
                              <button className="btn btn-outline-primary" onClick={() => openEditPaymentModal(p)} title="Edit Payment">
                                <i className="bi bi-pencil"></i> Edit
                              </button>
                              <button className="btn btn-outline-danger" onClick={() => requestDeletePayment(p.id, p.payment_number, p.amount)} title="Delete Payment">
                                <i className="bi bi-trash"></i> Delete
                              </button>
                            </div>
                          ) : (
                            <span className="badge bg-light text-muted border">Locked</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: PHOTOS & MULTIPLE DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
          <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center border-bottom">
            <h5 className="m-0 fw-bold text-dark"><i className="bi bi-shield-check me-2 text-primary"></i>Guest Photos & Identity Proof Documents</h5>
            {canEdit && (
              <button className="btn btn-primary fw-bold" onClick={() => setShowExtraDocModal(true)}>
                <i className="bi bi-file-earmark-plus me-1"></i> + Upload Additional Document
              </button>
            )}
          </div>
          <div className="card-body p-4">
            <div className="row g-4">
              {/* Photo Snapshot Panel */}
              <div className="col-md-4">
                <div className="p-3 border rounded text-center bg-light h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="fw-bold mb-2 text-dark"><i className="bi bi-camera-fill me-1 text-primary"></i>Customer Photo Snapshot</div>
                    {cust.photo ? (
                      <img src={cust.photo} alt="Guest" className="img-fluid rounded shadow-sm border mb-3" style={{ maxHeight: '180px', objectFit: 'cover' }} />
                    ) : (
                      <div className="alert alert-warning m-0 py-3">No photo captured</div>
                    )}
                  </div>
                  <div className="d-flex justify-content-center gap-1 flex-wrap mt-3">
                    {cust.photo ? (
                      <>
                        <a href={cust.photo} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary fw-semibold">
                          <i className="bi bi-eye"></i> View
                        </a>
                        {canEdit && (
                          <>
                            <button className="btn btn-sm btn-outline-warning fw-semibold" onClick={openEditGuestModal}>
                              <i className="bi bi-arrow-repeat"></i> Change
                            </button>
                            <button className="btn btn-sm btn-outline-danger fw-semibold" onClick={requestRemovePhoto}>
                              <i className="bi bi-trash"></i> Remove
                            </button>
                          </>
                        )}
                      </>
                    ) : (
                      canEdit && (
                        <button className="btn btn-sm btn-primary fw-semibold" onClick={openEditGuestModal}>
                          <i className="bi bi-camera me-1"></i> Capture / Upload Photo
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* ID Proof - Front Side Panel */}
              <div className="col-md-4">
                <div className="p-3 border rounded text-center bg-light h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="fw-bold mb-2 text-dark"><i className="bi bi-card-heading me-1 text-primary"></i>{cust.id_type || 'ID Proof'} (Front Side)</div>
                    {cust.id_document ? (
                      <div className="py-3">
                        <i className="bi bi-file-earmark-check text-success display-4 d-block mb-1"></i>
                        <span className="small text-muted">Front Document Uploaded</span>
                      </div>
                    ) : (
                      <div className="alert alert-secondary m-0 py-3">No front document uploaded</div>
                    )}
                  </div>
                  <div className="d-flex justify-content-center gap-1 flex-wrap mt-3">
                    {cust.id_document ? (
                      <>
                        <a href={cust.id_document} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary fw-semibold">
                          <i className="bi bi-eye"></i> View
                        </a>
                        {canEdit && (
                          <>
                            <button className="btn btn-sm btn-outline-warning fw-semibold" onClick={openEditGuestModal}>
                              <i className="bi bi-arrow-repeat"></i> Change
                            </button>
                            <button className="btn btn-sm btn-outline-danger fw-semibold" onClick={requestRemoveIdFront}>
                              <i className="bi bi-trash"></i> Remove
                            </button>
                          </>
                        )}
                      </>
                    ) : (
                      canEdit && (
                        <button className="btn btn-sm btn-outline-primary fw-semibold" onClick={openEditGuestModal}>
                          <i className="bi bi-upload me-1"></i> Upload Front Side
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* ID Proof - Back Side Panel */}
              <div className="col-md-4">
                <div className="p-3 border rounded text-center bg-light h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="fw-bold mb-2 text-dark"><i className="bi bi-card-heading me-1 text-primary"></i>{cust.id_type || 'ID Proof'} (Back Side)</div>
                    {cust.id_document_back ? (
                      <div className="py-3">
                        <i className="bi bi-file-earmark-check text-success display-4 d-block mb-1"></i>
                        <span className="small text-muted">Back Document Uploaded</span>
                      </div>
                    ) : (
                      <div className="alert alert-secondary m-0 py-3">No back document uploaded</div>
                    )}
                  </div>
                  <div className="d-flex justify-content-center gap-1 flex-wrap mt-3">
                    {cust.id_document_back ? (
                      <>
                        <a href={cust.id_document_back} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary fw-semibold">
                          <i className="bi bi-eye"></i> View
                        </a>
                        {canEdit && (
                          <>
                            <button className="btn btn-sm btn-outline-warning fw-semibold" onClick={openEditGuestModal}>
                              <i className="bi bi-arrow-repeat"></i> Change
                            </button>
                            <button className="btn btn-sm btn-outline-danger fw-semibold" onClick={requestRemoveIdBack}>
                              <i className="bi bi-trash"></i> Remove
                            </button>
                          </>
                        )}
                      </>
                    ) : (
                      canEdit && (
                        <button className="btn btn-sm btn-outline-primary fw-semibold" onClick={openEditGuestModal}>
                          <i className="bi bi-upload me-1"></i> Upload Back Side
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Uploaded Documents */}
              <div className="col-12 mt-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="fw-bold text-dark fs-6"><i className="bi bi-folder-fill text-warning me-2"></i>Additional Document Attachments</div>
                  {canEdit && (
                    <button className="btn btn-sm btn-outline-primary fw-semibold" onClick={() => setShowExtraDocModal(true)}>
                      <i className="bi bi-plus-circle me-1"></i> Add Document
                    </button>
                  )}
                </div>
                {!cust.documents || cust.documents.length === 0 ? (
                  <div className="alert alert-light border text-center py-4 text-muted">
                    <i className="bi bi-folder-x fs-2 d-block mb-1"></i>
                    No additional documents attached.
                  </div>
                ) : (
                  <div className="row g-3">
                    {cust.documents.map((doc) => (
                      <div key={doc.id} className="col-md-4 col-sm-6">
                        <div className="p-3 border rounded bg-white shadow-sm d-flex justify-content-between align-items-center">
                          <div>
                            <div className="fw-bold text-dark">{doc.title}</div>
                            <div className="text-muted small">{formatDate(doc.created_at)}</div>
                          </div>
                          <div className="btn-group btn-group-sm">
                            <a href={doc.document_file} target="_blank" rel="noreferrer" className="btn btn-outline-primary" title="View Document">
                              <i className="bi bi-eye"></i>
                            </a>
                            {canEdit && (
                              <button className="btn btn-outline-danger" onClick={() => requestDeleteExtraDocument(doc.id, doc.title)} title="Delete Document">
                                <i className="bi bi-trash"></i>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}

      {/* Reusable Professional Delete Confirm Modal */}
      <ConfirmModal
        show={confirmModal.show}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        loading={confirmModal.loading}
        onClose={() => setConfirmModal({ show: false })}
        onConfirm={confirmModal.onConfirm}
      />

      {/* 1. Edit Stay & Pricing Modal */}
      {showEditStayModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-sliders me-2 text-primary"></i>Edit Room Rate, Discount & Occupancy
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowEditStayModal(false)}></button>
              </div>
              <form onSubmit={handleSaveStayDetails}>
                <div className="modal-body p-4">
                  {actionError && <div className="alert alert-danger py-2">{actionError}</div>}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Room Night Rate (₹) *</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control fw-bold"
                        required
                        value={editRoomRate}
                        onChange={(e) => setEditRoomRate(e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Discount Type</label>
                      <select className="form-select" value={editDiscountType} onChange={(e) => setEditDiscountType(e.target.value)}>
                        <option value="FIXED">Fixed Amount (₹)</option>
                        <option value="PERCENTAGE">Percentage (%)</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Discount Value</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={editDiscountValue}
                        onChange={(e) => setEditDiscountValue(e.target.value)}
                      />
                    </div>
                    <div className="col-md-12">
                      <label className="form-label small fw-bold text-dark">Discount Reason / Description</label>
                      <div className="input-group mb-1.5">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Special Guest / Corporate Partner / Management Offer"
                          value={editDiscountReason}
                          onChange={(e) => setEditDiscountReason(e.target.value)}
                        />
                        {editDiscountReason && (
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => setEditDiscountReason('')}
                            title="Clear"
                          >
                            <i className="bi bi-x-lg"></i>
                          </button>
                        )}
                      </div>
                      <div className="d-flex gap-1.5 flex-wrap align-items-center">
                        <span className="extra-small text-muted me-1">Quick Presets:</span>
                        {['Special Guest', 'VIP Guest', 'Corporate Partner', 'Management Offer', 'Long Stay'].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            className={`btn btn-xs rounded-pill ${editDiscountReason === preset ? 'btn-primary shadow-xs fw-semibold' : 'btn-outline-secondary'} py-0.5 px-2.5`}
                            style={{ fontSize: '0.725rem' }}
                            onClick={() => setEditDiscountReason(preset)}
                          >
                            + {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Adults</label>
                      <input type="number" min="1" className="form-control" value={editAdults} onChange={(e) => setEditAdults(e.target.value)} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Children</label>
                      <input type="number" min="0" className="form-control" value={editChildren} onChange={(e) => setEditChildren(e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEditStayModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success fw-bold" disabled={actionLoading}>
                    {actionLoading ? 'Saving...' : 'Save & Update Bill'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 2. Edit Check-In / Out Dates & Times Modal */}
      {showEditDatesModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-clock-history me-2 text-primary"></i>Edit Check-In / Out Dates & Times
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowEditDatesModal(false)}></button>
              </div>
              <form onSubmit={handleSaveDates}>
                <div className="modal-body p-4">
                  {actionError && <div className="alert alert-danger py-2">{actionError}</div>}
                  <div className="row g-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold">Check-In Date</label>
                      <input type="date" className="form-control" required value={editCheckInDate} onChange={(e) => setEditCheckInDate(e.target.value)} />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold">Check-In Time</label>
                      <input type="time" className="form-control" required value={editCheckInTime} onChange={(e) => setEditCheckInTime(e.target.value)} />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold">Check-Out Date</label>
                      <input type="date" className="form-control" required value={editCheckoutDate} onChange={(e) => setEditCheckoutDate(e.target.value)} />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold">Check-Out Time</label>
                      <input type="time" className="form-control" required value={editCheckoutTime} onChange={(e) => setEditCheckoutTime(e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEditDatesModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success fw-bold" disabled={actionLoading}>
                    {actionLoading ? 'Saving...' : 'Save & Update Bill'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 3. Edit Primary Guest Profile & Photo / Front & Back ID Document Modal */}
      {showEditGuestModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-person-gear me-2 text-primary"></i>Edit Primary Guest & Front/Back Documents
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowEditGuestModal(false)}></button>
              </div>
              <form onSubmit={handleSavePrimaryGuest}>
                <div className="modal-body p-4">
                  {actionError && <div className="alert alert-danger py-2">{actionError}</div>}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">First Name *</label>
                      <input type="text" className="form-control" required value={guestFirstName} onChange={(e) => setGuestFirstName(e.target.value)} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Last Name</label>
                      <input type="text" className="form-control" value={guestLastName} onChange={(e) => setGuestLastName(e.target.value)} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Mobile *</label>
                      <input type="text" className="form-control" required value={guestMobile} onChange={(e) => setGuestMobile(e.target.value)} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Email</label>
                      <input type="email" className="form-control" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">ID Proof Type</label>
                      <select className="form-select" value={guestIdType} onChange={(e) => setGuestIdType(e.target.value)}>
                        <option value="Aadhaar">Aadhaar</option>
                        <option value="PAN">PAN</option>
                        <option value="Passport">Passport</option>
                        <option value="Driving Licence">Driving Licence</option>
                        <option value="Voter ID">Voter ID</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">ID Proof Number</label>
                      <input type="text" className="form-control" value={guestIdNumber} onChange={(e) => setGuestIdNumber(e.target.value)} />
                    </div>
                    <div className="col-md-12">
                      <label className="form-label fw-semibold">Address</label>
                      <textarea className="form-control" rows="2" value={guestAddress} onChange={(e) => setGuestAddress(e.target.value)}></textarea>
                    </div>

                    {/* Camera Capture / Photo Upload */}
                    <div className="col-md-12">
                      <label className="form-label fw-semibold d-block">Update Guest Photo</label>
                      <div className="d-flex align-items-center gap-2">
                        <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setShowGuestCamera(true)}>
                          <i className="bi bi-camera me-1"></i> Open Webcam
                        </button>
                        <input
                          type="file"
                          accept="image/*"
                          className="form-control form-control-sm"
                          onChange={(e) => {
                            if (e.target.files[0]) {
                              setGuestPhotoFile(e.target.files[0]);
                              setGuestPhotoPreview(URL.createObjectURL(e.target.files[0]));
                            }
                          }}
                        />
                      </div>
                      {guestPhotoPreview && (
                        <div className="mt-2">
                          <img src={guestPhotoPreview} alt="Guest Preview" className="img-thumbnail rounded" style={{ height: '75px', objectFit: 'cover' }} />
                        </div>
                      )}
                    </div>

                    {/* ID Document Upload - Front Side */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold d-block">ID Document (Front Side)</label>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="form-control form-control-sm"
                        onChange={(e) => setGuestDocFile(e.target.files[0] || null)}
                      />
                    </div>

                    {/* ID Document Upload - Back Side */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold d-block">ID Document (Back Side)</label>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="form-control form-control-sm"
                        onChange={(e) => setGuestDocBackFile(e.target.files[0] || null)}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEditGuestModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success fw-bold" disabled={actionLoading}>
                    {actionLoading ? 'Saving...' : 'Save Profile & Documents'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 4. Upload Extra Document Modal */}
      {showExtraDocModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-file-earmark-plus me-2 text-primary"></i>Upload Additional Document
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowExtraDocModal(false)}></button>
              </div>
              <form onSubmit={handleUploadExtraDoc}>
                <div className="modal-body p-4">
                  {actionError && <div className="alert alert-danger py-2">{actionError}</div>}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Document Title *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Passport Back / Company ID / Visa"
                      value={extraDocTitle}
                      onChange={(e) => setExtraDocTitle(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Select File (PDF or Image) *</label>
                    <input
                      type="file"
                      className="form-control"
                      accept="image/*,application/pdf"
                      required
                      onChange={(e) => setExtraDocFile(e.target.files[0] || null)}
                    />
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowExtraDocModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary fw-bold" disabled={actionLoading}>
                    {actionLoading ? 'Uploading...' : 'Upload Document'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        show={showGuestCamera}
        onClose={() => setShowGuestCamera(false)}
        onCapture={(file, previewUrl) => {
          setGuestPhotoFile(file);
          setGuestPhotoPreview(previewUrl);
        }}
      />

      {/* Shared Modals */}
      <GuestFormModal show={showGuestModal} onClose={() => setShowGuestModal(false)} onSubmit={handleAddGuest} stayId={stay.id} />
      <ChargeFormModal show={showChargeModal} onClose={() => setShowChargeModal(false)} onSubmit={handleAddCharge} stayId={stay.id} />
      <PaymentFormModal
        show={showPaymentModal}
        onClose={() => { setShowPaymentModal(false); setEditPayment(null); }}
        onSubmit={handleAddOrUpdatePayment}
        stayId={stay.id}
        currentBalance={bill.balance}
        initialData={editPayment}
      />
      <InvoicePreviewModal show={showInvoiceModal} onClose={() => setShowInvoiceModal(false)} stayId={stay.id} />
    </div>
  );
};

export default StayDetails;
