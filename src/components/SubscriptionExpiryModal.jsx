import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  AlertTriangle,
  Calendar,
  Building2,
  MessageSquare,
  ArrowRight,
  X,
  Clock,
  ShieldAlert,
  BellOff,
  CheckCircle2,
  Phone
} from 'lucide-react';

const SubscriptionExpiryModal = () => {
  const { user, subscription, daysRemaining, isSubscriptionNearExpiry } = useAuth();
  const { showInfo } = useNotification();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // Helper to format today's calendar date as YYYY-MM-DD in local time
  const todayDateStr = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const hotelKey = user?.property_id || user?.property_code || 'hotel';
  const dismissalStorageKey = `lms_sub_expiry_dismissed_${hotelKey}_${todayDateStr}`;

  // Evaluate dismissal state for today
  useEffect(() => {
    if (!isSubscriptionNearExpiry || daysRemaining === null || daysRemaining === undefined || daysRemaining <= 0) {
      setIsOpen(false);
      return;
    }

    // Clean up older dated dismissal keys for this hotel to keep storage pristine
    try {
      const prefix = `lms_sub_expiry_dismissed_${hotelKey}_`;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix) && key !== dismissalStorageKey) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {
      console.error('Storage cleanup error:', e);
    }

    const dismissedToday = localStorage.getItem(dismissalStorageKey) === 'dismissed';
    if (!dismissedToday) {
      // First visit today: automatically show modal
      setIsOpen(true);
    }
  }, [isSubscriptionNearExpiry, daysRemaining, hotelKey, dismissalStorageKey]);

  // Allow reopening modal on demand (e.g. from Navbar warning pill)
  useEffect(() => {
    const handleForceOpen = () => setIsOpen(true);
    window.addEventListener('open-subscription-expiry-modal', handleForceOpen);
    return () => window.removeEventListener('open-subscription-expiry-modal', handleForceOpen);
  }, []);

  // Handler: "Don't Remind Me Again Today"
  const handleDismissForToday = () => {
    try {
      localStorage.setItem(dismissalStorageKey, 'dismissed');
    } catch (e) {
      console.error(e);
    }
    setIsOpen(false);
    showInfo(
      `Reminder silenced for today. You will be updated again tomorrow with the countdown.`,
      'Reminder Muted for Today'
    );
  };

  // Quick close
  const handleQuickClose = () => {
    try {
      localStorage.setItem(dismissalStorageKey, 'dismissed');
    } catch (e) {
      console.error(e);
    }
    setIsOpen(false);
  };

  const handleGoToSupport = () => {
    handleDismissForToday();
    navigate('/subscription');
  };

  if (!isOpen) return null;

  const hotelName = subscription?.property_name || user?.property_name || 'Hotel Property';
  const propertyCode = subscription?.property_code || user?.property_code || 'LMS';
  const validUntil = subscription?.valid_until || 'Soon';
  const isBranch = Boolean(subscription?.is_branch || user?.is_branch || user?.property?.parent_property);
  const masterHotelName = subscription?.master_property_name || 'Head Office';

  // 3-Tier Dynamic Urgency Styling
  const urgency = (() => {
    if (daysRemaining <= 5) {
      return {
        level: 'CRITICAL',
        headerGradient: 'linear-gradient(135deg, #991B1B 0%, #DC2626 55%, #EF4444 100%)',
        badgeBg: 'rgba(255, 255, 255, 0.25)',
        badgeText: 'CRITICAL NOTICE - FINAL DAYS',
        boxBg: '#FEF2F2',
        boxBorder: '#FECACA',
        titleColor: '#991B1B',
        accentColor: '#DC2626',
        icon: ShieldAlert,
        actionTitle: `Lockout Imminent in ${daysRemaining} Day${daysRemaining === 1 ? '' : 's'}`,
        bannerText: `Immediate renewal required. Operations will lock automatically upon expiration.`
      };
    } else if (daysRemaining <= 10) {
      return {
        level: 'HIGH',
        headerGradient: 'linear-gradient(135deg, #C2410C 0%, #EA580C 55%, #F97316 100%)',
        badgeBg: 'rgba(255, 255, 255, 0.25)',
        badgeText: 'EXPIRY NOTICE - 1 WEEK REMAINING',
        boxBg: '#FFF7ED',
        boxBorder: '#FED7AA',
        titleColor: '#C2410C',
        accentColor: '#EA580C',
        icon: AlertTriangle,
        actionTitle: 'Action Required Soon',
        bannerText: `Avoid last-minute disruptions by scheduling your subscription extension today.`
      };
    } else {
      return {
        level: 'MODERATE',
        headerGradient: 'linear-gradient(135deg, #B45309 0%, #D97706 55%, #F59E0B 100%)',
        badgeBg: 'rgba(255, 255, 255, 0.25)',
        badgeText: 'SUBSCRIPTION RENEWAL NOTICE',
        boxBg: '#FFFBEB',
        boxBorder: '#FDE68A',
        titleColor: '#92400E',
        accentColor: '#D97706',
        icon: Clock,
        actionTitle: 'Upcoming Renewal Reminder',
        bannerText: `Subscription is approaching end of term. Contact support or management to renew.`
      };
    }
  })();

  const UrgencyIcon = urgency.icon;
  const whatsappMsg = `Hello LMS Support, our lodge ${hotelName} (${propertyCode}) subscription expires in ${daysRemaining} days (on ${validUntil}). Please assist us with subscription renewal.`;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 1100,
        padding: '16px'
      }}
    >
      <div
        className="card border-0 shadow-2xl rounded-4 overflow-hidden animate-scaleIn"
        style={{
          maxWidth: '540px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Dynamic Urgency Header */}
        <div
          className="p-4 text-white position-relative"
          style={{ background: urgency.headerGradient }}
        >
          <button
            type="button"
            onClick={handleQuickClose}
            className="btn btn-sm btn-light bg-white bg-opacity-20 border-0 rounded-circle text-white position-absolute top-0 end-0 m-3 p-1 d-flex align-items-center justify-content-center hover-scale"
            style={{ width: '32px', height: '32px' }}
            title="Close for today"
          >
            <X size={18} />
          </button>

          <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
            <span className="badge rounded-pill px-3 py-1 extra-small fw-bold" style={{ backgroundColor: urgency.badgeBg }}>
              {urgency.badgeText}
            </span>
            <span className="badge bg-dark bg-opacity-30 text-white rounded-pill px-2.5 py-1 extra-small font-monospace">
              {propertyCode}
            </span>
          </div>

          <div className="d-flex align-items-center gap-3 mt-2">
            <div
              className="rounded-3 p-2.5 bg-white bg-opacity-20 d-flex align-items-center justify-content-center flex-shrink-0 shadow-xs"
              style={{ width: '48px', height: '48px' }}
            >
              <UrgencyIcon size={28} className="text-white" />
            </div>
            <div>
              <h4 className="fw-bold m-0 text-white" style={{ letterSpacing: '-0.02em', fontSize: '1.25rem' }}>
                Subscription Expiring Soon
              </h4>
              <div className="text-white text-opacity-85 small mt-0.5 d-flex align-items-center gap-1.5">
                <Building2 size={14} />
                <span className="fw-semibold text-white">{hotelName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="card-body p-4 bg-white">
          
          {/* Days Remaining Hero Counter */}
          <div
            className="p-3.5 rounded-3 mb-3 d-flex align-items-center justify-content-between"
            style={{
              backgroundColor: urgency.boxBg,
              border: `1px solid ${urgency.boxBorder}`
            }}
          >
            <div>
              <div className="extra-small fw-bold text-uppercase" style={{ color: urgency.titleColor, letterSpacing: '0.05em' }}>
                Remaining Active Period
              </div>
              <div className="fw-bolder fs-3 lh-1 mt-1 font-monospace" style={{ color: urgency.accentColor }}>
                {daysRemaining} Day{daysRemaining === 1 ? '' : 's'} Remaining
              </div>
            </div>
            <div className="text-end">
              <div className="extra-small text-muted mb-0.5">Expires On</div>
              <div className="fw-bold text-dark small d-flex align-items-center justify-content-end gap-1 font-monospace">
                <Calendar size={13} className="text-secondary" />
                {validUntil}
              </div>
            </div>
          </div>

          {/* Branch Notification or Standalone Hotel Notice */}
          {isBranch ? (
            <div className="p-3 bg-primary-subtle border border-primary-subtle rounded-3 small text-dark mb-3.5 d-flex align-items-start gap-2.5">
              <Building2 size={18} className="text-primary flex-shrink-0 mt-0.5" />
              <div style={{ fontSize: '0.825rem' }}>
                <strong>Multi-Branch Property:</strong> This branch operates under <strong>{masterHotelName}</strong>'s centralized subscription. 
                Renewal is coordinated brand-wide by your Hotel Owner. Please notify Head Office to renew promptly.
              </div>
            </div>
          ) : (
            <p className="text-secondary small lh-base mb-3.5">
              The software subscription for <strong>{hotelName}</strong> ({propertyCode}) will expire in <strong>{daysRemaining} days</strong>. 
              {urgency.bannerText}
            </p>
          )}

          {/* Primary Action Buttons */}
          <div className="d-flex flex-column flex-sm-row gap-2 mb-3">
            <button
              type="button"
              onClick={handleGoToSupport}
              className="btn btn-primary fw-bold rounded-3 py-2.5 px-3 flex-grow-1 d-flex align-items-center justify-content-center gap-2 shadow-xs"
              style={{ backgroundColor: '#2563EB', borderColor: '#2563EB' }}
            >
              <span>Contact Support / Renew</span>
              <ArrowRight size={16} />
            </button>

            <a
              href={`https://wa.me/919876543210?text=${encodeURIComponent(whatsappMsg)}`}
              target="_blank"
              rel="noreferrer"
              onClick={handleDismissForToday}
              className="btn btn-success fw-bold rounded-3 py-2.5 px-3.5 d-flex align-items-center justify-content-center gap-2 shadow-xs"
              style={{ backgroundColor: '#16A34A', borderColor: '#16A34A' }}
            >
              <MessageSquare size={16} />
              <span>WhatsApp</span>
            </a>
          </div>

          {/* "Don't Remind Me Again Today" Dismissal Button */}
          <button
            type="button"
            onClick={handleDismissForToday}
            className="btn btn-outline-secondary w-100 fw-semibold rounded-3 py-2 extra-small d-flex align-items-center justify-content-center gap-1.5"
            style={{ fontSize: '0.8rem' }}
          >
            <BellOff size={14} />
            <span>Don't Remind Me Again Today</span>
          </button>
        </div>

        {/* Footer info strip */}
        <div className="px-4 py-2.5 bg-light border-top d-flex align-items-center justify-content-between extra-small text-muted">
          <span className="d-flex align-items-center gap-1">
            <Clock size={12} className="text-secondary" />
            <span>Daily notice &bull; Reappears once tomorrow</span>
          </span>
          <span className="font-monospace fw-semibold">{todayDateStr}</span>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionExpiryModal;
