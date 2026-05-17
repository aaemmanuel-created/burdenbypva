// BURDEN by PVA — Expo dynamic config.
// Mirrors the structure of ../PILLAR by PVA/pillar-app/app.config.ts.
import type { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'BURDEN',
  slug: 'burden-by-pva',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'burden',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  jsEngine: 'hermes',

  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#f7f6f2',
  },

  ios: {
    supportsTablet: true,
    bundleIdentifier: 'app.burdenbypva.burden',
    infoPlist: {
      // Web/HTTPS only — exempt from US export crypto declarations.
      ITSAppUsesNonExemptEncryption: false,
    },
  },

  android: {
    package: 'app.burdenbypva.burden',
    edgeToEdgeEnabled: true,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#f7f6f2',
    },
  },

  web: {
    favicon: './assets/favicon.png',
  },

  plugins: ['expo-font'],

  updates: {
    url: 'https://u.expo.dev/7661727e-15da-4be3-a8bc-3c4c35b9cc20',
  },
  runtimeVersion: {
    policy: 'appVersion',
  },

  extra: {
    eas: {
      projectId: '7661727e-15da-4be3-a8bc-3c4c35b9cc20',
    },
  },
});
