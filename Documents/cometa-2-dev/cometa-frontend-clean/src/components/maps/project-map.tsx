"use client";

import React, { useState, useCallback, useMemo } from "react";
import { MapContainer, TileLayer, LayersControl } from "react-leaflet";
import dynamic from "next/dynamic";
import L from "leaflet";
import {
  Map,
  Layers,
  MapPin,
  Ruler,
  Navigation,
  Settings,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  useProjectGeospatialFeatures,
  useProjectGeoRoutes,
  useProjectGeoLayers,
  useProjectGeoMeasurements,
} from "@/hooks/use-geospatial";
import { useAuth } from "@/hooks/use-auth";
import type { UUID, GeospatialFeature } from "@/types";

// Dynamic imports to avoid SSR issues with Leaflet
const MapBase = dynamic(() => import("./map-base"), { ssr: false });
const FeatureLayer = dynamic(() => import("./feature-layer"), { ssr: false });
const GPSTracker = dynamic(() => import("./gps-tracker"), { ssr: false });
const MeasurementTools = dynamic(() => import("./measurement-tools"), { ssr: false });

interface ProjectMapProps {
  projectId: UUID;
  height?: string;
  width?: string;
  className?: string;
  showControls?: boolean;
  showMeasurementTools?: boolean;
  showGPSTracking?: boolean;
  defaultCenter?: [number, number];
  defaultZoom?: number;
}

interface LayerVisibility {
  features: boolean;
  routes: boolean;
  measurements: boolean;
  gpsTracking: boolean;
  annotations: boolean;
}

interface MapSettings {
  tileLayer: "osm" | "satellite" | "terrain";
  showGrid: boolean;
  showScale: boolean;
  clusteredMarkers: boolean;
}

const TILE_LAYERS = {
  osm: {
    name: "OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  satellite: {
    name: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
  },
  terrain: {
    name: "Terrain",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://opentopomap.org/">OpenTopoMap</a>',
  },
};

