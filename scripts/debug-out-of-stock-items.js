#!/usr/bin/env node

/**
 * Debug script to check out-of-stock items in the database
 * This will help identify why out-of-stock items aren't showing up in the dashboard
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, orderBy } = require('firebase/firestore');

// Firebase config (using environment variables for security)
const firebaseConfig = {
  // Add your Firebase config here if running locally
  // For production, use environment variables
};

console.log('🔍 Debugging Out-of-Stock Items');
console.log('================================\n');

async function debugStockItems() {
  try {
    // Initialize Firebase (you may need to adjust this based on your config)
    console.log('📱 Initializing Firebase...');
    // const app = initializeApp(firebaseConfig);
    // const db = getFirestore(app);

    console.log('⚠️  Note: This script needs Firebase configuration to run against real data.');
    console.log('For now, showing what queries would be executed:\n');

    // Mock data to demonstrate the issue
    const mockStockItems = [
      { id: '1', name: 'Item 1', stock: 5, listed: true, price: 10 },
      { id: '2', name: 'Item 2', stock: 0, listed: true, price: 20 }, // Out of stock
      { id: '3', name: 'Item 3', stock: 3, listed: true, price: 15 },
      { id: '4', name: 'Item 4', stock: 0, listed: true, price: 25 }, // Out of stock
      { id: '5', name: 'Item 5', stock: 0, listed: false, price: 30 }, // Unlisted
    ];

    console.log('📊 Mock Stock Data:');
    console.table(mockStockItems);

    console.log('\n🔎 Current Query Filters:');
    console.log('- where("listed", "==", true)');
    console.log('- orderBy("createdAt", "desc")');
    console.log('- typeof data.stock === "number" (validation)');

    console.log('\n✅ Items that should appear in dashboard:');
    const shouldAppear = mockStockItems.filter(item => 
      item.listed === true && 
      typeof item.stock === 'number'
    );
    console.table(shouldAppear);

    console.log('\n📋 Analysis:');
    console.log(`- Total mock items: ${mockStockItems.length}`);
    console.log(`- Listed items: ${mockStockItems.filter(i => i.listed).length}`);
    console.log(`- Out-of-stock items: ${mockStockItems.filter(i => i.stock === 0).length}`);
    console.log(`- Out-of-stock AND listed: ${mockStockItems.filter(i => i.stock === 0 && i.listed).length}`);

    console.log('\n🎯 Expected Behavior:');
    console.log('- Out-of-stock items (stock: 0) should appear with "Out of Stock" badge');
    console.log('- Items should have "Add Stock" and "Edit" buttons when stock is 0');
    console.log('- Items should NOT be deleted from database when stock reaches 0');

    console.log('\n🔧 Potential Issues to Check:');
    console.log('1. Database validation in subscribeToAdminStock method');
    console.log('2. Cleanup services still running despite being commented out');
    console.log('3. Data type inconsistencies (null vs 0 vs undefined)');
    console.log('4. Frontend filtering logic');

    return true;
  } catch (error) {
    console.error('❌ Error during debugging:', error);
    return false;
  }
}

// Mock the actual Firebase query behavior
function mockSubscribeToAdminStock() {
  console.log('\n🔍 Simulating subscribeToAdminStock query:');
  
  const mockFirestoreData = [
    { id: '1', data: { name: 'Item 1', stock: 5, listed: true, price: 10, productCode: 'P001' }},
    { id: '2', data: { name: 'Item 2', stock: 0, listed: true, price: 20, productCode: 'P002' }},
    { id: '3', data: { name: 'Item 3', stock: null, listed: true, price: 15, productCode: 'P003' }}, // Potential issue
    { id: '4', data: { name: 'Item 4', stock: undefined, listed: true, price: 25, productCode: 'P004' }}, // Potential issue
  ];

  console.log('📄 Raw Firestore data:');
  mockFirestoreData.forEach(doc => {
    console.log(`  ${doc.id}: stock=${doc.data.stock} (${typeof doc.data.stock})`);
  });

  console.log('\n🔍 Applying validation filters:');
  const validatedItems = [];
  
  mockFirestoreData.forEach(doc => {
    const data = doc.data;
    const isValid = data && 
                   data.productCode && 
                   data.name && 
                   typeof data.price === "number" && 
                   typeof data.stock === "number";
    
    console.log(`  ${doc.id}: valid=${isValid} (stock type: ${typeof data.stock})`);
    
    if (isValid) {
      validatedItems.push({
        id: doc.id,
        ...data
      });
    }
  });

  console.log('\n✅ Items that pass validation:');
  console.table(validatedItems);

  console.log('\n⚠️  Items filtered out due to validation:');
  const filteredOut = mockFirestoreData.filter(doc => {
    const data = doc.data;
    return !(data && 
            data.productCode && 
            data.name && 
            typeof data.price === "number" && 
            typeof data.stock === "number");
  });
  console.table(filteredOut.map(doc => ({ id: doc.id, ...doc.data })));
}

// Run the debugging
debugStockItems().then(() => {
  mockSubscribeToAdminStock();
  console.log('\n🎯 Next Steps:');
  console.log('1. Check database directly for any items with stock: null or undefined');
  console.log('2. Verify that stock updates are properly setting numeric values');
  console.log('3. Check if any cleanup services are running despite being disabled');
  console.log('4. Test the frontend stock display logic');
});
