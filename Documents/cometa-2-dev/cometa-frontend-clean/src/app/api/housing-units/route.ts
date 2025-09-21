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
        h.id,
        h.project_id,
        h.address,
        h.rooms_total,
        h.beds_total,
        h.rent_daily_eur,
        h.status
      FROM housing_units h
      WHERE h.project_id = '${projectId}'
      ORDER BY h.address
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${query}" -t -A -F'|'`;
    const { stdout } = await execAsync(command);

    const housingUnits = stdout
      .trim()
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [id, project_id, address, rooms_total, beds_total, rent_daily_eur, status] = line.split('|');
        return {
          id,
          project_id,
          address,
          rooms_total: parseInt(rooms_total) || 0,
          beds_total: parseInt(beds_total) || 0,
          rent_daily_eur: parseFloat(rent_daily_eur) || 0,
          status: status || 'available'
        };
      });

    return NextResponse.json(housingUnits);
  } catch (error) {
    console.error('Housing units API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch housing units' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const { project_id, address, rooms_total, beds_total, rent_daily_eur, status } = data;

    if (!project_id || !address || !rooms_total || !beds_total || !rent_daily_eur) {
      return NextResponse.json(
        { error: 'project_id, address, rooms_total, beds_total, and rent_daily_eur are required' },
        { status: 400 }
      );
    }

    const insertQuery = `
      INSERT INTO housing_units (id, project_id, address, rooms_total, beds_total, rent_daily_eur, status)
      VALUES (
        gen_random_uuid(),
        '${project_id}',
        '${address.replace(/'/g, "''")}',
        ${parseInt(rooms_total)},
        ${parseInt(beds_total)},
        ${parseFloat(rent_daily_eur)},
        '${status || 'available'}'
      )
      RETURNING id
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${insertQuery}" -t -A`;
    const { stdout } = await execAsync(command);

    const housingUnitId = stdout.trim().split('\n')[0];

    return NextResponse.json({
      success: true,
      housing_unit_id: housingUnitId,
      message: `Housing unit created successfully`,
    });
  } catch (error) {
    console.error('Create housing unit API error:', error);
    return NextResponse.json(
      { error: 'Failed to create housing unit' },
      { status: 500 }
    );
  }
}