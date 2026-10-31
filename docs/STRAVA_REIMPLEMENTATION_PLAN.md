# Strava Reimplementation Architecture & Phased Roadmap

## 1. Project Architecture (React Native + Expo Go)

This document establishes the implementation blueprint for building an independent, production-grade fitness tracking platform using **React Native**, **Expo**, **Expo Go**, and **TypeScript**.

### 1.1 Suggested Directory Structure

```text
src/
├── app/                               # Expo Router file-based navigation
│   ├── (auth)/                        # Authentication routes
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/                        # Root 5-tab navigation
│   │   ├── _layout.tsx                # Bottom Tab Bar configuration
│   │   ├── index.tsx                  # Tab 0: Home Feed
│   │   ├── maps.tsx                   # Tab 1: Maps & Routes
│   │   ├── record.tsx                 # Tab 2: Live Activity Recording
│   │   ├── groups.tsx                 # Tab 3: Clubs & Challenges
│   │   └── you.tsx                    # Tab 4: Athlete Profile & Stats
│   ├── activity/
│   │   ├── [id].tsx                   # Activity Detail screen
│   │   └── save.tsx                   # Post-workout Save & Title screen
│   └── _layout.tsx                    # Root application layout
│
├── components/                        # Reusable presentation components
│   ├── ui/                            # Buttons, Inputs, Cards, Badges, Modals
│   ├── maps/                          # MapViewWrapper, PolylineOverlay, MarkerPin
│   ├── activity/                      # MetricTile, SplitRow, ElevationChart
│   └── feed/                          # ActivityCard, KudosButton, CommentSheet
│
├── features/                          # Domain feature modules
│   ├── authentication/                # Auth logic, token refresh
│   ├── recording/                     # GPS tracking, state machine, filters
│   │   ├── GpsEngine.ts               # Core location loop & filter
│   │   ├── StateMachine.ts            # State transition rules
│   │   ├── Calculations.ts            # Haversine, pace, elevation
│   │   └── useRecordingSession.ts     # Hook connecting UI to engine
│   ├── activities/                    # Activity CRUD, upload queue
│   ├── feed/                          # Feed query hooks & pagination
│   └── routes/                        # Route geometry & polyline decoders
│
├── database/                          # SQLite local persistence
│   ├── DatabaseClient.ts              # expo-sqlite connection & migrations
│   ├── ActivityDao.ts                 # Local activity queries
│   └── LocationDao.ts                 # Raw GPS coordinate batch inserts
│
├── services/                          # External API communication
│   ├── ApiClient.ts                   # Axios / fetch with auth interceptors
│   ├── ActivityService.ts             # Upload and detail endpoints
│   └── AuthService.ts                 # Login, signup, refresh endpoints
│
├── store/                             # Centralized state management
│   ├── useAuthStore.ts                # Zustand auth state
│   └── useRecordingStore.ts           # In-memory live recording state
│
├── hooks/                             # Shared React hooks
├── utils/                             # Formatters (pace, distance, duration)
└── types/                             # TypeScript interfaces & domain models
```

---

## 2. Screen Hierarchy & UI Specification

### 2.1 Tab 0: Home Feed (`app/(tabs)/index.tsx`)
- **Purpose:** Central social activity feed.
- **Layout:** Top bar with Strava-like clean title, notification bell, and direct message icon; vertical scroll feed.
- **Key Components:** `ActivityCard` (Athlete avatar, sport badge, relative timestamp, workout title, static Map thumbnail, 4-metric grid [Distance, Pace, Time, Elevation], interactive Kudos counter with haptic pulse, comments trigger).
- **Data Requirements:** Paginated feed payload (`GET /api/v1/feed?cursor=...`).
- **States:**
  - *Loading:* Skeleton cards matching metric grid layout.
  - *Empty:* "Find friends to follow or record your first activity."
  - *Error:* Pull-to-refresh retry banner.

### 2.2 Tab 1: Maps (`app/(tabs)/maps.tsx`)
- **Purpose:** Route exploration and popular start points.
- **Layout:** Fullscreen `<MapView>` (`react-native-maps`) with floating filter chips (Run, Ride, Hike; Distance slider).
- **Key Components:** Interactive route cards sliding up from bottom sheet upon pin tap; "Start Route" action button.
- **Data Requirements:** Nearby routes geo-query (`GET /api/v1/routes?bbox=...`).

