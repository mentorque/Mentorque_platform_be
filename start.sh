#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting MentorQue Backend..."

# Generate Prisma Client if needed
if [ ! -d "node_modules/@prisma/client" ] || [ ! -f "generated/prisma/index.js" ]; then
  echo "📦 Generating Prisma Client..."
  npx prisma generate --schema=./generated/prisma/schema.prisma
fi

# Run database migrations
if [ -n "$DATABASE_URL" ]; then
  echo "🔄 Running database migrations..."
  npx prisma migrate deploy --schema=./generated/prisma/schema.prisma || true
fi

# Start the application
echo "✅ Starting server..."
node index.js

