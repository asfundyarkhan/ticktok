/**
 * Simple test to verify unique ID generation for Node.js
 */

// Simplified versions of our ID generation functions for testing
function generateAdminProductId() {
  const timestamp = Date.now();
  const randomPart = Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();
  return `admin-${timestamp}-${randomPart}`;
}

function testUniqueIdGeneration() {
  console.log('Testing ID generation for uniqueness...\n');

  // Test: Generate multiple admin product IDs rapidly
  console.log('Test: Admin Product IDs (rapid generation)');
  const adminIds = new Set();
  let duplicateFound = false;
  
  for (let i = 0; i < 1000; i++) {
    const id = generateAdminProductId();
    if (adminIds.has(id)) {
      console.error(`❌ Duplicate admin ID found: ${id} at iteration ${i}`);
      duplicateFound = true;
      break;
    }
    adminIds.add(id);
    if (i < 5) console.log(`  Sample ID: ${id}`);
  }
  
  if (!duplicateFound) {
    console.log(`✅ Generated ${adminIds.size} unique admin product IDs`);
  }

  // Compare with old method
  console.log('\nTesting old Date.now() approach:');
  const oldIds = new Set();
  
  for (let i = 0; i < 1000; i++) {
    const id = `admin-${Date.now()}`;
    if (oldIds.has(id)) {
      console.log(`❌ OLD METHOD: Duplicate found at iteration ${i}: ${id}`);
      console.log(`   This demonstrates the problem we fixed!`);
      break;
    }
    oldIds.add(id);
  }
  
  console.log(`Old method generated ${oldIds.size} IDs (likely with duplicates in rapid succession)`);
  
  if (!duplicateFound) {
    console.log('\n🎉 New ID generation method successfully prevents duplicates!');
  }
}

// Run the test
testUniqueIdGeneration();
