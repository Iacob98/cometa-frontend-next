import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const include_content = searchParams.get('include_content') === 'true';
    const highlight = searchParams.get('highlight') === 'true';
    const fuzzy = searchParams.get('fuzzy') === 'true';

    if (!search || search.trim() === '') {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Build search conditions
    const searchConditions = [];

    if (fuzzy) {
      // Use ILIKE for fuzzy matching
      searchConditions.push(`(
        wd.document_number ILIKE '%${search}%' OR
        wd.issuing_authority ILIKE '%${search}%' OR
        wd.file_name ILIKE '%${search}%' OR
        wd.notes ILIKE '%${search}%' OR
        dc.name_en ILIKE '%${search}%' OR
        dc.name_de ILIKE '%${search}%' OR
        dc.name_ru ILIKE '%${search}%' OR
        u.first_name || ' ' || u.last_name ILIKE '%${search}%'
      )`);
    } else {
      // Exact phrase matching
      searchConditions.push(`(
        wd.document_number ILIKE '%${search}%' OR
        wd.file_name ILIKE '%${search}%' OR
        dc.name_en ILIKE '%${search}%' OR
        u.first_name || ' ' || u.last_name ILIKE '%${search}%'
      )`);
    }

    const whereClause = 'WHERE ' + searchConditions.join(' AND ');

    // Search query
    const searchQuery = `
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
      LIMIT 50
    `;

    // Get count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM worker_documents wd
      JOIN document_categories dc ON wd.category_id = dc.id
      JOIN users u ON wd.user_id = u.id
      ${whereClause}
    `;

    const [searchResult, countResult] = await Promise.all([
      execAsync(`docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${searchQuery}"`),
      execAsync(`docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${countQuery}"`)
    ]);

    // Parse search results
    const documents = [];
    const docLines = searchResult.stdout.trim().split('\n').filter(line => line.trim());

    for (const line of docLines) {
      const parts = line.split('|').map(part => part.trim());
      if (parts.length >= 25) {
        const document = {
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
        };

        // Add highlighting if requested
        if (highlight) {
          const highlightTerm = search.toLowerCase();

          if (document.file_name && document.file_name.toLowerCase().includes(highlightTerm)) {
            document.file_name = document.file_name.replace(
              new RegExp(search, 'gi'),
              `<mark>$&</mark>`
            );
          }

          if (document.document_number && document.document_number.toLowerCase().includes(highlightTerm)) {
            document.document_number = document.document_number.replace(
              new RegExp(search, 'gi'),
              `<mark>$&</mark>`
            );
          }
        }

        documents.push(document);
      }
    }

    const total = parseInt(countResult.stdout.trim()) || 0;

    return NextResponse.json({
      query: search,
      documents,
      total,
      include_content,
      highlight,
      fuzzy,
      execution_time: Date.now(),
    });
  } catch (error) {
    console.error('Document search error:', error);
    return NextResponse.json(
      { error: 'Failed to search documents' },
      { status: 500 }
    );
  }
}