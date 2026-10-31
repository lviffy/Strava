import { getDatabase } from './DatabaseClient';

export interface GearItem {
  id: string;
  athlete_id: string;
  name: string;
  brand: string;
  model: string;
  type: 'Shoes' | 'Bike';
  distance_meters: number;
  max_distance_meters: number;
  is_default: number;
  is_retired: number;
  default_sports: string;
  updated_at: number;
}

export class GearDao {
  static async getAllGear(includeRetired = false): Promise<GearItem[]> {
    const db = await getDatabase();
    const query = includeRetired
      ? `SELECT * FROM gear ORDER BY is_default DESC, distance_meters DESC;`
      : `SELECT * FROM gear WHERE is_retired = 0 ORDER BY is_default DESC, distance_meters DESC;`;
    return (await db.getAllAsync<GearItem>(query)) || [];
  }

  static async getGearById(id: string): Promise<GearItem | null> {
    const db = await getDatabase();
    return (await db.getFirstAsync<GearItem>(`SELECT * FROM gear WHERE id = ?;`, [id])) || null;
  }

  static async getGearForSport(sportType: string): Promise<GearItem[]> {
    const db = await getDatabase();
    const type = sportType === 'Ride' ? 'Bike' : 'Shoes';
    return (
      (await db.getAllAsync<GearItem>(
        `SELECT * FROM gear WHERE type = ? AND is_retired = 0 ORDER BY is_default DESC, distance_meters DESC;`,
        [type]
      )) || []
    );
  }

  static async addGear(
    item: Omit<GearItem, 'id' | 'distance_meters' | 'is_retired' | 'updated_at'>
  ): Promise<GearItem> {
    const db = await getDatabase();
    const id = `gear_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();

    // If new item is default, unset other defaults of the same type
    if (item.is_default) {
      await db.runAsync(`UPDATE gear SET is_default = 0 WHERE type = ?;`, [item.type]);
    }

    await db.runAsync(
      `INSERT INTO gear (
        id, athlete_id, name, brand, model, type, distance_meters, 
        max_distance_meters, is_default, is_retired, default_sports, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        item.athlete_id || 'athlete_self',
        item.name,
        item.brand,
        item.model,
        item.type,
        0.0,
        item.max_distance_meters || (item.type === 'Shoes' ? 600000.0 : 5000000.0),
        item.is_default ? 1 : 0,
        0,
        item.default_sports || (item.type === 'Shoes' ? 'Run,Walk' : 'Ride'),
        now,
      ]
    );

    return {
      id,
      athlete_id: item.athlete_id || 'athlete_self',
      name: item.name,
      brand: item.brand,
      model: item.model,
      type: item.type,
      distance_meters: 0.0,
      max_distance_meters: item.max_distance_meters || (item.type === 'Shoes' ? 600000.0 : 5000000.0),
      is_default: item.is_default ? 1 : 0,
      is_retired: 0,
      default_sports: item.default_sports || '',
      updated_at: now,
    };
  }

  static async updateGearDistance(gearId: string, additionalMeters: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE gear SET distance_meters = distance_meters + ?, updated_at = ? WHERE id = ?;`,
      [additionalMeters, Date.now(), gearId]
    );
  }

  static async retireGear(gearId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE gear SET is_retired = 1, is_default = 0, updated_at = ? WHERE id = ?;`,
      [Date.now(), gearId]
    );
  }

  static async deleteGear(gearId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM gear WHERE id = ?;`, [gearId]);
  }

  static async setDefaultGear(gearId: string, type: 'Shoes' | 'Bike'): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`UPDATE gear SET is_default = 0 WHERE type = ?;`, [type]);
    await db.runAsync(`UPDATE gear SET is_default = 1, updated_at = ? WHERE id = ?;`, [
      Date.now(),
      gearId,
    ]);
  }
}
