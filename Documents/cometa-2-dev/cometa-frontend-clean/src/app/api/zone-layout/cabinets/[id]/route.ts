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
      code,
      name,
      address,
      notes,
      status,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Cabinet ID is required' },
        { status: 400 }
      );
    }

    // Build dynamic update query
    const updateFields = [];
    if (code !== undefined) updateFields.push(`code = '${code.replace(/'/g, "''")}'`);
    if (name !== undefined) updateFields.push(`name = '${name.replace(/'/g, "''")}'`);
    if (address !== undefined) updateFields.push(`address = ${address ? `'${address.replace(/'/g, "''")}'` : 'NULL'}`);
    // Notes and status fields don't exist in DB, skip them

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const updateCabinetQuery = `
      UPDATE cabinets
      SET ${updateFields.join(', ')}
      WHERE id = '${id}'
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${updateCabinetQuery}"`;
    await execAsync(command);

    return NextResponse.json({
      success: true,
      message: 'Cabinet updated successfully',
    });
  } catch (error) {
    console.error('Update cabinet error:', error);
    return NextResponse.json(
      { error: 'Failed to update cabinet' },
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
        { error: 'Cabinet ID is required' },
        { status: 400 }
      );
    }

    const deleteCabinetQuery = `
      DELETE FROM cabinets
      WHERE id = '${id}'
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${deleteCabinetQuery}"`;
    await execAsync(command);

    return NextResponse.json({
      success: true,
      message: 'Cabinet deleted successfully',
    });
  } catch (error) {
    console.error('Delete cabinet error:', error);
    return NextResponse.json(
      { error: 'Failed to delete cabinet' },
      { status: 500 }
    );
  }
}