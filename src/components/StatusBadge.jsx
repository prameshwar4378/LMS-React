import React from 'react';

const StatusBadge = ({ status }) => {
  const getBadgeClass = (s) => {
    switch (s) {
      case 'AVAILABLE':
      case 'COMPLETED':
        return 'badge-available';
      case 'RESERVED':
      case 'CONFIRMED':
        return 'badge-reserved';
      case 'OCCUPIED':
      case 'CHECKED_IN':
        return 'badge-occupied';
      case 'CLEANING':
      case 'PENDING':
        return 'badge-cleaning';
      case 'MAINTENANCE':
      case 'CANCELLED':
      case 'NO_SHOW':
        return 'badge-maintenance';
      default:
        return 'bg-secondary';
    }
  };

  return (
    <span className={`badge px-2.5 py-1.5 rounded-pill ${getBadgeClass(status)}`}>
      {status ? status.replace('_', ' ') : 'N/A'}
    </span>
  );
};

export default StatusBadge;
