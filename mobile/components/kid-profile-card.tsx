import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import type { KidView } from '@/types/children';

const YELLOW = '#FFD600';
const DARK = '#2E2E00';
const DARK_OLIVE = '#3D3B00';
const WHITE = '#FFFFFF';

interface KidProfileCardProps {
  kid: KidView;
  isActive?: boolean;
  onPress: (kid: KidView) => void;
}

export function KidProfileCard({ kid, isActive, onPress }: KidProfileCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, isActive && styles.cardActive]}
      onPress={() => onPress(kid)}
      activeOpacity={0.85}
    >
      {isActive && (
        <View style={styles.activeBadge}>
          <Text style={styles.activeBadgeText}>Active</Text>
        </View>
      )}
      <View style={[styles.avatar, { backgroundColor: kid.avatarColor }]}>
        <Text style={styles.avatarEmoji}>{kid.avatarEmoji}</Text>
      </View>
      <Text style={styles.name}>{kid.name}</Text>
      <Text style={styles.age}>Ages {kid.ageGroup}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    width: '47%',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardActive: {
    borderColor: DARK_OLIVE,
    backgroundColor: '#FFFDE7',
  },
  activeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: YELLOW,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: DARK_OLIVE,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarEmoji: {
    fontSize: 36,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK,
  },
  age: {
    fontSize: 13,
    color: DARK_OLIVE,
    marginTop: 2,
  },
});
