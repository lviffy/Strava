import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
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

  console.log(`👤 Created athletes: ${alex.firstName} ${alex.lastName} & ${sarah.firstName} ${sarah.lastName}`);

  // 2. Create Segments (with real coordinates for PostGIS testing)
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

  console.log('📍 Created 3 PostGIS segments in San Francisco');

  // 3. Create Sample Activities
  const activity1Id = 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d';
  const activity1 = await prisma.activity.create({
    data: {
      id: activity1Id,
      userId: alex.id,
      name: 'Morning Marina Fog Run',
      sportType: 'Run',
      visibility: 'everyone',
      startTime: new Date(Date.now() - 3600 * 4 * 1000), // 4 hours ago
      elapsedTimeSeconds: 1845,
      movingTimeSeconds: 1780,
      distanceMeters: 5240,
      elevationGainMeters: 45,
      calories: 382,
      polylineEncoded: 'g`|eFvchjV_@eAg@q@uAwAiBwBwAwAs@u@eBgCu@uAwAwAiBwB',
      startLatitude: 37.8050,
      startLongitude: -122.4350,
      endLatitude: 37.8070,
      endLongitude: -122.4380,
      deviceInfo: 'Expo Go (Android)',
    },
  });

  // Create Splits for Activity 1
  await prisma.split.createMany({
    data: [
      { activityId: activity1Id, splitNumber: 1, distanceUnit: 'km', movingTimeSeconds: 335, elevationDeltaMeters: 5 },
      { activityId: activity1Id, splitNumber: 2, distanceUnit: 'km', movingTimeSeconds: 340, elevationDeltaMeters: 8 },
      { activityId: activity1Id, splitNumber: 3, distanceUnit: 'km', movingTimeSeconds: 345, elevationDeltaMeters: 12 },
      { activityId: activity1Id, splitNumber: 4, distanceUnit: 'km', movingTimeSeconds: 350, elevationDeltaMeters: 10 },
      { activityId: activity1Id, splitNumber: 5, distanceUnit: 'km', movingTimeSeconds: 330, elevationDeltaMeters: 7 },
    ],
  });

  // Coordinates for Activity 1
  await prisma.coordinate.createMany({
    data: [
      { activityId: activity1Id, seq: 0, latitude: 37.8050, longitude: -122.4350, altitude: 12.5, accuracy: 3.2, speed: 2.9, timestamp: new Date(Date.now() - 3600 * 4 * 1000) },
      { activityId: activity1Id, seq: 1, latitude: 37.8055, longitude: -122.4360, altitude: 13.0, accuracy: 2.8, speed: 3.1, timestamp: new Date(Date.now() - 3600 * 4 * 1000 + 300000) },
      { activityId: activity1Id, seq: 2, latitude: 37.8062, longitude: -122.4372, altitude: 14.1, accuracy: 3.0, speed: 3.0, timestamp: new Date(Date.now() - 3600 * 4 * 1000 + 600000) },
      { activityId: activity1Id, seq: 3, latitude: 37.8070, longitude: -122.4380, altitude: 15.2, accuracy: 2.5, speed: 3.2, timestamp: new Date(Date.now() - 3600 * 4 * 1000 + 900000) },
    ],
  });

  // Sarah kudos Alex's run
  await prisma.kudos.create({
    data: {
      activityId: activity1Id,
      userId: sarah.id,
    },
  });

  // Sarah comments on Alex's run
  await prisma.comment.create({
    data: {
      activityId: activity1Id,
      userId: sarah.id,
      content: 'Solid pace through the Marina! 🔥',
    },
  });

  // Sarah's bike ride
  const activity2Id = 'b2c3d4e5-f6a1-4b2c-9d3e-4f5a6b7c8d9e';
  await prisma.activity.create({
    data: {
      id: activity2Id,
      userId: sarah.id,
      name: 'Hawk Hill Golden Hour Ride 🚴‍♀️',
      sportType: 'Ride',
      visibility: 'everyone',
      startTime: new Date(Date.now() - 3600 * 24 * 1000), // Yesterday
      elapsedTimeSeconds: 4200,
      movingTimeSeconds: 3850,
      distanceMeters: 28400,
      elevationGainMeters: 480,
      calories: 780,
      polylineEncoded: 'w`|eFlokjV_@eAg@q@uAwAiBwBwAwAs@u@eBgCu@uAwAwAiBwB',
      startLatitude: 37.8199,
      startLongitude: -122.4783,
      endLatitude: 37.8280,
      endLongitude: -122.4990,
      deviceInfo: 'Expo Go (Android)',
    },
  });

  // Segment efforts
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

  console.log('✅ Database seeded with athletes, activities, splits, comments, and segments!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
