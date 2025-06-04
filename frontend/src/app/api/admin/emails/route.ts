import { NextResponse } from 'next/server';

// Remove dynamic export for static build compatibility
// export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Fetching email subscribers from backend');
    
    // Get backend URL from environment variable or use default
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3011';
    
    // Make request to backend API
    const response = await fetch(`${backendUrl}/api/email-signup`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      console.error(`Backend API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return NextResponse.json(
        { success: false, message: `Failed to fetch emails: ${response.statusText}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log(`Successfully fetched ${data.count} email subscribers`);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in admin/emails API route:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
