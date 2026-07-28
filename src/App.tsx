import React, { useEffect } from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
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
    const configureStatusBar = async () => {
      if (!Capacitor.isNativePlatform()) return;
      try {
        // Prevent web content from drawing underneath the system status bar
        await StatusBar.setOverlaysWebView({ overlay: false });
        // Use dark icons on white status bar background
        await StatusBar.setStyle({ style: Style.Dark });
        // Set status bar background to match app header
        await StatusBar.setBackgroundColor({ color: '#FFFFFF' });
      } catch (e) {
        console.warn('StatusBar configuration error:', e);
      }
    };
    configureStatusBar();
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
