import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Button,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width: screenWidth } = Dimensions.get("window");

export default function HomeScreen({ navigation }) {
  const [mostListenedSongs, setMostListenedSongs] = useState([]);
  const [mostListenedAlbums, setMostListenedAlbums] = useState([]);
  const [mostListenedArtists, setMostListenedArtists] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [recentlyRated, setRecentlyRated] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);

  const cardWidth = Math.round(screenWidth * 0.4);
  const cardHeight = Math.round(cardWidth * 1.5);

  useEffect(() => {
    fetchCharts();
    loadRecentlyRated();
  }, []);

  const fetchCharts = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tracksRes, albumsRes, artistsRes, releasesRes] = await Promise.all([
        fetch("https://api.deezer.com/chart/0/tracks"),
        fetch("https://api.deezer.com/chart/0/albums"),
        fetch("https://api.deezer.com/chart/0/artists"),
        fetch("https://api.deezer.com/editorial/0/releases"),
      ]);
      const tracksData = await tracksRes.json();
      const albumsData = await albumsRes.json();
      const artistsData = await artistsRes.json();
      const releasesData = await releasesRes.json();

      setMostListenedSongs(tracksData.data || []);
      setMostListenedAlbums(albumsData.data || []);
      setMostListenedArtists(artistsData.data || []);
      setNewReleases(releasesData.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch charts.");
    } finally {
      setLoading(false);
    }
  };

  const loadRecentlyRated = async () => {
    try {
      const stored = await AsyncStorage.getItem("recentRatings");
      if (stored) setRecentlyRated(JSON.parse(stored).slice(-20).reverse());
    } catch (err) {
      console.error("Failed to load recently rated:", err);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm) return;
    setLoading(true);
    setSearching(true);
    setError(null);
    try {
      const res = await fetch(
        `https://api.deezer.com/search?q=${encodeURIComponent(searchTerm)}`
      );
      const data = await res.json();
      setSearchResults(data.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch search results.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    setSearching(false);
    setSearchTerm("");
    setSearchResults([]);
  };

  const renderItem = (item, isSong = false, isArtist = false) => {
    const title = isArtist ? item.name : item.title;
    const artist = isArtist ? "" : item.artist?.name || "Unknown Artist";
    const artwork = isArtist
      ? item.picture_medium
      : isSong
      ? item.album?.cover_medium
      : item.cover_medium;

    return (
      <TouchableOpacity
        style={[styles.card, { width: cardWidth, height: cardHeight }]}
        onPress={() => {
          if (isSong) navigation.navigate("Song", { songId: item.id });
          else if (isArtist) navigation.navigate("Artist", { artistId: item.id });
          else navigation.navigate("Album", { albumId: item.id });
        }}
      >
        <Image
          source={{ uri: artwork }}
          style={{
            width: cardWidth - 16,
            height: cardWidth - 16,
            borderRadius: 8,
            marginBottom: 8,
          }}
        />
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {artist ? <Text style={styles.artist} numberOfLines={1}>{artist}</Text> : null}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading)
    return <ActivityIndicator size="large" style={{ flex: 1 }} color="#1db954" />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      {/* Minimal Header: only Search Bar */}
      <View
        style={{
          paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
          paddingHorizontal: 16,
          backgroundColor: "#121212",
          zIndex: 1,
        }}
      >
        <TextInput
          style={styles.searchInput}
          placeholder="Search artist, album, or song"
          placeholderTextColor="#aaa"
          value={searchTerm}
          onChangeText={setSearchTerm}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
      </View>

      <ScrollView style={styles.container}>
        {error && <Text style={{ color: "red", margin: 8 }}>{error}</Text>}

        {searching ? (
          <>
            <Text style={styles.section}>Search Results</Text>
            <FlatList
              horizontal
              nestedScrollEnabled
              data={searchResults}
              renderItem={({ item }) =>
                renderItem(item, item.type === "track", item.type === "artist")
              }
              keyExtractor={(item) => `${item.type}-${item.id}`}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ padding: 8 }}
            />
            <Button title="Go Back" onPress={handleGoBack} color="#1db954" />
          </>
        ) : (
          <>
            <Text style={styles.section}>Most Listened Songs</Text>
            <FlatList
              horizontal
              nestedScrollEnabled
              data={mostListenedSongs}
              renderItem={({ item }) => renderItem(item, true)}
              keyExtractor={(item) => `song-${item.id}`}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ padding: 8 }}
            />

            <Text style={styles.section}>Most Listened Albums</Text>
            <FlatList
              horizontal
              nestedScrollEnabled
              data={mostListenedAlbums}
              renderItem={({ item }) => renderItem(item, false)}
              keyExtractor={(item) => `album-${item.id}`}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ padding: 8 }}
            />

            <Text style={styles.section}>Most Listened Artists</Text>
            <FlatList
              horizontal
              nestedScrollEnabled
              data={mostListenedArtists}
              renderItem={({ item }) => renderItem(item, false, true)}
              keyExtractor={(item) => `artist-${item.id}`}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ padding: 8 }}
            />

            <Text style={styles.section}>New Releases</Text>
            <FlatList
              horizontal
              nestedScrollEnabled
              data={newReleases}
              renderItem={({ item }) => renderItem(item, false)}
              keyExtractor={(item) => `release-${item.id}`}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ padding: 8 }}
            />

            {recentlyRated.length > 0 && (
              <>
                <Text style={styles.section}>Recently Rated</Text>
                <FlatList
                  horizontal
                  nestedScrollEnabled
                  data={recentlyRated}
                  renderItem={({ item }) => renderItem(item, true)}
                  keyExtractor={({ id }) => `recent-${id}`}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ padding: 8 }}
                />
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#121212" },
  container: { flex: 1, backgroundColor: "#121212" },
  searchInput: {
    backgroundColor: "#1e1e1e",
    color: "#fff",
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  section: { color: "#fff", fontSize: 20, fontWeight: "bold", marginLeft: 8, marginVertical: 8 },
  card: {
    marginRight: 12,
    backgroundColor: "#363333ff",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
  },
  textContainer: { width: "100%", alignItems: "center" },
  title: { color: "#fff", fontWeight: "bold", textAlign: "center" },
  artist: { color: "#aaa", fontSize: 12, textAlign: "center" },
});
