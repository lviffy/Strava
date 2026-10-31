# Strava Screen Inventory & Hierarchy

**Reference Application:** Strava Android App (Package: `com.strava`, Version: `486.11`, Build: `12400195`)  
**Evidence Source:** Reverse-Engineered AndroidManifest.xml (390 Activities), Layout XMLs (2,007 files), Menu XMLs (62 files), Base Resource String Pool (`resources.arsc`).  

---

## 1. Top-Level Screen Architecture

Strava structures its primary user journey around a bottom navigation scaffold hosted inside `com.strava.view.bottomnavigation.BottomNavigationActivity`, providing immediate access to five primary modules:
1. **Home Feed (`Home` / Tab 0)**
2. **Maps & Routes (`Maps` / Tab 1)**
3. **Live Workout Recording (`Record` / Tab 2)**
4. **Groups, Clubs & Challenges (`Groups` / Tab 3)**
5. **Athlete Profile & History (`You` / Tab 4)**

Supporting this scaffold are dedicated modal stacks, fullscreen flows, deep-link intent catchers, and settings sub-hierarchies.

---

## 2. Exhaustive Screen Inventory by Module

### 2.1 Authentication & Onboarding
| Screen Name | Reverse-Engineered Manifest Activity / Class | Purpose & Observable UI Elements |
|---|---|---|
| **Splash Screen** | `com.strava.SplashActivity` | Initial launch route; displays animated Strava mark while validating cached OAuth/JWT tokens. |
| **Welcome Carousel** | `com.strava.authorization.view.welcomeCarouselActivity.WelcomeCarouselActivity` | Value proposition carousel introducing running, cycling, hiking, and athlete community. |
| **Login / Sign Up** | `com.strava.authorization.loginorsignup.LogInOrSignUpActivity` | Entry selection: Continue with Google, Continue with Apple, Continue with Facebook, or Continue with Email. |
| **Email Login** | `com.strava.authorization.oauth.OAuthActivity` | Email and password input fields, "Forgot password?" link, Submit CTA, and error toast handling. |
| **Account Creation** | `com.strava.authorization.changeemail.ChangeEmailActivity` / `OnboardingActivity` | First name, last name, date of birth, gender selection, and primary sport preference. |
| **Health Consent** | `com.strava.view.onboarding.HealthConsentActivity` | Permission disclosure for Health Connect (exercise, heart rate, distance, calories). |
| **Device Connect Intro** | `com.strava.view.onboarding.DeviceConnectActivity` | Connect Garmin, Wahoo, Apple Watch, Fitbit, or Polar Bluetooth sensors. |

---

### 2.2 Main Navigation & Feed
| Screen Name | Reverse-Engineered Manifest Activity / Class | Purpose & Observable UI Elements |
|---|---|---|
| **Home Activity Feed** | `com.strava.view.bottomnavigation.BottomNavigationActivity` (Tab 0) | Infinite scrolling feed of followed athletes' activities. Header contains Upgrade badge, Add button, Search button, Direct Chat button, and Notifications bell. |
| **Grouped Activities Modal** | `com.strava.feed.view.modal.GroupedActivitiesModalActivity` | Collapsible modal displaying workouts completed together by group athletes on the same route. |
| **Feed Ordering Settings** | `com.strava.settings.view.FeedOrderingSettingsActivity` | Toggle between "Personalized" (algorithmic engagement-based) and "Latest Activities" (chronological). |
| **Kudos List** | `com.strava.activitydetail.view.kudos.KudoListActivity` | Full modal roster of all athletes who gave kudos on an activity, with instant Follow/Unfollow action buttons. |
| **Comments Sheet** | `com.strava.comments.activitycomments.ActivityCommentsActivity` | Real-time scrollable comment stream with text input, athlete mention tags (`@`), and report abuse option. |
| **Notifications Hub** | `com.strava.notificationsui.NotificationListActivity` | Activity notifications (kudos received, comments, follow requests, challenge milestones, club announcements) with "Mark All Read". |
| **Community Search** | `com.strava.communitysearch.view.athletesearch.AthleteSearchActivity` | Real-time athlete search, club search, recent searches history, and contact synchronization. |

