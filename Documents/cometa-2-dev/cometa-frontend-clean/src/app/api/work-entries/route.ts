import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const crewId = searchParams.get('crew_id');
    const userId = searchParams.get('user_id');
    const stageCode = searchParams.get('stage_code');
    const approved = searchParams.get('approved');
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '20');

    let whereConditions = ['1=1'];

    if (projectId) {
      whereConditions.push(`we.project_id = '${projectId}'`);
    }
    if (crewId) {
      whereConditions.push(`we.crew_id = '${crewId}'`);
    }
    if (userId) {
      whereConditions.push(`we.user_id = '${userId}'`);
    }
    if (stageCode) {
      whereConditions.push(`we.stage_code = '${stageCode}'`);
    }
    if (approved === 'true') {
      whereConditions.push(`we.approved_by IS NOT NULL`);
    } else if (approved === 'false') {
      whereConditions.push(`we.approved_by IS NULL`);
    }

    const whereClause = whereConditions.length > 1 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    const offset = (page - 1) * perPage;

    // Get work entries with related data
    const workEntriesQuery = `
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
      ${whereClause}
      ORDER BY we.date DESC, we.id DESC
      LIMIT ${perPage} OFFSET ${offset}
    `;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM work_entries we
      ${whereClause}
    `;

    const [workEntriesResult, countResult] = await Promise.all([
      execAsync(`docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${workEntriesQuery}"`),
      execAsync(`docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${countQuery}"`)
    ]);

    const workEntries = [];
    const lines = workEntriesResult.stdout.trim().split('\n').filter(line => line.trim());

    for (const line of lines) {
      const parts = line.split('|').map(part => part.trim());
      if (parts.length >= 20) {
        workEntries.push({
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
        });
      }
    }

    const total = parseInt(countResult.stdout.trim()) || 0;
    const totalPages = Math.ceil(total / perPage);

    return NextResponse.json({
      items: workEntries,
      total,
      page,
      per_page: perPage,
      total_pages: totalPages,
    });
  } catch (error) {
    console.error('Work entries API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch work entries' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      project_id,
      cabinet_id,
      segment_id,
      cut_id,
      house_id,
      crew_id,
      user_id,
      date,
      stage_code,
      meters_done_m,
      method,
      width_m,
      depth_m,
      cables_count,
      has_protection_pipe,
      soil_type,
      notes,
    } = body;

    if (!project_id || !date || !stage_code || meters_done_m === undefined) {
      return NextResponse.json(
        { error: 'Project ID, date, stage code, and meters done are required' },
        { status: 400 }
      );
    }

    // Validate method
    const validMethods = ['mole', 'hand', 'excavator', 'trencher', 'documentation'];
    if (method && !validMethods.includes(method)) {
      return NextResponse.json(
        { error: 'Invalid work method' },
        { status: 400 }
      );
    }

    // Validate meters_done_m is positive
    if (parseFloat(meters_done_m) < 0) {
      return NextResponse.json(
        { error: 'Meters done must be positive' },
        { status: 400 }
      );
    }

    const workEntryId = crypto.randomUUID();
    const createWorkEntryQuery = `
      INSERT INTO work_entries (
        id, project_id, cabinet_id, segment_id, cut_id, house_id,
        crew_id, user_id, date, stage_code, meters_done_m, method,
        width_m, depth_m, cables_count, has_protection_pipe, soil_type, notes
      ) VALUES (
        '${workEntryId}',
        '${project_id}',
        ${cabinet_id ? `'${cabinet_id}'` : 'NULL'},
        ${segment_id ? `'${segment_id}'` : 'NULL'},
        ${cut_id ? `'${cut_id}'` : 'NULL'},
        ${house_id ? `'${house_id}'` : 'NULL'},
        ${crew_id ? `'${crew_id}'` : 'NULL'},
        ${user_id ? `'${user_id}'` : 'NULL'},
        '${date}',
        '${stage_code}',
        ${meters_done_m},
        ${method ? `'${method}'` : 'NULL'},
        ${width_m ? width_m : 'NULL'},
        ${depth_m ? depth_m : 'NULL'},
        ${cables_count ? cables_count : 'NULL'},
        ${has_protection_pipe ? 'TRUE' : 'FALSE'},
        ${soil_type ? `'${soil_type.replace(/'/g, "''")}'` : 'NULL'},
        ${notes ? `'${notes.replace(/'/g, "''")}'` : 'NULL'}
      )
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${createWorkEntryQuery}"`;
    await execAsync(command);

    return NextResponse.json({
      success: true,
      work_entry_id: workEntryId,
      message: 'Work entry created successfully',
    });
  } catch (error) {
    console.error('Create work entry error:', error);
    return NextResponse.json(
      { error: 'Failed to create work entry' },
      { status: 500 }
    );
  }
}