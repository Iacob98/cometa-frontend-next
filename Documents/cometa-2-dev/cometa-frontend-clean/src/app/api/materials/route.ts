import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const per_page = parseInt(searchParams.get('per_page') || '20');
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const low_stock = searchParams.get('low_stock');

    // Build base query to get materials with warehouse info
    let materialsQuery = `
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
      WHERE 1=1
    `;

    const whereConditions = [];

    // Add search filter
    if (search) {
      whereConditions.push(`(LOWER(m.name) LIKE LOWER('%${search}%') OR LOWER(m.description) LIKE LOWER('%${search}%'))`);
    }

    // Add category filter (we'll need to categorize materials somehow)
    if (category && category !== 'all') {
      whereConditions.push(`LOWER(m.name) LIKE LOWER('%${category}%')`);
    }

    // Add low stock filter
    if (low_stock === 'true') {
      whereConditions.push(`COALESCE(cw.total_qty, 0) <= COALESCE(cw.min_stock_level, 0)`);
    }

    if (whereConditions.length > 0) {
      materialsQuery += ` AND ${whereConditions.join(' AND ')}`;
    }

    materialsQuery += ` ORDER BY m.name`;

    // Add pagination
    const offset = (page - 1) * per_page;
    materialsQuery += ` LIMIT ${per_page} OFFSET ${offset}`;

    // Count query for total
    let countQuery = `
      SELECT COUNT(*) as total
      FROM materials m
      LEFT JOIN company_warehouse cw ON m.id = cw.material_id
      WHERE 1=1
    `;

    if (whereConditions.length > 0) {
      countQuery += ` AND ${whereConditions.join(' AND ')}`;
    }

    // Execute queries
    const materialsCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${materialsQuery}"`;
    const countCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${countQuery}"`;

    const [materialsResult, countResult] = await Promise.all([
      execAsync(materialsCommand),
      execAsync(countCommand)
    ]);

    // Parse count
    const total = parseInt(countResult.stdout.trim()) || 0;

    // Parse materials
    const materials = [];
    const materialLines = materialsResult.stdout.trim().split('\n').filter(line => line.trim());

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
          storage_location: "Main Warehouse", // Default for now
          supplier: {
            id: "default",
            name: "Default Supplier"
          }
        });
      }
    }

    return NextResponse.json({
      items: materials,
      total: total,
      page: page,
      per_page: per_page,
      total_pages: Math.ceil(total / per_page)
    });
  } catch (error) {
    console.error('Materials API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch materials' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      unit,
      sku,
      default_price_eur,
      purchase_price_eur,
      initial_stock,
      min_stock_level
    } = body;

    if (!name || !unit) {
      return NextResponse.json(
        { error: 'Name and unit are required' },
        { status: 400 }
      );
    }

    // Generate UUID for new material
    const materialId = crypto.randomUUID();

    // Insert new material
    const insertMaterialQuery = `
      INSERT INTO materials (id, name, description, unit, sku, default_price_eur, purchase_price_eur, current_stock_qty)
      VALUES ('${materialId}', '${name.replace(/'/g, "''")}', '${(description || '').replace(/'/g, "''")}', '${unit}', '${sku || ''}', ${default_price_eur || 0}, ${purchase_price_eur || 0}, ${initial_stock || 0})
    `;

    const materialCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${insertMaterialQuery}"`;
    await execAsync(materialCommand);

    // If initial stock provided, create warehouse entry
    if (initial_stock && initial_stock > 0) {
      const warehouseId = crypto.randomUUID();
      const insertWarehouseQuery = `
        INSERT INTO company_warehouse (id, material_id, total_qty, reserved_qty, min_stock_level, last_updated)
        VALUES ('${warehouseId}', '${materialId}', ${initial_stock}, 0, ${min_stock_level || 0}, NOW())
      `;

      const warehouseCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${insertWarehouseQuery}"`;
      await execAsync(warehouseCommand);
    }

    const newMaterial = {
      id: materialId,
      name,
      description,
      unit,
      sku,
      default_price_eur: default_price_eur || 0,
      purchase_price_eur: purchase_price_eur || 0,
      current_stock_qty: initial_stock || 0,
      reserved_qty: 0,
      available_qty: initial_stock || 0,
      min_stock_level: min_stock_level || 0,
      unit_cost: purchase_price_eur || default_price_eur || 0,
      category: "Other",
      storage_location: "Main Warehouse",
      supplier: {
        id: "default",
        name: "Default Supplier"
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return NextResponse.json(newMaterial, { status: 201 });
  } catch (error) {
    console.error('Create material error:', error);
    return NextResponse.json(
      { error: 'Failed to create material' },
      { status: 500 }
    );
  }
}