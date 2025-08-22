import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";

export default function AlbumScreen({ route, navigation }) {
  const { albumId } = route.params;
  const [album, setAlbum] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlbum();
  }, []);

  const fetchAlbum = async () => {
    try {
      const res = await fetch(`https://api.deezer.com/album/${albumId}`);
      const data = await res.json();
      setAlbum(data);
      setTracks(data.tracks?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = (item) => (
    <TouchableOpacity
      style={styles.songCard}
      onPress={() => navigation.navigate("SongScreen", { songId: item.id })}
    >
      <Text style={styles.songTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  if (loading || !album) return <ActivityIndicator style={{ flex: 1 }} size="large" />;

  return (
    <View style={styles.container}>
      <Image source={{ uri: album.cover_medium }} style={styles.cover} />
      <Text style={styles.title}>{album.title}</Text>
      <Text style={styles.artist}>{album.artist?.name}</Text>

      <Text style={styles.section}>Tracks</Text>
      <FlatList
        data={tracks}
        keyExtractor={(item) => `${item.id}`}
        renderItem={({ item }) => renderItem(item)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212", padding: 16 },
  cover: { width: 250, height: 250, borderRadius: 12, alignSelf: "center", marginBottom: 16 },
  title: { color: "#fff", fontSize: 22, fontWeight: "bold", textAlign: "center" },
  artist: { color: "#aaa", fontSize: 18, textAlign: "center", marginBottom: 16 },
  section: { color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 8 },
  songCard: { paddingVertical: 8, borderBottomColor: "#333", borderBottomWidth: 1 },
  songTitle: { color: "#fff", fontSize: 16 },
});
