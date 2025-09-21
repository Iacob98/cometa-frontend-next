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
      type,
      supplier_id,
      rent_daily_eur,
      service_freq,
      status,
      start_date,
      end_date,
      location_text,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Facility ID is required' },
        { status: 400 }
      );
    }

    // Build dynamic update query
    const updateFields = [];
    if (type !== undefined) updateFields.push(`type = '${type}'`);
    if (supplier_id !== undefined) updateFields.push(`supplier_id = ${supplier_id ? `'${supplier_id}'` : 'NULL'}`);
    if (rent_daily_eur !== undefined) updateFields.push(`rent_daily_eur = ${rent_daily_eur}`);
    if (service_freq !== undefined) updateFields.push(`service_freq = ${service_freq ? `'${service_freq}'` : 'NULL'}`);
    if (status !== undefined) updateFields.push(`status = '${status}'`);
    if (start_date !== undefined) updateFields.push(`start_date = ${start_date ? `'${start_date}'` : 'NULL'}`);
    if (end_date !== undefined) updateFields.push(`end_date = ${end_date ? `'${end_date}'` : 'NULL'}`);
    if (location_text !== undefined) updateFields.push(`location_text = ${location_text ? `'${location_text.replace(/'/g, "''")}'` : 'NULL'}`);

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const updateFacilityQuery = `
      UPDATE project_facilities
      SET ${updateFields.join(', ')}
      WHERE id = '${id}'
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${updateFacilityQuery}"`;
    await execAsync(command);

    return NextResponse.json({
      success: true,
      message: 'Facility updated successfully',
    });
  } catch (error) {
    console.error('Update facility error:', error);
    return NextResponse.json(
      { error: 'Failed to update facility' },
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
        { error: 'Facility ID is required' },
        { status: 400 }
      );
    }

    const deleteFacilityQuery = `
      DELETE FROM project_facilities
      WHERE id = '${id}'
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${deleteFacilityQuery}"`;
    await execAsync(command);

    return NextResponse.json({
      success: true,
      message: 'Facility deleted successfully',
    });
  } catch (error) {
    console.error('Delete facility error:', error);
    return NextResponse.json(
      { error: 'Failed to delete facility' },
      { status: 500 }
    );
  }
}