import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet,
  Animated
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ArtistPage({ route, navigation }) {
  const { artistId } = route.params;
  const [artist, setArtist] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [topTracks, setTopTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState({});

  useEffect(() => {
    loadRatings();
    fetchArtistData();
  }, []);

  const loadRatings = async () => {
    try {
      const stored = await AsyncStorage.getItem("songRatings");
      if (stored) setRatings(JSON.parse(stored));
    } catch (err) {
      console.error("Failed to load ratings:", err);
    }
  };

  const fetchArtistData = async () => {
    try {
      const [artistRes, albumsRes, topTracksRes] = await Promise.all([
        fetch(`https://api.deezer.com/artist/${artistId}`),
        fetch(`https://api.deezer.com/artist/${artistId}/albums`),
        fetch(`https://api.deezer.com/artist/${artistId}/top?limit=10`)
      ]);

      const artistData = await artistRes.json();
      const albumsData = await albumsRes.json();
      const topTracksData = await topTracksRes.json();

      setArtist(artistData);
      setAlbums(albumsData.data || []);
      setTopTracks((topTracksData.data || []).slice(0, 5)); // limit to 5
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getCompletionPercent = (album) => {
    const trackIds = album?.tracks?.data?.map(t => t.id) || [];
    if (!trackIds.length) return 0;

    const ratedCount = trackIds.filter(id => ratings[id]).length;
    return Math.round((ratedCount / trackIds.length) * 100);
  };

  const renderAlbum = (item) => {
    const completion = getCompletionPercent(item);
    return (
      <TouchableOpacity 
        style={styles.albumCard} 
        onPress={() => navigation.navigate("Album", { albumId: item.id })}
      >
        <Image source={{ uri: item.cover_medium }} style={styles.albumCover} />
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.progressBarBackground}>
          <Animated.View style={[styles.progressBarForeground, { width: `${completion}%` }]} />
        </View>
        <Text style={styles.completionText}>{completion}% completed</Text>
      </TouchableOpacity>
    );
  };

  const renderTrack = (item) => (
    <TouchableOpacity 
      style={styles.trackCard} 
      onPress={() => navigation.navigate("Song", { songId: item.id })}
    >
      <Image source={{ uri: item.album?.cover_medium }} style={styles.trackCover} />
      <View style={{ marginLeft: 10, flex: 1 }}>
        <Text style={styles.trackTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.trackAlbum} numberOfLines={1}>{item.album?.title}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading || !artist) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#1db954" />;

  return (
    <FlatList
        style={{ backgroundColor: "#121212" }}
        contentContainerStyle={styles.container}
        data={topTracks}
        keyExtractor={(item) => `track-${item.id}`}
        renderItem={({ item }) => renderTrack(item)}
        ListHeaderComponent={
        <>
            <Image source={{ uri: artist.picture_medium }} style={styles.artistCover} />
            <Text style={styles.artistName}>{artist.name}</Text>
            <Text style={styles.artistInfo}>Fans: {artist.nb_fan?.toLocaleString()}</Text>

            {/* Top Tracks Header */}
            <Text style={styles.section}>Top Tracks</Text>
        </>
      }
      ListFooterComponent={
        <>
          {/* Albums Section */}
          <Text style={styles.section}>Albums</Text>
          <FlatList
            data={albums}
            keyExtractor={(item) => `album-${item.id}`}
            renderItem={({ item }) => renderAlbum(item)}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 8 }}
          />
        </>
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#121212" },
  artistCover: { width: 180, height: 180, borderRadius: 90, alignSelf: "center", marginBottom: 12 },
  artistName: { color: "#fff", fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 4 },
  artistInfo: { color: "#aaa", fontSize: 16, textAlign: "center", marginBottom: 16 },
  section: { color: "#fff", fontSize: 22, fontWeight: "bold", marginTop: 16, marginBottom: 8 },

  albumCard: { marginRight: 12, width: 140, alignItems: "center" },
  albumCover: { width: 140, height: 140, borderRadius: 8, marginBottom: 6 },
  cardTitle: { color: "#fff", fontSize: 14, textAlign: "center", marginBottom: 4 },
  progressBarBackground: { width: "100%", height: 6, backgroundColor: "#333", borderRadius: 3 },
  progressBarForeground: { height: 6, backgroundColor: "#1db954", borderRadius: 3 },
  completionText: { color: "#aaa", fontSize: 12, marginTop: 2 },

  trackCard: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomColor: "#333", borderBottomWidth: 1 },
  trackCover: { width: 60, height: 60, borderRadius: 6 },
  trackTitle: { color: "#fff", fontSize: 16 },
  trackAlbum: { color: "#aaa", fontSize: 12 },
});
