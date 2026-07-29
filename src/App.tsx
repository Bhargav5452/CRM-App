import React, { useEffect } from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import Navigation from './components/Navigation/Navigation';
import Home from './pages/Home/Home';
import CRM from './pages/CRM/CRM';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

const App: React.FC = () => {
  useEffect(() => {
    const initializeNativePlatform = async () => {
      if (!Capacitor.isNativePlatform()) return;

      try {
        // 1. Configure status bar: white background, dark icons
        await StatusBar.setOverlaysWebView({ overlay: false });
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: '#FFFFFF' });
      } catch (e) {
        console.warn('StatusBar configuration error:', e);
      }

      // 2. Wait two animation frames so React has fully painted the first frame
      //    (header + navigation + page content all present) before hiding the
      //    splash. This prevents any blank/partial frame flash between the
      //    splash and the live UI.
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      });

      // 3. Dismiss the splash with a soft fade. launchAutoHide is false in
      //    capacitor.config.ts so the splash stays visible until we call hide().
      try {
        await SplashScreen.hide({ fadeOutDuration: 200 });
      } catch (e) {
        console.warn('SplashScreen.hide error:', e);
      }
    };

    initializeNativePlatform();
  }, []);

  return (
    <IonApp>
      <IonReactRouter>
        <div className="app-main-layout">
          <header className="app-persistent-header">
            <Navigation />
          </header>
          <main className="app-main-body">
            <IonRouterOutlet id="main-content">
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
