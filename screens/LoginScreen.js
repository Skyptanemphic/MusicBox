import React, { useEffect, useState } from 'react';
import { SafeAreaView, Text, TouchableOpacity, StatusBar, TextInput, Alert, View } from 'react-native';
import useSpotifyAuth from '../useSpotifyAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

export default function LoginScreen({ navigation, onLogin }) {
  const { token, login, logout, resetAuth } = useSpotifyAuth();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const clearPreviousToken = async () => {
      try {
        await AsyncStorage.removeItem('spotifyToken');
        resetAuth?.();
        logout?.();
      } catch {}
      finally { setReady(true); }
    };
    clearPreviousToken();
  }, []);

  useEffect(() => {
    if (token) {
      AsyncStorage.setItem('spotifyToken', token)
        .then(() => {
          onLogin?.(token);
          navigation.replace('Main');
        })
        .catch(() => {});
    }
  }, [token]);

  const handleLogin = () => {
    if (!email || !password) return Alert.alert('Error', 'Please enter both email and password.');
    signInWithEmailAndPassword(auth, email, password)
      .then(() => navigation.replace('Main'))
      .catch(err => Alert.alert('Login failed', err.message));
  };

  const handleRegister = () => {
    if (!email || !password) return Alert.alert('Error', 'Please enter both email and password.');
    createUserWithEmailAndPassword(auth, email, password)
      .then(() => navigation.replace('Main'))
      .catch(err => Alert.alert('Registration failed', err.message));
  };

  if (!ready) return (
    <SafeAreaView style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#121212'}}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <Text style={{color:'#fff'}}>Preparing login...</Text>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#121212', padding:16}}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <Text style={{color:'#fff', fontSize:28, fontWeight:'bold', marginBottom:40}}>Welcome to SoundNet</Text>

      <TouchableOpacity onPress={login} style={{backgroundColor:'#1db954', padding:14, paddingHorizontal:32, borderRadius:8, marginBottom:20}}>
        <Text style={{color:'#fff', fontSize:18, fontWeight:'bold'}}>Login with Spotify</Text>
      </TouchableOpacity>

      <Text style={{color:'#888', marginVertical:10}}>OR</Text>

      <TextInput placeholder="Email" placeholderTextColor="#888" value={email} onChangeText={setEmail}
        style={{backgroundColor:'#222', color:'#fff', width:'100%', padding:12, borderRadius:8, marginBottom:12}}
        keyboardType="email-address" autoCapitalize="none"
      />
      <TextInput placeholder="Password" placeholderTextColor="#888" value={password} onChangeText={setPassword}
        style={{backgroundColor:'#222', color:'#fff', width:'100%', padding:12, borderRadius:8, marginBottom:12}}
        secureTextEntry
      />

      <View style={{flexDirection:'row', justifyContent:'space-between', width:'100%'}}>
        <TouchableOpacity onPress={handleLogin} style={{flex:1, marginRight:8, backgroundColor:'#1db954', padding:12, borderRadius:8}}>
          <Text style={{color:'#fff', fontWeight:'bold', textAlign:'center'}}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleRegister} style={{flex:1, marginLeft:8, backgroundColor:'#555', padding:12, borderRadius:8}}>
          <Text style={{color:'#fff', fontWeight:'bold', textAlign:'center'}}>Register</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
