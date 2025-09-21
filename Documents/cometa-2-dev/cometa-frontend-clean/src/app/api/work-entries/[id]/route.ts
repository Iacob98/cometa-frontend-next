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

    // Query to get work entry details with project and user names
    const sqlQuery = `
      SELECT
        we.id,
        we.project_id,
        we.cabinet_id,
        we.segment_id,
        we.cut_id,
        we.house_id,
        we.crew_id,
        we.user_id,
        we.date,
        we.stage_code,
        we.meters_done_m,
        we.method,
        we.width_m,
        we.depth_m,
        we.cables_count,
        we.has_protection_pipe,
        we.soil_type,
        we.notes,
        we.approved_by,
        we.approved_at,
        p.name as project_name,
        cr.name as crew_name,
        u.first_name as worker_first_name,
        u.last_name as worker_last_name,
        app.first_name as approver_first_name,
        app.last_name as approver_last_name,
        cab.name as cabinet_name,
        seg.name as segment_name,
        cut.code as cut_name,
        h.address as house_address
      FROM work_entries we
      LEFT JOIN projects p ON we.project_id = p.id
      LEFT JOIN crews cr ON we.crew_id = cr.id
      LEFT JOIN users u ON we.user_id = u.id
      LEFT JOIN users app ON we.approved_by = app.id
      LEFT JOIN cabinets cab ON we.cabinet_id = cab.id
      LEFT JOIN segments seg ON we.segment_id = seg.id
      LEFT JOIN cuts cut ON we.cut_id = cut.id
      LEFT JOIN houses h ON we.house_id = h.id
      WHERE we.id = '${id}';
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${sqlQuery}"`;
    const { stdout } = await execAsync(command);

    const result = stdout.trim();
    if (!result) {
      return NextResponse.json(
        { error: 'Work entry not found' },
        { status: 404 }
      );
    }

    // Parse result
    const parts = result.split('|').map(part => part.trim());

    const workEntry = {
      id: parts[0],
      project_id: parts[1],
      cabinet_id: parts[2] || null,
      segment_id: parts[3] || null,
      cut_id: parts[4] || null,
      house_id: parts[5] || null,
      crew_id: parts[6] || null,
      user_id: parts[7] || null,
      date: parts[8],
      stage_code: parts[9],
      meters_done_m: parseFloat(parts[10]) || 0,
      method: parts[11] || null,
      width_m: parseFloat(parts[12]) || null,
      depth_m: parseFloat(parts[13]) || null,
      cables_count: parseInt(parts[14]) || null,
      has_protection_pipe: parts[15] === 't',
      soil_type: parts[16] || null,
      notes: parts[17] || null,
      approved_by: parts[18] || null,
      approved_at: parts[19] || null,
      project_name: parts[20] || null,
      crew_name: parts[21] || null,
      worker_name: parts[22] && parts[23] ? `${parts[22]} ${parts[23]}` : null,
      approver_name: parts[24] && parts[25] ? `${parts[24]} ${parts[25]}` : null,
      cabinet_name: parts[26] || null,
      segment_name: parts[27] || null,
      cut_name: parts[28] || null,
      house_address: parts[29] || null,
    };

    return NextResponse.json(workEntry);
  } catch (error) {
    console.error('Work entry API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch work entry' },
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

    // Check if work entry exists and is not approved
    const checkQuery = `
      SELECT id, approved_by
      FROM work_entries
      WHERE id = '${id}'
    `;
    const checkResult = await execAsync(
      `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${checkQuery}"`
    );

    if (!checkResult.stdout.trim()) {
      return NextResponse.json(
        { error: 'Work entry not found' },
        { status: 404 }
      );
    }

    const checkParts = checkResult.stdout.trim().split('|').map(part => part.trim());
    const approvedBy = checkParts[1];

    // Prevent editing of approved work entries
    if (approvedBy && approvedBy !== '') {
      return NextResponse.json(
        { error: 'Cannot edit approved work entry' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (body.project_id && body.date && body.stage_code && body.meters_done_m !== undefined) {
      // Validate method
      const validMethods = ['mole', 'hand', 'excavator', 'trencher', 'documentation'];
      if (body.method && !validMethods.includes(body.method)) {
        return NextResponse.json(
          { error: 'Invalid work method' },
          { status: 400 }
        );
      }

      // Validate meters_done_m is positive
      if (parseFloat(body.meters_done_m) < 0) {
        return NextResponse.json(
          { error: 'Meters done must be positive' },
          { status: 400 }
        );
      }
    }

    // Build UPDATE query
    const updateFields = [];
    const allowedFields = [
      'project_id', 'cabinet_id', 'segment_id', 'cut_id', 'house_id',
      'crew_id', 'user_id', 'date', 'stage_code', 'meters_done_m',
      'method', 'width_m', 'depth_m', 'cables_count',
      'has_protection_pipe', 'soil_type', 'notes'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (body[field] === null || body[field] === '') {
          updateFields.push(`${field} = NULL`);
        } else if (typeof body[field] === 'string') {
          updateFields.push(`${field} = '${body[field].replace(/'/g, "''")}'`);
        } else if (typeof body[field] === 'boolean') {
          updateFields.push(`${field} = ${body[field] ? 'TRUE' : 'FALSE'}`);
        } else {
          updateFields.push(`${field} = ${body[field]}`);
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
      UPDATE work_entries
      SET ${updateFields.join(', ')}
      WHERE id = '${id}'
      RETURNING id;
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${sqlQuery}"`;
    const { stdout } = await execAsync(command);

    if (!stdout.trim()) {
      return NextResponse.json(
        { error: 'Work entry not found' },
        { status: 404 }
      );
    }

    // Return updated work entry
    return GET(request, { params });
  } catch (error) {
    console.error('Update work entry error:', error);
    return NextResponse.json(
      { error: 'Failed to update work entry' },
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

    // Check if work entry exists and is not approved
    const checkQuery = `
      SELECT id, approved_by, approved_at
      FROM work_entries
      WHERE id = '${id}'
    `;
    const checkResult = await execAsync(
      `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${checkQuery}"`
    );

    if (!checkResult.stdout.trim()) {
      return NextResponse.json(
        { error: 'Work entry not found' },
        { status: 404 }
      );
    }

    const parts = checkResult.stdout.trim().split('|').map(part => part.trim());
    const approvedBy = parts[1];

    // Prevent deletion of approved work entries
    if (approvedBy && approvedBy !== '') {
      return NextResponse.json(
        { error: 'Cannot delete approved work entry' },
        { status: 400 }
      );
    }

    const deleteQuery = `DELETE FROM work_entries WHERE id = '${id}'`;
    await execAsync(
      `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${deleteQuery}"`
    );

    return NextResponse.json({
      success: true,
      message: 'Work entry deleted successfully',
    });
  } catch (error) {
    console.error('Delete work entry error:', error);
    return NextResponse.json(
      { error: 'Failed to delete work entry' },
      { status: 500 }
    );
  }
}