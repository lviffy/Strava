# Strava Button-by-Button Interaction Inventory

**Application:** Strava Android App (Reference: `v486.11`, Build: `12400195`)  
**Investigation Standard:** Comprehensive APK reverse-engineering (AXML resources, DEX bytecode, menus, and layouts).  
**Implementation Classification:**
- `COMPLETE`: Implemented, tested, and functionally verified in the project.
- `PARTIAL`: UI exists or partially wired; requires full backend or complete modal workflow.
- `MISSING`: Discovered in APK but not yet created in the project.
- `BLOCKED`: Blocked by Expo Go runtime environment (e.g. background foreground services).
- `NOT OBSERVABLE`: Server-exclusive dynamic action not revealed by client bytecode.

---

## 1. Global Bottom Navigation & Header Controls

| Screen | Control | Label | Action | Navigation | State | Data | API | Feedback | Edge Cases | Reference (APK Evidence) | Implementation |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Global Scaffold** | Tab Bar Item | `Home` (Icon: Home) | Switches active tab to Home Social Feed | `/(tabs)/index` | `activeTab = 'index'` | Feed cache | `GET /api/activities/feed` | Tab icon highlight | None | `BottomNavigationActivity`, `bottom_navigation_menu_new_nav.xml` | **COMPLETE** |
| **Global Scaffold** | Tab Bar Item | `Maps` (Icon: Map) | Switches active tab to Route Explorer | `/(tabs)/maps` | `activeTab = 'maps'` | Route list | `GET /api/routes` | Tab icon highlight | Offline fallback | `BottomNavigationActivity` | **COMPLETE** |
| **Global Scaffold** | Tab Bar Item | `Record` (Icon: Radio Button) | Switches active tab to Live Workout HUD | `/(tabs)/record` | `activeTab = 'record'` | GPS lock | None (Local engine) | Accent color pulse | GPS permission denial | `RecordingScreenActivity` | **COMPLETE** |
| **Global Scaffold** | Tab Bar Item | `Groups` (Icon: People) | Switches active tab to Clubs & Challenges | `/(tabs)/groups` | `activeTab = 'groups'` | Clubs/challenges | `GET /api/clubs`, `GET /api/challenges` | Tab icon highlight | Empty state | `BottomNavigationActivity` | **COMPLETE** |
| **Global Scaffold** | Tab Bar Item | `You` (Icon: Person) | Switches active tab to Athlete Profile | `/(tabs)/you` | `activeTab = 'you'` | User totals | `GET /api/users/profile` | Tab icon highlight | None | `ProfileModularActivity` | **COMPLETE** |
| **Home Header** | Text Button / Badge | `Upgrade` (Flame Icon) | Opens Subscription & Entitlements screen | `/subscription` | Opens modal | Entitlements | `GET /api/subscriptions/status` | Haptic feedback | Offline purchase | `SubscriptionOverviewActivity`, `menu/main_menu.xml` | **PARTIAL** |
| **Home Header** | Icon Button | `Add` (Plus Icon) | Opens quick-record or manual workout entry | `/(tabs)/record` | None | None | None | Haptic Light | None | `actions_add` in `feed_menu_additions.xml` | **COMPLETE** |
| **Home Header** | Icon Button | `Search` (Magnifying Glass) | Opens Athlete & Club search modal | `/search` | Opens modal | Search history | `GET /api/users/search` | Instant keyboard focus | No matches query | `AthleteSearchActivity`, `menu_search.xml` | **PARTIAL** |
| **Home Header** | Icon Button | `Messages` (Chat Bubble) | Opens direct chat conversations | Modal alert | Opens modal | Chat threads | `GET /api/chats` | Badge count decrement | Offline read-only | `ChatListActivity`, `chat_list_menu.xml` | **PARTIAL** |
| **Home Header** | Icon Button | `Notifications` (Bell Icon) | Opens Notifications hub with badge count | `/notifications` | Clears unread badge | Notifications list | `GET /api/notifications` | Badge clear, haptic | Network error retry | `NotificationListActivity`, `stream_design_ic_notification` | **PARTIAL** |

