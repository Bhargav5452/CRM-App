import React, { useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { authService } from '../../services/auth';
import { ADMIN_USER_ID } from '../../services/formConfigService';

interface AdminAuthGateProps {
  session: Session | null;
  onAuthenticated: (session: Session) => void;
  children: React.ReactNode;
}

export const AdminAuthGate: React.FC<AdminAuthGateProps> = ({
  session,
  onAuthenticated,
  children,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. If not authenticated at all, display Admin Login Card
  if (!session) {
    const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email || !password) {
        setErrorMessage('Please enter your administrator email and password.');
        return;
      }

      setLoading(true);
      setErrorMessage('');

      const res = await authService.signIn(email, password);
      setLoading(false);

      if (res.success && res.session) {
        onAuthenticated(res.session);
      } else {
        setErrorMessage(
          res.error || 'Invalid administrator credentials. Access denied.'
        );
      }
    };

    return (
      <div className="admin-login-wrapper">
        <div className="admin-login-card">
          <div className="admin-login-header">
            <div className="admin-icon-container">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h2 className="admin-login-title">Administrator Access</h2>
            <p className="admin-login-subtitle">
              Sign in with your dedicated administrator credentials to access the Form Builder.
            </p>
          </div>

          {errorMessage && (
            <div className="admin-error-banner" role="alert">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="admin-login-form">
            <div className="form-field-group">
              <label htmlFor="admin_email" className="field-label">
                Admin Email
              </label>
              <input
                id="admin_email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="custom-input"
                autoComplete="username"
                required
              />
            </div>

            <div className="form-field-group">
              <label htmlFor="admin_password" className="field-label">
                Password
              </label>
              <div className="password-input-wrapper">
                <input
                  id="admin_password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  className="custom-input password-input"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="admin-submit-btn"
            >
              <span>{loading ? 'Verifying...' : 'Unlock Admin Dashboard'}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Check if the authenticated user matches the administrator UUID
  const isDefaultUnconfigured =
    ADMIN_USER_ID === '00000000-0000-0000-0000-000000000000';
  const isExactAdminUser =
    session.user.id === ADMIN_USER_ID ||
    (isDefaultUnconfigured && session.user.email?.includes('admin'));

  if (!isExactAdminUser) {
    return (
      <div className="admin-login-wrapper">
        <div className="admin-login-card">
          <div className="admin-login-header">
            <div
              className="admin-icon-container"
              style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <h2 className="admin-login-title">Access Denied (403)</h2>
            <p className="admin-login-subtitle">
              You are currently signed in as <strong>{session.user.email}</strong>.
              Regular CRM staff accounts do not possess administrative permissions.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
            <button
              type="button"
              className="btn-submit"
              onClick={() => {
                authService.signOut().then(() => window.location.reload());
              }}
            >
              Sign In with Administrator Account
            </button>
            <a
              href="#/crm"
              className="nav-link-item"
              style={{ justifyContent: 'center', textAlign: 'center' }}
            >
              Return to Leads CRM
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 3. User is authorized administrator
  return <>{children}</>;
};
