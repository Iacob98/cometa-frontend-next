import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: houseId } = await params;

    if (!houseId) {
      return NextResponse.json(
        { error: 'House ID is required' },
        { status: 400 }
      );
    }

    // Mock data for individual house - in real implementation, fetch from database
    const mockHouse = {
      id: houseId,
      project_id: 'proj_001',
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
    };

    return NextResponse.json(mockHouse);

  } catch (error) {
    console.error('House API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch house' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: houseId } = await params;
    const data = await request.json();

    if (!houseId) {
      return NextResponse.json(
        { error: 'House ID is required' },
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

    // Mock house update - in real implementation, update in database
    const updatedHouse = {
      id: houseId,
      project_id: data.project_id || 'proj_001',
      address: data.address,
      house_number: data.house_number || null,
      apartment_count: data.apartment_count || 1,
      floor_count: data.floor_count || 1,
      connection_type: data.connection_type || 'full',
      method: data.method || 'trench',
      house_type: data.house_type || 'residential',
      status: data.status || 'not_assigned',
      planned_connection_date: data.planned_connection_date || null,
      actual_connection_date: data.actual_connection_date || null,
      contact_name: data.contact_name || null,
      contact_phone: data.contact_phone || null,
      contact_email: data.contact_email || null,
      coordinates_lat: data.coordinates_lat || null,
      coordinates_lng: data.coordinates_lng || null,
      notes: data.notes || null,
      created_at: '2024-01-10T10:00:00Z', // Would be preserved from original
      updated_at: new Date().toISOString()
    };

    return NextResponse.json(updatedHouse);

  } catch (error) {
    console.error('Update house API error:', error);
    return NextResponse.json(
      { error: 'Failed to update house' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: houseId } = await params;

    if (!houseId) {
      return NextResponse.json(
        { error: 'House ID is required' },
        { status: 400 }
      );
    }

    // Mock house deletion - in real implementation, delete from database
    // Check if house has any dependencies before deletion

    return NextResponse.json({
      success: true,
      message: 'House deleted successfully',
      deleted_id: houseId
    });

  } catch (error) {
    console.error('Delete house API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete house' },
      { status: 500 }
    );
  }
}