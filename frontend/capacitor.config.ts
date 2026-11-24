/**
 * @file capacitor.config.ts
 * @description Configuración oficial de Capacitor para empaquetar el APK nativo de Android,
 *              habilitando permisos de Geolocalización en segundo plano ("Permitir todo el tiempo"),
 *              Cámara para escaneo OCR de Cédula/EPS y Notificaciones Locales/Push.
 */

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kungfudojo.hybridmanagement',
  appName: 'Dojo',
  webDir: 'dist/dojo-app/browser',
  server: {
    androidScheme: 'http',
    cleartext: true,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_dojo',
      iconColor: '#0071E3',
      sound: 'dojo_gong.wav',
    },
    Geolocation: {
      // Habilita monitoreo de alta precisión para detectar permanencia en el radio del Dojo
      enableHighAccuracy: true,
    },
    Camera: {
      // Permite captura de Cédula de Ciudadanía y certificado EPS para el módulo OCR
      saveToGallery: false,
    },
  },
};

export default config;
