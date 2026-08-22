import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { logDish } from '../db/logs';
import { deleteDish } from '../db/dishes';
import { useTheme } from '../context/ThemeContext';
import { RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type LogDishRoute = RouteProp<RootStackParamList, 'LogDish'>;

const QUICK_MULTIPLIERS = [0.5, 1, 1.5, 2];

export default function LogDishScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<LogDishRoute>();
  const { dish } = route.params;
  const [multiplier, setMultiplier] = useState('1');
  const { themeColor } = useTheme();

  const parsedMultiplier = useMemo(() => {
    const n = parseFloat(multiplier);
    return isNaN(n) || n <= 0 ? 0 : n;
  }, [multiplier]);

  const computed = useMemo(
    () => ({
      calories: dish.calories * parsedMultiplier,
      protein: dish.protein * parsedMultiplier,
      carbs: dish.carbs * parsedMultiplier,
      fat: dish.fat * parsedMultiplier,
    }),
    [dish, parsedMultiplier]
  );

  const handleLog = async () => {
    if (parsedMultiplier <= 0) return;
    await logDish(dish, parsedMultiplier);
    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert('Delete Dish', 'Are you sure you want to delete this dish?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteDish(dish.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={[styles.title, { color: themeColor }]}>{dish.name}</Text>
      <Text style={styles.subtitle}>Base serving: {dish.servingSize}</Text>
      {dish.ingredients ? (
        <View style={styles.ingredientsContainer}>
          <Text style={styles.ingredientsLabel}>Ingredients:</Text>
          <Text style={styles.ingredientsText}>{dish.ingredients}</Text>
        </View>
      ) : null}

      <Text style={styles.fieldLabel}>Number of servings</Text>
      <View style={styles.quickRow}>
        {QUICK_MULTIPLIERS.map((m) => (
          <TouchableOpacity
            key={m}
            style={[
              styles.quickButton,
              { borderColor: themeColor },
              multiplier === String(m) && { backgroundColor: themeColor },
            ]}
            onPress={() => setMultiplier(String(m))}
          >
            <Text
              style={[
                styles.quickButtonText,
                { color: themeColor },
                multiplier === String(m) && styles.quickButtonTextActive,
              ]}
            >
              {m}x
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={styles.input}
        value={multiplier}
        onChangeText={setMultiplier}
        keyboardType="numeric"
        placeholder="1"
      />

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>This entry adds:</Text>
        <Text style={styles.summaryLine}>{Math.round(computed.calories)} kcal</Text>
        <Text style={styles.summaryLine}>Protein: {Math.round(computed.protein)} g</Text>
        <Text style={styles.summaryLine}>Carbs: {Math.round(computed.carbs)} g</Text>
        <Text style={styles.summaryLine}>Fat: {Math.round(computed.fat)} g</Text>
      </View>

      <TouchableOpacity
        style={[
          styles.logButton,
          { backgroundColor: themeColor },
          parsedMultiplier <= 0 && styles.logButtonDisabled,
        ]}
        onPress={handleLog}
        disabled={parsedMultiplier <= 0}
      >
        <Text style={styles.logButtonText}>Log to Today</Text>
      </TouchableOpacity>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: themeColor }]}
          onPress={() => navigation.navigate('AddDish', { editDishId: dish.id })}
        >
          <Text style={[styles.actionBtnText, { color: themeColor }]}>Edit Dish</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={handleDelete}
        >
          <Text style={[styles.actionBtnText, styles.deleteBtnText]}>Delete Dish</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 16 },
  title: { fontSize: 24, fontWeight: '700', marginTop: 16 },
  subtitle: { fontSize: 13, color: '#777', marginTop: 4, marginBottom: 20 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 8 },
  quickRow: { flexDirection: 'row', marginBottom: 12 },
  quickButton: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
  },
  quickButtonText: { fontWeight: '600' },
  quickButtonTextActive: { color: '#fff' },
  input: {
    backgroundColor: '#F1F1F4',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  ingredientsContainer: {
    backgroundColor: '#F7F7F9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  ingredientsLabel: { fontSize: 13, fontWeight: '700', color: '#444', marginBottom: 4 },
  ingredientsText: { fontSize: 13, color: '#555', lineHeight: 18 },
  summaryCard: { backgroundColor: '#F7F7F9', borderRadius: 14, padding: 16, marginBottom: 24 },
  summaryTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8, color: '#333' },
  summaryLine: { fontSize: 14, color: '#555', marginBottom: 4 },
  logButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  logButtonDisabled: { backgroundColor: '#B7CDD8' },
  logButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionBtn: {
    flex: 0.48,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionBtnText: {
    fontWeight: '700',
    fontSize: 15,
  },
  deleteBtn: {
    borderColor: '#D64545',
  },
  deleteBtnText: {
    color: '#D64545',
  },
});
