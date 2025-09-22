import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), 5000);

  try {
    const { searchParams } = new URL(request.url);
    const project_id = searchParams.get('project_id');
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const payment_method = searchParams.get('payment_method');
    const date_from = searchParams.get('date_from');
    const date_to = searchParams.get('date_to');
    const amount_min = searchParams.get('amount_min');
    const amount_max = searchParams.get('amount_max');
    const currency = searchParams.get('currency');
    const approved = searchParams.get('approved');
    const has_receipt = searchParams.get('has_receipt');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const per_page = parseInt(searchParams.get('per_page') || '50');

    // Query real transactions from database
    let whereConditions = [];
    let whereClause = '';

    if (project_id) {
      whereConditions.push(`c.project_id = '${project_id}'`);
    }
    if (type && type === 'expense') {
      // costs table only contains expenses, so we don't filter by type
    }
    if (category) {
      whereConditions.push(`c.cost_type = '${category}'`);
    }
    if (currency && currency !== 'EUR') {
      // costs table only contains EUR amounts, so we don't filter if EUR is requested
    }
    if (date_from) {
      whereConditions.push(`c.date >= '${date_from}'`);
    }
    if (date_to) {
      whereConditions.push(`c.date <= '${date_to}'`);
    }
    if (amount_min) {
      whereConditions.push(`c.amount_eur >= ${amount_min}`);
    }
    if (amount_max) {
      whereConditions.push(`c.amount_eur <= ${amount_max}`);
    }

    if (whereConditions.length > 0) {
      whereClause = `WHERE ${whereConditions.join(' AND ')}`;
    }

    // Query transactions from costs table (financial transactions)
    const sqlQuery = `
      SELECT
        c.id,
        c.project_id,
        'expense' as type,
        c.cost_type as category,
        c.amount_eur as amount,
        'EUR' as currency,
        c.description,
        c.date as transaction_date,
        'bank_transfer' as payment_method,
        null as reference_number,
        null as receipt_url,
        null as invoice_id,
        null as work_entry_id,
        null as equipment_id,
        null as material_allocation_id,
        null as crew_id,
        null as user_id,
        null as approved_by,
        null as approved_at,
        null as notes,
        c.date as created_at,
        c.date as updated_at,
        p.name as project_name,
        'System' as creator_name,
        null as approver_name
      FROM costs c
      LEFT JOIN projects p ON c.project_id = p.id
      ${whereClause}
    `;

    // Search filter if provided
    let searchCondition = '';
    if (search) {
      searchCondition = ` AND (c.description ILIKE '%${search}%')`;
    }

    const finalQuery = sqlQuery + searchCondition + ` ORDER BY c.date DESC LIMIT ${per_page} OFFSET ${(page - 1) * per_page}`;

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM costs c
      LEFT JOIN projects p ON c.project_id = p.id
      ${whereClause}
      ${searchCondition}
    `;

    let filteredTransactions = [];

    try {
      // Simplified query with timeout protection
      const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${finalQuery}"`;

      const queryResult = await Promise.race([
        execAsync(command),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), 2000))
      ]);

      const { stdout } = queryResult;

      // Only process if we have valid stdout
      if (stdout) {
        const lines = stdout.trim().split('\n').filter(line => line.trim());
        for (const line of lines) {
          const parts = line.split('|').map(part => part.trim());
          if (parts.length >= 20) {
            filteredTransactions.push({
              id: parts[0],
              project_id: parts[1],
              type: parts[2],
              category: parts[3],
              amount: parseFloat(parts[4]) || 0,
              currency: parts[5] || 'EUR',
              description: parts[6] || '',
              transaction_date: parts[7] || '',
              payment_method: parts[8] || 'unknown',
              reference_number: parts[9] || '',
              receipt_url: parts[10] || null,
              invoice_id: parts[11] || null,
              work_entry_id: parts[12] || null,
              equipment_id: parts[13] || null,
              material_allocation_id: parts[14] || null,
              crew_id: parts[15] || null,
              user_id: parts[16] || null,
              approved_by: parts[17] || null,
              approved_at: parts[18] || null,
              tags: [], // Would need separate tags table
              notes: parts[19] || '',
              created_by: parts[20] || '',
              created_at: parts[21] || '',
              updated_at: parts[22] || '',
              project_name: parts[23] || '',
              creator_name: parts[24] || '',
              approver_name: parts[25] || ''
            });
          }
        }
      }

    } catch (dbError) {
      console.error('Database query failed:', dbError);
      // No fallback data - return empty array
      filteredTransactions = [];
    }

    // Apply basic filtering (in real implementation, this would be done in SQL)
    if (project_id) {
      filteredTransactions = filteredTransactions.filter(t => t.project_id === project_id);
    }
    if (type) {
      filteredTransactions = filteredTransactions.filter(t => t.type === type);
    }
    if (category) {
      filteredTransactions = filteredTransactions.filter(t => t.category === category);
    }
    if (payment_method) {
      filteredTransactions = filteredTransactions.filter(t => t.payment_method === payment_method);
    }
    if (currency) {
      filteredTransactions = filteredTransactions.filter(t => t.currency === currency);
    }
    if (approved === 'true') {
      filteredTransactions = filteredTransactions.filter(t => t.approved_at !== null);
    } else if (approved === 'false') {
      filteredTransactions = filteredTransactions.filter(t => t.approved_at === null);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      filteredTransactions = filteredTransactions.filter(t =>
        t.description.toLowerCase().includes(searchLower) ||
        (t.reference_number && t.reference_number.toLowerCase().includes(searchLower)) ||
        (t.notes && t.notes.toLowerCase().includes(searchLower))
      );
    }

    // Simplified response without complex pagination
    clearTimeout(timeoutId);
    return NextResponse.json({
      transactions: filteredTransactions,
      total: filteredTransactions.length,
      page: 1,
      per_page: 50,
      total_pages: 1,
    });
  } catch (error) {
    console.error('Transactions API error:', error);
    clearTimeout(timeoutId);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      project_id,
      type,
      category,
      amount,
      currency = 'EUR',
      description,
      transaction_date,
      payment_method,
      reference_number,
      receipt_url,
      work_entry_id,
      equipment_id,
      material_allocation_id,
      crew_id,
      user_id,
      tags = [],
      notes,
      created_by
    } = body;

    // Validation
    if (!type || !category || !amount || !description || !transaction_date || !payment_method || !created_by) {
      return NextResponse.json(
        { error: 'Type, category, amount, description, transaction date, payment method, and created_by are required' },
        { status: 400 }
      );
    }

    // Validate amount is positive
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be positive' },
        { status: 400 }
      );
    }

    const transactionId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // Mock transaction creation - replace with real database insert when table exists
    return NextResponse.json({
      id: transactionId,
      project_id,
      type,
      category,
      amount,
      currency,
      description,
      transaction_date,
      payment_method,
      reference_number,
      receipt_url,
      work_entry_id,
      equipment_id,
      material_allocation_id,
      crew_id,
      user_id,
      tags,
      notes,
      created_by,
      created_at: timestamp,
      updated_at: timestamp,
      message: 'Transaction created successfully (mock)',
    }, { status: 201 });
  } catch (error) {
    console.error('Create transaction error:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}