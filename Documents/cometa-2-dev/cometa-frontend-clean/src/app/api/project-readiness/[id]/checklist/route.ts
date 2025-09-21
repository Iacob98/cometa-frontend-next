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

    // Mock checklist data - in real implementation, fetch from database
    const mockChecklist = [
      // Documentation Category
      {
        id: 'doc_001',
        title: 'Project Plans Uploaded',
        description: 'All technical drawings and project plans have been uploaded to the system',
        category: 'Documentation',
        required: true,
        completed: true,
        completed_date: '2024-01-15T10:30:00Z'
      },
      {
        id: 'doc_002',
        title: 'Utility Contact Information',
        description: 'Complete contact information for all utility companies has been collected',
        category: 'Documentation',
        required: true,
        completed: true,
        completed_date: '2024-01-16T14:20:00Z'
      },
      {
        id: 'doc_003',
        title: 'Building Permits',
        description: 'All required building and excavation permits have been obtained',
        category: 'Documentation',
        required: true,
        completed: false,
        action_required: 'Contact city planning office for Zone A excavation permit'
      },
      {
        id: 'doc_004',
        title: 'Safety Documentation',
        description: 'Safety protocols and emergency procedures documented',
        category: 'Documentation',
        required: true,
        completed: true,
        completed_date: '2024-01-18T09:15:00Z'
      },

      // Resources Category
      {
        id: 'res_001',
        title: 'Team Assignments Complete',
        description: 'All team members have been assigned to the project with clear roles',
        category: 'Resources',
        required: true,
        completed: true,
        completed_date: '2024-01-20T11:45:00Z'
      },
      {
        id: 'res_002',
        title: 'Equipment Allocation',
        description: 'All required equipment has been allocated and is available for project dates',
        category: 'Resources',
        required: true,
        completed: false,
        action_required: 'Confirm fiber splicing equipment availability with backup supplier'
      },
      {
        id: 'res_003',
        title: 'Material Inventory',
        description: 'Sufficient materials are available in inventory for project completion',
        category: 'Resources',
        required: true,
        completed: true,
        completed_date: '2024-01-22T16:00:00Z'
      },
      {
        id: 'res_004',
        title: 'Subcontractors Confirmed',
        description: 'All subcontractors have confirmed availability and signed agreements',
        category: 'Resources',
        required: false,
        completed: true,
        completed_date: '2024-01-19T13:30:00Z'
      },

      // Infrastructure Category
      {
        id: 'inf_001',
        title: 'Zone Layout Confirmed',
        description: 'Final zone layout has been confirmed with all stakeholders',
        category: 'Infrastructure',
        required: true,
        completed: true,
        completed_date: '2024-01-21T08:45:00Z'
      },
      {
        id: 'inf_002',
        title: 'Cabinet Locations Defined',
        description: 'All network cabinet locations have been surveyed and confirmed',
        category: 'Infrastructure',
        required: true,
        completed: true,
        completed_date: '2024-01-23T12:15:00Z'
      },
      {
        id: 'inf_003',
        title: 'House Connections Mapped',
        description: 'All house connections have been mapped and validated',
        category: 'Infrastructure',
        required: true,
        completed: false,
        action_required: 'Complete house mapping for residential area section B'
      },
      {
        id: 'inf_004',
        title: 'Network Segments Planned',
        description: 'Network segments and routing have been planned and optimized',
        category: 'Infrastructure',
        required: true,
        completed: true,
        completed_date: '2024-01-24T15:20:00Z'
      },

      // Approvals Category
      {
        id: 'app_001',
        title: 'Management Approval',
        description: 'Project has received final approval from management',
        category: 'Approvals',
        required: true,
        completed: true,
        completed_date: '2024-01-25T10:00:00Z'
      },
      {
        id: 'app_002',
        title: 'Customer Agreements',
        description: 'All customer agreements have been signed and are legally binding',
        category: 'Approvals',
        required: true,
        completed: false,
        action_required: 'Obtain signatures from 3 remaining property owners'
      },
      {
        id: 'app_003',
        title: 'Regulatory Clearances',
        description: 'All regulatory clearances and environmental approvals obtained',
        category: 'Approvals',
        required: true,
        completed: true,
        completed_date: '2024-01-26T14:30:00Z'
      },
      {
        id: 'app_004',
        title: 'Budget Authorization',
        description: 'Final budget has been approved and funds allocated',
        category: 'Approvals',
        required: true,
        completed: false,
        action_required: 'Finalize budget revision for additional equipment costs'
      },

      // Additional Checks
      {
        id: 'add_001',
        title: 'Site Safety Inspection',
        description: 'Comprehensive safety inspection of all work sites completed',
        category: 'Safety',
        required: true,
        completed: true,
        completed_date: '2024-01-27T09:30:00Z'
      },
      {
        id: 'add_002',
        title: 'Weather Contingency Plan',
        description: 'Contingency plans for adverse weather conditions documented',
        category: 'Planning',
        required: false,
        completed: true,
        completed_date: '2024-01-28T11:15:00Z'
      },
      {
        id: 'add_003',
        title: 'Communication Plan',
        description: 'Stakeholder communication plan established and activated',
        category: 'Communication',
        required: true,
        completed: true,
        completed_date: '2024-01-29T16:45:00Z'
      },
      {
        id: 'add_004',
        title: 'Quality Control Procedures',
        description: 'Quality control checkpoints and procedures established',
        category: 'Quality',
        required: true,
        completed: false,
        action_required: 'Define quality control metrics and inspection schedule'
      }
    ];

    return NextResponse.json(mockChecklist);

  } catch (error) {
    console.error('Project checklist API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project checklist' },
      { status: 500 }
    );
  }
}