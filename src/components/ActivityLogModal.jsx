import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getActivityLogsApi } from '../api/activityLogApi';
import {
  History,
  Search,
  RefreshCw,
  X,
  ArrowRight,
  User,
  Clock,
  CalendarDays,
  KeyRound,
  CreditCard,
  DoorOpen,
  BedDouble,
  Trash2,
  Users,
  DollarSign,
  Building2,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Sparkles,
  Plus,
  Edit3,
  Download,
  Loader2
} from 'lucide-react';
import { exportActivityLogsToPDF } from '../utils/exportUtils';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const ActivityLogModal = ({ show, onClose }) => {
  const { selectedProperty } = useAuth();
  const { showSuccess, showError, showWarning } = useNotification();

  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [modelFilter, setModelFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Expand / Collapse State (Set of item IDs that are expanded)
  const [expandedIds, setExpandedIds] = useState(new Set());

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset page on filter changes
  const handleModelChange = (model) => {
    setModelFilter(model);
    setPage(1);
  };

  const handleActionChange = (action) => {
    setActionFilter(action);
    setPage(1);
  };

  const {
    data = { results: [], count: 0, total_pages: 1 },
    isLoading,
    isFetching,
    refetch
  } = useQuery({
    queryKey: ['activity-logs', modelFilter, actionFilter, debouncedSearch, page],
    queryFn: () => getActivityLogsApi({
      page,
      page_size: pageSize,
      model: modelFilter,
      action: actionFilter,
      search: debouncedSearch,
      days: 15,
    }),
    enabled: Boolean(show),
    staleTime: 10 * 1000,
  });

  const logs = data.results || [];
  const totalCount = data.count || 0;
  const totalPages = data.total_pages || 1;

  // Auto-expand updated items by default when page changes
  useEffect(() => {
    if (logs.length > 0) {
      // Default: Expand first 5 updated items so user immediately sees rich diffs
      const initialExpanded = new Set();
      logs.slice(0, 5).forEach((l) => {
        if (l.action === 'UPDATED') initialExpanded.add(l.id);
      });
      setExpandedIds(initialExpanded);
    }
  }, [logs]);

  if (!show) return null;

  // Toggle single item
  const toggleItem = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Toggle all items on current page
  const allCurrentExpanded = logs.length > 0 && logs.every((l) => expandedIds.has(l.id));
  const handleToggleAll = () => {
    if (allCurrentExpanded) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(logs.map((l) => l.id)));
    }
  };

  // Download all activity logs matching filters to PDF
  const handleDownloadPDF = async () => {
    try {
      setIsExporting(true);
      const response = await getActivityLogsApi({
        page: 1,
        page_size: 1000,
        model: modelFilter,
        action: actionFilter,
        search: debouncedSearch,
        days: 15,
      });

      const allLogs = response?.results || [];
      if (allLogs.length === 0) {
        if (showWarning) {
          showWarning('No activity logs found to export for the selected criteria.');
        } else {
          alert('No activity logs found to export for the selected criteria.');
        }
        return;
      }

      const filterInfo = {
        action: actionFilter,
        entity: modelFilter,
        search: debouncedSearch,
      };

      exportActivityLogsToPDF(allLogs, filterInfo, selectedProperty);
      if (showSuccess) {
        showSuccess(`Successfully generated PDF for ${allLogs.length} activity records.`);
      }
    } catch (err) {
      console.error('Failed to export activity logs to PDF:', err);
      if (showError) {
        showError('Failed to generate PDF. Please try again.');
      } else {
        alert('Failed to generate PDF. Please try again.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Render Icon according to model
  const renderModelIcon = (iconName) => {
    const props = { size: 15, className: 'flex-shrink-0' };
    switch (iconName) {
      case 'CalendarDays': return <CalendarDays {...props} className="text-primary" />;
      case 'KeyRound': return <KeyRound {...props} className="text-success" />;
      case 'CreditCard': return <CreditCard {...props} className="text-info" />;
      case 'DoorOpen': return <DoorOpen {...props} className="text-warning" />;
      case 'BedDouble': return <BedDouble {...props} className="text-secondary" />;
      case 'Trash2': return <Trash2 {...props} className="text-danger" />;
      case 'Users': return <Users {...props} className="text-purple" />;
      case 'DollarSign': return <DollarSign {...props} className="text-success" />;
      case 'Building2': return <Building2 {...props} className="text-secondary" />;
      case 'Clock': return <Clock {...props} className="text-primary" />;
      default: return <History {...props} className="text-muted" />;
    }
  };

  return (
    <div
      className="modal fade show d-block modal-backdrop-animated"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', zIndex: 1250 }}
      tabIndex="-1"
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-dialog-centered modal-dialog-animated modal-xl m-2 m-sm-auto"
        style={{ maxWidth: '1180px', width: '96%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden bg-white">
          {/* Header */}
          <div className="modal-header border-bottom py-2.5 px-3 px-md-4 bg-light d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2.5">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center bg-primary text-white shadow-sm flex-shrink-0"
                style={{ width: '40px', height: '40px' }}
              >
                <History size={20} />
              </div>
              <div>
                <div className="d-flex align-items-center gap-1.5 gap-md-2 flex-wrap">
                  <h5 className="fw-bold text-dark m-0 fs-6 fs-md-5" style={{ letterSpacing: '-0.01em' }}>
                    System Activity &amp; Audit Log
                  </h5>
                  <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill extra-small px-2 py-0.5 fw-bold">
                    Manager &amp; Owner Only
                  </span>
                  <span className="badge bg-secondary-subtle text-secondary border rounded-pill extra-small px-2 py-0.5 d-none d-sm-inline-block">
                    15 Days Retention
                  </span>
                </div>
                <span className="text-muted extra-small d-none d-sm-block">
                  Interactive timeline tracking who made modifications, exact timestamps, and previous vs updated values.
                </span>
              </div>
            </div>

            <div className="d-flex align-items-center gap-1.5 gap-md-2 flex-wrap ms-auto">
              {/* Download All Activity PDF Button */}
              <button
                type="button"
                className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1.5 extra-small fw-semibold shadow-2xs text-white"
                onClick={handleDownloadPDF}
                disabled={isExporting}
                title="Download All Activity Logs to PDF"
              >
                {isExporting ? (
                  <>
                    <Loader2 size={13} className="spin-animation" />
                    <span className="d-none d-sm-inline">Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download size={13} />
                    <span className="d-none d-sm-inline">Download PDF</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn btn-sm btn-white border d-inline-flex align-items-center gap-1.5 extra-small fw-semibold text-dark shadow-2xs"
                onClick={handleToggleAll}
                title={allCurrentExpanded ? 'Collapse All Details' : 'Expand All Details'}
              >
                {allCurrentExpanded ? (
                  <>
                    <Minimize2 size={13} className="text-secondary" />
                    <span className="d-none d-sm-inline">Collapse All</span>
                  </>
                ) : (
                  <>
                    <Maximize2 size={13} className="text-primary" />
                    <span className="d-none d-sm-inline">Expand All</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn btn-sm btn-white border d-inline-flex align-items-center gap-1.5 extra-small fw-semibold text-dark shadow-2xs"
                onClick={() => refetch()}
                disabled={isFetching}
                title="Refresh Activity Log"
              >
                <RefreshCw size={13} className={isFetching ? 'spin-animation text-primary' : 'text-secondary'} />
                <span className="d-none d-sm-inline">{isFetching ? 'Refreshing...' : 'Refresh'}</span>
              </button>

              <button
                type="button"
                className="btn-close shadow-none"
                onClick={onClose}
                aria-label="Close"
              ></button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="px-3 px-md-4 py-2.5 bg-white border-bottom">
            <div className="row g-2 align-items-center">
              {/* Search Box */}
              <div className="col-12 col-md-4">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-light border-end-0 text-muted">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 ps-0 extra-small"
                    placeholder="Search by user, room, guest, or ID..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                  {searchInput && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary border-start-0 extra-small"
                      onClick={() => setSearchInput('')}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Action Filter Pills */}
              <div className="col-12 col-md-4">
                <div className="btn-group btn-group-sm w-100" role="group">
                  {[
                    { id: 'ALL', label: 'All Actions' },
                    { id: 'CREATED', label: '+ Created' },
                    { id: 'UPDATED', label: '~ Updated' },
                    { id: 'DELETED', label: '- Deleted' },
                  ].map((act) => (
                    <button
                      key={act.id}
                      type="button"
                      className={`btn extra-small fw-semibold px-1 px-sm-2 ${
                        actionFilter === act.id ? 'btn-dark' : 'btn-outline-secondary'
                      }`}
                      onClick={() => handleActionChange(act.id)}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Entity / Model Selector */}
              <div className="col-12 col-md-4">
                <div className="d-flex align-items-center gap-1.5">
                  <span className="text-muted extra-small fw-semibold flex-shrink-0">Entity:</span>
                  <select
                    className="form-select form-select-sm extra-small fw-semibold"
                    value={modelFilter}
                    onChange={(e) => handleModelChange(e.target.value)}
                  >
                    <option value="ALL">All Entities (Full Lodge Audit)</option>
                    <option value="Booking">Bookings / Reservations</option>
                    <option value="Stay">Stays / Check-Ins</option>
                    <option value="Payment">Payments &amp; Billing</option>
                    <option value="ExtraCharge">Folio Extra Charges</option>
                    <option value="Room">Rooms Inventory</option>
                    <option value="RoomType">Room Categories</option>
                    <option value="Customer">Guests / Customers</option>
                    <option value="Shift">Shifts &amp; Till Sessions</option>
                    <option value="CashDrawer">Cash Registers</option>
                    <option value="RoomDeletionRequest">Room Deletion Requests</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Body: Connected Timeline Activity Feed */}
          <div
            className="modal-body p-2 p-sm-3 p-md-4 bg-light-subtle position-relative"
            style={{ maxHeight: '64vh', overflowY: 'auto' }}
          >
            {isLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary spinner-border-sm mb-2" role="status"></div>
                <div className="text-muted small">Loading activity audit trail...</div>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-5 bg-white rounded-3 border p-4 shadow-2xs">
                <AlertCircle size={44} className="text-muted mb-2 opacity-50" />
                <h6 className="fw-bold text-dark mb-1">No Activity Records Found</h6>
                <p className="text-muted extra-small m-0">
                  {debouncedSearch || modelFilter !== 'ALL' || actionFilter !== 'ALL'
                    ? 'No activities match the current filter or search criteria.'
                    : 'No recorded activity found within the 15-day retention window.'}
                </p>
              </div>
            ) : (
              /* Continuous Timeline Container with Left Spine & Connected Horizontal Branches */
              <div className="activity-timeline-container position-relative ps-0 ps-md-1 pe-1 pe-md-2">
                {/* Desktop Continuous Vertical Spine (Visible md and above) */}
                <div
                  className="position-absolute d-none d-md-block"
                  style={{
                    top: '20px',
                    bottom: '20px',
                    left: '144px',
                    width: '3px',
                    background: 'linear-gradient(180deg, #3B82F6 0%, #94A3B8 50%, #CBD5E1 100%)',
                    borderRadius: '4px',
                    zIndex: 1,
                  }}
                ></div>

                {/* Mobile Continuous Vertical Spine (Visible on mobile screens) */}
                <div
                  className="position-absolute d-block d-md-none"
                  style={{
                    top: '16px',
                    bottom: '16px',
                    left: '14px',
                    width: '3px',
                    background: 'linear-gradient(180deg, #3B82F6 0%, #94A3B8 50%, #CBD5E1 100%)',
                    borderRadius: '4px',
                    zIndex: 1,
                  }}
                ></div>

                <div className="d-flex flex-column gap-3">
                  {logs.map((item, index) => {
                    const isUpdated = item.action === 'UPDATED';
                    const isCreated = item.action === 'CREATED';
                    const isDeleted = item.action === 'DELETED';
                    const isExpanded = expandedIds.has(item.id);

                    // Theme color based on action
                    const themeColor = isCreated ? '#10B981' : isDeleted ? '#EF4444' : '#3B82F6';
                    const themeBg = isCreated ? 'rgba(16, 185, 129, 0.08)' : isDeleted ? 'rgba(239, 68, 68, 0.08)' : 'rgba(59, 130, 246, 0.08)';

                    return (
                      <div
                        key={item.id}
                        className="activity-timeline-row position-relative d-flex align-items-start gap-0"
                      >
                        {/* ========================================================= */}
                        {/* 1. LEFT TIME RAIL (Width: 130px, Desktop Only)            */}
                        {/* ========================================================= */}
                        <div
                          className="flex-shrink-0 text-end pe-3 pt-1 d-none d-md-block"
                          style={{ width: '130px' }}
                        >
                          <span
                            className="badge bg-dark-subtle text-dark border extra-small px-2 py-0.5 fw-bold d-inline-block text-truncate"
                            title={new Date(item.timestamp).toLocaleString()}
                          >
                            {item.time_ago}
                          </span>
                          <div className="extra-small text-muted fw-semibold mt-0.5" style={{ fontSize: '0.7rem' }}>
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-secondary opacity-75" style={{ fontSize: '0.675rem' }}>
                            {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </div>
                        </div>

                        {/* ========================================================= */}
                        {/* 2. CENTER VERTICAL NODE (On the vertical line)            */}
                        {/* ========================================================= */}
                        <div
                          className="flex-shrink-0 position-relative d-flex align-items-center justify-content-center"
                          style={{ width: '30px', height: '30px', zIndex: 2, marginTop: '2px' }}
                        >
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                            style={{
                              width: '28px',
                              height: '28px',
                              backgroundColor: '#FFFFFF',
                              border: `2.5px solid ${themeColor}`,
                              color: themeColor,
                              transition: 'transform 0.2s ease',
                            }}
                            title={`${item.action_display} by ${item.user?.full_name || item.user?.username || 'Staff'}`}
                          >
                            {isCreated ? (
                              <Plus size={14} strokeWidth={3} />
                            ) : isDeleted ? (
                              <Trash2 size={12} strokeWidth={2.5} />
                            ) : (
                              <Edit3 size={12} strokeWidth={2.5} />
                            )}
                          </div>
                        </div>

                        {/* ========================================================= */}
                        {/* 3. CREATIVE HORIZONTAL CONNECTOR WITH INLINE INFO         */}
                        {/* ========================================================= */}
                        <div
                          className="flex-shrink-0 position-relative d-none d-md-flex align-items-center justify-content-center"
                          style={{
                            width: '56px',
                            height: '32px',
                            marginTop: '2px',
                            zIndex: 2,
                          }}
                        >
                          {/* Horizontal connecting line */}
                          <div
                            style={{
                              width: '100%',
                              height: '2px',
                              backgroundColor: themeColor,
                              opacity: 0.75,
                            }}
                          ></div>

                          {/* Arrow pointing directly into the card */}
                          <div
                            style={{
                              position: 'absolute',
                              right: '0',
                              width: '0',
                              height: '0',
                              borderTop: '5px solid transparent',
                              borderBottom: '5px solid transparent',
                              borderLeft: `7px solid ${themeColor}`,
                            }}
                          ></div>

                          {/* Floating mini info chip centered over the horizontal branch */}
                          <span
                            className="position-absolute badge rounded-pill px-1.5 py-0.5 extra-small fw-bold"
                            style={{
                              backgroundColor: '#FFFFFF',
                              color: themeColor,
                              border: `1px solid ${themeColor}`,
                              fontSize: '0.62rem',
                              letterSpacing: '0.02em',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                              transform: 'scale(0.95)',
                            }}
                          >
                            {isCreated ? 'NEW' : isDeleted ? 'DEL' : `${item.changes_count || 1}Δ`}
                          </span>
                        </div>

                        {/* ========================================================= */}
                        {/* 4. RIGHT ACTIVITY DATA CARD (Grid container)             */}
                        {/* ========================================================= */}
                        <div
                          className="flex-grow-1 ps-2 ps-md-0"
                          style={{ minWidth: 0 }}
                        >
                          <div
                            className="card border rounded-3 overflow-hidden shadow-2xs bg-white transition-all"
                            style={{
                              borderLeft: `4px solid ${themeColor}`,
                              transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                            }}
                          >
                            {/* Card Header Strip: Entity Badge + Object Title + User + Expand/Collapse Button */}
                            <div
                              className="card-header bg-white py-2 py-md-2.5 px-2.5 px-md-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2 cursor-pointer"
                              style={{ cursor: isUpdated ? 'pointer' : 'default' }}
                              onClick={() => isUpdated && toggleItem(item.id)}
                            >
                              {/* Mobile-only Top Timestamp Bar */}
                              <div className="d-flex d-md-none align-items-center justify-content-between w-100 pb-1.5 mb-1 border-bottom border-light extra-small">
                                <div className="d-flex align-items-center gap-1 text-muted">
                                  <Clock size={11} className="text-primary flex-shrink-0" />
                                  <span className="fw-bold text-dark">{item.time_ago}</span>
                                  <span className="text-secondary opacity-75">
                                    • {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <span
                                  className="badge rounded-pill px-1.5 py-0.5 extra-small fw-bold"
                                  style={{
                                    backgroundColor: themeBg,
                                    color: themeColor,
                                    border: `1px solid ${themeColor}`,
                                    fontSize: '0.62rem',
                                  }}
                                >
                                  {isCreated ? 'NEW' : isDeleted ? 'DEL' : `${item.changes_count || 1}Δ`}
                                </span>
                              </div>

                              <div className="d-flex align-items-center gap-1.5 gap-md-2 flex-wrap" style={{ minWidth: 0 }}>
                                {/* Entity Category Chip */}
                                <span className="badge bg-light text-dark border extra-small d-inline-flex align-items-center gap-1 py-1 px-1.5 px-md-2">
                                  {renderModelIcon(item.model_icon)}
                                  <span>{item.model_label}</span>
                                </span>

                                {/* Action Badge */}
                                <span
                                  className={`badge rounded-pill extra-small px-2 py-0.5 fw-bold ${
                                    isCreated
                                      ? 'bg-success-subtle text-success border border-success-subtle'
                                      : isDeleted
                                      ? 'bg-danger-subtle text-danger border border-danger-subtle'
                                      : 'bg-primary-subtle text-primary border border-primary-subtle'
                                  }`}
                                >
                                  {item.action_symbol} {item.action_display}
                                </span>

                                {/* Object Representation Name */}
                                <strong className="fs-6 text-dark text-truncate" style={{ maxWidth: 'min(340px, 100%)' }}>
                                  {item.object_repr}
                                </strong>
                              </div>

                              {/* Right: Who did it & Expand/Collapse Toggle Button */}
                              <div className="d-flex align-items-center justify-content-between justify-content-md-end gap-2 ms-auto flex-wrap flex-sm-nowrap">
                                {/* Who did */}
                                <div className="d-flex align-items-center gap-1.5 bg-light px-2 py-1 rounded-2 border extra-small">
                                  <User size={13} className="text-secondary flex-shrink-0" />
                                  <strong className="text-dark text-truncate" style={{ maxWidth: '120px' }}>
                                    {item.user?.full_name || item.user?.username || 'Staff'}
                                  </strong>
                                  <span className="badge bg-secondary-subtle text-secondary rounded-pill extra-small">
                                    {item.user?.role || 'STAFF'}
                                  </span>
                                </div>

                                {/* Expand / Collapse Toggle Button */}
                                {isUpdated && item.changes_count > 0 && (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-light border py-1 px-2 rounded-2 extra-small fw-semibold d-inline-flex align-items-center gap-1 text-primary shadow-2xs flex-shrink-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleItem(item.id);
                                    }}
                                    title={isExpanded ? 'Collapse changes' : 'Expand changes'}
                                  >
                                    <span>{item.changes_count} change{item.changes_count !== 1 ? 's' : ''}</span>
                                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Card Body */}
                            <div className="card-body p-2.5 p-md-3">
                              {/* 1. CREATED STATE */}
                              {isCreated && (
                                <div className="extra-small text-success bg-success-subtle p-2.5 rounded-2 border border-success-subtle">
                                  <div className="d-flex align-items-center gap-2">
                                    <Plus size={16} className="flex-shrink-0" />
                                    <span>
                                      New instance <strong>{item.object_repr}</strong>.
                                    </span>
                                  </div>
                                  {item.change_reason && item.change_reason !== item.object_repr && (
                                    <div className="text-muted fst-italic mt-1 ps-4 text-break">
                                      {item.change_reason}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* 2. DELETED STATE */}
                              {isDeleted && (
                                <div className="d-flex align-items-center gap-2 extra-small text-danger bg-danger-subtle p-2.5 rounded-2 border border-danger-subtle">
                                  <Trash2 size={16} className="flex-shrink-0" />
                                  <span>
                                    Record <strong>{item.object_repr}</strong> permanently deleted.
                                  </span>
                                </div>
                              )}

                              {/* 3. UPDATED STATE */}
                              {isUpdated && (
                                <div>
                                  {/* Collapsed Preview Chips (When NOT expanded) */}
                                  {!isExpanded && item.changes && item.changes.length > 0 && (
                                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                                      <div className="d-flex align-items-center gap-1.5 flex-wrap">
                                        <span className="text-muted extra-small fw-semibold">Modified:</span>
                                        {item.changes.slice(0, 3).map((ch, idx) => (
                                          <span
                                            key={idx}
                                            className="badge bg-light text-dark border extra-small px-2 py-1 font-monospace text-break"
                                            style={{ whiteSpace: 'normal', wordBreak: 'break-word', display: 'inline-block' }}
                                          >
                                            {ch.field_label}: <span className="text-danger text-decoration-line-through">{ch.old_value}</span> ➔ <span className="text-success fw-bold">{ch.new_value}</span>
                                          </span>
                                        ))}
                                        {item.changes.length > 3 && (
                                          <span className="badge bg-secondary-subtle text-secondary extra-small">
                                            +{item.changes.length - 3} more
                                          </span>
                                        )}
                                      </div>

                                      <button
                                        type="button"
                                        className="btn btn-link btn-xs p-0 text-primary fw-bold text-decoration-none extra-small d-inline-flex align-items-center gap-1"
                                        onClick={() => toggleItem(item.id)}
                                      >
                                        <span>View Full Comparison</span>
                                        <ChevronDown size={13} />
                                      </button>
                                    </div>
                                  )}

                                  {/* Expanded Full Side-by-Side Comparison Table */}
                                  {isExpanded && item.changes && item.changes.length > 0 && (
                                    <div className="animate-fadeIn">
                                      <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-1">
                                        <span className="text-muted extra-small fw-bold text-uppercase tracking-wider">
                                          Field-Level Audit Comparison ({item.changes.length} field{item.changes.length > 1 ? 's' : ''} modified):
                                        </span>
                                        <span className="extra-small text-muted d-none d-sm-inline">
                                          Previous ("First Record") ➔ Updated (New)
                                        </span>
                                      </div>

                                      <div
                                        className="table-responsive rounded-2 border"
                                        style={{ WebkitOverflowScrolling: 'touch', minWidth: '100%', overflowX: 'auto' }}
                                      >
                                        <table className="table table-sm table-hover m-0 align-middle extra-small bg-white" style={{ minWidth: '420px' }}>
                                          <thead className="table-light text-muted">
                                            <tr>
                                              <th style={{ width: '28%', minWidth: '110px' }} className="ps-3 py-2">Field Name</th>
                                              <th style={{ width: '36%', minWidth: '140px' }} className="py-2">Previous Value (First Record)</th>
                                              <th style={{ width: '36%', minWidth: '140px' }} className="pe-3 py-2">Updated Value (New)</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {item.changes.map((ch, idx) => (
                                              <tr key={idx}>
                                                <td className="ps-3 fw-bold text-dark text-break">
                                                  {ch.field_label}
                                                </td>
                                                <td className="text-break">
                                                  <span
                                                    className="badge bg-danger-subtle text-danger border border-danger-subtle font-monospace text-decoration-line-through px-2 py-1"
                                                    style={{ whiteSpace: 'normal', wordBreak: 'break-word', display: 'inline-block' }}
                                                  >
                                                    {ch.old_value}
                                                  </span>
                                                </td>
                                                <td className="pe-3 text-break">
                                                  <div className="d-flex align-items-center gap-1.5">
                                                    <ArrowRight size={13} className="text-primary flex-shrink-0" />
                                                    <span
                                                      className="badge bg-success-subtle text-success border border-success-subtle font-monospace fw-bold px-2 py-1"
                                                      style={{ whiteSpace: 'normal', wordBreak: 'break-word', display: 'inline-block' }}
                                                    >
                                                      {ch.new_value}
                                                    </span>
                                                  </div>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>

                                      {/* Staff Change Reason if available */}
                                      {item.change_reason && (
                                        <div className="mt-2.5 p-2 rounded-2 bg-light border text-muted extra-small fst-italic text-break">
                                          <strong>Staff Reason:</strong> "{item.change_reason}"
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* No changes fallback */}
                                  {item.changes && item.changes.length === 0 && (
                                    <div className="text-dark extra-small p-2 rounded-2 bg-light border">
                                      <span className="fw-medium">{item.summary || item.change_reason || 'Status recorded.'}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer with Pagination & 15-Day Auto-Purge Notice */}
          <div className="modal-footer bg-light py-2.5 px-3 px-md-4 border-top d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div className="text-muted extra-small d-flex align-items-center gap-1.5">
              <ShieldCheck size={16} className="text-success flex-shrink-0" />
              <span>
                <strong>15-Day Auto-Pruning:</strong> Historical records older than 15 days are automatically pruned.
              </span>
            </div>

            <div className="d-flex align-items-center justify-content-between justify-content-md-end w-100 w-md-auto gap-2 gap-md-3 flex-wrap">
              <button
                type="button"
                className="btn btn-sm btn-outline-primary extra-small px-2.5 py-1 fw-semibold d-inline-flex align-items-center gap-1.5 shadow-2xs"
                onClick={handleDownloadPDF}
                disabled={isExporting}
                title="Download All Activity Logs to PDF"
              >
                {isExporting ? <Loader2 size={13} className="spin-animation" /> : <Download size={13} />}
                <span>Export PDF</span>
              </button>

              <span className="text-muted extra-small">
                Showing {logs.length > 0 ? (page - 1) * pageSize + 1 : 0} to{' '}
                {Math.min(page * pageSize, totalCount)} of {totalCount} records
              </span>

              {totalPages > 1 && (
                <div className="btn-group btn-group-sm" role="group">
                  <button
                    type="button"
                    className="btn btn-outline-secondary extra-small px-2.5 py-1"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <span className="btn btn-light extra-small px-2 px-md-3 py-1 fw-bold disabled text-dark border">
                    {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline-secondary extra-small px-2.5 py-1"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              )}

              <button
                type="button"
                className="btn btn-sm btn-secondary extra-small px-3 py-1.5 fw-semibold rounded-3"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogModal;
