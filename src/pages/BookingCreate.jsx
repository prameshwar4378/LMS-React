import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkAvailabilityApi, getRoomTypesApi } from '../api/roomApi';
import { getCustomersApi, createCustomerApi } from '../api/customerApi';
import { createBookingApi } from '../api/bookingApi';
import { getTodayDateString, getTomorrowDateString, formatDate } from '../utils/dateUtils';
import SearchableCustomerSelect from '../components/SearchableCustomerSelect';
import { formatCurrency } from '../utils/formatCurrency';
import { useNotification } from '../context/NotificationContext';
import {
  Calendar,
  Clock,
  DoorOpen,
  UserCheck,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Search,
  Plus,
  Minus,
  Trash2,
  ShieldCheck,
  Check,
  ChevronRight,
  Zap,
  Sliders,
  Receipt,
  Building2,
  AlertTriangle,
  UserPlus,
  FileText
} from 'lucide-react';

const BookingCreate = () => {
  const navigate = useNavigate();
  const { showError, showWarning, showSuccess } = useNotification();

  // STEP WIZARD STATE (1 to 4)
  const [currentStep, setCurrentStep] = useState(1);

  const [checkInDate, setCheckInDate] = useState(getTodayDateString());
  const [checkInTime, setCheckInTime] = useState('12:00');
  const [checkoutDate, setCheckoutDate] = useState(getTomorrowDateString());
  const [checkoutTime, setCheckoutTime] = useState('11:00');

  const [roomTypes, setRoomTypes] = useState([]);
  const [selectedRoomType, setSelectedRoomType] = useState('');

  // Available Rooms from Backend
  const [availableRooms, setAvailableRooms] = useState([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Multi-Room Selection States
  const [selectedRoomIds, setSelectedRoomIds] = useState([]);
  const [roomRatesMap, setRoomRatesMap] = useState({});

  // Customer Selection / Creation
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [custFirstName, setCustFirstName] = useState('');
  const [custLastName, setCustLastName] = useState('');
  const [custMobile, setCustMobile] = useState('');
  const [custEmail, setCustEmail] = useState('');

  // Booking Details
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getRoomTypesApi().then(setRoomTypes).catch(console.error);
    getCustomersApi().then(setCustomers).catch(console.error);
  }, []);

  useEffect(() => {
    if (checkInDate && checkoutDate) {
      fetchAvailability();
    }
  }, [checkInDate, checkInTime, checkoutDate, checkoutTime, selectedRoomType]);

  const fetchAvailability = async () => {
    setCheckingAvailability(true);
    setError('');
    try {
      const checkInFull = `${checkInDate}T${checkInTime}:00`;
      const checkoutFull = `${checkoutDate}T${checkoutTime}:00`;
      const res = await checkAvailabilityApi(checkInFull, checkoutFull, selectedRoomType);
      const roomsList = res.rooms || [];
      setAvailableRooms(roomsList);

      const availableIds = new Set(roomsList.map((r) => r.id));
      const validSelectedIds = selectedRoomIds.filter((id) => availableIds.has(id));

      if (validSelectedIds.length > 0) {
        setSelectedRoomIds(validSelectedIds);
        const updatedRates = {};
        validSelectedIds.forEach((id) => {
          if (roomRatesMap[id] !== undefined) {
            updatedRates[id] = roomRatesMap[id];
          } else {
            const rm = roomsList.find((r) => r.id === id);
            if (rm) updatedRates[id] = rm.base_price;
          }
        });
        setRoomRatesMap(updatedRates);
      } else if (roomsList.length > 0) {
        setSelectedRoomIds([roomsList[0].id]);
        setRoomRatesMap({ [roomsList[0].id]: roomsList[0].base_price });
      } else {
        setSelectedRoomIds([]);
        setRoomRatesMap({});
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to check room availability.');
    } finally {
      setCheckingAvailability(false);
    }
  };

  // Toggle multi-room selection
  const handleToggleRoom = (roomObj) => {
    setError('');
    const rId = roomObj.id;
    if (selectedRoomIds.includes(rId)) {
      if (selectedRoomIds.length === 1) {
        alert('At least one room must be selected for booking.');
        return;
      }
      setSelectedRoomIds(selectedRoomIds.filter((id) => id !== rId));
      const updatedRates = { ...roomRatesMap };
      delete updatedRates[rId];
      setRoomRatesMap(updatedRates);
    } else {
      setSelectedRoomIds([...selectedRoomIds, rId]);
      setRoomRatesMap({
        ...roomRatesMap,
        [rId]: roomObj.base_price
      });
    }
  };

  const handleRateChange = (rId, rateVal) => {
    setError('');
    setRoomRatesMap({
      ...roomRatesMap,
      [rId]: rateVal
    });
  };

  const calculateNights = () => {
    if (!checkInDate || !checkoutDate) return 1;
    const start = new Date(checkInDate);
    const end = new Date(checkoutDate);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const nights = calculateNights();
  const selectedRoomsObjs = availableRooms.filter((r) => selectedRoomIds.includes(r.id));

  const totalNightlyRateSum = selectedRoomsObjs.reduce((sum, r) => {
    const rate = parseFloat(roomRatesMap[r.id] || r.base_price || 0);
    return sum + rate;
  }, 0);

  const totalRoomCharge = nights * totalNightlyRateSum;
  const estimatedGst = Math.round(totalRoomCharge * 0.18);
  const grandTotalEstimate = totalRoomCharge + estimatedGst;
  const numericAdvance = parseFloat(advanceAmount || 0);
  const remainingBalance = Math.max(0, grandTotalEstimate - numericAdvance);

  const selectedCustObj = customers.find((c) => String(c.id) === String(selectedCustomerId));

  // Wizard Step Navigation
  const handleNextStep = () => {
    setError('');
    if (currentStep === 1) {
      if (selectedRoomIds.length === 0) {
        setError('Please select at least one available room before proceeding.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (isNewCustomer) {
        if (!custFirstName || !custMobile) {
          setError('Guest First Name and Mobile Number are required.');
          return;
        }
      } else if (!selectedCustomerId) {
        setError('Please select an existing customer or create a new profile.');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    }
  };

  const handlePrevStep = () => {
    setError('');
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const extractErrorMessage = (err, defaultMsg = 'Error creating booking.') => {
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

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');

    if (selectedRoomIds.length === 0) {
      const msg = 'Please select at least one available room.';
      setError(msg);
      showWarning(msg, 'Room Selection Required');
      return;
    }

    let customerIdToUse = selectedCustomerId;

    if (isNewCustomer) {
      if (!custFirstName || !custMobile) {
        const msg = 'First name and mobile number are required for new customer.';
        setError(msg);
        showWarning(msg, 'Guest Details Required');
        return;
      }
      try {
        const newCust = await createCustomerApi({
          first_name: custFirstName,
          last_name: custLastName,
          mobile: custMobile,
          email: custEmail,
          id_type: 'Aadhaar'
        });
        customerIdToUse = newCust.id;
      } catch (err) {
        const errMsg = extractErrorMessage(err, 'Failed to create customer profile.');
        setError(errMsg);
        showError(errMsg, 'Profile Creation Failed');
        return;
      }
    }

    if (!customerIdToUse) {
      const msg = 'Please select or create a customer.';
      setError(msg);
      showWarning(msg, 'Customer Required');
      return;
    }

    setSubmitting(true);
    try {
      const advancePerRoom = (numericAdvance / selectedRoomIds.length).toFixed(2);

      for (let i = 0; i < selectedRoomIds.length; i++) {
        const rId = selectedRoomIds[i];
        const roomObj = availableRooms.find((rm) => rm.id === rId);
        const rateToUse = parseFloat(roomRatesMap[rId] || roomObj?.base_price || roomObj?.room_type?.base_price || 0);
        const groupNote = selectedRoomIds.length > 1
          ? `[Multi-Room Group Booking (${selectedRoomIds.length} Rooms)] ${notes || ''}`
          : notes;

        await createBookingApi({
          customer: customerIdToUse,
          room: rId,
          check_in_date: checkInDate,
          check_in_time: checkInTime,
          expected_checkout_date: checkoutDate,
          expected_checkout_time: checkoutTime,
          adults: parseInt(adults),
          children: parseInt(children),
          room_rate: rateToUse,
          discount_type: 'FIXED',
          discount_value: 0.00,
          advance_amount: parseFloat(advancePerRoom),
          notes: groupNote,
          status: 'CONFIRMED'
        });
      }

      showSuccess('Advance reservation created successfully!', 'Reservation Created');
      navigate('/bookings');
    } catch (err) {
      console.error(err);
      const errMsg = extractErrorMessage(err, 'Error creating reservation.');
      setError(errMsg);
      showError(errMsg, 'Reservation Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const isStep1Valid = selectedRoomIds.length > 0;
  const isStep2Valid = isNewCustomer ? (!!custFirstName && !!custMobile) : !!selectedCustomerId;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }} className="pb-5">
      {/* Header Banner */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4 pb-2 border-bottom">
        <div>
          <div className="d-flex align-items-center gap-2">
            <div className="p-2 bg-primary-subtle text-primary rounded-3">
              <Building2 size={22} />
            </div>
            <div>
              <h3 className="fw-bold text-dark m-0 tracking-tight">
                Create Advance Reservation
              </h3>
              <p className="text-muted small m-0">Single & Multi-Room group reservation wizard</p>
            </div>
          </div>
        </div>

        <button className="btn btn-light border fw-semibold shadow-xs" onClick={() => navigate('/bookings')}>
          <ArrowLeft size={16} className="me-1.5" /> Back to Reservations
        </button>
      </div>

      {/* STEPPER PROGRESS BAR */}
      <div className="saas-card bg-white p-3 mb-4 border-0 shadow-sm d-flex flex-wrap align-items-center justify-content-around gap-2">
        <div
          onClick={() => setCurrentStep(1)}
          className={`d-flex align-items-center gap-2 cursor-pointer ${currentStep === 1 ? 'text-primary fw-bold' : currentStep > 1 ? 'text-success fw-semibold' : 'text-muted'}`}
          style={{ cursor: 'pointer' }}
        >
          <div className={`rounded-circle d-flex align-items-center justify-content-center ${currentStep === 1 ? 'bg-primary text-white shadow-xs' : currentStep > 1 ? 'bg-success text-white' : 'bg-light text-muted'}`} style={{ width: '30px', height: '30px', fontSize: '0.85rem' }}>
            {currentStep > 1 ? <Check size={16} /> : '1'}
          </div>
          <span>1. Stay & Rooms</span>
        </div>
        <ChevronRight size={16} className="text-muted d-none d-md-block" />

        <div
          onClick={() => isStep1Valid && setCurrentStep(2)}
          className={`d-flex align-items-center gap-2 cursor-pointer ${currentStep === 2 ? 'text-primary fw-bold' : currentStep > 2 ? 'text-success fw-semibold' : 'text-muted'}`}
          style={{ cursor: isStep1Valid ? 'pointer' : 'not-allowed' }}
        >
          <div className={`rounded-circle d-flex align-items-center justify-content-center ${currentStep === 2 ? 'bg-primary text-white shadow-xs' : currentStep > 2 ? 'bg-success text-white' : 'bg-light text-muted'}`} style={{ width: '30px', height: '30px', fontSize: '0.85rem' }}>
            {currentStep > 2 ? <Check size={16} /> : '2'}
          </div>
          <span>2. Guest Profile</span>
        </div>
        <ChevronRight size={16} className="text-muted d-none d-md-block" />

        <div
          onClick={() => isStep2Valid && setCurrentStep(3)}
          className={`d-flex align-items-center gap-2 cursor-pointer ${currentStep === 3 ? 'text-primary fw-bold' : currentStep > 3 ? 'text-success fw-semibold' : 'text-muted'}`}
          style={{ cursor: isStep2Valid ? 'pointer' : 'not-allowed' }}
        >
          <div className={`rounded-circle d-flex align-items-center justify-content-center ${currentStep === 3 ? 'bg-primary text-white shadow-xs' : currentStep > 3 ? 'bg-success text-white' : 'bg-light text-muted'}`} style={{ width: '30px', height: '30px', fontSize: '0.85rem' }}>
            {currentStep > 3 ? <Check size={16} /> : '3'}
          </div>
          <span>3. Rates & Advance</span>
        </div>
        <ChevronRight size={16} className="text-muted d-none d-md-block" />

        <div
          onClick={() => isStep2Valid && setCurrentStep(4)}
          className={`d-flex align-items-center gap-2 cursor-pointer ${currentStep === 4 ? 'text-success fw-bold' : 'text-muted'}`}
          style={{ cursor: isStep2Valid ? 'pointer' : 'not-allowed' }}
        >
          <div className={`rounded-circle d-flex align-items-center justify-content-center ${currentStep === 4 ? 'bg-success text-white shadow-xs' : 'bg-light text-muted'}`} style={{ width: '30px', height: '30px', fontSize: '0.85rem' }}>
            {currentStep === 4 ? <Check size={16} /> : '4'}
          </div>
          <span>4. Review & Confirm</span>
        </div>
      </div>



      {/* Main Layout Grid */}
      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          <div className="col-lg-8">

            {/* STEP 1: STAY DATES & ROOM SELECTION */}
            {currentStep === 1 && (
              <div className="saas-card p-4 border-0 bg-white shadow-sm mb-4 step-animated-card" key="step-1">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
                      <DoorOpen size={20} className="text-primary" /> Step 1 — Select Stay Dates & Rooms
                    </h5>
                    <span className="text-muted small">Choose stay period and select single or multiple rooms</span>
                  </div>
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-3 py-1 fw-semibold">
                    Step 1 of 4
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

                  <div className="col-12 mt-2">
                    <label className="form-label small fw-semibold text-dark">Filter Available Rooms by Type</label>
                    <select className="form-select form-select-sm" value={selectedRoomType} onChange={(e) => setSelectedRoomType(e.target.value)}>
                      <option value="">All Room Types ({roomTypes.length} Categories Available)</option>
                      {roomTypes.map((rt) => (
                        <option key={rt.id} value={rt.id}>{rt.name} (Base: ₹{rt.base_price}/night)</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Available Rooms Grid */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <label className="form-label fw-bold text-dark m-0">Available Rooms ({availableRooms.length})</label>
                    <span className="text-muted small d-block">Click on rooms to select/unselect for group booking</span>
                  </div>
                  {checkingAvailability && (
                    <span className="badge bg-light text-primary border">
                      <span className="spinner-border spinner-border-sm me-1"></span>Checking Availability...
                    </span>
                  )}
                </div>

                {availableRooms.length === 0 ? (
                  <div className="p-4 text-center text-muted bg-light rounded-3 border">
                    No available rooms found for the selected dates. Try adjusting date filters.
                  </div>
                ) : (
                  <div className="row g-3 mb-3" style={{ maxHeight: '340px', overflowY: 'auto' }}>
                    {availableRooms.map((rm) => {
                      const isSelected = selectedRoomIds.includes(rm.id);
                      return (
                        <div key={rm.id} className="col-md-4 col-sm-6">
                          <div
                            onClick={() => handleToggleRoom(rm)}
                            className={`p-3 rounded-3 border transition-all cursor-pointer h-100 ${isSelected ? 'border-primary bg-primary-subtle shadow-sm' : 'bg-white hover-border-primary'}`}
                            style={{ cursor: 'pointer', borderLineWidth: isSelected ? '2px' : '1px' }}
                          >
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="fw-bold text-dark fs-6">Room {rm.room_number}</span>
                              <span className={`badge ${isSelected ? 'bg-primary' : 'bg-success-subtle text-success'} rounded-pill px-2`} style={{ fontSize: '0.675rem' }}>
                                {isSelected ? 'SELECTED' : 'Available'}
                              </span>
                            </div>
                            <div className="text-muted small mb-2">{rm.room_type_name}</div>
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="fw-bold text-primary">{formatCurrency(rm.base_price)}</span>
                              <span className="text-muted" style={{ fontSize: '0.725rem' }}>{rm.floor || '1st Floor'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Step 1 Navigation */}
                <div className="d-flex justify-content-end mt-4 pt-3 border-top">
                  <button
                    type="button"
                    className="btn btn-primary btn-lg fw-semibold px-4 shadow-sm d-flex align-items-center gap-2"
                    onClick={handleNextStep}
                  >
                    Next: Guest Profile <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: PRIMARY GUEST PROFILE */}
            {currentStep === 2 && (
              <div className="saas-card p-4 border-0 bg-white shadow-sm mb-4 step-animated-card" key="step-2">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
                      <UserCheck size={20} className="text-primary" /> Step 2 — Primary Guest Profile
                    </h5>
                    <span className="text-muted small">Search existing directory or create a new guest profile</span>
                  </div>
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-3 py-1 fw-semibold">
                    Step 2 of 4
                  </span>
                </div>

                <div className="form-check form-switch mb-3 p-2.5 bg-light rounded-3 border d-flex align-items-center gap-2">
                  <input
                    className="form-check-input ms-0"
                    type="checkbox"
                    id="newCustSwitchWizard"
                    checked={isNewCustomer}
                    onChange={(e) => setIsNewCustomer(e.target.checked)}
                  />
                  <label className="form-check-label fw-bold text-dark cursor-pointer m-0 small" htmlFor="newCustSwitchWizard">
                    + Register & Create New Customer Profile
                  </label>
                </div>

                {!isNewCustomer ? (
                  <div className="mb-4">
                    <label className="form-label small fw-semibold text-primary">Search Registered Customer Directory</label>
                    <SearchableCustomerSelect
                      customers={customers}
                      selectedCustomerId={selectedCustomerId}
                      onSelectCustomer={(id) => setSelectedCustomerId(id)}
                      placeholder="Search customer by name, mobile, or Aadhaar ID..."
                    />
                  </div>
                ) : (
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">First Name *</label>
                      <input type="text" className="form-control" required value={custFirstName} onChange={(e) => setCustFirstName(e.target.value)} placeholder="Guest First Name" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Last Name</label>
                      <input type="text" className="form-control" value={custLastName} onChange={(e) => setCustLastName(e.target.value)} placeholder="Guest Last Name" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Mobile Number *</label>
                      <input type="text" className="form-control" required value={custMobile} onChange={(e) => setCustMobile(e.target.value)} placeholder="10-digit Mobile Number" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Email Address</label>
                      <input type="email" className="form-control" value={custEmail} onChange={(e) => setCustEmail(e.target.value)} placeholder="guest@example.com" />
                    </div>
                  </div>
                )}

                {/* Occupancy Steppers */}
                <div className="p-3 bg-light rounded-3 border">
                  <label className="form-label fw-bold text-dark mb-2">Guest Occupancy Count (Per Room)</label>
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
                    Next: Rates & Advance <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: RATES & ADVANCE DEPOSIT */}
            {currentStep === 3 && (
              <div className="saas-card p-4 border-0 bg-white shadow-sm mb-4 step-animated-card" key="step-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
                      <CreditCard size={20} className="text-success" /> Step 3 — Rates & Advance Deposit
                    </h5>
                    <span className="text-muted small">Configure agreed daily rates and collect advance payment</span>
                  </div>
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-3 py-1 fw-semibold">
                    Step 3 of 4
                  </span>
                </div>

                {/* Multi-Room Rate Customization Table */}
                {selectedRoomsObjs.length > 0 && (
                  <div className="mb-4 p-3 rounded-3 border bg-light">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="fw-bold text-dark small">Agreed Rates for Selected {selectedRoomsObjs.length} Room(s)</span>
                      <span className="badge bg-primary">Total: {formatCurrency(totalNightlyRateSum)} / night</span>
                    </div>

                    <div className="table-responsive">
                      <table className="table table-sm align-middle bg-white rounded border m-0" style={{ fontSize: '0.85rem' }}>
                        <thead className="table-light">
                          <tr>
                            <th>Room #</th>
                            <th>Room Type</th>
                            <th>Base Price</th>
                            <th style={{ width: '180px' }}>Agreed Rate (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedRoomsObjs.map((r) => (
                            <tr key={r.id}>
                              <td className="fw-bold text-primary">Room {r.room_number}</td>
                              <td className="text-muted">{r.room_type_name}</td>
                              <td>{formatCurrency(r.base_price)}</td>
                              <td>
                                <div className="input-group input-group-sm">
                                  <span className="input-group-text bg-white">₹</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="form-control fw-bold text-primary"
                                    value={roomRatesMap[r.id] !== undefined ? roomRatesMap[r.id] : r.base_price}
                                    onChange={(e) => handleRateChange(r.id, e.target.value)}
                                  />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Advance Amount & Notes */}
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Combined Group Advance Deposit (₹)</label>
                    <div className="input-group">
                      <span className="input-group-text fw-bold bg-white text-success">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-control form-control-lg fw-bold text-success"
                        value={advanceAmount}
                        onChange={(e) => setAdvanceAmount(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    {/* Quick Deposit Chips */}
                    <div className="d-flex gap-1 mt-2 flex-wrap">
                      <span className="text-muted small me-1">Quick Deposit:</span>
                      {[500, 1000, 2000, totalRoomCharge].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          className="btn btn-xs btn-outline-success py-0 px-2 fw-semibold"
                          style={{ fontSize: '0.75rem' }}
                          onClick={() => setAdvanceAmount(amt)}
                        >
                          ₹{amt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Special Requests / Group Notes</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Optional notes e.g. Corporate Tour Group, Connecting rooms requested..."
                    ></textarea>
                  </div>
                </div>

                {/* Step 3 Navigation */}
                <div className="d-flex justify-content-between mt-4 pt-3 border-top">
                  <button type="button" className="btn btn-light border btn-lg px-4" onClick={handlePrevStep}>
                    <ArrowLeft size={18} className="me-1" /> Back
                  </button>
                  <button type="button" className="btn btn-primary btn-lg fw-semibold px-4 shadow-sm d-flex align-items-center gap-2" onClick={handleNextStep}>
                    Next: Review & Confirm <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: REVIEW & FINAL CONFIRMATION */}
            {currentStep === 4 && (
              <div className="saas-card p-4 border-0 bg-white shadow-sm mb-4 step-animated-card" key="step-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
                      <CheckCircle2 size={20} className="text-success" /> Step 4 — Review & Final Confirmation
                    </h5>
                    <span className="text-muted small">Verify reservation details and confirm booking</span>
                  </div>
                  <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-1 fw-semibold">
                    Step 4 of 4
                  </span>
                </div>

                {/* Summary Overview Grid */}
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded-3 border h-100">
                      <div className="fw-bold text-primary mb-1">Target Accommodations</div>
                      <div className="fs-5 fw-bold text-dark">
                        {selectedRoomsObjs.map((r) => `Room ${r.room_number}`).join(', ')}
                      </div>
                      <div className="small text-muted">{selectedRoomsObjs.length} Room{selectedRoomsObjs.length > 1 ? 's' : ''} Selected</div>
                      <div className="small text-dark mt-2"><strong>Dates:</strong> {formatDate(checkInDate)} to {formatDate(checkoutDate)} ({nights} Night)</div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded-3 border h-100">
                      <div className="fw-bold text-primary mb-1">Primary Guest Profile</div>
                      <div className="fs-5 fw-bold text-dark">
                        {isNewCustomer ? `${custFirstName} ${custLastName}` : selectedCustObj?.full_name || 'Guest'}
                      </div>
                      <div className="small text-muted">📞 {isNewCustomer ? custMobile : selectedCustObj?.mobile}</div>
                      <div className="small text-dark mt-2"><strong>Occupancy:</strong> {adults} Adult(s), {children} Child</div>
                    </div>
                  </div>
                </div>

                {/* Step 4 Navigation & Submit */}
                <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                  <button type="button" className="btn btn-light border btn-lg px-4" onClick={handlePrevStep}>
                    <ArrowLeft size={18} className="me-1" /> Back
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success btn-lg fw-bold px-4 py-3 shadow-sm d-flex align-items-center gap-2"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Creating Reservation...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={20} /> Confirm & Create Reservation ({selectedRoomIds.length} Room{selectedRoomIds.length > 1 ? 's' : ''})
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT PANEL: Live Interactive Group Quotation Card */}
          <div className="col-lg-4">
            <div className="position-sticky" style={{ top: '90px' }}>
              <div className="saas-card p-4 border-0 bg-white shadow-sm mb-4">
                <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
                  <h5 className="fw-bold text-dark m-0">Reservation Summary</h5>
                  <span className="badge bg-primary rounded-pill px-2.5 py-1">
                    {nights} Night{nights > 1 ? 's' : ''}
                  </span>
                </div>

                {/* Selected Rooms Summary */}
                <div className="p-3 bg-light rounded-3 border mb-3">
                  <div className="text-muted small">Target Accommodations ({selectedRoomsObjs.length})</div>
                  {selectedRoomsObjs.length > 0 ? (
                    <div>
                      <div className="fw-bold text-primary fs-5">
                        {selectedRoomsObjs.map((r) => `Room ${r.room_number}`).join(', ')}
                      </div>
                      <div className="small text-dark fw-semibold">{selectedRoomsObjs.length} Room{selectedRoomsObjs.length > 1 ? 's' : ''} Selected</div>
                    </div>
                  ) : (
                    <div className="text-danger small fw-semibold">No Rooms Selected</div>
                  )}
                </div>

                {/* Primary Guest Summary */}
                <div className="p-3 bg-light rounded-3 border mb-3">
                  <div className="text-muted small">Primary Guest</div>
                  <strong className="text-dark">
                    {isNewCustomer ? `${custFirstName || 'New Guest'} ${custLastName}` : selectedCustObj?.full_name || 'Select Customer'}
                  </strong>
                </div>

                {/* Financial Breakdown */}
                <h6 className="fw-bold text-dark mb-3">Financial Breakdown</h6>
                <div className="d-flex justify-content-between text-muted small mb-2">
                  <span>Room Charges Subtotal</span>
                  <strong className="text-dark">{formatCurrency(totalRoomCharge)}</strong>
                </div>
                <div className="d-flex justify-content-between text-muted small mb-2">
                  <span>Estimated GST (18%)</span>
                  <strong className="text-dark">{formatCurrency(estimatedGst)}</strong>
                </div>
                <div className="d-flex justify-content-between fw-bold text-dark fs-6 my-2 pt-2 border-top">
                  <span>Grand Total Bill:</span>
                  <span className="text-primary">{formatCurrency(grandTotalEstimate)}</span>
                </div>
                <div className="d-flex justify-content-between text-muted small mb-2">
                  <span>Advance Deposit Paid</span>
                  <strong className="text-success">{formatCurrency(numericAdvance)}</strong>
                </div>

                <div className="p-3 bg-danger-subtle rounded-3 border border-danger-subtle d-flex justify-content-between align-items-center mt-3">
                  <div>
                    <div className="text-danger small fw-semibold">Balance Due at Check-In</div>
                    <div className="fw-bold text-danger fs-4">{formatCurrency(remainingBalance)}</div>
                  </div>
                  <AlertTriangle size={24} className="text-danger" />
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  className="btn btn-success btn-lg w-100 mt-4 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 py-3"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={20} /> Create Reservation
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default BookingCreate;
