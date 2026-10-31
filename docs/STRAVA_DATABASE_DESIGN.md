# Strava Database & API Architecture Specification

## 1. Overview & Data Partitioning Strategy

An offline-first fitness application requires clear boundaries between **Mobile Local Storage** (optimized for write speed, crash durability, and zero-latency GPS buffering) and **Cloud Backend Storage** (optimized for relational social queries, leaderboard aggregation, and spatial indexing).

```mermaid
graph LR
    subgraph Mobile Device (expo-sqlite)
        RawPoints["activity_coordinates\n(1Hz GPS buffer)"]
        LocalAct["activities\n(sync_status=PENDING)"]
        Splits["activity_splits\n(Km/Mi stats)"]
        SyncQueue["sync_queue\n(Retry daemon)"]
    end

    subgraph Cloud Backend (PostgreSQL + PostGIS)
        Users["users"]
        CloudAct["activities\n(geography LINESTRING)"]
        Social["kudos, comments, follows"]
        Segments["segments & segment_efforts"]
    end

    RawPoints --> LocalAct
    Splits --> LocalAct
    LocalAct --> SyncQueue
    SyncQueue -- Idempotent POST (UUID) --> CloudAct
    CloudAct --> Segments
    CloudAct --> Social
```

---

## 2. Mobile Local Database (`expo-sqlite`)

Using `expo-sqlite`, SQLite database operations run in WAL (Write-Ahead Logging) mode to allow concurrent background writes without locking UI reads.

### 2.1 Table: `activities`
Stores active, paused, unsynced, and cached completed activities.

```sql
CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,                       -- UUIDv4 client-generated GUID
    athlete_id TEXT NOT NULL,                  -- Current authenticated user ID
    name TEXT NOT NULL,                        -- e.g. "Morning Run"
    sport_type TEXT NOT NULL,                  -- 'Run', 'Ride', 'Walk', 'Hike'
    start_timestamp INTEGER NOT NULL,          -- Monotonic epoch millis
    end_timestamp INTEGER,                     -- Monotonic epoch millis
    elapsed_time_seconds INTEGER NOT NULL,     -- Total wall clock duration
    moving_time_seconds INTEGER NOT NULL,      -- Active moving duration
    distance_meters REAL NOT NULL DEFAULT 0.0, -- Cumulative Haversine meters
    elevation_gain_meters REAL DEFAULT 0.0,    -- Filtered cumulative ascent
    calories INTEGER DEFAULT 0,
    average_speed_mps REAL DEFAULT 0.0,        -- distance / moving_time
    max_speed_mps REAL DEFAULT 0.0,
    start_battery_level REAL,                  -- e.g. 0.85 (85%)
    end_battery_level REAL,                    -- e.g. 0.72 (72%)
    sync_status TEXT NOT NULL DEFAULT 'UNFINISHED', -- 'UNFINISHED', 'PENDING', 'SYNCED', 'FAILED'
    created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activities_sync ON activities (sync_status);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities (start_timestamp DESC);
```

### 2.2 Table: `activity_coordinates`
Buffered $1\text{Hz}$ GPS stream. Committed instantly per sample.

```sql
CREATE TABLE IF NOT EXISTS activity_coordinates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    activity_id TEXT NOT NULL,                 -- Foreign Key -> activities(id)
    sequence_index INTEGER NOT NULL,           -- Sequential order index (0, 1, 2...)
    latitude REAL NOT NULL,                    -- WGS84 decimal degrees
    longitude REAL NOT NULL,                   -- WGS84 decimal degrees
    altitude REAL,                             -- Elevation in meters
    horizontal_accuracy REAL,                  -- Accuracy radius in meters
    speed REAL,                                -- Speed in m/s
    bearing REAL,                              -- Heading 0-360 degrees
    timestamp INTEGER NOT NULL,                -- Monotonic epoch millis
    is_paused INTEGER NOT NULL DEFAULT 0,      -- 1 if captured during pause/gap
    FOREIGN KEY (activity_id) REFERENCES activities (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_coords_act_seq ON activity_coordinates (activity_id, sequence_index ASC);
```

### 2.3 Table: `activity_splits`
Stores metric (1 km) and imperial (1 mi) split benchmarks.

```sql
CREATE TABLE IF NOT EXISTS activity_splits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    activity_id TEXT NOT NULL,
    split_number INTEGER NOT NULL,             -- Split index (1, 2, 3...)
    distance_unit TEXT NOT NULL,               -- 'KM' or 'MILE'
    elapsed_time_seconds INTEGER NOT NULL,     -- Duration for this split
    moving_time_seconds INTEGER NOT NULL,      -- Moving duration for this split
    elevation_delta_meters REAL DEFAULT 0.0,   -- Climb or descent on this split
    average_pace_sec_per_unit REAL NOT NULL,   -- Seconds per km or mile
    FOREIGN KEY (activity_id) REFERENCES activities (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_splits_act ON activity_splits (activity_id, distance_unit);
```

