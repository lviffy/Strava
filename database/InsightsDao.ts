import { getDatabase } from './DatabaseClient';

export interface ActivityInsight {
  activity_id: string;
  summary_headline: string;
  full_critique: string;
  anaerobic_pct: number;
  aerobic_pct: number;
  cadence_rating?: string;
  split_strategy?: string;
  created_at: number;
}

export class InsightsDao {
  static async getInsightForActivity(activityId: string): Promise<ActivityInsight | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<ActivityInsight>(
      'SELECT * FROM activity_insights WHERE activity_id = ? LIMIT 1;',
      [activityId]
    );
    return result || null;
  }

  static async saveInsight(insight: ActivityInsight): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO activity_insights (
        activity_id, summary_headline, full_critique, anaerobic_pct,
        aerobic_pct, cadence_rating, split_strategy, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        insight.activity_id,
        insight.summary_headline,
        insight.full_critique,
        insight.anaerobic_pct,
        insight.aerobic_pct,
        insight.cadence_rating || 'Optimal',
        insight.split_strategy || 'Even Split',
        insight.created_at,
      ]
    );
  }
}
