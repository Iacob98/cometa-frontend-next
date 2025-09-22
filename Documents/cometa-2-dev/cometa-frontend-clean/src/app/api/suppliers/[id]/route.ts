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

    if (!id) {
      return NextResponse.json(
        { error: 'Supplier ID is required' },
        { status: 400 }
      );
    }

    const query = `
      SELECT
        id,
        name,
        contact_person,
        phone,
        email,
        address,
        company_name,
        contact_info,
        is_active,
        notes
      FROM suppliers
      WHERE id = '${id}'
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${query}"`;
    const { stdout } = await execAsync(command);

    const supplierLine = stdout.trim();
    if (!supplierLine) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }

    const parts = supplierLine.split('|').map(part => part.trim());
    const supplier = {
      id: parts[0],
      org_name: parts[1] || parts[6],
      name: parts[1],
      contact_person: parts[2] || '',
      phone: parts[3] || '',
      email: parts[4] || '',
      address: parts[5] || '',
      company_name: parts[6] || '',
      contact_info: parts[7] || '',
      is_active: parts[8] === 't',
      notes: parts[9] || ''
    };

    return NextResponse.json(supplier);
  } catch (error) {
    console.error('Get supplier error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supplier' },
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
    const { org_name, contact_person, phone, email, address, notes } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Supplier ID is required' },
        { status: 400 }
      );
    }

    // Build dynamic update query
    const updateFields = [];
    if (org_name !== undefined) {
      updateFields.push(`name = '${org_name.replace(/'/g, "''")}'`);
      updateFields.push(`company_name = '${org_name.replace(/'/g, "''")}'`);
    }
    if (contact_person !== undefined) updateFields.push(`contact_person = '${contact_person.replace(/'/g, "''")}'`);
    if (phone !== undefined) updateFields.push(`phone = ${phone ? `'${phone.replace(/'/g, "''")}'` : 'NULL'}`);
    if (email !== undefined) updateFields.push(`email = ${email ? `'${email.replace(/'/g, "''")}'` : 'NULL'}`);
    if (address !== undefined) updateFields.push(`address = ${address ? `'${address.replace(/'/g, "''")}'` : 'NULL'}`);
    if (notes !== undefined) updateFields.push(`notes = ${notes ? `'${notes.replace(/'/g, "''")}'` : 'NULL'}`);

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const updateQuery = `
      UPDATE suppliers
      SET ${updateFields.join(', ')}
      WHERE id = '${id}'
      RETURNING id, name, contact_person, phone, email, address, company_name, is_active, notes
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${updateQuery}"`;
    const { stdout } = await execAsync(command);

    const result = stdout.trim().split('|').map(part => part.trim());

    const updatedSupplier = {
      id: result[0],
      org_name: result[1],
      name: result[1],
      contact_person: result[2] || '',
      phone: result[3] || '',
      email: result[4] || '',
      address: result[5] || '',
      company_name: result[6] || '',
      is_active: result[7] === 't',
      notes: result[8] || ''
    };

    return NextResponse.json(updatedSupplier);
  } catch (error) {
    console.error('Update supplier error:', error);
    return NextResponse.json(
      { error: 'Failed to update supplier' },
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
        { error: 'Supplier ID is required' },
        { status: 400 }
      );
    }

    const deleteQuery = `
      DELETE FROM suppliers
      WHERE id = '${id}'
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${deleteQuery}"`;
    await execAsync(command);

    return NextResponse.json({
      success: true,
      message: 'Supplier deleted successfully',
    });
  } catch (error) {
    console.error('Delete supplier error:', error);
    return NextResponse.json(
      { error: 'Failed to delete supplier' },
      { status: 500 }
    );
  }
}