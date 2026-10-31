# Strava Feature Specification & Behavioral Inventory

## 1. Feature Architecture Overview

This specification establishes a complete functional inventory of the reverse-engineered Strava Android application (`v486.11`). For every feature, user journeys, data requirements, edge cases, and an **Evidence & Confidence Rating** are provided:
- **Confirmed (High Confidence):** Explicitly evidenced by manifest components, class names, database entities, or resource strings.
- **Inferred (Medium Confidence):** Deduced logically from architecture patterns, API contracts, or SDK combinations.
- **Unestablished (Static Limitation):** Server-side algorithms or dynamic backend behaviors not determinable from client bytecode alone.

---

## 2. Feature-by-Feature Specification

### 2.1 Authentication & Onboarding

- **Description:** Onboarding flow enabling new athletes to register, existing athletes to log in, configure privacy settings, and link external health services.
- **User Journey:**
  1. Athlete launches app $\to$ `SplashActivity` validates existing JWT/OAuth tokens.
  2. If unauthenticated $\to$ Redirected to Welcome / Auth landing screen.
  3. Sign-in via Email/Password or OAuth (Google, Facebook, Apple).
  4. First-time athletes transition through `HealthConsentActivity` (Health Connect data permissions) and `ConsentFlowDeviceConnectIntroActivity`.
  5. Athlete sets primary sport, profile photo, and initial privacy baseline.
- **Key Classes & Components:**
  - `com.strava.SplashActivity`
  - `com.strava.view.auth.WelcomeInvitedActivity`
  - `com.strava.view.onboarding.HealthConsentActivity`
  - `com.strava.view.onboarding.DeviceConnectActivity`
  - `com.strava.authorization.sharedidentity.StravaIdentityProvider`
- **Data Requirements:**
  - Request: `email`, `password_hash`, `oauth_token`, `provider` (`google`, `facebook`, `apple`).
  - Response: `access_token`, `refresh_token`, `expires_at`, `athlete_summary` (`id`, `firstname`, `lastname`, `profile_medium`).
- **Edge Cases:** Token expiry during background state, revoked OAuth access, missing Health Connect permissions on Android 14+.
- **Confidence:** **Confirmed** (Evidenced by manifest activities and OAuth handler classes).

---

### 2.2 Home & Social Feed

- **Description:** Central social stream presenting completed activities from followed athletes, club posts, and personal milestones.
- **User Journey:**
  1. Athlete views reverse-chronological or algorithmic activity stream.
  2. Each activity card displays athlete avatar, name, sport badge, timestamp, title, polyline thumbnail, distance, pace/speed, moving time, and elevation gain.
  3. Interactive elements: Kudos button (with double-kudos haptic animation), comment sheet, and athlete profile navigation.
  4. Feed ordering can be toggled via `FeedOrderingSettingsActivity` (Chronological vs. Personalized).
- **Key Classes & Components:**
  - `com.strava.view.bottomnavigation.BottomNavigationActivity` (Tab 0: Home)
  - `com.strava.feed.view.modal.GroupedActivitiesModalActivity`
  - `com.strava.settings.view.FeedOrderingSettingsActivity`
  - `com.strava.repository.StravaDatabase` (`ActivityDao`, `ActivityEntity`)
  - Icons: `actions_double_kudos_highlighted`, `actions_double_kudos_normal`
- **Data Requirements:**
  - Paginated feed payload via GraphQL query (`FeedQuery`): `cursor`, `activities[]` (`id`, `athlete`, `stats`, `map_thumbnail_url`, `kudos_count`, `has_kudoed`, `comments_count`, `photos[]`).
- **Edge Cases:** Network failure during infinite scroll pagination, rapid double-tapping kudos button (idempotency key required), blocked or muted athletes.
- **Confidence:** **Confirmed** (Evidenced by GraphQL models, Room entities, and drawable assets).

---

### 2.3 Activity Recording (Highest Priority)

