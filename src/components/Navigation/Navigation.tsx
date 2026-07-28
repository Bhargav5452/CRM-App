import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { IonIcon } from '@ionic/react';
import { addCircleOutline, peopleOutline } from 'ionicons/icons';
import './Navigation.css';

const Navigation: React.FC = () => {
  const location = useLocation();

  const isHomeActive = location.pathname === '/home' || location.pathname === '/';
  const isCrmActive = location.pathname === '/crm';

  return (
    <div className="app-navbar-container">
      <div className="app-navbar-inner">
        <Link to="/home" className="app-brand">
          <div className="app-brand-badge">C</div>
          <span>Offline CRM</span>
        </Link>

        <div className="nav-links-group">
          <Link
            to="/home"
            className={`nav-link-item ${isHomeActive ? 'active' : ''}`}
          >
            <IonIcon icon={addCircleOutline} style={{ fontSize: 16 }} />
            <span>New Lead</span>
          </Link>

          <Link
            to="/crm"
            className={`nav-link-item ${isCrmActive ? 'active' : ''}`}
          >
            <IonIcon icon={peopleOutline} style={{ fontSize: 16 }} />
            <span>Leads CRM</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Navigation;
