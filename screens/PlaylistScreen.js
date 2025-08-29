import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: screenWidth } = Dimensions.get("window");
const cardWidth = Math.floor(screenWidth / 3) - 16; // 👈 3 columns with spacing

export default function PlaylistScreen({ route, navigation }) {
  const { playlistId, token } = route.params;
  const [tracks, setTracks] = useState([]);
  const [playlistName, setPlaylistName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!playlistId || !token) return;

    const fetchPlaylist = async () => {
      try {
        // Fetch playlist details
        const playlistRes = await fetch(
          `https://api.spotify.com/v1/playlists/${playlistId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const playlistData = await playlistRes.json();

        if (playlistData.error) {
          console.warn("Error fetching playlist details:", playlistData.error);
          setError("Failed to load playlist details.");
          setPlaylistName("Playlist");
        } else {
          setPlaylistName(playlistData.name || "Playlist");
          navigation.setOptions({ title: playlistData.name || "Playlist" });
        }

        // Fetch playlist tracks
        const tracksRes = await fetch(
          `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const tracksData = await tracksRes.json();

        if (tracksData.error) {
          console.warn("Error fetching playlist tracks:", tracksData.error);
          setError("Failed to load tracks.");
        } else {
          const validTracks =
            tracksData.items?.filter(
              (item) => item?.track?.album?.images?.length > 0
            ) || [];
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
        style={styles.card}
        onPress={() => navigation.navigate("Song", { songId: track.id, token })}
      >
        <Image
          source={{
            uri: imageUrl || "https://via.placeholder.com/120",
          }}
          style={styles.image}
        />
        <Text style={styles.title} numberOfLines={1}>
          {track.name}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {track.artists?.map((a) => a.name).join(", ")}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading)
    return <ActivityIndicator style={{ flex: 1 }} size="large" color="#1db954" />;
  if (error)
    return (
      <View style={styles.center}>
        <Text style={{ color: "red" }}>{error}</Text>
      </View>
    );

  return (
    <FlatList
      data={tracks}
      keyExtractor={(item, index) => item?.track?.id || `track-${index}`}
      renderItem={renderItem}
      numColumns={3} // 👈 now 3 columns
      contentContainerStyle={{
        padding: 12,
        paddingBottom: insets.bottom + 40, // 👈 safe space at bottom
      }}
      columnWrapperStyle={{
        justifyContent: "space-between",
        marginBottom: 20,
      }}
      style={{ backgroundColor: "#121212" }}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    width: cardWidth,
    alignItems: "center",
  },
  image: {
    width: cardWidth - 10,
    height: cardWidth - 10,
    borderRadius: 8,
  },
  title: {
    color: "#fff",
    marginTop: 5,
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    color: "#aaa",
    fontSize: 11,
    textAlign: "center",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
