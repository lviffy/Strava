# Existing Application Audit & Architecture Baseline

**Document Version:** 1.0.0  
**Audit Date:** 2026-10-31  
**Project Root:** `/home/lviffy/Projects/REA/Strava`  
**Target Platform:** Mobile (React Native + Expo SDK 58, Android / iOS / Web) & Backend (Node.js + Express + Prisma ORM + PostgreSQL / PostGIS)  

---

## 1. Executive Summary

This audit establishes the comprehensive technical baseline of the existing fitness tracking application before executing the master feature reconstruction to achieve functional parity with the reference **Strava Android Application (v486.11, build 12400195)**.

The current codebase represents an already functional, high-standard full-stack fitness tracking prototype with offline-first mobile persistence, high-precision GPS tracking, local analytics engines, and a containerized PostGIS backend. However, several critical user workflows, interactive header actions, community features (clubs and challenge detail interactions), notification streams, search capabilities, and subscription management remain either partially implemented, mapped to temporary alerts, or isolated to mocked interfaces.

---

## 2. Technology Stack & Dependencies Audit

### 2.1 Mobile Application (`package.json`)
- **Framework:** Expo `~58.0.21` (React Native `0.88.1`, React `19.3.0`)
- **Navigation:** Expo Router `~58.0.28` (file-based routing with typed route generation)
- **Local Database:** `expo-sqlite ~58.0.14` (WAL mode enabled, typed DAO layers)
- **State Management:** Zustand `^5.0.16` (in-memory recording and authentication state stores)
- **Geospatial & Maps:** `react-native-maps 1.29.11` (Google Maps provider on Android), `expo-location ~58.0.20`
- **Sensors, Hardware & Media:**
  - `expo-keep-awake ~58.0.3` (screen wake-lock during workouts)
  - `expo-haptics ~58.0.7` (haptic pulses on controls and milestone crossings)
  - `expo-speech ~58.0.3` (text-to-speech audio cue synthesis for pace and split alerts)
  - `expo-secure-store ~58.0.2` (encrypted JWT storage)
  - `expo-image ~58.0.18` (hardware-accelerated image caching)
- **UI & Animation:** `react-native-reanimated 4.7.1`, `react-native-svg 15.16.0`, `react-native-safe-area-context ~5.10.1`, `@expo/vector-icons ^15.0.2` (Ionicons)

### 2.2 Backend Application (`server/package.json`)
- **Runtime:** Node.js (TypeScript `^5.4.5`, `tsx` development runner)
- **HTTP Server:** Express `^4.19.2`, CORS `^2.8.5`, Morgan logger `^1.10.0`
- **Database & ORM:** PostgreSQL 16 with PostGIS extension (`postgis/postgis:16-3.4` in Docker Compose), Prisma ORM `^5.14.0` (`@prisma/client`)
- **Authentication:** `jsonwebtoken ^9.0.2`, `bcryptjs ^2.4.3`

---

## 3. Current Directory Structure & Modules

```
/home/lviffy/Projects/REA/Strava/
├── app/                              # Expo Router file-system routing
│   ├── (auth)/                       # Authentication group
│   │   ├── login.tsx                 # Athlete login screen
│   │   └── register.tsx              # Athlete registration screen
│   ├── (tabs)/                       # 5-Tab primary app scaffold
│   │   ├── _layout.tsx               # Tab navigator + header buttons
│   │   ├── index.tsx                 # Home feed screen (local + cloud stream)
│   │   ├── maps.tsx                  # Maps & route explorer
│   │   ├── record.tsx                # Real-time HUD workout recording
│   │   ├── groups.tsx                # Clubs & Challenges hub
│   │   └── you.tsx                   # Athlete profile & training history
│   ├── activity/
│   │   ├── [id].tsx                  # Activity detail breakdown & analytics
│   │   └── save.tsx                  # Post-workout save & title screen
│   ├── +html.tsx                     # Web entry point
│   ├── +not-found.tsx                # 404 handler
│   ├── _layout.tsx                   # Root navigation stack with theme provider
│   └── modal.tsx                     # Example modal route
├── components/                       # Shared UI and modular widgets
│   ├── activity/                     # Activity cards, metrics, splits, charts
│   ├── beacon/                       # Beacon live tracking modal
│   ├── feed/                         # Comments sheet modal
│   ├── gear/                         # Gear addition modal
│   ├── privacy/                      # Privacy zones configuration modal
│   └── ui/                           # Design system primitives (Button, Card, Badge, etc.)
├── constants/
│   └── theme.ts                      # Design tokens (colors, typography, spacing, radii)
├── database/                         # Local SQLite persistence layer (expo-sqlite)
│   ├── DatabaseClient.ts             # WAL initialization, migrations, connection pool
│   ├── ActivityDao.ts                # Activity CRUD, raw 1Hz points, splits
│   ├── BeaconDao.ts                  # Emergency contacts & token persistence
│   ├── BestEffortsDao.ts             # 400m, 1k, 5k, 10k personal record efforts
│   ├── GearDao.ts                    # Running shoes and bike mileage tracking
│   ├── InsightsDao.ts                # AI Athlete Intelligence insight records
│   ├── PredictionsDao.ts             # Race predictor benchmark cache
│   └── PrivacyZoneDao.ts             # Geofence privacy circle coordinates
├── features/
│   ├── analytics/                    # Best efforts engine, race predictor, intelligence
│   ├── beacon/                       # Live location broadcast dispatcher
│   └── recording/                    # GPS location engine, calculations, audio cues
├── services/
│   ├── ApiClient.ts                  # Authenticated HTTP client with token refresh & fallback
│   ├── AuthService.ts                # Token management & authentication bridge
│   └── SyncManager.ts                # Idempotent offline-to-cloud upload queue
├── store/
│   ├── useAuthStore.ts               # Authenticated athlete session store
│   └── useRecordingStore.ts          # Live workout state machine (Zustand)
└── server/                           # Backend Node.js Express server
    ├── prisma/
    │   ├── schema.prisma             # Relational PostGIS schema
    │   └── seed.ts                   # Demo athletes, activities, segments
    └── src/
        ├── app.ts                    # Express setup and middleware
        ├── db.ts                     # Prisma client singleton
        ├── server.ts                 # HTTP listener on port 4000
        └── routes/
            ├── auth.routes.ts        # Register, login, me
            ├── activities.routes.ts  # Activities feed, sync, kudos, comments
            ├── segments.routes.ts    # Segment matching, leaderboards
            └── users.routes.ts       # Profile stats, athlete relationships
```

