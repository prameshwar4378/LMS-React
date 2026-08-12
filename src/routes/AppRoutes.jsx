import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '../layouts/DashboardLayout';

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

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<Login />} />

      {/* Protected Staff Routes */}
      <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST']} />}>
        <Route element={<DashboardLayout title="Lodge Management System" />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Room Management */}
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/room-types" element={<RoomTypes />} />

          {/* Customer Management */}
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/:id" element={<CustomerDetails />} />

          {/* Bookings */}
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/bookings/create" element={<BookingCreate />} />

          {/* Check-In */}
          <Route path="/check-in" element={<CheckIn />} />

          {/* Stay Operational Management */}
          <Route path="/current-stays" element={<CurrentStays />} />
          <Route path="/stays/:id" element={<StayDetails />} />

          {/* Checkout */}
          <Route path="/checkout/:id" element={<Checkout />} />

          {/* Financials & Reports */}
          <Route path="/payments" element={<Payments />} />
          <Route path="/reports" element={<Reports />} />

          {/* Super Admin Settings */}
          <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
