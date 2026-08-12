import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const DashboardLayout = ({ title }) => {
  return (
    <div className="lms-wrapper">
      <Sidebar />
      <div className="lms-content">
        <Navbar title={title} />
        <main className="p-4 flex-grow-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
