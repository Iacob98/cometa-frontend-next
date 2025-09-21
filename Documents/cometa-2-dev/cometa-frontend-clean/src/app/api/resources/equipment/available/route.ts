import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Mock data for available equipment - in real implementation, fetch from database
    // Equipment that hasn't been assigned to projects yet
    const availableEquipment = [
      {
        id: 'eq2',
        name: 'Generator Diesel 50kW',
        type: 'generator',
        inventory_no: 'EQ-2024-004',
        status: 'available',
        owned: true,
        current_location: 'Main Depot',
        purchase_price_eur: 12500.00
      },
      {
        id: 'eq4',
        name: 'Mobile Crane 25T',
        type: 'crane',
        inventory_no: 'EQ-2024-006',
        status: 'available',
        rental_price_per_day_eur: 180.00,
        rental_price_per_hour_eur: 22.00,
        owned: false,
        current_location: 'Equipment Yard',
        purchase_price_eur: null
      },
      {
        id: 'eq5',
        name: 'Mini Excavator CAT 302.5',
        type: 'excavator',
        inventory_no: 'EQ-2024-007',
        status: 'available',
        owned: true,
        current_location: 'Equipment Yard',
        purchase_price_eur: 45000.00
      },
      {
        id: 'eq6',
        name: 'Pneumatic Drill Atlas Copco',
        type: 'drill',
        inventory_no: 'EQ-2024-008',
        status: 'available',
        rental_price_per_day_eur: 35.00,
        owned: false,
        current_location: 'Equipment Yard',
        purchase_price_eur: null
      }
    ];

    return NextResponse.json(availableEquipment);

  } catch (error) {
    console.error('Available equipment API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available equipment' },
      { status: 500 }
    );
  }
}