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
      address,
      rooms_total,
      beds_total,
      rent_daily_eur,
      status,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Housing unit ID is required' },
        { status: 400 }
      );
    }

    // Build dynamic update query
    const updateFields = [];
    if (address !== undefined) updateFields.push(`address = '${address.replace(/'/g, "''")}'`);
    if (rooms_total !== undefined) updateFields.push(`rooms_total = ${rooms_total}`);
    if (beds_total !== undefined) updateFields.push(`beds_total = ${beds_total}`);
    if (rent_daily_eur !== undefined) updateFields.push(`rent_daily_eur = ${rent_daily_eur}`);
    if (status !== undefined) updateFields.push(`status = '${status}'`);

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const updateHousingQuery = `
      UPDATE housing_units
      SET ${updateFields.join(', ')}
      WHERE id = '${id}'
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${updateHousingQuery}"`;
    await execAsync(command);

    return NextResponse.json({
      success: true,
      message: 'Housing unit updated successfully',
    });
  } catch (error) {
    console.error('Update housing unit error:', error);
    return NextResponse.json(
      { error: 'Failed to update housing unit' },
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
        { error: 'Housing unit ID is required' },
        { status: 400 }
      );
    }

    const deleteHousingQuery = `
      DELETE FROM housing_units
      WHERE id = '${id}'
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${deleteHousingQuery}"`;
    await execAsync(command);

    return NextResponse.json({
      success: true,
      message: 'Housing unit deleted successfully',
    });
  } catch (error) {
    console.error('Delete housing unit error:', error);
    return NextResponse.json(
      { error: 'Failed to delete housing unit' },
      { status: 500 }
    );
  }
}