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

    // Get comprehensive project preparation data
    const projectQuery = `
      SELECT
        p.id,
        p.name,
        p.customer,
        p.city,
        p.address,
        p.contact_24h,
        p.start_date,
        p.end_date_plan,
        p.status,
        p.total_length_m,
        p.base_rate_per_m,
        p.pm_user_id,
        u.first_name as pm_first_name,
        u.last_name as pm_last_name
      FROM projects p
      LEFT JOIN users u ON p.pm_user_id = u.id
      WHERE p.id = '${projectId}'
    `;

    const projectCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${projectQuery}"`;
    const projectResult = await execAsync(projectCommand);

    if (!projectResult.stdout.trim()) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const projectLine = projectResult.stdout.trim();
    const projectParts = projectLine.split('|').map(part => part.trim());

    const project = {
      id: projectParts[0],
      name: projectParts[1],
      customer: projectParts[2] || null,
      city: projectParts[3] || null,
      address: projectParts[4] || null,
      contact_24h: projectParts[5] || null,
      start_date: projectParts[6] || null,
      end_date_plan: projectParts[7] || null,
      status: projectParts[8],
      total_length_m: parseFloat(projectParts[9]) || 0,
      base_rate_per_m: parseFloat(projectParts[10]) || 0,
      pm_user_id: projectParts[11] || null,
      project_manager: projectParts[12] && projectParts[13]
        ? `${projectParts[12]} ${projectParts[13]}`
        : null,
    };

    // Calculate potential revenue
    const potentialRevenue = project.total_length_m * project.base_rate_per_m;

    // Get utility contacts count
    const utilityContactsQuery = `
      SELECT COUNT(*) FROM utility_contacts WHERE project_id = '${projectId}'
    `;
    const utilityContactsCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${utilityContactsQuery}"`;
    const utilityContactsResult = await execAsync(utilityContactsCommand);
    const utilityContactsCount = parseInt(utilityContactsResult.stdout.trim()) || 0;

    // Get facilities count
    const facilitiesQuery = `
      SELECT COUNT(*) FROM facilities WHERE project_id = '${projectId}'
    `;
    const facilitiesCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${facilitiesQuery}"`;
    const facilitiesResult = await execAsync(facilitiesCommand);
    const facilitiesCount = parseInt(facilitiesResult.stdout.trim()) || 0;

    // Get housing units count
    const housingQuery = `
      SELECT COUNT(*) FROM housing_units WHERE project_id = '${projectId}'
    `;
    const housingCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${housingQuery}"`;
    const housingResult = await execAsync(housingCommand);
    const housingCount = parseInt(housingResult.stdout.trim()) || 0;

    // Get crews count
    const crewsQuery = `
      SELECT COUNT(*) FROM crews WHERE project_id = '${projectId}'
    `;
    const crewsCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${crewsQuery}"`;
    const crewsResult = await execAsync(crewsCommand);
    const crewsCount = parseInt(crewsResult.stdout.trim()) || 0;

    // Get material allocations count
    const materialsQuery = `
      SELECT COUNT(*) FROM material_allocations WHERE project_id = '${projectId}'
    `;
    const materialsCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${materialsQuery}"`;
    const materialsResult = await execAsync(materialsCommand);
    const materialsCount = parseInt(materialsResult.stdout.trim()) || 0;

    // Get equipment assignments count
    const equipmentQuery = `
      SELECT COUNT(*) FROM equipment_assignments WHERE project_id = '${projectId}'
    `;
    const equipmentCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${equipmentQuery}"`;
    const equipmentResult = await execAsync(equipmentCommand);
    const equipmentCount = parseInt(equipmentResult.stdout.trim()) || 0;

    // Calculate preparation progress
    const totalSteps = 9; // Steps 0-8
    const completedSteps = [
      project.pm_user_id ? 1 : 0, // Step 0: Project manager assigned
      utilityContactsCount > 0 ? 1 : 0, // Step 1: Utility contacts
      facilitiesCount > 0 ? 1 : 0, // Step 3: Facilities
      housingCount > 0 ? 1 : 0, // Step 3: Housing
      crewsCount > 0 ? 1 : 0, // Step 4: Teams
      materialsCount > 0 ? 1 : 0, // Step 6: Materials
      equipmentCount > 0 ? 1 : 0, // Step 5: Equipment
    ].reduce((sum, step) => sum + step, 0);

    const preparationProgress = Math.round((completedSteps / totalSteps) * 100);

    return NextResponse.json({
      project,
      potential_revenue: potentialRevenue,
      preparation_progress: preparationProgress,
      steps_summary: {
        utility_contacts: utilityContactsCount,
        facilities: facilitiesCount,
        housing_units: housingCount,
        crews: crewsCount,
        materials: materialsCount,
        equipment: equipmentCount,
      },
    });
  } catch (error) {
    console.error('Project preparation API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project preparation data' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id, status, reason } = body;

    if (!project_id || !status) {
      return NextResponse.json(
        { error: 'Project ID and status are required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['draft', 'active', 'waiting_invoice', 'closed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid project status' },
        { status: 400 }
      );
    }

    // Update project status
    const updateQuery = `
      UPDATE projects
      SET status = '${status}'
      WHERE id = '${project_id}'
    `;

    const updateCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${updateQuery}"`;
    await execAsync(updateCommand);

    // Log the activity (simplified for now)
    const logQuery = `
      INSERT INTO activity_log (id, user_id, activity_type, description, project_id, created_at)
      VALUES (
        '${crypto.randomUUID()}',
        NULL,
        'project_status_change',
        'Changed project status to ${status}. Reason: ${reason || 'No reason provided'}',
        '${project_id}',
        NOW()
      )
    `;

    const logCommand = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -c "${logQuery}"`;
    await execAsync(logCommand);

    return NextResponse.json({
      success: true,
      message: `Project status updated to ${status}`,
    });
  } catch (error) {
    console.error('Update project status error:', error);
    return NextResponse.json(
      { error: 'Failed to update project status' },
      { status: 500 }
    );
  }
}