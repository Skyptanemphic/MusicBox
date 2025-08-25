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
  Dimensions,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export default function HomeScreen({ navigation, token }) {
  const [topTracks, setTopTracks] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState({ tracks: [], albums: [], artists: [] });
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
      setSearchResults({
        tracks: data.tracks?.items || [],
        albums: data.albums?.items || [],
        artists: data.artists?.items || [],
      });
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
    setSearchResults({ tracks: [], albums: [], artists: [] });
  };

  const renderItem = (item, type) => {
    const title = item.name;
    const artistName = type === 'artist' ? '' : item.artists?.[0]?.name || 'Unknown Artist';
    const artwork =
      type === 'artist'
        ? item.images?.[1]?.url || item.images?.[0]?.url
        : item.images?.[0]?.url || item.album?.images?.[0]?.url;

    return (
      <TouchableOpacity
        style={[styles.card, { width: cardWidth, height: cardHeight }]}
        onPress={() => {
          if (type === 'track') navigation.navigate('Song', { songId: item.id, token });
          else if (type === 'artist') navigation.navigate('Artist', { artistId: item.id, token });
          else navigation.navigate('Album', { albumId: item.id, token });
        }}
      >
        {artwork && (
          <Image
            source={{ uri: artwork }}
            style={{ width: cardWidth - 16, height: cardWidth - 16, borderRadius: 8, marginBottom: 8 }}
          />
        )}
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {artistName ? <Text style={styles.artist} numberOfLines={1}>{artistName}</Text> : null}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} color="#1db954" />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <View style={styles.searchRow}>
        {searching && (
          <TouchableOpacity style={styles.goBackButton} onPress={handleGoBack}>
            <Text style={styles.goBackText}>◀</Text>
          </TouchableOpacity>
        )}
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
            {searchResults.tracks.length > 0 && (
              <>
                <Text style={styles.section}>Tracks</Text>
                <FlatList
                  horizontal
                  nestedScrollEnabled
                  data={searchResults.tracks}
                  renderItem={({ item }) => renderItem(item, 'track')}
                  keyExtractor={(item) => `track-${item.id}`}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ padding: 8 }}
                />
              </>
            )}
            {searchResults.albums.length > 0 && (
              <>
                <Text style={styles.section}>Albums</Text>
                <FlatList
                  horizontal
                  nestedScrollEnabled
                  data={searchResults.albums}
                  renderItem={({ item }) => renderItem(item, 'album')}
                  keyExtractor={(item) => `album-${item.id}`}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ padding: 8 }}
                />
              </>
            )}
            {searchResults.artists.length > 0 && (
              <>
                <Text style={styles.section}>Artists</Text>
                <FlatList
                  horizontal
                  nestedScrollEnabled
                  data={searchResults.artists}
                  renderItem={({ item }) => renderItem(item, 'artist')}
                  keyExtractor={(item) => `artist-${item.id}`}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ padding: 8 }}
                />
              </>
            )}
          </>
        ) : (
          <>
            <Text style={styles.section}>Top Tracks</Text>
            <FlatList
              horizontal
              nestedScrollEnabled
              data={topTracks}
              renderItem={({ item }) => renderItem(item, 'track')}
              keyExtractor={(item) => `track-${item.id}`}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ padding: 8 }}
            />
            <Text style={styles.section}>Top Artists</Text>
            <FlatList
              horizontal
              nestedScrollEnabled
              data={topArtists}
              renderItem={({ item }) => renderItem(item, 'artist')}
              keyExtractor={(item) => `artist-${item.id}`}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ padding: 8 }}
            />
            <Text style={styles.section}>New Releases</Text>
            <FlatList
              horizontal
              nestedScrollEnabled
              data={newReleases}
              renderItem={({ item }) => renderItem(item, 'album')}
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#121212',
  },
  goBackButton: { marginRight: 8 },
  goBackText: { color: '#aaa', fontWeight: 'bold', fontSize: 18 },
  searchInput: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    color: '#fff',
    borderRadius: 8,
    padding: 10,
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
