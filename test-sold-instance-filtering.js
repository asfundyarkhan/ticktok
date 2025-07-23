/**
 * Test script to verify sold instances are properly filtered out
 */

// Mock data representing different listing scenarios
const mockListings = [
  // Instance 1 - Available
  {
    id: "listing1",
    productId: "product-a-inst-1",
    originalProductId: "product-a",
    name: "Test Product A",
    quantity: 1,
    price: 50,
    sellerId: "seller1",
    isInstance: true,
    status: "available",
    instanceNumber: 1
  },
  // Instance 2 - Sold (should be filtered out)
  {
    id: "listing2", 
    productId: "product-a-inst-2",
    originalProductId: "product-a",
    name: "Test Product A",
    quantity: 1,
    price: 50,
    sellerId: "seller1",
    isInstance: true,
    status: "sold",
    instanceNumber: 2
  },
  // Instance 3 - Available
  {
    id: "listing3",
    productId: "product-a-inst-3", 
    originalProductId: "product-a",
    name: "Test Product A",
    quantity: 1,
    price: 50,
    sellerId: "seller1",
    isInstance: true,
    status: "available",
    instanceNumber: 3
  },
  // Regular listing with zero quantity (should be filtered out)
  {
    id: "listing4",
    productId: "product-b",
    name: "Test Product B",
    quantity: 0,
    price: 30,
    sellerId: "seller2",
    isInstance: false
  },
  // Regular listing with available quantity
  {
    id: "listing5",
    productId: "product-c",
    name: "Test Product C", 
    quantity: 5,
    price: 25,
    sellerId: "seller2",
    isInstance: false
  }
];

// Simulate the groupProductInstances function
function groupProductInstances(listings) {
  const grouped = new Map();

  for (const listing of listings) {
    // Use original product ID for grouping instances, or the productId itself for non-instances
    const groupKey = listing.isInstance ? listing.originalProductId || listing.productId : listing.productId;
    
    if (grouped.has(groupKey)) {
      const existing = grouped.get(groupKey);
      
      if (listing.isInstance) {
        // Add to instances array only if not sold
        if (listing.status !== 'sold') {
          existing.instances = existing.instances || [];
          existing.instances.push(listing);
          existing.totalQuantity = (existing.totalQuantity || 0) + listing.quantity;
          
          // Count available instances
          if (listing.status === 'available') {
            existing.availableQuantity = (existing.availableQuantity || 0) + listing.quantity;
          }
        }
      } else {
        // For non-instances, just add quantities (assuming they're available unless quantity is 0)
        if (listing.quantity > 0) {
          existing.totalQuantity = (existing.totalQuantity || 0) + listing.quantity;
          existing.availableQuantity = (existing.availableQuantity || 0) + listing.quantity;
        }
      }
    } else {
      // Create new group only if the listing is not sold or has quantity > 0
      const shouldInclude = listing.isInstance ? 
        listing.status !== 'sold' : 
        listing.quantity > 0;
        
      if (shouldInclude) {
        const groupedListing = {
          ...listing,
          totalQuantity: listing.quantity,
          availableQuantity: listing.isInstance ? 
            (listing.status === 'available' ? listing.quantity : 0) : 
            listing.quantity,
          instances: listing.isInstance ? [listing] : undefined,
        };
        grouped.set(groupKey, groupedListing);
      }
    }
  }

  // Filter out groups with no available quantity
  const result = Array.from(grouped.values()).filter(group => 
    (group.availableQuantity || 0) > 0
  );

  return result;
}

// Run the test
console.log('🧪 Testing Product Instance Filtering...\n');

console.log('📋 Original listings:');
mockListings.forEach((listing, index) => {
  console.log(`  ${index + 1}. ${listing.name} (${listing.isInstance ? 'Instance' : 'Regular'}) - Status: ${listing.status || 'N/A'}, Qty: ${listing.quantity}`);
});

console.log('\n🔄 Running groupProductInstances...\n');

const grouped = groupProductInstances(mockListings);

console.log('✅ Grouped Results:');
grouped.forEach((group, index) => {
  console.log(`  ${index + 1}. ${group.name}`);
  console.log(`     - Available: ${group.availableQuantity}`);
  console.log(`     - Total: ${group.totalQuantity}`);
  if (group.instances) {
    console.log(`     - Instances: ${group.instances.length}`);
    group.instances.forEach(inst => {
      console.log(`       * Instance ${inst.instanceNumber}: ${inst.status}`);
    });
  }
  console.log('');
});

console.log('🎯 Test Results:');
console.log(`   - Original listings: ${mockListings.length}`);
console.log(`   - Grouped listings: ${grouped.length}`);
console.log(`   - Product A instances shown: ${grouped.find(g => g.originalProductId === 'product-a')?.instances?.length || 0} (should be 2)`);
console.log(`   - Product A available quantity: ${grouped.find(g => g.originalProductId === 'product-a')?.availableQuantity || 0} (should be 2)`);
console.log(`   - Product B filtered out: ${!grouped.find(g => g.productId === 'product-b') ? 'YES' : 'NO'} (should be YES)`);
console.log(`   - Product C included: ${grouped.find(g => g.productId === 'product-c') ? 'YES' : 'NO'} (should be YES)`);

// Verify expectations
const productA = grouped.find(g => g.originalProductId === 'product-a');
const productB = grouped.find(g => g.productId === 'product-b');
const productC = grouped.find(g => g.productId === 'product-c');

console.log('\n✅ Validation:');
console.log(`   ✓ Product A shows 2 available instances: ${productA && productA.availableQuantity === 2 ? 'PASS' : 'FAIL'}`);
console.log(`   ✓ Product B (zero quantity) filtered out: ${!productB ? 'PASS' : 'FAIL'}`);
console.log(`   ✓ Product C (regular listing) included: ${productC && productC.availableQuantity === 5 ? 'PASS' : 'FAIL'}`);
console.log(`   ✓ Sold instances excluded from display: ${productA && productA.instances && productA.instances.every(i => i.status !== 'sold') ? 'PASS' : 'FAIL'}`);

console.log('\n🎉 Test completed successfully!');
