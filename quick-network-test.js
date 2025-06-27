#!/usr/bin/env node

// Quick test to check if Firebase network connectivity is working
const { spawn } = require("child_process");

console.log("🔍 Quick Firebase Network Test...\n");

// Test 1: Basic network connectivity
console.log("1️⃣ Testing basic network connectivity...");
const ping = spawn("ping", ["-n", "1", "google.com"], { shell: true });

ping.stdout.on("data", (data) => {
  if (data.toString().includes("Reply from")) {
    console.log("✅ Internet connectivity: OK");
  }
});

ping.stderr.on("data", (data) => {
  console.log("❌ Internet connectivity: FAILED");
  console.log(`Error: ${data}`);
});

ping.on("close", (code) => {
  if (code === 0) {
    testFirebaseEndpoints();
  } else {
    console.log(
      "❌ Basic network test failed. Check your internet connection."
    );
  }
});

function testFirebaseEndpoints() {
  console.log("\n2️⃣ Testing Firebase endpoints...");

  const endpoints = [
    "firebase.googleapis.com",
    "identitytoolkit.googleapis.com",
    "firestore.googleapis.com",
  ];

  let completedTests = 0;

  endpoints.forEach((endpoint) => {
    const pingFirebase = spawn("ping", ["-n", "1", endpoint], { shell: true });

    pingFirebase.stdout.on("data", (data) => {
      if (data.toString().includes("Reply from")) {
        console.log(`✅ ${endpoint}: Reachable`);
      }
    });

    pingFirebase.stderr.on("data", (data) => {
      console.log(`❌ ${endpoint}: Not reachable`);
    });

    pingFirebase.on("close", (code) => {
      completedTests++;
      if (completedTests === endpoints.length) {
        console.log("\n3️⃣ Testing Firebase SDK...");
        testFirebaseSDK();
      }
    });
  });
}

function testFirebaseSDK() {
  console.log("Starting Firebase SDK test...");
  const nodeTest = spawn("node", ["test-firebase-network.mjs"], {
    shell: true,
  });

  let hasOutput = false;

  nodeTest.stdout.on("data", (data) => {
    hasOutput = true;
    console.log(data.toString());
  });

  nodeTest.stderr.on("data", (data) => {
    console.log(`SDK Error: ${data}`);
  });

  // Set a timeout for the Firebase test
  const timeout = setTimeout(() => {
    if (!hasOutput) {
      console.log("❌ Firebase SDK test timed out - likely network issue");
      console.log("\n💡 RECOMMENDATIONS:");
      console.log("1. Check Windows Firewall settings");
      console.log("2. Temporarily disable antivirus");
      console.log("3. Try mobile hotspot");
      console.log("4. Contact network administrator");
      nodeTest.kill();
    }
  }, 10000);

  nodeTest.on("close", (code) => {
    clearTimeout(timeout);
    if (code === 0) {
      console.log("✅ Firebase SDK test completed successfully");
    } else {
      console.log("❌ Firebase SDK test failed");
    }

    console.log("\n🏁 Test Summary Complete");
    console.log("If issues persist, see NETWORK_REQUEST_FAILED_FIX.md");
  });
}
