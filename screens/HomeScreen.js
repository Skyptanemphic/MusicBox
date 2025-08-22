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
  Button,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width: screenWidth } = Dimensions.get("window");

export default function HomeScreen({ navigation }) {
  const [mostListened, setMostListened] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [songs, setSongs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [ratings, setRatings] = useState({});

  const cardWidth = Math.round(screenWidth * 0.4);
  const cardHeight = Math.round(cardWidth * 1.5);

  useEffect(() => {
    fetchCharts();
    loadRatings();
  }, []);

  const loadRatings = async () => {
    try {
      const stored = await AsyncStorage.getItem("songRatings");
      if (stored) setRatings(JSON.parse(stored));
    } catch (err) {
      console.error("Failed to load ratings:", err);
    }
  };

  const saveRating = async (songId, value) => {
    try {
      const newRatings = { ...ratings, [songId]: value };
      setRatings(newRatings);
      await AsyncStorage.setItem("songRatings", JSON.stringify(newRatings));
    } catch (err) {
      console.error("Failed to save rating:", err);
    }
  };

  const fetchCharts = async () => {
    setLoading(true);
    setError(null);
    try {
      const [mostRes, songsRes, newRes] = await Promise.all([
        fetch("https://api.deezer.com/chart/0/albums"),
        fetch("https://api.deezer.com/chart/0/tracks"),
        fetch("https://api.deezer.com/editorial/0/releases"),
      ]);
      const mostData = await mostRes.json();
      const songsData = await songsRes.json();
      const newData = await newRes.json();

      setMostListened(mostData.data || []);
      setSongs(songsData.data || []);
      setNewReleases(newData.data || []);
    } catch (err) {
      console.error("Error fetching charts:", err);
      setError("Failed to fetch charts. Please try again later.");
    } finally {
      setLoading(false);
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
      console.error("Error searching Deezer:", err);
      setError("Failed to fetch search results. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    setSearching(false);
    setSearchTerm("");
    setSearchResults([]);
  };

  const renderItem = (item, isSong = false) => {
    const title = item.title;
    const artist = isSong ? item.artist?.name : item.artist?.name || "Unknown Artist";
    const artwork = isSong ? item.album?.cover_medium : item.cover_medium;

    return (
      <TouchableOpacity
        style={[styles.card, { width: cardWidth, height: cardHeight }]}
        onPress={() => {
          if (isSong) {
            navigation.navigate("Song", { songId: item.id });
          } else {
            navigation.navigate("Album", { albumId: item.id, albumName: item.title });
          }
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
          <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
            {title}
          </Text>
          <Text style={styles.artist} numberOfLines={1} ellipsizeMode="tail">
            {artist}
          </Text>
        </View>
        {isSong && (
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={`${item.id}-${star}`} onPress={() => saveRating(item.id, star)}>
                <Text style={{ color: ratings[item.id] >= star ? "#1db954" : "#888", fontSize: 18 }}>★</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: "center" }} />;
  }

  const listProps = {
    horizontal: true,
    showsHorizontalScrollIndicator: false,
    contentContainerStyle: { paddingHorizontal: 8, paddingBottom: 16 },
  };

  return (
    <ScrollView style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search artist, album, or song"
        placeholderTextColor="#aaa"
        value={searchTerm}
        onChangeText={setSearchTerm}
        onSubmitEditing={handleSearch}
        returnKeyType="search"
      />

      {error && <Text style={{ color: "red", marginVertical: 8 }}>{error}</Text>}

      {searching ? (
        <>
          <Text style={styles.section}>Search Results</Text>
          <FlatList
            {...listProps}
            data={searchResults}
            renderItem={({ item }) => renderItem(item, item.type === "track")}
            keyExtractor={(item) => `${item.type}-${item.id}`}
          />
          <Button title="Go Back" onPress={handleGoBack} color="#1db954" />
        </>
      ) : (
        <>
          <View style={styles.sectionContainer}>
            <Text style={styles.section}>Most Listened This Week</Text>
            <FlatList
              {...listProps}
              data={mostListened}
              renderItem={({ item }) => renderItem(item, false)}
              keyExtractor={(item) => `most-${item.id}`}
            />
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.section}>Trending Songs</Text>
            <FlatList
              {...listProps}
              data={songs}
              renderItem={({ item }) => renderItem(item, true)}
              keyExtractor={(item) => `song-${item.id}`}
            />
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.section}>New Releases</Text>
            <FlatList
              {...listProps}
              data={newReleases}
              renderItem={({ item }) => renderItem(item, false)}
              keyExtractor={(item) => `new-${item.id}`}
            />
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  searchInput: {
    backgroundColor: "#1e1e1e",
    color: "#fff",
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    marginHorizontal: 8,
  },
  section: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    marginLeft: 8,
  },
  sectionContainer: {
    marginBottom: 32, // more vertical spacing between sections
  },
  card: {
    marginRight: 12,
    backgroundColor: "#363333ff",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
    justifyContent: "space-between",
  },
  textContainer: {
    width: "100%",
    alignItems: "center",
  },
  title: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    flexShrink: 1,
  },
  artist: {
    color: "#aaa",
    fontSize: 12,
    textAlign: "center",
    flexShrink: 1,
  },
  ratingRow: {
    flexDirection: "row",
    marginTop: 4,
  },
});
