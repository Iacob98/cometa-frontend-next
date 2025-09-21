import { NextRequest, NextResponse } from 'next/server';

// Mock material allocations data
const mockAllocations = [
  {
    id: "alloc-001",
    project_id: "proj-001",
    project_name: "Fiber Network Downtown",
    material_id: "mat-001",
    material_name: "Single Mode Fiber Cable",
    allocated_qty: 1200,
    used_qty: 800,
    remaining_qty: 400,
    unit: "meter",
    allocated_by: "user-002",
    allocated_by_name: "Klaus Weber",
    allocation_date: "2024-09-15T10:00:00Z",
    expected_usage_date: "2024-09-25T00:00:00Z",
    status: "active",
    notes: "For downtown network installation phase 1",
    created_at: "2024-09-15T10:00:00Z",
    updated_at: "2024-09-20T14:30:00Z"
  },
  {
    id: "alloc-002",
    project_id: "proj-001",
    project_name: "Fiber Network Downtown",
    material_id: "mat-003",
    material_name: "Fiber Splice Enclosure",
    allocated_qty: 45,
    used_qty: 25,
    remaining_qty: 20,
    unit: "piece",
    allocated_by: "user-002",
    allocated_by_name: "Klaus Weber",
    allocation_date: "2024-09-10T12:00:00Z",
    expected_usage_date: "2024-09-30T00:00:00Z",
    status: "active",
    notes: "Splice enclosures for main distribution points",
    created_at: "2024-09-10T12:00:00Z",
    updated_at: "2024-09-18T16:45:00Z"
  },
  {
    id: "alloc-003",
    project_id: "proj-002",
    project_name: "Residential Area Fiber Rollout",
    material_id: "mat-002",
    material_name: "Multimode Fiber Cable",
    allocated_qty: 800,
    used_qty: 0,
    remaining_qty: 800,
    unit: "meter",
    allocated_by: "user-006",
    allocated_by_name: "Maria Hoffmann",
    allocation_date: "2024-09-20T09:00:00Z",
    expected_usage_date: "2024-10-15T00:00:00Z",
    status: "pending",
    notes: "For residential area phase 1 preparation",
    created_at: "2024-09-20T09:00:00Z",
    updated_at: "2024-09-20T09:00:00Z"
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const per_page = parseInt(searchParams.get('per_page') || '10');
    const project_id = searchParams.get('project_id');
    const material_id = searchParams.get('material_id');
    const status = searchParams.get('status');

    let filteredAllocations = mockAllocations;

    // Filter by project
    if (project_id) {
      filteredAllocations = filteredAllocations.filter(allocation =>
        allocation.project_id === project_id
      );
    }

    // Filter by material
    if (material_id) {
      filteredAllocations = filteredAllocations.filter(allocation =>
        allocation.material_id === material_id
      );
    }

    // Filter by status
    if (status) {
      filteredAllocations = filteredAllocations.filter(allocation =>
        allocation.status === status
      );
    }

    // Pagination
    const startIndex = (page - 1) * per_page;
    const endIndex = startIndex + per_page;
    const paginatedAllocations = filteredAllocations.slice(startIndex, endIndex);

    return NextResponse.json({
      data: paginatedAllocations,
      total: filteredAllocations.length,
      page,
      per_page,
      total_pages: Math.ceil(filteredAllocations.length / per_page)
    });
  } catch (error) {
    console.error('Material allocations API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch material allocations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newAllocation = {
      id: `alloc-${Date.now()}`,
      ...body,
      used_qty: 0,
      remaining_qty: body.allocated_qty,
      status: 'pending',
      allocation_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return NextResponse.json(newAllocation, { status: 201 });
  } catch (error) {
    console.error('Create allocation error:', error);
    return NextResponse.json(
      { error: 'Failed to create allocation' },
      { status: 500 }
    );
  }
}