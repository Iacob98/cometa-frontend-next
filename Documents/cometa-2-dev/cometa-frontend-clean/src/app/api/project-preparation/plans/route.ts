import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

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

    // Query to get project plans
    const plansQuery = `
      SELECT
        id,
        title,
        description,
        plan_type,
        filename,
        file_path,
        file_size,
        uploaded_at,
        uploaded_by
      FROM project_plans
      WHERE project_id = '${projectId}'
      ORDER BY uploaded_at DESC
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${plansQuery}"`;

    try {
      const result = await execAsync(command);
      const plans = [];
      const lines = result.stdout.trim().split('\n').filter(line => line.trim());

      for (const line of lines) {
        const parts = line.split('|').map(part => part.trim());
        if (parts.length >= 8) {
          plans.push({
            id: parts[0],
            title: parts[1],
            description: parts[2] || null,
            plan_type: parts[3],
            filename: parts[4],
            file_path: parts[5],
            file_size: parseInt(parts[6]) || 0,
            uploaded_at: parts[7],
            uploaded_by: parts[8] || null,
          });
        }
      }

      return NextResponse.json(plans);
    } catch (dbError) {
      // Table might not exist, create it
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS project_plans (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          plan_type VARCHAR(100) NOT NULL,
          filename VARCHAR(255) NOT NULL,
          file_path VARCHAR(500) NOT NULL,
          file_size BIGINT NOT NULL,
          uploaded_at TIMESTAMP DEFAULT NOW(),
          uploaded_by UUID,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `;

      const createCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${createTableQuery}"`;
      await execAsync(createCommand);

      // Return empty array for new table
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Plans API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project plans' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const planType = formData.get('plan_type') as string;
    const projectId = formData.get('project_id') as string;

    if (!file || !title || !planType || !projectId) {
      return NextResponse.json(
        { error: 'File, title, plan type, and project ID are required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, images, and Excel files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Validate plan type
    const validPlanTypes = ['site_plan', 'network_design', 'cable_routing', 'excavation_plan', 'technical_drawing', 'other'];
    if (!validPlanTypes.includes(planType)) {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      );
    }

    // Create upload directory
    const uploadDir = join(process.cwd(), 'uploads', 'plans', projectId);
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const safeFileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = join(uploadDir, safeFileName);
    const relativePath = `uploads/plans/${projectId}/${safeFileName}`;

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Save to database
    const planId = crypto.randomUUID();
    const createPlanQuery = `
      INSERT INTO project_plans (
        id, project_id, title, description, plan_type, filename, file_path, file_size
      ) VALUES (
        '${planId}',
        '${projectId}',
        '${title.replace(/'/g, "''")}',
        ${description ? `'${description.replace(/'/g, "''")}'` : 'NULL'},
        '${planType}',
        '${file.name.replace(/'/g, "''")}',
        '${relativePath}',
        ${file.size}
      )
    `;

    const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${createPlanQuery}"`;
    await execAsync(command);

    return NextResponse.json({
      success: true,
      plan_id: planId,
      filename: safeFileName,
      file_path: relativePath,
      message: 'Plan uploaded successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Upload plan error:', error);
    return NextResponse.json(
      { error: 'Failed to upload plan' },
      { status: 500 }
    );
  }
}