import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { quantity, reason } = body;

    if (!quantity || !reason) {
      return NextResponse.json(
        { error: 'Quantity and reason are required' },
        { status: 400 }
      );
    }

    // Check if material exists
    const materialCheckQuery = `SELECT id FROM materials WHERE id = '${id}'`;
    const materialCheckCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${materialCheckQuery}"`;
    const materialCheckResult = await execAsync(materialCheckCommand);

    if (!materialCheckResult.stdout.trim()) {
      return NextResponse.json(
        { error: 'Material not found' },
        { status: 404 }
      );
    }

    // Check if warehouse entry exists
    const warehouseCheckQuery = `SELECT id, total_qty FROM company_warehouse WHERE material_id = '${id}'`;
    const warehouseCheckCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${warehouseCheckQuery}"`;
    const warehouseCheckResult = await execAsync(warehouseCheckCommand);

    let warehouseId;
    let currentQty = 0;

    if (warehouseCheckResult.stdout.trim()) {
      const parts = warehouseCheckResult.stdout.trim().split('|').map(part => part.trim());
      warehouseId = parts[0];
      currentQty = parseFloat(parts[1]) || 0;
    } else {
      // Create warehouse entry if it doesn't exist
      warehouseId = crypto.randomUUID();
      const createWarehouseQuery = `
        INSERT INTO company_warehouse (id, material_id, total_qty, reserved_qty, min_stock_level, last_updated)
        VALUES ('${warehouseId}', '${id}', 0, 0, 0, NOW())
      `;
      const createWarehouseCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${createWarehouseQuery}"`;
      await execAsync(createWarehouseCommand);
    }

    // Calculate new quantity
    const newQty = Math.max(0, currentQty + quantity); // Prevent negative stock

    // Update warehouse quantity
    const updateWarehouseQuery = `
      UPDATE company_warehouse
      SET total_qty = ${newQty}, last_updated = NOW()
      WHERE id = '${warehouseId}'
    `;
    const updateWarehouseCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${updateWarehouseQuery}"`;
    await execAsync(updateWarehouseCommand);

    // Update material current stock
    const updateMaterialQuery = `
      UPDATE materials
      SET current_stock_qty = ${newQty}
      WHERE id = '${id}'
    `;
    const updateMaterialCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${updateMaterialQuery}"`;
    await execAsync(updateMaterialCommand);

    // Log the adjustment (if you have a material_moves table)
    const moveId = crypto.randomUUID();
    const logMoveQuery = `
      INSERT INTO material_moves (id, material_id, quantity, reason, created_at)
      VALUES ('${moveId}', '${id}', ${quantity}, '${reason.replace(/'/g, "''")}', NOW())
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
      old_quantity: currentQty,
      new_quantity: newQty,
      adjustment: quantity,
      reason
    });
  } catch (error) {
    console.error('Stock adjustment error:', error);
    return NextResponse.json(
      { error: 'Failed to adjust stock' },
      { status: 500 }
    );
  }
}