# Firebase Credentials Setup

This directory should contain your Firebase service account credentials.

## Required Files

1. `service-account.json` - Firebase service account key for admin SDK access

## How to obtain credentials

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project
3. Go to Project Settings > Service Accounts
4. Click "Generate New Private Key"
5. Rename the downloaded file to `service-account.json`
6. Place it in this directory

## IMPORTANT: Security Notes

- NEVER commit these files to version control
- These files should be included in your .gitignore
- For production, use environment secrets or secure vaults to store these values
- Only share these credentials with authorized team members
