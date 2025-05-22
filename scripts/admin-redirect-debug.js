/**
 * Admin Redirection Debug Tool
 *
 * Run this script in your browser console when logged in
 * to debug admin redirections.
 */

(function () {
  // Display a styled header
  console.log(
    "%c ========== Admin Redirection Debug ========== ",
    "background: #4f46e5; color: white; padding: 5px; border-radius: 5px;"
  );

  // Function to get and display a localStorage item
  function checkItem(key, label) {
    const value = localStorage.getItem(key);
    console.log(`${label}: ${value ? `"${value}"` : "(not set)"}`);
    return value;
  }

  // Get authentication info
  console.log("1. Authentication State:");
  const userRole = checkItem("userRole", "   User Role");
  const userEmail = checkItem("userEmail", "   User Email");
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  console.log(`   Is Logged In: ${isLoggedIn}`);

  // Get redirection history
  console.log("\n2. Redirection History:");
  checkItem("last_admin_route_path", "   Last Admin Route Path");
  checkItem("auth_redirect", "   Pending Auth Redirect");
  checkItem("admin_page_loaded", "   Admin Page Loaded");
  checkItem("admin_page_loaded_time", "   Admin Page Loaded Time");

  // Check current location
  console.log("\n3. Current Location:");
  console.log(`   Path: ${window.location.pathname}`);
  console.log(`   Search: ${window.location.search}`);

  // Test redirect directly
  console.log("\n4. Test Direct Redirection:");
  const testRedirect = confirm("Test direct navigation to admin dashboard?");

  if (testRedirect) {
    console.log("   Navigating to /dashboard/admin...");
    window.location.href = "/dashboard/admin";
  } else {
    console.log("   Redirection test skipped.");
  }

  // Create debug report if in admin route
  if (window.location.pathname.includes("/dashboard/admin")) {
    console.log("\n5. Admin Dashboard Debug:");

    // Show firebase auth details if available
    if (window.firebase && window.firebase.auth) {
      console.log("   Getting Firebase Auth state...");
      window.firebase.auth().onAuthStateChanged((user) => {
        if (user) {
          console.log("   Firebase User:", {
            uid: user.uid,
            email: user.email,
            emailVerified: user.emailVerified,
          });
        } else {
          console.log("   No Firebase User authenticated");
        }
      });
    }
  }
})();
