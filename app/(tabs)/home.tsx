import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as ScreenOrientation from 'expo-screen-orientation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

// Adjust these imports based on your project structure
import OnboardingSkeleton from '../src/components/OnboardingSkeleton';
import OnboardingScreen from '../src/components/OnboardingScreen';

const WEB_URL = 'https://your-web-url.com'; // <-- Update this URL
const VENDOR_CODE = 'demoVendor'; // <-- Update this
const DOMAIN_NAME = 'your-web-url.com'; // <-- Update this
const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

export default function HomeScreen() {
  const webViewRef = useRef<WebView>(null);
  const [onboardingScreen, setOnboardingScreen] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [webViewError, setWebViewError] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);

  const checkOnboardingStatus = async () => {
    try {
      const isOnboarded = await AsyncStorage.getItem('hasOnboarded');
      setOnboardingScreen(isOnboarded !== 'true');
    } catch (error) {
      console.error('[checkOnboardingStatus] Error:', error);
    }
  };

  const onMessage = useCallback(async (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (typeof message.type !== 'string') throw new Error('Invalid message format');

      switch (message.type) {
        case 'KILL_RELAUNCH':
          Alert.alert('App Update Required', 'Please restart the app.', [
            { text: 'Exit', onPress: () => BackHandler.exitApp() },
          ]);
          break;
        case 'SET_ORIENTATION':
          const { mode } = message?.data || {};
          if (mode === 'landscape') {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
          } else if (mode === 'portrait') {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
          } else {
            await ScreenOrientation.unlockAsync();
          }
          break;
        default:
          console.warn('[WebView] Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('[onMessage error]', error);
    }
  }, []);

  const reloadWebView = () => {
    setWebViewError(false);
    webViewRef.current?.reload();
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
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
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.webViewContainer}>
          <WebView
            ref={webViewRef}
            source={{ uri: WEB_URL }}
            originWhitelist={['*']}
            bounces={false}
            javaScriptEnabled
            onMessage={onMessage}
            onNavigationStateChange={(navState: any) => setCanGoBack(navState.canGoBack)}
            onError={() => setWebViewError(true)}
            injectedJavaScript={`
              (function() {
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
                true;
              })();
            `}
            scalesPageToFit={false}
            allowsFullscreenVideo={true}
            domStorageEnabled
            thirdPartyCookiesEnabled
            webviewDebuggingEnabled={true}
            style={styles.webView}
          />
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  webViewContainer: { flex: 1 },
  webView: { flex: 1 },
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
