import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getBookingsApi, getBookingByIdApi, checkInBookingApi } from '../api/bookingApi';
import { checkAvailabilityApi } from '../api/roomApi';
import { getCustomersApi, searchCustomersApi } from '../api/customerApi';
import { createWalkInStayApi } from '../api/stayApi';
import CameraCaptureModal from '../components/CameraCaptureModal';
import PageLoader from '../components/PageLoader';
import { getTodayDateString, getTomorrowDateString } from '../utils/dateUtils';
import { formatCurrency } from '../utils/formatCurrency';
import {
  DoorOpen,
  UserCheck,
  UserX,
  FileText,
  Camera,
  UploadCloud,
  CreditCard,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  ArrowLeft,
  Search,
  Building2,
  Sparkles,
  Plus,
  Minus,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  KeyRound,
  DollarSign,
  Check,
  User,
  Zap,
  Info,
  ChevronRight,
  CalendarCheck,
  Receipt,
  UserPlus
} from 'lucide-react';

const CheckIn = () => {
  const [searchParams] = useSearchParams();
  const bookingIdParam = searchParams.get('booking_id');
  const navigate = useNavigate();

  const [mode, setMode] = useState(bookingIdParam ? 'advance' : 'walkin');

  // STEP-BY-STEP WIZARD STATE FOR WALKIN MODE (1 to 5)
  const [currentStep, setCurrentStep] = useState(1);

  // Common Dates & Times
  const [checkInDate, setCheckInDate] = useState(getTodayDateString());
  const [checkInTime, setCheckInTime] = useState('12:00');
  const [checkoutDate, setCheckoutDate] = useState(getTomorrowDateString());
  const [checkoutTime, setCheckoutTime] = useState('11:00');

  // Advance Booking Check-In Specific States
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [advanceSearchTerm, setAdvanceSearchTerm] = useState('');
  const [advanceSearchResults, setAdvanceSearchResults] = useState([]);
  const [showAdvanceDropdown, setShowAdvanceDropdown] = useState(false);
  const [reallocatedRoomId, setReallocatedRoomId] = useState('');
  const [advanceAvailableRooms, setAdvanceAvailableRooms] = useState([]);

  // Walk-In Rooms & Filter
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [customRoomRate, setCustomRoomRate] = useState('');
  const [roomSearchQuery, setRoomSearchQuery] = useState('');

  // Guest Information
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [isNewCust, setIsNewCust] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [idType, setIdType] = useState('Aadhaar');
  const [idNumber, setIdNumber] = useState('');

  // Media Files & Camera
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [docBackFile, setDocBackFile] = useState(null);
  const [showCamera, setShowCamera] = useState(false);

  // Guest Counts & Billing
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [advancePayment, setAdvancePayment] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [verifiedConsent, setVerifiedConsent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [earlyArrivalNotice, setEarlyArrivalNotice] = useState('');

  // Customer Live Search (Walk-In)
  const [custSearchTerm, setCustSearchTerm] = useState('');
  const [custSearchResults, setCustSearchResults] = useState([]);
  const [showCustDropdown, setShowCustDropdown] = useState(false);

  useEffect(() => {
    getCustomersApi().then(setCustomers).catch(console.error);
    if (bookingIdParam) {
      setLoading(true);
      loadBookingById(bookingIdParam);
    } else {
      loadAvailableRooms();
      loadEligibleAdvanceBookings();
    }
  }, [bookingIdParam]);

  const loadBookingById = (bId) => {
    getBookingByIdApi(bId)
      .then((b) => {
        setSelectedBooking(b);
        setMode('advance');
        setReallocatedRoomId(b.room);

        const todayStr = new Date().toISOString().split('T')[0];
        if (b.check_in_date > todayStr) {
          setCheckInDate(todayStr);
          setEarlyArrivalNotice(`ℹ️ Early Guest Arrival: Booking #${b.booking_number} was originally scheduled for ${b.check_in_date}. Checking in today (${todayStr}).`);
        } else {
          setCheckInDate(b.check_in_date);
          setEarlyArrivalNotice('');
        }

        if (b.check_in_time) setCheckInTime(b.check_in_time.substring(0, 5));
        setCheckoutDate(b.expected_checkout_date);
        if (b.expected_checkout_time) setCheckoutTime(b.expected_checkout_time.substring(0, 5));

        if (b.customer_detail) {
          setFirstName(b.customer_detail.first_name || '');
          setLastName(b.customer_detail.last_name || '');
          setMobile(b.customer_detail.mobile || '');
          setEmail(b.customer_detail.email || '');
          setAddress(b.customer_detail.address || '');
          setIdType(b.customer_detail.id_type || 'Aadhaar');
          setIdNumber(b.customer_detail.id_number || '');
          if (b.customer_detail.photo) setPhotoPreview(b.customer_detail.photo);
        }

        setAdults(b.adults || 1);
        setChildren(b.children || 0);

        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  const loadEligibleAdvanceBookings = async (search = '') => {
    try {
      const res = await getBookingsApi({ search, status: 'CONFIRMED' });
      const bookingsList = Array.isArray(res) ? res : res.results || [];
      const eligible = bookingsList.filter((b) => b.status === 'CONFIRMED' || b.status === 'PENDING');
      setAdvanceSearchResults(eligible);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (mode === 'advance' && checkInDate && checkoutDate) {
      fetchAdvanceAvailability();
    } else if (mode === 'walkin' && checkInDate && checkoutDate) {
      loadAvailableRooms();
    }
  }, [checkInDate, checkInTime, checkoutDate, checkoutTime, mode]);

  const fetchAdvanceAvailability = async () => {
    try {
      const dtIn = `${checkInDate}T${checkInTime}:00`;
      const dtOut = `${checkoutDate}T${checkoutTime}:00`;
      const availRes = await checkAvailabilityApi(dtIn, dtOut);
      setAdvanceAvailableRooms(availRes.rooms || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAvailableRooms = async () => {
    try {
      const dtIn = `${checkInDate}T${checkInTime}:00`;
      const dtOut = `${checkoutDate}T${checkoutTime}:00`;
      const res = await checkAvailabilityApi(dtIn, dtOut);
      const rooms = res.rooms || [];
      setAvailableRooms(rooms);
      if (rooms.length > 0) {
        setSelectedRoomId(rooms[0].id);
        setCustomRoomRate(rooms[0].base_price);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const extractErrorMessage = (err, defaultMsg = 'Error processing check-in.') => {
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
            return `${k}: ${vStr}`;
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
            return `${k}: ${vStr}`;
          }).join(' | ');
          return detailList;
        }
      }
      if (summaryMsg) return summaryMsg;
    }
    if (err.message) return err.message;
    return defaultMsg;
  };

  // Advance Booking Search Handler
  const handleAdvanceSearchInput = (e) => {
    const q = e.target.value;
    setAdvanceSearchTerm(q);
    if (q.trim().length > 0) {
      loadEligibleAdvanceBookings(q);
      setShowAdvanceDropdown(true);
    } else {
      loadEligibleAdvanceBookings();
      setShowAdvanceDropdown(false);
    }
  };

  const handleSelectAdvanceBooking = (b) => {
    setSelectedBooking(b);
    setReallocatedRoomId(b.room);
    setCheckInDate(b.check_in_date);
    if (b.check_in_time) setCheckInTime(b.check_in_time.substring(0, 5));
    setCheckoutDate(b.expected_checkout_date);
    if (b.expected_checkout_time) setCheckoutTime(b.expected_checkout_time.substring(0, 5));

    if (b.customer_detail) {
      setFirstName(b.customer_detail.first_name || '');
      setLastName(b.customer_detail.last_name || '');
      setMobile(b.customer_detail.mobile || '');
      setEmail(b.customer_detail.email || '');
      setAddress(b.customer_detail.address || '');
      setIdType(b.customer_detail.id_type || 'Aadhaar');
      setIdNumber(b.customer_detail.id_number || '');
      if (b.customer_detail.photo) setPhotoPreview(b.customer_detail.photo);
    }
    setAdults(b.adults || 1);
    setChildren(b.children || 0);

    setShowAdvanceDropdown(false);
    setAdvanceSearchTerm('');
  };

  // Walk-In Customer Search Handler
  const handleCustSearch = async (term) => {
    setCustSearchTerm(term);
    if (term.trim().length > 1) {
      try {
        const res = await searchCustomersApi(term);
        setCustSearchResults(res);
        setShowCustDropdown(true);
      } catch (e) {
        console.error(e);
      }
    } else {
      setCustSearchResults([]);
      setShowCustDropdown(false);
    }
  };

  const handleSelectCustomer = (c) => {
    setSelectedCustomerId(c.id);
    setIsNewCust(false);
    setFirstName(c.first_name || '');
    setLastName(c.last_name || '');
    setMobile(c.mobile || '');
    setEmail(c.email || '');
    setAddress(c.address || '');
    setIdType(c.id_type || 'Aadhaar');
    setIdNumber(c.id_number || '');
    if (c.photo) setPhotoPreview(c.photo);
    setShowCustDropdown(false);
    setCustSearchTerm('');
  };

  // Walk-In Step Wizard Validation & Navigation
  const handleNextStep = () => {
    setError('');
    if (currentStep === 1) {
      if (!selectedRoomId) {
        setError('Please select an available room before proceeding to Guest Details.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!firstName || !mobile) {
        setError('Guest First Name and Mobile Number are required before proceeding.');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    } else if (currentStep === 4) {
      setCurrentStep(5);
    }
  };

  const handlePrevStep = () => {
    setError('');
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  // Submit Advance Booking Check-In
  const handleAdvanceCheckInSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');

    if (!selectedBooking) {
      setError('Please search and select a confirmed advance booking first.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (checkInDate > todayStr) {
      setError(`Invalid Check-In Date: Cannot process check-in for a future date (${checkInDate}). Today is ${todayStr}. Check-In Date must be set to today (${todayStr}) or earlier.`);
      return;
    }

    try {
      const payload = {
        room: reallocatedRoomId || selectedBooking.room,
        check_in_date: checkInDate,
        check_in_time: checkInTime,
        expected_checkout_date: checkoutDate,
        expected_checkout_time: checkoutTime,
      };
      const res = await checkInBookingApi(selectedBooking.id, payload);
      const stayId = res?.data?.stay_id || res?.stay_id || res?.data?.id || res?.id;
      navigate(`/stays/${stayId}`);
    } catch (err) {
      console.error(err);
      setError(extractErrorMessage(err, 'Error processing advance booking check-in.'));
    }
  };

  // Submit Walk-In Check-In
  const handleWalkInCheckInSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');

    if (!selectedRoomId) {
      setError('Please select an available room.');
      return;
    }
    if (!firstName || !mobile) {
      setError('Guest First Name and Mobile Number are required.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('room', selectedRoomId);
      if (!isNewCust && selectedCustomerId) formData.append('customer', selectedCustomerId);
      formData.append('first_name', firstName);
      if (lastName) formData.append('last_name', lastName);
      formData.append('mobile', mobile);
      if (email) formData.append('email', email);
      if (address) formData.append('address', address);
      formData.append('id_type', idType);
      if (idNumber) formData.append('id_number', idNumber);
      formData.append('check_in_date', checkInDate);
      formData.append('check_in_time', checkInTime);
      formData.append('expected_checkout_date', checkoutDate);
      formData.append('expected_checkout_time', checkoutTime);
      formData.append('adults', adults);
      formData.append('children', children);
      if (customRoomRate) formData.append('room_rate', customRoomRate);
      formData.append('advance_payment', advancePayment || 0);
      formData.append('payment_method', paymentMethod);

      if (photoFile) formData.append('photo', photoFile);
      if (docFile) formData.append('id_document', docFile);
      if (docBackFile) formData.append('id_document_back', docBackFile);

      const res = await createWalkInStayApi(formData);
      const stayId = res?.data?.id || res?.id || res?.data?.stay_id || res?.stay_id;
      if (stayId) {
        navigate(`/stays/${stayId}`);
      } else {
        navigate('/stays');
      }
    } catch (err) {
      console.error(err);
      setError(extractErrorMessage(err, 'Error processing walk-in check-in.'));
    }
  };

  if (loading) {
    return <PageLoader fullScreen={false} message="Loading Guest Verification & Check-In Workflow..." />;
  }

  // Room & Billing Calculations
  const selectedRoomObj = mode === 'advance'
    ? advanceAvailableRooms.find(r => String(r.id) === String(reallocatedRoomId)) || selectedBooking?.room_detail
    : availableRooms.find((r) => String(r.id) === String(selectedRoomId));

  const dtStart = new Date(`${checkInDate}T${checkInTime}`);
  const dtEnd = new Date(`${checkoutDate}T${checkoutTime}`);
  const diffTime = Math.max(0, dtEnd - dtStart);
  const nightsCount = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const activeRate = mode === 'advance'
    ? parseFloat(selectedBooking?.room_rate || selectedRoomObj?.base_price || 0)
    : parseFloat(customRoomRate || selectedRoomObj?.base_price || 0);

  const roomAmountTotal = nightsCount * activeRate;
  const estimatedGst = Math.round(roomAmountTotal * 0.18);
  const grandTotalEstimate = roomAmountTotal + estimatedGst;
  const numericAdvance = mode === 'advance'
    ? parseFloat(selectedBooking?.advance_amount || 0) + parseFloat(advancePayment || 0)
    : parseFloat(advancePayment || 0);
  const estimatedBalance = Math.max(0, grandTotalEstimate - numericAdvance);

  const filteredAvailableRooms = availableRooms.filter(
    (r) =>
      r.room_number.toLowerCase().includes(roomSearchQuery.toLowerCase()) ||
      r.room_type_name.toLowerCase().includes(roomSearchQuery.toLowerCase())
  );

  const isRoomSelected = !!selectedRoomId;
  const isGuestEntered = !!firstName && !!mobile;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }} className="pb-5">

      {/* ========================================================= */}
      {/* 1. PAGE HEADER WITH MODE TABS                             */}
      {/* ========================================================= */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4 pb-2 border-bottom">
        <div>
          <div className="d-flex align-items-center gap-2">
            <div className="p-2 bg-primary-subtle text-primary rounded-3">
              {mode === 'advance' ? <CalendarCheck size={22} /> : <Zap size={22} />}
            </div>
            <div>
              <h3 className="fw-bold text-dark m-0 tracking-tight">
                {mode === 'advance' ? 'Advance Booking Check-In Workflow' : 'Direct Walk-In Check-In Workflow'}
              </h3>
              <p className="text-muted small m-0">
                {mode === 'advance' ? 'Search confirmed reservation, verify pre-filled guest details, record check-in, and issue key' : 'Register a new walk-in guest, allocate an available room, and issue key'}
              </p>
            </div>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="bg-white p-1.5 rounded-3 border shadow-xs d-flex align-items-center gap-1">
          <button
            type="button"
            className={`btn btn-sm px-3 py-2 fw-semibold rounded-2 transition-all ${mode === 'advance' ? 'btn-primary shadow-xs' : 'btn-light border-0 text-muted'}`}
            onClick={() => setMode('advance')}
          >
            <CalendarCheck size={16} className="me-1.5" /> Advance Booking
          </button>
          <button
            type="button"
            className={`btn btn-sm px-3 py-2 fw-semibold rounded-2 transition-all ${mode === 'walkin' ? 'btn-primary shadow-xs' : 'btn-light border-0 text-muted'}`}
            onClick={() => setMode('walkin')}
          >
            <Zap size={16} className="me-1.5" /> Direct Walk-In
          </button>
        </div>
      </div>

      {/* STEP WIZARD PROGRESS BAR FOR WALKIN MODE */}
      {mode === 'walkin' ? (
        <div className="saas-card bg-white p-3 mb-4 border-0 shadow-sm d-flex flex-wrap align-items-center justify-content-around gap-2">
          <div onClick={() => setCurrentStep(1)} className={`d-flex align-items-center gap-2 cursor-pointer ${currentStep === 1 ? 'text-primary fw-bold' : currentStep > 1 ? 'text-success fw-semibold' : 'text-muted'}`} style={{ cursor: 'pointer' }}>
            <div className={`rounded-circle d-flex align-items-center justify-content-center ${currentStep === 1 ? 'bg-primary text-white shadow-xs' : currentStep > 1 ? 'bg-success text-white' : 'bg-light text-muted'}`} style={{ width: '30px', height: '30px', fontSize: '0.85rem' }}>
              {currentStep > 1 ? <Check size={16} /> : '1'}
            </div>
            <span>1. Stay & Room</span>
          </div>
          <ChevronRight size={16} className="text-muted d-none d-md-block" />

          <div onClick={() => isRoomSelected && setCurrentStep(2)} className={`d-flex align-items-center gap-2 cursor-pointer ${currentStep === 2 ? 'text-primary fw-bold' : currentStep > 2 ? 'text-success fw-semibold' : 'text-muted'}`} style={{ cursor: isRoomSelected ? 'pointer' : 'not-allowed' }}>
            <div className={`rounded-circle d-flex align-items-center justify-content-center ${currentStep === 2 ? 'bg-primary text-white shadow-xs' : currentStep > 2 ? 'bg-success text-white' : 'bg-light text-muted'}`} style={{ width: '30px', height: '30px', fontSize: '0.85rem' }}>
              {currentStep > 2 ? <Check size={16} /> : '2'}
            </div>
            <span>2. Guest Details</span>
          </div>
          <ChevronRight size={16} className="text-muted d-none d-md-block" />

          <div onClick={() => isGuestEntered && setCurrentStep(3)} className={`d-flex align-items-center gap-2 cursor-pointer ${currentStep === 3 ? 'text-primary fw-bold' : currentStep > 3 ? 'text-success fw-semibold' : 'text-muted'}`} style={{ cursor: isGuestEntered ? 'pointer' : 'not-allowed' }}>
            <div className={`rounded-circle d-flex align-items-center justify-content-center ${currentStep === 3 ? 'bg-primary text-white shadow-xs' : currentStep > 3 ? 'bg-success text-white' : 'bg-light text-muted'}`} style={{ width: '30px', height: '30px', fontSize: '0.85rem' }}>
              {currentStep > 3 ? <Check size={16} /> : '3'}
            </div>
            <span>3. ID & Photo</span>
          </div>
          <ChevronRight size={16} className="text-muted d-none d-md-block" />

          <div onClick={() => isGuestEntered && setCurrentStep(4)} className={`d-flex align-items-center gap-2 cursor-pointer ${currentStep === 4 ? 'text-primary fw-bold' : currentStep > 4 ? 'text-success fw-semibold' : 'text-muted'}`} style={{ cursor: isGuestEntered ? 'pointer' : 'not-allowed' }}>
            <div className={`rounded-circle d-flex align-items-center justify-content-center ${currentStep === 4 ? 'bg-primary text-white shadow-xs' : currentStep > 4 ? 'bg-success text-white' : 'bg-light text-muted'}`} style={{ width: '30px', height: '30px', fontSize: '0.85rem' }}>
              {currentStep > 4 ? <Check size={16} /> : '4'}
            </div>
            <span>4. Payment</span>
          </div>
          <ChevronRight size={16} className="text-muted d-none d-md-block" />

          <div onClick={() => isGuestEntered && setCurrentStep(5)} className={`d-flex align-items-center gap-2 cursor-pointer ${currentStep === 5 ? 'text-success fw-bold' : 'text-muted'}`} style={{ cursor: isGuestEntered ? 'pointer' : 'not-allowed' }}>
            <div className={`rounded-circle d-flex align-items-center justify-content-center ${currentStep === 5 ? 'bg-success text-white shadow-xs' : 'bg-light text-muted'}`} style={{ width: '30px', height: '30px', fontSize: '0.85rem' }}>
              {currentStep === 5 ? <Check size={16} /> : '5'}
            </div>
            <span>5. Confirmation</span>
          </div>
        </div>
      ) : (
        /* ADVANCE BOOKING STEPPER STRIP */
        <div className="saas-card bg-white p-3 mb-4 border-0 shadow-sm d-flex flex-wrap align-items-center justify-content-around gap-2">
          <div className={`d-flex align-items-center gap-2 ${selectedBooking ? 'text-success fw-semibold' : 'text-primary fw-bold'}`}>
            <div className={`rounded-circle d-flex align-items-center justify-content-center ${selectedBooking ? 'bg-success text-white' : 'bg-primary text-white shadow-xs'}`} style={{ width: '30px', height: '30px', fontSize: '0.85rem' }}>
              {selectedBooking ? <Check size={16} /> : '1'}
            </div>
            <span>1. Search Booking</span>
          </div>
          <ChevronRight size={16} className="text-muted d-none d-md-block" />

          <div className={`d-flex align-items-center gap-2 ${selectedBooking ? 'text-primary fw-bold' : 'text-muted'}`}>
            <div className={`rounded-circle d-flex align-items-center justify-content-center ${selectedBooking ? 'bg-primary text-white shadow-xs' : 'bg-light text-muted'}`} style={{ width: '30px', height: '30px', fontSize: '0.85rem' }}>
              2
            </div>
            <span>2. Pre-Filled Details</span>
          </div>
          <ChevronRight size={16} className="text-muted d-none d-md-block" />

          <div className={`d-flex align-items-center gap-2 ${selectedBooking ? 'text-primary fw-bold' : 'text-muted'}`}>
            <div className={`rounded-circle d-flex align-items-center justify-content-center ${selectedBooking ? 'bg-primary text-white shadow-xs' : 'bg-light text-muted'}`} style={{ width: '30px', height: '30px', fontSize: '0.85rem' }}>
              3
            </div>
            <span>3. Actual Datetime & Room</span>
          </div>
          <ChevronRight size={16} className="text-muted d-none d-md-block" />

          <div className={`d-flex align-items-center gap-2 ${verifiedConsent ? 'text-success fw-bold' : 'text-muted'}`}>
            <div className={`rounded-circle d-flex align-items-center justify-content-center ${verifiedConsent ? 'bg-success text-white shadow-xs' : 'bg-light text-muted'}`} style={{ width: '30px', height: '30px', fontSize: '0.85rem' }}>
              4
            </div>
            <span>4. Issue Key</span>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger shadow-sm mb-4 rounded-3 d-flex align-items-center gap-2" style={{ borderLeft: '4px solid #ef4444' }}>
          <AlertTriangle size={20} className="text-danger flex-shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {earlyArrivalNotice && (
        <div className="alert alert-info shadow-sm mb-4 rounded-3 d-flex align-items-center gap-2">
          <Info size={20} className="text-info flex-shrink-0" />
          <div>{earlyArrivalNotice}</div>
        </div>
      )}

      {/* ========================================================= */}
      {/* REDESIGNED ADVANCE BOOKING CHECK-IN WORKFLOW               */}
      {/* ========================================================= */}
      {mode === 'advance' ? (
        <form onSubmit={handleAdvanceCheckInSubmit}>
          
          {/* SECTION 1: PROMINENT ADVANCE BOOKING SEARCH BAR */}
          <div className="saas-card p-4 border-0 bg-white shadow-sm mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
                  <Search size={20} className="text-primary" /> 1. Search Active Confirmed Booking
                </h5>
                <span className="text-muted small">Search by Booking # (BK-...), Guest Name, Mobile Number, or Room #</span>
              </div>
            </div>

            <div className="position-relative">
              <div className="input-group input-group-lg border rounded-3 overflow-hidden">
                <span className="input-group-text bg-white border-0 text-muted ps-3">
                  <Search size={20} />
                </span>
                <input
                  type="text"
                  className="form-control border-0 bg-white shadow-none ps-2"
                  placeholder="Type Booking # (BK-2026...), Guest Name, Mobile Number, or Room # to search..."
                  value={advanceSearchTerm}
                  onChange={handleAdvanceSearchInput}
                  onFocus={() => setShowAdvanceDropdown(true)}
                />
              </div>

              {/* Booking Search Popover Card */}
              {showAdvanceDropdown && (
                <div className="position-absolute start-0 end-0 top-100 mt-2 bg-white border-0 rounded-3 shadow-lg z-3 overflow-hidden" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  {advanceSearchResults.length === 0 ? (
                    <div className="p-4 text-center text-muted small">
                      No active confirmed bookings found matching "{advanceSearchTerm}". Excludes cancelled, checked-in & no-show bookings.
                    </div>
                  ) : (
                    advanceSearchResults.map((b) => (
                      <div
                        key={b.id}
                        className="p-3 border-bottom hover-bg-light cursor-pointer d-flex justify-content-between align-items-center"
                        style={{ cursor: 'pointer' }}
                        onMouseDown={() => handleSelectAdvanceBooking(b)}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <div className="p-2.5 bg-primary-subtle text-primary rounded-3 fw-bold">
                            {b.booking_number}
                          </div>
                          <div>
                            <div className="fw-bold text-dark small">{b.customer_detail?.full_name || 'Guest'}</div>
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                              📞 {b.customer_detail?.mobile || 'N/A'} | Room {b.room_detail?.room_number || b.room} ({b.room_detail?.room_type_name})
                            </div>
                            <div className="text-primary" style={{ fontSize: '0.725rem' }}>
                              Scheduled: {b.check_in_date} → {b.expected_checkout_date}
                            </div>
                          </div>
                        </div>
                        <div className="text-end">
                          <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2.5 py-1 mb-1">
                            {b.status}
                          </span>
                          <button type="button" className="btn btn-sm btn-primary d-block px-3 fw-semibold">
                            Select Booking
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* IF NO BOOKING SELECTED YET */}
          {!selectedBooking ? (
            <div className="saas-card p-5 border-0 bg-white shadow-sm text-center my-4">
              <div className="p-3 bg-primary-subtle text-primary rounded-circle d-inline-flex mb-3">
                <Search size={36} />
              </div>
              <h5 className="fw-bold text-dark mb-1">Search & Select a Confirmed Booking Above</h5>
              <p className="text-muted small max-w-md mx-auto m-0">
                Use the booking search bar to find an active advance booking. All pre-filled reservation details, guest profiles, and room details will automatically populate for fast check-in.
              </p>
            </div>
          ) : (
            /* IF BOOKING SELECTED: PRE-FILLED WORKFLOW CARDS */
            <div className="row g-4">
              
              {/* LEFT COLUMN: PRE-FILLED CARDS & ACTUAL CHECK-IN DATETIME */}
              <div className="col-lg-8">

                {/* SECTION 2: PRE-FILLED BOOKING SUMMARY CARD */}
                <div className="saas-card p-4 border-0 bg-white shadow-sm mb-4">
                  <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
                    <div className="d-flex align-items-center gap-3">
                      <div className="p-2 bg-primary-subtle text-primary rounded-3">
                        <Receipt size={20} />
                      </div>
                      <div>
                        <h5 className="fw-bold text-dark m-0">Booking #{selectedBooking.booking_number}</h5>
                        <span className="text-muted small">Confirmed advance reservation details</span>
                      </div>
                    </div>
                    <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-1 fw-bold fs-6">
                      {selectedBooking.status}
                    </span>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-3 col-6">
                      <div className="p-3 bg-light rounded-3 border">
                        <div className="text-muted small">Scheduled Check-In</div>
                        <div className="fw-bold text-dark mt-1">{selectedBooking.check_in_date}</div>
                        <div className="text-muted small">@ {selectedBooking.check_in_time || '12:00'}</div>
                      </div>
                    </div>

                    <div className="col-md-3 col-6">
                      <div className="p-3 bg-light rounded-3 border">
                        <div className="text-muted small">Scheduled Check-Out</div>
                        <div className="fw-bold text-dark mt-1">{selectedBooking.expected_checkout_date}</div>
                        <div className="text-muted small">@ {selectedBooking.expected_checkout_time || '11:00'}</div>
                      </div>
                    </div>

                    <div className="col-md-3 col-6">
                      <div className="p-3 bg-light rounded-3 border">
                        <div className="text-muted small">Assigned Room</div>
                        <div className="fw-bold text-dark mt-1">Room {selectedBooking.room_detail?.room_number}</div>
                        <div className="text-muted small">{selectedBooking.room_detail?.room_type_name}</div>
                      </div>
                    </div>

                    <div className="col-md-3 col-6">
                      <div className="p-3 bg-light rounded-3 border">
                        <div className="text-muted small">Advance Paid</div>
                        <div className="fw-bold text-success mt-1">{formatCurrency(selectedBooking.advance_amount)}</div>
                        <div className="text-muted small">Pre-collected</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: READ-ONLY GUEST VERIFICATION CARD */}
                <div className="saas-card p-4 border-0 bg-white shadow-sm mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
                      <UserCheck size={20} className="text-primary" /> Guest Identity Verification
                    </h5>
                    <span className="badge bg-success-subtle text-success rounded-pill px-3 py-1 fw-semibold">
                      ✓ Profile Pre-Filled
                    </span>
                  </div>

                  <div className="p-3 bg-light rounded-3 border mb-3">
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle bg-primary bg-gradient text-white d-flex align-items-center justify-content-center fw-bold fs-4 flex-shrink-0 shadow-sm" style={{ width: '56px', height: '56px' }}>
                        {(firstName || 'G').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h5 className="fw-bold text-dark m-0">{firstName} {lastName}</h5>
                        <div className="text-muted small">📞 {mobile} | 📧 {email || 'N/A'}</div>
                        <div className="text-muted small mt-0.5">🏠 {address || 'Address on record'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="p-3 bg-light rounded-3 border">
                        <div className="text-muted small">ID Proof Type & Serial Number</div>
                        <div className="fw-bold text-dark mt-1">{idType} {idNumber ? `(${idNumber})` : ''}</div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="p-3 bg-light rounded-3 border d-flex align-items-center justify-content-between">
                        <div>
                          <div className="text-muted small">Guest Photo & Document Status</div>
                          <div className="fw-semibold text-success small mt-1">✓ ID Verification Recorded</div>
                        </div>
                        <ShieldCheck size={24} className="text-success" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 4: ACTUAL CHECK-IN DATETIME & ROOM REALLOCATION */}
                <div className="saas-card p-4 border-0 bg-white shadow-sm mb-4">
                  <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                    <Clock size={20} className="text-primary" /> Record Actual Check-In & Room Allocation
                  </h5>

                  <div className="row g-3 p-3 bg-light rounded-3 border mb-3">
                    <div className="col-md-3 col-6">
                      <label className="form-label small fw-semibold text-dark">Actual Check-In Date *</label>
                      <input type="date" className="form-control" required value={checkInDate} onChange={(e) => setCheckInDate(e.target.value)} />
                    </div>
                    <div className="col-md-3 col-6">
                      <label className="form-label small fw-semibold text-dark">Actual Check-In Time</label>
                      <input type="time" className="form-control" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} />
                    </div>
                    <div className="col-md-3 col-6">
                      <label className="form-label small fw-semibold text-dark">Check-Out Date *</label>
                      <input type="date" className="form-control" required value={checkoutDate} onChange={(e) => setCheckoutDate(e.target.value)} />
                    </div>
                    <div className="col-md-3 col-6">
                      <label className="form-label small fw-semibold text-dark">Check-Out Time</label>
                      <input type="time" className="form-control" value={checkoutTime} onChange={(e) => setCheckoutTime(e.target.value)} />
                    </div>
                  </div>

                  {/* Optional Room Reallocation */}
                  <div className="pt-2">
                    <label className="form-label fw-bold text-dark">Room Allocation / Room Transfer (Optional)</label>
                    <select className="form-select border-primary" value={reallocatedRoomId} onChange={(e) => setReallocatedRoomId(e.target.value)}>
                      <option value={selectedBooking.room}>
                        Room {selectedBooking.room_detail?.room_number} - {selectedBooking.room_detail?.room_type_name} (Originally Assigned Room)
                      </option>
                      {advanceAvailableRooms
                        .filter((r) => String(r.id) !== String(selectedBooking.room))
                        .map((r) => (
                          <option key={r.id} value={r.id}>
                            Room {r.room_number} - {r.room_type_name} ({formatCurrency(r.base_price)} / night) [AVAILABLE]
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* SECTION 5: ADDITIONAL GUESTS */}
                <div className="saas-card p-4 border-0 bg-white shadow-sm mb-4">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
                        <UserPlus size={20} className="text-primary" /> Guest Occupancy
                      </h5>
                      <span className="text-muted small">Registered Guests: {adults} Adult(s), {children} Child</span>
                    </div>
                    <button type="button" className="btn btn-sm btn-outline-primary fw-semibold d-flex align-items-center gap-1.5" onClick={() => setAdults(adults + 1)}>
                      <Plus size={16} /> Add Additional Guest
                    </button>
                  </div>
                </div>

                {/* SECTION 6: ADDITIONAL PAYMENT COLLECTION AT CHECK-IN */}
                <div className="saas-card p-4 border-0 bg-white shadow-sm mb-4">
                  <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                    <CreditCard size={20} className="text-success" /> Additional Payment Collection
                  </h5>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Additional Settlement Amount (₹)</label>
                      <div className="input-group">
                        <span className="input-group-text fw-bold bg-white text-success">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="form-control form-control-lg fw-bold text-success"
                          value={advancePayment}
                          onChange={(e) => setAdvancePayment(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Payment Collection Method</label>
                      <select className="form-select form-select-lg" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                        <option value="CASH">Cash Collection</option>
                        <option value="UPI">UPI / QR Code</option>
                        <option value="CARD">Debit / Credit Card</option>
                        <option value="BANK_TRANSFER">Direct Bank Transfer</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECTION 7: VERIFICATION CONSENT */}
                <div className="saas-card p-4 border-0 bg-white shadow-sm mb-4">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="advanceConsentCheck"
                      checked={verifiedConsent}
                      onChange={(e) => setVerifiedConsent(e.target.checked)}
                    />
                    <label className="form-check-label fw-semibold text-dark small" htmlFor="advanceConsentCheck">
                      I confirm that the primary guest profile, identity proof document, and check-in details have been verified for Booking #{selectedBooking.booking_number}.
                    </label>
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: STICKY BOOKING & BILLING SUMMARY */}
              <div className="col-lg-4">
                <div className="position-sticky" style={{ top: '90px' }}>
                  <div className="saas-card p-4 border-0 bg-white shadow-sm mb-4">
                    <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
                      <h5 className="fw-bold text-dark m-0">Booking Summary</h5>
                      <span className="badge bg-primary rounded-pill px-2.5 py-1">
                        {nightsCount} Night{nightsCount > 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Room Summary */}
                    <div className="p-3 bg-light rounded-3 border mb-3">
                      <div className="text-muted small">Allocated Room</div>
                      <div className="fw-bold text-dark fs-5">
                        Room {selectedRoomObj?.room_number || selectedBooking.room_detail?.room_number}
                      </div>
                      <div className="small text-muted">{selectedRoomObj?.room_type_name || selectedBooking.room_detail?.room_type_name}</div>
                    </div>

                    {/* Datetime Summary */}
                    <div className="mb-3 small">
                      <div className="d-flex justify-content-between text-muted mb-1">
                        <span>Actual Check-In:</span>
                        <strong className="text-dark">{checkInDate} @ {checkInTime}</strong>
                      </div>
                      <div className="d-flex justify-content-between text-muted mb-1">
                        <span>Check-Out:</span>
                        <strong className="text-dark">{checkoutDate} @ {checkoutTime}</strong>
                      </div>
                    </div>

                    <hr />

                    {/* Billing Breakdown */}
                    <h6 className="fw-bold text-dark mb-3">Financial Breakdown</h6>
                    <div className="d-flex justify-content-between text-muted small mb-2">
                      <span>Room Rate Subtotal</span>
                      <strong className="text-dark">{formatCurrency(roomAmountTotal)}</strong>
                    </div>
                    <div className="d-flex justify-content-between text-muted small mb-2">
                      <span>Estimated GST (18%)</span>
                      <strong className="text-dark">{formatCurrency(estimatedGst)}</strong>
                    </div>
                    <div className="d-flex justify-content-between fw-bold text-dark fs-6 my-2 pt-2 border-top">
                      <span>Grand Total:</span>
                      <span className="text-primary">{formatCurrency(grandTotalEstimate)}</span>
                    </div>
                    <div className="d-flex justify-content-between text-muted small mb-2">
                      <span>Advance Paid</span>
                      <strong className="text-success">{formatCurrency(numericAdvance)}</strong>
                    </div>

                    <div className="p-3 bg-danger-subtle rounded-3 border border-danger-subtle d-flex justify-content-between align-items-center mt-3">
                      <div>
                        <div className="text-danger small fw-semibold">Balance Amount Due</div>
                        <div className="fw-bold text-danger fs-4">{formatCurrency(estimatedBalance)}</div>
                      </div>
                      <AlertTriangle size={24} className="text-danger" />
                    </div>

                    {/* Primary Confirmation Action */}
                    <button
                      type="submit"
                      className="btn btn-success btn-lg w-100 mt-4 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 py-3"
                    >
                      <KeyRound size={20} /> Confirm Check-In & Issue Key
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* STICKY BOTTOM ACTION BAR */}
          {selectedBooking && (
            <div className="fixed-bottom bg-white border-top shadow-lg p-3 no-print z-3">
              <div className="d-flex justify-content-between align-items-center" style={{ maxWidth: '1400px', margin: '0 auto' }}>
                <button type="button" className="btn btn-light border fw-semibold" onClick={() => setSelectedBooking(null)}>
                  Cancel / Select Another Booking
                </button>
                <div className="d-flex gap-3 align-items-center">
                  <div className="text-end d-none d-md-block">
                    <div className="small text-muted">Balance Due</div>
                    <div className="fw-bold text-danger">{formatCurrency(estimatedBalance)}</div>
                  </div>
                  <button type="submit" className="btn btn-success btn-lg fw-bold px-4 shadow-sm d-flex align-items-center gap-2">
                    <KeyRound size={20} /> Confirm Check-In & Issue Key
                  </button>
                </div>
              </div>
            </div>
          )}

        </form>
      ) : (
        /* ========================================================= */
        /* DIRECT WALK-IN CHECK-IN WIZARD WORKFLOW                   */
        /* ========================================================= */
        <form onSubmit={handleWalkInCheckInSubmit}>
          <div className="row g-4">
            
            {/* LEFT COLUMN: CURRENT STEP ANIMATED CARD */}
            <div className="col-lg-8">
              
              {/* STEP 1: STAY DETAILS & ROOM SELECTION */}
              {currentStep === 1 && (
                <div className="saas-card p-4 border-0 bg-white shadow-sm mb-4 step-animated-card" key="step-1">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h5 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
                        <DoorOpen size={20} className="text-primary" /> Step 1 — Stay Details & Room Selection
                      </h5>
                      <span className="text-muted small">Select stay dates and choose an available room</span>
                    </div>
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-3 py-1 fw-semibold">
                      Step 1 of 5
                    </span>
                  </div>

                  {/* 4-Column Datetime Layout */}
                  <div className="row g-3 p-3 bg-light rounded-3 border mb-4">
                    <div className="col-md-3 col-6">
                      <label className="form-label small fw-semibold text-dark">Check-In Date *</label>
                      <div className="input-group input-group-sm">
                        <span className="input-group-text bg-white"><Calendar size={14} /></span>
                        <input type="date" className="form-control" required value={checkInDate} onChange={(e) => setCheckInDate(e.target.value)} />
                      </div>
                    </div>
                    <div className="col-md-3 col-6">
                      <label className="form-label small fw-semibold text-dark">Check-In Time</label>
                      <div className="input-group input-group-sm">
                        <span className="input-group-text bg-white"><Clock size={14} /></span>
                        <input type="time" className="form-control" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} />
                      </div>
                    </div>
                    <div className="col-md-3 col-6">
                      <label className="form-label small fw-semibold text-dark">Check-Out Date *</label>
                      <div className="input-group input-group-sm">
                        <span className="input-group-text bg-white"><Calendar size={14} /></span>
                        <input type="date" className="form-control" required value={checkoutDate} onChange={(e) => setCheckoutDate(e.target.value)} />
                      </div>
                    </div>
                    <div className="col-md-3 col-6">
                      <label className="form-label small fw-semibold text-dark">Check-Out Time</label>
                      <div className="input-group input-group-sm">
                        <span className="input-group-text bg-white"><Clock size={14} /></span>
                        <input type="time" className="form-control" value={checkoutTime} onChange={(e) => setCheckoutTime(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  {/* Room Availability Selector Grid */}
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <label className="form-label fw-bold text-dark m-0">Select Available Room ({filteredAvailableRooms.length})</label>
                    <div className="input-group input-group-sm" style={{ width: '220px' }}>
                      <span className="input-group-text bg-white"><Search size={14} /></span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Filter room..."
                        value={roomSearchQuery}
                        onChange={(e) => setRoomSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  {filteredAvailableRooms.length === 0 ? (
                    <div className="p-4 text-center text-muted bg-light rounded-3 border">
                      No available rooms for the selected check-in period.
                    </div>
                  ) : (
                    <div className="row g-3 mb-3" style={{ maxHeight: '340px', overflowY: 'auto' }}>
                      {filteredAvailableRooms.map((rm) => {
                        const isSelected = String(rm.id) === String(selectedRoomId);
                        return (
                          <div key={rm.id} className="col-md-4 col-sm-6">
                            <div
                              onClick={() => {
                                setSelectedRoomId(rm.id);
                                setCustomRoomRate(rm.base_price);
                              }}
                              className={`p-3 rounded-3 border transition-all cursor-pointer h-100 ${isSelected ? 'border-primary bg-primary-subtle shadow-sm' : 'bg-white hover-border-primary'}`}
                              style={{ cursor: 'pointer', borderLineWidth: isSelected ? '2px' : '1px' }}
                            >
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <span className="fw-bold text-dark fs-6">Room {rm.room_number}</span>
                                <span className="badge bg-success-subtle text-success rounded-pill px-2" style={{ fontSize: '0.675rem' }}>
                                  ✓ Available
                                </span>
                              </div>
                              <div className="text-muted small mb-2">{rm.room_type_name}</div>
                              <div className="d-flex justify-content-between align-items-center">
                                <span className="fw-bold text-primary">{formatCurrency(rm.base_price)}</span>
                                <span className="text-muted" style={{ fontSize: '0.725rem' }}>Max 3 Guests</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Editable Daily Room Rate */}
                  <div className="p-3 bg-light rounded-3 border mt-3">
                    <div className="row align-items-center">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold text-dark m-0">Editable Room Daily Rate (₹ / night)</label>
                        <span className="text-muted small d-block">Override rate if special discount applies</span>
                      </div>
                      <div className="col-md-6">
                        <div className="input-group">
                          <span className="input-group-text fw-bold bg-white text-primary">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="form-control form-control-lg fw-bold text-primary"
                            required
                            value={customRoomRate}
                            onChange={(e) => setCustomRoomRate(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 1 Navigation */}
                  <div className="d-flex justify-content-end mt-4 pt-3 border-top">
                    <button
                      type="button"
                      className="btn btn-primary btn-lg fw-semibold px-4 shadow-sm d-flex align-items-center gap-2"
                      onClick={handleNextStep}
                    >
                      Next: Guest Details <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: GUEST INFORMATION & OCCUPANCY */}
              {currentStep === 2 && (
                <div className="saas-card p-4 border-0 bg-white shadow-sm mb-4 step-animated-card" key="step-2">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h5 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
                        <UserCheck size={20} className="text-primary" /> Step 2 — Guest Information
                      </h5>
                      <span className="text-muted small">Enter the primary guest profile and guest count</span>
                    </div>
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-3 py-1 fw-semibold">
                      Step 2 of 5
                    </span>
                  </div>

                  {/* Search Existing Customer Bar */}
                  <div className="position-relative mb-4">
                    <label className="form-label small fw-semibold text-primary">Search Existing Customer Directory</label>
                    <div className="input-group">
                      <span className="input-group-text bg-white"><Search size={16} /></span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search guest by name, mobile, or Aadhaar ID..."
                        value={custSearchTerm}
                        onChange={(e) => handleCustSearch(e.target.value)}
                        onFocus={() => custSearchTerm.length > 1 && setShowCustDropdown(true)}
                      />
                    </div>

                    {showCustDropdown && (
                      <div className="position-absolute start-0 end-0 top-100 mt-1 bg-white border rounded-3 shadow-lg z-3 overflow-hidden" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                        {custSearchResults.length === 0 ? (
                          <div className="p-3 text-muted small text-center">No existing customer records found</div>
                        ) : (
                          custSearchResults.map((c) => (
                            <div
                              key={c.id}
                              className="p-3 border-bottom hover-bg-light cursor-pointer d-flex justify-content-between align-items-center"
                              style={{ cursor: 'pointer' }}
                              onMouseDown={() => handleSelectCustomer(c)}
                            >
                              <div>
                                <div className="fw-bold text-dark small">{c.full_name}</div>
                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>📞 {c.mobile} | ID: {c.id_number || 'N/A'}</div>
                              </div>
                              <button type="button" className="btn btn-sm btn-outline-primary py-0 px-2 rounded-pill">Use Customer</button>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Primary Guest Fields Grid */}
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">First Name *</label>
                      <input type="text" className="form-control" required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Guest First Name" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Last Name</label>
                      <input type="text" className="form-control" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Guest Last Name" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Mobile Number *</label>
                      <input type="text" className="form-control" required value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="10-digit Mobile Number" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Email Address</label>
                      <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="guest@example.com" />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-semibold">Permanent Residential Address</label>
                      <input type="text" className="form-control" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full Residential Address" />
                    </div>
                  </div>

                  {/* Guest Count Stepper */}
                  <div className="p-3 bg-light rounded-3 border">
                    <label className="form-label fw-bold text-dark mb-2">Guest Occupancy Count</label>
                    <div className="row g-3 align-items-center">
                      <div className="col-md-6">
                        <div className="d-flex align-items-center justify-content-between p-2 bg-white rounded-3 border">
                          <span className="fw-semibold small text-dark">Adults</span>
                          <div className="d-flex align-items-center gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary p-1 rounded-circle d-flex align-items-center justify-content-center"
                              style={{ width: '28px', height: '28px' }}
                              onClick={() => setAdults(Math.max(1, adults - 1))}
                            >
                              <Minus size={14} />
                            </button>
                            <span className="fw-bold px-2">{adults}</span>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary p-1 rounded-circle d-flex align-items-center justify-content-center"
                              style={{ width: '28px', height: '28px' }}
                              onClick={() => setAdults(adults + 1)}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="d-flex align-items-center justify-content-between p-2 bg-white rounded-3 border">
                          <span className="fw-semibold small text-dark">Children</span>
                          <div className="d-flex align-items-center gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary p-1 rounded-circle d-flex align-items-center justify-content-center"
                              style={{ width: '28px', height: '28px' }}
                              onClick={() => setChildren(Math.max(0, children - 1))}
                            >
                              <Minus size={14} />
                            </button>
                            <span className="fw-bold px-2">{children}</span>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary p-1 rounded-circle d-flex align-items-center justify-content-center"
                              style={{ width: '28px', height: '28px' }}
                              onClick={() => setChildren(children + 1)}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 2 Navigation */}
                  <div className="d-flex justify-content-between mt-4 pt-3 border-top">
                    <button type="button" className="btn btn-light border btn-lg px-4" onClick={handlePrevStep}>
                      <ArrowLeft size={18} className="me-1" /> Back
                    </button>
                    <button type="button" className="btn btn-primary btn-lg fw-semibold px-4 shadow-sm d-flex align-items-center gap-2" onClick={handleNextStep}>
                      Next: ID & Photo <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: ID VERIFICATION & PHOTO UPLOAD */}
              {currentStep === 3 && (
                <div className="saas-card p-4 border-0 bg-white shadow-sm mb-4 step-animated-card" key="step-3">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h5 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
                        <ShieldCheck size={20} className="text-primary" /> Step 3 — ID Verification & Photo Upload
                      </h5>
                      <span className="text-muted small">Verify identity proof documents and guest photo</span>
                    </div>
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-3 py-1 fw-semibold">
                      Step 3 of 5
                    </span>
                  </div>

                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">ID Proof Type</label>
                      <select className="form-select" value={idType} onChange={(e) => setIdType(e.target.value)}>
                        <option value="Aadhaar">Aadhaar Card</option>
                        <option value="PAN">PAN Card</option>
                        <option value="Passport">Passport</option>
                        <option value="Driving Licence">Driving Licence</option>
                        <option value="Voter ID">Voter ID</option>
                        <option value="Other">Other Government ID</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">ID Proof Number</label>
                      <input type="text" className="form-control" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="Enter ID Proof Serial Number" />
                    </div>
                  </div>

                  {/* ID Cards Upload Boxes */}
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-dark">ID Document (Front Side)</label>
                      <div className="border border-dashed p-3 rounded-3 text-center bg-light position-relative">
                        {docFile ? (
                          <div className="d-flex align-items-center justify-content-between p-2 bg-white rounded border">
                            <div className="d-flex align-items-center gap-2 overflow-hidden text-start">
                              <FileText size={20} className="text-primary flex-shrink-0" />
                              <div className="text-truncate small fw-semibold">{docFile.name}</div>
                            </div>
                            <button type="button" className="btn btn-sm btn-link text-danger p-0" onClick={() => setDocFile(null)}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ) : (
                          <div>
                            <UploadCloud size={28} className="text-primary mb-1" />
                            <div className="small fw-semibold text-dark">Upload ID Front</div>
                            <div className="text-muted" style={{ fontSize: '0.725rem' }}>JPG, PNG or PDF</div>
                            <input type="file" accept="image/*,application/pdf" className="opacity-0 position-absolute start-0 top-0 w-100 h-100 cursor-pointer" onChange={(e) => setDocFile(e.target.files[0] || null)} />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-dark">ID Document (Back Side)</label>
                      <div className="border border-dashed p-3 rounded-3 text-center bg-light position-relative">
                        {docBackFile ? (
                          <div className="d-flex align-items-center justify-content-between p-2 bg-white rounded border">
                            <div className="d-flex align-items-center gap-2 overflow-hidden text-start">
                              <FileText size={20} className="text-primary flex-shrink-0" />
                              <div className="text-truncate small fw-semibold">{docBackFile.name}</div>
                            </div>
                            <button type="button" className="btn btn-sm btn-link text-danger p-0" onClick={() => setDocBackFile(null)}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ) : (
                          <div>
                            <UploadCloud size={28} className="text-primary mb-1" />
                            <div className="small fw-semibold text-dark">Upload ID Back</div>
                            <div className="text-muted" style={{ fontSize: '0.725rem' }}>JPG, PNG or PDF</div>
                            <input type="file" accept="image/*,application/pdf" className="opacity-0 position-absolute start-0 top-0 w-100 h-100 cursor-pointer" onChange={(e) => setDocBackFile(e.target.files[0] || null)} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Guest Photo Webcam & File Upload */}
                  <div className="p-3 bg-light rounded-3 border">
                    <label className="form-label fw-bold text-dark mb-2">Guest Live Photo Verification</label>
                    <div className="d-flex flex-wrap align-items-center gap-3">
                      <button type="button" className="btn btn-outline-primary fw-semibold d-flex align-items-center gap-2" onClick={() => setShowCamera(true)}>
                        <Camera size={18} /> Open Webcam
                      </button>
                      <div className="position-relative">
                        <button type="button" className="btn btn-light border fw-semibold d-flex align-items-center gap-2">
                          <UploadCloud size={18} /> Upload Photo File
                        </button>
                        <input
                          type="file"
                          accept="image/*"
                          className="opacity-0 position-absolute start-0 top-0 w-100 h-100 cursor-pointer"
                          onChange={(e) => {
                            if (e.target.files[0]) {
                              setPhotoFile(e.target.files[0]);
                              setPhotoPreview(URL.createObjectURL(e.target.files[0]));
                            }
                          }}
                        />
                      </div>
                      {photoPreview && (
                        <div className="d-flex align-items-center gap-2 bg-white p-1.5 rounded-3 border">
                          <img src={photoPreview} alt="Guest" className="rounded-circle" style={{ width: '48px', height: '48px', objectFit: 'cover' }} />
                          <span className="small text-success fw-bold me-2">✓ Photo Verified</span>
                          <button type="button" className="btn btn-sm btn-link text-danger p-0 me-1" onClick={() => { setPhotoFile(null); setPhotoPreview(''); }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 3 Navigation */}
                  <div className="d-flex justify-content-between mt-4 pt-3 border-top">
                    <button type="button" className="btn btn-light border btn-lg px-4" onClick={handlePrevStep}>
                      <ArrowLeft size={18} className="me-1" /> Back
                    </button>
                    <button type="button" className="btn btn-primary btn-lg fw-semibold px-4 shadow-sm d-flex align-items-center gap-2" onClick={handleNextStep}>
                      Next: Payment <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: INITIAL PAYMENT */}
              {currentStep === 4 && (
                <div className="saas-card p-4 border-0 bg-white shadow-sm mb-4 step-animated-card" key="step-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h5 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
                        <CreditCard size={20} className="text-success" /> Step 4 — Initial Advance Payment
                      </h5>
                      <span className="text-muted small">Collect advance payment and select payment method</span>
                    </div>
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-3 py-1 fw-semibold">
                      Step 4 of 5
                    </span>
                  </div>

                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Advance Amount Collected (₹)</label>
                      <div className="input-group">
                        <span className="input-group-text fw-bold bg-white text-success">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="form-control form-control-lg fw-bold text-success"
                          value={advancePayment}
                          onChange={(e) => setAdvancePayment(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Payment Collection Method</label>
                      <select className="form-select form-select-lg" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                        <option value="CASH">Cash Collection</option>
                        <option value="UPI">UPI / QR Code</option>
                        <option value="CARD">Debit / Credit Card</option>
                        <option value="BANK_TRANSFER">Direct Bank Transfer</option>
                      </select>
                    </div>
                  </div>

                  {/* Summary of Charges Box */}
                  <div className="p-3 bg-light rounded-3 border">
                    <div className="fw-bold text-dark mb-2">Payment Summary</div>
                    <div className="d-flex justify-content-between text-muted small mb-1">
                      <span>Room Subtotal ({nightsCount} Night x {formatCurrency(activeRate)}):</span>
                      <span className="text-dark fw-semibold">{formatCurrency(roomAmountTotal)}</span>
                    </div>
                    <div className="d-flex justify-content-between text-muted small mb-1">
                      <span>Estimated GST (18%):</span>
                      <span className="text-dark fw-semibold">{formatCurrency(estimatedGst)}</span>
                    </div>
                    <div className="d-flex justify-content-between fw-bold text-dark fs-6 my-2 pt-2 border-top">
                      <span>Grand Total Bill:</span>
                      <span className="text-primary">{formatCurrency(grandTotalEstimate)}</span>
                    </div>
                    <div className="d-flex justify-content-between text-danger fw-bold fs-6 pt-1">
                      <span>Remaining Balance Due:</span>
                      <span>{formatCurrency(estimatedBalance)}</span>
                    </div>
                  </div>

                  {/* Step 4 Navigation */}
                  <div className="d-flex justify-content-between mt-4 pt-3 border-top">
                    <button type="button" className="btn btn-light border btn-lg px-4" onClick={handlePrevStep}>
                      <ArrowLeft size={18} className="me-1" /> Back
                    </button>
                    <button type="button" className="btn btn-primary btn-lg fw-semibold px-4 shadow-sm d-flex align-items-center gap-2" onClick={handleNextStep}>
                      Next: Confirmation <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 5: REVIEW & FINAL CONFIRMATION */}
              {currentStep === 5 && (
                <div className="saas-card p-4 border-0 bg-white shadow-sm mb-4 step-animated-card" key="step-5">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h5 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
                        <CheckCircle2 size={20} className="text-success" /> Step 5 — Review & Final Confirmation
                      </h5>
                      <span className="text-muted small">Verify guest summary and complete check-in</span>
                    </div>
                    <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-1 fw-semibold">
                      Step 5 of 5
                    </span>
                  </div>

                  {/* Summary Overview Grid */}
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <div className="p-3 bg-light rounded-3 border h-100">
                        <div className="fw-bold text-primary mb-1">Allocated Room</div>
                        <div className="fs-5 fw-bold text-dark">{selectedRoomObj ? `Room ${selectedRoomObj.room_number}` : 'No Room Selected'}</div>
                        <div className="small text-muted">{selectedRoomObj?.room_type_name}</div>
                        <div className="small text-dark mt-2"><strong>Dates:</strong> {checkInDate} to {checkoutDate} ({nightsCount} Night)</div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="p-3 bg-light rounded-3 border h-100">
                        <div className="fw-bold text-primary mb-1">Guest Profile</div>
                        <div className="fs-5 fw-bold text-dark">{firstName} {lastName}</div>
                        <div className="small text-muted">📞 {mobile}</div>
                        <div className="small text-dark mt-2"><strong>ID:</strong> {idType} {idNumber ? `(${idNumber})` : ''}</div>
                      </div>
                    </div>
                  </div>

                  {/* Verification Consent Checkbox */}
                  <div className="p-3 bg-success-subtle rounded-3 border border-success-subtle mb-4">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="consentCheckFinal"
                        checked={verifiedConsent}
                        onChange={(e) => setVerifiedConsent(e.target.checked)}
                      />
                      <label className="form-check-label fw-semibold text-dark small" htmlFor="consentCheckFinal">
                        I confirm that the primary guest profile, photo, and identity proof document have been verified according to lodge policy.
                      </label>
                    </div>
                  </div>

                  {/* Step 5 Navigation & Submit */}
                  <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                    <button type="button" className="btn btn-light border btn-lg px-4" onClick={handlePrevStep}>
                      <ArrowLeft size={18} className="me-1" /> Back
                    </button>
                    <button type="submit" className="btn btn-success btn-lg fw-bold px-4 py-3 shadow-sm d-flex align-items-center gap-2">
                      <UserCheck size={20} /> Complete Check-In & Issue Key
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT COLUMN: STICKY LIVE STAY & BILL SUMMARY */}
            <div className="col-lg-4">
              <div className="position-sticky" style={{ top: '90px' }}>
                <div className="saas-card p-4 border-0 bg-white shadow-sm mb-4">
                  <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
                    <h5 className="fw-bold text-dark m-0">Stay Summary</h5>
                    <span className="badge bg-primary rounded-pill px-2.5 py-1">
                      {nightsCount} Night{nightsCount > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Room Details Summary */}
                  <div className="p-3 bg-light rounded-3 border mb-3">
                    <div className="text-muted small">Allocated Room</div>
                    <div className="fw-bold text-dark fs-5">
                      {selectedRoomObj ? `Room ${selectedRoomObj.room_number}` : 'Select Room'}
                    </div>
                    <div className="small text-muted">{selectedRoomObj?.room_type_name || 'Standard'}</div>
                  </div>

                  {/* Datetime Summary */}
                  <div className="mb-3 small">
                    <div className="d-flex justify-content-between text-muted mb-1">
                      <span>Check-In:</span>
                      <strong className="text-dark">{checkInDate} @ {checkInTime}</strong>
                    </div>
                    <div className="d-flex justify-content-between text-muted mb-1">
                      <span>Check-Out:</span>
                      <strong className="text-dark">{checkoutDate} @ {checkoutTime}</strong>
                    </div>
                    <div className="d-flex justify-content-between text-muted">
                      <span>Occupancy:</span>
                      <strong className="text-dark">{adults} Adult(s), {children} Child</strong>
                    </div>
                  </div>

                  <hr />

                  {/* Billing Calculation Breakdown */}
                  <h6 className="fw-bold text-dark mb-3">Estimated Billing Breakdown</h6>
                  <div className="d-flex justify-content-between text-muted small mb-2">
                    <span>Room Charges ({nightsCount} Night x {formatCurrency(activeRate)})</span>
                    <strong className="text-dark">{formatCurrency(roomAmountTotal)}</strong>
                  </div>
                  <div className="d-flex justify-content-between text-muted small mb-2">
                    <span>Estimated GST (18%)</span>
                    <strong className="text-dark">{formatCurrency(estimatedGst)}</strong>
                  </div>
                  <div className="d-flex justify-content-between fw-bold text-dark fs-6 my-2 pt-2 border-top">
                    <span>Grand Total:</span>
                    <span className="text-primary">{formatCurrency(grandTotalEstimate)}</span>
                  </div>
                  <div className="d-flex justify-content-between text-muted small mb-2">
                    <span>Advance Payment Collected</span>
                    <strong className="text-success">{formatCurrency(numericAdvance)}</strong>
                  </div>

                  <div className="p-3 bg-danger-subtle rounded-3 border border-danger-subtle d-flex justify-content-between align-items-center mt-3">
                    <div>
                      <div className="text-danger small fw-semibold">Estimated Balance Due</div>
                      <div className="fw-bold text-danger fs-4">{formatCurrency(estimatedBalance)}</div>
                    </div>
                    <AlertTriangle size={24} className="text-danger" />
                  </div>

                  {/* Check-In Primary Action Button */}
                  <button
                    type="submit"
                    className="btn btn-success btn-lg w-100 mt-4 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 py-3"
                  >
                    <UserCheck size={20} /> Complete Check-In
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* STICKY BOTTOM ACTION BAR */}
          <div className="fixed-bottom bg-white border-top shadow-lg p-3 no-print z-3">
            <div className="d-flex justify-content-between align-items-center" style={{ maxWidth: '1400px', margin: '0 auto' }}>
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-light border fw-semibold" onClick={() => navigate('/current-stays')}>
                  Cancel
                </button>
              </div>
              <div className="d-flex gap-3 align-items-center">
                <div className="text-end d-none d-md-block">
                  <div className="small text-muted">Estimated Grand Total</div>
                  <div className="fw-bold text-dark">{formatCurrency(grandTotalEstimate)}</div>
                </div>
                <button type="submit" className="btn btn-success btn-lg fw-bold px-4 shadow-sm d-flex align-items-center gap-2">
                  <UserCheck size={20} /> Complete Check-In
                </button>
              </div>
            </div>
          </div>

        </form>
      )}

      {/* Webcam Capture Modal */}
      <CameraCaptureModal
        show={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={(file, previewUrl) => {
          setPhotoFile(file);
          setPhotoPreview(previewUrl);
        }}
      />

    </div>
  );
};

export default CheckIn;
