/**
 * WhatsApp Customer Messaging Utility & Configuration
 * Provides template interpolation, number formatting, validation,
 * preview generators, and click-to-chat deep-link handlers.
 */

import { logWhatsAppMessageApi } from '../api/settingsApi.js';

export const DEFAULT_WHATSAPP_BOOKING_TEMPLATE = `Hello {{guest_name}},

Your booking at {{property_name}} has been confirmed.

Booking: {{booking_number}}
Room: {{room_number}}
Check-in: {{check_in_date}} {{check_in_time}}
Check-out: {{check_out_date}}
Guests: {{guest_count}}

Advance Paid: ₹{{advance_paid}}
Balance: ₹{{balance_amount}}

Thank you!
{{property_name}}`;

export const DEFAULT_WHATSAPP_CHECKIN_TEMPLATE = `Hello {{guest_name}},

Welcome to {{property_name}}! Your check-in is complete.

Room: {{room_number}}
Check-out: {{check_out_date}} {{check_out_time}}
Amount Paid: ₹{{amount_paid}}
Balance: ₹{{balance_amount}}

We wish you a comfortable stay!

{{property_name}}`;

export const DEFAULT_WHATSAPP_PAYMENT_TEMPLATE = `Hello {{guest_name}},

We have received your payment of ₹{{payment_amount}}.

Booking: {{booking_number}}
Total Paid: ₹{{total_paid}}
Balance Due: ₹{{balance_amount}}

Thank you!
{{property_name}}`;

export const DEFAULT_WHATSAPP_CHECKOUT_TEMPLATE = `Hello {{guest_name}},

Thank you for staying at {{property_name}}!

Booking: {{booking_number}}
Room: {{room_number}}
Total Amount: ₹{{grand_total}}
Amount Paid: ₹{{total_paid}}
Balance: ₹{{balance_amount}}

We appreciate your visit and look forward to welcoming you again.

Thank you!`;

export const DEFAULT_WHATSAPP_CANCELLATION_TEMPLATE = `Hello {{guest_name}},

Your booking at {{property_name}} has been cancelled.

Booking: {{booking_number}}
Room: {{room_number}}
Check-in Date: {{check_in_date}}
Check-out Date: {{check_out_date}}

If you have any questions or need assistance, please contact us at {{property_phone}}.

Thank you,
{{property_name}}`;

export const DEFAULT_WHATSAPP_EXTRA_CHARGE_TEMPLATE = `Hello {{guest_name}},

An extra charge has been added to your stay at {{property_name}}.

Stay: {{booking_number}}
Room: {{room_number}}
Charge: {{charge_description}}
Amount: ₹{{charge_amount}}
Total Extra Charges: ₹{{total_extra_charges}}
Current Balance Due: ₹{{balance_amount}}

Thank you!
{{property_name}}`;

