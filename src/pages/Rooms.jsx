import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRoomsApi, getRoomTypesApi, createRoomApi, updateRoomStatusApi, deleteRoomApi, createRoomTypeApi } from '../api/roomApi';
import { getCurrentSubscriptionApi } from '../api/subscriptionApi';
import StatusBadge from '../components/StatusBadge';
import RoomCalendar from '../components/RoomCalendar';
import PageLoader from '../components/PageLoader';
import { formatCurrency } from '../utils/formatCurrency';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { exportRoomsToExcel, exportRoomsToPDF } from '../utils/exportUtils';

const Rooms = () => {
  const { showConfirm, showError, showSuccess } = useNotification();
  const { user, isReceptionist, isHotelOwner, isSuperUser, hasPermission, selectedProperty } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: rooms = [],
    isLoading: roomsLoading,
  } = useQuery({
    queryKey: ['rooms', selectedProperty?.id],
    queryFn: getRoomsApi,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const {
    data: roomTypes = [],
    isLoading: typesLoading,
  } = useQuery({
    queryKey: ['roomTypes', selectedProperty?.id],
    queryFn: getRoomTypesApi,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const {
    data: subscriptionData = null,
    isLoading: subLoading,
  } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => getCurrentSubscriptionApi().catch(() => null),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const loading = roomsLoading || typesLoading || subLoading;
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'table', 'calendar'
  const [filterStatus, setFilterStatus] = useState('ALL');

  // New Room Modal state
  const [showModal, setShowModal] = useState(false);
  const [roomNumber, setRoomNumber] = useState('');
  const [roomTypeId, setRoomTypeId] = useState('');
  const [floor, setFloor] = useState('1st Floor');
  const [description, setDescription] = useState('');
  const [modalError, setModalError] = useState(null);
  const [savingRoom, setSavingRoom] = useState(false);

  // Quick Room Category Creation State
  const [showQuickCategoryModal, setShowQuickCategoryModal] = useState(false);
  const [quickCategoryData, setQuickCategoryData] = useState({
    name: '',
    base_price: '',
    max_adults: 2,
    max_children: 1,
    description: '',
  });
  const [savingCategory, setSavingCategory] = useState(false);
  const [quickCategoryError, setQuickCategoryError] = useState(null);

  const openQuickCategoryModal = () => {
    setQuickCategoryError(null);
    setQuickCategoryData({
      name: '',
      base_price: '',
      max_adults: 2,
      max_children: 1,
      description: '',
    });
    setShowQuickCategoryModal(true);
  };

  const handleCreateQuickCategory = async (e) => {
    e.preventDefault();
    if (!quickCategoryData.name.trim()) {
      setQuickCategoryError('Category name is required.');
      return;
    }
    setSavingCategory(true);
    setQuickCategoryError(null);
    try {
      const newCat = await createRoomTypeApi({
        name: quickCategoryData.name.trim(),
        base_price: parseFloat(quickCategoryData.base_price) || 0,
        max_adults: parseInt(quickCategoryData.max_adults, 10) || 2,
        max_children: parseInt(quickCategoryData.max_children, 10) || 0,
        description: quickCategoryData.description.trim()
      });
      setShowQuickCategoryModal(false);
      showSuccess(`Room category "${newCat.name}" created successfully!`, 'Category Created');
      queryClient.setQueriesData({ queryKey: ['roomTypes'] }, (old) => {
        if (!Array.isArray(old)) return [newCat];
        return [...old, newCat];
      });
      setRoomTypeId(newCat.id);
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.name?.[0] || 'Failed to create room category.';
      setQuickCategoryError(msg);
    } finally {
      setSavingCategory(false);
    }
  };

  useEffect(() => {
    if (roomTypes.length > 0) {
      if (!roomTypeId || !roomTypes.some((rt) => rt.id === roomTypeId)) {
        setRoomTypeId(roomTypes[0].id);
      }
    }
  }, [roomTypes, roomTypeId]);

  const maxRoomsAllowed = subscriptionData?.max_rooms_allowed ?? 10;
  const currentRoomsCount = rooms.length;
  const isRoomLimitReached = currentRoomsCount >= maxRoomsAllowed;
  const roomQuotaPercent = Math.min(100, Math.round((currentRoomsCount / Math.max(1, maxRoomsAllowed)) * 100));

  const openAddModal = () => {
    if (!hasPermission('rooms', 'can_create')) {
      showError('Your staff role is not authorized to create new rooms. Please contact the Hotel Owner or Manager.', 'Access Denied');
      return;
    }
    setModalError(null);
    setRoomNumber('');
    setDescription('');
    if (roomTypes.length > 0 && !roomTypeId) {
      setRoomTypeId(roomTypes[0].id);
    }
    setShowModal(true);
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!hasPermission('rooms', 'can_create')) {
      setModalError('Your role is not authorized to create rooms.');
      showError('You do not have permission to create rooms.', 'Permission Denied');
      return;
    }

    if (isRoomLimitReached) {
      const msg = `Plan limit reached: The '${subscriptionData?.plan_name || 'Starter'}' plan allows a maximum of ${maxRoomsAllowed} rooms. Your property already has ${currentRoomsCount} rooms.`;
      setModalError(msg);
      showError(msg, 'Room Limit Exceeded');
      return;
    }

    const cleanNum = roomNumber.trim();
    if (!cleanNum) {
      setModalError('Please enter a valid room number.');
      return;
    }

    // Client-side quick check against existing room numbers strictly in current branch / property
    const targetPropId = selectedProperty?.id || user?.property;
    const existing = rooms.find((r) => {
      if (targetPropId && r.property && String(r.property) !== String(targetPropId)) {
        return false;
      }
      return r.room_number?.toString().trim().toLowerCase() === cleanNum.toLowerCase();
    });
    if (existing) {
      const branchName = selectedProperty?.name ? `branch '${selectedProperty.name}'` : 'this branch';
      const msg = `Room number '${cleanNum}' already exists in ${branchName}. Please specify a unique room number.`;
      setModalError(msg);
      showError(msg, 'Room Number Already Exists');
      return;
    }

    setSavingRoom(true);
    setModalError(null);
    try {
      const newRoom = await createRoomApi({
        room_number: cleanNum,
        room_type: roomTypeId,
        floor: floor,
        description: description,
        ...(targetPropId ? { property: targetPropId } : {})
      });
      setShowModal(false);
      setRoomNumber('');
      setDescription('');
      showSuccess(`Room ${cleanNum} created and added to inventory successfully!`, 'Room Created');
      queryClient.setQueriesData({ queryKey: ['rooms'] }, (old) => {
        if (!Array.isArray(old)) return [newRoom];
        return [...old, newRoom].sort((a, b) =>
          (a.room_number || '').toString().localeCompare((b.room_number || '').toString(), undefined, { numeric: true })
        );
      });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    } catch (err) {
      const errData = err.response?.data;
      let errorMsg = 'Failed to create room. Please verify your inputs.';
      if (errData?.room_number) {
        errorMsg = Array.isArray(errData.room_number) ? errData.room_number[0] : errData.room_number;
      } else if (errData?.detail) {
        errorMsg = errData.detail;
      } else if (errData?.message) {
        errorMsg = errData.message;
      } else if (typeof errData === 'string') {
        errorMsg = errData;
      }
      setModalError(errorMsg);
      showError(errorMsg, 'Room Creation Failed');
    } finally {
      setSavingRoom(false);
    }
  };

  const handleStatusChange = async (roomId, newStatus) => {
    if (!hasPermission('rooms', 'can_change_status')) {
      showError('Your staff role is not authorized to change room housekeeping status.', 'Permission Denied');
      return;
    }
    const prevRooms = queryClient.getQueryData(['rooms', selectedProperty?.id]);
    queryClient.setQueriesData({ queryKey: ['rooms'] }, (old) => {
      if (!Array.isArray(old)) return old;
      return old.map((r) => (r.id === roomId ? { ...r, status: newStatus } : r));
    });
    try {
      await updateRoomStatusApi(roomId, newStatus);
      queryClient.invalidateQueries({ queryKey: ['rooms'], refetchType: 'none' });
    } catch (err) {
      if (prevRooms) {
        queryClient.setQueryData(['rooms', selectedProperty?.id], prevRooms);
      }
      showError('Error updating room status.', 'Status Update Failed');
    }
  };

  const handleDeleteRoom = (room) => {
    if (!hasPermission('rooms', 'can_create')) {
      showError('Your staff role is not authorized to delete room records.', 'Permission Denied');
      return;
    }

    showConfirm({
      title: 'Delete Room Record',
      message: `Are you sure you want to permanently DELETE Room ${room.room_number}? This action cannot be undone.`,
      confirmText: 'Yes, Delete Room',
      cancelText: 'Cancel',
      confirmVariant: 'danger',
      onConfirm: async () => {
        const prevRooms = queryClient.getQueryData(['rooms', selectedProperty?.id]);
        queryClient.setQueriesData({ queryKey: ['rooms'] }, (old) => {
          if (!Array.isArray(old)) return old;
          return old.filter((r) => r.id !== room.id);
        });
        showSuccess(`Room ${room.room_number} deleted successfully!`, 'Room Deleted');
        try {
          await deleteRoomApi(room.id);
          queryClient.invalidateQueries({ queryKey: ['rooms'], refetchType: 'none' });
          queryClient.invalidateQueries({ queryKey: ['subscription'] });
        } catch (err) {
          if (prevRooms) {
            queryClient.setQueryData(['rooms', selectedProperty?.id], prevRooms);
          }
          showError('Cannot delete room with active stays or reservations.', 'Deletion Failed');
        }
      },
    });
  };

  const filteredRooms = rooms.filter((r) => {
    if (filterStatus === 'ALL') return true;
    return r.status === filterStatus;
  });

  // -------------------------------------------------------------
  // Column Visibility & Definitions
  // -------------------------------------------------------------
  const columnDefs = [
    { key: 'room_number', label: 'Room #' },
    { key: 'room_type', label: 'Room Type' },
    { key: 'floor', label: 'Floor' },
    { key: 'base_price', label: 'Base Rate' },
    { key: 'capacity', label: 'Capacity' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Action' },
  ];

  const [columnVisibility, setColumnVisibility] = useState({
    room_number: true,
    room_type: true,
    floor: true,
    base_price: true,
    capacity: true,
    status: true,
    actions: true,
  });
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const columnMenuRef = useRef(null);

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
    setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const resetColumnVisibility = () => {
    setColumnVisibility({
      room_number: true,
      room_type: true,
      floor: true,
      base_price: true,
      capacity: true,
      status: true,
      actions: true,
    });
  };

  // -------------------------------------------------------------
  // Sorting State & Logic
  // -------------------------------------------------------------
  const [sortColumn, setSortColumn] = useState('room_number');
  const [sortDirection, setSortDirection] = useState('asc');

  const handleSort = (colKey) => {
    if (sortColumn === colKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(colKey);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const sortedRooms = useMemo(() => {
    if (!filteredRooms || !filteredRooms.length) return [];
    return [...filteredRooms].sort((a, b) => {
      let valA, valB;
      switch (sortColumn) {
        case 'room_number': {
          const numA = parseInt(a.room_number, 10);
          const numB = parseInt(b.room_number, 10);
          if (!isNaN(numA) && !isNaN(numB)) {
            valA = numA;
            valB = numB;
          } else {
            valA = String(a.room_number || '').toLowerCase();
            valB = String(b.room_number || '').toLowerCase();
          }
          break;
        }
        case 'room_type':
          valA = (a.room_type_name || '').toLowerCase();
          valB = (b.room_type_name || '').toLowerCase();
          break;
        case 'floor':
          valA = (a.floor || '').toLowerCase();
          valB = (b.floor || '').toLowerCase();
          break;
        case 'base_price':
          valA = parseFloat(a.base_price) || 0;
          valB = parseFloat(b.base_price) || 0;
          break;
        case 'capacity':
          valA = (a.max_adults || 0) + (a.max_children || 0);
          valB = (b.max_adults || 0) + (b.max_children || 0);
          break;
        case 'status':
          valA = (a.status || '').toLowerCase();
          valB = (b.status || '').toLowerCase();
          break;
        default:
          valA = a.id;
          valB = b.id;
      }
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      return sortDirection === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [filteredRooms, sortColumn, sortDirection]);

  // -------------------------------------------------------------
  // Pagination State & Logic
  // -------------------------------------------------------------
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus]);

  const totalItems = sortedRooms.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const paginatedRooms = useMemo(() => {
    return sortedRooms.slice(startIndex, endIndex);
  }, [sortedRooms, startIndex, endIndex]);

  const getPageNumbers = (current, total) => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
    if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  const handleExportExcel = () => {
    exportRoomsToExcel(sortedRooms, { filterStatus }, selectedProperty);
  };

  const handleExportPDF = () => {
    exportRoomsToPDF(sortedRooms, { filterStatus }, selectedProperty);
  };

  const renderSortHeader = (label, colKey, className = '') => (
    <th
      className={`${className} text-nowrap`}
      style={{ cursor: 'pointer', userSelect: 'none' }}
      onClick={() => handleSort(colKey)}
      title={`Sort by ${label}`}
    >
      <div className="d-inline-flex align-items-center gap-1.5">
        <span>{label}</span>
        {sortColumn === colKey ? (
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

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 className="fw-bold m-0 text-dark">Room Management</h4>
          <span className="text-muted small">Manage room inventory, floor layout, status, and subscription quota</span>
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
          {hasPermission('rooms', 'can_create') && (
            <button
              className={`btn ${isRoomLimitReached ? 'btn-secondary opacity-75' : 'btn-primary'} fw-semibold shadow-sm d-flex align-items-center gap-1.5`}
              onClick={openAddModal}
              title={isRoomLimitReached ? `Subscription quota limit reached (${maxRoomsAllowed} rooms). Upgrade plan to add more rooms.` : 'Add New Room'}
            >
              <i className="bi bi-plus-lg"></i>
              <span>Add Room</span>
              {isRoomLimitReached && (
                <span className="badge bg-danger rounded-pill extra-small ms-1">Limit Reached</span>
              )}
            </button>
          )}

        </div>
      </div>

      {/* Subscription Room Limit Quota Banner */}
      <div className={`card border-0 mb-3 shadow-sm overflow-hidden ${
        isRoomLimitReached ? 'bg-danger-subtle border border-danger-subtle' :
        roomQuotaPercent >= 80 ? 'bg-warning-subtle border border-warning-subtle' :
        'bg-light border'
      }`}>
        <div className="card-body p-3 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            <div
              className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ${
                isRoomLimitReached ? 'bg-danger text-white' :
                roomQuotaPercent >= 80 ? 'bg-warning text-dark' :
                'bg-primary text-white'
              }`}
              style={{ width: '40px', height: '40px' }}
            >
              <i className="bi bi-door-open fs-5"></i>
            </div>
            <div>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <span className="fw-bold text-dark">Plan Room Quota:</span>
                <span className={`badge ${
                  isRoomLimitReached ? 'bg-danger' :
                  roomQuotaPercent >= 80 ? 'bg-warning text-dark' :
                  'bg-primary'
                } rounded-pill px-2.5 py-1 fw-bold`}>
                  {currentRoomsCount} / {maxRoomsAllowed} Rooms Used
                </span>
                <span className="badge bg-secondary-subtle text-secondary rounded-pill extra-small">
                  {subscriptionData?.plan_name || 'Current Plan'}
                </span>
                {isRoomLimitReached && (
                  <span className="badge bg-danger text-white rounded-pill extra-small fw-bold">
                    Quota Full (100%)
                  </span>
                )}
              </div>
              <div className="text-muted small mt-1">
                {isRoomLimitReached ? (
                  <span className="text-danger fw-semibold">
                    ⚠️ Maximum room limit for your current plan has been reached. Upgrade your subscription plan to add more rooms.
                  </span>
                ) : (
                  <span>
                    Your active plan permits up to <strong>{maxRoomsAllowed}</strong> rooms. You currently have <strong>{currentRoomsCount}</strong> configured ({maxRoomsAllowed - currentRoomsCount} remaining).
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3 flex-shrink-0">
            <div style={{ width: '130px' }} className="d-none d-lg-block">
              <div className="d-flex justify-content-between extra-small text-muted mb-1">
                <span>Usage</span>
                <span className="fw-bold">{roomQuotaPercent}%</span>
              </div>
              <div className="progress" style={{ height: '6px' }}>
                <div
                  className={`progress-bar ${
                    isRoomLimitReached ? 'bg-danger' :
                    roomQuotaPercent >= 80 ? 'bg-warning' :
                    'bg-primary'
                  }`}
                  role="progressbar"
                  style={{ width: `${roomQuotaPercent}%` }}
                ></div>
              </div>
            </div>

            {(isHotelOwner || isSuperUser) && (
              <button
                type="button"
                onClick={() => navigate('/subscription')}
                className={`btn btn-sm ${isRoomLimitReached ? 'btn-danger' : 'btn-outline-primary'} fw-semibold px-3 py-1.5 rounded-pill shadow-xs d-flex align-items-center gap-1.5`}
              >
                <i className="bi bi-arrow-up-circle-fill"></i>
                <span>{isRoomLimitReached ? 'Upgrade Plan' : 'Manage Subscription'}</span>
              </button>
            )}
          </div>
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
                    style={{ minWidth: '200px', zIndex: 1060 }}
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
                title="Export Room Inventory to Excel (.xls)"
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
                title="Export Room Inventory to PDF Report"
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
                    {columnVisibility.room_number && renderSortHeader('Room #', 'room_number', 'ps-3')}
                    {columnVisibility.room_type && renderSortHeader('Room Type', 'room_type')}
                    {columnVisibility.floor && renderSortHeader('Floor', 'floor')}
                    {columnVisibility.base_price && renderSortHeader('Base Rate', 'base_price')}
                    {columnVisibility.capacity && renderSortHeader('Capacity', 'capacity')}
                    {columnVisibility.status && renderSortHeader('Status', 'status')}
                    {columnVisibility.actions && <th className="text-end pe-3">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {paginatedRooms.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4 text-muted">
                        No rooms match the current filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedRooms.map((room) => (
                      <tr key={room.id}>
                        {columnVisibility.room_number && (
                          <td className="ps-3 fw-bold fs-6 text-dark">Room {room.room_number}</td>
                        )}
                        {columnVisibility.room_type && (
                          <td className="fw-semibold text-primary">{room.room_type_name}</td>
                        )}
                        {columnVisibility.floor && (
                          <td className="text-muted">{room.floor}</td>
                        )}
                        {columnVisibility.base_price && (
                          <td className="fw-bold">{formatCurrency(room.base_price)}</td>
                        )}
                        {columnVisibility.capacity && (
                          <td className="small text-muted">{room.max_adults} Adults, {room.max_children} Children</td>
                        )}
                        {columnVisibility.status && (
                          <td><StatusBadge status={room.status} /></td>
                        )}
                        {columnVisibility.actions && (
                          <td className="text-end pe-3">
                            <select
                              className="form-select form-select-sm w-auto d-inline-block"
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
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table Footer with Showing X to Y of Z and Pagination */}
          <div className="card-footer bg-white py-2.5 px-3 border-top d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div className="text-muted small">
              Showing <span className="fw-semibold text-dark">{totalItems === 0 ? 0 : startIndex + 1}</span> to{' '}
              <span className="fw-semibold text-dark">{endIndex}</span> of{' '}
              <span className="fw-semibold text-dark">{totalItems}</span> records
            </div>

            {totalPages > 1 && (
              <nav aria-label="Table pagination">
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

                  {getPageNumbers(currentPage, totalPages).map((p, idx) =>
                    p === '...' ? (
                      <li key={`ellipsis-${idx}`} className="page-item disabled">
                        <span className="page-link border-0 px-2 py-1">…</span>
                      </li>
                    ) : (
                      <li key={p} className={`page-item ${currentPage === p ? 'active' : ''}`}>
                        <button
                          type="button"
                          className="page-link rounded px-2.5 py-1 fw-semibold"
                          onClick={() => setCurrentPage(p)}
                        >
                          {p}
                        </button>
                      </li>
                    )
                  )}

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
        </div>
      )}

      {/* Add Room Modal */}
      {showModal && (
        <div className="modal fade show d-block modal-backdrop-animated" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1060 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-dialog-animated" style={{ maxWidth: '580px' }}>
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden modal-content-animated" style={{ backgroundColor: '#ffffff' }}>
              
              <div className="modal-header bg-white border-bottom py-3 px-4 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <div className="p-2.5 bg-primary-subtle text-primary rounded-3 d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                    <i className="bi bi-door-open fs-5"></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-dark m-0" style={{ fontSize: '1.15rem', letterSpacing: '-0.01em' }}>
                      Add New Room Inventory
                    </h5>
                    <span className="text-secondary extra-small">
                      Define room number, assign room category type, and floor level.
                    </span>
                  </div>
                </div>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleCreateRoom}>
                <div className="modal-body p-4 bg-white">
                  {modalError && (
                    <div className="alert alert-danger d-flex align-items-start gap-2.5 py-2.5 px-3 rounded-3 mb-3 border-danger-subtle shadow-2xs animate-fadeIn">
                      <i className="bi bi-exclamation-triangle-fill text-danger fs-5 flex-shrink-0 mt-0.5"></i>
                      <div>
                        <div className="fw-bold small text-danger">Validation Notice</div>
                        <div className="small text-danger-emphasis">{modalError}</div>
                      </div>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark mb-1">Room Number *</label>
                    <input
                      type="text"
                      className={`form-control py-2.5 font-bold font-monospace ${modalError ? 'is-invalid border-danger' : ''}`}
                      style={{ height: '46px' }}
                      required
                      value={roomNumber}
                      onChange={(e) => {
                        setRoomNumber(e.target.value);
                        if (modalError) setModalError(null);
                      }}
                      placeholder="e.g. 104 or 205"
                    />
                    {modalError && (
                      <div className="invalid-feedback d-block fw-semibold mt-1">
                        {modalError}
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label small fw-semibold text-dark m-0">Room Category Type *</label>
                      <button
                        type="button"
                        onClick={openQuickCategoryModal}
                        className="btn btn-link p-0 extra-small fw-bold text-decoration-none text-primary d-inline-flex align-items-center gap-1"
                        title="Click to create a new room category"
                      >
                        <i className="bi bi-plus-circle-fill"></i> + Add New Category
                      </button>
                    </div>
                    <select
                      className="form-select py-2.5 font-semibold"
                      style={{ height: '46px' }}
                      required
                      value={roomTypeId}
                      onChange={(e) => {
                        if (e.target.value === '__NEW_CATEGORY__') {
                          openQuickCategoryModal();
                        } else {
                          setRoomTypeId(e.target.value);
                        }
                      }}
                    >
                      {roomTypes.length === 0 && (
                        <option value="" disabled>-- No Categories Available (Click + Add Category) --</option>
                      )}
                      {roomTypes.map((rt) => (
                        <option key={rt.id} value={rt.id}>
                          {rt.name} (₹{rt.base_price}/night)
                        </option>
                      ))}
                      <option value="__NEW_CATEGORY__" className="fw-bold text-primary bg-primary-subtle">
                        ➕ + Create New Category...
                      </option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark mb-1">Floor Level</label>
                    <input
                      type="text"
                      className="form-control py-2.5"
                      style={{ height: '46px' }}
                      value={floor}
                      onChange={(e) => setFloor(e.target.value)}
                      placeholder="e.g. 1st Floor / Ground Floor"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark mb-1">Room Description / Notes</label>
                    <textarea
                      className="form-control p-2.5"
                      rows="2"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Optional room description or features..."
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer bg-light border-top px-4 py-3 d-flex justify-content-between align-items-center">
                  <button
                    type="button"
                    className="btn btn-light border fw-semibold px-4 py-2 rounded-3"
                    onClick={() => setShowModal(false)}
                    disabled={savingRoom}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary fw-bold px-4 py-2 rounded-3 shadow-sm d-flex align-items-center gap-2"
                    disabled={savingRoom}
                  >
                    {savingRoom ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        Saving Room...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle-fill"></i> Save Room
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Quick Create Room Category Modal */}
      {showQuickCategoryModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', zIndex: 1080 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '480px' }}>
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-white border-bottom py-3 px-4 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2.5">
                  <div className="p-2 bg-primary-subtle text-primary rounded-3 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                    <i className="bi bi-grid-plus fs-5"></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-dark m-0 fs-6">
                      Add New Room Category
                    </h5>
                    <span className="text-secondary extra-small">
                      Define a new room category for this property
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowQuickCategoryModal(false)}
                  disabled={savingCategory}
                ></button>
              </div>

              <form onSubmit={handleCreateQuickCategory}>
                <div className="modal-body p-4 bg-white">
                  {quickCategoryError && (
                    <div className="alert alert-danger p-2.5 rounded-3 mb-3 d-flex align-items-center gap-2 extra-small">
                      <i className="bi bi-exclamation-triangle-fill text-danger fs-6 flex-shrink-0"></i>
                      <div>{quickCategoryError}</div>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark mb-1">Category Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      style={{ height: '44px' }}
                      required
                      placeholder="e.g. Deluxe AC, Standard Double"
                      value={quickCategoryData.name}
                      onChange={(e) => setQuickCategoryData({ ...quickCategoryData, name: e.target.value })}
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-12">
                      <label className="form-label small fw-semibold text-dark mb-1">Base Rate / Night (₹) *</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="form-control font-monospace fw-bold"
                        style={{ height: '44px' }}
                        required
                        placeholder="e.g. 1500"
                        value={quickCategoryData.base_price}
                        onChange={(e) => setQuickCategoryData({ ...quickCategoryData, base_price: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-dark mb-1">Max Adults</label>
                      <input
                        type="number"
                        min="1"
                        className="form-control"
                        style={{ height: '44px' }}
                        value={quickCategoryData.max_adults}
                        onChange={(e) => setQuickCategoryData({ ...quickCategoryData, max_adults: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-dark mb-1">Max Children</label>
                      <input
                        type="number"
                        min="0"
                        className="form-control"
                        style={{ height: '44px' }}
                        value={quickCategoryData.max_children}
                        onChange={(e) => setQuickCategoryData({ ...quickCategoryData, max_children: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mb-2">
                    <label className="form-label small fw-semibold text-dark mb-1">Description (Optional)</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="e.g. Queen bed, city view, attached washroom"
                      value={quickCategoryData.description}
                      onChange={(e) => setQuickCategoryData({ ...quickCategoryData, description: e.target.value })}
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer bg-light border-top px-4 py-2.5 d-flex justify-content-between align-items-center">
                  <button
                    type="button"
                    className="btn btn-light border fw-semibold px-3 py-1.5 rounded-3 btn-sm"
                    onClick={() => setShowQuickCategoryModal(false)}
                    disabled={savingCategory}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary fw-bold px-3 py-1.5 rounded-3 btn-sm d-flex align-items-center gap-1.5 shadow-xs"
                    disabled={savingCategory}
                  >
                    {savingCategory ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle-fill"></i> Save &amp; Select Category
                      </>
                    )}
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

export default Rooms;
