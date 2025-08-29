import React, { useState } from 'react';
import { SafeAreaView, Text, TextInput, TouchableOpacity, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useSpotifyAuth from '../useSpotifyAuth';

export default function RegisterScreen({ navigation, onRegister }) {
  const { login } = useSpotifyAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !username) {
      return Alert.alert('Error', 'Please fill all fields.');
    }
    setLoading(true);
    try {
      // Create Firebase user
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const userRef = doc(db, 'users', userCred.user.uid);
      await setDoc(userRef, { email, username, createdAt: new Date() });

      await AsyncStorage.setItem('email', email);
      await AsyncStorage.setItem('password', password);

      // Immediately link Spotify
      await handleSpotifyLogin(userCred.user.uid);

    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        Alert.alert('Registration failed', 'This email is already registered. Please login instead.');
      } else {
        Alert.alert('Registration failed', err.message);
      }
      setLoading(false);
    }
  };

  const handleSpotifyLogin = async (userId) => {
    try {
      const tokenData = await login();
      if (!tokenData?.accessToken) throw new Error('No Spotify token received.');

      await setDoc(doc(db, 'users', userId), {
        spotifyToken: tokenData.accessToken,
        spotifyRefreshToken: tokenData.refreshToken,
        lastUpdated: new Date(),
      }, { merge: true });

      await AsyncStorage.setItem('spotifyToken', tokenData.accessToken);

      // ✅ Update App token state
      if (onRegister) onRegister(tokenData.accessToken);

      // Navigate to Main Drawer
      navigation.replace('Main');
    } catch (err) {
      Alert.alert('Spotify login failed', err.message || err.toString());
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#121212'}}>
        <StatusBar barStyle="light-content" backgroundColor="#121212" />
        <ActivityIndicator size="large" color="#1DB954" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#121212', padding:16}}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <Text style={{color:'#fff', fontSize:28, fontWeight:'bold', marginBottom:40}}>Register</Text>

      <TextInput
        placeholder="Email" placeholderTextColor="#888" value={email} onChangeText={setEmail}
        style={{backgroundColor:'#222', color:'#fff', width:'100%', padding:12, borderRadius:8, marginBottom:12}}
        keyboardType="email-address" autoCapitalize="none"
      />
      <TextInput
        placeholder="Username" placeholderTextColor="#888" value={username} onChangeText={setUsername}
        style={{backgroundColor:'#222', color:'#fff', width:'100%', padding:12, borderRadius:8, marginBottom:12}}
      />
      <TextInput
        placeholder="Password" placeholderTextColor="#888" value={password} onChangeText={setPassword}
        style={{backgroundColor:'#222', color:'#fff', width:'100%', padding:12, borderRadius:8, marginBottom:20}}
        secureTextEntry
      />

      <TouchableOpacity onPress={handleRegister} style={{backgroundColor:'#1db954', padding:14, borderRadius:8, width:'100%'}}>
        <Text style={{color:'#fff', fontSize:18, fontWeight:'bold', textAlign:'center'}}>Register & Link Spotify</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
