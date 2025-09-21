import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { project_id, material_id, quantity, from_date, to_date, notes } = data;

    if (!project_id || !material_id || !quantity) {
      return NextResponse.json(
        { error: 'Project ID, material ID, and quantity are required' },
        { status: 400 }
      );
    }

    // Mock material assignment creation - in real implementation, save to database
    const mockAssignment = {
      id: `assignment_${Date.now()}`,
      project_id,
      material_id,
      quantity: parseFloat(quantity),
      from_date,
      to_date: to_date || null,
      notes: notes || '',
      status: 'allocated',
      created_at: new Date().toISOString(),
      allocated_by: 'current_user_id', // In real implementation, get from session
      unit_price: 15.50, // Mock price - in real implementation, get from material
      total_cost: parseFloat(quantity) * 15.50
    };

    return NextResponse.json(mockAssignment);

  } catch (error) {
    console.error('Material assignment API error:', error);
    return NextResponse.json(
      { error: 'Failed to create material assignment' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('project_id');
    const teamId = searchParams.get('team_id');

    // Mock material assignments data
    const mockAssignments = [
      {
        id: 'assignment_001',
        project_id: projectId || 'proj_001',
        material_id: 'mat_001',
        material_name: 'Fiber Optic Cable',
        quantity: 500,
        unit: 'meters',
        unit_price: 2.50,
        total_cost: 1250.00,
        from_date: '2024-02-01',
        to_date: '2024-02-28',
        status: 'allocated',
        notes: 'Primary installation cable',
        allocated_by: 'user_001',
        allocated_by_name: 'John Manager',
        created_at: '2024-01-25T10:00:00Z'
      },
      {
        id: 'assignment_002',
        project_id: projectId || 'proj_001',
        material_id: 'mat_002',
        material_name: 'Conduit Pipes',
        quantity: 200,
        unit: 'meters',
        unit_price: 5.75,
        total_cost: 1150.00,
        from_date: '2024-02-01',
        to_date: '2024-02-15',
        status: 'used',
        notes: 'Underground cable protection',
        allocated_by: 'user_001',
        allocated_by_name: 'John Manager',
        created_at: '2024-01-25T10:30:00Z'
      },
      {
        id: 'assignment_003',
        project_id: projectId || 'proj_001',
        material_id: 'mat_003',
        material_name: 'Junction Boxes',
        quantity: 25,
        unit: 'pieces',
        unit_price: 45.00,
        total_cost: 1125.00,
        from_date: '2024-02-10',
        to_date: null,
        status: 'allocated',
        notes: 'Distribution points',
        allocated_by: 'user_002',
        allocated_by_name: 'Sarah Foreman',
        created_at: '2024-01-26T14:15:00Z'
      }
    ];

    return NextResponse.json(mockAssignments);

  } catch (error) {
    console.error('Material assignments API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch material assignments' },
      { status: 500 }
    );
  }
}