export const EVENT_VARIABLES = {
  BOOKING: [
    { key: 'guest_name', label: 'Guest Name' },
    { key: 'booking_number', label: 'Booking Number' },
    { key: 'room_number', label: 'Room Number' },
    { key: 'check_in_date', label: 'Check-in Date' },
    { key: 'check_in_time', label: 'Check-in Time' },
    { key: 'check_out_date', label: 'Check-out Date' },
    { key: 'check_out_time', label: 'Check-out Time' },
    { key: 'guest_count', label: 'Guest Count' },
    { key: 'number_of_nights', label: 'Nights' },
    { key: 'booking_amount', label: 'Booking Amount' },
    { key: 'advance_paid', label: 'Advance Paid' },
    { key: 'balance_amount', label: 'Balance Amount' },
    { key: 'property_name', label: 'Lodge/Hotel Name' },
    { key: 'property_phone', label: 'Hotel Phone' },
  ],
  CHECK_IN: [
    { key: 'guest_name', label: 'Guest Name' },
    { key: 'booking_number', label: 'Booking Number' },
    { key: 'room_number', label: 'Room Number' },
    { key: 'check_in_date', label: 'Check-in Date' },
    { key: 'check_in_time', label: 'Check-in Time' },
    { key: 'check_out_date', label: 'Check-out Date' },
    { key: 'check_out_time', label: 'Check-out Time' },
    { key: 'guest_count', label: 'Guest Count' },
    { key: 'number_of_nights', label: 'Nights' },
    { key: 'amount_paid', label: 'Amount Paid' },
    { key: 'balance_amount', label: 'Balance Amount' },
    { key: 'property_name', label: 'Lodge/Hotel Name' },
    { key: 'property_phone', label: 'Hotel Phone' },
  ],
  PAYMENT: [
    { key: 'guest_name', label: 'Guest Name' },
    { key: 'booking_number', label: 'Booking Number' },
    { key: 'room_number', label: 'Room Number' },
    { key: 'payment_amount', label: 'Payment Amount' },
    { key: 'total_paid', label: 'Total Paid' },
    { key: 'balance_amount', label: 'Balance Amount' },
    { key: 'payment_date', label: 'Payment Date' },
    { key: 'payment_method', label: 'Payment Method' },
    { key: 'property_name', label: 'Lodge/Hotel Name' },
    { key: 'property_phone', label: 'Hotel Phone' },
  ],
  CHECK_OUT: [
    { key: 'guest_name', label: 'Guest Name' },
    { key: 'booking_number', label: 'Booking Number' },
    { key: 'room_number', label: 'Room Number' },
    { key: 'check_in_date', label: 'Check-in Date' },
    { key: 'check_out_date', label: 'Check-out Date' },
    { key: 'total_nights', label: 'Total Nights' },
    { key: 'room_charges', label: 'Room Charges' },
    { key: 'extra_charges', label: 'Extra Charges' },
    { key: 'discount', label: 'Discount' },
    { key: 'tax', label: 'Tax' },
    { key: 'grand_total', label: 'Grand Total' },
    { key: 'total_paid', label: 'Total Paid' },
    { key: 'balance_amount', label: 'Balance Amount' },
    { key: 'payment_status', label: 'Payment Status' },
    { key: 'property_name', label: 'Lodge/Hotel Name' },
    { key: 'property_phone', label: 'Hotel Phone' },
  ],
  CANCELLATION: [
    { key: 'guest_name', label: 'Guest Name' },
    { key: 'booking_number', label: 'Booking Number' },
    { key: 'room_number', label: 'Room Number' },
    { key: 'check_in_date', label: 'Check-in Date' },
    { key: 'check_out_date', label: 'Check-out Date' },
    { key: 'advance_paid', label: 'Advance Paid' },
    { key: 'property_name', label: 'Lodge/Hotel Name' },
    { key: 'property_phone', label: 'Hotel Phone' },
  ],
  EXTRA_CHARGE: [
    { key: 'guest_name', label: 'Guest Name' },
    { key: 'booking_number', label: 'Stay / Booking Number' },
    { key: 'room_number', label: 'Room Number' },
    { key: 'charge_description', label: 'Charge Description' },
    { key: 'charge_amount', label: 'Charge Amount' },
    { key: 'total_extra_charges', label: 'Total Extra Charges' },
    { key: 'grand_total', label: 'Grand Total' },
    { key: 'total_paid', label: 'Total Paid' },
    { key: 'balance_amount', label: 'Current Balance Due' },
    { key: 'property_name', label: 'Lodge/Hotel Name' },
    { key: 'property_phone', label: 'Hotel Phone' },
  ],
};

/**
 * Sanitizes and formats a mobile number for standard WhatsApp click-to-chat.
 * Output is pure digits including the country code, e.g. "919876543210".
 * Returns null if the number is invalid or missing.
 */
export const formatWhatsAppMobile = (mobile, defaultCountryCode = '+91') => {
  if (!mobile) return null;

  let raw = String(mobile).trim();
  if (!raw) return null;

  // Clean country code prefix
  let cleanCountry = String(defaultCountryCode || '+91').replace(/[^0-9]/g, '');
  if (!cleanCountry) cleanCountry = '91';

  // If starts with +, strip + and check if already has country code
  if (raw.startsWith('+')) {
    const digitsOnly = raw.replace(/[^0-9]/g, '');
    if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
      return digitsOnly;
    }
    return null;
  }

  // Remove all non-digits
  let digits = raw.replace(/[^0-9]/g, '');

  // Strip leading zeroes (e.g. 09876543210 -> 9876543210)
  while (digits.startsWith('0') && digits.length > 10) {
    digits = digits.substring(1);
  }
  if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.substring(1);
  }

  // If already starts with the country code and has full length (e.g. 91 + 10 digits = 12)
  if (digits.startsWith(cleanCountry) && digits.length === (cleanCountry.length + 10)) {
    return digits;
  }

  // If standard 10-digit number
  if (digits.length === 10) {
    return `${cleanCountry}${digits}`;
  }

  // If length is between 11 and 15, assume it already includes a country code
  if (digits.length >= 11 && digits.length <= 15) {
    return digits;
  }

  return null;
};

