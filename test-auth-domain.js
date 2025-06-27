// Test Firebase Auth Domain connectivity
const { initializeApp } = require("firebase/app");
const { getAuth, signInAnonymously } = require("firebase/auth");

// Test with current domain
const configCurrent = {
  apiKey: "AIzaSyBwqU1SU4jNWYKjhqkN1tEyyp64HXzmyG8",
  authDomain: "tiktokshop.international",
  projectId: "ticktokshop-5f1e9",
};

// Test with standard Firebase domain
const configStandard = {
  apiKey: "AIzaSyBwqU1SU4jNWYKjhqkN1tEyyp64HXzmyG8",
  authDomain: "ticktokshop-5f1e9.firebaseapp.com",
  projectId: "ticktokshop-5f1e9",
};

async function testAuthDomain(config, domainName) {
  try {
    console.log(`\n🧪 Testing ${domainName}...`);

    const app = initializeApp(config, domainName);
    const auth = getAuth(app);

    console.log(`✓ Firebase app initialized with ${domainName}`);

    // Test auth state listener
    const promise = new Promise((resolve, reject) => {
      const unsubscribe = auth.onAuthStateChanged(
        (user) => {
          console.log(`✓ Auth state listener working for ${domainName}`);
          unsubscribe();
          resolve();
        },
        (error) => {
          console.error(
            `✗ Auth state error for ${domainName}:`,
            error.code,
            error.message
          );
          unsubscribe();
          reject(error);
        }
      );

      // Timeout after 5 seconds
      setTimeout(() => {
        unsubscribe();
        reject(new Error("Timeout"));
      }, 5000);
    });

    await promise;
    console.log(`✅ ${domainName} is working correctly`);
  } catch (error) {
    console.error(`❌ ${domainName} failed:`, error.code || error.message);
    if (error.code === "auth/network-request-failed") {
      console.log(
        `   This suggests ${domainName} may not be properly configured`
      );
    }
  }
}

async function runTests() {
  console.log("🔍 Testing Firebase Auth Domain Configuration\n");

  await testAuthDomain(configCurrent, "tiktokshop.international");
  await testAuthDomain(configStandard, "ticktokshop-5f1e9.firebaseapp.com");

  console.log("\n📝 Recommendation:");
  console.log("If the standard domain works but custom domain fails,");
  console.log("update the authDomain in firebase.ts to use:");
  console.log('"ticktokshop-5f1e9.firebaseapp.com"');
}

runTests()
  .then(() => {
    console.log("\n✅ Tests completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test suite failed:", error);
    process.exit(1);
  });
