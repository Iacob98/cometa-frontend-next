import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const utilityContactsQuery = `
      SELECT
        id,
        kind,
        org_name,
        phone,
        email,
        contact_person,
        notes
      FROM utility_contacts
      WHERE project_id = '${projectId}'
      ORDER BY kind, org_name
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${utilityContactsQuery}"`;
    const result = await execAsync(command);

    const contacts = [];
    const lines = result.stdout.trim().split('\n').filter(line => line.trim());

    for (const line of lines) {
      const parts = line.split('|').map(part => part.trim());
      if (parts.length >= 7) {
        contacts.push({
          id: parts[0],
          kind: parts[1],
          organization: parts[2],
          phone: parts[3] || null,
          email: parts[4] || null,
          contact_person: parts[5] || null,
          notes: parts[6] || null,
        });
      }
    }

    return NextResponse.json(contacts);
  } catch (error) {
    console.error('Utility contacts API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch utility contacts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      project_id,
      kind,
      organization,
      phone,
      email,
      contact_person,
      notes,
    } = body;

    if (!project_id || !kind || !organization) {
      return NextResponse.json(
        { error: 'Project ID, kind, and organization are required' },
        { status: 400 }
      );
    }

    // Validate kind
    const validKinds = ['power', 'water', 'gas', 'telecom', 'road', 'municipality', 'emergency'];
    if (!validKinds.includes(kind)) {
      return NextResponse.json(
        { error: 'Invalid utility kind' },
        { status: 400 }
      );
    }

    const contactId = crypto.randomUUID();
    const createContactQuery = `
      INSERT INTO utility_contacts (
        id, project_id, kind, org_name, phone, email, contact_person, notes
      ) VALUES (
        '${contactId}',
        '${project_id}',
        '${kind}',
        '${organization.replace(/'/g, "''")}',
        ${phone ? `'${phone.replace(/'/g, "''")}'` : 'NULL'},
        ${email ? `'${email.replace(/'/g, "''")}'` : 'NULL'},
        ${contact_person ? `'${contact_person.replace(/'/g, "''")}'` : 'NULL'},
        ${notes ? `'${notes.replace(/'/g, "''")}'` : 'NULL'}
      )
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${createContactQuery}"`;
    await execAsync(command);

    return NextResponse.json({
      success: true,
      contact_id: contactId,
      message: 'Utility contact created successfully',
    });
  } catch (error) {
    console.error('Create utility contact error:', error);
    return NextResponse.json(
      { error: 'Failed to create utility contact' },
      { status: 500 }
    );
  }
}