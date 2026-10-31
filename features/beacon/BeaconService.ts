import * as Haptics from 'expo-haptics';
import { BeaconDao, BeaconContact } from '../../database/BeaconDao';

export interface BeaconLiveSession {
  isActive: boolean;
  activityId: string | null;
  beaconUrl: string | null;
  startTime: number | null;
}

class BeaconServiceManager {
  private activeSession: BeaconLiveSession = {
    isActive: false,
    activityId: null,
    beaconUrl: null,
    startTime: null,
  };

  public getSession(): BeaconLiveSession {
    return { ...this.activeSession };
  }

  public async startSession(activityId: string): Promise<BeaconLiveSession> {
    const token = Math.random().toString(36).substring(2, 10);
    const beaconUrl = `https://strava.app/beacon/live/${activityId || token}`;

    this.activeSession = {
      isActive: true,
      activityId,
      beaconUrl,
      startTime: Date.now(),
    };

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    return { ...this.activeSession };
  }

  public stopSession(): void {
    this.activeSession = {
      isActive: false,
      activityId: null,
      beaconUrl: null,
      startTime: null,
    };
  }

  public formatSafetyMessage(sportType = 'workout'): string {
    const url = this.activeSession.beaconUrl || 'https://strava.app/beacon/live/demo';
    return `Hi! I'm starting my ${sportType} on Strava. You can follow my real-time GPS location and safety status here:\n${url}`;
  }
}

export const BeaconService = new BeaconServiceManager();
