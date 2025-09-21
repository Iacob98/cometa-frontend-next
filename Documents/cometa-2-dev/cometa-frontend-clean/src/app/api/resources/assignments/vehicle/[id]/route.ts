import { NextRequest, NextResponse } from 'next/server';
import { removeCreatedResource } from '../../../_storage';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { project_id } = body;

    if (!id || !project_id) {
      return NextResponse.json(
        { error: 'Vehicle ID and Project ID are required' },
        { status: 400 }
      );
    }

    // In real implementation, this would:
    // 1. Delete from vehicle_assignments table
    // 2. Update vehicle status to 'available'
    // 3. Remove project_id association

    // Remove from our mock storage if it's a created resource
    removeCreatedResource(id, project_id);

    return NextResponse.json({
      success: true,
      message: 'Vehicle assignment removed successfully'
    });

  } catch (error) {
    console.error('Remove vehicle assignment API error:', error);
    return NextResponse.json(
      { error: 'Failed to remove vehicle assignment' },
      { status: 500 }
    );
  }
}