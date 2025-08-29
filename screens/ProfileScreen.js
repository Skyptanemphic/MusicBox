import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  Image,
} from "react-native";
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";

export default function ProfileScreen({ token }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null);
  const [selectionType, setSelectionType] = useState("track"); // "track" or "album"

  const favoriteSlots = 5;

  useEffect(() => {
    const fetchProfileAndReviews = async () => {
      if (!auth.currentUser) {
        setError("User not logged in.");
        setLoading(false);
        return;
      }
      try {
        const uid = auth.currentUser.uid;
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          setError("Profile not found.");
          return;
        }
        const profileData = userSnap.data();

        // Fetch last 10 reviews from a subcollection "reviews"
        const reviewsRef = collection(db, "users", uid, "reviews");
        const reviewsQuery = query(reviewsRef, orderBy("createdAt", "desc"), limit(10));
        const reviewsSnap = await getDocs(reviewsQuery);
        const recentReviews = reviewsSnap.docs.map(doc => doc.data());

        setProfile({ ...profileData, recentReviews });
      } catch (err) {
        console.error("Failed to fetch profile info:", err);
        setError("Failed to fetch profile info.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfileAndReviews();
  }, []);

  const handleSearch = async (query) => {
    if (!query.trim() || !token) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(
          query
        )}&type=${selectionType}&limit=50`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setSearchResults(
        selectionType === "track" ? data.tracks?.items || [] : data.albums?.items || []
      );
    } catch (err) {
      console.error("Spotify search failed:", err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const selectItemForSlot = async (item) => {
    if (!profile || activeSlot === null) return;

    const uid = auth.currentUser.uid;
    try {
      setUpdating(true);

      if (selectionType === "track") {
        const favorites = profile.favorites || Array(favoriteSlots).fill(null);
        const newFavorites = [...favorites];
        newFavorites[activeSlot] = {
          id: item.id,
          title: item.name,
          artist: item.artists?.map(a => a.name).join(", "),
          imageUrl: item.album?.images?.[0]?.url || null,
        };
        setProfile({ ...profile, favorites: newFavorites });
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, { favorites: newFavorites.map(f => f || null) });
      } else {
        const albums = profile.albums || Array(favoriteSlots).fill(null);
        const newAlbums = [...albums];
        newAlbums[activeSlot] = {
          id: item.id,
          title: item.name,
          artist: item.artists?.map(a => a.name).join(", "),
          imageUrl: item.images?.[0]?.url || null,
        };
        setProfile({ ...profile, albums: newAlbums });
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, { albums: newAlbums.map(a => a || null) });
      }
    } catch (err) {
      console.error("Failed to update favorites:", err);
    } finally {
      setUpdating(false);
      setModalVisible(false);
      setSearchText("");
      setSearchResults([]);
      setActiveSlot(null);
    }
  };

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} />;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.title}>Profile</Text>

        {/* Basic Info */}
        <View style={styles.infoBox}>
          <Text style={styles.label}>Username:</Text>
          <Text style={styles.value}>{profile.username || "Unknown"}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{auth.currentUser.email}</Text>
        </View>

        {/* Favorite Songs */}
        <View style={{ marginTop: 24 }}>
          <Text style={styles.sectionTitle}>Favorite Songs</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            {Array.from({ length: favoriteSlots }).map((_, idx) => {
              const song = profile.favorites?.[idx] || null;
              return (
                <TouchableOpacity
                  key={idx}
                  style={styles.trackCard}
                  onPress={() => {
                    setActiveSlot(idx);
                    setSelectionType("track");
                    setModalVisible(true);
                  }}
                >
                  {song ? (
                    <>
                      {song.imageUrl && <Image source={{ uri: song.imageUrl }} style={styles.trackImage} />}
                      <Text style={styles.trackTitle} numberOfLines={1}>{song.title}</Text>
                      <Text style={styles.trackArtist} numberOfLines={1}>{song.artist}</Text>
                    </>
                  ) : (
                    <View style={styles.emptyTrack}>
                      <Text style={{ color: "#888", fontSize: 32 }}>+</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Favorite Albums */}
        <View style={{ marginTop: 24 }}>
          <Text style={styles.sectionTitle}>Favorite Albums</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            {Array.from({ length: favoriteSlots }).map((_, idx) => {
              const album = profile.albums?.[idx] || null;
              return (
                <TouchableOpacity
                  key={idx}
                  style={styles.trackCard}
                  onPress={() => {
                    setActiveSlot(idx);
                    setSelectionType("album");
                    setModalVisible(true);
                  }}
                >
                  {album ? (
                    <>
                      {album.imageUrl && <Image source={{ uri: album.imageUrl }} style={styles.trackImage} />}
                      <Text style={styles.trackTitle} numberOfLines={1}>{album.title}</Text>
                      <Text style={styles.trackArtist} numberOfLines={1}>{album.artist}</Text>
                    </>
                  ) : (
                    <View style={styles.emptyTrack}>
                      <Text style={{ color: "#888", fontSize: 32 }}>+</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Last 10 Reviews */}
        {profile.recentReviews?.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <Text style={styles.sectionTitle}>Last 10 Reviews</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
              {profile.recentReviews.map((review, idx) => (
                <View key={idx} style={[styles.trackCard, { width: 200 }]}>
                  <Text style={styles.trackTitle} numberOfLines={1}>{review.displayName || "Anonymous"}</Text>
                  <Text style={styles.trackArtist} numberOfLines={2}>{review.text}</Text>
                  <Text style={{ color: "#1DB954", marginTop: 4 }}>Rating: {review.rating || "N/A"}</Text>
                  {review.createdAt?.toDate && (
                    <Text style={{ color: "#888", fontSize: 12 }}>
                      {review.createdAt.toDate().toLocaleString()}
                    </Text>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        )}

      </ScrollView>

      {/* Modal for searching tracks or albums */}
      <Modal visible={modalVisible} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: "#121212", padding: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 12 }}>
            <TouchableOpacity onPress={() => setSelectionType("track")}>
              <Text style={{ color: selectionType === "track" ? "#1DB954" : "#fff", fontWeight: "bold" }}>Tracks</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectionType("album")}>
              <Text style={{ color: selectionType === "album" ? "#1DB954" : "#fff", fontWeight: "bold" }}>Albums</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            placeholder={`Search ${selectionType}s...`}
            placeholderTextColor="#888"
            style={styles.searchInput}
            value={searchText}
            onChangeText={(text) => {
              setSearchText(text);
              handleSearch(text);
            }}
          />

          {searchLoading ? (
            <ActivityIndicator size="large" color="#1DB954" style={{ marginTop: 16 }} />
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={{ justifyContent: "space-between", marginBottom: 12 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.songBox, { flex: 0.48, borderWidth: 1, borderColor: "#222" }]}
                  onPress={() => selectItemForSlot(item)}
                  disabled={updating}
                >
                  {item.images?.[0]?.url || item.album?.images?.[0]?.url ? (
                    <Image
                      source={{ uri: item.images?.[0]?.url || item.album?.images?.[0]?.url }}
                      style={{ width: "100%", height: 100, borderRadius: 8, marginBottom: 4 }}
                    />
                  ) : null}
                  <Text style={styles.songTitle} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.songArtist} numberOfLines={1}>
                    {item.artists?.map(a => a.name).join(", ")}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}

          <TouchableOpacity style={[styles.button, { marginTop: 16 }]} onPress={() => setModalVisible(false)}>
            <Text style={styles.buttonText}>Done</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function LoadingScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <ActivityIndicator size="large" color="#1DB954" />
    </SafeAreaView>
  );
}

function ErrorScreen({ message }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <Text style={styles.errorText}>{message}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212", padding: 16 },
  title: { color: "#fff", fontSize: 28, fontWeight: "bold", marginBottom: 24 },
  sectionTitle: { color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 12 },
  infoBox: { backgroundColor: "#222", padding: 16, borderRadius: 8, marginBottom: 16 },
  label: { color: "#888", fontSize: 16 },
  value: { color: "#fff", fontSize: 18, marginTop: 4 },
  songBox: { backgroundColor: "#222", padding: 8, borderRadius: 8, marginBottom: 8 },
  songTitle: { color: "#fff", fontSize: 16 },
  songArtist: { color: "#888", fontSize: 14, marginTop: 2 },
  errorText: { color: "red", fontSize: 18, textAlign: "center", marginTop: 40 },
  searchInput: { backgroundColor: "#222", color: "#fff", padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 16 },
  button: { backgroundColor: "#1DB954", padding: 14, borderRadius: 8 },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold", textAlign: "center" },

  trackCard: { width: 140, marginRight: 12, borderRadius: 8, backgroundColor: "#222", padding: 8, alignItems: "center" },
  trackImage: { width: "100%", height: 100, borderRadius: 8, marginBottom: 8 },
  trackTitle: { color: "#fff", fontSize: 14, fontWeight: "bold" },
  trackArtist: { color: "#888", fontSize: 12 },
  emptyTrack: { width: "100%", height: 100, borderRadius: 8, borderWidth: 1, borderColor: "#444", justifyContent: "center", alignItems: "center", marginBottom: 8 },
});
