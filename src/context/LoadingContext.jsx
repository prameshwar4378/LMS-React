import React, { createContext, useContext, useState } from 'react';
import PageLoader from '../components/PageLoader';

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('Loading Lodge System...');

  const showLoader = (msg = 'Loading Lodge System...') => {
    setMessage(msg);
    setLoading(true);
  };

  const hideLoader = () => {
    setLoading(false);
  };

  return (
    <LoadingContext.Provider value={{ loading, showLoader, hideLoader }}>
      {children}
      <PageLoader loading={loading} message={message} fullScreen={true} />
    </LoadingContext.Provider>
  );
};

export const useLoading = () => useContext(LoadingContext);
