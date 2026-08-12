import React, { useEffect, useState } from 'react';
import { getPaymentsApi } from '../api/billingApi';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/dateUtils';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const data = await getPaymentsApi();
      setPayments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold m-0 text-dark">Payment Transactions Log</h4>
          <span className="text-muted small">Complete audit trail of advance, partial, and final checkout payments</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle m-0">
                <thead className="table-light">
                  <tr>
                    <th>Payment #</th>
                    <th>Stay #</th>
                    <th>Guest Name</th>
                    <th>Room</th>
                    <th>Date & Time</th>
                    <th>Method</th>
                    <th>Txn Reference</th>
                    <th>Received By</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr><td colSpan="9" className="text-center text-muted py-4">No payment transactions recorded</td></tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id}>
                        <td className="fw-bold text-primary">{p.payment_number}</td>
                        <td className="fw-semibold">{p.stay_number}</td>
                        <td>{p.customer_name}</td>
                        <td><span className="badge bg-primary">Room {p.room_number}</span></td>
                        <td>{formatDate(p.payment_date)}</td>
                        <td><span className="badge bg-light text-dark border">{p.payment_method}</span></td>
                        <td>{p.transaction_reference || 'N/A'}</td>
                        <td>{p.received_by_name || 'Staff'}</td>
                        <td className="fw-bold text-success fs-6">{formatCurrency(p.amount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
