import { NextRequest, NextResponse } from 'next/server';
import { addCreatedResource } from '../_storage';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const {
      project_id,
      name,
      type,
      inventory_no,
      rental_company,
      daily_rate,
      hourly_rate,
      rental_start,
      rental_end,
      operator_name,
      purpose,
      contract_notes
    } = data;

    if (!project_id || !name || !type || !inventory_no || !rental_company || !daily_rate || !rental_start) {
      return NextResponse.json(
        { error: 'Missing required fields for rental equipment creation' },
        { status: 400 }
      );
    }

    // In real implementation, this would:
    // 1. Insert into equipment table with owned=false
    // 2. Insert into equipment_assignments table
    // 3. Calculate total rental costs

    // Calculate rental period and costs
    const startDate = new Date(rental_start);
    const endDate = rental_end ? new Date(rental_end) : null;
    const days = endDate ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : null;
    const total_cost = days ? days * daily_rate : 0;
    const period = endDate ? `${rental_start} - ${rental_end}` : `${rental_start} - Unlimited`;

    // Mock response - in real app, return actual equipment data
    const equipment = {
      id: `re_${Date.now()}`,
      name,
      type,
      inventory_no,
      status: 'assigned',
      rental_company,
      daily_rate,
      hourly_rate,
      owned: false,
      current_location: `Project ${project_id.slice(0, 8)}`,
      rental_start,
      rental_end,
      operator_name,
      purpose,
      contract_notes,
      period,
      days,
      total_cost,
      created_at: new Date().toISOString()
    };

    const assignment = {
      id: `ea_${Date.now()}`,
      project_id,
      equipment_id: equipment.id,
      from_date: rental_start,
      to_date: rental_end,
      operator_name,
      purpose,
      is_permanent: !rental_end,
      notes: contract_notes,
      created_at: new Date().toISOString(),
      status: 'active'
    };

    // Store the created equipment in our mock storage
    addCreatedResource({
      id: equipment.id,
      projectId: project_id,
      type: 'equipment',
      data: equipment,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      equipment,
      assignment,
      message: 'Rental equipment created and assigned successfully'
    });

  } catch (error) {
    console.error('Rental equipment API error:', error);
    return NextResponse.json(
      { error: 'Failed to create rental equipment' },
      { status: 500 }
    );
  }
}