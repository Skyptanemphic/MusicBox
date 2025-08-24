import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Screens
import LoginScreen from "./screens/LoginScreen";
import HomeMainScreen from "./screens/HomeScreen"; // Renamed for uniqueness
import SongScreen from "./screens/SongScreen";
import AlbumScreen from "./screens/AlbumScreen";
import ArtistPage from "./screens/ArtistScreen";

const RootStack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator();

// Stack for Home-related screens
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        contentStyle: { backgroundColor: "#121212" },
        headerStyle: { backgroundColor: "#121212" },
        headerTintColor: "#fff",
      }}
    >
      <HomeStack.Screen
        name="HomeMain"  // unique name
        component={HomeMainScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="Album"
        component={AlbumScreen}
        options={{ title: "Album" }}
      />
      <HomeStack.Screen
        name="Song"
        component={SongScreen}
        options={{ title: "Song Details" }}
      />
      <HomeStack.Screen
        name="Artist"
        component={ArtistPage}
        options={{ title: "Artist" }}
      />
    </HomeStack.Navigator>
  );
}

// Root navigator
export default function AppNavigator() {
  return (
    <RootStack.Navigator
      initialRouteName="Login"
      screenOptions={{
        contentStyle: { backgroundColor: "#121212" },
        headerStyle: { backgroundColor: "#121212" },
        headerTintColor: "#fff",
      }}
    >
      <RootStack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />

      {/* Nest the HomeStack */}
      <RootStack.Screen
        name="HomeStack"
        component={HomeStackNavigator}
        options={{ headerShown: false }}
      />
    </RootStack.Navigator>
  );
}
