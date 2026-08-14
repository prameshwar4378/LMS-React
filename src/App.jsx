import React, { Component } from 'react';
import { HashRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LoadingProvider } from './context/LoadingContext';
import { NotificationProvider } from './context/NotificationContext';
import AppRoutes from './routes/AppRoutes';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('LMS App Crash ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="d-flex align-items-center justify-content-center vh-100 bg-light p-4">
          <div className="card border-0 shadow-lg p-4 text-center rounded-4" style={{ maxWidth: '480px' }}>
            <div className="p-3 bg-danger-subtle text-danger rounded-circle d-inline-flex mb-3">
              <i className="bi bi-exclamation-triangle-fill fs-1"></i>
            </div>
            <h4 className="fw-bold text-dark mb-2">Application Notice</h4>
            <p className="text-secondary small mb-4">
              An unexpected interface error occurred. Please reload to refresh your active session.
            </p>
            <button
              className="btn btn-primary fw-bold py-2.5 rounded-3 shadow-sm"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.hash = '#/dashboard';
                window.location.reload();
              }}
            >
              <i className="bi bi-arrow-clockwise me-2"></i> Reload Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <AuthProvider>
          <LoadingProvider>
            <NotificationProvider>
              <AppRoutes />
            </NotificationProvider>
          </LoadingProvider>
        </AuthProvider>
      </HashRouter>
    </ErrorBoundary>
  );
}

export default App;
