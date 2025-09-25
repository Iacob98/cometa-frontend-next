import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const supplierId = searchParams.get('supplier_id');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const per_page = parseInt(searchParams.get('per_page') || '20');

    // Build where clause
    const conditions = [];
    if (projectId) {
      conditions.push(`mo.project_id = '${projectId}'`);
    }
    if (supplierId) {
      conditions.push(`mo.supplier_id = '${supplierId}'`);
    }
    if (status) {
      conditions.push(`mo.status = '${status}'`);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const query = `
      SELECT
        mo.id,
        mo.project_id,
        mo.supplier_material_id,
        mo.quantity,
        mo.unit_price_eur,
        mo.delivery_cost_eur,
        mo.total_cost_eur,
        mo.status,
        mo.order_date,
        mo.expected_delivery_date,
        mo.actual_delivery_date,
        mo.notes,
        mo.ordered_by,
        mo.created_at,
        sm.material_type,
        sm.unit,
        s.org_name as supplier_name,
        p.name as project_name,
        u.first_name || ' ' || u.last_name as ordered_by_name
      FROM material_orders mo
      LEFT JOIN supplier_materials sm ON mo.supplier_material_id = sm.id
      LEFT JOIN suppliers s ON sm.supplier_id = s.id
      LEFT JOIN projects p ON mo.project_id = p.id
      LEFT JOIN users u ON mo.ordered_by = u.id
      ${whereClause}
      ORDER BY mo.created_at DESC
      LIMIT ${per_page} OFFSET ${(page - 1) * per_page}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM material_orders mo
      ${whereClause}
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${query}"`;
    const countCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${countQuery}"`;

    const [{ stdout }, { stdout: countStdout }] = await Promise.all([
      execAsync(command),
      execAsync(countCommand)
    ]);

    const orders = [];
    const orderLines = stdout.trim().split('\n').filter(line => line.trim());

    for (const line of orderLines) {
      const parts = line.split('|').map(part => part.trim());
      if (parts.length >= 15) {
        orders.push({
          id: parts[0],
          project_id: parts[1],
          supplier_id: parts[2],
          order_number: parts[3],
          status: parts[4],
          order_date: parts[5] || null,
          expected_delivery_date: parts[6] || null,
          actual_delivery_date: parts[7] || null,
          total_cost: parseFloat(parts[8]) || 0,
          notes: parts[9] || '',
          created_by: parts[10],
          created_at: parts[11] || null,
          updated_at: parts[12] || null,
          supplier_name: parts[13] || '',
          project_name: parts[14] || '',
          created_by_name: parts[15] || ''
        });
      }
    }

    const total = parseInt(countStdout.trim()) || 0;

    return NextResponse.json({
      items: orders,
      total,
      page,
      per_page,
      total_pages: Math.ceil(total / per_page)
    });
  } catch (error) {
    console.error('Get material orders error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch material orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      project_id,
      supplier_material_id,
      quantity,
      unit_price_eur,
      delivery_cost_eur,
      expected_delivery_date,
      notes
    } = body;

    if (!supplier_material_id || !quantity) {
      return NextResponse.json(
        { error: 'Supplier material ID and quantity are required' },
        { status: 400 }
      );
    }

    // Get supplier material details for pricing if not provided
    if (!unit_price_eur) {
      const materialQuery = `
        SELECT unit_price_eur, delivery_cost_eur
        FROM supplier_materials
        WHERE id = '${supplier_material_id}'
      `;
      const materialCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${materialQuery}"`;
      const { stdout: materialResult } = await execAsync(materialCommand);

      if (!materialResult.trim()) {
        return NextResponse.json(
          { error: 'Supplier material not found' },
          { status: 404 }
        );
      }
    }

    const orderId = crypto.randomUUID();
    const unitPrice = unit_price_eur || 0;
    const deliveryCost = delivery_cost_eur || 0;
    const totalCost = (unitPrice * quantity) + deliveryCost;

    // Insert order
    const insertOrderQuery = `
      INSERT INTO material_orders (
        id, project_id, supplier_material_id, quantity, unit_price_eur,
        delivery_cost_eur, total_cost_eur, status, order_date,
        expected_delivery_date, notes, ordered_by
      )
      VALUES (
        '${orderId}',
        ${project_id ? `'${project_id}'` : 'NULL'},
        '${supplier_material_id}',
        ${quantity},
        ${unitPrice},
        ${deliveryCost},
        ${totalCost},
        'ordered',
        CURRENT_DATE,
        ${expected_delivery_date ? `'${expected_delivery_date}'` : 'NULL'},
        ${notes ? `'${notes.replace(/'/g, "''")}'` : 'NULL'},
        'admin-user-id'
      )
      RETURNING id, project_id, supplier_material_id, quantity, unit_price_eur,
                delivery_cost_eur, total_cost_eur, status, order_date,
                expected_delivery_date, notes, ordered_by, created_at
    `;

    const orderCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${insertOrderQuery}"`;
    const { stdout: orderResult } = await execAsync(orderCommand);

    if (!orderResult.trim()) {
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    const result = orderResult.trim().split('|').map(part => part.trim());

    const newOrder = {
      id: result[0],
      project_id: result[1] || null,
      supplier_material_id: result[2],
      quantity: parseFloat(result[3]) || 0,
      unit_price_eur: parseFloat(result[4]) || 0,
      delivery_cost_eur: parseFloat(result[5]) || 0,
      total_cost_eur: parseFloat(result[6]) || 0,
      status: result[7],
      order_date: result[8],
      expected_delivery_date: result[9] || null,
      notes: result[10] || '',
      ordered_by: result[11],
      created_at: result[12]
    };

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error('Create material order error:', error);
    return NextResponse.json(
      { error: 'Failed to create material order' },
      { status: 500 }
    );
  }
}