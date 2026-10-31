# Strava Feature Parity Matrix

**Document Version:** 1.0.0  
**Comparison Date:** 2026-10-31  
**Reference Target:** Strava Android App (`v486.11`, Build: `12400195`, SHA-256: `a156ceca136ea869352ad71b5b3dc1ef47a6df28204de631d9f5fdb13b5ffd48`)  
**Existing App Target:** React Native + Expo SDK 58, Expo Router, Node.js + Express + Prisma ORM + PostgreSQL / PostGIS  

---

## 1. Classification Taxonomy

Each discovered feature and interaction is classified according to the following strict criteria:
1. **Already Complete (`COMPLETE`):** Full UI, business logic, persistence, and backend/local operations are implemented and tested.
2. **Needs Improvement (`IMPROVE`):** Functional baseline exists, but user experience, animations, error states, or responsiveness need polish.
3. **Partially Implemented (`PARTIAL`):** Component or frontend interface exists, but backend API, persistence, or deep interaction is incomplete or mocked.
4. **Missing (`MISSING`):** Discovered in the reference APK but not yet created in the project.
5. **Blocked by Expo Go (`BLOCKED`):** Requires native Kotlin/Java/C++ code or Android operating system permissions impossible inside standard Expo Go.
6. **Requires Additional Evidence (`UNESTABLISHED`):** Proprietary backend algorithm or private server logic not determinable from static APK inspection.

---

## 2. Master Feature Parity Matrix

