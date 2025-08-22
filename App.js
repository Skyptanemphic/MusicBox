import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Icon from "react-native-vector-icons/Ionicons";

// Screens
import HomeScreen from "./screens/HomeScreen.js";
import AlbumScreen from "./screens/AlbumScreen.js";
import ProfileScreen from "./screens/ProfileScreen.js";
import SearchScreen from "./screens/SearchScreen.js";
import PlaylistScreen from "./screens/PlaylistScreen.js";
import ReviewsScreen from "./screens/ReviewsScreen.js";
import ActivityScreen from "./screens/ActivityScreen.js";
import SettingsScreen from "./screens/SettingsScreen.js";
import SongScreen from "./screens/SongScreen.js";


const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

// Stack for Home (discovery → album detail)
function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Discover" component={HomeScreen} />
      <Stack.Screen name="Album" component={AlbumScreen} />
      <Stack.Screen name="Song" component={SongScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
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
          component={HomeStack}
          options={{ drawerIcon: ({ color, size }) => <Icon name="home-outline" color={color} size={size} /> }}
        />
        <Drawer.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ drawerIcon: ({ color, size }) => <Icon name="person-outline" color={color} size={size} /> }}
        />
        <Drawer.Screen
          name="Search"
          component={SearchScreen}
          options={{ drawerIcon: ({ color, size }) => <Icon name="search-outline" color={color} size={size} /> }}
        />
        <Drawer.Screen
          name="Playlists"
          component={PlaylistScreen}
          options={{ drawerIcon: ({ color, size }) => <Icon name="musical-notes-outline" color={color} size={size} /> }}
        />
        <Drawer.Screen
          name="Reviews"
          component={ReviewsScreen}
          options={{ drawerIcon: ({ color, size }) => <Icon name="star-outline" color={color} size={size} /> }}
        />
        <Drawer.Screen
          name="Activity"
          component={ActivityScreen}
          options={{ drawerIcon: ({ color, size }) => <Icon name="pulse-outline" color={color} size={size} /> }}
        />
        <Drawer.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ drawerIcon: ({ color, size }) => <Icon name="settings-outline" color={color} size={size} /> }}
        />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}
