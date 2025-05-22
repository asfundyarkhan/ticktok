const fs = require("fs");
const path = require("path");

// Configuration object without env variables referring to secrets
const config = {
  framework: "nextjs",
  buildCommand: "node scripts/prepare-vercel-deploy.js && next build",
  devCommand: "next dev",
  installCommand: "npm install",
  regions: ["iad1"],
  env: {}, // Empty env object - we'll set variables directly in Vercel dashboard
  github: {
    silent: true,
    autoAlias: true,
    enabled: true,
  },
  cleanUrls: true,
  trailingSlash: false,
  redirects: [
    {
      source: "/home",
      destination: "/",
    },
  ],
  functions: {
    "src/app/api/**/*.ts": {
      memory: 1024,
      maxDuration: 10,
    },
  },
  headers: [
    {
      source: "/(.*)",
      headers: [
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "X-Frame-Options",
          value: "DENY",
        },
        {
          key: "X-XSS-Protection",
          value: "1; mode=block",
        },
        {
          key: "Cache-Control",
          value: "public, max-age=0, must-revalidate",
        },
      ],
    },
    {
      source: "/images/(.*)",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=86400",
        },
      ],
    },
    {
      source: "/_next/static/(.*)",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
    {
      source: "/fonts/(.*)",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
    {
      source: "/images/(.*)",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
  ],
};

// Write the config to vercel.json without any comments
try {
  fs.writeFileSync(
    path.join(__dirname, "vercel.json"),
    JSON.stringify(config, null, 2),
    "utf8"
  );
  console.log("Successfully created vercel.json without any comments");
} catch (error) {
  console.error("Error writing vercel.json:", error);
}
