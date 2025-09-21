import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    if (!projectId) {
      return NextResponse.json(
        { error: 'project_id is required' },
        { status: 400 }
      );
    }

    const query = `
      SELECT
        c.id,
        c.code,
        c.name,
        c.address,
        COUNT(s.id) as segment_count,
        COALESCE(SUM(s.length_planned_m), 0) as total_length
      FROM cabinets c
      LEFT JOIN segments s ON c.id = s.cabinet_id
      WHERE c.project_id = '${projectId}'
      GROUP BY c.id, c.code, c.name, c.address
      ORDER BY c.code
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${query}" -t -A -F'|'`;
    const { stdout } = await execAsync(command);

    const cabinets = stdout
      .trim()
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [id, code, name, address, segment_count, total_length] = line.split('|');
        return {
          id,
          code,
          name,
          address: address || null,
          notes: null, // Notes field doesn't exist in DB
          status: 'planned', // Status field doesn't exist in DB
          segment_count: parseInt(segment_count) || 0,
          total_length: parseFloat(total_length) || 0
        };
      });

    return NextResponse.json(cabinets);
  } catch (error) {
    console.error('Zone layout cabinets API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cabinets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const { project_id, code, name, address, notes } = data;

    if (!project_id || !code || !name) {
      return NextResponse.json(
        { error: 'project_id, code, and name are required' },
        { status: 400 }
      );
    }

    const insertQuery = `
      INSERT INTO cabinets (id, project_id, code, name, address)
      VALUES (
        gen_random_uuid(),
        '${project_id}',
        '${code.replace(/'/g, "''")}',
        '${name.replace(/'/g, "''")}',
        ${address ? `'${address.replace(/'/g, "''")}'` : 'NULL'}
      )
      RETURNING id
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${insertQuery}" -t -A`;
    const { stdout } = await execAsync(command);

    const cabinetId = stdout.trim().split('\n')[0];

    return NextResponse.json({
      success: true,
      cabinet_id: cabinetId,
      message: `Cabinet ${code} created successfully`,
    });
  } catch (error) {
    console.error('Create cabinet API error:', error);
    return NextResponse.json(
      { error: 'Failed to create cabinet' },
      { status: 500 }
    );
  }
}