import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { searchDishes, deleteDish } from '../db/dishes';
import { useTheme } from '../context/ThemeContext';
import { Dish, RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function DishesScreen() {
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState('');
  const [dishes, setDishes] = useState<Dish[]>([]);
  const { themeColor } = useTheme();

  const load = useCallback(async (q: string) => {
    const results = await searchDishes(q);
    setDishes(results);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(query);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [load])
  );

  const handleSearchChange = (text: string) => {
    setQuery(text);
    load(text);
  };

  const handleLongPress = (item: Dish) => {
    Alert.alert(
      item.name,
      'Manage this dish.',
      [
        { text: 'Log Dish', onPress: () => navigation.navigate('LogDish', { dish: item }) },
        { text: 'Edit Dish', onPress: () => navigation.navigate('AddDish', { editDishId: item.id }) },
        {
          text: 'Delete Dish',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Delete', 'Are you sure you want to delete this dish?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                  await deleteDish(item.id);
                  load(query);
                },
              },
            ]);
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: themeColor }]}>Dishes</Text>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search dishes..."
        value={query}
        onChangeText={handleSearchChange}
      />

      <FlatList
        data={dishes}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 80 }}
        ListEmptyComponent={<Text style={styles.emptyText}>No dishes found.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.dishRow}
            onPress={() => navigation.navigate('LogDish', { dish: item })}
            onLongPress={() => handleLongPress(item)}
            delayLongPress={500}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.dishName}>{item.name}</Text>
              {item.ingredients ? (
                <Text style={styles.dishIngredients} numberOfLines={1}>
                  {item.ingredients}
                </Text>
              ) : null}
              <Text style={styles.dishSub}>
                {item.servingSize} · {Math.round(item.calories)} kcal · P{item.protein} C{item.carbs} F{item.fat}
              </Text>
            </View>
            {item.source === 'custom' && (
              <Text style={[styles.customBadge, { color: themeColor, borderColor: themeColor }]}>
                My dish
              </Text>
            )}
          </TouchableOpacity>
        )}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: themeColor }]}
        onPress={() => navigation.navigate('AddDish')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 16 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  title: { fontSize: 26, fontWeight: '700' },
  searchInput: {
    backgroundColor: '#F1F1F4',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginVertical: 14,
    fontSize: 15,
  },
  emptyText: { color: '#888', marginTop: 20, textAlign: 'center' },
  dishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  dishName: { fontSize: 15, fontWeight: '600', color: '#222' },
  dishIngredients: { fontSize: 12, color: '#666', fontStyle: 'italic', marginTop: 2 },
  dishSub: { fontSize: 12, color: '#777', marginTop: 3 },
  customBadge: {
    fontSize: 11,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '300',
    marginTop: -2,
  },
});
