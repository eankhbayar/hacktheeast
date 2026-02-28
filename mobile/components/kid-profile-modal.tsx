import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import type { KidView } from '@/types/children';

const INTERVAL_OPTIONS = [15, 30, 45, 60];

const WEEKLY_DATA = [
  { day: 'Mon', correct: 5, total: 8 },
  { day: 'Tue', correct: 3, total: 6 },
  { day: 'Wed', correct: 7, total: 9 },
  { day: 'Thu', correct: 4, total: 7 },
  { day: 'Fri', correct: 6, total: 6 },
  { day: 'Sat', correct: 2, total: 5 },
  { day: 'Sun', correct: 1, total: 10 },
];

const YELLOW = '#FFD600';
const DARK = '#2E2E00';
const DARK_OLIVE = '#3D3B00';
const WHITE = '#FFFFFF';

interface KidProfileModalProps {
  kid: KidView | null;
  visible: boolean;
  onClose: () => void;
  onUpdateInterval: (childId: string, minutes: number) => void | Promise<void>;
  onUpdateTopics: (childId: string, topics: string[]) => void | Promise<void>;
}

export function KidProfileModal({
  kid,
  visible,
  onClose,
  onUpdateInterval,
  onUpdateTopics,
}: KidProfileModalProps) {
  const [showIntervalPicker, setShowIntervalPicker] = useState(false);
  const [showTopicEditor, setShowTopicEditor] = useState(false);
  const [showWeeklyChart, setShowWeeklyChart] = useState(false);
  const [newTopic, setNewTopic] = useState('');

  if (!kid) return null;

  const handleIntervalChange = (minutes: number) => {
    void onUpdateInterval(kid.childId, minutes);
  };

  const handleRemoveTopic = (topic: string) => {
    void onUpdateTopics(kid.childId, kid.learningFocus.filter((t) => t !== topic));
  };

  const handleAddTopic = () => {
    const trimmed = newTopic.trim();
    if (!trimmed || kid.learningFocus.includes(trimmed)) return;
    void onUpdateTopics(kid.childId, [...kid.learningFocus, trimmed]);
    setNewTopic('');
  };

  const handleClose = () => {
    setShowIntervalPicker(false);
    setShowTopicEditor(false);
    setShowWeeklyChart(false);
    setNewTopic('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Avatar + Name */}
            <View style={styles.header}>
              <View style={[styles.avatar, { backgroundColor: kid.avatarColor }]}>
                <Text style={styles.avatarEmoji}>{kid.avatarEmoji}</Text>
              </View>
              <Text style={styles.name}>{kid.name}</Text>
              <Text style={styles.age}>Ages {kid.ageGroup}</Text>
            </View>

            {/* Peak Interests */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>⭐</Text>
                <Text style={styles.sectionTitle}>Peak Interests</Text>
              </View>
              <View style={styles.chipRow}>
                {kid.interests.map((interest) => (
                  <View key={interest} style={styles.chip}>
                    <Text style={styles.chipText}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Current Topic Set */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>📚</Text>
                <Text style={styles.sectionTitle}>Current Topics</Text>
              </View>
              <View style={styles.chipRow}>
                {kid.learningFocus.map((topic) => (
                  <View key={topic} style={[styles.chip, styles.chipTopic]}>
                    <Text style={[styles.chipText, styles.chipTopicText]}>{topic}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Show More — Weekly Chart */}
            <TouchableOpacity
              style={styles.showMoreBtn}
              onPress={() => setShowWeeklyChart(!showWeeklyChart)}
              activeOpacity={0.7}
            >
              <Text style={styles.showMoreText}>
                {showWeeklyChart ? 'Show Less' : 'Show More'}
              </Text>
            </TouchableOpacity>

            {showWeeklyChart && (
              <View style={styles.chartSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionIcon}>📊</Text>
                  <Text style={styles.sectionTitle}>Past Week</Text>
                </View>
                <View style={styles.chartContainer}>
                  {WEEKLY_DATA.map((d) => {
                    const pct = d.total > 0 ? (d.correct / d.total) * 100 : 0;
                    return (
                      <View key={d.day} style={styles.chartColumn}>
                        <Text style={styles.chartFraction}>
                          {d.correct}/{d.total}
                        </Text>
                        <View style={styles.chartBarBg}>
                          <View
                            style={[
                              styles.chartBarFill,
                              { height: `${pct}%` },
                              d.correct <= 1 && styles.chartBarWeak,
                            pct === 100 && styles.chartBarPerfect,
                            ]}
                          />
                        </View>
                        <Text style={styles.chartDay}>{d.day}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Set Interval */}
            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.8}
              onPress={() => setShowIntervalPicker(!showIntervalPicker)}
            >
              <View>
                <Text style={styles.actionBtnText}>Set Interval</Text>
                <Text style={styles.actionBtnSub}>{kid.intervalMinutes} min</Text>
              </View>
              <Text style={styles.actionArrow}>{showIntervalPicker ? '‹' : '›'}</Text>
            </TouchableOpacity>

            {showIntervalPicker && (
              <View style={styles.expandedSection}>
                <View style={styles.intervalRow}>
                  {INTERVAL_OPTIONS.map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[
                        styles.intervalPill,
                        kid.intervalMinutes === m && styles.intervalPillActive,
                      ]}
                      onPress={() => handleIntervalChange(m)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.intervalPillText,
                          kid.intervalMinutes === m && styles.intervalPillTextActive,
                        ]}
                      >
                        {m} min
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Manage Topics */}
            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.8}
              onPress={() => setShowTopicEditor(!showTopicEditor)}
            >
              <View>
                <Text style={styles.actionBtnText}>Manage Topics</Text>
                <Text style={styles.actionBtnSub}>{kid.learningFocus.length} topics</Text>
              </View>
              <Text style={styles.actionArrow}>{showTopicEditor ? '‹' : '›'}</Text>
            </TouchableOpacity>

            {showTopicEditor && (
              <View style={styles.expandedSection}>
                <View style={styles.chipRow}>
                  {kid.learningFocus.map((topic) => (
                    <TouchableOpacity
                      key={topic}
                      style={[styles.chip, styles.chipRemovable]}
                      onPress={() => handleRemoveTopic(topic)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.chipText}>{topic}</Text>
                      <Text style={styles.chipRemoveIcon}> ✕</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.addTopicRow}>
                  <TextInput
                    style={styles.addTopicInput}
                    placeholder="Add a topic..."
                    placeholderTextColor="#A0A0A0"
                    value={newTopic}
                    onChangeText={setNewTopic}
                    onSubmitEditing={handleAddTopic}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    style={styles.addTopicBtn}
                    onPress={handleAddTopic}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.addTopicBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Close */}
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.7}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: WHITE,
    borderRadius: 28,
    padding: 24,
    width: '100%',
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },

  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarEmoji: {
    fontSize: 44,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: DARK,
  },
  age: {
    fontSize: 14,
    color: DARK_OLIVE,
    marginTop: 2,
  },

  section: {
    marginBottom: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 20,
    color: '#555',
    paddingLeft: 22,
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingLeft: 22,
  },
  chip: {
    backgroundColor: YELLOW,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: DARK,
  },
  chipTopic: {
    backgroundColor: '#F0F0F0',
  },
  chipTopicText: {
    color: DARK_OLIVE,
  },
  chipRemovable: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  chipRemoveIcon: {
    fontSize: 12,
    color: '#C62828',
    fontWeight: '700',
  },

  showMoreBtn: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  showMoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: DARK_OLIVE,
  },

  chartSection: {
    marginBottom: 18,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 130,
    paddingLeft: 22,
    paddingRight: 4,
    marginTop: 4,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
  },
  chartFraction: {
    fontSize: 10,
    fontWeight: '700',
    color: DARK_OLIVE,
    marginBottom: 4,
  },
  chartBarBg: {
    width: 22,
    height: 80,
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBarFill: {
    width: '100%',
    backgroundColor: YELLOW,
    borderRadius: 6,
  },
  chartBarWeak: {
    backgroundColor: '#D32F2F',
  },
  chartBarPerfect: {
    backgroundColor: '#4CAF50',
  },
  chartDay: {
    fontSize: 11,
    fontWeight: '600',
    color: DARK_OLIVE,
    marginTop: 4,
  },

  actionBtn: {
    backgroundColor: YELLOW,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
  },
  actionBtnSub: {
    fontSize: 12,
    color: DARK_OLIVE,
    marginTop: 1,
  },
  actionArrow: {
    fontSize: 22,
    fontWeight: '700',
    color: DARK_OLIVE,
  },

  expandedSection: {
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    marginTop: -4,
  },
  intervalRow: {
    flexDirection: 'row',
    gap: 8,
  },
  intervalPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: WHITE,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  intervalPillActive: {
    backgroundColor: DARK_OLIVE,
    borderColor: DARK_OLIVE,
  },
  intervalPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: DARK,
  },
  intervalPillTextActive: {
    color: YELLOW,
  },

  addTopicRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingLeft: 22,
  },
  addTopicInput: {
    flex: 1,
    backgroundColor: WHITE,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: DARK,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  addTopicBtn: {
    backgroundColor: DARK_OLIVE,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  addTopicBtnText: {
    color: YELLOW,
    fontSize: 14,
    fontWeight: '700',
  },

  closeBtn: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#999',
  },
});
