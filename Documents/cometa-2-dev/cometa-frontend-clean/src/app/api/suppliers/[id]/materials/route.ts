import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: supplierId } = await params;
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    if (!supplierId) {
      return NextResponse.json(
        { error: 'Supplier ID is required' },
        { status: 400 }
      );
    }

    let query = `
      SELECT
        sm.id,
        sm.supplier_id,
        sm.project_id,
        sm.material_type,
        sm.unit,
        sm.unit_price_eur,
        sm.currency,
        sm.has_delivery,
        sm.delivery_cost_eur,
        sm.pickup_address,
        sm.min_order_quantity,
        sm.notes,
        sm.is_active,
        sm.created_at,
        p.name as project_name
      FROM supplier_materials sm
      LEFT JOIN projects p ON sm.project_id = p.id
      WHERE sm.supplier_id = '${supplierId}' AND sm.is_active = true
    `;

    if (projectId) {
      query += ` AND sm.project_id = '${projectId}'`;
    }

    query += ` ORDER BY sm.material_type ASC`;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${query}"`;
    const { stdout } = await execAsync(command);

    const materials = [];
    const materialLines = stdout.trim().split('\n').filter(line => line.trim());

    for (const line of materialLines) {
      const parts = line.split('|').map(part => part.trim());
      if (parts.length >= 13) {
        materials.push({
          id: parts[0],
          supplier_id: parts[1],
          project_id: parts[2] || null,
          material_type: parts[3] || '',
          unit: parts[4] || '',
          unit_price_eur: parseFloat(parts[5]) || 0,
          currency: parts[6] || 'EUR',
          has_delivery: parts[7] === 't',
          delivery_cost_eur: parseFloat(parts[8]) || null,
          pickup_address: parts[9] || null,
          min_order_quantity: parseFloat(parts[10]) || 0,
          notes: parts[11] || '',
          is_active: parts[12] === 't',
          created_at: parts[13] || null,
          project_name: parts[14] || null
        });
      }
    }

    return NextResponse.json(materials);
  } catch (error) {
    console.error('Get supplier materials error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supplier materials' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: supplierId } = await params;
    const body = await request.json();
    const {
      project_id,
      material_type,
      unit,
      unit_price_eur,
      has_delivery,
      delivery_cost_eur,
      pickup_address,
      min_order_quantity,
      notes
    } = body;

    if (!supplierId || !material_type || !unit || unit_price_eur === undefined) {
      return NextResponse.json(
        { error: 'Supplier ID, material type, unit, and price are required' },
        { status: 400 }
      );
    }

    // Validate unit against constraint
    const validUnits = ['ton', 'm3', 'kg', 'piece', 'meter', 'liter', 'box', 'pallet'];
    if (!validUnits.includes(unit)) {
      return NextResponse.json(
        { error: `Invalid unit. Must be one of: ${validUnits.join(', ')}` },
        { status: 400 }
      );
    }

    // Generate UUID for new material
    const materialId = crypto.randomUUID();

    // Insert new supplier material
    const insertQuery = `
      INSERT INTO supplier_materials (
        id, supplier_id, project_id, material_type, unit, unit_price_eur, currency,
        has_delivery, delivery_cost_eur, pickup_address, min_order_quantity, notes, is_active
      )
      VALUES (
        '${materialId}',
        '${supplierId}',
        ${project_id ? `'${project_id}'` : 'NULL'},
        '${material_type.replace(/'/g, "''")}',
        '${unit}',
        ${unit_price_eur},
        'EUR',
        ${has_delivery || false},
        ${delivery_cost_eur || 'NULL'},
        ${pickup_address ? `'${pickup_address.replace(/'/g, "''")}'` : 'NULL'},
        ${min_order_quantity || 0},
        ${notes ? `'${notes.replace(/'/g, "''")}'` : 'NULL'},
        true
      )
      RETURNING id, supplier_id, project_id, material_type, unit, unit_price_eur, currency,
                has_delivery, delivery_cost_eur, pickup_address, min_order_quantity, notes, is_active, created_at
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${insertQuery}"`;
    const { stdout } = await execAsync(command);

    const result = stdout.trim().split('|').map(part => part.trim());

    const newMaterial = {
      id: result[0],
      supplier_id: result[1],
      project_id: result[2] || null,
      material_type: result[3] || '',
      unit: result[4] || '',
      unit_price_eur: parseFloat(result[5]) || 0,
      currency: result[6] || 'EUR',
      has_delivery: result[7] === 't',
      delivery_cost_eur: parseFloat(result[8]) || null,
      pickup_address: result[9] || null,
      min_order_quantity: parseFloat(result[10]) || 0,
      notes: result[11] || '',
      is_active: result[12] === 't',
      created_at: result[13] || null
    };

    return NextResponse.json(newMaterial, { status: 201 });
  } catch (error) {
    console.error('Create supplier material error:', error);
    return NextResponse.json(
      { error: 'Failed to create supplier material' },
      { status: 500 }
    );
  }
}