import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getCurrentSubscriptionApi } from '../api/subscriptionApi';
import PageLoader from '../components/PageLoader';
import {
  ShieldCheck,
  Building2,
  PhoneCall,
  Mail,
  MessageSquare,
  ArrowLeft,
  Server,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  LifeBuoy,
  LogOut,
  Calendar,
  Lock
} from 'lucide-react';

const SubscriptionRenewal = () => {
  const { user, isSuperUser, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: subscription = null,
    isLoading: loading,
    refetch: loadStatus,
  } = useQuery({
    queryKey: ['subscription'],
    queryFn: () =>
      getCurrentSubscriptionApi().catch((err) => {
        console.error('Failed to load system status:', err);
        return null;
      }),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  if (loading) return <PageLoader />;

  const rawValidUntil = subscription?.valid_until || user?.subscription?.valid_until || null;
  const validUntil = rawValidUntil ? String(rawValidUntil).split('T')[0] : 'N/A';

  const { isExpired, daysRemaining } = (() => {
    if (!rawValidUntil) {
      return {
        isExpired: Boolean(subscription?.is_expired || user?.subscription?.is_expired),
        daysRemaining: subscription?.days_remaining ?? (user?.subscription?.days_remaining ?? 0)
      };
    }
    const parts = String(rawValidUntil).split('T')[0].split('-');
    if (parts.length === 3) {
      const expDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return {
        isExpired: expDate < today,
        daysRemaining: Math.max(0, diffDays)
      };
    }
    return {
      isExpired: Boolean(subscription?.is_expired || user?.subscription?.is_expired),
      daysRemaining: subscription?.days_remaining ?? (user?.subscription?.days_remaining ?? 0)
    };
  })();

  const isSuspended = Boolean(subscription?.is_suspended || user?.subscription?.is_suspended || subscription?.is_active === false);
  const isBlocked = isSuspended || isExpired;
  const hotelName = subscription?.property_name || user?.property_name || 'Hotel Property';
  const propertyCode = subscription?.property_code || user?.property_code || 'LMS';
  const isBranch = Boolean(subscription?.is_branch || user?.is_branch);
  const masterHotelName = subscription?.master_property_name;
  const isInherited = Boolean(subscription?.is_inherited);

  return (
    <div className="container-fluid px-3 px-md-4 py-4" style={{ maxWidth: '960px' }}>
      
      {/* Top Header Navigation */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        {!isBlocked ? (
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="btn btn-sm btn-light border d-inline-flex align-items-center gap-2 rounded-3 px-3 py-2 fw-semibold text-dark shadow-xs"
          >
            <ArrowLeft size={16} /> Back to Front-Desk Dashboard
          </button>
        ) : (
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-danger text-white rounded-pill px-3 py-1.5 fw-bold d-inline-flex align-items-center gap-1.5 shadow-xs">
              <Lock size={14} />
              {isSuspended ? 'HOTEL ACCESS SUSPENDED' : 'SUBSCRIPTION EXPIRED'}
            </span>
          </div>
        )}

        <div className="d-flex align-items-center gap-2">
          {isSuperUser && (
            <button
              type="button"
              onClick={() => navigate('/platform')}
              className="btn btn-sm btn-dark d-inline-flex align-items-center gap-2 rounded-3 px-3.5 py-2 fw-bold text-white shadow-xs"
              style={{ backgroundColor: '#0F172A', borderColor: '#334155' }}
            >
              <ShieldCheck size={16} className="text-info" />
              Developer Platform Panel
            </button>
          )}

          {isBlocked && (
            <button
              type="button"
              onClick={logout}
              className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1.5 rounded-3 px-3 py-2 fw-semibold shadow-xs"
            >
              <LogOut size={15} /> Sign Out
            </button>
          )}
        </div>
      </div>

      {/* Main Status Card */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
        {/* Banner Header */}
        <div
          className="p-4 p-md-5 text-white position-relative"
          style={{
            background: isBlocked
              ? 'linear-gradient(135deg, #7F1D1D 0%, #991B1B 50%, #B91C1C 100%)'
              : 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)'
          }}
        >
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                <span className="badge bg-white bg-opacity-20 text-white rounded-pill px-3 py-1 extra-small fw-bold">
                  {hotelName}
                </span>
                {isBranch && masterHotelName && (
                  <span className="badge bg-info bg-opacity-25 text-white border border-info border-opacity-25 rounded-pill px-2.5 py-1 extra-small fw-semibold">
                    Branch of {masterHotelName}
                  </span>
                )}
                {isSuspended ? (
                  <span className="badge bg-danger text-white rounded-pill px-3 py-1 extra-small fw-bold d-inline-flex align-items-center gap-1">
                    <Lock size={12} />
                    HOTEL INSTANCE SUSPENDED
                  </span>
                ) : isExpired ? (
                  <span className="badge bg-danger text-white rounded-pill px-3 py-1 extra-small fw-bold d-inline-flex align-items-center gap-1">
                    <AlertTriangle size={12} />
                    SUBSCRIPTION EXPIRED
                  </span>
                ) : (
                  <span className="badge bg-success text-white rounded-pill px-3 py-1 extra-small fw-bold d-inline-flex align-items-center gap-1.5">
                    <span className="rounded-circle" style={{ width: '6px', height: '6px', backgroundColor: '#FFF' }}></span>
                    SYSTEM ACTIVE ({daysRemaining} DAYS REMAIN)
                  </span>
                )}
              </div>
              <h3 className="fw-bold text-white m-0" style={{ letterSpacing: '-0.025em' }}>
                {isSuspended
                  ? 'Account Suspended by Platform Administration'
                  : isExpired
                  ? 'Account Suspended: Subscription Expired'
                  : 'LMS System Status & Technical Support'}
              </h3>
              <p className="text-white-50 small m-0 mt-1">
                Property ID: <span className="font-monospace fw-bold text-white">{propertyCode}</span>
                {validUntil && <span className="ms-2">| Valid Until: <span className="fw-bold text-white">{validUntil}</span></span>}
                {isInherited && masterHotelName && (
                  <span className="ms-2 badge bg-light bg-opacity-10 text-white-50 extra-small">
                    Linked to Master Hotel Validity
                  </span>
                )}
              </p>
            </div>

            <div className="p-3 rounded-4 bg-white bg-opacity-10 border border-white border-opacity-10 text-center flex-shrink-0">
              <Server size={28} className={isBlocked ? 'text-warning mb-1' : 'text-info mb-1'} />
              <div className="extra-small text-white-50">Status</div>
              <div className="fw-bold text-white small">{isBlocked ? 'Access Locked' : 'Instance Active'}</div>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="card-body p-4 p-md-5 bg-white">
          {/* Suspended Lockout Warning Banner */}
          {isSuspended && (
            <div
              className="p-4 rounded-4 mb-4 border"
              style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA' }}
            >
              <div className="d-flex align-items-start gap-3">
                <div className="p-2.5 rounded-3 bg-danger text-white flex-shrink-0 mt-0.5">
                  <Lock size={24} />
                </div>
                <div>
                  <h5 className="fw-bold text-danger mb-1">Hotel Instance Access is Suspended</h5>
                  <p className="text-danger-emphasis small m-0 lh-base">
                    The hotel property <strong>{hotelName}</strong> (Code: <code>{propertyCode}</code>) has been placed on administrative suspension.
                    Front-desk staff, receptionists, and managers are blocked from making bookings, check-ins, or accessing PMS operational pages.
                    Please contact platform technical support below to lift this suspension and restore system operations.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Expired Lockout Warning Banner */}
          {!isSuspended && isExpired && (
            <div
              className="p-4 rounded-4 mb-4 border"
              style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA' }}
            >
              <div className="d-flex align-items-start gap-3">
                <div className="p-2.5 rounded-3 bg-danger text-white flex-shrink-0 mt-0.5">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h5 className="fw-bold text-danger mb-1">Hotel Management Operations are Locked</h5>
                  <p className="text-danger-emphasis small m-0 lh-base">
                    The software subscription for <strong>{hotelName}</strong> (Code: <code>{propertyCode}</code>) expired on <strong>{validUntil}</strong>. 
                    Operational software features (Dashboard, Room Inventory, Bookings, Guest Check-In/Check-Out, Shifts, and Reports) are suspended until renewal.
                    Please contact our dedicated support team or your platform administrator to extend this property's subscription directly from the Developer Dashboard.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Infrastructure Info Banner */}
          {!isBlocked && (
            <div className="p-3.5 rounded-3 bg-light border mb-4">
              <div className="d-flex align-items-start gap-3">
                <div className="p-2 rounded-circle bg-primary-subtle text-primary mt-0.5 flex-shrink-0">
                  <LifeBuoy size={20} />
                </div>
                <div>
                  <h6 className="fw-bold text-dark mb-1">Enterprise Subscription &amp; Technical Support</h6>
                  <p className="text-secondary small m-0 lh-base">
                    All system subscriptions, branch provisioning, and server infrastructure for {hotelName} are managed directly through the platform developer controls. 
                    Hotel receptionists and managers can contact technical support anytime for assistance.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Developer / Superuser Panel Button if superuser */}
          {isSuperUser && (
            <div className="p-3.5 rounded-3 bg-dark text-white mb-4 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
              <div className="d-flex align-items-center gap-3">
                <ShieldCheck size={24} className="text-info flex-shrink-0" />
                <div>
                  <div className="fw-bold text-white small">Developer / Platform Administrator Controls</div>
                  <div className="text-white-50 extra-small">
                    Manage multi-hotel properties, adjust room allocations, renew plans, and extend dates directly.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/platform')}
                className="btn btn-info btn-sm fw-bold px-3 py-2 rounded-3 text-dark flex-shrink-0"
              >
                Open Platform Hub
              </button>
            </div>
          )}

          {/* Direct Administrator Renewal Card */}
          {isBlocked && (
            <div className="card border rounded-3 p-4 mb-4 bg-light shadow-xs">
              <div className="d-flex align-items-center gap-2 mb-1.5">
                <ShieldCheck size={20} className="text-primary" />
                <h6 className="fw-bold text-dark m-0">Direct Administrative Renewal</h6>
              </div>
              <p className="text-secondary small mb-0 lh-base">
                All subscriptions, validity dates, and room allocations are managed directly through the Developer Dashboard.
                {isSuperUser ? (
                  <span> You can renew or extend validity now directly from the <strong>Developer Platform Panel</strong>.</span>
                ) : (
                  <span> Please notify your platform administrator or contact technical support below to extend your hotel's subscription validity.</span>
                )}
              </p>
            </div>
          )}

          {/* Support Channels Section */}
          <h6 className="fw-bold text-dark mb-3">
            Contact Technical Support Desk:
          </h6>

          <div className="row g-3">
            {/* WhatsApp Support */}
            <div className="col-md-4">
              <div className="card h-100 border rounded-3 p-3.5 text-center shadow-xs transition-all hover-shadow">
                <div className="mx-auto p-3 rounded-circle mb-3 d-inline-flex" style={{ backgroundColor: '#DCFCE7', color: '#16A34A' }}>
                  <MessageSquare size={24} />
                </div>
                <h6 className="fw-bold text-dark mb-1">WhatsApp Support</h6>
                <p className="text-secondary extra-small mb-3">
                  Direct live chat with dedicated technical engineers for instant renewal assistance.
                </p>
                <a
                  href={`https://wa.me/919876543210?text=Hello%20LMS%20Support,%20I%20need%20assistance%20with%20subscription%20renewal%20for%20${encodeURIComponent(hotelName)}%20(${encodeURIComponent(propertyCode)}).`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-sm btn-success fw-bold py-2 rounded-3 text-white mt-auto d-flex align-items-center justify-content-center gap-1.5"
                >
                  <MessageSquare size={14} /> WhatsApp Desk
                </a>
              </div>
            </div>

            {/* Email Support */}
            <div className="col-md-4">
              <div className="card h-100 border rounded-3 p-3.5 text-center shadow-xs transition-all hover-shadow">
                <div className="mx-auto p-3 rounded-circle mb-3 d-inline-flex" style={{ backgroundColor: '#DBEAFE', color: '#2563EB' }}>
                  <Mail size={24} />
                </div>
                <h6 className="fw-bold text-dark mb-1">Technical Email Desk</h6>
                <p className="text-secondary extra-small mb-3">
                  Send official requests for plan upgrades, validity extensions, and invoices.
                </p>
                <a
                  href={`mailto:support@lodgemanagement.com?subject=Subscription%20Assistance%20for%20${encodeURIComponent(hotelName)}%20(${encodeURIComponent(propertyCode)})`}
                  className="btn btn-sm btn-primary fw-bold py-2 rounded-3 text-white mt-auto d-flex align-items-center justify-content-center gap-1.5"
                >
                  <Mail size={14} /> Email Support
                </a>
              </div>
            </div>

            {/* Phone Helpline */}
            <div className="col-md-4">
              <div className="card h-100 border rounded-3 p-3.5 text-center shadow-xs transition-all hover-shadow">
                <div className="mx-auto p-3 rounded-circle mb-3 d-inline-flex" style={{ backgroundColor: '#F1F5F9', color: '#0F172A' }}>
                  <PhoneCall size={24} />
                </div>
                <h6 className="fw-bold text-dark mb-1">24/7 Helpline</h6>
                <p className="text-secondary extra-small mb-3">
                  Urgent front-desk phone hotline for quick subscription reactivation.
                </p>
                <a
                  href="tel:+919876543210"
                  className="btn btn-sm btn-light border fw-bold py-2 rounded-3 text-dark mt-auto d-flex align-items-center justify-content-center gap-1.5"
                >
                  <PhoneCall size={14} /> +91 98765 43210
                </a>
              </div>
            </div>
          </div>

          {!isExpired && (
            <div className="text-center mt-4 pt-2">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="btn btn-outline-secondary btn-sm rounded-3 px-4 py-2 fw-semibold"
              >
                ← Return to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default SubscriptionRenewal;
