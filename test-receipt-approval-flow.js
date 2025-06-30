// Test the complete receipt approval and wallet update flow
// Run this in browser console as a superadmin

async function testReceiptApprovalFlow() {
  console.log('🧪 Testing Receipt Approval Flow...');
  
  try {
    // Step 1: Check current pending deposits
    const { firestore } = await import('./src/lib/firebase/firebase.js');
    const { collection, getDocs, query, where } = await import('firebase/firestore');
    
    console.log('📋 Step 1: Checking pending deposits...');
    const pendingDepositsQuery = query(
      collection(firestore, 'pending_deposits'),
      where('status', '==', 'sold')
    );
    const pendingSnapshot = await getDocs(pendingDepositsQuery);
    console.log(`Found ${pendingSnapshot.size} pending deposits with sold status`);
    
    // Step 2: Check receipts waiting for approval
    console.log('📋 Step 2: Checking pending receipts...');
    const receiptsQuery = query(
      collection(firestore, 'receipts_v2'),
      where('status', '==', 'pending')
    );
    const receiptsSnapshot = await getDocs(receiptsQuery);
    console.log(`Found ${receiptsSnapshot.size} pending receipts`);
    
    receiptsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`📄 Receipt ${doc.id}:`, {
        amount: data.amount,
        isDepositPayment: data.isDepositPayment,
        pendingDepositId: data.pendingDepositId,
        userId: data.userId
      });
    });
    
    // Step 3: Check user balances
    console.log('📋 Step 3: Checking user balances...');
    const usersQuery = query(collection(firestore, 'users'));
    const usersSnapshot = await getDocs(usersQuery);
    
    usersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.role === 'seller') {
        console.log(`👤 Seller ${doc.id}:`, {
          balance: data.balance || 0,
          email: data.email
        });
      }
    });
    
    console.log('✅ Test complete! Check the data above.');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run the test
console.log('🚀 Run: testReceiptApprovalFlow() to test the flow');
