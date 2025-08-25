import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet, 
  Image, 
  Dimensions,
  SafeAreaView,
  StatusBar
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = Math.round(screenWidth * 0.45);
const cardHeight = Math.round(cardWidth * 1.2);

export default function CategoryPlaylistsScreen({ route, navigation }) {
  const { categoryId, categoryName, token } = route.params;
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    navigation.setOptions({ title: categoryName || 'Category' });

    const fetchPlaylists = async () => {
      try {
        const res = await fetch(`https://api.spotify.com/v1/browse/categories/${categoryId}/playlists?limit=20`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.error || !data.playlists) {

          // Fallback: search playlists by category name
          const fallbackRes = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(categoryName)}&type=playlist&limit=20`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const fallbackData = await fallbackRes.json();

          const validPlaylists = fallbackData.playlists?.items?.filter(p => p !== null) || [];
          if (!validPlaylists.length) setError('No playlists found for this category.');
          setPlaylists(validPlaylists);
        } else {
          setPlaylists(data.playlists.items || []);
          if (!data.playlists.items.length) setError('No playlists found for this category.');
        }
      } catch (err) {
        setError('An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, [categoryId, categoryName, token]);

  const renderItem = ({ item }) => {
    const imageUrl = item.images?.[0]?.url;

    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => navigation.navigate('Playlist', { playlistId: item.id, token })}
      >
        {imageUrl && (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        )}
        <Text style={styles.title} numberOfLines={2}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} color="#1db954" />;
  if (error) return <View style={styles.center}><Text style={{ color: 'red' }}>{error}</Text></View>;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <FlatList
        data={playlists}
        keyExtractor={(item, index) => item?.id || `playlist-${index}`}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={{ padding: 16 }}
        columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 16 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { 
    width: cardWidth, 
    height: cardHeight, 
    backgroundColor: '#1e1e1e', 
    borderRadius: 8, 
    padding: 8, 
    alignItems: 'center' 
  },
  image: { 
    width: cardWidth - 16, 
    height: cardWidth - 16, 
    borderRadius: 8, 
    marginBottom: 8 
  },
  title: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
});
