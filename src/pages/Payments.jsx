import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPaymentsApi } from '../api/billingApi';
import { formatCurrency } from '../utils/formatCurrency';
import {
  exportPaymentsToPDF,
  exportPaymentsToExcel,
  exportPaymentsToCSV,
  printPaymentsReport
} from '../utils/exportUtils';
import { generatePaymentThermalReceipt, printThermalContent } from '../utils/thermalPrinter';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import PageLoader from '../components/PageLoader';
import {
  Receipt,
  Search,
  Filter,
  Calendar,
  Download,
  Printer,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  Copy,
  CreditCard,
  Wallet,
  TrendingUp,
  RotateCcw,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Building2,
  Tag,
  QrCode,
  Landmark,
  Banknote,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const Payments = () => {
  const { user, selectedProperty } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Core Data - Fetch payments with TanStack Query
  const {
    data: payments = [],
    isLoading: loading,
    refetch: loadPayments,
  } = useQuery({
    queryKey: ['payments', selectedProperty?.id],
    queryFn: async () => {
      try {
        const data = await getPaymentsApi();
        return Array.isArray(data) ? data : [];
      } catch (err) {
        console.error('Failed to load payment logs:', err);
        showError('Failed to load payment transaction history.');
        throw err;
      }
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'inflow', 'refund', 'cash', 'upi', 'card', 'wallet'
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [datePreset, setDatePreset] = useState('all'); // 'all', 'today', 'yesterday', '7days', 'this_month', 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Sorting State
  const [sortColumn, setSortColumn] = useState('payment_date');
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Column Visibility State
  const [showColMenu, setShowColMenu] = useState(false);
  const colMenuRef = useRef(null);
  const [visibleColumns, setVisibleColumns] = useState({
    index: true,
    payment_number: true,
    stay_number: true,
    room_number: true,
    customer_name: true,
    customer_mobile: true,
    payment_date: true,
    payment_method: true,
    transaction_reference: true,
    received_by_name: true,
    type: true,
    amount: true,
    actions: true
  });

  // Modal State
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [copiedPayId, setCopiedPayId] = useState(null);

  // Close column dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (colMenuRef.current && !colMenuRef.current.contains(e.target)) {
        setShowColMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // -------------------------------------------------------------
  // Filter & Search Logic
  // -------------------------------------------------------------
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const amt = parseFloat(p.amount || 0);

      // 1. Tab filter
      if (activeTab === 'inflow' && amt <= 0) return false;
      if (activeTab === 'refund' && amt >= 0) return false;
      if (activeTab === 'cash' && (p.payment_method || '').toUpperCase() !== 'CASH') return false;
      if (activeTab === 'upi' && (p.payment_method || '').toUpperCase() !== 'UPI') return false;
      if (activeTab === 'card' && !['CARD', 'BANK_TRANSFER'].includes((p.payment_method || '').toUpperCase())) return false;
      if (activeTab === 'wallet' && p.stay_number) return false; // direct wallet advance

      // 2. Method filter
      if (methodFilter !== 'ALL' && (p.payment_method || '').toUpperCase() !== methodFilter) {
        return false;
      }

      // 3. Date Preset & Custom Range
      if (datePreset !== 'all' && p.payment_date) {
        const pDate = new Date(p.payment_date);
        const now = new Date();

        if (datePreset === 'today') {
          if (pDate.toDateString() !== now.toDateString()) return false;
        } else if (datePreset === 'yesterday') {
          const yest = new Date(now);
          yest.setDate(now.getDate() - 1);
          if (pDate.toDateString() !== yest.toDateString()) return false;
        } else if (datePreset === '7days') {
          const sevenDaysAgo = new Date(now);
          sevenDaysAgo.setDate(now.getDate() - 7);
          sevenDaysAgo.setHours(0, 0, 0, 0);
          if (pDate < sevenDaysAgo || pDate > now) return false;
        } else if (datePreset === 'this_month') {
          if (pDate.getMonth() !== now.getMonth() || pDate.getFullYear() !== now.getFullYear()) {
            return false;
          }
        } else if (datePreset === 'custom') {
          if (customStartDate) {
            const start = new Date(customStartDate);
            start.setHours(0, 0, 0, 0);
            if (pDate < start) return false;
          }
          if (customEndDate) {
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999);
            if (pDate > end) return false;
          }
        }
      }

      // 4. Global Text Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const payNum = (p.payment_number || '').toLowerCase();
        const stayNum = (p.stay_number || '').toLowerCase();
        const guestName = (p.customer_name || '').toLowerCase();
        const mobile = (p.customer_mobile || '').toLowerCase();
        const room = String(p.room_number || '').toLowerCase();
        const ref = (p.transaction_reference || '').toLowerCase();
        const notes = (p.notes || '').toLowerCase();
        const staff = (p.received_by_name || '').toLowerCase();
        const method = (p.payment_method || '').toLowerCase();

        const matches =
          payNum.includes(query) ||
          stayNum.includes(query) ||
          guestName.includes(query) ||
          mobile.includes(query) ||
          room.includes(query) ||
          ref.includes(query) ||
          notes.includes(query) ||
          staff.includes(query) ||
          method.includes(query);

        if (!matches) return false;
      }

      return true;
    });
  }, [payments, activeTab, methodFilter, datePreset, customStartDate, customEndDate, searchQuery]);

  // -------------------------------------------------------------
  // Sorting Logic
  // -------------------------------------------------------------
  const sortedPayments = useMemo(() => {
    const list = [...filteredPayments];
    list.sort((a, b) => {
      let valA, valB;

      if (sortColumn === 'payment_date') {
        valA = new Date(a.payment_date || 0).getTime();
        valB = new Date(b.payment_date || 0).getTime();
      } else if (sortColumn === 'amount') {
        valA = parseFloat(a.amount || 0);
        valB = parseFloat(b.amount || 0);
      } else if (sortColumn === 'payment_number') {
        valA = (a.payment_number || '').toLowerCase();
        valB = (b.payment_number || '').toLowerCase();
      } else if (sortColumn === 'customer_name') {
        valA = (a.customer_name || '').toLowerCase();
        valB = (b.customer_name || '').toLowerCase();
      } else if (sortColumn === 'payment_method') {
        valA = (a.payment_method || '').toLowerCase();
        valB = (b.payment_method || '').toLowerCase();
      } else {
        valA = 0;
        valB = 0;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredPayments, sortColumn, sortDirection]);

  // -------------------------------------------------------------
  // Pagination Calculation
  // -------------------------------------------------------------
  const totalItems = sortedPayments.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const getPageNumbers = (current, total) => {
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 3) {
      return [1, 2, 3, 4, '...', total];
    }
    if (current >= total - 2) {
      return [1, '...', total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  const columnDefs = [
    { key: 'index', label: '# (Index)' },
    { key: 'payment_number', label: 'Payment #' },
    { key: 'stay_number', label: 'Stay Folio #' },
    { key: 'room_number', label: 'Room Number' },
    { key: 'customer_name', label: 'Guest Name' },
    { key: 'customer_mobile', label: 'Guest Mobile' },
    { key: 'payment_date', label: 'Date & Time' },
    { key: 'payment_method', label: 'Method' },
    { key: 'transaction_reference', label: 'Txn Ref / UTR' },
    { key: 'received_by_name', label: 'Received By Staff' },
    { key: 'type', label: 'Transaction Type' },
    { key: 'amount', label: 'Amount (INR)' }
  ];

  const paginatedPayments = useMemo(() => {
    return sortedPayments.slice(startIndex, endIndex);
  }, [sortedPayments, startIndex, endIndex]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, methodFilter, datePreset, customStartDate, customEndDate, pageSize]);

  const handleSort = (col) => {
    if (sortColumn === col) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  };

  // -------------------------------------------------------------
  // KPI Executive Dashboard Summary Calculations
  // -------------------------------------------------------------
  const summary = useMemo(() => {
    let totalCollections = 0;
    let totalRefunds = 0;
    let cashTotal = 0;
    let digitalTotal = 0;
    let collectionCount = 0;
    let refundCount = 0;

    filteredPayments.forEach((p) => {
      const amt = parseFloat(p.amount || 0);
      const method = (p.payment_method || '').toUpperCase();

      if (amt > 0) {
        totalCollections += amt;
        collectionCount++;
      } else if (amt < 0) {
        totalRefunds += Math.abs(amt);
        refundCount++;
      }

      if (method === 'CASH') {
        cashTotal += amt;
      } else {
        digitalTotal += amt;
      }
    });

    const netInflow = totalCollections - totalRefunds;

    return {
      totalCollections,
      totalRefunds,
      netInflow,
      cashTotal,
      digitalTotal,
      collectionCount,
      refundCount,
      totalCount: filteredPayments.length
    };
  }, [filteredPayments]);

  // -------------------------------------------------------------
  // Column Toggle Handler
  // -------------------------------------------------------------
  const toggleColumn = (colKey) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [colKey]: !prev[colKey]
    }));
  };

  const resetColumnVisibility = () => {
    setVisibleColumns({
      index: true,
      payment_number: true,
      stay_number: true,
      room_number: true,
      customer_name: true,
      customer_mobile: true,
      payment_date: true,
      payment_method: true,
      transaction_reference: true,
      received_by_name: true,
      type: true,
      amount: true,
      actions: true
    });
  };

  // -------------------------------------------------------------
  // Export Handlers
  // -------------------------------------------------------------
  const hotelInfo = {
    name: selectedProperty?.name || user?.property_name || 'LodgeMaster PMS',
    code: selectedProperty?.code || selectedProperty?.property_code || user?.property_code || ''
  };

  const filterMeta = {
    method: methodFilter !== 'ALL' ? methodFilter : 'All Methods',
    datePreset:
      datePreset === 'custom'
        ? `${customStartDate || 'Start'} to ${customEndDate || 'End'}`
        : datePreset.toUpperCase()
  };

  const handleExportPDF = () => {
    exportPaymentsToPDF(sortedPayments, summary, hotelInfo, filterMeta, { action: 'download' });
    showSuccess('Exporting Payment Transactions Log to PDF (Landscape)...');
  };

  const handlePrintPDF = () => {
    printPaymentsReport(sortedPayments, summary, hotelInfo, filterMeta);
  };

  const handleExportExcel = () => {
    exportPaymentsToExcel(sortedPayments, summary, hotelInfo, filterMeta);
    showSuccess('Exporting Payment Transactions Log to Excel (Landscape)...');
  };

  const handleExportCSV = () => {
    exportPaymentsToCSV(sortedPayments, summary, hotelInfo);
    showSuccess('Exporting Payment Transactions Log to CSV...');
  };

  // -------------------------------------------------------------
  // Thermal Slip Print Handler
  // -------------------------------------------------------------
  const handlePrintThermal = (payment) => {
    const settings = {
      lodge_name: selectedProperty?.name || user?.property_name || 'LODGE MANAGEMENT SYSTEM',
      address: selectedProperty?.address || selectedProperty?.city || '',
      phone: selectedProperty?.phone || '',
      gst_number: selectedProperty?.gst_number || ''
    };
    const html = generatePaymentThermalReceipt(
      payment,
      {
        stay_number: payment.stay_number,
        room_number: payment.room_number,
        primary_customer_name: payment.customer_name
      },
      settings,
      '80mm'
    );
    printThermalContent(html, `Payment_Receipt_${payment.payment_number || payment.id}`);
  };

  // -------------------------------------------------------------
  // Standard Voucher Print Handler (A5 / Letter)
  // -------------------------------------------------------------
  const handlePrintVoucher = (payment) => {
    const printWindow = window.open('', '_blank', 'width=820,height=800');
    if (!printWindow) {
      showError('Please allow popups to print vouchers.');
      return;
    }

    const hotelName = selectedProperty?.name || user?.property_name || 'LODGE MANAGEMENT SYSTEM';
    const hotelCode = selectedProperty?.code || selectedProperty?.property_code || '';
    const amt = parseFloat(payment.amount || 0);
    const isNeg = amt < 0;
    const payDate = payment.payment_date ? new Date(payment.payment_date).toLocaleString('en-IN') : new Date().toLocaleString('en-IN');

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment_Voucher_${payment.payment_number || payment.id}</title>
          <style>
            @page { size: A5 landscape; margin: 8mm; }
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #0F172A; margin: 0; padding: 16px; background: #FFF; }
            .voucher-card { border: 2px solid #E2E8F0; border-radius: 12px; padding: 20px; }
            .header-bar { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0F172A; padding-bottom: 12px; margin-bottom: 16px; }
            .hotel-title { font-size: 18px; font-weight: bold; text-transform: uppercase; color: #0F172A; }
            .hotel-sub { font-size: 11px; color: #64748B; font-weight: 500; }
            .badge-type { background: ${isNeg ? '#FEF2F2' : '#ECFDF5'}; color: ${isNeg ? '#DC2626' : '#059669'}; border: 1px solid ${isNeg ? '#FECACA' : '#A7F3D0'}; font-weight: bold; padding: 4px 10px; border-radius: 50px; font-size: 11px; }
            .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 12px; margin-bottom: 18px; }
            .meta-item { display: flex; justify-content: space-between; border-bottom: 1px dashed #E2E8F0; padding-bottom: 4px; }
            .meta-label { color: #64748B; font-weight: 500; }
            .meta-val { font-weight: 600; color: #0F172A; }
            .amount-box { border: 2px solid ${isNeg ? '#DC2626' : '#059669'}; background: ${isNeg ? '#FEF2F2' : '#ECFDF5'}; padding: 14px; text-align: center; border-radius: 10px; margin-bottom: 24px; }
            .amount-title { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: bold; color: #64748B; margin-bottom: 2px; }
            .amount-num { font-size: 26px; font-weight: bold; color: ${isNeg ? '#DC2626' : '#059669'}; }
            .signatures { display: flex; justify-content: space-between; margin-top: 35px; }
            .sig-line { border-top: 1px dashed #475569; width: 42%; text-align: center; font-size: 11px; color: #475569; padding-top: 5px; font-weight: 600; }
            .footer-notes { text-align: center; font-size: 9px; color: #94A3B8; margin-top: 16px; }
          </style>
        </head>
        <body>
          <div class="voucher-card">
            <div class="header-bar">
              <div>
                <div class="hotel-title">${hotelName}</div>
                <div class="hotel-sub">Property Code: ${hotelCode || 'HOTEL-PMS'} • Front Desk Cashier</div>
              </div>
              <div>
                <span class="badge-type">${isNeg ? 'DEBIT / REFUND VOUCHER' : 'OFFICIAL PAYMENT RECEIPT'}</span>
              </div>
            </div>

            <div class="meta-grid">
              <div class="meta-item">
                <span class="meta-label">Payment Voucher #:</span>
                <span class="meta-val">${payment.payment_number || `PAY-${payment.id}`}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Date & Time:</span>
                <span class="meta-val">${payDate}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Guest Full Name:</span>
                <span class="meta-val">${payment.customer_name || 'Walk-in Guest'}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Guest Contact:</span>
                <span class="meta-val">${payment.customer_mobile || '—'}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Stay / Folio #:</span>
                <span class="meta-val">${payment.stay_number || 'Direct Advance Deposit'}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Allocated Room:</span>
                <span class="meta-val">${payment.room_number ? `Room ${payment.room_number}` : '—'}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Payment Channel:</span>
                <span class="meta-val">${payment.payment_method || 'CASH'}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Txn Reference / UTR:</span>
                <span class="meta-val">${payment.transaction_reference || payment.notes || '—'}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Received By Staff:</span>
                <span class="meta-val">${payment.received_by_name || 'Front Desk'}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Linked Shift #:</span>
                <span class="meta-val">${payment.shift_number ? `Shift #${payment.shift_number}` : 'Till Cash'}</span>
              </div>
            </div>

            <div class="amount-box">
              <div class="amount-title">${isNeg ? 'Total Refund Amount Settled' : 'Total Payment Collected'}</div>
              <div class="amount-num">${isNeg ? '-₹' : '+₹'}${Math.abs(amt).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>

            <div class="signatures">
              <div class="sig-line">Guest Signature / Acknowledgment</div>
              <div class="sig-line">Authorized Cashier / Stamp</div>
            </div>

            <div class="footer-notes">
              This is a computer generated payment receipt issued by LodgeMaster PMS • Printed: ${new Date().toLocaleString('en-IN')}
            </div>
          </div>
        </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 350);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedPayId(id);
    setTimeout(() => setCopiedPayId(null), 2000);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setActiveTab('all');
    setMethodFilter('ALL');
    setDatePreset('all');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    activeTab !== 'all' ||
    methodFilter !== 'ALL' ||
    datePreset !== 'all';

  // Helper method badge
  const renderMethodBadge = (method) => {
    const m = (method || 'CASH').toUpperCase();
    if (m === 'CASH') {
      return (
        <span
          className="badge d-inline-flex align-items-center gap-1.5 fw-semibold px-2 py-1 rounded-pill"
          style={{ backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', fontSize: '0.725rem' }}
        >
          <Banknote size={12} /> Cash
        </span>
      );
    }
    if (m === 'UPI') {
      return (
        <span
          className="badge d-inline-flex align-items-center gap-1.5 fw-semibold px-2 py-1 rounded-pill"
          style={{ backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', fontSize: '0.725rem' }}
        >
          <QrCode size={12} /> UPI / QR
        </span>
      );
    }
    if (m === 'CARD') {
      return (
        <span
          className="badge d-inline-flex align-items-center gap-1.5 fw-semibold px-2 py-1 rounded-pill"
          style={{ backgroundColor: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE', fontSize: '0.725rem' }}
        >
          <CreditCard size={12} /> Card
        </span>
      );
    }
    if (m === 'BANK_TRANSFER') {
      return (
        <span
          className="badge d-inline-flex align-items-center gap-1.5 fw-semibold px-2 py-1 rounded-pill"
          style={{ backgroundColor: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A', fontSize: '0.725rem' }}
        >
          <Landmark size={12} /> Bank Txn
        </span>
      );
    }
    if (m === 'WALLET') {
      return (
        <span
          className="badge d-inline-flex align-items-center gap-1.5 fw-semibold px-2 py-1 rounded-pill"
          style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE', fontSize: '0.725rem' }}
        >
          <Wallet size={12} /> Wallet
        </span>
      );
    }
    return (
      <span
        className="badge d-inline-flex align-items-center gap-1 fw-semibold px-2 py-1 rounded-pill"
        style={{ backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0', fontSize: '0.725rem' }}
      >
        {m}
      </span>
    );
  };

  return (
    <div className="pb-5">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP HEADER & PRIMARY ACTION BUTTONS                        */}
      {/* ------------------------------------------------------------- */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h4 className="fw-bold m-0 text-dark tracking-tight">Payment Transactions Log</h4>
            <span
              className="badge rounded-pill fw-semibold font-monospace"
              style={{
                fontSize: '0.7rem',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                color: '#2563EB',
                border: '1px solid rgba(37, 99, 235, 0.25)'
              }}
            >
              Audit Trail
            </span>
          </div>
          <span className="text-muted small">
            Live chronological ledger of advance deposits, partial stay payments, and checkout settlements
          </span>
        </div>

        {/* Action Controls */}
        <div className="d-flex align-items-center gap-2 flex-wrap">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={loadPayments}
            disabled={loading}
            className="btn btn-white btn-sm border d-flex align-items-center gap-1.5 shadow-2xs text-secondary fw-semibold transition-all"
            style={{ borderRadius: '10px', height: '34px', borderColor: '#E2E8F0' }}
            title="Reload Transaction Logs"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span className="d-none d-sm-inline">Refresh</span>
          </button>

          {/* Print Report Button */}
          <button
            type="button"
            onClick={handlePrintPDF}
            className="btn btn-primary btn-sm d-flex align-items-center gap-1.5 shadow-xs fw-semibold transition-all"
            style={{ borderRadius: '10px', height: '34px' }}
            title="Open landscape report in print viewer"
          >
            <Printer size={14} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. SMALL DASHBOARD FOR OVERVIEW (4 EXECUTIVE KPI CARDS)        */}
      {/* ------------------------------------------------------------- */}
      <div className="row g-3 mb-4">
        {/* KPI 1: Gross Inflow / Collections */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="card border-0 shadow-xs h-100 position-relative overflow-hidden transition-all"
            style={{
              borderRadius: '16px',
              backgroundColor: '#FFFFFF',
              borderLeft: '4px solid #10B981',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.06)'
            }}
          >
            <div className="card-body p-3.5">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <span className="text-uppercase fw-bold text-muted" style={{ fontSize: '0.675rem', letterSpacing: '0.06em' }}>
                  Gross Collections
                </span>
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: '32px', height: '32px', backgroundColor: '#ECFDF5', color: '#059669' }}
                >
                  <ArrowDownLeft size={16} strokeWidth={2.4} />
                </div>
              </div>
              <div className="fw-bold text-success font-monospace mb-1" style={{ fontSize: '1.45rem', letterSpacing: '-0.02em' }}>
                +{formatCurrency(summary.totalCollections)}
              </div>
              <div className="d-flex align-items-center gap-1.5 text-muted" style={{ fontSize: '0.75rem' }}>
                <span className="badge rounded-pill bg-success-subtle text-success fw-bold px-1.5 py-0.5">
                  {summary.collectionCount} Inflows
                </span>
                <span>settled into registers</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 2: Total Refunds / Outflow */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="card border-0 shadow-xs h-100 position-relative overflow-hidden transition-all"
            style={{
              borderRadius: '16px',
              backgroundColor: '#FFFFFF',
              borderLeft: '4px solid #EF4444',
              boxShadow: '0 4px 20px rgba(239, 68, 68, 0.06)'
            }}
          >
            <div className="card-body p-3.5">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <span className="text-uppercase fw-bold text-muted" style={{ fontSize: '0.675rem', letterSpacing: '0.06em' }}>
                  Refunds & Debits
                </span>
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: '32px', height: '32px', backgroundColor: '#FEF2F2', color: '#DC2626' }}
                >
                  <ArrowUpRight size={16} strokeWidth={2.4} />
                </div>
              </div>
              <div className="fw-bold text-danger font-monospace mb-1" style={{ fontSize: '1.45rem', letterSpacing: '-0.02em' }}>
                -{formatCurrency(summary.totalRefunds)}
              </div>
              <div className="d-flex align-items-center gap-1.5 text-muted" style={{ fontSize: '0.75rem' }}>
                <span className="badge rounded-pill bg-danger-subtle text-danger fw-bold px-1.5 py-0.5">
                  {summary.refundCount} Refunds
                </span>
                <span>returned or reversed</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 3: Net Cash Inflow */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="card border-0 shadow-xs h-100 position-relative overflow-hidden transition-all"
            style={{
              borderRadius: '16px',
              backgroundColor: '#FFFFFF',
              borderLeft: '4px solid #2563EB',
              boxShadow: '0 4px 20px rgba(37, 99, 235, 0.06)'
            }}
          >
            <div className="card-body p-3.5">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <span className="text-uppercase fw-bold text-muted" style={{ fontSize: '0.675rem', letterSpacing: '0.06em' }}>
                  Net Cash Inflow
                </span>
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: '32px', height: '32px', backgroundColor: '#EFF6FF', color: '#2563EB' }}
                >
                  <TrendingUp size={16} strokeWidth={2.4} />
                </div>
              </div>
              <div
                className={`fw-bold font-monospace mb-1 ${summary.netInflow >= 0 ? 'text-primary' : 'text-danger'}`}
                style={{ fontSize: '1.45rem', letterSpacing: '-0.02em' }}
              >
                {formatCurrency(summary.netInflow)}
              </div>
              <div className="d-flex align-items-center gap-1.5 text-muted" style={{ fontSize: '0.75rem' }}>
                <span
                  className={`badge rounded-pill fw-bold px-1.5 py-0.5 ${
                    summary.netInflow >= 0 ? 'bg-primary-subtle text-primary' : 'bg-danger-subtle text-danger'
                  }`}
                >
                  {summary.netInflow >= 0 ? 'Net Positive' : 'Net Negative'}
                </span>
                <span>revenue retained</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 4: Channels & Record Count */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="card border-0 shadow-xs h-100 position-relative overflow-hidden transition-all"
            style={{
              borderRadius: '16px',
              backgroundColor: '#FFFFFF',
              borderLeft: '4px solid #8B5CF6',
              boxShadow: '0 4px 20px rgba(139, 92, 246, 0.06)'
            }}
          >
            <div className="card-body p-3.5">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <span className="text-uppercase fw-bold text-muted" style={{ fontSize: '0.675rem', letterSpacing: '0.06em' }}>
                  Payment Channels
                </span>
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: '32px', height: '32px', backgroundColor: '#F5F3FF', color: '#7C3AED' }}
                >
                  <Wallet size={16} strokeWidth={2.4} />
                </div>
              </div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="fw-bold text-dark font-monospace" style={{ fontSize: '1rem' }}>
                  💵 {formatCurrency(summary.cashTotal)}
                </span>
                <span className="text-muted">•</span>
                <span className="fw-bold text-primary font-monospace" style={{ fontSize: '1rem' }}>
                  📱 {formatCurrency(summary.digitalTotal)}
                </span>
              </div>
              <div className="d-flex align-items-center gap-1.5 text-muted" style={{ fontSize: '0.75rem' }}>
                <span className="badge rounded-pill fw-bold px-1.5 py-0.5" style={{ backgroundColor: '#F5F3FF', color: '#7C3AED' }}>
                  {summary.totalCount} Total Entries
                </span>
                <span>in filtered scope</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. FILTER TOOLBAR & QUICK SWITCH TABS                         */}
      {/* ------------------------------------------------------------- */}
      <div className="card border-0 shadow-xs rounded-4 mb-4 bg-white">
        <div className="card-body p-3">
          {/* Row 1: Quick Filter Tabs */}
          <div className="d-flex align-items-center gap-1.5 overflow-x-auto pb-2 mb-3 border-bottom no-scrollbar">
            {[
              { id: 'all', label: 'All Transactions', count: payments.length },
              {
                id: 'inflow',
                label: 'Collections (+)',
                count: payments.filter((p) => parseFloat(p.amount || 0) > 0).length
              },
              {
                id: 'refund',
                label: 'Refunds (-)',
                count: payments.filter((p) => parseFloat(p.amount || 0) < 0).length
              },
              {
                id: 'cash',
                label: 'Cash Only',
                count: payments.filter((p) => (p.payment_method || '').toUpperCase() === 'CASH').length
              },
              {
                id: 'upi',
                label: 'UPI / QR',
                count: payments.filter((p) => (p.payment_method || '').toUpperCase() === 'UPI').length
              },
              {
                id: 'card',
                label: 'Card & Bank',
                count: payments.filter((p) =>
                  ['CARD', 'BANK_TRANSFER'].includes((p.payment_method || '').toUpperCase())
                ).length
              },
              {
                id: 'wallet',
                label: 'Direct Wallet',
                count: payments.filter((p) => !p.stay_number).length
              }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`btn btn-sm d-inline-flex align-items-center gap-1.5 rounded-pill px-3 py-1 transition-all text-nowrap ${
                  activeTab === tab.id
                    ? 'btn-dark text-white fw-bold shadow-xs'
                    : 'btn-light text-secondary border hover-bg-light fw-medium'
                }`}
                style={{ fontSize: '0.785rem', borderColor: activeTab === tab.id ? 'transparent' : '#E2E8F0' }}
              >
                <span>{tab.label}</span>
                <span
                  className={`badge rounded-pill extra-small ${
                    activeTab === tab.id ? 'bg-white text-dark' : 'bg-slate-200 text-secondary'
                  }`}
                  style={{ fontSize: '0.65rem' }}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Row 2: Search, Method Dropdown & Date Picker */}
          <div className="row g-2 align-items-center">
            {/* Search Input */}
            <div className="col-12 col-md-4 col-lg-4">
              <div className="input-group input-group-sm rounded-3 overflow-hidden border" style={{ height: '34px' }}>
                <span className="input-group-text bg-white border-0 ps-2.5 pe-1 text-muted">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  className="form-control border-0 bg-white shadow-none ps-1 py-1"
                  style={{ fontSize: '0.8rem' }}
                  placeholder="Search Payment #, Stay #, Guest, Mobile, Room, UTR..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="btn btn-white border-0 text-muted px-2"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Payment Method Select */}
            <div className="col-6 col-md-2.5 col-lg-2">
              <select
                className="form-select form-select-sm rounded-3 border"
                style={{ height: '34px', fontSize: '0.785rem' }}
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
              >
                <option value="ALL">All Methods</option>
                <option value="CASH">💵 Cash</option>
                <option value="UPI">📱 UPI / QR</option>
                <option value="CARD">💳 Card</option>
                <option value="BANK_TRANSFER">🏦 Bank Txn</option>
                <option value="WALLET">👛 Wallet Credit</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Date Range Preset Select */}
            <div className="col-6 col-md-2.5 col-lg-2">
              <select
                className="form-select form-select-sm rounded-3 border"
                style={{ height: '34px', fontSize: '0.785rem' }}
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value)}
              >
                <option value="all">📅 All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="7days">Last 7 Days</option>
                <option value="this_month">This Month</option>
                <option value="custom">Custom Date Range...</option>
              </select>
            </div>

            {/* Custom Date Range Pickers (if selected) */}
            {datePreset === 'custom' && (
              <div className="col-12 col-md-6 col-lg-3 d-flex align-items-center gap-1.5 animate-fadeIn">
                <input
                  type="date"
                  className="form-control form-control-sm rounded-3 border"
                  style={{ height: '34px', fontSize: '0.75rem' }}
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  placeholder="From"
                  title="Start Date"
                />
                <span className="text-muted small">to</span>
                <input
                  type="date"
                  className="form-control form-control-sm rounded-3 border"
                  style={{ height: '34px', fontSize: '0.75rem' }}
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  placeholder="To"
                  title="End Date"
                />
              </div>
            )}

            {/* Clear Filters Button (conditional) */}
            {hasActiveFilters && (
              <div className="col-auto ms-auto">
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="btn btn-sm btn-link p-0 text-danger fw-semibold d-flex align-items-center gap-1 text-decoration-none"
                  style={{ fontSize: '0.775rem' }}
                >
                  <RotateCcw size={12} /> Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. ENHANCED TRANSACTIONS TABLE                                */}
      {/* ------------------------------------------------------------- */}
      {loading ? (
        <PageLoader fullScreen={false} message="Loading Transaction Ledger..." />
      ) : (
        <div className="card border-0 shadow-xs rounded-4 overflow-hidden bg-white">
          {/* Standardized Card Header: Page Size & Top-Right Action Controls */}
          <div className="card-header bg-white py-2.5 px-3 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2">
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

            <div className="d-flex align-items-center gap-2 ms-auto">
              <div className="dropdown position-relative" ref={colMenuRef}>
                <button
                  type="button"
                  className={`btn btn-sm ${showColMenu ? 'btn-secondary text-white' : 'btn-outline-secondary'} d-inline-flex align-items-center gap-1.5 fw-semibold shadow-2xs`}
                  style={{ height: '30px', fontSize: '0.785rem', borderRadius: '6px' }}
                  onClick={() => setShowColMenu(!showColMenu)}
                  title="Customize visible columns"
                >
                  <i className="bi bi-sliders2"></i>
                  <span>Columns</span>
                  <i className="bi bi-chevron-down" style={{ fontSize: '0.65rem' }}></i>
                </button>

                {showColMenu && (
                  <div
                    className="dropdown-menu dropdown-menu-end show p-2 shadow-lg border-0 rounded-3 mt-1"
                    style={{ minWidth: '220px', zIndex: 1060 }}
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
                    <div className="d-flex flex-column gap-1 pt-1" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                      {columnDefs.map((col) => (
                        <label
                          key={col.key}
                          className="dropdown-item d-flex align-items-center gap-2 py-1 px-2 rounded cursor-pointer small m-0"
                          style={{ cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                          <input
                            type="checkbox"
                            className="form-check-input m-0"
                            checked={visibleColumns[col.key]}
                            onChange={() => toggleColumn(col.key)}
                            style={{ cursor: 'pointer' }}
                          />
                          <span>{col.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleExportExcel}
                className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1.5 fw-semibold shadow-2xs"
                style={{ height: '30px', fontSize: '0.785rem', borderRadius: '6px' }}
                title="Export to Excel (.xls)"
              >
                <i className="bi bi-file-earmark-excel-fill text-success"></i>
                <span>Excel</span>
              </button>

              <button
                type="button"
                onClick={handleExportPDF}
                className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1.5 fw-semibold shadow-2xs"
                style={{ height: '30px', fontSize: '0.785rem', borderRadius: '6px' }}
                title="Export to PDF Report"
              >
                <i className="bi bi-file-earmark-pdf-fill text-danger"></i>
                <span>PDF</span>
              </button>
            </div>
          </div>

          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle m-0" style={{ fontSize: '0.825rem' }}>
                <thead className="table-light border-bottom">
                  <tr>
                    {visibleColumns.index && (
                      <th className="text-muted fw-bold ps-3 py-3" style={{ width: '40px' }}>
                        #
                      </th>
                    )}

                    {visibleColumns.payment_number && (
                      <th
                        className="fw-bold text-dark cursor-pointer select-none py-3"
                        onClick={() => handleSort('payment_number')}
                        title="Sort by Payment Number"
                        style={{ minWidth: '160px' }}
                      >
                        <div className="d-flex align-items-center gap-1">
                          <span>Payment #</span>
                          {sortColumn === 'payment_number' ? (
                            sortDirection === 'asc' ? <ArrowUp size={13} className="text-primary" /> : <ArrowDown size={13} className="text-primary" />
                          ) : (
                            <ArrowUpDown size={12} className="text-muted opacity-50" />
                          )}
                        </div>
                      </th>
                    )}

                    {visibleColumns.stay_number && (
                      <th className="fw-bold text-dark py-3" style={{ minWidth: '140px' }}>
                        Stay Folio #
                      </th>
                    )}

                    {visibleColumns.customer_name && (
                      <th
                        className="fw-bold text-dark cursor-pointer select-none py-3"
                        onClick={() => handleSort('customer_name')}
                        title="Sort by Guest Name"
                        style={{ minWidth: '180px' }}
                      >
                        <div className="d-flex align-items-center gap-1">
                          <span>Guest Details</span>
                          {sortColumn === 'customer_name' ? (
                            sortDirection === 'asc' ? <ArrowUp size={13} className="text-primary" /> : <ArrowDown size={13} className="text-primary" />
                          ) : (
                            <ArrowUpDown size={12} className="text-muted opacity-50" />
                          )}
                        </div>
                      </th>
                    )}

                    {visibleColumns.room_number && (
                      <th className="fw-bold text-dark text-center py-3" style={{ minWidth: '100px' }}>
                        Room
                      </th>
                    )}

                    {visibleColumns.payment_date && (
                      <th
                        className="fw-bold text-dark cursor-pointer select-none py-3"
                        onClick={() => handleSort('payment_date')}
                        title="Sort by Date & Time"
                        style={{ minWidth: '160px' }}
                      >
                        <div className="d-flex align-items-center gap-1">
                          <span>Date & Time</span>
                          {sortColumn === 'payment_date' ? (
                            sortDirection === 'asc' ? <ArrowUp size={13} className="text-primary" /> : <ArrowDown size={13} className="text-primary" />
                          ) : (
                            <ArrowUpDown size={12} className="text-muted opacity-50" />
                          )}
                        </div>
                      </th>
                    )}

                    {visibleColumns.payment_method && (
                      <th
                        className="fw-bold text-dark cursor-pointer select-none text-center py-3"
                        onClick={() => handleSort('payment_method')}
                        title="Sort by Method"
                        style={{ minWidth: '115px' }}
                      >
                        <div className="d-flex align-items-center justify-content-center gap-1">
                          <span>Method</span>
                          {sortColumn === 'payment_method' ? (
                            sortDirection === 'asc' ? <ArrowUp size={13} className="text-primary" /> : <ArrowDown size={13} className="text-primary" />
                          ) : (
                            <ArrowUpDown size={12} className="text-muted opacity-50" />
                          )}
                        </div>
                      </th>
                    )}

                    {visibleColumns.transaction_reference && (
                      <th className="fw-bold text-dark py-3" style={{ minWidth: '150px' }}>
                        Txn Reference / Notes
                      </th>
                    )}

                    {visibleColumns.received_by_name && (
                      <th className="fw-bold text-dark py-3" style={{ minWidth: '135px' }}>
                        Received By
                      </th>
                    )}

                    {visibleColumns.type && (
                      <th className="fw-bold text-dark text-center py-3" style={{ minWidth: '110px' }}>
                        Type
                      </th>
                    )}

                    {visibleColumns.amount && (
                      <th
                        className="fw-bold text-dark text-end cursor-pointer select-none py-3"
                        onClick={() => handleSort('amount')}
                        title="Sort by Amount"
                        style={{ minWidth: '130px' }}
                      >
                        <div className="d-flex align-items-center justify-content-end gap-1">
                          <span>Amount</span>
                          {sortColumn === 'amount' ? (
                            sortDirection === 'asc' ? <ArrowUp size={13} className="text-primary" /> : <ArrowDown size={13} className="text-primary" />
                          ) : (
                            <ArrowUpDown size={12} className="text-muted opacity-50" />
                          )}
                        </div>
                      </th>
                    )}

                    {visibleColumns.actions && (
                      <th className="fw-bold text-dark text-end pe-3 py-3" style={{ width: '120px' }}>
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {paginatedPayments.length === 0 ? (
                    <tr>
                      <td colSpan="13" className="text-center py-5">
                        <div className="d-flex flex-column align-items-center justify-content-center">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center mb-3"
                            style={{ width: '56px', height: '56px', backgroundColor: '#F1F5F9', color: '#94A3B8' }}
                          >
                            <Receipt size={28} />
                          </div>
                          <h6 className="fw-bold text-dark mb-1">No payment transactions found</h6>
                          <p className="text-muted small mb-3">
                            {hasActiveFilters
                              ? 'No transactions match the selected filters or search keyword.'
                              : 'No payments have been recorded in this property yet.'}
                          </p>
                          {hasActiveFilters && (
                            <button
                              type="button"
                              onClick={clearAllFilters}
                              className="btn btn-sm btn-outline-primary rounded-3 px-3"
                            >
                              Reset All Filters
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedPayments.map((p, idx) => {
                      const absoluteIndex = (currentPage - 1) * pageSize + idx + 1;
                      const amt = parseFloat(p.amount || 0);
                      const isNegative = amt < 0;
                      const isStay = Boolean(p.stay_number);
                      const formattedDate = p.payment_date
                        ? new Date(p.payment_date).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : '—';

                      return (
                        <tr key={p.id} className="transition-all">
                          {/* # Index */}
                          {visibleColumns.index && (
                            <td className="text-muted font-monospace ps-3 extra-small">
                              {absoluteIndex}
                            </td>
                          )}

                          {/* Payment # */}
                          {visibleColumns.payment_number && (
                            <td>
                              <div className="d-flex align-items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedPayment(p)}
                                  className="btn btn-link p-0 text-primary fw-bold text-decoration-none font-monospace text-start"
                                  style={{ fontSize: '0.825rem' }}
                                  title="View Receipt Details"
                                >
                                  {p.payment_number || `PAY-${p.id}`}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(p.payment_number || `PAY-${p.id}`, p.id)}
                                  className="btn btn-light border-0 p-1 rounded text-muted hover-dark transition-all"
                                  style={{ width: '22px', height: '22px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                  title="Copy Payment Number"
                                >
                                  {copiedPayId === p.id ? <Check size={11} className="text-success" /> : <Copy size={11} />}
                                </button>
                              </div>
                            </td>
                          )}

                          {/* Stay # */}
                          {visibleColumns.stay_number && (
                            <td>
                              {isStay ? (
                                <Link
                                  to={`/stays/${p.stay}`}
                                  className="text-dark fw-semibold text-decoration-none hover-primary font-monospace"
                                  title="Open Stay Folio"
                                >
                                  {p.stay_number}
                                </Link>
                              ) : (
                                <span
                                  className="badge rounded-pill fw-medium"
                                  style={{
                                    backgroundColor: '#EFF6FF',
                                    color: '#2563EB',
                                    border: '1px solid #BFDBFE',
                                    fontSize: '0.7rem'
                                  }}
                                  title="Customer Wallet Advance Deposit"
                                >
                                  Direct Wallet
                                </span>
                              )}
                            </td>
                          )}

                          {/* Guest Name & Mobile */}
                          {visibleColumns.customer_name && (
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <div
                                  className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                                  style={{
                                    width: '26px',
                                    height: '26px',
                                    fontSize: '0.7rem',
                                    background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)'
                                  }}
                                >
                                  {(p.customer_name || 'G').charAt(0).toUpperCase()}
                                </div>
                                <div className="overflow-hidden">
                                  <div className="fw-semibold text-dark text-truncate" style={{ maxWidth: '140px' }} title={p.customer_name}>
                                    {p.customer_name || 'Walk-in Guest'}
                                  </div>
                                  {p.customer_mobile && visibleColumns.customer_mobile && (
                                    <div className="text-muted extra-small font-monospace" style={{ fontSize: '0.7rem' }}>
                                      📞 {p.customer_mobile}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          )}

                          {/* Room Number */}
                          {visibleColumns.room_number && (
                            <td className="text-center">
                              {p.room_number ? (
                                <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2 py-0.5 fw-bold font-monospace">
                                  Rm {p.room_number}
                                </span>
                              ) : (
                                <span className="text-muted font-monospace" style={{ fontSize: '0.75rem' }}>
                                  —
                                </span>
                              )}
                            </td>
                          )}

                          {/* Date & Time */}
                          {visibleColumns.payment_date && (
                            <td>
                              <span className="text-dark fw-medium font-monospace" style={{ fontSize: '0.785rem' }}>
                                {formattedDate}
                              </span>
                            </td>
                          )}

                          {/* Method */}
                          {visibleColumns.payment_method && (
                            <td className="text-center">{renderMethodBadge(p.payment_method)}</td>
                          )}

                          {/* Txn Reference */}
                          {visibleColumns.transaction_reference && (
                            <td>
                              {p.transaction_reference || p.notes ? (
                                <span
                                  className="font-monospace text-secondary extra-small text-truncate d-inline-block"
                                  style={{ maxWidth: '140px', fontSize: '0.75rem' }}
                                  title={p.transaction_reference || p.notes}
                                >
                                  {p.transaction_reference || p.notes}
                                </span>
                              ) : (
                                <span className="text-muted">—</span>
                              )}
                            </td>
                          )}

                          {/* Received By */}
                          {visibleColumns.received_by_name && (
                            <td>
                              <div className="d-flex align-items-center gap-1.5 text-secondary">
                                <User size={12} className="text-muted flex-shrink-0" />
                                <span className="text-truncate" style={{ maxWidth: '110px' }} title={p.received_by_name || 'Front Desk'}>
                                  {p.received_by_name || 'Front Desk'}
                                </span>
                              </div>
                            </td>
                          )}

                          {/* Type */}
                          {visibleColumns.type && (
                            <td className="text-center">
                              {isNegative ? (
                                <span className="badge rounded-pill bg-danger-subtle text-danger border border-danger-subtle px-2 py-0.5 fw-semibold" style={{ fontSize: '0.675rem' }}>
                                  Refund
                                </span>
                              ) : isStay ? (
                                <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle px-2 py-0.5 fw-semibold" style={{ fontSize: '0.675rem' }}>
                                  Stay Bill
                                </span>
                              ) : (
                                <span className="badge rounded-pill bg-info-subtle text-info border border-info-subtle px-2 py-0.5 fw-semibold" style={{ fontSize: '0.675rem' }}>
                                  Advance
                                </span>
                              )}
                            </td>
                          )}

                          {/* Amount */}
                          {visibleColumns.amount && (
                            <td className="text-end">
                              {isNegative ? (
                                <span className="fw-bold text-danger font-monospace fs-6">
                                  -{formatCurrency(Math.abs(amt))}
                                </span>
                              ) : (
                                <span className="fw-bold text-success font-monospace fs-6">
                                  +{formatCurrency(amt)}
                                </span>
                              )}
                            </td>
                          )}

                          {/* Actions */}
                          {visibleColumns.actions && (
                            <td className="text-end pe-3">
                              <div className="d-flex align-items-center justify-content-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => setSelectedPayment(p)}
                                  className="btn btn-light btn-sm border-0 p-1 text-secondary hover-primary transition-all"
                                  title="View Details"
                                >
                                  <Eye size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePrintThermal(p)}
                                  className="btn btn-light btn-sm border-0 p-1 text-secondary hover-dark transition-all"
                                  title="Print 80mm Thermal Slip"
                                >
                                  <Receipt size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePrintVoucher(p)}
                                  className="btn btn-light btn-sm border-0 p-1 text-secondary hover-primary transition-all"
                                  title="Print Official A5 Voucher"
                                >
                                  <Printer size={14} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>

                {/* Table Footer with Consolidated Totals */}
                {paginatedPayments.length > 0 && (
                  <tfoot className="table-light border-top border-2">
                    <tr>
                      <td colSpan="8" className="text-end fw-bold text-dark py-2.5 ps-3">
                        Filtered Scope Net Inflow Total:
                      </td>
                      <td colSpan="5" className="text-end pe-3 py-2.5">
                        <span
                          className={`fw-bold font-monospace fs-6 ${
                            summary.netInflow >= 0 ? 'text-success' : 'text-danger'
                          }`}
                        >
                          {summary.netInflow >= 0 ? '+' : ''}
                          {formatCurrency(summary.netInflow)}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Standardized Card Footer: Pagination */}
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
                      >
                        <i className="bi bi-chevron-right" style={{ fontSize: '0.7rem' }}></i>
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. QUICK PAYMENT DETAILS & RECEIPT INSPECTION MODAL           */}
      {/* ------------------------------------------------------------- */}
      {selectedPayment && (
        <div
          className="modal show fade d-block modal-backdrop-animated"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)', zIndex: 1055 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-dialog-animated" style={{ maxWidth: '540px' }}>
            <div className="modal-content rounded-4 border-0 shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div
                className="modal-header border-bottom px-4 py-3 d-flex justify-content-between align-items-center"
                style={{ background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)' }}
              >
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center"
                    style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: parseFloat(selectedPayment.amount || 0) < 0 ? '#FEF2F2' : '#ECFDF5',
                      color: parseFloat(selectedPayment.amount || 0) < 0 ? '#DC2626' : '#059669'
                    }}
                  >
                    <Receipt size={16} />
                  </div>
                  <div>
                    <h6 className="modal-title fw-bold text-dark m-0">Payment Transaction Voucher</h6>
                    <span className="text-muted font-monospace extra-small">
                      {selectedPayment.payment_number || `PAY-${selectedPayment.id}`}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close shadow-none"
                  onClick={() => setSelectedPayment(null)}
                ></button>
              </div>

              {/* Modal Body */}
              <div className="modal-body p-4">
                {/* Amount Banner */}
                <div
                  className="p-3.5 rounded-3 text-center mb-4 border"
                  style={{
                    backgroundColor: parseFloat(selectedPayment.amount || 0) < 0 ? '#FEF2F2' : '#ECFDF5',
                    borderColor: parseFloat(selectedPayment.amount || 0) < 0 ? '#FECACA' : '#A7F3D0'
                  }}
                >
                  <div className="text-muted text-uppercase fw-bold extra-small mb-1" style={{ letterSpacing: '0.06em' }}>
                    {parseFloat(selectedPayment.amount || 0) < 0 ? 'Debit / Refund Amount' : 'Payment Settled Amount'}
                  </div>
                  <div
                    className={`fw-bold font-monospace ${
                      parseFloat(selectedPayment.amount || 0) < 0 ? 'text-danger' : 'text-success'
                    }`}
                    style={{ fontSize: '2rem' }}
                  >
                    {parseFloat(selectedPayment.amount || 0) < 0 ? '-' : '+'}
                    {formatCurrency(Math.abs(parseFloat(selectedPayment.amount || 0)))}
                  </div>
                  <div className="mt-1">
                    {renderMethodBadge(selectedPayment.payment_method)}
                  </div>
                </div>

                {/* Details List */}
                <div className="d-flex flex-column gap-2.5" style={{ fontSize: '0.85rem' }}>
                  <div className="d-flex justify-content-between pb-1.5 border-bottom">
                    <span className="text-muted">Transaction Date:</span>
                    <span className="fw-semibold text-dark font-monospace">
                      {selectedPayment.payment_date
                        ? new Date(selectedPayment.payment_date).toLocaleString('en-IN')
                        : '—'}
                    </span>
                  </div>

                  <div className="d-flex justify-content-between pb-1.5 border-bottom">
                    <span className="text-muted">Guest Full Name:</span>
                    <span className="fw-bold text-dark">{selectedPayment.customer_name || 'Walk-in Guest'}</span>
                  </div>

                  {selectedPayment.customer_mobile && (
                    <div className="d-flex justify-content-between pb-1.5 border-bottom">
                      <span className="text-muted">Contact Mobile:</span>
                      <span className="fw-semibold text-dark font-monospace">{selectedPayment.customer_mobile}</span>
                    </div>
                  )}

                  <div className="d-flex justify-content-between pb-1.5 border-bottom">
                    <span className="text-muted">Stay Folio #:</span>
                    <span className="fw-bold text-primary font-monospace">
                      {selectedPayment.stay_number ? selectedPayment.stay_number : 'Direct Customer Wallet'}
                    </span>
                  </div>

                  <div className="d-flex justify-content-between pb-1.5 border-bottom">
                    <span className="text-muted">Allocated Room:</span>
                    <span className="fw-semibold text-dark">
                      {selectedPayment.room_number ? `Room ${selectedPayment.room_number}` : 'No Room (Advance)'}
                    </span>
                  </div>

                  <div className="d-flex justify-content-between pb-1.5 border-bottom">
                    <span className="text-muted">Txn Reference / UTR:</span>
                    <span className="fw-semibold text-dark font-monospace">
                      {selectedPayment.transaction_reference || 'N/A'}
                    </span>
                  </div>

                  <div className="d-flex justify-content-between pb-1.5 border-bottom">
                    <span className="text-muted">Received By Staff:</span>
                    <span className="fw-semibold text-dark">{selectedPayment.received_by_name || 'Front Desk'}</span>
                  </div>

                  {selectedPayment.shift_number && (
                    <div className="d-flex justify-content-between pb-1.5 border-bottom">
                      <span className="text-muted">Linked Till Session:</span>
                      <span className="fw-semibold text-dark">Shift #{selectedPayment.shift_number}</span>
                    </div>
                  )}

                  {selectedPayment.notes && (
                    <div className="p-2.5 rounded-3 bg-light border mt-1">
                      <div className="text-muted extra-small fw-bold uppercase">Transaction Notes:</div>
                      <div className="text-dark small mt-0.5">{selectedPayment.notes}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="modal-footer border-top bg-light p-3 d-flex justify-content-between">
                <button
                  type="button"
                  onClick={() => setSelectedPayment(null)}
                  className="btn btn-outline-secondary btn-sm rounded-3 px-3"
                >
                  Close
                </button>

                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePrintThermal(selectedPayment)}
                    className="btn btn-white border btn-sm rounded-3 shadow-2xs d-flex align-items-center gap-1.5 fw-semibold"
                  >
                    <Receipt size={14} /> 80mm Thermal
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePrintVoucher(selectedPayment)}
                    className="btn btn-primary btn-sm rounded-3 shadow-xs d-flex align-items-center gap-1.5 fw-semibold"
                  >
                    <Printer size={14} /> Print Voucher
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
