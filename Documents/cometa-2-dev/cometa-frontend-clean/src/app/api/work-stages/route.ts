import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Predefined work stages/stage codes commonly used in fiber optic construction
    const stages = [
      {
        code: 'EXCAVATION',
        name: 'Excavation',
        description: 'Digging trenches for cable installation',
        requires_gps: true,
        requires_photos: true,
        typical_duration_hours: 4,
      },
      {
        code: 'CABLE_LAYING',
        name: 'Cable Laying',
        description: 'Installing fiber optic cables',
        requires_gps: true,
        requires_photos: true,
        typical_duration_hours: 6,
      },
      {
        code: 'SPLICING',
        name: 'Cable Splicing',
        description: 'Splicing fiber optic connections',
        requires_gps: true,
        requires_photos: true,
        typical_duration_hours: 3,
      },
      {
        code: 'TESTING',
        name: 'Signal Testing',
        description: 'Testing signal quality and connectivity',
        requires_gps: true,
        requires_photos: false,
        typical_duration_hours: 2,
      },
      {
        code: 'BACKFILL',
        name: 'Backfilling',
        description: 'Filling trenches after cable installation',
        requires_gps: true,
        requires_photos: true,
        typical_duration_hours: 3,
      },
      {
        code: 'RESTORATION',
        name: 'Surface Restoration',
        description: 'Restoring surface materials (asphalt, concrete, etc.)',
        requires_gps: true,
        requires_photos: true,
        typical_duration_hours: 4,
      },
      {
        code: 'INSPECTION',
        name: 'Quality Inspection',
        description: 'Final quality inspection and documentation',
        requires_gps: false,
        requires_photos: true,
        typical_duration_hours: 1,
      },
      {
        code: 'CLEANUP',
        name: 'Site Cleanup',
        description: 'Cleaning up work site and removing equipment',
        requires_gps: false,
        requires_photos: true,
        typical_duration_hours: 2,
      },
    ];

    return NextResponse.json({
      stages,
      total: stages.length,
      message: 'Work stages retrieved successfully',
    });
  } catch (error) {
    console.error('Work stages API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch work stages' },
      { status: 500 }
    );
  }
}