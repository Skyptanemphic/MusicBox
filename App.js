import React, { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Icon from "react-native-vector-icons/Ionicons";

// Screens
import LoginScreen from "./screens/LoginScreen";
import HomeScreen from "./screens/HomeScreen";
import ProfileScreen from "./screens/ProfileScreen";
import SearchScreen from "./screens/SearchScreen";
import PlaylistScreen from "./screens/PlaylistScreen";
import ReviewsScreen from "./screens/ReviewsScreen";
import ActivityScreen from "./screens/ActivityScreen";
import SettingsScreen from "./screens/SettingsScreen";

// Detail Screens
import SongScreen from "./screens/SongScreen";
import AlbumScreen from "./screens/AlbumScreen";
import ArtistScreen from "./screens/ArtistScreen";
import CategoryPlaylistsScreen from "./screens/CategoryPlaylistsScreen";

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

function MainDrawer({ token }) {
  return (
    <Drawer.Navigator
      screenOptions={{
        drawerStyle: { backgroundColor: "#121212", width: 240 },
        drawerActiveTintColor: "#fff",
        drawerInactiveTintColor: "#aaa",
        headerStyle: { backgroundColor: "#121212" },
        headerTintColor: "#fff",
      }}
    >
      <Drawer.Screen
        name="Home"
        options={{
          drawerIcon: ({ color, size }) => (
            <Icon name="home-outline" color={color} size={size} />
          ),
        }}
      >
        {(props) => <HomeScreen {...props} token={token} />}
      </Drawer.Screen>
      <Drawer.Screen name="Profile" component={ProfileScreen} />
      <Drawer.Screen name="Search" component={SearchScreen} />
      <Drawer.Screen name="Reviews" component={ReviewsScreen} />
      <Drawer.Screen name="Activity" component={ActivityScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
  );
}

export default function App() {
  const [token, setToken] = useState(null);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Login */}
        <Stack.Screen name="Login">
          {(props) => <LoginScreen {...props} onLogin={setToken} />}
        </Stack.Screen>

        {/* Main Drawer */}
        <Stack.Screen name="Main">
          {(props) => <MainDrawer {...props} token={token} />}
        </Stack.Screen>

        {/* Detail Screens */}
        <Stack.Screen
          name="Song"
          component={SongScreen}
          options={{
            headerShown: true,
            title: "Song Details",
            headerStyle: { backgroundColor: "#121212" },
            headerTintColor: "#fff",
          }}
        />
        <Stack.Screen
          name="Album"
          component={AlbumScreen}
          options={{
            headerShown: true,
            title: "Album",
            headerStyle: { backgroundColor: "#121212" },
            headerTintColor: "#fff",
          }}
        />
        <Stack.Screen
          name="Artist"
          component={ArtistScreen}
          options={{
            headerShown: true,
            title: "Artist",
            headerStyle: { backgroundColor: "#121212" },
            headerTintColor: "#fff",
          }}
        />
        <Stack.Screen
          name="CategoryPlaylists"
          component={CategoryPlaylistsScreen}
          options={({ route }) => ({
            headerShown: true,
            title: route?.params?.categoryName ?? "Playlists",
            headerStyle: { backgroundColor: "#121212" },
            headerTintColor: "#fff",
          })}
        />
        {/* Playlist Screen added here */}
        <Stack.Screen
          name="Playlist"
          component={PlaylistScreen}
          options={({ route }) => ({
            headerShown: true,
            title: route?.params?.playlistName ?? "Playlist",
            headerStyle: { backgroundColor: "#121212" },
            headerTintColor: "#fff",
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
