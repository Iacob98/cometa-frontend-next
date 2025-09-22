import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const is_active = searchParams.get('is_active');
    const search = searchParams.get('search');

    // Build query to get suppliers from database
    let suppliersQuery = `
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
      WHERE 1=1
    `;

    const whereConditions = [];

    // Filter by active status
    if (is_active !== null) {
      whereConditions.push(`is_active = ${is_active === 'true'}`);
    }

    // Filter by search term
    if (search) {
      whereConditions.push(`(
        LOWER(name) LIKE LOWER('%${search}%') OR
        LOWER(contact_person) LIKE LOWER('%${search}%') OR
        LOWER(company_name) LIKE LOWER('%${search}%') OR
        LOWER(email) LIKE LOWER('%${search}%')
      )`);
    }

    if (whereConditions.length > 0) {
      suppliersQuery += ` AND ${whereConditions.join(' AND ')}`;
    }

    suppliersQuery += ` ORDER BY name`;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${suppliersQuery}"`;
    const { stdout } = await execAsync(command);

    const suppliers = [];
    const supplierLines = stdout.trim().split('\n').filter(line => line.trim());

    for (const line of supplierLines) {
      const parts = line.split('|').map(part => part.trim());
      if (parts.length >= 9) {
        suppliers.push({
          id: parts[0],
          org_name: parts[1] || parts[6], // Use name or company_name
          name: parts[1],
          contact_person: parts[2] || '',
          phone: parts[3] || '',
          email: parts[4] || '',
          address: parts[5] || '',
          company_name: parts[6] || '',
          contact_info: parts[7] || '',
          is_active: parts[8] === 't',
          notes: parts[9] || ''
        });
      }
    }

    return NextResponse.json(suppliers);
  } catch (error) {
    console.error('Suppliers API error:', error);

    // Return fallback data if database query fails
    const fallbackSuppliers = [
      {
        id: "fallback-001",
        org_name: "FiberTech Solutions",
        name: "FiberTech Solutions",
        contact_person: "Michael Schmidt",
        email: "m.schmidt@fibertech.de",
        phone: "+49 30 555-0100",
        address: "Industriestraße 45, Berlin, 10317, Germany",
        company_name: "FiberTech Solutions GmbH",
        contact_info: "Primary contact for fiber optic solutions",
        is_active: true,
        notes: "Primary supplier for fiber optic cables and infrastructure"
      }
    ];

    return NextResponse.json(fallbackSuppliers);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { org_name, contact_person, phone, email, address, notes } = body;

    if (!org_name || !contact_person) {
      return NextResponse.json(
        { error: 'Organization name and contact person are required' },
        { status: 400 }
      );
    }

    // Generate UUID for new supplier
    const supplierId = crypto.randomUUID();

    // Insert new supplier into database
    const insertQuery = `
      INSERT INTO suppliers (id, name, contact_person, phone, email, address, company_name, is_active, notes)
      VALUES (
        '${supplierId}',
        '${org_name.replace(/'/g, "''")}',
        '${contact_person.replace(/'/g, "''")}',
        ${phone ? `'${phone.replace(/'/g, "''")}'` : 'NULL'},
        ${email ? `'${email.replace(/'/g, "''")}'` : 'NULL'},
        ${address ? `'${address.replace(/'/g, "''")}'` : 'NULL'},
        '${org_name.replace(/'/g, "''")}',
        true,
        ${notes ? `'${notes.replace(/'/g, "''")}'` : 'NULL'}
      )
      RETURNING id, name, contact_person, phone, email, address, company_name, is_active, notes
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${insertQuery}"`;
    const { stdout } = await execAsync(command);

    const result = stdout.trim().split('|').map(part => part.trim());

    const newSupplier = {
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

    return NextResponse.json(newSupplier, { status: 201 });
  } catch (error) {
    console.error('Create supplier error:', error);
    return NextResponse.json(
      { error: 'Failed to create supplier' },
      { status: 500 }
    );
  }
}