// Security headers for Next.js
// This file is imported in next.config.js

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self)',
  },  
  // Add Content Security Policy in production - allowing Firebase connections
  ...(process.env.NODE_ENV === 'production'
    ? [        {          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' *.vercel.app *.googleapis.com *.googletagmanager.com *.google-analytics.com *.gstatic.com tiktokshophub.co www.tiktokshophub.co; style-src 'self' 'unsafe-inline' *.googleapis.com; img-src 'self' data: blob: *.googleapis.com *.gstatic.com tiktokshophub.co www.tiktokshophub.co; font-src 'self' *.gstatic.com; connect-src 'self' *.vercel.app *.firebaseio.com *.googleapis.com *.firebase.googleapis.com *.firebaseinstallations.googleapis.com *.identitytoolkit.googleapis.com *.firebasestorage.googleapis.com *.google-analytics.com *.appspot.com wss://*.firebaseio.com tiktokshophub.co www.tiktokshophub.co tiktok-6upktrfhg-asfundyarkhans-projects.vercel.app tiktok-git-main-asfundyarkhans-projects.vercel.app tiktok-ten-lilac.vercel.app; frame-src 'self' *.firebaseapp.com *.web.app ticktokshop-5f1e9.firebaseapp.com ticktokshop-5f1e9.web.app tiktokshophub.co www.tiktokshophub.co tiktok-6upktrfhg-asfundyarkhans-projects.vercel.app tiktok-git-main-asfundyarkhans-projects.vercel.app tiktok-ten-lilac.vercel.app",
        },
      ]
    : []),
];

module.exports = securityHeaders;
