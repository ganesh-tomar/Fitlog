import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { addDish, updateDish, getDishById } from '../db/dishes';
import { useTheme } from '../context/ThemeContext';
import { RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type AddDishRoute = RouteProp<RootStackParamList, 'AddDish'>;

function NumberField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        placeholder={placeholder}
      />
    </View>
  );
}

export default function AddDishScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<AddDishRoute>();
  const editDishId = route.params?.editDishId;

  const [name, setName] = useState('');
  const [servingSize, setServingSize] = useState('');
  const [category, setCategory] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [ingredients, setIngredients] = useState('');
  const { themeColor } = useTheme();

  useEffect(() => {
    if (editDishId) {
      getDishById(editDishId).then((dish) => {
        if (dish) {
          setName(dish.name);
          setServingSize(dish.servingSize);
          setCategory(dish.category);
          setCalories(String(Math.round(dish.calories)));
          setProtein(String(Math.round(dish.protein)));
          setCarbs(String(Math.round(dish.carbs)));
          setFat(String(Math.round(dish.fat)));
          setIngredients(dish.ingredients || '');
        }
      });
    }
  }, [editDishId]);

  const handleSave = async () => {
    if (!name.trim() || !servingSize.trim()) {
      Alert.alert('Missing info', 'Please enter a dish name and serving size.');
      return;
    }
    const cal = parseFloat(calories) || 0;
    const pro = parseFloat(protein) || 0;
    const carb = parseFloat(carbs) || 0;
    const fatVal = parseFloat(fat) || 0;

    if (cal === 0 && pro === 0 && carb === 0 && fatVal === 0) {
      Alert.alert('Missing macros', 'Enter at least one macro value.');
      return;
    }

    if (editDishId) {
      await updateDish(editDishId, {
        name,
        servingSize,
        calories: cal,
        protein: pro,
        carbs: carb,
        fat: fatVal,
        category: category || 'other',
        ingredients: ingredients,
      });
    } else {
      await addDish({
        name,
        servingSize,
        calories: cal,
        protein: pro,
        carbs: carb,
        fat: fatVal,
        category: category || 'other',
        ingredients: ingredients,
      });
    }

    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={[styles.title, { color: themeColor }]}>
            {editDishId ? 'Edit Dish' : 'Add Dish'}
          </Text>
          <Text style={styles.helperText}>
            Enter the dish and its macros per serving. You can log multiples of a serving later.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Dish name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Rajma Chawal"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Serving size</Text>
            <TextInput
              style={styles.input}
              value={servingSize}
              onChangeText={setServingSize}
              placeholder="e.g. 1 bowl (200g)"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Category (optional)</Text>
            <TextInput
              style={styles.input}
              value={category}
              onChangeText={setCategory}
              placeholder="e.g. curry, snack, dessert"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Ingredients (optional)</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              value={ingredients}
              onChangeText={setIngredients}
              placeholder="e.g. Oats, milk, cashew"
              multiline
            />
          </View>

          <NumberField label="Calories (kcal)" value={calories} onChange={setCalories} placeholder="0" />
          <NumberField label="Protein (g)" value={protein} onChange={setProtein} placeholder="0" />
          <NumberField label="Carbs (g)" value={carbs} onChange={setCarbs} placeholder="0" />
          <NumberField label="Fat (g)" value={fat} onChange={setFat} placeholder="0" />

          <TouchableOpacity style={[styles.saveButton, { backgroundColor: themeColor }]} onPress={handleSave}>
            <Text style={styles.saveButtonText}>
              {editDishId ? 'Save Changes' : 'Save Dish'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 16 },
  title: { fontSize: 24, fontWeight: '700', marginTop: 12 },
  helperText: { fontSize: 13, color: '#777', marginTop: 6, marginBottom: 18 },
  fieldGroup: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6 },
  input: {
    backgroundColor: '#F1F1F4',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
