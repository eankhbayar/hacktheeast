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
import type { KidProfile } from '@/data/kids';

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

const AVG_TIME_DATA = [
  { day: 'Mon', seconds: 18 },
  { day: 'Tue', seconds: 25 },
  { day: 'Wed', seconds: 12 },
  { day: 'Thu', seconds: 22 },
  { day: 'Fri', seconds: 10 },
  { day: 'Sat', seconds: 30 },
  { day: 'Sun', seconds: 15 },
];

const TOPIC_ACCURACY = [
  { topic: 'Math', correct: 18, total: 24 },
  { topic: 'Science', correct: 9, total: 12 },
  { topic: 'Geography', correct: 5, total: 10 },
  { topic: 'Language', correct: 7, total: 8 },
];

const SUMMARY_STATS = {
  totalAttempted: 54,
  avgAccuracy: 72,
  currentStreak: 4,
  avgTimeSec: 19,
};

const RECOMMENDATIONS = [
  { topic: 'Geography', reason: 'Accuracy dropped to 50% this week' },
  { topic: 'Fractions', reason: 'New topic matching current math level' },
  { topic: 'Reading Comprehension', reason: 'Builds on strong language skills' },
  { topic: 'Basic Physics', reason: 'Complements science interest' },
];

const YELLOW = '#FFD600';
const DARK = '#2E2E00';
const DARK_OLIVE = '#3D3B00';
const WHITE = '#FFFFFF';

interface KidProfileModalProps {
  kid: KidProfile | null;
  visible: boolean;
  onClose: () => void;
  onUpdateInterval: (kidId: string, minutes: number) => void;
  onUpdateTopics: (kidId: string, topics: string[]) => void;
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
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [newTopic, setNewTopic] = useState('');

  if (!kid) return null;

  const handleIntervalChange = (minutes: number) => {
    onUpdateInterval(kid.id, minutes);
  };

  const handleRemoveTopic = (topic: string) => {
    onUpdateTopics(kid.id, kid.currentTopicSet.filter((t) => t !== topic));
  };

  const handleAddTopic = () => {
    const trimmed = newTopic.trim();
    if (!trimmed || kid.currentTopicSet.includes(trimmed)) return;
    onUpdateTopics(kid.id, [...kid.currentTopicSet, trimmed]);
    setNewTopic('');
  };

