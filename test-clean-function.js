// Test the cleanObjectForFirestore function
function cleanObjectForFirestore(obj) {
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      // Convert empty strings to null for optional fields, but keep them for required fields
      if (typeof value === "string" && value === "" && key !== "description") {
        continue; // Skip empty strings for optional fields
      }
      cleaned[key] = value;
    }
  }
  return cleaned;
}

// Test case that mimics the issue
const testData = {
  userId: "test123",
  userEmail: "test@example.com",
  userName: "Test User",
  amount: 100,
  receiptImageUrl: "https://example.com/image.jpg",
  description: "",
  status: "pending",
  isDepositPayment: true,
  pendingDepositId: "deposit123",
  pendingProductId: undefined,
  productName: undefined,
};

console.log("Original data:", testData);
console.log("Cleaned data:", cleanObjectForFirestore(testData));

// Check if cleaned data has any undefined values
const cleaned = cleanObjectForFirestore(testData);
const hasUndefined = Object.values(cleaned).some(
  (value) => value === undefined
);
console.log("Has undefined values:", hasUndefined);

// Check specific fields
console.log("pendingProductId in cleaned:", "pendingProductId" in cleaned);
console.log("productName in cleaned:", "productName" in cleaned);
