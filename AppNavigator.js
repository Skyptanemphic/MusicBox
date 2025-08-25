import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Screens
import HomeScreen from "./screens/HomeScreen";
import SongScreen from "./screens/SongScreen";
import AlbumScreen from "./screens/AlbumScreen";
import ArtistPage from "./screens/ArtistScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator({ token }) {
  return (
    <Stack.Navigator
      initialRouteName="HomeScreen"
      screenOptions={{
        contentStyle: { backgroundColor: "#121212" },
        headerStyle: { backgroundColor: "#121212" },
        headerTintColor: "#fff",
      }}
    >
      {/* Rename to avoid conflict with drawer */}
      <Stack.Screen
        name="HomeScreen"
        options={{ headerShown: false }}
      >
        {(props) => <HomeScreen {...props} token={token} />}
      </Stack.Screen>

      <Stack.Screen
        name="AlbumScreen"
        component={AlbumScreen}
        options={{ title: "Album" }}
      />
      <Stack.Screen
        name="SongScreen"
        component={SongScreen}
        options={{ title: "Song Details" }}
      />
      <Stack.Screen
        name="ArtistScreen"
        component={ArtistPage}
        options={{ title: "Artist" }}
      />
    </Stack.Navigator>
  );
}
