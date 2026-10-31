import { Platform } from 'react-native';

// In Expo Go:
// Android Emulator uses 10.0.2.2 to access host machine
// iOS Simulator uses localhost
// Physical devices use LAN IP (configurable)
const DEFAULT_HOST = Platform.OS === 'android' ? 'http://10.0.2.2:4000/api/v1' : 'http://localhost:4000/api/v1';

export class ApiClient {
  private static baseUrl: string = DEFAULT_HOST;
  private static authToken: string | null = null;

  static setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  static getBaseUrl(): string {
    return this.baseUrl;
  }

  static setToken(token: string | null) {
    this.authToken = token;
  }

  static getToken(): string | null {
    return this.authToken;
  }

  public static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorJson = await response.json();
        if (errorJson.error) {
          errorMessage = errorJson.error;
        }
      } catch {
        // Non-JSON error body
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Auth APIs
  static async login(email: string, password: string) {
    const res = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.token);
    return res;
  }

  static async register(data: { email: string; password: string; firstName: string; lastName: string; city?: string }) {
    const res = await this.request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(res.token);
    return res;
  }

  // Activities APIs
  static async getFeed(page = 1, limit = 20) {
    return this.request<{ activities: any[]; page: number; limit: number }>(`/activities?page=${page}&limit=${limit}`);
  }

  static async getActivity(id: string) {
    return this.request<{ activity: any }>(`/activities/${id}`);
  }

  static async uploadActivity(payload: {
    id: string;
    name: string;
    sportType: string;
    startTime: string;
    elapsedTimeSeconds: number;
    movingTimeSeconds: number;
    distanceMeters: number;
    elevationGainMeters: number;
    calories: number;
    polylineEncoded?: string | null;
    startLatitude?: number | null;
    startLongitude?: number | null;
    endLatitude?: number | null;
    endLongitude?: number | null;
    coordinates?: any[];
    splits?: any[];
  }) {
    return this.request<{ message: string; activity: any; alreadyExisted: boolean }>('/activities', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  static async toggleKudos(activityId: string) {
    return this.request<{ kudoed: boolean; kudosCount: number }>(`/activities/${activityId}/kudos`, {
      method: 'POST',
    });
  }

  // Segments & PostGIS Discovery APIs
  static async getNearbySegments(lat: number, lng: number, radiusMeters = 10000, sportType?: string) {
    let url = `/segments/nearby?lat=${lat}&lng=${lng}&radiusMeters=${radiusMeters}`;
    if (sportType) {
      url += `&sportType=${encodeURIComponent(sportType)}`;
    }
    return this.request<{
      origin: { latitude: number; longitude: number };
      radiusMeters: number;
      count: number;
      segments: any[];
    }>(url);
  }

  static async getSegmentLeaderboard(segmentId: string) {
    return this.request<{ segmentId: string; leaderboard: any[] }>(`/segments/${segmentId}/leaderboard`);
  }

  static async addComment(activityId: string, content: string) {
    return this.request<{ comment: any }>(`/activities/${activityId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  static async deleteActivity(activityId: string) {
    return this.request<{ message: string }>(`/activities/${activityId}`, {
      method: 'DELETE',
    });
  }

  // Athlete Profile & Stats
  static async getCurrentUser() {
    return this.request<{ user: any }>('/auth/me');
  }

  static async getAthleteProfile(userId: string) {
    return this.request<{ athlete: any; stats: any }>(`/users/${userId}`);
  }
}

