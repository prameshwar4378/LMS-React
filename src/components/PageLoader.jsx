import React from 'react';
import './PageLoader.css';

const PageLoader = ({ loading = true, message = "Loading Lodge System...", fullScreen = true }) => {
  if (!loading) return null;

  return (
    <div className={fullScreen ? "page-loader-overlay" : "page-loader-inline"}>
      <div className="loader-container">
        <div className="loader-ring-outer"></div>
        <div className="loader-ring-inner"></div>
        <div className="loader-emblem">
          <i className="bi bi-buildings-fill"></i>
        </div>
      </div>

      <div className="loader-text">{message}</div>

      <div className="loader-dots">
        <div className="loader-dot"></div>
        <div className="loader-dot"></div>
        <div className="loader-dot"></div>
      </div>
    </div>
  );
};

export default PageLoader;
