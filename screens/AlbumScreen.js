import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, StyleSheet, Pressable } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import Icon from "react-native-vector-icons/FontAwesome5";

export default function AlbumScreen({ route, navigation }) {
  const { albumId, token: routeToken } = route.params;
  const [album, setAlbum] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState({}); // { songId: { sum, count } }
  const [token, setToken] = useState(routeToken || null);

  // Fetch Spotify token
  useEffect(() => { if (routeToken) setToken(routeToken); }, [routeToken]);

  // Fetch album details
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
  useEffect(() => { if (token) fetchAlbum(); }, [token]);

  // Listen for global Firestore ratings
  useFocusEffect(useCallback(() => {
    const unsubscribes = tracks.map(track =>
      onSnapshot(collection(db, "songRatings", track.id, "ratings"), snapshot => {
        let sum = 0, count = 0;
        snapshot.docs.forEach(doc => {
          const r = doc.data().rating;
          if (r != null) { sum += r; count += 1; }
        });
        setRatings(prev => ({ ...prev, [track.id]: { sum, count } }));
      })
    );
    return () => unsubscribes.forEach(u => u());
  }, [tracks]));

  // Render stars (supports half-stars)
  const renderStars = (rating, size = 24) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      let iconName, solid = true;
      if (rating >= i) iconName = "star";
      else if (rating >= i - 0.5) iconName = "star-half-alt";
      else { iconName = "star"; solid = false; }
      stars.push(
        <Pressable key={i} style={{ width: size + 8, alignItems: "center" }}>
          <Icon name={iconName} size={size} solid={solid} color={solid ? "#1db954" : "#888"} />
        </Pressable>
      );
    }
    return <View style={{ flexDirection: "row", alignItems: "center" }}>{stars}</View>;
  };

  const renderTrack = (item) => {
    const ratingData = ratings[item.id] || { sum: 0, count: 0 };
    const avgRating = ratingData.count ? ratingData.sum / ratingData.count : 0;

    return (
      <TouchableOpacity
        style={styles.songCard}
        activeOpacity={0.7}
        onPress={() => item.id && navigation.navigate("Song", { songId: item.id, token })}
      >
        <View style={styles.trackRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.songTitle}>{item.name}</Text>
            <TouchableOpacity onPress={() => item.artists?.[0]?.id && navigation.navigate("Artist", { artistId: item.artists[0].id, token })}>
              <Text style={styles.songArtist}>{item.artists?.map(a => a.name).join(", ")}</Text>
            </TouchableOpacity>
          </View>
          <View>{renderStars(avgRating)}</View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading || !album) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#1db954" />;

  const ratedTracks = tracks.filter(track => (ratings[track.id]?.count || 0) > 0);
  const completion = tracks.length > 0 ? (ratedTracks.length / tracks.length) * 100 : 0;
  const albumAvgRating = ratedTracks.length
    ? ratedTracks.reduce((sum, track) => sum + (ratings[track.id].sum / ratings[track.id].count), 0) / ratedTracks.length
    : 0;

  const ListHeader = () => (
    <>
      <Image source={{ uri: album.images?.[1]?.url || album.images?.[0]?.url }} style={styles.cover} />
      <Text style={styles.title}>{album.name}</Text>
      <TouchableOpacity onPress={() => album.artists?.[0]?.id && navigation.navigate("Artist", { artistId: album.artists[0].id, token })}>
        <Text style={styles.artist}>{album.artists?.map(a => a.name).join(", ")}</Text>
      </TouchableOpacity>
      <Text style={styles.release}>Released: {album.release_date}</Text>
      <Text style={styles.genre}>Genres: {album.genres?.join(", ") || "Unknown"}</Text>

      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${completion}%` }]} />
      </View>
      <Text style={styles.progressText}>
        Album Completion: {ratedTracks.length}/{tracks.length} ({completion.toFixed(0)}%)
      </Text>

      {ratedTracks.length > 0 && (
        <Text style={styles.albumAvgRating}>
          Album Average Rating: {albumAvgRating.toFixed(2)} / 5 ({ratedTracks.length} rated)
        </Text>
      )}

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
  progressText: { color: "#ccc", fontSize: 14, textAlign: "center", marginBottom: 4 },
  albumAvgRating: { color: "#ccc", fontSize: 14, textAlign: "center", marginBottom: 10 },
});
