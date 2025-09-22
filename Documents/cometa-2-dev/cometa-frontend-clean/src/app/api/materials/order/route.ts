import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const status = searchParams.get('status');

    // Build query for material orders
    let ordersQuery = `
      SELECT
        mo.id,
        mo.project_id,
        mo.supplier_id,
        mo.status,
        mo.order_date,
        mo.expected_delivery_date,
        mo.actual_delivery_date,
        mo.total_amount_eur,
        mo.notes,
        p.name as project_name,
        s.org_name as supplier_name,
        s.contact_person,
        s.phone as supplier_phone,
        s.email as supplier_email
      FROM material_orders mo
      LEFT JOIN projects p ON mo.project_id = p.id
      LEFT JOIN suppliers s ON mo.supplier_id = s.id
      WHERE 1=1
    `;

    const whereConditions = [];

    if (projectId) {
      whereConditions.push(`mo.project_id = '${projectId}'`);
    }

    if (status && status !== 'all') {
      whereConditions.push(`mo.status = '${status}'`);
    }

    if (whereConditions.length > 0) {
      ordersQuery += ` AND ${whereConditions.join(' AND ')}`;
    }

    ordersQuery += ` ORDER BY mo.order_date DESC`;

    const ordersCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${ordersQuery}"`;
    const ordersResult = await execAsync(ordersCommand);

    const orders = [];
    const orderLines = ordersResult.stdout.trim().split('\n').filter(line => line.trim());

    for (const line of orderLines) {
      const parts = line.split('|').map(part => part.trim());
      if (parts.length >= 12) {
        // Get order items for this order
        const itemsQuery = `
          SELECT
            moi.material_id,
            moi.quantity,
            moi.unit_price_eur,
            moi.total_price_eur,
            m.name as material_name,
            m.unit as material_unit
          FROM material_order_items moi
          LEFT JOIN materials m ON moi.material_id = m.id
          WHERE moi.order_id = '${parts[0]}'
        `;

        const itemsCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${itemsQuery}"`;

        let items = [];
        try {
          const itemsResult = await execAsync(itemsCommand);
          const itemLines = itemsResult.stdout.trim().split('\n').filter(line => line.trim());

          for (const itemLine of itemLines) {
            const itemParts = itemLine.split('|').map(part => part.trim());
            if (itemParts.length >= 6) {
              items.push({
                material_id: itemParts[0],
                quantity: parseFloat(itemParts[1]) || 0,
                unit_price_eur: parseFloat(itemParts[2]) || 0,
                total_price_eur: parseFloat(itemParts[3]) || 0,
                material_name: itemParts[4] || '',
                material_unit: itemParts[5] || ''
              });
            }
          }
        } catch (itemsError) {
          console.warn(`Failed to fetch items for order ${parts[0]}:`, itemsError);
        }

        orders.push({
          id: parts[0],
          project_id: parts[1] || null,
          supplier_id: parts[2] || null,
          status: parts[3] || 'pending',
          order_date: parts[4] || null,
          expected_delivery_date: parts[5] || null,
          actual_delivery_date: parts[6] || null,
          total_amount_eur: parseFloat(parts[7]) || 0,
          notes: parts[8] || null,
          project_name: parts[9] || null,
          supplier_name: parts[10] || null,
          supplier_contact: {
            person: parts[11] || null,
            phone: parts[12] || null,
            email: parts[13] || null
          },
          items: items,
          item_count: items.length
        });
      }
    }

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Material orders API error:', error);

    // Return empty array as fallback
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      project_id,
      supplier_id,
      expected_delivery_date,
      notes,
      items = []
    } = body;

    if (!supplier_id || !items.length) {
      return NextResponse.json(
        { error: 'Supplier and items are required' },
        { status: 400 }
      );
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum: number, item: any) => {
      return sum + (item.quantity * item.unit_price_eur);
    }, 0);

    // Generate UUID for new order
    const orderId = crypto.randomUUID();

    // Insert new material order
    const insertOrderQuery = `
      INSERT INTO material_orders (id, project_id, supplier_id, status, order_date, expected_delivery_date, total_amount_eur, notes)
      VALUES (
        '${orderId}',
        ${project_id ? `'${project_id}'` : 'NULL'},
        '${supplier_id}',
        'pending',
        NOW(),
        ${expected_delivery_date ? `'${expected_delivery_date}'` : 'NULL'},
        ${totalAmount},
        ${notes ? `'${notes.replace(/'/g, "''")}'` : 'NULL'}
      )
    `;

    const orderCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${insertOrderQuery}"`;
    await execAsync(orderCommand);

    // Insert order items
    for (const item of items) {
      const itemId = crypto.randomUUID();
      const totalPrice = item.quantity * item.unit_price_eur;

      const insertItemQuery = `
        INSERT INTO material_order_items (id, order_id, material_id, quantity, unit_price_eur, total_price_eur)
        VALUES ('${itemId}', '${orderId}', '${item.material_id}', ${item.quantity}, ${item.unit_price_eur}, ${totalPrice})
      `;

      const itemCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${insertItemQuery}"`;
      await execAsync(itemCommand);
    }

    const newOrder = {
      id: orderId,
      project_id,
      supplier_id,
      status: 'pending',
      order_date: new Date().toISOString(),
      expected_delivery_date,
      total_amount_eur: totalAmount,
      notes,
      items: items,
      item_count: items.length
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