### 2.3 Tab 2: Record (`app/(tabs)/record.tsx`)
- **Purpose:** Live GPS activity recording.
- **Layout:** 
  - Top half: Interactive Google Map with live athlete marker and real-time blue polyline.
  - Bottom half: High-contrast Metric HUD displaying:
    - Primary Big Stat: **Current Pace** (or Speed for Cycling)
    - 3-Column Secondary Grid: **Distance**, **Time (Elapsed/Moving)**, **Elevation Gain**
  - Control Bar: Sport type selector pill; Big Circular Start / Pause / Resume / Finish buttons.
- **Interactions:**
  - Tapping **Start** activates screen wake lock (`expo-keep-awake`) and begins GPS ingestion.
  - Tapping **Pause** stops moving timer and displays yellow paused indicator.
  - Tapping **Finish** navigates to Save screen.
- **States:**
  - *Preparing:* Satellite accuracy pill (Green $<10\text{m}$, Yellow $10\text{--}25\text{m}$, Red $>25\text{m}$).
  - *Recording:* Live pulsing timer and glowing polyline tip.

### 2.4 Activity Save Screen (`app/activity/save.tsx`)
- **Purpose:** Post-workout review, naming, and upload trigger.
- **Layout:** Form scroll view containing map polyline preview thumbnail, Title input (auto-defaults to "Morning Run"), Sport Type picker, Description textarea, Gear selector (shoes/bike), and Privacy toggle.
- **Actions:** "Save Activity" commits to SQLite and triggers background sync; "Discard" deletes temporary points.

### 2.5 Activity Detail Screen (`app/activity/[id].tsx`)
- **Purpose:** In-depth workout analysis.
- **Layout:**
  1. Top: Full-width interactive map with polyline gradient.
  2. Metric Summary Grid: Distance, Moving Time, Pace, Elevation Gain, Estimated Calories.
  3. Splits Table: Collapsible 1km / 1mi split breakdown with comparative pace bar indicators.
  4. Elevation Profile: Interactive SVG chart with scrub finger cursor mapping to position on map.
  5. Social Section: Kudos avatar list and comment thread.

### 2.6 Tab 4: You (`app/(tabs)/you.tsx`)
- **Purpose:** Personal athlete dashboard and training log.
- **Layout:** Athlete profile header (Avatar, name, location, follower counts); Weekly Goal progress ring; Heatmap activity calendar; Gear mileage list.

---

## 3. Phased Implementation Roadmap

### Milestone 1: Project Foundation & Architecture Setup
- **Scope:** Expo project initialization with TypeScript, Expo Router tab structure, custom design system, local SQLite database client, and JWT authentication flows.
- **Modules:** `database/DatabaseClient.ts`, `services/AuthService.ts`, `store/useAuthStore.ts`, `app/(auth)/*`, `app/(tabs)/_layout.tsx`.
- **Dependencies:** `expo-router`, `expo-sqlite`, `expo-secure-store`, `react-native-safe-area-context`.
- **Complexity:** Medium (M)
- **Risks:** Navigation deep-linking or SQLite migration failures on fresh installs.
- **Acceptance Criteria:** User can register, log in, store tokens securely, and switch between the 5 placeholder tabs.

---

### Milestone 2: Core GPS Recording Engine (Highest Priority)
- **Scope:** Implementation of foreground GPS tracking via `expo-location`, screen wake lock with `expo-keep-awake`, Haversine distance, speed-filtered pace smoothing, auto-pause heuristics, and per-point SQLite persistence.
- **Modules:** `features/recording/*`, `database/LocationDao.ts`, `app/(tabs)/record.tsx`.
- **Dependencies:** `expo-location`, `expo-keep-awake`, `expo-haptics`, `react-native-maps`.
- **Complexity:** Large (L)
- **Risks:** GPS drift when athlete is stationary; Android killing background app if user ignores keep-awake recommendation.
- **Acceptance Criteria:** Athlete can walk or run with phone; live HUD displays distance, time, and pace accurately; closing and reopening app prompts to recover unfinished workout from SQLite.

---

