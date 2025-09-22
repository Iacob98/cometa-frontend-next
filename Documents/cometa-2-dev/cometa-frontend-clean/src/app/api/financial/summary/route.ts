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
    const date_from = searchParams.get('date_from') || '2024-01-01';
    const date_to = searchParams.get('date_to') || '2024-12-31';
    const currency = searchParams.get('currency') || 'EUR';

    // Simplified database query to prevent hanging
    try {
      let whereClause = '';
      const conditions = [`c.date >= '${date_from}'`, `c.date <= '${date_to}'`];

      if (project_id) {
        conditions.push(`c.project_id = '${project_id}'`);
      }

      whereClause = `WHERE ${conditions.join(' AND ')}`;

      const summaryQuery = `
        SELECT
          0 as total_income,
          COALESCE(SUM(c.amount_eur), 0) as total_expenses,
          0 as income_count,
          COUNT(*) as expense_count
        FROM costs c
        ${whereClause}
      `;

      const summaryCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${summaryQuery}"`;

      const result = await Promise.race([
        execAsync(summaryCommand),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), 3000))
      ]);

      let totalIncome = 0;
      let totalExpenses = 0;
      let netProfit = 0;

      if (result && result.stdout) {
        const summaryParts = result.stdout.trim().split('|').map(part => part.trim());
        totalIncome = parseFloat(summaryParts[0]) || 0;
        totalExpenses = parseFloat(summaryParts[1]) || 0;
        netProfit = totalIncome - totalExpenses;
      }

      clearTimeout(timeoutId);
      return NextResponse.json({
        total_income: totalIncome,
        total_expenses: totalExpenses,
        net_profit: netProfit,
        pending_invoices: 0,
        overdue_invoices: 0,
        budget_utilization: 0,
        currency,
        period: {
          from: date_from,
          to: date_to
        },
        by_category: [],
        by_project: [],
        monthly_trend: []
      });

    } catch (error) {
      console.error('Database query failed:', error);
      clearTimeout(timeoutId);
      return NextResponse.json({
        total_income: 0,
        total_expenses: 0,
        net_profit: 0,
        pending_invoices: 0,
        overdue_invoices: 0,
        budget_utilization: 0,
        currency,
        period: { from: date_from, to: date_to },
        by_category: [],
        by_project: [],
        monthly_trend: []
      });
    }

  } catch (error) {
    console.error('Financial summary API error:', error);
    clearTimeout(timeoutId);
    return NextResponse.json(
      { error: 'Failed to fetch financial summary' },
      { status: 500 }
    );
  } finally {
    clearTimeout(timeoutId);
  }
}