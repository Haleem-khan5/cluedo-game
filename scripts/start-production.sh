#!/bin/sh
set -e

echo "> Cluebound Chronicles — production start (port ${PORT:-3001})"

if [ -n "$DATABASE_URL" ]; then
  echo "> Applying database migrations..."
  npx prisma migrate deploy
  echo "> Migrations complete"
else
  echo "> WARNING: DATABASE_URL is not set"
fi

exec npx tsx server.ts
