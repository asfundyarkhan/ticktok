/**
 * Test script to verify unique ID generation
 * This tests that our new ID generation functions produce unique IDs even when called rapidly
 */

import {
  generateAdminProductId,
  generateProductCode,
  generateUniqueId,
  generateUUID,
} from "../src/utils/idGenerator";

function testUniqueIdGeneration() {
  console.log("Testing ID generation for uniqueness...\n");

  // Test 1: Generate multiple admin product IDs rapidly
  console.log("Test 1: Admin Product IDs (rapid generation)");
  const adminIds = new Set();
  for (let i = 0; i < 100; i++) {
    const id = generateAdminProductId();
    if (adminIds.has(id)) {
      console.error(`❌ Duplicate admin ID found: ${id}`);
      return false;
    }
    adminIds.add(id);
    if (i < 5) console.log(`  ${id}`);
  }
  console.log(`✅ Generated ${adminIds.size} unique admin product IDs\n`);

  // Test 2: Generate multiple product codes rapidly
  console.log("Test 2: Product Codes (rapid generation)");
  const productCodes = new Set();
  for (let i = 0; i < 100; i++) {
    const code = generateProductCode();
    if (productCodes.has(code)) {
      console.error(`❌ Duplicate product code found: ${code}`);
      return false;
    }
    productCodes.add(code);
    if (i < 5) console.log(`  ${code}`);
  }
  console.log(`✅ Generated ${productCodes.size} unique product codes\n`);

  // Test 3: Generate multiple unique IDs with custom prefix
  console.log("Test 3: Custom Prefix IDs (rapid generation)");
  const customIds = new Set();
  for (let i = 0; i < 100; i++) {
    const id = generateUniqueId("item");
    if (customIds.has(id)) {
      console.error(`❌ Duplicate custom ID found: ${id}`);
      return false;
    }
    customIds.add(id);
    if (i < 5) console.log(`  ${id}`);
  }
  console.log(`✅ Generated ${customIds.size} unique custom IDs\n`);

  // Test 4: Generate UUIDs
  console.log("Test 4: UUID Generation");
  const uuids = new Set();
  for (let i = 0; i < 100; i++) {
    const uuid = generateUUID();
    if (uuids.has(uuid)) {
      console.error(`❌ Duplicate UUID found: ${uuid}`);
      return false;
    }
    uuids.add(uuid);
    if (i < 5) console.log(`  ${uuid}`);
  }
  console.log(`✅ Generated ${uuids.size} unique UUIDs\n`);

  // Test 5: Stress test - generate many IDs in a tight loop (simulating rapid React renders)
  console.log("Test 5: Stress Test (1000 IDs in tight loop)");
  const stressTestIds = new Set();
  const startTime = Date.now();

  for (let i = 0; i < 1000; i++) {
    const id = generateAdminProductId();
    if (stressTestIds.has(id)) {
      console.error(`❌ Duplicate ID in stress test: ${id} at iteration ${i}`);
      return false;
    }
    stressTestIds.add(id);
  }

  const endTime = Date.now();
  console.log(
    `✅ Generated ${stressTestIds.size} unique IDs in ${
      endTime - startTime
    }ms\n`
  );

  console.log("🎉 All tests passed! ID generation is working correctly.");
  return true;
}

// Simulate the old problematic function for comparison
function oldProblematicIdGeneration() {
  console.log("\nTesting old Date.now() approach for comparison:");
  const oldIds = new Set();

  for (let i = 0; i < 100; i++) {
    const id = `admin-${Date.now()}`;
    if (oldIds.has(id)) {
      console.log(`❌ OLD METHOD: Duplicate found at iteration ${i}: ${id}`);
      console.log(
        `   Previous occurrences: ${
          Array.from(oldIds).filter((oid) => oid === id).length
        }`
      );
      return;
    }
    oldIds.add(id);
  }

  console.log(`Old method generated ${oldIds.size} unique IDs (this may vary)`);
}

// Run the tests
testUniqueIdGeneration();
oldProblematicIdGeneration();
