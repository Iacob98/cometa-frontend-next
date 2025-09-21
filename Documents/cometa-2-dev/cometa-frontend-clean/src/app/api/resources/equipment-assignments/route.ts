import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const {
      project_id,
      equipment_id,
      from_date,
      to_date,
      operator_name,
      purpose,
      is_permanent,
      notes
    } = data;

    if (!project_id || !equipment_id || !from_date) {
      return NextResponse.json(
        { error: 'Project ID, Equipment ID and start date are required' },
        { status: 400 }
      );
    }

    // In real implementation, this would:
    // 1. Insert into equipment_assignments table
    // 2. Update equipment status to 'assigned'
    // 3. Calculate rental costs if applicable

    // Mock response - in real app, return actual assignment data
    const assignment = {
      id: `ea_${Date.now()}`,
      project_id,
      equipment_id,
      from_date,
      to_date,
      operator_name,
      purpose,
      is_permanent: is_permanent || false,
      notes,
      created_at: new Date().toISOString(),
      status: 'active'
    };

    return NextResponse.json({
      success: true,
      assignment,
      message: 'Equipment assigned successfully'
    });

  } catch (error) {
    console.error('Equipment assignment API error:', error);
    return NextResponse.json(
      { error: 'Failed to assign equipment' },
      { status: 500 }
    );
  }
}