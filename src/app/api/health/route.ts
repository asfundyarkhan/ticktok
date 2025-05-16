// Simple health check API route for Vercel deployment

export const dynamic = 'force-dynamic'; // Ensures this is always fresh

export async function GET() {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
  });
}
