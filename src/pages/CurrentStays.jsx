import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getStaysApi, extendStayApi, addStayGuestApi } from '../api/stayApi';
import { createExtraChargeApi, createPaymentApi } from '../api/billingApi';
import GuestFormModal from '../components/GuestFormModal';
import ChargeFormModal from '../components/ChargeFormModal';
import PaymentFormModal from '../components/PaymentFormModal';
import PageLoader from '../components/PageLoader';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/dateUtils';
import { useNotification } from '../context/NotificationContext';
import {
  KeyRound,
  Search,
  Filter,
  X,
  Grid,
  List,
  Calendar,
  Clock,
  User,
  Phone,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Plus,
  MoreVertical,
  Eye,
  UserPlus,
  ShoppingCart,
  DollarSign,
  CalendarPlus,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BedDouble
} from 'lucide-react';

const CurrentStays = () => {
  const navigate = useNavigate();
  const { showError, showSuccess, showWarning, showConfirm } = useNotification();

  const [stays, setStays] = useState([]);
  const [loading, setLoading] = useState(true);

  // View Mode: 'cards' | 'table'
  const [viewMode, setViewMode] = useState('cards');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ACTIVE, DUE_TODAY, OVERDUE
  const [checkoutFilter, setCheckoutFilter] = useState('ALL'); // ALL, TODAY, TOMORROW, OVERDUE
  const [paymentFilter, setPaymentFilter] = useState('ALL'); // ALL, PENDING, PAID
  const [roomFilter, setRoomFilter] = useState('ALL'); // ALL or room_number

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Modal target stay state
  const [activeStayId, setActiveStayId] = useState(null);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeBalance, setActiveBalance] = useState(0);

  // Extend Stay modal
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [newExtendCheckout, setNewExtendCheckout] = useState('');

  useEffect(() => {
    loadStays();
  }, []);

  const loadStays = async () => {
    setLoading(true);
    try {
      const data = await getStaysApi({ current: 'true' });
      setStays(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Helper: Datetime-based Stay Status Analysis
  const analyzeStayStatus = (s) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const tomStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const expDateStr = s.expected_checkout_date || s.check_in_date;
    const expTimeStr = s.expected_checkout_time || '11:00';

    const expDateTimeStr = `${expDateStr}T${expTimeStr.length === 5 ? expTimeStr + ':00' : expTimeStr}`;
    const expDt = new Date(expDateTimeStr);
    const now = new Date();

    const isOverdue = now > expDt && s.status !== 'CHECKED_OUT';
    const isDueToday = expDateStr === todayStr && !isOverdue;
    const isDueTomorrow = expDateStr === tomStr;

    // Overdue Duration calculation
    let overdueText = '';
    if (isOverdue) {
      const diffMs = now - expDt;
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHrs / 24);
      const remHrs = diffHrs % 24;

      if (diffDays > 0) {
        overdueText = `${diffDays} Day${diffDays > 1 ? 's' : ''} ${remHrs} Hr${remHrs !== 1 ? 's' : ''}`;
      } else {
        overdueText = `${diffHrs} Hour${diffHrs !== 1 ? 's' : ''}`;
      }
    }

    return {
      isOverdue,
      isDueToday,
      isDueTomorrow,
      expDateStr,
      expTimeStr,
      overdueText
    };
  };

  // Summary Metrics Computation
  const metrics = useMemo(() => {
    let activeCount = 0;
    let overdueCount = 0;
    let dueTodayCount = 0;
    let pendingBalanceCount = 0;
    let totalPendingAmount = 0;

    stays.forEach((s) => {
      activeCount++;
      const { isOverdue, isDueToday } = analyzeStayStatus(s);
      if (isOverdue) overdueCount++;
      if (isDueToday) dueTodayCount++;

      const bill = s.bill_summary || {};
      const bal = parseFloat(bill.balance || 0);
      if (bal > 0) {
        pendingBalanceCount++;
        totalPendingAmount += bal;
      }
    });

    return { activeCount, overdueCount, dueTodayCount, pendingBalanceCount, totalPendingAmount };
  }, [stays]);

  // Extract unique room list for Room Filter dropdown
  const uniqueRooms = useMemo(() => {
    const set = new Set();
    stays.forEach((s) => {
      if (s.room_detail?.room_number) set.add(s.room_detail.room_number);
    });
    return Array.from(set).sort();
  }, [stays]);

  // Filtered Stays List
  const filteredStays = useMemo(() => {
    return stays.filter((s) => {
      const { isOverdue, isDueToday, isDueTomorrow, expDateStr } = analyzeStayStatus(s);
      const bill = s.bill_summary || {};
      const balance = parseFloat(bill.balance || 0);

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const stayNum = (s.stay_number || '').toLowerCase();
        const guestName = (s.primary_customer_detail?.full_name || '').toLowerCase();
        const mobile = (s.primary_customer_detail?.mobile || '').toLowerCase();
        const roomNum = String(s.room_detail?.room_number || '').toLowerCase();

        if (!stayNum.includes(q) && !guestName.includes(q) && !mobile.includes(q) && !roomNum.includes(q)) {
          return false;
        }
      }

      // Status Filter
      if (statusFilter === 'ACTIVE' && isOverdue) return false;
      if (statusFilter === 'DUE_TODAY' && !isDueToday) return false;
      if (statusFilter === 'OVERDUE' && !isOverdue) return false;

      // Checkout Filter
      if (checkoutFilter === 'TODAY' && !isDueToday) return false;
      if (checkoutFilter === 'TOMORROW' && !isDueTomorrow) return false;
      if (checkoutFilter === 'OVERDUE' && !isOverdue) return false;

      // Payment Filter
      if (paymentFilter === 'PENDING' && balance <= 0) return false;
      if (paymentFilter === 'PAID' && balance > 0) return false;

      // Room Filter
      if (roomFilter !== 'ALL' && String(s.room_detail?.room_number) !== String(roomFilter)) return false;

      return true;
    });
  }, [stays, searchQuery, statusFilter, checkoutFilter, paymentFilter, roomFilter]);

  // Count active applied filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (statusFilter !== 'ALL') count++;
    if (checkoutFilter !== 'ALL') count++;
    if (paymentFilter !== 'ALL') count++;
    if (roomFilter !== 'ALL') count++;
    return count;
  }, [searchQuery, statusFilter, checkoutFilter, paymentFilter, roomFilter]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setCheckoutFilter('ALL');
    setPaymentFilter('ALL');
    setRoomFilter('ALL');
    setCurrentPage(1);
  };

  // Paginated List
  const totalPages = Math.ceil(filteredStays.length / pageSize) || 1;
  const paginatedStays = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStays.slice(start, start + pageSize);
  }, [filteredStays, currentPage, pageSize]);

  // Modal Handlers
  const handleAddGuestSubmit = async (formData) => {
    try {
      await addStayGuestApi(formData);
      setShowGuestModal(false);
      loadStays();
    } catch (err) {
      alert('Error adding guest.');
    }
  };

  const handleAddChargeSubmit = async (data) => {
    try {
      await createExtraChargeApi(data);
      setShowChargeModal(false);
      loadStays();
    } catch (err) {
      alert('Error adding charge.');
    }
  };

  const handleAddPaymentSubmit = async (data) => {
    try {
      await createPaymentApi(data);
      setShowPaymentModal(false);
      loadStays();
    } catch (err) {
      alert('Error adding payment.');
    }
  };

  const handleExtendSubmit = async (e) => {
    e.preventDefault();
    try {
      await extendStayApi(activeStayId, newExtendCheckout);
      setShowExtendModal(false);
      loadStays();
    } catch (err) {
      alert(err.response?.data?.error || 'Error extending stay.');
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }} className="pb-5">
      {/* 1. PAGE HEADER & COMPACT SUMMARY METRICS */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4 pb-2 border-bottom">
        <div>
          <div className="d-flex align-items-center gap-2">
            <div className="p-2 bg-primary-subtle text-primary rounded-3">
              <KeyRound size={22} />
            </div>
            <div>
              <h3 className="fw-bold text-dark m-0 tracking-tight">Current Stays</h3>
              <p className="text-muted small m-0">Monitor active guests, room occupancy and checkout status in real-time</p>
            </div>
          </div>
        </div>

        <Link to="/check-in" className="btn btn-primary fw-semibold px-4 shadow-sm d-flex align-items-center gap-2">
          <Plus size={18} /> New Check-In
        </Link>
      </div>

      {/* COMPACT SUMMARY METRICS BAR */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="saas-card-static p-3 d-flex align-items-center justify-content-between border-start border-4 border-primary">
            <div>
              <div className="text-muted small fw-semibold">Active Stays</div>
              <div className="fs-3 fw-bold text-dark">{metrics.activeCount}</div>
            </div>
            <div className="p-2.5 bg-primary-subtle text-primary rounded-circle">
              <BedDouble size={20} />
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="saas-card-static p-3 d-flex align-items-center justify-content-between border-start border-4 border-danger">
            <div>
              <div className="text-muted small fw-semibold">Overdue Stays</div>
              <div className="fs-3 fw-bold text-danger">{metrics.overdueCount}</div>
            </div>
            <div className="p-2.5 bg-danger-subtle text-danger rounded-circle">
              <AlertTriangle size={20} />
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="saas-card-static p-3 d-flex align-items-center justify-content-between border-start border-4 border-warning">
            <div>
              <div className="text-muted small fw-semibold">Checkout Today</div>
              <div className="fs-3 fw-bold text-warning">{metrics.dueTodayCount}</div>
            </div>
            <div className="p-2.5 bg-warning-subtle text-warning rounded-circle">
              <Clock size={20} />
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="saas-card-static p-3 d-flex align-items-center justify-content-between border-start border-4 border-success">
            <div>
              <div className="text-muted small fw-semibold">Pending Balance</div>
              <div className="fs-3 fw-bold text-dark">
                {metrics.pendingBalanceCount} <span className="fs-6 text-muted font-normal">({formatCurrency(metrics.totalPendingAmount)})</span>
              </div>
            </div>
            <div className="p-2.5 bg-success-subtle text-success rounded-circle">
              <CreditCard size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. MODERN SEARCH AND FILTER BAR */}
      <div className="saas-card p-3 mb-4 border-0 shadow-sm">
        <div className="row g-2 align-items-center">
          {/* Search Box */}
          <div className="col-lg-4 col-md-12">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white border-end-0 text-muted">
                <Search size={16} />
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Search guest, stay #, mobile or room..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>

          {/* Status Dropdown */}
          <div className="col-6 col-lg-2">
            <select
              className="form-select form-select-sm"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="ALL">Status: All</option>
              <option value="ACTIVE">Status: Active</option>
              <option value="DUE_TODAY">Status: Due Today</option>
              <option value="OVERDUE">Status: Overdue</option>
            </select>
          </div>

          {/* Checkout Dropdown */}
          <div className="col-6 col-lg-2">
            <select
              className="form-select form-select-sm"
              value={checkoutFilter}
              onChange={(e) => { setCheckoutFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="ALL">Checkout: All</option>
              <option value="TODAY">Checkout: Today</option>
              <option value="TOMORROW">Checkout: Tomorrow</option>
              <option value="OVERDUE">Checkout: Overdue</option>
            </select>
          </div>

          {/* Payment Dropdown */}
          <div className="col-6 col-lg-2">
            <select
              className="form-select form-select-sm"
              value={paymentFilter}
              onChange={(e) => { setPaymentFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="ALL">Payment: All</option>
              <option value="PENDING">Payment: Pending</option>
              <option value="PAID">Payment: Paid</option>
            </select>
          </div>

          {/* Room Dropdown & Actions */}
          <div className="col-6 col-lg-2 d-flex gap-2">
            <select
              className="form-select form-select-sm"
              value={roomFilter}
              onChange={(e) => { setRoomFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="ALL">All Rooms</option>
              {uniqueRooms.map((rNum) => (
                <option key={rNum} value={rNum}>Room {rNum}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Action Bar & View Mode Toggle */}
        <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
          <div className="d-flex align-items-center gap-2">
            {activeFiltersCount > 0 && (
              <button
                className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1.5 py-1 px-2.5 rounded-pill"
                onClick={handleClearFilters}
              >
                <X size={14} /> Clear Filters <span className="badge bg-danger text-white ms-1">{activeFiltersCount}</span>
              </button>
            )}
            <span className="text-muted small">
              Showing <strong className="text-dark">{filteredStays.length}</strong> active guest stays
            </span>
          </div>

          {/* View Mode Switcher */}
          <div className="btn-group btn-group-sm rounded-3 overflow-hidden border">
            <button
              className={`btn ${viewMode === 'cards' ? 'btn-primary' : 'btn-light'}`}
              onClick={() => setViewMode('cards')}
              title="Card Grid View"
            >
              <Grid size={15} className="me-1" /> Cards
            </button>
            <button
              className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-light'}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <List size={15} className="me-1" /> Table
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <PageLoader fullScreen={false} message="Loading Active Guest Stays..." />
      ) : filteredStays.length === 0 ? (
        /* 16. EMPTY STATE */
        <div className="saas-card p-5 text-center my-4 bg-white border-0 shadow-sm rounded-4">
          <div className="p-3 bg-light rounded-circle d-inline-flex text-muted mb-3">
            <BedDouble size={48} className="text-secondary" />
          </div>
          <h5 className="fw-bold text-dark mb-1">No Active Stays Found</h5>
          <p className="text-muted small max-w-md mx-auto mb-4">
            {activeFiltersCount > 0
              ? 'No active stays match your current search or filter criteria. Try clearing filters.'
              : 'Currently there are no guests staying in the lodge.'}
          </p>
          {activeFiltersCount > 0 ? (
            <button className="btn btn-outline-secondary fw-semibold px-4" onClick={handleClearFilters}>
              Clear Filters
            </button>
          ) : (
            <Link to="/check-in" className="btn btn-primary fw-bold px-4 shadow-sm">
              <Plus size={18} className="me-1" /> New Check-In
            </Link>
          )}
        </div>
      ) : viewMode === 'cards' ? (
        /* 4 & 5. STAY CARDS GRID (PRIMARY DEFAULT VIEW) */
        <div className="row g-4">
          {paginatedStays.map((s) => {
            const { isOverdue, isDueToday, expDateStr, expTimeStr, overdueText } = analyzeStayStatus(s);
            const bill = s.bill_summary || {};
            const grossSubtotal = parseFloat(bill.grand_total || bill.subtotal || 0);
            const totalPaid = parseFloat(bill.total_paid || 0);
            const balance = parseFloat(bill.balance || 0);
            const cust = s.primary_customer_detail || {};

            return (
              <div key={s.id} className="col-12 col-md-6 col-xl-4">
                <div
                  className="saas-card-static h-100 p-4 d-flex flex-column justify-content-between position-relative bg-white shadow-sm border transition-all"
                  style={{
                    borderRadius: '16px',
                    borderColor: isOverdue ? '#fca5a5' : '#e2e8f0',
                    boxShadow: isOverdue ? '0 8px 24px rgba(220, 38, 38, 0.08)' : '0 4px 20px rgba(15, 23, 42, 0.04)'
                  }}
                >
                  <div>
                    {/* 6. CARD HEADER: ROOM BADGE & STATUS */}
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle fw-bold fs-6 px-3 py-1.5 rounded-pill d-inline-flex align-items-center gap-1.5">
                          <BedDouble size={15} /> Room {s.room_detail?.room_number || 'N/A'}
                        </span>
                        <div className="text-muted mt-1.5 ps-1" style={{ fontSize: '0.75rem', letterSpacing: '0.02em' }}>
                          Ref: {s.stay_number}
                        </div>
                      </div>

                      {/* Status Badges */}
                      {isOverdue ? (
                        <span className="badge bg-danger-subtle text-danger border border-danger-subtle fw-bold px-3 py-1.5 rounded-pill d-flex align-items-center gap-1.5">
                          <span className="spinner-grow spinner-grow-sm text-danger" style={{ width: '6px', height: '6px' }}></span>
                          OVERDUE
                        </span>
                      ) : isDueToday ? (
                        <span className="badge bg-warning-subtle text-warning border border-warning-subtle fw-bold px-3 py-1.5 rounded-pill">
                          DUE TODAY
                        </span>
                      ) : (
                        <span className="badge bg-success-subtle text-success border border-success-subtle fw-bold px-3 py-1.5 rounded-pill">
                          ACTIVE
                        </span>
                      )}
                    </div>

                    {/* 7. GUEST PROFILE BANNER */}
                    <div className="d-flex align-items-center gap-3 mb-3 p-3 bg-slate-50 rounded-3 border border-slate-100" style={{ backgroundColor: '#F8FAFC' }}>
                      {cust.photo ? (
                        <img src={cust.photo} alt={cust.full_name} className="rounded-circle object-fit-cover flex-shrink-0 shadow-xs" style={{ width: '44px', height: '44px' }} />
                      ) : (
                        <div className="rounded-circle bg-primary bg-gradient text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0 shadow-xs" style={{ width: '44px', height: '44px', fontSize: '0.95rem' }}>
                          {(cust.full_name || 'G').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <div className="fw-bold text-dark text-truncate fs-6 lh-sm">
                          {cust.full_name || 'Guest'}
                        </div>
                        <div className="text-secondary small d-flex align-items-center gap-1.5 mt-1">
                          <Phone size={13} className="text-muted" /> {cust.mobile || 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* 8. STAY TIMELINE BOX */}
                    <div className="p-3 rounded-3 bg-white border mb-3">
                      <div className="d-flex justify-content-between align-items-center text-muted small pb-2 border-bottom">
                        <span className="d-flex align-items-center gap-1.5 font-medium">
                          <Calendar size={14} className="text-primary" /> Check-In
                        </span>
                        <strong className="text-dark font-semibold">{formatDate(s.check_in_date)} @ {s.check_in_time?.substring(0, 5) || '12:00'}</strong>
                      </div>

                      <div className="d-flex justify-content-between align-items-center text-muted small pt-2">
                        <span className="d-flex align-items-center gap-1.5 font-medium">
                          <Clock size={14} className={isOverdue ? 'text-danger' : 'text-primary'} /> Expected Checkout
                        </span>
                        <strong className={isOverdue ? 'text-danger fw-bold' : 'text-dark font-semibold'}>
                          {formatDate(expDateStr)} @ {expTimeStr.substring(0, 5)}
                        </strong>
                      </div>

                      {/* OVERDUE CALLOUT BANNER */}
                      {isOverdue && (
                        <div className="mt-2.5 p-2 bg-danger-subtle rounded-3 text-danger border border-danger-subtle small fw-bold d-flex align-items-center justify-content-between">
                          <span className="d-flex align-items-center gap-1.5" style={{ fontSize: '0.775rem' }}>
                            <AlertTriangle size={15} /> Overdue Duration:
                          </span>
                          <span style={{ fontSize: '0.8rem' }}>{overdueText}</span>
                        </div>
                      )}
                    </div>

                    {/* 9. FINANCIAL SUMMARY GRID */}
                    <div className="p-3 bg-slate-50 rounded-3 border mb-3" style={{ backgroundColor: '#F8FAFC' }}>
                      <div className="row g-2 text-center" style={{ fontSize: '0.8rem' }}>
                        <div className="col-4 border-end">
                          <div className="text-muted small">Total</div>
                          <div className="fw-bold text-dark mt-1" style={{ fontSize: '0.9rem' }}>{formatCurrency(grossSubtotal)}</div>
                        </div>
                        <div className="col-4 border-end">
                          <div className="text-muted small">Paid</div>
                          <div className="fw-bold text-success mt-1" style={{ fontSize: '0.9rem' }}>{formatCurrency(totalPaid)}</div>
                        </div>
                        <div className="col-4">
                          <div className="text-muted small">Balance</div>
                          <div className={`fw-bold mt-1 ${balance > 0 ? 'text-danger' : 'text-success'}`} style={{ fontSize: '0.9rem' }}>
                            {formatCurrency(balance)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 12. CARD FOOTER ACTIONS (PINNED TO VERY BOTTOM) */}
                  <div className="d-flex align-items-center justify-content-between gap-2 pt-3 border-top">
                    <div className="d-flex gap-2">
                      <Link to={`/stays/${s.id}`} className="btn btn-sm btn-light border rounded-3 fw-semibold px-3 py-1.5 d-flex align-items-center gap-1.5 shadow-xs">
                        <Eye size={15} /> View Details
                      </Link>
                      <Link
                        to={`/checkout/${s.id}`}
                        className={`btn btn-sm rounded-3 fw-bold px-3 py-1.5 d-flex align-items-center gap-1.5 shadow-xs ${
                          isOverdue ? 'btn-danger' : 'btn-success'
                        }`}
                      >
                        <LogOut size={15} /> Process Checkout
                      </Link>
                    </div>

                    {/* 3-Dots Action Dropdown */}
                    <div className="dropdown">
                      <button
                        className="btn btn-sm btn-light border p-1.5 rounded-circle d-flex align-items-center justify-content-center hover-dark"
                        style={{ width: '34px', height: '34px' }}
                        type="button"
                        data-bs-toggle="dropdown"
                      >
                        <MoreVertical size={16} className="text-secondary" />
                      </button>
                      <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-3">
                        <li>
                          <Link to={`/stays/${s.id}`} className="dropdown-item py-2 px-3 d-flex align-items-center gap-2">
                            <Eye size={15} className="text-primary" /> View Full Details
                          </Link>
                        </li>
                        <li>
                          <button className="dropdown-item py-2 px-3 d-flex align-items-center gap-2" onClick={() => { setActiveStayId(s.id); setShowGuestModal(true); }}>
                            <UserPlus size={15} className="text-info" /> Add Additional Guest
                          </button>
                        </li>
                        <li>
                          <button className="dropdown-item py-2 px-3 d-flex align-items-center gap-2" onClick={() => { setActiveStayId(s.id); setShowChargeModal(true); }}>
                            <ShoppingCart size={15} className="text-warning" /> Add Extra Charge
                          </button>
                        </li>
                        <li>
                          <button className="dropdown-item py-2 px-3 d-flex align-items-center gap-2" onClick={() => { setActiveStayId(s.id); setActiveBalance(balance); setShowPaymentModal(true); }}>
                            <DollarSign size={15} className="text-success" /> Add Payment
                          </button>
                        </li>
                        <li>
                          <button className="dropdown-item py-2 px-3 d-flex align-items-center gap-2" onClick={() => { setActiveStayId(s.id); setNewExtendCheckout(s.expected_checkout_date); setShowExtendModal(true); }}>
                            <CalendarPlus size={15} className="text-primary" /> Extend Stay
                          </button>
                        </li>
                        <li><hr className="dropdown-divider" /></li>
                        <li>
                          <Link to={`/checkout/${s.id}`} className="dropdown-item py-2 px-3 text-danger fw-semibold d-flex align-items-center gap-2">
                            <LogOut size={15} /> Process Checkout
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* 15. DENSE TABLE VIEW OPTION */
        <div className="saas-card border-0 shadow-sm overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle m-0">
              <thead className="table-light">
                <tr>
                  <th>Stay #</th>
                  <th>Room</th>
                  <th>Status</th>
                  <th>Primary Guest</th>
                  <th>Mobile</th>
                  <th>Check-In</th>
                  <th>Expected Checkout</th>
                  <th className="text-end">Total</th>
                  <th className="text-end">Paid</th>
                  <th className="text-end">Balance</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStays.map((s) => {
                  const { isOverdue, isDueToday, expDateStr, expTimeStr } = analyzeStayStatus(s);
                  const bill = s.bill_summary || {};
                  const grossSubtotal = parseFloat(bill.grand_total || bill.subtotal || 0);
                  const totalPaid = parseFloat(bill.total_paid || 0);
                  const balance = parseFloat(bill.balance || 0);
                  const cust = s.primary_customer_detail || {};

                  return (
                    <tr key={s.id} className={isOverdue ? 'table-danger-subtle' : ''}>
                      <td className="fw-bold text-primary">{s.stay_number}</td>
                      <td>
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle fw-bold">
                          Room {s.room_detail?.room_number}
                        </span>
                      </td>
                      <td>
                        {isOverdue ? (
                          <span className="badge bg-danger text-white">OVERDUE</span>
                        ) : isDueToday ? (
                          <span className="badge bg-warning text-dark">DUE TODAY</span>
                        ) : (
                          <span className="badge bg-success text-white">ACTIVE</span>
                        )}
                      </td>
                      <td className="fw-bold text-dark">{cust.full_name || 'Guest'}</td>
                      <td>{cust.mobile || 'N/A'}</td>
                      <td className="small">{formatDate(s.check_in_date)}</td>
                      <td className={`small ${isOverdue ? 'text-danger fw-bold' : ''}`}>
                        {formatDate(expDateStr)} @ {expTimeStr.substring(0, 5)}
                      </td>
                      <td className="text-end fw-semibold">{formatCurrency(grossSubtotal)}</td>
                      <td className="text-end text-success fw-semibold">{formatCurrency(totalPaid)}</td>
                      <td className={`text-end fw-bold ${balance > 0 ? 'text-danger' : 'text-success'}`}>
                        {formatCurrency(balance)}
                      </td>
                      <td className="text-center">
                        <div className="dropdown">
                          <button className="btn btn-xs btn-light border dropdown-toggle fw-semibold" type="button" data-bs-toggle="dropdown">
                            Actions
                          </button>
                          <ul className="dropdown-menu dropdown-menu-end shadow border-0">
                            <li>
                              <Link to={`/stays/${s.id}`} className="dropdown-item py-2 d-flex align-items-center gap-2">
                                <Eye size={15} className="text-primary" /> View Details
                              </Link>
                            </li>
                            <li>
                              <button className="dropdown-item py-2 d-flex align-items-center gap-2" onClick={() => { setActiveStayId(s.id); setShowGuestModal(true); }}>
                                <UserPlus size={15} className="text-info" /> Add Guest
                              </button>
                            </li>
                            <li>
                              <button className="dropdown-item py-2 d-flex align-items-center gap-2" onClick={() => { setActiveStayId(s.id); setShowChargeModal(true); }}>
                                <ShoppingCart size={15} className="text-warning" /> Add Charge
                              </button>
                            </li>
                            <li>
                              <button className="dropdown-item py-2 d-flex align-items-center gap-2" onClick={() => { setActiveStayId(s.id); setActiveBalance(balance); setShowPaymentModal(true); }}>
                                <DollarSign size={15} className="text-success" /> Add Payment
                              </button>
                            </li>
                            <li>
                              <button className="dropdown-item py-2 d-flex align-items-center gap-2" onClick={() => { setActiveStayId(s.id); setNewExtendCheckout(s.expected_checkout_date); setShowExtendModal(true); }}>
                                <CalendarPlus size={15} className="text-primary" /> Extend Stay
                              </button>
                            </li>
                            <li><hr className="dropdown-divider" /></li>
                            <li>
                              <Link to={`/checkout/${s.id}`} className="dropdown-item py-2 text-danger fw-semibold d-flex align-items-center gap-2">
                                <LogOut size={15} /> Checkout
                              </Link>
                            </li>
                          </ul>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 17. PAGINATION CONTROL */}
      {filteredStays.length > pageSize && (
        <div className="d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3 mt-4 pt-3 border-top">
          <div className="text-muted small">
            Showing <strong className="text-dark">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
            <strong className="text-dark">{Math.min(currentPage * pageSize, filteredStays.length)}</strong> of{' '}
            <strong className="text-dark">{filteredStays.length}</strong> active stays
          </div>

          <div className="d-flex align-items-center gap-1">
            <button
              className="btn btn-sm btn-light border"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            >
              <ChevronLeft size={16} /> Previous
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const p = idx + 1;
              return (
                <button
                  key={p}
                  className={`btn btn-sm ${currentPage === p ? 'btn-primary fw-bold' : 'btn-light border'}`}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              );
            })}

            <button
              className="btn btn-sm btn-light border"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <GuestFormModal show={showGuestModal} onClose={() => setShowGuestModal(false)} onSubmit={handleAddGuestSubmit} stayId={activeStayId} />
      <ChargeFormModal show={showChargeModal} onClose={() => setShowChargeModal(false)} onSubmit={handleAddChargeSubmit} stayId={activeStayId} />
      <PaymentFormModal show={showPaymentModal} onClose={() => setShowPaymentModal(false)} onSubmit={handleAddPaymentSubmit} stayId={activeStayId} currentBalance={activeBalance} />

      {/* Extend Stay Modal */}
      {showExtendModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.6)', zIndex: 1055 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-primary text-white py-3">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <CalendarPlus size={20} /> Extend Active Stay
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowExtendModal(false)}></button>
              </div>
              <form onSubmit={handleExtendSubmit}>
                <div className="modal-body p-4 bg-white">
                  <label className="form-label small fw-semibold text-dark">New Expected Check-Out Date *</label>
                  <input
                    type="date"
                    className="form-control form-control-lg fw-semibold"
                    required
                    value={newExtendCheckout}
                    onChange={(e) => setNewExtendCheckout(e.target.value)}
                  />
                  <div className="text-muted small mt-2">
                    💡 Backend will verify room availability before extending dates and updating charges.
                  </div>
                </div>
                <div className="modal-footer bg-light border-top">
                  <button type="button" className="btn btn-light border" onClick={() => setShowExtendModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary fw-bold px-4 shadow-sm">
                    <CheckCircle2 size={18} className="me-1" /> Confirm Stay Extension
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

export default CurrentStays;
