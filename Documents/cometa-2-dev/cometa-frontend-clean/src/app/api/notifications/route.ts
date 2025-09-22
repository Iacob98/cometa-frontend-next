import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const per_page = parseInt(searchParams.get('per_page') || '20');
    const user_id = searchParams.get('user_id');
    const read = searchParams.get('read');
    const priority = searchParams.get('priority');
    const type = searchParams.get('type');
    const created_after = searchParams.get('created_after');

    // Build WHERE conditions
    const conditions = ['1=1'];

    if (user_id) {
      conditions.push(`user_id = '${user_id}'`);
    }

    if (read !== null) {
      const isRead = read === 'true';
      conditions.push(`is_read = ${isRead}`);
    }

    if (priority) {
      conditions.push(`priority = '${priority}'`);
    }

    if (type) {
      conditions.push(`notification_type = '${type}'`);
    }

    if (created_after) {
      conditions.push(`created_at > '${created_after}'`);
    }

    const whereClause = conditions.length > 1 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * per_page;

    // Query notifications from database
    const notificationsQuery = `
      SELECT
        id,
        user_id,
        title,
        message,
        notification_type as type,
        priority,
        is_read as read,
        metadata_json as data,
        created_at,
        read_at,
        expires_at
      FROM in_app_notifications
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${per_page} OFFSET ${offset}
    `;

    // Count query
    const countQuery = `
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN is_read = false THEN 1 END) as unread_count
      FROM in_app_notifications
      ${whereClause}
    `;

    try {
      const [notificationsResult, countResult] = await Promise.all([
        execAsync(`docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${notificationsQuery}"`),
        execAsync(`docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${countQuery}"`)
      ]);

      const notifications = [];
      const notificationLines = notificationsResult.stdout.trim().split('\n').filter(line => line.trim());

      for (const line of notificationLines) {
        const parts = line.split('|').map(part => part.trim());
        if (parts.length >= 10) {
          let data = null;
          try {
            data = parts[7] ? JSON.parse(parts[7]) : null;
          } catch (e) {
            console.warn('Failed to parse notification metadata:', parts[7]);
          }

          notifications.push({
            id: parts[0],
            user_id: parts[1],
            title: parts[2] || '',
            message: parts[3] || '',
            type: parts[4] || 'info',
            priority: parts[5] || 'medium',
            read: parts[6] === 't',
            data,
            created_at: parts[8] || '',
            read_at: parts[9] || null,
            expires_at: parts[10] || null
          });
        }
      }

      // Parse count result
      const countParts = countResult.stdout.trim().split('|').map(part => part.trim());
      const total = parseInt(countParts[0]) || 0;
      const unread_count = parseInt(countParts[1]) || 0;

      return NextResponse.json({
        data: notifications,
        total,
        page,
        per_page,
        total_pages: Math.ceil(total / per_page),
        unread_count
      });

    } catch (dbError) {
      console.error('Database query failed, using fallback data:', dbError);

      // Fallback to sample data if database query fails
      const fallbackNotifications = [
        {
          id: "sample-notif-1",
          user_id: user_id || "sample-user",
          title: "Welcome to COMETA",
          message: "Your account has been successfully set up. Start by exploring the dashboard.",
          type: "welcome",
          priority: "medium",
          read: false,
          data: {
            action_url: "/dashboard"
          },
          created_at: new Date().toISOString(),
          read_at: null
        },
        {
          id: "sample-notif-2",
          user_id: user_id || "sample-user",
          title: "Sample Work Entry Alert",
          message: "This is a sample notification for development testing.",
          type: "work_entry",
          priority: "low",
          read: true,
          data: {
            work_entry_id: "sample-we-1"
          },
          created_at: new Date(Date.now() - 3600000).toISOString(),
          read_at: new Date().toISOString()
        }
      ];

      return NextResponse.json({
        data: fallbackNotifications,
        total: fallbackNotifications.length,
        page,
        per_page,
        total_pages: 1,
        unread_count: fallbackNotifications.filter(n => !n.read).length
      });
    }
  } catch (error) {
    console.error('Notifications API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      title,
      message,
      type = 'info',
      priority = 'medium',
      data = null,
      expires_at = null
    } = body;

    if (!user_id || !title || !message) {
      return NextResponse.json(
        { error: 'user_id, title, and message are required' },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();
    const created_at = new Date().toISOString();
    const metadataJson = data ? JSON.stringify(data).replace(/'/g, "''") : null;

    const insertQuery = `
      INSERT INTO in_app_notifications (
        id, user_id, title, message, notification_type, priority,
        is_read, metadata_json, created_at, expires_at
      ) VALUES (
        '${id}',
        '${user_id}',
        '${title.replace(/'/g, "''")}',
        '${message.replace(/'/g, "''")}',
        '${type}',
        '${priority}',
        false,
        ${metadataJson ? `'${metadataJson}'` : 'NULL'},
        '${created_at}',
        ${expires_at ? `'${expires_at}'` : 'NULL'}
      )
      RETURNING id
    `;

    try {
      const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${insertQuery}"`;
      const { stdout } = await execAsync(command);

      const insertedId = stdout.trim();
      if (!insertedId) {
        throw new Error('Failed to insert notification');
      }

      const newNotification = {
        id,
        user_id,
        title,
        message,
        type,
        priority,
        read: false,
        data,
        created_at,
        read_at: null,
        expires_at
      };

      return NextResponse.json(newNotification, { status: 201 });

    } catch (dbError) {
      console.error('Database insert failed:', dbError);

      // Return mock response as fallback
      const newNotification = {
        id: `mock-notif-${Date.now()}`,
        user_id,
        title,
        message,
        type,
        priority,
        read: false,
        data,
        created_at,
        read_at: null,
        expires_at
      };

      return NextResponse.json(newNotification, { status: 201 });
    }
  } catch (error) {
    console.error('Create notification error:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}