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
  Clock,
  ShieldCheck,
  Lock,
  LifeBuoy,
  Wallet
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout, hasRole, isSuperUser, isHotelOwner, isSubscriptionExpired, selectedProperty, isShiftWise } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapse = () => setCollapsed(!collapsed);

  return (
    <aside className={`lms-sidebar-dark no-print ${collapsed ? 'lms-sidebar-collapsed' : ''}`}>
      {/* Brand Header */}
      <div
        className={`d-flex align-items-center ${collapsed ? 'flex-column justify-content-center gap-2.5 py-3' : 'justify-content-between px-3.5 py-3'}`}
        style={{ height: '64px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}
      >
        <NavLink to="/dashboard" className="d-flex align-items-center gap-3 text-white text-decoration-none" title="LodgeMaster">
          <div
            className="d-flex align-items-center justify-content-center flex-shrink-0 text-white shadow-xs"
            style={{
              width: '40px',
              height: '40px',
              minWidth: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)'
            }}
          >
            <Building2 size={20} />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="fw-bold tracking-tight lh-1 text-white text-truncate" style={{ fontSize: '0.925rem', letterSpacing: '-0.02em', maxWidth: '145px' }} title={selectedProperty?.name || user?.property_name || 'LodgeMaster'}>
                {selectedProperty?.name || user?.property_name || 'LodgeMaster'}
              </div>
              <div className="mt-1 font-monospace" style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94A3B8' }}>
                {(selectedProperty?.code || selectedProperty?.property_code || user?.property_code) ? `ID: ${selectedProperty?.code || selectedProperty?.property_code || user?.property_code}` : 'Hotel & PMS SaaS'}
              </div>
            </div>
          )}
        </NavLink>
        <button
          onClick={toggleCollapse}
          className="btn btn-sm border-0 d-flex align-items-center justify-content-center p-0 flex-shrink-0 transition-all"
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            color: '#94A3B8'
          }}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-grow-1 overflow-auto py-2 px-0">
        {isSubscriptionExpired ? (
          <div className="px-3 py-4 text-center">
            <div
              className="p-3 rounded-4 mb-3 d-inline-flex text-danger"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
            >
              <Lock size={28} />
            </div>
            {!collapsed && (
              <>
                <h6 className="fw-bold text-white mb-1" style={{ fontSize: '0.9rem' }}>
                  Software Suspended
                </h6>
                <p className="text-secondary extra-small mb-3" style={{ lineHeight: 1.4 }}>
                  Subscription has expired. Operational modules are locked.
                </p>
                <NavLink
                  to="/subscription"
                  className={({ isActive }) => `btn btn-sm btn-danger w-100 fw-bold py-2 rounded-3 shadow-xs d-flex align-items-center justify-content-center gap-1.5`}
                >
                  <LifeBuoy size={15} />
                  Contact Support
                </NavLink>
              </>
            )}
            {collapsed && (
              <NavLink
                to="/subscription"
                className="d-flex justify-content-center p-2 text-danger"
                title="Subscription Expired - Contact Support"
              >
                <LifeBuoy size={20} />
              </NavLink>
            )}
          </div>
        ) : (
          <>
            {/* OPERATIONS GROUP */}
            {!collapsed && <div className="sidebar-nav-header px-3 pt-2 pb-1">Operations</div>}
            <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="Dashboard">
              <LayoutDashboard size={20} className="flex-shrink-0" />
              {!collapsed && <span>Dashboard</span>}
            </NavLink>
            <NavLink to="/bookings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="Bookings">
              <CalendarCheck size={20} className="flex-shrink-0" />
              {!collapsed && <span>Bookings</span>}
            </NavLink>
            <NavLink to="/check-in" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="Check-In">
              <UserCheck size={20} className="flex-shrink-0" />
              {!collapsed && <span>Check-In</span>}
            </NavLink>
            <NavLink to="/current-stays" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="Current Stays">
              <KeyRound size={20} className="flex-shrink-0" />
              {!collapsed && <span>Current Stays</span>}
            </NavLink>
            {isShiftWise && (
              <NavLink to="/shifts" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="Shift & Till">
                <Clock size={20} className="flex-shrink-0" />
                {!collapsed && <span>Shift &amp; Till</span>}
              </NavLink>
            )}

            {/* ROOMS GROUP */}
            {!collapsed && <div className="sidebar-nav-header px-3 pt-3 pb-1">Rooms</div>}
            <NavLink to="/rooms" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="Rooms">
              <DoorClosed size={20} className="flex-shrink-0" />
              {!collapsed && <span>Rooms</span>}
            </NavLink>
            <NavLink to="/room-types" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="Room Categories">
              <Grid size={20} className="flex-shrink-0" />
              {!collapsed && <span>Room Categories</span>}
            </NavLink>

            {/* CUSTOMERS GROUP */}
            {!collapsed && <div className="sidebar-nav-header px-3 pt-3 pb-1">Customers</div>}
            <NavLink to="/customers" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="Customers">
              <Users size={20} className="flex-shrink-0" />
              {!collapsed && <span>Customers</span>}
            </NavLink>

            {/* FINANCE GROUP */}
            {!collapsed && <div className="sidebar-nav-header px-3 pt-3 pb-1">Finance &amp; Wallets</div>}
            <NavLink to="/wallets" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="Customer Wallets">
              <Wallet size={20} className="flex-shrink-0" />
              {!collapsed && <span>Customer Wallets</span>}
            </NavLink>
            <NavLink to="/payments" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="Payments">
              <CreditCard size={20} className="flex-shrink-0" />
              {!collapsed && <span>Payments</span>}
            </NavLink>
            <NavLink to="/reports" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="Reports">
              <BarChart3 size={20} className="flex-shrink-0" />
              {!collapsed && <span>Reports</span>}
            </NavLink>

            {/* SETTINGS & ADMINISTRATION GROUP */}
            {isHotelOwner && (
              <>
                {!collapsed && <div className="sidebar-nav-header px-3 pt-3 pb-1">Administration</div>}
                <NavLink to="/staff" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="Staff & Branches">
                  <UserCheck size={20} className="flex-shrink-0" />
                  {!collapsed && <span>Staff &amp; Branches</span>}
                </NavLink>
                <NavLink to="/settings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="System Settings">
                  <Settings size={20} className="flex-shrink-0" />
                  {!collapsed && <span>System Settings</span>}
                </NavLink>
              </>
            )}

            {/* SUPPORT & SYSTEM STATUS */}
            {!collapsed && <div className="sidebar-nav-header px-3 pt-3 pb-1">System</div>}
            <NavLink to="/subscription" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} title="System Status & Support">
              <LifeBuoy size={20} className="flex-shrink-0" />
              {!collapsed && <span>System Support</span>}
            </NavLink>
          </>
        )}
      </nav>

      {/* Bottom User Profile Card */}
      <div
        className="border-top"
        style={{
          padding: collapsed ? '16px 0' : '16px 20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(0, 0, 0, 0.25)'
        }}
      >
        <div className={`d-flex align-items-center ${collapsed ? 'justify-content-center' : 'justify-content-between'}`}>
          <div className="d-flex align-items-center gap-3 overflow-hidden">
            <div
              className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0 shadow-xs"
              style={{
                width: '38px',
                height: '38px',
                fontSize: '0.875rem',
                backgroundColor: '#2563EB'
              }}
              title={collapsed ? (user?.full_name || user?.username) : undefined}
            >
              {(user?.full_name || user?.username || 'A').charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <div className="text-white fw-semibold text-truncate lh-sm" style={{ fontSize: '0.875rem' }}>
                  {user?.full_name || user?.username}
                </div>
                <div className="mt-0.5" style={{ fontSize: '0.725rem', color: '#94A3B8' }}>
                  {user?.role || 'Receptionist'}
                </div>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={logout}
              className="btn btn-sm border-0 d-flex align-items-center justify-content-center rounded-3 p-1.5 ms-1 transition-all"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#F87171'
              }}
              title="Logout"
            >
              <LogOutIcon size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
