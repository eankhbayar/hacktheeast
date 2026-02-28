import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Modal,
  Pressable,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useKids } from '@/contexts/kids';
import { KidProfileModal } from '@/components/kid-profile-modal';
import type { KidView } from '@/types/children';
import { BlipHead } from '@/images';

const YELLOW = '#FFD600';
const DARK = '#2E2E00';
const DARK_OLIVE = '#3D3B00';
const WHITE = '#FFFFFF';
const ACCENT_RED = '#D32F2F';

export default function SettingsScreen() {
  const {
    kids,
    isLoading,
    addKid,
    removeKid,
    updateKidInterval,
    updateKidTopics,
    toggleKidActive,
  } = useKids();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [selectedKid, setSelectedKid] = useState<KidView | null>(null);

  const handleUpdateInterval = (kidId: string, minutes: number) => {
    updateKidInterval(kidId, minutes);
  };

  const handleUpdateTopics = (kidId: string, topics: string[]) => {
    updateKidTopics(kidId, topics);
  };

  const closeForm = () => {
    setShowForm(false);
    setName('');
    setAge('');
  };

  const handleAddKid = async () => {
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
    try {
      await addKid(trimmedName, parsedAge);
      closeForm();
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to add child'
      );
    }
  };

  const handleRemoveKid = (childId: string, kidName: string) => {
    Alert.alert(
      'Remove Profile',
      `Are you sure you want to remove ${kidName}'s profile?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => void removeKid(childId),
        },
      ]
    );
  };

  return (
    <>
      <KidProfileModal
        kid={
          selectedKid
            ? kids.find((k) => k.childId === selectedKid.childId) ?? selectedKid
            : null
        }
        visible={!!selectedKid}
        onClose={() => setSelectedKid(null)}
        onUpdateInterval={handleUpdateInterval}
        onUpdateTopics={handleUpdateTopics}
      />

      <Modal visible={showForm} transparent animationType="fade" onRequestClose={closeForm}>
        <Pressable style={styles.backdrop} onPress={closeForm}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
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
              placeholder="Age (2–12)"
              placeholderTextColor="#A0A0A0"
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              maxLength={2}
            />

            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={closeForm}
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
          </Pressable>
        </Pressable>
      </Modal>

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
          {isLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="small" color={DARK_OLIVE} />
              <Text style={[styles.emptyText, { marginTop: 12 }]}>
                Loading profiles...
              </Text>
            </View>
          ) : (
            <>
          {kids.map((kid) => (
            <TouchableOpacity
              key={kid.childId}
              style={[styles.kidRow, !kid.isActive && styles.kidRowInactive]}
              activeOpacity={0.7}
              onPress={() => setSelectedKid(kid)}
            >
              <View style={[styles.kidAvatar, { backgroundColor: kid.avatarColor }]}>
                <Text style={styles.kidAvatarEmoji}>{kid.avatarEmoji}</Text>
              </View>
              <View style={styles.kidInfo}>
                <Text style={styles.kidName}>{kid.name}</Text>
                <Text style={styles.kidMeta}>
                  Ages {kid.ageGroup} · {kid.intervalMinutes} min ·{' '}
                  {kid.isActive ? 'Active' : 'Paused'}
                </Text>
              </View>
              <Switch
                value={kid.isActive}
                onValueChange={() => void toggleKidActive(kid.childId)}
                trackColor={{ false: '#E0E0E0', true: '#A8D800' }}
                thumbColor={WHITE}
                style={styles.toggle}
              />
              <TouchableOpacity
                onPress={() => handleRemoveKid(kid.childId, kid.name)}
                style={styles.removeBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}

          {kids.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No profiles yet. Add a kid to get started.</Text>
            </View>
          )}
            </>
          )}
        </View>

        {/* Add Kid */}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowForm(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+ Add Kid</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
    </>
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
  kidRowInactive: {
    opacity: 0.5,
  },
  toggle: {
    marginRight: 8,
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

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: WHITE,
    borderRadius: 28,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
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
