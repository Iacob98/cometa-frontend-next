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
        s.id,
        s.cabinet_id,
        c.code as cabinet_code,
        s.name,
        s.length_planned_m,
        s.surface,
        s.area,
        s.depth_req_m,
        s.width_req_m,
        s.status
      FROM segments s
      JOIN cabinets c ON s.cabinet_id = c.id
      WHERE c.project_id = '${projectId}'
      ORDER BY c.code, s.name
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${query}" -t -A -F'|'`;
    const { stdout } = await execAsync(command);

    const segments = stdout
      .trim()
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [id, cabinet_id, cabinet_code, name, length_planned_m, surface, area, depth_req_m, width_req_m, status] = line.split('|');
        return {
          id,
          cabinet_id,
          cabinet_code,
          name,
          length_planned_m: parseFloat(length_planned_m) || 0,
          surface: surface || null,
          area: area || null,
          depth_req_m: parseFloat(depth_req_m) || 0,
          width_req_m: parseFloat(width_req_m) || 0,
          status: status || 'planned'
        };
      });

    return NextResponse.json(segments);
  } catch (error) {
    console.error('Zone layout segments API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch segments' },
      { status: 500 }
    );
  }
}