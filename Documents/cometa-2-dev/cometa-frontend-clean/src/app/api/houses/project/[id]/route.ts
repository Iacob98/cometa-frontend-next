import { NextRequest, NextResponse } from 'next/server';

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

    // Mock data for project houses - in real implementation, fetch from database
    const mockHouses = [
      {
        id: 'house_001',
        project_id: projectId,
        address: 'Hauptstraße 42, 10115 Berlin',
        house_number: '42',
        apartment_count: 12,
        floor_count: 4,
        connection_type: 'full',
        method: 'trench',
        house_type: 'residential',
        status: 'connected',
        planned_connection_date: '2024-03-15',
        actual_connection_date: '2024-03-12',
        contact_name: 'Maria Schmidt',
        contact_phone: '+49 30 12345678',
        contact_email: 'maria.schmidt@example.com',
        coordinates_lat: 52.5200,
        coordinates_lng: 13.4050,
        notes: 'Easy access from the street. Concierge available 8-17h.',
        created_at: '2024-01-10T10:00:00Z',
        updated_at: '2024-03-12T14:30:00Z'
      },
      {
        id: 'house_002',
        project_id: projectId,
        address: 'Berliner Straße 18, 10115 Berlin',
        house_number: '18A',
        apartment_count: 8,
        floor_count: 3,
        connection_type: 'property',
        method: 'underground',
        house_type: 'residential',
        status: 'assigned',
        planned_connection_date: '2024-04-20',
        contact_name: 'Hans Mueller',
        contact_phone: '+49 30 87654321',
        contact_email: 'h.mueller@example.com',
        coordinates_lat: 52.5170,
        coordinates_lng: 13.4020,
        notes: 'Parking restrictions. Contact required before work.',
        created_at: '2024-01-15T09:30:00Z',
        updated_at: '2024-01-20T11:15:00Z'
      },
      {
        id: 'house_003',
        project_id: projectId,
        address: 'Alexanderplatz 5, 10115 Berlin',
        house_number: '5',
        apartment_count: 24,
        floor_count: 6,
        connection_type: 'in_home',
        method: 'building',
        house_type: 'commercial',
        status: 'not_assigned',
        planned_connection_date: '2024-05-10',
        contact_name: 'Business Center Management',
        contact_phone: '+49 30 55555555',
        contact_email: 'management@alexanderplatz5.com',
        coordinates_lat: 52.5219,
        coordinates_lng: 13.4132,
        notes: 'Commercial building with office spaces. Schedule during business hours.',
        created_at: '2024-02-01T08:00:00Z',
        updated_at: '2024-02-01T08:00:00Z'
      },
      {
        id: 'house_004',
        project_id: projectId,
        address: 'Kastanienallee 99, 10115 Berlin',
        house_number: '99',
        apartment_count: 6,
        floor_count: 2,
        connection_type: 'full',
        method: 'aerial',
        house_type: 'mixed',
        status: 'assigned',
        planned_connection_date: '2024-04-05',
        contact_name: 'Anna Becker',
        contact_phone: '+49 30 99999999',
        contact_email: 'anna.becker@kastanien99.de',
        coordinates_lat: 52.5290,
        coordinates_lng: 13.4010,
        notes: 'Mixed use building. Shop on ground floor, apartments above.',
        created_at: '2024-01-25T12:00:00Z',
        updated_at: '2024-02-10T16:45:00Z'
      }
    ];

    const summary = {
      total_houses: mockHouses.length,
      connected_count: mockHouses.filter(h => h.status === 'connected').length,
      assigned_count: mockHouses.filter(h => h.status === 'assigned').length,
      not_assigned_count: mockHouses.filter(h => h.status === 'not_assigned').length,
      total_apartments: mockHouses.reduce((sum, h) => sum + h.apartment_count, 0),
      connection_types: {
        full: mockHouses.filter(h => h.connection_type === 'full').length,
        property: mockHouses.filter(h => h.connection_type === 'property').length,
        in_home: mockHouses.filter(h => h.connection_type === 'in_home').length,
        other: mockHouses.filter(h => h.connection_type === 'other').length,
      },
      house_types: {
        residential: mockHouses.filter(h => h.house_type === 'residential').length,
        commercial: mockHouses.filter(h => h.house_type === 'commercial').length,
        mixed: mockHouses.filter(h => h.house_type === 'mixed').length,
        industrial: mockHouses.filter(h => h.house_type === 'industrial').length,
      }
    };

    return NextResponse.json({
      houses: mockHouses,
      summary
    });

  } catch (error) {
    console.error('Project houses API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project houses' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const data = await request.json();

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!data.address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    // Mock house creation - in real implementation, save to database
    const newHouse = {
      id: `house_${Date.now()}`,
      project_id: projectId,
      address: data.address,
      house_number: data.house_number || null,
      apartment_count: data.apartment_count || 1,
      floor_count: data.floor_count || 1,
      connection_type: data.connection_type || 'full',
      method: data.method || 'trench',
      house_type: data.house_type || 'residential',
      status: 'not_assigned',
      planned_connection_date: data.planned_connection_date || null,
      actual_connection_date: null,
      contact_name: data.contact_name || null,
      contact_phone: data.contact_phone || null,
      contact_email: data.contact_email || null,
      coordinates_lat: data.coordinates_lat || null,
      coordinates_lng: data.coordinates_lng || null,
      notes: data.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return NextResponse.json(newHouse, { status: 201 });

  } catch (error) {
    console.error('Create house API error:', error);
    return NextResponse.json(
      { error: 'Failed to create house' },
      { status: 500 }
    );
  }
}