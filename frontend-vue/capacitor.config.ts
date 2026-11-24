import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dojo.kungfu.app',
  appName: 'Kung Fu Dojo',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
