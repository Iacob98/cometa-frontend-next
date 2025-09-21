import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const per_page = parseInt(searchParams.get('per_page') || '20');
    const role = searchParams.get('role');
    const is_active = searchParams.get('is_active');

    // Build SQL query
    let whereClause = '';
    const conditions = [];

    if (role) {
      conditions.push(`role = '${role}'`);
    }

    if (is_active !== null) {
      const activeStatus = is_active === 'true';
      conditions.push(`is_active = ${activeStatus}`);
    }

    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }

    // Query to get users
    const sqlQuery = `
      SELECT
        id,
        email,
        phone,
        first_name,
        last_name,
        role,
        lang_pref,
        is_active
      FROM users
      ${whereClause}
      ORDER BY first_name, last_name
      LIMIT ${per_page} OFFSET ${(page - 1) * per_page};
    `;

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users
      ${whereClause};
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${sqlQuery}"`;
    const countCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${countQuery}"`;

    const [{ stdout }, { stdout: countStdout }] = await Promise.all([
      execAsync(command),
      execAsync(countCommand)
    ]);

    // Parse results
    const users = [];
    const lines = stdout.trim().split('\n').filter(line => line.trim());

    for (const line of lines) {
      const parts = line.split('|').map(part => part.trim());
      if (parts.length >= 8) {
        users.push({
          id: parts[0],
          email: parts[1] || null,
          phone: parts[2] || null,
          first_name: parts[3],
          last_name: parts[4],
          full_name: `${parts[3]} ${parts[4]}`,
          role: parts[5],
          lang_pref: parts[6] || 'de',
          is_active: parts[7] === 't',
          department: "Field Operations", // Default for now
          hire_date: "2024-01-01", // Default for now
          skills: [], // Default for now
          certifications: [], // Default for now
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }

    const total = parseInt(countStdout.trim()) || 0;

    return NextResponse.json({
      items: users,
      total,
      page,
      per_page,
      total_pages: Math.ceil(total / per_page)
    });
  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
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
      lang_pref = 'de'
    } = body;

    // Validation
    if (!first_name || !last_name) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    if (!email && !phone) {
      return NextResponse.json(
        { error: 'Email or phone is required' },
        { status: 400 }
      );
    }

    // Generate PIN code
    const pin_code = Math.floor(1000 + Math.random() * 9000).toString();

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
          { error: 'User with this email or phone already exists' },
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
        '${pin_code}',
        true
      ) RETURNING id, email, phone, first_name, last_name, role, lang_pref, pin_code, is_active;
    `;

    const insertCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${insertQuery}"`;

    const { stdout, stderr } = await execAsync(insertCommand);

    if (stderr) {
      console.error('Database insert error:', stderr);
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    const result = stdout.trim();
    if (!result) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Parse the result
    const firstLine = result.split('\n')[0];
    const parts = firstLine.split('|').map(part => part.trim());
    if (parts.length < 9) {
      return NextResponse.json(
        { error: 'User created but data incomplete' },
        { status: 500 }
      );
    }

    const newUser = {
      id: parts[0],
      email: parts[1] || null,
      phone: parts[2] || null,
      first_name: parts[3],
      last_name: parts[4],
      full_name: `${parts[3]} ${parts[4]}`,
      role: parts[5],
      lang_pref: parts[6],
      pin_code: parts[7],
      is_active: parts[8] === 't',
      department: "Field Operations",
      hire_date: new Date().toISOString().split('T')[0],
      skills: [],
      certifications: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}