---

## 2. Home Feed & Social Interactions

| Screen | Control | Label | Action | Navigation | State | Data | API | Feedback | Edge Cases | Reference (APK Evidence) | Implementation |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Home Feed** | Pull-to-Refresh | Swipe down gesture | Refreshes activity stream and uploads pending items | Current screen | `isRefreshing = true` | Feed items, sync queue | `POST /api/activities/sync`, `GET /api/activities/feed` | Native spinner, haptic | Network offline | `SwipeRefreshLayout` in `res/layout/feed_fragment.xml` | **COMPLETE** |
| **Activity Card** | Icon Button | `Kudos` (Thumbs Up) | Toggles kudos like on activity with double-tap support | None | `hasKudoed = !hasKudoed`, `kudosCount ± 1` | Kudos record | `POST /api/activities/:id/kudos` | Optimistic update, Light haptic | Rapid double-click idempotency | `actions_double_kudos_highlighted` | **COMPLETE** |
| **Activity Card** | Icon Button | `Comment` (Speech Bubble) | Opens bottom sheet comment drawer | Comments Modal | `activeCommentActivity = act` | Comment list | `GET /api/activities/:id/comments` | Sheet slide-up | Keyboard overlap | `ActivityCommentsActivity`, `res/menu/report_comment_menu.xml` | **COMPLETE** |
| **Activity Card** | Card Tap | Entire Card Body | Opens comprehensive activity detail view | `/activity/[id]` | Opens detail | Full activity payload | `GET /api/activities/:id` | Screen transition | Activity not found | `ActivityDetailModularActivity` | **COMPLETE** |
| **Activity Card** | Avatar / Name Tap | Athlete Avatar | Navigates to that athlete's public profile | `/profile/[id]` | Opens athlete profile | Athlete profile | `GET /api/users/:id` | Screen transition | Blocked athlete | `SingleAthleteFeedActivity` | **PARTIAL** |
| **Comments Modal** | Text Field | `Add a comment...` | Accepts user comment text input | None | `newCommentText` | Text string | None (Draft state) | Keyboard focus | Character limit | `ActivityCommentsActivity` | **COMPLETE** |
| **Comments Modal** | Button | `Post` | Submits new comment to server | None | Appends comment | New comment record | `POST /api/activities/:id/comments` | Spinner, haptic success | Empty content | `res/layout/comment_item.xml` | **COMPLETE** |
| **Comments Modal** | Close Button | `Close` / Backdrop | Dismisses comments bottom sheet | None | Clears active comment | None | None | Dismiss animation | Unsaved draft alert | `CommentModal.tsx` | **COMPLETE** |

---

## 3. Live Workout Recording Engine (`Record` Tab)

