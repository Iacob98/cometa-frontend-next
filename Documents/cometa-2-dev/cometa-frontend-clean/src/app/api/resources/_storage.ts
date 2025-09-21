// Simple file-based storage for demo purposes
// In a real application, this would be a database

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface CreatedResource {
  id: string;
  projectId: string;
  type: 'vehicle' | 'equipment';
  data: any;
  createdAt: string;
}

const STORAGE_FILE = join(process.cwd(), 'temp_resources.json');

function loadResources(): CreatedResource[] {
  try {
    if (existsSync(STORAGE_FILE)) {
      const data = readFileSync(STORAGE_FILE, 'utf-8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error loading resources:', error);
    return [];
  }
}

function saveResources(resources: CreatedResource[]) {
  try {
    writeFileSync(STORAGE_FILE, JSON.stringify(resources, null, 2));
  } catch (error) {
    console.error('Error saving resources:', error);
  }
}

export function addCreatedResource(resource: CreatedResource) {
  const resources = loadResources();
  resources.push(resource);
  saveResources(resources);
}

export function getCreatedResourcesForProject(projectId: string) {
  const resources = loadResources();
  return resources.filter(r => r.projectId === projectId);
}

export function removeCreatedResource(resourceId: string, projectId: string) {
  const resources = loadResources();
  const index = resources.findIndex(r => r.id === resourceId && r.projectId === projectId);
  if (index > -1) {
    resources.splice(index, 1);
    saveResources(resources);
  }
}