---

## 4. Subsystem Implementation Status

| Subsystem | Existing State | Detailed Assessment | Deficiencies / Gaps |
|---|---|---|---|
| **Authentication & Profile** | **Partially Implemented** | Login and Register screens exist with email/password validation, demo login bypass, and secure token persistence via `expo-secure-store`. | Password reset flow missing. Profile photo upload UI missing. Third-party OAuth (Google/Apple) not wired. Other athletes' profiles cannot be viewed directly. |
| **Home Social Feed** | **Partially Implemented** | Feed presents unified timeline merging unsynced local workouts with cloud activities. Optimistic Kudos toggle, comment sheet modal with real-time comments, athlete avatars, and metric cards work. | Header contains placeholder `Alert.alert` for "Upgrade", "Messages", and "Notifications". Feed filter (Followed vs. You) missing. |
| **Activity Recording (GPS)** | **Fully Implemented** | Dedicated `GpsEngine.ts` with 1Hz location polling (`expo-location`), Haversine distance, speed jump filtering ($>45\text{ m/s}$ drop), stationary jitter filter ($<1.5\text{ m}$), pace smoothing, auto-pause, audio voice cues (`expo-speech`), live route overlay, and instant SQLite checkpointing. | Background location limited by Expo Go shell (documented constraint). Recovery on boot requires manual app resume. |
| **Activity Detail & Analytics** | **Fully Implemented** | Interactive route map (`react-native-maps`), pace/elevation metric grid, visual splits bar, elevation profile chart, PR medals (`HeroPrBanner`), Best Efforts list (400m, 1k, 1mi, 5k), AI insights, GPX export, and crop activity modal. | Interactive elevation scrub cursor could be smoother. Video and multi-photo upload missing. |
| **Maps & Route Exploration** | **Partially Implemented** | Interactive route selector with sport filter (All, Run, Ride, Hike), route detail cards with elevation gain and distance, and "Use Route" button loading polyline into recorder. | Custom route creation/drawing missing. Global heatmap tile layer toggle not yet enabled. Saved offline routes database table exists but download UI is minimal. |
| **Groups, Clubs & Challenges** | **Partially Implemented** | Segmented tabs for Challenges and Clubs. Club cards with member counts and join toggle. Challenge cards with progress bars and remaining days. | Club detail screen with discussions and member roster missing. Challenge detail screen with official rules and leaderboards missing. |
| **Athlete Profile ("You" Tab)** | **Fully Implemented** | Athlete avatar, lifetime totals, weekly goal progress bar, pending sync banner with instant sync trigger, gear management modal (shoes/bike mileage), Beacon safety modal, Privacy zones modal, and logout flow. | Yearly heat calendar (activity squares) is static. Public profile sharing link not implemented. |
| **Backend & Cloud Database** | **Partially Implemented** | Express server on port 4000 backed by PostGIS container with Prisma ORM. Models for User, Activity, Coordinate, Split, Kudos, Comment, Follow, Segment, SegmentEffort. | Missing Prisma models and API routes for: Notifications, Clubs, Challenges, Routes, and User Subscriptions. |
| **Offline Synchronization** | **Fully Implemented** | `SyncManager.ts` queries SQLite for `sync_status = 'PENDING'`, batches coordinates and splits, posts idempotently with UUIDv4 GUID, updates status to `SYNCED`, and triggers haptic notification. | Background auto-sync worker not scheduled via WorkManager/JobScheduler (Expo Go limitation). |

---

## 5. Identified Placeholder Elements & Action Items

The following elements in the active code currently use mock responses or placeholder alerts:
1. `app/(tabs)/_layout.tsx` Header Upgrade Button: Calls `Alert.alert('Strava Subscription', ...)` $\to$ Needs a dedicated **Subscription & Entitlements Screen**.
2. `app/(tabs)/_layout.tsx` Header Notifications Button: Calls `Alert.alert('Notifications', ...)` $\to$ Needs a dedicated **Notifications Hub Screen**.
3. `app/(tabs)/_layout.tsx` Header Search Button: Directly pushes `/(tabs)/maps` $\to$ Needs an **Athlete & Community Search Screen**.
4. `app/(tabs)/groups.tsx` Club and Challenge item taps: Do not navigate to dedicated details $\to$ Need **Club Details (`app/clubs/[id].tsx`)** and **Challenge Details (`app/challenges/[id].tsx`)**.
5. Server Prisma Schema: Lacks models for `Notification`, `Club`, `Challenge`, and `Route` $\to$ Must update Prisma schema and migrate.

---

## 6. Audit Conclusion

The application has a robust architectural foundation with zero fatal crashes and pristine code quality in its core recording and local persistence engine. The immediate next phase is to expand the backend schema and APIs, replace all remaining placeholder actions with functional screens, and build out complete feature parity with the reverse-engineered Strava reference application.
