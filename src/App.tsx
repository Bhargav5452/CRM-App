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

setupIonicReact();

const App: React.FC = () => {
  useEffect(() => {
    // Zero-latency startup sequence:
    // Status bar configuration is handled natively in MainActivity.java at native startup (0ms JS delay).
    // Hide splash screen on the very first painted animation frame after React mounts.
    if (Capacitor.isNativePlatform()) {
      requestAnimationFrame(() => {
        SplashScreen.hide({ fadeOutDuration: 150 }).catch((e) => {
          console.warn('SplashScreen.hide error:', e);
        });
      });
    }

    // Defer non-essential background initialization (SQLite database pre-warming) until AFTER initial render
    const idleCallbackId = window.requestIdleCallback
      ? window.requestIdleCallback(() => {
          databaseService.initialize();
        })
      : setTimeout(() => {
          databaseService.initialize();
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
