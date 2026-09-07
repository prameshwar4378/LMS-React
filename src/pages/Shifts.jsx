import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import {
  getCurrentShiftApi,
  getShiftsApi,
  getShiftSummaryStatsApi,
  reopenShiftApi,
  acceptShiftHandoverApi,
  rejectShiftHandoverApi
} from '../api/shiftApi';
import { getSettingsApi } from '../api/settingsApi';
import { formatCurrency } from '../utils/formatCurrency';
import { generateShiftThermalHtml, printThermalContent } from '../utils/thermalPrinter';
import PageLoader from '../components/PageLoader';
import OpenShiftModal from '../components/OpenShiftModal';
import CloseShiftModal from '../components/CloseShiftModal';
import ShiftExpenseModal from '../components/ShiftExpenseModal';
import ShiftAdjustmentModal from '../components/ShiftAdjustmentModal';
import ShiftHandoverModal from '../components/ShiftHandoverModal';
import ShiftApprovalModal from '../components/ShiftApprovalModal';
import AdminForceCloseModal from '../components/AdminForceCloseModal';
import {
  Clock,
  DollarSign,
  Lock,
  PlusCircle,
  ArrowLeftRight,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileText,
  Search,
  Calendar,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Receipt,
  Eye,
  RefreshCw,
  SlidersHorizontal,
  CreditCard,
  Building2,
  ArrowRight,
  RotateCcw,
  Activity,
  Printer,
  Sparkles,
  UserCheck
} from 'lucide-react';

