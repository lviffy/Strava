import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Seeding database...');

  // Clean existing data
  await prisma.notification.deleteMany({});
  await prisma.challengeParticipant.deleteMany({});
  await prisma.challenge.deleteMany({});
  await prisma.clubMember.deleteMany({});
  await prisma.club.deleteMany({});
  await prisma.route.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.kudos.deleteMany({});
  await prisma.split.deleteMany({});
  await prisma.coordinate.deleteMany({});
  await prisma.segmentEffort.deleteMany({});
  await prisma.segment.deleteMany({});
  await prisma.activity.deleteMany({});
  await prisma.follow.deleteMany({});
  await prisma.user.deleteMany({});

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  // 1. Create Athletes
  const alex = await prisma.user.create({
    data: {
      email: 'athlete@strava.clone',
      passwordHash,
      firstName: 'Alex',
      lastName: 'Rivera',
      city: 'San Francisco, CA',
      bio: 'Marathon runner & gravel cyclist. Always chasing PRs.',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=faces',
    },
  });

  const sarah = await prisma.user.create({
    data: {
      email: 'sarah@strava.clone',
      passwordHash,
      firstName: 'Sarah',
      lastName: 'Chen',
      city: 'San Francisco, CA',
      bio: 'Trail enthusiast & coffee lover.',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=300&fit=crop&crop=faces',
    },
  });

  // Follow relationship
  await prisma.follow.create({
    data: {
      followerId: sarah.id,
      followingId: alex.id,
    },
  });

  console.log(`[Seed] Created athletes: ${alex.firstName} ${alex.lastName} & ${sarah.firstName} ${sarah.lastName}`);

  // 2. Create Subscription
  await prisma.subscription.create({
    data: {
      userId: alex.id,
      tier: 'summit',
      status: 'active',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  // 3. Create Segments
  const segment1 = await prisma.segment.create({
    data: {
      name: 'Embarcadero Waterfront Sprint',
      sportType: 'Run',
      distanceMeters: 1450,
      elevationGainMeters: 4,
      startLatitude: 37.7950,
      startLongitude: -122.3930,
      endLatitude: 37.8050,
      endLongitude: -122.4040,
      polylineEncoded: 'g`|eFvchjV_@eAg@q@uAwAiBwBwAwAs@u@',
    },
  });

  const segment2 = await prisma.segment.create({
    data: {
      name: 'Presidio Coastal Climb',
      sportType: 'Ride',
      distanceMeters: 3200,
      elevationGainMeters: 112,
      startLatitude: 37.8010,
      startLongitude: -122.4650,
      endLatitude: 37.8080,
      endLongitude: -122.4760,
      polylineEncoded: 'w`|eFlokjV_@eAg@q@uAwAiBwBwAwAs@u@eBgCu@uA',
    },
  });

  const segment3 = await prisma.segment.create({
    data: {
      name: 'Twin Peaks Summit Push',
      sportType: 'Run',
      distanceMeters: 2100,
      elevationGainMeters: 185,
      startLatitude: 37.7544,
      startLongitude: -122.4477,
      endLatitude: 37.7554,
      endLongitude: -122.4465,
      polylineEncoded: '_{zeFn{cjVs@uAeBgCu@uA',
    },
  });

  // 4. Create Activities
  const activity1Id = 'act_seed_101';
  await prisma.activity.create({
    data: {
      id: activity1Id,
      userId: alex.id,
      name: 'Morning Embarcadero Tempo Run',
      sportType: 'Run',
      visibility: 'everyone',
      startTime: new Date(Date.now() - 3600000 * 4),
      elapsedTimeSeconds: 2780,
      movingTimeSeconds: 2700,
      distanceMeters: 8520,
      elevationGainMeters: 42,
      calories: 590,
      polylineEncoded: 'g`|eFvchjV_@eAg@q@uAwAiBwBwAwAs@u@',
      startLatitude: 37.7950,
      startLongitude: -122.3930,
      endLatitude: 37.8050,
      endLongitude: -122.4040,
      deviceInfo: 'Expo Go (Android)',
    },
  });

  // Kudos and comments
  await prisma.kudos.create({
    data: {
      activityId: activity1Id,
      userId: sarah.id,
    },
  });

  await prisma.comment.create({
    data: {
      activityId: activity1Id,
      userId: sarah.id,
      content: 'Solid morning pace Alex! Chasing that marathon PR.',
    },
  });

  // Splits for activity 1
  for (let i = 1; i <= 8; i++) {
    await prisma.split.create({
      data: {
        activityId: activity1Id,
        splitNumber: i,
        distanceUnit: 'km',
        movingTimeSeconds: 310 + Math.floor(Math.random() * 25),
        elevationDeltaMeters: Math.floor(Math.random() * 8),
      },
    });
  }

  // Sarah's activity
  const activity2Id = 'act_seed_102';
  await prisma.activity.create({
    data: {
      id: activity2Id,
      userId: sarah.id,
      name: 'Sunset Marin Headlands Ride',
      sportType: 'Ride',
      visibility: 'everyone',
      startTime: new Date(Date.now() - 3600000 * 24),
      elapsedTimeSeconds: 5400,
      movingTimeSeconds: 5120,
      distanceMeters: 34200,
      elevationGainMeters: 620,
      calories: 980,
      polylineEncoded: 'w`|eFlokjV_@eAg@q@uAwAiBwBwAwAs@u@eBgCu@uAwAwAiBwB',
      startLatitude: 37.8199,
      startLongitude: -122.4783,
      endLatitude: 37.8280,
      endLongitude: -122.4990,
      deviceInfo: 'Expo Go (Android)',
    },
  });

  // Segment effort
  await prisma.segmentEffort.create({
    data: {
      segmentId: segment1.id,
      activityId: activity1Id,
      userId: alex.id,
      elapsedTimeSeconds: 310,
      movingTimeSeconds: 305,
      startDate: new Date(),
      rank: 1,
    },
  });

  // 5. Create Clubs
  const club1 = await prisma.club.create({
    data: {
      name: 'San Francisco Trail Runners',
      sportType: 'Running Club',
      location: 'San Francisco, CA',
      description: 'Weekly morning trails in the Presidio and Marin Headlands. All paces welcome!',
      avatarUrl: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=300&h=300&fit=crop',
      creatorId: alex.id,
    },
  });

  const club2 = await prisma.club.create({
    data: {
      name: 'Bay Area Cycling Syndicate',
      sportType: 'Cycling Team',
      location: 'Palo Alto, CA',
      description: 'Competitive and social road/gravel cycling rides across Kings Mountain and Highway 1.',
      avatarUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=300&h=300&fit=crop',
      creatorId: sarah.id,
    },
  });

  const club3 = await prisma.club.create({
    data: {
      name: 'Dawn Patrol Early Risers',
      sportType: 'Multi-Sport',
      location: 'Marin County, CA',
      description: 'Starting workouts before 6 AM every Tuesday and Thursday.',
      avatarUrl: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=300&h=300&fit=crop',
      creatorId: alex.id,
    },
  });

  // Club members
  await prisma.clubMember.create({ data: { clubId: club1.id, userId: alex.id, role: 'admin' } });
  await prisma.clubMember.create({ data: { clubId: club1.id, userId: sarah.id, role: 'member' } });
  await prisma.clubMember.create({ data: { clubId: club2.id, userId: sarah.id, role: 'admin' } });
  await prisma.clubMember.create({ data: { clubId: club3.id, userId: alex.id, role: 'member' } });

  // 6. Create Challenges
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const challenge1 = await prisma.challenge.create({
    data: {
      title: 'November 50K Challenge',
      description: 'Log 50 kilometers of running, walking, or hiking this month to earn the digital finisher badge.',
      sportType: 'Run',
      targetDistanceMeters: 50000,
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
      endDate: endOfMonth,
      badgeIcon: 'medal-outline',
    },
  });

  const challenge2 = await prisma.challenge.create({
    data: {
      title: 'Autumn Gran Fondo 100K',
      description: 'Ride 100 kilometers in a single activity or across the month.',
      sportType: 'Ride',
      targetDistanceMeters: 100000,
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
      endDate: endOfMonth,
      badgeIcon: 'trophy-outline',
    },
  });

  const challenge3 = await prisma.challenge.create({
    data: {
      title: 'Weekend 10K Time Trial',
      description: 'Test your speed over a 10K distance this weekend.',
      sportType: 'Run',
      targetDistanceMeters: 10000,
      startDate: now,
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      badgeIcon: 'flame-outline',
    },
  });

  // Challenge participants
  await prisma.challengeParticipant.create({
    data: {
      challengeId: challenge1.id,
      userId: alex.id,
      progressDistanceMeters: 28500,
      completed: false,
    },
  });

  await prisma.challengeParticipant.create({
    data: {
      challengeId: challenge2.id,
      userId: alex.id,
      progressDistanceMeters: 100000,
      completed: true,
    },
  });

  // 7. Create Notifications
  await prisma.notification.create({
    data: {
      userId: alex.id,
      actorId: sarah.id,
      type: 'kudos',
      title: 'New Kudos',
      message: 'Sarah Chen gave you kudos on Morning Embarcadero Tempo Run',
      entityId: activity1Id,
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: alex.id,
      actorId: sarah.id,
      type: 'comment',
      title: 'New Comment',
      message: 'Sarah Chen commented on your activity: "Solid morning pace Alex!"',
      entityId: activity1Id,
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: alex.id,
      type: 'challenge',
      title: 'Challenge Complete!',
      message: 'Congratulations! You completed the Autumn Gran Fondo 100K challenge.',
      entityId: challenge2.id,
      isRead: true,
    },
  });

  // 8. Create Routes
  await prisma.route.create({
    data: {
      userId: alex.id,
      name: 'Presidio Coastal Bluffs Trail',
      sportType: 'Run',
      distanceMeters: 7400,
      elevationGainMeters: 145,
      estTimeMinutes: 42,
      surfaceType: 'Dirt & Paved',
      polylineEncoded: 'w`|eFlokjV_@eAg@q@uAwAiBwBwAwAs@u@eBgCu@uA',
    },
  });

  await prisma.route.create({
    data: {
      userId: alex.id,
      name: 'Twin Peaks Summit Climb',
      sportType: 'Ride',
      distanceMeters: 14800,
      elevationGainMeters: 380,
      estTimeMinutes: 55,
      surfaceType: 'Paved Road',
      polylineEncoded: '_{zeFn{cjVs@uAeBgCu@uA',
    },
  });

  console.log('[Seed] Database seeded with athletes, activities, clubs, challenges, routes, and notifications!');
}

main()
  .catch((e) => {
    console.error('[Seed] Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
