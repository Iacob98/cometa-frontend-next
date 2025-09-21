import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Mock data for available vehicles - in real implementation, fetch from database
    const availableVehicles = [
      {
        id: 'v1',
        brand: 'Mercedes',
        model: 'Sprinter',
        plate_number: 'B-MW 789',
        type: 'van',
        status: 'available',
        rental_price_per_day_eur: 85.00,
        rental_price_per_hour_eur: 4.50,
        owned: false,
        current_location: 'Main Depot',
        fuel_consumption_l_100km: 8.5
      },
      {
        id: 'v2',
        brand: 'Volvo',
        model: 'FH16',
        plate_number: 'B-VL 101',
        type: 'truck',
        status: 'available',
        owned: true,
        current_location: 'Main Depot',
        fuel_consumption_l_100km: 32.0
      },
      {
        id: 'v3',
        brand: 'CAT',
        model: '320',
        plate_number: 'B-CT 555',
        type: 'excavator',
        status: 'available',
        rental_price_per_day_eur: 150.00,
        rental_price_per_hour_eur: 18.00,
        owned: false,
        current_location: 'Equipment Yard',
        fuel_consumption_l_100km: 45.0
      },
      {
        id: 'v4',
        brand: 'Ford',
        model: 'Transit',
        plate_number: 'B-FD 333',
        type: 'van',
        status: 'available',
        rental_price_per_day_eur: 65.00,
        owned: false,
        current_location: 'Main Depot',
        fuel_consumption_l_100km: 9.2
      },
      {
        id: 'v5',
        brand: 'Scania',
        model: 'R450',
        plate_number: 'B-SC 777',
        type: 'truck',
        status: 'available',
        owned: true,
        current_location: 'Main Depot',
        fuel_consumption_l_100km: 28.5
      }
    ];

    return NextResponse.json(availableVehicles);

  } catch (error) {
    console.error('Available vehicles API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available vehicles' },
      { status: 500 }
    );
  }
}