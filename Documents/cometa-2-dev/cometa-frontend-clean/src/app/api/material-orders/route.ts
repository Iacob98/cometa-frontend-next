import { NextRequest, NextResponse } from 'next/server';

// Mock material orders data
const mockOrders = [
  {
    id: "order-001",
    supplier_id: "sup-001",
    supplier_name: "FiberTech Solutions",
    project_id: "proj-001",
    project_name: "Fiber Network Downtown",
    order_number: "ORD-2024-001",
    order_date: "2024-09-18T10:00:00Z",
    expected_delivery_date: "2024-09-25T00:00:00Z",
    actual_delivery_date: null,
    status: "ordered",
    total_amount: 15000.00,
    currency: "EUR",
    items: [
      {
        material_id: "mat-001",
        material_name: "Single Mode Fiber Cable",
        quantity: 2000,
        unit: "meter",
        unit_price: 2.50,
        total_price: 5000.00
      },
      {
        material_id: "mat-002",
        material_name: "Multimode Fiber Cable",
        quantity: 1000,
        unit: "meter",
        unit_price: 3.75,
        total_price: 3750.00
      }
    ],
    ordered_by: "user-002",
    ordered_by_name: "Klaus Weber",
    notes: "Emergency order for project phase 2",
    created_at: "2024-09-18T10:00:00Z",
    updated_at: "2024-09-20T14:30:00Z"
  },
  {
    id: "order-002",
    supplier_id: "sup-002",
    supplier_name: "Network Hardware Ltd",
    project_id: "proj-001",
    project_name: "Fiber Network Downtown",
    order_number: "ORD-2024-002",
    order_date: "2024-09-15T14:00:00Z",
    expected_delivery_date: "2024-09-29T00:00:00Z",
    actual_delivery_date: null,
    status: "pending",
    total_amount: 8500.00,
    currency: "EUR",
    items: [
      {
        material_id: "mat-003",
        material_name: "Fiber Splice Enclosure",
        quantity: 100,
        unit: "piece",
        unit_price: 85.00,
        total_price: 8500.00
      }
    ],
    ordered_by: "user-002",
    ordered_by_name: "Klaus Weber",
    notes: "Standard monthly order",
    created_at: "2024-09-15T14:00:00Z",
    updated_at: "2024-09-18T11:45:00Z"
  },
  {
    id: "order-003",
    supplier_id: "sup-003",
    supplier_name: "Precision Connectors Inc",
    project_id: "proj-002",
    project_name: "Residential Area Fiber Rollout",
    order_number: "ORD-2024-003",
    order_date: "2024-09-12T09:00:00Z",
    expected_delivery_date: "2024-09-17T00:00:00Z",
    actual_delivery_date: "2024-09-16T15:30:00Z",
    status: "delivered",
    total_amount: 2250.00,
    currency: "EUR",
    items: [
      {
        material_id: "mat-004",
        material_name: "SC/APC Connectors",
        quantity: 500,
        unit: "piece",
        unit_price: 4.50,
        total_price: 2250.00
      }
    ],
    ordered_by: "user-006",
    ordered_by_name: "Maria Hoffmann",
    notes: "Delivered ahead of schedule",
    created_at: "2024-09-12T09:00:00Z",
    updated_at: "2024-09-16T16:00:00Z"
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const per_page = parseInt(searchParams.get('per_page') || '10');
    const status = searchParams.get('status');
    const project_id = searchParams.get('project_id');
    const supplier_id = searchParams.get('supplier_id');

    let filteredOrders = mockOrders;

    // Filter by status
    if (status) {
      filteredOrders = filteredOrders.filter(order => order.status === status);
    }

    // Filter by project
    if (project_id) {
      filteredOrders = filteredOrders.filter(order => order.project_id === project_id);
    }

    // Filter by supplier
    if (supplier_id) {
      filteredOrders = filteredOrders.filter(order => order.supplier_id === supplier_id);
    }

    // Pagination
    const startIndex = (page - 1) * per_page;
    const endIndex = startIndex + per_page;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

    return NextResponse.json({
      data: paginatedOrders,
      total: filteredOrders.length,
      page,
      per_page,
      total_pages: Math.ceil(filteredOrders.length / per_page)
    });
  } catch (error) {
    console.error('Material orders API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch material orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newOrder = {
      id: `order-${Date.now()}`,
      order_number: `ORD-2024-${String(Date.now()).slice(-3)}`,
      ...body,
      order_date: new Date().toISOString(),
      actual_delivery_date: null,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}