// capacitor.config.ts
// Configuração do Capacitor (apps Android/iOS): o app nativo carrega o site em
// CAPACITOR_SERVER_URL e configura splash screen e barra de status.

import type { CapacitorConfig } from '@capacitor/cli';
import 'dotenv/config';

/** Identificação do app, servidor remoto e plugins nativos. */
const config: CapacitorConfig = {
  appId: 'com.app.worldo',
  appName: 'Worldo',
  webDir: '.next',
  server: {
    url: process.env.CAPACITOR_SERVER_URL,
    androidScheme: 'http',
    iosScheme: 'http',
    allowNavigation: ['*'],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#ffffff',
    },
  },
};

export default config;
