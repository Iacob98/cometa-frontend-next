import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    // Query for materials with low stock
    const lowStockQuery = `
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
      WHERE COALESCE(cw.total_qty, 0) <= COALESCE(cw.min_stock_level, 0)
        AND COALESCE(cw.min_stock_level, 0) > 0
      ORDER BY m.name
    `;

    const lowStockCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${lowStockQuery}"`;
    const result = await execAsync(lowStockCommand);

    const materials = [];
    const materialLines = result.stdout.trim().split('\n').filter(line => line.trim());

    for (const line of materialLines) {
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

        materials.push({
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
        });
      }
    }

    return NextResponse.json(materials);
  } catch (error) {
    console.error('Low stock materials API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch low stock materials' },
      { status: 500 }
    );
  }
}