/**
 * Validates a message template for unsupported variable keys.
 * Returns an array of invalid variable names found (without curly braces).
 */
export const validateTemplate = (template, allowedVariables = []) => {
  if (!template) return [];
  const allowedSet = new Set(allowedVariables.map((v) => (typeof v === 'string' ? v : v.key)));
  const matches = template.match(/\{\{([a-zA-Z0-9_]+)\}\}/g) || [];
  const invalid = [];

  matches.forEach((m) => {
    const key = m.replace(/[{}]/g, '').trim();
    if (!allowedSet.has(key) && !invalid.includes(key)) {
      invalid.push(key);
    }
  });

  return invalid;
};

/**
 * Replaces {{variable}} placeholders with real data values.
 * Handles missing values gracefully, replacing null/undefined with empty strings or clean fallbacks.
 * Applies business formatting rules for zero balances and unassigned rooms.
 */
export const interpolateTemplate = (template, data = {}, eventType = '') => {
  if (!template) return '';

  const cleanData = { ...data };

  // Room fallback: If not assigned or empty, use "To be Assigned"
  if (!cleanData.room_number || cleanData.room_number === 'Unassigned' || cleanData.room_number === 'N/A') {
    if (eventType === 'BOOKING') {
      cleanData.room_number = 'To be Assigned';
    }
  }

  let result = template.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (match, key) => {
    const val = cleanData[key];
    if (val === null || val === undefined) {
      return '';
    }
    return String(val);
  });

  // Business Rule: For Payment, if balance is 0 or zero due, replace "Balance Due: ₹0" with "Payment Completed: Fully Paid"
  if (eventType === 'PAYMENT') {
    const numBalance = parseFloat(String(cleanData.balance_amount || '0').replace(/[^0-9.-]/g, ''));
    if (!isNaN(numBalance) && numBalance <= 0) {
      result = result.replace(/Balance Due:\s*₹?0(\.00)?/gi, 'Payment Completed: Fully Paid');
      result = result.replace(/Balance:\s*₹?0(\.00)?/gi, 'Payment Completed: Fully Paid');
    }
  }

  // Business Rule: For Check-Out, if fully paid, show "Payment Status: Fully Paid"
  if (eventType === 'CHECK_OUT') {
    const numBalance = parseFloat(String(cleanData.balance_amount || '0').replace(/[^0-9.-]/g, ''));
    if (!isNaN(numBalance) && numBalance <= 0) {
      result = result.replace(/Balance Due:\s*₹?0(\.00)?/gi, 'Payment Status: Fully Paid');
      result = result.replace(/Balance:\s*₹?0(\.00)?/gi, 'Payment Status: Fully Paid');
    }
  }

  // Business Rule: For Extra Charge, if balance is 0 or less, format as "Current Balance: Fully Paid"
  if (eventType === 'EXTRA_CHARGE') {
    const numBalance = parseFloat(String(cleanData.balance_amount || '0').replace(/[^0-9.-]/g, ''));
    if (!isNaN(numBalance) && numBalance <= 0) {
      result = result.replace(/Current Balance Due:\s*₹?0(\.00)?/gi, 'Current Balance: Fully Paid');
      result = result.replace(/Balance Due:\s*₹?0(\.00)?/gi, 'Current Balance: Fully Paid');
      result = result.replace(/Balance:\s*₹?0(\.00)?/gi, 'Current Balance: Fully Paid');
    }
  }

  return result;
};

/**
 * Generates sample data for live preview in the Settings page.
 */