---

## 3. Cloud Backend Database (PostgreSQL with PostGIS)

### 3.1 Relational Schema

```sql
-- Athletes / Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    profile_picture_url TEXT,
    bio TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activities Table (PostGIS Enabled)
CREATE TABLE activities (
    id UUID PRIMARY KEY,                       -- Uses the mobile client-generated GUID
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    sport_type VARCHAR(50) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    elapsed_time_seconds INTEGER NOT NULL,
    moving_time_seconds INTEGER NOT NULL,
    distance_meters DOUBLE PRECISION NOT NULL,
    elevation_gain_meters DOUBLE PRECISION DEFAULT 0.0,
    average_speed_mps DOUBLE PRECISION,
    max_speed_mps DOUBLE PRECISION,
    calories INTEGER,
    polyline_encoded TEXT,                     -- Google Polyline Algorithm encoded string
    route_geometry GEOGRAPHY(LineString, 4321),-- PostGIS Spatial LineString
    privacy_level VARCHAR(20) DEFAULT 'everyone', -- 'everyone', 'followers', 'only_me'
    kudos_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activities_user ON activities (user_id, start_time DESC);
CREATE INDEX idx_activities_geometry ON activities USING GIST (route_geometry);

-- Social: Kudos Table (with Unique constraint to prevent duplicate likes)
CREATE TABLE kudos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(activity_id, user_id)
);

-- Social: Comments Table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social: Follows Table
CREATE TABLE follows (
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'accepted',     -- 'accepted', 'pending'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

-- Segments Table (PostGIS Spatial Polygon/Line)
CREATE TABLE segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    sport_type VARCHAR(50) NOT NULL,
    distance_meters DOUBLE PRECISION NOT NULL,
    average_grade REAL,
    elevation_high REAL,
    elevation_low REAL,
    polyline_encoded TEXT NOT NULL,
    path_geometry GEOGRAPHY(LineString, 4321) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_segments_geometry ON segments USING GIST (path_geometry);
```

---

## 4. API Endpoints & Synchronization Contracts

### 4.1 REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Register new athlete. Returns JWT pair. |
| `POST` | `/api/v1/auth/login` | Authenticate email/password. Returns JWT pair. |
| `POST` | `/api/v1/auth/refresh` | Exchange refresh token for fresh access token. |
| `GET` | `/api/v1/feed` | Paginated social feed (query params: `limit`, `cursor`). |
| `POST` | `/api/v1/activities` | **Idempotent activity upload** (Payload detailed below). |
| `GET` | `/api/v1/activities/:id` | Full activity details, telemetry streams, and splits. |
| `POST` | `/api/v1/activities/:id/kudos` | Toggle kudos on an activity (Idempotent). |
| `POST` | `/api/v1/activities/:id/comments` | Add comment to an activity. |
| `GET` | `/api/v1/athletes/:id` | Athlete public profile and cumulative stats. |

### 4.2 Idempotent Activity Upload Contract

`POST /api/v1/activities`

```json
{
  "id": "c9bf9e57-1685-4c89-b845-983226a27fa9",
  "name": "Morning Tempo Run",
  "sport_type": "Run",
  "start_time": "2026-10-31T06:15:00Z",
  "elapsed_time_seconds": 1820,
  "moving_time_seconds": 1785,
  "distance_meters": 6245.8,
  "elevation_gain_meters": 48.2,
  "calories": 420,
  "start_battery_level": 0.88,
  "end_battery_level": 0.82,
  "coordinates": [
    {
      "seq": 0,
      "lat": 37.774929,
      "lng": -122.419416,
      "alt": 18.2,
      "acc": 4.5,
      "speed": 3.4,
      "time": 1793427300000
    }
  ],
  "splits": [
    {
      "split_num": 1,
      "unit": "KM",
      "moving_time": 285,
      "elevation_delta": 8.1
    }
  ]
}
```

#### Upload Response (`HTTP 201 Created` or `HTTP 200 OK` for duplicate):
```json
{
  "status": "success",
  "activity_id": "c9bf9e57-1685-4c89-b845-983226a27fa9",
  "sync_status": "SYNCED",
  "polyline_encoded": "k|peFv_kbV...",
  "matched_segments_count": 2
}
```
If the mobile client re-transmits the same `id` due to a network drop, the backend detects the duplicate primary key and returns `HTTP 200 OK` without creating duplicate activities.
