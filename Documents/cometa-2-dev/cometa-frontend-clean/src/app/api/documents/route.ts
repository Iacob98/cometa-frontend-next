import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const category_code = searchParams.get('category_code');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const per_page = parseInt(searchParams.get('per_page') || '50');

    // Build WHERE clause
    const conditions = ['1=1'];

    if (user_id) {
      conditions.push(`wd.user_id = '${user_id}'`);
    }
    if (category_code) {
      conditions.push(`dc.code = '${category_code}'`);
    }
    if (status) {
      conditions.push(`wd.status = '${status}'`);
    }
    if (search) {
      conditions.push(`(wd.document_number ILIKE '%${search}%' OR dc.name_en ILIKE '%${search}%' OR u.first_name || ' ' || u.last_name ILIKE '%${search}%')`);
    }

    const whereClause = conditions.length > 1 ? 'WHERE ' + conditions.join(' AND ') : '';
    const offset = (page - 1) * per_page;

    // Main query to get worker documents with category info
    const documentsQuery = `
      SELECT
        wd.id,
        wd.user_id,
        wd.category_id,
        wd.document_number,
        wd.issuing_authority,
        wd.issue_date,
        wd.expiry_date,
        wd.valid_until,
        wd.status,
        wd.file_url,
        wd.file_name,
        wd.file_size,
        wd.file_type,
        wd.notes,
        wd.is_verified,
        wd.verified_by,
        wd.verified_at,
        wd.created_at,
        wd.updated_at,
        dc.code as category_code,
        dc.name_en as category_name_en,
        dc.name_de as category_name_de,
        dc.name_ru as category_name_ru,
        dc.color as category_color,
        dc.required_for_work,
        u.first_name || ' ' || u.last_name as user_name,
        u.email as user_email,
        v.first_name || ' ' || v.last_name as verifier_name
      FROM worker_documents wd
      JOIN document_categories dc ON wd.category_id = dc.id
      JOIN users u ON wd.user_id = u.id
      LEFT JOIN users v ON wd.verified_by = v.id
      ${whereClause}
      ORDER BY
        CASE wd.status
          WHEN 'expired' THEN 1
          WHEN 'expiring_soon' THEN 2
          WHEN 'pending' THEN 3
          WHEN 'active' THEN 4
          ELSE 5
        END,
        wd.created_at DESC
      LIMIT ${per_page} OFFSET ${offset}
    `;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM worker_documents wd
      JOIN document_categories dc ON wd.category_id = dc.id
      JOIN users u ON wd.user_id = u.id
      ${whereClause}
    `;

    // Get document categories
    const categoriesQuery = `
      SELECT
        id,
        code,
        name_en,
        name_de,
        name_ru,
        required_for_work,
        retention_period_months,
        icon,
        color,
        created_at
      FROM document_categories
      ORDER BY required_for_work DESC, name_en
    `;

    // Get stats
    const statsQuery = `
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired,
        COUNT(CASE WHEN status = 'expiring_soon' THEN 1 END) as expiring_soon
      FROM worker_documents wd
      JOIN document_categories dc ON wd.category_id = dc.id
      JOIN users u ON wd.user_id = u.id
      ${whereClause}
    `;

    const [documentsResult, countResult, categoriesResult, statsResult] = await Promise.all([
      execAsync(`docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${documentsQuery}"`),
      execAsync(`docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${countQuery}"`),
      execAsync(`docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${categoriesQuery}"`),
      execAsync(`docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${statsQuery}"`)
    ]);

    // Parse documents
    const documents = [];
    const docLines = documentsResult.stdout.trim().split('\n').filter(line => line.trim());

    for (const line of docLines) {
      const parts = line.split('|').map(part => part.trim());
      if (parts.length >= 25) {
        documents.push({
          id: parts[0],
          user_id: parts[1],
          category_id: parts[2],
          document_number: parts[3] || null,
          issuing_authority: parts[4] || null,
          issue_date: parts[5] || null,
          expiry_date: parts[6] || null,
          valid_until: parts[7] || null,
          status: parts[8],
          file_url: parts[9],
          file_name: parts[10],
          file_size: parseInt(parts[11]) || 0,
          file_type: parts[12],
          notes: parts[13] || null,
          is_verified: parts[14] === 'true' || parts[14] === 't',
          verified_by: parts[15] || null,
          verified_at: parts[16] || null,
          created_at: parts[17],
          updated_at: parts[18],
          category: {
            id: parts[2],
            code: parts[19],
            name_en: parts[20],
            name_de: parts[21],
            name_ru: parts[22],
            color: parts[23],
            required_for_work: parts[24] === 'true' || parts[24] === 't'
          },
          user: {
            id: parts[1],
            name: parts[25],
            email: parts[26] || null
          },
          verifier: parts[27] ? {
            name: parts[27]
          } : null
        });
      }
    }

    // Parse categories
    const categories = [];
    const catLines = categoriesResult.stdout.trim().split('\n').filter(line => line.trim());

    for (const line of catLines) {
      const parts = line.split('|').map(part => part.trim());
      if (parts.length >= 9) {
        categories.push({
          id: parts[0],
          code: parts[1],
          name_en: parts[2],
          name_de: parts[3],
          name_ru: parts[4],
          required_for_work: parts[5] === 'true' || parts[5] === 't',
          retention_period_months: parts[6] ? parseInt(parts[6]) : null,
          icon: parts[7] || null,
          color: parts[8],
          created_at: parts[9]
        });
      }
    }

    // Parse stats
    const statsParts = statsResult.stdout.trim().split('|').map(part => part.trim());
    const stats = {
      total: parseInt(statsParts[0]) || 0,
      active: parseInt(statsParts[1]) || 0,
      expired: parseInt(statsParts[2]) || 0,
      expiring_soon: parseInt(statsParts[3]) || 0
    };

    const total = parseInt(countResult.stdout.trim()) || 0;
    const total_pages = Math.ceil(total / per_page);

    return NextResponse.json({
      documents,
      categories,
      stats,
      total,
      page,
      per_page,
      total_pages,
    });
  } catch (error) {
    console.error('Documents API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      category_id,
      document_number,
      issuing_authority,
      issue_date,
      expiry_date,
      valid_until,
      file_url,
      file_name,
      file_size,
      file_type,
      notes
    } = body;

    // Validation
    if (!user_id || !category_id || !file_url || !file_name) {
      return NextResponse.json(
        { error: 'User ID, category ID, file URL, and file name are required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const userCheckQuery = `SELECT id FROM users WHERE id = '${user_id}'`;
    const userCheckResult = await execAsync(
      `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${userCheckQuery}"`
    );

    if (!userCheckResult.stdout.trim()) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 400 }
      );
    }

    // Check if category exists
    const categoryCheckQuery = `SELECT id FROM document_categories WHERE id = '${category_id}'`;
    const categoryCheckResult = await execAsync(
      `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${categoryCheckQuery}"`
    );

    if (!categoryCheckResult.stdout.trim()) {
      return NextResponse.json(
        { error: 'Document category not found' },
        { status: 400 }
      );
    }

    const documentId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // Determine status based on expiry date
    let status = 'active';
    if (expiry_date) {
      const expiry = new Date(expiry_date);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry < 0) {
        status = 'expired';
      } else if (daysUntilExpiry <= 30) {
        status = 'expiring_soon';
      }
    }

    const insertDocumentQuery = `
      INSERT INTO worker_documents (
        id, user_id, category_id, document_number, issuing_authority,
        issue_date, expiry_date, valid_until, status, file_url, file_name,
        file_size, file_type, notes, is_verified, created_at, updated_at
      ) VALUES (
        '${documentId}',
        '${user_id}',
        '${category_id}',
        ${document_number ? `'${document_number.replace(/'/g, "''")}'` : 'NULL'},
        ${issuing_authority ? `'${issuing_authority.replace(/'/g, "''")}'` : 'NULL'},
        ${issue_date ? `'${issue_date}'` : 'NULL'},
        ${expiry_date ? `'${expiry_date}'` : 'NULL'},
        ${valid_until ? `'${valid_until}'` : 'NULL'},
        '${status}',
        '${file_url}',
        '${file_name.replace(/'/g, "''")}',
        ${file_size || 0},
        '${file_type}',
        ${notes ? `'${notes.replace(/'/g, "''")}'` : 'NULL'},
        false,
        '${timestamp}',
        '${timestamp}'
      )
    `;

    await execAsync(
      `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${insertDocumentQuery}"`
    );

    return NextResponse.json({
      id: documentId,
      user_id,
      category_id,
      status,
      file_name,
      message: 'Document uploaded successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Upload document error:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}