import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCustomerWalletsApi,
  recordCustomerPaymentApi,
  refundCustomerCreditApi,
  getCustomerHistoryApi,
  getCustomersApi
} from '../api/customerApi';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/dateUtils';
import {
  exportWalletsToExcel,
  exportWalletsToPDF,
  exportTransactionsToExcel,
  exportTransactionsToPDF
} from '../utils/exportUtils';
import PageLoader from '../components/PageLoader';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  Search,
  RefreshCw,
  FileText,
  User,
  Phone,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Printer,
  X,
  CreditCard,
  PlusCircle,
  Building2,
  TrendingUp,
  ShieldCheck,
  Users,
  FileSpreadsheet,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  SlidersHorizontal,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

const DEFAULT_COLUMNS = {
  profile: true,
  contact: true,
  credit: true,
  dues: true,
  net: true,
  activity: true,
  stays: true,
  actions: true
};

const COLUMN_CONFIG = [
  { key: 'profile', label: 'Guest Profile' },
  { key: 'contact', label: 'Contact Details' },
  { key: 'credit', label: 'Available Advance Credit' },
  { key: 'dues', label: 'Pending Stay Dues' },
  { key: 'net', label: 'Net Position' },
  { key: 'activity', label: 'Latest Activity' },
  { key: 'stays', label: 'Stays Count' },
  { key: 'actions', label: 'Wallet Operations' }
];