- **Description:** Real-time GPS and sensor recording engine for runs, rides, walks, hikes, and 30+ sports types.
- **User Journey:**
  1. Athlete taps bottom navigation tab `Record` (`RecordingScreenActivity`).
  2. App acquires fine GPS lock (checking GPS horizontal accuracy; warns if $> 25\text{m}$).
  3. Athlete taps **Start** $\to$ `StravaActivityService` transitions state `NOT_RECORDING` $\to$ `RECORDING`, starts ongoing foreground notification, and acquires CPU wake lock.
  4. Real-time HUD updates every 1 second: Elapsed Time, Distance (km/mi), Current Pace (min/km or min/mi), Average Pace, Elevation Gain, and live Mapbox polyline.
  5. Athlete pauses manually or stops moving $\to$ Auto-pause triggers (`PauseType.AUTO_PAUSE`) when speed $< 0.8\text{ m/s}$ for $> 4\text{s}$.
  6. Athlete taps **Finish** $\to$ Transitions to `SAVED`, prompts for title, sport category, gear (shoes/bike), and privacy visibility.
  7. Activity is written to `UnsyncedActivity` in `RecordingDatabase` and enqueued for upload.
- **Key Classes & Components:**
  - `com.strava.recording.StravaActivityService` (Foreground service with `type="location"`)
  - `com.strava.recording.RestartRecordingJobService` (JobScheduler recovery daemon)
  - `com.strava.recording.data.ActiveActivity` (In-memory coordinator)
  - `com.strava.recording.data.RecordingState` (`NOT_RECORDING`, `RECORDING`, `PAUSED`, `AUTOPAUSED`, `SAVED`, `DISCARDED`)
  - `com.strava.recording.data.PauseType` (`MANUAL_PAUSE`, `AUTO_PAUSE`)
  - `com.strava.recording.data.RecordingLocation` (GPS point validator)
  - `com.strava.recording.data.splits.ActivitySplits` (Real-time 1km / 1mi split tracking)
  - `com.strava.recording.data.UnsyncedActivity` (Local persistence entity)
- **Data Requirements:**
  - Location sample: `latitude`, `longitude`, `altitude`, `accuracy`, `speed`, `bearing`, `elapsedTimeMs`, `systemTimeMs`.
  - Stored activity: `guid` (UUIDv4), `sessionId`, `sportType`, `startTimestamp`, `endTimestamp`, `timerTime`, `distanceMeters`, `calories`, `coordinatesBlob`.
- **Edge Cases:** Operating system kills process under memory pressure (handled by `RestartRecordingJobService` and `CrashRecoveryState`), GPS signal loss in tunnels, battery dies during workout (recovered on next boot via `RecoverActivityReceiver`).
- **Confidence:** **Confirmed** (Evidenced by decompiled classes, method tables, and manifest definitions).

---

### 2.4 Activity Details & Post-Workout Analytics

- **Description:** Comprehensive breakdown of a completed activity including interactive map, metric splits, elevation profiles, and achievement awards.
- **User Journey:**
  1. Athlete opens an activity card from the feed or profile.
  2. Top section displays interactive Mapbox map with GPS polyline rendered using personalized stat gradients (pace, elevation, or heart rate coloring).
  3. Summary metric bar: Distance, Moving Time, Pace, Elevation Gain, Calories, Estimated Power.
  4. Splits tab: Per-kilometer or per-mile split pace table with bar chart visualization.
  5. Elevation profile: Interactive SVG elevation profile with interactive scrub marker.
  6. Trophy section: Personal Records (PRs), Local Legend badges, and segment effort rankings.
  7. Options menu: Edit activity title, crop start/end points, change map treatment, export GPX.
- **Key Classes & Components:**
  - `com.strava.activitydetail.data.models.PaceSplitRow`
  - `com.strava.activitydetail.universal.data.remote.AdpApi`
  - `com.strava.activitysave.gateway.MapTreatmentApi`
  - `com.strava.bestefforts.ui.tabbed.BestEffortsActivity`
- **Data Requirements:**
  - Detailed Activity JSON: `id`, `polyline_encoded`, `elevation_stream[]`, `distance_stream[]`, `time_stream[]`, `splits_metric[]`, `segment_efforts[]`.
