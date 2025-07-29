 
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import * as ScreenOrientation from 'expo-screen-orientation';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

// Import your components
import OnboardingScreen from './src/components/OnboardingScreen';
import OnboardingSkeleton from './src/components/OnboardingSkeleton';

// Configuration constants
const WEB_URL = 'https://student.closm.com';
const VENDOR_CODE = 'DLVBC';
const DOMAIN_NAME = 'student.closm.com';
const APP_VERSION = '1.0.0';

function MainApp() {
  const webViewRef = useRef<WebView>(null);
  const [onboardingScreen, setOnboardingScreen] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [webViewError, setWebViewError] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);
  const [cookieScript, setCookieScript] = useState('');

  const getCookieScript = async () => {
    const deviceId = await Application.getIosIdForVendorAsync() || Device.deviceName || 'unknown';
    const version = Platform.OS === 'android' 
      ? Application.nativeApplicationVersion || APP_VERSION
      : `${Application.nativeApplicationVersion || APP_VERSION}(${Application.nativeBuildVersion || '1'})`;
    const osVersion = Device.osVersion || 'unknown';

    const cookies = [
      { name: 'appPlatform', value: Platform.OS },
      { name: 'appVersion', value: APP_VERSION || version },
      { name: '_appVersion', value: version },
      { name: 'deviceId', value: deviceId },
      { name: 'osVersion', value: osVersion },
      { name: 'isRn', value: 1 },
      { name: 'vendorCode', value: VENDOR_CODE },
    ];

    const domain = DOMAIN_NAME;
    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();

    return cookies.map(
      ({ name, value }) =>
        `document.cookie = "${name}=${value}; domain=${domain}; path=/; secure; expires=${expires}";`
    ).join('\n');
  };

  const checkOnboardingStatus = async () => {
    try {
      const isOnboarded = await AsyncStorage.getItem('hasOnboarded');
      setOnboardingScreen(isOnboarded !== 'true');
    } catch (error) {
      console.error('[checkOnboardingStatus] Error:', error);
    }
  };

  const onMessage = useCallback(async (event: { nativeEvent: { data: string } }) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (typeof message.type !== 'string') {
        throw new Error('Invalid message format');
      }

      switch (message.type) {
        case 'GOOGLE_SIGN_IN':
          // TODO: Implement Google Sign-In with Expo AuthSession
          console.log('Google Sign-In requested');
          webViewRef.current?.postMessage(JSON.stringify({ 
            type: 'SIGN_IN_SUCCESS', 
            data: { message: 'Google Sign-In not implemented yet' } 
          }));
          break;
        case 'IS_FOR_RN_LOGIN':
          webViewRef.current?.postMessage(JSON.stringify({ type: 'SET_FOR_RN_LOGIN', data: {} }));
          break;
        case 'KILL_RELAUNCH':
          Alert.alert('App Update Required', 'A critical update is needed. Please restart the app.', [
            { text: 'Exit', onPress: () => BackHandler.exitApp() },
          ]);
          break;
        case 'SET_ORIENTATION':
          const { mode } = message?.data || {};
          if (mode === 'landscape') {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
          } else if (mode === 'portrait') {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
          } else if (mode === 'unlock') {
            await ScreenOrientation.unlockAsync();
          } else {
            console.warn('[Orientation] Unknown mode:', message);
          }
          break;
        default:
          console.warn('[WebView] Unknown message type:', message.type);
      }
    } catch (error: any) {
      console.error('[WebView onMessage] Error:', error);
      webViewRef.current?.postMessage(
        JSON.stringify({
          type: 'SIGN_IN_ERROR',
          data: { error: error.message || 'Unexpected error occurred' },
        })
      );
    }
  }, []);

  const reloadWebView = () => {
    setWebViewError(false);
    webViewRef.current?.reload();
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const script = await getCookieScript();
        setCookieScript(script);
        await checkOnboardingStatus();
      } catch (err) {
        console.error('[initializeApp] Error:', err);
      } finally {
        setTimeout(() => {
          setIsAppReady(true);
        }, 2000);
      }
    };
    initializeApp();
  }, []);

  useEffect(() => {
    const onBackPress = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      Alert.alert('Exit App', 'Do you want to exit?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', onPress: () => BackHandler.exitApp() },
      ]);
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [canGoBack]);

  if (!isAppReady) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.splashContainer}>
          <OnboardingSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  if (onboardingScreen) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.splashContainer}>
          <OnboardingScreen onComplete={() => setOnboardingScreen(false)} />
        </View>
      </SafeAreaView>
    );
  }

  if (webViewError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Oops! Something went wrong loading the page.</Text>
          <TouchableOpacity onPress={reloadWebView} style={styles.reloadButton}>
            <Text style={styles.reloadText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.webViewContainer}>
          <WebView
            ref={webViewRef}
            source={{ uri: WEB_URL }}
            originWhitelist={['*']}
            bounces={false}
            javaScriptEnabled
            onMessage={onMessage}
            onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}
            onError={() => setWebViewError(true)}
            onHttpError={({ nativeEvent }) => {
              console.error(`HTTP error: ${nativeEvent.statusCode}`);
              setWebViewError(true);
            }}
            injectedJavaScriptBeforeContentLoaded={cookieScript}
            injectedJavaScript={`
              (function() {
                try {
                  var existing = document.querySelector('meta[name=viewport]');
                  if (existing) {
                    existing.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
                  } else {
                    var meta = document.createElement('meta');
                    meta.name = 'viewport';
                    meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
                    document.head.appendChild(meta);
                  }
                  document.cookie = "isRn=1; path=/;";
                } catch (e) {
                  console.error("Injected JS error", e);
                }
                true;
              })();
            `}
            scalesPageToFit={false}
            allowsFullscreenVideo={true}
            style={styles.webView}
            domStorageEnabled
            setSupportMultipleWindows={false}
            thirdPartyCookiesEnabled
            webviewDebuggingEnabled={true}
          />
        </View>
      </SafeAreaView>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  webViewContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  reloadButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007BFF',
    borderRadius: 6,
  },
  reloadText: {
    color: '#fff',
    fontSize: 16,
  },
});
