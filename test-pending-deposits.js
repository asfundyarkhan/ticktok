// Test script to create pending deposits for testing wallet functionality
// Run this in browser console after logging in as a seller

async function createTestPendingDeposit() {
  try {
    // Import the necessary Firebase functions
    const { firestore } = await import('./src/lib/firebase/firebase.js');
    const { collection, addDoc, Timestamp } = await import('firebase/firestore');
    
    const userId = 'REPLACE_WITH_ACTUAL_USER_ID'; // Replace with the actual seller ID
    
    const testDeposit = {
      sellerId: userId,
      productId: 'test-product-123',
      productName: 'Test Product for Wallet',
      listingId: 'test-listing-123',
      quantityListed: 5,
      originalCostPerUnit: 10.00,
      totalDepositRequired: 50.00,
      listingPrice: 15.00,
      profitPerUnit: 5.00,
      status: 'sold',
      salePrice: 75.00,
      saleDate: new Date(),
      pendingProfitAmount: 25.00, // $5 profit per unit * 5 units
      actualQuantitySold: 5,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const docRef = await addDoc(collection(firestore, 'pending_deposits'), testDeposit);
    console.log('✅ Test pending deposit created:', docRef.id);
    console.log('📋 Test data:', testDeposit);
    
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating test deposit:', error);
  }
}

// Instructions:
console.log('🧪 To create test data:');
console.log('1. Replace REPLACE_WITH_ACTUAL_USER_ID with your actual user ID');
console.log('2. Run: createTestPendingDeposit()');
console.log('3. Check your wallet dashboard at /profile');
