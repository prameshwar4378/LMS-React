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

// Interactive Toast Item with Hover-to-Pause functionality
const ToastItem = ({ toast, onRemove }) => {
  const TOTAL_TIME = 4000;
  const [remainingTime, setRemainingTime] = useState(TOTAL_TIME);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 100) {
          clearInterval(interval);
          onRemove(toast.id);
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPaused, toast.id, onRemove]);

  return (
    <div
      className="toast-item-animated bg-white rounded-3 overflow-hidden position-relative p-3 shadow-lg"
      style={{
        border: '1px solid #e2e8f0',
        borderLeft: '4px solid #10b981',
        boxShadow: '0 14px 30px -6px rgba(15, 23, 42, 0.16), 0 4px 10px -2px rgba(15, 23, 42, 0.06)',
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="d-flex align-items-start justify-content-between gap-3">
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
            style={{
              width: '38px',
              height: '38px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
            }}
          >
            <CheckCircle2 size={20} style={{ color: '#059669' }} />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h6 className="fw-bold text-dark m-0" style={{ fontSize: '0.875rem', letterSpacing: '-0.01em' }}>
                {toast.title}
              </h6>
              {isPaused && (
                <span className="badge bg-light text-muted border px-1.5 py-0.5 extra-small font-normal">
                  Paused
                </span>
              )}
            </div>
            <p className="text-secondary extra-small m-0 mt-0.5" style={{ lineHeight: 1.35 }}>
              {toast.message}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn-close btn-close-xs text-muted shadow-none opacity-75"
          onClick={() => onRemove(toast.id)}
          aria-label="Close"
        ></button>
      </div>

      {/* PAUSABLE SMOOTH PROGRESS BAR */}
      <div
        className="position-absolute bottom-0 start-0"
        style={{
          height: '3px',
          width: `${(remainingTime / TOTAL_TIME) * 100}%`,
          backgroundColor: '#10b981',
          transition: isPaused ? 'none' : 'width 0.1s linear',
        }}
      />
    </div>
  );
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

  // SUCCESS → Top Right Toast Message with Hover Pause
  const showSuccess = (msg, customTitle = 'Success!') => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      title: customTitle,
      message: msg || 'Operation completed successfully.',
    };
    setToasts(prev => [...prev, newToast]);
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
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
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
