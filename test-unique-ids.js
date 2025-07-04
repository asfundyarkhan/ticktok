// Test script to verify unique ID generation
function generateUniqueInstanceId(baseProductCode, instanceNumber) {
  const timestamp = Date.now();
  const nanoTime = performance.now().toString().replace(".", "");
  const random1 = Math.random().toString(36).substring(2, 8);
  const random2 = Math.random().toString(36).substring(2, 6);
  return `${baseProductCode}-inst-${instanceNumber}-${timestamp}-${nanoTime}-${random1}${random2}`;
}

// Test generating multiple IDs
console.log("Testing unique ID generation:");
const baseCode = "PROD-1751570015088-6NXV";

// Generate 5 instances with small delays like in the actual code
async function testGeneration() {
  for (let i = 1; i <= 5; i++) {
    if (i > 1) {
      await new Promise((resolve) => setTimeout(resolve, 1));
    }

    const uniqueId = generateUniqueInstanceId(baseCode, i);
    console.log(`Instance ${i}: ${uniqueId}`);
  }
}

testGeneration().catch(console.error);