const Wallets = () => {
  const { user, selectedProperty } = useAuth();
  const { showSuccess, showError } = useNotification();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'credit_available', 'pending_dues'
  const [sortBy, setSortBy] = useState('credit_desc');
  const [sortConfig, setSortConfig] = useState({ field: 'credit', direction: 'desc' });

  // Column Visibility Customization State (persisted to localStorage)
  const [columnVisibility, setColumnVisibility] = useState(() => {
    try {
      const saved = localStorage.getItem('lms_wallets_col_visibility');
      if (saved) {
        return { ...DEFAULT_COLUMNS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to parse saved column visibility', e);
    }
    return DEFAULT_COLUMNS;
  });
  const [showColDropdown, setShowColDropdown] = useState(false);
  const colDropdownRef = useRef(null);

  // Density Mode State (comfortable | compact)
  const [density, setDensity] = useState(() => {
    return localStorage.getItem('lms_wallets_density') || 'comfortable';
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const toggleColumn = (key) => {
    setColumnVisibility((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      if (!Object.values(updated).some(Boolean)) {
        return prev;
      }
      try {
        localStorage.setItem('lms_wallets_col_visibility', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const resetColumns = () => {
    setColumnVisibility(DEFAULT_COLUMNS);
    try {
      localStorage.setItem('lms_wallets_col_visibility', JSON.stringify(DEFAULT_COLUMNS));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleDensity = () => {
    const nextDensity = density === 'comfortable' ? 'compact' : 'comfortable';
    setDensity(nextDensity);
    try {
      localStorage.setItem('lms_wallets_density', nextDensity);
    } catch (e) {
      console.error(e);
    }
  };

  // Close column dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (colDropdownRef.current && !colDropdownRef.current.contains(event.target)) {
        setShowColDropdown(false);
      }
    };
    if (showColDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColDropdown]);

  // Handle Sort Header Click
  const handleHeaderSort = (field) => {
    setSortConfig((prev) => {
      let newDirection = 'desc';
      if (prev.field === field) {
        newDirection = prev.direction === 'asc' ? 'desc' : 'asc';
      } else {
        newDirection = ['name', 'contact'].includes(field) ? 'asc' : 'desc';
      }
      const matchingKey = `${field}_${newDirection}`;
      setSortBy(matchingKey);
      return { field, direction: newDirection };
    });
  };

  // Handle Dropdown Sort Selection
  const handleSortDropdownChange = (e) => {
    const val = e.target.value;
    setSortBy(val);
    const [field, direction] = val.split('_');
    setSortConfig({ field, direction: direction || 'desc' });
  };

  // Deposit Modal State
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedCustForDeposit, setSelectedCustForDeposit] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState('CASH');
  const [depositRef, setDepositRef] = useState('');
  const [depositNotes, setDepositNotes] = useState('Advance Wallet Deposit');
  const [directDepositOnly, setDirectDepositOnly] = useState(true);
  const [depositSubmitting, setDepositSubmitting] = useState(false);
  const [depositError, setDepositError] = useState('');

  // Standalone deposit customer search (when opening "+ Record Advance Deposit" from header)
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);

  // Refund Modal State
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedCustForRefund, setSelectedCustForRefund] = useState(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundMethod, setRefundMethod] = useState('CASH');
  const [refundRef, setRefundRef] = useState('');
  const [refundNotes, setRefundNotes] = useState('Return of unused advance wallet credit');
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [refundError, setRefundError] = useState('');

  // Settle Dues from Wallet State
  const [settlingDuesId, setSettlingDuesId] = useState(null);

  // Statement / Ledger Modal State
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [selectedCustForLedger, setSelectedCustForLedger] = useState(null);
  const [ledgerData, setLedgerData] = useState(null);
  const [loadingLedger, setLoadingLedger] = useState(false);

  // TanStack Query for wallets data fetching
  const {
    data: walletsData = {},
    isLoading: loading,
    refetch: loadWallets,
  } = useQuery({
    queryKey: ['wallets', search, activeTab, selectedProperty?.id],
    queryFn: () =>
      getCustomerWalletsApi({
        search: search.trim(),
        tab: activeTab,
      }),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const wallets = walletsData?.results || [];
  const summary = {
    total_active_wallets: 0,
    total_advance_credit_held: 0,
    total_customers_with_credit: 0,
    total_pending_dues: 0,
    total_customers_with_dues: 0,
    net_position: 0,
    ...(walletsData?.summary || {}),
  };

  // -------------------------------------------------------------
  // Customer Search for Header Deposit Action
  // -------------------------------------------------------------
  useEffect(() => {
    if (!customerSearchQuery.trim() || selectedCustForDeposit) {
      setCustomerSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setSearchingCustomers(true);
      try {
        const res = await getCustomersApi(customerSearchQuery.trim());
        setCustomerSearchResults(Array.isArray(res) ? res.slice(0, 5) : []);
      } catch (e) {
        console.error(e);
      } finally {
        setSearchingCustomers(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [customerSearchQuery, selectedCustForDeposit]);

  // Open Deposit Modal
  const handleOpenDeposit = (cust = null) => {
    setSelectedCustForDeposit(cust);
    setCustomerSearchQuery(cust ? cust.full_name : '');
    setCustomerSearchResults([]);
    setDepositAmount('');
    setDepositMethod('CASH');
    setDepositRef('');
    setDepositNotes(cust ? `Advance deposit for ${cust.full_name}` : 'Direct Customer Advance Deposit');
    setDirectDepositOnly(true);
    setDepositError('');
    setShowDepositModal(true);
  };

  // Submit Deposit
  const handleExecuteDeposit = async (e) => {
    e.preventDefault();
    setDepositError('');

    if (!selectedCustForDeposit) {
      setDepositError('Please select a customer.');
      return;
    }

    const numAmt = parseFloat(depositAmount);
    if (isNaN(numAmt) || numAmt <= 0) {
      setDepositError('Please enter a valid deposit amount greater than zero.');
      return;
    }

    setDepositSubmitting(true);
    try {
      const payload = {
        amount: numAmt,
        payment_method: depositMethod,
        transaction_reference: depositRef,
        notes: depositNotes,
        direct_wallet_deposit: directDepositOnly
      };

      const res = await recordCustomerPaymentApi(selectedCustForDeposit.id, payload);
      showSuccess(
        res.message || `₹${numAmt.toFixed(2)} advance deposited to ${selectedCustForDeposit.full_name}'s wallet!`,
        'Deposit Successful'
      );
      setShowDepositModal(false);

      // Direct cache update for instant table refresh
      queryClient.setQueriesData({ queryKey: ['wallets'] }, (old) => {
        if (!old || !Array.isArray(old.results)) return old;
        return {
          ...old,
          results: old.results.map((c) =>
            c.id === selectedCustForDeposit.id
              ? { ...c, total_available_credit: (c.total_available_credit || 0) + numAmt }
              : c
          ),
        };
      });
      queryClient.invalidateQueries({ queryKey: ['wallets'], refetchType: 'none' });
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to process advance deposit.';
      setDepositError(errMsg);
    } finally {
      setDepositSubmitting(false);
    }
  };

  // Open Refund Modal
  const handleOpenRefund = (cust) => {
    setSelectedCustForRefund(cust);
    const maxCredit = cust.total_available_credit || 0;
    setRefundAmount(maxCredit > 0 ? maxCredit.toFixed(2) : '');
    setRefundMethod('CASH');
    setRefundRef('');
    setRefundNotes(`Refund of available wallet credit for ${cust.full_name}`);
    setRefundError('');
    setShowRefundModal(true);
  };

  // Submit Refund
  const handleExecuteRefund = async (e) => {
    e.preventDefault();
    setRefundError('');

    const numAmt = parseFloat(refundAmount);
    if (isNaN(numAmt) || numAmt <= 0) {
      setRefundError('Please enter a valid refund amount greater than zero.');
      return;
    }

    if (numAmt > (selectedCustForRefund?.total_available_credit || 0) + 0.01) {
      setRefundError(`Refund amount cannot exceed available credit of ₹${selectedCustForRefund?.total_available_credit?.toFixed(2)}.`);
      return;
    }

    setRefundSubmitting(true);
    try {
      const payload = {
        amount: numAmt,
        payment_method: refundMethod,
        transaction_reference: refundRef,
        notes: refundNotes
      };

      const res = await refundCustomerCreditApi(selectedCustForRefund.id, payload);
      showSuccess(
        res.message || `₹${numAmt.toFixed(2)} refunded successfully to ${selectedCustForRefund.full_name}!`,
        'Refund Completed'
      );
      setShowRefundModal(false);

      // Direct cache update for instant table refresh
      queryClient.setQueriesData({ queryKey: ['wallets'] }, (old) => {
        if (!old || !Array.isArray(old.results)) return old;
        return {
          ...old,
          results: old.results.map((c) =>
            c.id === selectedCustForRefund.id
              ? { ...c, total_available_credit: Math.max(0, (c.total_available_credit || 0) - numAmt) }
              : c
          ),
        };
      });
      queryClient.invalidateQueries({ queryKey: ['wallets'], refetchType: 'none' });
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to process wallet refund.';
      setRefundError(errMsg);
    } finally {
      setRefundSubmitting(false);
    }
  };

  // Settle Stay Dues from Wallet Credit
  const handleSettleDuesFromWallet = async (cust) => {
    if (!cust) return;
    const canPay = Math.min(cust.total_available_credit, cust.pending_dues);
    if (canPay <= 0) return;

    if (!window.confirm(`Apply ₹${canPay.toFixed(2)} from available wallet credit to pay off pending stay dues for ${cust.full_name}?`)) {
      return;
    }

    setSettlingDuesId(cust.id);
    try {
      const payload = {
        amount: canPay,
        payment_method: 'WALLET',
        use_wallet_credit: true,
        transaction_reference: 'CUSTOMER_WALLET_SETTLEMENT',
        notes: `Automated dues settlement of ₹${canPay.toFixed(2)} from guest wallet balance`
      };

      const res = await recordCustomerPaymentApi(cust.id, payload);
      showSuccess(
        res.message || `Successfully applied ₹${canPay.toFixed(2)} from wallet credit to settle stay dues.`,
        'Dues Settled'
      );

      // Direct cache update for instant table refresh
      queryClient.setQueriesData({ queryKey: ['wallets'] }, (old) => {
        if (!old || !Array.isArray(old.results)) return old;
        return {
          ...old,
          results: old.results.map((c) =>
            c.id === cust.id
              ? {
                  ...c,
                  total_available_credit: Math.max(0, (c.total_available_credit || 0) - canPay),
                  pending_dues: Math.max(0, (c.pending_dues || 0) - canPay),
                }
              : c
          ),
        };
      });
      queryClient.invalidateQueries({ queryKey: ['wallets'], refetchType: 'none' });
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to settle dues from wallet.';
      showError(errMsg, 'Settlement Failed');
    } finally {
      setSettlingDuesId(null);
    }
  };

  // Open Ledger / Statement Modal
  const handleOpenLedger = async (cust) => {
    setSelectedCustForLedger(cust);
    setShowLedgerModal(true);
    setLoadingLedger(true);
    try {
      const data = await getCustomerHistoryApi(cust.id);
      setLedgerData(data);
    } catch (err) {
      console.error(err);
      showError('Failed to load transaction ledger statement.', 'Error');
    } finally {
      setLoadingLedger(false);
    }
  };

  // -------------------------------------------------------------
  // Sort Active Wallets (Multi-column Ascending & Descending)
  // -------------------------------------------------------------
  const sortedWallets = useMemo(() => {
    return [...wallets].sort((a, b) => {
      let comparison = 0;
      const { field, direction } = sortConfig;

      switch (field) {
        case 'profile':
        case 'name': {
          const nameA = (a.full_name || '').toLowerCase();
          const nameB = (b.full_name || '').toLowerCase();
          comparison = nameA.localeCompare(nameB);
          break;
        }
        case 'contact': {
          const phoneA = (a.mobile || '').toLowerCase();
          const phoneB = (b.mobile || '').toLowerCase();
          comparison = phoneA.localeCompare(phoneB);
          break;
        }
        case 'credit': {
          const credA = parseFloat(a.total_available_credit) || 0;
          const credB = parseFloat(b.total_available_credit) || 0;
          comparison = credA - credB;
          break;
        }
        case 'dues': {
          const duesA = parseFloat(a.pending_dues) || 0;
          const duesB = parseFloat(b.pending_dues) || 0;
          comparison = duesA - duesB;
          break;
        }
        case 'net': {
          const netA = parseFloat(a.net_balance) || 0;
          const netB = parseFloat(b.net_balance) || 0;
          comparison = netA - netB;
          break;
        }
        case 'activity': {
          const dateA = a.last_transaction?.payment_date ? new Date(a.last_transaction.payment_date).getTime() : 0;
          const dateB = b.last_transaction?.payment_date ? new Date(b.last_transaction.payment_date).getTime() : 0;
          comparison = dateA - dateB;
          break;
        }
        case 'stays': {
          const staysA = parseInt(a.total_stays_count, 10) || 0;
          const staysB = parseInt(b.total_stays_count, 10) || 0;
          comparison = staysA - staysB;
          break;
        }
        default:
          comparison = 0;
      }

      return direction === 'asc' ? comparison : -comparison;
    });
  }, [wallets, sortConfig]);

  // Reset pagination when search, tab, or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeTab, sortConfig, pageSize]);

  // Pagination Calculations
  const totalRecords = sortedWallets.length;
  const isAllPages = pageSize === 'all';
  const effectivePageSize = isAllPages ? totalRecords : Number(pageSize);
  const totalPages = isAllPages ? 1 : Math.max(1, Math.ceil(totalRecords / effectivePageSize));

  const paginatedWallets = useMemo(() => {
    if (isAllPages) return sortedWallets;
    const start = (currentPage - 1) * effectivePageSize;
    return sortedWallets.slice(start, start + effectivePageSize);
  }, [sortedWallets, currentPage, effectivePageSize, isAllPages]);

  // Summary Totals for Filtered Dataset (for summary footer)
  const visibleTotals = useMemo(() => {
    return sortedWallets.reduce(
      (acc, w) => {
        acc.credit += parseFloat(w.total_available_credit) || 0;
        acc.dues += parseFloat(w.pending_dues) || 0;
        acc.net += parseFloat(w.net_balance) || 0;
        return acc;
      },
      { credit: 0, dues: 0, net: 0 }
    );
  }, [sortedWallets]);

  const visibleColCount = Object.values(columnVisibility).filter(Boolean).length;
  const currentSortValue = `${sortConfig.field}_${sortConfig.direction}`;

  const hotelInfo = {
    name: selectedProperty?.name || user?.property_name || 'LodgeMaster Hotel',
    code: selectedProperty?.code || user?.property_code || ''
  };

  return (
    <div className="container-fluid px-3 px-md-4 py-3">
      {/* Print Specific CSS */}
      <style>{`
        @media print {
          .no-print, .btn, .modal-backdrop, .modal-header .btn-close, aside, nav, .sidebar-link {
            display: none !important;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .modal {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: transparent !important;
          }
          .modal-dialog {
            max-width: 100% !important;
            margin: 0 !important;
          }
          .modal-content {
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <div
              className="d-flex align-items-center justify-content-center text-white rounded-3 shadow-xs"
              style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)' }}
            >
              <Wallet size={20} />
            </div>
            <h4 className="fw-bold m-0 text-dark">Customer Wallets &amp; Advance Credit</h4>
          </div>
          <span className="text-secondary small">
            Live tracking of customer advance deposits, available wallet credit, and pending stay settlements.
          </span>
        </div>

        {/* Header Action Toolbar */}
        <div className="d-flex align-items-center gap-2 flex-wrap">
          {/* Refresh Button */}
          <button
            type="button"
            className="btn btn-outline-secondary d-flex align-items-center gap-1.5 shadow-xs bg-white py-2 px-2.5"
            onClick={() => loadWallets()}
            disabled={loading}
            title="Refresh wallets data"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span className="small fw-semibold d-none d-sm-inline">Refresh</span>
          </button>

          {/* Export to Excel (.xls Spreadsheet with Landscape Setup) */}
          <button
            type="button"
            className="btn btn-outline-success d-flex align-items-center gap-1.5 shadow-xs bg-white py-2 px-3 fw-semibold small"
            onClick={() => exportWalletsToExcel(sortedWallets, summary, hotelInfo)}
            disabled={sortedWallets.length === 0}
            title="Export wallet directory to Excel (.xls) with built-in Landscape page setup"
          >
            <FileSpreadsheet size={16} className="text-success" />
            <span>Export Excel</span>
          </button>

          {/* Download Vector A4 Landscape PDF */}
          <button
            type="button"
            className="btn btn-outline-danger d-flex align-items-center gap-1.5 shadow-xs bg-white py-2 px-3 fw-semibold small"
            onClick={() => exportWalletsToPDF(sortedWallets, summary, hotelInfo, { action: 'download' })}
            disabled={sortedWallets.length === 0}
            title="Download true A4 Landscape PDF report"
          >
            <Download size={16} className="text-danger" />
            <span>Download PDF</span>
          </button>

          {/* Print A4 Landscape Report */}
          <button
            type="button"
            className="btn btn-outline-primary d-flex align-items-center gap-1.5 shadow-xs bg-white py-2 px-3 fw-semibold small"
            onClick={() => exportWalletsToPDF(sortedWallets, summary, hotelInfo, { action: 'print' })}
            disabled={sortedWallets.length === 0}
            title="Open and print A4 Landscape financial report"
          >
            <Printer size={16} className="text-primary" />
            <span>Print Report</span>
          </button>

          {/* Record Advance Deposit */}
          <button
            type="button"
            className="btn btn-primary d-flex align-items-center gap-2 shadow-xs fw-bold px-3 py-2"
            onClick={() => handleOpenDeposit(null)}
          >
            <PlusCircle size={17} />
            <span>Record Advance Deposit</span>
          </button>
        </div>
      </div>

      {/* 4 Executive KPI Metric Cards (Clickable to Filter) */}
      <div className="row g-3 mb-4">
        {/* Total Advance Credit Held */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className={`card border shadow-sm rounded-4 h-100 bg-white overflow-hidden transition-all ${
              activeTab === 'credit_available' ? 'border-success border-2 shadow-md' : 'border-0'
            }`}
            style={{ cursor: 'pointer' }}
            onClick={() => setActiveTab('credit_available')}
            title="Click to show only guests with available advance credit"
          >
            <div className="card-body p-3.5 d-flex align-items-center gap-3">
              <div
                className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                style={{ width: '48px', height: '48px', backgroundColor: '#ECFDF5', color: '#059669' }}
              >
                <Wallet size={24} />
              </div>
              <div className="overflow-hidden">
                <div className="d-flex align-items-center justify-content-between mb-0.5">
                  <span className="text-secondary extra-small fw-semibold text-uppercase">
                    Advance Credit Held
                  </span>
                  {activeTab === 'credit_available' && (
                    <span className="badge bg-success-subtle text-success extra-small py-0 px-1">Active</span>
                  )}
                </div>
                <h4 className="fw-bold text-dark m-0 tracking-tight text-truncate text-success">
                  {formatCurrency(summary.total_advance_credit_held)}
                </h4>
                <span className="text-muted extra-small">
                  {summary.total_customers_with_credit} guest{summary.total_customers_with_credit === 1 ? '' : 's'} with funds
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Total Outstanding Dues */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className={`card border shadow-sm rounded-4 h-100 bg-white overflow-hidden transition-all ${
              activeTab === 'pending_dues' ? 'border-danger border-2 shadow-md' : 'border-0'
            }`}
            style={{ cursor: 'pointer' }}
            onClick={() => setActiveTab('pending_dues')}
            title="Click to show only guests with pending stay dues"
          >
            <div className="card-body p-3.5 d-flex align-items-center gap-3">
              <div
                className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                style={{ width: '48px', height: '48px', backgroundColor: '#FEF2F2', color: '#DC2626' }}
              >
                <AlertTriangle size={24} />
              </div>
              <div className="overflow-hidden">
                <div className="d-flex align-items-center justify-content-between mb-0.5">
                  <span className="text-secondary extra-small fw-semibold text-uppercase">
                    Outstanding Stay Dues
                  </span>
                  {activeTab === 'pending_dues' && (
                    <span className="badge bg-danger-subtle text-danger extra-small py-0 px-1">Active</span>
                  )}
                </div>
                <h4 className="fw-bold text-danger m-0 tracking-tight text-truncate">
                  {formatCurrency(summary.total_pending_dues)}
                </h4>
                <span className="text-muted extra-small">
                  {summary.total_customers_with_dues} guest{summary.total_customers_with_dues === 1 ? '' : 's'} with unpaid balance
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Net Customer Position */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 bg-white overflow-hidden">
            <div className="card-body p-3.5 d-flex align-items-center gap-3">
              <div
                className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: summary.net_position >= 0 ? '#EFF6FF' : '#FFF7ED',
                  color: summary.net_position >= 0 ? '#2563EB' : '#EA580C'
                }}
              >
                <TrendingUp size={24} />
              </div>
              <div className="overflow-hidden">
                <span className="text-secondary extra-small fw-semibold text-uppercase d-block mb-0.5">
                  Net Hotel Position
                </span>
                <h4 className={`fw-bold m-0 tracking-tight text-truncate ${summary.net_position >= 0 ? 'text-primary' : 'text-warning'}`}>
                  {formatCurrency(summary.net_position)}
                </h4>
                <span className="text-muted extra-small">
                  {summary.net_position >= 0 ? 'Net guest credit in custody' : 'Net uncollected dues'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Customer Wallets */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className={`card border shadow-sm rounded-4 h-100 bg-white overflow-hidden transition-all ${
              activeTab === 'all' ? 'border-primary border-2 shadow-md' : 'border-0'
            }`}
            style={{ cursor: 'pointer' }}
            onClick={() => setActiveTab('all')}
            title="Click to show all active wallets"
          >
            <div className="card-body p-3.5 d-flex align-items-center gap-3">
              <div
                className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                style={{ width: '48px', height: '48px', backgroundColor: '#F5F3FF', color: '#7C3AED' }}
              >
                <Users size={24} />
              </div>
              <div className="overflow-hidden">
                <div className="d-flex align-items-center justify-content-between mb-0.5">
                  <span className="text-secondary extra-small fw-semibold text-uppercase">
                    Active Wallets
                  </span>
                  {activeTab === 'all' && (
                    <span className="badge bg-primary-subtle text-primary extra-small py-0 px-1">All</span>
                  )}
                </div>
                <h4 className="fw-bold text-dark m-0 tracking-tight text-truncate">
                  {summary.total_active_wallets}
                </h4>
                <span className="text-muted extra-small">
                  Zero-balance records excluded
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Card with Search, Filter Tabs, Sort Selector, and Wallets Table */}
      <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
        {/* Search, Tabs & Sorting Toolbar */}
        <div className="p-3 border-bottom bg-white d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
          {/* Filter Tabs */}
          <div className="btn-group p-1 bg-light rounded-3 border flex-shrink-0" role="group">
            <button
              type="button"
              className={`btn btn-sm rounded-2 fw-semibold px-3 transition-all ${
                activeTab === 'all' ? 'btn-white shadow-xs text-dark' : 'btn-link text-secondary text-decoration-none'
              }`}
              onClick={() => setActiveTab('all')}
            >
              All Active ({summary.total_active_wallets})
            </button>
            <button
              type="button"
              className={`btn btn-sm rounded-2 fw-semibold px-3 transition-all ${
                activeTab === 'credit_available' ? 'btn-white shadow-xs text-success' : 'btn-link text-secondary text-decoration-none'
              }`}
              onClick={() => setActiveTab('credit_available')}
            >
              Advance Credit ({summary.total_customers_with_credit})
            </button>
            <button
              type="button"
              className={`btn btn-sm rounded-2 fw-semibold px-3 transition-all ${
                activeTab === 'pending_dues' ? 'btn-white shadow-xs text-danger' : 'btn-link text-secondary text-decoration-none'
              }`}
              onClick={() => setActiveTab('pending_dues')}
            >
              Pending Dues ({summary.total_customers_with_dues})
            </button>
          </div>

          {/* Right Toolbar: Density, Column Visibility, Sort Selector & Search */}
          <div className="d-flex align-items-center gap-2 flex-wrap">
            {/* Density Toggle Button */}
            <button
              type="button"
              className={`btn btn-sm ${
                density === 'compact' ? 'btn-primary text-white' : 'btn-outline-secondary bg-white text-dark'
              } d-flex align-items-center gap-1.5 rounded-3 py-1.5 px-2.5 shadow-xs`}
              onClick={toggleDensity}
              title={density === 'compact' ? 'Switch to Comfortable Spacing' : 'Switch to Compact Row Height'}
            >
              <span className="extra-small fw-semibold">
                {density === 'compact' ? 'Compact' : 'Comfortable'}
              </span>
            </button>

            {/* Column Visibility Customizer Dropdown */}
            <div className="position-relative" ref={colDropdownRef}>
              <button
                type="button"
                className={`btn btn-sm ${
                  showColDropdown ? 'btn-primary text-white' : 'btn-outline-secondary bg-white text-dark'
                } d-flex align-items-center gap-1.5 rounded-3 py-1.5 px-2.5 shadow-xs`}
                onClick={() => setShowColDropdown((prev) => !prev)}
                title="Customize Visible Table Columns"
              >
                <SlidersHorizontal size={14} />
                <span className="small fw-semibold d-none d-sm-inline">Columns</span>
                <span className="badge bg-secondary-subtle text-dark extra-small px-1.5 py-0.5 rounded-pill">
                  {visibleColCount}/8
                </span>
                <ChevronDown size={12} className="text-muted" />
              </button>

              {showColDropdown && (
                <div
                  className="position-absolute end-0 mt-2 p-2.5 bg-white rounded-3 shadow-lg border z-3"
                  style={{ minWidth: '240px', zIndex: 1050 }}
                >
                  <div className="d-flex align-items-center justify-content-between pb-2 mb-2 border-bottom px-1">
                    <span className="fw-bold extra-small text-uppercase text-secondary">
                      Toggle Columns
                    </span>
                    <button
                      type="button"
                      className="btn btn-link p-0 extra-small text-primary text-decoration-none fw-semibold"
                      onClick={resetColumns}
                    >
                      Reset All
                    </button>
                  </div>
                  <div className="d-flex flex-column gap-1">
                    {COLUMN_CONFIG.map((col) => {
                      const isChecked = !!columnVisibility[col.key];
                      return (
                        <label
                          key={col.key}
                          className="d-flex align-items-center justify-content-between px-2 py-1.5 rounded-2 hover-bg-light cursor-pointer extra-small user-select-none"
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="d-flex align-items-center gap-2">
                            <input
                              type="checkbox"
                              className="form-check-input m-0"
                              checked={isChecked}
                              onChange={() => toggleColumn(col.key)}
                            />
                            <span className={isChecked ? 'fw-semibold text-dark' : 'text-muted'}>
                              {col.label}
                            </span>
                          </div>
                          {isChecked ? (
                            <Eye size={12} className="text-primary flex-shrink-0" />
                          ) : (
                            <EyeOff size={12} className="text-muted flex-shrink-0" />
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Sort Selector Dropdown */}
            <div className="d-flex align-items-center gap-1.5">
              <span className="text-muted extra-small fw-semibold d-none d-sm-inline">Sort:</span>
              <select
                className="form-select form-select-sm rounded-3 border bg-light py-1.5"
                style={{ width: '185px', fontSize: '0.8rem' }}
                value={currentSortValue}
                onChange={handleSortDropdownChange}
              >
                <option value="credit_desc">Credit (High → Low)</option>
                <option value="credit_asc">Credit (Low → High)</option>
                <option value="dues_desc">Dues (High → Low)</option>
                <option value="dues_asc">Dues (Low → High)</option>
                <option value="net_desc">Net Balance (High → Low)</option>
                <option value="net_asc">Net Balance (Low → High)</option>
                <option value="name_asc">Guest Name (A → Z)</option>
                <option value="name_desc">Guest Name (Z → A)</option>
                <option value="contact_asc">Phone (0 → 9)</option>
                <option value="activity_desc">Activity (Recent First)</option>
                <option value="stays_desc">Stays (High → Low)</option>
              </select>
            </div>

            {/* Search Box */}
            <div className="position-relative" style={{ minWidth: '220px', maxWidth: '300px' }}>
              <Search size={16} className="position-absolute text-muted" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="form-control form-control-sm ps-5 pe-3 py-1.5 rounded-3 border bg-light"
                placeholder="Search Name, Phone, ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="btn btn-sm btn-link position-absolute text-muted p-0"
                  style={{ right: '10px', top: '50%', transform: 'translateY(-50%)' }}
                  onClick={() => setSearch('')}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Wallets Table */}
        <div className="card-body p-0">
          {loading ? (
            <div className="py-5 text-center">
              <PageLoader fullScreen={false} message="Loading Customer Wallets &amp; Credit Ledger..." />
            </div>
          ) : sortedWallets.length === 0 ? (
            <div className="text-center py-5 px-3">
              <div
                className="d-inline-flex p-3 rounded-circle mb-3"
                style={{ backgroundColor: '#F1F5F9', color: '#94A3B8' }}
              >
                <Wallet size={32} />
              </div>
              <h6 className="fw-bold text-dark mb-1">No Active Customer Wallets Found</h6>
              <p className="text-secondary small mb-3" style={{ maxWidth: '440px', margin: '0 auto' }}>
                {search
                  ? `No customer wallets matched your search query "${search}".`
                  : 'Guests with zero balance or fully settled accounts are excluded by default. Only accounts with available advance credit or pending stay dues appear here.'}
              </p>
              {search && (
                <button type="button" className="btn btn-sm btn-outline-primary rounded-3" onClick={() => setSearch('')}>
                  Clear Search Filter
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover align-middle m-0" style={{ minWidth: '980px' }}>
                  <thead className="table-light text-secondary extra-small text-uppercase fw-bold border-bottom">
                    <tr>
                      {columnVisibility.profile && (
                        <th
                          className={`ps-4 ${density === 'compact' ? 'py-2' : 'py-3'} cursor-pointer user-select-none text-nowrap`}
                          style={{ cursor: 'pointer', minWidth: '220px' }}
                          onClick={() => handleHeaderSort('name')}
                          title="Click to sort by Guest Name"
                        >
                          <div className="d-inline-flex align-items-center gap-1.5">
                            <span className={sortConfig.field === 'name' ? 'text-primary fw-bold' : ''}>Guest Profile</span>
                            {sortConfig.field === 'name' ? (
                              sortConfig.direction === 'asc' ? (
                                <ArrowUp size={13} className="text-primary fw-bold" />
                              ) : (
                                <ArrowDown size={13} className="text-primary fw-bold" />
                              )
                            ) : (
                              <ArrowUpDown size={12} className="text-muted opacity-40" />
                            )}
                          </div>
                        </th>
                      )}

                      {columnVisibility.contact && (
                        <th
                          className={`${density === 'compact' ? 'py-2' : 'py-3'} cursor-pointer user-select-none text-nowrap`}
                          style={{ cursor: 'pointer', minWidth: '170px' }}
                          onClick={() => handleHeaderSort('contact')}
                          title="Click to sort by Phone / Contact"
                        >
                          <div className="d-inline-flex align-items-center gap-1.5">
                            <span className={sortConfig.field === 'contact' ? 'text-primary fw-bold' : ''}>Contact Details</span>
                            {sortConfig.field === 'contact' ? (
                              sortConfig.direction === 'asc' ? (
                                <ArrowUp size={13} className="text-primary fw-bold" />
                              ) : (
                                <ArrowDown size={13} className="text-primary fw-bold" />
                              )
                            ) : (
                              <ArrowUpDown size={12} className="text-muted opacity-40" />
                            )}
                          </div>
                        </th>
                      )}

                      {columnVisibility.credit && (
                        <th
                          className={`${density === 'compact' ? 'py-2' : 'py-3'} text-end cursor-pointer user-select-none text-nowrap`}
                          style={{ cursor: 'pointer', minWidth: '160px' }}
                          onClick={() => handleHeaderSort('credit')}
                          title="Click to sort by Available Advance Credit"
                        >
                          <div className="d-inline-flex align-items-center justify-content-end gap-1.5 w-100">
                            <span className={sortConfig.field === 'credit' ? 'text-primary fw-bold' : ''}>Available Advance Credit</span>
                            {sortConfig.field === 'credit' ? (
                              sortConfig.direction === 'asc' ? (
                                <ArrowUp size={13} className="text-primary fw-bold" />
                              ) : (
                                <ArrowDown size={13} className="text-primary fw-bold" />
                              )
                            ) : (
                              <ArrowUpDown size={12} className="text-muted opacity-40" />
                            )}
                          </div>
                        </th>
                      )}

                      {columnVisibility.dues && (
                        <th
                          className={`${density === 'compact' ? 'py-2' : 'py-3'} text-end cursor-pointer user-select-none text-nowrap`}
                          style={{ cursor: 'pointer', minWidth: '150px' }}
                          onClick={() => handleHeaderSort('dues')}
                          title="Click to sort by Pending Stay Dues"
                        >
                          <div className="d-inline-flex align-items-center justify-content-end gap-1.5 w-100">
                            <span className={sortConfig.field === 'dues' ? 'text-primary fw-bold' : ''}>Pending Stay Dues</span>
                            {sortConfig.field === 'dues' ? (
                              sortConfig.direction === 'asc' ? (
                                <ArrowUp size={13} className="text-primary fw-bold" />
                              ) : (
                                <ArrowDown size={13} className="text-primary fw-bold" />
                              )
                            ) : (
                              <ArrowUpDown size={12} className="text-muted opacity-40" />
                            )}
                          </div>
                        </th>
                      )}

                      {columnVisibility.net && (
                        <th
                          className={`${density === 'compact' ? 'py-2' : 'py-3'} text-end cursor-pointer user-select-none text-nowrap`}
                          style={{ cursor: 'pointer', minWidth: '150px' }}
                          onClick={() => handleHeaderSort('net')}
                          title="Click to sort by Net Position"
                        >
                          <div className="d-inline-flex align-items-center justify-content-end gap-1.5 w-100">
                            <span className={sortConfig.field === 'net' ? 'text-primary fw-bold' : ''}>Net Position</span>
                            {sortConfig.field === 'net' ? (
                              sortConfig.direction === 'asc' ? (
                                <ArrowUp size={13} className="text-primary fw-bold" />
                              ) : (
                                <ArrowDown size={13} className="text-primary fw-bold" />
                              )
                            ) : (
                              <ArrowUpDown size={12} className="text-muted opacity-40" />
                            )}
                          </div>
                        </th>
                      )}

                      {columnVisibility.activity && (
                        <th
                          className={`${density === 'compact' ? 'py-2' : 'py-3'} cursor-pointer user-select-none text-nowrap`}
                          style={{ cursor: 'pointer', minWidth: '170px' }}
                          onClick={() => handleHeaderSort('activity')}
                          title="Click to sort by Activity Date"
                        >
                          <div className="d-inline-flex align-items-center gap-1.5">
                            <span className={sortConfig.field === 'activity' ? 'text-primary fw-bold' : ''}>Latest Activity</span>
                            {sortConfig.field === 'activity' ? (
                              sortConfig.direction === 'asc' ? (
                                <ArrowUp size={13} className="text-primary fw-bold" />
                              ) : (
                                <ArrowDown size={13} className="text-primary fw-bold" />
                              )
                            ) : (
                              <ArrowUpDown size={12} className="text-muted opacity-40" />
                            )}
                          </div>
                        </th>
                      )}

                      {columnVisibility.stays && (
                        <th
                          className={`${density === 'compact' ? 'py-2' : 'py-3'} text-center cursor-pointer user-select-none text-nowrap`}
                          style={{ cursor: 'pointer', minWidth: '90px' }}
                          onClick={() => handleHeaderSort('stays')}
                          title="Click to sort by Total Stays"
                        >
                          <div className="d-inline-flex align-items-center justify-content-center gap-1.5 w-100">
                            <span className={sortConfig.field === 'stays' ? 'text-primary fw-bold' : ''}>Stays</span>
                            {sortConfig.field === 'stays' ? (
                              sortConfig.direction === 'asc' ? (
                                <ArrowUp size={13} className="text-primary fw-bold" />
                              ) : (
                                <ArrowDown size={13} className="text-primary fw-bold" />
                              )
                            ) : (
                              <ArrowUpDown size={12} className="text-muted opacity-40" />
                            )}
                          </div>
                        </th>
                      )}

                      {columnVisibility.actions && (
                        <th
                          className={`pe-4 ${density === 'compact' ? 'py-2' : 'py-3'} text-end text-nowrap`}
                          style={{ minWidth: '240px' }}
                        >
                          Wallet Operations
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedWallets.map((w) => {
                      const hasCredit = w.total_available_credit > 0.01;
                      const hasDues = w.pending_dues > 0.01;
                      const canSettle = hasCredit && hasDues;
                      const lastTx = w.last_transaction;

                      return (
                        <tr key={w.id} className="transition-all">
                          {/* Guest Profile */}
                          {columnVisibility.profile && (
                            <td className={`ps-4 ${density === 'compact' ? 'py-2' : 'py-3'}`}>
                              <div className="d-flex align-items-center gap-2.5">
                                <div
                                  className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold shadow-xs flex-shrink-0"
                                  style={{
                                    width: density === 'compact' ? '32px' : '38px',
                                    height: density === 'compact' ? '32px' : '38px',
                                    fontSize: density === 'compact' ? '0.75rem' : '0.85rem',
                                    background: hasCredit
                                      ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)'
                                      : 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)'
                                  }}
                                >
                                  {(w.first_name || 'G').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <Link
                                    to={`/customers/${w.id}`}
                                    className="fw-bold text-dark text-decoration-none hover-primary d-block small"
                                  >
                                    {w.full_name}
                                  </Link>
                                  <div className="text-muted extra-small d-flex align-items-center gap-1.5">
                                    <span>ID #{w.id}</span>
                                    {w.active_stays_count > 0 && (
                                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill extra-small px-1.5 py-0">
                                        In-House ({w.active_stays_count})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          )}

                          {/* Contact Details */}
                          {columnVisibility.contact && (
                            <td className={density === 'compact' ? 'py-2' : 'py-3'}>
                              <div className="small text-dark fw-semibold d-flex align-items-center gap-1">
                                <Phone size={12} className="text-muted" /> {w.mobile || '—'}
                              </div>
                              <div className="text-secondary extra-small text-truncate" style={{ maxWidth: '170px' }}>
                                {w.city || w.state ? `${w.city}${w.city && w.state ? ', ' : ''}${w.state}` : w.email || '—'}
                              </div>
                            </td>
                          )}

                          {/* Available Advance Credit */}
                          {columnVisibility.credit && (
                            <td className={`${density === 'compact' ? 'py-2' : 'py-3'} text-end`}>
                              {hasCredit ? (
                                <div>
                                  <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2.5 py-1 fw-bold font-monospace fs-6">
                                    +{formatCurrency(w.total_available_credit)}
                                  </span>
                                  {w.stay_credits > 0 && (
                                    <div className="text-muted extra-small mt-0.5">
                                      Includes {formatCurrency(w.stay_credits)} stay credit
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted small font-monospace">₹0.00</span>
                              )}
                            </td>
                          )}

                          {/* Pending Stay Dues */}
                          {columnVisibility.dues && (
                            <td className={`${density === 'compact' ? 'py-2' : 'py-3'} text-end`}>
                              {hasDues ? (
                                <div>
                                  <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-2.5 py-1 fw-bold font-monospace fs-6">
                                    {formatCurrency(w.pending_dues)}
                                  </span>
                                  <div className="text-muted extra-small mt-0.5">Unsettled Stay Dues</div>
                                </div>
                              ) : (
                                <span className="badge bg-light text-secondary border rounded-pill px-2 py-0.5 extra-small font-monospace">
                                  ₹0.00 (Settled)
                                </span>
                              )}
                            </td>
                          )}

                          {/* Net Position */}
                          {columnVisibility.net && (
                            <td className={`${density === 'compact' ? 'py-2' : 'py-3'} text-end`}>
                              <strong
                                className={`small fw-bold font-monospace ${
                                  w.net_balance > 0 ? 'text-success' : w.net_balance < 0 ? 'text-danger' : 'text-dark'
                                }`}
                              >
                                {w.net_balance > 0 ? `+${formatCurrency(w.net_balance)}` : formatCurrency(w.net_balance)}
                              </strong>
                              <div className="text-muted extra-small">
                                {w.net_balance > 0 ? 'Credit in wallet' : w.net_balance < 0 ? 'Net Due' : 'Even balance'}
                              </div>
                            </td>
                          )}

                          {/* Latest Activity */}
                          {columnVisibility.activity && (
                            <td className={density === 'compact' ? 'py-2' : 'py-3'}>
                              {lastTx ? (
                                <div className="extra-small">
                                  <div className="text-dark fw-semibold">
                                    {new Date(lastTx.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                    <span className={`ms-1 fw-bold font-monospace ${parseFloat(lastTx.amount) < 0 ? 'text-danger' : 'text-success'}`}>
                                      {parseFloat(lastTx.amount) < 0 ? `-₹${Math.abs(parseFloat(lastTx.amount)).toFixed(0)}` : `+₹${parseFloat(lastTx.amount).toFixed(0)}`}
                                    </span>
                                  </div>
                                  <div className="text-muted font-monospace text-truncate" style={{ maxWidth: '170px' }}>
                                    {lastTx.payment_method} &bull; {lastTx.payment_number}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted extra-small">No recent activity</span>
                              )}
                            </td>
                          )}

                          {/* Stays Count */}
                          {columnVisibility.stays && (
                            <td className={`${density === 'compact' ? 'py-2' : 'py-3'} text-center`}>
                              <span className="badge bg-light text-dark border rounded-pill px-2 py-1 extra-small fw-semibold">
                                {w.total_stays_count} Stay{w.total_stays_count === 1 ? '' : 's'}
                              </span>
                            </td>
                          )}

                          {/* Action Buttons: strictly single-line horizontal flex-nowrap */}
                          {columnVisibility.actions && (
                            <td className={`pe-4 ${density === 'compact' ? 'py-2' : 'py-3'} text-end`}>
                              <div className="d-inline-flex align-items-center justify-content-end gap-1 flex-nowrap">
                                {/* Record Deposit */}
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-success text-nowrap rounded-3 py-1 px-2.5 extra-small fw-semibold d-inline-flex align-items-center gap-1 shadow-2xs"
                                  onClick={() => handleOpenDeposit(w)}
                                  title={`Deposit advance funds into ${w.full_name}'s wallet`}
                                >
                                  <ArrowDownLeft size={12} />
                                  <span>+ Deposit</span>
                                </button>

                                {/* Return / Refund */}
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger text-nowrap rounded-3 py-1 px-2.5 extra-small fw-semibold d-inline-flex align-items-center gap-1 shadow-2xs"
                                  disabled={!hasCredit}
                                  onClick={() => handleOpenRefund(w)}
                                  title={hasCredit ? `Refund up to ₹${w.total_available_credit.toFixed(2)} to guest` : 'No available credit to refund'}
                                >
                                  <RotateCcw size={12} />
                                  <span>Refund</span>
                                </button>

                                {/* Settle Dues from Wallet */}
                                {canSettle && (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-warning text-dark text-nowrap rounded-3 py-1 px-2.5 extra-small fw-bold d-inline-flex align-items-center gap-1 shadow-xs"
                                    disabled={settlingDuesId === w.id}
                                    onClick={() => handleSettleDuesFromWallet(w)}
                                    title={`Apply wallet credit to clear ₹${Math.min(w.total_available_credit, w.pending_dues).toFixed(2)} in stay dues`}
                                  >
                                    {settlingDuesId === w.id ? (
                                      <span className="spinner-border spinner-border-sm" role="status"></span>
                                    ) : (
                                      <CheckCircle2 size={12} />
                                    )}
                                    <span>Settle</span>
                                  </button>
                                )}

                                {/* View Ledger / Statement */}
                                <button
                                  type="button"
                                  className="btn btn-sm btn-light border text-nowrap rounded-3 py-1 px-2.5 extra-small fw-semibold text-secondary d-inline-flex align-items-center gap-1 shadow-2xs"
                                  onClick={() => handleOpenLedger(w)}
                                  title="View full wallet statement & transaction ledger"
                                >
                                  <FileText size={12} />
                                  <span>Ledger</span>
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* Summary Totals Footer Row */}
                  <tfoot className="table-light border-top fw-bold text-secondary extra-small">
                    <tr>
                      {columnVisibility.profile && (
                        <td className={`ps-4 ${density === 'compact' ? 'py-2' : 'py-2.5'}`}>
                          <span className="text-dark fw-bold">
                            Totals ({sortedWallets.length} Accounts)
                          </span>
                        </td>
                      )}
                      {columnVisibility.contact && (
                        <td className={`${density === 'compact' ? 'py-2' : 'py-2.5'} text-muted`}>—</td>
                      )}
                      {columnVisibility.credit && (
                        <td className={`${density === 'compact' ? 'py-2' : 'py-2.5'} text-end font-monospace`}>
                          <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2.5 py-1 fw-bold fs-6">
                            +{formatCurrency(visibleTotals.credit)}
                          </span>
                        </td>
                      )}
                      {columnVisibility.dues && (
                        <td className={`${density === 'compact' ? 'py-2' : 'py-2.5'} text-end font-monospace`}>
                          <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-2.5 py-1 fw-bold fs-6">
                            {formatCurrency(visibleTotals.dues)}
                          </span>
                        </td>
                      )}
                      {columnVisibility.net && (
                        <td className={`${density === 'compact' ? 'py-2' : 'py-2.5'} text-end font-monospace`}>
                          <strong
                            className={`fs-6 fw-bold ${
                              visibleTotals.net > 0 ? 'text-success' : visibleTotals.net < 0 ? 'text-danger' : 'text-dark'
                            }`}
                          >
                            {visibleTotals.net > 0 ? `+${formatCurrency(visibleTotals.net)}` : formatCurrency(visibleTotals.net)}
                          </strong>
                        </td>
                      )}
                      {columnVisibility.activity && (
                        <td className={`${density === 'compact' ? 'py-2' : 'py-2.5'} text-muted`}>—</td>
                      )}
                      {columnVisibility.stays && (
                        <td className={`${density === 'compact' ? 'py-2' : 'py-2.5'} text-center text-muted`}>—</td>
                      )}
                      {columnVisibility.actions && (
                        <td className={`pe-4 ${density === 'compact' ? 'py-2' : 'py-2.5'} text-end text-muted extra-small`}>
                          <span>Live Operations</span>
                        </td>
                      )}
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Table Pagination & Item Counts Bar */}
              {totalRecords > 0 && (
                <div className="p-3 border-top bg-light-subtle d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3">
                  {/* Left: Showing entries info & Page Size Selector */}
                  <div className="d-flex align-items-center gap-2 text-secondary extra-small flex-wrap">
                    <span>
                      Showing{' '}
                      <strong className="text-dark">
                        {isAllPages ? 1 : Math.min((currentPage - 1) * effectivePageSize + 1, totalRecords)}
                      </strong>{' '}
                      to{' '}
                      <strong className="text-dark">
                        {isAllPages ? totalRecords : Math.min(currentPage * effectivePageSize, totalRecords)}
                      </strong>{' '}
                      of <strong className="text-dark">{totalRecords}</strong> customer accounts
                    </span>

                    <div className="d-flex align-items-center gap-1 ms-sm-2">
                      <span>Rows:</span>
                      <select
                        className="form-select form-select-sm py-0.5 px-2 rounded-2 border bg-white extra-small"
                        style={{ width: '70px', height: '26px' }}
                        value={pageSize}
                        onChange={(e) => {
                          const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                          setPageSize(val);
                        }}
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value="all">All</option>
                      </select>
                    </div>
                  </div>

                  {/* Right: Pagination buttons */}
                  {!isAllPages && totalPages > 1 && (
                    <div className="d-flex align-items-center gap-1">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary py-1 px-2 rounded-2 extra-small"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        title="Previous Page"
                      >
                        <ChevronLeft size={14} />
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                        .reduce((acc, p, idx, arr) => {
                          if (idx > 0 && p - arr[idx - 1] > 1) {
                            acc.push('ellipsis-' + p);
                          }
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((item) => {
                          if (typeof item === 'string') {
                            return (
                              <span key={item} className="px-1 text-muted extra-small">
                                &hellip;
                              </span>
                            );
                          }
                          return (
                            <button
                              key={item}
                              type="button"
                              className={`btn btn-sm rounded-2 extra-small px-2.5 py-1 ${
                                currentPage === item
                                  ? 'btn-primary fw-bold text-white shadow-xs'
                                  : 'btn-outline-secondary border-0 text-dark hover-bg-light'
                              }`}
                              onClick={() => setCurrentPage(item)}
                            >
                              {item}
                            </button>
                          );
                        })}

                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary py-1 px-2 rounded-2 extra-small"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        title="Next Page"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ========================================================== */}
      {/* 1. WALLET ADVANCE DEPOSIT MODAL                             */}
      {/* ========================================================== */}
      {showDepositModal && (
        <div className="modal fade show d-block modal-backdrop-animated" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1060 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-dialog-animated" style={{ maxWidth: '520px' }}>
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden modal-content-animated">
              <div className="modal-header bg-dark text-white py-3 px-4 d-flex align-items-center justify-content-between">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2 m-0 fs-6">
                  <ArrowDownLeft size={18} className="text-success" />
                  Deposit Advance to Customer Wallet
                </h5>
                <button type="button" className="btn-close btn-close-white shadow-none" onClick={() => setShowDepositModal(false)}></button>
              </div>

              <form onSubmit={handleExecuteDeposit}>
                <div className="modal-body p-4 bg-white">
                  {depositError && (
                    <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2">
                      <AlertTriangle size={16} className="text-danger flex-shrink-0" />
                      <div>{depositError}</div>
                    </div>
                  )}

                  {/* Customer Selector / Readonly Display */}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark mb-1">Customer / Guest Account *</label>
                    {selectedCustForDeposit ? (
                      <div className="p-3 bg-light rounded-3 border d-flex align-items-center justify-content-between">
                        <div>
                          <strong className="text-dark small d-block">{selectedCustForDeposit.full_name}</strong>
                          <span className="text-secondary extra-small">Phone: {selectedCustForDeposit.mobile}</span>
                          <span className="text-muted extra-small ms-2">
                            (Current Credit: {formatCurrency(selectedCustForDeposit.total_available_credit || selectedCustForDeposit.advance_credit || 0)})
                          </span>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-link text-danger p-0 extra-small fw-semibold text-decoration-none"
                          onClick={() => setSelectedCustForDeposit(null)}
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <div className="position-relative">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Type guest name or phone number..."
                          value={customerSearchQuery}
                          onChange={(e) => setCustomerSearchQuery(e.target.value)}
                          required
                        />
                        {searchingCustomers && (
                          <div className="position-absolute end-0 top-50 translate-middle-y me-3 text-muted extra-small">
                            Searching...
                          </div>
                        )}
                        {customerSearchResults.length > 0 && (
                          <div className="position-absolute w-100 bg-white border rounded-3 shadow-lg mt-1 overflow-hidden" style={{ zIndex: 10 }}>
                            {customerSearchResults.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                className="dropdown-item py-2 px-3 border-bottom text-start d-flex justify-content-between align-items-center"
                                onClick={() => {
                                  setSelectedCustForDeposit({
                                    id: c.id,
                                    full_name: `${c.first_name} ${c.last_name || ''}`.trim(),
                                    mobile: c.mobile,
                                    advance_credit: parseFloat(c.advance_credit || 0),
                                    total_available_credit: parseFloat(c.total_wallet_credit || c.advance_credit || 0)
                                  });
                                  setCustomerSearchQuery('');
                                  setCustomerSearchResults([]);
                                }}
                              >
                                <div>
                                  <strong className="d-block small text-dark">{c.first_name} {c.last_name}</strong>
                                  <span className="extra-small text-muted">{c.mobile}</span>
                                </div>
                                <span className="badge bg-success-subtle text-success extra-small">
                                  Adv: ₹{parseFloat(c.advance_credit || 0).toFixed(2)}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Deposit Amount */}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark mb-1">Deposit Amount (₹) *</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light text-success fw-bold">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        className="form-control form-control-lg fw-bold text-success"
                        required
                        placeholder="0.00"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Payment Method & Reference */}
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-dark mb-1">Payment Method *</label>
                      <select
                        className="form-select"
                        value={depositMethod}
                        onChange={(e) => setDepositMethod(e.target.value)}
                      >
                        <option value="CASH">Cash</option>
                        <option value="UPI">UPI / GPay / PhonePe</option>
                        <option value="CARD">Debit / Credit Card</option>
                        <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-dark mb-1">Transaction Ref / URN</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. UPI Ref / Cash Receipt"
                        value={depositRef}
                        onChange={(e) => setDepositRef(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Direct Wallet Deposit Switch */}
                  <div className="p-3 bg-light rounded-3 border mb-3">
                    <div className="form-check form-switch m-0 d-flex align-items-center justify-content-between">
                      <div>
                        <label className="form-check-label fw-bold text-dark small" htmlFor="directDepositSwitch">
                          Direct Wallet Credit
                        </label>
                        <span className="text-secondary extra-small d-block">
                          Store 100% of this deposit in the customer's wallet without auto-clearing past stays.
                        </span>
                      </div>
                      <input
                        className="form-check-input ms-3"
                        type="checkbox"
                        role="switch"
                        id="directDepositSwitch"
                        checked={directDepositOnly}
                        onChange={(e) => setDirectDepositOnly(e.target.checked)}
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="mb-2">
                    <label className="form-label small fw-semibold text-dark mb-1">Notes / Remarks</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="e.g. Advance deposit for upcoming stay / banquet reservation"
                      value={depositNotes}
                      onChange={(e) => setDepositNotes(e.target.value)}
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer bg-light border-top px-4 py-3 d-flex justify-content-between align-items-center">
                  <button type="button" className="btn btn-light border fw-semibold px-4" onClick={() => setShowDepositModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success fw-bold px-4 shadow-sm text-white d-flex align-items-center gap-2"
                    disabled={depositSubmitting}
                  >
                    {depositSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        Processing Deposit...
                      </>
                    ) : (
                      <>
                        <ArrowDownLeft size={16} /> Confirm &amp; Credit Wallet
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 2. WALLET REFUND / RETURN MODAL                             */}
      {/* ========================================================== */}
      {showRefundModal && selectedCustForRefund && (
        <div className="modal fade show d-block modal-backdrop-animated" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1060 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-dialog-animated" style={{ maxWidth: '520px' }}>
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden modal-content-animated">
              <div className="modal-header bg-warning text-dark py-3 px-4 d-flex align-items-center justify-content-between">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2 m-0 fs-6">
                  <RotateCcw size={18} />
                  Return / Refund Wallet Credit
                </h5>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowRefundModal(false)}></button>
              </div>

              <form onSubmit={handleExecuteRefund}>
                <div className="modal-body p-4 bg-white">
                  {refundError && (
                    <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2">
                      <AlertTriangle size={16} className="text-danger flex-shrink-0" />
                      <div>{refundError}</div>
                    </div>
                  )}

                  {/* Customer Info Card */}
                  <div className="bg-light p-3 rounded-3 border mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="text-muted small">Guest Name:</span>
                      <strong className="text-dark">{selectedCustForRefund.full_name}</strong>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="text-muted small">Contact Mobile:</span>
                      <span className="text-dark small">{selectedCustForRefund.mobile}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                      <span className="text-dark small fw-bold">Available Wallet Credit:</span>
                      <strong className="fs-5 text-success">
                        {formatCurrency(selectedCustForRefund.total_available_credit)}
                      </strong>
                    </div>
                  </div>

                  {/* Refund Amount */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label small fw-semibold text-dark mb-0">Refund Amount (₹) *</label>
                      <button
                        type="button"
                        className="btn btn-link p-0 text-primary extra-small text-decoration-none fw-bold"
                        onClick={() => setRefundAmount(selectedCustForRefund.total_available_credit.toFixed(2))}
                      >
                        Refund Entire Balance ({formatCurrency(selectedCustForRefund.total_available_credit)})
                      </button>
                    </div>
                    <div className="input-group">
                      <span className="input-group-text bg-light text-danger fw-bold">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={selectedCustForRefund.total_available_credit}
                        className="form-control form-control-lg fw-bold text-danger"
                        required
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <span className="text-muted extra-small mt-1 d-block">
                      This will be recorded as a debit refund transaction in the guest wallet and shift cash log.
                    </span>
                  </div>

                  {/* Refund Method & Reference */}
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-dark mb-1">Refund Method *</label>
                      <select
                        className="form-select"
                        value={refundMethod}
                        onChange={(e) => setRefundMethod(e.target.value)}
                      >
                        <option value="CASH">Cash</option>
                        <option value="UPI">UPI / GPay / PhonePe</option>
                        <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                        <option value="CARD">Card Reversal</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-dark mb-1">Voucher / Txn Ref</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Cash Voucher / UPI Ref"
                        value={refundRef}
                        onChange={(e) => setRefundRef(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="mb-2">
                    <label className="form-label small fw-semibold text-dark mb-1">Notes / Remarks</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="e.g. Returned remaining advance balance on guest request"
                      value={refundNotes}
                      onChange={(e) => setRefundNotes(e.target.value)}
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer bg-light border-top px-4 py-3 d-flex justify-content-between align-items-center">
                  <button type="button" className="btn btn-light border fw-semibold px-4" onClick={() => setShowRefundModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-warning fw-bold px-4 shadow-sm text-dark d-flex align-items-center gap-2"
                    disabled={refundSubmitting}
                  >
                    {refundSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        Processing Refund...
                      </>
                    ) : (
                      <>
                        <RotateCcw size={16} /> Confirm &amp; Debit Wallet
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 3. TRANSACTION LEDGER & WALLET STATEMENT MODAL             */}
      {/* ========================================================== */}
      {showLedgerModal && selectedCustForLedger && (
        <div className="modal fade show d-block modal-backdrop-animated" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', zIndex: 1070 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-xl modal-dialog-animated">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden modal-content-animated" id="printable-wallet-statement">
              <div className="modal-header bg-dark text-white py-3 px-4 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <FileText size={18} className="text-primary" />
                  <div>
                    <h6 className="m-0 fw-bold">Customer Wallet Statement &amp; Transaction Ledger</h6>
                    <span className="text-muted extra-small">
                      Guest: {selectedCustForLedger.full_name} &bull; {selectedCustForLedger.mobile}
                    </span>
                  </div>
                </div>

                {/* Statement Modal Actions: Excel, PDF, Print, Close */}
                <div className="d-flex align-items-center gap-2">
                  {/* Export Excel */}
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-success d-flex align-items-center gap-1 py-1 px-2.5 extra-small fw-semibold text-white border-success"
                    onClick={() => exportTransactionsToExcel(ledgerData?.transactions || [], selectedCustForLedger)}
                    disabled={!ledgerData?.transactions || ledgerData.transactions.length === 0}
                    title="Download Excel spreadsheet of this guest's transactions"
                  >
                    <FileSpreadsheet size={13} />
                    <span>Excel</span>
                  </button>

                  {/* Export PDF Audit Report */}
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-info d-flex align-items-center gap-1 py-1 px-2.5 extra-small fw-semibold text-white border-info"
                    onClick={() => exportTransactionsToPDF(ledgerData?.transactions || [], selectedCustForLedger, {}, 'landscape')}
                    disabled={!ledgerData?.transactions || ledgerData.transactions.length === 0}
                    title="Export formatted PDF audit report"
                  >
                    <Download size={13} />
                    <span>PDF</span>
                  </button>

                  {/* Print Quick */}
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-light d-flex align-items-center gap-1 py-1 px-2.5 extra-small fw-semibold"
                    onClick={() => exportTransactionsToPDF(ledgerData?.transactions || [], selectedCustForLedger, {}, 'portrait')}
                    disabled={!ledgerData?.transactions || ledgerData.transactions.length === 0}
                    title="Print customer statement"
                  >
                    <Printer size={13} />
                    <span>Print</span>
                  </button>

                  <button type="button" className="btn-close btn-close-white shadow-none ms-1" onClick={() => setShowLedgerModal(false)}></button>
                </div>
              </div>

              <div className="modal-body p-4 bg-white" style={{ maxHeight: '78vh', overflowY: 'auto' }}>
                {loadingLedger ? (
                  <div className="py-5 text-center">
                    <PageLoader fullScreen={false} message="Fetching transaction ledger records..." />
                  </div>
                ) : (
                  <>
                    {/* Header Financial Overview */}
                    <div className="row g-3 mb-4">
                      <div className="col-md-4">
                        <div className="p-3 bg-light rounded-3 border">
                          <span className="text-secondary extra-small text-uppercase fw-semibold d-block mb-1">
                            Available Wallet Balance
                          </span>
                          <h4 className="fw-bold text-success m-0">
                            {formatCurrency(selectedCustForLedger.total_available_credit)}
                          </h4>
                          <span className="text-muted extra-small">Funds ready for stay payment or refund</span>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="p-3 bg-light rounded-3 border">
                          <span className="text-secondary extra-small text-uppercase fw-semibold d-block mb-1">
                            Pending Stay Dues
                          </span>
                          <h4 className="fw-bold text-danger m-0">
                            {formatCurrency(selectedCustForLedger.pending_dues)}
                          </h4>
                          <span className="text-muted extra-small">Unpaid accommodation charges</span>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="p-3 bg-light rounded-3 border">
                          <span className="text-secondary extra-small text-uppercase fw-semibold d-block mb-1">
                            Net Position
                          </span>
                          <h4 className={`fw-bold m-0 ${selectedCustForLedger.net_balance >= 0 ? 'text-primary' : 'text-danger'}`}>
                            {formatCurrency(selectedCustForLedger.net_balance)}
                          </h4>
                          <span className="text-muted extra-small">
                            {selectedCustForLedger.net_balance >= 0 ? 'Customer Credit' : 'Payment Required'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Transaction History Table */}
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="fw-bold text-dark m-0">Chronological Ledger Entries</h6>
                      <span className="text-muted extra-small">
                        {ledgerData?.transactions?.length || 0} transaction(s) recorded
                      </span>
                    </div>

                    {(!ledgerData?.transactions || ledgerData.transactions.length === 0) ? (
                      <div className="p-4 bg-light rounded-3 text-center text-muted small">
                        No transactions recorded on this customer profile yet.
                      </div>
                    ) : (
                      <div className="table-responsive border rounded-3 overflow-hidden">
                        <table className="table table-hover align-middle m-0">
                          <thead className="table-light text-secondary extra-small text-uppercase fw-bold">
                            <tr>
                              <th className="ps-3 py-2.5">Date &amp; Time</th>
                              <th className="py-2.5">Payment #</th>
                              <th className="py-2.5">Type / Stay</th>
                              <th className="py-2.5">Method</th>
                              <th className="py-2.5">Reference</th>
                              <th className="py-2.5 text-end">Amount</th>
                              <th className="py-2.5">Staff</th>
                              <th className="pe-3 py-2.5">Notes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ledgerData.transactions.map((t) => {
                              const numAmt = parseFloat(t.amount || 0);
                              const isNegative = numAmt < 0;

                              return (
                                <tr key={t.id || t.payment_number}>
                                  <td className="ps-3 small text-muted">
                                    {new Date(t.payment_date).toLocaleString('en-IN', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      hour12: true
                                    })}
                                  </td>
                                  <td className="fw-bold text-dark small">{t.payment_number}</td>
                                  <td>
                                    {t.stay_id ? (
                                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill extra-small">
                                        Stay #{t.stay_number} (Room {t.room_number})
                                      </span>
                                    ) : isNegative ? (
                                      <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill extra-small d-inline-flex align-items-center gap-1">
                                        <RotateCcw size={11} /> Wallet Debit / Refund
                                      </span>
                                    ) : (
                                      <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill extra-small d-inline-flex align-items-center gap-1">
                                        <Wallet size={11} /> Wallet Deposit / Credit
                                      </span>
                                    )}
                                  </td>
                                  <td>
                                    <span className="badge bg-light text-dark border rounded-pill extra-small">
                                      {t.payment_method}
                                    </span>
                                  </td>
                                  <td className="extra-small text-muted font-monospace">{t.transaction_reference || '—'}</td>
                                  <td className={`text-end fw-bold fs-6 ${isNegative ? 'text-danger' : 'text-success'}`}>
                                    {isNegative ? `-₹${Math.abs(numAmt).toFixed(2)}` : `+₹${numAmt.toFixed(2)}`}
                                  </td>
                                  <td className="extra-small text-dark fw-semibold">{t.received_by || 'System'}</td>
                                  <td className="pe-3 extra-small text-secondary">{t.notes || '—'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="modal-footer bg-light border-top px-4 py-3 d-flex justify-content-between align-items-center">
                <span className="text-muted extra-small">
                  All transactions are logged with Shift ID and user audit trail.
                </span>
                <button type="button" className="btn btn-secondary fw-semibold px-4" onClick={() => setShowLedgerModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallets;
