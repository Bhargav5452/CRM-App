import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.offlinecrm.app',
  appName: 'Lead CRM',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#FFFFFF',
      overlaysWebView: false,
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_lead_crm',
      iconColor: '#09090B',
    },
    SplashScreen: {
      // Do NOT auto-hide — we call SplashScreen.hide() manually from App.tsx
      // only after React has fully painted the first frame.
      launchAutoHide: false,
      // Match splash background to app background (#FAFAFA) to prevent
      // any colour shift when the WebView becomes visible.
      backgroundColor: '#FAFAFA',
      // Fade duration in ms (matches App.tsx fadeOutDuration).
      fadeOutDuration: 200,
      // Show the splash immediately on launch (no extra delay).
      showDuration: 0,
      // Do not use the plugin's built-in spinner.
      showSpinner: false,
    },
  },
};

export default config;
