import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { unlink } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    // First get the plan details to delete the file
    const getPlanQuery = `
      SELECT file_path FROM project_plans WHERE id = '${id}'
    `;

    const getCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${getPlanQuery}"`;

    try {
      const result = await execAsync(getCommand);
      const filePath = result.stdout.trim();

      // Delete from database
      const deletePlanQuery = `
        DELETE FROM project_plans WHERE id = '${id}'
      `;

      const deleteCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${deletePlanQuery}"`;
      await execAsync(deleteCommand);

      // Delete the file if it exists
      if (filePath) {
        try {
          const fullFilePath = join(process.cwd(), filePath);
          await unlink(fullFilePath);
        } catch (fileError) {
          // File might not exist, continue anyway
          console.warn('Could not delete file:', fileError);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Plan deleted successfully',
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Plan not found or could not be deleted' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Delete plan error:', error);
    return NextResponse.json(
      { error: 'Failed to delete plan' },
      { status: 500 }
    );
  }
}