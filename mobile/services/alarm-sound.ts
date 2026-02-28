import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';

let alarmSound: Audio.Sound | null = null;
let isPlaying = false;

export async function configureAudioSession(): Promise<void> {
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    staysActiveInBackground: true,
    interruptionModeIOS: InterruptionModeIOS.DoNotMix,
    interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
    shouldDuckAndroid: false,
    playThroughEarpieceAndroid: false,
    allowsRecordingIOS: false,
  });
}

export async function startAlarmSound(): Promise<void> {
  if (isPlaying) return;

  try {
    await configureAudioSession();

    if (alarmSound) {
      await alarmSound.unloadAsync();
      alarmSound = null;
    }

    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sounds/alarm.mp3'),
      { shouldPlay: true, isLooping: true, volume: 1.0 }
    );
    alarmSound = sound;
    isPlaying = true;

    sound.setOnPlaybackStatusUpdate((status) => {
      if ('isLoaded' in status && !status.isLoaded) {
        isPlaying = false;
        alarmSound = null;
      }
    });
  } catch {
    isPlaying = false;
  }
}

export async function stopAlarmSound(): Promise<void> {
  isPlaying = false;
  if (alarmSound) {
    try {
      await alarmSound.stopAsync();
      await alarmSound.unloadAsync();
    } catch {
      /* cleanup errors are fine */
    }
    alarmSound = null;
  }
}

export function isAlarmSoundPlaying(): boolean {
  return isPlaying;
}
