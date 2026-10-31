#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "=========================================="
echo "🏃 Strava Clone: Starting Full-Stack App"
echo "=========================================="

# 1. Start Docker PostGIS Database
echo "📦 Step 1: Starting PostGIS Database..."
cd server
docker compose up -d

# Wait for database to be healthy
echo "⏳ Waiting for PostGIS database to be ready..."
until docker exec strava_postgis pg_isready -U strava -d strava_db > /dev/null 2>&1; do
  sleep 1
done
echo "✅ Database is ready."

# 2. Push schema and seed data if needed
echo "🌱 Step 2: Ensuring Prisma schema & seed..."
npx prisma db push --skip-generate
npm run prisma:seed

# 3. Check if server is already running on port 4000
if ss -tulpn | grep -q ":4000 "; then
  echo "✅ Backend API server is already running on port 4000."
else
  echo "🚀 Step 3: Starting Backend Express Server in background..."
  nohup npm run dev > ../server.log 2>&1 &
  echo "Backend started with PID $! (logs: server.log)"
  sleep 2
fi

cd "$DIR"

# 4. Start Expo Frontend
echo "📱 Step 4: Starting Expo Dev Server..."
echo "Press 'w' for web, 'a' for Android emulator, or scan the QR code with Expo Go on your phone!"
npx expo start
