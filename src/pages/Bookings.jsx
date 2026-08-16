import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getBookingsApi, updateBookingApi, cancelBookingApi, deleteBookingApi } from '../api/bookingApi';
import { checkAvailabilityApi, getRoomsApi } from '../api/roomApi';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import PageLoader from '../components/PageLoader';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const Bookings = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.is_superuser;

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

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

  useEffect(() => {
    loadBookings();
  }, [statusFilter, search]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await getBookingsApi({ status: statusFilter, search: search });
      setBookings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // KPI Analytics Counters
  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter((b) => b.status === 'CONFIRMED').length;
  const checkedInBookings = bookings.filter((b) => b.status === 'CHECKED_IN').length;
  const totalAdvancePaid = bookings.reduce((sum, b) => sum + parseFloat(b.advance_amount || 0), 0);

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

  // Open Edit Modal
  const handleOpenEdit = async (booking) => {
    setEditBooking(booking);
    setEditError('');
    setEditForm({
      room: booking.room,
      check_in_date: booking.check_in_date,
      check_in_time: booking.check_in_time || '12:00',
      expected_checkout_date: booking.expected_checkout_date,
      expected_checkout_time: booking.expected_checkout_time || '11:00',
      adults: booking.adults || 1,
      children: booking.children || 0,
      room_rate: booking.room_rate || '',
      advance_amount: booking.advance_amount || '',
      notes: booking.notes || '',
    });

    // Fetch available rooms for this booking's dates
    fetchRoomsForEdit(booking.check_in_date, booking.check_in_time || '12:00', booking.expected_checkout_date, booking.expected_checkout_time || '11:00', booking.room_detail);
  };

  const fetchRoomsForEdit = async (inDate, inTime, outDate, outTime, currentRoomDetail) => {
    if (!inDate || !outDate) return;
    setEditLoadingRooms(true);
    try {
      const inFull = `${inDate}T${inTime || '12:00'}:00`;
      const outFull = `${outDate}T${outTime || '11:00'}:00`;
      const res = await checkAvailabilityApi(inFull, outFull);
      let roomsList = res.rooms || [];
      // Ensure currently assigned room is included in dropdown even if booked by this reservation
      if (currentRoomDetail && !roomsList.some((r) => r.id === currentRoomDetail.id)) {
        roomsList = [currentRoomDetail, ...roomsList];
      }
      setEditAvailableRooms(roomsList);
    } catch (err) {
      console.error(err);
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
        editBooking?.room_detail
      );
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditSubmitting(true);
    setEditError('');

    try {
      await updateBookingApi(editBooking.id, {
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
      loadBookings();
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
        setConfirmModal((prev) => ({ ...prev, loading: true }));
        try {
          await cancelBookingApi(booking.id);
          setConfirmModal({ show: false });
          loadBookings();
        } catch (err) {
          alert(err.response?.data?.error || 'Error cancelling booking.');
          setConfirmModal({ show: false });
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
        setConfirmModal((prev) => ({ ...prev, loading: true }));
        try {
          await deleteBookingApi(booking.id);
          setConfirmModal({ show: false });
          showSuccess(`Booking #${booking.booking_number} deleted successfully.`, 'Booking Deleted');
          loadBookings();
        } catch (err) {
          showError(err.response?.data?.error || 'Error deleting booking record.', 'Deletion Failed');
          setConfirmModal({ show: false });
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
        <Link to="/bookings/create" className="btn btn-primary fw-bold shadow-sm px-4 py-2">
          <i className="bi bi-calendar-plus-fill me-2"></i>New Advance Booking
        </Link>
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
        <div className="card border-0 shadow-sm rounded-3">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle m-0">
                <thead className="table-light text-muted small text-uppercase fw-bold">
                  <tr>
                    <th className="ps-4">Booking #</th>
                    <th>Guest Profile</th>
                    <th>Assigned Room</th>
                    <th>Check-In</th>
                    <th>Expected Check-Out</th>
                    <th>Agreed Rate</th>
                    <th>Advance Paid</th>
                    <th>Status</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center py-5 text-muted">
                        <i className="bi bi-inbox fs-1 d-block text-muted opacity-50 mb-2"></i>
                        No reservation bookings found matching your search.
                      </td>
                    </tr>
                  ) : (
                    bookings.map((b) => {
                      const overdue = isBookingOverdue(b);
                      return (
                      <tr key={b.id}>
                        <td className="ps-4">
                          <span className="fw-bold text-primary">{b.booking_number}</span>
                          <span className="d-block text-muted extra-small">
                            {formatDate(b.created_at)}
                          </span>
                        </td>

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

                        <td>
                          <div className="fw-bold text-dark">Room {b.room_detail?.room_number}</div>
                          <span className="badge bg-light text-muted border extra-small">
                            {b.room_detail?.room_type_name}
                          </span>
                        </td>

                        <td>
                          <div className="fw-semibold text-dark">{formatDate(b.check_in_date)}</div>
                          <span className="text-muted extra-small">{b.check_in_time || '12:00 PM'}</span>
                        </td>

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

                        <td className="fw-semibold text-dark">
                          {formatCurrency(b.room_rate)}
                          <span className="text-muted extra-small d-block">/ night</span>
                        </td>

                        <td>
                          <span className="fw-bold text-success">{formatCurrency(b.advance_amount)}</span>
                        </td>

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
                            {b.status === 'CONFIRMED' && (
                              <button
                                className="btn btn-outline-primary"
                                title="Edit Booking"
                                onClick={() => handleOpenEdit(b)}
                              >
                                <i className="bi bi-pencil-square"></i>
                              </button>
                            )}

                            {/* Check-In */}
                            {b.status === 'CONFIRMED' && (
                              <button
                                className="btn btn-success fw-semibold"
                                title="Process Check-In"
                                onClick={() => handleCheckIn(b.id)}
                              >
                                <i className="bi bi-key me-1"></i>Check-In
                              </button>
                            )}

                            {/* Cancel */}
                            {b.status === 'CONFIRMED' && (
                              <button
                                className="btn btn-outline-warning text-dark"
                                title="Cancel Booking"
                                onClick={() => handleCancel(b)}
                              >
                                <i className="bi bi-x-circle"></i>
                              </button>
                            )}

                            {/* Delete (Admin only) */}
                            {isAdmin && (
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
                      </tr>
                    );
                  })
                  )}
                </tbody>
              </table>
            </div>
          </div>
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

              <div className="modal-footer bg-light p-3">
                {viewBooking.status === 'CONFIRMED' && (
                  <button className="btn btn-success fw-bold" onClick={() => { setViewBooking(null); handleCheckIn(viewBooking.id); }}>
                    <i className="bi bi-key me-1"></i>Proceed to Check-In
                  </button>
                )}
                <button className="btn btn-secondary" onClick={() => setViewBooking(null)}>Close</button>
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
                          {editAvailableRooms.map((r) => (
                            <option key={r.id} value={r.id}>
                              Room {r.room_number} — {r.room_type_name} (₹{parseFloat(r.base_price).toLocaleString('en-IN')}/night)
                            </option>
                          ))}
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
