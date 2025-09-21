import { NextRequest, NextResponse } from 'next/server';
import { getCreatedResourcesForProject } from '../../_storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Mock data for project resources - in real implementation, fetch from database
    // For now, we'll dynamically track assignments in a mock database

    // Get any dynamically created vehicles/equipment from local storage simulation
    const mockVehicles = [
      {
        id: '1',
        brand: 'Mercedes',
        model: 'Sprinter',
        plate_number: 'B-MW 123',
        type: 'van',
        status: 'in_use',
        rental_price_per_day_eur: 85.00,
        owned: false,
        current_location: `Project ${projectId.slice(0, 8)}`,
        fuel_consumption_l_100km: 8.5,
        period: '2024-01-15 - 2024-02-15',
        days: 31,
        daily_rate: 85.00,
        total_cost: 2635.00
      },
      {
        id: '2',
        brand: 'Volvo',
        model: 'FH16',
        plate_number: 'B-VL 456',
        type: 'truck',
        status: 'in_use',
        owned: true,
        current_location: `Project ${projectId.slice(0, 8)}`,
        fuel_consumption_l_100km: 32.0,
        period: '2024-01-10 - Unlimited',
        days: null,
        daily_rate: 0,
        total_cost: 0
      }
    ];

    const mockEquipment = [
      {
        id: '1',
        name: 'Hydraulic Earth Drill',
        type: 'drill',
        inventory_no: 'EQ-2024-001',
        status: 'in_use',
        rental_price_per_day_eur: 45.00,
        owned: false,
        current_location: `Project ${projectId.slice(0, 8)}`,
        period: '2024-01-20 - 2024-02-20',
        days: 31,
        daily_rate: 45.00,
        total_cost: 1395.00
      },
      {
        id: '2',
        name: 'Generator 50kW',
        type: 'generator',
        inventory_no: 'EQ-2024-002',
        status: 'in_use',
        owned: true,
        current_location: `Project ${projectId.slice(0, 8)}`,
        purchase_price_eur: 12500.00,
        period: '2024-01-15 - Unlimited',
        days: null,
        daily_rate: 0,
        total_cost: 0
      },
      // Add more equipment that might be assigned
      {
        id: 'eq1',
        name: 'Hydraulic Earth Drill HDS-250',
        type: 'drill',
        inventory_no: 'EQ-2024-003',
        status: 'in_use',
        rental_price_per_day_eur: 45.00,
        owned: false,
        current_location: `Project ${projectId.slice(0, 8)}`,
        period: '2024-01-21 - 2024-02-21',
        days: 31,
        daily_rate: 45.00,
        total_cost: 1395.00
      },
      {
        id: 'eq3',
        name: 'Air Compressor 350L',
        type: 'compressor',
        inventory_no: 'EQ-2024-005',
        status: 'in_use',
        rental_price_per_day_eur: 25.00,
        owned: false,
        current_location: `Project ${projectId.slice(0, 8)}`,
        period: '2024-01-22 - 2024-02-22',
        days: 31,
        daily_rate: 25.00,
        total_cost: 775.00
      }
    ];

    // Get any dynamically created resources for this project
    const createdResources = getCreatedResourcesForProject(projectId);
    const createdVehicles = createdResources.filter(r => r.type === 'vehicle').map(r => r.data);
    const createdEquipment = createdResources.filter(r => r.type === 'equipment').map(r => r.data);

    // Combine base resources with created resources
    const allVehicles = [...mockVehicles, ...createdVehicles];
    const allEquipment = [...mockEquipment, ...createdEquipment];

    const summary = {
      total_resources: allVehicles.length + allEquipment.length,
      total_vehicles: allVehicles.length,
      total_equipment: allEquipment.length,
      total_cost: [
        ...allVehicles.map(v => v.total_cost || 0),
        ...allEquipment.map(e => e.total_cost || 0)
      ].reduce((sum, cost) => sum + cost, 0)
    };

    return NextResponse.json({
      vehicles: allVehicles,
      equipment: allEquipment,
      summary
    });

  } catch (error) {
    console.error('Project resources API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project resources' },
      { status: 500 }
    );
  }
}