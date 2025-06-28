import { NextResponse } from 'next/server';

// For static export compatibility
// Note: We can't use dynamic = 'force-dynamic' with output: 'export'
// Instead, we'll handle the static case in the function body

export async function GET() {
  try {
    console.log('Fetching email subscribers from backend');
    
    // In production, we'll use an API route handler in the Next.js app
    if (process.env.NODE_ENV === 'production') {
      // For production, we'll serve a static response or use a serverless function
      return NextResponse.json({
        success: true,
        count: 0,
        emails: [],
        message: 'Email export is not available in static export mode. Please use the backend admin interface.'
      });
    }
    
    // For development, try to connect to the local backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3011';
    
    try {
      const response = await fetch(`https://api-production-ef16.up.railway.app/api/email-signup`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });
      
      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`Successfully fetched ${data.count} email subscribers`);
      return NextResponse.json(data);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error connecting to backend:', errorMessage);
      return NextResponse.json({
        success: false,
        count: 0,
        emails: [],
        message: 'Could not connect to the backend server.',
        error: errorMessage
      }, { status: 503 });
    }
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in admin/emails API route:', errorMessage);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: errorMessage
      },
      { status: 500 }
    );
  }
}
