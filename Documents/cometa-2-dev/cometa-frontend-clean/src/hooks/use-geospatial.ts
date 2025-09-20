"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  apiClient,
  geospatialClient,
  geoRoutesClient,
  geoLayersClient,
  geoMeasurementsClient,
  geoAnnotationsClient,
  mapTilesClient,
  geoAnalysisClient
} from "@/lib/api-client";
import type {
  GeospatialFeature,
  CreateGeospatialFeatureRequest,
  UpdateGeospatialFeatureRequest,
  GeospatialFilters,
  GeoRoute,
  CreateGeoRouteRequest,
  UpdateGeoRouteRequest,
  GeoRouteFilters,
  GeoLayer,
  CreateGeoLayerRequest,
  UpdateGeoLayerRequest,
  GeoLayerFilters,
  GeoMeasurement,
  CreateGeoMeasurementRequest,
  UpdateGeoMeasurementRequest,
  GeoMeasurementFilters,
  GeoAnnotation,
  CreateGeoAnnotationRequest,
  UpdateGeoAnnotationRequest,
  GeoAnnotationFilters,
  MapTile,
  MapTileFilters,
  GeoAnalysisRequest,
  GeoAnalysisResult,
  UUID,
  PaginatedResponse,
} from "@/types";

// Geospatial Features
export function useGeospatialFeatures(filters?: GeospatialFilters) {
  return useQuery({
    queryKey: ["geospatial-features", filters],
    queryFn: () => geospatialClient.getFeatures(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useGeospatialFeature(id: UUID) {
  return useQuery({
    queryKey: ["geospatial-features", id],
    queryFn: () => geospatialClient.getFeature(id),
    enabled: !!id,
  });
}

export function useCreateGeospatialFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGeospatialFeatureRequest) =>
      geospatialClient.createFeature(data),
    onSuccess: (newFeature) => {
      queryClient.invalidateQueries({ queryKey: ["geospatial-features"] });
      toast.success("Geospatial feature created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create geospatial feature");
    },
  });
}

export function useUpdateGeospatialFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateGeospatialFeatureRequest }) =>
      geospatialClient.updateFeature(id, data),
    onSuccess: (updatedFeature) => {
      queryClient.invalidateQueries({ queryKey: ["geospatial-features"] });
      queryClient.invalidateQueries({ queryKey: ["geospatial-features", updatedFeature.id] });
      toast.success("Geospatial feature updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update geospatial feature");
    },
  });
}

export function useDeleteGeospatialFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => geospatialClient.deleteFeature(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["geospatial-features"] });
      toast.success("Geospatial feature deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete geospatial feature");
    },
  });
}

// Geo Routes
export function useGeoRoutes(filters?: GeoRouteFilters) {
  return useQuery({
    queryKey: ["geo-routes", filters],
    queryFn: () => geoRoutesClient.getRoutes(filters),
    staleTime: 5 * 60 * 1000,
  });
}

export function useGeoRoute(id: UUID) {
  return useQuery({
    queryKey: ["geo-routes", id],
    queryFn: () => geoRoutesClient.getRoute(id),
    enabled: !!id,
  });
}

export function useCreateGeoRoute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGeoRouteRequest) =>
      geoRoutesClient.createRoute(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["geo-routes"] });
      toast.success("Route created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create route");
    },
  });
}

export function useUpdateGeoRoute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateGeoRouteRequest }) =>
      geoRoutesClient.updateRoute(id, data),
    onSuccess: (updatedRoute) => {
      queryClient.invalidateQueries({ queryKey: ["geo-routes"] });
      queryClient.invalidateQueries({ queryKey: ["geo-routes", updatedRoute.id] });
      toast.success("Route updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update route");
    },
  });
}

export function useDeleteGeoRoute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => geoRoutesClient.deleteRoute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["geo-routes"] });
      toast.success("Route deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete route");
    },
  });
}

export function useOptimizeRoute() {
  return useMutation({
    mutationFn: (id: UUID) => geoRoutesClient.optimizeRoute(id),
    onSuccess: () => {
      toast.success("Route optimized successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to optimize route");
    },
  });
}

// Geo Layers
export function useGeoLayers(filters?: GeoLayerFilters) {
  return useQuery({
    queryKey: ["geo-layers", filters],
    queryFn: () => geoLayersClient.getLayers(filters),
    staleTime: 10 * 60 * 1000, // 10 minutes - layers don't change often
  });
}

export function useGeoLayer(id: UUID) {
  return useQuery({
    queryKey: ["geo-layers", id],
    queryFn: () => geoLayersClient.getLayer(id),
    enabled: !!id,
  });
}

export function useCreateGeoLayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGeoLayerRequest) =>
      geoLayersClient.createLayer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["geo-layers"] });
      toast.success("Layer created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create layer");
    },
  });
}

export function useUpdateGeoLayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateGeoLayerRequest }) =>
      geoLayersClient.updateLayer(id, data),
    onSuccess: (updatedLayer) => {
      queryClient.invalidateQueries({ queryKey: ["geo-layers"] });
      queryClient.invalidateQueries({ queryKey: ["geo-layers", updatedLayer.id] });
      toast.success("Layer updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update layer");
    },
  });
}

export function useDeleteGeoLayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => geoLayersClient.deleteLayer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["geo-layers"] });
      toast.success("Layer deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete layer");
    },
  });
}

