import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export default function HomeMainScreen({ navigation, route }) {
  const token = route.params?.token;
  const [topTracks, setTopTracks] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);

  const cardWidth = Math.round(screenWidth * 0.4);
  const cardHeight = Math.round(cardWidth * 1.5);

  useEffect(() => {
    if (!token) return;
    fetchSpotifyData();
  }, [token]);

  const fetchSpotifyData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tracksRes, artistsRes, releasesRes] = await Promise.all([
        fetch('https://api.spotify.com/v1/me/top/tracks?limit=20', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('https://api.spotify.com/v1/me/top/artists?limit=20', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('https://api.spotify.com/v1/browse/new-releases?limit=20', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const tracksData = await tracksRes.json();
      const artistsData = await artistsRes.json();
      const releasesData = await releasesRes.json();

      setTopTracks(tracksData.items || []);
      setTopArtists(artistsData.items || []);
      setNewReleases(releasesData.albums?.items || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch Spotify data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm || !token) return;
    setLoading(true);
    setSearching(true);
    setError(null);
    try {
      const res = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(
          searchTerm
        )}&type=track,album,artist&limit=20`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      const results = [
        ...(data.tracks?.items || []),
        ...(data.albums?.items || []),
        ...(data.artists?.items || []),
      ];
      setSearchResults(results);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch search results.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    setSearching(false);
    setSearchTerm('');
    setSearchResults([]);
  };

  const renderItem = (item, isSong = false, isArtist = false) => {
    const title = item.name || item.title;
    const artist = isArtist ? '' : item.artists?.[0]?.name || 'Unknown Artist';
    const artwork = isArtist
      ? item.images?.[1]?.url || item.images?.[0]?.url
      : isSong
      ? item.album?.images?.[1]?.url || item.album?.images?.[0]?.url
      : item.images?.[1]?.url || item.images?.[0]?.url;

    return (
      <TouchableOpacity
        style={[styles.card, { width: cardWidth, height: cardHeight }]}
        onPress={() => {
          if (isSong) navigation.navigate('Song', { songId: item.id });
          else if (isArtist) navigation.navigate('Artist', { artistId: item.id });
          else navigation.navigate('Album', { albumId: item.id });
        }}
      >
        {artwork && (
          <Image
            source={{ uri: artwork }}
            style={{
              width: cardWidth - 16,
              height: cardWidth - 16,
              borderRadius: 8,
              marginBottom: 8,
            }}
          />
        )}
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {artist ? <Text style={styles.artist} numberOfLines={1}>{artist}</Text> : null}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} color="#1db954" />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <View
        style={{
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
          paddingHorizontal: 16,
          backgroundColor: '#121212',
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
        {error && <Text style={{ color: 'red', margin: 8 }}>{error}</Text>}

        {searching ? (
          <>
            <Text style={styles.section}>Search Results</Text>
            <FlatList
              horizontal
              nestedScrollEnabled
              data={searchResults}
              renderItem={({ item }) => renderItem(item, item.type === 'track', item.type === 'artist')}
              keyExtractor={(item) => `${item.type || 'item'}-${item.id}`}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ padding: 8 }}
            />
            <Button title="Go Back" onPress={handleGoBack} color="#1db954" />
          </>
        ) : (
          <>
            <Text style={styles.section}>Top Tracks</Text>
            <FlatList
              horizontal
              nestedScrollEnabled
              data={topTracks}
              renderItem={({ item }) => renderItem(item, true)}
              keyExtractor={(item) => `track-${item.id}`}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ padding: 8 }}
            />
            <Text style={styles.section}>Top Artists</Text>
            <FlatList
              horizontal
              nestedScrollEnabled
              data={topArtists}
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
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121212' },
  container: { flex: 1, backgroundColor: '#121212' },
  searchInput: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  section: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginLeft: 8, marginVertical: 8 },
  card: {
    marginRight: 12,
    backgroundColor: '#363333ff',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  textContainer: { width: '100%', alignItems: 'center' },
  title: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  artist: { color: '#aaa', fontSize: 12, textAlign: 'center' },
});
