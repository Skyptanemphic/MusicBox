import React, { useEffect } from 'react';
import { SafeAreaView, Text, Button, StatusBar } from 'react-native';
import useSpotifyAuth from '../useSpotifyAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }) {
  const { token, login } = useSpotifyAuth();

  useEffect(() => {
    if (token) {
      // Save token
      AsyncStorage.setItem('spotifyToken', token);

      // Navigate directly to Home screen (not HomeStack/HomeMain)
      navigation.replace('Home', { token });
    }
  }, [token]);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#121212',
      }}
    >
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <Text style={{ color: '#fff', fontSize: 24, marginBottom: 40 }}>
        Welcome to MusicBox
      </Text>
      <Button title="Login with Spotify" onPress={login} color="#1db954" />
    </SafeAreaView>
  );
}
