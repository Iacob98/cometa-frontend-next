import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const project_id = searchParams.get('project_id');
    const activity_type = searchParams.get('activity_type');
    const date_from = searchParams.get('date_from');
    const date_to = searchParams.get('date_to');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const per_page = parseInt(searchParams.get('per_page') || '50');

    // Build WHERE clause
    const conditions = ['1=1'];

    if (user_id) {
      conditions.push(`al.user_id = '${user_id}'`);
    }
    if (project_id) {
      conditions.push(`al.project_id = '${project_id}'`);
    }
    if (activity_type) {
      conditions.push(`al.activity_type = '${activity_type}'`);
    }
    if (date_from) {
      conditions.push(`al.timestamp >= '${date_from}'`);
    }
    if (date_to) {
      conditions.push(`al.timestamp <= '${date_to}'`);
    }
    if (search) {
      conditions.push(`(al.description ILIKE '%${search}%' OR al.activity_type ILIKE '%${search}%')`);
    }

    const whereClause = conditions.length > 1 ? 'WHERE ' + conditions.join(' AND ') : '';
    const offset = (page - 1) * per_page;

    // Main query to get activities with user and project details
    const activitiesQuery = `
      SELECT
        al.id,
        al.user_id,
        al.project_id,
        al.activity_type,
        al.description,
        al.target_type,
        al.target_id,
        al.extra_data,
        al.timestamp,
        al.ip_address,
        al.user_agent,
        u.first_name || ' ' || u.last_name as user_name,
        u.email as user_email,
        u.role as user_role,
        p.name as project_name
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN projects p ON al.project_id = p.id
      ${whereClause}
      ORDER BY al.timestamp DESC
      LIMIT ${per_page} OFFSET ${offset}
    `;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN projects p ON al.project_id = p.id
      ${whereClause}
    `;

    const [activitiesResult, countResult] = await Promise.all([
      execAsync(`docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${activitiesQuery}"`),
      execAsync(`docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${countQuery}"`)
    ]);

    const activities = [];
    const lines = activitiesResult.stdout.trim().split('\n').filter(line => line.trim());

    for (const line of lines) {
      const parts = line.split('|').map(part => part.trim());
      if (parts.length >= 10) {
        activities.push({
          id: parts[0],
          user_id: parts[1] || null,
          project_id: parts[2] || null,
          activity_type: parts[3],
          description: parts[4],
          target_type: parts[5] || null,
          target_id: parts[6] || null,
          extra_data: parts[7] ? JSON.parse(parts[7]) : null,
          timestamp: parts[8],
          ip_address: parts[9] || null,
          user_agent: parts[10] || null,
          user: parts[11] ? {
            id: parts[1],
            name: parts[11],
            email: parts[12] || null,
            role: parts[13] || null
          } : null,
          project: parts[14] ? {
            id: parts[2],
            name: parts[14]
          } : null
        });
      }
    }

    const total = parseInt(countResult.stdout.trim()) || 0;
    const total_pages = Math.ceil(total / per_page);

    return NextResponse.json({
      activities,
      total,
      page,
      per_page,
      total_pages,
    });
  } catch (error) {
    console.error('Activities API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      project_id,
      activity_type,
      description,
      target_type,
      target_id,
      extra_data,
      ip_address,
      user_agent,
    } = body;

    // Validation
    if (!user_id || !activity_type || !description) {
      return NextResponse.json(
        { error: 'User ID, activity type, and description are required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const userCheckQuery = `SELECT id FROM users WHERE id = '${user_id}'`;
    const userCheckResult = await execAsync(
      `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${userCheckQuery}"`
    );

    if (!userCheckResult.stdout.trim()) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 400 }
      );
    }

    const activityId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    const insertActivityQuery = `
      INSERT INTO activity_logs (
        id, user_id, project_id, activity_type, description,
        target_type, target_id, extra_data, timestamp, ip_address, user_agent
      ) VALUES (
        '${activityId}',
        '${user_id}',
        ${project_id ? `'${project_id}'` : 'NULL'},
        '${activity_type}',
        '${description.replace(/'/g, "''")}',
        ${target_type ? `'${target_type}'` : 'NULL'},
        ${target_id ? `'${target_id}'` : 'NULL'},
        ${extra_data ? `'${JSON.stringify(extra_data).replace(/'/g, "''")}'` : 'NULL'},
        '${timestamp}',
        ${ip_address ? `'${ip_address}'` : 'NULL'},
        ${user_agent ? `'${user_agent.replace(/'/g, "''")}'` : 'NULL'}
      )
    `;

    await execAsync(
      `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${insertActivityQuery}"`
    );

    // Get user name for response
    const userQuery = `SELECT first_name, last_name FROM users WHERE id = '${user_id}'`;
    const userResult = await execAsync(
      `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${userQuery}"`
    );

    const userParts = userResult.stdout.trim().split('|').map(part => part.trim());
    const userName = userParts.length >= 2 ? `${userParts[0]} ${userParts[1]}` : 'Unknown User';

    return NextResponse.json({
      id: activityId,
      activity_type,
      user_name: userName,
      timestamp,
      message: 'Activity logged successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Log activity error:', error);
    return NextResponse.json(
      { error: 'Failed to log activity' },
      { status: 500 }
    );
  }
}