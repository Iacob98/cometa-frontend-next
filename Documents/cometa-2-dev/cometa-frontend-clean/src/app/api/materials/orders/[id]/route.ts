import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Get order details
    const orderQuery = `
      SELECT
        mo.id,
        mo.project_id,
        mo.supplier_id,
        mo.order_number,
        mo.status,
        mo.order_date,
        mo.expected_delivery_date,
        mo.actual_delivery_date,
        mo.total_cost,
        mo.notes,
        mo.created_by,
        mo.created_at,
        mo.updated_at,
        s.org_name as supplier_name,
        s.contact_person as supplier_contact,
        s.phone as supplier_phone,
        s.email as supplier_email,
        p.name as project_name,
        u.first_name || ' ' || u.last_name as created_by_name
      FROM material_orders mo
      LEFT JOIN suppliers s ON mo.supplier_id = s.id
      LEFT JOIN projects p ON mo.project_id = p.id
      LEFT JOIN users u ON mo.created_by = u.id
      WHERE mo.id = '${orderId}'
    `;

    // Get order items
    const itemsQuery = `
      SELECT
        moi.id,
        moi.material_id,
        moi.quantity,
        moi.unit_cost,
        moi.total_cost,
        m.name as material_name,
        m.unit as material_unit,
        m.sku as material_sku
      FROM material_order_items moi
      LEFT JOIN materials m ON moi.material_id = m.id
      WHERE moi.order_id = '${orderId}'
      ORDER BY m.name
    `;

    const orderCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${orderQuery}"`;
    const itemsCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${itemsQuery}"`;

    const [{ stdout: orderStdout }, { stdout: itemsStdout }] = await Promise.all([
      execAsync(orderCommand),
      execAsync(itemsCommand)
    ]);

    if (!orderStdout.trim()) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Parse order details
    const orderParts = orderStdout.trim().split('|').map(part => part.trim());
    const order = {
      id: orderParts[0],
      project_id: orderParts[1],
      supplier_id: orderParts[2],
      order_number: orderParts[3],
      status: orderParts[4],
      order_date: orderParts[5] || null,
      expected_delivery_date: orderParts[6] || null,
      actual_delivery_date: orderParts[7] || null,
      total_cost: parseFloat(orderParts[8]) || 0,
      notes: orderParts[9] || '',
      created_by: orderParts[10],
      created_at: orderParts[11] || null,
      updated_at: orderParts[12] || null,
      supplier_name: orderParts[13] || '',
      supplier_contact: orderParts[14] || '',
      supplier_phone: orderParts[15] || '',
      supplier_email: orderParts[16] || '',
      project_name: orderParts[17] || '',
      created_by_name: orderParts[18] || ''
    };

    // Parse order items
    const items = [];
    const itemLines = itemsStdout.trim().split('\n').filter(line => line.trim());

    for (const line of itemLines) {
      const parts = line.split('|').map(part => part.trim());
      if (parts.length >= 8) {
        items.push({
          id: parts[0],
          material_id: parts[1],
          quantity: parseFloat(parts[2]) || 0,
          unit_cost: parseFloat(parts[3]) || 0,
          total_cost: parseFloat(parts[4]) || 0,
          material_name: parts[5] || '',
          material_unit: parts[6] || '',
          material_sku: parts[7] || ''
        });
      }
    }

    return NextResponse.json({
      ...order,
      items
    });
  } catch (error) {
    console.error('Get material order error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch material order' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await request.json();
    const { status, actual_delivery_date, notes } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Build update query
    const updates = [];
    if (status) {
      updates.push(`status = '${status}'`);
    }
    if (actual_delivery_date) {
      updates.push(`actual_delivery_date = '${actual_delivery_date}'`);
    }
    if (notes !== undefined) {
      updates.push(`notes = ${notes ? `'${notes.replace(/'/g, "''")}'` : 'NULL'}`);
    }
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updates.length === 1) { // Only updated_at
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const updateQuery = `
      UPDATE material_orders
      SET ${updates.join(', ')}
      WHERE id = '${orderId}'
      RETURNING id, project_id, supplier_id, order_number, status, order_date,
                expected_delivery_date, actual_delivery_date, total_cost, notes,
                created_by, created_at, updated_at
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${updateQuery}"`;
    const { stdout } = await execAsync(command);

    if (!stdout.trim()) {
      return NextResponse.json(
        { error: 'Order not found or update failed' },
        { status: 404 }
      );
    }

    const result = stdout.trim().split('|').map(part => part.trim());

    const updatedOrder = {
      id: result[0],
      project_id: result[1],
      supplier_id: result[2],
      order_number: result[3],
      status: result[4],
      order_date: result[5],
      expected_delivery_date: result[6] || null,
      actual_delivery_date: result[7] || null,
      total_cost: parseFloat(result[8]) || 0,
      notes: result[9] || '',
      created_by: result[10],
      created_at: result[11],
      updated_at: result[12]
    };

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Update material order error:', error);
    return NextResponse.json(
      { error: 'Failed to update material order' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Only allow deletion of draft or pending orders
    const checkQuery = `
      SELECT status FROM material_orders WHERE id = '${orderId}'
    `;

    const checkCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${checkQuery}"`;
    const { stdout: statusResult } = await execAsync(checkCommand);

    const status = statusResult.trim();
    if (!status) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (status !== 'draft' && status !== 'pending') {
      return NextResponse.json(
        { error: 'Cannot delete order with status: ' + status },
        { status: 400 }
      );
    }

    // Delete order items first
    const deleteItemsQuery = `
      DELETE FROM material_order_items WHERE order_id = '${orderId}'
    `;

    // Delete order
    const deleteOrderQuery = `
      DELETE FROM material_orders WHERE id = '${orderId}'
    `;

    const deleteItemsCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${deleteItemsQuery}"`;
    const deleteOrderCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${deleteOrderQuery}"`;

    await execAsync(deleteItemsCommand);
    await execAsync(deleteOrderCommand);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete material order error:', error);
    return NextResponse.json(
      { error: 'Failed to delete material order' },
      { status: 500 }
    );
  }
}