### Milestone 3: Activity History & Workout Details
- **Scope:** Post-workout save flow, polyline encoding, interactive Google Map detail view, kilometer/mile split calculation, and interactive SVG elevation profile.
- **Modules:** `app/activity/*`, `components/maps/PolylineOverlay.tsx`, `components/activity/ElevationChart.tsx`.
- **Dependencies:** `react-native-maps`, `react-native-svg`, `react-native-wagmi-charts`.
- **Complexity:** Medium (M)
- **Risks:** Performance lag when rendering polylines containing $>5,000$ coordinate points.
- **Acceptance Criteria:** Saved workout displays polyline route on map, split table matches recorded distance, and elevation chart allows interactive scrubbing.

---

### Milestone 4: Cloud Synchronization & Social Feed
- **Scope:** Idempotent backend activity upload (`POST /api/v1/activities`), offline retry queue, paginated social feed, kudos toggle with optimistic UI, and comment sheets.
- **Modules:** `services/ActivityService.ts`, `features/feed/*`, `app/(tabs)/index.tsx`.
- **Dependencies:** `axios` / `fetch`, `expo-image`.
- **Complexity:** Medium (M)
- **Risks:** Network drop mid-upload creating duplicate activities (mitigated via UUID idempotency key).
- **Acceptance Criteria:** Completed activities upload automatically when online; feed displays card with polyline preview; kudos count increments instantly with haptic response.

---

### Milestone 5: Routes & Waypoint Discovery
- **Scope:** Route discovery tab (`app/(tabs)/maps.tsx`), saved routes list, polyline loading into record screen, and turn-by-turn guidance cues.
- **Modules:** `features/routes/*`, `app/(tabs)/maps.tsx`.
- **Dependencies:** `react-native-maps`.
- **Complexity:** Large (L)
- **Risks:** Off-route detection sensitivity.
- **Acceptance Criteria:** Athlete can select a saved route and see the guide path overlaid on their live recording map.

---

### Milestone 6: Community Features (Clubs & Challenges)
- **Scope:** Groups tab (`app/(tabs)/groups.tsx`), monthly milestone challenges with progress bars, club roster, and event schedules.
- **Modules:** `app/(tabs)/groups.tsx`, `features/community/*`.
- **Complexity:** Small (S)
- **Acceptance Criteria:** Athlete can view challenges and observe progress bar fill up as matching activities are uploaded.

---

### Milestone 7: Audio Cues & Performance Analytics
- **Scope:** Text-to-speech audio feedback on split milestones ("1 kilometer completed, pace 5 minutes 12 seconds") using `expo-speech`; weekly/monthly training log analytics charts.
- **Modules:** `services/AudioCueService.ts`, `app/(tabs)/you.tsx`.
- **Dependencies:** `expo-speech`.
- **Complexity:** Small (S)
- **Acceptance Criteria:** App speaks split time through phone speaker or connected earphones every 1 km.

---

### Milestone 8: Production Hardening & Native Ejection Path
- **Scope:** Extensive battery drain testing, GPS noise calibration across devices, offline queue stress testing. Preparation of optional prebuild configuration (`expo-dev-client`) for post-MVP transition to native foreground services and BLE heart rate monitors.
- **Complexity:** Large (L)
- **Acceptance Criteria:** Zero critical crashes; battery drain $<6\%$ per hour during active tracking.

---

## 4. Minimum Viable Product (MVP) vs. Post-MVP Scope

| In Scope for MVP (Expo Go) | Explicitly Postponed (Post-MVP / Native Build) |
|---|---|
| **User Auth (Email + Password JWT)** | Social OAuth via external native apps |
| **Foreground GPS Recording ($1\text{Hz}$)** | Custom Native Background Service (`FOREGROUND_SERVICE_LOCATION`) |
| **Keep-Awake Active HUD** | Bluetooth LE Heart Rate Monitors & Power Meters |
| **Local SQLite Persistence & Recovery** | FATMAP 3D C++ Terrain Shaders |
| **Google Maps (`react-native-maps`)** | Mapbox Custom Vector Styling (`@rnmapbox/maps`) |
| **Splits & Elevation Profiles** | Live Segment Approaching Audio Beacons |
| **Activity Cloud Upload & Deduplication** | Direct WearOS Watch Synchronization |
| **Social Feed, Kudos & Comments** | Video Upload Transcoding (LiTr) |
| **Basic Route Creation & GPX Export** | Subscription In-App Purchases (Google Play Billing) |