const Shifts = () => {
  const { user, hasRole, hasPermission, isShiftWise, isSingleOwner } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const canRecordExpense = hasPermission('counter_till', 'can_record_expense');
  const canAdjustFloat = hasPermission('counter_till', 'can_adjust_float');
  const canCloseTill = hasPermission('counter_till', 'can_close_till');

  // Active Tab: 'my_shift' | 'active_shifts' | 'history' | 'approvals'
  const activeTab = searchParams.get('tab') || 'my_shift';

  // Filters for Shift History
  const [dateRange, setDateRange] = useState('7d'); // 'today' | '7d' | '30d' | 'all'
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [discrepancyOnly, setDiscrepancyOnly] = useState(false);

  // Settings Query
  const { data: settings = {} } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettingsApi,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !isSingleOwner,
  });

  // Current User Shift Query
  const {
    data: currentData = null,
    isLoading: currentLoading,
  } = useQuery({
    queryKey: ['shifts', 'current'],
    queryFn: getCurrentShiftApi,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !isSingleOwner,
  });

  // Summary Stats Query (Managers & Admins)
  const isManagerOrAdmin = hasRole(['SUPER_ADMIN', 'MANAGER']);
  const {
    data: summaryStats = null,
  } = useQuery({
    queryKey: ['shifts', 'summary-stats'],
    queryFn: getShiftSummaryStatsApi,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !isSingleOwner && Boolean(isManagerOrAdmin),
  });

  // Shift History List Query
  const {
    data: shiftsList = [],
    isLoading: loadingList,
    refetch: loadShiftsList,
  } = useQuery({
    queryKey: ['shifts', 'list', dateRange, statusFilter, discrepancyOnly, searchQuery],
    queryFn: async () => {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (discrepancyOnly) params.discrepancy_only = true;
      if (searchQuery) params.search = searchQuery;

      const now = new Date();
      if (dateRange === 'today') {
        params.start_date = now.toISOString().split('T')[0];
      } else if (dateRange === '7d') {
        const d = new Date(now);
        d.setDate(d.getDate() - 7);
        params.start_date = d.toISOString().split('T')[0];
      } else if (dateRange === '30d') {
        const d = new Date(now);
        d.setDate(d.getDate() - 30);
        params.start_date = d.toISOString().split('T')[0];
      }

      const res = await getShiftsApi(params);
      return Array.isArray(res) ? res : (res.results || []);
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !isSingleOwner,
  });

  const loading = currentLoading;

  const loadAllShiftData = () => {
    queryClient.invalidateQueries({ queryKey: ['shifts'] });
    queryClient.invalidateQueries({ queryKey: ['settings'] });
  };

  // Modal States
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedShiftForApproval, setSelectedShiftForApproval] = useState(null);
  const [showForceCloseModal, setShowForceCloseModal] = useState(false);
  const [selectedShiftForForceClose, setSelectedShiftForForceClose] = useState(null);
  const [selectedShiftForClose, setSelectedShiftForClose] = useState(null);

  // Success Notification banner
  const [toastMessage, setToastMessage] = useState(null);

  const handleTabChange = (tabName) => {
    setSearchParams({ tab: tabName });
  };

  const showSuccessToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleReopen = async (shiftId) => {
    const reason = window.prompt('Please provide a mandatory justification for reopening this closed shift:');
    if (!reason || !reason.trim()) return;

    try {
      await reopenShiftApi(shiftId, { reopen_reason: reason.trim() });
      showSuccessToast('Shift reopened successfully.');
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reopen shift.');
    }
  };

  const handleAcceptHandover = async (handoverId) => {
    try {
      const res = await acceptShiftHandoverApi(handoverId);
      showSuccessToast(res.message || 'Handover accepted successfully.');
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept handover.');
    }
  };

  const handleRejectHandover = async (handoverId) => {
    const reason = window.prompt('Please provide a mandatory reason for declining this cash handover:');
    if (!reason || !reason.trim()) return;

    try {
      await rejectShiftHandoverApi(handoverId, { reason: reason.trim() });
      showSuccessToast('Handover declined.');
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to decline handover.');
    }
  };

  const hasActiveShift = currentData?.has_active_shift;
  const currentShift = currentData?.shift;
  const currentFin = currentData?.financials || {};
  const isSingleOperator = currentData?.operation_mode === 'SINGLE_OPERATOR';

  const handlePrintCounterSlip = () => {
    if (!currentShift) return;
    const slipShift = {
      ...currentShift,
      financials: currentFin,
      user_name: user?.full_name || user?.username,
      cash_difference: 0,
      actual_cash: currentFin.expected_cash || 0
    };
    const html = generateShiftThermalHtml(slipShift, settings, '80mm');
    printThermalContent(html, `Counter_Slip_${currentShift.shift_number}`);
  };

  // Compute shift duration string
  const durationStr = useMemo(() => {
    if (!currentShift?.opened_at) return '';
    const start = new Date(currentShift.opened_at);
    const now = new Date();
    const diffMins = Math.floor((now - start) / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  }, [currentShift]);

  if (isSingleOwner) {
    return (
      <div className="container-fluid py-5 px-3 px-md-4">
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center mx-auto" style={{ maxWidth: '640px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <div className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '64px', height: '64px', backgroundColor: '#F0FDFA', color: '#0D9488' }}>
            <UserCheck size={32} />
          </div>
          <h4 className="fw-bold text-dark mb-2">Single Owner Mode Active</h4>
          <p className="text-secondary small mb-4">
            This hotel property is configured in <strong>Single Owner / Direct Mode</strong> by the platform administrator. Shift &amp; till handovers are disabled because the owner directly manages all front-desk, billing, and folio operations without shift boundaries.
          </p>
          <div className="d-flex justify-content-center gap-2">
            <Link to="/dashboard" className="btn btn-primary btn-sm fw-semibold rounded-3 px-4 py-2 text-white" style={{ background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)', border: 'none' }}>
              Return to Dashboard
            </Link>
            <Link to="/check-in" className="btn btn-outline-secondary btn-sm fw-semibold rounded-3 px-4 py-2">
              Front Desk Check-In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !currentData) {
    return <PageLoader fullScreen={false} message="Loading Shift &amp; Till Management..." />;
  }

  return (
    <div className="pb-5 px-1" style={{ backgroundColor: '#F8FAFC' }}>
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="alert alert-success border-success d-flex align-items-center justify-content-between rounded-3 p-3 mb-4 shadow-sm">
          <div className="d-flex align-items-center gap-2">
            <CheckCircle2 size={18} className="text-success" />
            <span className="fw-bold text-dark small">{toastMessage}</span>
          </div>
          <button type="button" className="btn-close" onClick={() => setToastMessage(null)}></button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. TOP HEADER & QUICK ACTION BAR                         */}
      {/* ========================================================= */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pt-1">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h3 className="fw-bold text-dark m-0" style={{ letterSpacing: '-0.025em', fontSize: '1.45rem' }}>
              {isSingleOperator ? 'Daily Cash Register & Till Center' : 'Reception Shift & Till Management'}
            </h3>
                  {isSingleOperator ? (
                    <span className="badge bg-success-subtle text-success border border-success-subtle fw-bold rounded-pill px-2.5 py-1 extra-small d-inline-flex align-items-center gap-1">
                      <span className="rounded-circle" style={{ width: '7px', height: '7px', backgroundColor: '#16A34A' }}></span>
                      OWNER MODE: DAILY TILL ACTIVE
                    </span>
                  ) : hasActiveShift ? (
                    <span className="badge bg-success-subtle text-success border border-success-subtle fw-bold rounded-pill px-2.5 py-1 extra-small d-inline-flex align-items-center gap-1">
                      <span className="rounded-circle" style={{ width: '7px', height: '7px', backgroundColor: '#16A34A' }}></span>
                      ON DUTY: SHIFT #{currentShift?.shift_number}
                    </span>
                  ) : (
                    <span className="badge bg-secondary-subtle text-secondary border rounded-pill px-2.5 py-1 extra-small">
                      NO ACTIVE SHIFT
                    </span>
                  )}
                </div>
                <p className="text-secondary small m-0 mt-1" style={{ fontSize: '0.85rem' }}>
                  {isSingleOperator
                    ? 'Continuous rolling physical cash drawer & daily revenue accounting for owner-managed lodge.'
                    : 'Cash drawer accountability, financial handovers & live till reconciliation.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="d-flex flex-wrap align-items-center gap-2">
                {isSingleOperator ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-outline-danger bg-white fw-semibold px-3 py-2 rounded-3 shadow-xs d-flex align-items-center gap-1.5"
                      style={{ fontSize: '0.85rem' }}
                      onClick={() => setShowExpenseModal(true)}
                    >
                      <Receipt size={15} /> + Record Cash Expense
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-secondary bg-white fw-semibold px-3 py-2 rounded-3 shadow-xs d-flex align-items-center gap-1.5"
                      style={{ fontSize: '0.85rem' }}
                      onClick={() => setShowAdjustmentModal(true)}
                    >
                      <ArrowLeftRight size={15} /> Float / Drop
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-primary bg-white fw-semibold px-3 py-2 rounded-3 shadow-xs d-flex align-items-center gap-1.5"
                      style={{ fontSize: '0.85rem' }}
                      onClick={handlePrintCounterSlip}
                      title="Print 80mm POS Thermal Slip of Today's Counter Activity"
                    >
                      <Printer size={15} /> Print Slip
                    </button>

                    <button
                      type="button"
                      className="btn btn-primary fw-bold px-3.5 py-2 rounded-3 shadow-xs d-flex align-items-center gap-2 text-white"
                      style={{ fontSize: '0.85rem' }}
                      onClick={() => navigate('/reports')}
                    >
                      <FileText size={15} /> Night Audit &amp; Reports
                    </button>

                    <button
                      type="button"
                      className="btn btn-danger fw-bold px-3.5 py-2 rounded-3 shadow-xs d-flex align-items-center gap-2 text-white"
                      style={{ fontSize: '0.85rem' }}
                      onClick={() => setShowCloseModal(true)}
                    >
                      <Lock size={15} /> Close Daily Till &amp; Reconcile
                    </button>
                  </>
                ) : !hasActiveShift ? (
                  <button
                    type="button"
                    className="btn btn-primary fw-semibold px-3.5 py-2 rounded-3 shadow-xs d-flex align-items-center gap-2 text-white"
                    style={{ backgroundColor: '#2563EB', borderColor: '#2563EB', fontSize: '0.85rem' }}
                    onClick={() => setShowOpenModal(true)}
                  >
                    <Clock size={16} /> Open Shift Till
                  </button>
                ) : (
                  <>
                    {canRecordExpense && (
                      <button
                        type="button"
                        className="btn btn-outline-danger bg-white fw-semibold px-3 py-2 rounded-3 shadow-xs d-flex align-items-center gap-1.5"
                        style={{ fontSize: '0.85rem' }}
                        onClick={() => setShowExpenseModal(true)}
                      >
                        <Receipt size={15} /> + Cash Expense
                      </button>
                    )}

                    {canAdjustFloat && (
                      <button
                        type="button"
                        className="btn btn-outline-secondary bg-white fw-semibold px-3 py-2 rounded-3 shadow-xs d-flex align-items-center gap-1.5"
                        style={{ fontSize: '0.85rem' }}
                        onClick={() => setShowAdjustmentModal(true)}
                      >
                        <ArrowLeftRight size={15} /> Cash Adjustment
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn btn-outline-primary bg-white fw-semibold px-3 py-2 rounded-3 shadow-xs d-flex align-items-center gap-1.5"
                      style={{ fontSize: '0.85rem' }}
                      onClick={handlePrintCounterSlip}
                      title="Print 80mm POS Thermal Slip of Current Till"
                    >
                      <Printer size={15} /> Print Slip
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-primary bg-white fw-semibold px-3 py-2 rounded-3 shadow-xs d-flex align-items-center gap-1.5"
                      style={{ fontSize: '0.85rem' }}
                      onClick={() => setShowHandoverModal(true)}
                    >
                      <Users size={15} /> Handover
                    </button>

                    {canCloseTill && (
                      <button
                        type="button"
                        className="btn btn-danger fw-bold px-3.5 py-2 rounded-3 shadow-xs d-flex align-items-center gap-2 text-white"
                        style={{ fontSize: '0.85rem' }}
                        onClick={() => setShowCloseModal(true)}
                      >
                        <Lock size={15} /> Close Shift &amp; Till
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* 2. TAB NAVIGATION SWITCHER */}
            <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-4">
              <ul className="nav nav-pills gap-1">
                <li className="nav-item">
                  <button
                    className={`nav-link px-3.5 py-2 rounded-3 fw-bold small ${activeTab === 'my_shift' ? 'active shadow-xs' : 'text-secondary bg-transparent'}`}
                    style={{ backgroundColor: activeTab === 'my_shift' ? '#1E3A8A' : 'transparent', color: activeTab === 'my_shift' ? '#FFF' : '#64748B' }}
                    onClick={() => handleTabChange('my_shift')}
                  >
                    <Clock size={15} className="me-1.5 d-inline" /> {isSingleOperator ? "Today's Drawer Till" : 'My Current Shift'}
                  </button>
                </li>
                {hasRole(['SUPER_ADMIN', 'MANAGER']) && (
                  <li className="nav-item">
                    <button
                      className={`nav-link px-3.5 py-2 rounded-3 fw-bold small ${activeTab === 'active_shifts' ? 'active shadow-xs' : 'text-secondary bg-transparent'}`}
                      style={{ backgroundColor: activeTab === 'active_shifts' ? '#1E3A8A' : 'transparent', color: activeTab === 'active_shifts' ? '#FFF' : '#64748B' }}
                      onClick={() => handleTabChange('active_shifts')}
                    >
                      <Building2 size={15} className="me-1.5 d-inline" /> {isSingleOperator ? 'POS Stations' : 'Active Staff Tills'}
                      {summaryStats?.active_shifts_count > 0 && !isSingleOperator && (
                        <span className="badge bg-success text-white ms-2 rounded-pill extra-small">
                          {summaryStats.active_shifts_count}
                        </span>
                      )}
                    </button>
                  </li>
                )}
                <li className="nav-item">
                  <button
                    className={`nav-link px-3.5 py-2 rounded-3 fw-bold small ${activeTab === 'history' ? 'active shadow-xs' : 'text-secondary bg-transparent'}`}
                    style={{ backgroundColor: activeTab === 'history' ? '#1E3A8A' : 'transparent', color: activeTab === 'history' ? '#FFF' : '#64748B' }}
                    onClick={() => handleTabChange('history')}
                  >
                    <FileText size={15} className="me-1.5 d-inline" /> {isSingleOperator ? 'Daily Till Ledger' : 'Shift History & Reconciliation'}
                  </button>
                </li>
                {hasRole(['SUPER_ADMIN', 'MANAGER']) && (!isSingleOperator || summaryStats?.pending_approvals_count > 0) && (
                  <li className="nav-item">
                    <button
                      className={`nav-link px-3.5 py-2 rounded-3 fw-bold small ${activeTab === 'approvals' ? 'active shadow-xs' : 'text-secondary bg-transparent'}`}
                      style={{ backgroundColor: activeTab === 'approvals' ? '#1E3A8A' : 'transparent', color: activeTab === 'approvals' ? '#FFF' : '#64748B' }}
                      onClick={() => handleTabChange('approvals')}
                    >
                      <ShieldCheck size={15} className="me-1.5 d-inline" /> Manager Approvals
                      {summaryStats?.pending_approvals_count > 0 && (
                        <span className="badge bg-danger text-white ms-2 rounded-pill extra-small">
                          {summaryStats.pending_approvals_count}
                        </span>
                      )}
                    </button>
                  </li>
                )}
              </ul>

              <button
                type="button"
                className="btn btn-sm btn-light border text-secondary rounded-3 d-flex align-items-center gap-1"
                onClick={loadAllShiftData}
                title="Refresh Shift Data"
              >
                <RefreshCw size={13} /> Refresh
              </button>
            </div>

      {/* ========================================================= */}
      {/* TAB 1: MY CURRENT SHIFT                                   */}
      {/* ========================================================= */}
      {activeTab === 'my_shift' && (
        <div>
          {/* Pending Incoming Handovers Alert Card */}
          {currentData?.pending_handovers && currentData.pending_handovers.length > 0 && (
            <div className="mb-4">
              {currentData.pending_handovers.map((h) => (
                <div
                  key={h.id}
                  className="card border-0 shadow-sm rounded-4 mb-3 overflow-hidden"
                  style={{
                    border: '1.5px solid #F59E0B',
                    background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)'
                  }}
                >
                  <div className="p-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                    <div className="d-flex align-items-start gap-3">
                      <div
                        className="p-3 bg-warning text-white rounded-circle shadow-xs flex-shrink-0 d-flex align-items-center justify-content-center"
                        style={{ width: '48px', height: '48px' }}
                      >
                        <Users size={24} />
                      </div>
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span className="badge bg-warning text-dark fw-bold rounded-pill px-2.5 py-0.5 extra-small">
                            INCOMING SHIFT HANDOVER PENDING
                          </span>
                          <span className="text-secondary extra-small">
                            {new Date(h.handed_over_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <h5 className="fw-bold text-dark mb-1">
                          Drawer Cash Handover from <strong>{h.from_user_name}</strong>
                        </h5>
                        <p className="text-secondary small m-0 mb-1">
                          Till Cash: <strong className="text-success font-monospace fs-6">{formatCurrency(h.amount)}</strong>
                          {h.notes && <span className="ms-2 fst-italic">"{h.notes}"</span>}
                        </p>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm px-3 py-2 rounded-3 fw-bold shadow-xs bg-white"
                        onClick={() => handleRejectHandover(h.id)}
                      >
                        Decline / Discrepancy
                      </button>
                      <button
                        type="button"
                        className="btn btn-success btn-sm px-4 py-2 rounded-3 fw-bold shadow-xs text-white d-flex align-items-center gap-1.5"
                        style={{ backgroundColor: '#16A34A', borderColor: '#16A34A' }}
                        onClick={() => handleAcceptHandover(h.id)}
                      >
                        <CheckCircle2 size={16} /> Accept Handover &amp; {hasActiveShift ? 'Receive Cash' : 'Open My Shift'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!hasActiveShift ? (
            <div className="card border-0 bg-white shadow-xs p-5 rounded-4 text-center my-3" style={{ border: '1px solid #E2E8F0' }}>
              <div className="p-3 bg-primary-subtle text-primary rounded-circle d-inline-flex mb-3 mx-auto" style={{ width: '60px', height: '60px', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={28} />
              </div>
              <h4 className="fw-bold text-dark mb-1">No Shift Currently Active</h4>
              <p className="text-secondary small mb-4" style={{ maxWidth: '440px', margin: '0 auto' }}>
                You do not have an active reception shift running. Please initialize your drawer till cash to begin recording check-ins, advance collections and payments.
              </p>
              <div>
                <button
                  type="button"
                  className="btn btn-primary fw-bold px-4 py-2.5 rounded-3 shadow-xs d-inline-flex align-items-center gap-2"
                  style={{ backgroundColor: '#2563EB', borderColor: '#2563EB' }}
                  onClick={() => setShowOpenModal(true)}
                >
                  <Clock size={18} /> Open Reception Shift Now
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Hero Operational Strip */}
              <div
                className="card border-0 shadow-xs text-white rounded-4 p-4 mb-4 position-relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #09204c 0%, #1E3A8A 100%)', minHeight: '130px' }}
              >
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1.5">
                      <span className="badge bg-white bg-opacity-20 text-white rounded-pill px-2.5 py-1 extra-small fw-bold">
                        SHIFT #{currentShift.shift_number}
                      </span>
                      <span className="badge bg-success text-white rounded-pill px-2.5 py-1 extra-small fw-bold d-inline-flex align-items-center gap-1">
                        <span className="rounded-circle" style={{ width: '6px', height: '6px', backgroundColor: '#FFF' }}></span> ACTIVE
                      </span>
                    </div>
                    <h4 className="fw-bold text-white mb-1" style={{ letterSpacing: '-0.02em' }}>
                      {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username} (Cashier Till)
                    </h4>
                    <div className="text-white-50 small d-flex flex-wrap align-items-center gap-3" style={{ fontSize: '0.8rem' }}>
                      <span>Started: <strong>{new Date(currentShift.opened_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</strong></span>
                      <span>&bull;</span>
                      <span>Duration: <strong>{durationStr}</strong></span>
                      {currentShift.opening_notes && (
                        <>
                          <span>&bull;</span>
                          <span className="text-truncate" style={{ maxWidth: '300px' }}>Notes: {currentShift.opening_notes}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-md-end bg-white bg-opacity-10 p-3 rounded-3 border border-white border-opacity-15 d-flex flex-column align-items-md-end justify-content-center">
                    <div className="text-white-50 extra-small fw-bold text-uppercase">EXPECTED PHYSICAL CASH IN DRAWER</div>
                    <div className="fs-3 fw-bolder text-white lh-1 mt-1 font-monospace">
                      {formatCurrency(currentFin.expected_cash || 0)}
                    </div>
                    <button
                      type="button"
                      onClick={handlePrintCounterSlip}
                      className="btn btn-sm btn-light mt-2.5 py-1 px-2.5 rounded-2 d-inline-flex align-items-center gap-1.5 fw-semibold shadow-xs"
                      style={{ fontSize: '0.75rem' }}
                    >
                      <Printer size={13} className="text-primary" /> Print Till Slip
                    </button>
                  </div>
                </div>
              </div>

              {/* 4 Core Financial KPI Cards */}
              <div className="row g-3 mb-4">
                {/* 1. Opening Float */}
                <div className="col-12 col-sm-6 col-xl-3">
                  <div className="card border-0 shadow-xs bg-white p-3.5 rounded-4 h-100" style={{ border: '1px solid #E2E8F0' }}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-secondary extra-small fw-bold text-uppercase">OPENING FLOAT</span>
                      <span className="p-2 rounded-2 bg-light text-secondary"><DollarSign size={16} /></span>
                    </div>
                    <div className="fs-4 fw-bold text-dark font-monospace">{formatCurrency(currentFin.opening_cash || 0)}</div>
                    <div className="extra-small text-muted mt-1">Starting drawer cash</div>
                  </div>
                </div>

                {/* 2. Cash Collected */}
                <div className="col-12 col-sm-6 col-xl-3">
                  <div className="card border-0 shadow-xs bg-white p-3.5 rounded-4 h-100" style={{ border: '1px solid #E2E8F0' }}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-secondary extra-small fw-bold text-uppercase">CASH COLLECTED</span>
                      <span className="p-2 rounded-2 bg-success-subtle text-success"><TrendingUp size={16} /></span>
                    </div>
                    <div className="fs-4 fw-bold text-success font-monospace">+{formatCurrency(currentFin.cash_collections || 0)}</div>
                    <div className="extra-small text-muted mt-1">Room stays, bookings, services</div>
                  </div>
                </div>

                {/* 3. Expenses & Adjustments */}
                <div className="col-12 col-sm-6 col-xl-3">
                  <div className="card border-0 shadow-xs bg-white p-3.5 rounded-4 h-100" style={{ border: '1px solid #E2E8F0' }}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-secondary extra-small fw-bold text-uppercase">EXPENSES &amp; ADJUSTMENTS</span>
                      <span className="p-2 rounded-2 bg-danger-subtle text-danger"><Receipt size={16} /></span>
                    </div>
                    <div className="fs-4 fw-bold text-danger font-monospace">
                      -{formatCurrency((parseFloat(currentFin.cash_expenses || 0)) + (parseFloat(currentFin.cash_removed || 0)) + (parseFloat(currentFin.cash_handed_over || 0)))}
                    </div>
                    <div className="extra-small text-muted mt-1">
                      {formatCurrency(currentFin.cash_expenses || 0)} exp &bull; {formatCurrency(currentFin.cash_removed || 0)} removed
                      {parseFloat(currentFin.cash_handed_over || 0) > 0 && ` \u2022 ${formatCurrency(currentFin.cash_handed_over)} handed`}
                    </div>
                  </div>
                </div>

                {/* 4. Total Collections (Physical + Digital) */}
                <div className="col-12 col-sm-6 col-xl-3">
                  <div className="card border-0 shadow-xs bg-white p-3.5 rounded-4 h-100" style={{ border: '1px solid #E2E8F0' }}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-secondary extra-small fw-bold text-uppercase">TOTAL REVENUE RECORDED</span>
                      <span className="p-2 rounded-2 bg-primary-subtle text-primary"><CreditCard size={16} /></span>
                    </div>
                    <div className="fs-4 fw-bold text-primary font-monospace">{formatCurrency(currentFin.total_collections || 0)}</div>
                    <div className="extra-small text-muted mt-1">All payment channels combined</div>
                  </div>
                </div>
              </div>

              {/* Digital Payment Breakdown Grid & Channel Bar */}
              <div className="card border-0 shadow-xs bg-white p-3.5 rounded-4 mb-4" style={{ border: '1px solid #E2E8F0' }}>
                <div className="d-flex justify-content-between align-items-center mb-2.5 pb-2 border-bottom">
                  <span className="text-secondary extra-small fw-bold text-uppercase tracking-wider">
                    PAYMENT CHANNEL REVENUE BREAKDOWN
                  </span>
                  <span className="text-muted extra-small fst-italic">
                    Digital channels do not increase physical drawer cash
                  </span>
                </div>

                {/* Visual Channel Share Progress Bar */}
                {(() => {
                  const total = parseFloat(currentFin.total_collections || 0);
                  const cashPct = total > 0 ? (parseFloat(currentFin.cash_collections || 0) / total) * 100 : 0;
                  const upiPct = total > 0 ? (parseFloat(currentFin.upi_collections || 0) / total) * 100 : 0;
                  const cardPct = total > 0 ? (parseFloat(currentFin.card_collections || 0) / total) * 100 : 0;
                  const bankPct = total > 0 ? ((parseFloat(currentFin.bank_collections || 0) + parseFloat(currentFin.other_collections || 0)) / total) * 100 : 0;

                  return (
                    <div className="progress mb-3" style={{ height: '8px', borderRadius: '4px', backgroundColor: '#F1F5F9' }}>
                      <div className="progress-bar bg-success" style={{ width: `${cashPct}%` }} title={`Cash: ${cashPct.toFixed(1)}%`}></div>
                      <div className="progress-bar bg-primary" style={{ width: `${upiPct}%` }} title={`UPI: ${upiPct.toFixed(1)}%`}></div>
                      <div className="progress-bar" style={{ width: `${cardPct}%`, backgroundColor: '#6366F1' }} title={`Card: ${cardPct.toFixed(1)}%`}></div>
                      <div className="progress-bar bg-dark" style={{ width: `${bankPct}%` }} title={`Bank: ${bankPct.toFixed(1)}%`}></div>
                    </div>
                  );
                })()}

                <div className="row g-2 text-center" style={{ fontSize: '0.85rem' }}>
                  <div className="col-6 col-md-3 border-end">
                    <div className="text-secondary extra-small d-flex align-items-center justify-content-center gap-1">
                      <span className="rounded-circle" style={{ width: '6px', height: '6px', backgroundColor: '#16A34A' }}></span>
                      Cash In Hand
                    </div>
                    <div className="fw-bold text-success mt-0.5 font-monospace">{formatCurrency(currentFin.cash_collections || 0)}</div>
                  </div>
                  <div className="col-6 col-md-3 border-end">
                    <div className="text-secondary extra-small d-flex align-items-center justify-content-center gap-1">
                      <span className="rounded-circle" style={{ width: '6px', height: '6px', backgroundColor: '#2563EB' }}></span>
                      UPI / QR
                    </div>
                    <div className="fw-bold text-primary mt-0.5 font-monospace">{formatCurrency(currentFin.upi_collections || 0)}</div>
                  </div>
                  <div className="col-6 col-md-3 border-end">
                    <div className="text-secondary extra-small d-flex align-items-center justify-content-center gap-1">
                      <span className="rounded-circle" style={{ width: '6px', height: '6px', backgroundColor: '#6366F1' }}></span>
                      Card
                    </div>
                    <div className="fw-bold text-indigo mt-0.5 font-monospace" style={{ color: '#6366F1' }}>{formatCurrency(currentFin.card_collections || 0)}</div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="text-secondary extra-small d-flex align-items-center justify-content-center gap-1">
                      <span className="rounded-circle" style={{ width: '6px', height: '6px', backgroundColor: '#0F172A' }}></span>
                      Bank Transfer / Other
                    </div>
                    <div className="fw-bold text-dark mt-0.5 font-monospace">{formatCurrency((currentFin.bank_collections || 0) + (currentFin.other_collections || 0))}</div>
                  </div>
                </div>
              </div>

              {/* Operational Productivity & Front-Desk Counters */}
              {currentShift.operational_metrics && (
                <div className="card border-0 shadow-xs bg-white p-3.5 rounded-4 mb-4" style={{ border: '1px solid #E2E8F0' }}>
                  <div className="d-flex justify-content-between align-items-center mb-2.5 pb-2 border-bottom">
                    <div className="d-flex align-items-center gap-2">
                      <div className="p-1 rounded-2 bg-primary text-white">
                        <Activity size={14} />
                      </div>
                      <span className="text-secondary extra-small fw-bold text-uppercase tracking-wider">
                        FRONT-DESK ROOM OPERATIONAL ACTIVITY
                      </span>
                    </div>
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill extra-small px-2 py-0.5">
                      Live Shift Workload
                    </span>
                  </div>

                  <div className="row g-2 text-center" style={{ fontSize: '0.85rem' }}>
                    <div className="col-6 col-md-3 border-end">
                      <div className="text-secondary extra-small">Check-ins Processed</div>
                      <div className="fw-bold text-success fs-5 mt-0.5 font-monospace">{currentShift.operational_metrics.total_checkins}</div>
                      <span className="extra-small text-muted" style={{ fontSize: '0.72rem' }}>Arrivals recorded</span>
                    </div>
                    <div className="col-6 col-md-3 border-end">
                      <div className="text-secondary extra-small">Check-outs Cleared</div>
                      <div className="fw-bold text-danger fs-5 mt-0.5 font-monospace">{currentShift.operational_metrics.total_checkouts}</div>
                      <span className="extra-small text-muted" style={{ fontSize: '0.72rem' }}>Turnovers triggered</span>
                    </div>
                    <div className="col-6 col-md-3 border-end">
                      <div className="text-secondary extra-small">New Bookings</div>
                      <div className="fw-bold text-primary fs-5 mt-0.5 font-monospace">{currentShift.operational_metrics.total_bookings}</div>
                      <span className="extra-small text-muted" style={{ fontSize: '0.72rem' }}>Reservations logged</span>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="text-secondary extra-small">Shift ADR</div>
                      <div className="fw-bold text-dark fs-5 mt-0.5 font-monospace">{formatCurrency(currentShift.operational_metrics.adr || 0)}</div>
                      <span className="extra-small text-muted" style={{ fontSize: '0.72rem' }}>Average rate / room</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Transactions Stream During Shift */}
              <div className="card border-0 shadow-xs bg-white rounded-4 overflow-hidden" style={{ border: '1px solid #E2E8F0' }}>
                <div className="p-3.5 border-bottom d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="fw-bold text-dark m-0" style={{ fontSize: '0.95rem' }}>
                      Shift Payment &amp; Till Activity
                    </h6>
                    <span className="text-secondary extra-small">
                      {currentShift.payments?.length || 0} financial receipts linked to this shift session
                    </span>
                  </div>
                  <Link to={`/shifts/${currentShift.id}`} className="btn btn-sm btn-outline-primary rounded-3 extra-small fw-semibold d-flex align-items-center gap-1">
                    Full Audit Breakdown <ChevronRight size={12} />
                  </Link>
                </div>

                {(!currentShift.payments || currentShift.payments.length === 0) ? (
                  <div className="p-4 text-center text-secondary small">
                    No transactions recorded in this shift yet. Create check-ins, advance deposits, or bills to see them here.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.825rem' }}>
                      <thead className="table-light text-secondary extra-small">
                        <tr>
                          <th className="ps-3 py-2.5">Receipt #</th>
                          <th className="py-2.5">Time</th>
                          <th className="py-2.5">Guest / Customer</th>
                          <th className="py-2.5">Method</th>
                          <th className="py-2.5">Reference</th>
                          <th className="text-end pe-3 py-2.5">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentShift.payments.map((p) => (
                          <tr key={p.id}>
                            <td className="ps-3 fw-bold text-dark font-monospace">{p.payment_number}</td>
                            <td className="text-secondary">{p.payment_date ? new Date(p.payment_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                            <td className="fw-semibold text-dark">{p.customer_name || 'Walk-In / Guest'}</td>
                            <td>
                              <span className={`badge px-2 py-0.5 rounded-pill extra-small fw-semibold ${
                                p.payment_method === 'CASH' ? 'bg-success-subtle text-success border border-success-subtle' :
                                p.payment_method === 'UPI' ? 'bg-primary-subtle text-primary border border-primary-subtle' :
                                'bg-light text-secondary border'
                              }`}>
                                {p.payment_method}
                              </span>
                            </td>
                            <td className="text-secondary extra-small text-truncate" style={{ maxWidth: '160px' }}>
                              {p.transaction_reference || p.notes || '—'}
                            </td>
                            <td className="text-end pe-3 font-monospace fw-bold text-dark">
                              {formatCurrency(p.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: ACTIVE RECEPTION SHIFTS (MANAGER MONITOR)          */}
      {/* ========================================================= */}
      {activeTab === 'active_shifts' && (
        <div>

          {(!summaryStats?.active_shifts || summaryStats.active_shifts.length === 0) ? (
            <div className="card border-0 bg-white shadow-xs p-5 rounded-4 text-center my-3">
              <Clock size={36} className="text-secondary mx-auto mb-2 opacity-50" />
              <h5 className="fw-bold text-dark mb-1">No Active Staff Tills</h5>
              <p className="text-secondary small m-0">All reception shifts are currently closed and balanced.</p>
            </div>
          ) : (
            <div className="row g-3">
              {summaryStats.active_shifts.map((st) => (
                <div key={st.id} className="col-12 col-md-6 col-xl-4">
                  <div className="card border-0 shadow-xs bg-white rounded-4 p-4 h-100" style={{ border: '1px solid #E2E8F0' }}>
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <div className="d-flex align-items-center gap-1.5 mb-1">
                          {st.is_stale ? (
                            <span className="badge bg-danger text-white rounded-pill extra-small fw-bold px-2 py-0.5">
                              ⚠️ STALE ({Math.floor(st.duration_minutes / 60)}h)
                            </span>
                          ) : st.is_long_running ? (
                            <span className="badge bg-warning text-dark rounded-pill extra-small fw-bold px-2 py-0.5">
                              ⚠️ OVERDUE ({Math.floor(st.duration_minutes / 60)}h)
                            </span>
                          ) : (
                            <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill extra-small fw-bold px-2 py-0.5">
                              ACTIVE TILL
                            </span>
                          )}
                        </div>
                        <h5 className="fw-bold text-dark mt-0.5 mb-0">{st.user_name}</h5>
                        <span className="text-secondary extra-small font-monospace">Shift #{st.shift_number}</span>
                        {st.cash_drawer_name && (
                          <div className="mt-1 extra-small text-primary fw-semibold d-flex align-items-center gap-1">
                            <Building2 size={12} /> {st.cash_drawer_name} ({st.cash_drawer_code})
                          </div>
                        )}
                      </div>
                      <span className="p-2 rounded-2 bg-light text-primary"><Clock size={18} /></span>
                    </div>

                    <div className="p-3 bg-light rounded-3 mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="text-secondary extra-small">Opened:</span>
                        <span className="fw-semibold text-dark extra-small">
                          {new Date(st.opened_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="text-secondary extra-small">Duration:</span>
                        <span className={`fw-semibold extra-small ${st.is_stale ? 'text-danger fw-bold' : 'text-dark'}`}>
                          {Math.floor(st.duration_minutes / 60)}h {st.duration_minutes % 60}m
                        </span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-secondary extra-small">Opening Float:</span>
                        <span className="fw-bold text-dark font-monospace extra-small">{formatCurrency(st.opening_balance)}</span>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                      <div>
                        <div className="extra-small text-secondary fw-bold">EXPECTED CASH</div>
                        <div className="fs-5 fw-bold text-primary font-monospace">{formatCurrency(st.financials?.expected_cash ?? st.expected_cash)}</div>
                      </div>
                      <div className="d-flex align-items-center gap-1.5">
                        {hasRole(['SUPER_ADMIN', 'MANAGER']) && (
                          <>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger rounded-3 extra-small fw-semibold"
                              onClick={() => {
                                setSelectedShiftForClose(st);
                                setShowCloseModal(true);
                              }}
                              title="Reconcile & Close Staff Till"
                            >
                              <Lock size={12} className="me-1" /> Close Till
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger rounded-3 extra-small fw-semibold"
                              onClick={() => {
                                setSelectedShiftForForceClose(st);
                                setShowForceCloseModal(true);
                              }}
                              title="Admin Emergency Force Close Shift"
                            >
                              Force Close
                            </button>
                          </>
                        )}
                        <Link to={`/shifts/${st.id}`} className="btn btn-sm btn-outline-primary rounded-3 extra-small fw-semibold">
                          View Till <ArrowRight size={12} className="ms-1" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: SHIFT HISTORY & RECONCILIATION AUDIT LEDGER        */}
      {/* ========================================================= */}
      {activeTab === 'history' && (
        <div>
          {/* Filter Bar */}
          <div className="card border-0 shadow-xs bg-white p-3 rounded-4 mb-3" style={{ border: '1px solid #E2E8F0' }}>
            <div className="row g-2 align-items-center">
              {/* Date Presets */}
              <div className="col-12 col-md-3">
                <div className="btn-group btn-group-sm w-100 rounded-3 p-0.5 bg-light border">
                  <button
                    type="button"
                    className={`btn btn-xs fw-semibold ${dateRange === 'today' ? 'btn-white text-dark shadow-xs bg-white' : 'btn-light text-secondary'}`}
                    onClick={() => setDateRange('today')}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    className={`btn btn-xs fw-semibold ${dateRange === '7d' ? 'btn-white text-dark shadow-xs bg-white' : 'btn-light text-secondary'}`}
                    onClick={() => setDateRange('7d')}
                  >
                    7 Days
                  </button>
                  <button
                    type="button"
                    className={`btn btn-xs fw-semibold ${dateRange === '30d' ? 'btn-white text-dark shadow-xs bg-white' : 'btn-light text-secondary'}`}
                    onClick={() => setDateRange('30d')}
                  >
                    30 Days
                  </button>
                  <button
                    type="button"
                    className={`btn btn-xs fw-semibold ${dateRange === 'all' ? 'btn-white text-dark shadow-xs bg-white' : 'btn-light text-secondary'}`}
                    onClick={() => setDateRange('all')}
                  >
                    All
                  </button>
                </div>
              </div>

              {/* Status Filter */}
              <div className="col-6 col-md-3">
                <select
                  className="form-select form-select-sm rounded-3"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Shift Statuses</option>
                  <option value="OPEN">Open / Active</option>
                  <option value="PENDING_APPROVAL">Pending Manager Approval</option>
                  <option value="CLOSED">Closed &amp; Balanced</option>
                </select>
              </div>

              {/* Search Bar */}
              <div className="col-6 col-md-4">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-light border-end-0 text-secondary"><Search size={14} /></span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Search shift #, staff name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadShiftsList()}
                  />
                </div>
              </div>

              {/* Discrepancy Toggle */}
              <div className="col-12 col-md-2">
                <div className="form-check form-switch extra-small fw-semibold m-0">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="discrepancyToggle"
                    checked={discrepancyOnly}
                    onChange={(e) => setDiscrepancyOnly(e.target.checked)}
                  />
                  <label className="form-check-label text-danger" htmlFor="discrepancyToggle">
                    Differences Only
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="card border-0 shadow-xs bg-white rounded-4 overflow-hidden" style={{ border: '1px solid #E2E8F0' }}>
            {loadingList ? (
              <div className="p-5 text-center text-secondary small">
                <span className="spinner-border spinner-border-sm me-2"></span> Loading shift audit ledger...
              </div>
            ) : shiftsList.length === 0 ? (
              <div className="p-5 text-center text-secondary small">
                No shift history matching your filters.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.825rem' }}>
                  <thead className="table-light text-secondary extra-small">
                    <tr>
                      <th className="ps-3 py-2.5">Shift #</th>
                      <th className="py-2.5">Receptionist</th>
                      <th className="py-2.5">Opened</th>
                      <th className="py-2.5">Closed</th>
                      <th className="text-end py-2.5">Opening (₹)</th>
                      <th className="text-end py-2.5">Expected (₹)</th>
                      <th className="text-end py-2.5">Actual (₹)</th>
                      <th className="text-center py-2.5">Difference</th>
                      <th className="py-2.5">Status</th>
                      <th className="text-end pe-3 py-2.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shiftsList.map((s) => {
                      const diff = s.cash_difference || 0;
                      const isShort = diff < -0.01;
                      const isOver = diff > 0.01;
                      const isExact = s.actual_cash !== null && !isShort && !isOver;

                      return (
                        <tr key={s.id}>
                          <td className="ps-3 fw-bold text-dark font-monospace">
                            <Link to={`/shifts/${s.id}`} className="text-decoration-none text-primary hover-underline">
                              {s.shift_number}
                            </Link>
                          </td>
                          <td className="fw-semibold text-dark">{s.user_name}</td>
                          <td className="text-secondary extra-small">
                            {new Date(s.opened_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="text-secondary extra-small">
                            {s.closed_at ? new Date(s.closed_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                          <td className="text-end font-monospace">{formatCurrency(s.opening_balance)}</td>
                          <td className="text-end font-monospace fw-bold text-dark">{formatCurrency(s.financials?.expected_cash ?? s.expected_cash)}</td>
                          <td className="text-end font-monospace">{s.actual_cash !== null ? formatCurrency(s.actual_cash) : '—'}</td>
                          <td className="text-center">
                            {s.actual_cash === null ? (
                              <span className="text-muted extra-small fst-italic">Active</span>
                            ) : isExact ? (
                              <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill extra-small px-2 py-0.5">
                                Reconciled ₹0
                              </span>
                            ) : isShort ? (
                              <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill extra-small px-2 py-0.5 fw-bold">
                                {formatCurrency(diff)} Short
                              </span>
                            ) : (
                              <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill extra-small px-2 py-0.5 fw-bold">
                                +{formatCurrency(diff)} Excess
                              </span>
                            )}
                          </td>
                          <td>
                            <span className={`badge px-2.5 py-1 rounded-pill extra-small fw-semibold ${
                              s.status === 'CLOSED' ? 'bg-success text-white' :
                              s.status === 'FORCED_CLOSED' ? 'bg-dark text-white' :
                              s.status === 'PENDING_APPROVAL' ? 'bg-danger text-white' :
                              s.status === 'PENDING_REVIEW' ? 'bg-warning text-dark' :
                              'bg-primary text-white'
                            }`}>
                              {s.status_display}
                            </span>
                          </td>
                          <td className="text-end pe-3">
                            <div className="d-flex align-items-center justify-content-end gap-1.5">
                              <Link
                                to={`/shifts/${s.id}`}
                                className="btn btn-xs btn-light border text-secondary px-2 py-1 rounded-2 text-decoration-none"
                                title="View Audit Details"
                              >
                                <Eye size={12} /> View
                              </Link>
                              {s.status !== 'CLOSED' && s.status !== 'FORCED_CLOSED' && hasRole(['SUPER_ADMIN', 'MANAGER']) && (
                                <button
                                  type="button"
                                  className="btn btn-xs btn-outline-danger px-2 py-1 rounded-2 fw-bold"
                                  onClick={() => {
                                    setSelectedShiftForForceClose(s);
                                    setShowForceCloseModal(true);
                                  }}
                                  title="Admin Force Close Shift"
                                >
                                  Force Close
                                </button>
                              )}
                              {s.status === 'PENDING_APPROVAL' && hasRole(['SUPER_ADMIN', 'MANAGER']) && (
                                <button
                                  type="button"
                                  className="btn btn-xs btn-warning text-dark px-2 py-1 rounded-2 fw-bold"
                                  onClick={() => {
                                    setSelectedShiftForApproval(s);
                                    setShowApprovalModal(true);
                                  }}
                                >
                                  Review
                                </button>
                              )}
                              {s.status === 'CLOSED' && hasRole(['SUPER_ADMIN']) && (
                                <button
                                  type="button"
                                  className="btn btn-xs btn-outline-secondary px-1.5 py-1 rounded-2"
                                  onClick={() => handleReopen(s.id)}
                                  title="Reopen Shift (Admin only)"
                                >
                                  <RotateCcw size={12} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: MANAGER APPROVALS QUEUE                            */}
      {/* ========================================================= */}
      {activeTab === 'approvals' && (
        <div>
          {(!shiftsList || shiftsList.filter(s => s.status === 'PENDING_APPROVAL').length === 0) ? (
            <div className="card border-0 bg-white shadow-xs p-5 rounded-4 text-center my-3">
              <CheckCircle2 size={36} className="text-success mx-auto mb-2 opacity-50" />
              <h5 className="fw-bold text-dark mb-1">No Pending Discrepancy Approvals</h5>
              <p className="text-secondary small m-0">All closed shift reconciliations are fully balanced and approved.</p>
            </div>
          ) : (
            <div className="row g-3">
              {shiftsList.filter(s => s.status === 'PENDING_APPROVAL').map((s) => {
                const diff = s.cash_difference || 0;
                const isShort = diff < 0;

                return (
                  <div key={s.id} className="col-12 col-md-6 col-xl-4">
                    <div className="card border-0 shadow-xs bg-white rounded-4 p-4 h-100" style={{ border: '1px solid #FCA5A5' }}>
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <span className={`badge px-2.5 py-1 rounded-pill extra-small fw-bold ${isShort ? 'bg-danger text-white' : 'bg-warning text-dark'}`}>
                            {isShort ? `Shortage: ${formatCurrency(Math.abs(diff))}` : `Excess: +${formatCurrency(diff)}`}
                          </span>
                          <h5 className="fw-bold text-dark mt-1.5 mb-0">{s.user_name}</h5>
                          <span className="text-secondary extra-small font-monospace">Shift #{s.shift_number}</span>
                        </div>
                        <span className="p-2 rounded-2 bg-danger-subtle text-danger"><AlertTriangle size={18} /></span>
                      </div>

                      <div className="p-3 bg-light rounded-3 mb-3 small">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="text-secondary extra-small">Expected Cash:</span>
                          <span className="fw-bold text-dark font-monospace">{formatCurrency(s.financials?.expected_cash ?? s.expected_cash)}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="text-secondary extra-small">Actual Counted:</span>
                          <span className="fw-bold text-dark font-monospace">{formatCurrency(s.actual_cash)}</span>
                        </div>
                        {s.difference_reason && (
                          <div className="mt-2 pt-2 border-top extra-small text-dark">
                            <strong>Explanation:</strong>
                            <div className="text-secondary mt-0.5 fst-italic">"{s.difference_reason}"</div>
                          </div>
                        )}
                      </div>

                      <div className="d-flex align-items-center justify-content-between gap-2 pt-2 border-top">
                        <Link to={`/shifts/${s.id}`} className="btn btn-sm btn-light border rounded-3 extra-small">
                          Inspect Shift
                        </Link>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary rounded-3 extra-small fw-bold px-3 shadow-xs"
                          style={{ backgroundColor: '#2563EB', borderColor: '#2563EB' }}
                          onClick={() => {
                            setSelectedShiftForApproval(s);
                            setShowApprovalModal(true);
                          }}
                        >
                          Review &amp; Sign-off
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
      {/* MODALS CONTAINER                                          */}
      {/* ========================================================= */}
      <OpenShiftModal
        isOpen={showOpenModal}
        onClose={() => setShowOpenModal(false)}
        initialSuggestedBalance={currentData?.suggested_opening_balance || 0}
        pendingHandovers={currentData?.pending_handovers || []}
        onSuccess={(newShift) => {
          showSuccessToast(`Shift #${newShift.shift_number} opened successfully.`);
          queryClient.setQueryData(['shifts', 'current'], (old) => ({
            ...(old || {}),
            has_active_shift: true,
            shift: newShift,
          }));
          queryClient.invalidateQueries({ queryKey: ['shifts'], refetchType: 'none' });
        }}
      />

      <CloseShiftModal
        isOpen={showCloseModal}
        onClose={() => {
          setShowCloseModal(false);
          setSelectedShiftForClose(null);
        }}
        shift={selectedShiftForClose || currentShift}
        financials={selectedShiftForClose?.financials || currentFin}
        onSuccess={(closedShift) => {
          showSuccessToast(`Shift closing submitted successfully.`);
          queryClient.setQueryData(['shifts', 'current'], (old) => ({
            ...(old || {}),
            has_active_shift: false,
            shift: null,
          }));
          queryClient.invalidateQueries({ queryKey: ['shifts'], refetchType: 'none' });
        }}
      />

      <ShiftExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        shift={currentShift}
        onSuccess={() => {
          showSuccessToast('Petty cash expense recorded.');
          queryClient.invalidateQueries({ queryKey: ['shifts'] });
        }}
      />

      <ShiftAdjustmentModal
        isOpen={showAdjustmentModal}
        onClose={() => setShowAdjustmentModal(false)}
        shift={currentShift}
        onSuccess={() => {
          showSuccessToast('Cash adjustment recorded.');
          queryClient.invalidateQueries({ queryKey: ['shifts'] });
        }}
      />

      <ShiftHandoverModal
        isOpen={showHandoverModal}
        onClose={() => setShowHandoverModal(false)}
        shift={currentShift}
        expectedCash={currentFin.expected_cash || 0}
        onSuccess={() => {
          showSuccessToast('Cash handover initiated.');
          queryClient.invalidateQueries({ queryKey: ['shifts'] });
        }}
      />

      {selectedShiftForApproval && (
        <ShiftApprovalModal
          isOpen={showApprovalModal}
          onClose={() => {
            setShowApprovalModal(false);
            setSelectedShiftForApproval(null);
          }}
          shift={selectedShiftForApproval}
          onSuccess={() => {
            showSuccessToast('Shift reconciliation decision recorded.');
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
          }}
        />
      )}

      {selectedShiftForForceClose && (
        <AdminForceCloseModal
          isOpen={showForceCloseModal}
          onClose={() => {
            setShowForceCloseModal(false);
            setSelectedShiftForForceClose(null);
          }}
          shift={selectedShiftForForceClose}
          onSuccess={() => {
            showSuccessToast('Shift has been forcibly closed.');
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
          }}
        />
      )}

    </div>
  );
};

export default Shifts;
