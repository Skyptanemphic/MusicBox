// screens/HomeScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";

export default function HomeScreen({ navigation, token }) {
  const [topTracks, setTopTracks] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [categories, setCategories] = useState([]);
  const [userPlaylists, setUserPlaylists] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchTracks, setSearchTracks] = useState([]);
  const [searchAlbums, setSearchAlbums] = useState([]);
  const [searchArtists, setSearchArtists] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch home data once
  useEffect(() => {
    if (token) fetchSpotifyData();
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
      const [tracksRes, artistsRes, newReleasesRes, categoriesRes, playlistsRes] =
        await Promise.all([
          fetch("https://api.spotify.com/v1/me/top/tracks?limit=20&time_range=short_term", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("https://api.spotify.com/v1/me/top/artists?limit=20&time_range=short_term", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("https://api.spotify.com/v1/browse/new-releases?limit=20", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("https://api.spotify.com/v1/browse/categories?limit=50", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("https://api.spotify.com/v1/me/playlists?limit=20", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

      const tracksData = await safeJson(tracksRes);
      const artistsData = await safeJson(artistsRes);
      const newReleasesData = await safeJson(newReleasesRes);
      const categoriesData = await safeJson(categoriesRes);
      const playlistsData = await safeJson(playlistsRes);

      setTopTracks((tracksData.items || []).filter((i) => i?.id));
      setTopArtists((artistsData.items || []).filter((i) => i?.id));
      setNewReleases((newReleasesData.albums?.items || []).filter((i) => i?.id));
      setCategories((categoriesData.categories?.items || []).filter((i) => i?.id && i?.name));
      setUserPlaylists((playlistsData.items || []).filter((i) => i?.id));
    } catch (e) {
      console.error("Spotify fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  // Live search as user types
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.trim()) handleSearch();
      else {
        setSearchTracks([]);
        setSearchAlbums([]);
        setSearchArtists([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !token) return;
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(
          searchQuery
        )}&type=track,album,artist&limit=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();

      setSearchTracks(data.tracks?.items || []);
      setSearchAlbums(data.albums?.items || []);
      setSearchArtists(data.artists?.items || []);
    } catch (e) {
      console.error("Search error:", e);
    } finally {
      setLoading(false);
    }
  };

  const navigate = (item, type) => {
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
  };

  const renderCard = (item, type) => (
    <TouchableOpacity style={styles.card} onPress={() => navigate(item, type)}>
      <Image
        source={{ uri: item.images?.[0]?.url || item.album?.images?.[0]?.url || item.icons?.[0]?.url || "https://via.placeholder.com/120" }}
        style={styles.image}
      />
      <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
      {(type === "track" || type === "album") && (
        <Text style={styles.subtitle} numberOfLines={1}>{item.artists?.map((a) => a.name).join(", ")}</Text>
      )}
      {type === "artist" && <Text style={styles.subtitle}>Artist</Text>}
      {type === "category" && <Text style={styles.subtitle}>{item.name}</Text>}
      {type === "playlist" && <Text style={styles.subtitle}>{item.description || "Playlist"}</Text>}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search songs, albums, artists..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          placeholderTextColor="#888"
        />
      </View>

      {loading && <ActivityIndicator size="large" color="#1DB954" style={{ marginTop: 10 }} />}

      {/* Display search results if query exists, else home sections */}
      {searchQuery.trim() ? (
        <>
          {searchTracks.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Tracks</Text>
              <FlatList
                horizontal
                data={searchTracks}
                renderItem={({ item }) => renderCard(item, "track")}
                keyExtractor={(item, index) => `search-track-${item.id}-${index}`}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ padding: 8 }}
              />
            </>
          )}
          {searchAlbums.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Albums</Text>
              <FlatList
                horizontal
                data={searchAlbums}
                renderItem={({ item }) => renderCard(item, "album")}
                keyExtractor={(item, index) => `search-album-${item.id}-${index}`}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ padding: 8 }}
              />
            </>
          )}
          {searchArtists.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Artists</Text>
              <FlatList
                horizontal
                data={searchArtists}
                renderItem={({ item }) => renderCard(item, "artist")}
                keyExtractor={(item, index) => `search-artist-${item.id}-${index}`}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ padding: 8 }}
              />
            </>
          )}
        </>
      ) : (
        <>
          {topTracks.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Top Tracks</Text>
              <FlatList
                horizontal
                data={topTracks}
                renderItem={({ item }) => renderCard(item, "track")}
                keyExtractor={(item, index) => `track-${item.id}-${index}`}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ padding: 8 }}
              />
            </>
          )}

          {topArtists.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Top Artists</Text>
              <FlatList
                horizontal
                data={topArtists}
                renderItem={({ item }) => renderCard(item, "artist")}
                keyExtractor={(item, index) => `artist-${item.id}-${index}`}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ padding: 8 }}
              />
            </>
          )}
          
          {newReleases.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>New Releases</Text>
              <FlatList
                horizontal
                data={newReleases}
                renderItem={({ item }) => renderCard(item, "album")}
                keyExtractor={(item, index) => `album-${item.id}-${index}`}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ padding: 8 }}
              />
            </>
          )}

          {categories.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Categories</Text>
              <FlatList
                horizontal
                data={categories}
                renderItem={({ item }) => renderCard(item, "category")}
                keyExtractor={(item, index) => `category-${item.id}-${index}`}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ padding: 8 }}
              />
            </>
          )}

          {userPlaylists.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Your Playlists</Text>
              <FlatList
                horizontal
                data={userPlaylists}
                renderItem={({ item }) => renderCard(item, "playlist")}
                keyExtractor={(item, index) => `playlist-${item.id}-${index}`}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ padding: 8, paddingBottom: 35 }}
              />
            </>
          )}
        </>
      )}
      
    </ScrollView>
    
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
});