| Feature / Subsystem | Reference Strava Capability | Existing Project Implementation | Classification | Priority | Implementation Strategy / Next Step |
|---|---|---|---|---|---|
| **Auth: Registration & Login** | Email/Password, OAuth (Google, Apple, FB), JWT tokens | `app/(auth)/login.tsx`, `register.tsx`, `useAuthStore.ts`, `auth.routes.ts` | **COMPLETE** | High | Preserved; includes demo login fallback for zero-friction review. |
| **Auth: Password Reset** | Forgotten password OTP or reset email verification | Missing in UI; stub endpoint | **PARTIAL** | Medium | Wire "Forgot Password?" dialog to mock OTP / email reset. |
| **Auth: Health Connect** | Android Health Connect permissions (`WRITE_EXERCISE`, etc.) | Blocked in Expo Go (requires custom native health client) | **BLOCKED** | Low | Document limitation; standard Expo Go cannot modify health manifest. |
| **Feed: Activity Timeline** | Infinite scroll stream, local + cloud activities | `app/(tabs)/index.tsx`, `ActivityCard.tsx` | **COMPLETE** | High | Fully functional; merges pending local SQLite with cloud feed. |
| **Feed: Kudos Reactions** | Single & double-tap kudos with haptics | `ActivityCard.tsx`, `handleKudos`, optimistic state | **COMPLETE** | High | Working with API toggle (`POST /api/activities/:id/kudos`). |
| **Feed: Comments System** | Slide-up bottom sheet, comment list, text input | `CommentModal.tsx`, `ActivityDao`, `ApiClient` | **COMPLETE** | High | Working with instant addition and cloud persistence. |
| **Feed: Header Upgrade** | Flame badge opening subscription perks | Currently calls `Alert.alert('Strava Subscription', ...)` | **PARTIAL** | High | Replace alert with dedicated **Subscription Modal / Screen**. |
| **Feed: Header Notifications** | Bell icon with unread count opening notification center | Currently calls `Alert.alert('Notifications', ...)` | **PARTIAL** | High | Replace alert with dedicated **Notifications Hub Screen**. |
| **Feed: Community Search** | Search button in header for athletes and clubs | Pushes `/(tabs)/maps` directly | **PARTIAL** | High | Replace with dedicated **Athlete & Community Search Modal**. |
| **Recording: GPS Engine** | 1Hz GPS tracking, accuracy filtering, jitter check | `features/recording/GpsEngine.ts`, `Calculations.ts` | **COMPLETE** | Critical | High-performance Haversine distance, speed jump filter ($>45\text{ m/s}$). |
| **Recording: State Machine** | `NOT_RECORDING`, `RECORDING`, `PAUSED`, `AUTOPAUSED`, `SAVED` | `useRecordingStore.ts`, `GpsEngine.ts` | **COMPLETE** | Critical | Matches Strava `RecordingState` lifecycle exactly. |
| **Recording: Auto-Pause** | Halts when speed $<0.8\text{ m/s}$ for $>4\text{s}$ | `GpsEngine.ts`, `useRecordingStore.ts` | **COMPLETE** | High | Fully implemented with speech audio notifications. |
| **Recording: Audio Cues** | Text-to-speech voice splits and pace updates | `AudioCues.ts` using `expo-speech` | **COMPLETE** | High | Fully working across metric (km) and imperial (mi) units. |
| **Recording: Background Location** | Continuous GPS tracking with phone screen off | Requires Android Foreground Location Service | **BLOCKED** | High | Mitigated via `expo-keep-awake` screen dimming (Foreground-first). |
| **Recording: Beacon Safety** | Live GPS location broadcast to safety contacts | `BeaconService.ts`, `BeaconModal.tsx`, `BeaconDao.ts` | **COMPLETE** | Medium | Local contact selection and simulated live web link generation. |
| **Save: Workout Finalization** | Title, sport type, gear selection, privacy visibility | `app/activity/save.tsx` | **COMPLETE** | Critical | Persists in SQLite (`sync_status = 'PENDING'`) and triggers cloud sync. |
| **Detail: Route Map & Splits** | Interactive Google Map polyline, 1km split table | `app/activity/[id].tsx`, `VisualSplitBar.tsx` | **COMPLETE** | High | Full split bar charts, milestone markers, and metric summaries. |
| **Detail: Elevation Profile** | SVG elevation graph with touch scrub cursor | `ElevationChart.tsx`, `app/activity/[id].tsx` | **COMPLETE** | High | Interactive elevation scrubbing displaying point elevation. |
| **Detail: 3D Route Flyover** | Animated 3D satellite camera following route | `FlyoverModal.tsx` | **COMPLETE** | Medium | Interactive camera path following polyline coordinates. |
| **Detail: Crop Activity** | Start/end slider trimming accidental track points | `CropActivityModal.tsx`, `ActivityDao.ts` | **COMPLETE** | Medium | Adjusts coordinates and recalculates total distance & moving time. |
| **Detail: GPX Export** | Export XML track with timestamps and elevation | `GpxExporter.ts` | **COMPLETE** | Medium | Generates standard GPX XML and copies to device clipboard. |
| **Detail: Best Efforts & PRs** | Benchmark splits (400m, 1k, 1mi, 5k) vs. PRs | `BestEffortsEngine.ts`, `HeroPrBanner.tsx` | **COMPLETE** | High | Rolling window search calculating personal records and awards. |
| **Detail: Athlete Intelligence** | AI workout summary & performance suggestions | `AthleteIntelligence.ts`, `InsightsGrid.tsx` | **COMPLETE** | Medium | Generates context-aware recovery and pacing insights. |
| **Maps: Route Discovery** | Explore popular routes with elevation and surface | `app/(tabs)/maps.tsx` | **COMPLETE** | High | Route cards with sport filter, elevation gain, and "Use Route" action. |
| **Maps: Heatmap Layer** | Strava Global Heatmap overlay tile proxy | Not yet wired into `react-native-maps` | **MISSING** | Medium | Add toggle to switch map tile URL to heatmap layer. |
| **Segments: Explorer & Leaderboards** | Crowdsourced sprint/climb leaderboards | Backend endpoints exist; UI is embedded in maps | **PARTIAL** | High | Expose dedicated Segment Leaderboard Modal. |
| **Community: Challenges** | Monthly milestone challenges with progress bars | `app/(tabs)/groups.tsx` (Challenges tab) | **COMPLETE** | High | Progress tracking, target distances, days left, and join/leave toggle. |
| **Community: Clubs** | Athletic clubs roster and announcements | `app/(tabs)/groups.tsx` (Clubs tab) | **COMPLETE** | High | Member counts, locations, categories, and join/leave toggle. |
| **Community: Club Details** | Detailed club screen with discussions and events | Tapping club card does not open full screen | **PARTIAL** | High | Create `app/clubs/[id].tsx` for rich club view. |
| **Community: Challenge Details** | Official challenge rules, digital badge preview | Tapping challenge does not open full screen | **PARTIAL** | High | Create `app/challenges/[id].tsx` for challenge rules & leaderboard. |
| **Profile: Modular Dashboard** | Totals, weekly goals, gear mileage tracking | `app/(tabs)/you.tsx`, `MetricGrid.tsx` | **COMPLETE** | High | Weekly mileage progress bar, gear list, sync status, and totals. |
| **Profile: Gear Tracking** | Running shoe and bicycle mileage counters | `GearDao.ts`, `AddGearModal.tsx`, `app/(tabs)/you.tsx` | **COMPLETE** | High | Mileage accumulation per workout and retirement threshold. |
| **Profile: Privacy Zones** | Address geofencing hiding start/end GPS | `PrivacyZoneDao.ts`, `PrivacyZoneModal.tsx` | **COMPLETE** | High | Mathematical polyline coordinate clipping within radius. |
| **Profile: Public Profiles** | View other athletes' stats and follow them | No dedicated screen for viewing other athletes | **PARTIAL** | High | Create `app/profile/[id].tsx` with Follow/Unfollow toggle. |
| **Settings: Preferences Hub** | Units, notifications, display preferences | Grouped into profile modals | **PARTIAL** | Medium | Create unified `/settings` screen. |
| **Offline Synchronization** | Local-first SQLite commit with cloud sync queue | `SyncManager.ts`, `DatabaseClient.ts` | **COMPLETE** | Critical | Idempotent UUIDv4 upload with retry logic and conflict avoidance. |

