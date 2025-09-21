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

    // Mock project readiness data - in real implementation, fetch from database
    const mockReadinessData = {
      project_id: projectId,
      project_status: 'planning',
      overall_readiness: 75,
      total_checks: 24,
      completed_checks: 18,
      days_to_start: 7,
      critical_issues: 2,
      categories: {
        documentation: {
          completed: 4,
          total: 4,
          completed_checks: [0, 1, 2, 3]
        },
        resources: {
          completed: 3,
          total: 4,
          completed_checks: [0, 1, 2]
        },
        infrastructure: {
          completed: 3,
          total: 4,
          completed_checks: [0, 1, 3]
        },
        approvals: {
          completed: 2,
          total: 4,
          completed_checks: [0, 2]
        }
      },
      issues: [
        {
          title: 'Missing Building Permit',
          description: 'Building permit for Zone A excavation is still pending approval',
          severity: 'critical' as const,
          action_required: 'Contact city planning office to expedite permit approval'
        },
        {
          title: 'Equipment Availability',
          description: 'Fiber splicing equipment not yet confirmed for project dates',
          severity: 'critical' as const,
          action_required: 'Reserve equipment from backup supplier'
        },
        {
          title: 'Team Training',
          description: 'Two crew members need safety certification update',
          severity: 'warning' as const,
          action_required: 'Schedule training session before project start'
        }
      ],
      last_updated: new Date().toISOString()
    };

    return NextResponse.json(mockReadinessData);

  } catch (error) {
    console.error('Project readiness API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project readiness data' },
      { status: 500 }
    );
  }
}