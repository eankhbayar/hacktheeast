import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useKids } from '@/contexts/kids';
import { BlipHead } from '@/images';
import { Image } from 'react-native';

const YELLOW = '#FFD600';
const DARK = '#2E2E00';
const DARK_OLIVE = '#3D3B00';
const WHITE = '#FFFFFF';
const ACCENT_RED = '#D32F2F';

export default function SettingsScreen() {
  const { kids, addKid, removeKid } = useKids();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');

  const handleAddKid = () => {
    const trimmedName = name.trim();
    const parsedAge = parseInt(age, 10);
    if (!trimmedName) {
      Alert.alert('Missing name', 'Please enter a name for the child.');
      return;
    }
    if (isNaN(parsedAge) || parsedAge < 1 || parsedAge > 18) {
      Alert.alert('Invalid age', 'Please enter an age between 1 and 18.');
      return;
    }
    addKid(trimmedName, parsedAge);
    setName('');
    setAge('');
    setShowForm(false);
  };

  const handleRemoveKid = (kidId: string, kidName: string) => {
    Alert.alert(
      'Remove Profile',
      `Are you sure you want to remove ${kidName}'s profile?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeKid(kidId) },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Image source={BlipHead} style={styles.headerIcon} resizeMode="contain" />
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* Existing Profiles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kid Profiles</Text>
          {kids.map((kid) => (
            <View key={kid.id} style={styles.kidRow}>
              <View style={[styles.kidAvatar, { backgroundColor: kid.avatarColor }]}>
                <Text style={styles.kidAvatarEmoji}>{kid.avatarEmoji}</Text>
              </View>
              <View style={styles.kidInfo}>
                <Text style={styles.kidName}>{kid.name}</Text>
                <Text style={styles.kidMeta}>
                  Age {kid.age} · {kid.intervalMinutes} min interval · {kid.currentTopicSet.length} topics
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleRemoveKid(kid.id, kid.name)}
                style={styles.removeBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          {kids.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No profiles yet. Add a kid to get started.</Text>
            </View>
          )}
        </View>

        {/* Add Kid */}
        {!showForm ? (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowForm(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>+ Add Kid</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>New Profile</Text>

            <TextInput
              style={styles.input}
              placeholder="Child's name"
              placeholderTextColor="#A0A0A0"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoFocus
            />

            <TextInput
              style={styles.input}
              placeholder="Age (1–18)"
              placeholderTextColor="#A0A0A0"
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              maxLength={2}
            />

            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setShowForm(false);
                  setName('');
                  setAge('');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleAddKid}
                activeOpacity={0.8}
              >
                <Text style={styles.saveBtnText}>Create Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: YELLOW,
  },
  scrollView: {
    flex: 1,
    backgroundColor: YELLOW,
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 24,
    gap: 12,
  },
  headerIcon: {
    width: 36,
    height: 36,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: DARK,
  },

  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
    marginBottom: 12,
  },

  kidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  kidAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  kidAvatarEmoji: {
    fontSize: 24,
  },
  kidInfo: {
    flex: 1,
  },
  kidName: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK,
  },
  kidMeta: {
    fontSize: 12,
    color: DARK_OLIVE,
    marginTop: 2,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: ACCENT_RED,
  },

  emptyState: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },

  addBtn: {
    backgroundColor: DARK_OLIVE,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  addBtnText: {
    color: YELLOW,
    fontSize: 16,
    fontWeight: '700',
  },

  formCard: {
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    color: DARK,
    marginBottom: 12,
  },
  formActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#888',
  },
  saveBtn: {
    flex: 2,
    backgroundColor: DARK_OLIVE,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    color: YELLOW,
    fontSize: 15,
    fontWeight: '700',
  },
});
