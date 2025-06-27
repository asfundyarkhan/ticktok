#!/bin/bash

# Firebase Localhost Setup Script
# This script helps configure Firebase for localhost development

echo "🔧 Firebase Localhost Development Setup"
echo "======================================"

echo "1️⃣ Checking Firebase CLI..."
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Install with: npm install -g firebase-tools"
    exit 1
fi

echo "✅ Firebase CLI found"

echo ""
echo "2️⃣ Checking Firebase project..."
PROJECT_ID=$(firebase projects:list --json | jq -r '.[0].projectId' 2>/dev/null)

if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "null" ]; then
    echo "❌ No Firebase project found. Please run 'firebase login' and 'firebase use' first"
    exit 1
fi

echo "✅ Using Firebase project: $PROJECT_ID"

echo ""
echo "3️⃣ Setting up localhost development configuration..."

# Create/update .env.local for development
cat > .env.local << EOF
# Firebase Development Configuration (Auto-generated)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBwqU1SU4jNWYKjhqkN1tEyyp64HXzmyG8
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ticktokshop-5f1e9.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ticktokshop-5f1e9
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ticktokshop-5f1e9.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=155434252666
NEXT_PUBLIC_FIREBASE_APP_ID=1:155434252666:web:fa5051f4cb33f3a784bec3
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-5BRMHTMXHR

# Development environment
NODE_ENV=development
NEXT_PUBLIC_DEV_MODE=true

# Localhost URLs
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
EOF

echo "✅ Created .env.local with Firebase configuration"

echo ""
echo "4️⃣ Localhost development tips:"
echo "  • Make sure localhost:3000 and localhost:3001 are added to Firebase authorized domains"
echo "  • Check Firebase Console > Authentication > Settings > Authorized domains"
echo "  • Enable anonymous authentication if needed for testing"
echo "  • Use 'npm run dev' to start development server"

echo ""
echo "5️⃣ Manual steps needed:"
echo "  1. Go to Firebase Console: https://console.firebase.google.com/project/$PROJECT_ID"
echo "  2. Navigate to Authentication > Settings > Authorized domains"
echo "  3. Add these domains if not present:"
echo "     - localhost"
echo "     - 127.0.0.1"
echo "  4. If using different ports, add:"
echo "     - localhost:3000"
echo "     - localhost:3001"

echo ""
echo "6️⃣ Test the setup:"
echo "  • Start development server: npm run dev"
echo "  • Visit: http://localhost:3000/localhost-diagnostic"
echo "  • Run diagnostics to verify Firebase connectivity"

echo ""
echo "✅ Localhost Firebase setup complete!"
echo "If you still have issues, check the diagnostic page for detailed troubleshooting."
