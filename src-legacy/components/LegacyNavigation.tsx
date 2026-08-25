import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const LegacyNavigation: React.FC = () => {
  const location = useLocation();
  const isHomeActive = location.pathname === '/home' || location.pathname === '/';
  const isCrmActive = location.pathname === '/crm';

  return (
    <div className="app-navbar-container">
      <div className="app-navbar-inner">
        <Link to="/home" className="app-brand">
          <div className="app-brand-badge">C</div>
          <span>Lead CRM</span>
        </Link>

        <div className="nav-links-group">
          <Link to="/home" className={"nav-link-item" + (isHomeActive ? " active" : "")}>
            {/* Plus icon SVG */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="16"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            <span>New Lead</span>
          </Link>

          <Link to="/crm" className={"nav-link-item" + (isCrmActive ? " active" : "")}>
            {/* People icon SVG */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span>Leads CRM</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default React.memo(LegacyNavigation);
