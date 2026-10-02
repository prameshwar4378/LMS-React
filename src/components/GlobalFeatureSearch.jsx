import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSpotlightGuide } from '../context/SpotlightGuideContext';
import { 
  Search, X, LayoutDashboard, CalendarCheck, CalendarPlus, UserCheck, 
  KeyRound, Clock, DoorClosed, Grid, Globe, Users, Wallet, CreditCard, 
  BarChart3, Settings, ShieldCheck, Receipt, LifeBuoy, Command 
} from 'lucide-react';

const FEATURE_REGISTRY = [
  { id: 'dashboard', title: 'Operations Dashboard', description: 'Real-time overview of hotel operations including occupancy rates, revenue, check-ins, check-outs, and key performance indicators', route: '/dashboard', icon: LayoutDashboard, category: 'Operations', keywords: ['dashboard', 'overview', 'kpi', 'occupancy', 'revenue', 'statistics', 'home', 'analytics', 'performance', 'summary', 'metrics'] },
  { id: 'bookings', title: 'Reservations & Bookings', description: 'Create, manage, and track room reservations with guest details, dates, tariffs, and booking status', route: '/bookings', icon: CalendarCheck, category: 'Operations', keywords: ['booking', 'reservation', 'reserve', 'advance booking', 'create booking', 'new booking', 'schedule', 'upcoming'] },
  { id: 'booking-create', title: 'Create New Booking', description: 'Quick-create a new room reservation with guest info, room selection, tariff plan, and advance payment', route: '/bookings/create', icon: CalendarPlus, category: 'Operations', keywords: ['new booking', 'create reservation', 'book room', 'new reservation', 'add booking', 'quick booking'] },
  { id: 'checkin', title: 'Guest Check-In', description: 'Process walk-in and pre-booked guest arrivals with ID verification, room assignment, and folio creation', route: '/check-in', icon: UserCheck, category: 'Operations', keywords: ['check-in', 'checkin', 'arrival', 'walk-in', 'walkin', 'guest arrival', 'register guest', 'front desk', 'reception', 'id proof', 'aadhaar', 'passport'] },
  { id: 'current-stays', title: 'Current Stays & In-House Guests', description: 'View all currently checked-in guests, their room assignments, stay duration, pending balances, and process check-outs', route: '/current-stays', icon: KeyRound, category: 'Operations', keywords: ['current stays', 'in-house', 'checked in', 'active stays', 'guests', 'checkout', 'check-out', 'departure', 'extend stay', 'room swap', 'folio'] },
  { id: 'shifts', title: 'Shift & Cashier Till Management', description: 'Open and close cashier shifts, declare opening float, reconcile cash drawer, and generate shift handover audit reports', route: '/shifts', icon: Clock, category: 'Operations', keywords: ['shift', 'till', 'cashier', 'cash drawer', 'float', 'handover', 'reconciliation', 'audit', 'shift report', 'open shift', 'close shift', 'cash count', 'discrepancy'] },
  { id: 'rooms', title: 'Room Inventory & Status', description: 'View and manage all rooms with their current status (vacant, occupied, maintenance, cleaning), floor, and housekeeping state', route: '/rooms', icon: DoorClosed, category: 'Rooms & Showcase', keywords: ['rooms', 'room list', 'room status', 'vacant', 'occupied', 'maintenance', 'housekeeping', 'cleaning', 'floor', 'room number', 'availability'] },
  { id: 'room-types', title: 'Room Categories & Tariff Plans', description: 'Define room types (Deluxe, Suite, Standard etc.), set base tariffs, weekend rates, extra person charges, and amenities', route: '/room-types', icon: Grid, category: 'Rooms & Showcase', keywords: ['room type', 'category', 'tariff', 'rate', 'pricing', 'deluxe', 'suite', 'standard', 'amenity', 'extra bed', 'weekend rate', 'room category', 'base rate'] },
  { id: 'catalogue', title: 'Digital Room QR Catalogue', description: 'Manage your hotel digital standee catalogue with food menu, amenities, Wi-Fi info, and QR code for guest self-service', route: '/catalogue/manage', icon: Globe, category: 'Rooms & Showcase', keywords: ['catalogue', 'catalog', 'qr code', 'digital menu', 'food menu', 'standee', 'guest menu', 'wifi', 'amenities', 'room service', 'qr standee', 'guest experience'] },
  { id: 'customers', title: 'Guest & Customer Directory', description: 'Search, view, and manage guest profiles with contact details, ID proofs, stay history, and VIP preferences', route: '/customers', icon: Users, category: 'Customers', keywords: ['customer', 'guest', 'profile', 'guest list', 'directory', 'contact', 'phone', 'mobile', 'email', 'id proof', 'aadhaar', 'passport', 'vip', 'repeat guest', 'history'] },
  { id: 'wallets', title: 'Customer Wallet & Prepaid Balance', description: 'Manage guest prepaid wallets, add credits, view transaction history, and apply wallet balance to room bills', route: '/wallets', icon: Wallet, category: 'Finance', keywords: ['wallet', 'prepaid', 'credit', 'balance', 'top-up', 'recharge', 'wallet balance', 'customer wallet', 'advance deposit'] },
  { id: 'payments', title: 'Payment Transactions & Collections', description: 'View all payment transactions, pending dues, collection methods (cash, UPI, card), refunds, and payment receipts', route: '/payments', icon: CreditCard, category: 'Finance', keywords: ['payment', 'transaction', 'collection', 'cash', 'upi', 'card', 'online', 'refund', 'receipt', 'invoice', 'bill', 'billing', 'gst', 'tax', 'pending', 'due', 'outstanding'] },
  { id: 'reports', title: 'Financial Reports & Analytics', description: 'Generate detailed financial reports including revenue summary, occupancy analysis, GST reports, shift audit reports, and settlement statements', route: '/reports', icon: BarChart3, category: 'Finance', keywords: ['report', 'analytics', 'revenue', 'financial', 'gst report', 'tax report', 'occupancy report', 'shift report', 'z-report', 'settlement', 'daily report', 'monthly report', 'export', 'download', 'pdf', 'excel'] },
  { id: 'staff', title: 'Staff & Branch Management', description: 'Add and manage staff users, assign roles (Owner, Manager, Receptionist), set permissions, and configure multi-branch access', route: '/staff', icon: UserCheck, category: 'Administration', keywords: ['staff', 'employee', 'user', 'branch', 'multi-branch', 'add user', 'create user', 'role', 'permission', 'access', 'manager', 'receptionist', 'owner', 'admin', 'team'] },
  { id: 'settings', title: 'System Settings & Configuration', description: 'Configure hotel details, business info, GST number, logo, contact info, check-in/check-out times, and operational preferences', route: '/settings', icon: Settings, category: 'Administration', keywords: ['settings', 'configuration', 'config', 'hotel details', 'business', 'gst number', 'gstin', 'logo', 'address', 'phone', 'email', 'checkout time', 'checkin time', 'preferences', 'operational mode'] },
  { id: 'settings-permissions', title: 'Permissions & Role Access Control', description: 'Define granular access permissions for each staff role — control who can create bookings, process payments, view reports, manage settings, and more', route: '/settings', icon: ShieldCheck, category: 'Administration', keywords: ['permission', 'role', 'access control', 'acl', 'rbac', 'role based', 'staff permission', 'can create', 'can edit', 'can delete', 'can view', 'restrict', 'security', 'authorization'] },
  { id: 'settings-invoice', title: 'Invoice & Billing Configuration', description: 'Set up GST tax slabs, SAC codes, invoice numbering format, thermal printer settings, and A4 invoice templates', route: '/settings', icon: Receipt, category: 'Administration', keywords: ['invoice', 'billing', 'gst', 'tax slab', 'sac code', 'cgst', 'sgst', 'thermal printer', 'receipt', 'print', 'invoice template', 'bill format', 'tax configuration'] },
  { id: 'settings-mode', title: 'Hotel Operational Mode', description: 'Switch between Single Owner mode (no shift management) and Shift-Wise mode (full cashier shift audit & till management)', route: '/settings', icon: Settings, category: 'Administration', keywords: ['operational mode', 'single owner', 'shift wise', 'mode', 'shift management', 'enable shift', 'disable shift'] },
  { id: 'subscription', title: 'Subscription & System Support', description: 'View your current subscription status, plan details, expiry date, and contact support for renewal or technical assistance', route: '/subscription', icon: LifeBuoy, category: 'System', keywords: ['subscription', 'plan', 'expiry', 'renewal', 'support', 'helpdesk', 'contact support', 'license', 'billing cycle', 'upgrade'] },
];

