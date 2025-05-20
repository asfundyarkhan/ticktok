// verify-csp.js - Script to verify Content Security Policy headers
const axios = require("axios");

// Configurable settings
const sitesToTest = [
  "https://tiktokshophub.co",
  "https://www.tiktokshophub.co",
  // Add your Vercel preview URLs as needed
  // 'https://tiktok-6upktrfhg-asfundyarkhans-projects.vercel.app',
  // 'https://tiktok-git-main-asfundyarkhans-projects.vercel.app',
  // 'https://tiktok-ten-lilac.vercel.app'
];

// Required Firebase domains that should be in CSP
const requiredDomains = [
  // Script sources
  { directive: "script-src", domain: "*.googleapis.com" },
  { directive: "script-src", domain: "*.googletagmanager.com" },
  { directive: "script-src", domain: "*.gstatic.com" },

  // Connect sources
  { directive: "connect-src", domain: "*.firebaseio.com" },
  { directive: "connect-src", domain: "*.googleapis.com" },
  { directive: "connect-src", domain: "*.firebase.googleapis.com" },
  {
    directive: "connect-src",
    domain: "*.firebaseinstallations.googleapis.com",
  },
  { directive: "connect-src", domain: "*.identitytoolkit.googleapis.com" },
  { directive: "connect-src", domain: "*.firebasestorage.googleapis.com" },
  { directive: "connect-src", domain: "*.google-analytics.com" },
  { directive: "connect-src", domain: "*.appspot.com" },
  { directive: "connect-src", domain: "wss://*.firebaseio.com" },

  // Frame sources
  { directive: "frame-src", domain: "*.firebaseapp.com" },
  { directive: "frame-src", domain: "*.web.app" },
];

// Test each site
async function testSites() {
  for (const site of sitesToTest) {
    console.log(`\nTesting ${site}...`);

    try {
      const response = await axios.get(site, {
        maxRedirects: 5,
        validateStatus: (status) => status < 500,
      });

      // Check for CSP header
      const cspHeader = response.headers["content-security-policy"];

      if (!cspHeader) {
        console.error("❌ No Content-Security-Policy header found!");
        continue;
      }

      console.log("✅ Content-Security-Policy header found");

      // Parse CSP into directives
      const directives = {};
      cspHeader.split(";").forEach((directive) => {
        const [name, ...values] = directive.trim().split(" ");
        if (name) {
          directives[name] = values;
        }
      });

      // Check for required domains
      let missingDomains = [];

      for (const required of requiredDomains) {
        const directiveValues = directives[required.directive] || [];
        if (
          !directiveValues.some(
            (value) =>
              value === required.domain ||
              (required.domain.startsWith("*.") &&
                value.includes(required.domain.substring(2)))
          )
        ) {
          missingDomains.push(required);
        }
      }

      if (missingDomains.length > 0) {
        console.error("❌ Missing required domains in CSP:");
        missingDomains.forEach(({ directive, domain }) => {
          console.error(`   - ${domain} in ${directive}`);
        });
      } else {
        console.log("✅ All required Firebase domains found in CSP");
      }

      // Print full CSP header for reference
      console.log("\nFull CSP Header:");
      console.log(cspHeader);
    } catch (error) {
      console.error(`❌ Error testing ${site}: ${error.message}`);
    }
  }
}

// Run the tests
testSites()
  .then(() => {
    console.log("\nCSP verification complete.");
  })
  .catch((err) => {
    console.error("Error running tests:", err);
    process.exit(1);
  });
