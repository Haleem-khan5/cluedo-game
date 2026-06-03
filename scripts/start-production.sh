#!/bin/sh
set -e

echo "> Mystery Mansion — production start (port ${PORT:-3001})"

if [ -n "$DATABASE_URL" ]; then
  echo "> Applying database migrations..."
  npx prisma migrate deploy
  echo "> Migrations complete"
else
  echo "> WARNING: DATABASE_URL is not set"
fi

exec tsx server.ts
