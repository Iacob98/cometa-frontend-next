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

    // Get document categories
    const categoriesQuery = `
      SELECT
        id,
        name_de,
        name_ru,
        name_en,
        code,
        required_for_work,
        max_validity_years,
        icon,
        color,
        created_at
      FROM document_categories
      ORDER BY name_en;
    `;

    const categoriesCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${categoriesQuery}"`;

    // Get worker documents for this user
    const documentsQuery = `
      SELECT
        wd.id,
        wd.user_id,
        wd.category_id,
        wd.document_number,
        wd.issuing_authority,
        wd.issue_date,
        wd.expiry_date,
        wd.status,
        wd.file_url,
        wd.file_name,
        wd.file_size,
        wd.mime_type,
        wd.notes,
        wd.verified_by,
        wd.verified_at,
        wd.created_at,
        wd.updated_at,
        dc.name_de as category_name_de,
        dc.name_ru as category_name_ru,
        dc.name_en as category_name_en,
        dc.code as category_code,
        dc.required_for_work as category_required,
        dc.icon as category_icon,
        dc.color as category_color
      FROM worker_documents wd
      JOIN document_categories dc ON wd.category_id = dc.id
      WHERE wd.user_id = '${id}'
      ORDER BY dc.name_en, wd.created_at DESC;
    `;

    const documentsCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${documentsQuery}"`;

    // Execute both queries in parallel
    const [categoriesResult, documentsResult] = await Promise.all([
      execAsync(categoriesCommand),
      execAsync(documentsCommand)
    ]);

    // Parse categories
    const categories = [];
    const categoryLines = categoriesResult.stdout.trim().split('\n').filter(line => line.trim());

    for (const line of categoryLines) {
      const parts = line.split('|').map(part => part.trim());
      if (parts.length >= 9) {
        categories.push({
          id: parts[0],
          name_de: parts[1] || '',
          name_ru: parts[2] || '',
          name_en: parts[3] || '',
          code: parts[4] || '',
          required_for_work: parts[5] === 't',
          max_validity_years: parts[6] ? parseInt(parts[6]) : null,
          icon: parts[7] || 'FileText',
          color: parts[8] || '#007bff',
          created_at: parts[9] || new Date().toISOString()
        });
      }
    }

    // Parse documents
    const documents = [];
    const documentLines = documentsResult.stdout.trim().split('\n').filter(line => line.trim());

    for (const line of documentLines) {
      const parts = line.split('|').map(part => part.trim());
      if (parts.length >= 16) {
        // Calculate document status based on expiry date
        let status = parts[7] || 'active';
        const expiryDate = parts[6];
        if (expiryDate) {
          const expiry = new Date(expiryDate);
          const now = new Date();
          const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          if (daysUntilExpiry < 0) {
            status = 'expired';
          } else if (daysUntilExpiry <= 30) {
            status = 'expiring_soon';
          } else {
            status = 'active';
          }
        }

        documents.push({
          id: parts[0],
          user_id: parts[1],
          category_id: parts[2],
          document_number: parts[3] || null,
          issuing_authority: parts[4] || null,
          issue_date: parts[5] || null,
          expiry_date: parts[6] || null,
          status: status,
          file_url: parts[8] || '',
          file_name: parts[9] || '',
          file_size: parts[10] ? parseInt(parts[10]) : 0,
          file_type: parts[11] || '',
          notes: parts[12] || null,
          is_verified: parts[13] !== null && parts[13] !== '',
          verified_by: parts[13] || null,
          verified_at: parts[14] || null,
          created_at: parts[15] || '',
          updated_at: parts[16] || '',
          category: {
            id: parts[2],
            name_de: parts[17] || '',
            name_ru: parts[18] || '',
            name_en: parts[19] || '',
            code: parts[20] || '',
            required_for_work: parts[21] === 't',
            icon: parts[22] || 'FileText',
            color: parts[23] || '#007bff',
            created_at: ''
          }
        });
      }
    }

    // Calculate stats
    const stats = {
      total: documents.length,
      active: documents.filter(doc => doc.status === 'active').length,
      expired: documents.filter(doc => doc.status === 'expired').length,
      expiring_soon: documents.filter(doc => doc.status === 'expiring_soon').length
    };

    return NextResponse.json({
      documents,
      categories,
      stats
    });

  } catch (error) {
    console.error('Documents API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}