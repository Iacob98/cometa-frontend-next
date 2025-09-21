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
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const housingQuery = `
      SELECT
        id,
        address,
        rooms_total,
        beds_total,
        rent_daily_eur,
        status
      FROM housing_units
      WHERE project_id = '${projectId}'
      ORDER BY address
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${housingQuery}"`;
    const result = await execAsync(command);

    const housingUnits = [];
    const lines = result.stdout.trim().split('\n').filter(line => line.trim());

    for (const line of lines) {
      const parts = line.split('|').map(part => part.trim());
      if (parts.length >= 6) {
        housingUnits.push({
          id: parts[0],
          address: parts[1],
          rooms_total: parseInt(parts[2]) || 0,
          beds_total: parseInt(parts[3]) || 0,
          rent_daily_eur: parseFloat(parts[4]) || 0,
          status: parts[5],
        });
      }
    }

    return NextResponse.json(housingUnits);
  } catch (error) {
    console.error('Housing API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch housing units' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      project_id,
      address,
      rooms_total,
      beds_total,
      rent_daily_eur,
      status,
    } = body;

    if (!project_id || !address || !rooms_total || !beds_total || !rent_daily_eur || !status) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const housingId = crypto.randomUUID();
    const createHousingQuery = `
      INSERT INTO housing_units (
        id, project_id, address, rooms_total, beds_total, rent_daily_eur, status
      ) VALUES (
        '${housingId}',
        '${project_id}',
        '${address.replace(/'/g, "''")}',
        ${rooms_total},
        ${beds_total},
        ${rent_daily_eur},
        '${status}'
      )
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${createHousingQuery}"`;
    await execAsync(command);

    return NextResponse.json({
      success: true,
      housing_id: housingId,
      message: 'Housing unit created successfully',
    });
  } catch (error) {
    console.error('Create housing unit error:', error);
    return NextResponse.json(
      { error: 'Failed to create housing unit' },
      { status: 500 }
    );
  }
}