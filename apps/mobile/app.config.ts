import type { ExpoConfig } from 'expo/config';

// Store identifiers live here only. The bundle identifier is a placeholder until the App Store name is final.
export const IOS_BUNDLE_ID = 'com.wheretolive.app';

const config: ExpoConfig = {
  name: 'Where to Live',
  slug: 'where-to-live',
  scheme: 'wheretolive',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: IOS_BUNDLE_ID,
    buildNumber: '1',
    supportsTablet: false,
    config: { usesNonExemptEncryption: false },
    infoPlist: {
      // Only tiles and the address search go over the network; nothing is tracked.
      NSAppTransportSecurity: { NSAllowsArbitraryLoads: false },
    },
    privacyManifests: {
      NSPrivacyTracking: false,
      NSPrivacyCollectedDataTypes: [],
      NSPrivacyTrackingDomains: [],
      NSPrivacyAccessedAPITypes: [
        {
          // AsyncStorage (last filters) is backed by files and NSUserDefaults.
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
          NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
        },
      ],
    },
  },
  plugins: [
    'expo-router',
    'expo-dev-client',
    '@maplibre/maplibre-react-native',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 160,
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
        dark: { image: './assets/splash-icon.png', backgroundColor: '#0d1117' },
      },
    ],
  ],
  experiments: { typedRoutes: true },
};

export default config;