export const getSamplePreviewData = (eventType, settings = {}) => {
  const lodgeName = settings?.lodge_name || 'ABC Lodge';
  const lodgePhone = settings?.phone || '+91 98765 43210';

  switch (eventType) {
    case 'BOOKING':
      return {
        guest_name: 'Rahul Patil',
        booking_number: 'BK-20260924-001',
        room_number: '102',
        check_in_date: '28 Sep 2026',
        check_in_time: '11:00 AM',
        check_out_date: '30 Sep 2026',
        check_out_time: '11:00 AM',
        guest_count: '2',
        number_of_nights: '2',
        booking_amount: '2,400',
        advance_paid: '500',
        balance_amount: '1,900',
        property_name: lodgeName,
        property_phone: lodgePhone,
      };
    case 'CHECK_IN':
      return {
        guest_name: 'Rahul Patil',
        booking_number: 'BK-20260924-001',
        room_number: '102',
        check_in_date: '28 Sep 2026',
        check_in_time: '11:00 AM',
        check_out_date: '30 Sep 2026',
        check_out_time: '11:00 AM',
        guest_count: '2',
        number_of_nights: '2',
        amount_paid: '1,500',
        balance_amount: '700',
        property_name: lodgeName,
        property_phone: lodgePhone,
      };
    case 'PAYMENT':
      return {
        guest_name: 'Rahul Patil',
        booking_number: 'BK-20260924-001',
        room_number: '102',
        payment_amount: '1,500',
        total_paid: '2,000',
        balance_amount: '0',
        payment_date: '28 Sep 2026',
        payment_method: 'UPI / GPay',
        property_name: lodgeName,
        property_phone: lodgePhone,
      };
    case 'CHECK_OUT':
      return {
        guest_name: 'Rahul Patil',
        booking_number: 'BK-20260924-001',
        room_number: '102',
        check_in_date: '28 Sep 2026',
        check_out_date: '30 Sep 2026',
        total_nights: '2',
        room_charges: '2,000',
        extra_charges: '200',
        discount: '0',
        tax: '0',
        grand_total: '2,200',
        total_paid: '2,200',
        balance_amount: '0',
        payment_status: 'Fully Paid',
        property_name: lodgeName,
        property_phone: lodgePhone,
      };
    case 'CANCELLATION':
      return {
        guest_name: 'Rahul Patil',
        booking_number: 'BK-20260924-001',
        room_number: '102',
        check_in_date: '28 Sep 2026',
        check_out_date: '30 Sep 2026',
        advance_paid: '500',
        property_name: lodgeName,
        property_phone: lodgePhone,
      };
    case 'EXTRA_CHARGE':
      return {
        guest_name: 'Rahul Patil',
        booking_number: 'BK-20260924-001',
        room_number: '102',
        charge_description: 'Laundry Service',
        charge_amount: '350',
        total_extra_charges: '350',
        grand_total: '2,750',
        total_paid: '500',
        balance_amount: '2,250',
        property_name: lodgeName,
        property_phone: lodgePhone,
      };
    default:
      return {};
  }
};

/**
 * Checks if a WhatsApp button should be rendered for an event.
 * Must strictly satisfy:
 * 1. Master WhatsApp setting = ON
 * 2. Event-specific setting = ON
 * 3. Customer has a valid mobile number
 */
export const isWhatsAppEnabledForEvent = (settings, eventType, customerMobile) => {
  // If settings explicitly disables master whatsapp toggle, return false
  if (settings && settings.whatsapp_enabled === false) return false;

  if (settings) {
    switch (eventType) {
      case 'BOOKING':
        if (settings.whatsapp_booking_enabled === false) return false;
        break;
      case 'CHECK_IN':
        if (settings.whatsapp_checkin_enabled === false) return false;
        break;
      case 'PAYMENT':
        if (settings.whatsapp_payment_enabled === false) return false;
        break;
      case 'CHECK_OUT':
        if (settings.whatsapp_checkout_enabled === false) return false;
        break;
      case 'CANCELLATION':
        if (settings.whatsapp_cancellation_enabled === false) return false;
        break;
      case 'EXTRA_CHARGE':
        if (settings.whatsapp_extra_charge_enabled === false) return false;
        break;
      default:
        break;
    }
  }

  const validMobile = formatWhatsAppMobile(customerMobile, settings?.whatsapp_default_country_code || '+91');
  return Boolean(validMobile);
};

// Global click lock to prevent duplicate clicks / double submissions
let lastClickTimestamp = 0;

const VALID_WHATSAPP_MODES = ['universal', 'web', 'app_autoclose', 'app_direct', 'app'];

/**
 * Builds WhatsApp URLs for various opening modes:
 * - 'universal': https://wa.me (standard official universal link - works across all devices)
 * - 'web': https://web.whatsapp.com/send (direct WhatsApp Web in browser)
 * - 'app_autoclose': Dedicated bridge tab that launches WhatsApp App and auto-closes in 2s
 * - 'app_direct': whatsapp://send direct protocol (no tab opened)
 */
