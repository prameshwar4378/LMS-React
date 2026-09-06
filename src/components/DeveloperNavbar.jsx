import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Clock,
  LogOut,
  PlusCircle
} from 'lucide-react';

const DeveloperNavbar = ({ activeTab, onSelectTab, onOpenOnboardModal }) => {
  const { user, logout } = useAuth();
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const weekday = now.toLocaleDateString('en-IN', { weekday: 'short' });
      setDateStr(`${weekday}, ${day}/${month}/${year}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className="d-flex align-items-center justify-content-between px-4 py-2.5 bg-white border-bottom shadow-xs no-print sticky-top"
      style={{
        minHeight: '68px',
        zIndex: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #E2E8F0'
      }}
    >
      {/* Left empty spacer */}
      <div className="d-flex align-items-center"></div>

      {/* Right: Real-time Date, IST Clock, Onboard Action, and Profile */}
      <div className="d-flex align-items-center gap-3">
        {/* Live Date & IST Clock */}
        <div
          className="d-none d-lg-flex align-items-center gap-3 px-3.5 py-1.5 rounded-3 text-secondary"
          style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '0.8rem' }}
        >
          <div className="d-flex align-items-center gap-2 fw-medium text-dark text-nowrap">
            <Calendar size={14} className="text-primary flex-shrink-0" />
            <span>{dateStr}</span>
          </div>
          <div className="border-start" style={{ height: '16px', borderColor: '#CBD5E1' }}></div>
          <div className="d-flex align-items-center gap-2 fw-bold font-monospace text-dark text-nowrap">
            <Clock size={14} className="text-primary flex-shrink-0" />
            <span>{timeStr}</span>
            <span className="badge bg-dark-subtle text-dark rounded-pill extra-small px-1.5 py-0 font-monospace">IST</span>
          </div>
        </div>

        {/* Quick Onboard Hotel Button */}
        {onOpenOnboardModal && (
          <button
            type="button"
            onClick={onOpenOnboardModal}
            className="btn btn-primary btn-sm fw-bold px-3.5 py-2 rounded-3 d-flex align-items-center gap-2 shadow-xs text-white"
            style={{
              fontSize: '0.825rem',
              background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
              border: 'none',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)'
            }}
          >
            <PlusCircle size={15} /> + Onboard New Hotel
          </button>
        )}

        {/* Developer Sign Out */}
        <button
          type="button"
          onClick={logout}
          className="btn btn-outline-danger btn-sm fw-semibold rounded-3 px-3 py-1.5 d-flex align-items-center gap-1.5"
          style={{ fontSize: '0.8rem' }}
          title="Sign Out Developer Session"
        >
          <LogOut size={13} /> Sign Out
        </button>
      </div>
    </header>
  );
};

export default DeveloperNavbar;

