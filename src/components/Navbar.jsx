import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useShift } from '../context/ShiftContext';
import { searchCustomersApi } from '../api/customerApi';
import { getDashboardReportApi, getOperationalRemindersApi } from '../api/reportApi';
import { getCurrentShiftApi } from '../api/shiftApi';
import { formatCurrency } from '../utils/formatCurrency';
import GlobalFeatureSearch from './GlobalFeatureSearch';
import {
  Search,
  Bell,
  Calendar,
  Clock,
  User,
  LogOut,
  ShieldCheck,
  ChevronDown,
  UserCheck,
  UserX,
  AlertCircle,
  AlertTriangle,
  Settings,
  BarChart3,
  DoorClosed,
  Users,
  KeyRound,
  Building2,
  GitBranch,
  Check,
  X,
  RefreshCw,
  BedDouble,
  DollarSign,
  Wallet,
  CheckCircle2,
  Sparkles,
  ArrowRight
} from 'lucide-react';

const Navbar = ({ title }) => {
  const {
    user,
    logout,
    hasRole,
    isSuperUser,
    isHotelOwner,
    subscription,
    isSubscriptionNearExpiry,
    isSubscriptionExpired,
    daysRemaining,
    branches,
    selectedProperty,
    switchProperty,
    isShiftWise
  } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef(null);
  const [isMac, setIsMac] = useState(false);

  // Real-time Clock in Asia/Kolkata
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  // Notification state
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
  const [notifications, setNotifications] = useState({
    checkins: 0,
    checkouts: 0,
    payments: 0
  });

  // User Profile Menu State
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef(null);

  // Branch Selector Dropdown State
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const branchMenuRef = useRef(null);

  // Automatically hide dropdown menus when clicking anywhere outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (branchMenuRef.current && !branchMenuRef.current.contains(event.target)) {
        setShowBranchMenu(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowNotifications(false);
        setShowProfileMenu(false);
        setShowBranchMenu(false);
      }
    };

    if (showNotifications || showProfileMenu || showBranchMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showNotifications, showProfileMenu, showBranchMenu]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const weekday = now.toLocaleDateString('en-IN', { weekday: 'short' });
      setDateStr(`${weekday}, ${day}/${month}/${year}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Shift Context & Till state
  const { shiftData: contextShiftData, refetchShift } = useShift();
  const [shiftInfo, setShiftInfo] = useState(null);
  const [cashUpdatedPulse, setCashUpdatedPulse] = useState(false);
  const prevCashRef = useRef(null);

  // Active shift data preferring context if present, fallback to local fetch
  const activeShiftData = contextShiftData || shiftInfo;

  const fetchLiveShift = useCallback(() => {
    if (isShiftWise) {
      getCurrentShiftApi()
        .then((data) => {
          if (data) setShiftInfo(data);
        })
        .catch(console.error);
      refetchShift?.();
    }
  }, [isShiftWise, refetchShift]);

  // Keep local state in sync when contextShiftData changes
  useEffect(() => {
    if (contextShiftData) {
      setShiftInfo(contextShiftData);
    }
  }, [contextShiftData]);

  // Track expected cash updates to trigger visual pulse feedback immediately
  const expectedCash = activeShiftData?.financials?.expected_cash;
  useEffect(() => {
    if (expectedCash !== undefined && prevCashRef.current !== null && prevCashRef.current !== expectedCash) {
      setCashUpdatedPulse(true);
      const timer = setTimeout(() => setCashUpdatedPulse(false), 2000);
      return () => clearTimeout(timer);
    }
    if (expectedCash !== undefined) {
      prevCashRef.current = expectedCash;
    }
  }, [expectedCash]);

  // Real-time Event listeners for immediate Till updates
  useEffect(() => {
    fetchLiveShift();

    const handleTillUpdate = () => {
      fetchLiveShift();
    };

    const handleStorageChange = (e) => {
      if (e.key === 'lms_last_shift_update') {
        fetchLiveShift();
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchLiveShift();
      }
    };

    window.addEventListener('shift-till-update-needed', handleTillUpdate);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleTillUpdate);
    document.addEventListener('visibilitychange', handleVisibility);

    // Periodic 15s background polling to guarantee till sync
    const interval = setInterval(fetchLiveShift, 15000);

    return () => {
      window.removeEventListener('shift-till-update-needed', handleTillUpdate);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleTillUpdate);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, [fetchLiveShift, selectedProperty?.id, isShiftWise]);

  // Real-time Operational Reminders state
  const [remindersData, setRemindersData] = useState(null);
  const [remindersLoading, setRemindersLoading] = useState(false);

  const fetchOperationalReminders = async () => {
    try {
      setRemindersLoading(true);
      const data = await getOperationalRemindersApi();
      if (data?.success) {
        setRemindersData(data);
      }
    } catch (err) {
      console.error('Failed to load operational reminders:', err);
    } finally {
      setRemindersLoading(false);
    }
  };

  useEffect(() => {
    fetchOperationalReminders();
    const interval = setInterval(fetchOperationalReminders, 60000); // 60s auto-polling
    return () => clearInterval(interval);
  }, [selectedProperty?.id]);

  const activeAlertsCount = remindersData?.counts?.active_alerts ?? 0;
  const urgentAlertsCount = remindersData?.counts?.urgent_count ?? 0;
  const remindersList = remindersData?.reminders || [];

  const handleToggleNotifications = () => {
    const nextState = !showNotifications;
    setShowNotifications(nextState);
    setShowProfileMenu(false);
    setShowBranchMenu(false);
    if (nextState) {
      fetchOperationalReminders();
    }
  };

  const getReminderIcon = (item) => {
    switch (item.id) {
      case 'overdue_checkouts':
        return <Clock size={16} />;
      case 'pending_dues':
        return <DollarSign size={16} />;
      case 'stale_shift':
      case 'no_active_shift':
        return <Wallet size={16} />;
      case 'pending_handover':
      case 'pending_shift_approvals':
        return <ShieldCheck size={16} />;
      case 'dirty_rooms':
        return <BedDouble size={16} />;
      case 'today_checkouts':
        return <UserX size={16} />;
      case 'today_checkins':
        return <UserCheck size={16} />;
      case 'maintenance_rooms':
        return <Settings size={16} />;
      case 'subscription_expiry':
        return <AlertTriangle size={16} />;
      default:
        return item.type === 'danger' ? <AlertCircle size={16} /> : <AlertTriangle size={16} />;
    }
  };

  const getReminderStyle = (type) => {
    if (type === 'danger') {
      return {
        bg: '#FEF2F2',
        border: '#FECACA',
        iconBg: '#FEE2E2',
        iconColor: '#DC2626',
        badgeBg: '#FEE2E2',
        badgeColor: '#B91C1C',
        badgeBorder: '#FCA5A5'
      };
    }
    if (type === 'warning') {
      return {
        bg: '#FFFBEB',
        border: '#FDE68A',
        iconBg: '#FEF3C7',
        iconColor: '#D97706',
        badgeBg: '#FEF3C7',
        badgeColor: '#B45309',
        badgeBorder: '#FCD34D'
      };
    }
    if (type === 'info') {
      return {
        bg: '#F0F9FF',
        border: '#BAE6FD',
        iconBg: '#E0F2FE',
        iconColor: '#0284C7',
        badgeBg: '#E0F2FE',
        badgeColor: '#0369A1',
        badgeBorder: '#7DD3FC'
      };
    }
    return {
      bg: '#F8FAFC',
      border: '#E2E8F0',
      iconBg: '#EFF6FF',
      iconColor: '#2563EB',
      badgeBg: '#EFF6FF',
      badgeColor: '#1D4ED8',
      badgeBorder: '#BFDBFE'
    };
  };

  const handleSearchChange = async (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.trim().length > 1) {
      try {
        const res = await searchCustomersApi(q);
        setSearchResults(res);
        setShowResults(true);
      } catch (err) {
        console.error(err);
      }
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  useEffect(() => {
    setIsMac(typeof navigator !== 'undefined' && navigator.platform?.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  // Global Ctrl+F / Cmd+F shortcut to immediately focus and select search input
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Trigger on Ctrl+F or Cmd+F
      if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
          if (searchQuery.trim().length > 1) {
            setShowResults(true);
          }
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [searchQuery]);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowResults(false);
      searchInputRef.current?.blur();
    } else if (e.key === 'Enter') {
      if (searchResults.length > 0) {
        handleSelectCustomer(searchResults[0]);
      } else if (searchQuery.trim()) {
        setShowResults(false);
        navigate(`/customers?search=${encodeURIComponent(searchQuery.trim())}`);
      }
    }
  };

  const handleSelectCustomer = (customer) => {
    setShowResults(false);
    setSearchQuery('');
    navigate(`/customers/${customer.id}`);
  };

  return (
    <header className="lms-topbar no-print border-bottom shadow-xs px-3 px-md-4 py-1 bg-white d-flex align-items-center justify-content-between gap-2">
      {/* Branch Selection / Active Property */}
      <div className="d-flex align-items-center gap-2 flex-shrink-0">
        {/* Dynamic Branch Selector for Hotel Owner / SuperAdmin / Superuser */}
        {branches && branches.length > 1 && (isHotelOwner || isSuperUser) ? (
          <div className="position-relative" ref={branchMenuRef}>
            <button
              type="button"
              onClick={() => {
                setShowBranchMenu(!showBranchMenu);
                setShowNotifications(false);
                setShowProfileMenu(false);
              }}
              className="btn d-inline-flex align-items-center gap-1.5 transition-all shadow-2xs"
              style={{
                backgroundColor: showBranchMenu ? '#F0F9FF' : '#FFFFFF',
                border: `1px solid ${showBranchMenu ? '#0284C7' : '#E2E8F0'}`,
                boxShadow: showBranchMenu
                  ? '0 0 0 3px rgba(2, 132, 199, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04)'
                  : '0 1px 2px rgba(0, 0, 0, 0.04)',
                borderRadius: '50px',
                padding: '3px 8px 3px 5px',
                height: '32px',
                cursor: 'pointer',
                transition: 'all 0.18s ease'
              }}
              title="Click to Switch Operating Branch"
            >
              {/* Branch Icon in Sleek Accent Badge */}
              <div
                className="d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: showBranchMenu ? 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)' : 'rgba(2, 132, 199, 0.1)',
                  color: showBranchMenu ? '#FFFFFF' : '#0284C7',
                  boxShadow: showBranchMenu ? '0 2px 6px rgba(2, 132, 199, 0.35)' : 'none',
                  transition: 'all 0.18s ease'
                }}
              >
                <GitBranch size={11} strokeWidth={2.4} />
              </div>

              <div className="d-flex align-items-center gap-1.5 overflow-hidden">
                <span
                  className="text-uppercase fw-bold text-muted d-none d-lg-inline"
                  style={{ fontSize: '0.625rem', letterSpacing: '0.06em' }}
                >
                  Branch
                </span>
                <span className="text-muted d-none d-lg-inline" style={{ fontSize: '0.65rem' }}>•</span>
                <span
                  className="text-dark fw-bold text-truncate"
                  style={{ fontSize: '0.75rem', maxWidth: 'clamp(90px, 12vw, 150px)', letterSpacing: '-0.01em' }}
                >
                  {selectedProperty?.name || user?.property_name || 'Select Branch'}
                </span>
                {(selectedProperty?.code || selectedProperty?.property_code) && (
                  <span
                    className="font-monospace fw-semibold px-1.5 py-0.5 rounded d-none d-sm-inline"
                    style={{
                      fontSize: '0.625rem',
                      backgroundColor: 'rgba(2, 132, 199, 0.08)',
                      color: '#0284C7',
                      border: '1px solid rgba(2, 132, 199, 0.2)'
                    }}
                  >
                    {selectedProperty.code || selectedProperty.property_code}
                  </span>
                )}
              </div>

              <ChevronDown
                size={11}
                className="text-muted flex-shrink-0"
                style={{
                  transform: showBranchMenu ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s ease',
                  marginLeft: '2px'
                }}
              />
            </button>

            {showBranchMenu && (
              <div
                className="position-absolute start-0 top-100 mt-1.5 bg-white rounded-4 shadow-xl border z-3 overflow-hidden animate-fadeIn"
                style={{
                  minWidth: '310px',
                  maxWidth: '340px',
                  borderColor: '#E2E8F0',
                  boxShadow: '0 20px 35px -8px rgba(15, 23, 42, 0.15), 0 8px 16px -4px rgba(15, 23, 42, 0.06)'
                }}
              >
                {/* Popover Header */}
                <div
                  className="px-3.5 py-2.5 border-bottom d-flex justify-content-between align-items-center"
                  style={{
                    background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
                    borderBottomColor: '#E2E8F0'
                  }}
                >
                  <div className="d-flex align-items-center gap-1.5">
                    <Building2 size={13} className="text-secondary" />
                    <span
                      className="text-uppercase fw-bold text-secondary"
                      style={{ fontSize: '0.66rem', letterSpacing: '0.08em' }}
                    >
                      Operating Branch
                    </span>
                  </div>
                  <span
                    className="badge rounded-pill fw-semibold font-monospace"
                    style={{
                      fontSize: '0.65rem',
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                      color: '#059669',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      padding: '2px 8px'
                    }}
                  >
                    {branches.length} Units
                  </span>
                </div>

                {/* Branch Options List */}
                <div className="p-1.5" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {branches.map((b) => {
                    const isCurrent = String(selectedProperty?.id) === String(b.id);
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setShowBranchMenu(false);
                          switchProperty(b);
                        }}
                        className="w-100 text-start border-0 d-flex align-items-center justify-content-between transition-all position-relative"
                        style={{
                          padding: '8px 10px',
                          margin: '2px 0',
                          borderRadius: '10px',
                          backgroundColor: isCurrent ? 'rgba(2, 132, 199, 0.08)' : 'transparent',
                          border: isCurrent ? '1px solid rgba(2, 132, 199, 0.3)' : '1px solid transparent',
                          cursor: 'pointer',
                          transition: 'all 0.18s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!isCurrent) {
                            e.currentTarget.style.backgroundColor = '#F8FAFC';
                            e.currentTarget.style.borderColor = '#E2E8F0';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isCurrent) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.borderColor = 'transparent';
                          }
                        }}
                      >
                        <div className="d-flex align-items-center gap-2.5 overflow-hidden">
                          {/* Mini Hotel Icon Badge */}
                          <div
                            className="d-flex align-items-center justify-content-center flex-shrink-0 transition-all"
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '9px',
                              background: isCurrent
                                ? 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)'
                                : '#F1F5F9',
                              color: isCurrent ? '#FFFFFF' : '#64748B',
                              boxShadow: isCurrent ? '0 3px 10px rgba(2, 132, 199, 0.35)' : 'none',
                              border: isCurrent ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid #E2E8F0'
                            }}
                          >
                            <Building2 size={15} strokeWidth={isCurrent ? 2.4 : 2} />
                          </div>

                          <div className="overflow-hidden">
                            <div
                              className="text-truncate fw-bold lh-sm"
                              style={{
                                fontSize: '0.8rem',
                                color: isCurrent ? '#0369A1' : '#1E293B'
                              }}
                            >
                              {b.name}
                            </div>
                            <div className="d-flex align-items-center gap-1.5 mt-0.5">
                              <span
                                className="font-monospace fw-semibold px-1 rounded"
                                style={{
                                  fontSize: '0.65rem',
                                  backgroundColor: isCurrent ? '#FFFFFF' : '#F1F5F9',
                                  color: isCurrent ? '#0284C7' : '#64748B',
                                  border: isCurrent ? '1px solid #BAE6FD' : '1px solid #E2E8F0'
                                }}
                              >
                                {b.code || b.property_code}
                              </span>
                              {b.city && (
                                <span className="text-muted" style={{ fontSize: '0.675rem' }}>
                                  • {b.city}
                                </span>
                              )}
                              {b.is_primary && (
                                <span
                                  className="badge rounded-pill fw-semibold"
                                  style={{
                                    fontSize: '0.6rem',
                                    backgroundColor: '#FEF3C7',
                                    color: '#92400E',
                                    border: '1px solid #FDE68A',
                                    padding: '1px 5px'
                                  }}
                                >
                                  Main Hotel
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {isCurrent ? (
                          <div
                            className="d-flex align-items-center justify-content-center flex-shrink-0 ms-2"
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              backgroundColor: 'rgba(2, 132, 199, 0.15)',
                              color: '#0284C7'
                            }}
                          >
                            <Check size={12} strokeWidth={3} />
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>

                {/* Manage Branches Footer Action */}
                {isHotelOwner && (
                  <div
                    className="p-2 border-top bg-light"
                    style={{ borderColor: '#E2E8F0' }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setShowBranchMenu(false);
                        navigate('/staff');
                      }}
                      className="btn btn-white btn-sm w-100 rounded-3 py-1.5 d-flex align-items-center justify-content-center gap-1.5 transition-all text-secondary fw-semibold border shadow-2xs"
                      style={{ fontSize: '0.75rem', borderColor: '#CBD5E1' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#0284C7';
                        e.currentTarget.style.borderColor = '#0284C7';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#475569';
                        e.currentTarget.style.borderColor = '#CBD5E1';
                      }}
                    >
                      <Settings size={13} />
                      <span>Manage Branches & Staff</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (selectedProperty?.name || user?.property_name) ? (
          <div
            className="d-inline-flex align-items-center gap-1.5 px-2.5 py-1 rounded-pill bg-white border shadow-2xs"
            style={{ borderColor: '#E2E8F0', fontSize: '0.75rem', height: '32px' }}
            title="Active Hotel Branch"
          >
            <div
              className="d-flex align-items-center justify-content-center flex-shrink-0"
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: 'rgba(2, 132, 199, 0.1)',
                color: '#0284C7'
              }}
            >
              <Building2 size={11} strokeWidth={2.4} />
            </div>
            <span className="fw-bold text-dark text-truncate" style={{ maxWidth: 'clamp(100px, 16vw, 180px)' }}>
              {selectedProperty?.name || user?.property_name}
            </span>
            {(selectedProperty?.code || selectedProperty?.property_code || user?.property_code) && (
              <span
                className="font-monospace fw-semibold px-1 rounded d-none d-sm-inline"
                style={{
                  fontSize: '0.625rem',
                  backgroundColor: '#F1F5F9',
                  color: '#64748B',
                  border: '1px solid #E2E8F0'
                }}
              >
                {selectedProperty?.code || selectedProperty?.property_code || user?.property_code}
              </span>
            )}
          </div>
        ) : null}
      </div>

      <div className="d-flex align-items-center gap-2 gap-md-2.5 flex-nowrap ms-auto">
        {/* Global Search Bar (Guest & Booking) */}
        <div className="position-relative" style={{ width: 'clamp(150px, 16vw, 240px)' }}>
          <div
            className="input-group input-group-sm rounded-3 overflow-hidden border bg-white d-flex align-items-center"
            style={{
              height: '32px',
              borderColor: isSearchFocused ? '#0284C7' : '#E2E8F0',
              boxShadow: isSearchFocused ? '0 0 0 2px rgba(2, 132, 199, 0.15)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <span
              className="bg-transparent border-0 d-flex align-items-center flex-shrink-0"
              style={{
                paddingLeft: '10px',
                paddingRight: '6px',
                color: isSearchFocused ? '#0284C7' : '#64748B'
              }}
            >
              <Search size={14} strokeWidth={2.2} />
            </span>
            <input
              ref={searchInputRef}
              type="text"
              className="form-control border-0 bg-transparent shadow-none ps-0 py-0 text-dark"
              style={{ fontSize: '0.78rem' }}
              placeholder="Search guest, booking..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => {
                setIsSearchFocused(true);
                if (searchQuery.length > 1) setShowResults(true);
              }}
              onBlur={() => {
                setIsSearchFocused(false);
                setTimeout(() => setShowResults(false), 200);
              }}
              onKeyDown={handleSearchKeyDown}
            />
            {/* Shortcut Badge / Clear button */}
            <div className="pe-2 d-flex align-items-center flex-shrink-0">
              {searchQuery ? (
                <button
                  type="button"
                  className="btn p-0 text-muted hover-dark border-0 d-flex align-items-center"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setShowResults(false);
                    searchInputRef.current?.focus();
                  }}
                  title="Clear search"
                  style={{ lineHeight: 1 }}
                >
                  <X size={13} />
                </button>
              ) : (
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => {
                    searchInputRef.current?.focus();
                    searchInputRef.current?.select();
                  }}
                  className="btn p-0 border-0 d-none d-sm-inline-flex align-items-center"
                  style={{ cursor: 'pointer' }}
                  title={`Press ${isMac ? '⌘F' : 'Ctrl+F'} to search guests & bookings`}
                >
                  <kbd
                    className="border px-1.5 py-0.5 rounded extra-small font-monospace"
                    style={{
                      fontSize: '0.625rem',
                      lineHeight: 1,
                      letterSpacing: '0.02em',
                      backgroundColor: '#F8FAFC',
                      borderColor: '#CBD5E1',
                      color: '#64748B'
                    }}
                  >
                    {isMac ? '⌘F' : 'Ctrl+F'}
                  </kbd>
                </button>
              )}
            </div>
          </div>

          {showResults && (
            <div className="position-absolute start-0 end-0 top-100 mt-1.5 bg-white border rounded-3 shadow-lg z-3 overflow-hidden" style={{ maxHeight: '360px', minWidth: '290px', overflowY: 'auto' }}>
              {searchResults.length === 0 ? (
                <div className="p-3 text-muted small text-center">
                  <div>No matching records found</div>
                  <div className="extra-small text-muted mt-1" style={{ fontSize: '0.7rem' }}>Search by Name, Mobile, ID, Booking #, or Room #</div>
                </div>
              ) : (
                searchResults.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 border-bottom hover-bg-light cursor-pointer d-flex justify-content-between align-items-center"
                    style={{ cursor: 'pointer' }}
                    onMouseDown={() => handleSelectCustomer(c)}
                  >
                    <div>
                      <div className="fw-semibold text-dark small">{c.full_name}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                        📞 {c.mobile} | ID: {c.id_number || 'N/A'}
                      </div>
                    </div>
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2">
                      View Profile
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Global Feature Search (AI-like page finder) */}
        <GlobalFeatureSearch />

        {/* Active Shift Till Pill Indicator (Shift-Wise Properties Only) */}
        {isShiftWise && (
          activeShiftData?.has_active_shift ? (
            <button
              type="button"
              onClick={() => navigate('/shifts')}
              className={`btn btn-sm d-flex align-items-center gap-1.5 rounded-pill px-2 py-0.5 text-decoration-none shadow-2xs transition-all flex-shrink-0 ${
                activeShiftData.shift?.is_stale || (activeShiftData.shift?.duration_minutes >= 720) ? 'border-warning' : ''
              }`}
              style={{
                backgroundColor: cashUpdatedPulse ? '#ECFDF5' : activeShiftData.shift?.is_stale ? '#FEF2F2' : (activeShiftData.shift?.duration_minutes >= 720) ? '#FFFBEB' : '#ECFDF5',
                border: `1px solid ${cashUpdatedPulse ? '#10B981' : activeShiftData.shift?.is_stale ? '#FECACA' : (activeShiftData.shift?.duration_minutes >= 720) ? '#FDE68A' : '#A7F3D0'}`,
                boxShadow: cashUpdatedPulse ? '0 0 10px rgba(16, 185, 129, 0.45)' : undefined,
                transform: cashUpdatedPulse ? 'scale(1.03)' : 'scale(1)',
                transition: 'all 0.25s ease-in-out',
                height: '32px',
                fontSize: '0.75rem'
              }}
              title={
                activeShiftData.shift?.is_stale ? `⚠️ Stale Shift open for ${Math.floor((activeShiftData.shift?.duration_minutes || 0) / 60)}h - Please close immediately!` :
                activeShiftData.shift?.duration_minutes >= 720 ? `⚠️ Shift running for ${Math.floor((activeShiftData.shift?.duration_minutes || 0) / 60)}h - Don't forget to close till` :
                "Click to manage Active Shift Till"
              }
            >
              {activeShiftData.shift?.is_stale ? (
                <span className="badge bg-danger text-white rounded-pill px-1 py-0.5 extra-small fw-bold" style={{ fontSize: '0.65rem' }}>
                  ⚠️ {Math.floor((activeShiftData.shift?.duration_minutes || 0) / 60)}h Stale
                </span>
              ) : activeShiftData.shift?.duration_minutes >= 720 ? (
                <span className="badge bg-warning text-dark rounded-pill px-1 py-0.5 extra-small fw-bold" style={{ fontSize: '0.65rem' }}>
                  ⚠️ {Math.floor((activeShiftData.shift?.duration_minutes || 0) / 60)}h Running
                </span>
              ) : (
                <span className="rounded-circle flex-shrink-0" style={{ width: '6px', height: '6px', backgroundColor: '#16A34A', boxShadow: cashUpdatedPulse ? '0 0 8px rgba(22, 163, 74, 1)' : '0 0 5px rgba(22, 163, 74, 0.6)' }}></span>
              )}
              <span className={`fw-bold ${activeShiftData.shift?.is_stale ? 'text-danger' : activeShiftData.shift?.duration_minutes >= 720 ? 'text-warning-emphasis' : 'text-success'}`} style={{ fontSize: '0.72rem' }}>
                Till #{activeShiftData.shift?.shift_number}
              </span>
              <span className={`font-monospace d-none d-sm-inline ${cashUpdatedPulse ? 'text-success fw-bold' : 'text-secondary'}`} style={{ fontSize: '0.72rem' }}>
                ({formatCurrency(activeShiftData.financials?.expected_cash || 0)})
              </span>
              {cashUpdatedPulse && (
                <span className="badge bg-success text-white rounded-pill px-1 extra-small fw-bold" style={{ fontSize: '0.6rem' }}>
                  Live
                </span>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/shifts')}
              className="btn btn-sm d-flex align-items-center gap-1.5 rounded-pill px-2 py-0.5 text-decoration-none transition-all flex-shrink-0"
              style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', height: '32px', fontSize: '0.75rem' }}
              title="Open Shift Till"
            >
              <Clock size={12} className="text-warning-emphasis" />
              <span className="fw-semibold text-warning-emphasis" style={{ fontSize: '0.72rem' }}>Open Shift</span>
            </button>
          )
        )}

        {/* Subscription Expiry Warning Pill (< 15 Days) */}
        {isSubscriptionNearExpiry && daysRemaining !== null && (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-subscription-expiry-modal'))}
            className="btn btn-sm d-flex align-items-center gap-1.5 rounded-pill px-2 py-0.5 text-decoration-none shadow-2xs transition-all flex-shrink-0"
            style={{
              backgroundColor: daysRemaining <= 5 ? '#FEF2F2' : daysRemaining <= 10 ? '#FFF7ED' : '#FFFBEB',
              border: `1px solid ${daysRemaining <= 5 ? '#FECACA' : daysRemaining <= 10 ? '#FED7AA' : '#FDE68A'}`,
              color: daysRemaining <= 5 ? '#991B1B' : daysRemaining <= 10 ? '#C2410C' : '#92400E',
              height: '32px',
              fontSize: '0.72rem'
            }}
            title="Subscription expiring soon! Click to view details and renewal options"
          >
            <span
              className="rounded-circle flex-shrink-0"
              style={{
                width: '6px',
                height: '6px',
                backgroundColor: daysRemaining <= 5 ? '#DC2626' : daysRemaining <= 10 ? '#EA580C' : '#D97706',
                boxShadow: daysRemaining <= 5 ? '0 0 5px rgba(220, 38, 38, 0.8)' : '0 0 5px rgba(217, 119, 6, 0.6)'
              }}
            ></span>
            <span className="fw-bold">
              {daysRemaining <= 5 ? '🔥 ' : '⚠️ '}
              {daysRemaining}d Left
            </span>
          </button>
        )}

        {/* Live Date & Time Indicator - Only on XL screens (>=1200px) */}
        <div
          className="d-none d-xl-flex align-items-center gap-2 px-2.5 py-1 rounded-pill text-secondary flex-shrink-0"
          style={{
            backgroundColor: '#F1F5F9',
            fontSize: '0.75rem',
            height: '32px',
            userSelect: 'none',
            whiteSpace: 'nowrap'
          }}
        >
          <div className="d-flex align-items-center gap-1.5 fw-medium text-dark flex-shrink-0">
            <Calendar size={12} className="text-primary flex-shrink-0" />
            <span style={{ fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum"' }}>{dateStr}</span>
          </div>
          <div className="border-start h-100 flex-shrink-0" style={{ height: '10px', borderColor: '#CBD5E1' }}></div>
          <div className="d-flex align-items-center gap-1.5 fw-semibold text-dark flex-shrink-0">
            <Clock size={12} className="text-primary flex-shrink-0" />
            <span
              className="font-monospace"
              style={{
                fontVariantNumeric: 'tabular-nums',
                fontFeatureSettings: '"tnum"',
                display: 'inline-block',
                minWidth: '88px',
                textAlign: 'left',
                letterSpacing: '0.02em'
              }}
            >
              {timeStr}
            </span>
          </div>
        </div>

        {/* Notification Bell Dropdown */}
        <div className="position-relative flex-shrink-0" ref={notificationRef}>
          <button
            onClick={handleToggleNotifications}
            className="btn btn-light border-0 rounded-circle position-relative p-0 d-flex align-items-center justify-content-center text-secondary hover-dark transition-all"
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: showNotifications ? '#EFF6FF' : '#F1F5F9',
              color: showNotifications ? '#2563EB' : '#64748B'
            }}
            title="Notifications & Operational Alerts"
          >
            <Bell size={15} />
            {activeAlertsCount > 0 && (
              <span
                className={`position-absolute top-0 start-100 translate-middle badge rounded-pill ${
                  urgentAlertsCount > 0 ? 'bg-danger' : 'bg-warning text-dark'
                } border border-white fw-bold shadow-xs`}
                style={{ fontSize: '0.55rem', padding: '0.2em 0.4em' }}
              >
                {activeAlertsCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div
              className="position-absolute end-0 top-100 mt-2 bg-white border-0 shadow-lg z-3 overflow-hidden animate-fadeIn"
              style={{
                width: '380px',
                borderRadius: '20px',
                boxShadow: '0 20px 45px -12px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(226, 232, 240, 0.85)',
                border: '1px solid rgba(226, 232, 240, 0.8)'
              }}
            >
              {/* Header Bar */}
              <div
                className="d-flex justify-content-between align-items-center border-bottom bg-white"
                style={{ padding: '14px 18px', borderColor: '#F1F5F9' }}
              >
                <div className="d-flex align-items-center gap-2">
                  <span
                    className="rounded-circle"
                    style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: urgentAlertsCount > 0 ? '#DC2626' : activeAlertsCount > 0 ? '#F59E0B' : '#22C55E',
                      boxShadow: urgentAlertsCount > 0 ? '0 0 6px rgba(220, 38, 38, 0.6)' : activeAlertsCount > 0 ? '0 0 6px rgba(245, 158, 11, 0.6)' : '0 0 6px rgba(34, 197, 94, 0.6)'
                    }}
                  ></span>
                  <div>
                    <span className="fw-bold text-dark" style={{ fontSize: '0.875rem', letterSpacing: '-0.01em' }}>
                      Operational Reminders
                    </span>
                    <div className="text-muted extra-small" style={{ fontSize: '0.68rem', lineHeight: 1 }}>
                      Real-time hotel bottleneck alerts
                    </div>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fetchOperationalReminders();
                    }}
                    disabled={remindersLoading}
                    className="btn btn-sm btn-light p-1 rounded-circle border-0 d-flex align-items-center justify-content-center text-muted hover-dark"
                    style={{ width: '26px', height: '26px' }}
                    title="Refresh live alerts"
                  >
                    <RefreshCw
                      size={12}
                      style={remindersLoading ? { animation: 'spin 1s linear infinite' } : {}}
                    />
                  </button>
                  <span
                    className="badge rounded-pill fw-semibold px-2 py-0.5"
                    style={{
                      backgroundColor: activeAlertsCount > 0 ? (urgentAlertsCount > 0 ? '#FEF2F2' : '#FFFBEB') : '#ECFDF5',
                      color: activeAlertsCount > 0 ? (urgentAlertsCount > 0 ? '#DC2626' : '#B45309') : '#059669',
                      border: `1px solid ${activeAlertsCount > 0 ? (urgentAlertsCount > 0 ? '#FECACA' : '#FDE68A') : '#A7F3D0'}`,
                      fontSize: '0.68rem'
                    }}
                  >
                    {activeAlertsCount > 0 ? `${activeAlertsCount} Active` : 'All Clear'}
                  </span>
                </div>
              </div>

              {/* Notification Cards List */}
              <div style={{ padding: '12px 14px', maxHeight: '380px', overflowY: 'auto' }} className="d-flex flex-column gap-2">
                {remindersList.length === 0 ? (
                  <div className="text-center py-4 px-2">
                    <div
                      className="mx-auto mb-2.5 d-flex align-items-center justify-content-center rounded-circle"
                      style={{ width: '46px', height: '46px', backgroundColor: '#ECFDF5', color: '#059669' }}
                    >
                      <CheckCircle2 size={24} />
                    </div>
                    <div className="fw-bold text-dark" style={{ fontSize: '0.88rem' }}>
                      All Caught Up!
                    </div>
                    <div className="text-muted extra-small mt-1" style={{ fontSize: '0.74rem', maxWidth: '240px', margin: '0 auto' }}>
                      No overdue departures, pending dues, or housekeeping bottlenecks right now.
                    </div>
                    {remindersData?.summary && (
                      <div className="d-flex align-items-center justify-content-center gap-1.5 mt-3 flex-wrap">
                        <span className="badge rounded-pill bg-light text-secondary border px-2 py-1" style={{ fontSize: '0.66rem' }}>
                          Occupied: <strong className="text-dark">{remindersData.summary.occupied_rooms}</strong>
                        </span>
                        <span className="badge rounded-pill bg-light text-secondary border px-2 py-1" style={{ fontSize: '0.66rem' }}>
                          Available: <strong className="text-success">{remindersData.summary.available_rooms}</strong>
                        </span>
                        <span className="badge rounded-pill bg-light text-secondary border px-2 py-1" style={{ fontSize: '0.66rem' }}>
                          Total: <strong className="text-dark">{remindersData.summary.total_rooms}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  remindersList.map((r) => {
                    const style = getReminderStyle(r.type);
                    return (
                      <div
                        key={r.id}
                        className="rounded-3 d-flex flex-column gap-1 transition-all"
                        onClick={() => {
                          setShowNotifications(false);
                          if (r.is_subscription) {
                            window.dispatchEvent(new CustomEvent('open-subscription-expiry-modal'));
                          } else if (r.route) {
                            navigate(r.route);
                          }
                        }}
                        style={{
                          padding: '10px 12px',
                          backgroundColor: style.bg,
                          border: `1px solid ${style.border}`,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div className="d-flex align-items-center justify-content-between gap-2">
                          <div className="d-flex align-items-center gap-2.5 overflow-hidden">
                            <div
                              className="d-flex align-items-center justify-content-center flex-shrink-0"
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '9px',
                                backgroundColor: style.iconBg,
                                color: style.iconColor
                              }}
                            >
                              {getReminderIcon(r)}
                            </div>
                            <div className="overflow-hidden">
                              <div className="d-flex align-items-center gap-1.5 flex-wrap">
                                <span className="fw-bold text-dark lh-sm" style={{ fontSize: '0.825rem' }}>
                                  {r.title}
                                </span>
                                {r.badge_label && (
                                  <span
                                    className="badge rounded-pill fw-bold"
                                    style={{
                                      fontSize: '0.6rem',
                                      backgroundColor: style.badgeBg,
                                      color: style.badgeColor,
                                      border: `1px solid ${style.badgeBorder}`,
                                      padding: '1px 6px'
                                    }}
                                  >
                                    {r.badge_label}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="d-flex align-items-center gap-1 flex-shrink-0">
                            <span className="text-primary fw-semibold extra-small d-none d-sm-inline" style={{ fontSize: '0.7rem' }}>
                              {r.action_label || 'View'}
                            </span>
                            <ArrowRight size={12} className="text-secondary" />
                          </div>
                        </div>

                        <div
                          className="text-secondary extra-small lh-sm"
                          style={{ fontSize: '0.725rem', paddingLeft: '42px' }}
                        >
                          {r.subtitle}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer Action Bar */}
              <div
                className="d-flex align-items-center justify-content-between border-top"
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#F8FAFC',
                  borderColor: '#F1F5F9',
                  fontSize: '0.75rem'
                }}
              >
                <span className="text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.7rem' }}>
                  <Clock size={11} className="text-muted" />
                  Live sync (60s)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifications(false);
                    navigate('/current-stays');
                  }}
                  className="btn btn-link p-0 text-primary fw-semibold text-decoration-none extra-small hover-underline d-flex align-items-center gap-1"
                  style={{ fontSize: '0.74rem' }}
                >
                  <span>Front Desk Folios</span>
                  <ArrowRight size={11} />
                </button>
              </div>
            </div>
          )}
        </div>


        {/* User Profile & Quick Management Dropdown */}
        <div className="position-relative flex-shrink-0" ref={profileRef}>
          <button
            onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
            className="btn btn-white border d-flex align-items-center shadow-2xs transition-all"
            style={{
              backgroundColor: showProfileMenu ? '#F8FAFC' : '#FFFFFF',
              borderColor: showProfileMenu ? '#CBD5E1' : '#E2E8F0',
              borderRadius: '50px',
              padding: '3px 8px 3px 4px',
              height: '32px',
              gap: '6px'
            }}
            type="button"
            title="User Profile & Quick Management"
          >
            <div
              className="text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-xs flex-shrink-0"
              style={{
                width: '24px',
                height: '24px',
                fontSize: '0.72rem',
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)'
              }}
            >
              {(user?.full_name || user?.username || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="text-start d-none d-md-block me-0.5">
              <div className="fw-semibold text-dark lh-1 text-truncate" style={{ fontSize: '0.75rem', maxWidth: '100px' }}>{user?.full_name || user?.username}</div>
              <div className="text-muted lh-1 mt-0.5" style={{ fontSize: '0.62rem', fontWeight: '500' }}>{user?.role || 'Receptionist'}</div>
            </div>
            <ChevronDown
              size={12}
              className="text-secondary transition-all flex-shrink-0"
              style={{
                transform: showProfileMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }}
            />
          </button>

          {showProfileMenu && (
            <div
              className="position-absolute end-0 top-100 mt-2 bg-white border-0 shadow-lg z-3 overflow-hidden animate-fadeIn"
              style={{
                width: '320px',
                borderRadius: '20px',
                boxShadow: '0 20px 45px -12px rgba(15, 23, 42, 0.2), 0 0 0 1px rgba(226, 232, 240, 0.9)',
                border: '1px solid rgba(226, 232, 240, 0.8)'
              }}
            >
              {/* Profile Header Card */}
              <div
                className="d-flex align-items-center gap-3 border-bottom"
                style={{
                  padding: '18px 20px',
                  backgroundColor: '#F8FAFC',
                  borderColor: '#F1F5F9'
                }}
              >
                <div
                  className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0 shadow-xs"
                  style={{
                    width: '44px',
                    height: '44px',
                    fontSize: '1.1rem',
                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)'
                  }}
                >
                  {(user?.full_name || user?.username || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <div className="fw-bold text-dark text-truncate lh-sm" style={{ fontSize: '0.95rem' }}>
                    {user?.full_name || user?.username}
                  </div>
                  <div className="d-flex align-items-center gap-1.5 mt-1.5">
                    <span className="rounded-circle" style={{ width: '7px', height: '7px', backgroundColor: '#22C55E', boxShadow: '0 0 6px rgba(34, 197, 94, 0.6)' }}></span>
                    <span className="text-secondary extra-small fw-semibold" style={{ fontSize: '0.725rem' }}>
                      {user?.role || 'Reception Staff'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Management Section */}
              <div style={{ padding: '12px 14px' }}>
                <div className="text-uppercase text-secondary fw-bold px-2 pt-1 pb-2" style={{ fontSize: '0.675rem', letterSpacing: '0.06em' }}>
                  Quick Management
                </div>

                {isHotelOwner && (
                  <button
                    type="button"
                    className="w-100 btn btn-light border-0 text-start d-flex align-items-center gap-3 py-2 px-2.5 rounded-3 text-dark hover-bg-light transition-all mb-1.5"
                    style={{ fontSize: '0.85rem', backgroundColor: 'transparent', borderRadius: '12px' }}
                    onClick={() => { setShowProfileMenu(false); navigate('/settings'); }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div
                      className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                      style={{ width: '34px', height: '34px', backgroundColor: '#EFF6FF', color: '#2563EB', borderRadius: '10px' }}
                    >
                      <Settings size={17} />
                    </div>
                    <div className="overflow-hidden pe-1">
                      <div className="fw-bold lh-sm text-dark" style={{ fontSize: '0.85rem' }}>System Settings</div>
                      <div className="text-secondary extra-small text-truncate mt-0.5" style={{ fontSize: '0.725rem' }}>Lodge &amp; system configuration</div>
                    </div>
                  </button>
                )}

                {isShiftWise && (
                  <button
                    type="button"
                    className="w-100 btn btn-light border-0 text-start d-flex align-items-center gap-3 py-2 px-2.5 rounded-3 text-dark hover-bg-light transition-all mb-1.5"
                    style={{ fontSize: '0.85rem', backgroundColor: 'transparent', borderRadius: '12px' }}
                    onClick={() => { setShowProfileMenu(false); navigate('/shifts'); }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div
                      className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                      style={{ width: '34px', height: '34px', backgroundColor: '#FEF3C7', color: '#D97706', borderRadius: '10px' }}
                    >
                      <Clock size={17} />
                    </div>
                    <div className="overflow-hidden pe-1">
                      <div className="fw-bold lh-sm text-dark" style={{ fontSize: '0.85rem' }}>Shift &amp; Cashier Till</div>
                      <div className="text-secondary extra-small text-truncate mt-0.5" style={{ fontSize: '0.725rem' }}>Open, close &amp; till handovers</div>
                    </div>
                  </button>
                )}

                <button
                  type="button"
                  className="w-100 btn btn-light border-0 text-start d-flex align-items-center gap-3 py-2 px-2.5 rounded-3 text-dark hover-bg-light transition-all mb-1.5"
                  style={{ fontSize: '0.85rem', backgroundColor: 'transparent', borderRadius: '12px' }}
                  onClick={() => { setShowProfileMenu(false); navigate('/current-stays'); }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div
                    className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                    style={{ width: '34px', height: '34px', backgroundColor: '#EFF6FF', color: '#2563EB', borderRadius: '10px' }}
                  >
                    <KeyRound size={17} />
                  </div>
                  <div className="overflow-hidden pe-1">
                    <div className="fw-bold lh-sm text-dark" style={{ fontSize: '0.85rem' }}>Current Stays</div>
                    <div className="text-secondary extra-small text-truncate mt-0.5" style={{ fontSize: '0.725rem' }}>In-house guests &amp; checkout</div>
                  </div>
                </button>

                <button
                  type="button"
                  className="w-100 btn btn-light border-0 text-start d-flex align-items-center gap-3 py-2 px-2.5 rounded-3 text-dark hover-bg-light transition-all mb-1.5"
                  style={{ fontSize: '0.85rem', backgroundColor: 'transparent', borderRadius: '12px' }}
                  onClick={() => { setShowProfileMenu(false); navigate('/reports'); }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div
                    className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                    style={{ width: '34px', height: '34px', backgroundColor: '#ECFDF5', color: '#059669', borderRadius: '10px' }}
                  >
                    <BarChart3 size={17} />
                  </div>
                  <div className="overflow-hidden pe-1">
                    <div className="fw-bold lh-sm text-dark" style={{ fontSize: '0.85rem' }}>Financial & Reports</div>
                    <div className="text-secondary extra-small text-truncate mt-0.5" style={{ fontSize: '0.725rem' }}>Revenue audit & settlement</div>
                  </div>
                </button>

                <button
                  type="button"
                  className="w-100 btn btn-light border-0 text-start d-flex align-items-center gap-3 py-2 px-2.5 rounded-3 text-dark hover-bg-light transition-all mb-1.5"
                  style={{ fontSize: '0.85rem', backgroundColor: 'transparent', borderRadius: '12px' }}
                  onClick={() => { setShowProfileMenu(false); navigate('/room-types'); }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div
                    className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                    style={{ width: '34px', height: '34px', backgroundColor: '#FFFBEB', color: '#D97706', borderRadius: '10px' }}
                  >
                    <DoorClosed size={17} />
                  </div>
                  <div className="overflow-hidden pe-1">
                    <div className="fw-bold lh-sm text-dark" style={{ fontSize: '0.85rem' }}>Room Categories</div>
                    <div className="text-secondary extra-small text-truncate mt-0.5" style={{ fontSize: '0.725rem' }}>Tariffs & inventory types</div>
                  </div>
                </button>

                <button
                  type="button"
                  className="w-100 btn btn-light border-0 text-start d-flex align-items-center gap-3 py-2 px-2.5 rounded-3 text-dark hover-bg-light transition-all"
                  style={{ fontSize: '0.85rem', backgroundColor: 'transparent', borderRadius: '12px' }}
                  onClick={() => { setShowProfileMenu(false); navigate('/customers'); }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div
                    className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                    style={{ width: '34px', height: '34px', backgroundColor: '#F5F3FF', color: '#7C3AED', borderRadius: '10px' }}
                  >
                    <Users size={17} />
                  </div>
                  <div className="overflow-hidden pe-1">
                    <div className="fw-bold lh-sm text-dark" style={{ fontSize: '0.85rem' }}>Customer Directory</div>
                    <div className="text-secondary extra-small text-truncate mt-0.5" style={{ fontSize: '0.725rem' }}>Guest records & history</div>
                  </div>
                </button>
              </div>

              {/* Logout Action */}
              <div className="border-top" style={{ borderColor: '#F1F5F9', backgroundColor: '#FAFAFA', padding: '12px 14px' }}>
                <button
                  type="button"
                  className="w-100 btn border-0 text-start d-flex align-items-center gap-3 py-2 px-2.5 rounded-3 text-danger transition-all"
                  style={{ fontSize: '0.85rem', backgroundColor: 'transparent', borderRadius: '12px' }}
                  onClick={() => { setShowProfileMenu(false); logout(); }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div
                    className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                    style={{ width: '34px', height: '34px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#DC2626', borderRadius: '10px' }}
                  >
                    <LogOut size={17} />
                  </div>
                  <div className="overflow-hidden pe-1">
                    <div className="fw-bold lh-sm text-danger" style={{ fontSize: '0.85rem' }}>Sign Out</div>
                    <div className="text-secondary extra-small text-truncate mt-0.5" style={{ fontSize: '0.725rem' }}>End current receptionist session</div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;

