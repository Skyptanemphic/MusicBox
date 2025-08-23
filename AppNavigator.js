import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Screens
import HomeScreen from "./screens/HomeScreen";
import SongScreen from "./screens/SongScreen";
import AlbumScreen from "./screens/AlbumScreen";
import ArtistPage from "./screens/ArtistScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false, 
        contentStyle: { backgroundColor: "#121212" },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Album" component={AlbumScreen} />
      <Stack.Screen name="Song" component={SongScreen} />
      <Stack.Screen name="Artist" component={ArtistPage} />
    </Stack.Navigator>
  );
}
