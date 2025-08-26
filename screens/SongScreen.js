// screens/SongScreen.js
import React, { useEffect, useState, useRef } from "react";
import { 
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, 
  StyleSheet, Linking, Image, Pressable, Dimensions, Animated 
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/FontAwesome5";
import { Audio } from "expo-av";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";

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

  // Deezer preview state
  const [previewUrl, setPreviewUrl] = useState(null);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const playScale = useRef(new Animated.Value(1)).current;

  // --- Firebase auth ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, u => setUser(u));
    return unsubscribe;
  }, []);

  // --- Load Spotify token ---
  useEffect(() => {
    const loadToken = async () => {
      if (!routeToken) {
        try {
          const storedToken = await AsyncStorage.getItem("spotifyToken");
          if (storedToken) setToken(storedToken);
        } catch (err) { console.error(err); }
      } else setToken(routeToken);
    };
    loadToken();
  }, [routeToken]);

  // --- Save user's rating ---
  const saveRating = async (value) => {
    if (!user) return;
    setRating(value);
    try {
      await setDoc(doc(db, "songRatings", songId, "ratings", user.uid), {
        rating: value,
        userId: user.uid,
        createdAt: new Date()
      });
      loadGlobalRating();
    } catch (err) { console.error(err); }
  };

  // --- Load global ratings ---
  const loadGlobalRating = async () => {
    if (!songId) return;
    try {
      const colRef = collection(db, "songRatings", songId, "ratings");
      const snapshot = await getDocs(colRef);
      let sum = 0, count = 0;
      const breakdown = {};
      for (let i = 1; i <= 5; i += 0.5) breakdown[i.toFixed(1)] = 0;

      snapshot.docs.forEach(doc => {
        const r = doc.data().rating;
        if (r != null) {
          sum += r;
          count += 1;
          const rounded = Math.round(r*2)/2;
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

    } catch (err) { console.error(err); }
  };
  useEffect(() => { loadGlobalRating(); }, [songId]);

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

  // --- Fetch Deezer preview ---
  const fetchPreview = async (title, artist) => {
    try {
      const res = await fetch(
        `https://api.deezer.com/search?q=track:"${encodeURIComponent(title)}" artist:"${encodeURIComponent(artist)}"`
      );
      const data = await res.json();
      if (data?.data?.length > 0) setPreviewUrl(data.data[0].preview);
    } catch (err) { console.error("Failed to fetch Deezer preview", err); }
  };
  useEffect(() => { if (song?.name && song?.artists?.[0]?.name) fetchPreview(song.name, song.artists[0].name); }, [song]);

  // --- Toggle play Deezer preview ---
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

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
          newSound.unloadAsync();
          setSound(null);
        }
      });
    }
  };
  useEffect(() => { return sound ? () => { sound.unloadAsync(); } : undefined; }, [sound]);

  // --- Fetch lyrics ---
  useEffect(() => {
    if (song?.artists?.[0]?.name && song?.name) {
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
    }
  }, [song]);

  // --- Load user's rating ---
  useEffect(() => {
    if (!user || !songId) return;
    const loadRating = async () => {
      const docRef = doc(db, "songRatings", songId, "ratings", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setRating(docSnap.data().rating || 0);
    };
    loadRating();
  }, [user, songId]);

  const renderStars = (ratingValue, onPress, size=32) => (
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
      {/* Song Info with album cover as preview button */}
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

      {/* Spotify Button + Your Rating side by side */}
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 16 }}>
        
        {/* Spotify Button */}
        <TouchableOpacity style={styles.spotifyButton} onPress={() => Linking.openURL(song.external_urls?.spotify).catch(console.error)}>
          <Icon name="spotify" size={28} color="#fff" />
          <Text style={styles.buttonText}>Open in Spotify</Text>
        </TouchableOpacity>

        {/* Spacer */}
        <View style={{ width: 16 }} />

        {/* Your Rating */}
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
                inputRange: [0, maxCount || 1],
                outputRange: [0, 70],
                extrapolate: 'clamp'
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
                <Text style={[styles.lyricsText, { color:"#1db954", textDecorationLine:"underline" }]}>
                  View lyrics on Genius
                </Text>
              </TouchableOpacity>
            ) : (
              <>
                <Text style={styles.lyricsText}>{lyricsExpanded ? lyrics : preview}</Text>
                {shouldCollapse && (
                  <TouchableOpacity onPress={() => setLyricsExpanded(!lyricsExpanded)}>
                    <Text style={styles.toggleText}>
                      {lyricsExpanded ? "Show Less ▲" : "Show More ▼"}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:"#121212", padding:16 },
  topRow:{ flexDirection:"row", marginBottom:16 },
  cover:{ width:180, height:180, borderRadius:12, borderWidth:1, borderColor:"#333" },
  playOverlay: {
  position: "absolute",
  top: 0,
  left: 0,
  width: 180,       // same as cover width
  height: 180,      // same as cover height
  backgroundColor: "rgba(0,0,0,0.25)", // semi-transparent overlay
  borderRadius: 12,
  justifyContent: "center",
  alignItems: "center"
},

  songInfo:{ flex:1, marginLeft:16, justifyContent:"center" },
  title:{ color:"#fff", fontSize:22, fontWeight:"bold", marginBottom:4 },
  artist:{ color:"#1db954", fontSize:18, marginBottom:4 },
  album:{ color:"#1db954", fontSize:16, marginBottom:4 },
  detail:{ color:"#ccc", fontSize:14, marginBottom:2 },
  spotifyButton: { flexDirection: "row", alignItems: "center", backgroundColor: "#1db954", paddingVertical: 6, paddingHorizontal: 20, borderRadius: 8,},
  buttonText: { color:"#fff", fontWeight:"bold", marginLeft:6 },
  lyricsContainer:{ marginTop:20, padding:12, backgroundColor:"#222", borderRadius:8 },
  lyricsTitle:{ color:"#fff", fontSize:18, fontWeight:"bold", marginBottom:8 },
  lyricsText:{ color:"#ddd", fontSize:14, lineHeight:20 },
  toggleText:{ color:"#1db954", marginTop:8, fontWeight:"bold", textAlign:"center" }
});
