/**
 * Admin Redirection Verification Script
 *
 * This script should be run in the browser console when logged in as an admin
 * to verify that redirection is working correctly.
 *
 * Instructions:
 * 1. Log in as an admin user on your Ticktok production site
 * 2. Open browser developer tools (F12)
 * 3. Paste this entire script into the console
 * 4. Press Enter to run it
 *
 * If you continue to experience issues after the fix:
 * - Try the new admin-redirect-debug.js script for more detailed diagnostics
 * - Clear localStorage and browser cookies before attempting login again
 * - Check that Firebase authentication is working correctly
 */

(function () {
  const currentPath = window.location.pathname;
  const currentRole = localStorage.getItem("userRole") || "unknown";

  console.log(
    "%c Admin Redirect Verification Tool ",
    "background: #2563EB; color: white; padding: 5px; border-radius: 3px;"
  );
  console.log("---------------------------------------");
  console.log(`Current path: ${currentPath}`);
  console.log(`User role from localStorage: ${currentRole}`);

  // Check if we're already on the admin dashboard
  if (currentPath === "/dashboard/admin") {
    console.log(
      "%c ✓ SUCCESS: Already on admin dashboard ",
      "background: #10B981; color: white; padding: 3px; border-radius: 3px;"
    );
    return;
  }

  console.log("Testing redirection to admin dashboard...");

  // Store original location to return afterward
  const originalLocation = window.location.href;

  // Create and display test results in the page
  const testDiv = document.createElement("div");
  testDiv.style.position = "fixed";
  testDiv.style.top = "10px";
  testDiv.style.right = "10px";
  testDiv.style.padding = "15px";
  testDiv.style.background = "white";
  testDiv.style.border = "1px solid #ddd";
  testDiv.style.borderRadius = "5px";
  testDiv.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
  testDiv.style.zIndex = "9999";
  testDiv.style.maxWidth = "400px";
  testDiv.innerHTML = `
    <h3 style="margin-top: 0; color: #2563EB;">Admin Redirect Test</h3>
    <p><strong>Current path:</strong> ${currentPath}</p>
    <p><strong>User role:</strong> ${currentRole}</p>
    <div id="test-results" style="margin-top: 10px;">Running tests...</div>
    <button id="close-test" style="margin-top: 10px; padding: 5px 10px; background: #EF4444; color: white; border: none; border-radius: 3px; cursor: pointer;">Close</button>
  `;

  document.body.appendChild(testDiv);

  document.getElementById("close-test").addEventListener("click", () => {
    testDiv.remove();
  });

  const resultsDiv = document.getElementById("test-results");

  // Check environment info
  const isProduction =
    window.location.hostname.includes("vercel.app") ||
    !window.location.hostname.includes("localhost");

  resultsDiv.innerHTML = `
    <p><strong>Environment:</strong> ${
      isProduction ? "Production" : "Development"
    }</p>
    <p><strong>Testing redirect...</strong></p>
  `;

  // Log auth state to help with debugging
  if (window.firebase && window.firebase.auth) {
    window.firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        console.log("Firebase user authenticated:", user.email);
        console.log("Email verified:", user.emailVerified);
        resultsDiv.innerHTML += `<p>✓ User authenticated as: ${user.email}</p>`;
      } else {
        console.log("No user authenticated");
        resultsDiv.innerHTML += `<p>❌ No user authenticated</p>`;
      }
    });
  }

  // Test navigation to login page with redirect back to admin
  setTimeout(() => {
    resultsDiv.innerHTML += `<p>Attempting login redirect test...</p>`;

    // Try to force a navigation to login page with redirect back to admin
    const testRedirectUrl = `/login?redirect=${encodeURIComponent(
      "/dashboard/admin"
    )}`;
    console.log(`Testing redirect by visiting: ${testRedirectUrl}`);

    // Navigate to the login page with redirect param
    window.location.href = testRedirectUrl;

    // This code won't run as page will navigate away
  }, 2000);

  // The rest of this won't run due to navigation, but included for completeness
  console.log("Note: Page will navigate away during test");
})();
