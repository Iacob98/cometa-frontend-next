import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const equipment_id = searchParams.get('equipment_id');
    const project_id = searchParams.get('project_id');
    const crew_id = searchParams.get('crew_id');
    const active_only = searchParams.get('active_only') === 'true';

    // Query for equipment assignments with related data
    let assignmentsQuery = `
      SELECT
        ea.id,
        ea.equipment_id,
        ea.project_id,
        ea.cabinet_id,
        ea.crew_id,
        ea.from_ts,
        ea.to_ts,
        ea.is_permanent,
        ea.rental_cost_per_day,
        e.name as equipment_name,
        e.type as equipment_type,
        e.inventory_no,
        p.name as project_name,
        c.name as crew_name
      FROM equipment_assignments ea
      LEFT JOIN equipment e ON ea.equipment_id = e.id
      LEFT JOIN projects p ON ea.project_id = p.id
      LEFT JOIN crews c ON ea.crew_id = c.id
      WHERE 1=1
    `;

    const conditions = [];

    // Add filters
    if (equipment_id) {
      conditions.push(`ea.equipment_id = '${equipment_id}'`);
    }
    if (project_id) {
      conditions.push(`ea.project_id = '${project_id}'`);
    }
    if (crew_id) {
      conditions.push(`ea.crew_id = '${crew_id}'`);
    }
    if (active_only) {
      conditions.push(`(ea.to_ts IS NULL OR ea.to_ts > NOW())`);
    }

    if (conditions.length > 0) {
      assignmentsQuery += ' AND ' + conditions.join(' AND ');
    }

    assignmentsQuery += ` ORDER BY ea.from_ts DESC`;

    const assignmentsCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${assignmentsQuery}"`;
    const result = await execAsync(assignmentsCommand);

    const assignments = [];
    const lines = result.stdout.trim().split('\n').filter(line => line.trim());

    for (const line of lines) {
      const parts = line.split('|').map(part => part.trim());
      if (parts.length >= 14) {
        assignments.push({
          id: parts[0],
          equipment_id: parts[1],
          project_id: parts[2],
          cabinet_id: parts[3] || null,
          crew_id: parts[4] || null,
          from_ts: parts[5],
          to_ts: parts[6] || null,
          is_permanent: parts[7] === 't',
          rental_cost_per_day: parseFloat(parts[8]) || 0,
          equipment: {
            name: parts[9],
            type: parts[10],
            inventory_no: parts[11] || null,
          },
          project_name: parts[12] || null,
          crew_name: parts[13] || null,
          is_active: !parts[6] || new Date(parts[6]) > new Date(),
        });
      }
    }

    return NextResponse.json(assignments);
  } catch (error) {
    console.error('Equipment assignments API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch equipment assignments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      equipment_id,
      project_id,
      cabinet_id,
      crew_id,
      from_ts,
      to_ts,
      is_permanent = false,
      rental_cost_per_day
    } = body;

    if (!equipment_id || !project_id || !from_ts) {
      return NextResponse.json(
        { error: 'Equipment ID, project ID, and start time are required' },
        { status: 400 }
      );
    }

    // Check if equipment exists and is available
    const equipmentCheckQuery = `
      SELECT status FROM equipment WHERE id = '${equipment_id}'
    `;

    const equipmentCheckCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${equipmentCheckQuery}"`;
    const equipmentResult = await execAsync(equipmentCheckCommand);

    if (!equipmentResult.stdout.trim()) {
      return NextResponse.json(
        { error: 'Equipment not found' },
        { status: 404 }
      );
    }

    const equipmentStatus = equipmentResult.stdout.trim();
    if (equipmentStatus === 'broken' || equipmentStatus === 'maintenance') {
      return NextResponse.json(
        { error: `Equipment is currently ${equipmentStatus} and cannot be assigned` },
        { status: 400 }
      );
    }

    // Check for conflicting assignments
    const conflictQuery = `
      SELECT COUNT(*) as count
      FROM equipment_assignments
      WHERE equipment_id = '${equipment_id}'
        AND (to_ts IS NULL OR to_ts > '${from_ts}')
        AND from_ts < '${to_ts || '2099-12-31'}'
    `;

    const conflictCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${conflictQuery}"`;
    const conflictResult = await execAsync(conflictCommand);
    const conflictCount = parseInt(conflictResult.stdout.trim()) || 0;

    if (conflictCount > 0) {
      return NextResponse.json(
        { error: 'Equipment is already assigned during this time period' },
        { status: 400 }
      );
    }

    // Create assignment
    const assignmentId = crypto.randomUUID();
    const createAssignmentQuery = `
      INSERT INTO equipment_assignments (
        id, equipment_id, project_id, cabinet_id, crew_id,
        from_ts, to_ts, is_permanent, rental_cost_per_day
      ) VALUES (
        '${assignmentId}',
        '${equipment_id}',
        '${project_id}',
        ${cabinet_id ? `'${cabinet_id}'` : 'NULL'},
        ${crew_id ? `'${crew_id}'` : 'NULL'},
        '${from_ts}',
        ${to_ts ? `'${to_ts}'` : 'NULL'},
        ${is_permanent},
        ${rental_cost_per_day || 'NULL'}
      )
    `;

    const createAssignmentCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${createAssignmentQuery}"`;
    await execAsync(createAssignmentCommand);

    // Update equipment status to in_use if assignment is active
    const now = new Date();
    const startTime = new Date(from_ts);
    const endTime = to_ts ? new Date(to_ts) : null;

    if (startTime <= now && (!endTime || endTime > now)) {
      const updateStatusQuery = `
        UPDATE equipment
        SET status = 'in_use'
        WHERE id = '${equipment_id}' AND status = 'available'
      `;

      const updateStatusCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${updateStatusQuery}"`;
      await execAsync(updateStatusCommand);
    }

    return NextResponse.json({
      success: true,
      assignment_id: assignmentId,
      message: 'Equipment assignment created successfully'
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    return NextResponse.json(
      { error: 'Failed to create equipment assignment' },
      { status: 500 }
    );
  }
}