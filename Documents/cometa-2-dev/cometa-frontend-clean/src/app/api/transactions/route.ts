import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
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

    // Mock transactions data - replace with real database queries when tables exist
    const mockTransactions = [
      {
        id: 'trans_001',
        project_id: '6c31db6b-9902-40a4-b3b3-3c0c9e672b03',
        type: 'expense',
        category: 'materials',
        amount: 2500.00,
        currency: 'EUR',
        description: 'Fiber optic cables purchase',
        transaction_date: '2024-09-15',
        payment_method: 'bank_transfer',
        reference_number: 'REF-2024-001',
        receipt_url: null,
        invoice_id: null,
        work_entry_id: null,
        equipment_id: null,
        material_allocation_id: null,
        crew_id: null,
        user_id: null,
        approved_by: null,
        approved_at: null,
        tags: ['materials', 'urgent'],
        notes: 'Emergency purchase for project delay',
        created_by: '6f3da2a8-7cd6-4f9e-84fb-9669a41e85bb',
        created_at: '2024-09-15T10:30:00Z',
        updated_at: '2024-09-15T10:30:00Z',
        project_name: 'Test Project',
        crew_name: null,
        user_name: null,
        creator_name: 'Admin User',
        approver_name: null
      },
      {
        id: 'trans_002',
        project_id: '6c31db6b-9902-40a4-b3b3-3c0c9e672b03',
        type: 'expense',
        category: 'equipment',
        amount: 1200.00,
        currency: 'EUR',
        description: 'Equipment rental - excavator',
        transaction_date: '2024-09-16',
        payment_method: 'credit_card',
        reference_number: 'REF-2024-002',
        receipt_url: null,
        invoice_id: null,
        work_entry_id: null,
        equipment_id: null,
        material_allocation_id: null,
        crew_id: null,
        user_id: null,
        approved_by: null,
        approved_at: null,
        tags: ['equipment', 'rental'],
        notes: 'Weekly rental for excavation work',
        created_by: '6f3da2a8-7cd6-4f9e-84fb-9669a41e85bb',
        created_at: '2024-09-16T14:15:00Z',
        updated_at: '2024-09-16T14:15:00Z',
        project_name: 'Test Project',
        crew_name: null,
        user_name: null,
        creator_name: 'Admin User',
        approver_name: null
      },
      {
        id: 'trans_003',
        project_id: '6c31db6b-9902-40a4-b3b3-3c0c9e672b03',
        type: 'income',
        category: 'payment',
        amount: 5000.00,
        currency: 'EUR',
        description: 'Project milestone payment',
        transaction_date: '2024-09-18',
        payment_method: 'bank_transfer',
        reference_number: 'PAY-2024-001',
        receipt_url: null,
        invoice_id: null,
        work_entry_id: null,
        equipment_id: null,
        material_allocation_id: null,
        crew_id: null,
        user_id: null,
        approved_by: '6f3da2a8-7cd6-4f9e-84fb-9669a41e85bb',
        approved_at: '2024-09-18T16:00:00Z',
        tags: ['payment', 'milestone'],
        notes: 'First milestone completion payment',
        created_by: '6f3da2a8-7cd6-4f9e-84fb-9669a41e85bb',
        created_at: '2024-09-18T16:00:00Z',
        updated_at: '2024-09-18T16:00:00Z',
        project_name: 'Test Project',
        crew_name: null,
        user_name: null,
        creator_name: 'Admin User',
        approver_name: 'Admin User'
      }
    ];

    let filteredTransactions = [...mockTransactions];

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

    // Apply pagination
    const total = filteredTransactions.length;
    const total_pages = Math.ceil(total / per_page);
    const offset = (page - 1) * per_page;
    const transactions = filteredTransactions.slice(offset, offset + per_page);

    return NextResponse.json({
      transactions,
      total,
      page,
      per_page,
      total_pages,
    });
  } catch (error) {
    console.error('Transactions API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
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