import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { getStayByIdApi, updateStayApi, addStayGuestApi, updateStayGuestApi, deleteStayGuestApi } from '../api/stayApi';
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
import PageLoader from '../components/PageLoader';
import CameraCaptureModal from '../components/CameraCaptureModal';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import { compressImage } from '../utils/imageCompressor';
import { getMediaUrl } from '../utils/mediaUtils';

const StayDetails = () => {
  const { id } = useParams();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.is_superuser;
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  // Explicit Admin Override unlock state for completed stays
  const [adminOverrideUnlocked, setAdminOverrideUnlocked] = useState(false);

  // Modals
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [editingAdditionalGuest, setEditingAdditionalGuest] = useState(null);
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
  const [guestDocPreview, setGuestDocPreview] = useState('');
  const [guestDocBackFile, setGuestDocBackFile] = useState(null);
  const [guestDocBackPreview, setGuestDocBackPreview] = useState('');
  const [showGuestCamera, setShowGuestCamera] = useState(false);
  const [previewModalDoc, setPreviewModalDoc] = useState(null);

  // 4. Upload Extra Document Modal State
  const [showExtraDocModal, setShowExtraDocModal] = useState(false);
  const [extraDocTitle, setExtraDocTitle] = useState('');
  const [extraDocFile, setExtraDocFile] = useState(null);

  // 5. Notes Edit Modal State
  const [showEditNotesModal, setShowEditNotesModal] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const {
    data: stay = null,
    isLoading: loading,
    refetch: loadStayDetails,
  } = useQuery({
    queryKey: ['stay-details', id],
    queryFn: () => getStayByIdApi(id),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!id,
  });

  const isCompleted = stay?.status === 'CHECKED_OUT' || stay?.status === 'COMPLETED';
  // Strict rule: if completed, frozen for everyone by default unless Admin explicitly unlocks override
  const canEdit = !isCompleted || (isAdmin && adminOverrideUnlocked);

  // Open Guest & Stay Notes Edit Modal
  const openEditNotesModal = () => {
    if (!canEdit) return;
    setEditNotes(stay?.notes || '');
    setActionError('');
    setShowEditNotesModal(true);
  };

  // Save Notes Updates
  const handleSaveNotes = async (e) => {
    if (e) e.preventDefault();
    setSavingNotes(true);
    setActionError('');
    try {
      await updateStayApi(stay.id, { notes: editNotes });
      setShowEditNotesModal(false);
      showSuccess('Guest & stay notes updated successfully!', 'Notes Saved');
      queryClient.invalidateQueries({ queryKey: ['stay-details', id] });
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.notes?.[0] || err.response?.data?.error || err.response?.data?.detail || 'Failed to update notes.';
      setActionError(errMsg);
      showError(errMsg, 'Error Updating Notes');
    } finally {
      setSavingNotes(false);
    }
  };

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
      setGuestDocPreview(c.id_document || '');
      setGuestDocBackFile(null);
      setGuestDocBackPreview(c.id_document_back || '');
      setActionError('');
      setShowEditGuestModal(true);
    }
  };

  const openStayDocPreview = (urlOrFile, title) => {
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

  const handleGuestDocChange = (file) => {
    if (!file) return;
    setGuestDocFile(file);
    if (file.type.startsWith('image/')) {
      setGuestDocPreview(URL.createObjectURL(file));
    } else {
      setGuestDocPreview(URL.createObjectURL(file));
    }
  };

  const handleGuestDocBackChange = (file) => {
    if (!file) return;
    setGuestDocBackFile(file);
    if (file.type.startsWith('image/')) {
      setGuestDocBackPreview(URL.createObjectURL(file));
    } else {
      setGuestDocBackPreview(URL.createObjectURL(file));
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
      showSuccess('Room rate & pricing details updated successfully. Stay bill recalculated.', 'Room Rate Updated');
      queryClient.invalidateQueries({ queryKey: ['stay-details', id] });
    } catch (err) {
      setActionError(err.response?.data?.room_rate?.[0] || err.response?.data?.error || err.response?.data?.detail || 'Failed to update stay details.');
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
      queryClient.invalidateQueries({ queryKey: ['stay-details', id] });
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

      if (guestPhotoFile) {
        const compressed = await compressImage(guestPhotoFile);
        formData.append('photo', compressed);
      }
      if (guestDocFile) {
        const compressed = await compressImage(guestDocFile);
        formData.append('id_document', compressed);
      }
      if (guestDocBackFile) {
        const compressed = await compressImage(guestDocBackFile);
        formData.append('id_document_back', compressed);
      }

      await updateCustomerApi(stay.primary_customer, formData);
      setShowEditGuestModal(false);
      showSuccess('Primary guest profile updated successfully.', 'Guest Updated');
      queryClient.invalidateQueries({ queryKey: ['stay-details', id] });
      queryClient.invalidateQueries({ queryKey: ['customers'], refetchType: 'none' });
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
      queryClient.invalidateQueries({ queryKey: ['stay-details', id] });
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
          showSuccess('Guest photo snapshot removed successfully.', 'Photo Removed');
          queryClient.invalidateQueries({ queryKey: ['stay-details', id] });
        } catch (err) {
          showError('Error removing photo.', 'Removal Failed');
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
          showSuccess('Front ID document removed successfully.', 'Document Removed');
          queryClient.invalidateQueries({ queryKey: ['stay-details', id] });
        } catch (err) {
          showError('Error removing Front ID document.', 'Removal Failed');
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
          showSuccess('Back ID document removed successfully.', 'Document Removed');
          queryClient.invalidateQueries({ queryKey: ['stay-details', id] });
        } catch (err) {
          showError('Error removing Back ID document.', 'Removal Failed');
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
          showSuccess(`Document '${title}' deleted successfully.`, 'Document Deleted');
          queryClient.invalidateQueries({ queryKey: ['stay-details', id] });
        } catch (err) {
          showError('Error deleting document.', 'Deletion Failed');
          setConfirmModal({ show: false });
        }
      },
    });
  };

  const openAddGuestModal = () => {
    setEditingAdditionalGuest(null);
    setShowGuestModal(true);
  };

  const openEditAdditionalGuestModal = (guest) => {
    setEditingAdditionalGuest(guest);
    setShowGuestModal(true);
  };

  const handleAddOrUpdateGuest = async (formData, guestId) => {
    if (!canEdit) return;
    try {
      if (guestId || (editingAdditionalGuest && editingAdditionalGuest.id)) {
        const targetId = guestId || editingAdditionalGuest.id;
        await updateStayGuestApi(targetId, formData);
        showSuccess(`Guest '${formData.get('guest_name') || 'details'}' updated successfully.`, 'Guest Updated');
      } else {
        await addStayGuestApi(formData);
        showSuccess('Additional guest added successfully.', 'Guest Added');
      }
      setShowGuestModal(false);
      setEditingAdditionalGuest(null);
      queryClient.invalidateQueries({ queryKey: ['stay-details', id] });
    } catch (err) {
      console.error(err);
      showError('Error saving guest details.', 'Operation Failed');
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
        setConfirmModal({ show: false });
        const prevStay = queryClient.getQueryData(['stay-details', id]);
        queryClient.setQueryData(['stay-details', id], (old) => {
          if (!old) return old;
          return {
            ...old,
            additional_guests: (old.additional_guests || []).filter((g) => g.id !== guestId),
          };
        });
        showSuccess(`Guest '${guestName}' removed from stay roster.`, 'Guest Removed');

        try {
          await deleteStayGuestApi(guestId);
          queryClient.invalidateQueries({ queryKey: ['stay-details', id], refetchType: 'none' });
        } catch (err) {
          if (prevStay) queryClient.setQueryData(['stay-details', id], prevStay);
          showError('Error removing guest from roster.', 'Removal Failed');
        }
      },
    });
  };

  const handleAddCharge = async (chargeData) => {
    if (!canEdit) return;
    try {
      await createExtraChargeApi(chargeData);
      setShowChargeModal(false);
      showSuccess('Extra charge added to bill successfully.', 'Charge Added');
      queryClient.invalidateQueries({ queryKey: ['stay-details', id] });
    } catch (err) {
      showError('Error adding extra charge.', 'Failed');
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
        setConfirmModal({ show: false });
        const prevStay = queryClient.getQueryData(['stay-details', id]);
        queryClient.setQueryData(['stay-details', id], (old) => {
          if (!old) return old;
          return {
            ...old,
            extra_charges: (old.extra_charges || []).filter((c) => c.id !== chargeId),
          };
        });
        showSuccess(`Extra charge '${chargeName || 'item'}' deleted from bill.`, 'Charge Deleted');

        try {
          await deleteExtraChargeApi(chargeId);
          queryClient.invalidateQueries({ queryKey: ['stay-details', id] });
        } catch (err) {
          if (prevStay) queryClient.setQueryData(['stay-details', id], prevStay);
          showError('Error deleting charge.', 'Deletion Failed');
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
        showSuccess('Payment transaction record updated successfully.', 'Payment Updated');
      } else {
        await createPaymentApi(payData);
        showSuccess('Payment transaction recorded successfully.', 'Payment Recorded');
      }
      setShowPaymentModal(false);
      setEditPayment(null);
      queryClient.invalidateQueries({ queryKey: ['stay-details', id] });
    } catch (err) {
      const errMsg = err.response?.data?.error || err.response?.data?.payment_method?.[0] || err.response?.data?.detail || 'Error saving payment record.';
      showError(errMsg, 'Payment Failed');
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
        setConfirmModal({ show: false });
        const prevStay = queryClient.getQueryData(['stay-details', id]);
        queryClient.setQueryData(['stay-details', id], (old) => {
          if (!old) return old;
          return {
            ...old,
            payments: (old.payments || []).filter((p) => p.id !== paymentId),
          };
        });
        showSuccess(`Payment transaction #${paymentNumber} deleted.`, 'Payment Deleted');

        try {
          await deletePaymentApi(paymentId);
          queryClient.invalidateQueries({ queryKey: ['stay-details', id] });
        } catch (err) {
          if (prevStay) queryClient.setQueryData(['stay-details', id], prevStay);
          showError('Error deleting payment transaction.', 'Deletion Failed');
        }
      },
    });
  };

  if (loading) {
    return <PageLoader fullScreen={false} message="Loading Stay Management Dashboard..." />;
  }

  if (!stay) {
    return <div className="alert alert-danger">Stay record not found.</div>;
  }

  const bill = stay.bill_summary || {};
  const cust = stay.primary_customer_detail || {};

  const isStayOverdue = () => {
    if (!stay || stay.status !== 'CHECKED_IN') return false;
    const expDateStr = stay.expected_checkout_date || stay.check_in_date;
    const expTimeStr = stay.expected_checkout_time || '11:00';
    if (!expDateStr) return false;

    const expDateTimeStr = `${expDateStr}T${expTimeStr.length === 5 ? expTimeStr + ':00' : expTimeStr}`;
    const expDt = new Date(expDateTimeStr);
    const now = new Date();

    return now > expDt;
  };
  const isOverdue = isStayOverdue();
  const handleProceedToCheckout = () => {
    navigate(`/checkout/${stay.id}`);
  };

  return (
    <div>
      {/* Overdue Warning Alert Banner */}
      {isOverdue && (
        <div className="alert alert-danger border-danger d-flex align-items-center justify-content-between gap-3 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
          <div className="d-flex align-items-center gap-3">
            <div className="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '44px', height: '44px' }}>
              <i className="bi bi-clock-history fs-4"></i>
            </div>
            <div>
              <h6 className="fw-bold text-danger mb-0">Stay Checkout is Overdue!</h6>
              <span className="small text-secondary">
                The expected checkout datetime for Room <strong>{stay.room_detail?.room_number}</strong> ({formatDate(stay.expected_checkout_date)} @ {stay.expected_checkout_time?.substring(0, 5) || '11:00'}) has passed. Please proceed to checkout or extend stay.
              </span>
            </div>
          </div>
          <div className="d-flex gap-2">
            {canEdit && (
              <button className="btn btn-sm btn-outline-danger fw-bold shadow-sm" onClick={openEditDatesModal}>
                <i className="bi bi-calendar-plus me-1"></i> Extend Stay
              </button>
            )}
            <button type="button" className="btn btn-sm btn-danger fw-bold shadow-sm" onClick={handleProceedToCheckout}>
              <i className="bi bi-box-arrow-right me-1"></i> Proceed to Checkout
            </button>
          </div>
        </div>
      )}

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
                {isOverdue && (
                  <span className="badge bg-danger text-white fs-6 px-3 py-2 d-inline-flex align-items-center gap-1.5 shadow-sm animate-pulse" style={{ borderRadius: '8px' }}>
                    <i className="bi bi-exclamation-triangle-fill"></i> OVERDUE
                  </span>
                )}
              </div>
              <div className="text-muted small">
                <i className="bi bi-person-fill me-1 text-primary"></i>
                Primary Guest: <strong className="text-dark">{cust.full_name}</strong> ({cust.mobile}) | Room Type: <strong>{stay.room_detail?.room_type_name}</strong>
              </div>
            </div>

            {/* Top Action Suite */}
            <div className="d-flex gap-2 flex-wrap">
              <button className="btn btn-outline-primary fw-semibold" onClick={() => setShowInvoiceModal(true)}>
                <i className="bi bi-printer me-1"></i> Invoice
              </button>
              {stay.status === 'CHECKED_IN' && (
                <button type="button" className="btn btn-danger fw-bold shadow d-flex align-items-center gap-1.5" onClick={handleProceedToCheckout}>
                  <i className="bi bi-box-arrow-right"></i> Proceed to Checkout
                </button>
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
              </div>
              <div className="card-body p-4">
                <div className="row g-3">
                  
                  {/* Grid 1: Assigned Room & Nightly Rate */}
                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded-3 border h-100 position-relative transition-all">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <div className="text-muted small fw-semibold">Assigned Room</div>
                        {canEdit && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary border-0 p-1 lh-1 text-primary rounded-circle hover-bg-light"
                            onClick={openEditStayModal}
                            title="Update Room Rate & Pricing"
                          >
                            <i className="bi bi-pencil-square fs-6"></i>
                          </button>
                        )}
                      </div>
                      <div className="fw-bold fs-5 text-dark">Room {stay.room_detail?.room_number} ({stay.room_detail?.room_type_name})</div>
                      <div className="d-flex align-items-center gap-2 mt-1">
                        <span className="text-primary fw-bold">Rate: {formatCurrency(stay.room_rate)} / night</span>
                        {stay.room_detail?.base_price && parseFloat(stay.room_detail.base_price) !== parseFloat(stay.room_rate) && (
                          <span className="text-muted extra-small">(Standard: {formatCurrency(stay.room_detail.base_price)})</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Grid 2: Primary Guest Details */}
                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded-3 border h-100 position-relative transition-all">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <div className="text-muted small fw-semibold">Primary Guest Details</div>
                        {canEdit && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary border-0 p-1 lh-1 text-primary rounded-circle hover-bg-light"
                            onClick={openEditGuestModal}
                            title="Edit Primary Guest & Documents"
                          >
                            <i className="bi bi-pencil-square fs-6"></i>
                          </button>
                        )}
                      </div>
                      <div className="fw-bold fs-5 text-primary">{cust.full_name}</div>
                      <div className="small text-muted">{cust.mobile} | {cust.id_type}: {cust.id_number || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Grid 3: Check-In Date & Time */}
                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded-3 border h-100 position-relative transition-all">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <div className="text-muted small fw-semibold">Check-In Date & Time</div>
                        {canEdit && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary border-0 p-1 lh-1 text-primary rounded-circle hover-bg-light"
                            onClick={openEditDatesModal}
                            title="Edit Check-In Date & Time"
                          >
                            <i className="bi bi-pencil-square fs-6"></i>
                          </button>
                        )}
                      </div>
                      <div className="fw-bold text-dark fs-6 mt-1">
                        <i className="bi bi-calendar-event me-2 text-primary"></i>
                        {formatDate(stay.check_in_date)} @ {stay.check_in_time?.substring(0, 5) || '12:00'}
                      </div>
                    </div>
                  </div>

                  {/* Grid 4: Expected / Actual Check-Out */}
                  <div className="col-md-6">
                    <div className={`p-3 rounded-3 border h-100 position-relative transition-all ${isOverdue ? 'bg-danger-subtle border-danger' : 'bg-light'}`}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <div className="text-muted small fw-semibold">Expected / Actual Check-Out</div>
                        <div className="d-flex align-items-center gap-1.5">
                          {isOverdue && (
                            <span className="badge bg-danger text-white extra-small fw-bold px-2 py-0.5 shadow-sm">
                              <i className="bi bi-clock-history me-1"></i> OVERDUE
                            </span>
                          )}
                          {canEdit && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary border-0 p-1 lh-1 text-primary rounded-circle hover-bg-light"
                              onClick={openEditDatesModal}
                              title="Edit Check-Out Date & Time"
                            >
                              <i className="bi bi-pencil-square fs-6"></i>
                            </button>
                          )}
                        </div>
                      </div>
                      <div className={`fw-bold fs-6 ${isOverdue ? 'text-danger' : 'text-dark'}`}>
                        <i className="bi bi-calendar-check me-2 text-danger"></i>
                        {formatDate(stay.actual_checkout_date || stay.expected_checkout_date)} @ {(stay.actual_checkout_time || stay.expected_checkout_time)?.substring(0, 5) || '11:00'}
                      </div>
                    </div>
                  </div>

                  {/* Grid 5: Guest Occupancy */}
                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded-3 border h-100 position-relative transition-all">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <div className="text-muted small fw-semibold">Guest Occupancy</div>
                        {canEdit && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary border-0 p-1 lh-1 text-primary rounded-circle hover-bg-light"
                            onClick={openEditStayModal}
                            title="Edit Guest Occupancy"
                          >
                            <i className="bi bi-pencil-square fs-6"></i>
                          </button>
                        )}
                      </div>
                      <div className="fw-bold text-dark fs-6 mt-1">
                        <i className="bi bi-people me-2 text-primary"></i>
                        {stay.adults} Adult(s), {stay.children} Child(ren)
                      </div>
                    </div>
                  </div>

                  {/* Grid 6: Discount Configuration */}
                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded-3 border h-100 position-relative transition-all">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <div className="text-muted small fw-semibold">Discount Configuration</div>
                        {canEdit && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary border-0 p-1 lh-1 text-primary rounded-circle hover-bg-light"
                            onClick={openEditStayModal}
                            title="Edit Discount & Concessions"
                          >
                            <i className="bi bi-pencil-square fs-6"></i>
                          </button>
                        )}
                      </div>
                      <div className="fw-bold text-dark fs-6 mt-1">
                        {stay.discount_value > 0 ? (
                          <span className="text-success">
                            <i className="bi bi-tag-fill me-1.5"></i>
                            {stay.discount_type === 'PERCENTAGE' ? `${stay.discount_value}%` : formatCurrency(stay.discount_value)}
                            {stay.discount_reason ? ` (${stay.discount_reason})` : ''}
                          </span>
                        ) : (
                          <span className="text-muted">No discount applied</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Grid 7: Customer & Stay Notes / Special Instructions */}
                  <div className="col-12">
                    <div className="p-3 bg-light rounded-3 border h-100 position-relative transition-all">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="text-muted small fw-semibold d-flex align-items-center gap-1.5">
                          <i className="bi bi-chat-left-text-fill text-primary"></i>
                          <span>Customer &amp; Stay Notes / Special Instructions</span>
                        </div>
                        {canEdit && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary border-0 p-1 lh-1 text-primary rounded-circle hover-bg-light"
                            onClick={openEditNotesModal}
                            title="Edit Guest & Stay Notes"
                          >
                            <i className="bi bi-pencil-square fs-6"></i>
                          </button>
                        )}
                      </div>
                      {stay.notes && stay.notes.trim() ? (
                        <div className="text-dark small bg-white p-2.5 rounded-2 border" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                          {stay.notes}
                        </div>
                      ) : (
                        <div className="d-flex align-items-center justify-content-between text-muted small bg-white p-2.5 rounded-2 border border-dashed">
                          <span>No special requests, preferences, or notes recorded for this guest.</span>
                          {canEdit && (
                            <button
                              type="button"
                              className="btn btn-sm btn-link text-primary p-0 text-decoration-none fw-semibold extra-small"
                              onClick={openEditNotesModal}
                            >
                              + Add Note
                            </button>
                          )}
                        </div>
                      )}
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

                <div className="d-flex justify-content-between align-items-center py-2 border-bottom text-success mt-1">
                  <span className="fw-semibold"><i className="bi bi-check-circle-fill me-1"></i>Total Paid:</span>
                  <strong className="text-success">{formatCurrency(bill.total_paid)}</strong>
                </div>

                {bill.balance < -0.01 ? (
                  <div className="p-3 rounded mt-3 border bg-warning-subtle border-warning">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-bold text-dark fs-6">Refund Due to Guest:</span>
                      <strong className="fs-5 fw-bold text-danger">
                        {formatCurrency(Math.abs(bill.balance))}
                      </strong>
                    </div>
                    <span className="extra-small text-muted d-block">
                      Guest has overpaid. Excess amount can be returned upon checkout.
                    </span>
                  </div>
                ) : (
                  <div className={`d-flex justify-content-between align-items-center py-3 px-3 rounded mt-3 border ${bill.balance > 0.01 ? 'bg-danger-subtle border-danger' : 'bg-success-subtle border-success'}`}>
                    <span className="fw-bold text-dark fs-6">Balance Due:</span>
                    <strong className={`fs-5 fw-bold ${bill.balance > 0.01 ? 'text-danger' : 'text-success'}`}>
                      {bill.balance > 0.01 ? formatCurrency(bill.balance) : '₹0.00'}
                    </strong>
                  </div>
                )}
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
              <button className="btn btn-primary fw-bold" onClick={openAddGuestModal}>
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
                          <div className="d-flex justify-content-center gap-1.5">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => openEditAdditionalGuestModal(g)}
                              title="Edit Guest Details"
                            >
                              <i className="bi bi-pencil me-1"></i> Edit Profile
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => requestDeleteGuest(g.id, g.guest_name)}
                              title="Remove Guest"
                            >
                              <i className="bi bi-trash me-1"></i> Remove
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
                        <td className="text-end fw-bold fs-6">
                          {parseFloat(p.amount) < 0 ? (
                            <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2.5 py-1">
                              <i className="bi bi-arrow-up-right me-1"></i> Debit / Refund: -{formatCurrency(Math.abs(p.amount))}
                            </span>
                          ) : (
                            <span className="text-success">
                              <i className="bi bi-arrow-down-left me-1"></i> +{formatCurrency(p.amount)}
                            </span>
                          )}
                        </td>
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
                      <img src={getMediaUrl(cust.photo)} alt="Guest" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} className="img-fluid rounded shadow-sm border mb-3" style={{ maxHeight: '180px', objectFit: 'cover' }} />
                    ) : (
                      <div className="alert alert-warning m-0 py-3">No photo captured</div>
                    )}
                  </div>
                  <div className="d-flex justify-content-center gap-1 flex-wrap mt-3">
                    {cust.photo ? (
                      <>
                        <a href={getMediaUrl(cust.photo)} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary fw-semibold">
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
        <div className="modal fade show d-block modal-backdrop-animated" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1060 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-dialog-animated" style={{ maxWidth: '680px' }}>
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden modal-content-animated" style={{ backgroundColor: '#ffffff' }}>
              
              <div className="modal-header bg-white border-bottom py-3 px-4 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <div className="p-2.5 bg-primary-subtle text-primary rounded-3 d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                    <i className="bi bi-sliders fs-5"></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-dark m-0" style={{ fontSize: '1.15rem', letterSpacing: '-0.01em' }}>
                      Edit Room Rate, Discount & Occupancy
                    </h5>
                    <span className="text-secondary extra-small">
                      Update stay rate, apply discounts, and adjust guest occupancy counts.
                    </span>
                  </div>
                </div>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowEditStayModal(false)}></button>
              </div>

              <form onSubmit={handleSaveStayDetails}>
                <div className="modal-body p-4 bg-white" style={{ maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' }}>
                  {actionError && (
                    <div className="alert alert-danger border-danger py-2 rounded-3 small mb-3">
                      <i className="bi bi-exclamation-triangle-fill me-1.5"></i>{actionError}
                    </div>
                  )}

                  <div className="mb-4">
                    <div className="text-uppercase tracking-wider extra-small font-bold text-primary mb-2.5 d-flex align-items-center gap-1.5" style={{ fontSize: '0.725rem', letterSpacing: '0.05em' }}>
                      <i className="bi bi-currency-rupee"></i> Room Rate & Discount Settings
                    </div>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <label className="form-label small fw-semibold text-dark m-0">Room Night Rate (₹) *</label>
                          {stay.room_detail?.base_price && (
                            <button
                              type="button"
                              className="btn btn-link p-0 text-primary extra-small text-decoration-none fw-bold"
                              style={{ fontSize: '0.725rem' }}
                              onClick={() => setEditRoomRate(stay.room_detail.base_price)}
                            >
                              Reset Base ({formatCurrency(stay.room_detail.base_price)})
                            </button>
                          )}
                        </div>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-end-0 text-muted">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="form-control border-start-0 py-2.5 font-bold"
                            style={{ height: '46px', fontSize: '0.95rem' }}
                            required
                            value={editRoomRate}
                            onChange={(e) => setEditRoomRate(e.target.value)}
                          />
                        </div>
                        <div className="d-flex gap-1.5 mt-1.5">
                          {[-100, 100, 200, 500].map((adj) => (
                            <button
                              key={adj}
                              type="button"
                              className="btn btn-xs btn-outline-secondary py-0.5 px-2 rounded-2"
                              style={{ fontSize: '0.7rem' }}
                              onClick={() => setEditRoomRate((prev) => Math.max(0, parseFloat(prev || 0) + adj).toFixed(2))}
                            >
                              {adj > 0 ? `+₹${adj}` : `-₹${Math.abs(adj)}`}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-dark mb-1">Discount Type</label>
                        <select
                          className="form-select py-2.5 font-medium"
                          style={{ height: '46px', fontSize: '0.925rem' }}
                          value={editDiscountType}
                          onChange={(e) => setEditDiscountType(e.target.value)}
                        >
                          <option value="FIXED">Fixed Amount (₹)</option>
                          <option value="PERCENTAGE">Percentage (%)</option>
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-dark mb-1">Discount Value</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control py-2.5 font-medium"
                          style={{ height: '46px', fontSize: '0.925rem' }}
                          value={editDiscountValue}
                          onChange={(e) => setEditDiscountValue(e.target.value)}
                        />
                      </div>

                      <div className="col-md-12">
                        <label className="form-label small fw-semibold text-dark mb-1">Discount Reason / Description</label>
                        <div className="input-group mb-2">
                          <input
                            type="text"
                            className="form-control py-2.5"
                            style={{ height: '46px', fontSize: '0.925rem' }}
                            placeholder="e.g. Special Guest / Corporate Partner / Management Offer"
                            value={editDiscountReason}
                            onChange={(e) => setEditDiscountReason(e.target.value)}
                          />
                          {editDiscountReason && (
                            <button
                              type="button"
                              className="btn btn-outline-secondary px-3"
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
                              className={`btn btn-xs rounded-pill ${editDiscountReason === preset ? 'btn-primary shadow-xs fw-semibold' : 'btn-outline-secondary'} py-1 px-2.5`}
                              style={{ fontSize: '0.725rem' }}
                              onClick={() => setEditDiscountReason(preset)}
                            >
                              + {preset}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-uppercase tracking-wider extra-small font-bold text-primary mb-2.5 d-flex align-items-center gap-1.5" style={{ fontSize: '0.725rem', letterSpacing: '0.05em' }}>
                      <i className="bi bi-people"></i> Guest Occupancy
                    </div>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-dark mb-1">Adults</label>
                        <input
                          type="number"
                          min="1"
                          className="form-control py-2.5"
                          style={{ height: '46px', fontSize: '0.925rem' }}
                          value={editAdults}
                          onChange={(e) => setEditAdults(e.target.value)}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-dark mb-1">Children</label>
                        <input
                          type="number"
                          min="0"
                          className="form-control py-2.5"
                          style={{ height: '46px', fontSize: '0.925rem' }}
                          value={editChildren}
                          onChange={(e) => setEditChildren(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light border-top px-4 py-3 d-flex justify-content-between align-items-center">
                  <button type="button" className="btn btn-light border fw-semibold px-4 py-2 rounded-3" onClick={() => setShowEditStayModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary fw-bold px-4 py-2 rounded-3 shadow-sm d-flex align-items-center gap-2" disabled={actionLoading}>
                    {actionLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle-fill"></i> Save &amp; Update Bill
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 2. Edit Check-In / Out Dates & Times Modal */}
      {showEditDatesModal && (
        <div className="modal fade show d-block modal-backdrop-animated" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1060 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-dialog-animated" style={{ maxWidth: '620px' }}>
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden modal-content-animated" style={{ backgroundColor: '#ffffff' }}>
              
              <div className="modal-header bg-white border-bottom py-3 px-4 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <div className="p-2.5 bg-primary-subtle text-primary rounded-3 d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                    <i className="bi bi-clock-history fs-5"></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-dark m-0" style={{ fontSize: '1.15rem', letterSpacing: '-0.01em' }}>
                      Edit Check-In / Out Dates & Times
                    </h5>
                    <span className="text-secondary extra-small">
                      Adjust actual check-in datetime and expected checkout schedule.
                    </span>
                  </div>
                </div>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowEditDatesModal(false)}></button>
              </div>

              <form onSubmit={handleSaveDates}>
                <div className="modal-body p-4 bg-white">
                  {actionError && (
                    <div className="alert alert-danger border-danger py-2 rounded-3 small mb-3">
                      <i className="bi bi-exclamation-triangle-fill me-1.5"></i>{actionError}
                    </div>
                  )}

                  <div className="mb-4">
                    <div className="text-uppercase tracking-wider extra-small font-bold text-primary mb-2.5 d-flex align-items-center gap-1.5" style={{ fontSize: '0.725rem', letterSpacing: '0.05em' }}>
                      <i className="bi bi-box-arrow-in-right"></i> Check-In Schedule
                    </div>
                    <div className="row g-3">
                      <div className="col-6">
                        <label className="form-label small fw-semibold text-dark mb-1">Check-In Date *</label>
                        <input type="date" className="form-control py-2.5" style={{ height: '46px' }} required value={editCheckInDate} onChange={(e) => setEditCheckInDate(e.target.value)} />
                      </div>
                      <div className="col-6">
                        <label className="form-label small fw-semibold text-dark mb-1">Check-In Time *</label>
                        <input type="time" className="form-control py-2.5" style={{ height: '46px' }} required value={editCheckInTime} onChange={(e) => setEditCheckInTime(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-uppercase tracking-wider extra-small font-bold text-primary mb-2.5 d-flex align-items-center gap-1.5" style={{ fontSize: '0.725rem', letterSpacing: '0.05em' }}>
                      <i className="bi bi-box-arrow-right"></i> Expected Check-Out Schedule
                    </div>
                    <div className="row g-3">
                      <div className="col-6">
                        <label className="form-label small fw-semibold text-dark mb-1">Check-Out Date *</label>
                        <input type="date" className="form-control py-2.5" style={{ height: '46px' }} required value={editCheckoutDate} onChange={(e) => setEditCheckoutDate(e.target.value)} />
                      </div>
                      <div className="col-6">
                        <label className="form-label small fw-semibold text-dark mb-1">Check-Out Time *</label>
                        <input type="time" className="form-control py-2.5" style={{ height: '46px' }} required value={editCheckoutTime} onChange={(e) => setEditCheckoutTime(e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light border-top px-4 py-3 d-flex justify-content-between align-items-center">
                  <button type="button" className="btn btn-light border fw-semibold px-4 py-2 rounded-3" onClick={() => setShowEditDatesModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary fw-bold px-4 py-2 rounded-3 shadow-sm d-flex align-items-center gap-2" disabled={actionLoading}>
                    {actionLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-calendar-check-fill"></i> Save Schedule
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 3. Edit Primary Guest Profile & Photo / Front & Back ID Document Modal */}
      {showEditGuestModal && (
        <div className="modal fade show d-block modal-backdrop-animated" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1060 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-dialog-animated" style={{ maxWidth: '760px' }}>
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden modal-content-animated" style={{ backgroundColor: '#ffffff' }}>
              
              <div className="modal-header bg-white border-bottom py-3 px-4 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <div className="p-2.5 bg-primary-subtle text-primary rounded-3 d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                    <i className="bi bi-person-gear fs-5"></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-dark m-0" style={{ fontSize: '1.15rem', letterSpacing: '-0.01em' }}>
                      Edit Primary Guest Profile & ID Proofs
                    </h5>
                    <span className="text-secondary extra-small">
                      Update guest personal information, photo snapshot, and statutory ID document files.
                    </span>
                  </div>
                </div>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowEditGuestModal(false)}></button>
              </div>

              <form onSubmit={handleSavePrimaryGuest}>
                <div className="modal-body p-4 bg-white" style={{ maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' }}>
                  {actionError && (
                    <div className="alert alert-danger border-danger py-2 rounded-3 small mb-3">
                      <i className="bi bi-exclamation-triangle-fill me-1.5"></i>{actionError}
                    </div>
                  )}

                  <div className="mb-4"> 
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-dark mb-1">First Name *</label>
                        <input type="text" className="form-control py-2.5" style={{ height: '46px' }} required value={guestFirstName} onChange={(e) => setGuestFirstName(e.target.value)} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-dark mb-1">Last Name</label>
                        <input type="text" className="form-control py-2.5" style={{ height: '46px' }} value={guestLastName} onChange={(e) => setGuestLastName(e.target.value)} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-dark mb-1">Mobile Number *</label>
                        <input type="text" className="form-control py-2.5" style={{ height: '46px' }} required value={guestMobile} onChange={(e) => setGuestMobile(e.target.value)} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-dark mb-1">Email Address</label>
                        <input type="email" className="form-control py-2.5" style={{ height: '46px' }} value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} />
                      </div>
                      <div className="col-md-12">
                        <label className="form-label small fw-semibold text-dark mb-1">Permanent Residential Address</label>
                        <textarea className="form-control p-2.5" rows="2" value={guestAddress} onChange={(e) => setGuestAddress(e.target.value)}></textarea>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4"> 
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-dark mb-1">ID Proof Type</label>
                        <select className="form-select py-2.5" style={{ height: '46px' }} value={guestIdType} onChange={(e) => setGuestIdType(e.target.value)}>
                          <option value="Aadhaar">Aadhaar Card</option>
                          <option value="PAN">PAN Card</option>
                          <option value="Passport">Passport</option>
                          <option value="Driving Licence">Driving Licence</option>
                          <option value="Voter ID">Voter ID</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-dark mb-1">ID Proof Number</label>
                        <input type="text" className="form-control py-2.5" style={{ height: '46px' }} value={guestIdNumber} onChange={(e) => setGuestIdNumber(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div> 
                    <div className="row g-3">
                      {/* Guest Photo */}
                      <div className="col-md-12">
                        <div className="d-flex justify-content-between align-items-center mb-1.5">
                          <label className="form-label small fw-semibold text-dark m-0">Guest Profile Photo</label>
                          {(guestPhotoFile || guestPhotoPreview) && (
                            <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2.5 py-0.5 extra-small fw-bold d-inline-flex align-items-center gap-1">
                              <i className="bi bi-check-circle-fill"></i> {guestPhotoFile ? 'New Photo Attached' : '✓ Photo Verified'}
                            </span>
                          )}
                        </div>
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <button type="button" className="btn btn-outline-primary py-2 px-3 rounded-3 fw-semibold d-inline-flex align-items-center gap-1.5" onClick={() => setShowGuestCamera(true)}>
                            <i className="bi bi-camera fs-6"></i> Open Webcam
                          </button>
                          <label className="btn btn-light border py-2 px-3 rounded-3 fw-semibold m-0 cursor-pointer d-inline-flex align-items-center gap-1.5 hover-bg-light">
                            <i className="bi bi-upload fs-6"></i> Upload Photo File
                            <input
                              type="file"
                              accept="image/*"
                              className="d-none"
                              onChange={(e) => {
                                if (e.target.files[0]) {
                                  setGuestPhotoFile(e.target.files[0]);
                                  setGuestPhotoPreview(URL.createObjectURL(e.target.files[0]));
                                }
                              }}
                            />
                          </label>
                          {(guestPhotoFile || guestPhotoPreview) && (
                            <div className="d-flex align-items-center gap-2 bg-light p-1.5 rounded-3 border ms-auto">
                              <img
                                src={guestPhotoPreview}
                                alt="Guest Preview"
                                className="rounded-circle object-fit-cover cursor-pointer border shadow-2xs"
                                style={{ width: '42px', height: '42px' }}
                                onClick={() => openStayDocPreview(guestPhotoFile || guestPhotoPreview, 'Guest Photo')}
                              />
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary py-1 px-2.5 extra-small fw-semibold rounded-2 d-inline-flex align-items-center gap-1"
                                onClick={() => openStayDocPreview(guestPhotoFile || guestPhotoPreview, 'Guest Photo')}
                                title="Preview Photo"
                              >
                                <i className="bi bi-eye"></i> Preview
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-light border text-danger py-1 px-1.5 extra-small rounded-2 hover-bg-light"
                                onClick={() => { setGuestPhotoFile(null); setGuestPhotoPreview(''); }}
                                title="Remove Photo"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Front Side Document */}
                      <div className="col-md-6">
                        <div className="d-flex justify-content-between align-items-center mb-1.5">
                          <label className="form-label small fw-semibold text-dark m-0">ID Document (Front Side)</label>
                          {(guestDocFile || guestDocPreview) && (
                            <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2.5 py-0.5 extra-small fw-bold d-inline-flex align-items-center gap-1">
                              <i className="bi bi-check-circle-fill"></i> {guestDocFile ? 'New Document' : '✓ Verified Document'}
                            </span>
                          )}
                        </div>

                        {guestDocFile || guestDocPreview ? (
                          <div className="p-2.5 bg-light rounded-3 border border-success-subtle">
                            <div className="d-flex align-items-center justify-content-between gap-2">
                              <div className="d-flex align-items-center gap-2 overflow-hidden text-start">
                                {((guestDocFile && guestDocFile.type && guestDocFile.type.startsWith('image/')) || (typeof guestDocPreview === 'string' && (guestDocPreview.startsWith('blob:') || guestDocPreview.match(/\.(jpeg|jpg|png|webp|gif)/i)))) ? (
                                  <img
                                    src={guestDocPreview}
                                    alt="Front ID"
                                    className="rounded border object-fit-cover flex-shrink-0 cursor-pointer shadow-xs"
                                    style={{ width: '52px', height: '40px' }}
                                    onClick={() => openStayDocPreview(guestDocFile || guestDocPreview, 'Front ID Document')}
                                  />
                                ) : (
                                  <div className="bg-white text-danger p-1.5 rounded border d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '44px', height: '40px' }}>
                                    <i className="bi bi-file-earmark-pdf-fill fs-5"></i>
                                  </div>
                                )}
                                <div className="overflow-hidden">
                                  <div className="text-truncate small fw-bold text-dark" style={{ maxWidth: '140px' }}>
                                    {guestDocFile ? guestDocFile.name : (guestDocPreview.split('/').pop() || 'Front_ID_Document')}
                                  </div>
                                  <div className="text-muted extra-small" style={{ fontSize: '0.7rem' }}>
                                    {guestDocFile ? `New File (${(guestDocFile.size / 1024).toFixed(1)} KB)` : 'Document on File'}
                                  </div>
                                </div>
                              </div>

                              <div className="d-flex align-items-center gap-1 flex-shrink-0">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary py-1 px-2 extra-small fw-semibold rounded-2 d-inline-flex align-items-center gap-1"
                                  onClick={() => openStayDocPreview(guestDocFile || guestDocPreview, 'Front ID Document')}
                                  title="Preview Document"
                                >
                                  <i className="bi bi-eye"></i> Preview
                                </button>
                                <label
                                  className="btn btn-sm btn-light border py-1 px-2 extra-small fw-semibold rounded-2 m-0 cursor-pointer d-inline-flex align-items-center gap-1 hover-bg-light"
                                  title="Replace Document"
                                >
                                  <i className="bi bi-arrow-repeat"></i> Edit
                                  <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    className="d-none"
                                    onChange={(e) => {
                                      if (e.target.files[0]) handleGuestDocChange(e.target.files[0]);
                                    }}
                                  />
                                </label>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-light border text-danger py-1 px-1.5 extra-small rounded-2 hover-bg-light"
                                  onClick={() => { setGuestDocFile(null); setGuestDocPreview(''); }}
                                  title="Remove Document"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="border border-dashed p-3 rounded-3 text-center bg-light position-relative hover-bg-white transition-all">
                            <i className="bi bi-cloud-arrow-up text-primary fs-4 d-block mb-1"></i>
                            <div className="small fw-semibold text-dark">Upload ID Front</div>
                            <div className="text-muted extra-small">JPG, PNG or PDF</div>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              className="opacity-0 position-absolute start-0 top-0 w-100 h-100 cursor-pointer"
                              onChange={(e) => {
                                if (e.target.files[0]) handleGuestDocChange(e.target.files[0]);
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Back Side Document */}
                      <div className="col-md-6">
                        <div className="d-flex justify-content-between align-items-center mb-1.5">
                          <label className="form-label small fw-semibold text-dark m-0">ID Document (Back Side)</label>
                          {(guestDocBackFile || guestDocBackPreview) && (
                            <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2.5 py-0.5 extra-small fw-bold d-inline-flex align-items-center gap-1">
                              <i className="bi bi-check-circle-fill"></i> {guestDocBackFile ? 'New Document' : '✓ Verified Document'}
                            </span>
                          )}
                        </div>

                        {guestDocBackFile || guestDocBackPreview ? (
                          <div className="p-2.5 bg-light rounded-3 border border-success-subtle">
                            <div className="d-flex align-items-center justify-content-between gap-2">
                              <div className="d-flex align-items-center gap-2 overflow-hidden text-start">
                                {((guestDocBackFile && guestDocBackFile.type && guestDocBackFile.type.startsWith('image/')) || (typeof guestDocBackPreview === 'string' && (guestDocBackPreview.startsWith('blob:') || guestDocBackPreview.match(/\.(jpeg|jpg|png|webp|gif)/i)))) ? (
                                  <img
                                    src={guestDocBackPreview}
                                    alt="Back ID"
                                    className="rounded border object-fit-cover flex-shrink-0 cursor-pointer shadow-xs"
                                    style={{ width: '52px', height: '40px' }}
                                    onClick={() => openStayDocPreview(guestDocBackFile || guestDocBackPreview, 'Back ID Document')}
                                  />
                                ) : (
                                  <div className="bg-white text-danger p-1.5 rounded border d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '44px', height: '40px' }}>
                                    <i className="bi bi-file-earmark-pdf-fill fs-5"></i>
                                  </div>
                                )}
                                <div className="overflow-hidden">
                                  <div className="text-truncate small fw-bold text-dark" style={{ maxWidth: '140px' }}>
                                    {guestDocBackFile ? guestDocBackFile.name : (guestDocBackPreview.split('/').pop() || 'Back_ID_Document')}
                                  </div>
                                  <div className="text-muted extra-small" style={{ fontSize: '0.7rem' }}>
                                    {guestDocBackFile ? `New File (${(guestDocBackFile.size / 1024).toFixed(1)} KB)` : 'Document on File'}
                                  </div>
                                </div>
                              </div>

                              <div className="d-flex align-items-center gap-1 flex-shrink-0">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary py-1 px-2 extra-small fw-semibold rounded-2 d-inline-flex align-items-center gap-1"
                                  onClick={() => openStayDocPreview(guestDocBackFile || guestDocBackPreview, 'Back ID Document')}
                                  title="Preview Document"
                                >
                                  <i className="bi bi-eye"></i> Preview
                                </button>
                                <label
                                  className="btn btn-sm btn-light border py-1 px-2 extra-small fw-semibold rounded-2 m-0 cursor-pointer d-inline-flex align-items-center gap-1 hover-bg-light"
                                  title="Replace Document"
                                >
                                  <i className="bi bi-arrow-repeat"></i> Edit
                                  <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    className="d-none"
                                    onChange={(e) => {
                                      if (e.target.files[0]) handleGuestDocBackChange(e.target.files[0]);
                                    }}
                                  />
                                </label>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-light border text-danger py-1 px-1.5 extra-small rounded-2 hover-bg-light"
                                  onClick={() => { setGuestDocBackFile(null); setGuestDocBackPreview(''); }}
                                  title="Remove Document"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="border border-dashed p-3 rounded-3 text-center bg-light position-relative hover-bg-white transition-all">
                            <i className="bi bi-cloud-arrow-up text-primary fs-4 d-block mb-1"></i>
                            <div className="small fw-semibold text-dark">Upload ID Back</div>
                            <div className="text-muted extra-small">JPG, PNG or PDF</div>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              className="opacity-0 position-absolute start-0 top-0 w-100 h-100 cursor-pointer"
                              onChange={(e) => {
                                if (e.target.files[0]) handleGuestDocBackChange(e.target.files[0]);
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light border-top px-4 py-3 d-flex justify-content-between align-items-center">
                  <button type="button" className="btn btn-light border fw-semibold px-4 py-2 rounded-3" onClick={() => setShowEditGuestModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary fw-bold px-4 py-2 rounded-3 shadow-sm d-flex align-items-center gap-2" disabled={actionLoading}>
                    {actionLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-person-check-fill"></i> Save Profile &amp; Documents
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 4. Upload Extra Document Modal */}
      {showExtraDocModal && (
        <div className="modal fade show d-block modal-backdrop-animated" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1060 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-dialog-animated" style={{ maxWidth: '560px' }}>
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden modal-content-animated" style={{ backgroundColor: '#ffffff' }}>
              
              <div className="modal-header bg-white border-bottom py-3 px-4 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <div className="p-2.5 bg-primary-subtle text-primary rounded-3 d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                    <i className="bi bi-file-earmark-plus fs-5"></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-dark m-0" style={{ fontSize: '1.15rem', letterSpacing: '-0.01em' }}>
                      Upload Additional Document
                    </h5>
                    <span className="text-secondary extra-small">
                      Attach supplementary statutory or reservation document files.
                    </span>
                  </div>
                </div>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowExtraDocModal(false)}></button>
              </div>

              <form onSubmit={handleUploadExtraDoc}>
                <div className="modal-body p-4 bg-white">
                  {actionError && (
                    <div className="alert alert-danger border-danger py-2 rounded-3 small mb-3">
                      <i className="bi bi-exclamation-triangle-fill me-1.5"></i>{actionError}
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark mb-1">Document Title *</label>
                    <input
                      type="text"
                      className="form-control py-2.5"
                      style={{ height: '46px' }}
                      required
                      placeholder="e.g. Passport Back / Company ID / Visa"
                      value={extraDocTitle}
                      onChange={(e) => setExtraDocTitle(e.target.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark mb-1">Select File (PDF or Image) *</label>
                    <input
                      type="file"
                      className="form-control py-2"
                      style={{ height: '44px' }}
                      accept="image/*,application/pdf"
                      required
                      onChange={(e) => setExtraDocFile(e.target.files[0] || null)}
                    />
                  </div>
                </div>

                <div className="modal-footer bg-light border-top px-4 py-3 d-flex justify-content-between align-items-center">
                  <button type="button" className="btn btn-light border fw-semibold px-4 py-2 rounded-3" onClick={() => setShowExtraDocModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary fw-bold px-4 py-2 rounded-3 shadow-sm d-flex align-items-center gap-2" disabled={actionLoading}>
                    {actionLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-cloud-upload-fill"></i> Upload Document
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
        show={showGuestCamera}
        onClose={() => setShowGuestCamera(false)}
        onCapture={(file, previewUrl) => {
          setGuestPhotoFile(file);
          setGuestPhotoPreview(previewUrl);
        }}
      />

      {/* 5. Edit Guest & Stay Notes Modal */}
      {showEditNotesModal && (
        <div className="modal fade show d-block modal-backdrop-animated" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1060 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-dialog-animated" style={{ maxWidth: '540px' }}>
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden modal-content-animated" style={{ backgroundColor: '#ffffff' }}>
              
              <div className="modal-header bg-white border-bottom py-3 px-4 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <div className="p-2.5 bg-primary-subtle text-primary rounded-3 d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                    <i className="bi bi-chat-left-text-fill fs-5"></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-dark m-0" style={{ fontSize: '1.15rem', letterSpacing: '-0.01em' }}>
                      Customer &amp; Stay Notes
                    </h5>
                    <span className="text-secondary extra-small">
                      Add special guest requests, instructions, or operational remarks.
                    </span>
                  </div>
                </div>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowEditNotesModal(false)}></button>
              </div>

              <form onSubmit={handleSaveNotes}>
                <div className="modal-body p-4 bg-white">
                  <div className="bg-light p-3 rounded-3 border mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="text-muted small">Stay Reference:</span>
                      <strong className="text-dark">Stay #{stay.stay_number} (Room {stay.room_detail?.room_number})</strong>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted small">Primary Guest:</span>
                      <strong className="text-primary">{cust.full_name}</strong>
                    </div>
                  </div>

                  <div className="mb-2">
                    <label className="form-label small fw-semibold text-dark mb-1">
                      Guest Notes / Special Requests / Instructions
                    </label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="e.g. Guest requested quiet corner room, extra pillows, early checkout at 8 AM, luggage assistance..."
                      autoFocus
                    ></textarea>
                    <span className="text-muted extra-small mt-1.5 d-block">
                      <i className="bi bi-info-circle me-1"></i>Visible to reception and housekeeping staff throughout the active stay.
                    </span>
                  </div>
                </div>

                <div className="modal-footer bg-light border-top px-4 py-3 d-flex justify-content-between align-items-center">
                  <button type="button" className="btn btn-light border fw-semibold px-3.5 py-2 rounded-3" onClick={() => setShowEditNotesModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary fw-bold px-4 py-2 rounded-3 shadow-sm d-flex align-items-center gap-2"
                    disabled={savingNotes}
                  >
                    {savingNotes ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        Saving Notes...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle-fill"></i> Save Notes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Shared Modals */}
      {stay && (
        <>
          <GuestFormModal
            show={showGuestModal}
            onClose={() => { setShowGuestModal(false); setEditingAdditionalGuest(null); }}
            onSubmit={handleAddOrUpdateGuest}
            stayId={stay.id}
            editingGuest={editingAdditionalGuest}
          />
          <ChargeFormModal show={showChargeModal} onClose={() => setShowChargeModal(false)} onSubmit={handleAddCharge} stayId={stay.id} />
          <PaymentFormModal
            show={showPaymentModal}
            onClose={() => { setShowPaymentModal(false); setEditPayment(null); }}
            onSubmit={handleAddOrUpdatePayment}
            stayId={stay.id}
            currentBalance={bill.balance}
            initialData={editPayment}
            customerWalletCredit={stay.primary_customer_detail?.total_wallet_credit || stay.primary_customer_detail?.advance_credit || 0}
          />
          <InvoicePreviewModal show={showInvoiceModal} onClose={() => setShowInvoiceModal(false)} stayId={stay.id} />
        </>
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

export default StayDetails;
