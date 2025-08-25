import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Screens
import HomeScreen from "./screens/HomeScreen";
import SongScreen from "./screens/SongScreen";
import AlbumScreen from "./screens/AlbumScreen";
import ArtistScreen from "./screens/ArtistScreen";
import CategoryPlaylistsScreen from "./screens/CategoryPlaylistsScreen";
import PlaylistScreen from "./screens/PlaylistScreen";

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
      <Stack.Screen name="HomeScreen" options={{ headerShown: false }}>
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
        component={ArtistScreen}
        options={{ title: "Artist" }}
      />
      <Stack.Screen
        name="CategoryPlaylists"
        component={CategoryPlaylistsScreen}
        options={({ route }) => ({ title: route.params.categoryName })}
      />
      <Stack.Screen
        name="Playlist"
        component={PlaylistScreen}
        options={({ route }) => ({ title: route.params.playlistName })}
      />
    </Stack.Navigator>
  );
}
