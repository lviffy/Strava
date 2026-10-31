# Implementation Roadmap: Master Reconstruction

**Objective:** Systematically elevate the application to 100% functional parity with the reference Strava Android application (`v486.11`).

---

## Stage 1: Backend Entity & Schema Expansion
- [x] Audit database requirements against reverse-engineered entities.
- [ ] Update `server/prisma/schema.prisma` with:
  - `Notification` (type, title, message, entityId, isRead)
  - `Club` and `ClubMember` (name, sportType, location, member count)
  - `Challenge` and `ChallengeParticipant` (title, targetDistanceMeters, progress)
  - `Route` (name, sportType, distanceMeters, elevationGainMeters, polylineEncoded)
  - `Subscription` (tier, status, expiresAt, features)
- [ ] Execute `npx prisma db push`.
- [ ] Add backend Express routes:
  - `server/src/routes/notifications.routes.ts`
  - `server/src/routes/clubs.routes.ts`
  - `server/src/routes/challenges.routes.ts`
  - `server/src/routes/subscriptions.routes.ts`
- [ ] Register new routes in `server/src/app.ts`.

---

## Stage 2: Elimination of All Header & Modal Placeholders
- [ ] Implement **Subscription & Entitlements Screen (`app/subscription.tsx`)**
  - Displays Summit subscription tiers, unlocked features (Athlete Intelligence, 3D Flyover, Beacon, Race Predictor).
  - Replaces `Alert.alert('Strava Subscription', ...)` in `app/(tabs)/_layout.tsx`.
- [ ] Implement **Notifications Center Screen (`app/notifications.tsx`)**
  - Displays list of social notifications, kudos alerts, comment alerts, and follow requests.
  - "Mark All Read" action and interactive tap navigation.
  - Replaces `Alert.alert('Notifications', ...)`.
- [ ] Implement **Athlete & Community Search Screen (`app/search.tsx`)**
  - Search input with debounce, search history chips, athlete list with follow buttons, and club suggestions.
  - Replaces direct redirect to maps in header.

---

## Stage 3: Deep Community Screens
- [ ] Implement **Club Details Screen (`app/clubs/[id].tsx`)**
  - Club header with cover image, sport badge, member count, and join/leave toggle.
  - Club announcements tab, member roster with follow actions, and group discussion thread.
  - Wire tap on club cards in `app/(tabs)/groups.tsx`.
- [ ] Implement **Challenge Details Screen (`app/challenges/[id].tsx`)**
  - Challenge header with digital badge trophy, target distance, days remaining, and progress bar.
  - Official challenge rules, qualifying sports, and global leaderboard.
  - Wire tap on challenge cards in `app/(tabs)/groups.tsx`.
- [ ] Implement **Public Athlete Profile Screen (`app/profile/[id].tsx`)**
  - Athlete avatar, bio, follower/following stats, Follow/Unfollow action, and recent shared activities list.
  - Wire tap on athlete names in feed and comments.

---

## Stage 4: Unified Settings Screen
- [ ] Implement **Settings Hub Screen (`app/settings/index.tsx`)**
  - Profile preferences, Privacy Controls (Zones, Activity Visibility), Units (Metric vs. Imperial), Audio Cues, Connected Sensors, About, and Logout.
  - Replaces standalone profile alerts.

---

## Stage 5: Functional Verification & Quality Assurance
- [ ] Test all newly created screens and routes.
- [ ] Test GPS recording engine transitions (`START` -> `PAUSE` -> `RESUME` -> `FINISH` -> `SAVE`).
- [ ] Verify offline SQLite persistence and subsequent cloud sync.
- [ ] Verify zero placeholder alerts and zero dead ends in navigation.
- [ ] Produce `docs/TESTING_REPORT.md` and update `docs/IMPLEMENTATION_PROGRESS.md`.
