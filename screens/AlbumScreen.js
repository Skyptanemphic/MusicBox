import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, StyleSheet, Pressable } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import Icon from "react-native-vector-icons/FontAwesome5";

export default function AlbumScreen({ route, navigation }) {
  const { albumId, token: routeToken } = route.params;
  const [album, setAlbum] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState({});
  const [token, setToken] = useState(routeToken || null);

  useEffect(() => {
    const loadToken = async () => {
      if (!routeToken) {
        try {
          const storedToken = await AsyncStorage.getItem("spotifyToken");
          if (storedToken) setToken(storedToken);
        } catch (err) { console.error("Error loading token:", err); }
      }
    };
    loadToken();
  }, []);

  useEffect(() => { if (token) fetchAlbum(); }, [token]);
  useFocusEffect(useCallback(() => { loadRatings(); }, []));

  const fetchAlbum = async () => {
    if (!albumId || !token) return;
    setLoading(true);
    try {
      const res = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAlbum(data);
      setTracks(data.tracks?.items || []);
    } catch (err) { console.error("Spotify Album fetch error:", err); }
    finally { setLoading(false); }
  };

  const loadRatings = async () => {
    try {
      const stored = await AsyncStorage.getItem("songRatings");
      if (stored) setRatings(JSON.parse(stored));
    } catch (err) { console.error(err); }
  };

  const saveRating = async (songId, value) => {
    try {
      const newRatings = { ...ratings, [songId]: value };
      setRatings(newRatings);
      await AsyncStorage.setItem("songRatings", JSON.stringify(newRatings));
    } catch (err) { console.error(err); }
  };

  const renderStars = (rating, onPress) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      let iconName;
      let solid = true;
      if (rating >= i) iconName = "star";
      else if (rating >= i - 0.5) iconName = "star-half-alt";
      else { iconName = "star"; solid = false; }
      stars.push(
        <Pressable key={i} style={{ width: 32, alignItems: "center" }}
          onPress={({ nativeEvent }) => {
            const x = nativeEvent.locationX;
            const newValue = x < 16 ? i - 0.5 : i;
            onPress(newValue);
          }}
        >
          <Icon name={iconName} size={24} solid={solid} color={solid ? "#1db954" : "#888"} />
        </Pressable>
      );
    }
    return <View style={{ flexDirection: "row", alignItems: "center" }}>{stars}</View>;
  };

  const renderTrack = (item) => {
    const rating = ratings[item.id] || 0;
    return (
      <TouchableOpacity
        style={styles.songCard}
        activeOpacity={0.7}
        onPress={() => item.id && navigation.navigate("Song", { songId: item.id, token })}
      >
        <View style={styles.trackRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.songTitle}>{item.name}</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => item.artists?.[0]?.id && navigation.navigate("Artist", { artistId: item.artists[0].id, token })}>
              <Text style={styles.songArtist}>{item.artists?.map(a => a.name).join(", ")}</Text>
            </TouchableOpacity>
          </View>
          <View>{renderStars(rating, (value) => saveRating(item.id, value))}</View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading || !album) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#1db954" />;

  const ratedCount = tracks.filter(track => ratings[track.id]).length;
  const completion = tracks.length > 0 ? (ratedCount / tracks.length) * 100 : 0;

  const ListHeader = () => (
    <>
      <Image source={{ uri: album.images?.[1]?.url || album.images?.[0]?.url }} style={styles.cover} />
      <Text style={styles.title}>{album.name}</Text>
      <TouchableOpacity activeOpacity={0.7} onPress={() => album.artists?.[0]?.id && navigation.navigate("Artist", { artistId: album.artists[0].id, token })}>
        <Text style={styles.artist}>{album.artists?.map(a => a.name).join(", ")}</Text>
      </TouchableOpacity>
      <Text style={styles.release}>Released: {album.release_date}</Text>
      <Text style={styles.genre}>Genres: {album.genres?.join(", ") || "Unknown"}</Text>

      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${completion}%` }]} />
      </View>
      <Text style={styles.progressText}>
        Album Completion: {ratedCount}/{tracks.length} ({completion.toFixed(0)}%)
      </Text>

      <Text style={styles.section}>Tracks</Text>
    </>
  );

  return (
    <FlatList
      style={{ backgroundColor: "#121212" }}
      contentContainerStyle={styles.container}
      data={tracks}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => renderTrack(item)}
      ListHeaderComponent={ListHeader}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#121212" },
  cover: { width: 280, height: 280, borderRadius: 12, alignSelf: "center", marginBottom: 16 },
  title: { color: "#fff", fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 4 },
  artist: { color: "#1db954", fontSize: 18, textAlign: "center", marginBottom: 4 },
  release: { color: "#ccc", fontSize: 14, textAlign: "center", marginBottom: 2 },
  genre: { color: "#ccc", fontSize: 14, textAlign: "center", marginBottom: 12 },
  section: { color: "#fff", fontSize: 20, fontWeight: "bold", marginTop: 20, marginBottom: 8 },
  songCard: { paddingVertical: 10, borderBottomColor: "#333", borderBottomWidth: 1 },
  trackRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  songTitle: { color: "#fff", fontSize: 16 },
  songArtist: { color: "#1db954", fontSize: 14 },
  progressContainer: { width: "100%", height: 10, backgroundColor: "#333", borderRadius: 5, marginVertical: 8 },
  progressBar: { height: "100%", backgroundColor: "#1db954", borderRadius: 5 },
  progressText: { color: "#ccc", fontSize: 14, textAlign: "center", marginBottom: 10 },
});
