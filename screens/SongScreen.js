import React, { useEffect, useState, useCallback, useLayoutEffect } from "react";
import { 
  View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Pressable 
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import Icon from "react-native-vector-icons/FontAwesome5";

export default function SongScreen({ route, navigation }) {
  const { songId, token: routeToken } = route.params;
  const [song, setSong] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState({});
  const [token, setToken] = useState(routeToken || null);

  const loadToken = async () => {
    if (!routeToken) {
      try {
        const storedToken = await AsyncStorage.getItem("spotifyToken");
        if (storedToken) setToken(storedToken);
      } catch (err) {}
    }
  };

  const fetchSong = async (accessToken) => {
    if (!songId || !accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`https://api.spotify.com/v1/tracks/${songId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();

      if (!data.error) {
        const safeData = {
          ...data,
          album: {
            ...data.album,
            images: Array.isArray(data.album?.images) ? data.album.images : [],
          },
          artists: Array.isArray(data.artists) ? data.artists : [],
        };
        setSong(safeData);
      } else {
        setSong(null);
      }
    } catch (err) {
      setSong(null);
    } finally {
      setLoading(false);
    }
  };

  const loadRatings = async () => {
    try {
      const stored = await AsyncStorage.getItem("songRatings");
      if (stored) setRatings(JSON.parse(stored));
    } catch (err) {}
  };

  const saveRating = async (songId, value) => {
    try {
      const newRatings = { ...ratings, [songId]: value };
      setRatings(newRatings);
      await AsyncStorage.setItem("songRatings", JSON.stringify(newRatings));
    } catch (err) {}
  };

  const removeRating = async () => {
    if (!song) return;
    try {
      const newRatings = { ...ratings };
      delete newRatings[song.id];
      setRatings(newRatings);
      await AsyncStorage.setItem("songRatings", JSON.stringify(newRatings));
    } catch (err) {}
  };

  useEffect(() => {
    const init = async () => { await loadToken(); };
    init();
  }, []);

  useEffect(() => {
    if (token) fetchSong(token);
  }, [songId, token]);

  useFocusEffect(useCallback(() => { loadRatings(); }, []));

  useLayoutEffect(() => {
    if (song && ratings[song.id]) {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity onPress={removeRating} style={{ marginRight: 15 }}>
            <Icon name="trash" size={20} color="#fff" />
          </TouchableOpacity>
        ),
      });
    } else {
      navigation.setOptions({ headerRight: () => null });
    }
  }, [navigation, ratings, song]);

  const renderStars = (rating, onPress) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      let iconName = rating >= i ? "star" : rating >= i - 0.5 ? "star-half-alt" : "star";
      const color = rating >= i - 0.5 ? "#1db954" : "#888";

      stars.push(
        <Pressable
          key={i}
          style={{ width: 40, alignItems: "center" }}
          onPress={({ nativeEvent }) => {
            const x = nativeEvent.locationX;
            const newValue = x < 20 ? i - 0.5 : i;
            onPress(newValue);
          }}
        >
          <Icon name={iconName} size={32} solid={iconName === "star"} color={color} />
        </Pressable>
      );
    }
    return <View style={{ flexDirection: "row" }}>{stars}</View>;
  };

  if (!token) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center', padding:16 }}>
        <Text style={{ color:'#fff', fontSize:18, textAlign:'center', marginBottom:20 }}>
          Spotify login required to load song details.
        </Text>
        <TouchableOpacity 
          style={{ backgroundColor:'#1db954', padding:12, borderRadius:8 }}
          onPress={() => navigation.navigate("SpotifyLogin")}
        >
          <Text style={{ color:'#fff', fontWeight:'bold' }}>Login to Spotify</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} color="#1db954" />;

  if (!song) return <Text style={{ color: "#fff", textAlign: "center", marginTop: 20 }}>Failed to load song details.</Text>;

  const rating = ratings[song.id] || 0;

  return (
    <ScrollView style={styles.container}>
      <Image 
        source={{ uri: song.album?.images?.[1]?.url || song.album?.images?.[0]?.url }} 
        style={styles.cover} 
      />
      <Text style={styles.title}>{song.name}</Text>
      <Text style={styles.artist}>{song.artists?.map(a => a.name).join(", ") || "Unknown Artist"}</Text>
      <Text style={styles.album}>Album: {song.album?.name || "Unknown Album"}</Text>
      <Text style={styles.detail}>
        Duration: {Math.floor((song.duration_ms || 0)/60000)}:
        {Math.floor(((song.duration_ms || 0)%60000)/1000).toString().padStart(2,"0")} min
      </Text>
      <Text style={styles.detail}>Popularity: {song.popularity ?? "N/A"}</Text>
      <Text style={styles.detail}>Release: {song.album?.release_date || "Unknown"}</Text>

      {song.album?.id && (
        <TouchableOpacity 
          style={styles.albumButton} 
          onPress={() => navigation.navigate("Album", { albumId: song.album.id, token })}
        >
          <Text style={styles.albumButtonText}>View Album</Text>
        </TouchableOpacity>
      )}

      <View style={styles.ratingRow}>
        {renderStars(rating, (value) => saveRating(song.id, value))}
      </View>
      <Text style={styles.ratingText}>{rating > 0 ? `${rating.toFixed(1)} / 5` : "Not rated"}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:"#121212", padding:16 },
  cover: { width:280, height:280, borderRadius:12, alignSelf:"center", marginBottom:16 },
  title:{ color:"#fff", fontSize:24, fontWeight:"bold", textAlign:"center", marginBottom:4 },
  artist:{ color:"#aaa", fontSize:18, textAlign:"center", marginBottom:8 },
  album:{ color:"#ccc", fontSize:16, textAlign:"center", marginBottom:4 },
  detail:{ color:"#ccc", fontSize:14, textAlign:"center", marginBottom:2 },
  albumButton:{ backgroundColor:"#1db954", padding:10, borderRadius:8, alignSelf:"center", marginVertical:20 },
  albumButtonText:{ color:"#fff", fontWeight:"bold" },
  ratingRow:{ flexDirection:"row", justifyContent:"center", marginTop:12 },
  ratingText:{ color:"#ccc", textAlign:"center", marginTop:4 },
});
