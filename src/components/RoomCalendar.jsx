import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRoomsApi, updateRoomStatusApi } from '../api/roomApi';
import { getBookingsApi } from '../api/bookingApi';
import { getStaysApi } from '../api/stayApi';
import StatusBadge from './StatusBadge';
import { formatDate } from '../utils/dateUtils';
import { formatCurrency } from '../utils/formatCurrency';

const RoomCalendar = () => {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stays, setStays] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected cell detail modal state
  const [selectedCell, setSelectedCell] = useState(null);

  const navigate = useNavigate();

  // Helper to format date cleanly as YYYY-MM-DD
  const formatDateStr = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Generate next 14 days array
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(formatDateStr(d));
  }

  useEffect(() => {
    loadCalendarData();
  }, []);

  const loadCalendarData = async () => {
    setLoading(true);
    try {
      const [rRes, bRes, sRes] = await Promise.all([getRoomsApi(), getBookingsApi(), getStaysApi()]);
      setRooms(rRes);
      setBookings(bRes);
      setStays(sRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStatusChange = async (roomId, newStatus) => {
    try {
      await updateRoomStatusApi(roomId, newStatus);
      setSelectedCell(null);
      loadCalendarData();
    } catch (err) {
      alert('Error updating room status.');
    }
  };

  const getCellStatus = (room, dateStr) => {
    const targetRoomId = Number(room.id);

    // 1. Check active stay on that date
    const activeStay = stays.find((s) => {
      const sRoomId = Number(typeof s.room === 'object' ? s.room?.id : s.room);
      if (sRoomId !== targetRoomId || s.status === 'CHECKED_OUT' || s.status === 'CANCELLED') return false;
      const checkIn = s.check_in_date;
      const checkout = s.actual_checkout_date || s.expected_checkout_date;
      return dateStr >= checkIn && dateStr < checkout;
    });

    if (activeStay) {
      const cust = activeStay.primary_customer_detail || {};
      const bill = activeStay.bill_summary || {};
      return {
        status: 'OCCUPIED',
        customerName: cust.full_name || 'Checked-In Guest',
        mobile: cust.mobile || 'N/A',
        email: cust.email || '',
        address: cust.address || 'N/A',
        idType: cust.id_type || 'Aadhaar',
        idNumber: cust.id_number || 'N/A',
        recordNo: activeStay.stay_number,
        recordId: activeStay.id,
        recordType: 'stay',
        checkIn: activeStay.check_in_date,
        checkout: activeStay.expected_checkout_date,
        grandTotal: bill.grand_total,
        totalPaid: bill.total_paid,
        balance: bill.balance,
        adults: activeStay.adults || 1,
        children: activeStay.children || 0,
      };
    }

    // 2. Check confirmed booking on that date
    const activeBooking = bookings.find((b) => {
      const bRoomId = Number(typeof b.room === 'object' ? b.room?.id : b.room);
      if (bRoomId !== targetRoomId || b.status === 'CANCELLED' || b.status === 'COMPLETED' || b.status === 'CHECKED_IN') return false;
      const checkIn = b.check_in_date;
      const checkout = b.expected_checkout_date;
      return dateStr >= checkIn && dateStr < checkout;
    });

    if (activeBooking) {
      const cust = activeBooking.customer_detail || {};
      return {
        status: 'RESERVED',
        customerName: cust.full_name || 'Advance Reservation',
        mobile: cust.mobile || 'N/A',
        email: cust.email || '',
        address: cust.address || 'N/A',
        idType: cust.id_type || 'Aadhaar',
        idNumber: cust.id_number || 'N/A',
        recordNo: activeBooking.booking_number,
        recordId: activeBooking.id,
        recordType: 'booking',
        checkIn: activeBooking.check_in_date,
        checkout: activeBooking.expected_checkout_date,
        advanceAmount: activeBooking.advance_amount,
        adults: activeBooking.adults || 1,
        children: activeBooking.children || 0,
      };
    }

    if (room.status === 'MAINTENANCE') return { status: 'MAINTENANCE', customerName: 'Under Maintenance' };
    if (room.status === 'CLEANING') return { status: 'CLEANING', customerName: 'Housekeeping' };

    return { status: 'AVAILABLE', customerName: 'Available for Booking' };
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status"></div>
        <div className="mt-2 text-muted small">Loading Reservation Calendar & Room Grid...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center flex-wrap gap-2 border-bottom">
          <h5 className="m-0 fw-bold text-dark"><i className="bi bi-calendar3 me-2 text-primary"></i>Room Availability Grid</h5>
          <div className="d-flex gap-2 flex-wrap">
            <span className="badge" style={{ backgroundColor: '#10b981', color: '#fff' }}>Available</span>
            <span className="badge" style={{ backgroundColor: '#6366f1', color: '#fff' }}>Reserved</span>
            <span className="badge" style={{ backgroundColor: '#ef4444', color: '#fff' }}>Occupied</span>
            <span className="badge" style={{ backgroundColor: '#f59e0b', color: '#1e293b' }}>Cleaning</span>
            <span className="badge" style={{ backgroundColor: '#64748b', color: '#fff' }}>Maintenance</span>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-bordered align-middle text-center m-0" style={{ fontSize: '0.85rem' }}>
              <thead className="table-light">
                <tr>
                  <th style={{ width: '130px', minWidth: '130px' }}>Room</th>
                  {dates.map((d) => {
                    const parts = d.split('-');
                    const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
                    return (
                      <th key={d} style={{ minWidth: '110px' }}>
                        <div className="fw-bold">{formatDate(d)}</div>
                        <div className="text-muted fw-normal" style={{ fontSize: '0.75rem' }}>
                          {dateObj.toLocaleDateString('en-IN', { weekday: 'short' })}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr key={room.id}>
                    <td className="fw-bold bg-light text-start ps-3">
                      <div style={{ color: '#0f172a', fontWeight: 700 }}>Room {room.room_number}</div>
                      <div className="text-muted fw-normal" style={{ fontSize: '0.7rem' }}>{room.room_type_name}</div>
                    </td>
                    {dates.map((d) => {
                      const cell = getCellStatus(room, d);

                      let cellStyle = { backgroundColor: '#f0fdf4', color: '#166534', cursor: 'pointer' }; // Available
                      if (cell.status === 'OCCUPIED') {
                        cellStyle = { backgroundColor: '#ef4444', color: '#ffffff', cursor: 'pointer' };
                      } else if (cell.status === 'RESERVED') {
                        cellStyle = { backgroundColor: '#6366f1', color: '#ffffff', cursor: 'pointer' };
                      } else if (cell.status === 'CLEANING') {
                        cellStyle = { backgroundColor: '#f59e0b', color: '#1e293b', cursor: 'pointer' };
                      } else if (cell.status === 'MAINTENANCE') {
                        cellStyle = { backgroundColor: '#64748b', color: '#ffffff', cursor: 'pointer' };
                      }

                      return (
                        <td
                          key={d}
                          className="p-1"
                          style={{ verticalAlign: 'middle' }}
                          onClick={() => setSelectedCell({ room, date: d, cell })}
                        >
                          <div
                            className="p-2 rounded text-center shadow-sm hover-scale transition"
                            style={{ ...cellStyle, minHeight: '52px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
                            title={`Click for details: ${cell.status} - ${cell.customerName}`}
                          >
                            <div className="fw-bold" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              {cell.status}
                            </div>
                            {cell.customerName && cell.status !== 'AVAILABLE' && (
                              <div className="text-truncate fw-semibold mt-1" style={{ fontSize: '0.7rem', opacity: 0.95 }}>
                                <i className="bi bi-person-fill me-1"></i>{cell.customerName}
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Customer & Reservation Details Interactive Dialogue Box Modal */}
      {selectedCell && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.65)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '14px', overflow: 'hidden' }}>
              {/* Modal Header */}
              <div className="modal-header bg-dark text-white py-3">
                <div>
                  <h5 className="modal-title m-0 fw-bold d-flex align-items-center gap-2">
                    <i className="bi bi-door-open-fill text-primary"></i>
                    Room {selectedCell.room.room_number} Details & Reservation Overview
                  </h5>
                  <div className="text-muted small mt-1">
                    Room Type: <strong className="text-light">{selectedCell.room.room_type_name}</strong> | Target Date: <strong>{formatDate(selectedCell.date)}</strong>
                  </div>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedCell(null)}></button>
              </div>

              {/* Modal Body */}
              <div className="modal-body p-4 bg-white">
                <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                  <span className="text-dark fw-bold fs-6">
                    <i className="bi bi-info-circle me-2 text-primary"></i>Cell Status:
                  </span>
                  <StatusBadge status={selectedCell.cell.status} />
                </div>

                {selectedCell.cell.status === 'OCCUPIED' || selectedCell.cell.status === 'RESERVED' ? (
                  <div className="row g-3">
                    {/* Customer Profile Box */}
                    <div className="col-12">
                      <div className="p-3 bg-light rounded-3 border">
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                            <i className="bi bi-person-fill fs-5"></i>
                          </div>
                          <div>
                            <div className="fw-bold text-dark fs-5">{selectedCell.cell.customerName}</div>
                            <div className="text-muted small">
                              {selectedCell.cell.recordType === 'stay' ? 'Checked-In Stay Record' : 'Advance Reservation'}
                            </div>
                          </div>
                        </div>

                        <div className="row g-3 mt-1">
                          <div className="col-md-6">
                            <div className="p-2 bg-white rounded border">
                              <span className="text-muted small d-block"><i className="bi bi-telephone text-success me-1"></i>Contact Number</span>
                              <strong className="text-dark">{selectedCell.cell.mobile}</strong>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="p-2 bg-white rounded border">
                              <span className="text-muted small d-block"><i className="bi bi-envelope text-info me-1"></i>Email Address</span>
                              <strong className="text-dark">{selectedCell.cell.email || 'N/A'}</strong>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="p-2 bg-white rounded border">
                              <span className="text-muted small d-block"><i className="bi bi-geo-alt-fill text-danger me-1"></i>Full Address</span>
                              <strong className="text-dark">{selectedCell.cell.address || 'N/A'}</strong>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="p-2 bg-white rounded border">
                              <span className="text-muted small d-block"><i className="bi bi-card-heading text-warning me-1"></i>Identity Proof</span>
                              <strong className="text-dark">{selectedCell.cell.idType}: {selectedCell.cell.idNumber}</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stay / Booking Details Box */}
                    <div className="col-md-6">
                      <div className="p-3 bg-light rounded-3 border h-100">
                        <h6 className="fw-bold text-dark border-bottom pb-2 mb-2">
                          <i className="bi bi-calendar-event me-2 text-primary"></i>
                          {selectedCell.cell.recordType === 'stay' ? 'Stay Overview' : 'Booking Overview'}
                        </h6>
                        <div className="d-flex justify-content-between small py-1 border-bottom">
                          <span className="text-muted">Record Number:</span>
                          <strong className="text-dark">{selectedCell.cell.recordNo}</strong>
                        </div>
                        <div className="d-flex justify-content-between small py-1 border-bottom">
                          <span className="text-muted">Check-In Date:</span>
                          <strong className="text-dark">{formatDate(selectedCell.cell.checkIn)}</strong>
                        </div>
                        <div className="d-flex justify-content-between small py-1 border-bottom">
                          <span className="text-muted">Check-Out Date:</span>
                          <strong className="text-dark">{formatDate(selectedCell.cell.checkout)}</strong>
                        </div>
                        <div className="d-flex justify-content-between small py-1">
                          <span className="text-muted">Occupancy:</span>
                          <strong className="text-dark">{selectedCell.cell.adults} Adults, {selectedCell.cell.children} Children</strong>
                        </div>
                      </div>
                    </div>

                    {/* Financial Summary Box */}
                    <div className="col-md-6">
                      <div className="p-3 bg-light rounded-3 border h-100">
                        <h6 className="fw-bold text-dark border-bottom pb-2 mb-2">
                          <i className="bi bi-calculator me-2 text-success"></i>Financial Summary
                        </h6>
                        {selectedCell.cell.recordType === 'stay' ? (
                          <>
                            <div className="d-flex justify-content-between small py-1 border-bottom">
                              <span className="text-muted">Grand Total Bill:</span>
                              <strong className="text-primary">{formatCurrency(selectedCell.cell.grandTotal)}</strong>
                            </div>
                            <div className="d-flex justify-content-between small py-1 border-bottom">
                              <span className="text-muted">Total Paid:</span>
                              <strong className="text-success">{formatCurrency(selectedCell.cell.totalPaid)}</strong>
                            </div>
                            <div className="d-flex justify-content-between py-2 border-top mt-1">
                              <span className="fw-bold text-dark">Balance Due:</span>
                              <strong className={`fw-bold fs-6 ${selectedCell.cell.balance > 0 ? 'text-danger' : 'text-success'}`}>
                                {formatCurrency(selectedCell.cell.balance)}
                              </strong>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="d-flex justify-content-between small py-1 border-bottom">
                              <span className="text-muted">Advance Paid:</span>
                              <strong className="text-success">{formatCurrency(selectedCell.cell.advanceAmount)}</strong>
                            </div>
                            <div className="d-flex justify-content-between small py-1 mt-2">
                              <span className="text-muted">Booking Status:</span>
                              <span className="badge bg-primary">Confirmed Reservation</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : selectedCell.cell.status === 'CLEANING' ? (
                  <div className="alert alert-warning py-4 text-center mb-0 border-warning" style={{ borderRadius: '12px' }}>
                    <i className="bi bi-stars text-warning d-block mb-2" style={{ fontSize: '2.5rem' }}></i>
                    <h5 className="fw-bold text-dark">Room {selectedCell.room.room_number} Under Housekeeping & Cleaning</h5>
                    <p className="text-muted small max-w-md mx-auto mb-3">
                      Room {selectedCell.room.room_number} ({selectedCell.room.room_type_name}) is currently blocked for cleaning and sanitization. Update room status once housekeeping is completed.
                    </p>
                    <button
                      className="btn btn-warning text-dark fw-bold shadow-sm"
                      onClick={() => handleQuickStatusChange(selectedCell.room.id, 'AVAILABLE')}
                    >
                      <i className="bi bi-check-circle-fill me-1"></i> Complete Cleaning & Set AVAILABLE
                    </button>
                  </div>
                ) : selectedCell.cell.status === 'MAINTENANCE' ? (
                  <div className="alert alert-secondary py-4 text-center mb-0 border-secondary" style={{ borderRadius: '12px', backgroundColor: '#f8fafc' }}>
                    <i className="bi bi-tools text-secondary d-block mb-2" style={{ fontSize: '2.5rem' }}></i>
                    <h5 className="fw-bold text-dark">Room {selectedCell.room.room_number} Under Repair & Maintenance</h5>
                    <p className="text-muted small max-w-md mx-auto mb-3">
                      Room {selectedCell.room.room_number} ({selectedCell.room.room_type_name}) is currently blocked for maintenance/repair work. It cannot be booked or checked in until repairs are finished.
                    </p>
                    <button
                      className="btn btn-dark fw-bold shadow-sm"
                      onClick={() => handleQuickStatusChange(selectedCell.room.id, 'AVAILABLE')}
                    >
                      <i className="bi bi-wrench-adjustable-circle-fill me-1"></i> Complete Maintenance & Set AVAILABLE
                    </button>
                  </div>
                ) : (
                  <div className="alert alert-success py-4 text-center mb-0 border-success" style={{ borderRadius: '12px' }}>
                    <i className="bi bi-check-circle-fill text-success d-block mb-2" style={{ fontSize: '2.5rem' }}></i>
                    <h5 className="fw-bold text-dark">Room {selectedCell.room.room_number} Available</h5>
                    <p className="text-muted small max-w-md mx-auto mb-0">
                      Room {selectedCell.room.room_number} ({selectedCell.room.room_type_name}) is 100% available for check-in or advance booking on {formatDate(selectedCell.date)}.
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="modal-footer bg-light justify-content-between">
                <button type="button" className="btn btn-secondary fw-semibold" onClick={() => setSelectedCell(null)}>
                  Close
                </button>
                <div className="d-flex gap-2">
                  {selectedCell.cell.recordType === 'stay' && (
                    <button
                      className="btn btn-primary fw-bold px-3"
                      onClick={() => {
                        const sId = selectedCell.cell.recordId;
                        setSelectedCell(null);
                        navigate(`/stays/${sId}`);
                      }}
                    >
                      <i className="bi bi-eye-fill me-1"></i> View Full Stay Dashboard
                    </button>
                  )}

                  {selectedCell.cell.recordType === 'booking' && (
                    <button
                      className="btn btn-success fw-bold px-3 shadow-sm"
                      onClick={() => {
                        const bId = selectedCell.cell.recordId;
                        setSelectedCell(null);
                        navigate(`/check-in?booking_id=${bId}`);
                      }}
                    >
                      <i className="bi bi-box-arrow-in-right me-1"></i> Proceed to Check-In
                    </button>
                  )}

                  {selectedCell.cell.status === 'AVAILABLE' && (
                    <button
                      className="btn btn-primary fw-bold px-3 shadow-sm"
                      onClick={() => {
                        setSelectedCell(null);
                        navigate('/bookings/create');
                      }}
                    >
                      <i className="bi bi-calendar-plus me-1"></i> Book Room
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomCalendar;