---

### 2.3 Activity Recording Subsystem
| Screen Name | Reverse-Engineered Manifest Activity / Class | Purpose & Observable UI Elements |
|---|---|---|
| **Live Recording Screen** | `com.strava.recordingui.RecordingScreenActivity` | Fullscreen live HUD with vector map, start/pause/resume/finish buttons, sport type picker, GPS accuracy indicator, and real-time metrics. |
| **Unsynced / Pending Activities** | `com.strava.recordingui.legacy.UnsyncedActivitiesActivity` | Offline storage recovery UI displaying workouts stored in local SQLite awaiting cloud synchronization. |
| **Audio Cues Settings** | `com.strava.recordingui.settings.AudioCuesSettingsActivity` | Toggle text-to-speech voice announcements for distance (every 1 km / 1 mi) and pace. |
| **Auto-Pause Settings** | `com.strava.recordingui.settings.AutoPauseSettingsActivity` | Speed threshold selector ($<0.8\text{ m/s}$) to automatically halt timer at traffic stops. |
| **Beacon Safety Hub** | `com.strava.recordingui.legacy.beacon.LiveTrackingPreferencesActivity` | Emergency contact management (up to 3 contacts) and live tracking web stream toggle. |
| **Beacon Contact Selector** | `com.strava.recordingui.legacy.beacon.BeaconContactSelectionActivity` | Phone contacts picker to designate Beacon live GPS stream recipients. |
| **Post-Workout Save Screen** | `com.strava.activitysave.ui.SaveActivity` | Workout title input, sport type confirmation, gear selection (shoes/bike), perceived exertion slider, privacy visibility dropdown, and Save/Discard buttons. |

---

### 2.4 Activity Details & Deep Analytics
| Screen Name | Reverse-Engineered Manifest Activity / Class | Purpose & Observable UI Elements |
|---|---|---|
| **Activity Detail Screen** | `com.strava.activitydetail.view.ActivityDetailModularActivity` / `AdpActivity` | Comprehensive post-workout breakdown: interactive route map, metric cards, pace splits table, elevation profile, PR awards, and kudos. |
| **Crop Activity** | `com.strava.activitydetail.crop.ActivityCropActivity` | Slider-based start/end coordinate trimmer to remove accidental driving or cooldown GPS tracks. |
| **3D Flyover Modal** | `com.strava.flyover.FlyoverActivity` | Animated 3D satellite camera following the athlete's route from start to finish. |
| **Best Efforts Breakdown** | `com.strava.bestefforts.ui.details.BestEffortsDetailsActivity` | Benchmark split analysis (400m, 1k, 1mi, 5k, 10k, Half Marathon) comparing current activity against lifetime PRs. |
| **Power Profile / Curve** | `com.strava.activitydetail.power.ui.ActivityPowerCurveActivity` | Wattage distribution curve across 5s, 1min, 5min, 20min intervals for cycling power meter workouts. |
| **Matched Activities** | `com.strava.activitydetail.view.MatchedActivitiesActivity` | Historical comparison of all previous runs or rides completed on the identical geographic polyline. |

---

### 2.5 Maps, Routes & Segments
| Screen Name | Reverse-Engineered Manifest Activity / Class | Purpose & Observable UI Elements |
|---|---|---|
| **Maps & Route Explorer** | `com.strava.view.bottomnavigation.BottomNavigationActivity` (Tab 1) | Interactive map showcasing popular route start points, Strava Global Heatmap overlay, and terrain contours. |
| **Route Details** | `com.strava.routing.data.sources.disc.storage.RoutesDatabase` | Route overview with elevation gain, distance, surface breakdown (paved/dirt), and "Use Route" action. |
| **Segment Map Explorer** | `com.strava.segments.map.SegmentMapActivity` | Geographic segment explorer highlighting nearby sprints, climbs, and verified courses. |
| **Segment Leaderboard** | `com.strava.segments.leaderboard.SegmentLeaderboardActivity` | Ranked effort table filterable by "All-Time", "Today", "This Week", "Following", and "Age Group". |
| **Local Legends** | `com.strava.settings.view.PrivacySettingLocalLegendsActivity` | Crown award screen for the athlete with the most repeated efforts on a specific segment over a rolling 90-day window. |

