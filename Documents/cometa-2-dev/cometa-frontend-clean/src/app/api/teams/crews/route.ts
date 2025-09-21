import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const project_id = searchParams.get('project_id');

    // Build WHERE clause
    const conditions = [];
    if (project_id) {
      conditions.push(`c.project_id = '${project_id}'`);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    // Main query to get crews with foreman details
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
      ${whereClause}
      ORDER BY c.name;
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${sqlQuery}"`;
    const { stdout } = await execAsync(command);

    const crews = [];
    const lines = stdout.trim().split('\n').filter(line => line.trim());

    for (const line of lines) {
      const parts = line.split('|').map(part => part.trim());
      if (parts.length >= 4) {
        const crewId = parts[0];

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
          WHERE cm.crew_id = '${crewId}';
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
          console.warn('Failed to fetch members for crew:', crewId);
        }

        const crew = {
          id: crewId,
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
          status: 'active', // Default status since not in schema
          description: `Work crew: ${parts[1] || 'Unnamed Crew'}`,
          skills: [], // Not in current schema
          location: {
            city: null,
            region: null
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        crews.push(crew);
      }
    }

    return NextResponse.json(crews);
  } catch (error) {
    console.error('Crews API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch crews' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, foreman_user_id, project_id, members = [] } = body;

    // Validation
    if (!name) {
      return NextResponse.json(
        { error: 'Crew name is required' },
        { status: 400 }
      );
    }

    // Insert new crew
    const insertCrewQuery = `
      INSERT INTO crews (id, name, foreman_user_id, project_id)
      VALUES (gen_random_uuid(), '${name}', ${foreman_user_id ? `'${foreman_user_id}'` : 'NULL'}, ${project_id ? `'${project_id}'` : 'NULL'})
      RETURNING id, name, foreman_user_id, project_id;
    `;

    const insertCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${insertCrewQuery}"`;
    const { stdout, stderr } = await execAsync(insertCommand);

    if (stderr) {
      console.error('Database insert error:', stderr);
      return NextResponse.json(
        { error: 'Failed to create crew' },
        { status: 500 }
      );
    }

    const result = stdout.trim();
    if (!result) {
      return NextResponse.json(
        { error: 'Failed to create crew' },
        { status: 500 }
      );
    }

    // Parse the result
    const parts = result.split('|').map(part => part.trim());
    if (parts.length < 2) {
      return NextResponse.json(
        { error: 'Crew created but data incomplete' },
        { status: 500 }
      );
    }

    const crewId = parts[0];

    // Add crew members if provided
    if (members.length > 0) {
      for (const member of members) {
        const { user_id, role_in_crew = 'worker' } = member;
        if (user_id) {
          const insertMemberQuery = `
            INSERT INTO crew_members (crew_id, user_id, role_in_crew, active_from)
            VALUES ('${crewId}', '${user_id}', '${role_in_crew}', CURRENT_DATE)
            ON CONFLICT (crew_id, user_id) DO NOTHING;
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

    // Fetch the created crew with all details
    const fetchQuery = `
      SELECT
        c.id,
        c.name,
        c.project_id,
        c.foreman_user_id,
        foreman.first_name || ' ' || foreman.last_name as foreman_name,
        foreman.email as foreman_email,
        foreman.phone as foreman_phone,
        p.name as project_name
      FROM crews c
      LEFT JOIN users foreman ON c.foreman_user_id = foreman.id
      LEFT JOIN projects p ON c.project_id = p.id
      WHERE c.id = '${crewId}';
    `;

    const fetchCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${fetchQuery}"`;
    const { stdout: fetchStdout } = await execAsync(fetchCommand);

    const fetchParts = fetchStdout.trim().split('|').map(part => part.trim());

    const newCrew = {
      id: crewId,
      name: fetchParts[1] || name,
      project_id: fetchParts[2] || null,
      foreman_user_id: fetchParts[3] || null,
      foreman: fetchParts[3] ? {
        id: fetchParts[3],
        full_name: fetchParts[4] || 'Unknown Foreman',
        email: fetchParts[5] || null,
        phone: fetchParts[6] || null
      } : null,
      project_name: fetchParts[7] || null,
      members: members,
      status: 'active',
      description: `Work crew: ${name}`,
      skills: [],
      location: {
        city: null,
        region: null
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return NextResponse.json(newCrew, { status: 201 });
  } catch (error) {
    console.error('Create crew error:', error);
    return NextResponse.json(
      { error: 'Failed to create crew' },
      { status: 500 }
    );
  }
}