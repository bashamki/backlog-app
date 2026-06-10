#!/bin/sh
set -e
echo "Waiting for database & syncing schema..."
until npx prisma db push --skip-generate --accept-data-loss; do
  echo "DB not ready, retrying in 3s..."
  sleep 3
done
echo "Seeding..."
node dist/seed.js || echo "seed skipped"
echo "Starting API..."
node dist/index.js
