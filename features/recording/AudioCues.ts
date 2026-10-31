import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { formatPace, formatDuration } from './Calculations';

export interface AudioCueConfig {
  enabled: boolean;
  intervalKm: number; // 0.5, 1.0, 2.0
  announcePace: boolean;
  announceTime: boolean;
  speechRate: number; // 0.8 to 1.2
}

class AudioCuesService {
  private config: AudioCueConfig = {
    enabled: true,
    intervalKm: 1.0,
    announcePace: true,
    announceTime: true,
    speechRate: 1.0,
  };

  public getConfig(): AudioCueConfig {
    return { ...this.config };
  }

  public setConfig(newConfig: Partial<AudioCueConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public async announceSplit(
    splitNumber: number,
    paceSecKm: number,
    movingTimeSec: number
  ): Promise<void> {
    if (!this.config.enabled) return;

    try {
      const paceStr = formatPace(paceSecKm);
      const timeStr = formatDuration(movingTimeSec);

      let message = `Kilometer ${splitNumber}.`;
      if (this.config.announcePace) {
        message += ` Pace, ${paceStr} per kilometer.`;
      }
      if (this.config.announceTime) {
        message += ` Time, ${timeStr}.`;
      }

      await Speech.speak(message, {
        language: 'en-US',
        rate: this.config.speechRate,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.warn('Audio cue failed:', err);
    }
  }

  public async testSpeech(): Promise<void> {
    try {
      await Speech.speak('Strava Audio Cues active. Kilometer 1. Pace 4 minutes 30 seconds.', {
        language: 'en-US',
        rate: this.config.speechRate,
      });
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (err) {
      console.warn('Test speech error:', err);
    }
  }
}

export const AudioCues = new AudioCuesService();
