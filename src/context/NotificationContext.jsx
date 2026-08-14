import React, { createContext, useContext, useState, useEffect } from 'react';
import NotificationModal from '../components/NotificationModal';
import { CheckCircle2, X } from 'lucide-react';

const NotificationContext = createContext();

export const cleanErrorMessage = (err, defaultMsg = 'An unexpected error occurred.') => {
  if (!err) return defaultMsg;
  if (typeof err === 'string') return err;
  
  if (err.response && err.response.data) {
    const d = err.response.data;
    if (typeof d === 'string') return d;
    
    // Check nested errors object
    if (d.errors && typeof d.errors === 'object') {
      const keys = Object.keys(d.errors);
      if (keys.length > 0) {
        const firstKey = keys[0];
        const val = d.errors[firstKey];
        const valStr = Array.isArray(val) ? val[0] : String(val);
        const formattedKey = firstKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        return `${formattedKey}: ${valStr}`;
      }
    }
    
    if (d.message) return d.message;
    if (d.detail) return d.detail;
    if (d.error) return d.error;

    if (typeof d === 'object') {
      const keys = Object.keys(d).filter(k => k !== 'success');
      if (keys.length > 0) {
        const firstKey = keys[0];
        const val = d[firstKey];
        const valStr = Array.isArray(val) ? val[0] : String(val);
        const formattedKey = firstKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        return `${formattedKey}: ${valStr}`;
      }
    }
  }

  if (err.message) return err.message;
  return defaultMsg;
};

export const NotificationProvider = ({ children }) => {
  // Centered Modal State (Used ONLY for Warning, Error, Info, and Confirmations)
  const [modalState, setModalState] = useState({
    show: false,
    type: 'error',
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Cancel',
    confirmVariant: 'danger',
    onConfirm: null,
    onCancel: null,
  });

  // Top-Right Toast Notifications State (Used ONLY for Success messages)
  const [toasts, setToasts] = useState([]);

  const closeModal = () => {
    setModalState(prev => ({ ...prev, show: false }));
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // SUCCESS → Top Right Toast Message
  const showSuccess = (msg, customTitle = 'Success!') => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      title: customTitle,
      message: msg || 'Operation completed successfully.',
    };
    setToasts(prev => [...prev, newToast]);

    // Auto dismiss after 3.5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 3500);
  };

  // ERROR → Centered Modal Dialogue
  const showError = (msg, customTitle = 'Action Failed') => {
    const text = typeof msg === 'object' ? cleanErrorMessage(msg) : msg;
    setModalState({
      show: true,
      type: 'error',
      title: customTitle,
      message: text || 'An error occurred while processing your request.',
      confirmText: 'OK',
      onConfirm: closeModal,
      onCancel: closeModal,
    });
  };

  // WARNING → Centered Modal Dialogue
  const showWarning = (msg, customTitle = 'Attention Required') => {
    const text = typeof msg === 'object' ? cleanErrorMessage(msg) : msg;
    setModalState({
      show: true,
      type: 'warning',
      title: customTitle,
      message: text || 'Please verify details before proceeding.',
      confirmText: 'Got It',
      onConfirm: closeModal,
      onCancel: closeModal,
    });
  };

  // INFO → Centered Modal Dialogue
  const showInfo = (msg, customTitle = 'Information') => {
    setModalState({
      show: true,
      type: 'info',
      title: customTitle,
      message: msg,
      confirmText: 'OK',
      onConfirm: closeModal,
      onCancel: closeModal,
    });
  };

  // CONFIRMATION → Centered Modal Dialogue
  const showConfirm = ({
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Yes, Proceed',
    cancelText = 'Cancel',
    confirmVariant = 'danger',
    onConfirm,
    onCancel,
  }) => {
    setModalState({
      show: true,
      type: 'confirm',
      title,
      message,
      confirmText,
      cancelText,
      confirmVariant,
      onConfirm: () => {
        closeModal();
        if (onConfirm) onConfirm();
      },
      onCancel: () => {
        closeModal();
        if (onCancel) onCancel();
      },
    });
  };

  return (
    <NotificationContext.Provider
      value={{
        showError,
        showSuccess,
        showWarning,
        showInfo,
        showConfirm,
        cleanErrorMessage,
        closeModal,
      }}
    >
      {children}

      {/* TOP-RIGHT TOAST CONTAINER (For Success Notifications) */}
      <div className="toast-container-top-right">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="toast-item-animated bg-white rounded-3 overflow-hidden border-start border-4 border-success p-3 position-relative"
          >
            <div className="d-flex align-items-start justify-content-between gap-3">
              <div className="d-flex align-items-center gap-2.5">
                <div className="p-1.5 bg-success-subtle text-success rounded-circle d-flex align-items-center justify-content-center">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <h6 className="fw-bold text-dark m-0 small">{toast.title}</h6>
                  <p className="text-secondary extra-small m-0 mt-0.5">{toast.message}</p>
                </div>
              </div>
              <button
                type="button"
                className="btn-close btn-close-xs text-muted shadow-none"
                onClick={() => removeToast(toast.id)}
                aria-label="Close"
              ></button>
            </div>
            <div className="toast-progress-bar position-absolute bottom-0 start-0"></div>
          </div>
        ))}
      </div>

      {/* CENTERED MODAL DIALOGUE (For Warning, Error, Info, & Confirmations) */}
      <NotificationModal
        show={modalState.show}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        confirmVariant={modalState.confirmVariant}
        onConfirm={modalState.onConfirm || closeModal}
        onCancel={modalState.onCancel || closeModal}
        onClose={closeModal}
      />
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
