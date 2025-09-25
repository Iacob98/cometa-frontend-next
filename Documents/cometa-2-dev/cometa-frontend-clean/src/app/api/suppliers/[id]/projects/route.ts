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
        ps.id,
        ps.project_id,
        ps.supplier_id,
        ps.assigned_at,
        ps.status,
        ps.notes,
        ps.is_active,
        p.name as project_name,
        p.customer as project_customer,
        p.city as project_city,
        p.address as project_address,
        p.status as project_status,
        u.first_name || ' ' || u.last_name as assigned_by_name
      FROM project_suppliers ps
      LEFT JOIN projects p ON ps.project_id = p.id
      LEFT JOIN users u ON ps.assigned_by = u.id
      WHERE ps.supplier_id = '${supplierId}' AND ps.is_active = true
      ORDER BY ps.assigned_at DESC
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${query}"`;
    const { stdout } = await execAsync(command);

    const assignments = [];
    const assignmentLines = stdout.trim().split('\n').filter(line => line.trim());

    for (const line of assignmentLines) {
      const parts = line.split('|').map(part => part.trim());
      if (parts.length >= 8) {
        assignments.push({
          id: parts[0],
          project_id: parts[1],
          supplier_id: parts[2],
          assigned_at: parts[3] || null,
          status: parts[4] || 'active',
          notes: parts[5] || '',
          is_active: parts[6] === 't',
          project_name: parts[7] || '',
          project_customer: parts[8] || '',
          project_city: parts[9] || '',
          project_address: parts[10] || '',
          project_status: parts[11] || '',
          assigned_by_name: parts[12] || ''
        });
      }
    }

    return NextResponse.json(assignments);
  } catch (error) {
    console.error('Get supplier projects error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supplier projects' },
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
    const { project_id, notes, assigned_by } = body;

    if (!supplierId || !project_id) {
      return NextResponse.json(
        { error: 'Supplier ID and project ID are required' },
        { status: 400 }
      );
    }

    // Check if assignment already exists
    const checkQuery = `
      SELECT id FROM project_suppliers
      WHERE supplier_id = '${supplierId}' AND project_id = '${project_id}' AND is_active = true
    `;
    const checkCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${checkQuery}"`;
    const checkResult = await execAsync(checkCommand);

    if (checkResult.stdout.trim()) {
      return NextResponse.json(
        { error: 'Supplier is already assigned to this project' },
        { status: 409 }
      );
    }

    // Generate UUID for new assignment
    const assignmentId = crypto.randomUUID();

    // Insert new project supplier assignment
    const insertQuery = `
      INSERT INTO project_suppliers (
        id, project_id, supplier_id, assigned_by, status, notes, is_active
      )
      VALUES (
        '${assignmentId}',
        '${project_id}',
        '${supplierId}',
        ${assigned_by ? `'${assigned_by}'` : 'NULL'},
        'active',
        ${notes ? `'${notes.replace(/'/g, "''")}'` : 'NULL'},
        true
      )
      RETURNING id, project_id, supplier_id, assigned_at, status, notes, is_active
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${insertQuery}"`;
    const { stdout } = await execAsync(command);

    const result = stdout.trim().split('|').map(part => part.trim());

    const newAssignment = {
      id: result[0],
      project_id: result[1],
      supplier_id: result[2],
      assigned_at: result[3] || null,
      status: result[4] || 'active',
      notes: result[5] || '',
      is_active: result[6] === 't'
    };

    return NextResponse.json(newAssignment, { status: 201 });
  } catch (error) {
    console.error('Create supplier project assignment error:', error);
    return NextResponse.json(
      { error: 'Failed to assign supplier to project' },
      { status: 500 }
    );
  }
}