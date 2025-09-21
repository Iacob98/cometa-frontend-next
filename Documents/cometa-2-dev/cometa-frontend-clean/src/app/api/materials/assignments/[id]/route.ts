import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assignmentId } = await params;
    const data = await request.json();
    const { quantity, unit_price, from_date, to_date, notes } = data;

    if (!assignmentId) {
      return NextResponse.json(
        { error: 'Assignment ID is required' },
        { status: 400 }
      );
    }

    // Mock material assignment update - in real implementation, update database
    const mockUpdatedAssignment = {
      id: assignmentId,
      project_id: 'proj_001', // In real implementation, get from database
      material_id: 'mat_001',
      material_name: 'Fiber Optic Cable',
      quantity: parseFloat(quantity) || 0,
      unit: 'meters',
      unit_price: parseFloat(unit_price) || 0,
      total_cost: (parseFloat(quantity) || 0) * (parseFloat(unit_price) || 0),
      from_date,
      to_date: to_date || null,
      status: 'allocated',
      notes: notes || '',
      allocated_by: 'user_001',
      allocated_by_name: 'John Manager',
      updated_at: new Date().toISOString()
    };

    return NextResponse.json(mockUpdatedAssignment);

  } catch (error) {
    console.error('Material assignment update API error:', error);
    return NextResponse.json(
      { error: 'Failed to update material assignment' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assignmentId } = await params;

    if (!assignmentId) {
      return NextResponse.json(
        { error: 'Assignment ID is required' },
        { status: 400 }
      );
    }

    // Mock material assignment deletion - in real implementation, delete from database
    // Also return stock to warehouse
    const mockResponse = {
      id: assignmentId,
      deleted: true,
      deleted_at: new Date().toISOString(),
      message: 'Material assignment deleted successfully'
    };

    return NextResponse.json(mockResponse);

  } catch (error) {
    console.error('Material assignment delete API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete material assignment' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assignmentId } = await params;

    if (!assignmentId) {
      return NextResponse.json(
        { error: 'Assignment ID is required' },
        { status: 400 }
      );
    }

    // Mock single material assignment - in real implementation, fetch from database
    const mockAssignment = {
      id: assignmentId,
      project_id: 'proj_001',
      material_id: 'mat_001',
      material_name: 'Fiber Optic Cable',
      sku: 'FOC-SM-24F',
      unit: 'meters',
      description: 'Single-mode 24-fiber optic cable',
      quantity: 500,
      unit_price: 2.50,
      total_cost: 1250.00,
      from_date: '2024-02-01',
      to_date: '2024-02-28',
      status: 'allocated',
      notes: 'Primary installation cable',
      allocated_by: 'user_001',
      allocated_by_name: 'John Manager',
      created_at: '2024-01-25T10:00:00Z',
      updated_at: '2024-01-25T10:00:00Z'
    };

    return NextResponse.json(mockAssignment);

  } catch (error) {
    console.error('Material assignment get API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch material assignment' },
      { status: 500 }
    );
  }
}