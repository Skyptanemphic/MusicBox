import React, { useEffect } from 'react';
import { SafeAreaView, Text, Button, StatusBar } from 'react-native';
import useSpotifyAuth from '../useSpotifyAuth';

export default function LoginScreen({ navigation }) {
  const { token, login } = useSpotifyAuth();

  useEffect(() => {
    if (token) {
      // Pass token to the nested HomeMain screen inside HomeStack
      navigation.replace('HomeStack', {
        screen: 'HomeMain', // nested screen name
        params: { token },   // pass token here
      });
    }
  }, [token]);

  return (
    <SafeAreaView
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}
    >
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <Text style={{ color: '#fff', fontSize: 24, marginBottom: 40 }}>Welcome to MusicBox</Text>
      <Button title="Login with Spotify" onPress={login} color="#1db954" />
    </SafeAreaView>
  );
}
