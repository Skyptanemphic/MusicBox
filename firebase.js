import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyArAKMRMAQDNqYXO0J85dJa_Jk_lxwRr48",
  authDomain: "soundnet-a6a04.firebaseapp.com",
  projectId: "soundnet-a6a04",
  storageBucket: "soundnet-a6a04.appspot.com",
  messagingSenderId: "686338364143",
  appId: "1:686338364143:web:459bad3469e2fd87e6011a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firestore
export const db = getFirestore(app);

// Auth with persistence using AsyncStorage
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
