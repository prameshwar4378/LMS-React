import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNotification } from '../context/NotificationContext';
import {
  getRoomDeletionRequestsApi,
  approveRoomDeletionRequestApi,
  rejectRoomDeletionRequestApi,
} from '../api/roomApi';
import { formatCurrency } from '../utils/formatCurrency';
import {
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  User,
  ShieldCheck,
  FileText
} from 'lucide-react';

const RoomDeletionRequestsModal = ({ show, onClose, onActionSuccess }) => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();

  const [activeTab, setActiveTab] = useState('PENDING'); // 'PENDING', 'APPROVED', 'REJECTED', 'ALL'
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const {
    data: requests = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['roomDeletionRequests'],
    queryFn: () => getRoomDeletionRequestsApi(),
    enabled: Boolean(show),
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (show) {
      refetch();
      setRejectingId(null);
      setRejectNotes('');
    }
  }, [show, refetch]);

  if (!show) return null;

  const filteredRequests = requests.filter((req) => {
    if (activeTab === 'ALL') return true;
    return req.status === activeTab;
  });

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  // Handle Approve & Delete
  const handleApprove = async (req) => {
    setProcessingId(req.id);
    try {
      const res = await approveRoomDeletionRequestApi(req.id, { notes: 'Approved by Hotel Owner' });
      showSuccess(res.message || `Room ${req.room_number} deletion approved and removed.`, 'Room Deleted');
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['roomDeletionRequests'] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      if (onActionSuccess) onActionSuccess({ type: 'approve', requestId: req.id });
    } catch (err) {
      console.error('Failed to approve room deletion:', err);
      const msg = err.response?.data?.message || err.response?.data?.detail || 'Failed to approve room deletion.';
      showError(msg, 'Approval Error');
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Reject
  const handleRejectSubmit = async (reqId) => {
    setProcessingId(reqId);
    try {
      const res = await rejectRoomDeletionRequestApi(reqId, { notes: rejectNotes.trim() || 'Rejected by Hotel Owner' });
      showSuccess(res.message || 'Room deletion request rejected.', 'Request Rejected');
      setRejectingId(null);
      setRejectNotes('');
      queryClient.invalidateQueries({ queryKey: ['roomDeletionRequests'] });
      if (onActionSuccess) onActionSuccess({ type: 'reject', requestId: reqId });
    } catch (err) {
      console.error('Failed to reject room deletion request:', err);
      const msg = err.response?.data?.message || err.response?.data?.detail || 'Failed to reject request.';
      showError(msg, 'Rejection Error');
    } finally {
      setProcessingId(null);
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
        className="modal-dialog modal-dialog-centered modal-dialog-animated modal-lg"
        style={{ maxWidth: '780px', width: '95%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden bg-white">
          {/* Header */}
          <div className="modal-header border-bottom py-3 px-4 bg-light d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center bg-warning-subtle text-warning-emphasis"
                style={{ width: '42px', height: '42px' }}
              >
                <ShieldCheck size={22} />
              </div>
              <div>
                <h5 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
                  <span>Room Deletion Approval Requests</span>
                  {pendingCount > 0 && (
                    <span className="badge bg-danger rounded-pill px-2 py-0.5 extra-small">
                      {pendingCount} Pending
                    </span>
                  )}
                </h5>
                <span className="text-muted extra-small">
                  Review room deletion requests submitted by Managers &amp; Receptionists.
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn-close shadow-none"
              onClick={onClose}
              disabled={Boolean(processingId)}
              aria-label="Close"
            ></button>
          </div>

          {/* Filter Tabs */}
          <div className="px-4 pt-3 pb-2 bg-white border-bottom d-flex gap-2">
            {[
              { key: 'PENDING', label: `Pending (${pendingCount})`, variant: 'danger' },
              { key: 'APPROVED', label: 'Approved', variant: 'success' },
              { key: 'REJECTED', label: 'Rejected', variant: 'secondary' },
              { key: 'ALL', label: `All (${requests.length})`, variant: 'dark' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`btn btn-sm ${
                  activeTab === tab.key ? 'btn-dark fw-bold' : 'btn-light border text-muted'
                } rounded-pill px-3`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="modal-body p-4" style={{ maxHeight: '68vh', overflowY: 'auto' }}>
            {isLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary spinner-border-sm mb-2" role="status"></div>
                <div className="text-muted small">Loading room deletion requests...</div>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-5">
                <CheckCircle2 size={42} className="text-success mb-2 opacity-75" />
                <h6 className="fw-bold text-dark">No {activeTab.toLowerCase()} requests</h6>
                <p className="text-muted extra-small m-0">
                  {activeTab === 'PENDING'
                    ? 'All room deletion requests have been reviewed.'
                    : `There are no requests matching the "${activeTab}" filter.`}
                </p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {filteredRequests.map((req) => {
                  const summary = req.activity_summary || {};
                  const hasInHouse = Boolean(summary.active_stays_count > 0);
                  const isProcessing = processingId === req.id;

                  return (
                    <div
                      key={req.id}
                      className={`card border rounded-3 overflow-hidden shadow-2xs ${
                        req.status === 'PENDING'
                          ? 'border-warning-subtle'
                          : req.status === 'APPROVED'
                          ? 'border-success-subtle bg-light-subtle'
                          : 'border-secondary-subtle bg-light-subtle'
                      }`}
                    >
                      {/* Card Header */}
                      <div className="card-header bg-white py-2.5 px-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-bold fs-6 text-dark">
                            Room {req.room_number}
                          </span>
                          <span className="badge bg-secondary-subtle text-dark border extra-small">
                            {req.room_type_name || 'Standard'}
                          </span>
                          <span className="text-muted extra-small">
                            &bull; {req.floor || 'Ground Floor'}
                          </span>
                        </div>

                        <div>
                          <span
                            className={`badge rounded-pill extra-small px-2.5 py-1 ${
                              req.status === 'PENDING'
                                ? 'bg-warning-subtle text-warning-emphasis border border-warning-subtle fw-bold'
                                : req.status === 'APPROVED'
                                ? 'bg-success-subtle text-success border border-success-subtle'
                                : 'bg-secondary-subtle text-muted border'
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="card-body p-3">
                        {/* Requester & Timestamp Info */}
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2.5 text-muted extra-small">
                          <span className="d-flex align-items-center gap-1.5">
                            <User size={14} className="text-secondary" />
                            <span>
                              Requested by: <strong className="text-dark">{req.requested_by_name}</strong>{' '}
                              <span className="badge bg-light text-secondary border extra-small">
                                {req.requested_by_role || 'STAFF'}
                              </span>
                            </span>
                          </span>

                          <span className="d-flex align-items-center gap-1 text-muted">
                            <Clock size={13} />
                            <span>{new Date(req.created_at).toLocaleString()}</span>
                          </span>
                        </div>

                        {/* Reason Callout */}
                        <div className="p-2.5 rounded-3 bg-light border border-secondary-subtle mb-3">
                          <div className="d-flex align-items-start gap-2">
                            <FileText size={15} className="text-primary mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="fw-bold text-dark extra-small d-block mb-0.5">Staff Reason:</span>
                              <p className="m-0 text-dark extra-small fst-italic">
                                "{req.reason || 'No specific reason provided'}"
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Connected Activity Snapshot */}
                        <div className="row g-2 mb-3">
                          <div className="col-6 col-sm-3">
                            <div
                              className={`p-2 rounded-2 border text-center ${
                                hasInHouse ? 'bg-danger-subtle border-danger-subtle' : 'bg-white'
                              }`}
                            >
                              <span className="text-muted extra-small d-block">Current Stays</span>
                              <strong className={`small ${hasInHouse ? 'text-danger' : 'text-dark'}`}>
                                {summary.active_stays_count || 0} In-House
                              </strong>
                            </div>
                          </div>

                          <div className="col-6 col-sm-3">
                            <div className="p-2 rounded-2 border bg-white text-center">
                              <span className="text-muted extra-small d-block">Upcoming Bookings</span>
                              <strong className="small text-primary">
                                {summary.upcoming_bookings_count || 0} Booked
                              </strong>
                            </div>
                          </div>

                          <div className="col-6 col-sm-3">
                            <div className="p-2 rounded-2 border bg-white text-center">
                              <span className="text-muted extra-small d-block">Historical Stays</span>
                              <strong className="small text-dark">
                                {summary.past_stays_count || 0} Stays
                              </strong>
                            </div>
                          </div>

                          <div className="col-6 col-sm-3">
                            <div className="p-2 rounded-2 border bg-white text-center">
                              <span className="text-muted extra-small d-block">Lifetime Revenue</span>
                              <strong className="small text-success font-monospace">
                                {formatCurrency(summary.total_revenue || 0)}
                              </strong>
                            </div>
                          </div>
                        </div>

                        {/* In-House Warning */}
                        {hasInHouse && req.status === 'PENDING' && (
                          <div className="alert alert-danger py-2 px-3 extra-small rounded-2 d-flex align-items-center gap-2 mb-3">
                            <AlertTriangle size={16} className="text-danger flex-shrink-0" />
                            <span>
                              <strong>Warning:</strong> A guest is currently checked in this room. Please checkout the guest before approving deletion.
                            </span>
                          </div>
                        )}

                        {/* Review Notes if Reviewed */}
                        {req.status !== 'PENDING' && req.review_notes && (
                          <div className="text-muted extra-small border-top pt-2">
                            <span>
                              Reviewed by <strong>{req.reviewed_by_name || 'Owner'}</strong> on{' '}
                              {req.reviewed_at ? new Date(req.reviewed_at).toLocaleDateString() : 'N/A'}:{' '}
                              <em>"{req.review_notes}"</em>
                            </span>
                          </div>
                        )}

                        {/* Action Buttons for PENDING */}
                        {req.status === 'PENDING' && (
                          <>
                            {rejectingId === req.id ? (
                              <div className="border-top pt-3 mt-2">
                                <label className="form-label extra-small fw-bold text-dark mb-1">
                                  Rejection Reason / Notes (Optional)
                                </label>
                                <input
                                  type="text"
                                  className="form-control form-control-sm mb-2"
                                  placeholder="e.g. Room needed for peak season, request denied..."
                                  value={rejectNotes}
                                  onChange={(e) => setRejectNotes(e.target.value)}
                                  disabled={isProcessing}
                                />
                                <div className="d-flex justify-content-end gap-2">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-light border extra-small"
                                    onClick={() => {
                                      setRejectingId(null);
                                      setRejectNotes('');
                                    }}
                                    disabled={isProcessing}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-danger extra-small fw-bold"
                                    onClick={() => handleRejectSubmit(req.id)}
                                    disabled={isProcessing}
                                  >
                                    {isProcessing ? 'Rejecting...' : 'Confirm Rejection'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="d-flex justify-content-end align-items-center gap-2 border-top pt-2.5 mt-2">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-secondary extra-small px-3"
                                  onClick={() => {
                                    setRejectingId(req.id);
                                    setRejectNotes('');
                                  }}
                                  disabled={isProcessing}
                                >
                                  <XCircle size={14} className="me-1 inline" />
                                  Reject Request
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-danger extra-small fw-bold px-3 d-inline-flex align-items-center gap-1.5 shadow-2xs"
                                  onClick={() => handleApprove(req)}
                                  disabled={isProcessing || hasInHouse}
                                  title={hasInHouse ? 'Cannot delete while guest is checked in' : 'Approve & Delete Room'}
                                >
                                  {isProcessing ? (
                                    <span className="spinner-border spinner-border-sm" role="status"></span>
                                  ) : (
                                    <Trash2 size={14} />
                                  )}
                                  <span>Approve &amp; Delete Room</span>
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer bg-light py-2 px-4 border-top d-flex justify-content-end">
            <button
              type="button"
              className="btn btn-sm btn-secondary px-4 fw-semibold"
              onClick={onClose}
              disabled={Boolean(processingId)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDeletionRequestsModal;
