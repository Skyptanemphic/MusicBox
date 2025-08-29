import React from "react";
import { SafeAreaView, View, Text, TouchableOpacity, StatusBar, StyleSheet, Linking } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SettingsScreen({ navigation, onLogout }) {
  const handleLogout = async () => {
    await AsyncStorage.removeItem("email");
    await AsyncStorage.removeItem("password");
    await AsyncStorage.removeItem("spotifyToken");
    await AsyncStorage.removeItem("spotifyRefreshToken");

    if (onLogout) onLogout(null);

    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  const handleSupport = () => {
    Linking.openURL("mailto:support@soundnetapp.com");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      <Text style={styles.title}>Settings</Text>

      {/* App Info Section */}
      <Text style={styles.sectionTitle}>App Info</Text>
      <View style={styles.infoBox}>
        <Text style={styles.infoLabel}>App Version:</Text>
        <Text style={styles.infoValue}>1.0.0</Text>
      </View>
      <View style={styles.infoBox}>
        <Text style={styles.infoLabel}>Terms of Service:</Text>
        <Text style={styles.link} onPress={() => Linking.openURL("https://example.com/terms")}>
          View
        </Text>
      </View>
      <View style={styles.infoBox}>
        <Text style={styles.infoLabel}>Privacy Policy:</Text>
        <Text style={styles.link} onPress={() => Linking.openURL("https://example.com/privacy")}>
          View
        </Text>
      </View>

      {/* Support Section */}
      <Text style={styles.sectionTitle}>Support</Text>
      <TouchableOpacity style={styles.button} onPress={handleSupport}>
        <Text style={styles.buttonText}>Contact Support</Text>
      </TouchableOpacity>

      {/* Logout */}
      <Text style={styles.sectionTitle}>Account</Text>
      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Log Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212", padding: 16 },
  title: { color: "#fff", fontSize: 28, fontWeight: "bold", marginBottom: 24 },
  sectionTitle: { color: "#888", fontSize: 16, fontWeight: "bold", marginTop: 24, marginBottom: 8 },
  infoBox: { backgroundColor: "#222", padding: 16, borderRadius: 8, marginBottom: 12 },
  infoLabel: { color: "#888", fontSize: 14 },
  infoValue: { color: "#fff", fontSize: 16, marginTop: 4 },
  link: { color: "#1DB954", textDecorationLine: "underline", marginTop: 4 },
  button: { backgroundColor: "#1DB954", padding: 14, borderRadius: 8, marginBottom: 16 },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold", textAlign: "center" },
});
