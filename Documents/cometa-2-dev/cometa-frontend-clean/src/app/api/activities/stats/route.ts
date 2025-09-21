import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const project_id = searchParams.get('project_id');
    const date_from = searchParams.get('date_from');
    const date_to = searchParams.get('date_to');

    // Build WHERE clause for filters
    const conditions = ['1=1'];

    if (user_id) {
      conditions.push(`al.user_id = '${user_id}'`);
    }
    if (project_id) {
      conditions.push(`al.project_id = '${project_id}'`);
    }
    if (date_from) {
      conditions.push(`al.timestamp >= '${date_from}'`);
    }
    if (date_to) {
      conditions.push(`al.timestamp <= '${date_to}'`);
    }

    const whereClause = conditions.length > 1 ? 'WHERE ' + conditions.join(' AND ') : '';

    // Get total activities count
    const totalQuery = `
      SELECT COUNT(*) as total
      FROM activity_logs al
      ${whereClause}
    `;

    // Get activity types breakdown
    const typesQuery = `
      SELECT
        activity_type,
        COUNT(*) as count
      FROM activity_logs al
      ${whereClause}
      GROUP BY activity_type
      ORDER BY count DESC
    `;

    // Get most active users
    const usersQuery = `
      SELECT
        u.id,
        u.first_name || ' ' || u.last_name as user_name,
        u.role,
        COUNT(al.id) as activity_count
      FROM activity_logs al
      JOIN users u ON al.user_id = u.id
      ${whereClause}
      GROUP BY u.id, u.first_name, u.last_name, u.role
      ORDER BY activity_count DESC
      LIMIT 10
    `;

    // Get activity timeline for last 24 hours by hour
    const timelineQuery = `
      SELECT
        EXTRACT(hour FROM timestamp) as hour,
        COUNT(*) as count
      FROM activity_logs al
      ${whereClause.includes('WHERE') ? whereClause + ' AND' : 'WHERE'} al.timestamp >= NOW() - INTERVAL '24 hours'
      GROUP BY EXTRACT(hour FROM timestamp)
      ORDER BY hour
    `;

    // Get project activity if no specific project is filtered
    const projectsQuery = project_id ? '' : `
      SELECT
        p.id,
        p.name as project_name,
        COUNT(al.id) as activity_count
      FROM activity_logs al
      JOIN projects p ON al.project_id = p.id
      ${whereClause}
      GROUP BY p.id, p.name
      ORDER BY activity_count DESC
      LIMIT 10
    `;

    const queries = [
      execAsync(`docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${totalQuery}"`),
      execAsync(`docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${typesQuery}"`),
      execAsync(`docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${usersQuery}"`),
      execAsync(`docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${timelineQuery}"`)
    ];

    if (projectsQuery) {
      queries.push(execAsync(`docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${projectsQuery}"`));
    }

    const results = await Promise.all(queries);

    const [totalResult, typesResult, usersResult, timelineResult, projectsResult] = results;

    // Parse total activities
    const totalActivities = parseInt(totalResult.stdout.trim()) || 0;

    // Parse activity types
    const activityTypes = [];
    const typeLines = typesResult.stdout.trim().split('\n').filter(line => line.trim());
    for (const line of typeLines) {
      const parts = line.split('|').map(part => part.trim());
      if (parts.length >= 2) {
        const count = parseInt(parts[1]);
        activityTypes.push({
          activity_type: parts[0],
          count,
          percentage: totalActivities > 0 ? (count / totalActivities * 100) : 0
        });
      }
    }

    // Parse most active users
    const mostActiveUsers = [];
    const userLines = usersResult.stdout.trim().split('\n').filter(line => line.trim());
    for (const line of userLines) {
      const parts = line.split('|').map(part => part.trim());
      if (parts.length >= 4) {
        mostActiveUsers.push({
          user_id: parts[0],
          user_name: parts[1],
          role: parts[2],
          activity_count: parseInt(parts[3])
        });
      }
    }

    // Parse hourly timeline
    const hourlyTimeline = [];
    const timelineLines = timelineResult.stdout.trim().split('\n').filter(line => line.trim());
    for (const line of timelineLines) {
      const parts = line.split('|').map(part => part.trim());
      if (parts.length >= 2) {
        hourlyTimeline.push({
          hour: parseInt(parts[0]),
          activity_count: parseInt(parts[1])
        });
      }
    }

    // Parse project activity (if available)
    const projectActivity = [];
    if (projectsResult) {
      const projectLines = projectsResult.stdout.trim().split('\n').filter(line => line.trim());
      for (const line of projectLines) {
        const parts = line.split('|').map(part => part.trim());
        if (parts.length >= 3) {
          projectActivity.push({
            project_id: parts[0],
            project_name: parts[1],
            activity_count: parseInt(parts[2])
          });
        }
      }
    }

    return NextResponse.json({
      overview: {
        total_activities: totalActivities,
        unique_users: mostActiveUsers.length,
        activity_types_count: activityTypes.length,
        active_projects: projectActivity.length
      },
      activity_types: activityTypes,
      most_active_users: mostActiveUsers,
      hourly_timeline: hourlyTimeline,
      project_activity: projectActivity
    });
  } catch (error) {
    console.error('Activity stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity statistics' },
      { status: 500 }
    );
  }
}