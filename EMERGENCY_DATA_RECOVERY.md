# EMERGENCY DATA RECOVERY GUIDE

## What Happened
It appears the deployment of receipt fixes may have caused unintended data loss or field removal in your Firestore database. 

## Step-by-Step Recovery Process

### 1. Create Service Account Key
If you don't already have a serviceAccountKey.json file:
1. Go to Firebase Console -> Project Settings -> Service Accounts
2. Click "Generate new private key" 
3. Save the file as `serviceAccountKey.json` in your project root

### 2. Revert Firestore Indexes to Safe Version
1. Replace the content of your `firestore.indexes.json` with the content from `firestore.indexes.safe.json`:
   ```
   copy firestore.indexes.safe.json firestore.indexes.json
   ```

2. Deploy the safe indexes:
   ```
   firebase deploy --only firestore:indexes
   ```

### 3. Run the Diagnostic Tool
The diagnostic tool will check the state of your data without making changes:
```
node emergency-data-recovery.js
```

### 4. Perform Data Recovery
If the diagnostic shows missing fields, run the recovery:
```
node emergency-data-recovery.js --restore
```

### 5. Contact Firebase Support for Full Recovery
If your data was completely deleted (not just missing fields), contact Firebase Support as they may be able to restore from backups:
1. Go to https://firebase.google.com/support
2. Select "Firebase" as product
3. Choose "Data Loss" as issue type
4. Provide details about what happened and when

## Prevention Tips

1. Always back up critical data before deployments:
   ```
   firebase firestore:export gs://your-backup-bucket/backups/$(date +%Y%m%d)
   ```

2. Test index changes in a staging environment first

3. Create a rollback plan before making significant database changes

## Important Firestore Collections
- receipts_v2: Contains all transaction receipts
- users: Contains user data
- pending_deposits: Contains pending deposit information
- orders: Contains order history

## Contact Information
- Firebase Support: https://firebase.google.com/support
- Google Cloud Platform support: https://cloud.google.com/support-hub