| Screen | Control | Label | Action | Navigation | State | Data | API | Feedback | Edge Cases | Reference (APK Evidence) | Implementation |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Recording HUD** | Floating Action Button | `Start` | Begins active GPS collection & starts timer | None | `status = 'RECORDING'` | GPS location stream | None (Local engine) | Medium haptic, voice cue "Activity Started" | GPS permission denied, weak accuracy | `RecordingScreenActivity`, `StravaActivityService` | **COMPLETE** |
| **Recording HUD** | Floating Action Button | `Pause` | Halts moving timer while retaining GPS fix | None | `status = 'PAUSED'` | Monotonic timestamp | None | Medium haptic, voice cue "Activity Paused" | Accidental tap (large touch target) | `RecordingScreenActivity`, `PauseType.MANUAL_PAUSE` | **COMPLETE** |
| **Recording HUD** | Floating Action Button | `Resume` | Resumes active recording from paused state | None | `status = 'RECORDING'` | Monotonic timestamp | None | Light haptic, voice cue "Activity Resumed" | Stationary GPS drift | `PauseType.MANUAL_RESUME` | **COMPLETE** |
| **Recording HUD** | Button | `Finish` | Finalizes workout and opens save screen | `/activity/save` | `status = 'SAVED'` | Summary metrics | None | Heavy haptic | Accidental finish confirmation | `SaveActivity` | **COMPLETE** |
| **Recording HUD** | Segmented / Pills | Sport Selector (`Run`, `Ride`, `Walk`, `Hike`) | Changes sport type category | None | `sportType = selected` | Sport string | None | Selection pill highlight | Cannot change mid-workout | `RecordingScreenActivity` | **COMPLETE** |
| **Recording HUD** | Icon Button | `Audio Cues` (Speaker) | Toggles voice audio announcements | None | `audioCuesEnabled = !enabled` | Audio configuration | None | Toast / Icon state toggle | Text-to-speech engine failure | `AudioCuesSettingsActivity` | **COMPLETE** |
| **Recording HUD** | Icon Button | `Beacon Safety` (Shield / Radio) | Opens Beacon live tracking configuration | Beacon Modal | Opens modal | Emergency contacts | None | Modal slide-up | No cellular data | `LiveTrackingPreferencesActivity` | **COMPLETE** |
| **Recording HUD** | Map Control | `Center on Location` (Crosshair) | Animates camera to current GPS waypoint | None | Map camera region | Current lat/long | None | Smooth camera pan | No GPS fix acquired | `Mapbox Maps Camera Controller` | **COMPLETE** |
| **Recording HUD** | Auto-Pause Trigger | Speed $<0.8\text{ m/s}$ for $>4\text{s}$ | Automatic pause at stoplights | None | `status = 'AUTOPAUSED'` | Speed stream | None | Audio cue "Auto-paused" | Tunnel signal loss | `PauseType.AUTO_PAUSE` | **COMPLETE** |
| **Recording HUD** | Auto-Resume Trigger | Speed $>1.2\text{ m/s}$ and distance $>3\text{m}$ | Automatic resume when athlete resumes motion | None | `status = 'RECORDING'` | Speed/displacement | None | Audio cue "Auto-resumed" | False trigger from GPS jitter | `PauseType.AUTO_RESUME` | **COMPLETE** |

---

## 4. Post-Workout Save & Review (`Save` Screen)

| Screen | Control | Label | Action | Navigation | State | Data | API | Feedback | Edge Cases | Reference (APK Evidence) | Implementation |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Save Workout** | Text Field | `Activity Title` | Edits workout name (default "Morning Run") | None | `name = input` | String | None | Text cursor | Empty title validation | `SaveActivity`, `res/menu/activity_save_menu.xml` | **COMPLETE** |
| **Save Workout** | Dropdown / Picker | `Sport Type` | Selects primary sport classification | None | `sportType = val` | String | None | Selection list | Incompatible gear | `SaveActivity` | **COMPLETE** |
| **Save Workout** | Dropdown / Picker | `Select Gear` | Assigns shoes or bicycle for mileage tracking | None | `gearId = selected` | Gear items list | None | Selected gear preview | No gear registered | `AddGearActivity`, `GearDao` | **COMPLETE** |
| **Save Workout** | Segmented Control | `Visibility` (`Everyone`, `Followers`, `Only You`) | Sets activity privacy baseline | None | `visibility = val` | Visibility enum | None | Segment selection | Org privacy override | `PrivacySettingActivitiesActivity` | **COMPLETE** |
| **Save Workout** | Button | `Save Activity` | Persists session in SQLite and triggers cloud sync | `/(tabs)/index` | `syncStatus = 'PENDING'` | SQLite activity row | `POST /api/activities/sync` | Haptic success, loading indicator | Network failure $\to$ Stored locally | `SaveActivity`, `SyncManager` | **COMPLETE** |
| **Save Workout** | Button | `Discard Activity` | Deletes uncommitted GPS points and discards workout | `/(tabs)/index` | Clears store | SQLite activity row | None | Confirmation dialog | Accidental deletion warning | `SaveActivity` | **COMPLETE** |

