import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    let crewsQuery = `
      SELECT
        c.id,
        c.name,
        c.project_id,
        c.foreman_user_id,
        p.name as project_name,
        u.first_name,
        u.last_name,
        COUNT(cm.user_id) as member_count
      FROM crews c
      LEFT JOIN projects p ON c.project_id = p.id
      LEFT JOIN users u ON c.foreman_user_id = u.id
      LEFT JOIN crew_members cm ON c.id = cm.crew_id AND cm.active_to IS NULL
    `;

    if (projectId) {
      crewsQuery += ` WHERE c.project_id = '${projectId}'`;
    }

    crewsQuery += `
      GROUP BY c.id, c.name, c.project_id, c.foreman_user_id, p.name, u.first_name, u.last_name
      ORDER BY c.name
    `;

    const crewsCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${crewsQuery}" -t -A -F'|'`;
    const result = await execAsync(crewsCommand);

    const crews = [];
    const lines = result.stdout.trim().split('\n').filter(line => line.trim());

    for (const line of lines) {
      const parts = line.split('|');
      if (parts.length >= 8) {
        crews.push({
          id: parts[0],
          name: parts[1],
          project_id: parts[2] || null,
          foreman_user_id: parts[3] || null,
          project_name: parts[4] || null,
          foreman_name: parts[5] && parts[6] ? `${parts[5]} ${parts[6]}` : null,
          member_count: parseInt(parts[7]) || 0,
          is_active: true
        });
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
    const data = await request.json();
    const { project_id, name, foreman_id } = data;

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
        ${foreman_id && foreman_id !== 'none' ? `'${foreman_id}'` : 'NULL'}
      )
      RETURNING id
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${insertQuery}" -t -A`;
    const { stdout } = await execAsync(command);

    const crewId = stdout.trim().split('\n')[0];

    return NextResponse.json({
      success: true,
      crew_id: crewId,
      message: `Team "${name}" created successfully`,
    });
  } catch (error) {
    console.error('Create crew API error:', error);
    return NextResponse.json(
      { error: 'Failed to create crew' },
      { status: 500 }
    );
  }
}