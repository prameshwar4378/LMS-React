import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getShiftDetailsApi } from '../api/shiftApi';
import { formatCurrency } from '../utils/formatCurrency';
import PageLoader from '../components/PageLoader';
import ShiftApprovalModal from '../components/ShiftApprovalModal';
import CloseShiftModal from '../components/CloseShiftModal';
import AdminForceCloseModal from '../components/AdminForceCloseModal';
import ThermalSlipModal from '../components/ThermalSlipModal';
import {
  Clock,
  DollarSign,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  ArrowLeftRight,
  Users,
  ShieldCheck,
  ShieldAlert,
  Printer,
  Calendar,
  FileText,
  CreditCard,
  Building2,
  TrendingUp,
  TrendingDown,
  Sliders,
  Activity
} from 'lucide-react';

const ShiftDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole, isSingleOwner } = useAuth();
  const queryClient = useQueryClient();

  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showForceCloseModal, setShowForceCloseModal] = useState(false);

  // Thermal Print Modal States
  const [showThermalModal, setShowThermalModal] = useState(false);
  const [thermalMode, setThermalMode] = useState('shift'); // 'shift' | 'expense'
  const [selectedExpense, setSelectedExpense] = useState(null);

  const {
    data: shift = null,
    isLoading: loading,
    refetch: loadShift,
  } = useQuery({
    queryKey: ['shift-details', id],
    queryFn: () => getShiftDetailsApi(id),
    enabled: !isSingleOwner && !!id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const handlePrint = () => {
    window.print();
  };

  if (isSingleOwner) {
    return (
      <div className="container-fluid py-5 px-3 px-md-4">
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center mx-auto" style={{ maxWidth: '640px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <div className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '64px', height: '64px', backgroundColor: '#F0FDFA', color: '#0D9488' }}>
            <Clock size={32} />
          </div>
          <h4 className="fw-bold text-dark mb-2">Single Owner Mode Active</h4>
          <p className="text-secondary small mb-4">
            This hotel property is configured in <strong>Single Owner / Direct Mode</strong> by the platform administrator. Shift details are not available because shift & till handovers are disabled.
          </p>
          <div className="d-flex justify-content-center gap-2">
            <Link to="/dashboard" className="btn btn-primary btn-sm fw-semibold rounded-3 px-4 py-2 text-white" style={{ background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)', border: 'none' }}>
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !shift) {
    return <PageLoader fullScreen={false} message="Loading Shift Audit Records..." />;
  }

  const fin = shift.financials || {};
  const diff = shift.cash_difference || 0;
  const isShortage = diff < -0.01;
  const isExcess = diff > 0.01;
  const isReconciled = shift.actual_cash !== null && !isShortage && !isExcess;

  return (
    <div className="pb-5 px-1" style={{ backgroundColor: '#F8FAFC' }}>
      
      {/* Top Header Bar */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pt-1 no-print">
        <div className="d-flex align-items-center gap-3">
          <button
            type="button"
            className="btn btn-sm btn-light border text-secondary rounded-3 d-flex align-items-center gap-1"
            onClick={() => navigate('/shifts?tab=history')}
          >
            <ArrowLeft size={14} /> Back to Shifts
          </button>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h4 className="fw-bold text-dark m-0" style={{ letterSpacing: '-0.02em' }}>
                Shift #{shift.shift_number}
              </h4>
              <span className={`badge px-2.5 py-1 rounded-pill extra-small fw-bold ${
                shift.status === 'CLOSED' ? 'bg-success text-white' :
                shift.status === 'PENDING_APPROVAL' ? 'bg-danger text-white' :
                'bg-primary text-white'
              }`}>
                {shift.status_display}
              </span>
            </div>
            <span className="text-secondary extra-small">
              Assigned to: <strong>{shift.user_name}</strong> &bull; Opened: {new Date(shift.opened_at).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          {shift.status === 'PENDING_APPROVAL' && hasRole(['SUPER_ADMIN', 'MANAGER']) && (
            <button
              type="button"
              className="btn btn-sm btn-warning text-dark fw-bold px-3 py-1.5 rounded-3 shadow-xs d-flex align-items-center gap-1.5"
              onClick={() => setShowApprovalModal(true)}
            >
              <ShieldCheck size={15} /> Manager Review &amp; Sign-Off
            </button>
          )}

          {(shift.status === 'OPEN' || shift.status === 'CLOSING') && hasRole(['SUPER_ADMIN', 'MANAGER']) && (
            <>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger fw-bold px-3 py-1.5 rounded-3 shadow-xs d-flex align-items-center gap-1.5 bg-white"
                onClick={() => setShowCloseModal(true)}
              >
                <Lock size={15} /> Close &amp; Reconcile Till
              </button>
              <button
                type="button"
                className="btn btn-sm btn-danger fw-bold px-3 py-1.5 rounded-3 shadow-xs d-flex align-items-center gap-1.5 text-white"
                onClick={() => setShowForceCloseModal(true)}
              >
                <ShieldAlert size={15} /> Force Close
              </button>
            </>
          )}

          <button
            type="button"
            className="btn btn-sm btn-primary fw-semibold px-3 py-1.5 rounded-3 shadow-xs d-flex align-items-center gap-1.5 text-white"
            style={{ backgroundColor: '#2563EB', borderColor: '#2563EB' }}
            onClick={() => {
              setThermalMode('shift');
              setSelectedExpense(null);
              setShowThermalModal(true);
            }}
          >
            <Printer size={15} /> Print Thermal Slip (80mm)
          </button>

          <button
            type="button"
            className="btn btn-sm btn-white border fw-semibold px-3 py-1.5 rounded-3 shadow-xs d-flex align-items-center gap-1.5 text-dark bg-white"
            onClick={handlePrint}
          >
            <FileText size={15} /> Print A4 Sheet
          </button>
        </div>
      </div>

      {/* Printable Sheet Header */}
      <div className="card border-0 shadow-xs bg-white rounded-4 p-4 mb-4" style={{ border: '1px solid #E2E8F0' }}>
        
        {/* Executive Summary Row */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3 pb-3 mb-3 border-bottom">
          <div>
            <div className="extra-small fw-bold text-secondary text-uppercase tracking-wider">LODGE MANAGEMENT SYSTEM</div>
            <h3 className="fw-bold text-dark mb-1">Official Reception Till Closing Summary</h3>
            <div className="text-secondary extra-small">
              Shift Number: <strong>{shift.shift_number}</strong> &bull; Cashier: <strong>{shift.user_name}</strong>
            </div>
          </div>

          <div className="text-md-end">
            <div className="extra-small fw-bold text-secondary text-uppercase">RECONCILIATION VERDICT</div>
            <div className="mt-1">
              {shift.actual_cash === null ? (
                <span className="badge bg-primary text-white px-3 py-1 rounded-pill">Active Till</span>
              ) : isReconciled ? (
                <span className="badge bg-success text-white px-3 py-1 rounded-pill fw-bold">
                  <CheckCircle2 size={13} className="me-1 d-inline" /> Reconciled (₹0 Diff)
                </span>
              ) : isShortage ? (
                <span className="badge bg-danger text-white px-3 py-1 rounded-pill fw-bold">
                  <TrendingDown size={13} className="me-1 d-inline" /> Shortage: {formatCurrency(Math.abs(diff))}
                </span>
              ) : (
                <span className="badge bg-warning text-dark px-3 py-1 rounded-pill fw-bold">
                  <TrendingUp size={13} className="me-1 d-inline" /> Excess: +{formatCurrency(diff)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 4 Overview Columns */}
        <div className="row g-3 mb-4 text-center">
          <div className="col-6 col-md-3 border-end">
            <div className="text-secondary extra-small fw-semibold">Opening Float</div>
            <div className="fs-5 fw-bold text-dark mt-1 font-monospace">{formatCurrency(shift.opening_balance)}</div>
          </div>
          <div className="col-6 col-md-3 border-end">
            <div className="text-secondary extra-small fw-semibold">Cash Receipts In</div>
            <div className="fs-5 fw-bold text-success mt-1 font-monospace">+{formatCurrency(fin.cash_collections || 0)}</div>
          </div>
          <div className="col-6 col-md-3 border-end">
            <div className="text-secondary extra-small fw-semibold">Expected Cash in Till</div>
            <div className="fs-5 fw-bold text-primary mt-1 font-monospace">{formatCurrency(shift.financials?.expected_cash ?? shift.expected_cash ?? 0)}</div>
          </div>
          <div className="col-6 col-md-3">
            <div className="text-secondary extra-small fw-semibold">Physical Counted</div>
            <div className="fs-5 fw-bold text-dark mt-1 font-monospace">
              {shift.actual_cash !== null ? formatCurrency(shift.actual_cash) : 'Uncounted'}
            </div>
          </div>
        </div>

        {/* Operational Productivity & Room Metrics Card */}
        {shift.operational_metrics && (
          <div className="card border-0 shadow-xs rounded-3 p-3.5 mb-4 bg-light" style={{ border: '1px solid #E2E8F0' }}>
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <div className="d-flex align-items-center gap-2">
                <div className="p-1.5 rounded-2 bg-primary text-white">
                  <Activity size={16} />
                </div>
                <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '0.875rem' }}>
                  Operational Room Productivity &amp; Front-Desk Activity
                </h6>
              </div>
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill extra-small px-2.5 py-0.5">
                Shift Activity Summary
              </span>
            </div>

            <div className="row g-2 text-center">
              <div className="col-6 col-md-3">
                <div className="p-2.5 bg-white rounded-3 border">
                  <div className="text-secondary extra-small fw-semibold text-uppercase">Check-ins</div>
                  <div className="fs-4 fw-bold text-success mt-0.5 font-monospace">{shift.operational_metrics.total_checkins}</div>
                  <span className="extra-small text-muted" style={{ fontSize: '0.72rem' }}>Arrivals processed</span>
                </div>
              </div>

              <div className="col-6 col-md-3">
                <div className="p-2.5 bg-white rounded-3 border">
                  <div className="text-secondary extra-small fw-semibold text-uppercase">Check-outs</div>
                  <div className="fs-4 fw-bold text-danger mt-0.5 font-monospace">{shift.operational_metrics.total_checkouts}</div>
                  <span className="extra-small text-muted" style={{ fontSize: '0.72rem' }}>Departures cleared</span>
                </div>
              </div>

              <div className="col-6 col-md-3">
                <div className="p-2.5 bg-white rounded-3 border">
                  <div className="text-secondary extra-small fw-semibold text-uppercase">New Bookings</div>
                  <div className="fs-4 fw-bold text-primary mt-0.5 font-monospace">{shift.operational_metrics.total_bookings}</div>
                  <span className="extra-small text-muted" style={{ fontSize: '0.72rem' }}>Reservations logged</span>
                </div>
              </div>

              <div className="col-6 col-md-3">
                <div className="p-2.5 bg-white rounded-3 border">
                  <div className="text-secondary extra-small fw-semibold text-uppercase">Avg Daily Rate (ADR)</div>
                  <div className="fs-4 fw-bold text-dark mt-0.5 font-monospace">{formatCurrency(shift.operational_metrics.adr || 0)}</div>
                  <span className="extra-small text-muted" style={{ fontSize: '0.72rem' }}>Per check-in average</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Physical Denominations Table (if counted) */}
        {shift.denominations && shift.denominations.length > 0 && (
          <div className="mb-4">
            <h6 className="fw-bold text-dark mb-2.5 d-flex align-items-center gap-1.5" style={{ fontSize: '0.9rem' }}>
              <Building2 size={15} className="text-primary" /> Physical Cash Denominations Counted
            </h6>
            <div className="table-responsive border rounded-3 overflow-hidden">
              <table className="table table-sm table-striped align-middle mb-0" style={{ fontSize: '0.8rem' }}>
                <thead className="table-light extra-small text-secondary">
                  <tr>
                    <th className="ps-3 py-2">Denomination</th>
                    <th className="text-center py-2">Quantity Counted</th>
                    <th className="text-end pe-3 py-2">Line Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {shift.denominations.map((d) => (
                    <tr key={d.id}>
                      <td className="ps-3 fw-semibold text-dark">₹{d.denomination} Notes / Coins</td>
                      <td className="text-center font-monospace">{d.quantity}</td>
                      <td className="text-end pe-3 font-monospace fw-bold text-dark">{formatCurrency(d.total)}</td>
                    </tr>
                  ))}
                  <tr className="table-light fw-bold">
                    <td colSpan={2} className="ps-3 text-uppercase extra-small">Total Physical Cash Counted</td>
                    <td className="text-end pe-3 font-monospace fs-6 text-primary">{formatCurrency(shift.actual_cash || 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Shift Handovers Trail (Incoming & Outgoing Transfers) */}
        {((shift.handovers_received && shift.handovers_received.length > 0) || (shift.handovers_sent && shift.handovers_sent.length > 0)) && (
          <div className="mb-4">
            <h6 className="fw-bold text-dark mb-2.5 d-flex align-items-center gap-1.5" style={{ fontSize: '0.9rem' }}>
              <Users size={15} className="text-primary" /> Shift Handover Records
            </h6>
            <div className="row g-3">
              {shift.handovers_received && shift.handovers_received.length > 0 && (
                <div className="col-12 col-md-6">
                  <div className="border rounded-3 p-3 h-100 bg-light">
                    <div className="extra-small fw-bold text-success text-uppercase mb-2 d-flex align-items-center gap-1">
                      <span className="rounded-circle" style={{ width: '6px', height: '6px', backgroundColor: '#16A34A' }}></span>
                      Incoming Handovers Received ({shift.handovers_received.length})
                    </div>
                    <div className="d-flex flex-column gap-2">
                      {shift.handovers_received.map((h) => (
                        <div key={h.id} className="p-2.5 bg-white rounded-3 border extra-small">
                          <div className="d-flex justify-content-between align-items-start mb-1">
                            <div>
                              <strong className="text-dark">From {h.from_user_name}</strong>
                              <div className="text-muted extra-small">
                                {new Date(h.handed_over_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                            <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill extra-small">
                              {h.status_display || h.status}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mt-2 pt-1 border-top">
                            <span className="text-secondary">Cash Received:</span>
                            <span className="fw-bold font-monospace text-success fs-6">+{formatCurrency(h.amount)}</span>
                          </div>
                          {h.notes && <div className="text-secondary extra-small mt-1 fst-italic">"{h.notes}"</div>}
                          {h.updated_by_name && (
                            <div className="text-muted extra-small mt-1">Accepted by: <strong>{h.updated_by_name}</strong></div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {shift.handovers_sent && shift.handovers_sent.length > 0 && (
                <div className="col-12 col-md-6">
                  <div className="border rounded-3 p-3 h-100 bg-light">
                    <div className="extra-small fw-bold text-primary text-uppercase mb-2 d-flex align-items-center gap-1">
                      <span className="rounded-circle" style={{ width: '6px', height: '6px', backgroundColor: '#2563EB' }}></span>
                      Outgoing Handovers Given ({shift.handovers_sent.length})
                    </div>
                    <div className="d-flex flex-column gap-2">
                      {shift.handovers_sent.map((h) => (
                        <div key={h.id} className="p-2.5 bg-white rounded-3 border extra-small">
                          <div className="d-flex justify-content-between align-items-start mb-1">
                            <div>
                              <strong className="text-dark">Transferred to {h.to_user_name}</strong>
                              <div className="text-muted extra-small">
                                {new Date(h.handed_over_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                            <span className={`badge rounded-pill extra-small ${
                              h.status === 'ACCEPTED' ? 'bg-success-subtle text-success border border-success-subtle' :
                              h.status === 'REJECTED' ? 'bg-danger-subtle text-danger border border-danger-subtle' :
                              'bg-warning-subtle text-warning-emphasis border border-warning-subtle'
                            }`}>
                              {h.status_display || h.status}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mt-2 pt-1 border-top">
                            <span className="text-secondary">Cash Handed Over:</span>
                            <span className="fw-bold font-monospace text-primary fs-6">{formatCurrency(h.amount)}</span>
                          </div>
                          {h.notes && <div className="text-secondary extra-small mt-1 fst-italic">"{h.notes}"</div>}
                          {h.rejection_reason && (
                            <div className="text-danger extra-small mt-1">Rejection Reason: {h.rejection_reason}</div>
                          )}
                          {h.updated_by_name && (
                            <div className="text-muted extra-small mt-1">Updated by: <strong>{h.updated_by_name}</strong></div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Expenses and Adjustments Row */}
        <div className="row g-3 mb-4">
          {/* Petty Cash Expenses */}
          <div className="col-12 col-md-6">
            <div className="border rounded-3 p-3 h-100 bg-light">
              <h6 className="fw-bold text-dark mb-2 d-flex align-items-center gap-1.5" style={{ fontSize: '0.85rem' }}>
                <Receipt size={14} className="text-danger" /> Cash Expenses ({shift.expenses?.length || 0})
              </h6>
              {(!shift.expenses || shift.expenses.length === 0) ? (
                <div className="extra-small text-secondary fst-italic">No expenses recorded during this shift.</div>
              ) : (
                <div className="d-flex flex-column gap-1.5">
                  {shift.expenses.map((e) => (
                    <div key={e.id} className="d-flex justify-content-between align-items-center p-2.5 bg-white rounded-2 border extra-small">
                      <div>
                        <div className="fw-semibold text-dark">{e.description}</div>
                        <div className="text-secondary" style={{ fontSize: '0.72rem' }}>
                          <span>{e.category_display} &bull; {new Date(e.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="ms-2">By: <strong>{e.created_by_name || 'Staff'}</strong></span>
                          {e.updated_by_name && e.updated_by_name !== e.created_by_name && (
                            <span className="ms-1 text-primary">(Edited by {e.updated_by_name})</span>
                          )}
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span className="font-monospace fw-bold text-danger">-{formatCurrency(e.amount)}</span>
                        <button
                          type="button"
                          className="btn btn-xs btn-light border p-1 rounded-1 text-secondary"
                          title="Print Thermal Petty Cash Voucher (80mm/58mm)"
                          onClick={() => {
                            setSelectedExpense(e);
                            setThermalMode('expense');
                            setShowThermalModal(true);
                          }}
                        >
                          <Printer size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cash Adjustments */}
          <div className="col-12 col-md-6">
            <div className="border rounded-3 p-3 h-100 bg-light">
              <h6 className="fw-bold text-dark mb-2 d-flex align-items-center gap-1.5" style={{ fontSize: '0.85rem' }}>
                <ArrowLeftRight size={14} className="text-primary" /> Cash Adjustments ({shift.adjustments?.length || 0})
              </h6>
              {(!shift.adjustments || shift.adjustments.length === 0) ? (
                <div className="extra-small text-secondary fst-italic">No float additions or drops recorded.</div>
              ) : (
                <div className="d-flex flex-column gap-1.5">
                  {shift.adjustments.map((a) => (
                    <div key={a.id} className="d-flex justify-content-between align-items-center p-2.5 bg-white rounded-2 border extra-small">
                      <div>
                        <div className="fw-semibold text-dark">{a.reason}</div>
                        <div className="text-secondary" style={{ fontSize: '0.72rem' }}>
                          <span>{a.adjustment_type_display}</span>
                          <span className="ms-2">By: <strong>{a.created_by_name || 'Staff'}</strong></span>
                          {a.updated_by_name && a.updated_by_name !== a.created_by_name && (
                            <span className="ms-1 text-primary">(Edited by {a.updated_by_name})</span>
                          )}
                        </div>
                      </div>
                      <span className={`font-monospace fw-bold ${a.adjustment_type === 'ADD_CASH' ? 'text-success' : 'text-danger'}`}>
                        {a.adjustment_type === 'ADD_CASH' ? `+${formatCurrency(a.amount)}` : `-${formatCurrency(a.amount)}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Itemized Transactions Table */}
        <div className="mb-4">
          <h6 className="fw-bold text-dark mb-2.5 d-flex align-items-center gap-1.5" style={{ fontSize: '0.9rem' }}>
            <CreditCard size={15} className="text-primary" /> Itemized Payment Receipts ({shift.payments?.length || 0})
          </h6>
          {(!shift.payments || shift.payments.length === 0) ? (
            <div className="p-3 text-center border rounded-3 bg-light text-secondary extra-small">
              No payment transactions linked to this shift.
            </div>
          ) : (
            <div className="table-responsive border rounded-3 overflow-hidden">
              <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: '0.8rem' }}>
                <thead className="table-light extra-small text-secondary">
                  <tr>
                    <th className="ps-3 py-2">Receipt #</th>
                    <th className="py-2">Time</th>
                    <th className="py-2">Guest / Customer</th>
                    <th className="py-2">Method</th>
                    <th className="py-2">Staff (Recorded / Updated)</th>
                    <th className="py-2">Reference</th>
                    <th className="text-end pe-3 py-2">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {shift.payments.map((p) => {
                    const recordedBy = p.created_by_name || p.received_by_name || 'Cashier';
                    const hasEdit = p.updated_by_name && p.updated_by_name !== recordedBy;

                    return (
                      <tr key={p.id}>
                        <td className="ps-3 fw-bold font-monospace text-dark">{p.payment_number}</td>
                        <td className="text-secondary">{p.payment_date ? new Date(p.payment_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                        <td className="fw-semibold text-dark">{p.customer_name || 'Walk-In'}</td>
                        <td>
                          <span className={`badge px-2 py-0.5 rounded-pill extra-small fw-semibold ${
                            p.payment_method === 'CASH' ? 'bg-success-subtle text-success border border-success-subtle' :
                            'bg-primary-subtle text-primary border border-primary-subtle'
                          }`}>
                            {p.payment_method}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex flex-column">
                            <span className="fw-semibold text-dark extra-small">{recordedBy}</span>
                            {hasEdit && (
                              <span className="text-primary extra-small" style={{ fontSize: '0.68rem' }}>
                                (Edited by {p.updated_by_name})
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="text-secondary extra-small text-truncate" style={{ maxWidth: '180px' }}>
                          {p.transaction_reference || p.notes || '—'}
                        </td>
                        <td className="text-end pe-3 font-monospace fw-bold text-dark">{formatCurrency(p.amount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Audit Trail & Signatures */}
        <div className="pt-3 border-top">
          <h6 className="fw-bold text-dark mb-2.5" style={{ fontSize: '0.85rem' }}>
            Shift Audit History &amp; Authorizations
          </h6>
          
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <div className="p-3 bg-light rounded-3 border extra-small">
                <div className="mb-1"><strong>Opened By:</strong> {shift.user_name} at {new Date(shift.opened_at).toLocaleString('en-IN')}</div>
                {shift.closed_by_name && (
                  <div className="mb-1"><strong>Closed By:</strong> {shift.closed_by_name} at {new Date(shift.closed_at).toLocaleString('en-IN')}</div>
                )}
                {shift.updated_by_name && (
                  <div className="mb-1 text-secondary"><strong>Last Modified By:</strong> {shift.updated_by_name} at {new Date(shift.updated_at).toLocaleString('en-IN')}</div>
                )}
                {shift.manager_approved_by_name && (
                  <div className="mb-1 text-success">
                    <strong>Manager Approved:</strong> {shift.manager_approved_by_name} at {new Date(shift.manager_approved_at).toLocaleString('en-IN')}
                    {shift.manager_approval_notes && <div className="fst-italic text-secondary mt-0.5">"{shift.manager_approval_notes}"</div>}
                  </div>
                )}
                {shift.reopened_by && (
                  <div className="mt-1 text-danger">
                    <strong>Reopened:</strong> Reason: {shift.reopen_reason}
                  </div>
                )}
              </div>
            </div>

            {/* Signature Blocks for Print */}
            <div className="col-12 col-md-6">
              <div className="d-flex justify-content-between align-items-end h-100 pt-4 px-3">
                <div className="text-center" style={{ minWidth: '130px' }}>
                  <div className="border-top border-dark pt-1 fw-semibold extra-small">Cashier Signature</div>
                </div>
                <div className="text-center" style={{ minWidth: '130px' }}>
                  <div className="border-top border-dark pt-1 fw-semibold extra-small">Manager / Auditor Signature</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Manager Approval Modal */}
      {shift && (
        <ShiftApprovalModal
          isOpen={showApprovalModal}
          onClose={() => setShowApprovalModal(false)}
          shift={shift}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['shift-details', id] });
          }}
        />
      )}

      {/* Thermal Slip & Voucher Modal */}
      <ThermalSlipModal
        isOpen={showThermalModal}
        onClose={() => {
          setShowThermalModal(false);
          setSelectedExpense(null);
        }}
        shift={shift}
        expense={selectedExpense}
        mode={thermalMode}
      />

      {/* Manager Standard Close Till Modal */}
      {shift && (
        <CloseShiftModal
          isOpen={showCloseModal}
          onClose={() => setShowCloseModal(false)}
          shift={shift}
          financials={shift.financials}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['shift-details', id] });
          }}
        />
      )}

      {/* Admin Force Close Modal */}
      {shift && (
        <AdminForceCloseModal
          isOpen={showForceCloseModal}
          onClose={() => setShowForceCloseModal(false)}
          shift={shift}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['shift-details', id] });
          }}
        />
      )}

    </div>
  );
};

export default ShiftDetails;
