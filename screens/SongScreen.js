// screens/SongScreen.js
import React, { useEffect, useState, useRef } from "react";
import { 
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, 
  StyleSheet, Linking, Image, Pressable, Dimensions, Animated, Modal, TextInput, Button 
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import { Audio } from "expo-av";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, collection, onSnapshot, deleteDoc } from "firebase/firestore";

const screenWidth = Dimensions.get("window").width;

export default function SongScreen({ route, navigation }) {
  const { songId, token: routeToken } = route.params;
  const [song, setSong] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [token, setToken] = useState(routeToken || null);
  const [user, setUser] = useState(null);

  const [globalRating, setGlobalRating] = useState(0);
  const [globalBreakdown, setGlobalBreakdown] = useState({});
  const barAnimations = useRef({}).current;

  const [lyrics, setLyrics] = useState("");
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const [lyricsError, setLyricsError] = useState("");
  const [lyricsExpanded, setLyricsExpanded] = useState(false);

  const [previewUrl, setPreviewUrl] = useState(null);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const playScale = useRef(new Animated.Value(1)).current;

  // --- Review modal ---
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [userReviewId, setUserReviewId] = useState(null);

  // --- Firebase auth ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, u => setUser(u));
    return unsubscribe;
  }, []);

  useEffect(() => { if (routeToken) setToken(routeToken); }, [routeToken]);

  // --- Save user's rating ---
  const saveRating = async (value) => {
    if (!user) return;

    // Open modal on star click
    setReviewRating(value);

    // Check if user already has a review
    const existingReview = reviews.find(r => r.userId === user.uid);
    if (existingReview) {
      setReviewText(existingReview.text || "");
      setUserReviewId(existingReview.id);
    } else {
      setReviewText("");
      setUserReviewId(null);
    }

    setReviewModalVisible(true);
  };

  // --- Real-time global ratings ---
  useEffect(() => {
    if (!songId) return;
    const colRef = collection(db, "songRatings", songId, "ratings");
    const unsubscribe = onSnapshot(colRef, snapshot => {
      let sum = 0, count = 0;
      const breakdown = {};
      for (let i = 1; i <= 5; i += 0.5) breakdown[i.toFixed(1)] = 0;

      snapshot.docs.forEach(doc => {
        const r = doc.data().rating;
        if (r != null) {
          sum += r;
          count += 1;
          const rounded = Math.round(r * 2) / 2;
          breakdown[rounded.toFixed(1)] += 1;
        }
      });

      setGlobalRating(count ? sum / count : 0);
      setGlobalBreakdown(breakdown);

      Object.keys(breakdown).forEach(key => {
        if (!barAnimations[key]) barAnimations[key] = new Animated.Value(0);
        Animated.timing(barAnimations[key], {
          toValue: breakdown[key],
          duration: 400,
          useNativeDriver: false
        }).start();
      });

      if (user) {
        const docSnap = snapshot.docs.find(d => d.id === user.uid);
        setRating(docSnap?.data()?.rating || 0);
      }
    });

    return () => unsubscribe();
  }, [songId, user]);

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

  // --- Deezer preview fetch ---
  useEffect(() => {
    if (!song?.name || !song?.artists?.[0]?.name) return;
    const fetchPreview = async () => {
      try {
        const res = await fetch(
          `https://api.deezer.com/search?q=track:"${encodeURIComponent(song.name)}" artist:"${encodeURIComponent(song.artists[0].name)}"`
        );
        const data = await res.json();
        if (data?.data?.length > 0) setPreviewUrl(data.data[0].preview);
      } catch (err) { console.error("Failed to fetch Deezer preview", err); }
    };
    fetchPreview();
  }, [song]);

  // --- Deezer toggle play ---
  const togglePlayPreview = async () => {
    if (!previewUrl) return;

    Animated.sequence([
      Animated.timing(playScale, { toValue: 1.2, duration: 100, useNativeDriver: true }),
      Animated.timing(playScale, { toValue: 1, duration: 100, useNativeDriver: true })
    ]).start();

    if (isPlaying) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
    } else {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: previewUrl },
        { shouldPlay: true }
      );
      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate(status => {
        if (status.didJustFinish) {
          setIsPlaying(false);
          newSound.unloadAsync();
          setSound(null);
        }
      });
    }
  };
  useEffect(() => { return sound ? () => { sound.unloadAsync(); } : undefined; }, [sound]);

  // --- Lyrics fetch ---
  useEffect(() => {
    if (!song?.artists?.[0]?.name || !song?.name) return;
    const fetchLyrics = async () => {
      setLoadingLyrics(true);
      setLyricsError("");
      setLyrics("");
      try {
        const res = await fetch(
          `https://api.lyrics.ovh/v1/${encodeURIComponent(song.artists[0].name)}/${encodeURIComponent(song.name)}`
        );
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          if (data.lyrics) setLyrics(data.lyrics);
          else throw new Error();
        } catch { throw new Error("Lyrics.ovh returned non-JSON"); }
      } catch {
        setLyrics(`Lyrics not found. View on Genius: ${song.name} - ${song.artists[0].name}`);
        setLyricsError("genius");
      } finally { setLoadingLyrics(false); }
    };
    fetchLyrics();
  }, [song]);

  // --- Fetch reviews ---
  useEffect(() => {
    if (!songId) return;
    const colRef = collection(db, "songReviews", songId, "reviews");
    const unsubscribe = onSnapshot(colRef, snapshot => {
      const revs = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a,b) => b.createdAt?.toDate() - a.createdAt?.toDate());
      setReviews(revs);

      if (user) {
        const existing = revs.find(r => r.userId === user.uid);
        if (existing) {
          setRating(existing.rating);
          setUserReviewId(existing.id);
        }
      }
    });
    return () => unsubscribe();
  }, [songId, user]);

  // --- Publish review ---
  const publishReview = async () => {
    if (!user) return;
    try {
      const reviewRef = userReviewId
        ? doc(db, "songReviews", songId, "reviews", userReviewId)
        : doc(collection(db, "songReviews", songId, "reviews"));

      await setDoc(reviewRef, {
        userId: user.uid,
        displayName: user.displayName || "Anonymous",
        rating: reviewRating,
        text: reviewText,
        createdAt: new Date()
      });

      setReviewModalVisible(false);
    } catch (err) {
      console.error("Failed to publish review:", err);
    }
  };

  // --- Delete review ---
  const deleteReview = async () => {
    if (!user || !userReviewId) return;
    try {
      await deleteDoc(doc(db, "songReviews", songId, "reviews", userReviewId));
      setReviewModalVisible(false);
      setReviewText("");
      setReviewRating(0);
      setUserReviewId(null);
    } catch (err) {
      console.error("Failed to delete review:", err);
    }
  };

  // --- Render stars ---
  const renderStars = (ratingValue, onPress, size = 32) => (
    <View style={{ flexDirection: "row" }}>
      {[1,2,3,4,5].map(i => {
        const fullStar = i <= ratingValue;
        const halfStar = !fullStar && i - 0.5 <= ratingValue;
        return (
          <Pressable
            key={i}
            style={{ width: size+8, alignItems: "center" }}
            onPress={(e) => {
              if (!onPress) return;
              const { locationX } = e.nativeEvent;
              const newValue = locationX < size/2 ? i - 0.5 : i;
              onPress(newValue);
            }}
          >
            <Icon
              name={fullStar ? "star" : halfStar ? "star-half-alt" : "star"}
              size={size}
              solid={fullStar || halfStar}
              color={fullStar || halfStar ? "#1db954" : "#888"}
            />
          </Pressable>
        );
      })}
    </View>
  );

  if (loading || !token) return <ActivityIndicator size="large" style={{ flex:1 }} color="#1db954" />;
  if (!song) return <Text style={{ color:'#fff', textAlign:'center', marginTop:20 }}>Failed to load song details.</Text>;

  const lines = lyrics.split("\n");
  const preview = lines.slice(0, 6).join("\n");
  const shouldCollapse = lines.length > 6;
  const maxCount = Math.max(...Object.values(globalBreakdown));

  return (
    <ScrollView style={styles.container}>
      {/* Song Info */}
      <View style={styles.topRow}>
        <Pressable onPress={togglePlayPreview}>
          <Image source={{ uri: song.album?.images?.[1]?.url || song.album?.images?.[0]?.url }} style={styles.cover} />
          {previewUrl && (
            <Animated.View style={[styles.playOverlay, { transform:[{ scale: playScale }] }]}>
              <Icon name={isPlaying ? "pause" : "play"} size={32} color="#fff" />
            </Animated.View>
          )}
        </Pressable>
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

      {/* Spotify Button + Your Rating */}
      <View style={{ flexDirection:"row", alignItems:"center", marginTop:16 }}>
        <TouchableOpacity style={styles.spotifyButton} onPress={() => Linking.openURL(song.external_urls?.spotify).catch(console.error)}>
          <Icon name="spotify" size={28} color="#fff" />
          <Text style={styles.buttonText}>Open in Spotify</Text>
        </TouchableOpacity>

        <View style={{ width:16 }} />

        <View>
          <Text style={{ color:"#fff", marginBottom:4 }}>Your Rating:</Text>
          {renderStars(rating, saveRating, 24)}
        </View>
      </View>

      {/* Global rating */}
      <View style={{ marginTop:16 }}>
        <Text style={{ color:"#ccc", fontSize:16, marginBottom:4, fontWeight:"bold" }}>Global Average Rating</Text>
        <View style={{ flexDirection:"row", alignItems:"center" }}>
          <View style={{ flexDirection:"row", alignItems:"flex-end", height:70 }}>
            {Object.keys(globalBreakdown).map(key => {
              const animatedHeight = barAnimations[key]?.interpolate({
                inputRange:[0,maxCount||1],
                outputRange:[0,70],
                extrapolate:'clamp'
              }) || 0;
              return (
                <View key={key} style={{ marginHorizontal:1, width:12, backgroundColor:"#333", borderRadius:3 }}>
                  <Animated.View style={{ width:"100%", height:animatedHeight, backgroundColor:"#888", borderRadius:3 }} />
                </View>
              )
            })}
          </View>
          <Text style={{ color:"#fff", fontSize:24, fontWeight:"bold", marginLeft:12 }}>{globalRating.toFixed(1)}</Text>
        </View>
      </View>

      {/* Lyrics */}
      <View style={styles.lyricsContainer}>
        <Text style={styles.lyricsTitle}>Lyrics</Text>
        {loadingLyrics ? (
          <ActivityIndicator size="small" color="#1db954" />
        ) : (
          <>
            {lyricsError === "genius" ? (
              <TouchableOpacity onPress={() => Linking.openURL(`https://genius.com/search?q=${encodeURIComponent(song.name + " " + song.artists[0].name)}`)}>
                <Text style={[styles.lyricsText, { color:"#1db954", textDecorationLine:"underline" }]}>View lyrics on Genius</Text>
              </TouchableOpacity>
            ) : (
              <>
                <Text style={styles.lyricsText}>{lyricsExpanded ? lyrics : preview}</Text>
                {shouldCollapse && (
                  <TouchableOpacity onPress={() => setLyricsExpanded(!lyricsExpanded)}>
                    <Text style={styles.toggleText}>{lyricsExpanded ? "Show Less ▲" : "Show More ▼"}</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </>
        )}
      </View>

      {/* Reviews */}
      <View style={{ marginTop:20 }}>
        <Text style={{ color:"#fff", fontSize:18, fontWeight:"bold", marginBottom:8 }}>Reviews</Text>
        {reviews.length === 0 ? (
          <Text style={{ color:"#888", fontStyle:"italic" }}>No reviews yet.</Text>
        ) : reviews.map(r => (
          <View key={r.id} style={{ marginBottom:12, backgroundColor:"#222", padding:10, borderRadius:8 }}>
            <Text style={{ color:"#1db954", fontWeight:"bold", marginBottom:4 }}>{r.displayName || "Anonymous"}</Text>
            <View style={{ flexDirection:"row", alignItems:"center", marginBottom:4 }}>
              {renderStars(r.rating, null, 16)}
            </View>
            <Text style={{ color:"#ddd" }}>{r.text}</Text>
            <Text style={{ color:"#888", fontSize:12, marginTop:4 }}>{r.createdAt?.toDate().toLocaleString()}</Text>
          </View>
        ))}
      </View>

      {/* Review Modal */}
      <Modal visible={reviewModalVisible} transparent animationType="slide">
        <View style={{ flex:1, backgroundColor:"rgba(0,0,0,0.6)", justifyContent:"center", padding:20 }}>
          <View style={{ backgroundColor:"#121212", borderRadius:12, padding:16 }}>
            <Text style={{ color:"#fff", fontSize:18, fontWeight:"bold", marginBottom:12 }}>Your Review</Text>

            {/* Spotify nickname */}
            <Text style={{ color:"#1db954", fontWeight:"bold", marginBottom:8 }}>
              {user?.displayName || "Anonymous"}
            </Text>

            <Text style={{ color:"#fff", marginBottom:4 }}>Rating:</Text>
            {renderStars(reviewRating, setReviewRating, 28)}
            <Text style={{ color:"#fff", marginTop:12, marginBottom:4 }}>Review:</Text>
            <TextInput
              style={{ backgroundColor:"#222", color:"#fff", padding:10, borderRadius:8, height:100, textAlignVertical:"top" }}
              multiline
              value={reviewText}
              onChangeText={setReviewText}
              placeholder="Write your review..."
              placeholderTextColor="#888"
            />
            <View style={{ flexDirection:"row", justifyContent:"flex-end", marginTop:12 }}>
              <Button title="Cancel" onPress={() => setReviewModalVisible(false)} />
              <View style={{ width:12 }} />
              {userReviewId && <Button title="Remove" color="#f44336" onPress={deleteReview} />}
              <View style={{ width:12 }} />
              <Button title="Publish" onPress={publishReview} />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:"#121212", padding:12 },
  topRow: { flexDirection:"row" },
  cover: { width:screenWidth*0.4, height:screenWidth*0.4, borderRadius:8 },
  playOverlay: { position:"absolute", top:"40%", left:"40%", backgroundColor:"rgba(0,0,0,0.4)", borderRadius:32, padding:8 },
  songInfo: { flex:1, marginLeft:12 },
  title: { color:"#fff", fontSize:20, fontWeight:"bold" },
  artist: { color:"#1db954", fontSize:16, marginTop:4 },
  album: { color:"#ccc", marginTop:4 },
  detail: { color:"#888", fontSize:12, marginTop:2 },
  spotifyButton: { flexDirection:"row", alignItems:"center", backgroundColor:"#1db954", padding:8, borderRadius:8 },
  buttonText: { color:"#fff", marginLeft:6, fontWeight:"bold" },
  lyricsContainer: { marginTop:20 },
  lyricsTitle: { color:"#fff", fontSize:18, fontWeight:"bold", marginBottom:8 },
  lyricsText: { color:"#ccc", lineHeight:20 },
  toggleText: { color:"#1db954", fontWeight:"bold", marginTop:4 }
});
