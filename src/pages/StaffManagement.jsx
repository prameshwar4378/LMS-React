import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  getUsersApi,
  createUserApi,
  deleteUserApi,
  resetUserPasswordApi,
  toggleUserActiveApi
} from '../api/authApi';
import { getHotelBranchesApi } from '../api/settingsApi';
import PageLoader from '../components/PageLoader';
import RolePermissionMatrixModal from '../components/RolePermissionMatrixModal';
import { exportStaffToExcel, exportStaffToPDF } from '../utils/exportUtils';
import {
  Users,
  UserPlus,
  Shield,
  Key,
  CheckCircle2,
  XCircle,
  Copy,
  Search,
  Filter,
  RefreshCw,
  GitBranch,
  Building2,
  Mail,
  UserCheck,
  Power,
  Trash2,
  Sliders,
  AlertCircle,
  Lock,
  ChevronRight,
  Info
} from 'lucide-react';

const StaffManagement = () => {
  const { user, selectedProperty } = useAuth();
  const { showSuccess, showError } = useNotification();
  const queryClient = useQueryClient();

  const {
    data: usersList = [],
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const usersData = await getUsersApi();
      return Array.isArray(usersData) ? usersData : (usersData?.results || []);
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const {
    data: branchesList = [],
    isLoading: branchesLoading,
    refetch: refetchBranches,
  } = useQuery({
    queryKey: ['hotelBranches'],
    queryFn: async () => {
      const branchesData = await getHotelBranchesApi();
      return Array.isArray(branchesData) ? branchesData : [];
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const loading = usersLoading || branchesLoading;

  const loadData = () => {
    refetchUsers();
    refetchBranches();
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('all');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPermModal, setShowPermModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    role: 'RECEPTIONIST',
    password: '',
    property: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Reset Password State
  const [userToReset, setUserToReset] = useState(null);
  const [customNewPassword, setCustomNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  // Action Loading
  const [actionUserId, setActionUserId] = useState(null);

  const handleOpenAddModal = (defaultPropertyId = null) => {
    const defaultProp = defaultPropertyId || (branchesList.length > 0 ? branchesList[0].id : '');
    setFormData({
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      role: 'RECEPTIONIST',
      password: '',
      property: defaultProp
    });
    setShowAddModal(true);
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username) {
      showError('Username is required.', 'Validation Error');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        role: formData.role,
        property: formData.property ? parseInt(formData.property) : undefined
      };
      if (formData.password && formData.password.trim()) {
        payload.password = formData.password.trim();
      }

      const res = await createUserApi(payload);
      showSuccess(`Staff user '${res.username}' created successfully!`, 'Account Created');
      setShowAddModal(false);

      // Find property display name
      const assignedBranch = branchesList.find(b => b.id === parseInt(formData.property));
      const unitName = assignedBranch ? assignedBranch.name : (user?.property_name || 'Primary Hotel');

      setCreatedCredentials({
        title: 'Staff Credentials Created',
        subtitle: 'Please provide these login credentials to the staff member:',
        username: res.username,
        password: formData.password?.trim() || 'Default password set',
        role: res.role,
        property_name: unitName
      });
      setShowCredentialsModal(true);

      queryClient.setQueriesData({ queryKey: ['staff'] }, (old) => {
        if (!Array.isArray(old)) return [res];
        return [res, ...old];
      });
      queryClient.invalidateQueries({ queryKey: ['staff'], refetchType: 'none' });
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.username?.[0]
        || err.response?.data?.property?.[0]
        || err.response?.data?.error
        || 'Failed to create staff account.';
      showError(errMsg, 'Creation Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (targetUser) => {
    if (targetUser.id === user?.id) {
      showError('You cannot deactivate your own account.', 'Action Forbidden');
      return;
    }
    setActionUserId(targetUser.id);
    const prevStaff = queryClient.getQueryData(['staff']);
    // Optimistic toggle active status (0.0s)
    queryClient.setQueriesData({ queryKey: ['staff'] }, (old) => {
      if (!Array.isArray(old)) return old;
      return old.map((u) => (u.id === targetUser.id ? { ...u, is_active: !u.is_active } : u));
    });

    try {
      const res = await toggleUserActiveApi(targetUser.id);
      showSuccess(res.message, 'Status Updated');
      queryClient.invalidateQueries({ queryKey: ['staff'], refetchType: 'none' });
    } catch (err) {
      if (prevStaff) {
        queryClient.setQueryData(['staff'], prevStaff);
      }
      showError('Failed to change user status.', 'Error');
    } finally {
      setActionUserId(null);
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (targetUser.id === user?.id) {
      showError('You cannot delete your own account.', 'Action Forbidden');
      return;
    }
    if (targetUser.role === 'HOTEL_OWNER') {
      showError('Hotel Owner accounts cannot be deleted here.', 'Action Forbidden');
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete user "${targetUser.username}"?`)) {
      return;
    }
    setActionUserId(targetUser.id);
    const prevStaff = queryClient.getQueryData(['staff']);
    // Optimistic delete staff (0.0s)
    queryClient.setQueriesData({ queryKey: ['staff'] }, (old) => {
      if (!Array.isArray(old)) return old;
      return old.filter((u) => u.id !== targetUser.id);
    });
    showSuccess(`User '${targetUser.username}' has been deleted.`, 'User Deleted');

    try {
      await deleteUserApi(targetUser.id);
      queryClient.invalidateQueries({ queryKey: ['staff'], refetchType: 'none' });
    } catch (err) {
      if (prevStaff) {
        queryClient.setQueryData(['staff'], prevStaff);
      }
      showError('Failed to delete staff account.', 'Error');
    } finally {
      setActionUserId(null);
    }
  };

  const handleOpenResetModal = (targetUser) => {
    setUserToReset(targetUser);
    setCustomNewPassword('');
    setShowResetModal(true);
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!userToReset) return;
    setResetting(true);
    try {
      const res = await resetUserPasswordApi(userToReset.id, customNewPassword || null);
      setShowResetModal(false);
      setCreatedCredentials({
        title: 'Password Reset Successful',
        subtitle: 'New security credentials generated:',
        username: res.username,
        password: res.new_password,
        role: userToReset.role,
        property_name: userToReset.property_name || user?.property_name
      });
      setShowCredentialsModal(true);
      showSuccess(`Password reset for ${res.username}`, 'Password Updated');
    } catch (err) {
      showError('Failed to reset password.', 'Error');
    } finally {
      setResetting(false);
      setUserToReset(null);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showSuccess('Copied to clipboard!', 'Success');
  };

  // Filtered Users
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBranch =
      selectedBranchFilter === 'all' ||
      (u.property && String(u.property) === String(selectedBranchFilter)) ||
      (u.property_id && String(u.property_id) === String(selectedBranchFilter));

    const matchesRole =
      selectedRoleFilter === 'all' || u.role === selectedRoleFilter;

    return matchesSearch && matchesBranch && matchesRole;
  });

  // -------------------------------------------------------------
  // Column Visibility & Definitions
  // -------------------------------------------------------------
  const columnDefs = [
    { key: 'user_info', label: 'User' },
    { key: 'full_name', label: 'Full Name' },
    { key: 'location', label: 'Assigned Location' },
    { key: 'role', label: 'Role' },
    { key: 'contact', label: 'Contact' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Security Actions' },
  ];

  const [columnVisibility, setColumnVisibility] = useState({
    user_info: true,
    full_name: true,
    location: true,
    role: true,
    contact: true,
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
      user_info: true,
      full_name: true,
      location: true,
      role: true,
      contact: true,
      status: true,
      actions: true,
    });
  };

  // -------------------------------------------------------------
  // Sorting State & Logic
  // -------------------------------------------------------------
  const [sortColumn, setSortColumn] = useState('username');
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

  const sortedUsers = useMemo(() => {
    if (!filteredUsers || !filteredUsers.length) return [];
    return [...filteredUsers].sort((a, b) => {
      let valA, valB;
      switch (sortColumn) {
        case 'user_info':
        case 'username':
          valA = (a.username || '').toLowerCase();
          valB = (b.username || '').toLowerCase();
          break;
        case 'full_name':
          valA = `${a.first_name || ''} ${a.last_name || ''}`.trim().toLowerCase();
          valB = `${b.first_name || ''} ${b.last_name || ''}`.trim().toLowerCase();
          break;
        case 'location':
          valA = (a.property_name || '').toLowerCase();
          valB = (b.property_name || '').toLowerCase();
          break;
        case 'role':
          valA = (a.role || '').toLowerCase();
          valB = (b.role || '').toLowerCase();
          break;
        case 'contact':
          valA = (a.email || '').toLowerCase();
          valB = (b.email || '').toLowerCase();
          break;
        case 'status':
          valA = a.is_active ? 1 : 0;
          valB = b.is_active ? 1 : 0;
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
  }, [filteredUsers, sortColumn, sortDirection]);

  // -------------------------------------------------------------
  // Pagination State & Calculations
  // -------------------------------------------------------------
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedBranchFilter, selectedRoleFilter]);

  const totalItems = sortedUsers.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const paginatedUsers = useMemo(() => {
    return sortedUsers.slice(startIndex, endIndex);
  }, [sortedUsers, startIndex, endIndex]);

  const getPageNumbers = (current, total) => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
    if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  const handleExportExcel = () => {
    exportStaffToExcel(sortedUsers, { searchQuery }, selectedProperty);
  };

  const handleExportPDF = () => {
    exportStaffToPDF(sortedUsers, { searchQuery }, selectedProperty);
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

  // Calculate Metrics
  const totalStaff = usersList.length;
  const managersCount = usersList.filter(u => u.role === 'MANAGER').length;
  const receptionistsCount = usersList.filter(u => u.role === 'RECEPTIONIST').length;
  const branchesCount = branchesList.filter(b => b.is_branch).length;

  if (loading) {
    return <PageLoader fullScreen={false} message="Loading Staff & Branches..." />;
  }

  return (
    <div className="container-fluid px-2 px-md-4 py-3">
      {/* Header Banner */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h4 className="fw-bold m-0 text-dark">Staff &amp; Branch Accounts</h4>
            <span className="badge bg-primary-subtle text-primary border rounded-pill px-2.5 py-1 extra-small fw-bold">
              Multi-Branch Access
            </span>
          </div>
          <p className="text-muted small m-0 mt-1">
            Provision and manage login credentials for Branch Managers and Receptionists across your hotel locations.
          </p>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm rounded-3 d-flex align-items-center gap-1.5 shadow-xs"
            onClick={() => setShowPermModal(true)}
          >
            <Sliders size={15} />
            <span>Role Permissions</span>
          </button>
          <button
            type="button"
            className="btn btn-outline-primary btn-sm rounded-3 d-flex align-items-center gap-1.5 shadow-xs"
            onClick={loadData}
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm rounded-3 d-flex align-items-center gap-1.5 text-white shadow-xs fw-bold px-3 py-1.5"
            onClick={() => handleOpenAddModal()}
            style={{ background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)' }}
          >
            <UserPlus size={16} />
            <span>+ Add Staff Member</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-3.5 h-100 bg-white">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-secondary extra-small fw-bold text-uppercase">TOTAL STAFF ACCOUNTS</span>
                <h3 className="fw-bold text-dark font-monospace m-0 mt-1">{totalStaff}</h3>
              </div>
              <div className="p-2.5 rounded-3 bg-primary-subtle text-primary">
                <Users size={22} />
              </div>
            </div>
            <span className="text-muted extra-small mt-2 d-block">Across all units and branches</span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-3.5 h-100 bg-white">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-secondary extra-small fw-bold text-uppercase">BRANCH MANAGERS</span>
                <h3 className="fw-bold text-primary font-monospace m-0 mt-1">{managersCount}</h3>
              </div>
              <div className="p-2.5 rounded-3 bg-indigo-subtle text-indigo" style={{ backgroundColor: '#EEF2FF', color: '#4F46E5' }}>
                <Shield size={22} />
              </div>
            </div>
            <span className="text-muted extra-small mt-2 d-block">Operations supervision</span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-3.5 h-100 bg-white">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-secondary extra-small fw-bold text-uppercase">RECEPTIONISTS</span>
                <h3 className="fw-bold text-success font-monospace m-0 mt-1">{receptionistsCount}</h3>
              </div>
              <div className="p-2.5 rounded-3 bg-success-subtle text-success">
                <UserCheck size={22} />
              </div>
            </div>
            <span className="text-muted extra-small mt-2 d-block">Front-desk &amp; reservations</span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-3.5 h-100 bg-white">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-secondary extra-small fw-bold text-uppercase">HOTEL LOCATIONS</span>
                <h3 className="fw-bold text-dark font-monospace m-0 mt-1">{branchesList.length}</h3>
              </div>
              <div className="p-2.5 rounded-3 bg-warning-subtle text-warning">
                <GitBranch size={22} />
              </div>
            </div>
            <span className="text-muted extra-small mt-2 d-block">1 Primary + {branchesCount} Branches</span>
          </div>
        </div>
      </div>

      {/* Configured Hotel Branches Banner (READ ONLY) */}
      <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden bg-white">
        <div className="card-header bg-light border-bottom px-4 py-3 d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
          <div className="d-flex align-items-center gap-2">
            <GitBranch size={18} className="text-primary" />
            <h6 className="fw-bold text-dark m-0">Your Hotel Units &amp; Active Branches</h6>
          </div>
          <span className="badge bg-secondary-subtle text-secondary border extra-small">
            Read-Only (Provisioned by Platform Developer)
          </span>
        </div>
        <div className="p-3.5">
          <div className="row g-3">
            {branchesList.map((b) => {
              const unitStaffCount = usersList.filter(u =>
                (u.property && u.property === b.id) ||
                (u.property_id && u.property_id === b.id)
              ).length;

              return (
                <div key={b.id} className="col-12 col-md-6 col-xl-4">
                  <div className="p-3 rounded-3 border h-100 d-flex flex-column justify-content-between" style={{ backgroundColor: b.is_branch ? '#F8FAFC' : '#EFF6FF', borderColor: b.is_branch ? '#E2E8F0' : '#BFDBFE' }}>
                    <div>
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <div className="fw-bold text-dark text-truncate me-2">{b.name}</div>
                        <span className={`badge extra-small ${b.is_branch ? 'bg-info-subtle text-info border' : 'bg-primary text-white'}`}>
                          {b.is_branch ? 'Branch Wing' : 'Main Hotel'}
                        </span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span className="font-monospace extra-small text-muted">{b.property_code}</span>
                        {b.city && <span className="extra-small text-muted">• {b.city}</span>}
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                      <span className="extra-small text-secondary fw-semibold">
                        <Users size={12} className="me-1 d-inline text-primary" />
                        {unitStaffCount} Staff Assigned
                      </span>
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm py-0.5 px-2 extra-small rounded-2"
                        onClick={() => handleOpenAddModal(b.id)}
                      >
                        + Assign Staff
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="alert alert-info border-0 rounded-3 mt-3 mb-0 p-2.5 extra-small d-flex align-items-center gap-2">
            <Info size={16} className="flex-shrink-0 text-primary" />
            <span>
              <strong>Note:</strong> To add or deactivate branches, or adjust room capacity limits, please coordinate with your SaaS Platform Developer. You have full authority to create, assign, and manage credentials for Branch Managers and Receptionists here.
            </span>
          </div>
        </div>
      </div>

      {/* Staff Accounts Table Card */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
        {/* Filter Bar */}
        <div className="p-3.5 border-bottom bg-light">
          <div className="row g-2 align-items-center">
            {/* Search Input */}
            <div className="col-12 col-md-5 col-lg-4">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white border-end-0">
                  <Search size={14} className="text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search staff by username, name, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Branch Filter */}
            <div className="col-6 col-md-3 col-lg-3">
              <select
                className="form-select form-select-sm"
                value={selectedBranchFilter}
                onChange={(e) => setSelectedBranchFilter(e.target.value)}
              >
                <option value="all">All Locations (Hotel + Branches)</option>
                {branchesList.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.is_branch ? `[Branch] ${b.name}` : `[Main] ${b.name}`} ({b.property_code})
                  </option>
                ))}
              </select>
            </div>

            {/* Role Filter */}
            <div className="col-6 col-md-2 col-lg-2">
              <select
                className="form-select form-select-sm"
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="MANAGER">Manager</option>
                <option value="RECEPTIONIST">Receptionist</option>
                <option value="HOTEL_OWNER">Hotel Owner</option>
              </select>
            </div>

            {/* Total count badge */}
            <div className="col-12 col-md-2 col-lg-3 text-md-end">
              <span className="extra-small text-muted">
                Showing <strong>{filteredUsers.length}</strong> of {usersList.length} accounts
              </span>
            </div>
          </div>
        </div>

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
              title="Export Staff Directory to Excel (.xls)"
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
              title="Export Staff Directory to PDF Report"
            >
              <i className="bi bi-file-earmark-pdf-fill text-danger"></i>
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.875rem' }}>
            <thead className="bg-light text-secondary extra-small text-uppercase fw-bold border-bottom">
              <tr>
                {columnVisibility.user_info && renderSortHeader('User', 'user_info', 'ps-3.5 py-3')}
                {columnVisibility.full_name && renderSortHeader('Full Name', 'full_name')}
                {columnVisibility.location && renderSortHeader('Assigned Location', 'location')}
                {columnVisibility.role && renderSortHeader('Role', 'role')}
                {columnVisibility.contact && renderSortHeader('Contact', 'contact')}
                {columnVisibility.status && renderSortHeader('Status', 'status')}
                {columnVisibility.actions && <th className="text-end pe-3.5">Security Actions</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    <Users size={36} className="text-muted mb-2 opacity-50" />
                    <p className="small mb-1 fw-bold text-dark">No staff members found.</p>
                    <span className="extra-small text-muted">
                      Try adjusting your search criteria or click <strong>+ Add Staff Member</strong> to create a new account.
                    </span>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => {
                  const assignedBranch = branchesList.find(b =>
                    b.id === u.property || b.id === u.property_id
                  );
                  const locationLabel = assignedBranch
                    ? assignedBranch.name
                    : (u.property_name || user?.property_name || 'Primary Hotel');
                  const isBranchUnit = assignedBranch ? assignedBranch.is_branch : Boolean(u.is_branch);

                  return (
                    <tr key={u.id}>
                      {columnVisibility.user_info && (
                        <td className="ps-3.5">
                          <div className="d-flex align-items-center gap-2.5">
                            <div
                              className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold shadow-xs flex-shrink-0"
                              style={{
                                width: '34px',
                                height: '34px',
                                fontSize: '0.8rem',
                                backgroundColor: u.role === 'HOTEL_OWNER' ? '#0F172A' : (u.role === 'MANAGER' ? '#2563EB' : '#0D9488')
                              }}
                            >
                              {(u.first_name || u.username || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="fw-bold text-dark font-monospace">{u.username}</div>
                              <span className="extra-small text-muted font-monospace">ID #{u.id}</span>
                            </div>
                          </div>
                        </td>
                      )}

                      {columnVisibility.full_name && (
                        <td>
                          <div className="text-dark fw-semibold">
                            {u.first_name || u.last_name ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : '—'}
                          </div>
                        </td>
                      )}

                      {columnVisibility.location && (
                        <td>
                          <div className="d-flex align-items-center gap-1.5">
                            <span className={`badge extra-small ${isBranchUnit ? 'bg-info-subtle text-info border' : 'bg-primary-subtle text-primary border'}`}>
                              {isBranchUnit ? <GitBranch size={11} className="me-1 d-inline" /> : <Building2 size={11} className="me-1 d-inline" />}
                              {locationLabel}
                            </span>
                          </div>
                        </td>
                      )}

                      {columnVisibility.role && (
                        <td>
                          <span className={`badge rounded-pill extra-small fw-bold px-2.5 py-1 ${
                            u.role === 'HOTEL_OWNER'
                              ? 'bg-dark text-white'
                              : (u.role === 'MANAGER' ? 'bg-primary text-white' : 'bg-success text-white')
                          }`}>
                            {u.role}
                          </span>
                        </td>
                      )}

                      {columnVisibility.contact && (
                        <td>
                          <div className="text-muted extra-small text-truncate" style={{ maxWidth: '180px' }}>
                            {u.email || 'No email attached'}
                          </div>
                        </td>
                      )}

                      {columnVisibility.status && (
                        <td>
                          <button
                            type="button"
                            className={`badge border-0 rounded-pill px-2.5 py-1 extra-small fw-bold ${u.is_active ? 'bg-success text-white' : 'bg-danger text-white'}`}
                            onClick={() => handleToggleActive(u)}
                            disabled={actionUserId === u.id || u.id === user?.id}
                            title="Click to toggle status"
                          >
                            {u.is_active ? 'ACTIVE' : 'SUSPENDED'}
                          </button>
                        </td>
                      )}

                      {columnVisibility.actions && (
                        <td className="text-end pe-3.5">
                          <div className="d-flex align-items-center justify-content-end gap-1.5">
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm px-2 py-1 extra-small rounded-2 d-flex align-items-center gap-1"
                              onClick={() => handleOpenResetModal(u)}
                              title="Reset staff password"
                            >
                              <Key size={13} />
                              <span>Reset Password</span>
                            </button>

                            {u.id !== user?.id && u.role !== 'HOTEL_OWNER' && (
                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm p-1 extra-small rounded-2"
                                onClick={() => handleDeleteUser(u)}
                                disabled={actionUserId === u.id}
                                title="Delete staff account"
                              >
                                <Trash2 size={14} />
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

      {/* MODAL: ADD STAFF MEMBER */}
      {showAddModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden">
              <div className="modal-header border-bottom px-4 py-3.5 bg-dark text-white">
                <div className="d-flex align-items-center gap-2.5">
                  <div className="p-2 rounded-3 text-white" style={{ backgroundColor: '#0284C7' }}>
                    <UserPlus size={18} />
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold mb-0 text-white">Add Staff Member</h5>
                    <span className="extra-small text-white-50">Create manager or receptionist account for any branch</span>
                  </div>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddModal(false)}></button>
              </div>

              <form onSubmit={handleAddUserSubmit}>
                <div className="modal-body p-4">
                  {/* Assigned Location */}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark">Assigned Hotel Location / Branch *</label>
                    <select
                      className="form-select"
                      required
                      value={formData.property}
                      onChange={(e) => setFormData({ ...formData, property: e.target.value })}
                    >
                      {branchesList.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.is_branch ? `Branch: ${b.name} (${b.property_code})` : `Primary: ${b.name} (${b.property_code})`}
                        </option>
                      ))}
                    </select>
                    <span className="extra-small text-muted mt-1 d-block">
                      The staff member will be strictly authorized for front desk operations in this unit.
                    </span>
                  </div>

                  {/* Role Selection */}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark">Staff Role *</label>
                    <select
                      className="form-select"
                      required
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="RECEPTIONIST">Receptionist (Front-Desk &amp; Reservations)</option>
                      <option value="MANAGER">Branch Manager (Operations Supervisor)</option>
                    </select>
                  </div>

                  {/* Username & Password */}
                  <div className="row g-3 mb-3">
                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-semibold text-dark">Username *</label>
                      <input
                        type="text"
                        className="form-control font-monospace"
                        required
                        placeholder="e.g. branch_mgr_01"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                      />
                    </div>
                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-semibold text-dark">Temporary Password</label>
                      <input
                        type="text"
                        className="form-control font-monospace"
                        placeholder="e.g. Staff@1234 (or leave blank)"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Name Fields */}
                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-dark">First Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="First Name"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-dark">Last Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Last Name"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="mb-2">
                    <label className="form-label small fw-semibold text-dark">Email Address (Optional)</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="staff@hotel.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-footer border-top px-4 py-3 bg-light d-flex justify-content-between">
                  <button type="button" className="btn btn-light fw-bold" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary fw-bold px-4 text-white d-flex align-items-center gap-2"
                    disabled={submitting}
                    style={{ background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)' }}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        Creating Account...
                      </>
                    ) : (
                      'Create Staff Member'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RESET PASSWORD */}
      {showResetModal && userToReset && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden">
              <div className="modal-header border-bottom px-4 py-3.5 bg-dark text-white">
                <div className="d-flex align-items-center gap-2">
                  <Key size={18} className="text-warning" />
                  <h5 className="modal-title fw-bold mb-0 text-white">Reset Staff Password</h5>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowResetModal(false)}></button>
              </div>

              <form onSubmit={handleResetPasswordSubmit}>
                <div className="modal-body p-4">
                  <p className="text-secondary small mb-3">
                    Set a new password for <strong>{userToReset.username}</strong> ({userToReset.role}). If left empty, a secure password will be automatically generated.
                  </p>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark">New Password</label>
                    <input
                      type="text"
                      className="form-control font-monospace"
                      placeholder="Enter custom password or leave blank for auto-generate"
                      value={customNewPassword}
                      onChange={(e) => setCustomNewPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-footer border-top px-4 py-3 bg-light d-flex justify-content-between">
                  <button type="button" className="btn btn-light fw-bold" onClick={() => setShowResetModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary fw-bold px-4 text-white d-flex align-items-center gap-2"
                    disabled={resetting}
                  >
                    {resetting ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        Resetting...
                      </>
                    ) : (
                      'Confirm Password Reset'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREDENTIALS CREATED / RESET POPUP */}
      {showCredentialsModal && createdCredentials && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden">
              <div className="modal-header border-bottom px-4 py-3.5 bg-success text-white">
                <div className="d-flex align-items-center gap-2">
                  <CheckCircle2 size={22} />
                  <h5 className="modal-title fw-bold mb-0">{createdCredentials.title}</h5>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowCredentialsModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <p className="text-secondary small mb-3">
                  {createdCredentials.subtitle}
                </p>
                <div className="p-3.5 bg-light rounded-4 border d-flex flex-column gap-2.5">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted extra-small">Hotel Location:</span>
                    <strong className="text-dark small">{createdCredentials.property_name}</strong>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted extra-small">Role:</span>
                    <span className="badge bg-primary-subtle text-primary extra-small">{createdCredentials.role}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted extra-small">Username:</span>
                    <strong className="text-dark small font-monospace">{createdCredentials.username}</strong>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted extra-small">Password:</span>
                    <strong className="text-primary small font-monospace">{createdCredentials.password}</strong>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-top px-4 py-3 bg-light d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary flex-grow-1 fw-bold py-2 rounded-3 d-flex align-items-center justify-content-center gap-1.5"
                  onClick={() => {
                    copyToClipboard(
                      `🏨 Hotel: ${createdCredentials.property_name}\n👤 Role: ${createdCredentials.role}\n🔑 Username: ${createdCredentials.username}\n🔒 Password: ${createdCredentials.password}\n🌐 Portal: ${window.location.origin}/LMS-React/`
                    );
                  }}
                >
                  <Copy size={15} /> Copy Credentials
                </button>
                <button
                  type="button"
                  className="btn btn-dark flex-grow-1 fw-bold py-2 rounded-3"
                  onClick={() => setShowCredentialsModal(false)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ROLE PERMISSION MATRIX MODAL */}
      {showPermModal && (
        <RolePermissionMatrixModal
          isOpen={showPermModal}
          onClose={() => setShowPermModal(false)}
        />
      )}
    </div>
  );
};

export default StaffManagement;
