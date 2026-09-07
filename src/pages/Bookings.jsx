import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBookingsApi, updateBookingApi, cancelBookingApi, deleteBookingApi } from '../api/bookingApi';
import { getStaysApi } from '../api/stayApi';
import { checkAvailabilityApi, getRoomsApi } from '../api/roomApi';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import PageLoader from '../components/PageLoader';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/dateUtils';
import { exportBookingsToExcel, exportBookingsToPDF } from '../utils/exportUtils';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const Bookings = () => {
  const { user, selectedProperty, hasPermission, getPermissionLimit } = useAuth();
  const { showSuccess, showError } = useNotification();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.is_superuser;
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState('CONFIRMED');
  const [search, setSearch] = useState('');

  // TanStack Query for bookings data fetching
  const {
    data: bookings = [],
    isLoading: loading,
    refetch: loadBookings,
  } = useQuery({
    queryKey: ['bookings', statusFilter, search],
    queryFn: () => getBookingsApi({ status: statusFilter, search }),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Selected Booking for View Details Modal
  const [viewBooking, setViewBooking] = useState(null);

  // Selected Booking for Edit Modal
  const [editBooking, setEditBooking] = useState(null);
  const [editForm, setEditForm] = useState({
    room: '',
    check_in_date: '',
    check_in_time: '12:00',
    expected_checkout_date: '',
    expected_checkout_time: '11:00',
    adults: 1,
    children: 0,
    room_rate: '',
    advance_amount: '',
    notes: '',
  });
  const [editAvailableRooms, setEditAvailableRooms] = useState([]);
  const [editLoadingRooms, setEditLoadingRooms] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  // Confirm Delete / Cancel Modal state
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    confirmBtnClass: 'btn-danger',
    onConfirm: null,
    loading: false,
  });

  const navigate = useNavigate();

  // KPI Analytics Counters
  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter((b) => b.status === 'CONFIRMED').length;
  const checkedInBookings = bookings.filter((b) => b.status === 'CHECKED_IN').length;
  const totalAdvancePaid = bookings.reduce((sum, b) => sum + parseFloat(b.advance_amount || 0), 0);

  // -------------------------------------------------------------
  // Column Visibility & Definitions
  // -------------------------------------------------------------
  const columnDefs = [
    { key: 'booking_number', label: 'Booking #' },
    { key: 'guest_profile', label: 'Guest Profile' },
    { key: 'assigned_room', label: 'Assigned Room' },
    { key: 'check_in', label: 'Check-In' },
    { key: 'expected_checkout', label: 'Expected Check-Out' },
    { key: 'agreed_rate', label: 'Agreed Rate' },
    { key: 'advance_paid', label: 'Advance Paid' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Actions' },
  ];

  const [columnVisibility, setColumnVisibility] = useState({
    booking_number: true,
    guest_profile: true,
    assigned_room: true,
    check_in: true,
    expected_checkout: true,
    agreed_rate: true,
    advance_paid: true,
    status: true,
    actions: true,
  });
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const columnMenuRef = useRef(null);

  // Close column visibility dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(e.target)) {
        setShowColumnMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleColumnVisibility = (key) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const resetColumnVisibility = () => {
    setColumnVisibility({
      booking_number: true,
      guest_profile: true,
      assigned_room: true,
      check_in: true,
      expected_checkout: true,
      agreed_rate: true,
      advance_paid: true,
      status: true,
      actions: true,
    });
  };

  const visibleColumnCount = Object.values(columnVisibility).filter(Boolean).length || 1;

  // -------------------------------------------------------------
  // Column-wise Sorting State & Logic
  // -------------------------------------------------------------
  const [sortColumn, setSortColumn] = useState('check_in_date');
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'

  const handleSort = (columnKey) => {
    if (sortColumn === columnKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const sortedBookings = useMemo(() => {
    if (!bookings || !bookings.length) return [];
    const list = [...bookings];

    return list.sort((a, b) => {
      let valA, valB;
      switch (sortColumn) {
        case 'booking_number':
          valA = a.booking_number || '';
          valB = b.booking_number || '';
          break;
        case 'guest_profile':
          valA = (a.customer_detail?.full_name || '').toLowerCase();
          valB = (b.customer_detail?.full_name || '').toLowerCase();
          break;
        case 'assigned_room':
          valA = Number(a.room_detail?.room_number) || (a.room_detail?.room_number || '');
          valB = Number(b.room_detail?.room_number) || (b.room_detail?.room_number || '');
          break;
        case 'check_in_date':
          valA = new Date(`${a.check_in_date || '1970-01-01'}T${a.check_in_time || '12:00'}`).getTime();
          valB = new Date(`${b.check_in_date || '1970-01-01'}T${b.check_in_time || '12:00'}`).getTime();
          break;
        case 'expected_checkout_date':
          valA = new Date(`${a.expected_checkout_date || a.check_in_date || '1970-01-01'}T${a.expected_checkout_time || '11:00'}`).getTime();
          valB = new Date(`${b.expected_checkout_date || b.check_in_date || '1970-01-01'}T${b.expected_checkout_time || '11:00'}`).getTime();
          break;
        case 'room_rate':
          valA = parseFloat(a.room_rate || 0);
          valB = parseFloat(b.room_rate || 0);
          break;
        case 'advance_amount':
          valA = parseFloat(a.advance_amount || 0);
          valB = parseFloat(b.advance_amount || 0);
          break;
        case 'status':
          valA = a.status || '';
          valB = b.status || '';
          break;
        default:
          valA = a[sortColumn] || '';
          valB = b[sortColumn] || '';
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      valA = String(valA);
      valB = String(valB);
      return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }, [bookings, sortColumn, sortDirection]);

  // -------------------------------------------------------------
  // Pagination State & Calculations
  // -------------------------------------------------------------
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const totalItems = sortedBookings.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const paginatedBookings = useMemo(() => {
    return sortedBookings.slice(startIndex, endIndex);
  }, [sortedBookings, startIndex, endIndex]);

  const getPageNumbers = (current, total) => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, '...', total];
    }
    if (current >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  // -------------------------------------------------------------
  // Export Handlers
  // -------------------------------------------------------------
  const handleExportExcel = () => {
    exportBookingsToExcel(
      sortedBookings,
      { status: statusFilter || 'ALL', search },
      selectedProperty
    );
  };

  const handleExportPDF = () => {
    exportBookingsToPDF(
      sortedBookings,
      { status: statusFilter || 'ALL', search },
      selectedProperty
    );
  };

  const renderSortHeader = (label, columnKey, className = '') => (
    <th
      className={`${className} text-nowrap`}
      style={{ cursor: 'pointer', userSelect: 'none' }}
      onClick={() => handleSort(columnKey)}
      title={`Sort by ${label} (${sortColumn === columnKey && sortDirection === 'asc' ? 'Descending' : 'Ascending'})`}
    >
      <div className="d-inline-flex align-items-center gap-1.5">
        <span>{label}</span>
        {sortColumn === columnKey ? (
          sortDirection === 'asc' ? (
            <i className="bi bi-arrow-up text-primary fw-bold" style={{ fontSize: '0.75rem' }}></i>
          ) : (
            <i className="bi bi-arrow-down text-primary fw-bold" style={{ fontSize: '0.75rem' }}></i>
          )
        ) : (
          <i className="bi bi-arrow-down-up text-muted opacity-25" style={{ fontSize: '0.7rem' }}></i>
        )}
      </div>
    </th>
  );

  // Helper to determine if a checked-in booking is overdue for checkout
  const isBookingOverdue = (b) => {
    if (b.status !== 'CHECKED_IN') return false;
    const expDateStr = b.expected_checkout_date || b.check_in_date;
    const expTimeStr = b.expected_checkout_time || '11:00';
    if (!expDateStr) return false;

    const expDateTimeStr = `${expDateStr}T${expTimeStr.length === 5 ? expTimeStr + ':00' : expTimeStr}`;
    const expDt = new Date(expDateTimeStr);
    const now = new Date();

    return now > expDt;
  };

  // Navigate to full stay details page
  const handleNavigateToStayDetails = async (booking) => {
    setViewBooking(null);
    if (booking.stay_id) {
      navigate(`/stays/${booking.stay_id}`);
      return;
    }
    try {
      const staysData = await getStaysApi({ booking: booking.id });
      if (staysData && staysData.length > 0) {
        navigate(`/stays/${staysData[0].id}`);
        return;
      }
      const staysBySearch = await getStaysApi({ search: booking.booking_number || booking.room_detail?.room_number });
      if (staysBySearch && staysBySearch.length > 0) {
        navigate(`/stays/${staysBySearch[0].id}`);
        return;
      }
      navigate('/stays');
    } catch (err) {
      navigate('/stays');
    }
  };

  // Helper to ensure HH:MM time format
  const formatTimeHHMM = (t) => {
    if (!t) return '12:00';
    const parts = String(t).split(':');
    return `${parts[0].padStart(2, '0')}:${(parts[1] || '00').padStart(2, '0')}`;
  };

  // Open Edit Modal
  const handleOpenEdit = async (booking) => {
    setEditBooking(booking);
    setEditError('');

    const inTime = formatTimeHHMM(booking.check_in_time);
    const outTime = formatTimeHHMM(booking.expected_checkout_time);
    const assignedRoomId = booking.room_detail?.id || booking.room;

    setEditForm({
      room: assignedRoomId ? String(assignedRoomId) : '',
      check_in_date: booking.check_in_date,
      check_in_time: inTime,
      expected_checkout_date: booking.expected_checkout_date,
      expected_checkout_time: outTime,
      adults: booking.adults || 1,
      children: booking.children || 0,
      room_rate: booking.room_rate || '',
      advance_amount: booking.advance_amount || '',
      notes: booking.notes || '',
    });

    // Seed immediately with current room so room is ALWAYS selected and visible right away
    if (booking.room_detail) {
      setEditAvailableRooms([booking.room_detail]);
    }

    // Fetch available rooms for this booking's dates (excluding this booking so its own room is available)
    fetchRoomsForEdit(
      booking.check_in_date,
      inTime,
      booking.expected_checkout_date,
      outTime,
      booking.room_detail,
      booking.id
    );
  };

  const fetchRoomsForEdit = async (inDate, inTime, outDate, outTime, currentRoomDetail, bookingId) => {
    if (!inDate || !outDate) return;
    setEditLoadingRooms(true);
    try {
      const cleanInTime = formatTimeHHMM(inTime);
      const cleanOutTime = formatTimeHHMM(outTime);
      const inFull = `${inDate}T${cleanInTime}:00`;
      const outFull = `${outDate}T${cleanOutTime}:00`;
      const res = await checkAvailabilityApi(inFull, outFull, '', bookingId || null);
      let roomsList = res?.rooms || [];

      // Ensure currently assigned room is included in dropdown
      if (currentRoomDetail && !roomsList.some((r) => String(r.id) === String(currentRoomDetail.id))) {
        roomsList = [currentRoomDetail, ...roomsList];
      }

      // If availability returns no other rooms, fallback to getRoomsApi() so staff can still reassign
      if (roomsList.length === 0) {
        try {
          const allRooms = await getRoomsApi();
          roomsList = allRooms || [];
        } catch (e) {
          if (currentRoomDetail) roomsList = [currentRoomDetail];
        }
      }

      setEditAvailableRooms(roomsList);

      // Auto-assign room if editForm.room is not set or not in list
      setEditForm((prev) => {
        if (!prev.room && currentRoomDetail) {
          return { ...prev, room: String(currentRoomDetail.id) };
        } else if (!prev.room && roomsList.length > 0) {
          return { ...prev, room: String(roomsList[0].id) };
        }
        return prev;
      });
    } catch (err) {
      console.error('Error checking room availability for edit:', err);
      if (currentRoomDetail) {
        setEditAvailableRooms([currentRoomDetail]);
      }
    } finally {
      setEditLoadingRooms(false);
    }
  };

  const handleEditInputChange = (field, val) => {
    const updated = { ...editForm, [field]: val };
    setEditForm(updated);
    setEditError('');

    // Re-check rooms if dates change
    if (field === 'check_in_date' || field === 'expected_checkout_date' || field === 'check_in_time' || field === 'expected_checkout_time') {
      fetchRoomsForEdit(
        updated.check_in_date,
        updated.check_in_time,
        updated.expected_checkout_date,
        updated.expected_checkout_time,
        editBooking?.room_detail,
        editBooking?.id
      );
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditSubmitting(true);
    setEditError('');

    try {
      const updatedBooking = await updateBookingApi(editBooking.id, {
        customer: editBooking.customer,
        room: parseInt(editForm.room),
        check_in_date: editForm.check_in_date,
        check_in_time: editForm.check_in_time,
        expected_checkout_date: editForm.expected_checkout_date,
        expected_checkout_time: editForm.expected_checkout_time,
        adults: parseInt(editForm.adults),
        children: parseInt(editForm.children),
        room_rate: parseFloat(editForm.room_rate || 0),
        advance_amount: parseFloat(editForm.advance_amount || 0),
        notes: editForm.notes,
        status: editBooking.status
      });

      setEditBooking(null);
      showSuccess(`Booking #${editBooking.booking_number} updated successfully.`, 'Booking Updated');
      queryClient.setQueriesData({ queryKey: ['bookings'] }, (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((b) => (b.id === updatedBooking.id ? { ...b, ...updatedBooking } : b));
      });
      queryClient.invalidateQueries({ queryKey: ['bookings'], refetchType: 'none' });
    } catch (err) {
      console.error(err);
      const serverMsg = err.response?.data?.room?.[0] || err.response?.data?.error || err.response?.data?.detail || 'Error updating booking.';
      setEditError(serverMsg);
    } finally {
      setEditSubmitting(false);
    }
  };

  // Cancel Booking Modal
  const handleCancel = (booking) => {
    setConfirmModal({
      show: true,
      title: 'Cancel Booking Confirmation',
      message: `Are you sure you want to cancel Booking #${booking.booking_number} for ${booking.customer_detail?.full_name}? The assigned room (Room ${booking.room_detail?.room_number}) will be released back to available inventory.`,
      confirmText: 'Yes, Cancel Booking',
      confirmBtnClass: 'btn-warning text-dark',
      loading: false,
      onConfirm: async () => {
        // Optimistic cancellation (0.0s)
        setConfirmModal({ show: false });
        const prevBookings = queryClient.getQueryData(['bookings', statusFilter, search]);
        queryClient.setQueriesData({ queryKey: ['bookings'] }, (old) => {
          if (!Array.isArray(old)) return old;
          if (statusFilter === 'CONFIRMED') {
            return old.filter((b) => b.id !== booking.id);
          }
          return old.map((b) => (b.id === booking.id ? { ...b, status: 'CANCELLED' } : b));
        });
        showSuccess(`Booking #${booking.booking_number} cancelled.`, 'Booking Cancelled');

        try {
          await cancelBookingApi(booking.id);
          queryClient.invalidateQueries({ queryKey: ['bookings'], refetchType: 'none' });
          queryClient.invalidateQueries({ queryKey: ['rooms'] });
        } catch (err) {
          if (prevBookings) {
            queryClient.setQueryData(['bookings', statusFilter, search], prevBookings);
          }
          showError(err.response?.data?.error || 'Error cancelling booking.', 'Cancellation Failed');
        }
      },
    });
  };

  // Delete Booking (Admin Hard Delete)
  const handleDelete = (booking) => {
    setConfirmModal({
      show: true,
      title: 'Delete Booking Record',
      message: `Are you sure you want to permanently DELETE Booking #${booking.booking_number}? This action cannot be undone.`,
      confirmText: 'Yes, Delete Booking',
      confirmBtnClass: 'btn-danger',
      loading: false,
      onConfirm: async () => {
        // Optimistic delete (0.0s)
        setConfirmModal({ show: false });
        const prevBookings = queryClient.getQueryData(['bookings', statusFilter, search]);
        queryClient.setQueriesData({ queryKey: ['bookings'] }, (old) => {
          if (!Array.isArray(old)) return old;
          return old.filter((b) => b.id !== booking.id);
        });
        showSuccess(`Booking #${booking.booking_number} deleted successfully.`, 'Booking Deleted');

        try {
          await deleteBookingApi(booking.id);
          queryClient.invalidateQueries({ queryKey: ['bookings'], refetchType: 'none' });
          queryClient.invalidateQueries({ queryKey: ['rooms'] });
        } catch (err) {
          if (prevBookings) {
            queryClient.setQueryData(['bookings', statusFilter, search], prevBookings);
          }
          showError(err.response?.data?.error || 'Error deleting booking record.', 'Deletion Failed');
        }
      },
    });
  };

  const handleCheckIn = (bookingId) => {
    navigate(`/check-in?booking_id=${bookingId}`);
  };

  return (
    <div className="container-fluid p-0">
      {/* Header Banner */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h3 className="fw-bold text-dark m-0">
            <i className="bi bi-calendar-check text-primary me-2"></i>Advance Bookings Management
          </h3>
          <span className="text-muted small">Manage reservation bookings, edit room allocations, process check-ins & advance deposits</span>
        </div>
        {hasPermission('bookings', 'can_create') && (
          <Link to="/bookings/create" className="btn btn-primary fw-bold shadow-sm px-4 py-2">
            <i className="bi bi-calendar-plus-fill me-2"></i>New Advance Booking
          </Link>
        )}
      </div>


      {/* Analytics KPI Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3 col-sm-6">
          <div className="card border-0 shadow-sm rounded-3 bg-white h-100">
            <div className="card-body p-3 d-flex align-items-center">
              <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3 text-primary">
                <i className="bi bi-journal-bookmark fs-3"></i>
              </div>
              <div>
                <span className="text-muted small fw-semibold d-block">Total Reservations</span>
                <h4 className="fw-bold m-0 text-dark">{totalBookings}</h4>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 col-sm-6">
          <div className="card border-0 shadow-sm rounded-3 bg-white h-100">
            <div className="card-body p-3 d-flex align-items-center">
              <div className="rounded-circle bg-info bg-opacity-10 p-3 me-3 text-info">
                <i className="bi bi-clock-history fs-3"></i>
              </div>
              <div>
                <span className="text-muted small fw-semibold d-block">Confirmed Pending</span>
                <h4 className="fw-bold m-0 text-info">{confirmedBookings}</h4>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 col-sm-6">
          <div className="card border-0 shadow-sm rounded-3 bg-white h-100">
            <div className="card-body p-3 d-flex align-items-center">
              <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3 text-success">
                <i className="bi bi-person-check fs-3"></i>
              </div>
              <div>
                <span className="text-muted small fw-semibold d-block">Checked-In Stays</span>
                <h4 className="fw-bold m-0 text-success">{checkedInBookings}</h4>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 col-sm-6">
          <div className="card border-0 shadow-sm rounded-3 bg-white h-100">
            <div className="card-body p-3 d-flex align-items-center">
              <div className="rounded-circle bg-warning bg-opacity-10 p-3 me-3 text-warning">
                <i className="bi bi-cash-coin fs-3"></i>
              </div>
              <div>
                <span className="text-muted small fw-semibold d-block">Advance Collected</span>
                <h4 className="fw-bold m-0 text-dark">{formatCurrency(totalAdvancePaid)}</h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-body p-3">
          <div className="row g-3 align-items-center">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search by Booking #, Guest Name, Mobile #, or Room #"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="d-flex flex-wrap gap-2 justify-content-md-end">
                <button
                  className={`btn btn-sm ${statusFilter === '' ? 'btn-dark' : 'btn-outline-secondary'}`}
                  onClick={() => setStatusFilter('')}
                >
                  All Statuses
                </button>
                <button
                  className={`btn btn-sm ${statusFilter === 'CONFIRMED' ? 'btn-info text-white' : 'btn-outline-info'}`}
                  onClick={() => setStatusFilter('CONFIRMED')}
                >
                  Confirmed
                </button>
                <button
                  className={`btn btn-sm ${statusFilter === 'CHECKED_IN' ? 'btn-success' : 'btn-outline-success'}`}
                  onClick={() => setStatusFilter('CHECKED_IN')}
                >
                  Checked-In
                </button>
                <button
                  className={`btn btn-sm ${statusFilter === 'COMPLETED' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                  onClick={() => setStatusFilter('COMPLETED')}
                >
                  Completed
                </button>
                <button
                  className={`btn btn-sm ${statusFilter === 'CANCELLED' ? 'btn-danger' : 'btn-outline-danger'}`}
                  onClick={() => setStatusFilter('CANCELLED')}
                >
                  Cancelled
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      {loading ? (
        <PageLoader fullScreen={false} message="Loading Reservations & Analytics..." />
      ) : (
        <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
          {/* Table Header Bar with Entries & Top-Right Export / Column Visibility */}
          <div className="card-header bg-white py-2.5 px-3 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2">
            {/* Left: Page Size Selector & Count Badge */}
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted small fw-semibold">Show</span>
              <select
                className="form-select form-select-sm border-secondary-subtle"
                style={{ width: '70px', height: '31px', fontSize: '0.8rem', cursor: 'pointer' }}
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <span className="text-muted small">entries</span>
              <span className="badge bg-light text-secondary border ms-1 px-2 py-1 extra-small">
                {totalItems} records
              </span>
            </div>

            {/* EXACT TOP RIGHT CORNER: Column Visibility + Excel & PDF Small Buttons */}
            <div className="d-flex align-items-center gap-2 ms-auto">
              {/* Column Visibility Dropdown */}
              <div className="dropdown position-relative" ref={columnMenuRef}>
                <button
                  type="button"
                  className={`btn btn-sm ${showColumnMenu ? 'btn-secondary text-white' : 'btn-outline-secondary'} d-inline-flex align-items-center gap-1.5 fw-semibold shadow-2xs`}
                  style={{ height: '30px', fontSize: '0.785rem', borderRadius: '6px' }}
                  onClick={() => setShowColumnMenu(!showColumnMenu)}
                  title="Customize visible columns"
                >
                  <i className="bi bi-sliders2"></i>
                  <span>Columns</span>
                  <i className="bi bi-chevron-down" style={{ fontSize: '0.65rem' }}></i>
                </button>

                {showColumnMenu && (
                  <div
                    className="dropdown-menu dropdown-menu-end show p-2 shadow-lg border-0 rounded-3 mt-1"
                    style={{ minWidth: '210px', zIndex: 1060 }}
                  >
                    <div className="d-flex justify-content-between align-items-center px-2 py-1 mb-1 border-bottom">
                      <span className="fw-bold extra-small text-uppercase text-muted" style={{ fontSize: '0.7rem' }}>
                        Visible Columns
                      </span>
                      <button
                        type="button"
                        className="btn btn-link btn-xs p-0 text-primary text-decoration-none fw-semibold"
                        style={{ fontSize: '0.7rem' }}
                        onClick={resetColumnVisibility}
                      >
                        Reset All
                      </button>
                    </div>
                    <div className="d-flex flex-column gap-1 pt-1">
                      {columnDefs.map((col) => (
                        <label
                          key={col.key}
                          className="dropdown-item d-flex align-items-center gap-2 py-1 px-2 rounded cursor-pointer small m-0"
                          style={{ cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                          <input
                            type="checkbox"
                            className="form-check-input m-0"
                            checked={columnVisibility[col.key]}
                            onChange={() => toggleColumnVisibility(col.key)}
                            style={{ cursor: 'pointer' }}
                          />
                          <span>{col.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Small Professional Excel Export Button */}
              <button
                type="button"
                onClick={handleExportExcel}
                className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1.5 fw-semibold shadow-2xs"
                style={{ height: '30px', fontSize: '0.785rem', borderRadius: '6px' }}
                title="Export Bookings to Excel (.xls)"
              >
                <i className="bi bi-file-earmark-excel-fill text-success"></i>
                <span>Excel</span>
              </button>

              {/* Small Professional PDF Export Button */}
              <button
                type="button"
                onClick={handleExportPDF}
                className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1.5 fw-semibold shadow-2xs"
                style={{ height: '30px', fontSize: '0.785rem', borderRadius: '6px' }}
                title="Export Bookings to PDF Report"
              >
                <i className="bi bi-file-earmark-pdf-fill text-danger"></i>
                <span>PDF</span>
              </button>
            </div>
          </div>

          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle m-0">
                <thead className="table-light text-muted small text-uppercase fw-bold">
                  <tr>
                    {columnVisibility.booking_number && renderSortHeader('Booking #', 'booking_number', 'ps-4')}
                    {columnVisibility.guest_profile && renderSortHeader('Guest Profile', 'guest_profile')}
                    {columnVisibility.assigned_room && renderSortHeader('Assigned Room', 'assigned_room')}
                    {columnVisibility.check_in && renderSortHeader('Check-In', 'check_in_date')}
                    {columnVisibility.expected_checkout && renderSortHeader('Expected Check-Out', 'expected_checkout_date')}
                    {columnVisibility.agreed_rate && renderSortHeader('Agreed Rate', 'room_rate')}
                    {columnVisibility.advance_paid && renderSortHeader('Advance Paid', 'advance_amount')}
                    {columnVisibility.status && renderSortHeader('Status', 'status')}
                    {columnVisibility.actions && <th className="text-end pe-4 text-nowrap">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {paginatedBookings.length === 0 ? (
                    <tr>
                      <td colSpan={visibleColumnCount} className="text-center py-5 text-muted">
                        <i className="bi bi-inbox fs-1 d-block text-muted opacity-50 mb-2"></i>
                        No reservation bookings found matching your search.
                      </td>
                    </tr>
                  ) : (
                    paginatedBookings.map((b) => {
                      const overdue = isBookingOverdue(b);
                      return (
                        <tr key={b.id}>
                          {columnVisibility.booking_number && (
                            <td className="ps-4">
                              <span className="fw-bold text-primary">{b.booking_number}</span>
                              <span className="d-block text-muted extra-small">
                                {formatDate(b.created_at)}
                              </span>
                            </td>
                          )}

                          {columnVisibility.guest_profile && (
                            <td>
                              <div className="d-flex align-items-center">
                                {b.customer_detail?.photo ? (
                                  <img
                                    src={b.customer_detail.photo}
                                    alt=""
                                    className="rounded-circle me-2 object-fit-cover"
                                    width="36"
                                    height="36"
                                  />
                                ) : (
                                  <div className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center me-2 fw-bold" style={{ width: 36, height: 36 }}>
                                    {b.customer_detail?.first_name?.[0] || 'G'}
                                  </div>
                                )}
                                <div>
                                  <div className="fw-bold text-dark">{b.customer_detail?.full_name || 'Guest'}</div>
                                  <span className="text-muted small">
                                    <i className="bi bi-telephone me-1"></i>{b.customer_detail?.mobile}
                                  </span>
                                </div>
                              </div>
                            </td>
                          )}

                          {columnVisibility.assigned_room && (
                            <td>
                              <div className="fw-bold text-dark">Room {b.room_detail?.room_number}</div>
                              <span className="badge bg-light text-muted border extra-small">
                                {b.room_detail?.room_type_name}
                              </span>
                            </td>
                          )}

                          {columnVisibility.check_in && (
                            <td>
                              <div className="fw-semibold text-dark">{formatDate(b.check_in_date)}</div>
                              <span className="text-muted extra-small">{b.check_in_time || '12:00 PM'}</span>
                            </td>
                          )}

                          {columnVisibility.expected_checkout && (
                            <td>
                              <div className={`fw-semibold ${overdue ? 'text-danger' : 'text-dark'}`}>
                                {formatDate(b.expected_checkout_date)}
                              </div>
                              <div className="d-flex align-items-center gap-1">
                                <span className={`${overdue ? 'text-danger fw-bold' : 'text-muted'} extra-small`}>
                                  {b.expected_checkout_time || '11:00 AM'}
                                </span>
                                {overdue && (
                                  <span className="badge bg-danger-subtle text-danger border border-danger-subtle extra-small fw-bold px-1.5 py-0.5">
                                    Overdue
                                  </span>
                                )}
                              </div>
                            </td>
                          )}

                          {columnVisibility.agreed_rate && (
                            <td className="fw-semibold text-dark">
                              {formatCurrency(b.room_rate)}
                              <span className="text-muted extra-small d-block">/ night</span>
                            </td>
                          )}

                          {columnVisibility.advance_paid && (
                            <td>
                              <span className="fw-bold text-success">{formatCurrency(b.advance_amount)}</span>
                            </td>
                          )}

                          {columnVisibility.status && (
                            <td>
                              <div className="d-flex flex-column align-items-start gap-1">
                                <StatusBadge status={b.status} />
                                {overdue && (
                                  <span className="badge bg-danger text-white px-2 py-1 rounded-pill extra-small fw-bold d-inline-flex align-items-center gap-1 shadow-sm animate-pulse">
                                    <i className="bi bi-exclamation-circle-fill"></i> OVERDUE
                                  </span>
                                )}
                              </div>
                            </td>
                          )}

                          {columnVisibility.actions && (
                            <td className="text-end pe-4">
                              <div className="btn-group btn-group-sm">
                                {/* View Details */}
                                <button
                                  className="btn btn-outline-secondary"
                                  title="View Details"
                                  onClick={() => setViewBooking(b)}
                                >
                                  <i className="bi bi-eye"></i>
                                </button>

                                {/* Edit Booking */}
                                {b.status === 'CONFIRMED' && hasPermission('bookings', 'can_edit') && (
                                  <button
                                    className="btn btn-outline-primary"
                                    title="Edit Booking"
                                    onClick={() => handleOpenEdit(b)}
                                  >
                                    <i className="bi bi-pencil-square"></i>
                                  </button>
                                )}

                                {/* Check-In */}
                                {b.status === 'CONFIRMED' && hasPermission('stays', 'can_checkin') && (
                                  <button
                                    className="btn btn-success fw-semibold"
                                    title="Process Check-In"
                                    onClick={() => handleCheckIn(b.id)}
                                  >
                                    <i className="bi bi-key me-1"></i>Check-In
                                  </button>
                                )}

                                {/* Cancel */}
                                {b.status === 'CONFIRMED' && hasPermission('bookings', 'can_cancel') && (
                                  <button
                                    className="btn btn-outline-warning text-dark"
                                    title="Cancel Booking"
                                    onClick={() => handleCancel(b)}
                                  >
                                    <i className="bi bi-x-circle"></i>
                                  </button>
                                )}

                                {/* Delete */}
                                {hasPermission('bookings', 'can_delete') && (
                                  <button
                                    className="btn btn-outline-danger"
                                    title="Delete Record"
                                    onClick={() => handleDelete(b)}
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Footer */}
          {totalItems > 0 && (
            <div className="card-footer bg-white py-2.5 px-3 border-top d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div className="text-muted small">
                Showing <span className="fw-semibold text-dark">{startIndex + 1}</span> to{' '}
                <span className="fw-semibold text-dark">{endIndex}</span> of{' '}
                <span className="fw-semibold text-dark">{totalItems}</span> bookings
              </div>

              {totalPages > 1 && (
                <nav aria-label="Bookings pagination">
                  <ul className="pagination pagination-sm m-0 gap-1 align-items-center">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button
                        type="button"
                        className="page-link rounded px-2.5 py-1"
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        aria-label="Previous page"
                      >
                        <i className="bi bi-chevron-left" style={{ fontSize: '0.7rem' }}></i>
                      </button>
                    </li>

                    {getPageNumbers(currentPage, totalPages).map((page, idx) => {
                      if (page === '...') {
                        return (
                          <li key={`ellipsis-${idx}`} className="page-item disabled">
                            <span className="page-link border-0 bg-transparent px-1.5 text-muted">...</span>
                          </li>
                        );
                      }
                      return (
                        <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                          <button
                            type="button"
                            className="page-link rounded px-2.5 py-1"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </button>
                        </li>
                      );
                    })}

                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button
                        type="button"
                        className="page-link rounded px-2.5 py-1"
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        aria-label="Next page"
                      >
                        <i className="bi bi-chevron-right" style={{ fontSize: '0.7rem' }}></i>
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW BOOKING DETAILS MODAL */}
      {viewBooking && (
        <div className="modal fade show d-block tab-modal-backdrop" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header bg-primary text-white p-3">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-journal-check me-2"></i>Booking Details — #{viewBooking.booking_number}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setViewBooking(null)}></button>
              </div>

              <div className="modal-body p-4">
                <div className="row g-3">
                  {/* Guest Info */}
                  <div className="col-md-6">
                    <div className="card border bg-light h-100">
                      <div className="card-body p-3">
                        <h6 className="fw-bold text-primary mb-3">
                          <i className="bi bi-person-circle me-2"></i>Primary Guest Details
                        </h6>
                        <div className="d-flex align-items-center mb-3">
                          {viewBooking.customer_detail?.photo ? (
                            <img src={viewBooking.customer_detail.photo} alt="" className="rounded-circle me-3 object-fit-cover" width="56" height="56" />
                          ) : (
                            <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3 fw-bold fs-4" style={{ width: 56, height: 56 }}>
                              {viewBooking.customer_detail?.first_name?.[0] || 'G'}
                            </div>
                          )}
                          <div>
                            <h6 className="fw-bold m-0">{viewBooking.customer_detail?.full_name}</h6>
                            <span className="text-muted small"><i className="bi bi-telephone me-1"></i>{viewBooking.customer_detail?.mobile}</span>
                          </div>
                        </div>

                        <ul className="list-unstyled small mb-0">
                          <li className="mb-1"><strong>Email:</strong> {viewBooking.customer_detail?.email || 'N/A'}</li>
                          <li className="mb-1"><strong>ID Proof:</strong> {viewBooking.customer_detail?.id_type} — {viewBooking.customer_detail?.id_number || 'N/A'}</li>
                          <li className="mb-1"><strong>Address:</strong> {viewBooking.customer_detail?.address || 'N/A'}, {viewBooking.customer_detail?.city || ''}</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Room & Stay Schedule */}
                  <div className="col-md-6">
                    <div className="card border bg-light h-100">
                      <div className="card-body p-3">
                        <h6 className="fw-bold text-primary mb-3">
                          <i className="bi bi-door-open me-2"></i>Room & Schedule
                        </h6>
                        <ul className="list-unstyled small mb-0">
                          <li className="mb-2 d-flex justify-content-between">
                            <span className="text-muted">Assigned Room:</span>
                            <span className="fw-bold text-dark">Room {viewBooking.room_detail?.room_number} ({viewBooking.room_detail?.room_type_name})</span>
                          </li>
                          <li className="mb-2 d-flex justify-content-between">
                            <span className="text-muted">Check-In Schedule:</span>
                            <span className="fw-semibold text-dark">{formatDate(viewBooking.check_in_date)} @ {viewBooking.check_in_time || '12:00 PM'}</span>
                          </li>
                          <li className="mb-2 d-flex justify-content-between">
                            <span className="text-muted">Check-Out Schedule:</span>
                            <span className="fw-semibold text-dark">{formatDate(viewBooking.expected_checkout_date)} @ {viewBooking.expected_checkout_time || '11:00 AM'}</span>
                          </li>
                          <li className="mb-2 d-flex justify-content-between">
                            <span className="text-muted">Guests:</span>
                            <span className="fw-semibold text-dark">{viewBooking.adults} Adults, {viewBooking.children} Children</span>
                          </li>
                          <li className="mb-2 d-flex justify-content-between">
                            <span className="text-muted">Current Status:</span>
                            <StatusBadge status={viewBooking.status} />
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="col-12">
                    <div className="card border-primary bg-primary bg-opacity-10">
                      <div className="card-body p-3">
                        <div className="row text-center">
                          <div className="col-md-4">
                            <span className="text-muted small d-block">Agreed Nightly Rate</span>
                            <span className="fs-5 fw-bold text-dark">{formatCurrency(viewBooking.room_rate)}</span>
                          </div>
                          <div className="col-md-4">
                            <span className="text-muted small d-block">Advance Paid Deposit</span>
                            <span className="fs-5 fw-bold text-success">{formatCurrency(viewBooking.advance_amount)}</span>
                          </div>
                          <div className="col-md-4">
                            <span className="text-muted small d-block">Booking Notes</span>
                            <span className="small text-dark fw-semibold">{viewBooking.notes || 'No notes added.'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer bg-light p-3 d-flex justify-content-between align-items-center">
                <button
                  type="button"
                  className="btn btn-primary fw-bold d-flex align-items-center gap-1.5 shadow-sm"
                  onClick={() => handleNavigateToStayDetails(viewBooking)}
                >
                  <i className="bi bi-box-arrow-up-right me-1"></i> View Full Stay Details
                </button>
                <div className="d-flex gap-2">
                  {viewBooking.status === 'CONFIRMED' && (
                    <button className="btn btn-success fw-bold" onClick={() => { setViewBooking(null); handleCheckIn(viewBooking.id); }}>
                      <i className="bi bi-key me-1"></i>Proceed to Check-In
                    </button>
                  )}
                  <button className="btn btn-secondary fw-semibold" onClick={() => setViewBooking(null)}>Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT BOOKING MODAL */}
      {editBooking && (
        <div className="modal fade show d-block modal-backdrop-animated" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-animated" style={{ maxWidth: '780px' }}>
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden modal-content-animated" style={{ backgroundColor: '#ffffff' }}>
              
              <div className="modal-header bg-white border-bottom py-3 px-4 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <div className="p-2.5 bg-primary-subtle text-primary rounded-3 d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                    <i className="bi bi-pencil-square fs-5"></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-dark m-0" style={{ fontSize: '1.15rem', letterSpacing: '-0.01em' }}>
                      Edit Reservation Booking — #{editBooking.booking_number}
                    </h5>
                    <span className="text-secondary extra-small">
                      Modify reservation room assignment, schedule dates, agreed rate, and deposit details.
                    </span>
                  </div>
                </div>
                <button type="button" className="btn-close shadow-none" onClick={() => setEditBooking(null)}></button>
              </div>

              <form onSubmit={handleSaveEdit}>
                <div className="modal-body p-4 bg-white" style={{ maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' }}>
                  {editError && (
                    <div className="alert alert-danger border-danger py-2 rounded-3 small mb-3">
                      <i className="bi bi-exclamation-triangle-fill me-1.5"></i>{editError}
                    </div>
                  )}

                  <div className="mb-4">
                    <div className="text-uppercase tracking-wider extra-small font-bold text-primary mb-2.5 d-flex align-items-center gap-1.5" style={{ fontSize: '0.725rem', letterSpacing: '0.05em' }}>
                      <i className="bi bi-person"></i> Guest & Room Assignment
                    </div>
                    <div className="row g-3">
                      {/* Guest Name Readonly */}
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-dark mb-1">Primary Guest Name</label>
                        <input type="text" className="form-control py-2.5 bg-light" style={{ height: '46px' }} value={editBooking.customer_detail?.full_name || ''} readOnly />
                      </div>

                      {/* Room Selection */}
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-dark mb-1">
                          Reassign Room {editLoadingRooms && <span className="spinner-border spinner-border-sm text-primary ms-1"></span>}
                        </label>
                        <select
                          className="form-select py-2.5 font-semibold"
                          style={{ height: '46px' }}
                          value={editForm.room}
                          onChange={(e) => handleEditInputChange('room', e.target.value)}
                          required
                        >
                          {editAvailableRooms.length === 0 ? (
                            <option value="" disabled>Loading available rooms...</option>
                          ) : (
                            editAvailableRooms.map((r) => (
                              <option key={r.id} value={r.id}>
                                Room {r.room_number} — {r.room_type_name || r.room_type?.name || 'Standard'} (₹{parseFloat(r.base_price || r.room_type?.base_price || 0).toLocaleString('en-IN')}/night)
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-uppercase tracking-wider extra-small font-bold text-primary mb-2.5 d-flex align-items-center gap-1.5" style={{ fontSize: '0.725rem', letterSpacing: '0.05em' }}>
                      <i className="bi bi-calendar-range"></i> Reservation Schedule
                    </div>
                    <div className="row g-3">
                      {/* Check-In Date & Time */}
                      <div className="col-md-3 col-6">
                        <label className="form-label small fw-semibold text-dark mb-1">Check-In Date *</label>
                        <input
                          type="date"
                          className="form-control py-2.5"
                          style={{ height: '46px' }}
                          value={editForm.check_in_date}
                          onChange={(e) => handleEditInputChange('check_in_date', e.target.value)}
                          required
                        />
                      </div>

                      <div className="col-md-3 col-6">
                        <label className="form-label small fw-semibold text-dark mb-1">Check-In Time *</label>
                        <input
                          type="time"
                          className="form-control py-2.5"
                          style={{ height: '46px' }}
                          value={editForm.check_in_time}
                          onChange={(e) => handleEditInputChange('check_in_time', e.target.value)}
                        />
                      </div>

                      {/* Check-Out Date & Time */}
                      <div className="col-md-3 col-6">
                        <label className="form-label small fw-semibold text-dark mb-1">Check-Out Date *</label>
                        <input
                          type="date"
                          className="form-control py-2.5"
                          style={{ height: '46px' }}
                          value={editForm.expected_checkout_date}
                          onChange={(e) => handleEditInputChange('expected_checkout_date', e.target.value)}
                          required
                        />
                      </div>

                      <div className="col-md-3 col-6">
                        <label className="form-label small fw-semibold text-dark mb-1">Check-Out Time *</label>
                        <input
                          type="time"
                          className="form-control py-2.5"
                          style={{ height: '46px' }}
                          value={editForm.expected_checkout_time}
                          onChange={(e) => handleEditInputChange('expected_checkout_time', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-uppercase tracking-wider extra-small font-bold text-primary mb-2.5 d-flex align-items-center gap-1.5" style={{ fontSize: '0.725rem', letterSpacing: '0.05em' }}>
                      <i className="bi bi-currency-rupee"></i> Pricing & Advance Deposit
                    </div>
                    <div className="row g-3">
                      {/* Agreed Daily Rate & Advance Amount */}
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-dark mb-1">Agreed Daily Room Rate (₹/night) *</label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-end-0 text-muted">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control border-start-0 py-2.5 font-bold"
                            style={{ height: '46px' }}
                            value={editForm.room_rate}
                            onChange={(e) => handleEditInputChange('room_rate', e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-dark mb-1">Advance Deposit Paid (₹)</label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-end-0 text-muted">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control border-start-0 py-2.5 font-bold text-success"
                            style={{ height: '46px' }}
                            value={editForm.advance_amount}
                            onChange={(e) => handleEditInputChange('advance_amount', e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Guests Count */}
                      <div className="col-md-6 col-6">
                        <label className="form-label small fw-semibold text-dark mb-1">Adults</label>
                        <input
                          type="number"
                          min="1"
                          className="form-control py-2.5"
                          style={{ height: '46px' }}
                          value={editForm.adults}
                          onChange={(e) => handleEditInputChange('adults', e.target.value)}
                          required
                        />
                      </div>

                      <div className="col-md-6 col-6">
                        <label className="form-label small fw-semibold text-dark mb-1">Children</label>
                        <input
                          type="number"
                          min="0"
                          className="form-control py-2.5"
                          style={{ height: '46px' }}
                          value={editForm.children}
                          onChange={(e) => handleEditInputChange('children', e.target.value)}
                        />
                      </div>

                      {/* Notes */}
                      <div className="col-12">
                        <label className="form-label small fw-semibold text-dark mb-1">Reservation Notes</label>
                        <textarea
                          className="form-control p-2.5"
                          rows="2"
                          value={editForm.notes}
                          onChange={(e) => handleEditInputChange('notes', e.target.value)}
                          placeholder="Add optional notes..."
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light border-top px-4 py-3 d-flex justify-content-between align-items-center">
                  <button type="button" className="btn btn-light border fw-semibold px-4 py-2 rounded-3" onClick={() => setEditBooking(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary fw-bold px-4 py-2 rounded-3 shadow-sm d-flex align-items-center gap-2" disabled={editSubmitting}>
                    {editSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle-fill"></i> Save Reservation Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete / Cancel Modal */}
      <ConfirmModal
        show={confirmModal.show}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        confirmBtnClass={confirmModal.confirmBtnClass}
        loading={confirmModal.loading}
        onClose={() => setConfirmModal({ show: false })}
        onConfirm={confirmModal.onConfirm}
      />
    </div>
  );
};

export default Bookings;
