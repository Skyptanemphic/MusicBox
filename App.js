import React, { useState } from "react";
import { StatusBar } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Icon from "react-native-vector-icons/Ionicons";

// Screens
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
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

function MainDrawer({ token, onLogout }) {
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
        options={{ drawerIcon: ({ color, size }) => <Icon name="home-outline" color={color} size={size} /> }}
      >
        {(props) => <HomeScreen {...props} token={token} />}
      </Drawer.Screen>

      <Drawer.Screen
        name="Search"
        options={{ drawerIcon: ({ color, size }) => <Icon name="search-outline" color={color} size={size} /> }}
      >
        {(props) => <SearchScreen {...props} token={token} />}
      </Drawer.Screen>

      <Drawer.Screen
        name="Profile"
        options={{ drawerIcon: ({ color, size }) => <Icon name="person-outline" color={color} size={size} /> }}
      >
        {(props) => <ProfileScreen {...props} token={token} />}
      </Drawer.Screen>

      <Drawer.Screen
        name="Reviews"
        options={{ drawerIcon: ({ color, size }) => <Icon name="star-outline" color={color} size={size} /> }}
      >
        {(props) => <ReviewsScreen {...props} token={token} />}
      </Drawer.Screen>

      <Drawer.Screen
        name="Activity"
        options={{ drawerIcon: ({ color, size }) => <Icon name="time-outline" color={color} size={size} /> }}
      >
        {(props) => <ActivityScreen {...props} token={token} />}
      </Drawer.Screen>

      <Drawer.Screen
        name="Settings"
        options={{ drawerIcon: ({ color, size }) => <Icon name="settings-outline" color={color} size={size} /> }}
      >
        {(props) => <SettingsScreen {...props} token={token} onLogout={onLogout} />}
      </Drawer.Screen>
    </Drawer.Navigator>
  );
}

export default function App() {
  const [token, setToken] = useState(null);

  const MyTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: "#000",
    },
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <NavigationContainer theme={MyTheme}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#000" },
          }}
        >
          {/* Login */}
          <Stack.Screen name="Login">
            {(props) => <LoginScreen {...props} onLogin={setToken} />}
          </Stack.Screen>

          {/* Register */}
          <Stack.Screen name="RegisterScreen">
            {(props) => <RegisterScreen {...props} onRegister={setToken} />}
          </Stack.Screen>

          {/* Main Drawer */}
          <Stack.Screen name="Main">
            {(props) => <MainDrawer {...props} token={token} onLogout={setToken} />}
          </Stack.Screen>

          {/* Detail Screens */}
          <Stack.Screen
            name="Song"
            component={SongScreen}
            options={{ headerShown: true, title: "Song Details", headerStyle: { backgroundColor: "#121212" }, headerTintColor: "#fff" }}
          />
          <Stack.Screen
            name="Album"
            component={AlbumScreen}
            options={{ headerShown: true, title: "Album", headerStyle: { backgroundColor: "#121212" }, headerTintColor: "#fff" }}
          />
          <Stack.Screen
            name="Artist"
            component={ArtistScreen}
            options={{ headerShown: true, title: "Artist", headerStyle: { backgroundColor: "#121212" }, headerTintColor: "#fff" }}
          />
          <Stack.Screen
            name="CategoryPlaylists"
            component={CategoryPlaylistsScreen}
            options={({ route }) => ({ headerShown: true, title: route?.params?.categoryName ?? "Playlists", headerStyle: { backgroundColor: "#121212" }, headerTintColor: "#fff" })}
          />
          <Stack.Screen
            name="Playlist"
            component={PlaylistScreen}
            options={({ route }) => ({ headerShown: true, title: route?.params?.playlistName ?? "Playlist", headerStyle: { backgroundColor: "#121212" }, headerTintColor: "#fff" })}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