  const handleClose = () => {
    setShowIntervalPicker(false);
    setShowTopicEditor(false);
    setShowWeeklyChart(false);
    setShowRecommendations(false);
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
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <View style={styles.card}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces
            nestedScrollEnabled
          >
            {/* Avatar + Name */}
            <View style={styles.header}>
              <View style={[styles.avatar, { backgroundColor: kid.avatarColor }]}>
                <Text style={styles.avatarEmoji}>{kid.avatarEmoji}</Text>
              </View>
              <Text style={styles.name}>{kid.name}</Text>
              <Text style={styles.age}>Age {kid.age}</Text>
            </View>

            {/* Last Activity */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>🕐</Text>
                <Text style={styles.sectionTitle}>Last Activity</Text>
              </View>
              <Text style={styles.sectionBody}>{kid.lastActivity}</Text>
            </View>

            {/* Peak Interests */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>⭐</Text>
                <Text style={styles.sectionTitle}>Peak Interests</Text>
              </View>
              <View style={styles.chipRow}>
                {kid.peakInterests.map((interest) => (
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
                {kid.currentTopicSet.map((topic) => (
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
              <>
                {/* Summary Stats */}
                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{SUMMARY_STATS.totalAttempted}</Text>
                    <Text style={styles.statLabel}>Questions</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{SUMMARY_STATS.avgAccuracy}%</Text>
                    <Text style={styles.statLabel}>Accuracy</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{SUMMARY_STATS.currentStreak}d</Text>
                    <Text style={styles.statLabel}>Streak</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{SUMMARY_STATS.avgTimeSec}s</Text>
                    <Text style={styles.statLabel}>Avg Time</Text>
                  </View>
                </View>

                {/* Weekly Accuracy Chart */}
                <View style={styles.chartSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionIcon}>📊</Text>
                    <Text style={styles.sectionTitle}>Weekly Accuracy</Text>
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

                {/* Avg Time Per Question Chart */}
                <View style={styles.chartSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionIcon}>⏱</Text>
                    <Text style={styles.sectionTitle}>Avg Time / Question</Text>
                  </View>
                  <View style={styles.hBarList}>
                    {AVG_TIME_DATA.map((d) => {
                      const maxSec = Math.max(...AVG_TIME_DATA.map((x) => x.seconds));
                      const pct = maxSec > 0 ? (d.seconds / maxSec) * 100 : 0;
                      return (
                        <View key={d.day} style={styles.hBarRow}>
                          <Text style={styles.hBarLabel}>{d.day}</Text>
                          <View style={styles.hBarTrack}>
                            <View
                              style={[
                                styles.hBarFill,
                                { width: `${pct}%` },
                                d.seconds >= 25 && styles.hBarSlow,
                              ]}
                            />
                          </View>
                          <Text style={styles.hBarValue}>{d.seconds}s</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* Topic Accuracy Breakdown */}
                <View style={styles.chartSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionIcon}>🎯</Text>
                    <Text style={styles.sectionTitle}>Topic Accuracy</Text>
                  </View>
                  <View style={styles.hBarList}>
                    {TOPIC_ACCURACY.map((t) => {
                      const pct = t.total > 0 ? (t.correct / t.total) * 100 : 0;
                      return (
                        <View key={t.topic} style={styles.hBarRow}>
                          <Text style={[styles.hBarLabel, styles.hBarLabelWide]}>
                            {t.topic}
                          </Text>
                          <View style={styles.hBarTrack}>
                            <View
                              style={[
                                styles.hBarFill,
                                { width: `${pct}%` },
                                pct < 60 && styles.hBarWeak,
                                pct === 100 && styles.hBarPerfect,
                              ]}
                            />
                          </View>
                          <Text style={styles.hBarValue}>{Math.round(pct)}%</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </>
            )}

            {/* Recommendations */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.sectionHeader}
                activeOpacity={0.6}
                onPress={() => setShowRecommendations(!showRecommendations)}
              >
                <Text style={styles.sectionIcon}>💡</Text>
                <Text style={styles.sectionTitle}>Recommendations</Text>
                <Text style={styles.sectionToggle}>
                  {showRecommendations ? 'Hide' : `Show ${RECOMMENDATIONS.length}`}
                </Text>
              </TouchableOpacity>
            </View>

            {showRecommendations && (
              <View style={styles.expandedSection}>
                {RECOMMENDATIONS.map((r, i) => (
                  <View
                    key={r.topic}
                    style={[styles.recCard, i < RECOMMENDATIONS.length - 1 && styles.recCardBorder]}
                  >
                    <Text style={styles.recTopic}>{r.topic}</Text>
                    <Text style={styles.recReason}>{r.reason}</Text>
                  </View>
                ))}
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
                <Text style={styles.actionBtnSub}>{kid.currentTopicSet.length} topics</Text>
              </View>
              <Text style={styles.actionArrow}>{showTopicEditor ? '‹' : '›'}</Text>
            </TouchableOpacity>

            {showTopicEditor && (
              <View style={styles.expandedSection}>
                <View style={styles.chipRow}>
                  {kid.currentTopicSet.map((topic) => (
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
        </View>
      </View>
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
  sectionToggle: {
    fontSize: 12,
    fontWeight: '600',
    color: DARK_OLIVE,
    marginLeft: 'auto',
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

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    minWidth: '40%',
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: DARK,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: DARK_OLIVE,
    marginTop: 2,
  },

  hBarList: {
    paddingLeft: 22,
    gap: 8,
    marginTop: 4,
  },
  hBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hBarLabel: {
    width: 32,
    fontSize: 11,
    fontWeight: '600',
    color: DARK_OLIVE,
  },
  hBarLabelWide: {
    width: 72,
  },
  hBarTrack: {
    flex: 1,
    height: 14,
    backgroundColor: '#F0F0F0',
    borderRadius: 7,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  hBarFill: {
    height: '100%',
    backgroundColor: YELLOW,
    borderRadius: 7,
  },
  hBarSlow: {
    backgroundColor: '#FF9800',
  },
  hBarWeak: {
    backgroundColor: '#D32F2F',
  },
  hBarPerfect: {
    backgroundColor: '#4CAF50',
  },
  hBarValue: {
    width: 34,
    fontSize: 11,
    fontWeight: '700',
    color: DARK,
    textAlign: 'right',
  },

  recCard: {
    paddingVertical: 10,
  },
  recCardBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  recTopic: {
    fontSize: 14,
    fontWeight: '700',
    color: DARK,
    marginBottom: 2,
  },
  recReason: {
    fontSize: 12,
    color: '#777',
    lineHeight: 17,
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
