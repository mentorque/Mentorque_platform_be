#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting MentorQue Backend..."

# Always generate Prisma Client to ensure correct binary targets for deployment
echo "📦 Generating Prisma Client with correct binary targets..."
npx prisma generate --schema=./generated/prisma/schema.prisma

# Run database migrations
if [ -n "$DATABASE_URL" ]; then
  echo "🔄 Running database migrations..."
  npx prisma migrate deploy --schema=./generated/prisma/schema.prisma || true
fi

# Start the application
echo "✅ Starting server..."
node index.js

