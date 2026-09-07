import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  getPlatformPropertiesApi,
  getPlatformPropertyDetailApi,
  updatePlatformPropertyApi,
  createPlatformPropertyApi,
  togglePlatformPropertyStatusApi,
  resetPropertyOwnerPasswordApi,
  renewPropertySubscriptionApi,
  getPlatformSubscriptionsApi,
  createPlatformSubscriptionPlanApi,
  updatePlatformSubscriptionPlanApi,
  deletePlatformSubscriptionPlanApi,
  applyCustomSubscriptionApi,
  getPlatformHealthApi,
  addHotelBranchApi,
  toggleHotelBranchStatusApi,
  addPlatformStaffApi,
  deletePlatformStaffApi,
  resetPlatformStaffPasswordApi,
  recordPropertySubscriptionPaymentApi,
  deletePropertySubscriptionPaymentApi
} from '../api/platformApi';
import PageLoader from '../components/PageLoader';
import DeveloperLayout from '../layouts/DeveloperLayout';
import SaaSInvoicePrintModal from '../components/SaaSInvoicePrintModal';
import {
  Building2,
  Key,
  ShieldCheck,
  ShieldAlert,
  HardDrive,
  PlusCircle,
  Search,
  RefreshCw,
  Copy,
  CheckCircle2,
  Clock,
  Activity,
  Server,
  DollarSign,
  Users,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  BedDouble,
  Crown,
  Star,
  Lock,
  ExternalLink,
  ChevronRight,
  Layers,
  BarChart3,
  TrendingUp,
  Cpu,
  Database,
  Grid,
  ListFilter,
  Check,
  Zap,
  Globe,
  Radio,
  ArrowLeft,
  Filter,
  SlidersHorizontal,
  Mail,
  Phone,
  MapPin,
  CheckCheck,
  Save,
  Sliders,
  Power,
  Edit3,
  UserCheck,
  Eye,
  Settings2,
  CreditCard,
  DoorOpen,
  LayoutGrid,
  TableProperties,
  GitBranch,
  Receipt,
  FileText,
  BadgeCheck,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  CheckSquare,
  Square,
  UserPlus,
  Trash2,
  Shield,
  Printer,
  X
} from 'lucide-react';

const getSubscriptionDaysLeft = (sub) => {
  if (!sub) return 0;
  if (sub.valid_until) {
    const target = new Date(sub.valid_until);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }
  return sub.days_remaining !== undefined ? sub.days_remaining : 0;
};

const getIsSubscriptionExpired = (sub) => {
  if (!sub) return false;
  if (sub.valid_until) {
    const target = new Date(sub.valid_until);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    return target < today;
  }
  return Boolean(sub.is_expired);
};

const formatLocalDate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDefaultExpiryDate = (yearsAhead = 1) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + yearsAhead);
  return formatLocalDate(d);
};

const addMonthsToDateStr = (dateStr, months) => {
  const base = dateStr ? String(dateStr).split('T')[0].split(' ')[0] : getDefaultExpiryDate(1);
  const parts = base.split('-');
  if (parts.length < 3) return getDefaultExpiryDate(1);
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month + months, day);
  return formatLocalDate(d);
};

const addYearsToDateStr = (dateStr, years) => {
  const base = dateStr ? String(dateStr).split('T')[0].split(' ')[0] : getDefaultExpiryDate(years);
  const parts = base.split('-');
  if (parts.length < 3) return getDefaultExpiryDate(years);
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year + years, month, day);
  return formatLocalDate(d);
};

const getDynamicInvoiceNo = (hotelCode, year = new Date().getFullYear()) => {
  return `INV-LIC-${hotelCode || 'PROP'}-${year}-01`;
};

const getPlanVisualConfig = (code) => {
  const c = String(code || '').toUpperCase();
  if (c.includes('TRIAL')) {
    return {
      accentColor: '#0284C7',
      accentBg: '#F0F9FF',
      badgeText: 'EVALUATION',
      badgeBg: '#E0F2FE',
      badgeColor: '#0369A1',
      icon: Zap,
      tagline: 'Risk-free 14-day evaluation for hotel onboarding',
      isPopular: false,
      popularLabel: null,
      cardBorder: '1px solid #E2E8F0',
      cardShadow: '0 4px 18px 0 rgba(15, 23, 42, 0.05)',
      topStripGradient: 'linear-gradient(90deg, #0284C7 0%, #38BDF8 100%)'
    };
  }
  if (c.includes('GROWTH')) {
    return {
      accentColor: '#2563EB',
      accentBg: '#EFF6FF',
      badgeText: 'GROWTH SCALE',
      badgeBg: '#DBEAFE',
      badgeColor: '#1E40AF',
      icon: TrendingUp,
      tagline: 'Multi-cashier shifts, guest alerts & analytics',
      isPopular: true,
      popularLabel: 'MOST POPULAR',
      cardBorder: '2px solid #3B82F6',
      cardShadow: '0 12px 28px -4px rgba(59, 130, 246, 0.16), 0 4px 10px -2px rgba(59, 130, 246, 0.08)',
      topStripGradient: 'linear-gradient(90deg, #2563EB 0%, #60A5FA 100%)'
    };
  }
  if (c.includes('ENTERPRISE')) {
    return {
      accentColor: '#7C3AED',
      accentBg: '#F5F3FF',
      badgeText: 'ENTERPRISE',
      badgeBg: '#EDE9FE',
      badgeColor: '#5B21B6',
      icon: Crown,
      tagline: 'Unlimited rooms & priority technical concierge',
      isPopular: false,
      popularLabel: null,
      cardBorder: '1px solid #E2E8F0',
      cardShadow: '0 4px 18px 0 rgba(15, 23, 42, 0.05)',
      topStripGradient: 'linear-gradient(90deg, #7C3AED 0%, #A78BFA 100%)'
    };
  }
  // Default: Starter
  return {
    accentColor: '#059669',
    accentBg: '#ECFDF5',
    badgeText: 'ESSENTIAL PMS',
    badgeBg: '#D1FAE5',
    badgeColor: '#065F46',
    icon: Building2,
    tagline: 'Standard operations for boutique independent lodges',
    isPopular: false,
    popularLabel: null,
    cardBorder: '1px solid #E2E8F0',
    cardShadow: '0 4px 18px 0 rgba(15, 23, 42, 0.05)',
    topStripGradient: 'linear-gradient(90deg, #059669 0%, #34D399 100%)'
  };
};

