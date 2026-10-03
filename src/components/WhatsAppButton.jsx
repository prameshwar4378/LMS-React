import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSettingsApi, logWhatsAppMessageApi } from '../api/settingsApi';
import {
  isWhatsAppEnabledForEvent,
  formatWhatsAppMobile,
  interpolateTemplate,
  buildWhatsAppUrl,
  getPreferredWhatsAppMode,
  setPreferredWhatsAppMode,
  copyTextToClipboard,
  DEFAULT_WHATSAPP_BOOKING_TEMPLATE,
  DEFAULT_WHATSAPP_CHECKIN_TEMPLATE,
  DEFAULT_WHATSAPP_PAYMENT_TEMPLATE,
  DEFAULT_WHATSAPP_CHECKOUT_TEMPLATE,
  DEFAULT_WHATSAPP_CANCELLATION_TEMPLATE,
  DEFAULT_WHATSAPP_EXTRA_CHARGE_TEMPLATE,
} from '../utils/whatsappHelper';

const DEFAULT_LABELS = {
  BOOKING: 'Send Booking Confirmation',
  CHECK_IN: 'Send Welcome Message',
  PAYMENT: 'Send Payment Receipt',
  CHECK_OUT: 'Send Thank You Message',
  CANCELLATION: 'Send Cancellation Notice',
  EXTRA_CHARGE: 'Send Extra Charge Notice',
};