---

### 2.6 Community, Clubs & Challenges
| Screen Name | Reverse-Engineered Manifest Activity / Class | Purpose & Observable UI Elements |
|---|---|---|
| **Groups Hub** | `com.strava.view.bottomnavigation.BottomNavigationActivity` (Tab 3) | Segmented view between active Challenges and joined Clubs. |
| **Club Details** | `com.strava.clubs.detail.ClubDetailModularActivity` | Club cover photo, member count, sport category, club announcements feed, weekly leaderboard, and Join/Leave toggle. |
| **Club Member Roster** | `com.strava.clubs.members.ClubMembersActivity` | Paginated directory of all registered club members with instant follow links. |
| **Create Club** | `com.strava.clubs.create.CreateClubActivity` | Form to create a new athletic club (Name, Sport, Location, Privacy: Public vs. Invite-Only). |
| **Challenge Details** | `com.strava.challenges.challengedetail.ChallengeDetailActivity` | Challenge goal description, milestone target (e.g. 100km ride), days remaining, progress bar, participant count, and digital trophy preview. |
| **Challenge Participants** | `com.strava.challenges.participants.ChallengeParticipantsListActivity` | Global leaderboard of athletes enrolled in the active challenge. |

---

### 2.7 Athlete Profile & Training Hub ("You" Tab)
| Screen Name | Reverse-Engineered Manifest Activity / Class | Purpose & Observable UI Elements |
|---|---|---|
| **Athlete Profile Modular** | `com.strava.profile.view.ProfileModularActivity` | Athlete avatar, bio, follower/following count, weekly distance progress bar against target, and recent activity log. |
| **Public Athlete Profile** | `com.strava.profile.view.SingleAthleteFeedActivity` | View other athletes' public profiles with Follow/Unfollow action, shared activities, and bio. |
| **Athlete Connections** | `com.strava.profile.view.AthleteConnectionsActivity` | Tabbed view of Followers and Following athletes with search and removal options. |
| **Training Log** | `com.strava.traininglog.ui.TrainingLogActivity` | Year-round heat calendar displaying daily workout volume, color-coded by sport type. |
| **Athlete Gear Tracker** | `com.strava.gear.ui.GearListActivity` | List of running shoes and bicycles tracking cumulative mileage, default gear flags, and retire options. |
| **Add / Edit Gear** | `com.strava.gear.add.AddGearActivity` / `EditShoesActivity` | Form to register shoe brand, model, nickname, and maximum mileage alert threshold (e.g. 800 km). |

---

### 2.8 Settings, Privacy & Subscriptions
| Screen Name | Reverse-Engineered Manifest Activity / Class | Purpose & Observable UI Elements |
|---|---|---|
| **Settings Hub** | `com.strava.settings.view.SettingsActivity` | Parent preferences screen: Profile, Privacy Controls, Units & Display, Notifications, Connected Apps, Log Out. |
| **Privacy Center** | `com.strava.settings.view.PrivacyCenterActivity` | Master privacy baseline (Profile: Everyone / Followers / Only You; Activities: Everyone / Followers / Only You). |
| **Privacy Zones** | `com.strava.settings.view.privacyzones.PrivacyZonesActivity` | Geofence list defining address radius zones (200m–1000m) to conceal athlete start/finish locations. |
| **Display & Units** | `com.strava.settings.view.DisplayPreferenceActivity` | Unit preference selector: Metric (kilometers, meters, km/h) vs. Imperial (miles, feet, mph). |
| **Subscription Overview** | `com.strava.subscriptionsoverview.SubscriptionOverviewActivity` | Comprehensive breakdown of Strava Subscription features (Athlete Intelligence, 3D Flyover, Beacon, Live Segments, Heatmaps). |
