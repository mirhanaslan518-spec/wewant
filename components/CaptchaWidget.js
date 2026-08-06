import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const CAPTCHA_PAGE_URL = 'https://mirhanaslan518-spec.github.io/wewant/captcha.html';

const CaptchaWidget = forwardRef(function CaptchaWidget({ onVerify, onExpire }, ref) {
  const webviewRef = useRef(null);

  useImperativeHandle(ref, () => ({
    reset: () => {
      webviewRef.current?.reload();
    },
  }));

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'verify') {
        onVerify(data.token);
      } else if (data.type === 'expire' || data.type === 'error') {
        onExpire?.();
      }
    } catch (e) {
      // yoksay
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        source={{ uri: CAPTCHA_PAGE_URL }}
        onMessage={handleMessage}
        style={styles.webview}
        scrollEnabled={false}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: { height: 80, marginBottom: 4 },
  webview: { backgroundColor: 'transparent' },
});

export default CaptchaWidget;
