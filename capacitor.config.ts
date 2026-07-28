import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.offlinecrm.app',
  appName: 'Offline CRM',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#FFFFFF',
      overlaysWebView: false,
    },
  },
};

export default config;
