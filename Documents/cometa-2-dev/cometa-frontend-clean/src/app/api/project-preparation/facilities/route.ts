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

    const facilitiesQuery = `
      SELECT
        f.id,
        f.type,
        f.rent_daily_eur,
        f.service_freq,
        f.status,
        f.start_date,
        f.end_date,
        f.location_text,
        s.name as supplier_name
      FROM facilities f
      LEFT JOIN suppliers s ON f.supplier_id = s.id
      WHERE f.project_id = '${projectId}'
      ORDER BY f.type, f.start_date
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${facilitiesQuery}"`;
    const result = await execAsync(command);

    const facilities = [];
    const lines = result.stdout.trim().split('\n').filter(line => line.trim());

    for (const line of lines) {
      const parts = line.split('|').map(part => part.trim());
      if (parts.length >= 9) {
        facilities.push({
          id: parts[0],
          type: parts[1],
          rent_daily_eur: parseFloat(parts[2]) || 0,
          service_freq: parts[3] || null,
          status: parts[4],
          start_date: parts[5] || null,
          end_date: parts[6] || null,
          location_text: parts[7] || null,
          supplier_name: parts[8] || null,
        });
      }
    }

    return NextResponse.json(facilities);
  } catch (error) {
    console.error('Facilities API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch facilities' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      project_id,
      type,
      supplier_id,
      rent_daily_eur,
      service_freq,
      status,
      start_date,
      end_date,
      location_text,
    } = body;

    if (!project_id || !type || !rent_daily_eur || !status) {
      return NextResponse.json(
        { error: 'Project ID, type, rent daily EUR, and status are required' },
        { status: 400 }
      );
    }

    const facilityId = crypto.randomUUID();
    const createFacilityQuery = `
      INSERT INTO facilities (
        id, project_id, type, supplier_id, rent_daily_eur, service_freq,
        status, start_date, end_date, location_text
      ) VALUES (
        '${facilityId}',
        '${project_id}',
        '${type.replace(/'/g, "''")}',
        ${supplier_id ? `'${supplier_id}'` : 'NULL'},
        ${rent_daily_eur},
        ${service_freq ? `'${service_freq.replace(/'/g, "''")}'` : 'NULL'},
        '${status}',
        ${start_date ? `'${start_date}'` : 'NULL'},
        ${end_date ? `'${end_date}'` : 'NULL'},
        ${location_text ? `'${location_text.replace(/'/g, "''")}'` : 'NULL'}
      )
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${createFacilityQuery}"`;
    await execAsync(command);

    return NextResponse.json({
      success: true,
      facility_id: facilityId,
      message: 'Facility created successfully',
    });
  } catch (error) {
    console.error('Create facility error:', error);
    return NextResponse.json(
      { error: 'Failed to create facility' },
      { status: 500 }
    );
  }
}