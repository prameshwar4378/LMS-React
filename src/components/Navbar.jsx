import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { searchCustomersApi } from '../api/customerApi';
import { getDashboardReportApi } from '../api/reportApi';
import {
  Search,
  Bell,
  Calendar,
  Clock,
  User,
  LogOut,
  ShieldCheck,
  ChevronDown,
  UserCheck,
  UserX,
  AlertCircle
} from 'lucide-react';

const Navbar = ({ title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  // Real-time Clock in Asia/Kolkata
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  // Notification state
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState({
    checkins: 0,
    checkouts: 0,
    payments: 0
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateStr(now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    getDashboardReportApi()
      .then((data) => {
        if (data?.cards) {
          setNotifications({
            checkins: data.cards.today_checkins_count || 0,
            checkouts: data.cards.today_checkouts_count || 0,
            payments: Math.round(data.cards.pending_payments || 0)
          });
        }
      })
      .catch(console.error);
  }, []);

  const totalNotifications = (notifications.checkins > 0 ? 1 : 0) + (notifications.checkouts > 0 ? 1 : 0) + (notifications.payments > 0 ? 1 : 0);

  const handleSearchChange = async (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.trim().length > 1) {
      try {
        const res = await searchCustomersApi(q);
        setSearchResults(res);
        setShowResults(true);
      } catch (err) {
        console.error(err);
      }
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const handleSelectCustomer = (customer) => {
    setShowResults(false);
    setSearchQuery('');
    navigate(`/customers/${customer.id}`);
  };

  return (
    <header className="lms-topbar no-print border-bottom shadow-sm px-4 py-2 bg-white d-flex align-items-center justify-content-between">
      {/* Title */}
      <div className="d-flex align-items-center gap-3">
        <h5 className="m-0 fw-bold text-dark tracking-tight fs-5">{title || 'Dashboard'}</h5>
      </div>

      <div className="d-flex align-items-center gap-3">
        {/* Global Search Bar */}
        <div className="position-relative" style={{ width: '320px' }}>
          <div className="input-group input-group-sm rounded-3 overflow-hidden border">
            <span className="input-group-text bg-white border-0 ps-2.5 pe-1.5 text-muted">
              <Search size={15} />
            </span>
            <input
              type="text"
              className="form-control border-0 bg-white shadow-none ps-1 py-1"
              style={{ fontSize: '0.825rem' }}
              placeholder="Global Search (Guest, Booking #, Mobile)..."
              value={searchQuery}
              onChange={handleSearchChange}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
              onFocus={() => searchQuery.length > 1 && setShowResults(true)}
            />
          </div>

          {showResults && (
            <div className="position-absolute start-0 end-0 top-100 mt-2 bg-white border-0 rounded-3 shadow-lg z-3 overflow-hidden" style={{ maxHeight: '320px', overflowY: 'auto' }}>
              {searchResults.length === 0 ? (
                <div className="p-3 text-muted small text-center">No matching guest records found</div>
              ) : (
                searchResults.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 border-bottom hover-bg-light cursor-pointer d-flex justify-content-between align-items-center"
                    style={{ cursor: 'pointer' }}
                    onMouseDown={() => handleSelectCustomer(c)}
                  >
                    <div>
                      <div className="fw-semibold text-dark small">{c.full_name}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                        📞 {c.mobile} | ID: {c.id_number || 'N/A'}
                      </div>
                    </div>
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2">
                      View Profile
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Live Date & Time Indicator */}
        <div className="d-none d-lg-flex align-items-center gap-2.5 bg-slate-100 px-2.5 py-1 rounded-3 text-secondary" style={{ backgroundColor: '#F1F5F9', fontSize: '0.8rem' }}>
          <div className="d-flex align-items-center gap-1.5 fw-medium text-dark">
            <Calendar size={14} className="text-primary" />
            <span>{dateStr}</span>
          </div>
          <div className="border-start h-100" style={{ height: '12px', borderColor: '#CBD5E1' }}></div>
          <div className="d-flex align-items-center gap-1.5 fw-semibold text-dark">
            <Clock size={14} className="text-primary" />
            <span>{timeStr}</span>
          </div>
        </div>

        {/* Notification Bell Dropdown */}
        <div className="position-relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="btn btn-light border-0 rounded-circle position-relative p-0 d-flex align-items-center justify-content-center text-secondary hover-dark"
            style={{ width: '34px', height: '34px' }}
            title="Notifications"
          >
            <Bell size={18} />
            {totalNotifications > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-circle bg-danger border border-white p-1" style={{ fontSize: '0.6rem' }}>
                {totalNotifications}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="position-absolute end-0 top-100 mt-2 bg-white border-0 rounded-3 shadow-lg z-3 p-0" style={{ width: '320px' }}>
              <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light rounded-top-3">
                <span className="fw-bold text-dark small">Operational Alerts</span>
                <span className="badge bg-primary rounded-pill">{totalNotifications} Pending</span>
              </div>
              <div className="p-2">
                <div
                  className="p-2.5 rounded-2 hover-bg-light d-flex align-items-center gap-3 cursor-pointer"
                  onClick={() => { setShowNotifications(false); navigate('/check-in'); }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="p-2 bg-primary-subtle text-primary rounded-circle">
                    <UserCheck size={16} />
                  </div>
                  <div>
                    <div className="fw-semibold small text-dark">{notifications.checkins} Scheduled Check-Ins</div>
                    <div className="text-muted" style={{ fontSize: '0.725rem' }}>Arriving today</div>
                  </div>
                </div>

                <div
                  className="p-2.5 rounded-2 hover-bg-light d-flex align-items-center gap-3 cursor-pointer"
                  onClick={() => { setShowNotifications(false); navigate('/current-stays'); }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="p-2 bg-warning-subtle text-warning rounded-circle">
                    <UserX size={16} />
                  </div>
                  <div>
                    <div className="fw-semibold small text-dark">{notifications.checkouts} Expected Check-Outs</div>
                    <div className="text-muted" style={{ fontSize: '0.725rem' }}>Due for departure</div>
                  </div>
                </div>

                <div
                  className="p-2.5 rounded-2 hover-bg-light d-flex align-items-center gap-3 cursor-pointer"
                  onClick={() => { setShowNotifications(false); navigate('/payments'); }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="p-2 bg-danger-subtle text-danger rounded-circle">
                    <AlertCircle size={16} />
                  </div>
                  <div>
                    <div className="fw-semibold small text-dark">₹{notifications.payments.toLocaleString('en-IN')} Outstanding Balance</div>
                    <div className="text-muted" style={{ fontSize: '0.725rem' }}>Pending guest collection</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile Menu Dropdown */}
        <div className="dropdown">
          <button
            className="btn btn-white border rounded-3 btn-sm dropdown-toggle d-flex align-items-center gap-2 py-1 px-2.5 shadow-xs"
            type="button"
            data-bs-toggle="dropdown"
          >
            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-xs" style={{ width: '26px', height: '26px', fontSize: '0.8rem' }}>
              {(user?.full_name || user?.username || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="text-start d-none d-sm-block">
              <div className="fw-semibold text-dark lh-1 small">{user?.full_name || user?.username}</div>
              <div className="text-muted lh-1 mt-0.5" style={{ fontSize: '0.65rem' }}>{user?.role || 'Receptionist'}</div>
            </div>
            <ChevronDown size={13} className="text-muted ms-0.5" />
          </button>
          <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-3 mt-2">
            <li className="dropdown-header">
              <div className="fw-bold text-dark">{user?.full_name}</div>
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>{user?.username}</div>
            </li>
            <li><hr className="dropdown-divider" /></li>
            <li>
              <button className="dropdown-item text-danger d-flex align-items-center gap-2 py-2" onClick={logout}>
                <LogOut size={16} /> Log Out
              </button>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
