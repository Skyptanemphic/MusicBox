import React, { useEffect, useState } from "react";
import { 
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, 
  StyleSheet, Linking, Image, Pressable, TextInput
} from "react-native";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc, onSnapshot, collection, deleteDoc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/FontAwesome5";

export default function SongScreen({ route, navigation }) {
  const { songId, token: routeToken } = route.params;
  const [song, setSong] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [allReviews, setAllReviews] = useState([]);
  const [token, setToken] = useState(routeToken || null);
  const [tokenLoaded, setTokenLoaded] = useState(false);

  // --- Monitor Firebase Auth ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthChecked(true);
    });
    return unsubscribe;
  }, []);

  // --- Load Spotify token from AsyncStorage ---
  useEffect(() => {
    const loadToken = async () => {
      if (!routeToken) {
        try {
          const storedToken = await AsyncStorage.getItem("spotifyToken");
          if (storedToken) setToken(storedToken);
        } catch (err) {
          console.log("Error loading Spotify token:", err);
        }
      } else setToken(routeToken);
      setTokenLoaded(true);
    };
    loadToken();
  }, [routeToken]);

  // --- Fetch Spotify song details ---
  const fetchSong = async (accessToken) => {
    if (!songId || !accessToken) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`https://api.spotify.com/v1/tracks/${songId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!data.error) {
        setSong({
          ...data,
          album: { ...data.album, images: Array.isArray(data.album?.images) ? data.album.images : [] },
          artists: Array.isArray(data.artists) ? data.artists : [],
        });
      } else setSong(null);
    } catch { setSong(null); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (token) fetchSong(token); }, [songId, token]);

  // --- Load user review & all reviews ---
  useEffect(() => {
    if (!user || !songId) return;

    const userDocRef = doc(db, "reviews", songId, "reviews", user.uid);
    getDoc(userDocRef).then(docSnap => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setRating(data.rating || 0);
        setReview(data.review || "");
      } else {
        setRating(0);
        setReview("");
      }
    }).catch(console.error);

    const unsubscribe = onSnapshot(
      collection(db, "reviews", songId, "reviews"),
      snapshot => {
        const reviewsArray = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        }));
        setAllReviews(reviewsArray);
      }
    );
    return () => unsubscribe();
  }, [user, songId]);

  // --- Save / Delete review ---
  const saveReview = async () => {
    if (!user) return;
    if (!rating && !review.trim()) return;
    try {
      await setDoc(doc(db, "reviews", songId, "reviews", user.uid), {
        rating,
        review,
        userId: user.uid,
        userEmail: user.email,
        createdAt: new Date()
      });
    } catch (err) { console.error("Error saving review:", err); }
  };

  const deleteReview = async () => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "reviews", songId, "reviews", user.uid));
      setRating(0);
      setReview("");
    } catch (err) { console.error("Error deleting review:", err); }
  };

  // --- Render stars ---
  const renderStars = (ratingValue, onPress) => (
    <View style={{ flexDirection: "row" }}>
      {[1,2,3,4,5].map((i) => {
        const fullStar = i <= ratingValue;
        const halfStar = !fullStar && i - 0.5 <= ratingValue;
        return (
          <Pressable
            key={i}
            style={{ width: 40, alignItems: "center" }}
            onPress={(e) => {
              const { locationX } = e.nativeEvent;
              if (locationX < 20) onPress(i - 0.5);
              else onPress(i);
            }}
          >
            <Icon
              name={fullStar ? "star" : halfStar ? "star-half-alt" : "star"}
              size={32}
              solid={fullStar || halfStar}
              color={fullStar || halfStar ? "#1db954" : "#888"}
            />
          </Pressable>
        );
      })}
    </View>
  );

  // --- Show loading until auth & token are ready ---
  if (!authChecked || !tokenLoaded || loading) return <ActivityIndicator size="large" style={{ flex:1 }} color="#1db954" />;
  if (!song) return <Text style={{ color:'#fff', textAlign:'center', marginTop:20 }}>Failed to load song details.</Text>;

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Song info */}
      <View style={styles.topRow}>
        <Image source={{ uri: song.album?.images?.[1]?.url || song.album?.images?.[0]?.url }} style={styles.cover} />
        <View style={styles.songInfo}>
          <Text style={styles.title}>{song.name}</Text>
          <TouchableOpacity onPress={() => song.artists?.[0]?.id && navigation.navigate("Artist", { artistId: song.artists[0].id, token })}>
            <Text style={styles.artist}>{song.artists?.map(a=>a.name).join(", ") || "Unknown Artist"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => song.album?.id && navigation.navigate("Album", { albumId: song.album.id, token })}>
            <Text style={styles.album}>Album: {song.album?.name || "Unknown Album"}</Text>
          </TouchableOpacity>
          <Text style={styles.detail}>Duration: {Math.floor((song.duration_ms||0)/60000)}:{Math.floor(((song.duration_ms||0)%60000)/1000).toString().padStart(2,"0")} min</Text>
          <Text style={styles.detail}>Popularity: {song.popularity ?? "N/A"}</Text>
          <Text style={styles.detail}>Release: {song.album?.release_date || "Unknown"}</Text>
        </View>
      </View>

      {/* Open in Spotify */}
      <TouchableOpacity style={styles.spotifyButton} onPress={() => Linking.openURL(song.external_urls?.spotify).catch(console.error)}>
        <Icon name="spotify" size={28} color="#fff" />
        <Text style={styles.buttonText}>Open in Spotify</Text>
      </TouchableOpacity>

      {/* User Review */}
      {user ? (
        <View style={{ marginTop:16 }}>
          <Text style={{ color:"#fff", marginBottom:4 }}>Your Rating:</Text>
          {renderStars(rating, setRating)}
          <TextInput
            style={styles.reviewInput}
            placeholder="Write a review..."
            placeholderTextColor="#888"
            value={review}
            onChangeText={setReview}
            multiline
          />
          <View style={{ flexDirection:"row", marginTop:8 }}>
            <TouchableOpacity style={styles.saveButton} onPress={saveReview}>
              <Text style={{ color:"#fff", fontWeight:"bold" }}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveButton, { backgroundColor:"#f44336", marginLeft:8 }]} onPress={deleteReview}>
              <Text style={{ color:"#fff", fontWeight:"bold" }}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={{ marginTop:16, alignItems:"center" }}>
          <Text style={{color:"#fff", marginBottom:8}}>Login to leave a review</Text>
          <TouchableOpacity style={{ backgroundColor:"#1db954", padding:10, borderRadius:8 }} onPress={() => navigation.navigate("Login")}>
            <Text style={{color:"#fff", fontWeight:"bold"}}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* All Reviews */}
      <View style={{ marginTop:24 }}>
        <Text style={{ color:"#fff", fontSize:18, marginBottom:8 }}>All Reviews:</Text>
        {allReviews.map(r => (
          <View key={r.id} style={styles.reviewCard}>
            <Text style={{ color:"#1db954", fontWeight:"bold" }}>{r.userEmail}</Text>
            {renderStars(r.rating, ()=>{})}
            <Text style={{ color:"#fff", marginTop:4 }}>{r.review}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:"#121212", padding:16 },
  topRow:{ flexDirection:"row", marginBottom:16 },
  cover:{ width:180, height:180, borderRadius:12, borderWidth:1, borderColor:"#333" },
  songInfo:{ flex:1, marginLeft:16, justifyContent:"center" },
  title:{ color:"#fff", fontSize:22, fontWeight:"bold", marginBottom:4 },
  artist:{ color:"#1db954", fontSize:18, marginBottom:4 },
  album:{ color:"#1db954", fontSize:16, marginBottom:4 },
  detail:{ color:"#ccc", fontSize:14, marginBottom:2 },
  spotifyButton:{ flexDirection:"row", alignItems:"center", backgroundColor:"#1db954", paddingVertical:8, paddingHorizontal:12, borderRadius:8, marginTop:12 },
  buttonText:{ color:"#fff", fontWeight:"bold", marginLeft:8 },
  reviewInput:{ backgroundColor:"#222", color:"#fff", padding:8, borderRadius:8, marginTop:8, minHeight:60 },
  saveButton:{ backgroundColor:"#1db954", padding:10, borderRadius:8 },
  reviewCard:{ backgroundColor:"#1f1f1f", padding:8, borderRadius:8, marginBottom:8 }
});
