import React, { createContext, useContext, useState } from 'react';
import NotificationModal from '../components/NotificationModal';

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

  const closeModal = () => {
    setModalState(prev => ({ ...prev, show: false }));
  };

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

  const showSuccess = (msg, customTitle = 'Success!') => {
    setModalState({
      show: true,
      type: 'success',
      title: customTitle,
      message: msg || 'Operation completed successfully.',
      confirmText: 'OK',
      onConfirm: closeModal,
      onCancel: closeModal,
    });
  };

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
