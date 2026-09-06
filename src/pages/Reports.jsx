import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  Receipt,
  Users,
  BedDouble,
  CreditCard,
  Percent,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Search,
  Filter,
  Download,
  Printer,
  Eye,
  ChevronRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  TrendingUp,
  ShoppingBag,
  History,
  ShieldCheck,
  Sparkles,
  ArrowUpDown,
  RefreshCw,
  SlidersHorizontal,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Moon,
  BarChart3,
  PieChart as PieIcon,
  Table as TableIcon,
  Sliders,
  HelpCircle,
  LayoutGrid,
  FileSpreadsheet,
  ArrowRight,
  UserCheck,
  LogIn,
  LogOut,
  Wallet,
  ReceiptText
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

import { getReportDataApi, getReportFilterOptionsApi } from '../api/reportApi';
import { formatCurrency } from '../utils/formatCurrency';
import {
  exportShiftDossierToPDF,
  exportShiftDossierToExcel,
  exportGenericReportToPDF
} from '../utils/exportUtils';
import { exportReportToExcel } from '../utils/reportExportUtils';
import { generateShiftThermalHtml, printThermalContent } from '../utils/thermalPrinter';
import ReportPreviewModal from '../components/ReportPreviewModal';
import ReportDetailDrawer from '../components/ReportDetailDrawer';
import NightAuditModal from '../components/NightAuditModal';
import ReportExportModal from '../components/ReportExportModal';
import ShiftReconciliationReportView from '../components/ShiftReconciliationReportView';
import PageLoader from '../components/PageLoader';
import SearchableShiftSelect from '../components/SearchableShiftSelect';
import { useAuth } from '../context/AuthContext';

// ============================================================================
// 9 REPORT CATEGORIES CONFIGURATION & DEFINITIONS
// ============================================================================
const REPORT_CATEGORIES = [
  {
    id: 'shift_audit',
    name: 'Shift & Cashier Audits',
    icon: Clock,
    color: '#4F46E5',
    bgLight: '#EEF2FF',
    gradient: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
    priorityBadge: '🔥 Most Used',
    domainBadge: 'Daily Handover',
    isFeatured: true,
    description: 'Completed shift Z-Reports, itemized collections, arrivals & departures per shift, cashier accuracy, and cash drawer till balancing.',
    reports: [
      { id: 'shift_dossier', name: 'Completed Shift Activity Dossier (Z-Report)', desc: 'All activities completed during a shift: collections, check-ins, check-outs, petty cash expenses, denominations, and till balancing' },
      { id: 'cashier_discrepancies', name: 'Cashier Reconciliation & Accuracy', desc: 'Accuracy rate, shortage/excess rankings, and staff till accountability' },
      { id: 'variance_trend', name: 'Daily Till Variance Ledger', desc: 'Day-by-day cash discrepancy ledger with short/excess analysis' },
      { id: 'petty_cash_analytics', name: 'Petty Cash Disbursements', desc: 'Shift expense categorization and emergency cash spending' },
    ]
  },
  {
    id: 'stay_guest',
    name: 'Stay & Front Desk Operations',
    icon: Building2,
    color: '#2563EB',
    bgLight: '#EFF6FF',
    gradient: 'linear-gradient(135deg, #2563EB 0%, #0284C7 100%)',
    priorityBadge: '⭐ Daily Essential',
    domainBadge: 'Front Desk',
    isFeatured: true,
    description: 'Guest check-ins, check-outs, active stays, overdue folios, statutory guest registers, and police Form C.',
    reports: [
      { id: 'current_stays', name: 'Current Active Stays', desc: 'Guests currently residing in the lodge' },
      { id: 'checkin_report', name: 'Check-In Report', desc: 'Arrivals timeline and guest check-in audits' },
      { id: 'checkout_report', name: 'Check-Out Report', desc: 'Departures, settled folios, and room handovers' },
      { id: 'stay_history', name: 'Stay History Report', desc: 'Complete historical stay timeline and billing' },
      { id: 'overdue_stays', name: 'Overdue Stays', desc: 'Stays exceeding scheduled expected departure' },
      { id: 'guest_register', name: 'Statutory Guest Register', desc: 'Chronological guest record for verification' },
      { id: 'police_gazette', name: 'Police Gazette & Form C', desc: 'Statutory register formatted for local police & tourism authorities' },
    ]
  },
  {
    id: 'revenue_payments',
    name: 'Revenue & Finance',
    icon: DollarSign,
    color: '#059669',
    bgLight: '#ECFDF5',
    gradient: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
    priorityBadge: '💰 Core Accounts',
    domainBadge: 'Financials',
    isFeatured: true,
    description: 'Daily revenue accruals, cash & digital payment ledgers, shift handovers, and unsettled folio balances.',
    reports: [
      { id: 'daily_revenue', name: 'Daily Revenue & Accruals', desc: 'Day-by-day revenue, discounts, GST, and collections' },
      { id: 'payment_collections', name: 'Payment Collections Audit', desc: 'All receipts across Cash, UPI, Cards, Bank Transfers' },
      { id: 'shift_handover', name: 'Cash Drawer Handover Ledger', desc: 'Cash drawer till reconciliation, collections vs returns' },
      { id: 'pending_payments', name: 'Pending Balances & Folios', desc: 'Active & completed stays with balance due' },
      { id: 'revenue_summary', name: 'Financial Revenue Summary', desc: 'Comprehensive income statement breakdown' },
    ]
  },
  {
    id: 'rooms',
    name: 'Rooms & Occupancy',
    icon: BedDouble,
    color: '#0D9488',
    bgLight: '#F0FDFA',
    gradient: 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)',
    priorityBadge: '📊 Asset Health',
    domainBadge: 'Occupancy',
    isFeatured: false,
    description: 'Room-by-room utilization, night occupancy rates, tariff revenue, ADR, and 30-day forecast.',
    reports: [
      { id: 'room_performance', name: 'Room Performance & Revenue', desc: 'Room-wise stays, occupied nights, and tariff earnings' },
      { id: 'room_usage', name: 'Room Usage & Occupancy', desc: 'Occupancy percentages and room turnaround metrics' },
      { id: 'occupancy_forecast', name: '30-Day Occupancy & Revenue Forecast', desc: 'Predictive 30-day projection based on confirmed reservations & demand' },
      { id: 'room_revenue', name: 'Room Revenue Comparison', desc: 'Tariff vs extra service revenue per room' },
    ]
  },
  {
    id: 'gst_tax',
    name: 'GST & Compliance',
    icon: Receipt,
    color: '#D97706',
    bgLight: '#FFFBEB',
    gradient: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
    priorityBadge: '🏛️ Statutory',
    domainBadge: 'Tax Filings',
    isFeatured: false,
    description: 'Taxable supplies, CGST (50%), SGST (50%) outputs, invoice tax ledgers, and GST filing data.',
    reports: [
      { id: 'gst_summary', name: 'GST Output Summary', desc: 'Taxable values, CGST, SGST, and grand totals' },
      { id: 'gst_by_invoice', name: 'GST by Invoice / Stay', desc: 'Invoice-level statutory tax breakdown and GSTINs' },
      { id: 'gst_by_date', name: 'Daily GST Ledger', desc: 'Day-wise statutory tax collection accruals' },
    ]
  },
  {
    id: 'bookings',
    name: 'Bookings & Pipeline',
    icon: Calendar,
    color: '#7C3AED',
    bgLight: '#F5F3FF',
    gradient: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
    priorityBadge: '📅 Reservations',
    domainBadge: 'Pipeline',
    isFeatured: false,
    description: 'Advance reservations, upcoming check-ins, channel sources, and reservation history.',
    reports: [
      { id: 'booking_summary', name: 'Booking Summary', desc: 'Status distribution and advance booking overview' },
      { id: 'upcoming_bookings', name: 'Upcoming Bookings', desc: 'Future scheduled arrivals and reservation roster' },
      { id: 'booking_history', name: 'Booking History', desc: 'All reservations with advance paid and timeline' },
      { id: 'booking_source', name: 'Booking Source Report', desc: 'Walk-ins vs online/advance reservation channels' },
      { id: 'cancelled_bookings', name: 'Cancelled Bookings', desc: 'Cancelled reservations and refund tracking' },
      { id: 'noshow_bookings', name: 'No-Show Bookings', desc: 'Unclaimed bookings and penalty audits' },
    ]
  },
  {
    id: 'extra_charges',
    name: 'Extra Services & POS',
    icon: ShoppingBag,
    color: '#0891B2',
    bgLight: '#ECFEFF',
    gradient: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)',
    priorityBadge: '☕ Add-On Sales',
    domainBadge: 'Room Services',
    isFeatured: false,
    description: 'Food & beverage, laundry, extra bed, transport, and ancillary service revenue.',
    reports: [
      { id: 'extra_charges_summary', name: 'Extra Services Summary', desc: 'Total quantities, unit prices, and revenue earned' },
      { id: 'category_charges', name: 'Category-wise Services', desc: 'Service breakdown by Food, Laundry, Bedding, etc.' },
      { id: 'charges_by_stay', name: 'Extra Charges by Stay', desc: 'Room service and add-on charges billed per stay' },
    ]
  },
  {
    id: 'customers',
    name: 'Customers & CRM',
    icon: Users,
    color: '#2563EB',
    bgLight: '#EFF6FF',
    gradient: 'linear-gradient(135deg, #2563EB 0%, #60A5FA 100%)',
    priorityBadge: '👥 Guest CRM',
    domainBadge: 'Loyalty',
    isFeatured: false,
    description: 'Guest directory, visit frequencies, top spenders, customer tiers, and loyalty analytics.',
    reports: [
      { id: 'customer_directory', name: 'Customer Directory', desc: 'All registered guests with total stays and spend' },
      { id: 'frequent_guests', name: 'Frequent Guests & Spenders', desc: 'Top returning guests ranked by visits and revenue' },
      { id: 'guest_history', name: 'Guest Visit History', desc: 'Customer visit timelines and room preferences' },
    ]
  },
  {
    id: 'cancellations',
    name: 'Cancellations & Risk',
    icon: XCircle,
    color: '#E11D48',
    bgLight: '#FFF1F2',
    gradient: 'linear-gradient(135deg, #E11D48 0%, #F43F5E 100%)',
    priorityBadge: '⚠️ Risk Analysis',
    domainBadge: 'Loss Audits',
    isFeatured: false,
    description: 'Cancelled bookings, no-shows, cancellation reasons, and estimated lost revenue.',
    reports: [
      { id: 'cancelled_bookings', name: 'Cancelled Reservations', desc: 'Cancellation dates, reasons, and advance refunds' },
      { id: 'noshow_bookings', name: 'No-Show Bookings', desc: 'Unattended reservations and deposit handling' },
      { id: 'cancellation_reasons', name: 'Lost Revenue Analysis', desc: 'Estimated revenue loss and reason breakdown' },
    ]
  }
];