export function ProjectMap({
  projectId,
  height = "600px",
  width = "100%",
  className,
  showControls = true,
  showMeasurementTools = true,
  showGPSTracking = true,
  defaultCenter = [52.52, 13.405],
  defaultZoom = 13,
}: ProjectMapProps) {
  const { user } = useAuth();
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | undefined>();
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>({
    features: true,
    routes: true,
    measurements: false,
    gpsTracking: false,
    annotations: false,
  });
  const [mapSettings, setMapSettings] = useState<MapSettings>({
    tileLayer: "osm",
    showGrid: false,
    showScale: true,
    clusteredMarkers: false,
  });
  const [showControlPanel, setShowControlPanel] = useState(false);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  // Data queries
  const { data: featuresData, isLoading: featuresLoading } = useProjectGeospatialFeatures(projectId);
  const { data: routesData, isLoading: routesLoading } = useProjectGeoRoutes(projectId);
  const { data: measurementsData, isLoading: measurementsLoading } = useProjectGeoMeasurements(projectId);

  // Team members for GPS tracking
  const teamMembers = useMemo(() => {
    // This would come from team data in a real implementation
    return [];
  }, []);

  const handleFeatureClick = useCallback((feature: GeospatialFeature) => {
    setSelectedFeatureId(feature.id);
  }, []);

  const handleFeatureEdit = useCallback((feature: GeospatialFeature) => {
    // TODO: Open feature edit dialog
    console.log("Edit feature:", feature);
  }, []);

  const toggleLayer = (layer: keyof LayerVisibility) => {
    setLayerVisibility(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  const handleMapReady = useCallback((map: L.Map) => {
    setMapInstance(map);

    // Add scale control
    if (mapSettings.showScale) {
      L.control.scale().addTo(map);
    }
  }, [mapSettings.showScale]);

  const getLoadingMessage = () => {
    const loading = [];
    if (featuresLoading) loading.push("features");
    if (routesLoading) loading.push("routes");
    if (measurementsLoading) loading.push("measurements");
    return loading.length > 0 ? `Loading ${loading.join(", ")}...` : null;
  };

  const getDataCounts = () => {
    return {
      features: featuresData?.total || 0,
      routes: routesData?.total || 0,
      measurements: measurementsData?.total || 0,
    };
  };

  const dataCounts = getDataCounts();
  const loadingMessage = getLoadingMessage();

  return (
    <div className={cn("relative", className)} style={{ height, width }}>
      {/* Map Container */}
      <MapBase
        center={defaultCenter}
        zoom={defaultZoom}
        height={height}
        width={width}
        onMapReady={handleMapReady}
      >
        {/* Tile Layer */}
        <TileLayer
          attribution={TILE_LAYERS[mapSettings.tileLayer].attribution}
          url={TILE_LAYERS[mapSettings.tileLayer].url}
        />

        {/* Geospatial Features */}
        {layerVisibility.features && featuresData?.data && (
          <FeatureLayer
            features={featuresData.data}
            onFeatureClick={handleFeatureClick}
            onFeatureEdit={handleFeatureEdit}
            selectedFeatureId={selectedFeatureId}
            editable={user?.role === "admin" || user?.role === "pm"}
          />
        )}

        {/* GPS Tracking */}
        {layerVisibility.gpsTracking && showGPSTracking && (
          <GPSTracker
            trackCurrentUser={true}
            trackUsers={teamMembers}
            enableTracking={true}
            showAccuracy={true}
          />
        )}

        {/* Measurement Tools */}
        {showMeasurementTools && (
          <MeasurementTools
            projectId={projectId}
            onMeasurementSave={(measurement) => {
              console.log("Measurement saved:", measurement);
            }}
          />
        )}
      </MapBase>

      {/* Control Panel */}
      {showControls && (
        <>
          {/* Toggle Button */}
          <Button
            size="sm"
            variant="secondary"
            className="absolute top-4 right-4 z-[1000]"
            onClick={() => setShowControlPanel(!showControlPanel)}
          >
            <Settings className="w-4 h-4 mr-1" />
            {showControlPanel ? "Hide" : "Controls"}
          </Button>

          {/* Control Panel */}
          {showControlPanel && (
            <Card className="absolute top-16 right-4 z-[1000] w-64">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Map Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Layer Visibility */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Layers</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        <span className="text-xs">Features</span>
                        <Badge variant="secondary" className="text-xs">
                          {dataCounts.features}
                        </Badge>
                      </div>
                      <Switch
                        checked={layerVisibility.features}
                        onCheckedChange={() => toggleLayer("features")}
                        size="sm"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Navigation className="w-3 h-3" />
                        <span className="text-xs">Routes</span>
                        <Badge variant="secondary" className="text-xs">
                          {dataCounts.routes}
                        </Badge>
                      </div>
                      <Switch
                        checked={layerVisibility.routes}
                        onCheckedChange={() => toggleLayer("routes")}
                        size="sm"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Ruler className="w-3 h-3" />
                        <span className="text-xs">Measurements</span>
                        <Badge variant="secondary" className="text-xs">
                          {dataCounts.measurements}
                        </Badge>
                      </div>
                      <Switch
                        checked={layerVisibility.measurements}
                        onCheckedChange={() => toggleLayer("measurements")}
                        size="sm"
                      />
                    </div>

                    {showGPSTracking && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3" />
                          <span className="text-xs">GPS Tracking</span>
                        </div>
                        <Switch
                          checked={layerVisibility.gpsTracking}
                          onCheckedChange={() => toggleLayer("gpsTracking")}
                          size="sm"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Map Settings */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Map Style</Label>
                  <Select
                    value={mapSettings.tileLayer}
                    onValueChange={(value: keyof typeof TILE_LAYERS) =>
                      setMapSettings(prev => ({ ...prev, tileLayer: value }))
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TILE_LAYERS).map(([key, layer]) => (
                        <SelectItem key={key} value={key}>
                          {layer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Map Options */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Options</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Show Scale</span>
                      <Switch
                        checked={mapSettings.showScale}
                        onCheckedChange={(checked) =>
                          setMapSettings(prev => ({ ...prev, showScale: checked }))
                        }
                        size="sm"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Cluster Markers</span>
                      <Switch
                        checked={mapSettings.clusteredMarkers}
                        onCheckedChange={(checked) =>
                          setMapSettings(prev => ({ ...prev, clusteredMarkers: checked }))
                        }
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Loading Indicator */}
      {loadingMessage && (
        <div className="absolute bottom-4 left-4 z-[1000]">
          <Badge variant="secondary" className="text-xs">
            {loadingMessage}
          </Badge>
        </div>
      )}

      {/* Map Info */}
      <div className="absolute bottom-4 right-4 z-[1000]">
        <Card className="p-2">
          <div className="text-xs space-y-1">
            <div className="font-medium">Project Map</div>
            <div className="text-muted-foreground">
              {dataCounts.features} features • {dataCounts.routes} routes
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default ProjectMap;