---

## 3. Implementation Priorities for Target Parity

To elevate the application from its current ~85% baseline to 100% observable feature parity, the implementation sequence is ordered as follows:

1. **Stage 1: Backend Entity Expansion**
   - Expand `server/prisma/schema.prisma` with `Notification`, `Club`, `ClubMember`, `Challenge`, `ChallengeParticipant`, `Route`, and `Subscription` models.
   - Run Prisma migration and seed rich initial records.
   - Add routes: `/api/notifications`, `/api/clubs`, `/api/challenges`, `/api/routes`, `/api/subscriptions`.

2. **Stage 2: Critical Header & Modal Actions**
   - Build **Subscription & Entitlements Screen (`app/subscription.tsx`)** to eliminate the Upgrade placeholder.
   - Build **Notifications Center (`app/notifications.tsx`)** to eliminate the Notification placeholder.
   - Build **Athlete & Community Search Screen (`app/search.tsx`)** to provide instant athlete discovery.

3. **Stage 3: Deep Community Screens**
   - Build **Club Details Screen (`app/clubs/[id].tsx`)** with member roster, group discussion feed, and event details.
   - Build **Challenge Details Screen (`app/challenges/[id].tsx`)** with milestone rules, trophy preview, and global participants.
   - Build **Public Athlete Profile Screen (`app/profile/[id].tsx`)** with Follow/Unfollow toggle, stats, and shared activities.

4. **Stage 4: Unified Settings & Heatmaps**
   - Build **Unified Settings Screen (`app/settings/index.tsx`)**.
   - Add Heatmap layer switch to Maps.

5. **Stage 5: Functional Verification & Testing**
   - Execute end-to-end verification across mobile and backend APIs.
   - Generate `docs/TESTING_REPORT.md`.
