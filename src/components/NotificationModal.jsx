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
  let iconBgClass = 'bg-danger-subtle text-danger border-danger-subtle';
  let btnClass = 'btn-danger';
  let defaultTitle = 'Error';

  if (type === 'success') {
    IconComponent = CheckCircle2;
    iconBgClass = 'bg-success-subtle text-success border-success-subtle';
    btnClass = 'btn-success';
    defaultTitle = 'Success!';
  } else if (type === 'warning') {
    IconComponent = AlertTriangle;
    iconBgClass = 'bg-warning-subtle text-warning border-warning-subtle';
    btnClass = 'btn-warning text-dark';
    defaultTitle = 'Warning!';
  } else if (type === 'info') {
    IconComponent = Info;
    iconBgClass = 'bg-info-subtle text-info border-info-subtle';
    btnClass = 'btn-info text-white';
    defaultTitle = 'Notice';
  } else if (type === 'confirm') {
    IconComponent = HelpCircle;
    iconBgClass = 'bg-primary-subtle text-primary border-primary-subtle';
    btnClass = confirmVariant ? `btn-${confirmVariant}` : 'btn-primary';
    defaultTitle = 'Confirm Action';
  } else if (type === 'error') {
    IconComponent = XCircle;
    iconBgClass = 'bg-danger-subtle text-danger border-danger-subtle';
    btnClass = 'btn-danger';
    defaultTitle = 'Action Failed';
  }

  const modalTitle = title || defaultTitle;

  return (
    <div
      className="modal fade show d-block modal-backdrop-animated"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1070 }}
      tabIndex="-1"
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-dialog-centered modal-dialog-animated"
        style={{ maxWidth: '440px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="modal-content border-0 shadow-lg text-center p-4 modal-content-animated"
          style={{ borderRadius: '20px', backgroundColor: '#ffffff' }}
        >
          {/* Status Icon Badge */}
          <div className="d-flex justify-content-center mb-3">
            <div
              className={`rounded-circle d-flex align-items-center justify-content-center border modal-icon-animated ${iconBgClass}`}
              style={{ width: '76px', height: '76px', borderWidth: '2px' }}
            >
              <IconComponent size={40} strokeWidth={2.2} />
            </div>
          </div>

          {/* Title */}
          <h4 className="fw-bold text-dark mb-2" style={{ letterSpacing: '-0.02em' }}>
            {modalTitle}
          </h4>

          {/* Short & Meaningful Message */}
          <p className="text-secondary mb-4 px-2" style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>
            {message}
          </p>

          {/* Action Buttons */}
          <div className="d-flex justify-content-center gap-3">
            {type === 'confirm' ? (
              <>
                <button
                  type="button"
                  className="btn btn-light border fw-semibold px-4 py-2.5 rounded-3 w-50"
                  onClick={onCancel || onClose}
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  className={`btn ${btnClass} fw-bold px-4 py-2.5 rounded-3 w-50 shadow-sm`}
                  onClick={onConfirm}
                >
                  {confirmText}
                </button>
              </>
            ) : (
              <button
                type="button"
                className={`btn ${btnClass} fw-bold px-5 py-2.5 rounded-3 shadow-sm`}
                style={{ minWidth: '130px' }}
                onClick={onClose}
              >
                {confirmText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
