import React from 'react';
import { HashRouter, Switch, Route, Redirect } from 'react-router-dom';
import LegacyNavigation from './components/LegacyNavigation';
import LegacyHome from './pages/LegacyHome';
import LegacyCRM from './pages/LegacyCRM';
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
      </div>
    </HashRouter>
  );
};

export default LegacyApp;
