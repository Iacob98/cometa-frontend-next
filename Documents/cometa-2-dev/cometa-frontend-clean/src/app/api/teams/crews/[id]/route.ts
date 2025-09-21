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

    // Main query to get crew with foreman details
    const sqlQuery = `
      SELECT
        c.id,
        c.name,
        c.project_id,
        c.foreman_user_id,
        foreman.first_name || ' ' || foreman.last_name as foreman_name,
        foreman.email as foreman_email,
        foreman.phone as foreman_phone,
        foreman.role as foreman_role,
        p.name as project_name
      FROM crews c
      LEFT JOIN users foreman ON c.foreman_user_id = foreman.id
      LEFT JOIN projects p ON c.project_id = p.id
      WHERE c.id = '${id}';
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${sqlQuery}"`;
    const { stdout } = await execAsync(command);

    const result = stdout.trim();
    if (!result) {
      return NextResponse.json(
        { error: 'Crew not found' },
        { status: 404 }
      );
    }

    const parts = result.split('|').map(part => part.trim());

    // Get crew members
    const membersQuery = `
      SELECT
        cm.user_id,
        cm.role_in_crew,
        u.first_name || ' ' || u.last_name as user_name,
        u.email as user_email,
        u.phone as user_phone,
        u.role as user_role
      FROM crew_members cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.crew_id = '${id}';
    `;

    const membersCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${membersQuery}"`;
    let members = [];

    try {
      const { stdout: membersStdout } = await execAsync(membersCommand);
      const memberLines = membersStdout.trim().split('\n').filter(line => line.trim());

      members = memberLines.map(memberLine => {
        const memberParts = memberLine.split('|').map(part => part.trim());
        return {
          id: `member-${memberParts[0]}`,
          user_id: memberParts[0],
          role_in_crew: memberParts[1],
          user: {
            id: memberParts[0],
            full_name: memberParts[2] || 'Unknown',
            email: memberParts[3] || null,
            phone: memberParts[4] || null,
            role: memberParts[5] || null
          }
        };
      });
    } catch (error) {
      console.warn('Failed to fetch members for crew:', id);
    }

    const crew = {
      id: parts[0],
      name: parts[1] || 'Unnamed Crew',
      project_id: parts[2] || null,
      foreman_user_id: parts[3] || null,
      foreman: parts[3] ? {
        id: parts[3],
        full_name: parts[4] || 'Unknown Foreman',
        email: parts[5] || null,
        phone: parts[6] || null,
        role: parts[7] || null
      } : null,
      project_name: parts[8] || null,
      members: members,
      status: 'active',
      description: `Work crew: ${parts[1] || 'Unnamed Crew'}`,
      skills: [],
      location: {
        city: null,
        region: null
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return NextResponse.json(crew);
  } catch (error) {
    console.error('Crew API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch crew' },
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
    const allowedFields = ['name', 'foreman_user_id', 'project_id'];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (body[field] === null) {
          updateFields.push(`${field} = NULL`);
        } else {
          updateFields.push(`${field} = '${body[field]}'`);
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
      UPDATE crews
      SET ${updateFields.join(', ')}
      WHERE id = '${id}'
      RETURNING id;
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${sqlQuery}"`;
    const { stdout } = await execAsync(command);

    if (!stdout.trim()) {
      return NextResponse.json(
        { error: 'Crew not found' },
        { status: 404 }
      );
    }

    // Handle crew members update if provided
    if (body.members && Array.isArray(body.members)) {
      // First, remove existing members
      const deleteQuery = `DELETE FROM crew_members WHERE crew_id = '${id}';`;
      const deleteCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${deleteQuery}"`;
      await execAsync(deleteCommand);

      // Add new members
      for (const member of body.members) {
        const { user_id, role_in_crew = 'worker' } = member;
        if (user_id) {
          const insertMemberQuery = `
            INSERT INTO crew_members (crew_id, user_id, role_in_crew, active_from)
            VALUES ('${id}', '${user_id}', '${role_in_crew}', CURRENT_DATE);
          `;

          const memberCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${insertMemberQuery}"`;
          try {
            await execAsync(memberCommand);
          } catch (error) {
            console.warn('Failed to add member to crew:', error);
          }
        }
      }
    }

    // Return updated crew
    return GET(request, { params });
  } catch (error) {
    console.error('Update crew error:', error);
    return NextResponse.json(
      { error: 'Failed to update crew' },
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

    const sqlQuery = `DELETE FROM crews WHERE id = '${id}' RETURNING id;`;
    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${sqlQuery}"`;
    const { stdout } = await execAsync(command);

    if (!stdout.trim()) {
      return NextResponse.json(
        { error: 'Crew not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Crew deleted successfully' });
  } catch (error) {
    console.error('Delete crew error:', error);
    return NextResponse.json(
      { error: 'Failed to delete crew' },
      { status: 500 }
    );
  }
}