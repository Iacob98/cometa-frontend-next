import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: supplierId } = await params;

    if (!supplierId) {
      return NextResponse.json(
        { error: 'Supplier ID is required' },
        { status: 400 }
      );
    }

    const query = `
      SELECT
        id,
        supplier_id,
        contact_name,
        position,
        department,
        phone,
        email,
        is_primary,
        is_active,
        notes,
        created_at,
        updated_at
      FROM supplier_contacts
      WHERE supplier_id = '${supplierId}' AND is_active = true
      ORDER BY is_primary DESC, contact_name ASC
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${query}"`;
    const { stdout } = await execAsync(command);

    const contacts = [];
    const contactLines = stdout.trim().split('\n').filter(line => line.trim());

    for (const line of contactLines) {
      const parts = line.split('|').map(part => part.trim());
      if (parts.length >= 10) {
        contacts.push({
          id: parts[0],
          supplier_id: parts[1],
          contact_name: parts[2] || '',
          position: parts[3] || '',
          department: parts[4] || '',
          phone: parts[5] || '',
          email: parts[6] || '',
          is_primary: parts[7] === 't',
          is_active: parts[8] === 't',
          notes: parts[9] || '',
          created_at: parts[10] || null,
          updated_at: parts[11] || null
        });
      }
    }

    return NextResponse.json(contacts);
  } catch (error) {
    console.error('Get supplier contacts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supplier contacts' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: supplierId } = await params;
    const body = await request.json();
    const { contact_name, position, department, phone, email, is_primary, notes } = body;

    if (!supplierId || !contact_name) {
      return NextResponse.json(
        { error: 'Supplier ID and contact name are required' },
        { status: 400 }
      );
    }

    // If this is being set as primary, unset other primary contacts for this supplier
    if (is_primary) {
      const unsetPrimaryQuery = `
        UPDATE supplier_contacts
        SET is_primary = false, updated_at = NOW()
        WHERE supplier_id = '${supplierId}' AND is_primary = true
      `;
      const unsetCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${unsetPrimaryQuery}"`;
      await execAsync(unsetCommand);
    }

    // Generate UUID for new contact
    const contactId = crypto.randomUUID();

    // Insert new contact
    const insertQuery = `
      INSERT INTO supplier_contacts (
        id, supplier_id, contact_name, position, department, phone, email, is_primary, notes
      )
      VALUES (
        '${contactId}',
        '${supplierId}',
        '${contact_name.replace(/'/g, "''")}',
        ${position ? `'${position.replace(/'/g, "''")}'` : 'NULL'},
        ${department ? `'${department.replace(/'/g, "''")}'` : 'NULL'},
        ${phone ? `'${phone.replace(/'/g, "''")}'` : 'NULL'},
        ${email ? `'${email.replace(/'/g, "''")}'` : 'NULL'},
        ${is_primary || false},
        ${notes ? `'${notes.replace(/'/g, "''")}'` : 'NULL'}
      )
      RETURNING id, supplier_id, contact_name, position, department, phone, email, is_primary, is_active, notes, created_at, updated_at
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${insertQuery}"`;
    const { stdout } = await execAsync(command);

    const result = stdout.trim().split('|').map(part => part.trim());

    const newContact = {
      id: result[0],
      supplier_id: result[1],
      contact_name: result[2] || '',
      position: result[3] || '',
      department: result[4] || '',
      phone: result[5] || '',
      email: result[6] || '',
      is_primary: result[7] === 't',
      is_active: result[8] === 't',
      notes: result[9] || '',
      created_at: result[10] || null,
      updated_at: result[11] || null
    };

    return NextResponse.json(newContact, { status: 201 });
  } catch (error) {
    console.error('Create supplier contact error:', error);
    return NextResponse.json(
      { error: 'Failed to create supplier contact' },
      { status: 500 }
    );
  }
}