const PlatformProperties = ({ initialTab = null }) => {
  const { user } = useAuth();
  const { showSuccess, showError, showConfirm } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const { tab: routeTab } = useParams();
  const navigate = useNavigate();

  const queryTab = searchParams.get('tab');
  const validTabs = ['overview', 'properties', 'subscriptions', 'health'];
  const resolvedInitialTab = (initialTab && validTabs.includes(initialTab))
    ? initialTab
    : (routeTab && validTabs.includes(routeTab))
    ? routeTab
    : (queryTab && validTabs.includes(queryTab))
    ? queryTab
    : 'properties';

  const [activeTab, setActiveTab] = useState(resolvedInitialTab);

  useEffect(() => {
    const target = initialTab || routeTab || queryTab;
    if (target && validTabs.includes(target) && target !== activeTab) {
      setSelectedHotel(null);
      setActiveTab(target);
    }
  }, [initialTab, routeTab, queryTab]);

  const handleSelectTab = (tab) => {
    setSelectedHotel(null);
    setActiveTab(tab);
    setSearchParams({ tab });
  };
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const queryClient = useQueryClient();

  const {
    data: propertiesData,
    isLoading: propertiesLoading,
    refetch: refetchProperties
  } = useQuery({
    queryKey: ['platform-properties'],
    queryFn: getPlatformPropertiesApi,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
  const properties = propertiesData?.properties || [];

  const {
    data: subscriptionsData = null,
    isLoading: subscriptionsLoading,
    refetch: refetchSubscriptions
  } = useQuery({
    queryKey: ['platform-subscriptions'],
    queryFn: getPlatformSubscriptionsApi,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const {
    data: healthData = null,
    isLoading: healthLoading,
    refetch: refetchHealth
  } = useQuery({
    queryKey: ['platform-health'],
    queryFn: getPlatformHealthApi,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const loading = propertiesLoading || subscriptionsLoading || healthLoading;
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'expiring' | 'suspended'

  // Column Visibility Filter State
  const [columnVisibility, setColumnVisibility] = useState({
    hotel: true,
    owner: true,
    capacity: true,
    billing: true,
    validity: true,
    status: true,
    actions: true
  });
  const [showColumnFilter, setShowColumnFilter] = useState(false);
  const columnFilterRef = React.useRef(null);

  // Column Sorting State
  const [sortField, setSortField] = useState('name'); // 'name' | 'owner' | 'capacity' | 'billing' | 'validity' | 'status'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const toggleColumn = (colKey) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [colKey]: !prev[colKey]
    }));
  };

  const setAllColumns = (val) => {
    setColumnVisibility({
      hotel: true, // Always keep hotel visible as primary anchor
      owner: val,
      capacity: val,
      billing: val,
      validity: val,
      status: val,
      actions: val
    });
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (columnFilterRef.current && !columnFilterRef.current.contains(e.target)) {
        setShowColumnFilter(false);
      }
    };
    if (showColumnFilter) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColumnFilter]);

  // Single Hotel Management Console State
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [hotelLoading, setHotelLoading] = useState(false);
  const [hotelSubTab, setHotelSubTab] = useState('governance'); // 'governance' | 'branches' | 'billing' | 'profile' | 'staff'
  const [hotelFormData, setHotelFormData] = useState({});
  const [savingHotel, setSavingHotel] = useState(false);

  // Modals
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [selectedPropertyForRenew, setSelectedPropertyForRenew] = useState(null);

  // Record Subscription Payment State
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [selectedBillForPayment, setSelectedBillForPayment] = useState(null);
  const [selectedHotelForPayment, setSelectedHotelForPayment] = useState(null);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [paymentFormData, setPaymentFormData] = useState({
    amount: '',
    payment_method: 'UPI',
    payment_status: 'PAID',
    transaction_reference: '',
    payment_date: new Date().toISOString().split('T')[0],
    notes: '',
    invoice_no: '',
    extend_months: 0
  });
  const [recordingPayment, setRecordingPayment] = useState(false);

  // Subscription Plan Management State
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planFormData, setPlanFormData] = useState({
    code: '',
    name: '',
    max_rooms: 15,
    price_monthly: 999,
    price_annually: 9999,
    features: '',
    is_active: true
  });
  const [savingPlan, setSavingPlan] = useState(false);

  // Custom Bespoke Subscription Modal State
  const [showCustomSubModal, setShowCustomSubModal] = useState(false);
  const [customSubFormData, setCustomSubFormData] = useState({
    property_id: '',
    plan_name: '',
    custom_rooms: 25,
    custom_charges: 9999,
    custom_expiry_date: '',
    billing_cycle: 'ANNUAL',
    payment_status: 'PAID',
    features: ''
  });
  const [savingCustomSub, setSavingCustomSub] = useState(false);

  // Live Health Check Ping State
  const [healthRefreshing, setHealthRefreshing] = useState(false);
  const [subFilterQuery, setSubFilterQuery] = useState('');

  // Branch Form
  const [branchFormData, setBranchFormData] = useState({
    name: '',
    code: '',
    city: '',
    state: '',
    address: '',
    total_rooms: 10
  });
  const [addingBranch, setAddingBranch] = useState(false);

  // Developer Staff Management Console State
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [staffFormData, setStaffFormData] = useState({
    username: '',
    email: '',
    role: 'RECEPTIONIST',
    password: '',
    first_name: '',
    last_name: '',
    property_id: ''
  });
  const [addingStaff, setAddingStaff] = useState(false);
  const [staffBranchFilter, setStaffBranchFilter] = useState('all');
  const [deletingStaffId, setDeletingStaffId] = useState(null);
  const [showResetStaffModal, setShowResetStaffModal] = useState(false);
  const [staffToReset, setStaffToReset] = useState(null);
  const [newStaffPasswordInput, setNewStaffPasswordInput] = useState('');
  const [resettingStaff, setResettingStaff] = useState(false);

  // SaaS Subscription Bill Print Modal State
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedBillForPrint, setSelectedBillForPrint] = useState(null);
  const [selectedBillHotel, setSelectedBillHotel] = useState(null);

  const handleOpenPrintBill = (bill, hotel = null) => {
    setSelectedBillForPrint(bill);
    setSelectedBillHotel(hotel || selectedHotel);
    setShowBillModal(true);
  };

  // Global Onboard Form
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    subdomain: '',
    owner_name: '',
    owner_email: '',
    owner_phone: '',
    owner_username: '',
    owner_password: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstin: '',
    total_rooms: 15,
    plan_code: 'STARTER',
    billing_cycle: 'ANNUAL',
    operation_mode: 'SHIFT_WISE'
  });
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const loadAllPlatformData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['platform-properties'], refetchType: 'none' }),
      queryClient.invalidateQueries({ queryKey: ['platform-subscriptions'], refetchType: 'none' }),
      queryClient.invalidateQueries({ queryKey: ['platform-health'], refetchType: 'none' }),
    ]);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Open Dedicated Hotel Console
  const handleOpenHotelConsole = async (propertyId) => {
    setHotelLoading(true);
    try {
      const res = await getPlatformPropertyDetailApi(propertyId);
      if (res.property) {
        setSelectedHotel(res.property);
        setStaffBranchFilter('all');
        setHotelFormData({
          name: res.property.name,
          code: res.property.code,
          total_rooms: res.property.total_rooms,
          overall_capacity: res.property.overall_capacity,
          owner_name: res.property.owner_name,
          owner_email: res.property.owner_email,
          owner_phone: res.property.owner_phone,
          address: res.property.address || '',
          city: res.property.city || '',
          state: res.property.state || '',
          pincode: res.property.pincode || '',
          gstin: res.property.gstin || '',
          subdomain: res.property.subdomain || '',
          valid_until: res.property.subscription?.valid_until || getDefaultExpiryDate(1),
          plan_code: res.property.subscription?.plan_code || 'STARTER',
          billing_cycle: res.property.subscription?.billing_cycle || 'ANNUAL',
          billing_amount: res.property.subscription?.billing_amount || 9999.00,
          payment_status: res.property.subscription?.payment_status || 'PAID',
          is_active: res.property.is_active,
          operation_mode: res.property.operation_mode || 'SHIFT_WISE'
        });
      }
    } catch (err) {
      console.error('Failed to load hotel management console:', err);
      const errorDetail = err.response?.data?.error || err.response?.data?.detail || err.message || 'Network or server error';
      showError(`Failed to load hotel management console: ${errorDetail}`, 'Load Failed');
    } finally {
      setHotelLoading(false);
    }
  };

  // Save changes from Hotel Console
  const handleSaveHotelSettings = async (e) => {
    if (e) e.preventDefault();
    if (!selectedHotel) return;
    setSavingHotel(true);
    try {
      const res = await updatePlatformPropertyApi(selectedHotel.id, hotelFormData);
      showSuccess(`Hotel settings for "${hotelFormData.name}" updated successfully!`, 'Settings Saved');
      showToast(`Hotel settings for "${hotelFormData.name}" updated successfully!`);
      if (res.property) {
        setSelectedHotel(res.property);
      }
      loadAllPlatformData();
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to update hotel settings.', 'Update Failed');
    } finally {
      setSavingHotel(false);
    }
  };

  // Add Branch Handler
  const handleAddBranchSubmit = async (e) => {
    e.preventDefault();
    if (!selectedHotel) return;
    setAddingBranch(true);
    setShowAddBranchModal(false);
    try {
      const res = await addHotelBranchApi(selectedHotel.id, branchFormData);
      showSuccess(`Branch "${branchFormData.name}" added successfully to ${selectedHotel.name}!`, 'Branch Created');
      showToast(`Branch "${branchFormData.name}" added successfully!`);
      setBranchFormData({
        name: '',
        code: '',
        city: '',
        state: '',
        address: '',
        total_rooms: 10
      });
      // Refresh hotel detail
      const updated = await getPlatformPropertyDetailApi(selectedHotel.id);
      if (updated.property) setSelectedHotel(updated.property);
      loadAllPlatformData();
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to add branch.', 'Branch Creation Failed');
    } finally {
      setAddingBranch(false);
    }
  };

  // Toggle Branch Status
  const handleToggleBranchStatus = async (branchId) => {
    if (!selectedHotel) return;
    // Optimistic toggle
    setSelectedHotel((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        branches: (prev.branches || []).map((b) => (b.id === branchId ? { ...b, is_active: !b.is_active } : b)),
      };
    });
    try {
      const res = await toggleHotelBranchStatusApi(selectedHotel.id, branchId);
      showSuccess(res.message || 'Branch status updated successfully.', 'Status Updated');
      showToast(res.message);
      loadAllPlatformData();
    } catch (err) {
      showError('Failed to toggle branch status.', 'Action Failed');
      loadAllPlatformData();
    }
  };

  const handleToggleStatus = async (id, name) => {
    // Optimistic toggle status in cache
    queryClient.setQueryData(['platform-properties'], (old) => {
      if (!old || !Array.isArray(old.properties)) return old;
      return {
        ...old,
        properties: old.properties.map((p) => (p.id === id ? { ...p, is_active: !p.is_active } : p)),
      };
    });
    if (selectedHotel && selectedHotel.id === id) {
      setSelectedHotel((prev) => (prev ? { ...prev, is_active: !prev.is_active } : prev));
      setHotelFormData((prev) => ({ ...prev, is_active: !prev.is_active }));
    }

    try {
      const res = await togglePlatformPropertyStatusApi(id);
      showSuccess(`Hotel status updated: ${res.message}`, 'Status Updated');
      showToast(`Hotel status updated: ${res.message}`);
      loadAllPlatformData();
    } catch (err) {
      showError('Failed to toggle status.', 'Action Failed');
      loadAllPlatformData();
    }
  };

  const handleResetPassword = (id, propName) => {
    showConfirm({
      title: 'Reset Owner Password',
      message: `Reset owner password for ${propName}? A temporary secure password will be generated.`,
      confirmText: 'Reset Password',
      confirmVariant: 'warning',
      onConfirm: async () => {
        try {
          const res = await resetPropertyOwnerPasswordApi(id);
          setCreatedCredentials({
            property_name: propName,
            username: res.username,
            password: res.new_password
          });
          setShowCredentialsModal(true);
          showSuccess(`Owner password for "${propName}" has been reset.`, 'Password Reset');
        } catch (err) {
          showError('Failed to reset owner password.', 'Action Failed');
        }
      }
    });
  };

  // Open Add Staff Modal
  const handleOpenAddStaffModal = (targetPropertyId = null) => {
    setStaffFormData({
      username: '',
      email: '',
      role: 'RECEPTIONIST',
      password: '',
      first_name: '',
      last_name: '',
      property_id: targetPropertyId || selectedHotel?.id || ''
    });
    setShowAddStaffModal(true);
  };

  // Submit Add Staff
  const handleAddStaffSubmit = async (e) => {
    e.preventDefault();
    if (!selectedHotel) return;
    setAddingStaff(true);
    try {
      const res = await addPlatformStaffApi(selectedHotel.id, staffFormData);
      showSuccess(`Staff user "${res.user?.username || staffFormData.username}" created successfully!`, 'Staff Created');
      showToast(`User "${res.user?.username || staffFormData.username}" created successfully!`);
      setShowAddStaffModal(false);

      // Open credentials modal
      setCreatedCredentials({
        title: 'Staff Account Created',
        subtitle: 'Please share these credentials with the branch manager or staff member:',
        property_name: res.user.property_name,
        role: res.user.role,
        username: res.user.username,
        password: res.user.temporary_password
      });
      setShowCredentialsModal(true);

      // Refresh hotel detail
      const updated = await getPlatformPropertyDetailApi(selectedHotel.id);
      if (updated.property) setSelectedHotel(updated.property);
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to create staff user.', 'Creation Failed');
    } finally {
      setAddingStaff(false);
    }
  };

  // Delete Staff User
  const handleDeleteStaff = (userId, username) => {
    if (!selectedHotel) return;
    showConfirm({
      title: 'Remove Staff Account',
      message: `Are you sure you want to remove user "${username}"? This action cannot be undone.`,
      confirmText: 'Remove Staff',
      confirmVariant: 'danger',
      onConfirm: async () => {
        setDeletingStaffId(userId);
        try {
          await deletePlatformStaffApi(selectedHotel.id, userId);
          showSuccess(`Staff user "${username}" removed successfully.`, 'Staff Removed');
          showToast(`User "${username}" removed successfully.`);
          const updated = await getPlatformPropertyDetailApi(selectedHotel.id);
          if (updated.property) setSelectedHotel(updated.property);
        } catch (err) {
          showError(err.response?.data?.error || 'Failed to remove user.', 'Action Failed');
        } finally {
          setDeletingStaffId(null);
        }
      }
    });
  };

  // Open Reset Staff Modal
  const handleOpenResetStaffModal = (staff) => {
    setStaffToReset(staff);
    setNewStaffPasswordInput('');
    setShowResetStaffModal(true);
  };

  // Submit Reset Staff Password
  const handleResetStaffPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!selectedHotel || !staffToReset) return;
    setResettingStaff(true);
    try {
      const res = await resetPlatformStaffPasswordApi(selectedHotel.id, staffToReset.id, newStaffPasswordInput || null);
      setShowResetStaffModal(false);
      setCreatedCredentials({
        title: 'Password Reset Successful',
        subtitle: 'New security credentials generated for staff user:',
        property_name: staffToReset.property_name,
        role: staffToReset.role,
        username: res.username,
        password: res.new_password
      });
      setShowCredentialsModal(true);
      showSuccess(`Password for staff "${staffToReset.username}" reset successfully!`, 'Password Reset');
      showToast(res.message);
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to reset password.', 'Action Failed');
    } finally {
      setResettingStaff(false);
      setStaffToReset(null);
    }
  };

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await createPlatformPropertyApi(formData);
      setShowOnboardModal(false);
      setCreatedCredentials(res.owner_credentials);
      setShowCredentialsModal(true);
      showSuccess(`Hotel "${res.property?.name || formData.name}" onboarded successfully! Credentials generated.`, 'Hotel Onboarded');
      setFormData({
        name: '',
        code: '',
        subdomain: '',
        owner_name: '',
        owner_email: '',
        owner_phone: '',
        owner_username: '',
        owner_password: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        gstin: '',
        total_rooms: 15,
        plan_code: 'STARTER',
        billing_cycle: 'ANNUAL',
        operation_mode: 'SHIFT_WISE'
      });
      loadAllPlatformData();
    } catch (err) {
      showError(err.response?.data?.error || err.response?.data?.message || 'Failed to onboard hotel.', 'Onboarding Failed');
    } finally {
      setSubmitting(false);
    }
  };


  const handleRenewSubmit = async (months, planCode) => {
    if (!selectedPropertyForRenew) return;
    try {
      await renewPropertySubscriptionApi(selectedPropertyForRenew.id, {
        months,
        plan_code: planCode
      });
      setShowRenewModal(false);
      showSuccess(`Subscription for "${selectedPropertyForRenew.name}" successfully updated!`, 'Subscription Renewed');
      showToast(`Subscription for ${selectedPropertyForRenew.name} successfully updated!`);
      if (selectedHotel && selectedHotel.id === selectedPropertyForRenew.id) {
        handleOpenHotelConsole(selectedHotel.id);
      }
      loadAllPlatformData();
    } catch (err) {
      showError('Failed to renew subscription.', 'Renewal Failed');
    }
  };

  // Open Record Payment Modal (for recording a new payment settlement)
  const handleOpenRecordPayment = (bill = null, targetHotel = null) => {
    const hotel = targetHotel || selectedHotel;
    if (!hotel) return;
    setEditingPaymentId(null);
    setSelectedHotelForPayment(hotel);
    const activeSub = hotel?.subscription;
    const defaultAmount = bill?.amount || activeSub?.billing_amount || 9999;
    const defaultInvoice = bill?.invoice_no || `INV-LIC-${hotel?.code || 'HOTEL'}-${new Date().getFullYear()}-01`;
    setSelectedBillForPayment(bill);
    setPaymentFormData({
      amount: defaultAmount,
      payment_method: bill?.payment_method || 'UPI',
      payment_status: bill?.status || 'PAID',
      transaction_reference: '',
      payment_date: new Date().toISOString().split('T')[0],
      notes: '',
      invoice_no: defaultInvoice,
      extend_months: 0
    });
    setShowRecordPaymentModal(true);
  };

  // Open Edit Payment Modal (for updating an existing recorded entry)
  const handleOpenEditPayment = (bill, targetHotel = null) => {
    const hotel = targetHotel || selectedHotel;
    if (!hotel || !bill) return;
    setEditingPaymentId(bill.id || bill.payment_id || null);
    setSelectedHotelForPayment(hotel);
    setSelectedBillForPayment(bill);
    setPaymentFormData({
      amount: bill.amount !== undefined ? bill.amount : (hotel.subscription?.billing_amount || 9999),
      payment_method: bill.payment_method || 'UPI',
      payment_status: bill.status || hotel.subscription?.payment_status || 'PAID',
      transaction_reference: bill.transaction_reference && bill.transaction_reference !== '–' ? bill.transaction_reference : '',
      payment_date: bill.billing_date || new Date().toISOString().split('T')[0],
      notes: bill.notes || '',
      invoice_no: bill.invoice_no || `INV-LIC-${hotel?.code || 'HOTEL'}-${new Date().getFullYear()}-01`,
      extend_months: 0
    });
    setShowRecordPaymentModal(true);
  };

  // Delete an existing recorded payment entry
  const handleDeletePayment = async (paymentId) => {
    const hotel = selectedHotel;
    if (!hotel || !paymentId) return;
    if (!window.confirm("Are you sure you want to delete this recorded payment entry?")) {
      return;
    }
    try {
      const res = await deletePropertySubscriptionPaymentApi(hotel.id, paymentId);
      showSuccess(res.message || 'Payment entry removed successfully.', 'Payment Deleted');
      showToast('Payment entry deleted.');
      await handleOpenHotelConsole(hotel.id);
      loadAllPlatformData();
    } catch (err) {
      console.error('Failed to delete payment entry:', err);
      const errMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to delete payment entry.';
      showError(errMsg, 'Delete Error');
    }
  };

  // Submit Record or Update Payment
  const handleSubmitRecordPayment = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const hotel = selectedHotelForPayment || selectedHotel;
    if (!hotel) return;
    if (!paymentFormData.amount || Number(paymentFormData.amount) <= 0) {
      showError('Please enter a valid payment amount.', 'Invalid Amount');
      return;
    }

    setRecordingPayment(true);
    try {
      const payload = {
        amount: Number(paymentFormData.amount),
        payment_method: paymentFormData.payment_method,
        payment_status: paymentFormData.payment_status,
        transaction_reference: paymentFormData.transaction_reference,
        payment_date: paymentFormData.payment_date,
        notes: paymentFormData.notes,
        invoice_no: paymentFormData.invoice_no,
        extend_months: Number(paymentFormData.extend_months) || 0
      };
      if (editingPaymentId) {
        payload.payment_id = editingPaymentId;
      }

      const res = await recordPropertySubscriptionPaymentApi(hotel.id, payload);

      const successMsg = editingPaymentId 
        ? (res.message || 'Payment entry updated successfully!')
        : (res.message || `Payment of ₹${Number(paymentFormData.amount).toLocaleString('en-IN')} recorded successfully!`);

      showSuccess(successMsg, editingPaymentId ? 'Payment Updated' : 'Payment Recorded');
      showToast(editingPaymentId ? 'Payment entry updated.' : 'Payment recorded successfully.');
      setShowRecordPaymentModal(false);

      // Refresh hotel details and global data
      if (selectedHotel && selectedHotel.id === hotel.id) {
        await handleOpenHotelConsole(selectedHotel.id);
      }
      loadAllPlatformData();
    } catch (err) {
      console.error('Failed to record/update payment:', err);
      const errMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to process subscription payment.';
      showError(errMsg, 'Payment Error');
    } finally {
      setRecordingPayment(false);
    }
  };

  // Open Modal to Create New Subscription Plan
  const handleOpenCreatePlanModal = () => {
    setEditingPlan(null);
    setPlanFormData({
      code: '',
      name: '',
      max_rooms: 20,
      price_monthly: 1499,
      price_annually: 14999,
      features: 'Full Front Desk Ops, Shift & Till Ledger, Multi-Branch Support, Automated Daily Reports',
      is_active: true
    });
    setShowPlanModal(true);
  };

  // Open Modal to Edit Existing Subscription Plan
  const handleOpenEditPlanModal = (plan) => {
    setEditingPlan(plan);
    setPlanFormData({
      code: plan.code,
      name: plan.name,
      max_rooms: plan.max_rooms,
      price_monthly: plan.price_monthly,
      price_annually: plan.price_annually,
      features: Array.isArray(plan.features) ? plan.features.join(', ') : (plan.features || ''),
      is_active: plan.is_active !== false
    });
    setShowPlanModal(true);
  };

  // Submit Handler for Standard Subscription Plan
  const handleSavePlanSubmit = async (e) => {
    if (e) e.preventDefault();
    setSavingPlan(true);
    try {
      const payload = {
        ...planFormData,
        max_rooms: parseInt(planFormData.max_rooms) || 15,
        price_monthly: parseFloat(planFormData.price_monthly) || 0,
        price_annually: parseFloat(planFormData.price_annually) || 0,
        features: typeof planFormData.features === 'string'
          ? planFormData.features.split(',').map(f => f.trim()).filter(Boolean)
          : planFormData.features
      };

      if (editingPlan) {
        await updatePlatformSubscriptionPlanApi(editingPlan.id, payload);
        showSuccess(`Subscription plan "${payload.name}" updated successfully!`, 'Plan Updated');
      } else {
        await createPlatformSubscriptionPlanApi(payload);
        showSuccess(`New plan "${payload.name}" created successfully!`, 'Plan Created');
      }
      setShowPlanModal(false);
      queryClient.invalidateQueries({ queryKey: ['platform-subscriptions'] });
    } catch (err) {
      console.error('Failed to save plan:', err);
      const errorDetail = err.response?.data?.error || err.message || 'Could not save plan';
      showError(errorDetail, 'Plan Save Failed');
    } finally {
      setSavingPlan(false);
    }
  };

  // Open Modal to Assign Custom Bespoke Subscription to Hotel
  const handleOpenCustomSubModal = (property = null) => {
    const defaultProp = property || properties[0] || null;
    const currentRooms = defaultProp?.total_rooms || 25;
    const currentAmount = defaultProp?.subscription?.billing_amount || 9999;
    
    // Default expiry: 1 year from today or existing expiry
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const defaultDateStr = nextYear.toISOString().split('T')[0];

    setCustomSubFormData({
      property_id: defaultProp ? defaultProp.id : '',
      plan_name: defaultProp ? `Custom Plan - ${defaultProp.name}` : 'Bespoke Enterprise Agreement',
      custom_rooms: currentRooms,
      custom_charges: currentAmount,
      custom_expiry_date: defaultProp?.subscription?.valid_until || defaultDateStr,
      billing_cycle: defaultProp?.subscription?.billing_cycle || 'ANNUAL',
      payment_status: defaultProp?.subscription?.payment_status || 'PAID',
      features: 'Custom Negotiated License, Dedicated Room Quota, Direct Technical Concierge, Unlimited Branches'
    });
    setShowCustomSubModal(true);
  };

  // Submit Handler for Custom Bespoke Subscription
  const handleSaveCustomSubSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!customSubFormData.property_id) {
      showError('Please select a target hotel property.', 'Property Required');
      return;
    }
    setSavingCustomSub(true);
    try {
      const payload = {
        ...customSubFormData,
        custom_rooms: parseInt(customSubFormData.custom_rooms) || 20,
        custom_charges: parseFloat(customSubFormData.custom_charges) || 0,
        features: typeof customSubFormData.features === 'string'
          ? customSubFormData.features.split(',').map(f => f.trim()).filter(Boolean)
          : customSubFormData.features
      };

      const res = await applyCustomSubscriptionApi(payload);
      showSuccess(
        `Custom subscription applied to "${res.subscription?.property_name || 'Hotel'}". Room Limit: ${res.subscription?.custom_rooms}, Expiry: ${res.subscription?.valid_until}, Charges: ₹${res.subscription?.billing_amount}.`,
        'Custom Plan Configured'
      );
      showToast(`Custom plan configured for ${res.subscription?.property_name || 'Hotel'}`);
      setShowCustomSubModal(false);
      await loadAllPlatformData();
      if (selectedHotel && selectedHotel.id === parseInt(customSubFormData.property_id)) {
        handleOpenHotelConsole(selectedHotel.id);
      }
    } catch (err) {
      console.error('Failed to apply custom subscription:', err);
      const errorDetail = err.response?.data?.error || err.message || 'Could not apply custom subscription';
      showError(errorDetail, 'Configuration Failed');
    } finally {
      setSavingCustomSub(false);
    }
  };

  // Live Health Check Ping
  const handleRefreshHealth = async () => {
    setHealthRefreshing(true);
    try {
      const { data: res } = await refetchHealth();
      const pingLatency = res?.database?.latency_ms !== undefined ? `${res.database.latency_ms} ms` : 'optimal';
      showSuccess(
        `Host diagnostics pinged: DB latency is ${pingLatency}. Subsystem status: ${res?.cluster_status || res?.status || 'Active'}.`,
        'Health Diagnostics Refreshed'
      );
      showToast('Health diagnostics refreshed.');
    } catch (err) {
      console.error('Failed to refresh health data:', err);
      showError('Failed to ping health endpoints', 'Health Check Error');
    } finally {
      setHealthRefreshing(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    showToast('Copied to clipboard!');
    setTimeout(() => setCopiedKey(false), 3000);
  };

  const filteredProperties = properties.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.owner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.city && p.city.toLowerCase().includes(searchQuery.toLowerCase()));

    const daysLeft = getSubscriptionDaysLeft(p.subscription);
    const isExpiring = daysLeft <= 15;

    let matchesStatus = true;
    if (statusFilter === 'active') matchesStatus = p.is_active;
    if (statusFilter === 'suspended') matchesStatus = !p.is_active;
    if (statusFilter === 'expiring') matchesStatus = isExpiring;

    return matchesSearch && matchesStatus;
  });

  const sortedProperties = React.useMemo(() => {
    return [...filteredProperties].sort((a, b) => {
      let aVal, bVal;
      switch (sortField) {
        case 'name':
          aVal = (a.name || '').toLowerCase();
          bVal = (b.name || '').toLowerCase();
          return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        case 'owner':
          aVal = (a.owner_name || '').toLowerCase();
          bVal = (b.owner_name || '').toLowerCase();
          return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        case 'capacity':
          aVal = a.overall_capacity || a.total_rooms || 0;
          bVal = b.overall_capacity || b.total_rooms || 0;
          return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        case 'billing':
          aVal = a.subscription?.billing_amount || 0;
          bVal = b.subscription?.billing_amount || 0;
          return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        case 'validity':
          aVal = getSubscriptionDaysLeft(a.subscription);
          bVal = getSubscriptionDaysLeft(b.subscription);
          return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        case 'status':
          aVal = a.is_active ? 1 : 0;
          bVal = b.is_active ? 1 : 0;
          return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        default:
          return 0;
      }
    });
  }, [filteredProperties, sortField, sortOrder]);

  const visibleColumnCount = Object.values(columnVisibility).filter(Boolean).length;

  const totalRoomsManaged = properties.reduce((acc, p) => acc + (p.overall_capacity || p.total_rooms || 0), 0);
  const activeLodgesCount = properties.filter((p) => p.is_active).length;
  const activeCount = healthData?.platform_metrics?.active_properties ?? activeLodgesCount;
  const suspendedCount = healthData?.platform_metrics?.suspended_properties ?? (properties.length - activeLodgesCount);
  const totalBranchesAll = healthData?.platform_metrics?.total_branches ?? properties.reduce((acc, p) => acc + (p.branches_count || 0), 0);
  const totalCapacityCap = healthData?.platform_metrics?.total_rooms_managed ?? totalRoomsManaged;
  const totalRoomsConfigured = totalRoomsManaged;
  const totalActiveStays = healthData?.platform_metrics?.active_stays_count ?? 0;
  const expiringCount = subscriptionsData?.expiring_soon_count ?? (subscriptionsData?.expiring_properties?.length || 0);

  const estimatedARR = properties.reduce((acc, p) => {
    const code = p.subscription?.plan_code;
    if (code === 'GROWTH') return acc + 19999;
    if (code === 'ENTERPRISE') return acc + 39999;
    if (code === 'STARTER') return acc + 9999;
    return acc + 9999;
  }, 0);

  const estimatedMRR = Math.round(estimatedARR / 12);

  if (loading && properties.length === 0) {
    return <PageLoader message="Connecting to Multi-Tenant Host..." />;
  }

  return (
    <DeveloperLayout
      activeTab={activeTab}
      onSelectTab={handleSelectTab}
      onOpenOnboardModal={() => setShowOnboardModal(true)}
    >
      <div className="pb-5 px-3 animate-fadeIn" style={{ padding: "16px" }}>
        
        {/* Toast Notification */}
        {toastMessage && (
          <div
            className="alert alert-success border-0 shadow-lg d-flex align-items-center justify-content-between rounded-4 p-3.5 mb-4 text-white"
            style={{ background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)', boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)' }}
          >
            <div className="d-flex align-items-center gap-2.5">
              <CheckCircle2 size={20} className="text-white" />
              <span className="fw-bold small">{toastMessage}</span>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={() => setToastMessage(null)}></button>
          </div>
        )}

        {/* ========================================================= */}
        {/* 🌐 TOP LEVEL PLATFORM NAVIGATION TABS DECK                */}
        {/* ========================================================= */}
        {!selectedHotel && (
          <div className="card border-0 shadow-sm bg-white rounded-4 overflow-hidden mb-4" style={{ border: '1px solid #E2E8F0' }}>
            <div className="p-2.5 p-sm-3 bg-light d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2 overflow-x-auto text-nowrap" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
                <button
                  type="button"
                  onClick={() => handleSelectTab('overview')}
                  className={`btn btn-sm rounded-3 px-3.5 py-2 fw-bold transition-all text-nowrap d-flex align-items-center gap-2 ${activeTab === 'overview' ? 'btn-primary text-white shadow-2xs' : 'btn-white border text-secondary hover-bg-light'}`}
                  style={{ fontSize: '0.85rem' }}
                >
                  <BarChart3 size={15} />
                  <span>Platform Overview</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectTab('properties')}
                  className={`btn btn-sm rounded-3 px-3.5 py-2 fw-bold transition-all text-nowrap d-flex align-items-center gap-2 ${activeTab === 'properties' ? 'btn-primary text-white shadow-2xs' : 'btn-white border text-secondary hover-bg-light'}`}
                  style={{ fontSize: '0.85rem' }}
                >
                  <Building2 size={15} />
                  <span>Hotels Directory</span>
                  <span className={`badge rounded-pill extra-small px-2 py-0.5 ${activeTab === 'properties' ? 'bg-white text-primary' : 'bg-secondary-subtle text-secondary'}`}>
                    {properties.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectTab('subscriptions')}
                  className={`btn btn-sm rounded-3 px-3.5 py-2 fw-bold transition-all text-nowrap d-flex align-items-center gap-2 ${activeTab === 'subscriptions' ? 'btn-primary text-white shadow-2xs' : 'btn-white border text-secondary hover-bg-light'}`}
                  style={{ fontSize: '0.85rem' }}
                >
                  <Layers size={15} />
                  <span>Subscription Plans &amp; Custom Pricing</span>
                  <span className={`badge rounded-pill extra-small px-2 py-0.5 ${activeTab === 'subscriptions' ? 'bg-white text-primary' : 'bg-secondary-subtle text-secondary'}`}>
                    {subscriptionsData?.plans?.length || 4} Plans
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectTab('health')}
                  className={`btn btn-sm rounded-3 px-3.5 py-2 fw-bold transition-all text-nowrap d-flex align-items-center gap-2 ${activeTab === 'health' ? 'btn-primary text-white shadow-2xs' : 'btn-white border text-secondary hover-bg-light'}`}
                  style={{ fontSize: '0.85rem' }}
                >
                  <Activity size={15} />
                  <span>System Health &amp; Diagnostics</span>
                  <span className={`badge rounded-pill extra-small px-2 py-0.5 ${activeTab === 'health' ? 'bg-white text-success' : 'bg-success-subtle text-success'}`}>
                    ● Live
                  </span>
                </button>
              </div>

              {/* Quick Actions in Tab Bar */}
              <div className="d-flex align-items-center gap-2">
                {activeTab === 'subscriptions' && (
                  <button
                    type="button"
                    onClick={() => handleOpenCustomSubModal()}
                    className="btn btn-sm btn-primary rounded-3 px-3 py-1.5 fw-bold text-white shadow-xs extra-small d-flex align-items-center gap-1.5"
                    style={{ background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)', border: 'none' }}
                  >
                    <Sparkles size={14} className="text-warning" />
                    <span>Assign Custom Plan</span>
                  </button>
                )}
                {activeTab === 'properties' && (
                  <button
                    type="button"
                    onClick={() => setShowOnboardModal(true)}
                    className="btn btn-sm btn-primary rounded-3 px-3 py-1.5 fw-bold text-white shadow-xs extra-small d-flex align-items-center gap-1.5"
                    style={{ background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)', border: 'none' }}
                  >
                    <PlusCircle size={14} />
                    <span>+ Onboard Hotel</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 🏢 VIEW 1: DEDICATED SINGLE HOTEL MANAGEMENT CONSOLE       */}
        {/* ========================================================= */}
        {selectedHotel ? (
          <div className="animate-fadeIn">
            
            {/* Top Back Bar & Action Deck */}
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3 mb-4">
              <div className="d-flex align-items-center flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedHotel(null)}
                  className="btn btn-white border rounded-3 px-3 py-2 text-secondary fw-semibold d-flex align-items-center gap-2 shadow-2xs hover-bg-light flex-shrink-0"
                  style={{ fontSize: '0.85rem' }}
                >
                  <ArrowLeft size={16} /> Back to Hotels Directory
                </button>
                <div className="border-start d-none d-md-block" style={{ height: '28px', borderColor: '#CBD5E1' }}></div>
                <div>
                  <div className="d-flex align-items-center flex-wrap gap-2">
                    <h3 className="fw-bold text-dark m-0 fs-4" style={{ letterSpacing: '-0.025em' }}>
                      {selectedHotel.name}
                    </h3>
                    <span className="badge bg-dark text-white font-monospace extra-small px-2.5 py-1 rounded-2">
                      {selectedHotel.code}
                    </span>
                    {(hotelFormData.operation_mode || selectedHotel.operation_mode) === 'SINGLE_OWNER' ? (
                      <span className="badge rounded-pill extra-small px-2.5 py-1 fw-bold d-inline-flex align-items-center gap-1" style={{ backgroundColor: '#F0FDFA', color: '#0F766E', border: '1px solid #CCFBF1' }}>
                        <UserCheck size={12} /> Single Owner (No Shifts)
                      </span>
                    ) : (
                      <span className="badge rounded-pill extra-small px-2.5 py-1 fw-bold d-inline-flex align-items-center gap-1" style={{ backgroundColor: '#EEF2FF', color: '#4338CA', border: '1px solid #E0E7FF' }}>
                        <Clock size={12} /> Shift-Wise (Multi-Staff)
                      </span>
                    )}
                    <button
                      type="button"
                      className={`badge border-0 rounded-pill extra-small px-3 py-1 fw-bold ${selectedHotel.is_active ? 'bg-success text-white' : 'bg-danger text-white'}`}
                      onClick={() => handleToggleStatus(selectedHotel.id, selectedHotel.name)}
                      title="Click to toggle status"
                    >
                      {selectedHotel.is_active ? '● ACTIVE' : '■ SUSPENDED'}
                    </button>
                  </div>
                  <div className="text-muted extra-small d-flex align-items-center flex-wrap gap-2 mt-1">
                    <span><MapPin size={12} className="d-inline text-secondary" /> {selectedHotel.city || 'City unset'}, {selectedHotel.state || 'India'}</span>
                    <span>&bull;</span>
                    <span>Branches: <strong>{selectedHotel.branches_count || 0} units</strong></span>
                    <span>&bull;</span>
                    <span>Registered: {selectedHotel.created_at}</span>
                  </div>
                </div>
              </div>

              <div className="d-flex align-items-center flex-wrap gap-2 w-100 w-lg-auto justify-content-start justify-content-lg-end">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm fw-semibold rounded-3 px-3 py-2 d-flex align-items-center justify-content-center gap-1.5 flex-grow-1 flex-sm-grow-0"
                  style={{ fontSize: '0.825rem' }}
                  onClick={() => handleResetPassword(selectedHotel.id, selectedHotel.name)}
                >
                  <Key size={14} /> Reset Owner Pass
                </button>

                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm fw-semibold rounded-3 px-3 py-2 d-flex align-items-center justify-content-center gap-1.5 flex-grow-1 flex-sm-grow-0"
                  style={{ fontSize: '0.825rem' }}
                  onClick={() => {
                    setSelectedPropertyForRenew(selectedHotel);
                    setShowRenewModal(true);
                  }}
                >
                  <RotateCcw size={14} /> Renew Plan
                </button>

                <button
                  type="button"
                  className="btn btn-primary btn-sm fw-bold rounded-3 px-3.5 py-2 d-flex align-items-center justify-content-center gap-1.5 text-white shadow-xs flex-grow-1 flex-sm-grow-0"
                  style={{
                    fontSize: '0.825rem',
                    background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                    border: 'none'
                  }}
                  onClick={handleSaveHotelSettings}
                  disabled={savingHotel}
                >
                  <Save size={15} /> {savingHotel ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </div>

            {/* 4 Live Stats & Capacity Overview for this Hotel */}
            <div className="row g-3 mb-4">
              
              {/* Stat 1: Subscription & Billing Plan */}
              <div className="col-12 col-sm-6 col-xl-3">
                <div className="card border-0 shadow-sm bg-white rounded-4 h-100 d-flex flex-column justify-content-between" style={{ padding: "20px 22px", border: "1px solid #E2E8F0", borderTop: "4px solid #0284C7" }}>
                  <div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-secondary extra-small fw-bold text-uppercase">SUBSCRIPTION &amp; BILLING</span>
                      <span className={`badge extra-small rounded-pill ${selectedHotel.subscription?.payment_status === 'PAID' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning-emphasis'}`}>
                        {selectedHotel.subscription?.payment_status || 'PAID'}
                      </span>
                    </div>
                    <div className="fs-4 fw-bold text-dark font-monospace mt-1">
                      {selectedHotel.subscription?.plan_name || 'Starter Plan'}
                    </div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center extra-small text-muted mt-2 pt-2 border-top">
                    <span>₹{selectedHotel.subscription?.billing_amount?.toLocaleString('en-IN') || '9,999'} / {selectedHotel.subscription?.billing_cycle || 'ANNUAL'}</span>
                    <span className="badge bg-primary-subtle text-primary rounded-pill px-2 py-0.5 extra-small fw-semibold">
                      {selectedHotel.subscription?.billing_cycle || 'ANNUAL'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stat 2: Validity & Countdown */}
              <div className="col-12 col-sm-6 col-xl-3">
                <div className="card border-0 shadow-sm bg-white rounded-4 h-100 d-flex flex-column justify-content-between" style={{ padding: "20px 22px", border: "1px solid #E2E8F0", borderTop: "4px solid #10B981" }}>
                  <div>
                    <span className="text-secondary extra-small fw-bold text-uppercase">SUBSCRIPTION VALIDITY</span>
                    <div className="fs-4 fw-bold text-success font-monospace mt-1">
                      {selectedHotel.subscription?.valid_until || getDefaultExpiryDate(1)}
                    </div>
                  </div>
                  <div className="extra-small text-muted mt-2 pt-2 border-top">
                    <span className="badge bg-success-subtle text-success rounded-pill px-2.5 py-0.5 fw-semibold">
                      {getSubscriptionDaysLeft(selectedHotel.subscription)} days remaining
                    </span>
                  </div>
                </div>
              </div>

              {/* Stat 3: Overall & Branch Room Capacity */}
              <div className="col-12 col-sm-6 col-xl-3">
                <div className="card border-0 shadow-sm bg-white rounded-4 h-100 d-flex flex-column justify-content-between" style={{ padding: "20px 22px", border: "1px solid #E2E8F0", borderTop: "4px solid #F59E0B" }}>
                  <div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-secondary extra-small fw-bold text-uppercase">OVERALL CAPACITY</span>
                      <span className="badge bg-warning-subtle text-warning-emphasis rounded-pill extra-small px-2 py-0.5 font-monospace">
                        {selectedHotel.total_configured_rooms || selectedHotel.rooms_count || 0} / {selectedHotel.overall_capacity || selectedHotel.total_rooms || 10}
                      </span>
                    </div>
                    <div className="fs-4 fw-bold text-dark font-monospace mt-1">
                      {selectedHotel.overall_capacity || selectedHotel.total_rooms || 10} Rooms Max
                    </div>
                    <div className="progress mt-2" style={{ height: '6px' }}>
                      <div
                        className="progress-bar bg-warning"
                        style={{
                          width: `${Math.min(100, Math.round(((selectedHotel.total_configured_rooms || selectedHotel.rooms_count || 0) / (selectedHotel.overall_capacity || selectedHotel.total_rooms || 1)) * 100))}%`
                        }}
                      />
                    </div>
                  </div>
                  <div className="extra-small text-secondary mt-2 pt-2 border-top">
                    Main: <strong>{selectedHotel.total_rooms}</strong> | Branches: <strong>{selectedHotel.branches_capacity || 0}</strong>
                  </div>
                </div>
              </div>

              {/* Stat 4: Branches & Live Activity */}
              <div className="col-12 col-sm-6 col-xl-3">
                <div className="card border-0 shadow-sm bg-white rounded-4 h-100 d-flex flex-column justify-content-between" style={{ padding: "20px 22px", border: "1px solid #E2E8F0", borderTop: "4px solid #8B5CF6" }}>
                  <div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-secondary extra-small fw-bold text-uppercase">BRANCHES &amp; ACTIVITY</span>
                      <span className="badge bg-primary-subtle text-primary rounded-pill extra-small px-2 py-0.5 font-monospace">
                        {selectedHotel.branches_count || 0} Branches
                      </span>
                    </div>
                    <div className="fs-4 fw-bold text-primary font-monospace mt-1">
                      {selectedHotel.active_stays_count || 0} Live Guests
                    </div>
                  </div>
                  <div className="extra-small text-muted mt-2 pt-2 border-top">
                    {selectedHotel.staff_users?.length || 1} staff accounts registered
                  </div>
                </div>
              </div>

            </div>

            {/* Hotel Management Navigation Tabs */}
            <div className="card border-0 shadow-sm bg-white rounded-4 overflow-hidden mb-4" style={{ border: '1px solid #E2E8F0' }}>
              <div className="p-2.5 p-sm-3 border-bottom bg-light d-flex align-items-center gap-2 overflow-x-auto text-nowrap" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
                <button
                  type="button"
                  onClick={() => setHotelSubTab('governance')}
                  className={`btn btn-sm rounded-3 px-3 py-2 fw-bold transition-all text-nowrap flex-shrink-0 ${hotelSubTab === 'governance' ? 'btn-primary text-white shadow-2xs' : 'btn-white border text-secondary'}`}
                  style={{ fontSize: '0.825rem' }}
                >
                  <Sliders size={14} className="me-1.5 d-inline" /> Capacity &amp; Subscription Controls
                </button>
                <button
                  type="button"
                  onClick={() => setHotelSubTab('branches')}
                  className={`btn btn-sm rounded-3 px-3 py-2 fw-bold transition-all text-nowrap flex-shrink-0 ${hotelSubTab === 'branches' ? 'btn-primary text-white shadow-2xs' : 'btn-white border text-secondary'}`}
                  style={{ fontSize: '0.825rem' }}
                >
                  <GitBranch size={14} className="me-1.5 d-inline" /> Manage Branches ({selectedHotel.branches_count || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setHotelSubTab('billing')}
                  className={`btn btn-sm rounded-3 px-3 py-2 fw-bold transition-all text-nowrap flex-shrink-0 ${hotelSubTab === 'billing' ? 'btn-primary text-white shadow-2xs' : 'btn-white border text-secondary'}`}
                  style={{ fontSize: '0.825rem' }}
                >
                  <Receipt size={14} className="me-1.5 d-inline" /> Software Billing &amp; Invoices
                </button>
                <button
                  type="button"
                  onClick={() => setHotelSubTab('profile')}
                  className={`btn btn-sm rounded-3 px-3 py-2 fw-bold transition-all text-nowrap flex-shrink-0 ${hotelSubTab === 'profile' ? 'btn-primary text-white shadow-2xs' : 'btn-white border text-secondary'}`}
                  style={{ fontSize: '0.825rem' }}
                >
                  <Building2 size={14} className="me-1.5 d-inline" /> Hotel Profile &amp; Location
                </button>
                <button
                  type="button"
                  onClick={() => setHotelSubTab('staff')}
                  className={`btn btn-sm rounded-3 px-3 py-2 fw-bold transition-all text-nowrap flex-shrink-0 ${hotelSubTab === 'staff' ? 'btn-primary text-white shadow-2xs' : 'btn-white border text-secondary'}`}
                  style={{ fontSize: '0.825rem' }}
                >
                  <Users size={14} className="me-1.5 d-inline" /> Owner &amp; Staff Users ({selectedHotel.staff_users?.length || 1})
                </button>
              </div>

              {/* SubTab 1: Capacity & Subscription Controls */}
              {hotelSubTab === 'governance' && (
                <div className="p-3 p-sm-4">
                  <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-3">
                    <h6 className="fw-bold text-dark m-0">Developer Governance &amp; Lifecycle Controls</h6>
                    <span className="extra-small text-muted font-monospace">Property ID: #{selectedHotel.id}</span>
                  </div>

                  <div className="row g-4 mb-4">
                    
                    {/* Room Limit Control */}
                    <div className="col-md-6">
                      <div className="rounded-4 border bg-light h-100" style={{ padding: "24px" }}>
                        <label className="form-label fw-bold text-dark small mb-1">
                          Main Property Room Capacity Limit
                        </label>
                        <p className="text-muted extra-small mb-2">
                          Controls maximum allowed rooms for the primary hotel unit.
                        </p>
                        <div className="input-group">
                          <input
                            type="number"
                            min="1"
                            max="999"
                            className="form-control form-control-lg font-monospace fw-bold"
                            value={hotelFormData.total_rooms ?? 10}
                            onChange={(e) => setHotelFormData({ ...hotelFormData, total_rooms: parseInt(e.target.value) || 1 })}
                          />
                          <span className="input-group-text bg-white fw-semibold">Rooms Max</span>
                        </div>
                        <div className="extra-small text-secondary mt-2">
                          Currently configured by hotel: <strong>{selectedHotel.rooms_count || 0} rooms</strong>
                        </div>
                      </div>
                    </div>

                    {/* Expiry Date Control */}
                    <div className="col-md-6">
                      <div className="rounded-4 border bg-light h-100" style={{ padding: "24px" }}>
                        <label className="form-label fw-bold text-dark small mb-1">
                          Subscription Expiry Date Override
                        </label>
                        <p className="text-muted extra-small mb-2">
                          Directly modify or extend the software validity date for this hotel.
                        </p>
                        <input
                          type="date"
                          className="form-control form-control-lg font-monospace fw-semibold"
                          value={hotelFormData.valid_until || getDefaultExpiryDate(1)}
                          onChange={(e) => setHotelFormData({ ...hotelFormData, valid_until: e.target.value })}
                        />
                        <div className="d-flex flex-wrap align-items-center gap-1.5 mt-2">
                          <span className="extra-small text-muted">Quick extension:</span>
                          <button
                            type="button"
                            className="btn btn-white btn-sm border extra-small px-2 py-0.5 rounded-2"
                            onClick={() => {
                              setHotelFormData({ ...hotelFormData, valid_until: addMonthsToDateStr(hotelFormData.valid_until, 1) });
                            }}
                          >
                            +1 Month
                          </button>
                          <button
                            type="button"
                            className="btn btn-white btn-sm border extra-small px-2 py-0.5 rounded-2"
                            onClick={() => {
                              setHotelFormData({ ...hotelFormData, valid_until: addMonthsToDateStr(hotelFormData.valid_until, 6) });
                            }}
                          >
                            +6 Months
                          </button>
                          <button
                            type="button"
                            className="btn btn-white btn-sm border extra-small px-2 py-0.5 rounded-2"
                            onClick={() => {
                              setHotelFormData({ ...hotelFormData, valid_until: addYearsToDateStr(hotelFormData.valid_until, 1) });
                            }}
                          >
                            +1 Year
                          </button>
                          <button
                            type="button"
                            className="btn btn-white btn-sm border extra-small px-2 py-0.5 rounded-2"
                            onClick={() => {
                              setHotelFormData({ ...hotelFormData, valid_until: addYearsToDateStr(hotelFormData.valid_until, 2) });
                            }}
                          >
                            +2 Years
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Plan Tier Selector */}
                    <div className="col-md-6">
                      <div className="rounded-4 border bg-light h-100" style={{ padding: "24px" }}>
                        <label className="form-label fw-bold text-dark small mb-1">
                          Assigned SaaS Subscription Tier
                        </label>
                        <p className="text-muted extra-small mb-2">
                          Controls product capabilities and feature sets.
                        </p>
                        <select
                          className="form-select form-select-lg fw-semibold"
                          value={hotelFormData.plan_code || 'STARTER'}
                          onChange={(e) => setHotelFormData({ ...hotelFormData, plan_code: e.target.value })}
                        >
                          <option value="STARTER">Starter Plan (Up to 15 Rooms)</option>
                          <option value="GROWTH">Growth Plan (Up to 40 Rooms)</option>
                          <option value="ENTERPRISE">Enterprise Plan (Unlimited Rooms)</option>
                          <option value="FREE_TRIAL">14-Day Evaluation Trial</option>
                        </select>
                      </div>
                    </div>

                    {/* Commercial Billing Details */}
                    <div className="col-md-6">
                      <div className="rounded-4 border bg-light h-100" style={{ padding: "24px" }}>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <label className="form-label fw-bold text-dark small m-0">
                            Commercial Billing Cycle &amp; Rate
                          </label>
                          <button
                            type="button"
                            className="btn btn-xs btn-outline-success d-inline-flex align-items-center gap-1 extra-small fw-semibold px-2 py-0.5 rounded shadow-2xs"
                            onClick={() => handleOpenRecordPayment(null, selectedHotel)}
                            title="Record payment or settlement for this hotel"
                          >
                            <CreditCard size={12} /> Record Payment
                          </button>
                        </div>
                        <p className="text-muted extra-small mb-2">
                          Billing rate, cycle term, and payment settlement status.
                        </p>
                        <div className="row g-2">
                          <div className="col-6">
                            <select
                              className="form-select"
                              value={hotelFormData.billing_cycle || 'ANNUAL'}
                              onChange={(e) => setHotelFormData({ ...hotelFormData, billing_cycle: e.target.value })}
                            >
                              <option value="ANNUAL">Annual Billing</option>
                              <option value="MONTHLY">Monthly Billing</option>
                              <option value="LIFETIME">Lifetime / Custom</option>
                            </select>
                          </div>
                          <div className="col-6">
                            <select
                              className="form-select"
                              value={hotelFormData.payment_status || 'PAID'}
                              onChange={(e) => setHotelFormData({ ...hotelFormData, payment_status: e.target.value })}
                            >
                              <option value="PAID">● PAID (Settled)</option>
                              <option value="PENDING">⚠️ PENDING</option>
                              <option value="OVERDUE">■ OVERDUE</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Hotel Operational Mode Configuration: Shift-Wise vs Single Owner */}
                    <div className="col-12">
                      <div className="rounded-4 border bg-white shadow-xs" style={{ padding: "24px", border: '1px solid #E2E8F0', borderLeft: '5px solid #4F46E5' }}>
                        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
                          <div>
                            <div className="d-flex align-items-center gap-2">
                              <h6 className="fw-bold text-dark m-0 fs-6">Shift Operations &amp; Cashier Till Mode</h6>
                              <span className="badge bg-primary-subtle text-primary extra-small rounded-pill px-2.5 py-0.5 fw-bold">
                                Platform Developer Controlled
                              </span>
                            </div>
                            <p className="text-muted extra-small m-0 mt-1">
                              Configure whether this property operates with rotating multi-staff shifts and physical cash till balancing, or direct single-owner management without shifts.
                            </p>
                          </div>
                        </div>

                        <div className="row g-3">
                          {/* Option 1: Shift-Wise Mode */}
                          <div className="col-12 col-md-6">
                            <div
                              className={`p-3 rounded-3 border cursor-pointer transition-all h-100 ${
                                (hotelFormData.operation_mode || 'SHIFT_WISE') === 'SHIFT_WISE'
                                  ? 'border-primary shadow-xs'
                                  : 'bg-light'
                              }`}
                              style={{
                                borderColor: (hotelFormData.operation_mode || 'SHIFT_WISE') === 'SHIFT_WISE' ? '#4F46E5' : '#E2E8F0',
                                backgroundColor: (hotelFormData.operation_mode || 'SHIFT_WISE') === 'SHIFT_WISE' ? '#F5F3FF' : '#F8FAFC'
                              }}
                              onClick={() => setHotelFormData({ ...hotelFormData, operation_mode: 'SHIFT_WISE' })}
                            >
                              <div className="d-flex align-items-center gap-2 mb-1.5">
                                <input
                                  type="radio"
                                  className="form-check-input mt-0"
                                  name="operation_mode_selector"
                                  checked={(hotelFormData.operation_mode || 'SHIFT_WISE') === 'SHIFT_WISE'}
                                  onChange={() => setHotelFormData({ ...hotelFormData, operation_mode: 'SHIFT_WISE' })}
                                />
                                <div className="d-flex align-items-center gap-1.5">
                                  <Clock size={16} style={{ color: '#4F46E5' }} />
                                  <span className="fw-bold text-dark small">Shift-Wise (Standard Multi-Staff)</span>
                                </div>
                              </div>
                              <p className="text-secondary extra-small m-0 ps-4">
                                Enables rotating shifts, cashier handovers, cash drawer till reconciliation, and shift-wise audit dossiers in Reports. Standard production mode for multi-staff properties.
                              </p>
                            </div>
                          </div>

                          {/* Option 2: Single Owner Mode */}
                          <div className="col-12 col-md-6">
                            <div
                              className={`p-3 rounded-3 border cursor-pointer transition-all h-100 ${
                                hotelFormData.operation_mode === 'SINGLE_OWNER'
                                  ? 'border-teal shadow-xs'
                                  : 'bg-light'
                              }`}
                              style={{
                                borderColor: hotelFormData.operation_mode === 'SINGLE_OWNER' ? '#0D9488' : '#E2E8F0',
                                backgroundColor: hotelFormData.operation_mode === 'SINGLE_OWNER' ? '#F0FDFA' : '#F8FAFC'
                              }}
                              onClick={() => setHotelFormData({ ...hotelFormData, operation_mode: 'SINGLE_OWNER' })}
                            >
                              <div className="d-flex align-items-center gap-2 mb-1.5">
                                <input
                                  type="radio"
                                  className="form-check-input mt-0"
                                  name="operation_mode_selector"
                                  checked={hotelFormData.operation_mode === 'SINGLE_OWNER'}
                                  onChange={() => setHotelFormData({ ...hotelFormData, operation_mode: 'SINGLE_OWNER' })}
                                />
                                <div className="d-flex align-items-center gap-1.5">
                                  <UserCheck size={16} style={{ color: '#0D9488' }} />
                                  <span className="fw-bold text-dark small">Single Owner (Direct Management / No Shifts)</span>
                                </div>
                              </div>
                              <p className="text-secondary extra-small m-0 ps-4">
                                Completely removes shift and till friction. "Shift &amp; Till" is removed from navigation. Bookings, check-ins, and payments work directly. Reports operate strictly Date-wise.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Active Status Switch */}
                    <div className="col-12">
                      <div className="rounded-4 border bg-light d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3" style={{ padding: "24px" }}>
                        <div>
                          <label className="form-label fw-bold text-dark small mb-1">
                            Hotel Instance Operational Status
                          </label>
                          <p className="text-muted extra-small m-0">
                            When suspended, front-desk staff are blocked from making bookings, check-ins, and accessing PMS pages.
                          </p>
                        </div>
                        <button
                          type="button"
                          className={`btn btn-lg fw-bold px-4 py-2.5 rounded-3 text-white shadow-xs ${hotelFormData.is_active ? 'btn-success' : 'btn-danger'}`}
                          onClick={() => handleToggleStatus(selectedHotel.id, selectedHotel.name)}
                        >
                          {hotelFormData.is_active ? '● ACTIVE (Operational)' : '■ SUSPENDED (Access Blocked)'}
                        </button>
                      </div>
                    </div>

                  </div>

                  <div className="d-flex justify-content-end mt-2">
                    <button
                      type="button"
                      className="btn btn-primary fw-bold px-4 py-2.5 rounded-3 text-white shadow-xs d-flex align-items-center justify-content-center gap-2"
                      onClick={handleSaveHotelSettings}
                      disabled={savingHotel}
                      style={{ background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)' }}
                    >
                      <Save size={16} /> {savingHotel ? 'Saving Changes...' : 'Save Hotel Settings'}
                    </button>
                  </div>
                </div>
              )}

              {/* SubTab 2: Branches Management */}
              {hotelSubTab === 'branches' && (
                <div className="p-3 p-sm-4">
                  <div className="d-flex flex-wrap flex-sm-nowrap justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
                    <div className="flex-grow-1">
                      <h6 className="fw-bold text-dark m-0 fs-6">Hotel Branches &amp; Sub-Units Management</h6>
                      <p className="text-muted extra-small m-0 mt-0.5">
                        Create secondary wings, city branches, or resort units linked to this primary brand.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary btn-sm fw-bold px-3.5 py-2 rounded-3 text-white shadow-xs d-flex align-items-center gap-1.5 flex-shrink-0 text-nowrap"
                      onClick={() => setShowAddBranchModal(true)}
                      style={{ background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)', whiteSpace: 'nowrap' }}
                    >
                      <PlusCircle size={15} /> + Add New Branch
                    </button>
                  </div>

                  {/* Branch Capacity Rollup Cards */}
                  <div className="row g-3 mb-4">
                    <div className="col-12 col-md-4">
                      <div className="rounded-3 border h-100 d-flex flex-column justify-content-between" style={{ padding: "20px 24px", borderLeft: '4px solid #0284C7', backgroundColor: '#F8FAFC' }}>
                        <div>
                          <span className="text-secondary extra-small fw-bold text-uppercase">PRIMARY UNIT CAPACITY</span>
                          <div className="fs-4 fw-bold text-dark font-monospace mt-1">{selectedHotel.total_rooms} Rooms</div>
                        </div>
                        <span className="extra-small text-muted mt-2 d-block">{selectedHotel.name}</span>
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <div className="rounded-3 border h-100 d-flex flex-column justify-content-between" style={{ padding: "20px 24px", borderLeft: '4px solid #6366F1', backgroundColor: '#F8FAFC' }}>
                        <div>
                          <span className="text-secondary extra-small fw-bold text-uppercase">BRANCHES CAPACITY</span>
                          <div className="fs-4 fw-bold text-primary font-monospace mt-1">{selectedHotel.branches_capacity || 0} Rooms</div>
                        </div>
                        <span className="extra-small text-muted mt-2 d-block">{selectedHotel.branches_count || 0} Branches Added</span>
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <div className="rounded-3 border h-100 d-flex flex-column justify-content-between" style={{ padding: "20px 24px", borderLeft: '4px solid #10B981', backgroundColor: '#F0FDF4' }}>
                        <div>
                          <span className="text-success extra-small fw-bold text-uppercase">OVERALL BRAND CAPACITY</span>
                          <div className="fs-4 fw-bold text-success font-monospace mt-1">{selectedHotel.overall_capacity || selectedHotel.total_rooms} Rooms</div>
                        </div>
                        <span className="extra-small text-muted mt-2 d-block">Total Pooled Capacity</span>
                      </div>
                    </div>
                  </div>

                  {/* Centralized Expiration Policy Callout */}
                  <div className="alert alert-info py-2.5 px-3 rounded-3 mb-3 d-flex align-items-center gap-2 border-0 bg-primary-subtle text-primary extra-small shadow-none">
                    <ShieldCheck size={16} className="flex-shrink-0 text-primary" />
                    <div>
                      <strong>Production Expiration Architecture:</strong> All secondary branches inherit the active subscription validity and plan tier directly from the Main Hotel (<strong>{selectedHotel.name}</strong>). Expiration date ({selectedHotel.subscription?.valid_until || 'Active'}) applies brand-wide without requiring redundant per-branch expiration dates.
                    </div>
                  </div>

                  {/* Branches Table */}
                  <div className="table-responsive rounded-3 border bg-white">
                    <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem', minWidth: '780px' }}>
                      <thead className="bg-light text-secondary extra-small text-uppercase fw-bold border-bottom">
                        <tr>
                          <th className="ps-3.5 py-3">Branch Name &amp; Code</th>
                          <th>Location</th>
                          <th>Room Capacity</th>
                          <th>Active Stays</th>
                          <th>Assigned Staff</th>
                          <th>Subscription &amp; Expiry</th>
                          <th>Branch Status</th>
                          <th className="text-end pe-3.5">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedHotel.branches || []).map((b) => (
                          <tr key={b.id}>
                            <td className="ps-3.5">
                              <div className="fw-bold text-dark">{b.name}</div>
                              <span className="badge bg-dark text-white font-monospace extra-small">{b.code}</span>
                            </td>
                            <td>
                              <div className="text-dark small">{b.city || 'City unset'}, {b.state || 'India'}</div>
                              <div className="text-muted extra-small text-truncate" style={{ maxWidth: '180px' }}>{b.address}</div>
                            </td>
                            <td>
                              <div className="fw-bold text-dark font-monospace">{b.total_rooms} Rooms Max</div>
                              <span className="extra-small text-muted">{b.rooms_count || 0} configured</span>
                            </td>
                            <td>
                              <span className="badge bg-primary-subtle text-primary extra-small font-monospace">
                                {b.active_stays_count || 0} Guests
                              </span>
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-1.5">
                                <span className="badge bg-light text-dark border font-monospace extra-small">
                                  <Users size={11} className="me-1 d-inline text-primary" />
                                  {b.staff_count || 0} Staff
                                </span>
                                <button
                                  type="button"
                                  className="btn btn-outline-primary btn-sm py-0.5 px-2 extra-small rounded-2"
                                  onClick={() => handleOpenAddStaffModal(b.id)}
                                  title="Add branch staff"
                                >
                                  + Staff
                                </button>
                              </div>
                            </td>
                            <td>
                              <div>
                                <span className="badge bg-success-subtle text-success border border-success-subtle font-monospace extra-small">
                                  🔗 Inherited ({b.inherited_plan_name || selectedHotel.subscription?.plan?.name || 'Starter'})
                                </span>
                              </div>
                              <div className="text-muted extra-small font-monospace mt-1">
                                Valid: <strong>{b.inherited_valid_until || selectedHotel.subscription?.valid_until || 'Active'}</strong>
                              </div>
                            </td>
                            <td>
                              <button
                                type="button"
                                className={`badge border-0 rounded-pill px-2.5 py-1 extra-small fw-bold ${b.is_active ? 'bg-success text-white' : 'bg-danger text-white'}`}
                                onClick={() => handleToggleBranchStatus(b.id)}
                              >
                                {b.is_active ? 'ACTIVE' : 'SUSPENDED'}
                              </button>
                            </td>
                            <td className="text-end pe-3.5">
                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm rounded-3 px-2.5 py-1 extra-small"
                                onClick={() => handleToggleBranchStatus(b.id)}
                              >
                                {b.is_active ? 'Suspend' : 'Activate'}
                              </button>
                            </td>
                          </tr>
                        ))}

                        {(!selectedHotel.branches || selectedHotel.branches.length === 0) && (
                          <tr>
                            <td colSpan="8" className="text-center py-4 text-muted small">
                              No secondary branches configured yet. Click <strong>+ Add New Branch</strong> to expand this hotel brand.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SubTab 3: Software Billing & Invoicing */}
              {hotelSubTab === 'billing' && (
                <div className="p-3 p-sm-4">
                  <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-3">
                    <div>
                      <h6 className="fw-bold text-dark m-0">Software Subscription Billing &amp; Invoices</h6>
                      <p className="text-muted extra-small m-0 mt-0.5">
                        Track commercial SaaS subscription invoices, billing amounts, and payment settlements.
                      </p>
                    </div>

                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <span className="badge bg-success-subtle text-success border rounded-pill px-3 py-1.5 extra-small fw-bold flex-shrink-0">
                        Account Status: {selectedHotel.subscription?.payment_status || 'PAID'}
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-success d-flex align-items-center gap-1.5 extra-small fw-bold px-3 py-1.5 rounded-3 shadow-sm text-white"
                        style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', border: 'none' }}
                        onClick={() => handleOpenRecordPayment()}
                      >
                        <CreditCard size={13} />
                        <span>Record Payment</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary d-flex align-items-center gap-1.5 extra-small fw-bold px-3 py-1.5 rounded-3 shadow-sm"
                        onClick={() => {
                          const latestBill = (selectedHotel.billing_history && selectedHotel.billing_history[0]) || {
                            invoice_no: getDynamicInvoiceNo(selectedHotel.code),
                            billing_date: selectedHotel.subscription?.valid_from || formatLocalDate(new Date()),
                            valid_until: selectedHotel.subscription?.valid_until || getDefaultExpiryDate(1),
                            description: `SaaS Subscription - ${selectedHotel.subscription?.plan_name || 'Starter'} (Up to ${selectedHotel.total_rooms || 15} Rooms) (${selectedHotel.subscription?.billing_cycle || 'ANNUAL'})`,
                            plan_name: selectedHotel.subscription?.plan_name || 'Starter Plan',
                            billing_cycle: selectedHotel.subscription?.billing_cycle || 'ANNUAL',
                            amount: selectedHotel.subscription?.billing_amount || 9999,
                            status: selectedHotel.subscription?.payment_status || 'PAID'
                          };
                          handleOpenPrintBill(latestBill, selectedHotel);
                        }}
                      >
                        <Printer size={13} />
                        <span>Print Bill / Invoice</span>
                      </button>
                    </div>
                  </div>

                  <div className="table-responsive rounded-3 border mb-4 bg-white">
                    <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem', minWidth: '720px' }}>
                      <thead className="bg-light text-secondary extra-small text-uppercase fw-bold">
                        <tr>
                          <th className="ps-3.5 py-3">Invoice #</th>
                          <th>Billing Date</th>
                          <th>Description</th>
                          <th>Valid Term</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th className="pe-3.5 py-3 text-end">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedHotel.billing_history || []).map((bill, idx) => (
                          <tr key={idx}>
                            <td className="ps-3.5 fw-bold text-dark font-monospace">{bill.invoice_no}</td>
                            <td className="text-muted small">{bill.billing_date}</td>
                            <td className="fw-semibold text-dark">{bill.description}</td>
                            <td className="text-secondary small font-monospace">{bill.valid_until}</td>
                            <td className="fw-bold text-dark font-monospace">₹{bill.amount?.toLocaleString('en-IN')}</td>
                            <td>
                              <span className={`badge ${bill.status === 'PAID' ? 'bg-success' : bill.status === 'PARTIAL' ? 'bg-warning text-dark' : 'bg-danger'} text-white extra-small rounded-pill px-2.5 py-1`}>
                                {bill.status}
                              </span>
                            </td>
                            <td className="pe-3.5 text-end">
                              <div className="d-inline-flex align-items-center gap-1.5">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1 extra-small fw-semibold px-2.5 py-1 rounded-2 shadow-2xs hover-bg-light"
                                  onClick={() => handleOpenEditPayment(bill)}
                                  title="Edit this recorded payment entry"
                                >
                                  <Edit3 size={13} />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1.5 extra-small fw-semibold px-2.5 py-1 rounded-2 shadow-2xs"
                                  onClick={() => handleOpenPrintBill(bill, selectedHotel)}
                                  title="Print official A4 bill"
                                >
                                  <Printer size={13} />
                                  <span>Print Bill</span>
                                </button>
                                {bill.id && (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger d-inline-flex align-items-center justify-content-center p-1 rounded-2 shadow-2xs"
                                    onClick={() => handleDeletePayment(bill.id)}
                                    title="Delete this payment entry"
                                    style={{ width: '28px', height: '28px' }}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}

                        {(!selectedHotel.billing_history || selectedHotel.billing_history.length === 0) && (
                          <tr>
                            <td className="ps-3.5 fw-bold text-dark font-monospace">{getDynamicInvoiceNo(selectedHotel.code)}</td>
                            <td className="text-muted small">{selectedHotel.subscription?.valid_from || formatLocalDate(new Date())}</td>
                            <td className="fw-semibold text-dark">
                              SaaS Subscription - {selectedHotel.subscription?.plan_name || 'Starter'} (Up to {selectedHotel.total_rooms || 15} Rooms) ({selectedHotel.subscription?.billing_cycle || 'ANNUAL'})
                            </td>
                            <td className="text-secondary small font-monospace">{selectedHotel.subscription?.valid_until || getDefaultExpiryDate(1)}</td>
                            <td className="fw-bold text-dark font-monospace">₹{(selectedHotel.subscription?.billing_amount || 9999).toLocaleString('en-IN')}</td>
                            <td>
                              <span className={`badge ${selectedHotel.subscription?.payment_status === 'PAID' ? 'bg-success' : 'bg-warning text-dark'} text-white extra-small rounded-pill px-2.5 py-1`}>
                                {selectedHotel.subscription?.payment_status || 'PAID'}
                              </span>
                            </td>
                            <td className="pe-3.5 text-end">
                              <div className="d-inline-flex align-items-center gap-1.5">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1 extra-small fw-semibold px-2.5 py-1 rounded-2 shadow-2xs hover-bg-light"
                                  onClick={() => handleOpenEditPayment({
                                    id: null,
                                    invoice_no: getDynamicInvoiceNo(selectedHotel.code),
                                    billing_date: selectedHotel.subscription?.valid_from || formatLocalDate(new Date()),
                                    valid_until: selectedHotel.subscription?.valid_until || getDefaultExpiryDate(1),
                                    description: `SaaS Subscription - ${selectedHotel.subscription?.plan_name || 'Starter'} (Up to ${selectedHotel.total_rooms || 15} Rooms) (${selectedHotel.subscription?.billing_cycle || 'ANNUAL'})`,
                                    plan_name: selectedHotel.subscription?.plan_name || 'Starter Plan',
                                    billing_cycle: selectedHotel.subscription?.billing_cycle || 'ANNUAL',
                                    amount: selectedHotel.subscription?.billing_amount || 9999,
                                    status: selectedHotel.subscription?.payment_status || 'PAID'
                                  })}
                                  title="Edit recorded payment entry"
                                >
                                  <Edit3 size={13} />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1.5 extra-small fw-semibold px-2.5 py-1 rounded-2 shadow-2xs"
                                  onClick={() => handleOpenPrintBill({
                                    invoice_no: getDynamicInvoiceNo(selectedHotel.code),
                                    billing_date: selectedHotel.subscription?.valid_from || formatLocalDate(new Date()),
                                    valid_until: selectedHotel.subscription?.valid_until || getDefaultExpiryDate(1),
                                    description: `SaaS Subscription - ${selectedHotel.subscription?.plan_name || 'Starter'} (Up to ${selectedHotel.total_rooms || 15} Rooms) (${selectedHotel.subscription?.billing_cycle || 'ANNUAL'})`,
                                    plan_name: selectedHotel.subscription?.plan_name || 'Starter Plan',
                                    billing_cycle: selectedHotel.subscription?.billing_cycle || 'ANNUAL',
                                    amount: selectedHotel.subscription?.billing_amount || 9999,
                                    status: selectedHotel.subscription?.payment_status || 'PAID'
                                  }, selectedHotel)}
                                  title="Print official A4 bill"
                                >
                                  <Printer size={13} />
                                  <span>Print Bill</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SubTab 4: Profile & Location */}
              {hotelSubTab === 'profile' && (
                <div className="p-3 p-sm-4">
                  <h6 className="fw-bold text-dark mb-3">Hotel Information &amp; Branding</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Hotel Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={hotelFormData.name || ''}
                        onChange={(e) => setHotelFormData({ ...hotelFormData, name: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-sm-6 col-md-3">
                      <label className="form-label small fw-semibold d-flex align-items-center justify-content-between">
                        <span>Property Code</span>
                        <span className="badge bg-primary-subtle text-primary extra-small">Editable</span>
                      </label>
                      <input
                        type="text"
                        className="form-control font-monospace fw-bold text-uppercase"
                        value={hotelFormData.code || ''}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase().replace(/\s+/g, '-');
                          setHotelFormData({ ...hotelFormData, code: val });
                        }}
                        placeholder="e.g. PROP-ALPHA-01"
                        required
                      />
                      <span className="extra-small text-muted d-block mt-1">Unique PMS &amp; folio identifier</span>
                    </div>
                    <div className="col-12 col-sm-6 col-md-3">
                      <label className="form-label small fw-semibold">GSTIN</label>
                      <input
                        type="text"
                        className="form-control font-monospace"
                        value={hotelFormData.gstin || ''}
                        onChange={(e) => setHotelFormData({ ...hotelFormData, gstin: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">Address</label>
                      <input
                        type="text"
                        className="form-control"
                        value={hotelFormData.address || ''}
                        onChange={(e) => setHotelFormData({ ...hotelFormData, address: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-sm-6 col-md-3">
                      <label className="form-label small fw-semibold">City</label>
                      <input
                        type="text"
                        className="form-control"
                        value={hotelFormData.city || ''}
                        onChange={(e) => setHotelFormData({ ...hotelFormData, city: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-sm-6 col-md-3">
                      <label className="form-label small fw-semibold">State</label>
                      <input
                        type="text"
                        className="form-control"
                        value={hotelFormData.state || ''}
                        onChange={(e) => setHotelFormData({ ...hotelFormData, state: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="d-flex justify-content-end mt-2">
                    <button
                      type="button"
                      className="btn btn-primary fw-bold px-4 py-2.5 rounded-3 text-white shadow-xs d-flex align-items-center justify-content-center gap-2"
                      onClick={handleSaveHotelSettings}
                      disabled={savingHotel}
                      style={{ background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)' }}
                    >
                      <Save size={16} /> Save Profile
                    </button>
                  </div>
                </div>
              )}

              {/* SubTab 5: Staff Users & Branch Credentials */}
              {hotelSubTab === 'staff' && (
                <div className="p-3 p-sm-4">
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-3">
                    <div>
                      <h6 className="fw-bold text-dark m-0">Brand Staff &amp; Branch Credentials</h6>
                      <p className="text-muted extra-small m-0 mt-0.5">
                        Manage user accounts, passwords, and assigned locations for Managers and Receptionists.
                      </p>
                    </div>
                    <div className="d-flex flex-wrap align-items-center gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary rounded-3 text-nowrap"
                        onClick={() => handleResetPassword(selectedHotel.id, selectedHotel.name)}
                      >
                        <Key size={13} className="me-1 d-inline" /> Reset Owner Password
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary rounded-3 text-white fw-bold d-flex align-items-center gap-1.5 px-3 py-1.5"
                        onClick={() => handleOpenAddStaffModal()}
                        style={{ background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)' }}
                      >
                        <UserPlus size={15} />
                        <span>+ Add Staff User</span>
                      </button>
                    </div>
                  </div>

                  {/* Branch Unit Filter Bar */}
                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 p-2.5 bg-light rounded-3 border mb-3">
                    <div className="d-flex align-items-center gap-2">
                      <span className="extra-small fw-bold text-secondary text-uppercase">Filter Location:</span>
                      <select
                        className="form-select form-select-sm"
                        style={{ maxWidth: '280px', fontSize: '0.825rem' }}
                        value={staffBranchFilter}
                        onChange={(e) => setStaffBranchFilter(e.target.value)}
                      >
                        <option value="all">All Locations (Primary + Branches)</option>
                        <option value={selectedHotel.id}>[Main Hotel] {selectedHotel.name}</option>
                        {(selectedHotel.branches || []).map((b) => (
                          <option key={b.id} value={b.id}>
                            [Branch] {b.name} ({b.code})
                          </option>
                        ))}
                      </select>
                    </div>
                    <span className="extra-small text-muted">
                      Total Accounts: <strong>{selectedHotel.staff_users?.length || 0}</strong>
                    </span>
                  </div>

                  <div className="table-responsive rounded-3 border bg-white">
                    <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem', minWidth: '650px' }}>
                      <thead className="bg-light text-secondary extra-small text-uppercase fw-bold border-bottom">
                        <tr>
                          <th className="ps-3.5 py-2.5">User</th>
                          <th>Full Name</th>
                          <th>Role</th>
                          <th>Assigned Location</th>
                          <th>Email</th>
                          <th>Status</th>
                          <th className="text-end pe-3.5">Security Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedHotel.staff_users || [])
                          .filter((u) => staffBranchFilter === 'all' || String(u.property_id) === String(staffBranchFilter))
                          .map((u) => (
                            <tr key={u.id}>
                              <td className="ps-3.5">
                                <div className="d-flex align-items-center gap-2">
                                  <div
                                    className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold shadow-xs flex-shrink-0"
                                    style={{
                                      width: '30px',
                                      height: '30px',
                                      fontSize: '0.75rem',
                                      backgroundColor: u.role === 'HOTEL_OWNER' ? '#0F172A' : (u.role === 'MANAGER' ? '#2563EB' : '#0D9488')
                                    }}
                                  >
                                    {(u.first_name || u.username || 'U').charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="fw-bold text-dark font-monospace">{u.username}</div>
                                    <span className="extra-small text-muted font-monospace">#{u.id}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="text-dark fw-semibold">
                                {u.first_name || u.last_name ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : '—'}
                              </td>
                              <td>
                                <span className={`badge extra-small ${u.role === 'HOTEL_OWNER' ? 'bg-dark text-white' : (u.role === 'MANAGER' ? 'bg-primary text-white' : 'bg-teal-subtle text-teal border')}`} style={{ backgroundColor: u.role === 'RECEPTIONIST' ? '#CCFBF1' : undefined, color: u.role === 'RECEPTIONIST' ? '#0F766E' : undefined }}>
                                  {u.role}
                                </span>
                              </td>
                              <td>
                                <span className={`badge extra-small ${u.is_branch ? 'bg-info-subtle text-info border' : 'bg-primary-subtle text-primary border'}`}>
                                  {u.is_branch ? <GitBranch size={11} className="me-1 d-inline" /> : <Building2 size={11} className="me-1 d-inline" />}
                                  {u.property_name || selectedHotel.name}
                                </span>
                              </td>
                              <td className="text-muted extra-small">{u.email || 'N/A'}</td>
                              <td>
                                <span className={`badge rounded-pill extra-small ${u.is_active ? 'bg-success text-white' : 'bg-danger text-white'}`}>
                                  {u.is_active ? 'Active' : 'Suspended'}
                                </span>
                              </td>
                              <td className="text-end pe-3.5">
                                <div className="d-flex align-items-center justify-content-end gap-1.5">
                                  <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-sm py-0.5 px-2 extra-small rounded-2 d-flex align-items-center gap-1"
                                    onClick={() => handleOpenResetStaffModal(u)}
                                    title="Reset password"
                                  >
                                    <Key size={12} />
                                    <span>Reset</span>
                                  </button>
                                  {u.role !== 'HOTEL_OWNER' && (
                                    <button
                                      type="button"
                                      className="btn btn-outline-danger btn-sm p-1 extra-small rounded-2"
                                      onClick={() => handleDeleteStaff(u.id, u.username)}
                                      disabled={deletingStaffId === u.id}
                                      title="Delete staff user"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}

                        {(!selectedHotel.staff_users || selectedHotel.staff_users.length === 0) && (
                          <tr>
                            <td colSpan="7" className="text-center py-4 text-muted small">
                              No staff users registered yet. Click <strong>+ Add Staff User</strong> to create credentials.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

          </div>
        ) : (
          <div>
            {/* ========================================================= */}
            {/* 📊 TAB 1: SAAS EXECUTIVE OVERVIEW                         */}
            {/* ========================================================= */}
            {activeTab === 'overview' && (
              <div className="animate-fadeIn">
                {/* Top KPI Cards Row */}
                <div className="row g-3 mb-4">
                  {/* Card 1: Onboarded Properties */}
                  <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card border-0 shadow-sm rounded-4 p-3.5 bg-white h-100 position-relative overflow-hidden" style={{ border: '1px solid #E2E8F0' }}>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="text-secondary extra-small fw-bold text-uppercase tracking-wider">ONBOARDED HOTELS</span>
                        <div className="p-2 rounded-3 bg-primary-subtle text-primary">
                          <Building2 size={18} />
                        </div>
                      </div>
                      <div className="fs-2 fw-bold text-dark font-monospace mb-1">{properties.length}</div>
                      <div className="d-flex align-items-center gap-2 extra-small">
                        <span className="badge bg-success-subtle text-success rounded-pill px-2 py-0.5">{activeCount} Active</span>
                        {suspendedCount > 0 && (
                          <span className="badge bg-danger-subtle text-danger rounded-pill px-2 py-0.5">{suspendedCount} Suspended</span>
                        )}
                        <span className="text-muted">{totalBranchesAll} Branches</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Managed Room Capacity */}
                  <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card border-0 shadow-sm rounded-4 p-3.5 bg-white h-100 position-relative overflow-hidden" style={{ border: '1px solid #E2E8F0' }}>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="text-secondary extra-small fw-bold text-uppercase tracking-wider">ROOM CAPACITY CAP</span>
                        <div className="p-2 rounded-3 bg-info-subtle text-info">
                          <DoorOpen size={18} />
                        </div>
                      </div>
                      <div className="fs-2 fw-bold text-dark font-monospace mb-1">{totalCapacityCap}</div>
                      <div className="d-flex align-items-center gap-2 extra-small text-muted">
                        <span className="text-dark fw-semibold">{totalRoomsConfigured}</span> rooms live in inventory
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Live Active Stays */}
                  <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card border-0 shadow-sm rounded-4 p-3.5 bg-white h-100 position-relative overflow-hidden" style={{ border: '1px solid #E2E8F0' }}>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="text-secondary extra-small fw-bold text-uppercase tracking-wider">LIVE ACTIVE OCCUPANCY</span>
                        <div className="p-2 rounded-3 bg-success-subtle text-success">
                          <Users size={18} />
                        </div>
                      </div>
                      <div className="fs-2 fw-bold text-success font-monospace mb-1">{totalActiveStays}</div>
                      <div className="extra-small text-muted">
                        Total Bookings: <strong className="text-dark font-monospace">{healthData?.platform_metrics?.total_bookings_recorded ?? '–'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Estimated ARR / MRR */}
                  <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card border-0 shadow-sm rounded-4 p-3.5 bg-white h-100 position-relative overflow-hidden" style={{ border: '1px solid #E2E8F0' }}>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="text-secondary extra-small fw-bold text-uppercase tracking-wider">RECURRING REVENUE (ARR)</span>
                        <div className="p-2 rounded-3 bg-warning-subtle text-warning">
                          <DollarSign size={18} />
                        </div>
                      </div>
                      <div className="fs-2 fw-bold text-dark font-monospace mb-1">₹{estimatedARR.toLocaleString('en-IN')}</div>
                      <div className="extra-small text-muted">
                        MRR Est: <strong className="text-dark font-monospace">₹{estimatedMRR.toLocaleString('en-IN')} / mo</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subsystem & Cluster Status Banner */}
                <div
                  className="card border-0 shadow-sm rounded-4 p-3.5 mb-4 text-white overflow-hidden"
                  style={{
                    background: healthData?.status === 'DEGRADED' || healthData?.status === 'CRITICAL'
                      ? 'linear-gradient(135deg, #881337 0%, #9F1239 50%, #BE123C 100%)'
                      : healthData?.status === 'WARNING'
                      ? 'linear-gradient(135deg, #78350F 0%, #92400E 50%, #B45309 100%)'
                      : 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)'
                  }}
                >
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{
                          width: '40px',
                          height: '40px',
                          backgroundColor: healthData?.status === 'DEGRADED'
                            ? 'rgba(239, 68, 68, 0.2)'
                            : healthData?.status === 'WARNING'
                            ? 'rgba(245, 158, 11, 0.2)'
                            : 'rgba(16, 185, 129, 0.2)',
                          color: healthData?.status === 'DEGRADED'
                            ? '#EF4444'
                            : healthData?.status === 'WARNING'
                            ? '#F59E0B'
                            : '#10B981'
                        }}
                      >
                        <Activity size={22} className="animate-pulse" />
                      </div>
                      <div>
                        <div className="d-flex align-items-center gap-2">
                          <h6 className="fw-bold text-white m-0">
                            {healthData?.headline || 'SaaS Multi-Tenant Host Cluster Operational'}
                          </h6>
                          <span
                            className={`badge ${
                              healthData?.status === 'DEGRADED'
                                ? 'bg-danger text-white'
                                : healthData?.status === 'WARNING'
                                ? 'bg-warning text-dark'
                                : 'bg-success text-white'
                            } rounded-pill extra-small px-2 py-0.5 font-monospace`}
                          >
                            ● {healthData?.cluster_status || (healthData?.status ? healthData.status : 'Operational')}
                          </span>
                        </div>
                        <p className="text-white-50 extra-small m-0 mt-0.5">
                          DB Latency: <strong className="text-white font-monospace">{healthData?.database?.latency_ms !== undefined ? `${healthData.database.latency_ms} ms` : 'Measuring...'}</strong> · Isolation: <strong className="text-white">{healthData?.tenant_isolation?.status_label || healthData?.tenant_isolation?.status || 'Enforced'}</strong> · Engine: <strong className="text-white font-monospace">{healthData?.database?.engine || 'SQLITE'}</strong> · Host: <strong className="text-white">Python {healthData?.server_environment?.python_version || '3.x'} / Django {healthData?.server_environment?.django_version || '5.x'}</strong>
                        </p>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setActiveTab('health')}
                        className="btn btn-sm btn-outline-light rounded-3 px-3 py-1.5 extra-small fw-semibold d-flex align-items-center gap-1.5"
                      >
                        <Server size={14} /> View Health Diagnostics
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('properties')}
                        className="btn btn-sm btn-primary rounded-3 px-3 py-1.5 extra-small fw-bold d-flex align-items-center gap-1.5"
                        style={{ background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)', border: 'none' }}
                      >
                        <Building2 size={14} /> Open Hotels Directory
                      </button>
                    </div>
                  </div>
                </div>

                {/* Two-Column Deck */}
                <div className="row g-3.5 mb-4">
                  {/* Left Column: Subscriptions Distribution & Quick Actions */}
                  <div className="col-12 col-lg-7">
                    {/* Plans Breakdown Card */}
                    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-3.5" style={{ border: '1px solid #E2E8F0' }}>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                          <h6 className="fw-bold text-dark m-0">Subscription Tiers &amp; Capacity Quotas</h6>
                          <p className="text-secondary extra-small m-0 mt-0.5">Distribution of subscriber hotels across pricing tiers</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('subscriptions')}
                          className="btn btn-sm btn-outline-primary rounded-3 px-2.5 py-1 extra-small fw-semibold d-flex align-items-center gap-1"
                        >
                          <Layers size={13} /> Manage Plans
                        </button>
                      </div>

                      <div className="row g-2.5">
                        {(subscriptionsData?.plans || []).slice(0, 4).map((plan) => (
                          <div key={plan.id} className="col-6 col-sm-3">
                            <div className="p-3 rounded-3 bg-light border text-center">
                              <span className="badge bg-primary-subtle text-primary rounded-pill px-2 py-0.5 extra-small fw-bold mb-1">
                                {plan.code}
                              </span>
                              <div className="fs-4 fw-bold text-dark font-monospace">{plan.subscribers_count || 0}</div>
                              <div className="extra-small text-muted text-truncate" title={plan.name}>{plan.name}</div>
                              <div className="extra-small text-secondary font-monospace mt-1">
                                {plan.max_rooms >= 9999 ? 'Unlimited' : `${plan.max_rooms} Rms`}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 pt-3 border-top d-flex justify-content-between align-items-center">
                        <span className="extra-small text-secondary">Looking to set custom room limits, charges, or validity dates?</span>
                        <button
                          type="button"
                          onClick={() => handleOpenCustomSubModal()}
                          className="btn btn-sm btn-light border rounded-3 px-3 py-1 extra-small fw-bold text-dark hover-bg-light d-flex align-items-center gap-1.5"
                        >
                          <Sparkles size={13} className="text-warning" /> Assign Custom Plan
                        </button>
                      </div>
                    </div>

                    {/* Quick Platform Actions Card */}
                    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white" style={{ border: '1px solid #E2E8F0' }}>
                      <h6 className="fw-bold text-dark mb-2">Platform Management Shortcuts</h6>
                      <div className="row g-2">
                        <div className="col-6 col-sm-3">
                          <button
                            type="button"
                            onClick={() => setShowOnboardModal(true)}
                            className="btn btn-light border w-100 py-3 rounded-3 text-center d-flex flex-column align-items-center justify-content-center gap-1 hover-lift"
                          >
                            <PlusCircle size={20} className="text-primary" />
                            <span className="extra-small fw-bold text-dark">Onboard Hotel</span>
                          </button>
                        </div>
                        <div className="col-6 col-sm-3">
                          <button
                            type="button"
                            onClick={() => handleOpenCustomSubModal()}
                            className="btn btn-light border w-100 py-3 rounded-3 text-center d-flex flex-column align-items-center justify-content-center gap-1 hover-lift"
                          >
                            <SlidersHorizontal size={20} className="text-success" />
                            <span className="extra-small fw-bold text-dark">Custom Contract</span>
                          </button>
                        </div>
                        <div className="col-6 col-sm-3">
                          <button
                            type="button"
                            onClick={handleOpenCreatePlanModal}
                            className="btn btn-light border w-100 py-3 rounded-3 text-center d-flex flex-column align-items-center justify-content-center gap-1 hover-lift"
                          >
                            <Layers size={20} className="text-info" />
                            <span className="extra-small fw-bold text-dark">Create Plan Tier</span>
                          </button>
                        </div>
                        <div className="col-6 col-sm-3">
                          <button
                            type="button"
                            onClick={handleRefreshHealth}
                            className="btn btn-light border w-100 py-3 rounded-3 text-center d-flex flex-column align-items-center justify-content-center gap-1 hover-lift"
                          >
                            <RefreshCw size={20} className={`text-warning ${healthRefreshing ? 'animate-spin' : ''}`} />
                            <span className="extra-small fw-bold text-dark">Diagnostics Ping</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Expiring Subscriptions Watchlist */}
                  <div className="col-12 col-lg-5">
                    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100" style={{ border: '1px solid #E2E8F0' }}>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex align-items-center gap-2">
                          <AlertTriangle size={18} className="text-warning flex-shrink-0" />
                          <div>
                            <h6 className="fw-bold text-dark m-0">Expiring Subscriptions Watchlist</h6>
                            <span className="text-secondary extra-small">Properties expiring within 15 days</span>
                          </div>
                        </div>
                        <span className={`badge rounded-pill px-2.5 py-1 extra-small fw-bold ${expiringCount > 0 ? 'bg-danger text-white' : 'bg-success-subtle text-success'}`}>
                          {expiringCount} Due
                        </span>
                      </div>

                      {(subscriptionsData?.expiring_properties || []).length > 0 ? (
                        <div className="d-flex flex-column gap-2.5">
                          {subscriptionsData.expiring_properties.map((item, idx) => {
                            const days = getSubscriptionDaysLeft(item);
                            const isCritical = days <= 5;
                            const isHigh = days <= 10 && days > 5;
                            return (
                              <div
                                key={idx}
                                className="p-3 rounded-3 border d-flex align-items-center justify-content-between gap-2"
                                style={{
                                  backgroundColor: isCritical ? '#FEF2F2' : isHigh ? '#FFFBEB' : '#F8FAFC',
                                  borderColor: isCritical ? '#FECACA' : isHigh ? '#FDE68A' : '#E2E8F0'
                                }}
                              >
                                <div className="overflow-hidden">
                                  <div className="fw-bold text-dark small text-truncate">{item.property_name}</div>
                                  <div className="extra-small text-muted d-flex align-items-center gap-1.5 mt-0.5">
                                    <span className="font-monospace text-secondary">{item.property_code}</span>
                                    <span>·</span>
                                    <span>{item.plan_name}</span>
                                  </div>
                                  <div className="extra-small text-secondary mt-1">
                                    Exp: <strong className="text-dark font-monospace">{item.valid_until}</strong>
                                  </div>
                                </div>

                                <div className="d-flex flex-column align-items-end gap-1.5 flex-shrink-0">
                                  <span
                                    className={`badge rounded-pill extra-small px-2 py-0.5 fw-bold ${
                                      isCritical
                                        ? 'bg-danger text-white'
                                        : isHigh
                                        ? 'bg-warning text-dark'
                                        : 'bg-secondary text-white'
                                    }`}
                                  >
                                    {days <= 0 ? 'Expired' : `${days}d left`}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const propMatch = properties.find(p => p.id === item.property_id || p.code === item.property_code);
                                      if (propMatch) {
                                        handleOpenCustomSubModal(propMatch);
                                      } else {
                                        handleOpenCustomSubModal();
                                      }
                                    }}
                                    className="btn btn-sm btn-white border rounded-2 px-2 py-0.5 extra-small fw-semibold text-primary hover-bg-light"
                                  >
                                    Extend / Custom
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-4 rounded-3 bg-light border text-center my-auto">
                          <CheckCircle2 size={32} className="text-success mx-auto mb-2" />
                          <div className="fw-bold text-dark small">All Subscriptions Active &amp; Healthy</div>
                          <p className="text-secondary extra-small m-0 mt-1">
                            No property software licenses are expiring within the next 15 days.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* 📋 TAB 2: ALL HOTELS DIRECTORY (MAIN VIEW)               */}
            {/* ========================================================= */}
            {activeTab === 'properties' && (
              <div>
            
            {/* SaaS Global Telemetry Hero Banner */}
            <div
              className="card border-0 shadow-lg rounded-4 p-4 p-md-4 mb-4 text-white overflow-hidden position-relative"
              style={{
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.4)'
              }}
            >
              <div className="row g-4 align-items-center">
                <div className="col-lg-6">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="badge bg-primary-subtle text-info border border-info-subtle rounded-pill px-2.5 py-1 extra-small fw-bold">
                      <Sparkles size={12} className="me-1 d-inline text-warning" /> SAAS HOST CLUSTER
                    </span>
                    <span className="badge bg-dark border border-secondary text-white rounded-pill px-2 py-0.5 extra-small">
                      v2.4 LTS
                    </span>
                  </div>
                  <h3 className="fw-bold text-white mb-1" style={{ letterSpacing: '-0.025em' }}>
                    Multi-Tenant Hotel Governance Command Center
                  </h3>
                  <p className="text-white-50 small m-0">
                    Centralized management for subscription life cycles, overall room capacity caps, and multi-branch governance.
                  </p>
                </div>

                <div className="col-lg-6">
                  <div className="row g-2">
                    <div className="col-6 col-sm-3">
                      <div className="p-3 rounded-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <span className="text-white-50 extra-small fw-semibold d-block">PROPERTIES</span>
                        <div className="fs-4 fw-bold font-monospace mt-0.5">{properties.length}</div>
                        <span className="extra-small text-success fw-bold">{activeLodgesCount} Active</span>
                      </div>
                    </div>

                    <div className="col-6 col-sm-3">
                      <div className="p-3 rounded-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <span className="text-white-50 extra-small fw-semibold d-block">OVERALL ROOMS</span>
                        <div className="fs-4 fw-bold font-monospace mt-0.5">{totalRoomsManaged}</div>
                        <span className="extra-small text-info fw-semibold">Capacity Cap</span>
                      </div>
                    </div>

                    <div className="col-6 col-sm-3">
                      <div className="p-3 rounded-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <span className="text-white-50 extra-small fw-semibold d-block">EST. MRR</span>
                        <div className="fs-4 fw-bold font-monospace mt-0.5">₹{estimatedMRR.toLocaleString('en-IN')}</div>
                        <span className="extra-small text-warning fw-semibold">Run-rate</span>
                      </div>
                    </div>

                    <div className="col-6 col-sm-3">
                      <div className="p-3 rounded-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <span className="text-white-50 extra-small fw-semibold d-block">EXPIRING SOON</span>
                        <div className="fs-4 fw-bold font-monospace mt-0.5">{expiringCount}</div>
                        <span className={`extra-small fw-bold ${expiringCount > 0 ? 'text-danger' : 'text-success'}`}>
                          {expiringCount > 0 ? 'Action Req' : 'All Healthy'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Zoho Books Style Segment Filter & Search Toolbar */}
            <div className="card border-0 shadow-sm bg-white p-3.5 rounded-4 mb-4" style={{ border: '1px solid #E2E8F0', padding: '18px 22px' }}>
              <div className="d-flex flex-column flex-xl-row justify-content-between align-items-xl-center gap-3">
                
                {/* Search Input */}
                <div className="flex-grow-1" style={{ maxWidth: '440px' }}>
                  <div className="input-group input-group-md rounded-3 border overflow-hidden shadow-2xs">
                    <span className="input-group-text bg-light border-0 text-muted ps-3">
                      <Search size={16} />
                    </span>
                    <input
                      type="text"
                      className="form-control border-0 bg-light shadow-none ps-2"
                      placeholder="Search hotels, codes, owner, city..."
                      style={{ fontSize: '0.875rem' }}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        className="btn btn-light border-0 text-secondary pe-3"
                        onClick={() => setSearchQuery('')}
                        title="Clear Search"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter Chips, Column Visibility & View Mode Toggle */}
                <div className="d-flex flex-wrap align-items-center gap-2.5">
                  
                  {/* Status Pills */}
                  <div className="btn-group p-1 bg-light rounded-3 border" style={{ borderColor: '#E2E8F0' }} role="group">
                    <button
                      type="button"
                      onClick={() => setStatusFilter('all')}
                      className={`btn btn-sm rounded-2 py-1 px-3 extra-small fw-bold transition-all ${statusFilter === 'all' ? 'btn-white shadow-2xs text-dark' : 'text-secondary border-0'}`}
                    >
                      All ({properties.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('active')}
                      className={`btn btn-sm rounded-2 py-1 px-3 extra-small fw-bold transition-all ${statusFilter === 'active' ? 'btn-white shadow-2xs text-success' : 'text-secondary border-0'}`}
                    >
                      ● Active ({activeLodgesCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('expiring')}
                      className={`btn btn-sm rounded-2 py-1 px-3 extra-small fw-bold transition-all ${statusFilter === 'expiring' ? 'btn-white shadow-2xs text-warning-emphasis' : 'text-secondary border-0'}`}
                    >
                      ⚠️ Expiring ({expiringCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('suspended')}
                      className={`btn btn-sm rounded-2 py-1 px-3 extra-small fw-bold transition-all ${statusFilter === 'suspended' ? 'btn-white shadow-2xs text-danger' : 'text-secondary border-0'}`}
                    >
                      ■ Suspended ({properties.length - activeLodgesCount})
                    </button>
                  </div>

                  {/* Column Visibility Filter Dropdown */}
                  <div className="position-relative" ref={columnFilterRef}>
                    <button
                      type="button"
                      onClick={() => setShowColumnFilter(!showColumnFilter)}
                      className="btn btn-white border rounded-3 py-1.5 px-3 extra-small fw-bold d-flex align-items-center gap-2 shadow-2xs text-dark transition-all"
                      style={{ borderColor: '#E2E8F0', height: '36px' }}
                      title="Toggle visible table columns"
                    >
                      <SlidersHorizontal size={14} className="text-primary" />
                      <span>Columns</span>
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill font-monospace" style={{ fontSize: '0.675rem' }}>
                        {visibleColumnCount}/7
                      </span>
                      <ChevronDown size={12} className={`transition-all ${showColumnFilter ? 'rotate-180' : ''}`} />
                    </button>

                    {showColumnFilter && (
                      <div
                        className="position-absolute end-0 top-100 mt-2 bg-white rounded-4 shadow-lg border p-3 z-3 animate-fadeIn"
                        style={{
                          width: '260px',
                          borderColor: '#E2E8F0',
                          boxShadow: '0 15px 35px -5px rgba(15, 23, 42, 0.18)',
                          zIndex: 1050
                        }}
                      >
                        <div className="d-flex align-items-center justify-content-between pb-2 mb-2 border-bottom">
                          <span className="extra-small fw-bold text-uppercase text-secondary" style={{ letterSpacing: '0.05em' }}>
                            Toggle Columns
                          </span>
                          <div className="d-flex align-items-center gap-1">
                            <button
                              type="button"
                              className="btn btn-link p-0 extra-small text-decoration-none text-primary fw-semibold"
                              onClick={() => setAllColumns(true)}
                            >
                              Show All
                            </button>
                            <span className="text-muted extra-small">&bull;</span>
                            <button
                              type="button"
                              className="btn btn-link p-0 extra-small text-decoration-none text-secondary"
                              onClick={() => setAllColumns(false)}
                            >
                              Hide
                            </button>
                          </div>
                        </div>

                        <div className="d-flex flex-column gap-2">
                          {[
                            { key: 'hotel', label: 'Hotel & Code', icon: Building2, lock: true },
                            { key: 'owner', label: 'Owner & Contact', icon: Users },
                            { key: 'capacity', label: 'Branches & Capacity', icon: GitBranch },
                            { key: 'billing', label: 'Subscription & Billing', icon: CreditCard },
                            { key: 'validity', label: 'Validity & Expiry', icon: Calendar },
                            { key: 'status', label: 'Operational Status', icon: Power },
                            { key: 'actions', label: 'Developer Actions', icon: SlidersHorizontal }
                          ].map((col) => {
                            const Icon = col.icon;
                            const isChecked = columnVisibility[col.key];

                            return (
                              <label
                                key={col.key}
                                className={`d-flex align-items-center justify-content-between p-2 rounded-2 cursor-pointer transition-all ${
                                  isChecked ? 'bg-light' : 'hover-bg-light'
                                }`}
                                style={{ cursor: col.lock ? 'not-allowed' : 'pointer' }}
                              >
                                <div className="d-flex align-items-center gap-2">
                                  <Icon size={14} className={isChecked ? 'text-primary' : 'text-muted'} />
                                  <span className={`extra-small fw-medium ${isChecked ? 'text-dark fw-semibold' : 'text-secondary'}`}>
                                    {col.label}
                                  </span>
                                </div>
                                <input
                                  type="checkbox"
                                  className="form-check-input mt-0"
                                  checked={isChecked}
                                  disabled={col.lock}
                                  onChange={() => !col.lock && toggleColumn(col.key)}
                                />
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* View Mode Toggle */}
                  <div className="btn-group p-1 bg-light rounded-3 border" style={{ borderColor: '#E2E8F0', height: '36px' }} role="group">
                    <button
                      type="button"
                      onClick={() => setViewMode('table')}
                      className={`btn btn-sm rounded-2 px-2.5 transition-all d-flex align-items-center ${viewMode === 'table' ? 'btn-white shadow-2xs text-primary' : 'text-secondary border-0'}`}
                      title="Table View"
                    >
                      <TableProperties size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      className={`btn btn-sm rounded-2 px-2.5 transition-all d-flex align-items-center ${viewMode === 'grid' ? 'btn-white shadow-2xs text-primary' : 'text-secondary border-0'}`}
                      title="Grid Cards View"
                    >
                      <LayoutGrid size={15} />
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* VIEW MODE A: TABLE VIEW */}
            {viewMode === 'table' && (
              <div
                className="card border-0 shadow-sm bg-white rounded-4 overflow-hidden mb-4"
                style={{
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05)'
                }}
              >
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                    <thead className="bg-slate-50 border-bottom" style={{ backgroundColor: '#F8FAFC' }}>
                      <tr>
                        {/* 1. Hotel & Code */}
                        {columnVisibility.hotel && (
                          <th
                            className="ps-4 py-3.5 cursor-pointer user-select-none transition-all"
                            onClick={() => handleSort('name')}
                            style={{ cursor: 'pointer' }}
                            title="Click to sort by Hotel Name"
                          >
                            <div className="d-flex align-items-center gap-2">
                              <span className={`extra-small text-uppercase fw-bold ${sortField === 'name' ? 'text-primary' : 'text-secondary'}`} style={{ letterSpacing: '0.04em' }}>
                                HOTEL &amp; CODE
                              </span>
                              <div className={`p-1 rounded d-flex align-items-center ${sortField === 'name' ? 'bg-primary-subtle text-primary' : 'text-muted'}`}>
                                {sortField === 'name' ? (
                                  sortOrder === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                                ) : (
                                  <ArrowUpDown size={12} className="opacity-40" />
                                )}
                              </div>
                            </div>
                          </th>
                        )}

                        {/* 2. Owner & Contact */}
                        {columnVisibility.owner && (
                          <th
                            className="py-3.5 cursor-pointer user-select-none transition-all"
                            onClick={() => handleSort('owner')}
                            style={{ cursor: 'pointer' }}
                            title="Click to sort by Owner Name"
                          >
                            <div className="d-flex align-items-center gap-2">
                              <span className={`extra-small text-uppercase fw-bold ${sortField === 'owner' ? 'text-primary' : 'text-secondary'}`} style={{ letterSpacing: '0.04em' }}>
                                OWNER / CONTACT
                              </span>
                              <div className={`p-1 rounded d-flex align-items-center ${sortField === 'owner' ? 'bg-primary-subtle text-primary' : 'text-muted'}`}>
                                {sortField === 'owner' ? (
                                  sortOrder === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                                ) : (
                                  <ArrowUpDown size={12} className="opacity-40" />
                                )}
                              </div>
                            </div>
                          </th>
                        )}

                        {/* 3. Branches & Capacity */}
                        {columnVisibility.capacity && (
                          <th
                            className="py-3.5 cursor-pointer user-select-none transition-all"
                            onClick={() => handleSort('capacity')}
                            style={{ cursor: 'pointer' }}
                            title="Click to sort by Room Capacity"
                          >
                            <div className="d-flex align-items-center gap-2">
                              <span className={`extra-small text-uppercase fw-bold ${sortField === 'capacity' ? 'text-primary' : 'text-secondary'}`} style={{ letterSpacing: '0.04em' }}>
                                BRANCHES &amp; CAPACITY
                              </span>
                              <div className={`p-1 rounded d-flex align-items-center ${sortField === 'capacity' ? 'bg-primary-subtle text-primary' : 'text-muted'}`}>
                                {sortField === 'capacity' ? (
                                  sortOrder === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                                ) : (
                                  <ArrowUpDown size={12} className="opacity-40" />
                                )}
                              </div>
                            </div>
                          </th>
                        )}

                        {/* 4. Subscription & Billing */}
                        {columnVisibility.billing && (
                          <th
                            className="py-3.5 cursor-pointer user-select-none transition-all"
                            onClick={() => handleSort('billing')}
                            style={{ cursor: 'pointer' }}
                            title="Click to sort by Billing Amount"
                          >
                            <div className="d-flex align-items-center gap-2">
                              <span className={`extra-small text-uppercase fw-bold ${sortField === 'billing' ? 'text-primary' : 'text-secondary'}`} style={{ letterSpacing: '0.04em' }}>
                                SUBSCRIPTION &amp; BILLING
                              </span>
                              <div className={`p-1 rounded d-flex align-items-center ${sortField === 'billing' ? 'bg-primary-subtle text-primary' : 'text-muted'}`}>
                                {sortField === 'billing' ? (
                                  sortOrder === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                                ) : (
                                  <ArrowUpDown size={12} className="opacity-40" />
                                )}
                              </div>
                            </div>
                          </th>
                        )}

                        {/* 5. Validity */}
                        {columnVisibility.validity && (
                          <th
                            className="py-3.5 cursor-pointer user-select-none transition-all"
                            onClick={() => handleSort('validity')}
                            style={{ cursor: 'pointer' }}
                            title="Click to sort by Expiry Date"
                          >
                            <div className="d-flex align-items-center gap-2">
                              <span className={`extra-small text-uppercase fw-bold ${sortField === 'validity' ? 'text-primary' : 'text-secondary'}`} style={{ letterSpacing: '0.04em' }}>
                                VALIDITY
                              </span>
                              <div className={`p-1 rounded d-flex align-items-center ${sortField === 'validity' ? 'bg-primary-subtle text-primary' : 'text-muted'}`}>
                                {sortField === 'validity' ? (
                                  sortOrder === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                                ) : (
                                  <ArrowUpDown size={12} className="opacity-40" />
                                )}
                              </div>
                            </div>
                          </th>
                        )}

                        {/* 6. Status */}
                        {columnVisibility.status && (
                          <th
                            className="py-3.5 cursor-pointer user-select-none transition-all"
                            onClick={() => handleSort('status')}
                            style={{ cursor: 'pointer' }}
                            title="Click to sort by Operational Status"
                          >
                            <div className="d-flex align-items-center gap-2">
                              <span className={`extra-small text-uppercase fw-bold ${sortField === 'status' ? 'text-primary' : 'text-secondary'}`} style={{ letterSpacing: '0.04em' }}>
                                STATUS
                              </span>
                              <div className={`p-1 rounded d-flex align-items-center ${sortField === 'status' ? 'bg-primary-subtle text-primary' : 'text-muted'}`}>
                                {sortField === 'status' ? (
                                  sortOrder === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                                ) : (
                                  <ArrowUpDown size={12} className="opacity-40" />
                                )}
                              </div>
                            </div>
                          </th>
                        )}

                        {/* 7. Developer Actions */}
                        {columnVisibility.actions && (
                          <th className="text-end pe-4 py-3.5 text-secondary extra-small text-uppercase fw-bold" style={{ letterSpacing: '0.04em' }}>
                            DEVELOPER ACTIONS
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedProperties.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center py-5 text-muted">
                            <Building2 size={36} className="text-secondary opacity-30 mb-2" />
                            <div className="fw-semibold text-dark">No hotels match your filters</div>
                            <p className="extra-small text-muted mb-0 mt-1">Try adjusting your search query or reset status filter to 'All'.</p>
                          </td>
                        </tr>
                      ) : (
                        sortedProperties.map((p) => {
                          const sub = p.subscription;
                          const isExp = getIsSubscriptionExpired(sub);
                          const daysLeft = getSubscriptionDaysLeft(sub);

                          // Dynamic Plan Styling
                          const planCode = sub?.plan_code || 'STARTER';
                          let planBadgeStyle = { bg: '#F0F9FF', text: '#0284C7', border: '#BAE6FD', label: sub?.plan_name || 'Starter Plan' };
                          if (planCode === 'GROWTH') {
                            planBadgeStyle = { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE', label: sub?.plan_name || 'Growth Plan' };
                          } else if (planCode === 'ENTERPRISE') {
                            planBadgeStyle = { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE', label: sub?.plan_name || 'Enterprise Plan' };
                          } else if (planCode === 'FREE_TRIAL') {
                            planBadgeStyle = { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A', label: sub?.plan_name || 'Free Trial' };
                          }

                          return (
                            <tr key={p.id} className="transition-all" style={{ borderBottom: '1px solid #F1F5F9' }}>
                              
                              {/* 1. Hotel & Code */}
                              {columnVisibility.hotel && (
                                <td className="ps-4 py-3.5">
                                  <div className="d-flex align-items-center" style={{ gap: '16px' }}>
                                    <div
                                      className="d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0 shadow-2xs"
                                      style={{
                                        width: '42px',
                                        height: '42px',
                                        minWidth: '42px',
                                        borderRadius: '12px',
                                        background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                                        fontSize: '0.95rem',
                                        letterSpacing: '0'
                                      }}
                                    >
                                      {p.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                      <div
                                        className="fw-bold text-dark text-truncate cursor-pointer hover-text-primary transition-all"
                                        style={{ fontSize: '0.925rem', letterSpacing: '-0.015em', maxWidth: '240px' }}
                                        title={p.name}
                                        onClick={() => handleOpenHotelConsole(p.id)}
                                      >
                                        {p.name}
                                      </div>
                                      <div className="extra-small d-flex align-items-center gap-2 mt-1">
                                        <span
                                          className="badge font-monospace px-2 py-0.5 rounded-2 shadow-2xs"
                                          style={{
                                            backgroundColor: '#0F172A',
                                            color: '#FFFFFF',
                                            fontSize: '0.72rem',
                                            fontWeight: 700,
                                            letterSpacing: '0.03em',
                                            border: '1px solid #1E293B'
                                          }}
                                        >
                                          {p.code}
                                        </span>
                                        {p.operation_mode === 'SINGLE_OWNER' ? (
                                          <span
                                            className="badge px-2 py-0.5 rounded-2 d-inline-flex align-items-center gap-1"
                                            style={{ backgroundColor: '#F0FDFA', color: '#0F766E', border: '1px solid #CCFBF1', fontSize: '0.7rem', fontWeight: 600 }}
                                            title="Single Owner Mode: Direct management without shifts"
                                          >
                                            <UserCheck size={10} /> Single Owner
                                          </span>
                                        ) : (
                                          <span
                                            className="badge px-2 py-0.5 rounded-2 d-inline-flex align-items-center gap-1"
                                            style={{ backgroundColor: '#EEF2FF', color: '#4338CA', border: '1px solid #E0E7FF', fontSize: '0.7rem', fontWeight: 600 }}
                                            title="Shift-Wise Mode: Multi-staff shifts and till handovers"
                                          >
                                            <Clock size={10} /> Shift-Wise
                                          </span>
                                        )}
                                        {p.city && (
                                          <span className="text-secondary text-truncate d-flex align-items-center gap-1" style={{ fontSize: '0.75rem', maxWidth: '140px' }}>
                                            <MapPin size={11} className="text-muted flex-shrink-0" /> {p.city}{p.state ? `, ${p.state}` : ''}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              )}

                              {/* 2. Owner & Contact */}
                              {columnVisibility.owner && (
                                <td className="py-3.5">
                                  <div className="fw-semibold text-dark" style={{ fontSize: '0.875rem' }}>
                                    {p.owner_name || 'Owner Unset'}
                                  </div>
                                  <div className="text-secondary extra-small d-flex align-items-center gap-1.5 mt-0.5" style={{ fontSize: '0.75rem' }}>
                                    <Mail size={11} className="text-muted flex-shrink-0" />
                                    <span className="text-truncate" style={{ maxWidth: '170px' }}>{p.owner_email || 'No email'}</span>
                                  </div>
                                  {p.owner_phone && (
                                    <div className="text-secondary extra-small d-flex align-items-center gap-1.5 mt-0.5" style={{ fontSize: '0.75rem' }}>
                                      <Phone size={11} className="text-muted flex-shrink-0" />
                                      <span>{p.owner_phone}</span>
                                    </div>
                                  )}
                                </td>
                              )}

                              {/* 3. Branches & Capacity */}
                              {columnVisibility.capacity && (
                                <td className="py-3.5">
                                  <div className="d-flex align-items-center gap-2 mb-1.5">
                                    <span className="fw-bold text-dark font-monospace" style={{ fontSize: '0.875rem' }}>
                                      {p.overall_capacity || p.total_rooms} Rooms
                                    </span>
                                    <span
                                      className={`badge rounded-pill px-2.5 py-0.5 extra-small font-monospace ${
                                        (p.branches_count || 0) > 0 ? 'bg-primary-subtle text-primary border border-primary-subtle' : 'bg-light text-secondary border'
                                      }`}
                                      style={{ fontSize: '0.7rem' }}
                                    >
                                      <GitBranch size={10} className="me-1 d-inline" />
                                      {(p.branches_count || 0) > 0 ? `${p.branches_count} Branches` : 'Single Unit'}
                                    </span>
                                  </div>
                                  <div className="d-flex align-items-center gap-2">
                                    <div className="progress flex-grow-1" style={{ height: '6px', maxWidth: '130px', backgroundColor: '#E2E8F0', borderRadius: '10px' }}>
                                      <div
                                        className="progress-bar rounded-pill"
                                        style={{
                                          width: `${Math.min(100, Math.round(((p.rooms_count || 0) / (p.overall_capacity || p.total_rooms || 1)) * 100))}%`,
                                          background: 'linear-gradient(90deg, #0284C7 0%, #0369A1 100%)'
                                        }}
                                      />
                                    </div>
                                    <span className="extra-small text-muted font-monospace" style={{ fontSize: '0.7rem' }}>
                                      {p.rooms_count || 0}/{p.overall_capacity || p.total_rooms}
                                    </span>
                                  </div>
                                </td>
                              )}

                              {/* 4. Subscription & Billing */}
                              {columnVisibility.billing && (
                                <td className="py-3.5">
                                  <div className="mb-1">
                                    <span
                                      className="badge rounded-pill px-2.5 py-1 extra-small fw-bold"
                                      style={{
                                        backgroundColor: planBadgeStyle.bg,
                                        color: planBadgeStyle.text,
                                        border: `1px solid ${planBadgeStyle.border}`,
                                        fontSize: '0.725rem'
                                      }}
                                    >
                                      {planBadgeStyle.label}
                                    </span>
                                  </div>
                                  <div className="d-flex align-items-center gap-1.5 text-secondary font-monospace" style={{ fontSize: '0.775rem' }}>
                                    <span className="fw-bold text-dark">₹{sub?.billing_amount?.toLocaleString('en-IN') || '9,999'}</span>
                                    <span>/{sub?.billing_cycle || 'ANNUAL'}</span>
                                  </div>
                                </td>
                              )}

                              {/* 5. Validity */}
                              {columnVisibility.validity && (
                                <td className="py-3.5">
                                  <div className="fw-semibold text-dark font-monospace" style={{ fontSize: '0.85rem' }}>
                                    {sub?.valid_until || getDefaultExpiryDate(1)}
                                  </div>
                                  <div className="mt-1">
                                    {isExp ? (
                                      <span className="badge bg-danger text-white rounded-pill px-2.5 py-0.5 extra-small fw-bold shadow-2xs">
                                        ⚠️ EXPIRED
                                      </span>
                                    ) : daysLeft <= 15 ? (
                                      <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill px-2.5 py-0.5 extra-small fw-bold">
                                        ⚠️ {daysLeft} days left
                                      </span>
                                    ) : (
                                      <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2.5 py-0.5 extra-small fw-semibold">
                                        ✓ {daysLeft} days left
                                      </span>
                                    )}
                                  </div>
                                </td>
                              )}

                              {/* 6. Status */}
                              {columnVisibility.status && (
                                <td className="py-3.5">
                                  <button
                                    type="button"
                                    className={`btn btn-sm rounded-pill px-3 py-1 extra-small fw-bold d-inline-flex align-items-center gap-1.5 transition-all shadow-2xs ${
                                      p.is_active
                                        ? 'btn-success text-white'
                                        : 'btn-danger text-white'
                                    }`}
                                    style={{ fontSize: '0.725rem', border: 'none' }}
                                    onClick={() => handleToggleStatus(p.id, p.name)}
                                    title="Click to toggle hotel active/suspended status"
                                  >
                                    <span
                                      className="rounded-circle"
                                      style={{
                                        width: '6px',
                                        height: '6px',
                                        backgroundColor: '#FFFFFF',
                                        boxShadow: p.is_active ? '0 0 6px rgba(255,255,255,0.8)' : 'none'
                                      }}
                                    />
                                    {p.is_active ? 'ACTIVE' : 'SUSPENDED'}
                                  </button>
                                </td>
                              )}

                              {/* 7. Developer Actions */}
                              {columnVisibility.actions && (
                                <td className="text-end pe-4 py-3.5">
                                  <div className="d-flex align-items-center justify-content-end gap-2">
                                    <button
                                      type="button"
                                      className="btn btn-sm fw-bold px-3 py-1.5 rounded-3 d-inline-flex align-items-center gap-1.5 text-white shadow-xs transition-all hover-lift"
                                      onClick={() => handleOpenHotelConsole(p.id)}
                                      style={{
                                        background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                                        fontSize: '0.8rem',
                                        border: 'none'
                                      }}
                                      title="Open Hotel Management Deck"
                                    >
                                      <SlidersHorizontal size={13} /> Manage Hotel
                                    </button>

                                    <button
                                      type="button"
                                      className="btn btn-outline-secondary btn-sm rounded-3 p-1.5 hover-bg-light"
                                      onClick={() => handleResetPassword(p.id, p.name)}
                                      title="Reset Owner Password"
                                      style={{ width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                      <Key size={14} />
                                    </button>
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
              </div>
            )}

            {/* VIEW MODE B: GRID CARDS VIEW */}
            {viewMode === 'grid' && (
              <div className="row g-3 mb-4">
                {filteredProperties.map((p) => {
                  const sub = p.subscription;
                  const isExp = getIsSubscriptionExpired(sub);
                  const daysLeft = getSubscriptionDaysLeft(sub);

                  return (
                    <div key={p.id} className="col-12 col-md-6 col-xl-4">
                      <div className="card border-0 shadow-sm bg-white rounded-4 p-4 h-100 position-relative hover-elevate transition-all" style={{ border: '1px solid #E2E8F0' }}>
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div className="d-flex align-items-center gap-2.5">
                            <div
                              className="rounded-3 d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                              style={{
                                width: '40px',
                                height: '40px',
                                background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                                fontSize: '1rem'
                              }}
                            >
                              {p.name.charAt(0)}
                            </div>
                            <div>
                              <h5 className="fw-bold text-dark m-0">{p.name}</h5>
                              <div className="d-flex align-items-center gap-1.5 mt-0.5">
                                <span className="badge bg-dark text-white font-monospace extra-small px-2 py-0.5">
                                  {p.code}
                                </span>
                                {p.operation_mode === 'SINGLE_OWNER' ? (
                                  <span
                                    className="badge px-2 py-0.5 rounded-2 d-inline-flex align-items-center gap-1 font-sans"
                                    style={{ backgroundColor: '#F0FDFA', color: '#0F766E', border: '1px solid #CCFBF1', fontSize: '0.68rem', fontWeight: 600 }}
                                  >
                                    <UserCheck size={10} /> Single Owner
                                  </span>
                                ) : (
                                  <span
                                    className="badge px-2 py-0.5 rounded-2 d-inline-flex align-items-center gap-1 font-sans"
                                    style={{ backgroundColor: '#EEF2FF', color: '#4338CA', border: '1px solid #E0E7FF', fontSize: '0.68rem', fontWeight: 600 }}
                                  >
                                    <Clock size={10} /> Shift-Wise
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            className={`badge border-0 rounded-pill px-2.5 py-1 extra-small fw-bold ${p.is_active ? 'bg-success text-white' : 'bg-danger text-white'}`}
                            onClick={() => handleToggleStatus(p.id, p.name)}
                          >
                            {p.is_active ? 'ACTIVE' : 'SUSPENDED'}
                          </button>
                        </div>

                        <div className="p-3 bg-light rounded-3 border mb-3">
                          <div className="d-flex justify-content-between extra-small text-secondary mb-1.5">
                            <span>Overall Capacity:</span>
                            <strong className="text-dark font-monospace">{p.overall_capacity || p.total_rooms} Rooms Max ({p.branches_count || 0} Branches)</strong>
                          </div>
                          <div className="d-flex justify-content-between extra-small text-secondary mb-1.5">
                            <span>Subscription Tier:</span>
                            <span className="badge bg-primary-subtle text-primary rounded-pill">{sub?.plan_name || 'STARTER'}</span>
                          </div>
                          <div className="d-flex justify-content-between extra-small text-secondary">
                            <span>Valid Until:</span>
                            <strong className="text-dark font-monospace">{sub?.valid_until || getDefaultExpiryDate(1)} ({daysLeft}d left)</strong>
                          </div>
                        </div>

                        <div className="d-flex align-items-center justify-content-between gap-2 mt-auto pt-2">
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm rounded-3 px-3 py-1.5 d-flex align-items-center gap-1.5 extra-small"
                            onClick={() => handleResetPassword(p.id, p.name)}
                          >
                            <Key size={13} /> Reset Pass
                          </button>

                          <button
                            type="button"
                            className="btn btn-primary btn-sm fw-bold px-3.5 py-1.5 rounded-3 d-flex align-items-center gap-1.5 text-white shadow-xs"
                            onClick={() => handleOpenHotelConsole(p.id)}
                            style={{ background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)' }}
                          >
                            <SlidersHorizontal size={13} /> Manage Hotel
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* ========================================================= */}
        {/* 📦 TAB 3: SUBSCRIPTION PLANS & BESPOKE CONTRACTS          */}
        {/* ========================================================= */}
        {activeTab === 'subscriptions' && !selectedHotel && (
          <div className="animate-fadeIn">
            {/* Header with Actions */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
              <div>
                <h4 className="fw-bold text-dark m-0" style={{ letterSpacing: '-0.025em' }}>
                  SaaS Subscription Plans &amp; Commercial Pricing Matrix
                </h4>
                <p className="text-secondary small m-0 mt-1">
                  Configure standard pricing tiers and room capacity caps, or assign customized bespoke subscription contracts (custom expiry, custom room limit, custom charges).
                </p>
              </div>

              <div className="d-flex align-items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleOpenCreatePlanModal}
                  className="btn btn-outline-primary rounded-3 px-3 py-2 fw-semibold extra-small d-flex align-items-center gap-1.5"
                >
                  <PlusCircle size={15} /> Create Plan Tier
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenCustomSubModal()}
                  className="btn btn-primary rounded-3 px-3.5 py-2 fw-bold text-white shadow-xs extra-small d-flex align-items-center gap-1.5"
                  style={{ background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)', border: 'none' }}
                >
                  <Sparkles size={15} className="text-warning" /> Assign Custom Plan to Hotel
                </button>
              </div>
            </div>

            {/* Section 1: Standard Subscription Plans Grid */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
              <div>
                <div className="d-inline-flex align-items-center gap-1.5 px-2.5 py-1 rounded-pill bg-primary-subtle text-primary extra-small fw-bold mb-2">
                  <Sparkles size={12} />
                  <span>STANDARD SAAS CATALOG</span>
                </div>
                <h5 className="fw-bold text-dark m-0" style={{ letterSpacing: '-0.02em' }}>
                  Standard SaaS Plan Catalog
                </h5>
                <p className="text-secondary extra-small m-0 mt-1">
                  Pre-configured commercial tiers with automated room capacity limits, feature gating, and transparent pricing.
                </p>
              </div>

              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-light text-secondary border px-3 py-1.5 rounded-pill extra-small fw-semibold d-inline-flex align-items-center gap-1.5">
                  <span className="rounded-circle bg-success" style={{ width: 6, height: 6 }} />
                  {((subscriptionsData?.plans || []).filter(p => !p.code?.startsWith('CUSTOM_') && !['STARTER_TEST', 'GROWTH_FLOW'].includes(p.code))).length} Standard Tiers Active
                </span>
              </div>
            </div>

            <div className="row g-4 mb-4">
              {(subscriptionsData?.plans || [])
                .filter((p) => !p.code?.startsWith('CUSTOM_') && !['STARTER_TEST', 'GROWTH_FLOW'].includes(p.code))
                .map((plan) => {
                  const cfg = getPlanVisualConfig(plan.code);
                  const IconComp = cfg.icon;

                  return (
                    <div key={plan.id} className="col-12 col-md-6 col-xl-3">
                      <div
                        className="card rounded-4 h-100 bg-white d-flex flex-column justify-content-between position-relative transition-all"
                        style={{
                          border: cfg.cardBorder,
                          boxShadow: cfg.cardShadow,
                          padding: '26px 22px 20px',
                          borderRadius: '20px'
                        }}
                      >
                        {/* Floating Popular Pill */}
                        {cfg.isPopular && (
                          <div
                            className="position-absolute"
                            style={{
                              top: '-12px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              zIndex: 2
                            }}
                          >
                            <span
                              className="badge rounded-pill px-3 py-1 extra-small fw-bold text-white shadow-xs d-inline-flex align-items-center gap-1.5"
                              style={{
                                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                                letterSpacing: '0.04em',
                                fontSize: '0.675rem'
                              }}
                            >
                              <Star size={10} fill="#FFF" strokeWidth={0} /> {cfg.popularLabel}
                            </span>
                          </div>
                        )}

                        <div>
                          {/* Top Accent Strip */}
                          <div
                            style={{
                              height: '4px',
                              width: '36px',
                              background: cfg.topStripGradient,
                              borderRadius: '99px',
                              marginBottom: '16px'
                            }}
                          />

                          {/* Tier Code Badge & Active Status */}
                          <div className="d-flex justify-content-between align-items-center mb-2.5">
                            <span
                              className="badge rounded-pill px-2.5 py-1 extra-small fw-bold d-inline-flex align-items-center gap-1.5"
                              style={{
                                backgroundColor: cfg.badgeBg,
                                color: cfg.badgeColor,
                                fontSize: '0.7rem',
                                letterSpacing: '0.02em'
                              }}
                            >
                              <IconComp size={12} strokeWidth={2.5} />
                              {cfg.badgeText}
                            </span>
                            <span
                              className={`badge rounded-pill extra-small px-2.5 py-0.5 fw-semibold d-inline-flex align-items-center gap-1.5 ${
                                plan.is_active
                                  ? 'bg-success-subtle text-success border border-success-subtle'
                                  : 'bg-secondary-subtle text-secondary border'
                              }`}
                              style={{ fontSize: '0.685rem' }}
                            >
                              <span className={`rounded-circle ${plan.is_active ? 'bg-success' : 'bg-secondary'}`} style={{ width: 6, height: 6 }} />
                              {plan.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>

                          {/* Plan Name & Tagline */}
                          <h5 className="fw-bold text-dark mb-1" style={{ fontSize: '1.05rem', letterSpacing: '-0.02em', minHeight: '40px', lineHeight: 1.3 }}>
                            {plan.name}
                          </h5>
                          <p className="text-secondary extra-small mb-3" style={{ fontSize: '0.75rem', minHeight: '34px', lineHeight: 1.4 }}>
                            {cfg.tagline}
                          </p>

                          {/* Monthly Price Block */}
                          <div className="mb-3 pb-2.5 border-bottom" style={{ borderColor: '#F1F5F9' }}>
                            <div className="d-flex align-items-baseline gap-1 mb-0.5">
                              <span className="text-secondary fw-semibold" style={{ fontSize: '1.25rem' }}>₹</span>
                              <span className="fw-bolder text-dark font-monospace" style={{ fontSize: '2.1rem', letterSpacing: '-0.03em', lineHeight: 1 }}>
                                {plan.price_monthly?.toLocaleString('en-IN')}
                              </span>
                              <span className="text-muted extra-small fw-medium ms-1">/ month</span>
                            </div>
                            <div className="extra-small text-muted font-monospace" style={{ fontSize: '0.72rem' }}>
                              {plan.price_annually > 0 ? (
                                <span>₹{plan.price_annually?.toLocaleString('en-IN')}/yr billed annually</span>
                              ) : (
                                <span className="text-success fw-semibold">100% Free evaluation access</span>
                              )}
                            </div>
                          </div>

                          {/* Capacity & Commercial Specs Box */}
                          <div
                            className="p-3 rounded-3 mb-3"
                            style={{
                              backgroundColor: '#F8FAFC',
                              border: '1px solid #E2E8F0',
                              borderRadius: '12px'
                            }}
                          >
                            <div className="d-flex justify-content-between align-items-center extra-small text-secondary mb-2">
                              <span className="d-inline-flex align-items-center gap-1.5" style={{ fontSize: '0.75rem' }}>
                                <BedDouble size={13} className="text-muted flex-shrink-0" /> Max Room Limit:
                              </span>
                              <strong className="text-dark font-monospace fw-bold" style={{ fontSize: '0.8rem' }}>
                                {plan.max_rooms >= 9999 ? 'Unlimited' : `${plan.max_rooms} Rooms`}
                              </strong>
                            </div>
                            <div className="d-flex justify-content-between align-items-center extra-small text-secondary mb-2">
                              <span className="d-inline-flex align-items-center gap-1.5" style={{ fontSize: '0.75rem' }}>
                                <Calendar size={13} className="text-muted flex-shrink-0" /> Annual Rate:
                              </span>
                              <strong className="text-dark font-monospace" style={{ fontSize: '0.8rem' }}>
                                ₹{plan.price_annually?.toLocaleString('en-IN')}/yr
                              </strong>
                            </div>
                            <div className="d-flex justify-content-between align-items-center extra-small text-secondary pt-2 border-top" style={{ borderColor: '#E2E8F0' }}>
                              <span className="d-inline-flex align-items-center gap-1.5" style={{ fontSize: '0.75rem' }}>
                                <Building2 size={13} className="text-muted flex-shrink-0" /> Active Subscribers:
                              </span>
                              <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2 py-0.5 font-monospace fw-bold" style={{ fontSize: '0.7rem' }}>
                                {plan.subscribers_count || 0} Lodges
                              </span>
                            </div>
                          </div>

                          {/* Included Features List */}
                          {Array.isArray(plan.features) && plan.features.length > 0 && (
                            <div className="mb-3">
                              <div
                                className="extra-small fw-bold text-uppercase text-secondary mb-2"
                                style={{ letterSpacing: '0.06em', fontSize: '0.675rem' }}
                              >
                                Included Features:
                              </div>
                              <ul className="list-unstyled extra-small mb-0 d-flex flex-column gap-2" style={{ minHeight: '92px' }}>
                                {plan.features.slice(0, 4).map((f, fIdx) => (
                                  <li key={fIdx} className="d-flex align-items-center gap-2">
                                    <div
                                      className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                      style={{
                                        width: '18px',
                                        height: '18px',
                                        backgroundColor: '#ECFDF5',
                                        color: '#059669'
                                      }}
                                    >
                                      <Check size={11} strokeWidth={3} />
                                    </div>
                                    <span className="text-dark fw-medium text-truncate" style={{ fontSize: '0.785rem' }} title={f}>
                                      {f}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Action Footer */}
                        <div className="pt-3 border-top mt-auto" style={{ borderColor: '#F1F5F9' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEditPlanModal(plan)}
                            className="btn btn-sm btn-light border w-100 rounded-3 py-2 extra-small fw-bold text-dark d-flex align-items-center justify-content-center gap-1.5 shadow-2xs hover-bg-light transition-all"
                            style={{ borderRadius: '10px' }}
                          >
                            <Edit3 size={13} className="text-secondary" />
                            <span>Edit Plan Details</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Featured Bespoke & Custom Contract Engine Banner */}
            <div
              className="card border-0 rounded-4 p-4 p-md-4.5 mb-5 position-relative overflow-hidden shadow-sm"
              style={{
                background: 'linear-gradient(135deg, #0A0F1D 0%, #151F32 50%, #1E293B 100%)',
                border: '1px solid #334155',
                color: '#F8FAFC',
                borderRadius: '20px'
              }}
            >
              {/* Background ambient lighting */}
              <div
                className="position-absolute"
                style={{
                  top: '-60px',
                  right: '-60px',
                  width: '260px',
                  height: '260px',
                  background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(0, 0, 0, 0) 70%)',
                  borderRadius: '50%',
                  pointerEvents: 'none'
                }}
              />

              <div className="row align-items-center g-4 position-relative" style={{ zIndex: 1 }}>
                <div className="col-12 col-lg-7">
                  <div className="d-flex align-items-center gap-2 mb-2.5 flex-wrap">
                    <span
                      className="badge rounded-pill px-3 py-1 extra-small fw-bold text-dark d-inline-flex align-items-center gap-1.5 shadow-2xs"
                      style={{ backgroundColor: '#F59E0B' }}
                    >
                      <Sparkles size={12} fill="#000" /> BESPOKE CONTRACT ENGINE
                    </span>
                    <span className="badge rounded-pill bg-white bg-opacity-10 text-white-50 extra-small px-2.5 py-1">
                      Individual Property Overrides
                    </span>
                  </div>

                  <h4 className="fw-bold text-white mb-2" style={{ letterSpacing: '-0.02em' }}>
                    Need Custom Room Quotas, Custom Dates or Negotiated Charges?
                  </h4>
                  <p className="text-white-50 small mb-3.5 lh-base" style={{ maxWidth: '640px' }}>
                    Standard catalog tiers don't fit every client. Use the Bespoke Contract Engine to tailor 
                    the exact room quota (e.g. 5 or 120 rooms), custom expiration dates, and specialized billing 
                    for any hotel property without altering standard SaaS catalog tiers.
                  </p>

                  <div className="d-flex flex-wrap gap-2.5">
                    <div className="px-3 py-2 rounded-3 d-flex align-items-center gap-2" style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <BedDouble size={14} className="text-warning flex-shrink-0" />
                      <span className="extra-small text-white">Custom Room Limit (e.g. 5, 65, 200)</span>
                    </div>
                    <div className="px-3 py-2 rounded-3 d-flex align-items-center gap-2" style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <Calendar size={14} className="text-warning flex-shrink-0" />
                      <span className="extra-small text-white">Flexible Validity (+30d, 1yr, Multi-Year)</span>
                    </div>
                    <div className="px-3 py-2 rounded-3 d-flex align-items-center gap-2" style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <CreditCard size={14} className="text-warning flex-shrink-0" />
                      <span className="extra-small text-white">Negotiated Commercial Billing</span>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-lg-5 text-lg-end">
                  <div className="d-inline-flex flex-column align-items-lg-end gap-3 w-100">
                    <div className="p-3.5 rounded-4 text-start w-100" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', maxWidth: '320px', marginLeft: 'auto' }}>
                      <div className="extra-small text-white-50 mb-1">Custom Contracts Deployed</div>
                      <div className="d-flex align-items-baseline gap-2">
                        <span className="fs-3 fw-bold text-white font-monospace">
                          {(subscriptionsData?.properties_subscriptions || []).filter(s => s.is_custom).length}
                        </span>
                        <span className="extra-small text-warning fw-semibold">Hotels Active on Bespoke Terms</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenCustomSubModal()}
                      className="btn btn-primary rounded-3 px-4 py-2.5 fw-bold text-white shadow-sm extra-small d-inline-flex align-items-center gap-2 transition-all hover-lift"
                      style={{
                        background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                        border: 'none',
                        fontSize: '0.825rem'
                      }}
                    >
                      <Sparkles size={15} className="text-warning" />
                      <span>Configure Bespoke Terms for Hotel</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Hotel Subscription Assignments & Bespoke Contracts Matrix */}
            <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden" style={{ border: '1px solid #E2E8F0' }}>
              <div className="p-4 border-bottom bg-white d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                <div>
                  <h5 className="fw-bold text-dark m-0" style={{ letterSpacing: '-0.02em' }}>
                    Hotel Subscriptions &amp; Custom Contract Assignments
                  </h5>
                  <p className="text-secondary extra-small m-0 mt-0.5">
                    Live mapping of every hotel property to its software subscription, room quota, validity, and commercial billing.
                  </p>
                </div>

                <div className="d-flex align-items-center gap-2.5 w-100 w-md-auto">
                  <div className="input-group input-group-sm" style={{ maxWidth: '280px' }}>
                    <span className="input-group-text bg-white border-end-0">
                      <Search size={14} className="text-muted" />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 py-1.5"
                      placeholder="Search hotel or plan..."
                      value={subFilterQuery}
                      onChange={(e) => setSubFilterQuery(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenCustomSubModal()}
                    className="btn btn-sm btn-primary rounded-3 px-3 py-1.5 extra-small fw-bold text-white text-nowrap flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)', border: 'none' }}
                  >
                    + Assign Custom Terms
                  </button>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table align-middle mb-0" style={{ borderCollapse: 'separate', borderSpacing: '0' }}>
                  <thead className="bg-light text-secondary extra-small text-uppercase fw-bold">
                    <tr>
                      <th className="py-3 px-4">Hotel Property</th>
                      <th className="py-3">Subscription Tier</th>
                      <th className="py-3">Room Limit Quota</th>
                      <th className="py-3">Commercial Charges</th>
                      <th className="py-3">License Validity</th>
                      <th className="py-3">Status</th>
                      <th className="py-3 text-end pe-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {((subscriptionsData?.properties_subscriptions || []).filter(sub => {
                      if (!subFilterQuery) return true;
                      const q = subFilterQuery.toLowerCase();
                      return (
                        sub.property_name.toLowerCase().includes(q) ||
                        sub.property_code.toLowerCase().includes(q) ||
                        sub.plan_name.toLowerCase().includes(q) ||
                        sub.plan_code.toLowerCase().includes(q)
                      );
                    })).map((sub, idx) => {
                      const isExpired = getIsSubscriptionExpired(sub);
                      const days = getSubscriptionDaysLeft(sub);
                      return (
                        <tr key={idx} className="hover-bg-slate-50 transition-all">
                          <td className="py-3.5 px-4">
                            <div className="fw-bold text-dark small">{sub.property_name}</div>
                            <span className="badge bg-dark text-white font-monospace extra-small px-2 py-0.5 rounded mt-0.5">
                              {sub.property_code}
                            </span>
                          </td>

                          <td className="py-3.5">
                            <div className="d-flex align-items-center gap-1.5">
                              <span className="badge bg-primary-subtle text-primary rounded-pill px-2 py-0.5 extra-small fw-bold font-monospace">
                                {sub.plan_code}
                              </span>
                              {sub.is_custom && (
                                <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill px-2 py-0.5 extra-small fw-bold">
                                  ★ Bespoke
                                </span>
                              )}
                            </div>
                            <div className="extra-small text-muted mt-0.5 text-truncate" style={{ maxWidth: '180px' }}>
                              {sub.plan_name}
                            </div>
                          </td>

                          <td className="py-3.5">
                            <span className="fw-bold text-dark font-monospace small">
                              {sub.max_rooms_allowed >= 9999 ? 'Unlimited' : `${sub.max_rooms_allowed} Rooms`}
                            </span>
                            <div className="extra-small text-muted">
                              Property Cap: {sub.total_rooms} rooms
                            </div>
                          </td>

                          <td className="py-3.5">
                            <div className="fw-bold text-dark font-monospace small">
                              ₹{sub.billing_amount?.toLocaleString('en-IN')}
                            </div>
                            <span className="badge bg-light text-secondary border rounded-pill extra-small font-monospace">
                              {sub.billing_cycle}
                            </span>
                          </td>

                          <td className="py-3.5">
                            <div className="fw-semibold text-dark font-monospace small">
                              {sub.valid_until || '–'}
                            </div>
                            <span
                              className={`badge rounded-pill extra-small px-2 py-0.5 fw-semibold ${
                                isExpired
                                  ? 'bg-danger text-white'
                                  : days <= 15
                                  ? 'bg-warning text-dark'
                                  : 'bg-success-subtle text-success'
                              }`}
                            >
                              {isExpired ? 'Expired' : `${days} days left`}
                            </span>
                          </td>

                          <td className="py-3.5">
                            <span className={`badge rounded-pill extra-small px-2.5 py-1 fw-bold ${sub.payment_status === 'PAID' ? 'bg-success text-white' : 'bg-warning text-dark'}`}>
                              {sub.payment_status || 'PAID'}
                            </span>
                          </td>

                          <td className="py-3.5 text-end pe-4">
                            <div className="d-flex align-items-center justify-content-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  const propObj = properties.find(p => p.id === sub.property_id || p.code === sub.property_code);
                                  handleOpenCustomSubModal(propObj || { id: sub.property_id, name: sub.property_name, total_rooms: sub.total_rooms, subscription: sub });
                                }}
                                className="btn btn-sm btn-outline-primary rounded-3 px-2.5 py-1 extra-small fw-semibold d-flex align-items-center gap-1"
                                title="Customize Expiration, Room Limit, and Pricing"
                              >
                                <SlidersHorizontal size={12} /> Customize Terms
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const propObj = properties.find(p => p.id === sub.property_id || p.code === sub.property_code);
                                  handleOpenRecordPayment(null, propObj || {
                                    id: sub.property_id,
                                    name: sub.property_name,
                                    code: sub.property_code,
                                    total_rooms: sub.total_rooms,
                                    subscription: sub
                                  });
                                }}
                                className="btn btn-sm btn-outline-success rounded-3 px-2.5 py-1 extra-small fw-semibold d-flex align-items-center gap-1"
                                title="Record or Update Subscription Payment"
                              >
                                <CreditCard size={12} /> Record Payment
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const propObj = properties.find(p => p.id === sub.property_id || p.code === sub.property_code);
                                  setSelectedPropertyForRenew(propObj || { id: sub.property_id, name: sub.property_name, subscription: sub });
                                  setShowRenewModal(true);
                                }}
                                className="btn btn-sm btn-white border rounded-3 p-1 extra-small text-secondary hover-bg-light"
                                title="Quick Renew"
                                style={{ width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <RotateCcw size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const propObj = properties.find(p => p.id === sub.property_id || p.code === sub.property_code);
                                  handleOpenPrintBill({
                                    invoice_no: sub.invoice_no || getDynamicInvoiceNo(sub.property_code),
                                    billing_date: sub.valid_from || formatLocalDate(new Date()),
                                    valid_until: sub.valid_until || getDefaultExpiryDate(1),
                                    description: `SaaS Subscription - ${sub.plan_name} (Up to ${sub.total_rooms || 15} Rooms) (${sub.billing_cycle || 'ANNUAL'})`,
                                    plan_name: sub.plan_name,
                                    rooms_allowed: sub.total_rooms || sub.max_rooms_allowed,
                                    billing_cycle: sub.billing_cycle || 'ANNUAL',
                                    amount: sub.billing_amount || 9999,
                                    status: sub.payment_status || 'PAID',
                                    hotel_name: sub.property_name,
                                    hotel_code: sub.property_code,
                                    owner_name: sub.owner_name,
                                    owner_phone: sub.owner_phone,
                                    owner_email: sub.owner_email,
                                    address: sub.address,
                                    city: sub.city,
                                    state: sub.state,
                                    pincode: sub.pincode,
                                    gstin: sub.gstin
                                  }, propObj || {
                                    id: sub.property_id,
                                    name: sub.property_name,
                                    code: sub.property_code,
                                    owner_name: sub.owner_name,
                                    owner_phone: sub.owner_phone,
                                    owner_email: sub.owner_email,
                                    address: sub.address,
                                    city: sub.city,
                                    state: sub.state,
                                    pincode: sub.pincode,
                                    gstin: sub.gstin,
                                    total_rooms: sub.total_rooms,
                                    subscription: sub
                                  });
                                }}
                                className="btn btn-sm btn-white border rounded-3 p-1 extra-small text-secondary hover-bg-light"
                                title="Print Official A4 Bill / Invoice"
                                style={{ width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <Printer size={13} className="text-dark" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {(!subscriptionsData?.properties_subscriptions || subscriptionsData.properties_subscriptions.length === 0) && (
                      <tr>
                        <td colSpan="7" className="text-center py-5 text-muted small">
                          No hotel subscriptions found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 🩺 TAB 4: SYSTEM DIAGNOSTICS & TELEMETRY                  */}
        {/* ========================================================= */}
        {activeTab === 'health' && !selectedHotel && (
          <div className="animate-fadeIn">
            {/* Top Bar with Refresh Ping Action */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
              <div>
                <h4 className="fw-bold text-dark m-0" style={{ letterSpacing: '-0.025em' }}>
                  System Diagnostics &amp; Infrastructure Health
                </h4>
                <p className="text-secondary small m-0 mt-1">
                  Real-time database latency, multi-tenant isolation verification, subsystem services, and host platform telemetry.
                </p>
              </div>

              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  onClick={handleRefreshHealth}
                  disabled={healthRefreshing}
                  className="btn btn-primary rounded-3 px-3.5 py-2 fw-bold text-white shadow-xs extra-small d-flex align-items-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)', border: 'none' }}
                >
                  <RefreshCw size={14} className={healthRefreshing ? 'animate-spin' : ''} />
                  {healthRefreshing ? 'Pinging Host Telemetry...' : 'Run Diagnostics & Ping Host'}
                </button>
              </div>
            </div>

            {/* Overall Health Status Banner */}
            <div
              className="card border-0 shadow-sm rounded-4 p-4 mb-4 text-white overflow-hidden position-relative"
              style={{
                background: healthData?.status === 'DEGRADED' || healthData?.status === 'CRITICAL'
                  ? 'linear-gradient(135deg, #881337 0%, #9F1239 50%, #BE123C 100%)'
                  : healthData?.status === 'WARNING'
                  ? 'linear-gradient(135deg, #78350F 0%, #92400E 50%, #B45309 100%)'
                  : 'linear-gradient(135deg, #064E3B 0%, #065F46 50%, #047857 100%)',
                boxShadow: healthData?.status === 'DEGRADED'
                  ? '0 10px 25px rgba(225, 29, 72, 0.25)'
                  : healthData?.status === 'WARNING'
                  ? '0 10px 25px rgba(217, 119, 6, 0.25)'
                  : '0 10px 25px rgba(5, 150, 105, 0.25)'
              }}
            >
              <div className="row g-3 align-items-center">
                <div className="col-lg-8">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="badge bg-white bg-opacity-20 text-white rounded-pill px-2.5 py-1 extra-small fw-bold">
                      <Sparkles size={12} className="me-1 d-inline text-warning" /> HOST CLUSTER STATUS
                    </span>
                    <span
                      className={`badge ${
                        healthData?.status === 'DEGRADED'
                          ? 'bg-danger border border-danger-subtle'
                          : healthData?.status === 'WARNING'
                          ? 'bg-warning text-dark border border-warning'
                          : 'bg-success border border-light text-white'
                      } rounded-pill px-2.5 py-0.5 extra-small font-monospace`}
                    >
                      ● {healthData?.cluster_status || (healthData?.status || 'CHECKING')}
                    </span>
                  </div>
                  <h3 className="fw-bold text-white mb-1" style={{ letterSpacing: '-0.02em' }}>
                    {healthData?.headline || 'Core SaaS Subsystems Telemetry Active'}
                  </h3>
                  <p className="text-white-50 small m-0">
                    {healthData?.summary_note || 'Relational storage queries, multi-tenant isolation boundaries, and JWT authentication verified.'}
                  </p>
                </div>
                <div className="col-lg-4 text-lg-end">
                  <div className="p-3 rounded-3 d-inline-block text-start" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
                    <div className="extra-small text-white-50">LAST DIAGNOSTICS PING</div>
                    <div className="fw-bold text-white font-monospace small mt-0.5">
                      {healthData?.timestamp || 'Just now'}
                    </div>
                    <div className="extra-small text-white-50 mt-1 d-flex flex-column gap-0.5">
                      <span>Uptime: <strong className="text-white">{healthData?.infrastructure?.system_uptime || 'Live'}</strong> (Proc: <strong className="text-white">{healthData?.infrastructure?.process_uptime || 'Active'}</strong>)</span>
                      <span>Mode: <strong className="text-white">{healthData?.server_environment?.mode || 'Multi-Tenant Host'}</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Telemetry Metrics Grid (6 Live Dynamic Cards) */}
            <div className="row g-3 mb-4">
              {/* Card 1: Database Latency */}
              <div className="col-12 col-sm-6 col-xl-4">
                <div className="card border-0 shadow-sm bg-white rounded-4 p-3.5 h-100" style={{ border: '1px solid #E2E8F0' }}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-secondary extra-small fw-bold text-uppercase tracking-wider">DATABASE LATENCY</span>
                    <div className="p-2 rounded-2 bg-primary-subtle text-primary"><Database size={18} /></div>
                  </div>
                  <div className="fs-2 fw-bold text-dark font-monospace mb-1">
                    {healthData?.database?.latency_ms !== undefined ? `${healthData.database.latency_ms} ms` : '–'}
                  </div>
                  <div className="extra-small text-success d-flex align-items-center gap-1 mt-1">
                    <CheckCircle2 size={13} className={healthData?.database?.latency_ms > 30 ? 'text-warning' : 'text-success'} />
                    <span>{healthData?.database?.note || 'Relational storage connected'}</span>
                  </div>
                  <div className="extra-small text-muted font-monospace mt-1">
                    {healthData?.database?.engine || 'SQLITE'} {healthData?.database?.size_mb ? `· ${healthData.database.size_mb} MB on disk` : ''} · Autocommit={String(healthData?.database?.autocommit ?? true)}
                  </div>
                </div>
              </div>

              {/* Card 2: Tenant Isolation */}
              <div className="col-12 col-sm-6 col-xl-4">
                <div className="card border-0 shadow-sm bg-white rounded-4 p-3.5 h-100" style={{ border: '1px solid #E2E8F0' }}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-secondary extra-small fw-bold text-uppercase tracking-wider">TENANT ISOLATION</span>
                    <div className="p-2 rounded-2 bg-success-subtle text-success"><ShieldCheck size={18} /></div>
                  </div>
                  <div className="fs-2 fw-bold text-success font-monospace mb-1">
                    {healthData?.tenant_isolation?.status || 'ENFORCED'}
                  </div>
                  <div className="extra-small text-muted d-flex align-items-center gap-1 mt-1">
                    <CheckCircle2 size={13} className="text-success" />
                    <span>{healthData?.tenant_isolation?.note || 'Row-level boundary isolation verified'}</span>
                  </div>
                  <div className="extra-small text-muted font-monospace mt-1">
                    {healthData?.tenant_isolation?.verified_tenants_count ?? properties.length} properties · {healthData?.tenant_isolation?.verified_branches_count ?? 0} branches · {healthData?.tenant_isolation?.total_leaks_detected ?? 0} leaks
                  </div>
                </div>
              </div>

              {/* Card 3: Host Memory Footprint */}
              <div className="col-12 col-sm-6 col-xl-4">
                <div className="card border-0 shadow-sm bg-white rounded-4 p-3.5 h-100" style={{ border: '1px solid #E2E8F0' }}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-secondary extra-small fw-bold text-uppercase tracking-wider">SERVER RAM USAGE</span>
                    <div className="p-2 rounded-2 bg-info-subtle text-info"><Cpu size={18} /></div>
                  </div>
                  <div className="fs-2 fw-bold text-dark font-monospace mb-1">
                    {healthData?.infrastructure?.ram?.percent_used ?? 0}%
                  </div>
                  <div className="extra-small text-muted d-flex align-items-center gap-1 mt-1">
                    <Activity size={13} className="text-info" />
                    <span>{healthData?.infrastructure?.ram?.used_gb ?? 0} GB used / {healthData?.infrastructure?.ram?.total_gb ?? 0} GB total</span>
                  </div>
                  <div className="extra-small text-muted font-monospace mt-1">
                    {healthData?.infrastructure?.ram?.free_gb ?? 0} GB available physical memory
                  </div>
                </div>
              </div>

              {/* Card 4: Disk Storage */}
              <div className="col-12 col-sm-6 col-xl-4">
                <div className="card border-0 shadow-sm bg-white rounded-4 p-3.5 h-100" style={{ border: '1px solid #E2E8F0' }}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-secondary extra-small fw-bold text-uppercase tracking-wider">DISK STORAGE</span>
                    <div className="p-2 rounded-2 bg-warning-subtle text-warning"><HardDrive size={18} /></div>
                  </div>
                  <div className="fs-2 fw-bold text-dark font-monospace mb-1">
                    {healthData?.infrastructure?.disk?.free_gb ?? 0} GB Free
                  </div>
                  <div className="extra-small text-muted d-flex align-items-center gap-1 mt-1">
                    <CheckCircle2 size={13} className="text-success" />
                    <span>{healthData?.infrastructure?.disk?.used_gb ?? 0} GB used ({healthData?.infrastructure?.disk?.percent_used ?? 0}%)</span>
                  </div>
                  <div className="extra-small text-muted font-monospace mt-1">
                    Volume Capacity: {healthData?.infrastructure?.disk?.total_gb ?? 0} GB total partition
                  </div>
                </div>
              </div>

              {/* Card 5: Managed Rooms & Live Occupancy */}
              <div className="col-12 col-sm-6 col-xl-4">
                <div className="card border-0 shadow-sm bg-white rounded-4 p-3.5 h-100" style={{ border: '1px solid #E2E8F0' }}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-secondary extra-small fw-bold text-uppercase tracking-wider">MANAGED ROOM INVENTORY</span>
                    <div className="p-2 rounded-2 bg-primary-subtle text-primary"><DoorOpen size={18} /></div>
                  </div>
                  <div className="fs-2 fw-bold text-dark font-monospace mb-1">
                    {healthData?.platform_metrics?.total_rooms_managed ?? totalCapacityCap}
                  </div>
                  <div className="extra-small text-muted d-flex align-items-center gap-1 mt-1">
                    <CheckCircle2 size={13} className="text-primary" />
                    <span>{healthData?.platform_metrics?.occupied_rooms ?? 0} occupied ({healthData?.platform_metrics?.occupancy_rate ?? 0}% occupancy)</span>
                  </div>
                  <div className="extra-small text-muted font-monospace mt-1">
                    {healthData?.platform_metrics?.available_rooms ?? (totalCapacityCap - (healthData?.platform_metrics?.occupied_rooms || 0))} rooms available across {healthData?.platform_metrics?.total_properties ?? properties.length} properties
                  </div>
                </div>
              </div>

              {/* Card 6: Server Runtime */}
              <div className="col-12 col-sm-6 col-xl-4">
                <div className="card border-0 shadow-sm bg-white rounded-4 p-3.5 h-100" style={{ border: '1px solid #E2E8F0' }}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-secondary extra-small fw-bold text-uppercase tracking-wider">RUNTIME ENVIRONMENT</span>
                    <div className="p-2 rounded-2 bg-secondary-subtle text-secondary"><Server size={18} /></div>
                  </div>
                  <div className="fs-4 fw-bold text-dark font-monospace mb-1">
                    Python {healthData?.server_environment?.python_version || '–'} / Django {healthData?.server_environment?.django_version || '–'}
                  </div>
                  <div className="extra-small text-muted d-flex align-items-center gap-1 mt-1">
                    <Activity size={13} className="text-secondary" />
                    <span>DRF v{healthData?.server_environment?.drf_version || '–'} · Host PID: {healthData?.server_environment?.process_pid || '–'}</span>
                  </div>
                  <div className="extra-small text-muted font-monospace mt-1">
                    {healthData?.server_environment?.platform_os || 'Host System'}
                  </div>
                </div>
              </div>
            </div>

            {/* Subsystem Services Health Table */}
            <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden mb-4" style={{ border: '1px solid #E2E8F0' }}>
              <div className="p-4 border-bottom bg-white d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                <div>
                  <h5 className="fw-bold text-dark m-0" style={{ letterSpacing: '-0.02em' }}>
                    Core Subsystem Services &amp; Infrastructure Components
                  </h5>
                  <p className="text-secondary extra-small m-0 mt-0.5">
                    Continuous real-time verification of routing, relational persistence, financial ledger, and shift till sentinels.
                  </p>
                </div>
                <span
                  className={`badge ${
                    (healthData?.services?.filter(s => s.status !== 'HEALTHY').length || 0) === 0
                      ? 'bg-success-subtle text-success border border-success-subtle'
                      : 'bg-warning-subtle text-warning border border-warning-subtle'
                  } rounded-pill px-3 py-1 extra-small fw-bold`}
                >
                  ✓ {healthData?.services?.filter(s => s.status === 'HEALTHY').length || 0}/{healthData?.services?.length || 0} Services Operational
                </span>
              </div>

              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead className="bg-light text-secondary extra-small text-uppercase fw-bold">
                    <tr>
                      <th className="py-3 px-4">Subsystem Service</th>
                      <th className="py-3">Infrastructure Layer</th>
                      <th className="py-3">Status</th>
                      <th className="py-3">Latency / Response</th>
                      <th className="py-3 pe-4">Diagnostics Check Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {healthData?.services && healthData.services.length > 0 ? (
                      healthData.services.map((svc, idx) => {
                        const isHealthy = svc.status === 'HEALTHY';
                        const isWarning = svc.status === 'WARNING';
                        return (
                          <tr key={svc.id || idx} className="hover-bg-slate-50 transition-all">
                            <td className="py-3.5 px-4">
                              <div className="d-flex align-items-center gap-2.5">
                                <div className={`p-1.5 rounded-2 ${isHealthy ? 'bg-success-subtle text-success' : isWarning ? 'bg-warning-subtle text-warning' : 'bg-danger-subtle text-danger'}`}>
                                  {isHealthy ? <CheckCircle2 size={16} /> : isWarning ? <AlertTriangle size={16} /> : <ShieldAlert size={16} />}
                                </div>
                                <span className="fw-bold text-dark small">{svc.name}</span>
                              </div>
                            </td>
                            <td className="py-3.5">
                              <span className="badge bg-light text-secondary border font-monospace extra-small">
                                {svc.subsystem || 'Core Engine'}
                              </span>
                            </td>
                            <td className="py-3.5">
                              <span
                                className={`badge ${
                                  isHealthy
                                    ? 'bg-success text-white'
                                    : isWarning
                                    ? 'bg-warning text-dark'
                                    : 'bg-danger text-white'
                                } rounded-pill extra-small px-2.5 py-0.5 fw-bold font-monospace`}
                              >
                                ● {svc.status}
                              </span>
                            </td>
                            <td className="py-3.5 font-monospace extra-small fw-semibold text-dark">
                              {svc.latency || '–'}
                            </td>
                            <td className="py-3.5 pe-4 extra-small text-secondary">
                              {svc.description}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center py-4 text-muted extra-small">
                          <RefreshCw size={16} className="animate-spin me-2 d-inline" />
                          Collecting real-time service telemetry...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Architecture Details Row */}
            <div className="row g-3.5">
              {/* Left: Live Multi-Tenant Security & Isolation Audit */}
              <div className="col-12 col-lg-6">
                <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100" style={{ border: '1px solid #E2E8F0' }}>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center gap-2">
                      <ShieldCheck size={20} className="text-primary" />
                      <h6 className="fw-bold text-dark m-0">Multi-Tenant Isolation &amp; Security Audit</h6>
                    </div>
                    <span className="badge bg-success-subtle text-success rounded-pill px-2.5 py-0.5 extra-small font-monospace fw-bold">
                      {healthData?.tenant_isolation?.status_label || '100% VERIFIED'}
                    </span>
                  </div>
                  <p className="text-secondary extra-small mb-3">
                    Live audit of database entity foreign keys, parent-branch isolation boundaries, and JWT user scopes:
                  </p>
                  <div className="d-flex flex-column gap-2.5">
                    <div className="p-3 rounded-3 bg-light border d-flex align-items-start gap-2.5">
                      <Lock size={16} className="text-primary flex-shrink-0 mt-0.5" />
                      <div className="w-100">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-bold text-dark extra-small">Tenant Boundary Scoping</span>
                          <span className="badge bg-white text-dark border font-monospace extra-small">
                            {healthData?.tenant_isolation?.verified_tenants_count ?? properties.length} Lodges / {healthData?.tenant_isolation?.verified_branches_count ?? 0} Branches
                          </span>
                        </div>
                        <div className="text-secondary extra-small mt-1">
                          {healthData?.tenant_isolation?.note || 'All child properties bound to parent properties without relational leakage.'}
                        </div>
                      </div>
                    </div>
                    <div className="p-3 rounded-3 bg-light border d-flex align-items-start gap-2.5">
                      <Shield size={16} className="text-success flex-shrink-0 mt-0.5" />
                      <div className="w-100">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-bold text-dark extra-small">Relational Integrity &amp; Orphan Scan</span>
                          <span className="badge bg-success-subtle text-success font-monospace extra-small">
                            {healthData?.tenant_isolation?.total_leaks_detected ?? 0} Leaks Detected
                          </span>
                        </div>
                        <div className="text-secondary extra-small mt-1">
                          Rooms: {healthData?.tenant_isolation?.orphan_rooms ?? 0} orphans · Stays: {healthData?.tenant_isolation?.orphan_stays ?? 0} orphans · Payments: {healthData?.tenant_isolation?.orphan_payments ?? 0} orphans · Shifts: {healthData?.tenant_isolation?.orphan_shifts ?? 0} orphans.
                        </div>
                      </div>
                    </div>
                    <div className="p-3 rounded-3 bg-light border d-flex align-items-start gap-2.5">
                      <GitBranch size={16} className="text-info flex-shrink-0 mt-0.5" />
                      <div className="w-100">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-bold text-dark extra-small">Staff Identity &amp; Access Controls</span>
                          <span className="badge bg-white text-dark border font-monospace extra-small">
                            {healthData?.platform_metrics?.total_staff_users ?? 0} Staff Scoped
                          </span>
                        </div>
                        <div className="text-secondary extra-small mt-1">
                          {healthData?.platform_metrics?.active_staff_users ?? healthData?.platform_metrics?.total_staff_users ?? 0} active users strictly verified with JWT claims across {healthData?.platform_metrics?.active_properties ?? 0} operational property contexts.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Global Platform Record Counters */}
              <div className="col-12 col-lg-6">
                <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100" style={{ border: '1px solid #E2E8F0' }}>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center gap-2">
                      <Database size={20} className="text-primary" />
                      <h6 className="fw-bold text-dark m-0">Global Platform Activity Counters</h6>
                    </div>
                    <span className="badge bg-light text-secondary border font-monospace extra-small">
                      Live Telemetry
                    </span>
                  </div>
                  <p className="text-secondary extra-small mb-3">
                    Aggregated real-time metrics across all onboarded hotel properties and sub-branches:
                  </p>
                  <div className="row g-2">
                    <div className="col-6">
                      <div className="p-3 rounded-3 bg-light border text-center">
                        <div className="extra-small text-secondary fw-semibold">PRIMARY LODGES</div>
                        <div className="fs-3 fw-bold text-dark font-monospace mt-1">
                          {healthData?.platform_metrics?.total_properties ?? properties.length}
                        </div>
                        <div className="extra-small text-muted">{healthData?.platform_metrics?.active_properties ?? activeCount} active · {healthData?.platform_metrics?.suspended_properties ?? 0} suspended</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-3 rounded-3 bg-light border text-center">
                        <div className="extra-small text-secondary fw-semibold">HOTEL BRANCHES</div>
                        <div className="fs-3 fw-bold text-dark font-monospace mt-1">
                          {healthData?.platform_metrics?.total_branches ?? totalBranchesAll}
                        </div>
                        <div className="extra-small text-muted">Sub-property nodes</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-3 rounded-3 bg-light border text-center">
                        <div className="extra-small text-secondary fw-semibold">TOTAL BOOKINGS</div>
                        <div className="fs-3 fw-bold text-dark font-monospace mt-1">
                          {healthData?.platform_metrics?.total_bookings_recorded ?? '–'}
                        </div>
                        <div className="extra-small text-muted">Customer reservations</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-3 rounded-3 bg-light border text-center">
                        <div className="extra-small text-secondary fw-semibold">RECORDED STAYS</div>
                        <div className="fs-3 fw-bold text-dark font-monospace mt-1">
                          {healthData?.platform_metrics?.total_stays_recorded ?? '–'}
                        </div>
                        <div className="extra-small text-muted">{healthData?.platform_metrics?.active_stays_count ?? 0} active now</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-3 rounded-3 bg-light border text-center">
                        <div className="extra-small text-secondary fw-semibold">RECEPTION SHIFTS</div>
                        <div className="fs-3 fw-bold text-dark font-monospace mt-1">
                          {healthData?.platform_metrics?.total_shifts_recorded ?? '–'}
                        </div>
                        <div className="extra-small text-muted">{healthData?.platform_metrics?.active_shifts_open ?? 0} open shift till(s)</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-3 rounded-3 bg-light border text-center">
                        <div className="extra-small text-secondary fw-semibold">INVOICES ISSUED</div>
                        <div className="fs-3 fw-bold text-dark font-monospace mt-1">
                          {healthData?.platform_metrics?.total_invoices_recorded ?? '–'}
                        </div>
                        <div className="extra-small text-muted">Tax invoices archived</div>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="p-3 rounded-3 bg-light border text-center">
                        <div className="extra-small text-secondary fw-semibold">PAYMENTS PROCESSED</div>
                        <div className="fs-4 fw-bold text-dark font-monospace mt-1">
                          {healthData?.platform_metrics?.total_payments_processed ?? '–'} transactions (₹{healthData?.platform_metrics?.total_payments_volume?.toLocaleString('en-IN') ?? '0'})
                        </div>
                        <div className="extra-small text-muted mt-0.5">Live platform financial settlement volume</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

          </div>
        )}

        {/* Modal: Add New Branch */}
        {showAddBranchModal && selectedHotel && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(5px)', zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '560px', width: '100%' }}>
              <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden" style={{ borderRadius: '20px' }}>
                {/* Header */}
                <div className="modal-header border-bottom px-4 py-3.5 bg-white d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                      style={{
                        width: '42px',
                        height: '42px',
                        background: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)',
                        color: '#0284C7',
                        border: '1px solid #BAE6FD'
                      }}
                    >
                      <GitBranch size={20} />
                    </div>
                    <div>
                      <h5 className="modal-title fw-bold mb-0 text-dark" style={{ fontSize: '1.15rem', letterSpacing: '-0.015em' }}>
                        Add New Hotel Branch
                      </h5>
                      <span className="extra-small text-muted d-block mt-0.5">
                        Link secondary property wing to <strong className="text-dark">{selectedHotel.name}</strong>
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-close shadow-none"
                    style={{ fontSize: '0.8rem' }}
                    onClick={() => setShowAddBranchModal(false)}
                  ></button>
                </div>

                <form onSubmit={handleAddBranchSubmit}>
                  <div className="modal-body px-4 py-3.5" style={{ maxHeight: 'calc(85vh - 140px)', overflowY: 'auto' }}>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-dark mb-1">
                        Branch Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control py-2"
                        style={{ fontSize: '0.875rem' }}
                        required
                        placeholder="e.g. Hotel Beta - Airport Wing"
                        value={branchFormData.name}
                        onChange={(e) => {
                          const name = e.target.value;
                          const code = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
                          setBranchFormData({ ...branchFormData, name, code: branchFormData.code || `${selectedHotel.code}-${code}` });
                        }}
                      />
                    </div>

                    <div className="row g-3 mb-3">
                      <div className="col-6">
                        <label className="form-label small fw-semibold text-dark mb-1">Branch Code</label>
                        <input
                          type="text"
                          className="form-control font-monospace text-uppercase py-2"
                          style={{ fontSize: '0.875rem' }}
                          placeholder="e.g. PROP-BETA-BR1"
                          value={branchFormData.code}
                          onChange={(e) => setBranchFormData({ ...branchFormData, code: e.target.value.toUpperCase() })}
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label small fw-semibold text-dark mb-1">
                          Branch Room Limit <span className="text-danger">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          className="form-control font-monospace py-2"
                          style={{ fontSize: '0.875rem' }}
                          required
                          value={branchFormData.total_rooms}
                          onChange={(e) => setBranchFormData({ ...branchFormData, total_rooms: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                    </div>

                    <div className="row g-3 mb-3">
                      <div className="col-6">
                        <label className="form-label small fw-semibold text-dark mb-1">City</label>
                        <input
                          type="text"
                          className="form-control py-2"
                          style={{ fontSize: '0.875rem' }}
                          placeholder="City"
                          value={branchFormData.city}
                          onChange={(e) => setBranchFormData({ ...branchFormData, city: e.target.value })}
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label small fw-semibold text-dark mb-1">State</label>
                        <input
                          type="text"
                          className="form-control py-2"
                          style={{ fontSize: '0.875rem' }}
                          placeholder="State"
                          value={branchFormData.state}
                          onChange={(e) => setBranchFormData({ ...branchFormData, state: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="mb-2">
                      <label className="form-label small fw-semibold text-dark mb-1">Address (Optional)</label>
                      <input
                        type="text"
                        className="form-control py-2"
                        style={{ fontSize: '0.875rem' }}
                        placeholder="Street / Landmark"
                        value={branchFormData.address}
                        onChange={(e) => setBranchFormData({ ...branchFormData, address: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="modal-footer border-top px-4 py-3 bg-light d-flex justify-content-between align-items-center">
                    <button
                      type="button"
                      className="btn btn-white border px-3.5 py-2 rounded-3 text-secondary fw-semibold shadow-2xs hover-bg-light"
                      style={{ fontSize: '0.875rem' }}
                      onClick={() => setShowAddBranchModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary fw-bold px-4 py-2 rounded-3 text-white shadow-sm d-flex align-items-center gap-2"
                      disabled={addingBranch}
                      style={{ background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)', fontSize: '0.875rem' }}
                    >
                      {addingBranch ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          Creating Branch...
                        </>
                      ) : (
                        <>
                          <GitBranch size={16} /> Create &amp; Link Branch
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Add Staff User (Developer Console) */}
        {showAddStaffModal && selectedHotel && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(5px)', zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '560px', width: '100%' }}>
              <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden" style={{ borderRadius: '20px' }}>
                {/* Header */}
                <div className="modal-header border-bottom px-4 py-3.5 bg-white d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                      style={{
                        width: '42px',
                        height: '42px',
                        background: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)',
                        color: '#0284C7',
                        border: '1px solid #BAE6FD'
                      }}
                    >
                      <UserPlus size={20} />
                    </div>
                    <div>
                      <h5 className="modal-title fw-bold mb-0 text-dark" style={{ fontSize: '1.15rem', letterSpacing: '-0.015em' }}>
                        Add Staff / Branch Manager
                      </h5>
                      <span className="extra-small text-muted d-block mt-0.5">
                        Assign user credentials for <strong className="text-dark">{selectedHotel.name}</strong> or branch
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-close shadow-none"
                    style={{ fontSize: '0.8rem' }}
                    onClick={() => setShowAddStaffModal(false)}
                  ></button>
                </div>

                <form onSubmit={handleAddStaffSubmit}>
                  <div className="modal-body px-4 py-3.5" style={{ maxHeight: 'calc(85vh - 140px)', overflowY: 'auto' }}>
                    
                    {/* Section 1: Property Unit & Role Scope */}
                    <div className="p-3 rounded-3 mb-3 border" style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}>
                      <div className="mb-3">
                        <label className="form-label extra-small fw-bold text-uppercase text-secondary d-flex align-items-center gap-1.5 mb-1.5">
                          <Building2 size={13} className="text-primary" /> Assign to Hotel / Branch <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select rounded-3 py-2 bg-white"
                          style={{ fontSize: '0.875rem' }}
                          required
                          value={staffFormData.property_id}
                          onChange={(e) => setStaffFormData({ ...staffFormData, property_id: e.target.value })}
                        >
                          <option value={selectedHotel.id}>[Primary Hotel] {selectedHotel.name} ({selectedHotel.code})</option>
                          {(selectedHotel.branches || []).map((b) => (
                            <option key={b.id} value={b.id}>
                              [Branch] {b.name} ({b.code})
                            </option>
                          ))}
                        </select>
                        <div className="d-flex align-items-center gap-1.5 extra-small text-muted mt-1.5">
                          <Shield size={12} className="text-primary flex-shrink-0" />
                          <span>Staff access will be strictly scoped to operations inside this selected unit.</span>
                        </div>
                      </div>

                      <div>
                        <label className="form-label extra-small fw-bold text-uppercase text-secondary d-flex align-items-center gap-1.5 mb-1.5">
                          <UserCheck size={13} className="text-primary" /> User Role &amp; Permissions <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select rounded-3 py-2 bg-white"
                          style={{ fontSize: '0.875rem' }}
                          required
                          value={staffFormData.role}
                          onChange={(e) => setStaffFormData({ ...staffFormData, role: e.target.value })}
                        >
                          <option value="RECEPTIONIST">Receptionist (Front-Desk, Bookings &amp; Reservations)</option>
                          <option value="MANAGER">Branch Manager (Full Unit Supervision &amp; Staff Tills)</option>
                          <option value="STAFF">Support Staff (General Assistance)</option>
                        </select>
                      </div>
                    </div>

                    {/* Section 2: Account Security & Credentials */}
                    <div className="mb-3">
                      <div className="extra-small fw-bold text-uppercase text-muted mb-2" style={{ letterSpacing: '0.04em' }}>
                        Login Credentials
                      </div>
                      <div className="row g-3">
                        <div className="col-12 col-sm-6">
                          <label className="form-label small fw-semibold text-dark mb-1">
                            Username <span className="text-danger">*</span>
                          </label>
                          <div className="input-group">
                            <span className="input-group-text bg-light text-muted border-end-0 py-2" style={{ fontSize: '0.875rem' }}>
                              @
                            </span>
                            <input
                              type="text"
                              className="form-control font-monospace border-start-0 py-2"
                              style={{ fontSize: '0.875rem' }}
                              required
                              placeholder="e.g. branch_mgr"
                              value={staffFormData.username}
                              onChange={(e) => setStaffFormData({ ...staffFormData, username: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                            />
                          </div>
                        </div>

                        <div className="col-12 col-sm-6">
                          <label className="form-label small fw-semibold text-dark mb-1">
                            Temporary Password
                          </label>
                          <div className="input-group">
                            <span className="input-group-text bg-light text-muted border-end-0 py-2">
                              <Lock size={14} />
                            </span>
                            <input
                              type="text"
                              className="form-control font-monospace border-start-0 py-2"
                              style={{ fontSize: '0.875rem' }}
                              placeholder="Auto-generate if blank"
                              value={staffFormData.password}
                              onChange={(e) => setStaffFormData({ ...staffFormData, password: e.target.value })}
                            />
                          </div>
                          <span className="extra-small text-muted mt-1 d-block">Leave blank to auto-generate password</span>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Staff Profile Details */}
                    <div>
                      <div className="extra-small fw-bold text-uppercase text-muted mb-2" style={{ letterSpacing: '0.04em' }}>
                        Staff Profile &amp; Contact
                      </div>
                      <div className="row g-3 mb-3">
                        <div className="col-12 col-sm-6">
                          <label className="form-label small fw-semibold text-dark mb-1">First Name</label>
                          <input
                            type="text"
                            className="form-control py-2"
                            style={{ fontSize: '0.875rem' }}
                            placeholder="e.g. Rameshwar"
                            value={staffFormData.first_name}
                            onChange={(e) => setStaffFormData({ ...staffFormData, first_name: e.target.value })}
                          />
                        </div>
                        <div className="col-12 col-sm-6">
                          <label className="form-label small fw-semibold text-dark mb-1">Last Name</label>
                          <input
                            type="text"
                            className="form-control py-2"
                            style={{ fontSize: '0.875rem' }}
                            placeholder="e.g. Pawar"
                            value={staffFormData.last_name}
                            onChange={(e) => setStaffFormData({ ...staffFormData, last_name: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="form-label small fw-semibold text-dark mb-1">Email Address (Optional)</label>
                        <div className="input-group">
                          <span className="input-group-text bg-light text-muted border-end-0 py-2">
                            <Mail size={14} />
                          </span>
                          <input
                            type="email"
                            className="form-control border-start-0 py-2"
                            style={{ fontSize: '0.875rem' }}
                            placeholder="staff@hotel.com"
                            value={staffFormData.email}
                            onChange={(e) => setStaffFormData({ ...staffFormData, email: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Footer */}
                  <div className="modal-footer border-top px-4 py-3 bg-light d-flex justify-content-between align-items-center">
                    <button
                      type="button"
                      className="btn btn-white border px-3.5 py-2 rounded-3 text-secondary fw-semibold shadow-2xs hover-bg-light"
                      style={{ fontSize: '0.875rem' }}
                      onClick={() => setShowAddStaffModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary fw-bold px-4 py-2 rounded-3 text-white shadow-sm d-flex align-items-center gap-2"
                      disabled={addingStaff}
                      style={{ background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)', fontSize: '0.875rem' }}
                    >
                      {addingStaff ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          Creating User...
                        </>
                      ) : (
                        <>
                          <UserPlus size={16} /> Create Staff Member
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Reset Staff Password */}
        {showResetStaffModal && staffToReset && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(5px)', zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '480px', width: '100%' }}>
              <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden" style={{ borderRadius: '20px' }}>
                <div className="modal-header border-bottom px-4 py-3.5 bg-white d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                      style={{
                        width: '42px',
                        height: '42px',
                        background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                        color: '#D97706',
                        border: '1px solid #FDE68A'
                      }}
                    >
                      <Key size={20} />
                    </div>
                    <div>
                      <h5 className="modal-title fw-bold mb-0 text-dark" style={{ fontSize: '1.15rem', letterSpacing: '-0.015em' }}>
                        Reset Staff Password
                      </h5>
                      <span className="extra-small text-muted d-block mt-0.5">
                        Set new credentials for <strong className="text-dark">{staffToReset.username}</strong>
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-close shadow-none"
                    style={{ fontSize: '0.8rem' }}
                    onClick={() => setShowResetStaffModal(false)}
                  ></button>
                </div>

                <form onSubmit={handleResetStaffPasswordSubmit}>
                  <div className="modal-body px-4 py-3.5">
                    <div className="p-3 rounded-3 mb-3 border bg-light">
                      <div className="extra-small text-muted mb-1">Target Account</div>
                      <div className="d-flex align-items-center justify-content-between">
                        <span className="fw-bold text-dark font-monospace">{staffToReset.username}</span>
                        <span className="badge bg-primary-subtle text-primary extra-small">{staffToReset.role}</span>
                      </div>
                      <div className="extra-small text-muted mt-1">Property: {staffToReset.property_name}</div>
                    </div>

                    <div className="mb-2">
                      <label className="form-label small fw-semibold text-dark mb-1">New Password</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light text-muted border-end-0 py-2">
                          <Lock size={14} />
                        </span>
                        <input
                          type="text"
                          className="form-control font-monospace border-start-0 py-2"
                          style={{ fontSize: '0.875rem' }}
                          placeholder="Leave blank for automatic secure password"
                          value={newStaffPasswordInput}
                          onChange={(e) => setNewStaffPasswordInput(e.target.value)}
                        />
                      </div>
                      <span className="extra-small text-muted mt-1 d-block">
                        Leave blank to generate a high-entropy temporary password.
                      </span>
                    </div>
                  </div>

                  <div className="modal-footer border-top px-4 py-3 bg-light d-flex justify-content-between align-items-center">
                    <button
                      type="button"
                      className="btn btn-white border px-3.5 py-2 rounded-3 text-secondary fw-semibold shadow-2xs hover-bg-light"
                      style={{ fontSize: '0.875rem' }}
                      onClick={() => setShowResetStaffModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-warning fw-bold px-4 py-2 rounded-3 text-dark shadow-sm d-flex align-items-center gap-2"
                      disabled={resettingStaff}
                      style={{ fontSize: '0.875rem' }}
                    >
                      {resettingStaff ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          Resetting...
                        </>
                      ) : (
                        <>
                          <Key size={16} /> Confirm Password Reset
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Onboard Property Modal */}
        {showOnboardModal && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(5px)', zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden" style={{ borderRadius: '20px' }}>
                <div className="modal-header border-bottom px-4 py-3.5 bg-white d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                      style={{
                        width: '42px',
                        height: '42px',
                        background: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)',
                        color: '#0284C7',
                        border: '1px solid #BAE6FD'
                      }}
                    >
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h5 className="modal-title fw-bold mb-0 text-dark" style={{ fontSize: '1.15rem', letterSpacing: '-0.015em' }}>
                        Onboard New Hotel Property
                      </h5>
                      <span className="extra-small text-muted d-block mt-0.5">
                        Create tenant instance, room allocation &amp; owner credentials
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-close shadow-none"
                    style={{ fontSize: '0.8rem' }}
                    onClick={() => setShowOnboardModal(false)}
                  ></button>
                </div>

                <form onSubmit={handleOnboardSubmit}>
                  <div className="modal-body px-4 py-3.5" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-dark mb-1">Hotel Name *</label>
                        <input
                          type="text"
                          className="form-control py-2"
                          style={{ fontSize: '0.875rem' }}
                          required
                          value={formData.name}
                          onChange={(e) => {
                            const name = e.target.value;
                            const code = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10);
                            setFormData({ ...formData, name, code: formData.code || `PROP-${code}` });
                          }}
                          placeholder="e.g. Grand Royal Resort & Spa"
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small fw-semibold text-dark mb-1">Property Code *</label>
                        <input
                          type="text"
                          className="form-control font-monospace text-uppercase py-2"
                          style={{ fontSize: '0.875rem' }}
                          required
                          value={formData.code}
                          onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                          placeholder="e.g. PROP-ROYAL"
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small fw-semibold text-dark mb-1">Max Room Capacity *</label>
                        <input
                          type="number"
                          className="form-control font-monospace py-2"
                          style={{ fontSize: '0.875rem' }}
                          required
                          min="1"
                          value={formData.total_rooms}
                          onChange={(e) => setFormData({ ...formData, total_rooms: parseInt(e.target.value) || 15 })}
                        />
                      </div>
                    </div>

                    <div className="row g-3 mb-4">
                      <div className="col-md-4">
                        <label className="form-label small fw-semibold text-dark mb-1">Owner Full Name *</label>
                        <input
                          type="text"
                          className="form-control py-2"
                          style={{ fontSize: '0.875rem' }}
                          required
                          value={formData.owner_name}
                          onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                          placeholder="e.g. Rajesh Sharma"
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small fw-semibold text-dark mb-1">Owner Email *</label>
                        <input
                          type="email"
                          className="form-control py-2"
                          style={{ fontSize: '0.875rem' }}
                          required
                          value={formData.owner_email}
                          onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
                          placeholder="owner@hotel.com"
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small fw-semibold text-dark mb-1">Owner Phone *</label>
                        <input
                          type="text"
                          className="form-control py-2"
                          style={{ fontSize: '0.875rem' }}
                          required
                          value={formData.owner_phone}
                          onChange={(e) => setFormData({ ...formData, owner_phone: e.target.value })}
                          placeholder="+91 98765 43210"
                        />
                      </div>
                    </div>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-dark mb-1">Subscription Plan</label>
                        <select
                          className="form-select py-2"
                          style={{ fontSize: '0.875rem' }}
                          value={formData.plan_code}
                          onChange={(e) => setFormData({ ...formData, plan_code: e.target.value })}
                        >
                          <option value="STARTER">Starter Plan (Up to 15 Rooms)</option>
                          <option value="GROWTH">Growth Plan (Up to 40 Rooms)</option>
                          <option value="ENTERPRISE">Enterprise Plan (Unlimited Rooms)</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-dark mb-1">Billing Cycle</label>
                        <select
                          className="form-select py-2"
                          style={{ fontSize: '0.875rem' }}
                          value={formData.billing_cycle}
                          onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value })}
                        >
                          <option value="ANNUAL">Annual Billing (12 Months)</option>
                          <option value="MONTHLY">Monthly Billing (1 Month)</option>
                        </select>
                      </div>

                      <div className="col-12">
                        <label className="form-label small fw-semibold text-dark mb-1">
                          Operational Shift &amp; Till Mode
                        </label>
                        <select
                          className="form-select py-2"
                          style={{ fontSize: '0.875rem' }}
                          value={formData.operation_mode || 'SHIFT_WISE'}
                          onChange={(e) => setFormData({ ...formData, operation_mode: e.target.value })}
                        >
                          <option value="SHIFT_WISE">Shift-Wise (Rotating Cashiers, Shift Handovers &amp; Till Audits)</option>
                          <option value="SINGLE_OWNER">Single Owner (Direct Management / No Shifts)</option>
                        </select>
                        <small className="text-muted extra-small">
                          For single-owner properties, select Single Owner to eliminate shift handovers and till friction.
                        </small>
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer border-top px-4 py-3 bg-light d-flex justify-content-between align-items-center">
                    <button
                      type="button"
                      className="btn btn-white border px-3.5 py-2 rounded-3 text-secondary fw-semibold shadow-2xs hover-bg-light"
                      style={{ fontSize: '0.875rem' }}
                      onClick={() => setShowOnboardModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary fw-bold px-4 py-2 rounded-3 text-white shadow-sm d-flex align-items-center gap-2"
                      disabled={submitting}
                      style={{ background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)', fontSize: '0.875rem' }}
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          Creating Instance...
                        </>
                      ) : (
                        <>
                          <Building2 size={16} /> Onboard Hotel
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Credentials Created Popup */}
        {showCredentialsModal && createdCredentials && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(5px)', zIndex: 1070 }}>
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '500px', width: '100%' }}>
              <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden" style={{ borderRadius: '20px' }}>
                <div className="modal-header border-bottom px-4 py-3.5 bg-white d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                      style={{
                        width: '42px',
                        height: '42px',
                        background: 'linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)',
                        color: '#16A34A',
                        border: '1px solid #BBF7D0'
                      }}
                    >
                      <CheckCircle2 size={22} />
                    </div>
                    <div>
                      <h5 className="modal-title fw-bold mb-0 text-dark" style={{ fontSize: '1.15rem', letterSpacing: '-0.015em' }}>
                        {createdCredentials.title || 'Hotel Provisioned Successfully!'}
                      </h5>
                      <span className="extra-small text-muted d-block mt-0.5">
                        {createdCredentials.subtitle || 'Credentials generated for access'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-close shadow-none"
                    style={{ fontSize: '0.8rem' }}
                    onClick={() => setShowCredentialsModal(false)}
                  ></button>
                </div>
                <div className="modal-body px-4 py-3.5">
                  <div className="p-3.5 bg-light rounded-3 border d-flex flex-column gap-2.5">
                    {createdCredentials.property_name && (
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted extra-small">Hotel / Branch:</span>
                        <strong className="text-dark small">{createdCredentials.property_name}</strong>
                      </div>
                    )}
                    {createdCredentials.role && (
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted extra-small">Role:</span>
                        <span className="badge bg-primary-subtle text-primary extra-small">{createdCredentials.role}</span>
                      </div>
                    )}
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
                    className="btn btn-white border flex-grow-1 fw-bold py-2 rounded-3 text-secondary d-flex align-items-center justify-content-center gap-1.5 shadow-2xs hover-bg-light"
                    style={{ fontSize: '0.875rem' }}
                    onClick={() => {
                      copyToClipboard(`Hotel/Branch: ${createdCredentials.property_name || ''}\nRole: ${createdCredentials.role || 'HOTEL_OWNER'}\nUsername: ${createdCredentials.username}\nPassword: ${createdCredentials.password}`);
                    }}
                  >
                    <Copy size={15} /> Copy Credentials
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary flex-grow-1 fw-bold py-2 rounded-3 text-white shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)', fontSize: '0.875rem' }}
                    onClick={() => setShowCredentialsModal(false)}
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Renew Plan Modal */}
        {showRenewModal && selectedPropertyForRenew && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(5px)', zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '480px', width: '100%' }}>
              <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden" style={{ borderRadius: '20px' }}>
                <div className="modal-header border-bottom px-4 py-3.5 bg-white d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                      style={{
                        width: '42px',
                        height: '42px',
                        background: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)',
                        color: '#0284C7',
                        border: '1px solid #BAE6FD'
                      }}
                    >
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h5 className="modal-title fw-bold mb-0 text-dark" style={{ fontSize: '1.15rem', letterSpacing: '-0.015em' }}>
                        Renew Subscription
                      </h5>
                      <span className="extra-small text-muted d-block mt-0.5">
                        Extend subscription for <strong className="text-dark">{selectedPropertyForRenew.name}</strong>
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-close shadow-none"
                    style={{ fontSize: '0.8rem' }}
                    onClick={() => setShowRenewModal(false)}
                  ></button>
                </div>
                <div className="modal-body px-4 py-3.5">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark mb-1">Renewal Period</label>
                    <select id="renewDurationSelect" className="form-select py-2" style={{ fontSize: '0.875rem' }}>
                      <option value="12">12 Months (1 Year Renewal)</option>
                      <option value="6">6 Months Renewal</option>
                      <option value="1">1 Month Renewal</option>
                      <option value="24">24 Months (2 Years Renewal)</option>
                    </select>
                  </div>
                  <div className="mb-2">
                    <label className="form-label small fw-semibold text-dark mb-1">Subscription Tier</label>
                    <select id="renewPlanSelect" className="form-select py-2" style={{ fontSize: '0.875rem' }} defaultValue={selectedPropertyForRenew.subscription?.plan_code || 'STARTER'}>
                      <option value="STARTER">Starter Plan (Up to 15 Rooms)</option>
                      <option value="GROWTH">Growth Plan (Up to 40 Rooms)</option>
                      <option value="ENTERPRISE">Enterprise Plan (Unlimited Rooms)</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer border-top px-4 py-3 bg-light d-flex justify-content-between align-items-center">
                  <button
                    type="button"
                    className="btn btn-white border px-3.5 py-2 rounded-3 text-secondary fw-semibold shadow-2xs hover-bg-light"
                    style={{ fontSize: '0.875rem' }}
                    onClick={() => setShowRenewModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary fw-bold px-4 py-2 rounded-3 text-white shadow-sm d-flex align-items-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)', fontSize: '0.875rem' }}
                    onClick={() => {
                      const dur = parseInt(document.getElementById('renewDurationSelect').value);
                      const pl = document.getElementById('renewPlanSelect').value;
                      handleRenewSubmit(dur, pl);
                    }}
                  >
                    <ShieldCheck size={16} />
                    Confirm &amp; Extend Plan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Create or Edit Subscription Plan */}
        {showPlanModal && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(5px)', zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '540px', width: '100%' }}>
              <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden" style={{ borderRadius: '20px' }}>
                <div className="modal-header border-bottom px-4 py-3.5 bg-white d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                      style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)', color: '#0284C7', border: '1px solid #BAE6FD' }}
                    >
                      <Layers size={20} />
                    </div>
                    <div>
                      <h5 className="modal-title fw-bold mb-0 text-dark" style={{ fontSize: '1.15rem', letterSpacing: '-0.015em' }}>
                        {editingPlan ? `Edit Subscription Plan: ${editingPlan.name}` : 'Create New Subscription Plan'}
                      </h5>
                      <span className="extra-small text-muted d-block mt-0.5">
                        {editingPlan ? 'Modify plan pricing and room quota' : 'Define new pricing tier and commercial terms'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-close shadow-none"
                    style={{ fontSize: '0.8rem' }}
                    onClick={() => setShowPlanModal(false)}
                  ></button>
                </div>

                <form onSubmit={handleSavePlanSubmit}>
                  <div className="modal-body px-4 py-3.5" style={{ maxHeight: 'calc(85vh - 140px)', overflowY: 'auto' }}>
                    <div className="row g-3 mb-3">
                      <div className="col-6">
                        <label className="form-label small fw-semibold text-dark mb-1">Plan Code <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control font-monospace text-uppercase py-2"
                          style={{ fontSize: '0.875rem' }}
                          required
                          disabled={!!editingPlan}
                          placeholder="e.g. VIP_HOTEL_TIER"
                          value={planFormData.code}
                          onChange={(e) => setPlanFormData({ ...planFormData, code: e.target.value.toUpperCase() })}
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label small fw-semibold text-dark mb-1">Plan Name <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control py-2"
                          style={{ fontSize: '0.875rem' }}
                          required
                          placeholder="e.g. Executive Resort Plan"
                          value={planFormData.name}
                          onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="row g-3 mb-3">
                      <div className="col-4">
                        <label className="form-label small fw-semibold text-dark mb-1">Max Rooms <span className="text-danger">*</span></label>
                        <input
                          type="number"
                          min="1"
                          className="form-control font-monospace py-2"
                          style={{ fontSize: '0.875rem' }}
                          required
                          value={planFormData.max_rooms}
                          onChange={(e) => setPlanFormData({ ...planFormData, max_rooms: parseInt(e.target.value) || 1 })}
                        />
                        <div className="extra-small text-muted mt-1">9999 = Unlimited</div>
                      </div>
                      <div className="col-4">
                        <label className="form-label small fw-semibold text-dark mb-1">Monthly Price (₹)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="form-control font-monospace py-2"
                          style={{ fontSize: '0.875rem' }}
                          required
                          value={planFormData.price_monthly}
                          onChange={(e) => setPlanFormData({ ...planFormData, price_monthly: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="col-4">
                        <label className="form-label small fw-semibold text-dark mb-1">Annual Price (₹)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="form-control font-monospace py-2"
                          style={{ fontSize: '0.875rem' }}
                          required
                          value={planFormData.price_annually}
                          onChange={(e) => setPlanFormData({ ...planFormData, price_annually: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-dark mb-1">Features (comma-separated)</label>
                      <textarea
                        className="form-control py-2"
                        rows="3"
                        style={{ fontSize: '0.875rem' }}
                        placeholder="e.g. Front Desk, Till Audit, Multi-Branch, Priority Support"
                        value={planFormData.features}
                        onChange={(e) => setPlanFormData({ ...planFormData, features: e.target.value })}
                      ></textarea>
                    </div>

                    <div className="form-check form-switch mt-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="planActiveSwitch"
                        checked={planFormData.is_active}
                        onChange={(e) => setPlanFormData({ ...planFormData, is_active: e.target.checked })}
                      />
                      <label className="form-check-label small fw-semibold text-dark" htmlFor="planActiveSwitch">
                        Active &amp; Available for Subscription
                      </label>
                    </div>
                  </div>

                  <div className="modal-footer border-top px-4 py-3 bg-light d-flex justify-content-between align-items-center">
                    <button
                      type="button"
                      className="btn btn-white border px-3.5 py-2 rounded-3 text-secondary fw-semibold shadow-2xs hover-bg-light"
                      style={{ fontSize: '0.875rem' }}
                      onClick={() => setShowPlanModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingPlan}
                      className="btn btn-primary fw-bold px-4 py-2 rounded-3 text-white shadow-sm d-flex align-items-center gap-2"
                      style={{ background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)', fontSize: '0.875rem' }}
                    >
                      {savingPlan ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          Saving Plan...
                        </>
                      ) : (
                        <>
                          <Save size={16} /> {editingPlan ? 'Save Changes' : 'Create Plan'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Assign Custom Bespoke Subscription */}
        {showCustomSubModal && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(5px)', zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '600px', width: '100%' }}>
              <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden" style={{ borderRadius: '20px' }}>
                <div className="modal-header border-bottom px-4 py-3.5 bg-white d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                      style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)', color: '#D97706', border: '1px solid #FCD34D' }}
                    >
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h5 className="modal-title fw-bold mb-0 text-dark" style={{ fontSize: '1.15rem', letterSpacing: '-0.015em' }}>
                        Custom Hotel Subscription (Bespoke Terms)
                      </h5>
                      <span className="extra-small text-muted d-block mt-0.5">
                        Customize room limit, commercial charges, and expiration date for this property
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-close shadow-none"
                    style={{ fontSize: '0.8rem' }}
                    onClick={() => setShowCustomSubModal(false)}
                  ></button>
                </div>

                <form onSubmit={handleSaveCustomSubSubmit}>
                  <div className="modal-body px-4 py-3.5" style={{ maxHeight: 'calc(85vh - 140px)', overflowY: 'auto' }}>
                    {/* Target Property Select */}
                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-dark mb-1">
                        Select Target Hotel Property <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select py-2"
                        style={{ fontSize: '0.875rem' }}
                        required
                        value={customSubFormData.property_id}
                        onChange={(e) => {
                          const propId = e.target.value;
                          const selectedP = properties.find(p => p.id === parseInt(propId));
                          setCustomSubFormData({
                            ...customSubFormData,
                            property_id: propId,
                            plan_name: selectedP ? `Custom Plan - ${selectedP.name}` : customSubFormData.plan_name,
                            custom_rooms: selectedP?.total_rooms || customSubFormData.custom_rooms,
                            custom_charges: selectedP?.subscription?.billing_amount || customSubFormData.custom_charges,
                            custom_expiry_date: selectedP?.subscription?.valid_until || customSubFormData.custom_expiry_date
                          });
                        }}
                      >
                        <option value="">-- Choose Hotel --</option>
                        {properties.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.code}) – Currently {p.total_rooms} Rooms
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Custom Plan Label */}
                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-dark mb-1">
                        Custom Plan Label / Agreement Name
                      </label>
                      <input
                        type="text"
                        className="form-control py-2"
                        style={{ fontSize: '0.875rem' }}
                        placeholder="e.g. VIP Enterprise Contract - Grand Royal"
                        value={customSubFormData.plan_name}
                        onChange={(e) => setCustomSubFormData({ ...customSubFormData, plan_name: e.target.value })}
                      />
                    </div>

                    {/* Custom Room Limit & Custom Charges */}
                    <div className="row g-3 mb-3">
                      <div className="col-6">
                        <label className="form-label small fw-semibold text-dark mb-1">
                          Custom Room Limit <span className="text-danger">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          className="form-control font-monospace py-2"
                          style={{ fontSize: '0.875rem' }}
                          required
                          value={customSubFormData.custom_rooms}
                          onChange={(e) => setCustomSubFormData({ ...customSubFormData, custom_rooms: parseInt(e.target.value) || 1 })}
                        />
                        <div className="extra-small text-muted mt-1">
                          Sets total rooms limit for this hotel &amp; branches
                        </div>
                      </div>
                      <div className="col-6">
                        <label className="form-label small fw-semibold text-dark mb-1">
                          Custom Charges (₹) <span className="text-danger">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="form-control font-monospace py-2"
                          style={{ fontSize: '0.875rem' }}
                          required
                          value={customSubFormData.custom_charges}
                          onChange={(e) => setCustomSubFormData({ ...customSubFormData, custom_charges: parseFloat(e.target.value) || 0 })}
                        />
                        <div className="extra-small text-muted mt-1">
                          Negotiated commercial contract amount
                        </div>
                      </div>
                    </div>

                    {/* Custom Expiry Date with quick helpers */}
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="form-label small fw-semibold text-dark m-0">
                          Custom Expiration Date <span className="text-danger">*</span>
                        </label>
                        <div className="d-flex gap-1">
                          <button
                            type="button"
                            className="btn btn-xs btn-outline-secondary py-0 px-1.5 extra-small rounded"
                            onClick={() => {
                              const d = new Date();
                              d.setDate(d.getDate() + 30);
                              setCustomSubFormData({ ...customSubFormData, custom_expiry_date: d.toISOString().split('T')[0] });
                            }}
                          >
                            +30d
                          </button>
                          <button
                            type="button"
                            className="btn btn-xs btn-outline-secondary py-0 px-1.5 extra-small rounded"
                            onClick={() => {
                              const d = new Date();
                              d.setFullYear(d.getFullYear() + 1);
                              setCustomSubFormData({ ...customSubFormData, custom_expiry_date: d.toISOString().split('T')[0] });
                            }}
                          >
                            +1yr
                          </button>
                          <button
                            type="button"
                            className="btn btn-xs btn-outline-secondary py-0 px-1.5 extra-small rounded"
                            onClick={() => {
                              const d = new Date();
                              d.setFullYear(d.getFullYear() + 2);
                              setCustomSubFormData({ ...customSubFormData, custom_expiry_date: d.toISOString().split('T')[0] });
                            }}
                          >
                            +2yr
                          </button>
                          <button
                            type="button"
                            className="btn btn-xs btn-outline-secondary py-0 px-1.5 extra-small rounded"
                            onClick={() => {
                              const d = new Date();
                              d.setFullYear(d.getFullYear() + 5);
                              setCustomSubFormData({ ...customSubFormData, custom_expiry_date: d.toISOString().split('T')[0] });
                            }}
                          >
                            +5yr
                          </button>
                        </div>
                      </div>
                      <input
                        type="date"
                        className="form-control font-monospace py-2"
                        style={{ fontSize: '0.875rem' }}
                        required
                        value={customSubFormData.custom_expiry_date}
                        onChange={(e) => setCustomSubFormData({ ...customSubFormData, custom_expiry_date: e.target.value })}
                      />
                    </div>

                    {/* Billing Cycle & Payment Status */}
                    <div className="row g-3 mb-3">
                      <div className="col-6">
                        <label className="form-label small fw-semibold text-dark mb-1">Billing Cycle</label>
                        <select
                          className="form-select py-2"
                          style={{ fontSize: '0.875rem' }}
                          value={customSubFormData.billing_cycle}
                          onChange={(e) => setCustomSubFormData({ ...customSubFormData, billing_cycle: e.target.value })}
                        >
                          <option value="ANNUAL">Annual Renewal</option>
                          <option value="MONTHLY">Monthly Billing</option>
                          <option value="LIFETIME">Lifetime / Custom Agreement</option>
                        </select>
                      </div>
                      <div className="col-6">
                        <label className="form-label small fw-semibold text-dark mb-1">Payment Status</label>
                        <select
                          className="form-select py-2"
                          style={{ fontSize: '0.875rem' }}
                          value={customSubFormData.payment_status}
                          onChange={(e) => setCustomSubFormData({ ...customSubFormData, payment_status: e.target.value })}
                        >
                          <option value="PAID">PAID (Active License)</option>
                          <option value="PENDING">PENDING (Payment Due)</option>
                        </select>
                      </div>
                    </div>

                    {/* Custom Notes / Features */}
                    <div className="mb-2">
                      <label className="form-label small fw-semibold text-dark mb-1">Contract Inclusions / Notes</label>
                      <textarea
                        className="form-control py-2"
                        rows="2"
                        style={{ fontSize: '0.875rem' }}
                        placeholder="e.g. Bespoke Enterprise License, Dedicated Support Concierge, Unlimited Branches"
                        value={customSubFormData.features}
                        onChange={(e) => setCustomSubFormData({ ...customSubFormData, features: e.target.value })}
                      ></textarea>
                    </div>
                  </div>

                  <div className="modal-footer border-top px-4 py-3 bg-light d-flex justify-content-between align-items-center">
                    <button
                      type="button"
                      className="btn btn-white border px-3.5 py-2 rounded-3 text-secondary fw-semibold shadow-2xs hover-bg-light"
                      style={{ fontSize: '0.875rem' }}
                      onClick={() => setShowCustomSubModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingCustomSub}
                      className="btn btn-primary fw-bold px-4 py-2 rounded-3 text-white shadow-sm d-flex align-items-center gap-2"
                      style={{ background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)', fontSize: '0.875rem' }}
                    >
                      {savingCustomSub ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          Applying Custom Terms...
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} className="text-warning" /> Apply Custom Terms to Hotel
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Record Commercial SaaS Subscription Payment */}
        {showRecordPaymentModal && (selectedHotelForPayment || selectedHotel) && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(5px)', zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '580px', width: '100%' }}>
              <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden" style={{ borderRadius: '20px' }}>
                <div className="modal-header border-bottom px-4 py-3.5 bg-white d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                      style={{
                        width: '42px',
                        height: '42px',
                        background: editingPaymentId ? 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)' : 'linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)',
                        color: editingPaymentId ? '#0284C7' : '#15803D',
                        border: editingPaymentId ? '1px solid #7DD3FC' : '1px solid #86EFAC'
                      }}
                    >
                      {editingPaymentId ? <Edit3 size={20} /> : <CreditCard size={20} />}
                    </div>
                    <div>
                      <h5 className="modal-title fw-bold mb-0 text-dark" style={{ fontSize: '1.15rem', letterSpacing: '-0.015em' }}>
                        {editingPaymentId ? 'Edit Recorded Payment Entry' : 'Record Subscription Payment'}
                      </h5>
                      <span className="extra-small text-muted d-block mt-0.5">
                        {editingPaymentId
                          ? `Update payment settlement details for ${(selectedHotelForPayment || selectedHotel)?.name} (${(selectedHotelForPayment || selectedHotel)?.code})`
                          : `Log new payment settlement for ${(selectedHotelForPayment || selectedHotel)?.name} (${(selectedHotelForPayment || selectedHotel)?.code})`}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-close shadow-none"
                    style={{ fontSize: '0.8rem' }}
                    onClick={() => setShowRecordPaymentModal(false)}
                  ></button>
                </div>

                <form onSubmit={handleSubmitRecordPayment}>
                  <div className="modal-body px-4 py-3.5" style={{ maxHeight: 'calc(85vh - 140px)', overflowY: 'auto' }}>
                    {/* Invoice & Hotel Info Banner */}
                    <div className="p-3 rounded-3 mb-3 bg-light border d-flex align-items-center justify-content-between flex-wrap gap-2">
                      <div>
                        <div className="extra-small text-muted text-uppercase fw-bold">Hotel Account</div>
                        <div className="fw-bold text-dark small font-monospace">
                          {(selectedHotelForPayment || selectedHotel)?.name} [{(selectedHotelForPayment || selectedHotel)?.code}]
                        </div>
                      </div>
                      <div>
                        <div className="extra-small text-muted text-uppercase fw-bold">Invoice / Bill #</div>
                        <div className="fw-bold text-primary small font-monospace">
                          {paymentFormData.invoice_no || getDynamicInvoiceNo((selectedHotelForPayment || selectedHotel)?.code)}
                        </div>
                      </div>
                      <div>
                        <div className="extra-small text-muted text-uppercase fw-bold">Plan Tier</div>
                        <span className="badge bg-primary-subtle text-primary border rounded-pill extra-small px-2 py-0.5">
                          {(selectedHotelForPayment || selectedHotel)?.subscription?.plan_name || 'Standard Plan'}
                        </span>
                      </div>
                    </div>

                    {/* Row 1: Amount & Payment Date */}
                    <div className="row g-3 mb-3">
                      <div className="col-sm-6">
                        <label className="form-label small fw-semibold text-dark mb-1">
                          Payment Amount (₹) <span className="text-danger">*</span>
                        </label>
                        <div className="input-group">
                          <span className="input-group-text bg-white text-muted fw-bold">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="form-control font-monospace py-2"
                            style={{ fontSize: '0.875rem' }}
                            required
                            placeholder="e.g. 9999"
                            value={paymentFormData.amount}
                            onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                          />
                        </div>
                        <div className="extra-small text-muted mt-1">Gross settlement amount received</div>
                      </div>
                      <div className="col-sm-6">
                        <label className="form-label small fw-semibold text-dark mb-1">
                          Payment Date <span className="text-danger">*</span>
                        </label>
                        <input
                          type="date"
                          className="form-control py-2 font-monospace"
                          style={{ fontSize: '0.875rem' }}
                          required
                          value={paymentFormData.payment_date}
                          onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_date: e.target.value })}
                        />
                        <div className="extra-small text-muted mt-1">Date funds credited to bank/till</div>
                      </div>
                    </div>

                    {/* Row 2: Payment Method & Payment Status */}
                    <div className="row g-3 mb-3">
                      <div className="col-sm-6">
                        <label className="form-label small fw-semibold text-dark mb-1">
                          Payment Mode <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select py-2"
                          style={{ fontSize: '0.875rem' }}
                          value={paymentFormData.payment_method}
                          onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_method: e.target.value })}
                        >
                          <option value="UPI">UPI / GooglePay / PhonePe / Paytm</option>
                          <option value="BANK_TRANSFER">Bank Transfer (NEFT / RTGS / IMPS)</option>
                          <option value="CARD">Credit / Debit Card</option>
                          <option value="CASH">Cash Settlement</option>
                          <option value="OTHER">Cheque / Demand Draft / Other</option>
                        </select>
                      </div>
                      <div className="col-sm-6">
                        <label className="form-label small fw-semibold text-dark mb-1">
                          Settlement Status <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select py-2 fw-semibold"
                          style={{ fontSize: '0.875rem' }}
                          value={paymentFormData.payment_status}
                          onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_status: e.target.value })}
                        >
                          <option value="PAID">PAID (Fully Settled &amp; Active)</option>
                          <option value="PARTIAL">PARTIAL (Partially Paid)</option>
                          <option value="PENDING">PENDING (Payment Awaited)</option>
                        </select>
                      </div>
                    </div>

                    {/* Row 3: Transaction Ref & Extend Months */}
                    <div className="row g-3 mb-3">
                      <div className="col-sm-6">
                        <label className="form-label small fw-semibold text-dark mb-1">
                          Transaction Ref / UTR / Cheque #
                        </label>
                        <input
                          type="text"
                          className="form-control font-monospace py-2"
                          style={{ fontSize: '0.875rem' }}
                          placeholder={`e.g. UTR-${new Date().getFullYear()}09060012`}
                          value={paymentFormData.transaction_reference}
                          onChange={(e) => setPaymentFormData({ ...paymentFormData, transaction_reference: e.target.value })}
                        />
                        <div className="extra-small text-muted mt-1">Bank UTR, UPI Ref ID or Cheque No</div>
                      </div>
                      <div className="col-sm-6">
                        <label className="form-label small fw-semibold text-dark mb-1">
                          Extend License Term (Optional)
                        </label>
                        <select
                          className="form-select py-2"
                          style={{ fontSize: '0.875rem' }}
                          value={paymentFormData.extend_months}
                          onChange={(e) => setPaymentFormData({ ...paymentFormData, extend_months: parseInt(e.target.value) || 0 })}
                        >
                          <option value={0}>No Validity Extension</option>
                          <option value={1}>+1 Month Extension</option>
                          <option value={3}>+3 Months Extension</option>
                          <option value={6}>+6 Months Extension</option>
                          <option value={12}>+1 Year Extension (+12 Mo)</option>
                          <option value={24}>+2 Years Extension (+24 Mo)</option>
                        </select>
                        <div className="extra-small text-muted mt-1">Automatically pushes expiry date</div>
                      </div>
                    </div>

                    {/* Row 4: Settlement Notes */}
                    <div className="mb-2">
                      <label className="form-label small fw-semibold text-dark mb-1">
                        Settlement Notes / Remarks
                      </label>
                      <textarea
                        className="form-control py-2"
                        rows="2"
                        style={{ fontSize: '0.875rem' }}
                        placeholder="e.g. Received via company current account UPI QR. Invoice cleared."
                        value={paymentFormData.notes}
                        onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                      ></textarea>
                    </div>
                  </div>

                  <div className="modal-footer border-top px-4 py-3 bg-light d-flex justify-content-between align-items-center">
                    <button
                      type="button"
                      className="btn btn-white border px-3.5 py-2 rounded-3 text-secondary fw-semibold shadow-2xs hover-bg-light"
                      style={{ fontSize: '0.875rem' }}
                      onClick={() => setShowRecordPaymentModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={recordingPayment}
                      className="btn fw-bold px-4 py-2 rounded-3 text-white shadow-sm d-flex align-items-center gap-2"
                      style={{
                        background: editingPaymentId ? 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                        border: 'none',
                        fontSize: '0.875rem'
                      }}
                    >
                      {recordingPayment ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          {editingPaymentId ? 'Updating Entry...' : 'Recording Settlement...'}
                        </>
                      ) : (
                        <>
                          {editingPaymentId ? <Save size={16} /> : <CheckCircle2 size={16} />}
                          {editingPaymentId ? 'Update Payment Entry' : 'Confirm & Record Payment'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Official A4 Printable SaaS Subscription Bill / Tax Invoice Modal */}
        <SaaSInvoicePrintModal
          show={showBillModal}
          onClose={() => {
            setShowBillModal(false);
            setSelectedBillForPrint(null);
            setSelectedBillHotel(null);
          }}
          billData={selectedBillForPrint}
          hotelData={selectedBillHotel}
        />

      </div>
    </DeveloperLayout>
  );
};

export default PlatformProperties;
