import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import {
  requestAlarmPermissions,
  openAppSettings,
} from '@/services/alarm-permissions';
import { requestAlarmAuthorization } from '@/services/alarm-kit';

type Props = {
  visible: boolean;
  onDismiss: () => void;
};

export function AlarmPermissionModal({ visible, onDismiss }: Props) {
  const handleAllow = async () => {
    const notificationsGranted = await requestAlarmPermissions();
    if (Platform.OS === 'ios') {
      await requestAlarmAuthorization();
    }
    if (notificationsGranted) {
      onDismiss();
    }
  };

  const handleOpenSettings = async () => {
    await openAppSettings();
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ThemedText type="subtitle" style={styles.title}>
            Alarm permission
          </ThemedText>
          <ThemedText style={styles.body}>
            To interrupt you at scheduled times with challenges, this app needs:
          </ThemedText>
          <ThemedText style={styles.bullet}>• Notification permission</ThemedText>
          {Platform.OS === 'android' && (
            <ThemedText style={styles.bullet}>
              • Alarms & reminders (in Settings)
            </ThemedText>
          )}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={handleAllow}
            >
              <ThemedText lightColor="#fff" darkColor="#fff" style={styles.btnText}>
                Allow notifications
              </ThemedText>
            </TouchableOpacity>
            {Platform.OS === 'android' && (
              <TouchableOpacity
                style={[styles.btn, styles.btnSecondary]}
                onPress={handleOpenSettings}
              >
                <ThemedText style={styles.btnText}>Open Settings</ThemedText>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={onDismiss}>
              <ThemedText style={styles.btnText}>Maybe later</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  title: {
    marginBottom: 12,
    color: '#f8fafc',
  },
  body: {
    color: '#e2e8f0',
    marginBottom: 12,
    lineHeight: 22,
  },
  bullet: {
    color: '#cbd5e1',
    marginBottom: 4,
    marginLeft: 8,
  },
  buttons: {
    marginTop: 20,
    gap: 10,
  },
  btn: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: '#0ea5e9',
  },
  btnSecondary: {
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: '#475569',
  },
  btnGhost: {
    backgroundColor: 'transparent',
  },
  btnText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
