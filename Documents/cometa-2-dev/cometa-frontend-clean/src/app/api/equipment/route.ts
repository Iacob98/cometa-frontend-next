import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const per_page = parseInt(searchParams.get('per_page') || '20');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const owned = searchParams.get('owned');

    // Build SQL query with filters
    let whereClause = 'WHERE 1=1';
    const conditions = [];

    if (type) {
      conditions.push(`type = '${type}'`);
    }

    if (status) {
      conditions.push(`status = '${status}'`);
    }

    if (owned !== null && owned !== undefined) {
      const ownedValue = owned === 'true';
      conditions.push(`owned = ${ownedValue}`);
    }

    if (search) {
      conditions.push(`(name ILIKE '%${search}%' OR inventory_no ILIKE '%${search}%' OR current_location ILIKE '%${search}%')`);
    }

    if (conditions.length > 0) {
      whereClause += ' AND ' + conditions.join(' AND ');
    }

    // Main query to get equipment
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
      ${whereClause}
      ORDER BY name
      LIMIT ${per_page} OFFSET ${(page - 1) * per_page}
    `;

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM equipment
      ${whereClause}
    `;

    const equipmentCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${equipmentQuery}"`;
    const countCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${countQuery}"`;

    const [{ stdout }, { stdout: countStdout }] = await Promise.all([
      execAsync(equipmentCommand),
      execAsync(countCommand)
    ]);

    // Parse equipment results
    const equipment = [];
    const lines = stdout.trim().split('\n').filter(line => line.trim());

    for (const line of lines) {
      const parts = line.split('|').map(part => part.trim());
      if (parts.length >= 10) {
        equipment.push({
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
        });
      }
    }

    const total = parseInt(countStdout.trim()) || 0;

    return NextResponse.json({
      items: equipment,
      total,
      page,
      per_page,
      total_pages: Math.ceil(total / per_page)
    });
  } catch (error) {
    console.error('Equipment API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch equipment' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type,
      name,
      inventory_no,
      owned = true,
      status = 'available',
      purchase_price_eur,
      rental_price_per_day_eur,
      rental_price_per_hour_eur,
      current_location
    } = body;

    // Validation
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

    // Insert new equipment
    const equipmentId = crypto.randomUUID();
    const insertQuery = `
      INSERT INTO equipment (
        id, type, name, inventory_no, owned, status,
        purchase_price_eur, rental_price_per_day_eur, rental_price_per_hour_eur,
        current_location
      ) VALUES (
        '${equipmentId}',
        '${type}',
        '${name.replace(/'/g, "''")}',
        ${inventory_no ? `'${inventory_no.replace(/'/g, "''")}'` : 'NULL'},
        ${owned},
        '${status}',
        ${purchase_price_eur || 'NULL'},
        ${rental_price_per_day_eur || 'NULL'},
        ${rental_price_per_hour_eur || 'NULL'},
        ${current_location ? `'${current_location.replace(/'/g, "''")}'` : 'NULL'}
      )
    `;

    const insertCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${insertQuery}"`;
    await execAsync(insertCommand);

    // Return the created equipment
    const newEquipment = {
      id: equipmentId,
      type,
      name,
      inventory_no: inventory_no || null,
      owned,
      status,
      purchase_price_eur: purchase_price_eur || 0,
      rental_price_per_day_eur: rental_price_per_day_eur || 0,
      rental_price_per_hour_eur: rental_price_per_hour_eur || 0,
      current_location: current_location || null,
    };

    return NextResponse.json(newEquipment, { status: 201 });
  } catch (error) {
    console.error('Create equipment error:', error);
    return NextResponse.json(
      { error: 'Failed to create equipment' },
      { status: 500 }
    );
  }
}