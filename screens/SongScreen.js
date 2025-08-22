import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SongScreen({ route }) {
  const { songId } = route.params;
  const [song, setSong] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState({});

  useEffect(() => {
    fetchSong();
    loadRatings();
  }, []);

  const fetchSong = async () => {
    try {
      const res = await fetch(`https://api.deezer.com/track/${songId}`);
      const data = await res.json();
      setSong(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadRatings = async () => {
    try {
      const stored = await AsyncStorage.getItem("songRatings");
      if (stored) setRatings(JSON.parse(stored));
    } catch (err) {
      console.error(err);
    }
  };

  const saveRating = async (songId, value) => {
    try {
      const newRatings = { ...ratings, [songId]: value };
      setRatings(newRatings);
      await AsyncStorage.setItem("songRatings", JSON.stringify(newRatings));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !song) return <ActivityIndicator style={{ flex: 1 }} size="large" />;

  return (
    <View style={styles.container}>
      <Image source={{ uri: song.album?.cover_medium }} style={styles.cover} />
      <Text style={styles.title}>{song.title}</Text>
      <Text style={styles.artist}>{song.artist?.name}</Text>
      <Text style={styles.album}>Album: {song.album?.title}</Text>

      <View style={styles.ratingRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => saveRating(song.id, star)}>
            <Text style={{ color: ratings[song.id] >= star ? "#1db954" : "#888", fontSize: 30 }}>
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212", alignItems: "center", padding: 16 },
  cover: { width: 250, height: 250, borderRadius: 12, marginBottom: 16 },
  title: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  artist: { color: "#aaa", fontSize: 18, marginBottom: 8 },
  album: { color: "#aaa", fontSize: 16, marginBottom: 12 },
  ratingRow: { flexDirection: "row", marginTop: 8 },
});
