import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const project_id = searchParams.get('project_id');
    const date_from = searchParams.get('date_from') || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]; // Start of year
    const date_to = searchParams.get('date_to') || new Date().toISOString().split('T')[0]; // Today
    const currency = searchParams.get('currency') || 'EUR';

    // Mock financial summary data - replace with real database queries when tables exist
    const mockSummary = {
      total_income: 15000.00,
      total_expenses: 8700.00,
      net_profit: 6300.00,
      pending_invoices: 3,
      overdue_invoices: 1,
      budget_utilization: 68.5,
      currency,
      period: {
        from: date_from,
        to: date_to
      },
      by_category: [
        { category: 'materials', amount: 3500.00, percentage: 40.2 },
        { category: 'equipment', amount: 2800.00, percentage: 32.2 },
        { category: 'labor', amount: 1900.00, percentage: 21.8 },
        { category: 'transport', amount: 500.00, percentage: 5.8 }
      ],
      by_project: project_id ? [] : [
        {
          project_id: '6c31db6b-9902-40a4-b3b3-3c0c9e672b03',
          project_name: 'Test Project',
          budget: 15000.00,
          spent: 8700.00,
          remaining: 6300.00,
          utilization_percentage: 58.0
        }
      ],
      monthly_trend: [
        { month: '2024-07', income: 5000.00, expenses: 2800.00, net: 2200.00 },
        { month: '2024-08', income: 6000.00, expenses: 3200.00, net: 2800.00 },
        { month: '2024-09', income: 4000.00, expenses: 2700.00, net: 1300.00 }
      ]
    };

    return NextResponse.json(mockSummary);
  } catch (error) {
    console.error('Financial summary API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch financial summary' },
      { status: 500 }
    );
  }
}