export const buildWhatsAppUrl = ({
  mobile,
  message = '',
  mode = 'universal',
  defaultCountryCode = '+91',
  closeDelay = 2,
  autoClose = true,
}) => {
  const targetMobile = formatWhatsAppMobile(mobile, defaultCountryCode);
  if (!targetMobile) return null;

  const encodedMessage = encodeURIComponent(message || '');
  const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  switch (mode) {
    case 'web':
      return `https://web.whatsapp.com/send?phone=${targetMobile}&text=${encodedMessage}`;
    case 'app_direct':
    case 'app':
      return `whatsapp://send?phone=${targetMobile}&text=${encodedMessage}`;
    case 'app_autoclose':
      return `${cleanBase}whatsapp-bridge.html?phone=${targetMobile}&text=${encodedMessage}&delay=${closeDelay}&autoclose=${autoClose ? '1' : '0'}`;
    case 'universal':
    default:
      return `https://wa.me/${targetMobile}?text=${encodedMessage}`;
  }
};

/**
 * Retrieves the preferred WhatsApp opening mode from local workstation storage or settings.
 * Defaults to 'universal' (wa.me) for maximum reliability across desktop, tablet, and mobile.
 */
export const getPreferredWhatsAppMode = (settings = null) => {
  if (settings?.whatsapp_open_mode && VALID_WHATSAPP_MODES.includes(settings.whatsapp_open_mode)) {
    return settings.whatsapp_open_mode;
  }
  try {
    const local = localStorage.getItem('lms_whatsapp_open_mode');
    if (local && VALID_WHATSAPP_MODES.includes(local)) return local;
  } catch {}
  return 'universal';
};

/**
 * Persists the preferred WhatsApp opening mode locally on this workstation.
 */
export const setPreferredWhatsAppMode = (mode) => {
  try {
    if (VALID_WHATSAPP_MODES.includes(mode)) {
      localStorage.setItem('lms_whatsapp_open_mode', mode);
      return true;
    }
  } catch {}
  return false;
};

/**
 * Copies formatted text to system clipboard across all modern and legacy browsers.
 */
export const copyTextToClipboard = async (text) => {
  if (!text) return false;

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    console.warn('navigator.clipboard failed, attempting textarea fallback:', e);
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '0';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Fallback clipboard copy failed:', err);
    return false;
  }
};

/**
 * Standard WhatsApp click-to-chat opener.
 * Generates the deep-link URL and opens WhatsApp strictly in a new tab/app.
 * NEVER disturbs, reloads, or navigates the current LMS page.
 * Asynchronously logs the prepared message without blocking the UI.
 */
export const openWhatsApp = ({
  mobile,
  message,
  defaultCountryCode = '+91',
  eventType = '',
  bookingId = null,
  customerId = null,
  recipientName = '',
  settings = null,
  mode = null,
}) => {
  const now = Date.now();
  if (now - lastClickTimestamp < 1500) {
    console.warn('Prevented duplicate WhatsApp button click');
    return { success: false, reason: 'DEBOUNCED' };
  }
  lastClickTimestamp = now;

  const targetMobile = formatWhatsAppMobile(mobile, defaultCountryCode);
  if (!targetMobile) {
    console.warn('Cannot open WhatsApp: Invalid or missing customer mobile number.');
    return { success: false, error: 'INVALID_MOBILE' };
  }

  const selectedMode = mode || getPreferredWhatsAppMode(settings);
  const url = buildWhatsAppUrl({
    mobile: targetMobile,
    message,
    mode: selectedMode,
    defaultCountryCode,
  });

  // Guarantee: ALWAYS open in a new tab/window, never in the current LMS tab/page
  try {
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      // Fallback via anchor element with target="_blank"
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (err) {
    console.error('Error opening WhatsApp in new tab:', err);
  }

  // Non-blocking asynchronous message audit log to backend
  try {
    logWhatsAppMessageApi({
      event_type: eventType || 'MANUAL',
      mobile: targetMobile,
      recipient_name: recipientName || '',
      message: message || '',
      status: 'Prepared / Opened',
      booking: bookingId || null,
      customer: customerId || null,
    }).catch((logErr) => {
      // Never let logging error affect the user
      console.warn('Non-blocking WhatsApp audit log warning:', logErr);
    });
  } catch (err) {
    console.warn('WhatsApp log dispatch ignored:', err);
  }

  return { success: true, url, targetMobile };
};
