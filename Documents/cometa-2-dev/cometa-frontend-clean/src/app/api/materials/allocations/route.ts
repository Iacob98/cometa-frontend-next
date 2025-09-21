import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const project_id = searchParams.get('project_id');
    const crew_id = searchParams.get('crew_id');
    const status = searchParams.get('status');
    const material_id = searchParams.get('material_id');

    // Query for material allocations with related data
    let allocationsQuery = `
      SELECT
        ma.id,
        ma.material_id,
        ma.project_id,
        ma.crew_id,
        ma.allocated_qty,
        ma.used_qty,
        ma.allocation_date,
        ma.return_date,
        ma.status,
        ma.notes,
        ma.allocated_by,
        m.name as material_name,
        m.unit as material_unit,
        m.default_price_eur,
        p.name as project_name,
        c.name as crew_name,
        u.first_name,
        u.last_name
      FROM material_allocations ma
      LEFT JOIN materials m ON ma.material_id = m.id
      LEFT JOIN projects p ON ma.project_id = p.id
      LEFT JOIN crews c ON ma.crew_id = c.id
      LEFT JOIN users u ON ma.allocated_by = u.id
      WHERE 1=1
    `;

    const params = [];

    // Add filters
    if (project_id) {
      allocationsQuery += ` AND ma.project_id = '${project_id}'`;
    }
    if (crew_id) {
      allocationsQuery += ` AND ma.crew_id = '${crew_id}'`;
    }
    if (status) {
      allocationsQuery += ` AND ma.status = '${status}'`;
    }
    if (material_id) {
      allocationsQuery += ` AND ma.material_id = '${material_id}'`;
    }

    allocationsQuery += ` ORDER BY ma.allocation_date DESC`;

    const allocationsCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${allocationsQuery}"`;
    const result = await execAsync(allocationsCommand);

    const allocations = [];
    const lines = result.stdout.trim().split('\n').filter(line => line.trim());

    for (const line of lines) {
      const parts = line.split('|').map(part => part.trim());
      if (parts.length >= 16) {
        const allocatedQty = parseFloat(parts[4]) || 0;
        const usedQty = parseFloat(parts[5]) || 0;
        const defaultPrice = parseFloat(parts[12]) || 0;

        allocations.push({
          id: parts[0],
          material_id: parts[1],
          project_id: parts[2] || null,
          crew_id: parts[3] || null,
          allocated_qty: allocatedQty,
          used_qty: usedQty,
          allocation_date: parts[6],
          return_date: parts[7] || null,
          status: parts[8],
          notes: parts[9] || '',
          allocated_by: parts[10],
          material: {
            name: parts[11],
            unit: parts[12],
            default_price_eur: defaultPrice
          },
          project_name: parts[14] || null,
          crew_name: parts[15] || null,
          allocated_by_name: parts[16] && parts[17] ? `${parts[16]} ${parts[17]}` : 'Unknown',
          remaining_qty: allocatedQty - usedQty,
          total_value: allocatedQty * defaultPrice
        });
      }
    }

    return NextResponse.json(allocations);
  } catch (error) {
    console.error('Material allocations API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch material allocations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      material_id,
      project_id,
      crew_id,
      allocated_qty,
      allocation_date,
      notes,
      allocated_by
    } = body;

    if (!material_id || !allocated_qty || (!project_id && !crew_id)) {
      return NextResponse.json(
        { error: 'Material ID, quantity, and either project or crew ID are required' },
        { status: 400 }
      );
    }

    // Check if material exists and has enough available stock
    const materialCheckQuery = `
      SELECT
        m.id, m.name, m.unit,
        COALESCE(cw.total_qty, 0) as warehouse_total,
        COALESCE(cw.reserved_qty, 0) as reserved_qty,
        (COALESCE(cw.total_qty, 0) - COALESCE(cw.reserved_qty, 0)) as available_qty
      FROM materials m
      LEFT JOIN company_warehouse cw ON m.id = cw.material_id
      WHERE m.id = '${material_id}'
    `;

    const materialCheckCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${materialCheckQuery}"`;
    const materialResult = await execAsync(materialCheckCommand);

    if (!materialResult.stdout.trim()) {
      return NextResponse.json(
        { error: 'Material not found' },
        { status: 404 }
      );
    }

    const materialParts = materialResult.stdout.trim().split('|').map(part => part.trim());
    const availableQty = parseFloat(materialParts[5]) || 0;

    if (allocated_qty > availableQty) {
      return NextResponse.json(
        { error: `Insufficient stock. Available: ${availableQty} ${materialParts[3]}` },
        { status: 400 }
      );
    }

    // Verify project or crew exists
    if (project_id) {
      const projectCheckQuery = `SELECT id FROM projects WHERE id = '${project_id}'`;
      const projectCheckCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${projectCheckQuery}"`;
      const projectResult = await execAsync(projectCheckCommand);

      if (!projectResult.stdout.trim()) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }
    }

    if (crew_id) {
      const crewCheckQuery = `SELECT id FROM crews WHERE id = '${crew_id}'`;
      const crewCheckCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${crewCheckQuery}"`;
      const crewResult = await execAsync(crewCheckCommand);

      if (!crewResult.stdout.trim()) {
        return NextResponse.json(
          { error: 'Crew not found' },
          { status: 404 }
        );
      }
    }

    // Create allocation
    const allocationId = crypto.randomUUID();
    const createAllocationQuery = `
      INSERT INTO material_allocations (
        id, material_id, project_id, crew_id, allocated_qty, used_qty,
        allocation_date, status, notes, allocated_by
      ) VALUES (
        '${allocationId}',
        '${material_id}',
        ${project_id ? `'${project_id}'` : 'NULL'},
        ${crew_id ? `'${crew_id}'` : 'NULL'},
        ${allocated_qty},
        0,
        '${allocation_date || new Date().toISOString().split('T')[0]}',
        'allocated',
        '${(notes || '').replace(/'/g, "''")}',
        ${allocated_by ? `'${allocated_by}'` : 'NULL'}
      )
    `;

    const createAllocationCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${createAllocationQuery}"`;
    await execAsync(createAllocationCommand);

    // Update warehouse reserved quantity
    const updateWarehouseQuery = `
      UPDATE company_warehouse
      SET reserved_qty = COALESCE(reserved_qty, 0) + ${allocated_qty},
          last_updated = NOW()
      WHERE material_id = '${material_id}'
    `;

    const updateWarehouseCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${updateWarehouseQuery}"`;
    await execAsync(updateWarehouseCommand);

    // Log the material move (if table exists)
    const moveId = crypto.randomUUID();
    const logMoveQuery = `
      INSERT INTO material_moves (id, material_id, quantity, move_type, date, reason)
      VALUES (
        '${moveId}',
        '${material_id}',
        ${allocated_qty},
        'allocation',
        '${allocation_date || new Date().toISOString().split('T')[0]}',
        'Material allocated to ${project_id ? 'project' : 'crew'}'
      )
    `;

    const logMoveCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${logMoveQuery}"`;

    try {
      await execAsync(logMoveCommand);
    } catch (logError) {
      // Continue if logging fails - table might not exist
      console.warn('Failed to log material move:', logError);
    }

    return NextResponse.json({
      success: true,
      allocation_id: allocationId,
      message: `Successfully allocated ${allocated_qty} ${materialParts[3]} of ${materialParts[1]}`
    });
  } catch (error) {
    console.error('Create allocation error:', error);
    return NextResponse.json(
      { error: 'Failed to create allocation' },
      { status: 500 }
    );
  }
}