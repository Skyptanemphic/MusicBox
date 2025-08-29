import React, { useEffect, useState } from 'react';
import { SafeAreaView, Text, TouchableOpacity, StatusBar, TextInput, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import base64 from 'base-64';

WebBrowser.maybeCompleteAuthSession();

const CLIENT_ID = 'b62141322e27420c965c038797c4ae61';
const CLIENT_SECRET = '959cfd59e1cc44a08b8328ff36740345';
const SCOPES = ['user-read-email', 'user-read-private', 'user-top-read'];

const discovery = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

export default function LoginScreen({ navigation, onLogin }) {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
  const [request, , promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: CLIENT_ID,
      scopes: SCOPES,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
      extraParams: { show_dialog: 'true' },
    },
    discovery
  );

  // Auto-login with saved email/password
  useEffect(() => {
    const tryAutoLogin = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem('email');
        const savedPassword = await AsyncStorage.getItem('password');
        if (savedEmail && savedPassword) {
          setEmail(savedEmail);
          setPassword(savedPassword);
          await loginWithFirebase(savedEmail, savedPassword);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setReady(true);
      }
    };
    tryAutoLogin();
  }, []);

  // Firebase login + Spotify refresh
  const loginWithFirebase = async (userEmail, userPassword) => {
    setLoading(true);
    try {
      const userCred = await signInWithEmailAndPassword(auth, userEmail, userPassword);

      // Get user's Spotify refresh token from Firestore
      const userRef = doc(db, 'users', userCred.user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) throw new Error('User not found in database');

      const { spotifyRefreshToken } = userSnap.data();
      if (!spotifyRefreshToken) {
        // No refresh token, require Spotify login
        Alert.alert('Spotify Authorization', 'Please login with Spotify to continue.');
        await loginWithSpotify(userCred.user.uid);
        return;
      }

      // Refresh Spotify token
      const newToken = await refreshSpotifyToken(spotifyRefreshToken);
      if (!newToken) {
        Alert.alert('Spotify Required', 'Please login with Spotify to continue.');
        await loginWithSpotify(userCred.user.uid);
        return;
      }

      // Update Firestore
      await updateDoc(userRef, { spotifyToken: newToken });
      if (onLogin) onLogin(newToken);
      navigation.replace('Main');
    } catch (err) {
      Alert.alert('Login failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Refresh Spotify token via API
  const refreshSpotifyToken = async (rToken) => {
    try {
      const basicAuth = base64.encode(`${CLIENT_ID}:${CLIENT_SECRET}`);
      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: rToken,
      }).toString();

      const res = await fetch(discovery.tokenEndpoint, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      });

      const data = await res.json();
      if (data.access_token) return data.access_token;
      console.error('Spotify refresh failed:', data);
      return null;
    } catch (err) {
      console.error('Spotify token refresh failed:', err);
      return null;
    }
  };

  // Login with Spotify flow
  const loginWithSpotify = async (userId) => {
    if (!request) return;
    setLoading(true);
    try {
      const result = await promptAsync({ useProxy: true, showInRecents: true });
      if (result?.type === 'success' && result.params.code) {
        const tokenData = await exchangeCodeForToken(result.params.code);
        if (tokenData?.accessToken && tokenData?.refreshToken) {
          // Save tokens to Firestore
          const userRef = doc(db, 'users', userId);
          await updateDoc(userRef, {
            spotifyToken: tokenData.accessToken,
            spotifyRefreshToken: tokenData.refreshToken,
          });
          if (onLogin) onLogin(tokenData.accessToken);
          navigation.replace('Main');
        }
      }
    } catch (err) {
      console.error('Spotify login failed:', err);
      Alert.alert('Spotify login failed', 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Exchange code for access + refresh tokens
  const exchangeCodeForToken = async (code) => {
    if (!request?.codeVerifier) return null;
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: CLIENT_ID,
      code_verifier: request.codeVerifier,
    }).toString();

    try {
      const res = await fetch(discovery.tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      const data = await res.json();
      if (data.access_token && data.refresh_token) {
        return { accessToken: data.access_token, refreshToken: data.refresh_token };
      }
      console.error('Token exchange failed:', data);
      return null;
    } catch (err) {
      console.error('Token exchange error:', err);
      return null;
    }
  };

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please enter both email and password.');
    await loginWithFirebase(email, password);
  };

  if (!ready || loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
        <StatusBar barStyle="light-content" backgroundColor="#121212" />
        <ActivityIndicator size="large" color="#1DB954" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212', padding: 16 }}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 40 }}>Welcome to SoundNet</Text>

      <TextInput
        placeholder="Email" placeholderTextColor="#888"
        value={email} onChangeText={setEmail}
        style={{ backgroundColor: '#222', color: '#fff', width: '100%', padding: 12, borderRadius: 8, marginBottom: 12 }}
        keyboardType="email-address" autoCapitalize="none"
      />
      <TextInput
        placeholder="Password" placeholderTextColor="#888"
        value={password} onChangeText={setPassword}
        style={{ backgroundColor: '#222', color: '#fff', width: '100%', padding: 12, borderRadius: 8, marginBottom: 20 }}
        secureTextEntry
      />

      <TouchableOpacity onPress={handleLogin} style={{ backgroundColor: '#1DB954', padding: 14, borderRadius: 8, width: '100%', marginBottom: 12 }}>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('RegisterScreen')} style={{ backgroundColor: '#555', padding: 14, borderRadius: 8, width: '100%' }}>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>Register</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