- **Edge Cases:** Very long activities ($>100\text{km}$) with tens of thousands of coordinates (handled via polyline decimation / Ramer-Douglas-Peucker algorithm).
- **Confidence:** **Confirmed** (Evidenced by `PaceSplitRow`, `AdpApi`, and MapTreatment classes).

---

### 2.5 Maps & Route Exploration

- **Description:** Discovery, creation, and navigation of outdoor routes with terrain elevation contours and heatmap overlays.
- **User Journey:**
  1. Athlete selects bottom navigation tab `Maps` (`BottomNavigationActivity` Tab 1).
  2. Map presents user location alongside popular route start points and Strava Global Heatmap overlay.
  3. Athlete filters routes by sport (`Ride`, `Run`, `Walk`), distance range, surface type (`Paved`, `Dirt`), and elevation profile.
  4. Route selection opens 3D terrain preview powered by FATMAP shaders (`libFatmapSdk.so`).
  5. Athlete taps "Use Route" $\to$ Loads polyline into `RecordingScreenActivity` with turn-by-turn alerts and off-route warnings (`RouteStatus`).
- **Key Classes & Components:**
  - `com.strava.routing.data.sources.disc.storage.RoutesDatabase` (`RoutesDao`)
  - `com.strava.dynamicmapmre.offline.data.local.OfflineMapDatabase` (`Tiles`, `MapParams`)
  - `com.strava.recording.data.RouteStatus` (`UpcomingDirectionInstruction`, `RouteStatusDebug`)
  - Assets: `assets/Shared/Configs/StravaPlanetTopoDark/style.json`, `assets/Data/Packages/GlobalAltitudeRange/9.gart`
- **Data Requirements:**
  - Vector tile requests to `https://tiles.strava.com/map-styles/planet/releases/`
  - Heatmap tile requests to `https://heatmap-external-c.strava.com/tiles-auth/%s/mobileblue/{z}/{x}/{y}@2x.png`
- **Edge Cases:** Offline navigation without cellular signal (resolved via `OfflineMapDatabase` pre-downloaded tiles).
- **Confidence:** **Confirmed** (Evidenced by vector map asset configs, Room route tables, and native `libFatmapSdk.so`).

---

### 2.6 Segments, Leaderboards & Local Legends

- **Description:** Crowdsourced road and trail segments where athletes automatically compete for all-time KOM/QOM (King/Queen of the Mountain), personal records, and Local Legend status.
- **User Journey:**
  1. Server automatically parses uploaded activity coordinates and matches them against database segment geofences.
  2. If an athlete completed a segment faster than previous attempts, a PR medal (Gold, Silver, Bronze) is awarded.
  3. Live Segments: Premium subscribers paired with GPS can see approaching segments in real-time (`ActiveSegmentTargets`, `RTSProgress`) with live time gap against KOM or PR.
  4. Segment detail screen shows leaderboard filterable by "All-Time", "Today", "This Week", "Following", "Age Group", and "Weight Class".
- **Key Classes & Components:**
  - `com.strava.segments.map.SegmentMapActivity`
  - `com.strava.recording.data.rts.ActiveSegmentTargets`
  - `com.strava.recording.data.rts.RTSProgress`
  - `com.strava.recording.data.KomEffort`
  - `com.strava.recordingui.settings.sensors.LiveSegmentSettingsActivity`
- **Data Requirements:**
  - Segment matching payload: `segment_id`, `name`, `polyline`, `start_latlng`, `end_latlng`, `distance`, `average_grade`, `climb_category`.
- **Edge Cases:** GPS jitter triggering false segment entry (filtered via entry bearing tolerance and minimum point match threshold).
- **Confidence:** **Confirmed** (Evidenced by RTS classes and segment map activities).

---

### 2.7 Groups, Clubs & Challenges

- **Description:** Community hub encompassing athletic clubs, group workout events, and monthly motivation challenges.
- **User Journey:**
  1. Bottom navigation tab `Groups` (`BottomNavigationActivity` Tab 3) displays joined clubs and active challenges.
  2. Challenges: e.g. "November 5K", "Gran Fondo 100km". Displays progress bar, days remaining, and trophy award upon completion.
  3. Clubs: Group feed (`ClubFeedActivity`), member roster, weekly group ride/run calendar (`EventDetailRepository`), and group discussion posts.
