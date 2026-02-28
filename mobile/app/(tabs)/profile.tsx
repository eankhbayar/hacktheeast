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
import { router } from 'expo-router';
import { useKids } from '@/contexts/kids';
import { useAuth } from '@/hooks/use-auth';
import { BlipHead } from '@/images';
import { Image } from 'react-native';

const AGE_GROUPS = ['5-7', '8-10', '11-13'] as const;

const YELLOW = '#FFD600';
const DARK = '#2E2E00';
const DARK_OLIVE = '#3D3B00';
const WHITE = '#FFFFFF';
const ACCENT_RED = '#D32F2F';

export default function ProfileScreen() {
  const { logout } = useAuth();
  const { kids, loading, error, addKid, removeKid } = useKids();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [ageGroup, setAgeGroup] = useState<string>('8-10');
  const [submitting, setSubmitting] = useState(false);

  const handleAddKid = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Missing name', 'Please enter a name for the child.');
      return;
    }
    setSubmitting(true);
    try {
      await addKid(trimmedName, ageGroup);
      setName('');
      setAgeGroup('8-10');
      setShowForm(false);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (err instanceof Error ? err.message : 'Failed to create profile');
      const status = (err as { response?: { status?: number } })?.response?.status;
      Alert.alert(
        'Error',
        status === 404
          ? 'Could not create profile. Please try again.'
          : msg
      );
    } finally {
      setSubmitting(false);
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
          onPress: async () => {
            try {
              await removeKid(childId);
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to remove profile');
            }
          },
        },
      ],
    );
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
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
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Existing Profiles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kid Profiles</Text>
          {loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Loading...</Text>
            </View>
          ) : (
            <>
          {kids.map((kid) => (
            <View key={kid.childId} style={styles.kidRow}>
              <View style={[styles.kidAvatar, { backgroundColor: kid.avatarColor }]}>
                <Text style={styles.kidAvatarEmoji}>{kid.avatarEmoji}</Text>
              </View>
              <View style={styles.kidInfo}>
                <Text style={styles.kidName}>{kid.name}</Text>
                <Text style={styles.kidMeta}>
                  Ages {kid.ageGroup} · {kid.intervalMinutes} min interval · {kid.learningFocus.length} topics
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleRemoveKid(kid.childId, kid.name)}
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
            </>
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

            <Text style={styles.label}>Age group</Text>
            <View style={styles.ageGroupRow}>
              {AGE_GROUPS.map((ag) => (
                <TouchableOpacity
                  key={ag}
                  style={[styles.ageGroupBtn, ageGroup === ag && styles.ageGroupBtnActive]}
                  onPress={() => setAgeGroup(ag)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.ageGroupBtnText, ageGroup === ag && styles.ageGroupBtnTextActive]}>
                    {ag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setShowForm(false);
                  setName('');
                  setAgeGroup('8-10');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleAddKid}
                activeOpacity={0.8}
                disabled={submitting}
              >
                <Text style={styles.saveBtnText}>{submitting ? 'Creating...' : 'Create Profile'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Sign Out */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK_OLIVE,
    marginBottom: 8,
  },
  ageGroupRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  ageGroupBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: WHITE,
  },
  ageGroupBtnActive: {
    borderColor: DARK_OLIVE,
    backgroundColor: DARK_OLIVE,
  },
  ageGroupBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: DARK,
  },
  ageGroupBtnTextActive: {
    color: YELLOW,
  },
  errorBox: {
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorText: {
    fontSize: 14,
    color: '#C62828',
    fontWeight: '600',
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

  logoutBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 24,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: ACCENT_RED,
  },
});