---

## 5. Activity Detail Breakdown & Analytics (`/activity/[id]`)

| Screen | Control | Label | Action | Navigation | State | Data | API | Feedback | Edge Cases | Reference (APK Evidence) | Implementation |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Activity Detail** | Back Button | `<` (Arrow Left) | Returns to previous feed or profile | Back stack | None | None | None | Instant pop | None | `ScreenHeader` | **COMPLETE** |
| **Activity Detail** | Menu Button | `Options` (3 Dots) | Opens activity options menu (Crop, GPX, Delete) | Action Sheet | Opens sheet | Activity ID | None | Menu slide-up | Permission check | `activity_bottom_nav_toolbar_universal_menu.xml` | **COMPLETE** |
| **Activity Detail** | Button / Badge | `3D Flyover` (Cube Icon) | Launches animated 3D flyover modal | Flyover Modal | `showFlyover = true` | Polyline coordinates | None | Modal open, animation start | High-density polyline lag | `FlyoverActivity`, `flyover_recenter_v2` | **COMPLETE** |
| **Activity Detail** | Button / Menu Item | `Crop Activity` | Opens start/end slider coordinate trimmer | Crop Modal | `showCropModal = true` | Waypoints array | None | Slider handles | Start index $\ge$ end index | `ActivityCropActivity`, `activity_crop_menu.xml` | **COMPLETE** |
| **Activity Detail** | Button / Menu Item | `Export GPX` | Generates standard GPX XML and copies to clipboard | GPX Modal | `showGpxModal = true` | Waypoints & elevation | None | Copy notification, checkmark | Empty track | `ExportFileActivity` | **COMPLETE** |
| **Activity Detail** | Metric Pill / Segment | Splits Unit (`Kilometers` / `Miles`) | Toggles split table distance units | None | `splitUnit = 'km' \| 'mi'` | Split records | None | Table re-render | Unit conversion rounding | `PaceSplitRow.kt`, `ActivitySplits` | **COMPLETE** |
| **Activity Detail** | Chart Scrub | Interactive elevation touch scrub | Drags cursor along elevation graph | None | `scrubPoint = coord` | Elevation & distance | None | Dynamic elevation badge highlight | Rapid touch jitter | `ElevationChart.tsx` | **COMPLETE** |
| **Activity Detail** | Button | `Bookmark / Save` | Toggles bookmark for quick future reference | None | `isBookmarked = !bookmarked` | Local bookmark | None | Bookmark icon fill, haptic | Storage error | `list_bookmarks` | **COMPLETE** |

---

## 6. Maps & Route Explorer (`Maps` Tab)

| Screen | Control | Label | Action | Navigation | State | Data | API | Feedback | Edge Cases | Reference (APK Evidence) | Implementation |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Maps Explorer** | Segmented Control | Sport Filter (`All`, `Run`, `Ride`, `Hike`) | Filters visible routes by sport category | None | `filterSport = val` | Filtered route list | None | Animated list filter | Zero matching routes | `res/layout/route_filter_layout.xml` | **COMPLETE** |
| **Maps Explorer** | Map Route Polyline | Tap on route line on map | Selects route and focuses map camera | None | `selectedRoute = route` | Route coordinates | None | Polyline stroke widens, card pops | Overlapping routes | `RoutesDao`, `libmapbox-maps.so` | **COMPLETE** |
| **Maps Explorer** | Route Card | Tap card in bottom carousel | Highlights route on map | None | `selectedRoute = route` | Route metadata | None | Card elevation highlight | None | `RouteItem` | **COMPLETE** |
| **Maps Explorer** | Button | `Use Route` | Loads route polyline into workout recording screen | `/(tabs)/record` | `selectedRoute = route` | Waypoint array | None | Navigation transition, haptic | Workout already in progress | `RoutesDatabase`, `RouteStatus` | **COMPLETE** |
| **Maps Explorer** | Button | `Draw / Create Route` | Opens custom route drawing tool | Modal | Opens drawing mode | Waypoints | `POST /api/routes` | Interactive pin drop | Irregular polyline geometry | `RouteBuilderFtuxActivity` | **PARTIAL** |

