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

    const materialsQuery = `
      SELECT
        m.id,
        m.name,
        m.description,
        m.unit,
        m.sku,
        m.default_price_eur,
        m.purchase_price_eur,
        m.current_stock_qty,
        COALESCE(cw.total_qty, 0) as warehouse_total_qty,
        COALESCE(cw.reserved_qty, 0) as reserved_qty,
        COALESCE(cw.min_stock_level, 0) as min_stock_level,
        (COALESCE(cw.total_qty, 0) - COALESCE(cw.reserved_qty, 0)) as available_qty,
        cw.last_updated
      FROM materials m
      LEFT JOIN company_warehouse cw ON m.id = cw.material_id
      WHERE m.id = '${id}'
    `;

    const materialCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${materialsQuery}"`;
    const result = await execAsync(materialCommand);

    const line = result.stdout.trim();
    if (!line) {
      return NextResponse.json(
        { error: 'Material not found' },
        { status: 404 }
      );
    }

    const parts = line.split('|').map(part => part.trim());
    if (parts.length >= 10) {
      const warehouseTotal = parseFloat(parts[7]) || 0;
      const reserved = parseFloat(parts[8]) || 0;
      const minStock = parseFloat(parts[9]) || 0;
      const available = parseFloat(parts[10]) || 0;

      // Determine category based on material name/description (simplified)
      let category = "Other";
      const nameUpper = parts[1].toUpperCase();
      if (nameUpper.includes("CABLE") || nameUpper.includes("FIBER")) category = "Cables";
      else if (nameUpper.includes("CONNECTOR") || nameUpper.includes("SPLICE")) category = "Connectors";
      else if (nameUpper.includes("TOOL")) category = "Tools";
      else if (nameUpper.includes("CONDUIT") || nameUpper.includes("DUCT")) category = "Conduits";
      else if (nameUpper.includes("EQUIPMENT")) category = "Equipment";

      const material = {
        id: parts[0],
        name: parts[1],
        description: parts[2] || '',
        unit: parts[3],
        sku: parts[4] || '',
        default_price_eur: parseFloat(parts[5]) || 0,
        purchase_price_eur: parseFloat(parts[6]) || 0,
        current_stock_qty: warehouseTotal,
        reserved_qty: reserved,
        available_qty: available,
        min_stock_level: minStock,
        unit_cost: parseFloat(parts[6]) || parseFloat(parts[5]) || 0,
        category: category,
        last_updated: parts[11] || null,
        storage_location: "Main Warehouse",
        supplier: {
          id: "default",
          name: "Default Supplier"
        }
      };

      return NextResponse.json(material);
    }

    return NextResponse.json(
      { error: 'Material not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Get material error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch material' },
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
    const {
      name,
      description,
      unit,
      sku,
      default_price_eur,
      purchase_price_eur,
      min_stock_level
    } = body;

    if (!name || !unit) {
      return NextResponse.json(
        { error: 'Name and unit are required' },
        { status: 400 }
      );
    }

    // Update material
    const updateMaterialQuery = `
      UPDATE materials
      SET
        name = '${name.replace(/'/g, "''")}',
        description = '${(description || '').replace(/'/g, "''")}',
        unit = '${unit}',
        sku = '${sku || ''}',
        default_price_eur = ${default_price_eur || 0},
        purchase_price_eur = ${purchase_price_eur || 0}
      WHERE id = '${id}'
    `;

    const materialCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${updateMaterialQuery}"`;
    await execAsync(materialCommand);

    // Update warehouse min stock level if provided
    if (min_stock_level !== undefined) {
      const updateWarehouseQuery = `
        UPDATE company_warehouse
        SET min_stock_level = ${min_stock_level}, last_updated = NOW()
        WHERE material_id = '${id}'
      `;

      const warehouseCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${updateWarehouseQuery}"`;
      await execAsync(warehouseCommand);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update material error:', error);
    return NextResponse.json(
      { error: 'Failed to update material' },
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

    // Check if material is used in allocations
    const checkQuery = `
      SELECT COUNT(*) as count
      FROM material_allocations
      WHERE material_id = '${id}'
    `;

    const checkCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${checkQuery}"`;
    const checkResult = await execAsync(checkCommand);
    const count = parseInt(checkResult.stdout.trim()) || 0;

    if (count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete material: it is used in allocations' },
        { status: 400 }
      );
    }

    // Delete warehouse entry first (due to foreign key)
    const deleteWarehouseQuery = `DELETE FROM company_warehouse WHERE material_id = '${id}'`;
    const warehouseCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${deleteWarehouseQuery}"`;
    await execAsync(warehouseCommand);

    // Delete material
    const deleteMaterialQuery = `DELETE FROM materials WHERE id = '${id}'`;
    const materialCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${deleteMaterialQuery}"`;
    await execAsync(materialCommand);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete material error:', error);
    return NextResponse.json(
      { error: 'Failed to delete material' },
      { status: 500 }
    );
  }
}