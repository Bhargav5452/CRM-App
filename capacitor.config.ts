import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.offlinecrm.app',
  appName: 'Offline CRM',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#FFFFFF',
      overlaysWebView: false,
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_offline_crm',
      iconColor: '#09090B',
    },
  },
};

export default config;
