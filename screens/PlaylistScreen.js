import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Image, 
  StyleSheet, 
  Dimensions 
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");
const cardWidth = Math.round(screenWidth * 0.45);
const cardHeight = Math.round(cardWidth * 1.4);

export default function PlaylistScreen({ route, navigation }) {
  const { playlistId, token } = route.params;
  const [tracks, setTracks] = useState([]);
  const [playlistName, setPlaylistName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!playlistId || !token) return;

    const fetchPlaylist = async () => {
      try {
        // Fetch playlist details
        const playlistRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const playlistData = await playlistRes.json();

        if (playlistData.error) {
          console.warn("Error fetching playlist details:", playlistData.error);
          setError("Failed to load playlist details.");
          setPlaylistName("Playlist");
        } else {
          setPlaylistName(playlistData.name || "Playlist");
          navigation.setOptions({ title: playlistData.name || "Playlist" });
        }

        // Fetch tracks
        const tracksRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const tracksData = await tracksRes.json();

        if (tracksData.error) {
          console.warn("Error fetching playlist tracks:", tracksData.error);
          setError("Failed to load tracks.");
        } else {
          const validTracks = tracksData.items?.filter(item => item?.track?.album?.images?.length > 0) || [];
          setTracks(validTracks);
          if (!validTracks.length) setError("No tracks found in this playlist.");
        }

      } catch (err) {
        console.error("Unexpected error:", err);
        setError("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylist();
  }, [playlistId, token]);

  const renderItem = ({ item }) => {
    const track = item.track;
    const imageUrl = track.album.images?.[0]?.url;

    return (
      <TouchableOpacity
        style={[styles.card, { width: cardWidth, height: cardHeight }]}
        onPress={() => navigation.navigate("Song", { songId: track.id, token })}
      >
        {imageUrl && (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
          />
        )}
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={2}>{track.name}</Text>
          <Text style={styles.artist} numberOfLines={1}>{track.artists?.[0]?.name}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#1db954" />;
  if (error) return <View style={styles.center}><Text style={{ color: "red" }}>{error}</Text></View>;

  return (
    <FlatList
      data={tracks}
      keyExtractor={(item, index) => item?.track?.id || `track-${index}`}
      renderItem={renderItem}
      numColumns={2}
      contentContainerStyle={{ padding: 8 }}
      columnWrapperStyle={{ justifyContent: "space-between", marginBottom: 12 }}
      style={{ backgroundColor: "#121212" }}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#363333",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: cardWidth,
    borderRadius: 8,
    marginBottom: 8,
  },
  textContainer: {
    width: "100%",
    alignItems: "center",
  },
  title: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  artist: {
    color: "#aaa",
    fontSize: 12,
    textAlign: "center",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
