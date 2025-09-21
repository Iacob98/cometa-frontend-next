import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Query to get project details with user name
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
        u.last_name as pm_last_name,
        u.email as pm_email
      FROM projects p
      LEFT JOIN users u ON p.pm_user_id = u.id
      WHERE p.id = '${id}';
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${sqlQuery}"`;
    const { stdout } = await execAsync(command);

    const result = stdout.trim();
    if (!result) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Parse result
    const parts = result.split('|').map(part => part.trim());
    if (parts.length < 15) {
      return NextResponse.json(
        { error: 'Invalid project data' },
        { status: 500 }
      );
    }

    const project = {
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
      manager_email: parts[15] || null,
      progress: Math.floor(Math.random() * 60 + 20), // Mock progress for now
      description: `Fiber optic construction project in ${parts[3] || 'various locations'}`, // Generated description
      budget: (parseFloat(parts[9]) || 0) * (parseFloat(parts[10]) || 0), // Calculate budget
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return NextResponse.json(project);
  } catch (error) {
    console.error('Project API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Build UPDATE query
    const updateFields = [];
    const allowedFields = ['name', 'customer', 'city', 'address', 'contact_24h', 'start_date', 'end_date_plan', 'status', 'total_length_m', 'base_rate_per_m'];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (typeof body[field] === 'string') {
          updateFields.push(`${field} = '${body[field]}'`);
        } else {
          updateFields.push(`${field} = ${body[field]}`);
        }
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const sqlQuery = `
      UPDATE projects
      SET ${updateFields.join(', ')}
      WHERE id = '${id}'
      RETURNING id;
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${sqlQuery}"`;
    const { stdout } = await execAsync(command);

    if (!stdout.trim()) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Return updated project
    return GET(request, { params: Promise.resolve({ id }) });
  } catch (error) {
    console.error('Update project error:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const sqlQuery = `DELETE FROM projects WHERE id = '${id}' RETURNING id;`;
    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${sqlQuery}"`;
    const { stdout } = await execAsync(command);

    if (!stdout.trim()) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}