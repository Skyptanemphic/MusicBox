import React, { useEffect, useState, useCallback, useLayoutEffect } from "react";
import { View, Text, Image, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Pressable } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import Icon from "react-native-vector-icons/FontAwesome5";

export default function Song({ route, navigation }) {
  const { songId } = route.params;
  const [song, setSong] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState({});

  useEffect(() => { fetchSong(); }, []);

  useFocusEffect(
    useCallback(() => { loadRatings(); }, [])
  );

  const fetchSong = async () => {
    try {
      const res = await fetch(`https://api.deezer.com/track/${songId}`);
      const data = await res.json();
      setSong(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const loadRatings = async () => {
    try {
      const stored = await AsyncStorage.getItem("songRatings");
      if (stored) setRatings(JSON.parse(stored));
    } catch (err) { console.error(err); }
  };

  const saveRating = async (songId, value) => {
    try {
      const newRatings = { ...ratings, [songId]: value };
      setRatings(newRatings);
      await AsyncStorage.setItem("songRatings", JSON.stringify(newRatings));
    } catch (err) { console.error(err); }
  };

  const removeRating = async () => {
    try {
      const newRatings = { ...ratings };
      delete newRatings[song.id];
      setRatings(newRatings);
      await AsyncStorage.setItem("songRatings", JSON.stringify(newRatings));
    } catch (err) { console.error(err); }
  };

  // Add button to top-right corner
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
      let iconName = "star";
      if (rating >= i) iconName = "star";
      else if (rating >= i - 0.5) iconName = "star-half-alt";
      else iconName = "star";

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
          <Icon
            name={iconName}
            size={32}
            solid={iconName === "star"}
            color={color}
          />
        </Pressable>
      );
    }
    return <View style={{ flexDirection: "row" }}>{stars}</View>;
  };

  if (loading || !song)
    return <ActivityIndicator style={{ flex: 1 }} size="large" color="#1db954" />;

  const rating = ratings[song.id] || 0;

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: song.album?.cover_medium }} style={styles.cover} />
      <Text style={styles.title}>{song.title}</Text>
      <Text style={styles.artist}>{song.artist?.name}</Text>
      <Text style={styles.album}>Album: {song.album?.title}</Text>
      <Text style={styles.detail}>Duration: {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, "0")} min</Text>
      <Text style={styles.detail}>Rank: {song.rank?.toLocaleString()}</Text>
      <Text style={styles.detail}>Release: {song.release_date || "Unknown"}</Text>

      {song.album?.id && (
        <TouchableOpacity style={styles.albumButton} onPress={() => navigation.navigate("Album",{ albumId: song.album.id })}>
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
