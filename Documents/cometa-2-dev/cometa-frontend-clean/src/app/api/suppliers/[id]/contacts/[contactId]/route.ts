import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  try {
    const { id: supplierId, contactId } = await params;
    const body = await request.json();
    const { contact_name, position, department, phone, email, is_primary, notes } = body;

    if (!supplierId || !contactId) {
      return NextResponse.json(
        { error: 'Supplier ID and contact ID are required' },
        { status: 400 }
      );
    }

    // If this is being set as primary, unset other primary contacts for this supplier
    if (is_primary) {
      const unsetPrimaryQuery = `
        UPDATE supplier_contacts
        SET is_primary = false, updated_at = NOW()
        WHERE supplier_id = '${supplierId}' AND is_primary = true AND id != '${contactId}'
      `;
      const unsetCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${unsetPrimaryQuery}"`;
      await execAsync(unsetCommand);
    }

    // Build dynamic update query
    const updateFields = [];
    if (contact_name !== undefined) updateFields.push(`contact_name = '${contact_name.replace(/'/g, "''")}'`);
    if (position !== undefined) updateFields.push(`position = ${position ? `'${position.replace(/'/g, "''")}'` : 'NULL'}`);
    if (department !== undefined) updateFields.push(`department = ${department ? `'${department.replace(/'/g, "''")}'` : 'NULL'}`);
    if (phone !== undefined) updateFields.push(`phone = ${phone ? `'${phone.replace(/'/g, "''")}'` : 'NULL'}`);
    if (email !== undefined) updateFields.push(`email = ${email ? `'${email.replace(/'/g, "''")}'` : 'NULL'}`);
    if (is_primary !== undefined) updateFields.push(`is_primary = ${is_primary}`);
    if (notes !== undefined) updateFields.push(`notes = ${notes ? `'${notes.replace(/'/g, "''")}'` : 'NULL'}`);

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    updateFields.push(`updated_at = NOW()`);

    const updateQuery = `
      UPDATE supplier_contacts
      SET ${updateFields.join(', ')}
      WHERE id = '${contactId}' AND supplier_id = '${supplierId}'
      RETURNING id, supplier_id, contact_name, position, department, phone, email, is_primary, is_active, notes, created_at, updated_at
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${updateQuery}"`;
    const { stdout } = await execAsync(command);

    const result = stdout.trim().split('|').map(part => part.trim());

    if (!result[0]) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    const updatedContact = {
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

    return NextResponse.json(updatedContact);
  } catch (error) {
    console.error('Update supplier contact error:', error);
    return NextResponse.json(
      { error: 'Failed to update supplier contact' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  try {
    const { id: supplierId, contactId } = await params;

    if (!supplierId || !contactId) {
      return NextResponse.json(
        { error: 'Supplier ID and contact ID are required' },
        { status: 400 }
      );
    }

    // Soft delete by setting is_active to false
    const deleteQuery = `
      UPDATE supplier_contacts
      SET is_active = false, updated_at = NOW()
      WHERE id = '${contactId}' AND supplier_id = '${supplierId}'
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${deleteQuery}"`;
    await execAsync(command);

    return NextResponse.json({
      success: true,
      message: 'Contact deleted successfully',
    });
  } catch (error) {
    console.error('Delete supplier contact error:', error);
    return NextResponse.json(
      { error: 'Failed to delete supplier contact' },
      { status: 500 }
    );
  }
}