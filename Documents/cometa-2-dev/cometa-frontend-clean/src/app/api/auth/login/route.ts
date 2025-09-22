import { NextRequest, NextResponse } from 'next/server';

// API Gateway URL - use environment variable or default to localhost
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:8080';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, phone, pin_code, remember_me } = body;

    if (!email && !phone) {
      return NextResponse.json(
        { message: 'Email or phone required' },
        { status: 400 }
      );
    }

    if (!pin_code) {
      return NextResponse.json(
        { message: 'PIN code required' },
        { status: 400 }
      );
    }

    // Forward authentication request to FastAPI auth service via API Gateway
    const authResponse = await fetch(`${API_GATEWAY_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        phone,
        pin_code,
        remember_me
      }),
    });

    if (!authResponse.ok) {
      const errorData = await authResponse.json().catch(() => ({}));
      return NextResponse.json(
        { message: errorData.detail || 'Authentication failed' },
        { status: authResponse.status }
      );
    }

    const authData = await authResponse.json();

    // Return the response from the auth service
    return NextResponse.json(authData);

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}