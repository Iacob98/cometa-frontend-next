import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      foreman_user_id,
      project_id,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Crew ID is required' },
        { status: 400 }
      );
    }

    // Build dynamic update query
    const updateFields = [];
    if (name !== undefined) updateFields.push(`name = '${name.replace(/'/g, "''")}'`);
    if (foreman_user_id !== undefined) {
      if (foreman_user_id === 'none' || foreman_user_id === null) {
        updateFields.push(`foreman_user_id = NULL`);
      } else {
        updateFields.push(`foreman_user_id = '${foreman_user_id}'`);
      }
    }
    if (project_id !== undefined) {
      if (project_id === null) {
        updateFields.push(`project_id = NULL`);
      } else {
        updateFields.push(`project_id = '${project_id}'`);
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const updateCrewQuery = `
      UPDATE crews
      SET ${updateFields.join(', ')}
      WHERE id = '${id}'
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${updateCrewQuery}"`;
    await execAsync(command);

    return NextResponse.json({
      success: true,
      message: 'Team updated successfully',
    });
  } catch (error) {
    console.error('Update crew error:', error);
    return NextResponse.json(
      { error: 'Failed to update crew' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Crew ID is required' },
        { status: 400 }
      );
    }

    // First delete crew members
    const deleteCrewMembersQuery = `
      DELETE FROM crew_members
      WHERE crew_id = '${id}'
    `;

    await execAsync(`docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${deleteCrewMembersQuery}"`);

    // Then delete the crew
    const deleteCrewQuery = `
      DELETE FROM crews
      WHERE id = '${id}'
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${deleteCrewQuery}"`;
    await execAsync(command);

    return NextResponse.json({
      success: true,
      message: 'Team deleted successfully',
    });
  } catch (error) {
    console.error('Delete crew error:', error);
    return NextResponse.json(
      { error: 'Failed to delete crew' },
      { status: 500 }
    );
  }
}