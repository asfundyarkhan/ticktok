#!/bin/bash

# Vercel deployment preparation script for TikTok Shop
# This script prepares the environment for Firebase connection in production

# Echo environment status
echo "⚙️ Preparing build for Vercel deployment..."

# Create production environment variable file if it doesn't exist
if [ ! -f .env.production ]; then
  echo "📝 Creating .env.production file..."
  cat > .env.production << EOL
# Production Firebase Configuration
# These values are embedded in the client-side code and are safe to be public

NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBwqU1SU4jNWYKjhqkN1tEyyp64HXzmyG8
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ticktokshop-5f1e9.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ticktokshop-5f1e9
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ticktokshop-5f1e9.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=155434252666
NEXT_PUBLIC_FIREBASE_APP_ID=1:155434252666:web:fa5051f4cb33f3a784bec3
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-5BRMHTMXHR

# Add your production domain here
NEXT_PUBLIC_APP_URL=https://yourproductiondomain.com
NEXT_PUBLIC_APP_ENV=production
EOL
  echo "✅ Created .env.production file"
else
  echo "✅ .env.production already exists"
fi

# Check for secrets in Vercel environment
echo "🔍 Checking Vercel environment variables..."
if [ -z "$NEXT_PUBLIC_FIREBASE_API_KEY" ]; then
  echo "⚠️ Warning: NEXT_PUBLIC_FIREBASE_API_KEY not found in Vercel environment"
  echo "📝 Make sure to add Firebase environment variables to your Vercel project"
else
  echo "✅ Firebase environment variables found"
fi

# Show deployment info
echo "🚀 Ready for deployment!"
echo "🔗 Firebase Configuration:"
echo "   - Project: ticktokshop-5f1e9"
echo "   - Auth Domain: ticktokshop-5f1e9.firebaseapp.com"
echo "   - Storage: ticktokshop-5f1e9.appspot.com"

exit 0
