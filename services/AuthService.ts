import { ApiClient } from './ApiClient';

export interface AthleteUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  city?: string | null;
  bio?: string | null;
  createdAt?: string;
  _count?: {
    activities?: number;
    followers?: number;
    following?: number;
  };
}

export interface AuthResponse {
  token: string;
  user: AthleteUser;
  message?: string;
}

export class AuthService {
  static async login(email: string, password: string): Promise<AuthResponse> {
    const res = await ApiClient.login(email, password);
    return res;
  }

  static async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    city?: string;
    bio?: string;
  }): Promise<AuthResponse> {
    const res = await ApiClient.register(data);
    return res;
  }

  static async getCurrentUser(): Promise<AthleteUser> {
    const res = await ApiClient.getCurrentUser();
    return res.user;
  }
}
