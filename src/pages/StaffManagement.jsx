import React, { useState, useEffect } from 'react';
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
  const { user } = useAuth();
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

      queryClient.invalidateQueries({ queryKey: ['staff'] });
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
    try {
      const res = await toggleUserActiveApi(targetUser.id);
      showSuccess(res.message, 'Status Updated');
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    } catch (err) {
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
    try {
      await deleteUserApi(targetUser.id);
      showSuccess(`User '${targetUser.username}' has been deleted.`, 'User Deleted');
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    } catch (err) {
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

        {/* Table Content */}
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.875rem' }}>
            <thead className="bg-light text-secondary extra-small text-uppercase fw-bold border-bottom">
              <tr>
                <th className="ps-3.5 py-3">User</th>
                <th>Full Name</th>
                <th>Assigned Location</th>
                <th>Role</th>
                <th>Contact</th>
                <th>Status</th>
                <th className="text-end pe-3.5">Security Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const assignedBranch = branchesList.find(b =>
                  b.id === u.property || b.id === u.property_id
                );
                const locationLabel = assignedBranch
                  ? assignedBranch.name
                  : (u.property_name || user?.property_name || 'Primary Hotel');
                const isBranchUnit = assignedBranch ? assignedBranch.is_branch : Boolean(u.is_branch);

                return (
                  <tr key={u.id}>
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

                    <td>
                      <div className="text-dark fw-semibold">
                        {u.first_name || u.last_name ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : '—'}
                      </div>
                    </td>

                    <td>
                      <div className="d-flex align-items-center gap-1.5">
                        <span className={`badge extra-small ${isBranchUnit ? 'bg-info-subtle text-info border' : 'bg-primary-subtle text-primary border'}`}>
                          {isBranchUnit ? <GitBranch size={11} className="me-1 d-inline" /> : <Building2 size={11} className="me-1 d-inline" />}
                          {locationLabel}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span className={`badge rounded-pill extra-small fw-bold px-2.5 py-1 ${
                        u.role === 'HOTEL_OWNER'
                          ? 'bg-dark text-white'
                          : (u.role === 'MANAGER' ? 'bg-primary text-white' : 'bg-success text-white')
                      }`}>
                        {u.role}
                      </span>
                    </td>

                    <td>
                      <div className="text-muted extra-small text-truncate" style={{ maxWidth: '180px' }}>
                        {u.email || 'No email attached'}
                      </div>
                    </td>

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
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    <Users size={36} className="text-muted mb-2 opacity-50" />
                    <p className="small mb-1 fw-bold text-dark">No staff members found.</p>
                    <span className="extra-small text-muted">
                      Try adjusting your search criteria or click <strong>+ Add Staff Member</strong> to create a new account.
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
                    className="btn btn-primary fw-bold px-4 text-white"
                    disabled={submitting}
                    style={{ background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)' }}
                  >
                    {submitting ? 'Creating Account...' : 'Create Staff Member'}
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
                    className="btn btn-primary fw-bold px-4 text-white"
                    disabled={resetting}
                  >
                    {resetting ? 'Resetting...' : 'Confirm Password Reset'}
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
