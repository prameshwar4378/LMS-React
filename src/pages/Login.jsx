import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid username or password.');
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-dark" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
      <div className="card border-0 shadow-lg p-4" style={{ width: '100%', maxWidth: '420px', borderRadius: '16px' }}>
        <div className="card-body">
          <div className="text-center mb-4">
            <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3 shadow" style={{ width: '60px', height: '60px' }}>
              <i className="bi bi-building-check fs-2"></i>
            </div>
            <h3 className="fw-bold text-dark m-0">Lodge Management</h3>
            <p className="text-muted small mt-1">Staff Portal Login</p>
          </div>

          {error && <div className="alert alert-danger py-2 small">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Username</label>
              <div className="input-group">
                <span className="input-group-text bg-light"><i className="bi bi-person text-muted"></i></span>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label fw-semibold">Password</label>
              <div className="input-group">
                <span className="input-group-text bg-light"><i className="bi bi-lock text-muted"></i></span>
                <input
                  type="password"
                  className="form-control form-control-lg"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg w-100 fw-bold shadow-sm" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Signing In...
                </>
              ) : (
                'Sign In to LMS'
              )}
            </button>
          </form>

          <div className="mt-4 pt-3 border-top text-center text-muted small">
            <div><strong>Default Credentials:</strong></div>
            <div className="mt-1">
              Admin: <code>admin</code> / <code>admin123</code><br />
              Reception: <code>receptionist</code> / <code>receptionist123</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
