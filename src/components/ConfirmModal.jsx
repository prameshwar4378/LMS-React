import React from 'react';

const ConfirmModal = ({
  show,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Yes, Delete',
  cancelText = 'Cancel',
  confirmVariant = 'danger',
  loading = false,
  onClose,
  onConfirm,
}) => {
  if (!show) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '420px' }}>
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '14px', overflow: 'hidden' }}>
          <div className="modal-body text-center p-4">
            <div className="mb-3">
              <div
                className={`d-inline-flex align-items-center justify-content-center bg-${confirmVariant}-subtle text-${confirmVariant} rounded-circle`}
                style={{ width: '64px', height: '64px' }}
              >
                <i className={`bi ${confirmVariant === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill'} fs-2`}></i>
              </div>
            </div>

            <h5 className="fw-bold text-dark mb-2">{title}</h5>
            <p className="text-muted small mb-4">{message}</p>

            <div className="d-flex justify-content-center gap-2">
              <button
                type="button"
                className="btn btn-light px-4 fw-semibold border"
                onClick={onClose}
                disabled={loading}
              >
                {cancelText}
              </button>
              <button
                type="button"
                className={`btn btn-${confirmVariant} px-4 fw-bold shadow-sm`}
                onClick={onConfirm}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Processing...
                  </>
                ) : (
                  confirmText
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
