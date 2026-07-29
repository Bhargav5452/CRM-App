import React, { useEffect, Suspense, lazy } from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import Navigation from './components/Navigation/Navigation';
import Home from './pages/Home/Home';
import { databaseService } from './services/database';

/* Core CSS required for Ionic components */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Theme variables */
import './theme/variables.css';

// Route-level Code-Splitting: CRM page loaded on demand so initial bundle stays lightweight
const CRM = lazy(() => import('./pages/CRM/CRM'));

if (window.__mark) {
  window.__mark('ionic_setup_start');
}
setupIonicReact();
if (window.__mark) {
  window.__mark('ionic_setup_done');
}

declare global {
  interface Window {
    __STARTUP_LOGS__?: Array<{ name: string; time: number; extra: string }>;
    __mark?: (name: string, extra?: string) => void;
  }
}

const App: React.FC = () => {
  if (window.__mark) {
    window.__mark('app_component_rendering');
  }

  useEffect(() => {
    if (window.__mark) {
      window.__mark('app_component_mounted');
    }

    if (Capacitor.isNativePlatform()) {
      if (window.__mark) {
        window.__mark('splash_hide_prepare');
      }
      requestAnimationFrame(() => {
        if (window.__mark) {
          window.__mark('splash_hide_called');
        }
        SplashScreen.hide({ fadeOutDuration: 150 })
          .then(() => {
            if (window.__mark) {
              window.__mark('splash_hide_completed');
            }
          })
          .catch((e) => {
            console.warn('SplashScreen.hide error:', e);
          });
      });
    }

    const idleCallbackId = window.requestIdleCallback
      ? window.requestIdleCallback(() => {
          if (window.__mark) window.__mark('idle_db_init_start');
          databaseService.initialize().then(() => {
            if (window.__mark) window.__mark('idle_db_init_done');
          });
        })
      : setTimeout(() => {
          if (window.__mark) window.__mark('idle_db_init_start');
          databaseService.initialize().then(() => {
            if (window.__mark) window.__mark('idle_db_init_done');
          });
        }, 300);

    return () => {
      if (window.cancelIdleCallback && typeof idleCallbackId === 'number') {
        window.cancelIdleCallback(idleCallbackId);
      }
    };
  }, []);

  return (
    <IonApp>
      <IonReactRouter>
        <div className="app-main-layout">
          <header className="app-persistent-header">
            <Navigation />
          </header>
          <main className="app-main-body">
            <Suspense fallback={null}>
              <IonRouterOutlet id="main-content">
                <Route exact path="/home" component={Home} />
                <Route exact path="/crm" component={CRM} />
                <Route exact path="/">
                  <Redirect to="/home" />
                </Route>
              </IonRouterOutlet>
            </Suspense>
          </main>
        </div>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
