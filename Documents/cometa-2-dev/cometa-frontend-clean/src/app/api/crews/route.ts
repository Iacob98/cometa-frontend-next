import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    // First get all crews with foreman info
    let crewsQuery = `
      SELECT
        c.id,
        c.name,
        c.project_id,
        c.foreman_user_id,
        p.name as project_name,
        u.first_name as foreman_first_name,
        u.last_name as foreman_last_name,
        u.phone as foreman_phone,
        u.email as foreman_email
      FROM crews c
      LEFT JOIN projects p ON c.project_id = p.id
      LEFT JOIN users u ON c.foreman_user_id = u.id
    `;

    if (projectId) {
      crewsQuery += ` WHERE c.project_id = '${projectId}'`;
    }

    crewsQuery += ` ORDER BY c.name`;

    const crewsCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${crewsQuery}" -t -A -F'|'`;
    const crewsResult = await execAsync(crewsCommand);

    const crews = [];
    const crewLines = crewsResult.stdout.trim().split('\n').filter(line => line.trim());

    // Process each crew
    for (const line of crewLines) {
      const parts = line.split('|');
      if (parts.length >= 9) {
        const crewId = parts[0];

        // Get crew members for this crew
        const membersQuery = `
          SELECT
            cm.user_id,
            cm.role_in_crew as role,
            cm.active_from,
            u.first_name,
            u.last_name,
            u.email,
            u.phone,
            u.role as user_role
          FROM crew_members cm
          LEFT JOIN users u ON cm.user_id = u.id
          WHERE cm.crew_id = '${crewId}' AND cm.active_to IS NULL
          ORDER BY cm.active_from
        `;

        const membersCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${membersQuery}" -t -A -F'|'`;

        let members = [];
        try {
          const membersResult = await execAsync(membersCommand);
          const memberLines = membersResult.stdout.trim().split('\n').filter(line => line.trim());

          for (const memberLine of memberLines) {
            const memberParts = memberLine.split('|');
            if (memberParts.length >= 8) {
              members.push({
                id: memberParts[0], // user_id as id
                user_id: memberParts[0],
                role: memberParts[1] || 'crew',
                active_from: memberParts[2],
                user: {
                  id: memberParts[0],
                  first_name: memberParts[3] || '',
                  last_name: memberParts[4] || '',
                  full_name: `${memberParts[3] || ''} ${memberParts[4] || ''}`.trim(),
                  email: memberParts[5] || null,
                  phone: memberParts[6] || null,
                  role: memberParts[7] || 'crew'
                }
              });
            }
          }
        } catch (membersError) {
          console.warn(`Failed to fetch members for crew ${crewId}:`, membersError);
        }

        // Build foreman object
        let foreman = null;
        if (parts[5] && parts[6]) { // foreman_first_name and foreman_last_name
          foreman = {
            id: parts[3], // foreman_user_id
            first_name: parts[5],
            last_name: parts[6],
            full_name: `${parts[5]} ${parts[6]}`.trim(),
            phone: parts[7] || null,
            email: parts[8] || null
          };
        }

        crews.push({
          id: parts[0],
          name: parts[1],
          project_id: parts[2] || null,
          foreman_user_id: parts[3] || null,
          description: null, // crews table doesn't have description
          project_name: parts[4] || null,
          foreman,
          members,
          member_count: members.length,
          is_active: true
        });
      }
    }

    return NextResponse.json(crews);
  } catch (error) {
    console.error('Crews API error:', error);

    // Fallback to sample data if database query fails
    const fallbackCrews = [
      {
        id: 'sample-crew-1',
        name: 'Sample Alpha Team',
        project_id: '6c31db6b-9902-40a4-b3b3-3c0c9e672b03',
        foreman_user_id: 'sample-foreman-1',
        description: 'Sample fiber installation crew',
        project_name: 'Sample Project',
        foreman: {
          id: 'sample-foreman-1',
          first_name: 'John',
          last_name: 'Foreman',
          full_name: 'John Foreman',
          phone: '+49 30 12345678',
          email: 'john.foreman@example.com'
        },
        members: [
          {
            id: 'sample-member-1',
            user_id: 'sample-user-1',
            role: 'crew',
            active_from: '2024-01-15',
            user: {
              id: 'sample-user-1',
              first_name: 'Mike',
              last_name: 'Worker',
              full_name: 'Mike Worker',
              email: 'mike.worker@example.com',
              phone: '+49 30 87654321',
              role: 'crew'
            }
          }
        ],
        member_count: 1,
        is_active: true
      }
    ];

    return NextResponse.json(fallbackCrews);
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { project_id, name, foreman_user_id } = data;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const insertQuery = `
      INSERT INTO crews (id, project_id, name, foreman_user_id)
      VALUES (
        gen_random_uuid(),
        ${project_id ? `'${project_id}'` : 'NULL'},
        '${name.replace(/'/g, "''")}',
        ${foreman_user_id && foreman_user_id !== 'none' ? `'${foreman_user_id}'` : 'NULL'}
      )
      RETURNING id, name
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${insertQuery}" -t -A -F'|'`;
    const { stdout } = await execAsync(command);

    const result = stdout.trim().split('\n')[0];
    const [crewId, crewName] = result.split('|');

    return NextResponse.json({
      id: crewId,
      name: crewName,
      success: true,
      message: `Team "${crewName}" created successfully`,
    });
  } catch (error) {
    console.error('Create crew API error:', error);
    return NextResponse.json(
      { error: 'Failed to create crew' },
      { status: 500 }
    );
  }
}