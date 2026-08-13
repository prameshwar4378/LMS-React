import React from 'react';
import NotificationModal from './NotificationModal';

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
  return (
    <NotificationModal
      show={show}
      type="confirm"
      title={title}
      message={message}
      confirmText={loading ? 'Processing...' : confirmText}
      cancelText={cancelText}
      confirmVariant={confirmVariant}
      onConfirm={onConfirm}
      onCancel={onClose}
      onClose={onClose}
    />
  );
};

export default ConfirmModal;
