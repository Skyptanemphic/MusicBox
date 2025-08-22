import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";

import HomeScreen from "./screens/HomeScreen";
import AlbumScreen from "./screens/AlbumScreen";
import SongScreen from "./screens/SongScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: "#121212" },
          headerTintColor: "#fff",
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen
          name="AlbumScreen"
          component={AlbumScreen}
          options={({ route }) => ({ title: route.params.albumName || "Album" })}
        />
        <Stack.Screen
          name="SongScreen"
          component={SongScreen}
          options={{ title: "Song Info" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
