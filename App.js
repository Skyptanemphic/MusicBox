import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import Icon from "react-native-vector-icons/Ionicons";

// Navigator
import AppNavigator from "./AppNavigator";

// Other Screens
import ProfileScreen from "./screens/ProfileScreen";
import SearchScreen from "./screens/SearchScreen";
import PlaylistScreen from "./screens/PlaylistScreen";
import ReviewsScreen from "./screens/ReviewsScreen";
import ActivityScreen from "./screens/ActivityScreen";
import SettingsScreen from "./screens/SettingsScreen";

const Drawer = createDrawerNavigator();

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
          component={AppNavigator}
          options={{
            drawerIcon: ({ color, size }) => (
              <Icon name="home-outline" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            drawerIcon: ({ color, size }) => (
              <Icon name="person-outline" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen
          name="Search"
          component={SearchScreen}
          options={{
            drawerIcon: ({ color, size }) => (
              <Icon name="search-outline" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen
          name="Playlists"
          component={PlaylistScreen}
          options={{
            drawerIcon: ({ color, size }) => (
              <Icon name="musical-notes-outline" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen
          name="Reviews"
          component={ReviewsScreen}
          options={{
            drawerIcon: ({ color, size }) => (
              <Icon name="star-outline" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen
          name="Activity"
          component={ActivityScreen}
          options={{
            drawerIcon: ({ color, size }) => (
              <Icon name="pulse-outline" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            drawerIcon: ({ color, size }) => (
              <Icon name="settings-outline" color={color} size={size} />
            ),
          }}
        />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}
