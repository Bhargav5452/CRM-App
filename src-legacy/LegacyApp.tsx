import React, { useEffect } from 'react';
import { HashRouter, Switch, Route, Redirect } from 'react-router-dom';
import LegacyNavigation from './components/LegacyNavigation';
import LegacyHome from './pages/LegacyHome';
import LegacyCRM from './pages/LegacyCRM';
import LegacyDiagnostics from './components/LegacyDiagnostics';
import './styles/legacy-global.css';

const LegacyApp: React.FC = () => {
  return (
    <HashRouter>
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
            <Redirect to="/home" />
          </Switch>
        </main>
        <LegacyDiagnostics />
      </div>
    </HashRouter>
  );
};

export default LegacyApp;