// Geo Measurements
export function useGeoMeasurements(filters?: GeoMeasurementFilters) {
  return useQuery({
    queryKey: ["geo-measurements", filters],
    queryFn: () => geoMeasurementsClient.getMeasurements(filters),
    staleTime: 5 * 60 * 1000,
  });
}

export function useGeoMeasurement(id: UUID) {
  return useQuery({
    queryKey: ["geo-measurements", id],
    queryFn: () => geoMeasurementsClient.getMeasurement(id),
    enabled: !!id,
  });
}

export function useCreateGeoMeasurement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGeoMeasurementRequest) =>
      geoMeasurementsClient.createMeasurement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["geo-measurements"] });
      toast.success("Measurement created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create measurement");
    },
  });
}

export function useUpdateGeoMeasurement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateGeoMeasurementRequest }) =>
      geoMeasurementsClient.updateMeasurement(id, data),
    onSuccess: (updatedMeasurement) => {
      queryClient.invalidateQueries({ queryKey: ["geo-measurements"] });
      queryClient.invalidateQueries({ queryKey: ["geo-measurements", updatedMeasurement.id] });
      toast.success("Measurement updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update measurement");
    },
  });
}

export function useDeleteGeoMeasurement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => geoMeasurementsClient.deleteMeasurement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["geo-measurements"] });
      toast.success("Measurement deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete measurement");
    },
  });
}

// Geo Annotations
export function useGeoAnnotations(filters?: GeoAnnotationFilters) {
  return useQuery({
    queryKey: ["geo-annotations", filters],
    queryFn: () => geoAnnotationsClient.getAnnotations(filters),
    staleTime: 5 * 60 * 1000,
  });
}

export function useGeoAnnotation(id: UUID) {
  return useQuery({
    queryKey: ["geo-annotations", id],
    queryFn: () => geoAnnotationsClient.getAnnotation(id),
    enabled: !!id,
  });
}

export function useCreateGeoAnnotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGeoAnnotationRequest) =>
      geoAnnotationsClient.createAnnotation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["geo-annotations"] });
      toast.success("Annotation created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create annotation");
    },
  });
}

export function useUpdateGeoAnnotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateGeoAnnotationRequest }) =>
      geoAnnotationsClient.updateAnnotation(id, data),
    onSuccess: (updatedAnnotation) => {
      queryClient.invalidateQueries({ queryKey: ["geo-annotations"] });
      queryClient.invalidateQueries({ queryKey: ["geo-annotations", updatedAnnotation.id] });
      toast.success("Annotation updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update annotation");
    },
  });
}

export function useDeleteGeoAnnotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: UUID) => geoAnnotationsClient.deleteAnnotation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["geo-annotations"] });
      toast.success("Annotation deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete annotation");
    },
  });
}

// Map Tiles
export function useMapTiles(filters?: MapTileFilters) {
  return useQuery({
    queryKey: ["map-tiles", filters],
    queryFn: () => mapTilesClient.getTiles(filters),
    staleTime: 30 * 60 * 1000, // 30 minutes - tiles are cached
  });
}

export function useMapTile(id: UUID) {
  return useQuery({
    queryKey: ["map-tiles", id],
    queryFn: () => mapTilesClient.getTile(id),
    enabled: !!id,
  });
}

// Geo Analysis
export function useGeoAnalysis() {
  return useMutation({
    mutationFn: (request: GeoAnalysisRequest) =>
      geoAnalysisClient.performAnalysis(request),
    onSuccess: () => {
      toast.success("Analysis completed successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Analysis failed");
    },
  });
}

export function useGeoAnalysisResults(analysisId?: UUID) {
  return useQuery({
    queryKey: ["geo-analysis-results", analysisId],
    queryFn: () => geoAnalysisClient.getAnalysisResults(analysisId!),
    enabled: !!analysisId,
  });
}

export function useBatchGeoAnalysis() {
  return useMutation({
    mutationFn: (requests: GeoAnalysisRequest[]) =>
      geoAnalysisClient.performBatchAnalysis(requests),
    onSuccess: () => {
      toast.success("Batch analysis completed successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Batch analysis failed");
    },
  });
}

// GPS Tracking (for real-time location updates)
export function useGPSTracking(userId?: UUID) {
  return useQuery({
    queryKey: ["gps-tracking", userId],
    queryFn: () => geospatialClient.getGPSLocation(userId!),
    enabled: !!userId,
    refetchInterval: 30000, // Update every 30 seconds
    staleTime: 25000, // Consider stale after 25 seconds
  });
}

export function useUpdateGPSLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, location }: { userId: UUID; location: { latitude: number; longitude: number; accuracy?: number } }) =>
      geospatialClient.updateGPSLocation(userId, location),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gps-tracking"] });
    },
    onError: (error: any) => {
      console.error("GPS location update failed:", error);
    },
  });
}

// Project Geospatial Data (convenience hooks for project-specific data)
export function useProjectGeospatialFeatures(projectId: UUID) {
  return useGeospatialFeatures({ project_id: projectId });
}

export function useProjectGeoRoutes(projectId: UUID) {
  return useGeoRoutes({ project_id: projectId });
}

export function useProjectGeoLayers(projectId: UUID) {
  return useGeoLayers({ project_id: projectId });
}

export function useProjectGeoMeasurements(projectId: UUID) {
  return useGeoMeasurements({ project_id: projectId });
}

export function useProjectGeoAnnotations(projectId: UUID) {
  return useGeoAnnotations({ project_id: projectId });
}