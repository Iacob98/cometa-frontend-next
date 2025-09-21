import { NextRequest, NextResponse } from 'next/server';
import { addCreatedResource } from '../_storage';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const {
      project_id,
      brand,
      model,
      plate_number,
      type,
      rental_company,
      daily_rate,
      hourly_rate,
      fuel_consumption,
      rental_start,
      rental_end,
      driver_name,
      purpose,
      contract_notes
    } = data;

    if (!project_id || !brand || !model || !plate_number || !type || !rental_company || !daily_rate || !rental_start) {
      return NextResponse.json(
        { error: 'Missing required fields for rental vehicle creation' },
        { status: 400 }
      );
    }

    // In real implementation, this would:
    // 1. Insert into vehicles table with owned=false
    // 2. Insert into vehicle_assignments table
    // 3. Calculate total rental costs

    // Calculate rental period and costs
    const startDate = new Date(rental_start);
    const endDate = rental_end ? new Date(rental_end) : null;
    const days = endDate ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : null;
    const total_cost = days ? days * daily_rate : 0;
    const period = endDate ? `${rental_start} - ${rental_end}` : `${rental_start} - Unlimited`;

    // Mock response - in real app, return actual vehicle data
    const vehicle = {
      id: `rv_${Date.now()}`,
      brand,
      model,
      plate_number,
      type,
      status: 'assigned',
      rental_company,
      daily_rate,
      hourly_rate,
      fuel_consumption,
      owned: false,
      current_location: `Project ${project_id.slice(0, 8)}`,
      rental_start,
      rental_end,
      driver_name,
      purpose,
      contract_notes,
      period,
      days,
      total_cost,
      created_at: new Date().toISOString()
    };

    const assignment = {
      id: `va_${Date.now()}`,
      project_id,
      vehicle_id: vehicle.id,
      from_date: rental_start,
      to_date: rental_end,
      driver_name,
      purpose,
      is_permanent: !rental_end,
      notes: contract_notes,
      created_at: new Date().toISOString(),
      status: 'active'
    };

    // Store the created vehicle in our mock storage
    addCreatedResource({
      id: vehicle.id,
      projectId: project_id,
      type: 'vehicle',
      data: vehicle,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      vehicle,
      assignment,
      message: 'Rental vehicle created and assigned successfully'
    });

  } catch (error) {
    console.error('Rental vehicle API error:', error);
    return NextResponse.json(
      { error: 'Failed to create rental vehicle' },
      { status: 500 }
    );
  }
}