import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { getRoomActivityApi, deleteRoomApi, requestRoomDeletionApi } from '../api/roomApi';
import { formatCurrency } from '../utils/formatCurrency';
import {
  Trash2,
  AlertTriangle,
  Clock,
  Send,
  ShieldAlert,
  X
} from 'lucide-react';

const RoomDeleteModal = ({ show, room, onClose, onSuccess }) => {
  const { isHotelOwner, isSuperUser, user } = useAuth();
  const { showSuccess, showError } = useNotification();

  const isOwner = Boolean(isSuperUser || isHotelOwner);

  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (show && room?.id) {
      setLoading(true);
      setErrorMsg('');
      setReason('');
      getRoomActivityApi(room.id)
        .then((data) => {
          setActivity(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to load room activity:', err);
          setErrorMsg('Failed to load room activity details.');
          setLoading(false);
        });
    } else {
      setActivity(null);
      setReason('');
      setErrorMsg('');
    }
  }, [show, room?.id]);

  if (!show || !room) return null;

  const hasInHouseGuest = Boolean(activity?.has_in_house);
  const pendingRequest = activity?.pending_deletion_request;

  // Handle Direct Deletion (Owner Only)
  const handleDirectDelete = async () => {
    if (hasInHouseGuest) {
      showError(`Cannot delete Room ${room.room_number} while a guest is currently checked in.`, 'Active Guest In-House');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      await deleteRoomApi(room.id);
      showSuccess(`Room ${room.room_number} deleted successfully from inventory!`, 'Room Deleted');
      if (onSuccess) onSuccess({ type: 'delete', roomId: room.id });
      onClose();
    } catch (err) {
      console.error('Failed to delete room:', err);
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Failed to delete room record.';
      setErrorMsg(msg);
      showError(msg, 'Deletion Blocked');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Deletion Request (Manager / Receptionist / Staff)
  const handleSendRequest = async () => {
    if (!reason.trim()) {
      setErrorMsg('Please enter a brief reason for requesting room deletion.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await requestRoomDeletionApi(room.id, { reason: reason.trim() });
      showSuccess(res.message || `Deletion request for Room ${room.room_number} submitted to Owner.`, 'Request Submitted');
      if (onSuccess) onSuccess({ type: 'request', roomId: room.id });
      onClose();
    } catch (err) {
      console.error('Failed to submit deletion request:', err);
      const msg = err.response?.data?.message || err.response?.data?.detail || 'Failed to submit room deletion request.';
      setErrorMsg(msg);
      showError(msg, 'Submission Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal fade show d-block modal-backdrop-animated"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1200 }}
      tabIndex="-1"
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-dialog-centered modal-dialog-animated"
        style={{ maxWidth: '580px', width: '100%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content border-0 shadow-xl rounded-4 overflow-hidden bg-white">
          {/* Header */}
          <div className="modal-header border-bottom py-3 px-4 bg-light d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2.5">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center bg-danger-subtle text-danger"
                style={{ width: '38px', height: '38px' }}
              >
                <Trash2 size={20} />
              </div>
              <div>
                <h5 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
                  <span>Delete Room {room.room_number}</span>
                  <span className={`badge rounded-pill extra-small px-2 py-0.5 ${
                    room.status === 'AVAILABLE' ? 'bg-success-subtle text-success border border-success-subtle' :
                    room.status === 'OCCUPIED' ? 'bg-danger-subtle text-danger border border-danger-subtle' :
                    room.status === 'RESERVED' ? 'bg-primary-subtle text-primary border border-primary-subtle' :
                    'bg-warning-subtle text-dark border border-warning-subtle'
                  }`}>
                    {room.status}
                  </span>
                </h5>
                <span className="text-muted extra-small">
                  {room.room_type_name || room.room_type?.name} &bull; {room.floor || 'Ground Floor'}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn-close shadow-none"
              onClick={onClose}
              disabled={submitting}
              aria-label="Close"
            ></button>
          </div>

          {/* Body */}
          <div className="modal-body p-4">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary spinner-border-sm mb-2" role="status"></div>
                <div className="text-muted small">Checking connected room activity & history...</div>
              </div>
            ) : (
              <>
                {/* Active In-House Warning Alert */}
                {hasInHouseGuest && (
                  <div className="alert alert-danger border-danger-subtle rounded-3 p-3 mb-3 d-flex gap-2.5">
                    <AlertTriangle size={20} className="text-danger flex-shrink-0 mt-0.5" />
                    <div className="extra-small">
                      <strong className="d-block text-danger fs-6 mb-0.5">Active In-House Guest Detected!</strong>
                      <span>
                        Room {room.room_number} is currently checked in. Deleting this room is locked to prevent orphaned folios and guest data loss. Please checkout or transfer the guest before deleting.
                      </span>
                    </div>
                  </div>
                )}

                {/* Already Pending Request Notice */}
                {pendingRequest && (
                  <div className="alert alert-warning border-warning-subtle rounded-3 p-3 mb-3 d-flex gap-2.5">
                    <Clock size={20} className="text-warning-emphasis flex-shrink-0 mt-0.5" />
                    <div className="extra-small">
                      <strong className="d-block text-dark fw-bold mb-0.5">Deletion Request Already Pending</strong>
                      <span>
                        A deletion request for Room {room.room_number} was submitted by{' '}
                        <strong>{pendingRequest.requested_by} ({pendingRequest.requested_by_role})</strong>.
                        {pendingRequest.reason && <> Reason: <em>"{pendingRequest.reason}"</em>.</>}
                        {' '}Awaiting Owner review.
                      </span>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {errorMsg && (
                  <div className="alert alert-danger py-2 px-3 extra-small mb-3 rounded-3">
                    {errorMsg}
                  </div>
                )}

                {/* Activity Breakdown Cards */}
                <h6 className="fw-bold text-dark mb-2 extra-small text-uppercase tracking-wider text-muted">
                  Connected Activity &amp; History Overview
                </h6>

                <div className="row g-2 mb-3">
                  {/* Active In-House Stays */}
                  <div className="col-sm-6">
                    <div className={`p-2.5 rounded-3 border h-100 ${
                      hasInHouseGuest ? 'bg-danger-subtle border-danger-subtle' : 'bg-light border-secondary-subtle'
                    }`}>
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <span className="text-muted extra-small fw-semibold">Current Stays</span>
                        <span className={`badge rounded-pill ${
                          hasInHouseGuest ? 'bg-danger text-white' : 'bg-success-subtle text-success border'
                        }`}>
                          {activity?.active_stays_count || 0} In-House
                        </span>
                      </div>
                      {activity?.active_stays && activity.active_stays.length > 0 ? (
                        <div className="extra-small">
                          {activity.active_stays.map((s) => (
                            <div key={s.id} className="text-dark fw-semibold text-truncate">
                              &bull; {s.customer_name} ({s.status})
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-muted extra-small">No current guests in room</div>
                      )}
                    </div>
                  </div>

                  {/* Upcoming Bookings */}
                  <div className="col-sm-6">
                    <div className="p-2.5 rounded-3 border bg-light border-secondary-subtle h-100">
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <span className="text-muted extra-small fw-semibold">Upcoming Bookings</span>
                        <span className="badge bg-primary-subtle text-primary border rounded-pill">
                          {activity?.upcoming_bookings_count || 0} Scheduled
                        </span>
                      </div>
                      {activity?.upcoming_bookings && activity.upcoming_bookings.length > 0 ? (
                        <div className="extra-small">
                          {activity.upcoming_bookings.map((b) => (
                            <div key={b.id} className="text-dark text-truncate">
                              &bull; {b.customer_name} ({b.check_in_date})
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-muted extra-small">No future bookings scheduled</div>
                      )}
                    </div>
                  </div>

                  {/* Past Completed Stays */}
                  <div className="col-sm-6">
                    <div className="p-2.5 rounded-3 border bg-light border-secondary-subtle">
                      <span className="text-muted extra-small fw-semibold d-block">Historical Stays</span>
                      <strong className="fs-6 text-dark d-block">
                        {activity?.past_stays_count || 0}{' '}
                        <span className="text-muted small fw-normal">completed stay(s)</span>
                      </strong>
                    </div>
                  </div>

                  {/* Lifetime Revenue */}
                  <div className="col-sm-6">
                    <div className="p-2.5 rounded-3 border bg-light border-secondary-subtle">
                      <span className="text-muted extra-small fw-semibold d-block">Lifetime Revenue</span>
                      <strong className="fs-6 text-success font-monospace d-block">
                        {formatCurrency(activity?.total_revenue || 0)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Action Section based on User Role */}
                {isOwner ? (
                  /* HOTEL OWNER FLOW: Direct Delete */
                  <div className="p-3 bg-light rounded-3 border border-secondary-subtle">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <ShieldAlert size={16} className="text-danger" />
                      <span className="fw-bold text-dark small">Owner Authorization (Direct Deletion)</span>
                    </div>
                    <p className="text-muted extra-small m-0 mb-3">
                      As the Hotel Owner, you can permanently delete Room {room.room_number}. Once deleted, the room is removed from your active quota and cannot be recovered.
                    </p>

                    <div className="d-flex justify-content-end gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-light border px-3"
                        onClick={onClose}
                        disabled={submitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger px-3 fw-bold d-inline-flex align-items-center gap-1.5 shadow-sm"
                        disabled={submitting || hasInHouseGuest}
                        onClick={handleDirectDelete}
                        title={hasInHouseGuest ? 'Cannot delete occupied room' : 'Permanently Delete Room'}
                      >
                        {submitting ? (
                          <span className="spinner-border spinner-border-sm" role="status"></span>
                        ) : (
                          <Trash2 size={14} />
                        )}
                        <span>Permanently Delete Room</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* MANAGER / RECEPTIONIST FLOW: Request Deletion from Owner */
                  <div className="p-3 bg-light rounded-3 border border-secondary-subtle">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <Send size={16} className="text-primary" />
                      <span className="fw-bold text-dark small">
                        Owner Approval Required ({user?.role || 'Staff'})
                      </span>
                    </div>
                    <p className="text-muted extra-small mb-2.5">
                      Staff members cannot delete room inventory directly. Please submit a deletion request with your reason. The Hotel Owner will review connected activity and authorize the deletion.
                    </p>

                    <div className="mb-3">
                      <label className="form-label extra-small fw-bold text-dark mb-1">
                        Reason for Deletion Request <span className="text-danger">*</span>
                      </label>
                      <textarea
                        className="form-control form-control-sm"
                        rows="2"
                        placeholder="e.g., Room converted to storage, major renovation, merging into suite..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        disabled={submitting || Boolean(pendingRequest)}
                      ></textarea>
                    </div>

                    <div className="d-flex justify-content-end gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-light border px-3"
                        onClick={onClose}
                        disabled={submitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary px-3 fw-bold d-inline-flex align-items-center gap-1.5 shadow-sm"
                        disabled={submitting || Boolean(pendingRequest) || !reason.trim()}
                        onClick={handleSendRequest}
                      >
                        {submitting ? (
                          <span className="spinner-border spinner-border-sm" role="status"></span>
                        ) : (
                          <Send size={14} />
                        )}
                        <span>Send Request to Owner</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDeleteModal;
