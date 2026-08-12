import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  CalendarCheck,
  UserCheck,
  KeyRound,
  LogOut as LogOutIcon,
  DoorClosed,
  Grid,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
  CalendarDays
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout, hasRole } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapse = () => setCollapsed(!collapsed);

  return (
    <aside className={`lms-sidebar-dark no-print ${collapsed ? 'lms-sidebar-collapsed' : ''}`}>
      {/* Brand Header */}
      <div className="d-flex align-items-center justify-content-between p-3 border-bottom border-secondary border-opacity-25">
        <NavLink to="/dashboard" className="d-flex align-items-center gap-3 text-white text-decoration-none overflow-hidden">
          <div className="bg-primary bg-gradient p-2 rounded-3 text-white d-flex align-items-center justify-content-center shadow-sm" style={{ width: '40px', height: '40px' }}>
            <Building2 size={22} />
          </div>
          {!collapsed && (
            <div>
              <div className="fw-bold tracking-wide lh-1 text-white" style={{ fontSize: '1.05rem', letterSpacing: '0.03em' }}>
                LODGE MASTER
              </div>
              <div className="text-secondary small fw-medium" style={{ fontSize: '0.7rem' }}>
                PREMIUM PMS SAAS
              </div>
            </div>
          )}
        </NavLink>
        <button
          onClick={toggleCollapse}
          className="btn btn-sm text-secondary hover-white border-0 p-1 d-flex align-items-center justify-content-center"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-grow-1 overflow-auto py-2">
        {/* Main Dashboard */}
        <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="Dashboard">
          <LayoutDashboard size={20} className="flex-shrink-0" />
          {!collapsed && <span>Dashboard</span>}
        </NavLink>

        {/* OPERATIONS GROUP */}
        {!collapsed && <div className="sidebar-nav-header mt-2">Operations</div>}
        <NavLink to="/bookings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="Bookings">
          <CalendarCheck size={20} className="flex-shrink-0" />
          {!collapsed && <span>Reservations</span>}
        </NavLink>
        <NavLink to="/check-in" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="Check-In Workflow">
          <UserCheck size={20} className="flex-shrink-0" />
          {!collapsed && <span>Check-In Workflow</span>}
        </NavLink>
        <NavLink to="/current-stays" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="Current Stays">
          <KeyRound size={20} className="flex-shrink-0" />
          {!collapsed && <span>Current Stays</span>}
        </NavLink>

        {/* ROOMS GROUP */}
        {!collapsed && <div className="sidebar-nav-header mt-2">Rooms & Inventory</div>}
        <NavLink to="/rooms" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="Rooms & Availability">
          <DoorClosed size={20} className="flex-shrink-0" />
          {!collapsed && <span>Rooms Grid</span>}
        </NavLink>
        <NavLink to="/room-types" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="Room Types">
          <Grid size={20} className="flex-shrink-0" />
          {!collapsed && <span>Room Categories</span>}
        </NavLink>

        {/* GUESTS GROUP */}
        {!collapsed && <div className="sidebar-nav-header mt-2">Guest Directory</div>}
        <NavLink to="/customers" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="Customers">
          <Users size={20} className="flex-shrink-0" />
          {!collapsed && <span>Customer Directory</span>}
        </NavLink>

        {/* FINANCE & REPORTS GROUP */}
        {!collapsed && <div className="sidebar-nav-header mt-2">Finance & Analytics</div>}
        <NavLink to="/payments" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="Payments">
          <CreditCard size={20} className="flex-shrink-0" />
          {!collapsed && <span>Billing & Payments</span>}
        </NavLink>
        <NavLink to="/reports" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="Reports">
          <BarChart3 size={20} className="flex-shrink-0" />
          {!collapsed && <span>Financial Reports</span>}
        </NavLink>

        {/* ADMINISTRATION GROUP */}
        {hasRole('SUPER_ADMIN') && (
          <>
            {!collapsed && <div className="sidebar-nav-header mt-2">Administration</div>}
            <NavLink to="/settings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="System Settings">
              <Settings size={20} className="flex-shrink-0" />
              {!collapsed && <span>System Settings</span>}
            </NavLink>
          </>
        )}
      </nav>

      {/* Bottom User Card */}
      <div className="p-3 border-top border-secondary border-opacity-25 bg-black bg-opacity-20">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2 overflow-hidden">
            <div
              className="rounded-circle bg-primary bg-gradient text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0 shadow-sm"
              style={{ width: '38px', height: '38px', fontSize: '0.9rem' }}
            >
              {(user?.full_name || user?.username || 'R').charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <div className="text-white fw-semibold small text-truncate lh-sm">{user?.full_name || user?.username}</div>
                <div className="text-secondary" style={{ fontSize: '0.7rem' }}>{user?.role || 'Receptionist'}</div>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={logout}
              className="btn btn-sm btn-outline-danger border-0 p-2 d-flex align-items-center justify-content-center rounded-3 ms-1"
              title="Logout"
            >
              <LogOutIcon size={18} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
