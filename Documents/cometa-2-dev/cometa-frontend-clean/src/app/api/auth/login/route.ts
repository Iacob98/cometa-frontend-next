import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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

    // Query database through Docker container
    let sqlQuery = '';
    if (email) {
      sqlQuery = `SELECT id, email, phone, first_name, last_name, role, lang_pref, pin_code FROM users WHERE email = '${email}' AND is_active = true;`;
    } else {
      sqlQuery = `SELECT id, email, phone, first_name, last_name, role, lang_pref, pin_code FROM users WHERE phone = '${phone}' AND is_active = true;`;
    }

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${sqlQuery}"`;

    const { stdout, stderr } = await execAsync(command);

    if (stderr) {
      console.error('Database error:', stderr);
      return NextResponse.json(
        { message: 'Database error' },
        { status: 500 }
      );
    }

    const result = stdout.trim();
    if (!result) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Parse the result (pipe-separated values)
    const parts = result.split('|').map(part => part.trim());
    if (parts.length < 7) {
      return NextResponse.json(
        { message: 'Invalid user data' },
        { status: 500 }
      );
    }

    const user = {
      id: parts[0],
      email: parts[1],
      phone: parts[2],
      first_name: parts[3],
      last_name: parts[4],
      role: parts[5],
      lang_pref: parts[6] || 'de',
      pin_code: parts[7]
    };

    // Check PIN code
    if (user.pin_code !== pin_code) {
      return NextResponse.json(
        { message: 'Invalid PIN code' },
        { status: 401 }
      );
    }

    // Generate tokens
    const access_token = `access_token_${user.id}_${Date.now()}`;
    const refresh_token = `refresh_token_${user.id}_${Date.now()}`;

    // Return successful login response
    return NextResponse.json({
      access_token,
      refresh_token,
      token_type: 'Bearer',
      expires_in: 3600,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        lang_pref: user.lang_pref,
      },
      permissions: user.role === 'admin' ? ['*'] : [],
    });

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}