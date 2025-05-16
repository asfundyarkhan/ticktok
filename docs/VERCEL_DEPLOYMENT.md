# Vercel Deployment Guide for Ticktok E-Commerce

This guide will walk you through deploying the Ticktok E-Commerce application to Vercel and configuring a custom domain.

## Prerequisites

- A Vercel account - [Sign up here](https://vercel.com/signup) if you don't have one
- Custom domain name (optional, but recommended for production)
- Git repository with your project code

## Deployment Steps

### Method 1: Using the Deployment Script

We've provided a script to automate the deployment process:

**For Windows (PowerShell):**

```powershell
.\scripts\deploy-to-vercel.ps1
```

**For Linux/Mac:**

```bash
chmod +x ./scripts/deploy-to-vercel.sh
./scripts/deploy-to-vercel.sh
```

### Method 2: Manual Deployment

1. Install the Vercel CLI:

   ```
   npm install -g vercel
   ```

2. Login to your Vercel account:

   ```
   vercel login
   ```

3. Run the deployment command from your project root:

   ```
   vercel --prod
   ```

4. Follow the prompts to complete the deployment.

## Setting Up Custom Domain

1. Once deployed, go to your [Vercel Dashboard](https://vercel.com/dashboard)

2. Select your Ticktok project

3. Go to **Settings** → **Domains**

4. Click **Add** and enter your custom domain name

5. Follow Vercel's instructions to configure the DNS records:

   - For apex domains (e.g., yourdomain.com): Add A records pointing to Vercel's IP addresses
   - For subdomains (e.g., shop.yourdomain.com): Add a CNAME record pointing to your Vercel deployment URL

6. Wait for DNS propagation (can take up to 48 hours, but usually much faster)

## Environment Variables

Ensure these environment variables are set in your Vercel project:

| Variable             | Purpose                 | Example Value              |
| -------------------- | ----------------------- | -------------------------- |
| NEXT_PUBLIC_SITE_URL | Public URL of your site | https://yourdomain.com     |
| NEXTAUTH_URL         | Authentication URL      | https://yourdomain.com     |
| NEXTAUTH_SECRET      | Authentication secret   | (generate a random string) |

To set these:

1. Go to your project in the Vercel dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable and its value

## SSL/TLS Configuration

Vercel automatically provisions SSL certificates for your custom domain using Let's Encrypt. There's nothing additional you need to configure.

## Troubleshooting

If you encounter issues during deployment:

1. Check the deployment logs in Vercel dashboard
2. Verify your DNS configuration
3. Ensure all required environment variables are set
4. Check that your project builds successfully locally:
   ```
   npm run build
   ```

## Post-Deployment Verification

After deploying:

1. Visit your site to ensure it loads correctly
2. Test core functionality (user login, cart, checkout, etc.)
3. Verify that all API endpoints are working
4. Check SSL certificate is valid by visiting https://yourdomain.com

## Need Help?

Contact our support team at support@ticktok.com or open an issue in the project repository.
