// Re-export all API modules for easy importing
export * from "./client";
export * from "./auth";
export * from "./projects";
export * from "./work-entries";

// You can also create a unified API object if preferred
export { apiClient } from "./client";
export { authApi } from "./auth";
export { projectsApi } from "./projects";
export { workEntriesApi } from "./work-entries";