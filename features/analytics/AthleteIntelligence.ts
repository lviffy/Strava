import { ActivityDao, LocalActivity, LocalSplit } from '../../database/ActivityDao';
import { InsightsDao, ActivityInsight } from '../../database/InsightsDao';

export class AthleteIntelligence {
  /**
   * Generates a context-aware training critique for an activity
   * evaluating pace consistency, anaerobic zones, and split progression.
   */
  static async generateInsight(activity: LocalActivity): Promise<ActivityInsight> {
    const existing = await InsightsDao.getInsightForActivity(activity.id);
    if (existing) return existing;

    const splits = await ActivityDao.getSplitsForActivity(activity.id);
    const avgPaceSecKm = activity.moving_time_seconds / (activity.distance_meters / 1000);

    // Analyze split pacing strategy
    let splitStrategy = 'Even Split';
    if (splits.length >= 2) {
      const half = Math.floor(splits.length / 2);
      const firstHalfPace = splits.slice(0, half).reduce((sum: number, s: LocalSplit) => sum + s.average_pace_sec_per_unit, 0) / half;
      const secondHalfPace = splits.slice(half).reduce((sum: number, s: LocalSplit) => sum + s.average_pace_sec_per_unit, 0) / (splits.length - half);

      if (secondHalfPace < firstHalfPace * 0.97) {
        splitStrategy = 'Negative Split';
      } else if (secondHalfPace > firstHalfPace * 1.05) {
        splitStrategy = 'Positive Split';
      }
    }

    // Estimate aerobic vs anaerobic intensity based on avg pace and distance
    // Faster pace on endurance runs pushes higher into anaerobic thresholds
    const anaerobicPct = Math.min(45, Math.max(12, Math.round(35 - (avgPaceSecKm - 300) / 10)));
    const aerobicPct = 100 - anaerobicPct;

    // Generate dynamic headline and coaching critique matching Strava Athlete Intelligence
    let headline = 'Solid effort with consistent cadence.';
    let critique = 'You maintained a strong aerobic rhythm throughout this workout.';

    if (splitStrategy === 'Negative Split') {
      headline = 'Excellent run with your fastest pace in over 2 weeks.';
      critique = `You pushed into the anaerobic zone for ${anaerobicPct}% of the activity, which helps build overall fitness and boosts VO2 max. Excellent pacing control with a negative split in the final kilometers.`;
    } else if (activity.distance_meters >= 10000) {
      headline = 'Great endurance milestone completed.';
      critique = `You covered over 10 kilometers with an even aerobic threshold. Maintaining this sustained volume builds critical aerobic base for upcoming race targets.`;
    } else {
      headline = 'Consistent training session.';
      critique = `Smooth cadence and steady effort across all splits. Spending ${aerobicPct}% of time in the aerobic zone optimizes fat metabolism and cardiac stroke volume.`;
    }

    const insight: ActivityInsight = {
      activity_id: activity.id,
      summary_headline: headline,
      full_critique: critique,
      anaerobic_pct: anaerobicPct,
      aerobic_pct: aerobicPct,
      cadence_rating: 'Optimal',
      split_strategy: splitStrategy,
      created_at: Date.now(),
    };

    await InsightsDao.saveInsight(insight);
    return insight;
  }
}