const WhatsAppButton = ({
  eventType = 'BOOKING',
  customerMobile,
  customerName = '',
  data = {},
  bookingId = null,
  customerId = null,
  settings: propSettings = null,
  customLabel = null,
  className = '',
  size = 'md', // 'sm' | 'md' | 'lg'
  variant = 'solid', // 'solid' | 'outline' | 'subtle' | 'icon-only'
  title = '',
  showSplitMenu = true, // Whether to show companion copy / mode options for non-icon buttons
  onBeforeOpen = null,
  onAfterOpen = null,
}) => {
  const [justOpened, setJustOpened] = useState(false);
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [prefMode, setPrefMode] = useState(() => getPreferredWhatsAppMode(propSettings));
  const containerRef = useRef(null);

  // If settings not passed directly, fetch cached settings
  const { data: fetchedSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettingsApi,
    staleTime: 5 * 60 * 1000,
    enabled: !propSettings,
  });

  const settings = propSettings || fetchedSettings;

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [menuOpen]);

  // Pre-calculate message content and destination URLs synchronously (Unconditional Hook call)
  const { finalMessage, targetMobile, universalUrl, webUrl, primaryUrl } = useMemo(() => {
    let rawTemplate = '';
    switch (eventType) {
      case 'BOOKING':
        rawTemplate = settings?.whatsapp_booking_template || DEFAULT_WHATSAPP_BOOKING_TEMPLATE;
        break;
      case 'CHECK_IN':
        rawTemplate = settings?.whatsapp_checkin_template || DEFAULT_WHATSAPP_CHECKIN_TEMPLATE;
        break;
      case 'PAYMENT':
        rawTemplate = settings?.whatsapp_payment_template || DEFAULT_WHATSAPP_PAYMENT_TEMPLATE;
        break;
      case 'CHECK_OUT':
        rawTemplate = settings?.whatsapp_checkout_template || DEFAULT_WHATSAPP_CHECKOUT_TEMPLATE;
        break;
      case 'CANCELLATION':
        rawTemplate = settings?.whatsapp_cancellation_template || DEFAULT_WHATSAPP_CANCELLATION_TEMPLATE;
        break;
      case 'EXTRA_CHARGE':
        rawTemplate = settings?.whatsapp_extra_charge_template || DEFAULT_WHATSAPP_EXTRA_CHARGE_TEMPLATE;
        break;
      default:
        rawTemplate = '';
    }

    const templateData = {
      guest_name: customerName || data?.guest_name || data?.customer_name || 'Guest',
      property_name: settings?.lodge_name || 'Lodge',
      property_phone: settings?.phone || '',
      ...data,
    };

    const msg = interpolateTemplate(rawTemplate, templateData, eventType);
    const countryCode = settings?.whatsapp_default_country_code || '+91';
    const mobile = formatWhatsAppMobile(customerMobile, countryCode);
    const delay = settings?.whatsapp_close_delay_seconds || 2;
    const autoClose = settings?.whatsapp_auto_close_tab !== false;

    const bUrl = buildWhatsAppUrl({
      mobile,
      message: msg,
      mode: 'app_autoclose',
      defaultCountryCode: countryCode,
      closeDelay: delay,
      autoClose,
    });
    const directUrl = buildWhatsAppUrl({
      mobile,
      message: msg,
      mode: 'app_direct',
      defaultCountryCode: countryCode,
    });
    const uUrl = buildWhatsAppUrl({
      mobile,
      message: msg,
      mode: 'universal',
      defaultCountryCode: countryCode,
    });
    const wUrl = buildWhatsAppUrl({
      mobile,
      message: msg,
      mode: 'web',
      defaultCountryCode: countryCode,
    });

    let primUrl = uUrl;
    if (prefMode === 'web') primUrl = wUrl;
    else if (prefMode === 'universal') primUrl = uUrl;
    else if (prefMode === 'app_direct') primUrl = directUrl;
    else if (prefMode === 'app_autoclose') primUrl = bUrl;
    else primUrl = uUrl;

    return {
      finalMessage: msg,
      targetMobile: mobile,
      bridgeUrl: bUrl,
      appDirectUrl: directUrl,
      universalUrl: uUrl,
      webUrl: wUrl,
      primaryUrl: primUrl,
    };
  }, [settings, eventType, customerMobile, customerName, data, prefMode]);

  // Strict Condition Check: Master ON, Event ON, Valid Mobile
  if (!isWhatsAppEnabledForEvent(settings, eventType, customerMobile)) {
    return null;
  }

  const handleClick = (e) => {
    // Prevent event bubbling so container rows, cards, or modals don't react
    e.stopPropagation();

    if (!primaryUrl) {
      e.preventDefault();
      return;
    }

    if (onBeforeOpen) {
      try { onBeforeOpen(); } catch {}
    }

    // Direct App Mode: Launch protocol without opening a new tab
    if (prefMode === 'app_direct') {
      e.preventDefault();
      try {
        window.location.href = appDirectUrl;
      } catch (err) {
        console.warn('Direct app protocol launch exception:', err);
      }
    }
    // For 'universal', 'web', or 'app_autoclose':
    // Do NOT call e.preventDefault()!
    // The native <a> tag navigation will open the new tab synchronously without triggering
    // any browser popup blocker, leaving the current LMS window undisturbed.

    // Non-blocking asynchronous message audit log to backend
    try {
      logWhatsAppMessageApi({
        event_type: eventType || 'MANUAL',
        mobile: targetMobile,
        recipient_name: customerName || data?.guest_name || 'Guest',
        message: finalMessage || '',
        status: `Prepared / Opened (${prefMode || 'universal'})`,
        booking: bookingId || null,
        customer: customerId || null,
      }).catch((err) => console.warn('Non-blocking WhatsApp audit log error:', err));
    } catch (err) {
      console.warn('Audit dispatch ignored:', err);
    }

    if (onAfterOpen) {
      try { onAfterOpen(); } catch {}
    }

    setJustOpened(true);
    setTimeout(() => {
      setJustOpened(false);
    }, 2500);
  };

  const handleCopy = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const success = await copyTextToClipboard(finalMessage);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleOptionOpen = (e, mode) => {
    e.stopPropagation();
    setMenuOpen(false);

    if (mode === 'app_direct') {
      e.preventDefault();
      try { window.location.href = appDirectUrl; } catch {}
    }
    // For 'app_autoclose', 'web', and 'universal', the native <a> href opens synchronously in new tab

    try {
      logWhatsAppMessageApi({
        event_type: eventType || 'MANUAL',
        mobile: targetMobile,
        recipient_name: customerName || data?.guest_name || 'Guest',
        message: finalMessage || '',
        status: `Prepared / Opened (${mode})`,
        booking: bookingId || null,
        customer: customerId || null,
      }).catch(console.warn);
    } catch {}

    setJustOpened(true);
    setTimeout(() => setJustOpened(false), 2500);
  };

  const handleToggleMode = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const cycle = ['universal', 'web', 'app_autoclose', 'app_direct'];
    const idx = cycle.indexOf(prefMode);
    const nextMode = cycle[(idx + 1) % cycle.length];
    setPreferredWhatsAppMode(nextMode);
    setPrefMode(nextMode);
  };

  const labelText = customLabel || DEFAULT_LABELS[eventType] || 'Send WhatsApp';
  const buttonTitle = title || labelText;

  // Base button classes
  let btnClasses = 'btn d-inline-flex align-items-center justify-content-center gap-1.5 transition-all fw-semibold text-decoration-none ';
  
  if (size === 'sm') {
    btnClasses += 'btn-sm py-1 px-2.5 rounded-2 extra-small ';
  } else if (size === 'lg') {
    btnClasses += 'btn-lg py-2.5 px-4 rounded-3 fs-6 ';
  } else {
    btnClasses += 'py-2 px-3 rounded-3 small ';
  }

  if (variant === 'solid') {
    btnClasses += 'text-white shadow-xs ';
  } else if (variant === 'outline') {
    btnClasses += 'border ';
  } else if (variant === 'subtle') {
    btnClasses += 'border border-opacity-25 ';
  } else if (variant === 'icon-only') {
    btnClasses += 'btn-outline-success ';
  }

  const customStyle = {
    ...(variant === 'solid' ? { backgroundColor: '#16a34a', borderColor: '#15803d', color: '#ffffff' } : {}),
    ...(variant === 'subtle' ? { backgroundColor: '#ecfdf5', borderColor: '#22c55e', color: '#15803d' } : {}),
    ...(variant === 'outline' ? { backgroundColor: 'transparent', borderColor: '#22c55e', color: '#15803d' } : {}),
    ...(variant === 'icon-only' ? { color: '#16a34a', borderColor: '#22c55e' } : {}),
  };

  // Compact icon-only button (e.g. for tight table rows)
  if (variant === 'icon-only') {
    return (
      <div className="position-relative d-inline-block">
        <a
          href={primaryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btnClasses} ${className} text-decoration-none ${justOpened ? 'btn-success text-white' : ''}`}
          style={customStyle}
          onClick={handleClick}
          onContextMenu={handleCopy}
          title={`${buttonTitle} (Opens WhatsApp in new tab • Right-click to copy text)`}
          aria-label={buttonTitle}
        >
          <i
            className={`bi ${justOpened ? 'bi-check-lg' : copied ? 'bi-clipboard-check' : 'bi-whatsapp'}`}
            style={{ fontSize: size === 'sm' ? '0.9rem' : (size === 'lg' ? '1.25rem' : '1.05rem') }}
          ></i>
        </a>
        {copied && (
          <span
            className="position-absolute bottom-100 start-50 translate-middle-x badge bg-dark text-white shadow-sm extra-small px-2 py-1 rounded-2 mb-1"
            style={{ zIndex: 1060, whiteSpace: 'nowrap', pointerEvents: 'none' }}
          >
            Copied!
          </span>
        )}
      </div>
    );
  }

  // Standalone non-split button
  if (!showSplitMenu) {
    return (
      <a
        href={primaryUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`${btnClasses} ${className} text-decoration-none`}
        style={customStyle}
        onClick={handleClick}
        title={`${buttonTitle} (Opens in new tab)`}
        aria-label={buttonTitle}
      >
        <i
          className={`bi ${justOpened ? 'bi-check-lg' : 'bi-whatsapp'}`}
          style={{ fontSize: size === 'sm' ? '0.9rem' : (size === 'lg' ? '1.25rem' : '1.05rem') }}
        ></i>
        <span>{justOpened ? (size === 'sm' ? 'Tab Opened!' : 'Opened in new tab!') : labelText}</span>
      </a>
    );
  }

  // Split-button layout with primary new-tab action + quick copy + options dropdown
  const isFullWidth = className.includes('w-100');
  const filteredClassName = className.replace(/w-100/g, '').trim();

  const splitBtnClasses = `btn ${size === 'sm' ? 'btn-sm py-1 extra-small' : (size === 'lg' ? 'btn-lg py-2.5 fs-6' : 'py-2 small')} `;

  const splitBtnStyle = {
    ...(variant === 'solid' ? { backgroundColor: '#15803d', borderColor: '#15803d', color: '#ffffff' } : {}),
    ...(variant === 'subtle' ? { backgroundColor: '#dcfce7', borderColor: '#22c55e', color: '#15803d' } : {}),
    ...(variant === 'outline' ? { backgroundColor: 'transparent', borderColor: '#22c55e', color: '#15803d' } : {}),
  };

  return (
    <div
      ref={containerRef}
      className={`btn-group ${isFullWidth ? 'w-100' : 'd-inline-flex'} position-relative align-items-stretch`}
      role="group"
      aria-label={buttonTitle}
    >
      {/* Primary Action Anchor: Directly Opens in New Tab */}
      <a
        href={primaryUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`${btnClasses} ${filteredClassName} ${isFullWidth ? 'flex-grow-1' : ''} text-decoration-none`}
        style={customStyle}
        onClick={handleClick}
        title={`${buttonTitle} (Opens in new tab)`}
      >
        <i
          className={`bi ${justOpened ? 'bi-check-lg' : 'bi-whatsapp'}`}
          style={{ fontSize: size === 'sm' ? '0.9rem' : (size === 'lg' ? '1.25rem' : '1.05rem') }}
        ></i>
        <span>{justOpened ? (size === 'sm' ? 'Tab Opened!' : 'Opened in new tab!') : labelText}</span>
      </a>

      {/* Quick Copy Button */}
      <button
        type="button"
        className={`${splitBtnClasses} px-2.5 d-inline-flex align-items-center justify-content-center transition-all`}
        style={splitBtnStyle}
        onClick={handleCopy}
        title={copied ? 'Copied to clipboard!' : 'Copy message text to clipboard'}
        aria-label="Copy message text to clipboard"
      >
        <i className={`bi ${copied ? 'bi-check2 text-white fw-bold' : 'bi-clipboard'}`}></i>
      </button>

      {/* Options Dropdown Toggle */}
      <button
        type="button"
        className={`${splitBtnClasses} dropdown-toggle dropdown-toggle-split px-2`}
        style={splitBtnStyle}
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen(!menuOpen);
        }}
        title="More WhatsApp Options"
        aria-label="More WhatsApp Options"
      ></button>

      {/* Dropdown Menu */}
      {menuOpen && (
        <ul
          className="dropdown-menu dropdown-menu-end show shadow-lg border-0 rounded-3 p-2 extra-small position-absolute end-0 mt-1"
          style={{ zIndex: 1060, minWidth: '240px', top: '100%' }}
        >
          <li className="dropdown-header extra-small text-uppercase fw-bold text-muted px-2 py-1">
            WhatsApp Options
          </li>
          <li>
            <a
              className="dropdown-item py-1.5 px-2 rounded-2 d-flex align-items-center gap-2"
              href={bridgeUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => handleOptionOpen(e, 'app_autoclose')}
            >
              <i className="bi bi-phone-fill text-success fs-6"></i>
              <div>
                <div className="fw-semibold text-dark">Open WhatsApp App (Auto-Close Tab)</div>
                <div className="extra-small text-muted">Closes tab automatically after launch</div>
              </div>
            </a>
          </li>
          <li>
            <button
              type="button"
              className="dropdown-item py-1.5 px-2 rounded-2 d-flex align-items-center gap-2"
              onClick={(e) => handleOptionOpen(e, 'app_direct')}
            >
              <i className="bi bi-lightning-charge-fill text-warning fs-6"></i>
              <div>
                <div className="fw-semibold text-dark">Direct App Launch (No Tab)</div>
                <div className="extra-small text-muted">Launches app directly without new tab</div>
              </div>
            </button>
          </li>
          <li>
            <a
              className="dropdown-item py-1.5 px-2 rounded-2 d-flex align-items-center gap-2"
              href={webUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => handleOptionOpen(e, 'web')}
            >
              <i className="bi bi-browser-chrome text-success fs-6"></i>
              <div>
                <div className="fw-semibold text-dark">Open WhatsApp Web</div>
                <div className="extra-small text-muted">Direct browser web tab (stays open)</div>
              </div>
            </a>
          </li>
          <li>
            <a
              className="dropdown-item py-1.5 px-2 rounded-2 d-flex align-items-center gap-2"
              href={universalUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => handleOptionOpen(e, 'universal')}
            >
              <i className="bi bi-globe text-primary fs-6"></i>
              <div>
                <div className="fw-semibold text-dark">Open Universal Link (wa.me)</div>
                <div className="extra-small text-muted">Standard wa.me page</div>
              </div>
            </a>
          </li>
          <li><hr className="dropdown-divider my-1" /></li>
          <li>
            <button
              type="button"
              className="dropdown-item py-1.5 px-2 rounded-2 d-flex align-items-center gap-2"
              onClick={handleCopy}
            >
              <i className="bi bi-clipboard-check text-secondary fs-6"></i>
              <div>
                <div className="fw-semibold text-dark">Copy Message Text</div>
                <div className="extra-small text-muted">Copy to paste anywhere</div>
              </div>
            </button>
          </li>
          <li><hr className="dropdown-divider my-1" /></li>
          <li className="px-2 py-1 extra-small text-muted d-flex align-items-center justify-content-between">
            <span>Default: <strong className="text-dark">
              {prefMode === 'web'
                ? 'Web'
                : prefMode === 'universal'
                ? 'wa.me'
                : prefMode === 'app_direct'
                ? 'Direct App'
                : 'App (Auto-Close)'}
            </strong></span>
            <button
              type="button"
              className="btn btn-link p-0 extra-small text-decoration-none text-primary fw-semibold"
              onClick={handleToggleMode}
            >
              Switch default
            </button>
          </li>
        </ul>
      )}

      {copied && (
        <span
          className="position-absolute bottom-100 end-0 badge bg-dark text-white shadow-sm extra-small px-2 py-1 rounded-2 mb-1"
          style={{ zIndex: 1065, whiteSpace: 'nowrap', pointerEvents: 'none' }}
        >
          Message copied to clipboard!
        </span>
      )}
    </div>
  );
};

export default WhatsAppButton;
