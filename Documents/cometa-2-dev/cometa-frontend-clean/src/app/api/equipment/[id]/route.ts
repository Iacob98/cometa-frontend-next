import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const equipmentQuery = `
      SELECT
        id,
        type,
        name,
        inventory_no,
        owned,
        status,
        purchase_price_eur,
        rental_price_per_day_eur,
        rental_price_per_hour_eur,
        current_location
      FROM equipment
      WHERE id = '${id}'
    `;

    const equipmentCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${equipmentQuery}"`;
    const result = await execAsync(equipmentCommand);

    const line = result.stdout.trim();
    if (!line) {
      return NextResponse.json(
        { error: 'Equipment not found' },
        { status: 404 }
      );
    }

    const parts = line.split('|').map(part => part.trim());
    if (parts.length >= 10) {
      const equipment = {
        id: parts[0],
        type: parts[1],
        name: parts[2],
        inventory_no: parts[3] || null,
        owned: parts[4] === 't',
        status: parts[5],
        purchase_price_eur: parseFloat(parts[6]) || 0,
        rental_price_per_day_eur: parseFloat(parts[7]) || 0,
        rental_price_per_hour_eur: parseFloat(parts[8]) || 0,
        current_location: parts[9] || null,
      };

      return NextResponse.json(equipment);
    }

    return NextResponse.json(
      { error: 'Equipment not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Get equipment error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch equipment' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      type,
      name,
      inventory_no,
      owned,
      status,
      purchase_price_eur,
      rental_price_per_day_eur,
      rental_price_per_hour_eur,
      current_location
    } = body;

    if (!type || !name) {
      return NextResponse.json(
        { error: 'Type and name are required' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ['machine', 'tool', 'measuring_device'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid equipment type' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['available', 'in_use', 'maintenance', 'broken'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid equipment status' },
        { status: 400 }
      );
    }

    // Update equipment
    const updateQuery = `
      UPDATE equipment
      SET
        type = '${type}',
        name = '${name.replace(/'/g, "''")}',
        inventory_no = ${inventory_no ? `'${inventory_no.replace(/'/g, "''")}'` : 'NULL'},
        owned = ${owned},
        status = '${status}',
        purchase_price_eur = ${purchase_price_eur || 'NULL'},
        rental_price_per_day_eur = ${rental_price_per_day_eur || 'NULL'},
        rental_price_per_hour_eur = ${rental_price_per_hour_eur || 'NULL'},
        current_location = ${current_location ? `'${current_location.replace(/'/g, "''")}'` : 'NULL'}
      WHERE id = '${id}'
    `;

    const updateCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${updateQuery}"`;
    await execAsync(updateCommand);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update equipment error:', error);
    return NextResponse.json(
      { error: 'Failed to update equipment' },
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

    // Check if equipment is currently assigned
    const checkQuery = `
      SELECT COUNT(*) as count
      FROM equipment_assignments
      WHERE equipment_id = '${id}' AND (to_ts IS NULL OR to_ts > NOW())
    `;

    const checkCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${checkQuery}"`;
    const checkResult = await execAsync(checkCommand);
    const count = parseInt(checkResult.stdout.trim()) || 0;

    if (count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete equipment: it is currently assigned to a project' },
        { status: 400 }
      );
    }

    // Delete equipment
    const deleteQuery = `DELETE FROM equipment WHERE id = '${id}'`;
    const deleteCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${deleteQuery}"`;
    await execAsync(deleteCommand);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete equipment error:', error);
    return NextResponse.json(
      { error: 'Failed to delete equipment' },
      { status: 500 }
    );
  }
}