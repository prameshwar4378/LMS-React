import React from 'react';
import { AlertTriangle, CheckCircle2, XCircle, Info, HelpCircle } from 'lucide-react';

const NotificationModal = ({
  show,
  type = 'error', // 'error' | 'success' | 'warning' | 'info' | 'confirm'
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  confirmVariant,
  onConfirm,
  onCancel,
  onClose,
}) => {
  if (!show) return null;

  // Determine icon & styling based on status type
  let IconComponent = XCircle;
  let iconBgStyle = { backgroundColor: '#fef2f2', color: '#ef4444', borderColor: '#fecaca' };
  let btnClass = 'btn-danger';
  let defaultTitle = 'Error';

  if (type === 'success') {
    IconComponent = CheckCircle2;
    iconBgStyle = { backgroundColor: '#ecfdf5', color: '#059669', borderColor: '#a7f3d0' };
    btnClass = 'btn-success';
    defaultTitle = 'Success!';
  } else if (type === 'warning') {
    IconComponent = AlertTriangle;
    iconBgStyle = { backgroundColor: '#fffbeb', color: '#d97706', borderColor: '#fde68a' };
    btnClass = 'btn-warning text-dark';
    defaultTitle = 'Warning!';
  } else if (type === 'info') {
    IconComponent = Info;
    iconBgStyle = { backgroundColor: '#eff6ff', color: '#2563eb', borderColor: '#bfdbfe' };
    btnClass = 'btn-primary';
    defaultTitle = 'Notice';
  } else if (type === 'confirm') {
    IconComponent = HelpCircle;
    iconBgStyle = { backgroundColor: '#eff6ff', color: '#3b82f6', borderColor: '#bfdbfe' };
    btnClass = confirmVariant ? `btn-${confirmVariant}` : 'btn-primary';
    defaultTitle = 'Confirm Action';
  } else if (type === 'error') {
    IconComponent = XCircle;
    iconBgStyle = { backgroundColor: '#fef2f2', color: '#ef4444', borderColor: '#fecaca' };
    btnClass = 'btn-danger';
    defaultTitle = 'Action Failed';
  }

  const modalTitle = title || defaultTitle;

  return (
    <div
      className="modal fade show d-block modal-backdrop-animated"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1200 }}
      tabIndex="-1"
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-dialog-centered modal-dialog-animated"
        style={{ maxWidth: '470px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="modal-content border-0 shadow-lg text-center p-4 modal-content-animated"
          style={{ borderRadius: '22px', backgroundColor: '#ffffff' }}
        >
          {/* Status Icon Badge */}
          <div className="d-flex justify-content-center mb-3 mt-1">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center border modal-icon-animated"
              style={{
                width: '76px',
                height: '76px',
                borderWidth: '2px',
                ...iconBgStyle
              }}
            >
              <IconComponent size={42} strokeWidth={2.2} />
            </div>
          </div>

          {/* Dynamic Title */}
          <h4 className="fw-bold text-dark mb-2" style={{ letterSpacing: '-0.02em', fontSize: '1.3rem' }}>
            {modalTitle}
          </h4>

          {/* Dynamic Message */}
          <p className="text-secondary mb-4 px-2" style={{ fontSize: '0.95rem', lineHeight: '1.5', color: '#64748b' }}>
            {message}
          </p>

          {/* Action Buttons */}
          <div className="d-flex justify-content-center gap-2.5">
            {type === 'confirm' ? (
              <>
                <button
                  type="button"
                  className="btn btn-light border fw-semibold px-3 py-2 rounded-3 flex-fill d-inline-flex align-items-center justify-content-center text-center"
                  style={{ minHeight: '46px', height: 'auto', fontSize: '0.92rem', lineHeight: '1.3' }}
                  onClick={onCancel || onClose}
                >
                  <span>{cancelText}</span>
                </button>
                <button
                  type="button"
                  className={`btn ${btnClass} fw-bold px-3 py-2 rounded-3 flex-fill shadow-sm d-inline-flex align-items-center justify-content-center text-center`}
                  style={{ minHeight: '46px', height: 'auto', fontSize: '0.92rem', lineHeight: '1.3' }}
                  onClick={onConfirm}
                >
                  <span>{confirmText}</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                className={`btn ${btnClass} fw-bold px-5 py-2 rounded-3 shadow-sm d-inline-flex align-items-center justify-content-center text-center`}
                style={{ minWidth: '140px', minHeight: '46px', height: 'auto', fontSize: '0.92rem', lineHeight: '1.3' }}
                onClick={onClose}
              >
                <span>{confirmText}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
