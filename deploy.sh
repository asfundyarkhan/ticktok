#!/usr/bin/env bash

# Deployment script for Ticktok on Vercel
# This script is meant to be run before deployment

echo "🚀 Starting pre-deployment checks for Ticktok..."

# Check for required environment variables
if [ -z "$VERCEL_URL" ]; then
  echo "❌ VERCEL_URL environment variable is not set. This might be okay for local builds."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run linting (but don't fail the build)
echo "🔍 Running lint checks..."
npm run lint || echo "⚠️ Linting issues found but continuing with build..."

# Build the project
echo "🏗️ Building the project..."
npm run build

echo "✅ Pre-deployment checks completed successfully!"
