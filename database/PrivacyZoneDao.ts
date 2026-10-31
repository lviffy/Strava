import { getDatabase } from './DatabaseClient';

export interface PrivacyZone {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: number;
  created_at: number;
}

export class PrivacyZoneDao {
  static async getPrivacyZones(): Promise<PrivacyZone[]> {
    const db = await getDatabase();
    return (await db.getAllAsync<PrivacyZone>(`SELECT * FROM privacy_zones ORDER BY created_at ASC;`)) || [];
  }

  static async getActivePrivacyZones(): Promise<PrivacyZone[]> {
    const db = await getDatabase();
    return (
      (await db.getAllAsync<PrivacyZone>(
        `SELECT * FROM privacy_zones WHERE is_active = 1 ORDER BY created_at ASC;`
      )) || []
    );
  }

  static async addPrivacyZone(
    zone: Omit<PrivacyZone, 'id' | 'created_at'>
  ): Promise<PrivacyZone> {
    const db = await getDatabase();
    const id = `pz_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = Date.now();

    await db.runAsync(
      `INSERT INTO privacy_zones (id, name, address, latitude, longitude, radius_meters, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        zone.name,
        zone.address,
        zone.latitude,
        zone.longitude,
        zone.radius_meters || 500.0,
        zone.is_active ? 1 : 0,
        now,
      ]
    );

    return {
      id,
      name: zone.name,
      address: zone.address,
      latitude: zone.latitude,
      longitude: zone.longitude,
      radius_meters: zone.radius_meters || 500.0,
      is_active: zone.is_active ? 1 : 0,
      created_at: now,
    };
  }

  static async deletePrivacyZone(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM privacy_zones WHERE id = ?;`, [id]);
  }

  static async togglePrivacyZone(id: string, isActive: boolean): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`UPDATE privacy_zones SET is_active = ? WHERE id = ?;`, [
      isActive ? 1 : 0,
      id,
    ]);
  }
}
