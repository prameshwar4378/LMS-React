import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getStaysApi, extendStayApi } from '../api/stayApi';
import { addStayGuestApi } from '../api/stayApi';
import { createExtraChargeApi, createPaymentApi } from '../api/billingApi';
import StatusBadge from '../components/StatusBadge';
import GuestFormModal from '../components/GuestFormModal';
import ChargeFormModal from '../components/ChargeFormModal';
import PaymentFormModal from '../components/PaymentFormModal';
import PageLoader from '../components/PageLoader';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/dateUtils';

const CurrentStays = () => {
  const [stays, setStays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  // Modal target stay ID
  const [activeStayId, setActiveStayId] = useState(null);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeBalance, setActiveBalance] = useState(0);

  // Extend Stay modal
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [newExtendCheckout, setNewExtendCheckout] = useState('');

  useEffect(() => {
    loadStays();
  }, [search]);

  const loadStays = async () => {
    setLoading(true);
    try {
      const data = await getStaysApi({ current: 'true', search });
      setStays(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGuestSubmit = async (formData) => {
    try {
      await addStayGuestApi(formData);
      setShowGuestModal(false);
      loadStays();
    } catch (err) {
      alert('Error adding guest.');
    }
  };

  const handleAddChargeSubmit = async (data) => {
    try {
      await createExtraChargeApi(data);
      setShowChargeModal(false);
      loadStays();
    } catch (err) {
      alert('Error adding charge.');
    }
  };

  const handleAddPaymentSubmit = async (data) => {
    try {
      await createPaymentApi(data);
      setShowPaymentModal(false);
      loadStays();
    } catch (err) {
      alert('Error adding payment.');
    }
  };

  const handleExtendSubmit = async (e) => {
    e.preventDefault();
    try {
      await extendStayApi(activeStayId, newExtendCheckout);
      setShowExtendModal(false);
      loadStays();
    } catch (err) {
      alert(err.response?.data?.error || 'Error extending stay.');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold m-0 text-dark">Current Lodge Stays</h4>
          <span className="text-muted small">Operational dashboard for active guests staying in rooms</span>
        </div>
        <Link to="/check-in" className="btn btn-primary fw-semibold shadow-sm">
          <i className="bi bi-box-arrow-in-right me-1"></i> New Check-In
        </Link>
      </div>

      {/* Search */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <input
            type="text"
            className="form-control"
            placeholder="Search active stay by Stay #, Guest Name, Mobile #, or Room #"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <PageLoader fullScreen={false} message="Loading Active Guest Stays..." />
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle m-0">
                <thead className="table-light">
                  <tr>
                    <th>Stay #</th>
                    <th>Room</th>
                    <th>Primary Guest</th>
                    <th>Mobile</th>
                    <th>Check-In</th>
                    <th>Expected Checkout</th>
                    <th>Grand Total</th>
                    <th>Paid Amount</th>
                    <th>Balance</th>
                    <th>Quick Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stays.length === 0 ? (
                    <tr><td colSpan="10" className="text-center text-muted py-4">No active stays currently</td></tr>
                  ) : (
                    stays.map((s) => {
                      const bill = s.bill_summary || {};
                      return (
                        <tr key={s.id}>
                          <td className="fw-bold text-primary">{s.stay_number}</td>
                          <td><span className="badge bg-primary fs-6">Room {s.room_detail?.room_number}</span></td>
                          <td className="fw-bold">{s.primary_customer_detail?.full_name}</td>
                          <td>{s.primary_customer_detail?.mobile}</td>
                          <td>{formatDate(s.check_in_date)}</td>
                          <td>{formatDate(s.expected_checkout_date)}</td>
                          <td>{formatCurrency(bill.grand_total)}</td>
                          <td className="text-success">{formatCurrency(bill.total_paid)}</td>
                          <td className={`fw-bold ${bill.balance > 0 ? 'text-danger' : 'text-muted'}`}>{formatCurrency(bill.balance)}</td>
                          <td>
                            <div className="dropdown">
                              <button className="btn btn-sm btn-light border dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                Actions
                              </button>
                              <ul className="dropdown-menu dropdown-menu-end shadow border-0">
                                <li>
                                  <Link to={`/stays/${s.id}`} className="dropdown-item">
                                    <i className="bi bi-eye text-primary me-2"></i> View Stay Details
                                  </Link>
                                </li>
                                <li>
                                  <button className="dropdown-item" onClick={() => { setActiveStayId(s.id); setShowGuestModal(true); }}>
                                    <i className="bi bi-person-plus text-info me-2"></i> Add Additional Guest
                                  </button>
                                </li>
                                <li>
                                  <button className="dropdown-item" onClick={() => { setActiveStayId(s.id); setShowChargeModal(true); }}>
                                    <i className="bi bi-cart-plus text-warning me-2"></i> Add Extra Charge
                                  </button>
                                </li>
                                <li>
                                  <button className="dropdown-item" onClick={() => { setActiveStayId(s.id); setActiveBalance(bill.balance); setShowPaymentModal(true); }}>
                                    <i className="bi bi-cash-coin text-success me-2"></i> Add Payment
                                  </button>
                                </li>
                                <li>
                                  <button className="dropdown-item" onClick={() => { setActiveStayId(s.id); setNewExtendCheckout(s.expected_checkout_date); setShowExtendModal(true); }}>
                                    <i className="bi bi-calendar-plus text-primary me-2"></i> Extend Stay
                                  </button>
                                </li>
                                <li><hr className="dropdown-divider" /></li>
                                <li>
                                  <Link to={`/checkout/${s.id}`} className="dropdown-item text-danger fw-semibold">
                                    <i className="bi bi-box-arrow-right me-2"></i> Process Checkout
                                  </Link>
                                </li>
                              </ul>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <GuestFormModal show={showGuestModal} onClose={() => setShowGuestModal(false)} onSubmit={handleAddGuestSubmit} stayId={activeStayId} />
      <ChargeFormModal show={showChargeModal} onClose={() => setShowChargeModal(false)} onSubmit={handleAddChargeSubmit} stayId={activeStayId} />
      <PaymentFormModal show={showPaymentModal} onClose={() => setShowPaymentModal(false)} onSubmit={handleAddPaymentSubmit} stayId={activeStayId} currentBalance={activeBalance} />

      {/* Extend Stay Modal */}
      {showExtendModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title"><i className="bi bi-calendar-plus me-2"></i>Extend Stay</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowExtendModal(false)}></button>
              </div>
              <form onSubmit={handleExtendSubmit}>
                <div className="modal-body p-4">
                  <label className="form-label fw-semibold">New Expected Check-Out Date *</label>
                  <input
                    type="date"
                    className="form-control form-control-lg"
                    required
                    value={newExtendCheckout}
                    onChange={(e) => setNewExtendCheckout(e.target.value)}
                  />
                  <div className="text-muted small mt-2">
                    Backend will verify room availability before extending dates and updating charges.
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowExtendModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary"><i className="bi bi-check-circle me-1"></i> Extend Stay</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrentStays;
