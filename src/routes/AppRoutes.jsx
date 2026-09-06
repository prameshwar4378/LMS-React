import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';

import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Rooms from '../pages/Rooms';
import RoomTypes from '../pages/RoomTypes';
import Customers from '../pages/Customers';
import CustomerDetails from '../pages/CustomerDetails';
import Bookings from '../pages/Bookings';
import BookingCreate from '../pages/BookingCreate';
import CheckIn from '../pages/CheckIn';
import CurrentStays from '../pages/CurrentStays';
import StayDetails from '../pages/StayDetails';
import Checkout from '../pages/Checkout';
import Payments from '../pages/Payments';
import Reports from '../pages/Reports';
import Settings from '../pages/Settings';
import StaffManagement from '../pages/StaffManagement';
import Shifts from '../pages/Shifts';
import ShiftDetails from '../pages/ShiftDetails';
import PlatformProperties from '../pages/PlatformProperties';
import SubscriptionRenewal from '../pages/SubscriptionRenewal';
import Wallets from '../pages/Wallets';

// Smart Root Redirect based on user role
const RootRedirect = () => {
  const { token, isSuperUser, isSubscriptionExpired, isPropertySuspended } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (isSuperUser) {
    return <Navigate to="/platform" replace />;
  }
  if (isSubscriptionExpired || isPropertySuspended) {
    return <Navigate to="/subscription" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

// Developer Guard: Only platform superusers/developers are allowed
const DeveloperRoute = () => {
  const { token, isSuperUser } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (!isSuperUser) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
};

// Hotel Staff & Owner Guard: Strictly for hotel employees; developers are redirected to /platform
const HotelStaffRoute = () => {
  const { token, isSuperUser } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (isSuperUser) {
    return <Navigate to="/platform" replace />;
  }
  return <Outlet />;
};

// Active Subscription Guard: Locks out users with expired subscriptions or suspended properties from operational software features
const ActiveSubscriptionRoute = () => {
  const { isSubscriptionExpired, isPropertySuspended } = useAuth();
  if (isSubscriptionExpired || isPropertySuspended) {
    return <Navigate to="/subscription" replace />;
  }
  return <Outlet />;
};

// Hotel Owner / Admin Settings Guard
const HotelOwnerRoute = () => {
  const { token, isSuperUser, isHotelOwner } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (isSuperUser) {
    return <Navigate to="/platform" replace />;
  }
  if (!isHotelOwner) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<Login />} />

      {/* Root Path Auto-Redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* ========================================================= */}
      {/* 1. DEVELOPER / SAAS PLATFORM SUPERUSER DEDICATED CONSOLE  */}
      {/* ========================================================= */}
      <Route element={<DeveloperRoute />}>
        <Route path="/platform" element={<PlatformProperties />} />
        <Route path="/platform/:tab" element={<PlatformProperties />} />
        <Route path="/subscriptions" element={<PlatformProperties initialTab="subscriptions" />} />
        <Route path="/subscription-plans" element={<PlatformProperties initialTab="subscriptions" />} />
        <Route path="/plans" element={<PlatformProperties initialTab="subscriptions" />} />
        <Route path="/health" element={<PlatformProperties initialTab="health" />} />
        <Route path="/system-health" element={<PlatformProperties initialTab="health" />} />
        <Route path="/overview" element={<PlatformProperties initialTab="overview" />} />
        <Route path="/hotels" element={<PlatformProperties initialTab="properties" />} />
        <Route path="/developer" element={<Navigate to="/platform" replace />} />
        <Route path="/developer/:tab" element={<PlatformProperties />} />
      </Route>

      {/* ========================================================= */}
      {/* 2. HOTEL STAFF & OWNER FRONT-DESK PMS APPLICATION        */}
      {/* ========================================================= */}
      <Route element={<HotelStaffRoute />}>
        <Route element={<DashboardLayout />}>
          {/* System Status & Support (Always accessible even if subscription expired) */}
          <Route path="/subscription" element={<SubscriptionRenewal />} />

          {/* Operational PMS Features - Strictly Guarded by Active Subscription */}
          <Route element={<ActiveSubscriptionRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Shift & Till Management */}
            <Route path="/shifts" element={<Shifts />} />
            <Route path="/shifts/:id" element={<ShiftDetails />} />

            {/* Room Inventory Management */}
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/room-types" element={<RoomTypes />} />

            {/* Customer CRM */}
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerDetails />} />

            {/* Bookings & Front Desk */}
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/bookings/create" element={<BookingCreate />} />
            <Route path="/check-in" element={<CheckIn />} />

            {/* Stay Operational Management */}
            <Route path="/current-stays" element={<CurrentStays />} />
            <Route path="/stays/:id" element={<StayDetails />} />
            <Route path="/checkout/:id" element={<Checkout />} />

            {/* Financials, Wallets & Reports */}
            <Route path="/wallets" element={<Wallets />} />
            <Route path="/wallet" element={<Navigate to="/wallets" replace />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/reports" element={<Reports />} />

            {/* Hotel Owner Settings & Staff */}
            <Route element={<HotelOwnerRoute />}>
              <Route path="/staff" element={<StaffManagement />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>
        </Route>
      </Route>

      {/* Catch-all Fallback */}
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
};

export default AppRoutes;
