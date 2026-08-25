import React, { useEffect } from 'react';
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom';
import LegacyNavigation from './components/LegacyNavigation';
import LegacyHome from './pages/LegacyHome';
import LegacyCRM from './pages/LegacyCRM';
import { databaseService } from '../src/services/database';
import './styles/legacy-global.css';

const logDiag = (msg: string) => {
  if (typeof document !== 'undefined') {
    const el = document.getElementById('diagnostic-log');
    if (el) {
      const div = document.createElement('div');
      div.textContent = msg;
      el.appendChild(div);
    }
  }
};

logDiag('[3/4] JS bundle loaded');

const LegacyApp: React.FC = () => {
  useEffect(() => {
    logDiag('[4/4] React mounted');
    const timer = setTimeout(() => {
      databaseService.initialize();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <BrowserRouter basename="/legacy">
      <div className="legacy-app-layout">
        <header className="legacy-app-header">
          <LegacyNavigation />
        </header>
        <main className="legacy-app-body">
          <Switch>
            <Route exact path="/home" component={LegacyHome} />
            <Route exact path="/crm" component={LegacyCRM} />
            <Route exact path="/">
              <Redirect to="/home" />
            </Route>
          </Switch>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default LegacyApp;
