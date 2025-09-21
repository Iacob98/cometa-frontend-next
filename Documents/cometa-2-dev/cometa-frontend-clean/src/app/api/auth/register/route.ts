import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Function to generate a random 4-digit PIN
function generatePinCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      phone,
      first_name,
      last_name,
      role = 'crew',
      lang_pref = 'de',
      create_pin = true
    } = body;

    // Validation
    if (!email && !phone) {
      return NextResponse.json(
        { message: 'Email or phone required' },
        { status: 400 }
      );
    }

    if (!first_name || !last_name) {
      return NextResponse.json(
        { message: 'First name and last name are required' },
        { status: 400 }
      );
    }

    // Generate PIN code if requested
    const pin_code = create_pin ? generatePinCode() : null;

    // Check if user already exists
    let checkQuery = '';
    if (email && phone) {
      checkQuery = `SELECT id FROM users WHERE email = '${email}' OR phone = '${phone}';`;
    } else if (email) {
      checkQuery = `SELECT id FROM users WHERE email = '${email}';`;
    } else {
      checkQuery = `SELECT id FROM users WHERE phone = '${phone}';`;
    }

    const checkCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${checkQuery}"`;

    try {
      const { stdout: checkResult } = await execAsync(checkCommand);
      if (checkResult.trim()) {
        return NextResponse.json(
          { message: 'User with this email or phone already exists' },
          { status: 409 }
        );
      }
    } catch (error) {
      console.error('Check user error:', error);
    }

    // Insert new user
    const insertQuery = `
      INSERT INTO users (
        id, email, phone, first_name, last_name, role,
        lang_pref, pin_code, is_active
      ) VALUES (
        gen_random_uuid(),
        ${email ? `'${email}'` : 'NULL'},
        ${phone ? `'${phone}'` : 'NULL'},
        '${first_name}',
        '${last_name}',
        '${role}',
        '${lang_pref}',
        ${pin_code ? `'${pin_code}'` : 'NULL'},
        true
      ) RETURNING id, email, phone, first_name, last_name, role, lang_pref, pin_code;
    `;

    const insertCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${insertQuery}"`;

    const { stdout, stderr } = await execAsync(insertCommand);

    if (stderr) {
      console.error('Database insert error:', stderr);
      return NextResponse.json(
        { message: 'Failed to create user account' },
        { status: 500 }
      );
    }

    const result = stdout.trim();
    if (!result) {
      return NextResponse.json(
        { message: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // Parse the result - take only the first line
    const firstLine = result.split('\n')[0];
    const parts = firstLine.split('|').map(part => part.trim());
    if (parts.length < 8) {
      return NextResponse.json(
        { message: 'User created but data incomplete' },
        { status: 500 }
      );
    }

    const newUser = {
      id: parts[0],
      email: parts[1] || null,
      phone: parts[2] || null,
      first_name: parts[3],
      last_name: parts[4],
      role: parts[5],
      lang_pref: parts[6],
      pin_code: parts[7] || null
    };

    // Generate tokens for immediate login
    const access_token = `access_token_${newUser.id}_${Date.now()}`;
    const refresh_token = `refresh_token_${newUser.id}_${Date.now()}`;

    return NextResponse.json({
      message: 'User account created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        phone: newUser.phone,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        role: newUser.role,
        lang_pref: newUser.lang_pref,
        pin_code: newUser.pin_code // Include PIN for the user to know
      },
      access_token,
      refresh_token,
      token_type: 'Bearer',
      expires_in: 3600,
      permissions: newUser.role === 'admin' ? ['*'] : []
    }, { status: 201 });

  } catch (error) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}