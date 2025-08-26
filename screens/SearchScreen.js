import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

export default function SearchScreen({ token, navigation }) {
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search automatically as the user types
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.trim()) handleSearch(0);
      else {
        setTracks([]);
        setAlbums([]);
        setArtists([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleSearch = async (offset = 0) => {
    if (!query.trim() || !token) return;
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(
          query
        )}&type=track,album,artist&limit=10&offset=${offset}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();

      if (data.tracks)
        setTracks(offset === 0 ? data.tracks.items : [...tracks, ...data.tracks.items]);
      if (data.albums)
        setAlbums(offset === 0 ? data.albums.items : [...albums, ...data.albums.items]);
      if (data.artists)
        setArtists(offset === 0 ? data.artists.items : [...artists, ...data.artists.items]);
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToTrack = (songId) => {
    navigation.getParent()?.navigate("Song", { songId, token });
  };

  const navigateToAlbum = (albumId) => {
    navigation.getParent()?.navigate("Album", { albumId, token });
  };

  const navigateToArtist = (artistId) => {
    navigation.getParent()?.navigate("Artist", { artistId, token });
  };

  const renderCard = (item, type) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        if (type === "track") navigateToTrack(item.id);
        if (type === "album") navigateToAlbum(item.id);
        if (type === "artist") navigateToArtist(item.id);
      }}
    >
      <Image
        source={{ uri: item.images?.[0]?.url || item.album?.images?.[0]?.url }}
        style={styles.image}
      />
      <Text style={styles.title} numberOfLines={1}>
        {item.name}
      </Text>
      {(type === "track" || type === "album") && (
        <Text style={styles.subtitle} numberOfLines={1}>
          {item.artists?.map((a) => a.name).join(", ")}
        </Text>
      )}
      {type === "artist" && <Text style={styles.subtitle}>Artist</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search songs, albums, artists..."
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          placeholderTextColor="#888"
        />
      </View>

      {loading && <ActivityIndicator size="large" color="#1DB954" style={{ marginTop: 10 }} />}

      {/* Tracks */}
      {tracks.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Tracks</Text>
          <FlatList
            horizontal
            data={tracks}
            renderItem={({ item }) => renderCard(item, "track")}
            keyExtractor={(item, index) => `track-${item.id}-${index}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ padding: 8 }}
            ListFooterComponent={() =>
              tracks.length > 0 && (
                <TouchableOpacity style={styles.loadMore} onPress={() => handleSearch(tracks.length)}>
                  <Text style={styles.loadMoreText}>Load more</Text>
                </TouchableOpacity>
              )
            }
          />
        </>
      )}

      {/* Albums */}
      {albums.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Albums</Text>
          <FlatList
            horizontal
            data={albums}
            renderItem={({ item }) => renderCard(item, "album")}
            keyExtractor={(item, index) => `album-${item.id}-${index}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ padding: 8 }}
            ListFooterComponent={() =>
              albums.length > 0 && (
                <TouchableOpacity style={styles.loadMore} onPress={() => handleSearch(albums.length)}>
                  <Text style={styles.loadMoreText}>Load more</Text>
                </TouchableOpacity>
              )
            }
          />
        </>
      )}

      {/* Artists */}
      {artists.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Artists</Text>
          <FlatList
            horizontal
            data={artists}
            renderItem={({ item }) => renderCard(item, "artist")}
            keyExtractor={(item, index) => `artist-${item.id}-${index}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ padding: 8 }}
            ListFooterComponent={() =>
              artists.length > 0 && (
                <TouchableOpacity style={styles.loadMore} onPress={() => handleSearch(artists.length)}>
                  <Text style={styles.loadMoreText}>Load more</Text>
                </TouchableOpacity>
              )
            }
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212", paddingTop: 40 },
  searchContainer: { flexDirection: "row", padding: 10 },
  searchInput: { flex: 1, backgroundColor: "#282828", color: "#fff", padding: 10, borderRadius: 8 },
  sectionTitle: { color: "#fff", fontSize: 18, fontWeight: "bold", marginTop: 20, marginLeft: 10 },
  card: { width: 140, marginRight: 12, alignItems: "center" },
  image: { width: 120, height: 120, borderRadius: 8 },
  title: { color: "#fff", marginTop: 5, fontSize: 14, fontWeight: "bold", textAlign: "center" },
  subtitle: { color: "#aaa", fontSize: 12, textAlign: "center" },
  loadMore: { justifyContent: "center", alignItems: "center", padding: 10 },
  loadMoreText: { color: "#1DB954", fontWeight: "bold" },
});
