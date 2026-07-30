import React, { useEffect } from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import Navigation from './components/Navigation/Navigation';
import Home from './pages/Home/Home';
import CRM from './pages/CRM/CRM';
import { databaseService } from './services/database';

/* Core CSS required for Ionic components */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

const App: React.FC = () => {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Apply dark/black status bar text & icons for light app background once on startup
      StatusBar.setStyle({ style: Style.Light }).catch((e) => {
        console.warn('StatusBar.setStyle error:', e);
      });

      requestAnimationFrame(() => {
        SplashScreen.hide({ fadeOutDuration: 150 }).catch((e) => {
          console.warn('SplashScreen.hide error:', e);
        });
      });
    }

    // Defer database pre-warming until after initial paint
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
            <IonRouterOutlet id="main-content" animated={false}>
              <Route exact path="/home" component={Home} />
              <Route exact path="/crm" component={CRM} />
              <Route exact path="/">
                <Redirect to="/home" />
              </Route>
            </IonRouterOutlet>
          </main>
        </div>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
