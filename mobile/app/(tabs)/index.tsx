import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Text,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AlarmPermissionModal } from '@/components/alarm-permission-modal';
import { KidProfileCard } from '@/components/kid-profile-card';
import { KidProfileModal } from '@/components/kid-profile-modal';
import type { KidView } from '@/types/children';
import { useKids } from '@/contexts/kids';
import { useAuth } from '@/hooks/use-auth';
import { useChallenge } from '@/hooks/use-challenge';
import { BlipRobot } from '@/images';

const STORAGE_KEY_ALARM_PERMISSION_ASKED = 'alarm_permission_asked';

const YELLOW = '#FFD600';
const DARK = '#2E2E00';
const DARK_OLIVE = '#3D3B00';
const WHITE = '#FFFFFF';

export default function HomeScreen() {
  const { user } = useAuth();
  const {
    kids,
    loading,
    activeChildId,
    setActiveChildId,
    updateKidInterval,
    updateKidTopics,
  } = useKids();
  const { minutesUntilNext, setIntervalMinutes, triggerChallenge } = useChallenge();
  const [, setTick] = useState(0);
  const [showAlarmPermission, setShowAlarmPermission] = useState(false);
  const [selectedKid, setSelectedKid] = useState<KidView | null>(null);

  const activeKid = kids.find((k) => k.childId === activeChildId) ?? kids[0];

  useEffect(() => {
    if (activeKid) setIntervalMinutes(activeKid.intervalMinutes);
  }, [activeKid, setIntervalMinutes]);

  const handleUpdateInterval = (childId: string, minutes: number) => {
    void updateKidInterval(childId, minutes);
    if (activeChildId === childId) setIntervalMinutes(minutes);
  };

  const handleUpdateTopics = (childId: string, topics: string[]) => {
    void updateKidTopics(childId, topics);
  };

  const handleKidPress = (kid: KidView) => {
    setActiveChildId(kid.childId);
    setSelectedKid(kid);
  };

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!user) return;
    AsyncStorage.getItem(STORAGE_KEY_ALARM_PERMISSION_ASKED).then((v) => {
      if (v !== 'true') {
        setShowAlarmPermission(true);
      }
    });
  }, [user]);

  const handleAlarmPermissionDismiss = () => {
    setShowAlarmPermission(false);
    AsyncStorage.setItem(STORAGE_KEY_ALARM_PERMISSION_ASKED, 'true');
  };

  const firstName = user?.fullName?.split(' ')[0] ?? '';

  return (
    <>
      <AlarmPermissionModal
        visible={showAlarmPermission}
        onDismiss={handleAlarmPermissionDismiss}
      />
      <KidProfileModal
        kid={selectedKid ? kids.find((k) => k.childId === selectedKid.childId) ?? selectedKid : null}
        visible={!!selectedKid}
        onClose={() => setSelectedKid(null)}
        onUpdateInterval={handleUpdateInterval}
        onUpdateTopics={handleUpdateTopics}
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingWrap}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : (
            <>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.userName}>{firstName || 'Parent'}</Text>
            </View>
            <TouchableOpacity style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {firstName ? firstName[0].toUpperCase() : 'P'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Mascot + Timer Card */}
          <View style={styles.timerCard}>
            <Image source={BlipRobot} style={styles.mascotImage} resizeMode="contain" />
            <Text style={styles.activeKidName}>{activeKid?.name ?? 'Select a kid'}</Text>
            <Text style={styles.timerLabel}>Next Challenge In</Text>
            <Text style={styles.timerValue}>
              {minutesUntilNext !== null ? `${minutesUntilNext} min` : '—'}
            </Text>
            <View style={styles.timerDivider} />
            <View style={styles.intervalBadge}>
              <Text style={styles.intervalBadgeText}>
                Every {activeKid?.intervalMinutes ?? 30} min
              </Text>
            </View>
          </View>

          {/* Test Challenge Button */}
          <TouchableOpacity
            style={styles.testBtn}
            onPress={triggerChallenge}
            activeOpacity={0.8}
          >
            <Text style={styles.testBtnText}>Test Challenge Now</Text>
          </TouchableOpacity>

          {/* Kid Profiles */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kids</Text>
            <View style={styles.profileGrid}>
              {kids.map((kid) => (
                <KidProfileCard
                  key={kid.childId}
                  kid={kid}
                  isActive={kid.childId === activeChildId}
                  onPress={handleKidPress}
                />
              ))}
            </View>
          </View>
            </>
          )}
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

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 16,
    color: DARK_OLIVE,
    fontWeight: '500',
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    color: DARK,
    marginTop: 2,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: DARK_OLIVE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: YELLOW,
    fontSize: 20,
    fontWeight: '700',
  },

  // Timer Card
  timerCard: {
    backgroundColor: WHITE,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  mascotImage: {
    width: 200,
    height: 200,
    marginBottom: 12,
  },
  activeKidName: {
    fontSize: 20,
    fontWeight: '800',
    color: DARK,
    marginBottom: 4,
  },
  timerLabel: {
    fontSize: 14,
    color: DARK_OLIVE,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  timerValue: {
    fontSize: 40,
    fontWeight: '800',
    color: DARK,
  },
  timerDivider: {
    width: 40,
    height: 3,
    backgroundColor: YELLOW,
    borderRadius: 2,
    marginVertical: 12,
  },
  intervalBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  intervalBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: DARK_OLIVE,
  },

  loadingWrap: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: DARK_OLIVE,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
    marginBottom: 12,
  },

  // Profile Grid
  profileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 14,
  },

  // Test Button
  testBtn: {
    backgroundColor: DARK_OLIVE,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  testBtnText: {
    color: YELLOW,
    fontSize: 16,
    fontWeight: '700',
  },
});
