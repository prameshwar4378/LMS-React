/**
 * Intelligently extracts, cleans, and deduplicates user-facing error messages
 * from Axios API response errors or JavaScript Error instances.
 *
 * Prevents duplicate messages (e.g. summary message repeating the field-level error).
 * Formats field-level errors gracefully when they add new information.
 *
 * @param {Error|Object|string} err - The error object caught in catch block
 * @param {string} defaultMsg - Fallback message if no meaningful error is found
 * @returns {string} Clean, non-repeating error message
 */
export const extractErrorMessage = (err, defaultMsg = 'An unexpected error occurred.') => {
  if (!err) return defaultMsg;
  if (typeof err === 'string') return err.trim() || defaultMsg;

  if (err.response && err.response.data) {
    const data = err.response.data;

    // Handle string data (HTML crash page or simple text)
    if (typeof data === 'string') {
      const trimmed = data.trim();
      if (trimmed.startsWith('<html') || trimmed.startsWith('<!DOCTYPE')) {
        return defaultMsg;
      }
      return trimmed || defaultMsg;
    }

    // Extract top-level summary message if present
    let summaryMsg = '';
    if (data.message && typeof data.message === 'string') {
      summaryMsg = data.message.trim();
    } else if (data.error && typeof data.error === 'string') {
      summaryMsg = data.error.trim();
    } else if (data.detail && typeof data.detail === 'string') {
      summaryMsg = data.detail.trim();
    }

    // Identify container for field-level errors
    let errorsSource = null;
    if (data.errors && typeof data.errors === 'object' && !Array.isArray(data.errors)) {
      errorsSource = data.errors;
    } else if (typeof data === 'object' && !Array.isArray(data)) {
      errorsSource = data;
    }

    const fieldDetails = [];
    const ignoredKeys = new Set(['success', 'message', 'error', 'detail', 'status_code', 'code']);

    if (errorsSource) {
      for (const [key, val] of Object.entries(errorsSource)) {
        if (ignoredKeys.has(key.toLowerCase())) continue;

        const valArray = Array.isArray(val) ? val : [val];
        for (const item of valArray) {
          let itemText = '';
          if (typeof item === 'string') {
            itemText = item.trim();
          } else if (typeof item === 'object' && item !== null) {
            itemText = item.message || item.detail || JSON.stringify(item);
          } else if (item != null) {
            itemText = String(item).trim();
          }

          if (!itemText) continue;

          // Normalize strings to compare and check for duplication
          const normSummary = summaryMsg.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
          const normItem = itemText.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();

          // If the summary message already contains this item's text (or vice versa),
          // they are expressing the exact same error. Avoid duplicate output!
          if (normSummary && (normSummary.includes(normItem) || normItem.includes(normSummary))) {
            if (normItem.length > normSummary.length) {
              summaryMsg = itemText;
            }
            continue;
          }

          // Format field key gracefully (e.g. check_in_date -> Check-In Date)
          const formatKey = (k) => {
            const map = {
              room: 'Room',
              customer: 'Guest',
              check_in_date: 'Check-In Date',
              check_in_time: 'Check-In Time',
              expected_checkout_date: 'Check-Out Date',
              expected_checkout_time: 'Check-Out Time',
              room_rate: 'Room Rate',
              advance_amount: 'Advance Amount',
              discount_value: 'Discount Value',
              status: 'Status',
              non_field_errors: '',
            };
            return map[k] !== undefined ? map[k] : k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
          };

          const friendlyKey = formatKey(key);
          if (friendlyKey) {
            fieldDetails.push(`${friendlyKey}: ${itemText}`);
          } else {
            fieldDetails.push(itemText);
          }
        }
      }
    }

    // Combine summary and unique field details cleanly
    if (summaryMsg && fieldDetails.length > 0) {
      return `${summaryMsg} (${fieldDetails.join(' | ')})`;
    }
    if (summaryMsg) {
      return summaryMsg;
    }
    if (fieldDetails.length > 0) {
      return fieldDetails.join(' | ');
    }
  }

  if (err.message && typeof err.message === 'string') {
    return err.message;
  }

  return defaultMsg;
};
