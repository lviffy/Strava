import { getDatabase } from './DatabaseClient';

export interface BeaconContact {
  id: string;
  name: string;
  phone_number: string;
  relation: string;
  is_active: number;
  created_at: number;
}

export class BeaconDao {
  static async getContacts(): Promise<BeaconContact[]> {
    const db = await getDatabase();
    return (await db.getAllAsync<BeaconContact>(`SELECT * FROM beacon_contacts ORDER BY created_at ASC;`)) || [];
  }

  static async getActiveContacts(): Promise<BeaconContact[]> {
    const db = await getDatabase();
    return (
      (await db.getAllAsync<BeaconContact>(
        `SELECT * FROM beacon_contacts WHERE is_active = 1 ORDER BY created_at ASC;`
      )) || []
    );
  }

  static async addContact(
    contact: Omit<BeaconContact, 'id' | 'created_at'>
  ): Promise<BeaconContact> {
    const db = await getDatabase();
    const id = `bc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = Date.now();

    await db.runAsync(
      `INSERT INTO beacon_contacts (id, name, phone_number, relation, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [id, contact.name, contact.phone_number, contact.relation, contact.is_active ? 1 : 0, now]
    );

    return {
      id,
      name: contact.name,
      phone_number: contact.phone_number,
      relation: contact.relation,
      is_active: contact.is_active ? 1 : 0,
      created_at: now,
    };
  }

  static async deleteContact(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM beacon_contacts WHERE id = ?;`, [id]);
  }

  static async toggleContact(id: string, isActive: boolean): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`UPDATE beacon_contacts SET is_active = ? WHERE id = ?;`, [
      isActive ? 1 : 0,
      id,
    ]);
  }
}