// Date Presets
const DATE_PRESETS = [
  { id: 'today', label: 'Today' },
  { id: 'last_7_days', label: '7D' },
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: 'this_fy', label: 'This FY' },
  { id: 'all', label: 'All Time' },
  { id: 'custom', label: 'Custom' },
];

const Reports = () => {
  const { hasPermission, isShiftWise } = useAuth();
  const canViewRevenue = hasPermission('reports', 'can_view_revenue');
  const canViewPoliceGazette = hasPermission('reports', 'can_view_police_gazette');
  const canExportExcel = hasPermission('reports', 'can_export_excel');
  const canRunNightAudit = hasPermission('night_audit', 'can_run_night_audit');

  const availableCategories = useMemo(() => {
    return REPORT_CATEGORIES.filter(cat => {
      // If hotel is in Single Owner mode, completely hide shift_audit category
      if (!isShiftWise && cat.id === 'shift_audit') return false;
      if (!canViewRevenue && (cat.id === 'revenue_payments' || cat.id === 'gst_tax')) return false;
      return true;
    }).map(cat => {
      let filteredReports = [...cat.reports];
      // In Single Owner mode, hide shift_handover from revenue reports
      if (!isShiftWise) {
        filteredReports = filteredReports.filter(r => r.id !== 'shift_handover');
      }
      if (!canViewPoliceGazette) {
        filteredReports = filteredReports.filter(r => r.id !== 'police_gazette');
      }
      if (!canViewRevenue) {
        filteredReports = filteredReports.filter(r => !['daily_revenue', 'payment_collections', 'revenue_summary', 'room_revenue'].includes(r.id));
      }
      return { ...cat, reports: filteredReports };
    });
  }, [canViewRevenue, canViewPoliceGazette, isShiftWise]);

  // Two-Tier Navigation Mode: 'catalog' (Grid Launcher) vs 'report' (Focused Dashboard)
  const [viewMode, setViewMode] = useState('catalog');

  // Navigation State: default to stay_guest if Single Owner
  const [selectedCategory, setSelectedCategory] = useState(() => (isShiftWise ? 'shift_audit' : 'stay_guest'));
  const [selectedReport, setSelectedReport] = useState(() => (isShiftWise ? 'shift_dossier' : 'current_stays'));
  const [selectedShiftId, setSelectedShiftId] = useState('');

  useEffect(() => {
    if (!isShiftWise && selectedCategory === 'shift_audit') {
      setSelectedCategory('stay_guest');
      setSelectedReport('current_stays');
    }
  }, [isShiftWise, selectedCategory]);

  // Catalog Filters
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState('all');

  // Report Workspace Filters
  const [period, setPeriod] = useState('this_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [roomId, setRoomId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Visual Controls
  const [showChart, setShowChart] = useState(true);
  const [shiftActivityTab, setShiftActivityTab] = useState('payments');

  // Table Interaction States
  const [tableSearch, setTableSearch] = useState('');
  const [sortColumn, setSortColumn] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [hiddenColumns, setHiddenColumns] = useState({});
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  // Data & Modals States
  const [filterOptions, setFilterOptions] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDrawerRow, setSelectedDrawerRow] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showNightAuditModal, setShowNightAuditModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Load Dropdown Metadata on Mount
  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      const data = await getReportFilterOptionsApi();
      setFilterOptions(data);
      if (data?.shifts && data.shifts.length > 0 && !selectedShiftId) {
        setSelectedShiftId(data.shifts[0].id);
      }
    } catch (err) {
      console.error('Error loading filter options:', err);
    }
  };

  const fetchReportData = async (catId, repId, sId) => {
    setLoading(true);
    setError('');
    try {
      const activeCat = catId || selectedCategory;
      const activeRep = repId || selectedReport;
      const activeShift = sId !== undefined ? sId : selectedShiftId;

      const params = {
        category: activeCat,
        report_id: activeRep,
        shift_id: activeShift || undefined,
        period,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        room_id: roomId || undefined,
        payment_method: paymentMethod || undefined,
        search: searchQuery || undefined,
      };

      const data = await getReportDataApi(params);
      setReportData(data);
      setCurrentPage(1);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Failed to generate report analytics. Please check filters and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Launch report from catalog
  const handleLaunchReport = (catId, repId, sId) => {
    const targetCat = catId || selectedCategory;
    const targetRep = repId || selectedReport;
    setSelectedCategory(targetCat);
    setSelectedReport(targetRep);
    if (sId !== undefined) setSelectedShiftId(sId);
    setViewMode('report');
    fetchReportData(targetCat, targetRep, sId !== undefined ? sId : selectedShiftId);
  };

  // Switch sub-report within the active category
  const handleSelectSubReport = (repId) => {
    setSelectedReport(repId);
    fetchReportData(selectedCategory, repId, selectedShiftId);
  };

  // Re-fetch when shift selection changes
  const handleShiftChange = (sId) => {
    setSelectedShiftId(sId);
    fetchReportData(selectedCategory, selectedReport, sId);
  };

  // Apply filters in workspace
  const handleApplyFilters = () => {
    fetchReportData(selectedCategory, selectedReport, selectedShiftId);
  };

  const handleResetFilters = () => {
    setPeriod('this_month');
    setStartDate('');
    setEndDate('');
    setRoomId('');
    setPaymentMethod('');
    setSearchQuery('');
    setTableSearch('');
  };

  const handleSort = (colKey) => {
    if (sortColumn === colKey) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(colKey);
      setSortDirection('asc');
    }
  };

  const toggleColumnVisibility = (key) => {
    setHiddenColumns(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const visibleColumns = useMemo(() => {
    if (!reportData || !reportData.columns) return [];
    return reportData.columns.filter(c => !hiddenColumns[c.key]);
  }, [reportData, hiddenColumns]);

  const filteredAndSortedRows = useMemo(() => {
    if (!reportData || !reportData.rows) return [];
    let list = [...reportData.rows];

    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      list = list.filter(row => {
        return Object.values(row).some(val =>
          val !== null && val !== undefined && String(val).toLowerCase().includes(q)
        );
      });
    }

    if (sortColumn) {
      list.sort((a, b) => {
        let valA = a[sortColumn];
        let valB = b[sortColumn];

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }

        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      });
    }

    return list;
  }, [reportData, tableSearch, sortColumn, sortDirection]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedRows.slice(start, start + pageSize);
  }, [filteredAndSortedRows, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredAndSortedRows.length / pageSize) || 1;
  const currentCategoryObj = availableCategories.find(c => c.id === selectedCategory) || availableCategories[0] || REPORT_CATEGORIES[0];

  // Filter categories for the Catalog view
  const filteredCatalogCategories = useMemo(() => {
    let list = availableCategories;
    if (catalogCategoryFilter !== 'all') {
      list = list.filter(c => c.id === catalogCategoryFilter);
    }
    if (catalogSearch.trim()) {
      const q = catalogSearch.toLowerCase();
      list = list.filter(c => {
        const matchName = c.name.toLowerCase().includes(q);
        const matchDesc = c.description.toLowerCase().includes(q);
        const matchReports = c.reports.some(r => r.name.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q));
        return matchName || matchDesc || matchReports;
      });
    }
    return list;
  }, [availableCategories, catalogCategoryFilter, catalogSearch]);

  // Export handlers
  const handleExportPDF = () => {
    if (selectedReport === 'shift_dossier' && reportData?.shift_info) {
      exportShiftDossierToPDF(reportData.shift_info, filterOptions?.lodge_info);
    } else {
      exportGenericReportToPDF(reportData, filterOptions?.lodge_info, { hiddenColumns });
    }
  };

  const handleExportExcel = () => {
    if (selectedReport === 'shift_dossier' && reportData?.shift_info) {
      exportShiftDossierToExcel(reportData.shift_info, filterOptions?.lodge_info);
    } else {
      exportReportToExcel(reportData, { date_label: reportData?.date_label }, filterOptions?.lodge_info, { hiddenColumns });
    }
  };

  const handlePrintReport = () => {
    if (selectedReport === 'shift_dossier' && reportData?.shift_info) {
      exportShiftDossierToPDF(reportData.shift_info, filterOptions?.lodge_info, { action: 'print' });
    } else {
      exportGenericReportToPDF(reportData, filterOptions?.lodge_info, { hiddenColumns, action: 'print' });
    }
  };

  const handlePrintThermalSlip = () => {
    if (reportData?.shift_info) {
      const html = generateShiftThermalHtml(reportData.shift_info, filterOptions?.lodge_info);
      printThermalContent(html, `Shift_${reportData.shift_info.shift_number}`);
    }
  };

  return (
    <div className="reports-redesigned-container pb-5" style={{ minHeight: '100vh' }}>
      
      {/* ===================================================================== */}
      {/* TOP SLEEK AUDIT HEADER                                                */}
      {/* ===================================================================== */}
      <div
        className="rounded-4 p-3.5 mb-4 text-white shadow-sm d-flex align-items-center justify-content-between flex-wrap gap-3"
        style={{
          background: 'linear-gradient(135deg, #09204c 0%, #10377c 50%, #1a4d9e 100%)',
          border: '1px solid rgba(255, 255, 255, 0.12)'
        }}
      >
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center shadow-sm"
            style={{
              width: '44px',
              height: '44px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.28)',
              color: '#FFFFFF'
            }}
          >
            <BarChart3 size={22} style={{ color: '#FFFFFF' }} />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h4 className="fw-bold m-0 text-white" style={{ letterSpacing: '-0.02em', fontSize: '1.25rem' }}>
                LMS Reports &amp; Business Intelligence Hub
              </h4>
              <span
                className="badge rounded-pill px-2.5 py-1 extra-small fw-bold d-inline-flex align-items-center gap-1.5"
                style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.28)',
                  color: '#93C5FD',
                  border: '1px solid rgba(147, 197, 253, 0.45)'
                }}
              >
                <span className="rounded-circle" style={{ width: 6, height: 6, backgroundColor: '#60A5FA' }} />
                Live Audit
              </span>
            </div>
            <span className="text-white text-opacity-75 extra-small" style={{ letterSpacing: '0.02em' }}>
              EXECUTIVE OPERATIONS &bull; SHIFT DOSSIERS &bull; STATUTORY REGISTERS
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="d-flex align-items-center gap-2">
          {viewMode === 'report' && (
            <button
              type="button"
              className="btn btn-sm fw-bold py-1.5 px-3 rounded-3 shadow-sm d-flex align-items-center gap-1.5 transition-all"
              style={{
                backgroundColor: '#FFFFFF',
                color: '#1E40AF',
                border: '1px solid #BFDBFE'
              }}
              onClick={() => setViewMode('catalog')}
            >
              <LayoutGrid size={14} /> All Report Grids
            </button>
          )}
          {canRunNightAudit && (
            <button
              type="button"
              className="btn btn-sm fw-bold py-1.5 px-3.5 rounded-3 shadow-sm d-flex align-items-center gap-1.5"
              style={{
                backgroundColor: '#F59E0B',
                color: '#0F172A',
                border: 'none'
              }}
              onClick={() => setShowNightAuditModal(true)}
            >
              <Moon size={14} /> Run Night Audit
            </button>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TIER 1: REPORT CATALOG GRID LAUNCHER (CLEAN, UNCLUTTERED HUB)        */}
      {/* ===================================================================== */}
      {viewMode === 'catalog' ? (
        <div className="reports-catalog-view">
          
          {/* 1. DEDICATED PROMINENT SHIFT-WISE ACTIVITY DOSSIER LAUNCHER CARD */}
          {isShiftWise && (
            <div
              className="card border-0 rounded-4 shadow-sm mb-4 p-4 text-white position-relative"
              style={{
                background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                overflow: 'visible',
                zIndex: 10
              }}
            >
              <div className="row align-items-center g-3">
                <div className="col-lg-7">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="badge bg-warning text-dark fw-bold px-2.5 py-1 rounded-pill extra-small">
                      High Priority Audit
                    </span>
                    <span
                      className="badge rounded-pill px-2.5 py-1 extra-small fw-bold"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        color: '#E0E7FF',
                        border: '1px solid rgba(255, 255, 255, 0.3)'
                      }}
                    >
                      Shift-wise Z-Report
                    </span>
                  </div>
                  <h4 className="fw-bold text-white mb-2" style={{ letterSpacing: '-0.02em' }}>
                    Completed Shift Activity Dossier &amp; Till Balancing
                  </h4>
                  <p className="text-white text-opacity-80 small mb-0" style={{ maxWidth: '640px', lineHeight: 1.5 }}>
                    Select any completed (or active) shift to inspect and export all activity that occurred during that shift window — cash &amp; digital collections, check-ins, check-outs, petty cash expenses, note denominations, and drawer till reconciliation.
                  </p>
                </div>

                <div className="col-lg-5">
                  <div
                    className="rounded-4 p-4 position-relative"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.22)',
                      backdropFilter: 'blur(8px)',
                      zIndex: 11
                    }}
                  >
                    <label className="form-label extra-small fw-bold text-white text-opacity-90 mb-2 text-uppercase d-flex align-items-center justify-content-between">
                      <span>Select Target Shift</span>
                      <span className="text-white text-opacity-65 fw-normal" style={{ fontSize: '11px' }}>Searchable</span>
                    </label>
                    
                    <div className="mb-3">
                      <SearchableShiftSelect
                        shifts={filterOptions?.shifts || []}
                        selectedShiftId={selectedShiftId}
                        onSelectShift={(id) => setSelectedShiftId(id)}
                        placeholder="Search by shift #, cashier, status..."
                        theme="dark"
                      />
                    </div>

                    <div className="d-flex align-items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        className="btn btn-sm btn-warning text-dark fw-bold w-100 py-2.5 rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-1.5 transition-all"
                        onClick={() => handleLaunchReport('shift_audit', 'shift_dossier', selectedShiftId)}
                      >
                        <Clock size={15} /> Launch Shift Activity Report <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. RESPONSIVE DOMAIN SHORTCUTS & CATALOG SEARCH (NO HORIZONTAL SCROLL) */}
          <div className="card border-0 rounded-4 shadow-sm bg-white p-3.5 mb-4">
            {/* Top Row: Title + Search Input */}
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-2.5">
              <div className="d-flex align-items-center gap-2.5">
                <div
                  className="rounded-3 p-1.5 d-flex align-items-center justify-content-center text-primary"
                  style={{ backgroundColor: '#EFF6FF', border: '1px solid #DBEAFE' }}
                >
                  <SlidersHorizontal size={17} />
                </div>
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <h6 className="fw-bold text-dark m-0 fs-6" style={{ letterSpacing: '-0.01em' }}>
                      Report Domain Shortcuts
                    </h6>
                    <span
                      className="badge rounded-pill px-2.5 py-0.5 extra-small fw-bold"
                      style={{ backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0' }}
                    >
                      {availableCategories.length} Domains
                    </span>
                  </div>
                  <span className="text-muted extra-small" style={{ fontSize: '11.5px' }}>
                    Click any shortcut to instantly filter cards below, or search across all reports
                  </span>
                </div>
              </div>

              {/* Instant Search Bar */}
              <div className="input-group input-group-sm" style={{ width: '100%', maxWidth: '320px' }}>
                <span className="input-group-text bg-light border-end-0 text-muted">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 bg-light extra-small"
                  placeholder="Quick search reports (e.g. shift, tax, check-in)..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  style={{ boxShadow: 'none' }}
                />
                {catalogSearch && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary border-start-0 bg-light extra-small px-2"
                    onClick={() => setCatalogSearch('')}
                  >
                    &times;
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Row: Fully Responsive Shortcuts Buttons (Flex-Wrap, No Horizontal Scroll) */}
            <div className="d-flex flex-wrap align-items-center gap-2 pt-2.5 border-top" style={{ borderColor: '#F1F5F9' }}>
              {/* All Domains Shortcut */}
              <button
                type="button"
                className={`btn btn-sm d-flex align-items-center gap-1.5 py-1.5 px-3 rounded-pill extra-small transition-all ${
                  catalogCategoryFilter === 'all'
                    ? 'btn-primary fw-bold shadow-sm'
                    : 'btn-light border text-secondary'
                }`}
                style={{
                  border: catalogCategoryFilter === 'all' ? '1px solid #1D4ED8' : '1px solid #E2E8F0',
                  fontWeight: catalogCategoryFilter === 'all' ? 700 : 500
                }}
                onClick={() => setCatalogCategoryFilter('all')}
              >
                <LayoutGrid size={13} />
                <span>All Domains</span>
                <span
                  className={`badge rounded-pill ms-1 extra-small px-1.5 py-0.2 ${
                    catalogCategoryFilter === 'all'
                      ? 'bg-white text-primary'
                      : 'bg-secondary bg-opacity-10 text-secondary'
                  }`}
                  style={{ fontSize: '10px' }}
                >
                  {availableCategories.length}
                </span>
              </button>

              {/* Individual Category Shortcut Buttons */}
              {availableCategories.map(cat => {
                const Icon = cat.icon;
                const isActive = catalogCategoryFilter === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    className="btn btn-sm d-flex align-items-center gap-1.5 py-1.5 px-3 rounded-pill extra-small transition-all"
                    style={{
                      backgroundColor: isActive ? cat.color : '#FFFFFF',
                      color: isActive ? '#FFFFFF' : '#334155',
                      border: isActive ? `1px solid ${cat.color}` : '1px solid #E2E8F0',
                      boxShadow: isActive ? `0 3px 10px ${cat.color}35` : '0 1px 2px rgba(0,0,0,0.03)',
                      fontWeight: isActive ? 700 : 500
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = cat.bgLight;
                        e.currentTarget.style.borderColor = `${cat.color}50`;
                        e.currentTarget.style.color = cat.color;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = '#FFFFFF';
                        e.currentTarget.style.borderColor = '#E2E8F0';
                        e.currentTarget.style.color = '#334155';
                      }
                    }}
                    onClick={() => setCatalogCategoryFilter(cat.id)}
                  >
                    <Icon
                      size={13}
                      style={{
                        color: isActive ? '#FFFFFF' : cat.color,
                        flexShrink: 0
                      }}
                    />
                    <span>{cat.name}</span>
                    <span
                      className="badge rounded-pill ms-1 extra-small px-1.5 py-0.2"
                      style={{
                        backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
                        color: isActive ? '#FFFFFF' : '#64748B',
                        fontSize: '10px'
                      }}
                    >
                      {cat.reports.length}
                    </span>
                  </button>
                );
              })}

              {/* Quick Reset Filter Button */}
              {catalogCategoryFilter !== 'all' && (
                <button
                  type="button"
                  className="btn btn-sm btn-link text-danger text-decoration-none extra-small fw-semibold py-1 px-2 d-flex align-items-center gap-1 ms-auto"
                  onClick={() => setCatalogCategoryFilter('all')}
                >
                  <span>&times; Reset Filter</span>
                </button>
              )}
            </div>
          </div>

          {/* 3. 9-GRID CATEGORY CARDS - NEXT-LEVEL SAAS ENTERPRISE DESIGN */}
          <div className="row g-4">
            {filteredCatalogCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div key={cat.id} className="col-md-6 col-xl-4">
                  <div
                    className="card report-grid-card h-100 d-flex flex-column justify-content-between p-4"
                    style={{
                      '--card-accent-color': cat.color,
                      borderColor: cat.isFeatured ? `${cat.color}40` : '#E2E8F0'
                    }}
                  >
                    {/* Top Aesthetic Accent Gradient Strip */}
                    <div
                      className="report-card-top-bar"
                      style={{ background: cat.gradient }}
                    />

                    <div>
                      {/* Card Header: Icon Box + Dual Badges */}
                      <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
                        <div
                          className="report-card-icon-box"
                          style={{
                            background: cat.bgLight,
                            color: cat.color,
                            border: `1px solid ${cat.color}25`
                          }}
                        >
                          <Icon size={24} />
                        </div>

                        <div className="d-flex flex-column align-items-end gap-1">
                          {cat.priorityBadge && (
                            <span
                              className="badge rounded-pill px-2.5 py-1 extra-small fw-bold"
                              style={{
                                background: cat.isFeatured ? `${cat.color}15` : '#F1F5F9',
                                color: cat.isFeatured ? cat.color : '#475569',
                                border: `1px solid ${cat.isFeatured ? `${cat.color}35` : '#CBD5E1'}`
                              }}
                            >
                              {cat.priorityBadge}
                            </span>
                          )}
                          <span
                            className="badge rounded-pill px-2 py-0.5 extra-small fw-semibold text-secondary"
                            style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
                          >
                            {cat.domainBadge || cat.badge}
                          </span>
                        </div>
                      </div>

                      {/* Card Title & Subtitle */}
                      <div className="mb-3">
                        <div className="d-flex align-items-center gap-2">
                          <h5 className="fw-bold text-dark m-0 fs-6" style={{ letterSpacing: '-0.015em' }}>
                            {cat.name}
                          </h5>
                          {cat.isFeatured && (
                            <span
                              className="badge extra-small px-1.5 py-0.5 rounded fw-semibold"
                              style={{ background: `${cat.color}15`, color: cat.color }}
                            >
                              Core
                            </span>
                          )}
                        </div>
                        <p
                          className="text-secondary extra-small mt-1.5 mb-0"
                          style={{ minHeight: '36px', lineHeight: 1.45 }}
                        >
                          {cat.description}
                        </p>
                      </div>

                      {/* Interactive Micro-List of Available Reports */}
                      <div className="report-micro-list mb-3.5">
                        <div className="d-flex align-items-center justify-content-between px-2 py-1 mb-1 border-bottom border-light pb-1">
                          <span className="extra-small fw-bold text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.04em', color: '#94A3B8' }}>
                            Included Reports ({cat.reports.length})
                          </span>
                          <span className="extra-small text-muted" style={{ fontSize: '10.5px' }}>
                            Click to launch
                          </span>
                        </div>

                        <div className="d-flex flex-column gap-1">
                          {cat.reports.slice(0, 4).map((rep) => (
                            <div
                              key={rep.id}
                              className="report-item-row"
                              onClick={() => handleLaunchReport(cat.id, rep.id)}
                              title={`${rep.name}: ${rep.desc}`}
                            >
                              <div className="d-flex align-items-center gap-2 overflow-hidden me-2">
                                <span
                                  className="report-dot"
                                  style={{ backgroundColor: cat.color }}
                                />
                                <span className="report-item-title text-truncate">
                                  {rep.name}
                                </span>
                              </div>
                              <ChevronRight size={13} className="report-item-chevron flex-shrink-0" />
                            </div>
                          ))}

                          {cat.reports.length > 4 && (
                            <div
                              className="report-item-row justify-content-center py-1.5 text-center"
                              onClick={() => handleLaunchReport(cat.id, cat.reports[4].id)}
                              style={{ background: 'rgba(255, 255, 255, 0.6)' }}
                            >
                              <span className="extra-small fw-bold" style={{ color: cat.color }}>
                                +{cat.reports.length - 4} more reports available &rarr;
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Full-width Category Action Button */}
                    <button
                      type="button"
                      className="btn report-card-action-btn w-100"
                      style={{
                        background: cat.bgLight,
                        color: cat.color,
                        border: `1.5px solid ${cat.color}35`
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = cat.color;
                        e.currentTarget.style.color = '#FFFFFF';
                        e.currentTarget.style.borderColor = cat.color;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = cat.bgLight;
                        e.currentTarget.style.color = cat.color;
                        e.currentTarget.style.borderColor = `${cat.color}35`;
                      }}
                      onClick={() => handleLaunchReport(cat.id, cat.reports[0].id)}
                    >
                      <span>Explore {cat.name}</span>
                      <ArrowRight size={15} className="arrow-icon" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      ) : (
        /* ===================================================================== */
        /* TIER 2: FOCUSED REPORT WORKSPACE (UNCLUTTERED, ELEGANT DASHBOARD)    */
        /* ===================================================================== */
        <div className="reports-workspace-view">
          
          {/* 1. TOP BREADCRUMB & REPORT SUB-TABS */}
          <div className="card border-0 shadow-sm rounded-4 bg-white p-3.5 mb-3">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 pb-2 border-bottom mb-2.5">
              
              {/* Back Button & Title */}
              <div className="d-flex align-items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  className="btn btn-sm btn-light border fw-bold text-primary py-1 px-3 rounded-pill extra-small d-flex align-items-center gap-1 hover-bg-light shadow-xs"
                  onClick={() => setViewMode('catalog')}
                >
                  <ArrowLeft size={13} /> Back to Catalog
                </button>
                <div className="d-flex align-items-center gap-2">
                  <span className="text-secondary extra-small">Domain:</span>
                  <span className="badge bg-primary-subtle text-primary fw-bold extra-small rounded-pill px-2.5 py-0.5">
                    {currentCategoryObj.name}
                  </span>
                  <span className="text-muted extra-small d-none d-md-inline">&bull;</span>
                  <h6 className="fw-bold text-dark m-0 fs-6">
                    {currentCategoryObj.reports.find(r => r.id === selectedReport)?.name || reportData?.title || 'Report Analytics'}
                  </h6>
                </div>
              </div>

              {/* Export Suite Actions */}
              <div className="d-flex align-items-center gap-1.5 flex-wrap">
                {selectedReport === 'shift_dossier' && reportData?.shift_info && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-dark py-1.5 px-2.5 rounded-3 extra-small fw-semibold d-flex align-items-center gap-1"
                    onClick={handlePrintThermalSlip}
                    title="Print 80mm POS thermal receipt slip"
                  >
                    <ReceiptText size={13} /> 80mm Thermal
                  </button>
                )}
                {canExportExcel && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-success py-1.5 px-2.5 rounded-3 extra-small fw-semibold d-flex align-items-center gap-1"
                    onClick={handleExportExcel}
                  >
                    <FileSpreadsheet size={13} /> Excel (.xls)
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-sm btn-primary py-1.5 px-3 rounded-3 extra-small fw-bold d-flex align-items-center gap-1.5 shadow-xs"
                  onClick={handleExportPDF}
                >
                  <Download size={13} /> Landscape PDF
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-light border py-1.5 px-2.5 rounded-3 extra-small fw-semibold d-flex align-items-center gap-1"
                  onClick={handlePrintReport}
                >
                  <Printer size={13} /> Print
                </button>
              </div>
            </div>

            {/* Sibling Sub-Report Tabs (Responsive wrap, no horizontal scroll) */}
            <div className="d-flex align-items-center flex-wrap gap-2 py-1">
              {currentCategoryObj.reports.map((rep) => {
                const isActive = selectedReport === rep.id;
                return (
                  <button
                    key={rep.id}
                    type="button"
                    className={`btn btn-sm ${
                      isActive
                        ? 'btn-primary text-white fw-bold shadow-xs'
                        : 'btn-light border text-secondary hover-bg-light'
                    } py-1 px-3 rounded-pill extra-small transition-all`}
                    onClick={() => handleSelectSubReport(rep.id)}
                  >
                    {rep.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. CONTEXT-AWARE HORIZONTAL FILTER BAR */}
          <div className="card border-0 shadow-sm rounded-4 bg-white p-3 mb-3 position-relative" style={{ zIndex: 10, overflow: 'visible' }}>
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2.5">
              
              {/* Shift Selector (if Shift Dossier active) OR Date Range Presets */}
              {selectedReport === 'shift_dossier' ? (
                <div className="d-flex align-items-center gap-2 flex-wrap" style={{ minWidth: '320px', maxWidth: '440px' }}>
                  <span className="extra-small fw-bold text-secondary text-uppercase text-nowrap">Target Shift:</span>
                  <div className="flex-grow-1">
                    <SearchableShiftSelect
                      shifts={filterOptions?.shifts || []}
                      selectedShiftId={selectedShiftId}
                      onSelectShift={(id) => handleShiftChange(id)}
                      placeholder="Search by shift #, cashier, status..."
                      theme="light"
                    />
                  </div>
                </div>
              ) : (
                <div className="d-flex align-items-center gap-1.5 flex-wrap">
                  <span className="extra-small fw-bold text-secondary text-uppercase me-1">Date:</span>
                  {DATE_PRESETS.map((dp) => (
                    <button
                      key={dp.id}
                      type="button"
                      className={`btn btn-xs ${period === dp.id ? 'btn-primary fw-bold shadow-xs' : 'btn-light border text-secondary'} py-1 px-2 rounded-2 extra-small`}
                      onClick={() => {
                        setPeriod(dp.id);
                        fetchReportData(selectedCategory, selectedReport, selectedShiftId);
                      }}
                    >
                      {dp.label}
                    </button>
                  ))}

                  {/* Custom Date Pickers */}
                  {period === 'custom' && (
                    <div className="d-flex align-items-center gap-1 ms-1">
                      <input
                        type="date"
                        className="form-control form-control-sm border bg-light extra-small py-0.5"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                      <span className="extra-small text-muted">to</span>
                      <input
                        type="date"
                        className="form-control form-control-sm border bg-light extra-small py-0.5"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn btn-xs btn-dark py-1 px-2 extra-small"
                        onClick={handleApplyFilters}
                      >
                        Apply
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Room / Method filters (if not shift dossier) & Search */}
              <div className="d-flex align-items-center gap-2 flex-wrap">
                {filterOptions?.rooms && selectedReport !== 'shift_dossier' && (
                  <select
                    className="form-select form-select-sm border bg-light extra-small"
                    style={{ width: '130px' }}
                    value={roomId}
                    onChange={(e) => {
                      setRoomId(e.target.value);
                      fetchReportData(selectedCategory, selectedReport, selectedShiftId);
                    }}
                  >
                    <option value="">All Rooms</option>
                    {filterOptions.rooms.map(r => (
                      <option key={r.id} value={r.id}>Room {r.room_number}</option>
                    ))}
                  </select>
                )}

                {/* Instant Search Bar */}
                <div className="input-group input-group-sm" style={{ width: '190px' }}>
                  <span className="input-group-text bg-light border-end-0">
                    <Search size={12} className="text-muted" />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 bg-light extra-small"
                    placeholder="Search records..."
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                  />
                </div>

                {/* Toggle Chart View */}
                <button
                  type="button"
                  className={`btn btn-sm ${showChart ? 'btn-light border text-primary fw-bold' : 'btn-light border text-secondary'} py-1 px-2.5 extra-small rounded-2`}
                  onClick={() => setShowChart(!showChart)}
                >
                  <BarChart3 size={13} className="me-1" /> {showChart ? 'Hide Chart' : 'Show Chart'}
                </button>
              </div>
            </div>
          </div>

          {/* 3. FOCUSED 4-KPI SUMMARY TILES (CONTEXT-TAILORED, NOT CROWDED!) */}
          <div className="row g-2.5 mb-3">
            {reportData?.kpis && reportData.kpis.slice(0, 4).map((kpi, idx) => {
              const displayVal = kpi.format === 'currency' ? formatCurrency(kpi.value) : kpi.value;
              const colorClass = kpi.color === 'success' ? 'border-success-subtle bg-success-subtle text-success'
                : kpi.color === 'danger' ? 'border-danger-subtle bg-danger-subtle text-danger'
                : kpi.color === 'warning' ? 'border-warning-subtle bg-warning-subtle text-warning'
                : 'border-primary-subtle bg-primary-subtle text-primary';

              return (
                <div key={idx} className="col-6 col-md-3">
                  <div className="card border-0 shadow-sm rounded-4 bg-white p-3 h-100 d-flex flex-column justify-content-between" style={{ border: '1px solid #E2E8F0' }}>
                    <div className="d-flex align-items-center justify-content-between mb-1.5">
                      <span className="text-secondary extra-small fw-bold text-uppercase" style={{ fontSize: '0.72rem' }}>
                        {kpi.label}
                      </span>
                      <span className={`badge ${colorClass} rounded-pill px-2 py-0.5 extra-small fw-bold`}>
                        {idx === 0 ? 'Float / Base' : idx === 1 ? 'Collections' : idx === 2 ? 'Expected' : 'Audit'}
                      </span>
                    </div>
                    <div>
                      <h4 className="fw-bold text-dark m-0 fs-5" style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                        {displayVal}
                      </h4>
                      {kpi.subtitle && (
                        <span className="text-muted extra-small d-block mt-0.5" style={{ fontSize: '0.7rem' }}>
                          {kpi.subtitle}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 4. OPTIONAL VISUAL ANALYSIS CHART (SINGLE CLEAN CHART WITH TOGGLE) */}
          {showChart && reportData?.chart_data && reportData.chart_data.length > 0 && (
            <div className="card border-0 shadow-sm rounded-4 bg-white p-3 mb-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center gap-1.5">
                  <TrendingUp size={14} className="text-primary" />
                  <h6 className="m-0 fw-bold text-dark fs-6">
                    {selectedReport === 'shift_dossier' ? 'Shift Financial Breakdown Flow' : 'Visual Trend & Activity Pattern'}
                  </h6>
                </div>
                <span className="text-muted extra-small">
                  Verified Audit Timeline
                </span>
              </div>
              <div style={{ height: '170px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  {selectedReport === 'shift_dossier' ? (
                    <BarChart data={reportData.chart_data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                      <YAxis tick={{ fontSize: 10 }} stroke="#94A3B8" tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                      <Tooltip formatter={(value) => [formatCurrency(value), 'Amount']} />
                      <Bar dataKey="amount" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  ) : (
                    <AreaChart data={reportData.chart_data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563EB" stopOpacity={0.35}/>
                          <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                      <YAxis tick={{ fontSize: 10 }} stroke="#94A3B8" tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                      <Tooltip formatter={(value) => [formatCurrency(value), '']} />
                      <Area type="monotone" dataKey="Revenue" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#chartGrad)" />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* 5. DEDICATED MULTI-TAB VIEW FOR SHIFT DOSSIER (SHIPWISE REPORT) */}
          {selectedReport === 'shift_dossier' && reportData?.shift_info ? (
            <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden mb-4">
              
              {/* Shift Activity Tabs (Responsive wrap, no horizontal scroll) */}
              <div className="card-header bg-white py-2.5 px-3.5 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div className="d-flex align-items-center flex-wrap gap-2">
                  <button
                    type="button"
                    className={`btn btn-sm ${shiftActivityTab === 'payments' ? 'btn-primary fw-bold shadow-xs' : 'btn-light border text-secondary'} py-1 px-3 rounded-pill extra-small d-flex align-items-center gap-1`}
                    onClick={() => setShiftActivityTab('payments')}
                  >
                    <DollarSign size={13} /> Shift Collections ({reportData.shift_info.payments?.length || 0})
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${shiftActivityTab === 'checkins' ? 'btn-primary fw-bold shadow-xs' : 'btn-light border text-secondary'} py-1 px-3 rounded-pill extra-small d-flex align-items-center gap-1`}
                    onClick={() => setShiftActivityTab('checkins')}
                  >
                    <LogIn size={13} /> Check-Ins ({reportData.shift_info.checkins?.length || 0})
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${shiftActivityTab === 'checkouts' ? 'btn-primary fw-bold shadow-xs' : 'btn-light border text-secondary'} py-1 px-3 rounded-pill extra-small d-flex align-items-center gap-1`}
                    onClick={() => setShiftActivityTab('checkouts')}
                  >
                    <LogOut size={13} /> Check-Outs ({reportData.shift_info.checkouts?.length || 0})
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${shiftActivityTab === 'expenses' ? 'btn-primary fw-bold shadow-xs' : 'btn-light border text-secondary'} py-1 px-3 rounded-pill extra-small d-flex align-items-center gap-1`}
                    onClick={() => setShiftActivityTab('expenses')}
                  >
                    <ShoppingBag size={13} /> Petty Cash ({reportData.shift_info.expenses?.length || 0})
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${shiftActivityTab === 'denominations' ? 'btn-primary fw-bold shadow-xs' : 'btn-light border text-secondary'} py-1 px-3 rounded-pill extra-small d-flex align-items-center gap-1`}
                    onClick={() => setShiftActivityTab('denominations')}
                  >
                    <CreditCard size={13} /> Cash Denominations
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${shiftActivityTab === 'handovers' ? 'btn-primary fw-bold shadow-xs' : 'btn-light border text-secondary'} py-1 px-3 rounded-pill extra-small d-flex align-items-center gap-1`}
                    onClick={() => setShiftActivityTab('handovers')}
                  >
                    <UserCheck size={13} /> Till Handovers &amp; Audit
                  </button>
                </div>

                <span className="extra-small text-muted d-none d-lg-inline">
                  Shift #{reportData.shift_info.shift_number} &bull; Cashier: {reportData.shift_info.cashier_name}
                </span>
              </div>

              {/* Sub-Tab 1: Shift Payments & Collections */}
              {shiftActivityTab === 'payments' && (
                <div className="table-responsive">
                  <table className="table table-hover align-middle m-0 extra-small">
                    <thead className="table-light">
                      <tr>
                        <th className="py-2.5 px-3">Time</th>
                        <th className="py-2.5 px-3">Receipt #</th>
                        <th className="py-2.5 px-3">Guest Name</th>
                        <th className="py-2.5 px-3 text-center">Room #</th>
                        <th className="py-2.5 px-3 text-center">Stay #</th>
                        <th className="py-2.5 px-3 text-center">Method</th>
                        <th className="py-2.5 px-3">Reference / UTR</th>
                        <th className="py-2.5 px-3 text-end">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.shift_info.payments?.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-4 text-muted">No collections recorded during this shift.</td>
                        </tr>
                      ) : (
                        reportData.shift_info.payments?.map((p, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-3">{p.time}</td>
                            <td className="py-2 px-3 fw-semibold text-primary">{p.payment_number}</td>
                            <td className="py-2 px-3 fw-medium text-dark">{p.guest_name}</td>
                            <td className="py-2 px-3 text-center"><span className="badge bg-light text-dark border">{p.room_number}</span></td>
                            <td className="py-2 px-3 text-center text-muted">{p.stay_number}</td>
                            <td className="py-2 px-3 text-center">
                              <span className={`badge ${p.method === 'CASH' ? 'bg-success-subtle text-success' : 'bg-primary-subtle text-primary'} px-2 py-0.5`}>
                                {p.payment_method_display || p.method}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-muted">{p.reference}</td>
                            <td className="py-2 px-3 text-end fw-bold text-dark">{formatCurrency(p.amount)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Sub-Tab 2: Shift Check-Ins */}
              {shiftActivityTab === 'checkins' && (
                <div className="table-responsive">
                  <table className="table table-hover align-middle m-0 extra-small">
                    <thead className="table-light">
                      <tr>
                        <th className="py-2.5 px-3">Time</th>
                        <th className="py-2.5 px-3">Stay #</th>
                        <th className="py-2.5 px-3">Guest Name</th>
                        <th className="py-2.5 px-3">Mobile</th>
                        <th className="py-2.5 px-3 text-center">Room #</th>
                        <th className="py-2.5 px-3">Room Type</th>
                        <th className="py-2.5 px-3 text-end">Tariff Rate</th>
                        <th className="py-2.5 px-3 text-end">Advance Paid</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.shift_info.checkins?.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-4 text-muted">No check-ins during this shift window.</td>
                        </tr>
                      ) : (
                        reportData.shift_info.checkins?.map((c, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-3">{c.check_in_time}</td>
                            <td className="py-2 px-3 fw-semibold text-primary">{c.stay_number}</td>
                            <td className="py-2 px-3 fw-medium text-dark">{c.guest_name}</td>
                            <td className="py-2 px-3 text-muted">{c.mobile}</td>
                            <td className="py-2 px-3 text-center"><span className="badge bg-light text-dark border">{c.room_number}</span></td>
                            <td className="py-2 px-3">{c.room_type}</td>
                            <td className="py-2 px-3 text-end">{formatCurrency(c.room_rate)}</td>
                            <td className="py-2 px-3 text-end fw-bold text-success">{formatCurrency(c.advance_paid)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Sub-Tab 3: Shift Check-Outs */}
              {shiftActivityTab === 'checkouts' && (
                <div className="table-responsive">
                  <table className="table table-hover align-middle m-0 extra-small">
                    <thead className="table-light">
                      <tr>
                        <th className="py-2.5 px-3">Checkout Time</th>
                        <th className="py-2.5 px-3">Stay #</th>
                        <th className="py-2.5 px-3">Guest Name</th>
                        <th className="py-2.5 px-3">Mobile</th>
                        <th className="py-2.5 px-3 text-center">Room #</th>
                        <th className="py-2.5 px-3 text-end">Settled Amount</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.shift_info.checkouts?.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-4 text-muted">No check-outs recorded during this shift.</td>
                        </tr>
                      ) : (
                        reportData.shift_info.checkouts?.map((c, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-3">{c.checkout_time}</td>
                            <td className="py-2 px-3 fw-semibold text-primary">{c.stay_number}</td>
                            <td className="py-2 px-3 fw-medium text-dark">{c.guest_name}</td>
                            <td className="py-2 px-3 text-muted">{c.mobile}</td>
                            <td className="py-2 px-3 text-center"><span className="badge bg-light text-dark border">{c.room_number}</span></td>
                            <td className="py-2 px-3 text-end fw-bold text-dark">{formatCurrency(c.settled_amount)}</td>
                            <td className="py-2 px-3 text-center"><span className="badge bg-primary-subtle text-primary px-2 py-0.5">CHECKED_OUT</span></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Sub-Tab 4: Petty Cash Expenses */}
              {shiftActivityTab === 'expenses' && (
                <div className="table-responsive">
                  <table className="table table-hover align-middle m-0 extra-small">
                    <thead className="table-light">
                      <tr>
                        <th className="py-2.5 px-3">Time</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3">Recorded By</th>
                        <th className="py-2.5 px-3">Approved By</th>
                        <th className="py-2.5 px-3 text-end">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.shift_info.expenses?.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-4 text-muted">No petty cash disbursements recorded in this shift.</td>
                        </tr>
                      ) : (
                        reportData.shift_info.expenses?.map((e, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-3">{e.time}</td>
                            <td className="py-2 px-3 fw-medium text-dark">{e.category_display || e.category}</td>
                            <td className="py-2 px-3">{e.description}</td>
                            <td className="py-2 px-3 text-muted">{e.created_by}</td>
                            <td className="py-2 px-3 text-muted">{e.approved_by}</td>
                            <td className="py-2 px-3 text-end fw-bold text-danger">{formatCurrency(e.amount)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Sub-Tab 5: Denominations */}
              {shiftActivityTab === 'denominations' && (
                <div className="p-3">
                  <div className="row g-2.5">
                    {reportData.shift_info.denominations?.map((d, idx) => (
                      <div key={idx} className="col-6 col-sm-4 col-md-3">
                        <div className="p-2.5 border rounded-3 bg-light d-flex align-items-center justify-content-between">
                          <div>
                            <span className="fw-bold text-dark d-block">₹{d.denomination}</span>
                            <span className="extra-small text-muted">{d.quantity} notes/coins</span>
                          </div>
                          <span className="fw-bold text-primary fs-6">{formatCurrency(d.total)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-Tab 6: Handovers & Audit */}
              {shiftActivityTab === 'handovers' && (
                <div className="p-3.5">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <h6 className="fw-bold text-dark fs-6 mb-2">Shift Handover Details</h6>
                      <p className="extra-small text-secondary mb-1">
                        <strong>Opened At:</strong> {reportData.shift_info.opened_at}
                      </p>
                      <p className="extra-small text-secondary mb-1">
                        <strong>Closed At:</strong> {reportData.shift_info.closed_at}
                      </p>
                      <p className="extra-small text-secondary mb-1">
                        <strong>Shift Duration:</strong> {reportData.shift_info.duration_display}
                      </p>
                      <p className="extra-small text-secondary mb-2">
                        <strong>Cash Drawer:</strong> {reportData.shift_info.drawer_name} ({reportData.shift_info.drawer_code})
                      </p>
                      {reportData.shift_info.opening_notes && (
                        <div className="p-2 rounded bg-light border extra-small mb-2">
                          <strong>Opening Notes:</strong> {reportData.shift_info.opening_notes}
                        </div>
                      )}
                      {reportData.shift_info.closing_notes && (
                        <div className="p-2 rounded bg-light border extra-small">
                          <strong>Closing Notes:</strong> {reportData.shift_info.closing_notes}
                        </div>
                      )}
                    </div>

                    <div className="col-md-6">
                      <h6 className="fw-bold text-dark fs-6 mb-2">Manager Approval &amp; Till Audit</h6>
                      <p className="extra-small text-secondary mb-1">
                        <strong>Approved By:</strong> {reportData.shift_info.manager_approved_by || 'Pending Manager Sign-Off'}
                      </p>
                      {reportData.shift_info.difference_reason && (
                        <div className="p-2 rounded bg-danger-subtle border border-danger-subtle extra-small text-danger mb-2">
                          <strong>Cash Discrepancy Reason:</strong> {reportData.shift_info.difference_reason}
                        </div>
                      )}
                      {reportData.shift_info.manager_approval_notes && (
                        <div className="p-2 rounded bg-light border extra-small">
                          <strong>Manager Notes:</strong> {reportData.shift_info.manager_approval_notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          ) : (
            /* 6. STANDARD AUDIT DATA TABLE (FOR GENERAL REPORTS) */
            <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden mb-4">
              
              {/* Table Header Strip */}
              <div className="card-header bg-white py-3 px-4 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2">
                  <h6 className="m-0 fw-bold text-dark fs-6">{reportData?.title || 'Data Records'} Table</h6>
                  <span className="badge bg-primary text-white rounded-pill px-2.5 py-0.5 extra-small fw-bold">
                    {filteredAndSortedRows.length} Rows
                  </span>
                  <span className="text-muted extra-small d-none d-md-inline">&bull; Click row to inspect deep dive</span>
                </div>

                {/* Table Options: Search, Columns, Page Size */}
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  {/* Column Customizer */}
                  <div className="position-relative">
                    <button
                      type="button"
                      className="btn btn-sm btn-light border py-1 px-2.5 extra-small fw-semibold rounded-2 d-flex align-items-center gap-1 hover-bg-light"
                      onClick={() => setShowColumnMenu(!showColumnMenu)}
                    >
                      <SlidersHorizontal size={12} /> Columns <ChevronDown size={11} />
                    </button>

                    {showColumnMenu && (
                      <div
                        className="position-absolute end-0 mt-1 bg-white border shadow-lg rounded-3 p-2.5 z-3"
                        style={{ minWidth: '200px', maxHeight: '280px', overflowY: 'auto' }}
                      >
                        <div className="fw-bold extra-small text-secondary text-uppercase mb-2 pb-1 border-bottom">
                          Toggle Columns
                        </div>
                        {reportData?.columns?.map((col) => (
                          <label key={col.key} className="form-check form-check-sm mb-1.5 d-flex align-items-center gap-2 cursor-pointer extra-small">
                            <input
                              type="checkbox"
                              className="form-check-input m-0"
                              checked={!hiddenColumns[col.key]}
                              onChange={() => toggleColumnVisibility(col.key)}
                            />
                            <span className="text-dark fw-medium">{col.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Page Size */}
                  <select
                    className="form-select form-select-sm extra-small"
                    style={{ width: '100px' }}
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value={10}>10 / page</option>
                    <option value={25}>25 / page</option>
                    <option value={50}>50 / page</option>
                    <option value={100}>100 / page</option>
                  </select>
                </div>
              </div>

              {/* Table Body */}
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle m-0 extra-small">
                    <thead className="table-light">
                      <tr>
                        {visibleColumns.map((col, idx) => (
                          <th
                            key={idx}
                            className={`text-${col.align || 'left'} py-2.5 px-3 text-nowrap fw-bold text-secondary ${col.sortable ? 'cursor-pointer hover-bg-light' : ''}`}
                            onClick={() => col.sortable && handleSort(col.key)}
                          >
                            <div className={`d-flex align-items-center gap-1 ${col.align === 'right' ? 'justify-content-end' : col.align === 'center' ? 'justify-content-center' : 'justify-content-start'}`}>
                              <span>{col.label}</span>
                              {col.sortable && (
                                <ArrowUpDown size={11} className={sortColumn === col.key ? 'text-primary' : 'text-muted opacity-40'} />
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRows.length === 0 ? (
                        <tr>
                          <td colSpan={visibleColumns.length || 5} className="text-center py-5 text-muted">
                            <FileText size={30} className="text-muted opacity-30 mb-2 d-block mx-auto" />
                            <div className="fw-semibold small">No records found matching current criteria</div>
                          </td>
                        </tr>
                      ) : (
                        <>
                          {paginatedRows.map((row, rIdx) => (
                            <tr
                              key={rIdx}
                              className="cursor-pointer hover-bg-light transition-all"
                              onClick={() => setSelectedDrawerRow(row)}
                              title="Click to inspect detailed folio"
                            >
                              {visibleColumns.map((col, cIdx) => {
                                const val = row[col.key];
                                let displayVal = val;
                                if (col.format === 'currency') {
                                  displayVal = formatCurrency(val);
                                } else if (val === null || val === undefined || val === '') {
                                  displayVal = '—';
                                }

                                return (
                                  <td key={cIdx} className={`text-${col.align || 'left'} py-2 px-3 text-nowrap`} style={{ fontVariantNumeric: 'tabular-nums' }}>
                                    {col.badgeStyle === 'status' ? (
                                      <span className={`badge ${
                                        val === 'CONFIRMED' || val === 'CHECKED_IN' || val === 'COLLECTION' || val === 'VIP Guest' || val === 'High' ? 'bg-success-subtle text-success border border-success-subtle' :
                                        val === 'CHECKED_OUT' || val === 'COMPLETED' || val === 'Frequent Guest' || val === 'Moderate' ? 'bg-primary-subtle text-primary border border-primary-subtle' :
                                        val === 'CANCELLED' || val === 'NO_SHOW' || val === 'REFUND' || val === 'Low' ? 'bg-danger-subtle text-danger border border-danger-subtle' :
                                        'bg-light text-dark border'
                                      } px-2 py-0.5 extra-small fw-bold`}>
                                        {val}
                                      </span>
                                    ) : (
                                      <span className={col.format === 'currency' ? 'fw-semibold text-dark' : ''}>
                                        {displayVal}
                                      </span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}

                          {/* GRAND TOTALS ROW */}
                          {filteredAndSortedRows.length > 0 && (
                            <tr className="table-light border-top border-2 border-dark fw-bold">
                              {visibleColumns.map((col, idx) => {
                                if (idx === 0) {
                                  return (
                                    <td key={idx} className="py-2.5 px-3 text-dark fw-bold text-uppercase" style={{ letterSpacing: '0.03em' }}>
                                      Grand Totals ({filteredAndSortedRows.length})
                                    </td>
                                  );
                                }

                                const isNumeric = col.format === 'currency' || col.key.includes('amount') || col.key.includes('total') || col.key.includes('revenue') || col.key.includes('nights') || col.key.includes('spend');
                                if (isNumeric) {
                                  const sum = filteredAndSortedRows.reduce((acc, r) => acc + (parseFloat(r[col.key]) || 0), 0);
                                  return (
                                    <td key={idx} className={`py-2.5 px-3 text-${col.align || 'left'} text-dark fw-bold`} style={{ fontVariantNumeric: 'tabular-nums' }}>
                                      {col.format === 'currency' ? formatCurrency(sum) : sum.toLocaleString('en-IN')}
                                    </td>
                                  );
                                }

                                return <td key={idx} className="py-2.5 px-3 text-muted">—</td>;
                              })}
                            </tr>
                          )}
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Table Pagination */}
              <div className="card-footer bg-white border-top py-2.5 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
                <span className="text-secondary extra-small">
                  Showing <strong>{filteredAndSortedRows.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> to <strong>{Math.min(currentPage * pageSize, filteredAndSortedRows.length)}</strong> of <strong>{filteredAndSortedRows.length}</strong> entries
                </span>

                {totalPages > 1 && (
                  <div className="d-flex align-items-center gap-1">
                    <button
                      type="button"
                      className="btn btn-xs btn-light border py-1 px-2 extra-small"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    >
                      Previous
                    </button>
                    <span className="extra-small px-2 text-secondary">
                      Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                    </span>
                    <button
                      type="button"
                      className="btn btn-xs btn-light border py-1 px-2 extra-small"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* SLIDE-OVER QUICK INSPECTION DRAWER */}
      <ReportDetailDrawer
        show={!!selectedDrawerRow}
        onClose={() => setSelectedDrawerRow(null)}
        rowData={selectedDrawerRow}
        reportCategory={selectedCategory}
      />

      {/* REPORT PREVIEW MODAL */}
      <ReportPreviewModal
        show={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        reportData={reportData}
        filterInfo={{ date_label: reportData?.date_label }}
        lodgeInfo={filterOptions?.lodge_info}
      />

      {/* NIGHT AUDIT MODAL */}
      <NightAuditModal
        show={showNightAuditModal}
        onClose={() => setShowNightAuditModal(false)}
      />

      {/* EXPORT OPTIONS MODAL */}
      <ReportExportModal
        show={showExportModal}
        onClose={() => setShowExportModal(false)}
        reportData={reportData}
        filterInfo={{ date_label: reportData?.date_label }}
        lodgeInfo={filterOptions?.lodge_info}
        hiddenColumns={hiddenColumns}
        onOpenPrintPreview={() => setShowPreviewModal(true)}
      />

    </div>
  );
};

export default Reports;
