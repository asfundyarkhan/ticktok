#!/usr/bin/env node
/**
 * Debug script to find the source of NaN values in commission data
 */

console.log(`
🔍 COMMISSION NaN DEBUG SCRIPT

This script will help identify why totalFromReceiptApprovals is showing NaN
in the superadmin transaction dashboard.

🎯 MANUAL DEBUGGING CHECKLIST:

Step 1: Check Firebase Collections
👉 Open Firebase Console → Firestore Database
👉 Look for these collections:
   - commission_balances
   - commission_transactions

Step 2: Verify Collection Data
👉 commission_balances collection should have documents with:
   - adminId (string)
   - totalCommissionBalance (number)
   - createdAt (timestamp)
   - lastUpdated (timestamp)

👉 commission_transactions collection should have documents with:
   - adminId (string)
   - type ("superadmin_deposit" OR "receipt_approval")
   - commissionAmount (number)
   - createdAt (timestamp)

Step 3: Check Data Types
👉 Ensure commissionAmount fields are actual numbers, not strings
👉 Look for any null, undefined, or invalid values
👉 Check if any commissionAmount values are missing

Step 4: Test the Service Method
👉 Open browser dev tools on superadmin transaction page
👉 Run: CommissionService.getTotalCommissionBalance()
👉 Check the returned object for NaN values

Step 5: Common Issues to Look For:
❌ Empty collections (no commission data exists)
❌ String values instead of numbers in commissionAmount
❌ Missing commissionAmount fields
❌ Corrupted data from previous transactions
❌ Type conversion errors in calculations

🔧 BROWSER CONSOLE TEST:

Copy and paste this in browser dev tools on the transaction page:

\`\`\`javascript
// Test the commission service directly
CommissionService.getTotalCommissionBalance().then(result => {
  console.log('Commission Balance Result:', result);
  console.log('totalFromReceiptApprovals type:', typeof result.totalFromReceiptApprovals);
  console.log('is NaN?', isNaN(result.totalFromReceiptApprovals));
  console.log('Raw value:', result.totalFromReceiptApprovals);
}).catch(error => {
  console.error('Error:', error);
});
\`\`\`

💡 LIKELY CAUSES:

1. **No Commission Data**: If collections are empty, totals should be 0, not NaN
2. **Invalid Data Types**: commissionAmount stored as string instead of number
3. **Calculation Error**: Addition of undefined/null values in service method
4. **Firebase Read Error**: Service method throwing error and returning default values

🎯 NEXT STEPS:

1. Run the browser console test above
2. Check Firebase Firestore collections manually
3. Look for any console errors in browser dev tools
4. Verify that receipt approval and deposit flows are actually creating commission records

If collections are empty, the issue is that no commission data is being generated.
If data exists but values are wrong, there's a data type or calculation issue.
`);
