import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");

export default function HomeScreen({ navigation, token }) {
  const [topTracks, setTopTracks] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featuredPlaylists, setFeaturedPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const cardWidth = Math.round(screenWidth * 0.4);
  const cardHeight = Math.round(cardWidth * 1.5);

  useEffect(() => {
    if (!token) return;
    fetchSpotifyData();
  }, [token]);

  const safeJson = async (res) => {
    try {
      const text = await res.text();
      return text ? JSON.parse(text) : {};
    } catch {
      return {};
    }
  };

  const fetchSpotifyData = async () => {
    setLoading(true);
    try {
      const [tracksRes, artistsRes, newReleasesRes, categoriesRes, featuredRes] = await Promise.all([
        fetch("https://api.spotify.com/v1/me/top/tracks?limit=20", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("https://api.spotify.com/v1/me/top/artists?limit=20", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("https://api.spotify.com/v1/browse/new-releases?limit=20", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("https://api.spotify.com/v1/browse/categories?limit=50", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("https://api.spotify.com/v1/browse/featured-playlists?limit=20", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const tracksData = await safeJson(tracksRes);
      const artistsData = await safeJson(artistsRes);
      const newReleasesData = await safeJson(newReleasesRes);
      const categoriesData = await safeJson(categoriesRes);
      const featuredData = await safeJson(featuredRes);

      const validCategories = categoriesData.categories?.items?.filter(cat => cat && cat.id && cat.name) || [];

      setTopTracks((tracksData.items || []).filter(item => item && item.id));
      setTopArtists((artistsData.items || []).filter(item => item && item.id));
      setNewReleases((newReleasesData.albums?.items || []).filter(item => item && item.id));
      setCategories(validCategories);
      setFeaturedPlaylists((featuredData.playlists?.items || []).filter(item => item && item.id));
    } catch (err) {
      console.error("Spotify fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSpotifyData();
    setRefreshing(false);
  }, [token]);

  const handleSearch = async (query) => {
    if (!query) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track,artist,album,playlist&limit=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await safeJson(res);
      const results = [
        ...(data.tracks?.items || []),
        ...(data.artists?.items || []),
        ...(data.albums?.items || []),
        ...(data.playlists?.items || []),
      ].filter(item => item && item.id);
      setSearchResults(results);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderCard = React.useCallback((item, type) => {
    let title = item.name;
    let subtitle = null;
    let imageUrl = null;

    switch (type) {
      case "track":
        subtitle = item.artists?.[0]?.name;
        imageUrl = item.album?.images?.[0]?.url;
        break;
      case "artist":
        imageUrl = item.images?.[0]?.url;
        break;
      case "album":
        subtitle = item.artists?.[0]?.name;
        imageUrl = item.images?.[0]?.url;
        break;
      case "category":
        imageUrl = item.icons?.[0]?.url;
        break;
      case "playlist":
        subtitle = item.description || "";
        imageUrl = item.images?.[0]?.url;
        break;
    }

    return (
      <TouchableOpacity
        style={[styles.card, { width: cardWidth, height: cardHeight }]}
        onPress={() => {
          switch (type) {
            case "track":
              navigation.navigate("Song", { songId: item.id, token });
              break;
            case "artist":
              navigation.navigate("Artist", { artistId: item.id, token });
              break;
            case "album":
              navigation.navigate("Album", { albumId: item.id, token });
              break;
            case "category":
              navigation.navigate("CategoryPlaylists", { categoryId: item.id, categoryName: item.name, token });
              break;
            case "playlist":
              navigation.navigate("Playlist", { playlistId: item.id, playlistName: item.name, token });
              break;
          }
        }}
      >
        {imageUrl && (
          <Image
            source={{ uri: imageUrl }}
            style={{ width: cardWidth - 16, height: cardWidth - 16, borderRadius: 8, marginBottom: 8 }}
          />
        )}
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={2}>{title}</Text>
          {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
        </View>
      </TouchableOpacity>
    );
  }, [cardWidth, cardHeight, navigation, token]);

  if (loading && !refreshing) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#1db954" />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search tracks, artists, albums..."
          placeholderTextColor="#888"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          onSubmitEditing={() => handleSearch(searchQuery)}
        />
      </View>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {searchQuery ? (
          <>
            <Text style={styles.section}>Search Results</Text>
            <FlatList
              horizontal
              data={searchResults}
              renderItem={({ item }) => renderCard(item, item.type || "track")}
              keyExtractor={(item, index) => `search-${item?.id || index}`}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ padding: 8 }}
              initialNumToRender={5}
            />
          </>
        ) : (
          <>
            <Text style={styles.section}>Top Tracks</Text>
            <FlatList
              horizontal
              data={topTracks}
              renderItem={({ item }) => renderCard(item, "track")}
              keyExtractor={(item, index) => `track-${item?.id || index}`}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ padding: 8 }}
              initialNumToRender={5}
            />

            <Text style={styles.section}>Top Artists</Text>
            <FlatList
              horizontal
              data={topArtists}
              renderItem={({ item }) => renderCard(item, "artist")}
              keyExtractor={(item, index) => `artist-${item?.id || index}`}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ padding: 8 }}
              initialNumToRender={5}
            />

            <Text style={styles.section}>New Releases</Text>
            <FlatList
              horizontal
              data={newReleases}
              renderItem={({ item }) => renderCard(item, "album")}
              keyExtractor={(item, index) => `album-${item?.id || index}`}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ padding: 8 }}
              initialNumToRender={5}
            />

            <Text style={styles.section}>Categories</Text>
            <FlatList
              horizontal
              data={categories}
              renderItem={({ item }) => renderCard(item, "category")}
              keyExtractor={(item, index) => `category-${item?.id || index}`}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ padding: 8 }}
              initialNumToRender={5}
            />

            <Text style={styles.section}>Featured Playlists</Text>
            <FlatList
              horizontal
              data={featuredPlaylists}
              renderItem={({ item }) => renderCard(item, "playlist")}
              keyExtractor={(item, index) => `playlist-${item?.id || index}`}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ padding: 8 }}
              initialNumToRender={5}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#121212" },
  container: { flex: 1 },
  section: { color: "#fff", fontSize: 20, fontWeight: "bold", marginLeft: 8, marginVertical: 8 },
  card: { marginRight: 12, backgroundColor: "#363333ff", borderRadius: 8, padding: 8, alignItems: "center" },
  textContainer: { width: "100%", alignItems: "center" },
  title: { color: "#fff", fontWeight: "bold", textAlign: "center" },
  subtitle: { color: "#aaa", fontSize: 12, textAlign: "center" },
  searchContainer: { padding: 8 },
  searchInput: { backgroundColor: "#1e1e1e", color: "#fff", borderRadius: 8, paddingHorizontal: 12, height: 40 },
});