- **Key Classes & Components:**
  - `com.strava.clubs.feed.ClubFeedActivity`
  - `com.strava.challenges.gateway.ChallengeDatabase` (`ChallengeGalleryEntity`, `CompletedChallengeEntity`)
  - `com.strava.clubs.shared.data.repository.ClubDao`
  - `com.strava.clubs.groupevents.detailv2.data.EventDetailRepository`
- **Data Requirements:**
  - Challenge progress: `challenge_id`, `milestone_target`, `current_progress`, `is_completed`, `badge_url`.
- **Edge Cases:** Time zone boundary crossings when calculating challenge deadline validity.
- **Confidence:** **Confirmed** (Evidenced by `ChallengeDatabase` Room entities and Club DAOs).

---

### 2.8 Athlete Profile & Training Log ("You" Tab)

- **Description:** Personal athlete dashboard summarizing cumulative lifetime and yearly statistics, trophy case, training calendar, and equipment tracking.
- **User Journey:**
  1. Bottom navigation tab `You` (`BottomNavigationActivity` Tab 4) opens modular athlete profile (`ProfileModularActivity`).
  2. Header shows profile photo, bio, location, follower/following count.
  3. Statistics widget: Weekly mileage progress bar against user-defined weekly goal.
  4. Training Log: Interactive heat calendar displaying past workouts categorized by sport color.
  5. Gear tracker: List of running shoes and bicycles (`GearDao`, `GearEntity`) with accumulated mileage to monitor shoe wear and bike maintenance.
- **Key Classes & Components:**
  - `com.strava.profile.view.ProfileModularActivity`
  - `com.strava.gear.data.GearDao` (`GearEntity`)
  - `com.strava.athleteworkouts.db.AthleteWorkoutsDatabase`
  - Menu: `res/menu/you_tab_menu.xml`
- **Data Requirements:**
  - Profile summary: `athlete_id`, `weekly_totals` (`distance`, `time`, `elevation`), `gear[]` (`id`, `name`, `primary`, `distance_meters`).
- **Confidence:** **Confirmed** (Evidenced by `ProfileModularActivity`, `GearDao`, and `you_tab_menu.xml`).

---

### 2.9 Beacon & Live Location Streaming

- **Description:** Safety feature transmitting live GPS coordinates via SMS/web link to designated emergency contacts.
- **User Journey:**
  1. Athlete enables Beacon in `LiveTrackingPreferencesActivity` and selects up to 3 safety contacts.
  2. On activity start, `StravaActivityService` triggers `LiveTrackingSettingsUpdateService`.
  3. `BeaconUpdateWorker` enqueues periodic HTTP POST requests containing current latitude, longitude, speed, and battery percentage.
  4. Safety contacts receive an SMS link to view the live pin moving on a web map.
- **Key Classes & Components:**
  - `com.strava.recording.beacon.BeaconState`
  - `com.strava.recording.beacon.BeaconStreams`
  - `com.strava.recording.beacon.BeaconUpdateWorker`
  - `com.strava.recordingui.legacy.beacon.LiveTrackingPreferencesActivity`
- **Confidence:** **Confirmed** (Evidenced by `BeaconUpdateWorker` and beacon data models).

---

### 2.10 Privacy Zones & Geofencing

- **Description:** Athlete safety control allowing users to conceal the start and end of activities within a radius (e.g. 200m–1000m) of their home or workplace.
- **User Journey:**
  1. Athlete enters address in `AddPrivacyZoneActivity`.
  2. Chooses radius or selects "Hide entire map" (`HideEntireMapActivity`).
  3. Local and remote database stores privacy circle geofence (`PrivacyZonesDatabase`).
  4. When viewing an activity, any GPS coordinates falling within the privacy radius are cropped from public polyline views.
- **Key Classes & Components:**
  - `com.strava.settings.gateway.PrivacyZonesDatabase`
  - `com.strava.settings.view.privacyzones.HideEntireMapActivity`
  - `res/menu/add_privacy_zone_menu.xml`
- **Confidence:** **Confirmed** (Evidenced by Room `PrivacyZonesDatabase` and manifest activities).
