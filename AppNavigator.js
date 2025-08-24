import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Screens
import LoginScreen from "./screens/LoginScreen";
import HomeScreen from "./screens/HomeScreen";
import SongScreen from "./screens/SongScreen";
import AlbumScreen from "./screens/AlbumScreen";
import ArtistPage from "./screens/ArtistScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        contentStyle: { backgroundColor: "#121212" },
        headerStyle: { backgroundColor: "#121212" },
        headerTintColor: "#fff",
      }}
    >
      {/* Login screen */}
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />

      {/* Home screen, receives token from LoginScreen */}
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />

      {/* Other screens */}
      <Stack.Screen
        name="Album"
        component={AlbumScreen}
        options={{ title: "Album" }}
      />
      <Stack.Screen
        name="Song"
        component={SongScreen}
        options={{ title: "Song Details" }}
      />
      <Stack.Screen
        name="Artist"
        component={ArtistPage}
        options={{ title: "Artist" }}
      />
    </Stack.Navigator>
  );
}
