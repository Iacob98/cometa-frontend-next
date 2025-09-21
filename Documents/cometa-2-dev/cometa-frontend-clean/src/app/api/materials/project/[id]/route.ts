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

    // Mock data for project materials - in real implementation, fetch from database
    const mockMaterials = [
      {
        id: '1',
        material_id: 'mat_001',
        name: 'Fiber Optic Cable (Single Mode)',
        sku: 'FOC-SM-1000',
        unit: 'm',
        description: 'Single-mode fiber optic cable for long-distance transmission',
        allocated_qty: 1500,
        unit_price: 2.50,
        total_cost: 3750.00,
        allocation_date: '2024-01-15',
        return_date: '2024-03-15',
        status: 'allocated',
        notes: 'Primary cable for main trunk installation',
        allocated_by_name: 'John Manager'
      },
      {
        id: '2',
        material_id: 'mat_002',
        name: 'Network Cabinet 19"',
        sku: 'NC-19-42U',
        unit: 'piece',
        description: '42U network cabinet for outdoor installation',
        allocated_qty: 5,
        unit_price: 450.00,
        total_cost: 2250.00,
        allocation_date: '2024-01-20',
        status: 'used',
        notes: 'Installed at distribution points',
        allocated_by_name: 'Jane Smith'
      },
      {
        id: '3',
        material_id: 'mat_003',
        name: 'Fiber Splice Closures',
        sku: 'FSC-24F',
        unit: 'piece',
        description: '24-fiber splice closure for underground installation',
        allocated_qty: 25,
        unit_price: 85.00,
        total_cost: 2125.00,
        allocation_date: '2024-01-18',
        return_date: '2024-02-28',
        status: 'allocated',
        notes: 'For segment junction points',
        allocated_by_name: 'John Manager'
      }
    ];

    const summary = {
      total_materials: mockMaterials.length,
      pending_count: mockMaterials.filter(m => m.status === 'allocated').length,
      used_count: mockMaterials.filter(m => m.status === 'used').length,
      total_cost: mockMaterials.reduce((sum, m) => sum + m.total_cost, 0)
    };

    return NextResponse.json({
      materials: mockMaterials,
      summary
    });

  } catch (error) {
    console.error('Project materials API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project materials' },
      { status: 500 }
    );
  }
}