---

## 7. Groups, Clubs & Challenges (`Groups` Tab)

| Screen | Control | Label | Action | Navigation | State | Data | API | Feedback | Edge Cases | Reference (APK Evidence) | Implementation |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Groups Hub** | Segmented Control | `Challenges` / `Clubs` | Toggles between active challenges and clubs | None | `activeTab = val` | Segment state | None | Smooth tab switch | None | `BottomNavigationActivity` | **COMPLETE** |
| **Challenges Tab** | Button | `Join Challenge` / `Joined` | Enrolls athlete in monthly milestone challenge | None | `joined = !joined` | Challenge record | `POST /api/challenges/:id/join` | Haptic, checkmark badge | Challenge expired | `ChallengeDatabase`, `ChallengeTermsActivity` | **COMPLETE** |
| **Challenges Tab** | Card Tap | Challenge Card Body | Opens detailed challenge rules & leaderboard | `/challenges/[id]` | Opens detail | Full challenge rules | `GET /api/challenges/:id` | Screen transition | Inactive challenge | `ChallengeDetailActivity` | **PARTIAL** |
| **Clubs Tab** | Button | `Join Club` / `Member` | Toggles athletic club membership | None | `isMember = !isMember` | Club record | `POST /api/clubs/:id/join` | Member count increment | Invite-only approval required | `ClubDao`, `CreateClubActivity` | **COMPLETE** |
| **Clubs Tab** | Card Tap | Club Card Body | Opens club announcement feed & member directory | `/clubs/[id]` | Opens club view | Club announcements | `GET /api/clubs/:id` | Screen transition | Private club | `ClubDetailModularActivity` | **PARTIAL** |

---

## 8. Athlete Profile & Settings ("You" Tab)

| Screen | Control | Label | Action | Navigation | State | Data | API | Feedback | Edge Cases | Reference (APK Evidence) | Implementation |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **You Profile** | Button | `Sync Now` | Manually triggers immediate upload of pending activities | None | `isSyncing = true` | Unsynced activities | `POST /api/activities/sync` | Spinner, success haptic | Server unreachable | `SyncManager.ts` | **COMPLETE** |
| **You Profile** | Button | `Add Gear` | Opens modal to register running shoes or bike | Add Gear Modal | `showAddGearModal = true` | Gear list | `POST /api/gear` | Modal slide-up | Validation errors | `AddGearActivity`, `add_gear_menu.xml` | **COMPLETE** |
| **You Profile** | Button | `Beacon Contacts` | Opens emergency safety contacts modal | Beacon Modal | `showBeaconModal = true` | Beacon contacts | None | Modal slide-up | Invalid phone format | `BeaconContactSelectionActivity` | **COMPLETE** |
| **You Profile** | Button | `Privacy Zones` | Opens privacy geofencing radius configuration | Privacy Modal | `showPrivacyModal = true` | Privacy zones | None | Modal slide-up | Lat/long out of bounds | `PrivacyZonesActivity`, `add_privacy_zone_menu.xml` | **COMPLETE** |
| **You Profile** | Button | `Log Out` | Prompts confirmation and purges JWT token | `/(auth)/login` | `user = null` | Secure store JWT | `POST /api/auth/logout` | Destructive alert prompt | Pending unsynced workouts alert | `SettingsActivity` | **COMPLETE** |
| **You Profile** | Button | `Settings` (Cog Icon) | Opens settings & preferences hub | `/settings` | Opens settings | User preferences | `GET /api/users/settings` | Screen transition | None | `SettingsActivity`, `res/menu/you_tab_menu.xml` | **PARTIAL** |
