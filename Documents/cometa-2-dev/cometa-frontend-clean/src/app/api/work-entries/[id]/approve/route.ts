import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Work entry ID is required' },
        { status: 400 }
      );
    }

    // Check if work entry exists and is not already approved
    const checkQuery = `
      SELECT id, approved_by, approved_at
      FROM work_entries
      WHERE id = '${id}'
    `;

    const checkResult = await execAsync(
      `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${checkQuery}"`
    );

    if (!checkResult.stdout.trim()) {
      return NextResponse.json(
        { error: 'Work entry not found' },
        { status: 404 }
      );
    }

    const parts = checkResult.stdout.trim().split('|').map(part => part.trim());
    const approvedBy = parts[1];

    if (approvedBy && approvedBy !== '') {
      return NextResponse.json(
        { error: 'Work entry is already approved' },
        { status: 400 }
      );
    }

    // For now, we'll use a placeholder user ID for approval
    // In a real implementation, this would come from the authenticated user
    const approverUserId = '6f3da2a8-7cd6-4f9e-84fb-9669a41e85bb'; // Admin user ID

    const approveQuery = `
      UPDATE work_entries
      SET approved_by = '${approverUserId}', approved_at = NOW()
      WHERE id = '${id}'
      RETURNING id, approved_by, approved_at
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${approveQuery}"`;
    const result = await execAsync(command);

    if (!result.stdout.trim()) {
      return NextResponse.json(
        { error: 'Failed to approve work entry' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Work entry approved successfully',
      id,
    });
  } catch (error) {
    console.error('Approve work entry error:', error);
    return NextResponse.json(
      { error: 'Failed to approve work entry' },
      { status: 500 }
    );
  }
}