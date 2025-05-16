# TikTok Shop E-Commerce Application

This is a Next.js-based e-commerce application designed to provide a seamless shopping experience for TikTok Shop users.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment on Vercel

This application is optimized for deployment on Vercel. Follow these steps:

1. Create a Vercel account at [vercel.com](https://vercel.com) if you don't have one
2. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```
3. Login to your Vercel account:
   ```bash
   vercel login
   ```
4. Deploy to Vercel:
   ```bash
   vercel
   ```

### Setting Up Custom Domain

1. On the Vercel dashboard, navigate to your project settings
2. Go to "Domains" section
3. Add your custom domain (e.g., yourdomain.com)
4. Update your DNS settings with the records provided by Vercel:
   - For apex domains: Add an A record pointing to Vercel's IP addresses
   - For subdomains: Add a CNAME record pointing to your Vercel project

Make sure to:

- Enable HTTPS for your domain (Vercel handles this automatically with Let's Encrypt)
- Verify domain ownership following Vercel's instructions
- Update your environment variables to match your custom domain

### Environment Variables

For production deployment, ensure these environment variables are set in your Vercel project:

- `NEXT_PUBLIC_SITE_URL` - Your custom domain (e.g., https://yourdomain.com)
- `NEXTAUTH_URL` - Same as your custom domain for authentication to work properly
- `NEXTAUTH_SECRET` - A secure random string for authentication security
- `NODE_ENV` - Set to "production" for production builds

## Key Features

- Product browsing and search
- Shopping cart functionality
- Seller inventory management
- Product listings management
- User balance/wallet functionality

## Client-Side Storage

This application uses localStorage for state management. All localStorage interactions have been optimized to work correctly with Next.js server-side rendering.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
