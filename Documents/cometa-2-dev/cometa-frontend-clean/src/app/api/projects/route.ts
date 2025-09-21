import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const per_page = parseInt(searchParams.get('per_page') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build SQL query
    let whereClause = '';
    const conditions = [];

    if (status) {
      conditions.push(`status = '${status}'`);
    }

    if (search) {
      conditions.push(`(name ILIKE '%${search}%' OR customer ILIKE '%${search}%' OR city ILIKE '%${search}%')`);
    }

    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }

    // Query to get projects with user names
    const sqlQuery = `
      SELECT
        p.id,
        p.name,
        p.customer,
        p.city,
        p.address,
        p.contact_24h,
        p.start_date,
        p.end_date_plan,
        p.status,
        p.total_length_m,
        p.base_rate_per_m,
        p.pm_user_id,
        p.language_default,
        u.first_name as pm_first_name,
        u.last_name as pm_last_name
      FROM projects p
      LEFT JOIN users u ON p.pm_user_id = u.id
      ${whereClause}
      ORDER BY p.start_date DESC
      LIMIT ${per_page} OFFSET ${(page - 1) * per_page};
    `;

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM projects p
      ${whereClause};
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${sqlQuery}"`;
    const countCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${countQuery}"`;

    const [{ stdout }, { stdout: countStdout }] = await Promise.all([
      execAsync(command),
      execAsync(countCommand)
    ]);

    // Parse results
    const projects = [];
    const lines = stdout.trim().split('\n').filter(line => line.trim());

    for (const line of lines) {
      const parts = line.split('|').map(part => part.trim());
      if (parts.length >= 14) {
        projects.push({
          id: parts[0],
          name: parts[1],
          customer: parts[2] || null,
          city: parts[3] || null,
          address: parts[4] || null,
          contact_24h: parts[5] || null,
          start_date: parts[6] || null,
          end_date_plan: parts[7] || null,
          status: parts[8],
          total_length_m: parseFloat(parts[9]) || 0,
          base_rate_per_m: parseFloat(parts[10]) || 0,
          pm_user_id: parts[11] || null,
          language_default: parts[12] || null,
          manager_name: parts[13] && parts[14] ? `${parts[13]} ${parts[14]}` : null,
          progress: Math.floor(Math.random() * 60 + 20), // Mock progress for now
          description: null, // Not in DB, can be added later
          budget: (parseFloat(parts[9]) || 0) * (parseFloat(parts[10]) || 0), // Calculate budget
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }

    const total = parseInt(countStdout.trim()) || 0;

    return NextResponse.json({
      items: projects,
      total,
      page,
      per_page,
      total_pages: Math.ceil(total / per_page)
    });
  } catch (error) {
    console.error('Projects API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      customer,
      city,
      address,
      contact_24h,
      start_date,
      end_date_plan,
      total_length_m,
      base_rate_per_m,
      language_default = 'de'
    } = body;

    // Validation
    if (!name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    // Insert new project into database
    const insertQuery = `
      INSERT INTO projects (
        id, name, customer, city, address, contact_24h,
        start_date, end_date_plan, total_length_m, base_rate_per_m,
        language_default, status, pm_user_id
      ) VALUES (
        gen_random_uuid(),
        '${name}',
        ${customer ? `'${customer}'` : 'NULL'},
        ${city ? `'${city}'` : 'NULL'},
        ${address ? `'${address}'` : 'NULL'},
        ${contact_24h ? `'${contact_24h}'` : 'NULL'},
        ${start_date ? `'${start_date}'` : 'NULL'},
        ${end_date_plan ? `'${end_date_plan}'` : 'NULL'},
        ${total_length_m || 0},
        ${base_rate_per_m || 0},
        '${language_default}',
        'draft',
        NULL
      ) RETURNING id, name, customer, city, address, contact_24h,
                   start_date, end_date_plan, total_length_m, base_rate_per_m,
                   language_default, status;
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${insertQuery}"`;
    const { stdout, stderr } = await execAsync(command);

    if (stderr) {
      console.error('Database insert error:', stderr);
      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 500 }
      );
    }

    const result = stdout.trim();
    if (!result) {
      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 500 }
      );
    }

    // Parse the result
    const parts = result.split('|').map(part => part.trim());
    if (parts.length < 12) {
      return NextResponse.json(
        { error: 'Project created but data incomplete' },
        { status: 500 }
      );
    }

    const newProject = {
      id: parts[0],
      name: parts[1],
      customer: parts[2] || null,
      city: parts[3] || null,
      address: parts[4] || null,
      contact_24h: parts[5] || null,
      start_date: parts[6] || null,
      end_date_plan: parts[7] || null,
      total_length_m: parseFloat(parts[8]) || 0,
      base_rate_per_m: parseFloat(parts[9]) || 0,
      language_default: parts[10] || 'de',
      status: parts[11],
      progress: 0,
      manager_name: null,
      manager_email: null,
      description: `Fiber optic construction project in ${parts[3] || 'various locations'}`,
      budget: (parseFloat(parts[8]) || 0) * (parseFloat(parts[9]) || 0),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}