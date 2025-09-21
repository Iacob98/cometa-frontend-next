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
      kind,
      organization,
      phone,
      email,
      contact_person,
      notes,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Utility contact ID is required' },
        { status: 400 }
      );
    }

    // Build dynamic update query
    const updateFields = [];
    if (kind !== undefined) updateFields.push(`kind = '${kind}'`);
    if (organization !== undefined) updateFields.push(`org_name = '${organization.replace(/'/g, "''")}'`);
    if (phone !== undefined) updateFields.push(`phone = ${phone ? `'${phone}'` : 'NULL'}`);
    if (email !== undefined) updateFields.push(`email = ${email ? `'${email}'` : 'NULL'}`);
    if (contact_person !== undefined) updateFields.push(`contact_person = ${contact_person ? `'${contact_person.replace(/'/g, "''")}'` : 'NULL'}`);
    if (notes !== undefined) updateFields.push(`notes = ${notes ? `'${notes.replace(/'/g, "''")}'` : 'NULL'}`);

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const updateContactQuery = `
      UPDATE utility_contacts
      SET ${updateFields.join(', ')}
      WHERE id = '${id}'
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${updateContactQuery}"`;
    await execAsync(command);

    return NextResponse.json({
      success: true,
      message: 'Utility contact updated successfully',
    });
  } catch (error) {
    console.error('Update utility contact error:', error);
    return NextResponse.json(
      { error: 'Failed to update utility contact' },
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
        { error: 'Utility contact ID is required' },
        { status: 400 }
      );
    }

    const deleteContactQuery = `
      DELETE FROM utility_contacts
      WHERE id = '${id}'
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${deleteContactQuery}"`;
    await execAsync(command);

    return NextResponse.json({
      success: true,
      message: 'Utility contact deleted successfully',
    });
  } catch (error) {
    console.error('Delete utility contact error:', error);
    return NextResponse.json(
      { error: 'Failed to delete utility contact' },
      { status: 500 }
    );
  }
}