import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const allocationQuery = `
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
      WHERE ma.id = '${id}'
    `;

    const allocationCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${allocationQuery}"`;
    const result = await execAsync(allocationCommand);

    const line = result.stdout.trim();
    if (!line) {
      return NextResponse.json(
        { error: 'Allocation not found' },
        { status: 404 }
      );
    }

    const parts = line.split('|').map(part => part.trim());
    if (parts.length >= 16) {
      const allocatedQty = parseFloat(parts[4]) || 0;
      const usedQty = parseFloat(parts[5]) || 0;
      const defaultPrice = parseFloat(parts[13]) || 0;

      const allocation = {
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
      };

      return NextResponse.json(allocation);
    }

    return NextResponse.json(
      { error: 'Allocation not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Get allocation error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch allocation' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { used_qty, status, notes, return_date } = body;

    // Get current allocation
    const getCurrentQuery = `
      SELECT allocated_qty, used_qty, status, material_id
      FROM material_allocations
      WHERE id = '${id}'
    `;

    const getCurrentCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${getCurrentQuery}"`;
    const currentResult = await execAsync(getCurrentCommand);

    if (!currentResult.stdout.trim()) {
      return NextResponse.json(
        { error: 'Allocation not found' },
        { status: 404 }
      );
    }

    const currentParts = currentResult.stdout.trim().split('|').map(part => part.trim());
    const allocatedQty = parseFloat(currentParts[0]) || 0;
    const currentUsedQty = parseFloat(currentParts[1]) || 0;
    const currentStatus = currentParts[2];
    const materialId = currentParts[3];

    // Validate used quantity
    if (used_qty !== undefined) {
      if (used_qty < 0 || used_qty > allocatedQty) {
        return NextResponse.json(
          { error: `Used quantity must be between 0 and ${allocatedQty}` },
          { status: 400 }
        );
      }
    }

    // Build update query
    const updates = [];
    if (used_qty !== undefined) {
      updates.push(`used_qty = ${used_qty}`);
    }
    if (status !== undefined) {
      updates.push(`status = '${status}'`);
    }
    if (notes !== undefined) {
      updates.push(`notes = '${notes.replace(/'/g, "''")}'`);
    }
    if (return_date !== undefined) {
      updates.push(`return_date = ${return_date ? `'${return_date}'` : 'NULL'}`);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const updateQuery = `
      UPDATE material_allocations
      SET ${updates.join(', ')}
      WHERE id = '${id}'
    `;

    const updateCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${updateQuery}"`;
    await execAsync(updateCommand);

    // Update warehouse reserved quantity if material is being returned
    if (status === 'returned' || (return_date && status !== currentStatus)) {
      const returnedQty = allocatedQty - (used_qty !== undefined ? used_qty : currentUsedQty);
      if (returnedQty > 0) {
        const updateWarehouseQuery = `
          UPDATE company_warehouse
          SET reserved_qty = GREATEST(0, COALESCE(reserved_qty, 0) - ${returnedQty}),
              total_qty = COALESCE(total_qty, 0) + ${returnedQty},
              last_updated = NOW()
          WHERE material_id = '${materialId}'
        `;

        const updateWarehouseCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${updateWarehouseQuery}"`;
        await execAsync(updateWarehouseCommand);

        // Log the return
        const moveId = crypto.randomUUID();
        const logMoveQuery = `
          INSERT INTO material_moves (id, material_id, quantity, move_type, date, reason)
          VALUES (
            '${moveId}',
            '${materialId}',
            ${returnedQty},
            'return',
            '${return_date || new Date().toISOString().split('T')[0]}',
            'Material returned from allocation'
          )
        `;

        const logMoveCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${logMoveQuery}"`;

        try {
          await execAsync(logMoveCommand);
        } catch (logError) {
          console.warn('Failed to log material return:', logError);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update allocation error:', error);
    return NextResponse.json(
      { error: 'Failed to update allocation' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get allocation details before deletion
    const getAllocationQuery = `
      SELECT allocated_qty, used_qty, status, material_id
      FROM material_allocations
      WHERE id = '${id}'
    `;

    const getAllocationCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${getAllocationQuery}"`;
    const allocationResult = await execAsync(getAllocationCommand);

    if (!allocationResult.stdout.trim()) {
      return NextResponse.json(
        { error: 'Allocation not found' },
        { status: 404 }
      );
    }

    const parts = allocationResult.stdout.trim().split('|').map(part => part.trim());
    const allocatedQty = parseFloat(parts[0]) || 0;
    const usedQty = parseFloat(parts[1]) || 0;
    const status = parts[2];
    const materialId = parts[3];

    // Check if allocation can be deleted (only if not started or fully returned)
    if (status === 'partially_used' || status === 'fully_used') {
      return NextResponse.json(
        { error: 'Cannot delete allocation that has been used. Please return materials first.' },
        { status: 400 }
      );
    }

    // Delete the allocation
    const deleteQuery = `DELETE FROM material_allocations WHERE id = '${id}'`;
    const deleteCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${deleteQuery}"`;
    await execAsync(deleteCommand);

    // Return reserved quantity to warehouse if allocation was active
    if (status === 'allocated') {
      const updateWarehouseQuery = `
        UPDATE company_warehouse
        SET reserved_qty = GREATEST(0, COALESCE(reserved_qty, 0) - ${allocatedQty}),
            last_updated = NOW()
        WHERE material_id = '${materialId}'
      `;

      const updateWarehouseCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${updateWarehouseQuery}"`;
      await execAsync(updateWarehouseCommand);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete allocation error:', error);
    return NextResponse.json(
      { error: 'Failed to delete allocation' },
      { status: 500 }
    );
  }
}