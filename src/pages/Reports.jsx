import React, { useEffect, useState } from 'react';
import { getRevenueReportApi, getOccupancyReportApi, getGuestRegisterReportApi } from '../api/reportApi';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/dateUtils';

const Reports = () => {
  const [activeReport, setActiveReport] = useState('revenue');

  // Revenue Report states
  const [period, setPeriod] = useState('this_month');
  const [revenueData, setRevenueData] = useState(null);

  // Occupancy Report states
  const [occupancyData, setOccupancyData] = useState(null);

  // Guest Register states
  const [guestRegister, setGuestRegister] = useState([]);
  const [searchGuest, setSearchGuest] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeReport === 'revenue') loadRevenue();
    if (activeReport === 'occupancy') loadOccupancy();
    if (activeReport === 'register') loadGuestRegister();
  }, [activeReport, period]);

  const loadRevenue = async () => {
    setLoading(true);
    try {
      const data = await getRevenueReportApi({ period });
      setRevenueData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadOccupancy = async () => {
    setLoading(true);
    try {
      const data = await getOccupancyReportApi();
      setOccupancyData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadGuestRegister = async () => {
    setLoading(true);
    try {
      const data = await getGuestRegisterReportApi(searchGuest);
      setGuestRegister(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 no-print">
        <div>
          <h4 className="fw-bold m-0 text-dark">Lodge Reports & Analytics</h4>
          <span className="text-muted small">Financial summaries, occupancy metrics, and statutory guest registers</span>
        </div>
        <button className="btn btn-outline-primary" onClick={handlePrint}>
          <i className="bi bi-printer me-1"></i> Print / Save PDF
        </button>
      </div>

      {/* Tabs Header */}
      <ul className="nav nav-pills mb-4 border-bottom pb-3 no-print">
        <li className="nav-item">
          <button className={`nav-link fw-semibold me-2 ${activeReport === 'revenue' ? 'active' : ''}`} onClick={() => setActiveReport('revenue')}>
            <i className="bi bi-cash-stack me-1"></i> Revenue Report
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link fw-semibold me-2 ${activeReport === 'occupancy' ? 'active' : ''}`} onClick={() => setActiveReport('occupancy')}>
            <i className="bi bi-pie-chart me-1"></i> Occupancy Report
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link fw-semibold me-2 ${activeReport === 'register' ? 'active' : ''}`} onClick={() => setActiveReport('register')}>
            <i className="bi bi-journal-bookmark me-1"></i> Guest Register
          </button>
        </li>
      </ul>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : activeReport === 'revenue' && revenueData ? (
        <div>
          {/* Filters */}
          <div className="card border-0 shadow-sm mb-4 no-print">
            <div className="card-body p-3 d-flex align-items-center gap-3">
              <span className="fw-semibold">Filter Period:</span>
              {['today', 'yesterday', 'this_week', 'this_month'].map((p) => (
                <button
                  key={p}
                  className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-light border'}`}
                  onClick={() => setPeriod(p)}
                >
                  {p.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Revenue Summary Cards */}
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="p-3 bg-white rounded border shadow-sm">
                <div className="text-muted small">Room Revenue</div>
                <h3 className="fw-bold text-primary m-0 mt-1">{formatCurrency(revenueData.summary?.room_revenue)}</h3>
              </div>
            </div>
            <div className="col-md-3">
              <div className="p-3 bg-white rounded border shadow-sm">
                <div className="text-muted small">Extra Charges</div>
                <h3 className="fw-bold text-warning m-0 mt-1">{formatCurrency(revenueData.summary?.extra_charges)}</h3>
              </div>
            </div>
            <div className="col-md-3">
              <div className="p-3 bg-white rounded border shadow-sm">
                <div className="text-muted small">Discounts Given</div>
                <h3 className="fw-bold text-danger m-0 mt-1">-{formatCurrency(revenueData.summary?.discounts)}</h3>
              </div>
            </div>
            <div className="col-md-3">
              <div className="p-3 bg-white rounded border shadow-sm">
                <div className="text-muted small">Total Collections</div>
                <h3 className="fw-bold text-success m-0 mt-1">{formatCurrency(revenueData.summary?.total_payments)}</h3>
              </div>
            </div>
          </div>

          {/* Payment Method Breakdown */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3">
              <h5 className="m-0 fw-bold"><i className="bi bi-wallet2 me-2 text-primary"></i>Collection Breakdown by Payment Method</h5>
            </div>
            <div className="card-body p-0">
              <table className="table table-hover align-middle m-0">
                <thead className="table-light">
                  <tr>
                    <th>Payment Method</th>
                    <th className="text-end">Total Collections (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueData.by_payment_method?.map((pm, idx) => (
                    <tr key={idx}>
                      <td className="fw-bold">{pm.method}</td>
                      <td className="text-end fw-bold text-success">{formatCurrency(pm.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeReport === 'occupancy' && occupancyData ? (
        <div>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="card border-0 shadow-sm p-4 text-center">
                <div className="text-muted fw-semibold">LODGE OCCUPANCY RATE</div>
                <h1 className="fw-bold text-primary display-4 my-2">{occupancyData.occupancy_percentage}%</h1>
                <div className="text-muted small">{occupancyData.occupied} of {occupancyData.total_rooms} Rooms Occupied</div>
              </div>
            </div>

            <div className="col-md-8">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white py-3">
                  <h5 className="m-0 fw-bold">Room Status Breakdown</h5>
                </div>
                <div className="card-body p-0">
                  <table className="table table-hover align-middle m-0">
                    <thead className="table-light">
                      <tr>
                        <th>Status</th>
                        <th className="text-center">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><span className="badge badge-occupied">OCCUPIED</span></td>
                        <td className="text-center fw-bold">{occupancyData.occupied}</td>
                      </tr>
                      <tr>
                        <td><span className="badge badge-reserved">RESERVED</span></td>
                        <td className="text-center fw-bold">{occupancyData.reserved}</td>
                      </tr>
                      <tr>
                        <td><span className="badge badge-available">AVAILABLE</span></td>
                        <td className="text-center fw-bold">{occupancyData.available}</td>
                      </tr>
                      <tr>
                        <td><span className="badge badge-cleaning">CLEANING</span></td>
                        <td className="text-center fw-bold">{occupancyData.cleaning}</td>
                      </tr>
                      <tr>
                        <td><span className="badge badge-maintenance">MAINTENANCE</span></td>
                        <td className="text-center fw-bold">{occupancyData.maintenance}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          {/* Guest Register */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
              <h5 className="m-0 fw-bold"><i className="bi bi-journal-text me-2 text-primary"></i>Statutory Guest Register</h5>
              <div className="no-print" style={{ width: '300px' }}>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Search register..."
                  value={searchGuest}
                  onChange={(e) => {
                    setSearchGuest(e.target.value);
                    loadGuestRegister();
                  }}
                />
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-bordered table-striped align-middle m-0 small">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Guest Name</th>
                      <th>Mobile</th>
                      <th>ID Proof Type</th>
                      <th>ID Number</th>
                      <th>Residential Address</th>
                      <th>Room #</th>
                      <th>Check-In Date</th>
                      <th>Check-Out Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guestRegister.map((g, idx) => (
                      <tr key={g.id}>
                        <td>{idx + 1}</td>
                        <td className="fw-bold">{g.guest_name}</td>
                        <td>{g.mobile}</td>
                        <td>{g.id_type}</td>
                        <td>{g.id_number}</td>
                        <td>{g.address}</td>
                        <td className="fw-bold">Room {g.room_number}</td>
                        <td>{formatDate(g.check_in_date)}</td>
                        <td>{formatDate(g.actual_checkout_date || g.expected_checkout_date)}</td>
                        <td><span className="badge bg-light text-dark border">{g.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