const CATEGORY_COLORS = {
  'Operations': { bg: '#EFF6FF', text: '#2563EB' },
  'Rooms & Showcase': { bg: '#FEF3C7', text: '#D97706' },
  'Customers': { bg: '#F5F3FF', text: '#7C3AED' },
  'Finance': { bg: '#ECFDF5', text: '#059669' },
  'Administration': { bg: '#F1F5F9', text: '#475569' },
  'System': { bg: '#FFF1F2', text: '#E11D48' },
};

const GlobalFeatureSearch = () => {
  const navigate = useNavigate();
  const { triggerSpotlight } = useSpotlightGuide();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => {
          if (!prev) {
            setTimeout(() => inputRef.current?.focus(), 50);
          }
          return !prev;
        });
      }
      if (e.key === 'Escape' && isOpen) {
        closeSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        closeSearch();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const closeSearch = () => {
    setIsOpen(false);
    setQuery('');
    if (inputRef.current) inputRef.current.blur();
  };

  const toggleSearch = () => {
    if (isOpen) {
      closeSearch();
    } else {
      setIsOpen(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const results = useMemo(() => {
    if (!query.trim()) return [];

    const queryWords = query.toLowerCase().split(/\s+/).filter(Boolean);

    const scoredFeatures = FEATURE_REGISTRY.map(feature => {
      let score = 0;
      const titleLower = feature.title.toLowerCase();
      const titleWords = titleLower.split(/\s+/);
      const descriptionLower = feature.description.toLowerCase();
      const descriptionWords = descriptionLower.split(/\s+/);
      const searchableText = `${titleLower} ${descriptionLower} ${feature.keywords.join(' ')} ${feature.category.toLowerCase()}`;

      queryWords.forEach(qWord => {
        let maxWordScore = 0;

        if (titleWords.includes(qWord)) {
          maxWordScore = Math.max(maxWordScore, 10);
        } else if (titleWords.some(t => t.startsWith(qWord))) {
          maxWordScore = Math.max(maxWordScore, 7);
        }

        if (feature.keywords.some(k => k.toLowerCase() === qWord)) {
          maxWordScore = Math.max(maxWordScore, 5);
        } else if (feature.keywords.some(k => k.toLowerCase().startsWith(qWord))) {
          maxWordScore = Math.max(maxWordScore, 3);
        }

        if (descriptionWords.includes(qWord)) {
          maxWordScore = Math.max(maxWordScore, 2);
        }

        if (searchableText.includes(qWord)) {
          maxWordScore = Math.max(maxWordScore, 1);
        }
        score += maxWordScore;
      });

      return { ...feature, score };
    });

    return scoredFeatures
      .filter(f => f.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [query]);

  const handleResultClick = (result) => {
    navigate(result.route);
    // Trigger spotlight guide to highlight the feature on the target page
    triggerSpotlight(result.id, result.title, result.description);
    closeSearch();
  };

  return (
    <div ref={containerRef} className="position-relative d-flex align-items-center" style={{ zIndex: 1050 }}>
      {/* Animated expanding search input */}
      <div 
        className="d-flex align-items-center bg-white rounded-pill"
        style={{
          position: 'absolute',
          right: '0',
          width: isOpen ? 'min(360px, 55vw)' : '32px',
          height: '32px',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease',
          overflow: 'hidden',
          boxShadow: isOpen ? '0 0 0 3px rgba(2, 132, 199, 0.12), 0 4px 14px -2px rgba(15, 23, 42, 0.1)' : 'none',
          paddingLeft: '14px',
          paddingRight: '36px',
          border: `1px solid ${isOpen ? '#0284C7' : '#E2E8F0'}`,
          borderRadius: '50px'
        }}
      >
        <Search
          size={15}
          strokeWidth={2.2}
          className="flex-shrink-0"
          style={{
            color: '#0284C7',
            marginRight: '10px'
          }}
        />
        <input
          ref={inputRef}
          type="text"
          className="form-control border-0 shadow-none bg-transparent p-0"
          placeholder="Search features, pages, settings..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            outline: 'none',
            fontSize: '0.8rem',
            color: '#0F172A',
            fontWeight: 400
          }}
        />
      </div>
      
      {/* Search trigger button */}
      <button 
        onClick={toggleSearch} 
        className="btn p-0 d-flex align-items-center justify-content-center rounded-circle border-0 position-relative flex-shrink-0"
        style={{
          width: '32px',
          height: '32px',
          backgroundColor: isOpen ? 'transparent' : '#F1F5F9',
          color: isOpen ? '#0284C7' : '#475569',
          transition: 'all 0.2s ease',
          zIndex: 2
        }}
        title={isOpen ? "Close search (Esc)" : `Search Features (${isMac ? '⌘K' : 'Ctrl+K'})`}
        aria-label="Search features"
      >
        {isOpen ? <X size={16} strokeWidth={2.4} /> : <Search size={15} strokeWidth={2.2} />}
      </button>

      {/* Keyboard shortcut hint (only shows when closed on desktop) */}
      {!isOpen && (
        <div 
          className="d-none d-lg-flex align-items-center justify-content-center border rounded ms-1"
          style={{ height: '20px', padding: '0 5px', fontSize: '0.6rem', color: '#94A3B8', userSelect: 'none', backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', fontWeight: 600, letterSpacing: '0.02em' }}
        >
          {isMac ? '⌘K' : 'Ctrl+K'}
        </div>
      )}
      
      {/* Results dropdown */}
      {isOpen && (
        <div 
          className="position-absolute bg-white overflow-hidden"
          style={{
            top: 'calc(100% + 8px)',
            right: 0,
            width: 'min(420px, calc(100vw - 32px))',
            borderRadius: '16px',
            boxShadow: '0 20px 45px -12px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(226, 232, 240, 0.85)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            maxHeight: '440px',
            overflowY: 'auto',
            zIndex: 1000
          }}
        >
          {!query.trim() ? (
            <div className="p-4 text-center">
              <div className="d-flex align-items-center justify-content-center mx-auto mb-2" style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#F1F5F9' }}>
                <Command size={22} className="text-muted" />
              </div>
              <p className="mb-1 text-dark fw-semibold" style={{ fontSize: '0.85rem' }}>Search Features & Pages</p>
              <p className="mb-0 text-muted" style={{ fontSize: '0.75rem' }}>Type to find any feature, setting, or page in the system</p>
            </div>
          ) : results.length > 0 ? (
            <div className="py-1.5">
              <div className="px-3 py-1.5">
                <span className="text-uppercase fw-bold text-secondary" style={{ fontSize: '0.625rem', letterSpacing: '0.06em' }}>{results.length} Result{results.length !== 1 ? 's' : ''}</span>
              </div>
              {results.map((result) => {
                const Icon = result.icon;
                const colors = CATEGORY_COLORS[result.category] || { bg: '#F1F5F9', text: '#475569' };
                
                return (
                  <div 
                    key={result.id}
                    className="d-flex align-items-start gap-3 mx-1.5 rounded-3 px-2.5 py-2 cursor-pointer"
                    style={{ cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    onClick={() => handleResultClick(result)}
                  >
                    <div 
                      className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                      style={{ width: '36px', height: '36px', backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.bg}` }}
                    >
                      <Icon size={17} strokeWidth={2.2} />
                    </div>
                    <div className="flex-grow-1 overflow-hidden">
                      <div className="d-flex align-items-center gap-2 mb-0.5">
                        <span className="fw-bold text-truncate" style={{ fontSize: '0.82rem', color: '#0F172A', letterSpacing: '-0.01em' }}>
                          {result.title}
                        </span>
                        <span 
                          className="badge rounded-pill fw-semibold flex-shrink-0"
                          style={{ backgroundColor: colors.bg, color: colors.text, fontSize: '0.6rem', padding: '2px 6px', border: `1px solid ${colors.bg}` }}
                        >
                          {result.category}
                        </span>
                      </div>
                      <p className="mb-0 text-secondary" style={{ fontSize: '0.72rem', lineHeight: '1.45', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', whiteSpace: 'normal' }}>
                        {result.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 text-center">
              <div className="d-flex align-items-center justify-content-center mx-auto mb-2" style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#FEF2F2' }}>
                <Search size={22} className="text-danger opacity-50" />
              </div>
              <p className="mb-1 text-dark fw-semibold" style={{ fontSize: '0.85rem' }}>No matching features</p>
              <p className="mb-0 text-muted" style={{ fontSize: '0.75rem' }}>Try different keywords or shorter phrases</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalFeatureSearch;
