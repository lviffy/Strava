# Backend API Contract & Specification

**Base URL:** `http://localhost:4000/api`  
**Protocol:** HTTP / 1.1 JSON (REST)  
**Authentication:** Bearer JWT in `Authorization` header (`Authorization: Bearer <token>`)  

---

## 1. Authentication Endpoints (`/api/auth`)

### `POST /api/auth/register`
- **Description:** Registers a new athlete account.
- **Request Body:**
  ```json
  {
    "email": "runner@strava.local",
    "password": "Password123!",
    "firstName": "Alex",
    "lastName": "Rivera"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "user": {
      "id": "u_948f2a1b",
      "email": "runner@strava.local",
      "firstName": "Alex",
      "lastName": "Rivera"
    },
    "token": "eyJhbGciOiJIUzI1NiIsIn..."
  }
  ```

### `POST /api/auth/login`
- **Description:** Authenticates athlete credentials and issues a JWT token.
- **Request Body:** `{"email": "...", "password": "..."}`
- **Response (200 OK):** `{"user": {...}, "token": "..."}`

### `GET /api/auth/me`
- **Description:** Returns the current authenticated athlete's profile summary.
- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):** `{"user": {...}}`

---

## 2. Activity Endpoints (`/api/activities`)

### `GET /api/activities/feed`
- **Description:** Paginated activity feed merging social workouts.
- **Query Parameters:** `page=1&limit=20`
- **Response (200 OK):**
  ```json
  {
    "activities": [
      {
        "id": "act_1730456123",
        "userId": "u_1",
        "name": "Morning Trail Run",
        "sportType": "Run",
        "startTime": "2026-10-31T07:15:00Z",
        "elapsedTimeSeconds": 2400,
        "movingTimeSeconds": 2250,
        "distanceMeters": 7450.0,
        "elevationGainMeters": 145.0,
        "user": { "firstName": "Marcus", "lastName": "Vance" },
        "hasKudoed": false,
        "_count": { "kudos": 12, "comments": 3 }
      }
    ],
    "page": 1,
    "hasMore": false
  }
  ```

### `POST /api/activities/sync`
- **Description:** Idempotent endpoint syncing recorded workouts from mobile SQLite to cloud.
- **Request Body:**
  ```json
  {
    "activity": {
      "id": "client-uuid-v4-guid",
      "name": "Evening Tempo Ride",
      "sportType": "Ride",
      "startTime": 1730456123000,
      "elapsedTimeSeconds": 3600,
      "movingTimeSeconds": 3480,
      "distanceMeters": 28400.0,
      "elevationGainMeters": 380.0,
      "calories": 720
    },
    "coordinates": [
      { "sequenceIndex": 0, "latitude": 37.7749, "longitude": -122.4194, "altitude": 15.0, "speed": 6.5, "timestamp": 1730456123000 }
    ],
    "splits": [
      { "splitNumber": 1, "distanceUnit": "km", "movingTimeSeconds": 120, "elevationDeltaMeters": 10.0 }
    ]
  }
  ```
- **Response (200 OK):** `{"success": true, "activityId": "client-uuid-v4-guid"}`

### `POST /api/activities/:id/kudos`
- **Description:** Toggles kudos reaction on an activity.
- **Response (200 OK):** `{"kudoed": true, "kudosCount": 13}`

### `GET /api/activities/:id/comments`
- **Description:** Returns comment thread for an activity.
- **Response (200 OK):** `{"comments": [{"id": "...", "content": "Great run!", "user": {...}}]}`

### `POST /api/activities/:id/comments`
- **Description:** Submits a comment on an activity.
- **Request Body:** `{"content": "Strong pace on the hill climb!"}`
- **Response (201 Created):** `{"comment": {...}}`

---

## 3. Social & Notifications Endpoints

### `GET /api/notifications`
- **Description:** Retrieves user notifications list with read status.
- **Response (200 OK):**
  ```json
  {
    "notifications": [
      {
        "id": "n_1",
        "type": "kudos",
        "title": "New Kudos",
        "message": "Marcus Vance gave you kudos on Morning Trail Run",
        "entityId": "act_1",
        "isRead": false,
        "createdAt": "2026-10-31T08:30:00Z"
      }
    ]
  }
  ```

### `POST /api/notifications/mark-read`
- **Description:** Marks one or all notifications as read.
- **Request Body:** `{"notificationId": "n_1"}` or `{"all": true}`
- **Response (200 OK):** `{"success": true}`

### `GET /api/users/search`
- **Description:** Searches for athletes by name or email.
- **Query Parameters:** `q=Alex`
- **Response (200 OK):** `{"users": [...]}`

---

## 4. Community Endpoints (`/api/clubs` & `/api/challenges`)

### `GET /api/clubs`
- **Description:** Returns list of joined and discoverable athletic clubs.
- **Response (200 OK):** `{"clubs": [...]}`

### `POST /api/clubs/:id/join`
- **Description:** Toggles athlete membership in a club.
- **Response (200 OK):** `{"isMember": true, "memberCount": 1421}`

### `GET /api/challenges`
- **Description:** Returns list of active monthly challenges and enrolled status.
- **Response (200 OK):** `{"challenges": [...]}`

### `POST /api/challenges/:id/join`
- **Description:** Enrolls or un-enrolls athlete from a challenge.
- **Response (200 OK):** `{"joined": true}`

---

## 5. Subscription & Entitlements (`/api/subscriptions`)

### `GET /api/subscriptions/status`
- **Description:** Checks athlete subscription tier and feature entitlements.
- **Response (200 OK):**
  ```json
  {
    "tier": "summit",
    "isActive": true,
    "expiresAt": "2027-10-31T00:00:00Z",
    "features": {
      "athleteIntelligence": true,
      "routeFlyover": true,
      "racePredictions": true,
      "beaconSafety": true,
      "heatmaps": true
    }
  }
  ```
