import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// POST - Create budget transaction for material order
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: orderId } = params;
    const body = await request.json();
    const { deduct_from_budget = true } = body;

    if (!deduct_from_budget) {
      return NextResponse.json({ message: 'Budget deduction skipped' });
    }

    // Get order details
    const orderQuery = `
      SELECT
        mo.id,
        mo.project_id,
        mo.total_cost_eur,
        mo.status,
        mo.order_date,
        sm.material_type,
        s.org_name as supplier_name
      FROM material_orders mo
      LEFT JOIN supplier_materials sm ON mo.supplier_material_id = sm.id
      LEFT JOIN suppliers s ON sm.supplier_id = s.id
      WHERE mo.id = '${orderId}'
    `;

    const orderCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${orderQuery}"`;
    const { stdout: orderResult } = await execAsync(orderCommand);

    if (!orderResult.trim()) {
      return NextResponse.json(
        { error: 'Material order not found' },
        { status: 404 }
      );
    }

    const orderParts = orderResult.trim().split('|').map(part => part.trim());
    const order = {
      id: orderParts[0],
      project_id: orderParts[1],
      total_cost_eur: parseFloat(orderParts[2]) || 0,
      status: orderParts[3],
      order_date: orderParts[4],
      material_type: orderParts[5] || 'Unknown Material',
      supplier_name: orderParts[6] || 'Unknown Supplier'
    };

    // Create transaction record
    const transactionId = crypto.randomUUID();
    const description = `Material Order: ${order.material_type} from ${order.supplier_name}`;

    const insertTransactionQuery = `
      INSERT INTO costs (
        id, project_id, amount_eur, category, description,
        date, created_by, reference_type, reference_id
      )
      VALUES (
        '${transactionId}',
        '${order.project_id}',
        ${order.total_cost_eur},
        'material_cost',
        '${description.replace(/'/g, "''")}',
        '${order.order_date}',
        'system',
        'material_order',
        '${orderId}'
      )
      RETURNING id, amount_eur, description
    `;

    const transactionCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${insertTransactionQuery}"`;
    const { stdout: transactionResult } = await execAsync(transactionCommand);

    if (!transactionResult.trim()) {
      return NextResponse.json(
        { error: 'Failed to create budget transaction' },
        { status: 500 }
      );
    }

    const transactionParts = transactionResult.trim().split('|').map(part => part.trim());

    return NextResponse.json({
      transaction_id: transactionParts[0],
      amount_deducted: parseFloat(transactionParts[1]) || 0,
      description: transactionParts[2],
      project_id: order.project_id,
      currency: 'EUR'
    }, { status: 201 });

  } catch (error) {
    console.error('Create budget transaction error:', error);
    return NextResponse.json(
      { error: 'Failed to create budget transaction' },
      { status: 500 }
    );
  }
}

// GET - Get budget impact for material order
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: orderId } = params;

    // Get existing transaction for this order
    const transactionQuery = `
      SELECT
        id,
        amount_eur,
        description,
        date,
        project_id
      FROM costs
      WHERE reference_type = 'material_order'
        AND reference_id = '${orderId}'
    `;

    const transactionCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${transactionQuery}"`;
    const { stdout: transactionResult } = await execAsync(transactionCommand);

    if (!transactionResult.trim()) {
      return NextResponse.json({
        has_budget_impact: false,
        message: 'No budget transaction found for this order'
      });
    }

    const transactionParts = transactionResult.trim().split('|').map(part => part.trim());

    return NextResponse.json({
      has_budget_impact: true,
      transaction_id: transactionParts[0],
      amount_deducted: parseFloat(transactionParts[1]) || 0,
      description: transactionParts[2],
      transaction_date: transactionParts[3],
      project_id: transactionParts[4],
      currency: 'EUR'
    });

  } catch (error) {
    console.error('Get budget impact error:', error);
    return NextResponse.json(
      { error: 'Failed to get budget impact' },
      { status: 500 }
    );
  }
}