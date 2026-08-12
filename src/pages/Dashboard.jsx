import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getDashboardReportApi } from '../api/reportApi';
import { useAuth } from '../context/AuthContext';
import PageLoader from '../components/PageLoader';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/dateUtils';
import {
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
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Building2,
  DoorOpen,
  UserCheck,
  UserX,
  CalendarCheck,
  CreditCard,
  TrendingUp,
  Sparkles,
  Clock,
  Activity,
  PlusCircle,
  Search,
  Receipt,
  FileText,
  CheckCircle2,
  Zap,
  ShieldAlert,
  CalendarDays,
  KeyRound,
  Users,
  DollarSign,
  PieChart as PieIcon,
  ArrowUpRight,
  ChevronRight,
  MoreVertical,
  Check,
  AlertCircle,
  Wrench,
  Sparkle,
  Grid
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const res = await getDashboardReportApi();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PageLoader fullScreen={false} message="Initializing Luxury PMS SaaS Dashboard..." />;
  }

  const { cards = {}, charts = {}, tables = {}, room_grid = [], recent_activities = [] } = data || {};

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="pb-5">

      {/* ========================================================= */}
      {/* SECTION 1: WELCOME HEADER & QUICK LAUNCH ACTIONS           */}
      {/* ========================================================= */}
      <div className="saas-card p-4 mb-4 bg-white border-0 shadow-sm d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-3 py-1 fw-semibold">
              <Sparkles size={14} className="me-1" /> Cloud PMS v2.5
            </span>
            <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-1 fw-semibold">
              Occupancy: {cards.occupancy_percentage}%
            </span>
          </div>
          <h2 className="fw-bold text-dark m-0 tracking-tight">
            {greeting}, {user?.first_name || user?.username || 'Receptionist'}! 👋
          </h2>
          <p className="text-muted m-0 small mt-1">
            Today is {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}. Here is your lodge operational pulse.
          </p>
        </div>

        {/* Quick Launcher Bar */}
        <div className="d-flex flex-wrap align-items-center gap-2">
          <Link to="/check-in?mode=walkin" className="btn btn-primary fw-semibold px-3 py-2 rounded-3 shadow-sm d-flex align-items-center gap-2">
            <Zap size={16} /> New Walk-In
          </Link>
          <Link to="/bookings/create" className="btn btn-outline-primary fw-semibold px-3 py-2 rounded-3 d-flex align-items-center gap-2">
            <PlusCircle size={16} /> New Booking
          </Link>
          <Link to="/check-in" className="btn btn-light border fw-semibold px-3 py-2 rounded-3 d-flex align-items-center gap-2">
            <UserCheck size={16} className="text-success" /> Check-In
          </Link>
          <Link to="/current-stays" className="btn btn-light border fw-semibold px-3 py-2 rounded-3 d-flex align-items-center gap-2">
            <UserX size={16} className="text-warning" /> Check-Out
          </Link>
          <Link to="/rooms" className="btn btn-light border fw-semibold px-3 py-2 rounded-3 d-flex align-items-center gap-2">
            <Building2 size={16} className="text-primary" /> Rooms
          </Link>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 2: 10 PREMIUM COLORFUL GRADIENT STATISTIC CARDS   */}
      {/* ========================================================= */}
      <div className="row g-3 mb-4">
        {/* 1. Total Rooms */}
        <div className="col-xl-2 col-md-4 col-sm-6">
          <div className="saas-card stat-gradient-dark p-3 h-100 position-relative overflow-hidden">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="text-white-50 small fw-semibold text-uppercase" style={{ fontSize: '0.725rem' }}>Total Rooms</div>
                <h2 className="fw-bold text-white m-0 mt-1">{cards.total_rooms}</h2>
              </div>
              <div className="glass-pill p-2 text-white">
                <Building2 size={20} />
              </div>
            </div>
            <div className="mt-3 text-white-50" style={{ fontSize: '0.75rem' }}>
              <span>Lodge Capacity</span>
            </div>
          </div>
        </div>

        {/* 2. Available Rooms */}
        <div className="col-xl-2 col-md-4 col-sm-6">
          <div className="saas-card stat-gradient-green p-3 h-100 position-relative overflow-hidden">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="text-white-50 small fw-semibold text-uppercase" style={{ fontSize: '0.725rem' }}>Available</div>
                <h2 className="fw-bold text-white m-0 mt-1">{cards.available_rooms}</h2>
              </div>
              <div className="glass-pill p-2 text-white">
                <DoorOpen size={20} />
              </div>
            </div>
            <div className="mt-3 text-white-50" style={{ fontSize: '0.75rem' }}>
              <span>Ready for check-in</span>
            </div>
          </div>
        </div>

        {/* 3. Occupied Rooms */}
        <div className="col-xl-2 col-md-4 col-sm-6">
          <div className="saas-card stat-gradient-red p-3 h-100 position-relative overflow-hidden">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="text-white-50 small fw-semibold text-uppercase" style={{ fontSize: '0.725rem' }}>Occupied</div>
                <h2 className="fw-bold text-white m-0 mt-1">{cards.occupied_rooms}</h2>
              </div>
              <div className="glass-pill p-2 text-white">
                <KeyRound size={20} />
              </div>
            </div>
            <div className="mt-3 text-white-50" style={{ fontSize: '0.75rem' }}>
              <span>Active guests in-house</span>
            </div>
          </div>
        </div>

        {/* 4. Reserved Rooms */}
        <div className="col-xl-2 col-md-4 col-sm-6">
          <div className="saas-card stat-gradient-blue p-3 h-100 position-relative overflow-hidden">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="text-white-50 small fw-semibold text-uppercase" style={{ fontSize: '0.725rem' }}>Reserved</div>
                <h2 className="fw-bold text-white m-0 mt-1">{cards.reserved_rooms}</h2>
              </div>
              <div className="glass-pill p-2 text-white">
                <CalendarCheck size={20} />
              </div>
            </div>
            <div className="mt-3 text-white-50" style={{ fontSize: '0.75rem' }}>
              <span>Advance bookings</span>
            </div>
          </div>
        </div>

        {/* 5. Cleaning Rooms */}
        <div className="col-xl-2 col-md-4 col-sm-6">
          <div className="saas-card stat-gradient-purple p-3 h-100 position-relative overflow-hidden">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="text-white-50 small fw-semibold text-uppercase" style={{ fontSize: '0.725rem' }}>Housekeeping</div>
                <h2 className="fw-bold text-white m-0 mt-1">{cards.cleaning_rooms}</h2>
              </div>
              <div className="glass-pill p-2 text-white">
                <Sparkle size={20} />
              </div>
            </div>
            <div className="mt-3 text-white-50" style={{ fontSize: '0.75rem' }}>
              <span>Cleaning in progress</span>
            </div>
          </div>
        </div>

        {/* 6. Maintenance Rooms */}
        <div className="col-xl-2 col-md-4 col-sm-6">
          <div className="saas-card stat-gradient-orange p-3 h-100 position-relative overflow-hidden">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="text-white-50 small fw-semibold text-uppercase" style={{ fontSize: '0.725rem' }}>Maintenance</div>
                <h2 className="fw-bold text-white m-0 mt-1">{cards.maintenance_rooms}</h2>
              </div>
              <div className="glass-pill p-2 text-white">
                <Wrench size={20} />
              </div>
            </div>
            <div className="mt-3 text-white-50" style={{ fontSize: '0.75rem' }}>
              <span>Blocked for repair</span>
            </div>
          </div>
        </div>

        {/* 7. Today's Revenue */}
        <div className="col-xl-3 col-md-6">
          <div className="saas-card stat-gradient-teal p-3 h-100 position-relative overflow-hidden">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="text-white-50 small fw-semibold text-uppercase" style={{ fontSize: '0.725rem' }}>Today's Revenue</div>
                <h3 className="fw-bold text-white m-0 mt-1">{formatCurrency(cards.today_revenue)}</h3>
              </div>
              <div className="glass-pill p-2.5 text-white">
                <DollarSign size={22} />
              </div>
            </div>
            <div className="mt-3 text-white-50 d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
              <TrendingUp size={14} className="text-white" /> Live collections today
            </div>
          </div>
        </div>

        {/* 8. Pending Payments */}
        <div className="col-xl-3 col-md-6">
          <div className="saas-card stat-gradient-pink p-3 h-100 position-relative overflow-hidden">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="text-white-50 small fw-semibold text-uppercase" style={{ fontSize: '0.725rem' }}>Pending Payments</div>
                <h3 className="fw-bold text-white m-0 mt-1">{formatCurrency(cards.pending_payments)}</h3>
              </div>
              <div className="glass-pill p-2.5 text-white">
                <AlertCircle size={22} />
              </div>
            </div>
            <div className="mt-3 text-white-50" style={{ fontSize: '0.75rem' }}>
              Outstanding guest balances
            </div>
          </div>
        </div>

        {/* 9. Today's Check-Ins */}
        <div className="col-xl-3 col-md-6">
          <div className="saas-card bg-white p-3 h-100 border shadow-xs d-flex align-items-center justify-content-between">
            <div>
              <div className="text-muted small fw-semibold text-uppercase" style={{ fontSize: '0.725rem' }}>Today's Check-Ins</div>
              <h3 className="fw-bold text-dark m-0 mt-1">{cards.today_checkins_count}</h3>
            </div>
            <div className="p-3 bg-primary-subtle text-primary rounded-3">
              <UserCheck size={24} />
            </div>
          </div>
        </div>

        {/* 10. Today's Check-Outs */}
        <div className="col-xl-3 col-md-6">
          <div className="saas-card bg-white p-3 h-100 border shadow-xs d-flex align-items-center justify-content-between">
            <div>
              <div className="text-muted small fw-semibold text-uppercase" style={{ fontSize: '0.725rem' }}>Today's Check-Outs</div>
              <h3 className="fw-bold text-dark m-0 mt-1">{cards.today_checkouts_count}</h3>
            </div>
            <div className="p-3 bg-warning-subtle text-warning rounded-3">
              <UserX size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 3: RECHARTS INTERACTIVE ANALYTICS                 */}
      {/* ========================================================= */}
      <div className="row g-4 mb-4">
        {/* Occupancy & Revenue Trend Line/Area Chart */}
        <div className="col-lg-8">
          <div className="saas-card p-4 h-100 border-0 bg-white shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold text-dark m-0">7-Day Occupancy & Revenue Trend</h5>
                <span className="text-muted small">Daily performance analytics</span>
              </div>
              <div className="badge bg-light text-dark border px-3 py-1.5 rounded-pill fw-semibold">
                7-Day Overview
              </div>
            </div>

            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.days_trend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
                    formatter={(val, name) => [name === 'revenue' ? formatCurrency(val) : `${val}%`, name === 'revenue' ? 'Revenue' : 'Occupancy Rate']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Room Status Distribution Donut Chart */}
        <div className="col-lg-4">
          <div className="saas-card p-4 h-100 border-0 bg-white shadow-sm d-flex flex-column justify-content-between">
            <div>
              <h5 className="fw-bold text-dark m-0">Room Inventory Breakdown</h5>
              <span className="text-muted small">Current status distribution</span>
            </div>

            <div className="my-3" style={{ width: '100%', height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.room_status_donut || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {(charts.room_status_donut || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="d-flex flex-wrap gap-2 justify-content-center">
              {(charts.room_status_donut || []).map((st) => (
                <div key={st.name} className="d-flex align-items-center gap-1.5 small text-dark fw-medium">
                  <span className="rounded-circle" style={{ width: '10px', height: '10px', backgroundColor: st.color }}></span>
                  <span>{st.name}: <strong>{st.value}</strong></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 4: TODAY'S OPERATIONS (CHECK-INS & CHECK-OUTS)    */}
      {/* ========================================================= */}
      <div className="row g-4 mb-4">
        {/* Today's Check-Ins Card */}
        <div className="col-lg-6">
          <div className="saas-card border-0 bg-white shadow-sm h-100">
            <div className="p-4 border-bottom d-flex justify-content-between align-items-center">
              <div>
                <h5 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
                  <UserCheck size={20} className="text-primary" /> Today's Scheduled Check-Ins
                </h5>
                <span className="text-muted small">Guests arriving today</span>
              </div>
              <Link to="/bookings" className="btn btn-sm btn-light border fw-semibold">View All</Link>
            </div>
            <div className="p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle m-0" style={{ fontSize: '0.875rem' }}>
                  <thead className="table-light">
                    <tr>
                      <th>Booking #</th>
                      <th>Guest</th>
                      <th>Room</th>
                      <th>Time</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tables.today_checkins?.length === 0 ? (
                      <tr><td colSpan="5" className="text-center text-muted py-4">No check-ins scheduled for today</td></tr>
                    ) : (
                      tables.today_checkins?.map((b) => (
                        <tr key={b.id}>
                          <td className="fw-bold text-primary">{b.booking_number}</td>
                          <td>
                            <div className="fw-semibold text-dark">{b.customer_name}</div>
                            <div className="text-muted" style={{ fontSize: '0.725rem' }}>{b.mobile}</div>
                          </td>
                          <td><span className="badge bg-dark rounded-pill">Room {b.room_number}</span></td>
                          <td>{b.check_in_time}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-primary py-1 px-3 rounded-pill fw-semibold shadow-xs"
                              onClick={() => navigate(`/check-in?booking_id=${b.id}`)}
                            >
                              Check-In
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Check-Outs Card */}
        <div className="col-lg-6">
          <div className="saas-card border-0 bg-white shadow-sm h-100">
            <div className="p-4 border-bottom d-flex justify-content-between align-items-center">
              <div>
                <h5 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
                  <UserX size={20} className="text-warning" /> Today's Expected Check-Outs
                </h5>
                <span className="text-muted small">Guests departing today</span>
              </div>
              <Link to="/current-stays" className="btn btn-sm btn-light border fw-semibold">View All Stays</Link>
            </div>
            <div className="p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle m-0" style={{ fontSize: '0.875rem' }}>
                  <thead className="table-light">
                    <tr>
                      <th>Guest</th>
                      <th>Room</th>
                      <th>Total</th>
                      <th>Balance</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tables.today_checkouts?.length === 0 ? (
                      <tr><td colSpan="5" className="text-center text-muted py-4">No check-outs scheduled for today</td></tr>
                    ) : (
                      tables.today_checkouts?.map((s) => (
                        <tr key={s.id}>
                          <td>
                            <div className="fw-semibold text-dark">{s.customer_name}</div>
                            <div className="text-muted" style={{ fontSize: '0.725rem' }}>{s.mobile}</div>
                          </td>
                          <td><span className="badge bg-dark rounded-pill">Room {s.room_number}</span></td>
                          <td>{formatCurrency(s.grand_total)}</td>
                          <td className="fw-bold text-danger">{formatCurrency(s.balance)}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-danger py-1 px-3 rounded-pill fw-semibold"
                              onClick={() => navigate(`/checkout/${s.id}`)}
                            >
                              Checkout
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 5: CURRENT GUESTS DIRECTORY TABLE                 */}
      {/* ========================================================= */}
      <div className="saas-card border-0 bg-white shadow-sm mb-4">
        <div className="p-4 border-bottom d-flex justify-content-between align-items-center">
          <div>
            <h5 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
              <Users size={20} className="text-success" /> Current Guests In House
            </h5>
            <span className="text-muted small">Live list of all checked-in guests</span>
          </div>
          <Link to="/current-stays" className="btn btn-sm btn-primary fw-semibold rounded-3">Manage Stays</Link>
        </div>
        <div className="p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle m-0">
              <thead className="table-light" style={{ fontSize: '0.825rem' }}>
                <tr>
                  <th>Room</th>
                  <th>Guest Profile</th>
                  <th>Check-In</th>
                  <th>Expected Check-Out</th>
                  <th>Grand Total</th>
                  <th>Paid</th>
                  <th>Balance Due</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.875rem' }}>
                {tables.current_guests?.length === 0 ? (
                  <tr><td colSpan="8" className="text-center text-muted py-5">No guests currently staying in the lodge</td></tr>
                ) : (
                  tables.current_guests?.map((cg) => (
                    <tr key={cg.id}>
                      <td>
                        <span className="badge bg-primary fs-6 px-3 py-1.5 rounded-pill shadow-xs">
                          Room {cg.room_number}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2.5">
                          <div className="rounded-circle bg-primary-subtle text-primary fw-bold d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                            {cg.guest_name.charAt(0)}
                          </div>
                          <div>
                            <div className="fw-bold text-dark">{cg.guest_name}</div>
                            <div className="text-muted small">📞 {cg.mobile}</div>
                          </div>
                        </div>
                      </td>
                      <td>{formatDate(cg.check_in_date)}</td>
                      <td>{formatDate(cg.expected_checkout_date)}</td>
                      <td>{formatCurrency(cg.grand_total)}</td>
                      <td className="text-success fw-medium">{formatCurrency(cg.total_paid)}</td>
                      <td>
                        <span className={`fw-bold ${cg.balance > 0 ? 'text-danger' : 'text-success'}`}>
                          {formatCurrency(cg.balance)}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-1.5">
                          <Link to={`/stays/${cg.id}`} className="btn btn-sm btn-outline-primary py-1 px-2.5 rounded-2">
                            Details
                          </Link>
                          <Link to={`/checkout/${cg.id}`} className="btn btn-sm btn-danger py-1 px-2.5 rounded-2 fw-semibold">
                            Checkout
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 6: VISUAL HOTEL ROOM AVAILABILITY GRID            */}
      {/* ========================================================= */}
      <div className="saas-card border-0 bg-white shadow-sm mb-4 p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
              <Grid size={20} className="text-primary" /> Visual Room Status Grid
            </h5>
            <span className="text-muted small">Real-time room occupancy and housekeeping map</span>
          </div>
          <Link to="/rooms" className="btn btn-sm btn-light border fw-semibold">Full Rooms Inventory</Link>
        </div>

        <div className="row g-3">
          {room_grid.map((rm) => {
            let statusBorder = 'border-start border-4 border-success';
            let badgeBg = 'bg-success-subtle text-success';

            if (rm.status === 'OCCUPIED') {
              statusBorder = 'border-start border-4 border-danger';
              badgeBg = 'bg-danger-subtle text-danger';
            } else if (rm.status === 'RESERVED') {
              statusBorder = 'border-start border-4 border-primary';
              badgeBg = 'bg-primary-subtle text-primary';
            } else if (rm.status === 'CLEANING') {
              statusBorder = 'border-start border-4 border-purple';
              badgeBg = 'bg-purple-subtle text-purple';
            } else if (rm.status === 'MAINTENANCE') {
              statusBorder = 'border-start border-4 border-secondary';
              badgeBg = 'bg-secondary-subtle text-secondary';
            }

            return (
              <div key={rm.id} className="col-xl-3 col-md-4 col-sm-6">
                <div className={`saas-card p-3 bg-white border ${statusBorder} h-100`}>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-bold text-dark fs-5">Room {rm.room_number}</span>
                    <span className={`badge ${badgeBg} rounded-pill px-2.5 py-1 fw-semibold`} style={{ fontSize: '0.725rem' }}>
                      {rm.status}
                    </span>
                  </div>
                  <div className="text-muted small mt-1">{rm.room_type_name} (Floor {rm.floor})</div>

                  <div className="mt-3 pt-2 border-top">
                    {rm.guest_name ? (
                      <div>
                        <div className="small fw-semibold text-dark text-truncate">👤 {rm.guest_name}</div>
                        <div className="small text-danger fw-bold mt-0.5">Balance: {formatCurrency(rm.balance)}</div>
                      </div>
                    ) : (
                      <div className="small text-muted fst-italic">No active stay</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 7 & 8: RECENT ACTIVITIES & PAYMENT SUMMARY        */}
      {/* ========================================================= */}
      <div className="row g-4 mb-4">
        {/* Section 7: Recent Activities Timeline */}
        <div className="col-lg-6">
          <div className="saas-card border-0 bg-white shadow-sm h-100 p-4">
            <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
              <Activity size={20} className="text-primary" /> Live Operational Activity Feed
            </h5>
            <div className="d-flex flex-column gap-3 mt-3">
              {recent_activities.length === 0 ? (
                <div className="text-muted small py-3 text-center">No recent activity logged</div>
              ) : (
                recent_activities.map((act) => (
                  <div key={act.id} className="d-flex align-items-start gap-3 p-2.5 rounded-3 hover-bg-light">
                    <div className="p-2 bg-primary-subtle text-primary rounded-circle flex-shrink-0">
                      <Clock size={16} />
                    </div>
                    <div className="flex-grow-1">
                      <div className="fw-semibold text-dark small">{act.title}</div>
                      <div className="text-muted" style={{ fontSize: '0.775rem' }}>{act.description}</div>
                    </div>
                    <span className="text-muted small flex-shrink-0" style={{ fontSize: '0.7rem' }}>{act.time}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Section 8: Financial Payment Summary */}
        <div className="col-lg-6">
          <div className="saas-card border-0 bg-white shadow-sm h-100 p-4">
            <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
              <Receipt size={20} className="text-success" /> Today's Financial Summary
            </h5>
            <div className="row g-3">
              <div className="col-6">
                <div className="p-3 bg-light rounded-3 border">
                  <div className="text-muted small fw-semibold">Today's Collection</div>
                  <div className="fw-bold text-success fs-5 mt-1">{formatCurrency(cards.today_revenue)}</div>
                </div>
              </div>
              <div className="col-6">
                <div className="p-3 bg-light rounded-3 border">
                  <div className="text-muted small fw-semibold">Pending Payments</div>
                  <div className="fw-bold text-danger fs-5 mt-1">{formatCurrency(cards.pending_payments)}</div>
                </div>
              </div>
              <div className="col-6">
                <div className="p-3 bg-light rounded-3 border">
                  <div className="text-muted small fw-semibold">Advance Received</div>
                  <div className="fw-bold text-primary fs-5 mt-1">{formatCurrency(cards.advance_received)}</div>
                </div>
              </div>
              <div className="col-6">
                <div className="p-3 bg-light rounded-3 border">
                  <div className="text-muted small fw-semibold">Average Room Rate</div>
                  <div className="fw-bold text-dark fs-5 mt-1">{formatCurrency(cards.adr)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 9: UPCOMING ADVANCE RESERVATIONS TABLE            */}
      {/* ========================================================= */}
      <div className="saas-card border-0 bg-white shadow-sm mb-4">
        <div className="p-4 border-bottom d-flex justify-content-between align-items-center">
          <div>
            <h5 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
              <CalendarDays size={20} className="text-primary" /> Upcoming Advance Reservations
            </h5>
            <span className="text-muted small">Confirmed bookings arriving in the next 7 days</span>
          </div>
          <Link to="/bookings" className="btn btn-sm btn-light border fw-semibold">All Bookings</Link>
        </div>
        <div className="p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle m-0" style={{ fontSize: '0.875rem' }}>
              <thead className="table-light">
                <tr>
                  <th>Booking #</th>
                  <th>Guest</th>
                  <th>Arrival Date</th>
                  <th>Room</th>
                  <th>Advance Paid</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {tables.upcoming_reservations?.length === 0 ? (
                  <tr><td colSpan="6" className="text-center text-muted py-4">No upcoming reservations for the next 7 days</td></tr>
                ) : (
                  tables.upcoming_reservations?.map((b) => (
                    <tr key={b.id}>
                      <td className="fw-bold text-primary">{b.booking_number}</td>
                      <td>
                        <div className="fw-semibold text-dark">{b.guest_name}</div>
                        <div className="text-muted" style={{ fontSize: '0.725rem' }}>{b.mobile}</div>
                      </td>
                      <td>{formatDate(b.check_in_date)}</td>
                      <td><span className="badge bg-dark rounded-pill">Room {b.room_number}</span></td>
                      <td className="text-success fw-semibold">{formatCurrency(b.advance_amount)}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary py-1 px-3 rounded-pill fw-semibold"
                          onClick={() => navigate(`/check-in?booking_id=${b.id}`)}
                        >
                          Express Check-In
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 10: QUICK ACTIONS LAUNCHPAD                       */}
      {/* ========================================================= */}
      <div className="saas-card border-0 bg-white shadow-sm p-4 mb-4">
        <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
          <Zap size={20} className="text-warning" /> Receptionist Quick Actions Launchpad
        </h5>
        <div className="row g-3">
          <div className="col-lg-2 col-md-3 col-sm-4 col-6">
            <button onClick={() => navigate('/check-in?mode=walkin')} className="btn btn-light border p-3 text-center w-100 rounded-3 hover-shadow">
              <Zap size={24} className="text-primary mb-1" />
              <div className="fw-semibold small text-dark">Walk-In</div>
            </button>
          </div>
          <div className="col-lg-2 col-md-3 col-sm-4 col-6">
            <button onClick={() => navigate('/bookings/create')} className="btn btn-light border p-3 text-center w-100 rounded-3 hover-shadow">
              <PlusCircle size={24} className="text-success mb-1" />
              <div className="fw-semibold small text-dark">Booking</div>
            </button>
          </div>
          <div className="col-lg-2 col-md-3 col-sm-4 col-6">
            <button onClick={() => navigate('/check-in')} className="btn btn-light border p-3 text-center w-100 rounded-3 hover-shadow">
              <UserCheck size={24} className="text-info mb-1" />
              <div className="fw-semibold small text-dark">Check-In</div>
            </button>
          </div>
          <div className="col-lg-2 col-md-3 col-sm-4 col-6">
            <button onClick={() => navigate('/current-stays')} className="btn btn-light border p-3 text-center w-100 rounded-3 hover-shadow">
              <UserX size={24} className="text-warning mb-1" />
              <div className="fw-semibold small text-dark">Check-Out</div>
            </button>
          </div>
          <div className="col-lg-2 col-md-3 col-sm-4 col-6">
            <button onClick={() => navigate('/payments')} className="btn btn-light border p-3 text-center w-100 rounded-3 hover-shadow">
              <CreditCard size={24} className="text-purple mb-1" />
              <div className="fw-semibold small text-dark">Add Payment</div>
            </button>
          </div>
          <div className="col-lg-2 col-md-3 col-sm-4 col-6">
            <button onClick={() => navigate('/customers')} className="btn btn-light border p-3 text-center w-100 rounded-3 hover-shadow">
              <Users size={24} className="text-teal mb-1" />
              <div className="fw-semibold small text-dark">Customer Directory</div>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 11: PERFORMANCE KPI SUMMARY                       */}
      {/* ========================================================= */}
      <div className="saas-card border-0 bg-white shadow-sm p-4">
        <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
          <TrendingUp size={20} className="text-primary" /> Key Performance Indicators (KPIs)
        </h5>
        <div className="row g-3">
          <div className="col-md-3 col-sm-6">
            <div className="p-3 border rounded-3 bg-light">
              <div className="text-muted small fw-semibold">Occupancy %</div>
              <div className="fw-bold fs-4 text-primary mt-1">{cards.occupancy_percentage}%</div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6">
            <div className="p-3 border rounded-3 bg-light">
              <div className="text-muted small fw-semibold">Available Rooms</div>
              <div className="fw-bold fs-4 text-success mt-1">{cards.available_rooms} / {cards.total_rooms}</div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6">
            <div className="p-3 border rounded-3 bg-light">
              <div className="text-muted small fw-semibold">Cancelled Reservations</div>
              <div className="fw-bold fs-4 text-secondary mt-1">{cards.cancelled_count}</div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6">
            <div className="p-3 border rounded-3 bg-light">
              <div className="text-muted small fw-semibold">No-Shows</div>
              <div className="fw-bold fs-4 text-danger mt-1">{cards.no_show_count}</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
