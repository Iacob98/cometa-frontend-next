import { NextRequest, NextResponse } from 'next/server';

// Mock notifications data
const mockNotifications = [
  {
    id: "notif-001",
    user_id: "user-002",
    title: "New Work Entry Requires Approval",
    message: "Hans Mueller submitted a work entry for Project Downtown that needs your approval",
    type: "work_entry_approval",
    priority: "high",
    read: false,
    data: {
      work_entry_id: "we-003",
      project_id: "proj-001",
      worker_name: "Hans Mueller"
    },
    created_at: "2024-09-20T16:30:00Z",
    read_at: null
  },
  {
    id: "notif-002",
    user_id: "user-002",
    title: "Material Stock Alert",
    message: "Emergency Repair Kit is running low (8 units remaining, minimum: 10)",
    type: "low_stock",
    priority: "urgent",
    read: false,
    data: {
      material_id: "mat-006",
      material_name: "Emergency Repair Kit",
      current_stock: 8,
      min_stock: 10
    },
    created_at: "2024-09-20T15:45:00Z",
    read_at: null
  },
  {
    id: "notif-003",
    user_id: "user-002",
    title: "Project Milestone Completed",
    message: "Fiber Network Downtown has reached 75% completion milestone",
    type: "milestone",
    priority: "medium",
    read: true,
    data: {
      project_id: "proj-001",
      milestone: "75% completion",
      progress: 75
    },
    created_at: "2024-09-20T14:20:00Z",
    read_at: "2024-09-20T16:00:00Z"
  },
  {
    id: "notif-004",
    user_id: "user-002",
    title: "Equipment Maintenance Due",
    message: "Excavation Tools Set requires scheduled maintenance",
    type: "maintenance",
    priority: "medium",
    read: false,
    data: {
      equipment_id: "eq-001",
      equipment_name: "Excavation Tools Set",
      maintenance_type: "scheduled",
      due_date: "2024-09-25T00:00:00Z"
    },
    created_at: "2024-09-20T12:15:00Z",
    read_at: null
  },
  {
    id: "notif-005",
    user_id: "user-002",
    title: "Order Delivered",
    message: "Order ORD-2024-003 from Precision Connectors Inc has been delivered",
    type: "delivery",
    priority: "low",
    read: true,
    data: {
      order_id: "order-003",
      supplier_name: "Precision Connectors Inc",
      delivery_date: "2024-09-16T15:30:00Z"
    },
    created_at: "2024-09-16T15:45:00Z",
    read_at: "2024-09-20T10:30:00Z"
  },
  {
    id: "notif-006",
    user_id: "user-003",
    title: "Task Assignment",
    message: "You have been assigned to Cable laying for Block A",
    type: "task_assignment",
    priority: "medium",
    read: true,
    data: {
      work_entry_id: "we-001",
      project_id: "proj-001",
      task: "Cable laying for Block A"
    },
    created_at: "2024-09-20T08:00:00Z",
    read_at: "2024-09-20T08:15:00Z"
  }
];

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

    let filteredNotifications = mockNotifications;

    // Filter by user (if specified)
    if (user_id) {
      filteredNotifications = filteredNotifications.filter(notif => notif.user_id === user_id);
    }

    // Filter by read status
    if (read !== null) {
      const isRead = read === 'true';
      filteredNotifications = filteredNotifications.filter(notif => notif.read === isRead);
    }

    // Filter by priority
    if (priority) {
      filteredNotifications = filteredNotifications.filter(notif => notif.priority === priority);
    }

    // Filter by type
    if (type) {
      filteredNotifications = filteredNotifications.filter(notif => notif.type === type);
    }

    // Filter by created date
    if (created_after) {
      const afterDate = new Date(created_after);
      filteredNotifications = filteredNotifications.filter(notif =>
        new Date(notif.created_at) > afterDate
      );
    }

    // Sort by created date (newest first)
    filteredNotifications.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Pagination
    const startIndex = (page - 1) * per_page;
    const endIndex = startIndex + per_page;
    const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);

    return NextResponse.json({
      data: paginatedNotifications,
      total: filteredNotifications.length,
      page,
      per_page,
      total_pages: Math.ceil(filteredNotifications.length / per_page),
      unread_count: filteredNotifications.filter(n => !n.read).length
    });
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

    const newNotification = {
      id: `notif-${Date.now()}`,
      ...body,
      read: false,
      read_at: null,
      created_at: new Date().toISOString()
    };

    return NextResponse.json(newNotification, { status: 201 });
  } catch (error) {
    console.error('Create notification error:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}