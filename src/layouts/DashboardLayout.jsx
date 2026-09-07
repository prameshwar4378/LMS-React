import React, { useRef, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import SubscriptionExpiryModal from '../components/SubscriptionExpiryModal';

const DashboardLayout = ({ title }) => {
  const contentRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
      contentRef.current.scrollLeft = 0;
    }
  }, [location.pathname, location.search]);

  return (
    <div className="lms-wrapper">
      <Sidebar />
      <div className="lms-content" ref={contentRef}>
        <Navbar title={title} />
        <main className="p-4 flex-grow-1">
          <Outlet />
        </main>
      </div>
      <SubscriptionExpiryModal />
    </div>
  );
};

export default DashboardLayout;
