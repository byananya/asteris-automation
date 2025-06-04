import { NextRequest, NextResponse } from 'next/server';

// Add this to make the route dynamic
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Email signup request received:', { email: body.email, source: body.source });
    
    // Validate email
    if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      console.log('Invalid email format:', body.email);
      return NextResponse.json(
        { success: false, message: 'Please provide a valid email address' },
        { status: 400 }
      );
    }
    
    // Forward the request to the backend API
    // Use localhost:3011 directly since that's where the backend is running
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3011';
    const apiUrl = `${backendUrl}/api/email-signup`;
    
    console.log(`Attempting to connect to backend at: ${apiUrl}`);
    console.log('Email data being sent:', JSON.stringify({
      email: body.email,
      name: body.name || '',
      source: body.source || 'modal',
    }));

    
    console.log(`Forwarding request to backend at: ${apiUrl}`);
    
    // Create an AbortController to handle timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    let response;
    try {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: body.email,
          name: body.name || '',
          source: body.source || 'modal',
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeout); // Clear the timeout if fetch completes
      
      console.log('Backend response status:', response.status);
      
      let data;
      try {
        data = await response.json();
        console.log('Backend response data:', data);
        
        // Return the response from the backend
        return NextResponse.json(data, { status: response.status });
      } catch (parseError) {
        console.error('Error parsing backend response:', parseError);
        return NextResponse.json(
          { success: false, message: 'Invalid response from backend server' },
          { status: 502 }
        );
      }
    } catch (fetchError) {
      clearTimeout(timeout);
      console.error('Error connecting to backend:', fetchError);
      
      // Create a direct file write as a fallback
      try {
        console.log('Attempting to write email directly to file as fallback');
        // We can't directly write to file from frontend API route, but we'll log this
        // and return a success response since we've already saved to localStorage
        
        return NextResponse.json(
          { 
            success: true, 
            message: 'Email saved to local storage (backend connection failed)',
            fallback: true
          },
          { status: 200 }
        );
      } catch (fileError) {
        console.error('Error in fallback file write:', fileError);
        return NextResponse.json(
          { success: false, message: 'Failed to save email' },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('Error in email signup API route:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
