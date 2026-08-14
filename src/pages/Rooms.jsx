import React, { useEffect, useState } from 'react';
import { getRoomsApi, getRoomTypesApi, createRoomApi, updateRoomStatusApi, deleteRoomApi } from '../api/roomApi';
import StatusBadge from '../components/StatusBadge';
import RoomCalendar from '../components/RoomCalendar';
import PageLoader from '../components/PageLoader';
import { formatCurrency } from '../utils/formatCurrency';
import { useNotification } from '../context/NotificationContext';

const Rooms = () => {
  const { showConfirm, showError, showSuccess } = useNotification();
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'table', 'calendar'
  const [filterStatus, setFilterStatus] = useState('ALL');

  // New Room Modal state
  const [showModal, setShowModal] = useState(false);
  const [roomNumber, setRoomNumber] = useState('');
  const [roomTypeId, setRoomTypeId] = useState('');
  const [floor, setFloor] = useState('1st Floor');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rRes, rtRes] = await Promise.all([getRoomsApi(), getRoomTypesApi()]);
      setRooms(rRes);
      setRoomTypes(rtRes);
      if (rtRes.length > 0) setRoomTypeId(rtRes[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      await createRoomApi({
        room_number: roomNumber,
        room_type: roomTypeId,
        floor: floor,
        description: description,
      });
      setShowModal(false);
      setRoomNumber('');
      loadData();
    } catch (err) {
      alert(err.response?.data?.room_number?.[0] || 'Error creating room.');
    }
  };

  const handleStatusChange = async (roomId, newStatus) => {
    try {
      await updateRoomStatusApi(roomId, newStatus);
      loadData();
    } catch (err) {
      showError('Error updating room status.', 'Status Update Failed');
    }
  };

  const handleDeleteRoom = (room) => {
    showConfirm({
      title: 'Delete Room Record',
      message: `Are you sure you want to permanently DELETE Room ${room.room_number}? This action cannot be undone.`,
      confirmText: 'Yes, Delete Room',
      cancelText: 'Cancel',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await deleteRoomApi(room.id);
          showSuccess(`Room ${room.room_number} deleted successfully!`, 'Room Deleted');
          loadData();
        } catch (err) {
          showError('Cannot delete room with active stays or reservations.', 'Deletion Failed');
        }
      },
    });
  };

  const filteredRooms = rooms.filter((r) => {
    if (filterStatus === 'ALL') return true;
    return r.status === filterStatus;
  });

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold m-0 text-dark">Room Management</h4>
          <span className="text-muted small">Manage room status, floor layout, and availability</span>
        </div>
        <div className="d-flex gap-2">
          <div className="btn-group me-2" role="group">
            <button className={`btn btn-outline-secondary ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>
              <i className="bi bi-grid-fill me-1"></i> Grid
            </button>
            <button className={`btn btn-outline-secondary ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}>
              <i className="bi bi-table me-1"></i> Table
            </button>
            <button className={`btn btn-outline-secondary ${viewMode === 'calendar' ? 'active' : ''}`} onClick={() => setViewMode('calendar')}>
              <i className="bi bi-calendar-week me-1"></i> Calendar
            </button>
          </div>
          <button className="btn btn-primary fw-semibold shadow-sm" onClick={() => setShowModal(true)}>
            <i className="bi bi-plus-lg me-1"></i> Add Room
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      {viewMode !== 'calendar' && (
        <div className="d-flex gap-2 mb-4 overflow-auto pb-2">
          {['ALL', 'AVAILABLE', 'RESERVED', 'OCCUPIED', 'CLEANING', 'MAINTENANCE'].map((st) => (
            <button
              key={st}
              className={`btn btn-sm ${filterStatus === st ? 'btn-dark' : 'btn-light border'} fw-medium`}
              onClick={() => setFilterStatus(st)}
            >
              {st} ({st === 'ALL' ? rooms.length : rooms.filter((r) => r.status === st).length})
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <PageLoader fullScreen={false} message="Loading Room Inventory & Status Grid..." />
      ) : viewMode === 'calendar' ? (
        <RoomCalendar />
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="row g-3">
          {filteredRooms.map((room) => (
            <div key={room.id} className="col-xl-3 col-lg-4 col-md-6">
              <div className={`card room-card status-${room.status} h-100 shadow-sm`}>
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h4 className="fw-bold m-0 text-dark">Room {room.room_number}</h4>
                      <span className="text-muted small">{room.floor}</span>
                    </div>
                    <StatusBadge status={room.status} />
                  </div>

                  <div className="p-2 bg-light rounded my-3">
                    <div className="fw-semibold text-primary">{room.room_type_name}</div>
                    <div className="d-flex justify-content-between text-muted small mt-1">
                      <span>Rate: <strong className="text-dark">{formatCurrency(room.base_price)}</strong>/night</span>
                      <span>Cap: {room.max_adults}A + {room.max_children}C</span>
                    </div>
                  </div>

                  {/* Status Dropdown */}
                  <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                    <span className="text-muted small">Update Status:</span>
                    <select
                      className="form-select form-select-sm w-auto"
                      value={room.status}
                      onChange={(e) => handleStatusChange(room.id, e.target.value)}
                    >
                      <option value="AVAILABLE">AVAILABLE</option>
                      <option value="RESERVED">RESERVED</option>
                      <option value="OCCUPIED">OCCUPIED</option>
                      <option value="CLEANING">CLEANING</option>
                      <option value="MAINTENANCE">MAINTENANCE</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle m-0">
                <thead className="table-light">
                  <tr>
                    <th>Room #</th>
                    <th>Room Type</th>
                    <th>Floor</th>
                    <th>Base Rate</th>
                    <th>Capacity</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRooms.map((room) => (
                    <tr key={room.id}>
                      <td className="fw-bold fs-6">Room {room.room_number}</td>
                      <td>{room.room_type_name}</td>
                      <td>{room.floor}</td>
                      <td className="fw-bold">{formatCurrency(room.base_price)}</td>
                      <td>{room.max_adults} Adults, {room.max_children} Children</td>
                      <td><StatusBadge status={room.status} /></td>
                      <td>
                        <select
                          className="form-select form-select-sm w-auto"
                          value={room.status}
                          onChange={(e) => handleStatusChange(room.id, e.target.value)}
                        >
                          <option value="AVAILABLE">AVAILABLE</option>
                          <option value="RESERVED">RESERVED</option>
                          <option value="OCCUPIED">OCCUPIED</option>
                          <option value="CLEANING">CLEANING</option>
                          <option value="MAINTENANCE">MAINTENANCE</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Room Modal */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title"><i className="bi bi-door-open me-2"></i>Add New Room</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleCreateRoom}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Room Number *</label>
                    <input type="text" className="form-control" required value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} placeholder="e.g. 104 or 205" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Room Type *</label>
                    <select className="form-select" required value={roomTypeId} onChange={(e) => setRoomTypeId(e.target.value)}>
                      {roomTypes.map((rt) => (
                        <option key={rt.id} value={rt.id}>
                          {rt.name} (₹{rt.base_price}/night)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Floor</label>
                    <input type="text" className="form-control" value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="e.g. 1st Floor" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Description</label>
                    <textarea className="form-control" rows="2" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional room description"></textarea>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary"><i className="bi bi-check-circle me-1"></i> Save Room</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rooms;
