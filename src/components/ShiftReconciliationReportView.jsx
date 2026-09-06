import React, { useState, useEffect } from 'react';
import {
  Clock,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Users,
  Download,
  Printer,
  Calendar,
  Receipt,
  FileSpreadsheet
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { getShiftReconciliationReportApi } from '../api/reportApi';
import { formatCurrency } from '../utils/formatCurrency';
import { exportShiftReconciliationToPDF } from '../utils/exportUtils';
import PageLoader from './PageLoader';

const ShiftReconciliationReportView = ({ period, startDate, endDate, selectedReport }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('ALL');

  useEffect(() => {
    loadData();
  }, [period, startDate, endDate, selectedReport]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getShiftReconciliationReportApi({
        period,
        start_date: startDate || undefined,
        end_date: endDate || undefined
      });
      setData(res);
    } catch (err) {
      console.error('Error fetching shift reconciliation report:', err);
      setError('Failed to load cashier reconciliation analytics.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!data) return;
    const headers = ['Staff Name', 'Role', 'Total Shifts', 'Exact Closings', 'Shortage Shifts', 'Excess Shifts', 'Total Shortage (INR)', 'Total Excess (INR)', 'Net Variance (INR)', 'Accuracy Rate (%)'];
    const rows = (data.staff_leaderboard || []).map(s => [
      `"${s.user_name}"`,
      `"${s.role}"`,
      s.total_shifts,
      s.exact_closings,
      s.shortage_shifts,
      s.excess_shifts,
      s.total_shortage,
      s.total_excess,
      s.net_variance,
      s.accuracy_rate
    ]);

    let csvString = headers.join(',') + '\n' + rows.map(e => e.join(',')).join('\n');

    if (data.itemized_expenses && data.itemized_expenses.length > 0) {
      csvString += '\n\n"PETTY CASH & TILL EXPENSES DISBURSED"\n';
      const expHeaders = ['Voucher No', 'Date', 'Time', 'Shift #', 'Cashier', 'Category', 'Description', 'Approval Status', 'Approved By', 'Amount (INR)'];
      const expRows = data.itemized_expenses.map(e => [
        `"${e.voucher_no || ''}"`,
        `"${e.date || ''}"`,
        `"${e.time || ''}"`,
        `"${e.shift_number || ''}"`,
        `"${e.cashier_name || ''}"`,
        `"${e.category_display || e.category || ''}"`,
        `"${(e.description || '').replace(/"/g, '""')}"`,
        `"${e.is_approved ? 'Approved' : 'Pending'}"`,
        `"${e.approved_by || ''}"`,
        e.amount || 0
      ]);
      csvString += expHeaders.join(',') + '\n' + expRows.map(e => e.join(',')).join('\n');
    }

    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvString);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Cashier_Reconciliation_Report_${data.start_date}_to_${data.end_date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (!data) return;
    exportShiftReconciliationToPDF(data, {}, { action: 'print' });
  };

  const handleDownloadPDF = () => {
    if (!data) return;
    exportShiftReconciliationToPDF(data, {}, { action: 'download' });
  };

  if (loading) {
    return <PageLoader message="Analyzing Cashier Reconciliations & Drawer Variances..." />;
  }

  if (error || !data) {
    return (
      <div className="card border-0 shadow-xs bg-white rounded-4 p-5 text-center my-4">
        <AlertTriangle size={36} className="text-warning mx-auto mb-2" />
        <h5 className="fw-bold text-dark">{error || 'No Reconciliation Data Available'}</h5>
        <p className="text-secondary small">Please select a different date range or initialize reception shifts.</p>
      </div>
    );
  }

  const { summary, staff_leaderboard, daily_trends, expense_categories } = data;

  const filteredExpenses = (data.itemized_expenses || []).filter((e) => {
    if (expenseCategoryFilter !== 'ALL' && e.category !== expenseCategoryFilter) return false;
    if (expenseSearch.trim()) {
      const q = expenseSearch.toLowerCase();
      const vNo = (e.voucher_no || `EXP-${e.id}`).toLowerCase();
      const cashier = (e.cashier_name || '').toLowerCase();
      const desc = (e.description || '').toLowerCase();
      const cat = (e.category_display || e.category || '').toLowerCase();
      const sNo = String(e.shift_number || '').toLowerCase();
      return vNo.includes(q) || cashier.includes(q) || desc.includes(q) || cat.includes(q) || sNo.includes(q);
    }
    return true;
  });

  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#64748B'];

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header Actions */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 pb-2 border-bottom">
        <div>
          <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2" style={{ letterSpacing: '-0.02em' }}>
            <ShieldCheck size={20} className="text-primary" /> Cashier Reconciliation &amp; Discrepancy Analytics
          </h5>
          <span className="text-secondary extra-small">
            Reporting Period: <strong>{data.period}</strong> ({data.start_date} to {data.end_date})
          </span>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-sm btn-light border text-secondary rounded-3 d-flex align-items-center gap-1.5 extra-small fw-semibold"
            onClick={handleExportCSV}
          >
            <FileSpreadsheet size={14} className="text-success" /> Export CSV / Excel
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary rounded-3 d-flex align-items-center gap-1.5 extra-small fw-semibold"
            onClick={handlePrint}
          >
            <Printer size={14} /> Print Audit Sheet
          </button>
          <button
            type="button"
            className="btn btn-sm btn-primary rounded-3 d-flex align-items-center gap-1.5 extra-small fw-semibold shadow-sm"
            onClick={handleDownloadPDF}
          >
            <Download size={14} /> Download PDF (A4)
          </button>
        </div>
      </div>

      {/* 6 Top Metric Cards */}
      <div className="row g-3">
        {/* 1. Accuracy Rate */}
        <div className="col-12 col-sm-6 col-xl-2">
          <div className="card border-0 shadow-xs rounded-3 p-3 bg-white h-100" style={{ border: '1px solid #E2E8F0' }}>
            <div className="text-secondary extra-small fw-bold text-uppercase mb-1">ACCURACY RATE</div>
            <div className="fs-4 fw-bold text-primary font-monospace">{summary.accuracy_rate}%</div>
            <div className="extra-small text-muted mt-1">{summary.exact_closings} / {summary.closed_shifts} perfect</div>
          </div>
        </div>

        {/* 2. Total Shifts */}
        <div className="col-12 col-sm-6 col-xl-2">
          <div className="card border-0 shadow-xs rounded-3 p-3 bg-white h-100" style={{ border: '1px solid #E2E8F0' }}>
            <div className="text-secondary extra-small fw-bold text-uppercase mb-1">CLOSED SHIFTS</div>
            <div className="fs-4 fw-bold text-dark font-monospace">{summary.closed_shifts}</div>
            <div className="extra-small text-muted mt-1">{summary.total_shifts} logged total</div>
          </div>
        </div>

        {/* 3. Total Shortages */}
        <div className="col-12 col-sm-6 col-xl-2">
          <div className="card border-0 shadow-xs rounded-3 p-3 bg-white h-100" style={{ border: '1px solid #E2E8F0' }}>
            <div className="text-secondary extra-small fw-bold text-uppercase mb-1">TOTAL SHORTAGES</div>
            <div className="fs-4 fw-bold text-danger font-monospace">-{formatCurrency(summary.total_shortages)}</div>
            <div className="extra-small text-muted mt-1">Cash drawer deficits</div>
          </div>
        </div>

        {/* 4. Total Excesses */}
        <div className="col-12 col-sm-6 col-xl-2">
          <div className="card border-0 shadow-xs rounded-3 p-3 bg-white h-100" style={{ border: '1px solid #E2E8F0' }}>
            <div className="text-secondary extra-small fw-bold text-uppercase mb-1">TOTAL EXCESSES</div>
            <div className="fs-4 fw-bold text-warning-emphasis font-monospace">+{formatCurrency(summary.total_excesses)}</div>
            <div className="extra-small text-muted mt-1">Surplus drawer cash</div>
          </div>
        </div>

        {/* 5. Net Variance */}
        <div className="col-12 col-sm-6 col-xl-2">
          <div className="card border-0 shadow-xs rounded-3 p-3 bg-white h-100" style={{ border: '1px solid #E2E8F0' }}>
            <div className="text-secondary extra-small fw-bold text-uppercase mb-1">NET VARIANCE</div>
            <div className={`fs-4 fw-bold font-monospace ${summary.net_variance < 0 ? 'text-danger' : summary.net_variance > 0 ? 'text-warning-emphasis' : 'text-success'}`}>
              {summary.net_variance > 0 ? `+${formatCurrency(summary.net_variance)}` : formatCurrency(summary.net_variance)}
            </div>
            <div className="extra-small text-muted mt-1">Cumulative variance</div>
          </div>
        </div>

        {/* 6. Avg Shift Duration */}
        <div className="col-12 col-sm-6 col-xl-2">
          <div className="card border-0 shadow-xs rounded-3 p-3 bg-white h-100" style={{ border: '1px solid #E2E8F0' }}>
            <div className="text-secondary extra-small fw-bold text-uppercase mb-1">AVG SHIFT TIME</div>
            <div className="fs-4 fw-bold text-dark font-monospace">
              {Math.floor(summary.avg_duration_minutes / 60)}h {summary.avg_duration_minutes % 60}m
            </div>
            <div className="extra-small text-muted mt-1">Per active cashier</div>
          </div>
        </div>
      </div>

      {/* Staff Accountability Ranking Leaderboard */}
      <div className="card border-0 shadow-xs bg-white rounded-4 overflow-hidden" style={{ border: '1px solid #E2E8F0' }}>
        <div className="p-3.5 border-bottom d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <div className="p-1.5 rounded-2 bg-primary text-white">
              <Users size={16} />
            </div>
            <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '0.95rem' }}>
              Staff Accountability &amp; Cashier Reconciliation Leaderboard
            </h6>
          </div>
          <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill extra-small px-2.5 py-0.5">
            Ranked by Accuracy Rate
          </span>
        </div>

        {staff_leaderboard.length === 0 ? (
          <div className="p-5 text-center text-secondary small">
            No cashier shifts closed during this reporting window.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.825rem' }}>
              <thead className="table-light text-secondary extra-small">
                <tr>
                  <th className="ps-3 py-2.5">Cashier / Staff</th>
                  <th className="py-2.5">Role</th>
                  <th className="text-center py-2.5">Shifts Closed</th>
                  <th className="text-center py-2.5">Exact Balanced</th>
                  <th className="text-center py-2.5">Shortage Shifts</th>
                  <th className="text-end py-2.5">Total Shortages (₹)</th>
                  <th className="text-end py-2.5">Total Excesses (₹)</th>
                  <th className="text-end py-2.5">Net Variance (₹)</th>
                  <th className="pe-3 py-2.5" style={{ minWidth: '150px' }}>Reconciliation Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {staff_leaderboard.map((staff, idx) => (
                  <tr key={staff.user_id}>
                    <td className="ps-3">
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-light text-dark border rounded-circle" style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {idx + 1}
                        </span>
                        <span className="fw-bold text-dark">{staff.user_name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-light text-secondary border rounded-pill extra-small">
                        {staff.role}
                      </span>
                    </td>
                    <td className="text-center font-monospace fw-bold">{staff.total_shifts}</td>
                    <td className="text-center font-monospace text-success fw-bold">{staff.exact_closings}</td>
                    <td className="text-center font-monospace text-danger fw-bold">{staff.shortage_shifts}</td>
                    <td className="text-end font-monospace text-danger">
                      {staff.total_shortage > 0 ? `-${formatCurrency(staff.total_shortage)}` : '₹0.00'}
                    </td>
                    <td className="text-end font-monospace text-warning-emphasis">
                      {staff.total_excess > 0 ? `+${formatCurrency(staff.total_excess)}` : '₹0.00'}
                    </td>
                    <td className={`text-end font-monospace fw-bold ${staff.net_variance < 0 ? 'text-danger' : staff.net_variance > 0 ? 'text-warning-emphasis' : 'text-success'}`}>
                      {staff.net_variance > 0 ? `+${formatCurrency(staff.net_variance)}` : formatCurrency(staff.net_variance)}
                    </td>
                    <td className="pe-3">
                      <div className="d-flex align-items-center gap-2">
                        <div className="progress flex-grow-1" style={{ height: '7px' }}>
                          <div
                            className={`progress-bar rounded-pill ${staff.accuracy_rate >= 90 ? 'bg-success' : staff.accuracy_rate >= 70 ? 'bg-warning' : 'bg-danger'}`}
                            style={{ width: `${staff.accuracy_rate}%` }}
                          ></div>
                        </div>
                        <span className="extra-small fw-bold font-monospace" style={{ minWidth: '40px' }}>
                          {staff.accuracy_rate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2 Charts Grid */}
      <div className="row g-4">
        {/* Daily Till Variance Chart */}
        <div className="col-12 col-lg-7">
          <div className="card border-0 shadow-xs bg-white rounded-4 p-4 h-100" style={{ border: '1px solid #E2E8F0' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '0.95rem' }}>
                  Daily Till Variance Ledger (Deficit vs Surplus)
                </h6>
                <span className="text-secondary extra-small">
                  Tracking daily physical drawer count discrepancies
                </span>
              </div>
              <div className="d-flex align-items-center gap-2 extra-small">
                <span className="d-flex align-items-center gap-1">
                  <span className="rounded-circle bg-danger" style={{ width: '8px', height: '8px' }}></span> Shortage
                </span>
                <span className="d-flex align-items-center gap-1">
                  <span className="rounded-circle bg-warning" style={{ width: '8px', height: '8px' }}></span> Excess
                </span>
              </div>
            </div>

            <div style={{ height: '230px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={daily_trends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="formatted_date" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94A3B8" tickFormatter={(v) => `₹${v}`} />
                  <Tooltip formatter={(value) => [formatCurrency(value), '']} />
                  <Bar dataKey="shortage_amount" name="Shortage" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="excess_amount" name="Excess" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Petty Cash Expense Categories */}
        <div className="col-12 col-lg-5">
          <div className="card border-0 shadow-xs bg-white rounded-4 p-4 h-100" style={{ border: '1px solid #E2E8F0' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '0.95rem' }}>
                  Petty Cash Disbursements by Category
                </h6>
                <span className="text-secondary extra-small">
                  Cash paid directly from reception till drawers
                </span>
              </div>
              <Receipt size={16} className="text-primary" />
            </div>

            {expense_categories.length === 0 ? (
              <div className="p-4 text-center text-secondary small">
                No petty cash expenses recorded in this period.
              </div>
            ) : (
              <div className="d-flex flex-column gap-2.5">
                {expense_categories.map((c, i) => (
                  <div key={c.category} className="d-flex align-items-center justify-content-between p-2 rounded-3 bg-light" style={{ fontSize: '0.825rem' }}>
                    <div className="d-flex align-items-center gap-2">
                      <span className="rounded-circle" style={{ width: '8px', height: '8px', backgroundColor: COLORS[i % COLORS.length] }}></span>
                      <span className="fw-semibold text-dark">{c.label}</span>
                      <span className="text-muted extra-small">({c.expense_count} vouchers)</span>
                    </div>
                    <span className="fw-bold text-dark font-monospace">{formatCurrency(c.total_amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Reception Till Disbursements & Petty Cash Expense Ledger Table */}
      <div className="card border-0 shadow-xs bg-white rounded-4 overflow-hidden" style={{ border: '1px solid #E2E8F0' }}>
        <div className="p-3.5 border-bottom d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
          <div className="d-flex align-items-center gap-2">
            <div className="p-1.5 rounded-2 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#FEF3C7', color: '#B45309' }}>
              <Receipt size={16} />
            </div>
            <div>
              <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '0.95rem' }}>
                Reception Till Disbursements &amp; Petty Cash Ledger
              </h6>
              <span className="text-secondary extra-small">
                Itemized register of all operational cash payouts disbursed directly from front desk till drawers
              </span>
            </div>
          </div>
          
          <div className="d-flex align-items-center gap-2">
            <span className="badge rounded-pill px-2.5 py-1 extra-small fw-bold" style={{ backgroundColor: '#FFF1F2', color: '#BE123C', border: '1px solid #FECDD3' }}>
              Total Disbursed: -{formatCurrency(data.total_expense_amount || summary.total_petty_cash_expenses || 0)}
            </span>
            <span className="badge bg-light text-secondary border rounded-pill px-2.5 py-1 extra-small">
              {data.itemized_expenses?.length || 0} Vouchers
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-3 bg-light bg-opacity-50 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: '350px' }}>
            <input
              type="text"
              className="form-control form-control-sm rounded-3 bg-white"
              placeholder="Search voucher #, cashier, description..."
              value={expenseSearch}
              onChange={(e) => setExpenseSearch(e.target.value)}
              style={{ fontSize: '0.825rem' }}
            />
          </div>
          <div className="d-flex align-items-center gap-2">
            <select
              className="form-select form-select-sm rounded-3 bg-white"
              value={expenseCategoryFilter}
              onChange={(e) => setExpenseCategoryFilter(e.target.value)}
              style={{ fontSize: '0.825rem', minWidth: '160px' }}
            >
              <option value="ALL">All Categories</option>
              {expense_categories.map((c) => (
                <option key={c.category} value={c.category}>
                  {c.label} ({c.expense_count})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Content */}
        {filteredExpenses.length === 0 ? (
          <div className="p-5 text-center text-secondary small">
            <Receipt size={24} className="text-muted opacity-50 mb-2" />
            <div className="fw-semibold text-dark">No till disbursements matching criteria</div>
            <div className="text-muted extra-small">
              {data.itemized_expenses?.length === 0
                ? 'No petty cash or operational expenses were paid from reception tills during this reporting window.'
                : 'Try adjusting your search query or category filter.'}
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.825rem' }}>
              <thead className="table-light text-secondary extra-small">
                <tr>
                  <th className="ps-3 py-2.5">Voucher #</th>
                  <th className="py-2.5">Date &amp; Time</th>
                  <th className="text-center py-2.5">Shift #</th>
                  <th className="py-2.5">Cashier / Staff</th>
                  <th className="text-center py-2.5">Category</th>
                  <th className="py-2.5">Description / Purpose</th>
                  <th className="text-center py-2.5">Approval Status</th>
                  <th className="pe-3 text-end py-2.5">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id}>
                    <td className="ps-3">
                      <span className="badge bg-light text-dark border font-monospace">
                        {exp.voucher_no || `EXP-${exp.id}`}
                      </span>
                    </td>
                    <td>
                      <div className="fw-semibold text-dark">{exp.date}</div>
                      <div className="extra-small text-muted">{exp.time}</div>
                    </td>
                    <td className="text-center">
                      <span className="badge bg-light text-secondary border">
                        {exp.shift_number}
                      </span>
                    </td>
                    <td>
                      <span className="fw-semibold text-dark">{exp.cashier_name}</span>
                    </td>
                    <td className="text-center">
                      <span
                        className="badge rounded-pill extra-small px-2.5 py-1"
                        style={{ backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}
                      >
                        {exp.category_display || exp.category}
                      </span>
                    </td>
                    <td className="text-dark" style={{ maxWidth: '280px' }}>
                      {exp.description}
                    </td>
                    <td className="text-center">
                      {exp.is_approved ? (
                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill extra-small px-2 py-0.5">
                          Approved ({exp.approved_by})
                        </span>
                      ) : (
                        <span className="badge bg-secondary bg-opacity-10 text-secondary border rounded-pill extra-small px-2 py-0.5">
                          Logged
                        </span>
                      )}
                    </td>
                    <td className="pe-3 text-end font-monospace fw-bold text-danger">
                      -{formatCurrency(exp.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="table-light fw-bold">
                <tr>
                  <td colSpan={7} className="ps-3 py-2 text-end text-secondary">
                    Total Disbursed ({filteredExpenses.length} vouchers):
                  </td>
                  <td className="pe-3 py-2 text-end font-monospace text-danger">
                    -{formatCurrency(filteredExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShiftReconciliationReportView;
