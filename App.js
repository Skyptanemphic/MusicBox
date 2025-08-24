import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Icon from "react-native-vector-icons/Ionicons";

// Screens
import LoginScreen from "./screens/LoginScreen";
import AppNavigator from "./AppNavigator";
import ProfileScreen from "./screens/ProfileScreen";
import SearchScreen from "./screens/SearchScreen";
import PlaylistScreen from "./screens/PlaylistScreen";
import ReviewsScreen from "./screens/ReviewsScreen";
import ActivityScreen from "./screens/ActivityScreen";
import SettingsScreen from "./screens/SettingsScreen";

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

function DrawerNavigator({ token }) {
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
        {() => <AppNavigator token={token} />}
      </Drawer.Screen>
      <Drawer.Screen name="Profile" component={ProfileScreen} />
      <Drawer.Screen name="Search" component={SearchScreen} />
      <Drawer.Screen name="Playlists" component={PlaylistScreen} />
      <Drawer.Screen name="Reviews" component={ReviewsScreen} />
      <Drawer.Screen name="Activity" component={ActivityScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
  );
}

export default function App() {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      const storedToken = await AsyncStorage.getItem("spotifyToken");
      if (storedToken) setToken(storedToken);
      setLoading(false);
    };
    checkToken();
  }, []);

  if (loading) return null; // show splash later

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!token ? (
          <Stack.Screen name="Login">
            {(props) => <LoginScreen {...props} onLogin={setToken} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Main">
            {(props) => <DrawerNavigator {...props} token={token} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
