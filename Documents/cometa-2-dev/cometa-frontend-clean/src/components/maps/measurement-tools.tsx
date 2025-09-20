"use client";

import React, { useState, useCallback, useRef } from "react";
import { Polyline, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Ruler, Square, MapPin, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateGeoMeasurement } from "@/hooks/use-geospatial";
import type { CreateGeoMeasurementRequest, UUID } from "@/types";

interface MeasurementPoint {
  id: string;
  lat: number;
  lng: number;
}

interface Measurement {
  id: string;
  type: "distance" | "area";
  points: MeasurementPoint[];
  value: number;
  unit: string;
  label?: string;
}

interface MeasurementToolsProps {
  projectId?: UUID;
  onMeasurementSave?: (measurement: Measurement) => void;
  className?: string;
}

// Calculate distance between two points using Haversine formula
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000; // Return distance in meters
};

// Calculate polygon area using shoelace formula
const calculatePolygonArea = (points: MeasurementPoint[]): number => {
  if (points.length < 3) return 0;

  let area = 0;
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const lat1 = points[i].lat * (Math.PI / 180);
    const lng1 = points[i].lng * (Math.PI / 180);
    const lat2 = points[j].lat * (Math.PI / 180);
    const lng2 = points[j].lng * (Math.PI / 180);

    area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  area = Math.abs(area) * 6378137 * 6378137 / 2; // Earth's radius squared
  return area; // Return area in square meters
};

// Format measurement value with appropriate units
const formatMeasurement = (value: number, type: "distance" | "area"): { value: string; unit: string } => {
  if (type === "distance") {
    if (value < 1000) {
      return { value: value.toFixed(1), unit: "m" };
    } else {
      return { value: (value / 1000).toFixed(2), unit: "km" };
    }
  } else {
    if (value < 10000) {
      return { value: value.toFixed(1), unit: "m²" };
    } else {
      return { value: (value / 10000).toFixed(2), unit: "ha" };
    }
  }
};

export function MeasurementTools({ projectId, onMeasurementSave, className }: MeasurementToolsProps) {
  const [measurementMode, setMeasurementMode] = useState<"distance" | "area" | null>(null);
  const [currentPoints, setCurrentPoints] = useState<MeasurementPoint[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const pointIdRef = useRef(0);

  const createGeoMeasurement = useCreateGeoMeasurement();

  // Handle map clicks for measurement
  useMapEvents({
    click: (e) => {
      if (!measurementMode) return;

      const newPoint: MeasurementPoint = {
        id: `point-${pointIdRef.current++}`,
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      };

      setCurrentPoints(prev => {
        const updated = [...prev, newPoint];

        // For distance measurement, limit to 2 points
        if (measurementMode === "distance" && updated.length === 2) {
          completeMeasurement(updated, "distance");
          return [];
        }

        return updated;
      });

      setIsDrawing(true);
    },
    dblclick: (e) => {
      if (measurementMode === "area" && currentPoints.length >= 3) {
        completeMeasurement(currentPoints, "area");
        setCurrentPoints([]);
        setIsDrawing(false);
      }
    },
  });

  const completeMeasurement = useCallback((points: MeasurementPoint[], type: "distance" | "area") => {
    let value = 0;

    if (type === "distance" && points.length >= 2) {
      // Calculate total distance for polyline
      for (let i = 0; i < points.length - 1; i++) {
        value += calculateDistance(
          points[i].lat,
          points[i].lng,
          points[i + 1].lat,
          points[i + 1].lng
        );
      }
    } else if (type === "area" && points.length >= 3) {
      value = calculatePolygonArea(points);
    }

    const formatted = formatMeasurement(value, type);
    const measurement: Measurement = {
      id: `measurement-${Date.now()}`,
      type,
      points: [...points],
      value,
      unit: formatted.unit,
      label: `${formatted.value} ${formatted.unit}`,
    };

    setMeasurements(prev => [...prev, measurement]);

    if (onMeasurementSave) {
      onMeasurementSave(measurement);
    }
  }, [onMeasurementSave]);

  const startDistanceMeasurement = () => {
    setMeasurementMode("distance");
    setCurrentPoints([]);
    setIsDrawing(false);
  };

  const startAreaMeasurement = () => {
    setMeasurementMode("area");
    setCurrentPoints([]);
    setIsDrawing(false);
  };

  const stopMeasurement = () => {
    setMeasurementMode(null);
    setCurrentPoints([]);
    setIsDrawing(false);
  };

  const clearMeasurements = () => {
    setMeasurements([]);
    setCurrentPoints([]);
    setIsDrawing(false);
  };

  const deleteMeasurement = (id: string) => {
    setMeasurements(prev => prev.filter(m => m.id !== id));
  };

  const saveMeasurementToServer = async (measurement: Measurement) => {
    if (!projectId) return;

    try {
      const geometry = measurement.type === "distance"
        ? {
            type: "LineString" as const,
            coordinates: measurement.points.map(p => [p.lng, p.lat]),
          }
        : {
            type: "Polygon" as const,
            coordinates: [measurement.points.map(p => [p.lng, p.lat])],
          };

      const request: CreateGeoMeasurementRequest = {
        project_id: projectId,
        measurement_type: measurement.type,
        geometry,
        value: measurement.value,
        unit: measurement.unit,
        description: measurement.label,
      };

      await createGeoMeasurement.mutateAsync(request);
    } catch (error) {
      console.error("Failed to save measurement:", error);
    }
  };

  const getCurrentMeasurementValue = () => {
    if (currentPoints.length < 2) return null;

    if (measurementMode === "distance") {
      let totalDistance = 0;
      for (let i = 0; i < currentPoints.length - 1; i++) {
        totalDistance += calculateDistance(
          currentPoints[i].lat,
          currentPoints[i].lng,
          currentPoints[i + 1].lat,
          currentPoints[i + 1].lng
        );
      }
      return formatMeasurement(totalDistance, "distance");
    } else if (measurementMode === "area" && currentPoints.length >= 3) {
      const area = calculatePolygonArea(currentPoints);
      return formatMeasurement(area, "area");
    }

    return null;
  };

  const currentValue = getCurrentMeasurementValue();

  return (
    <>
      {/* Measurement Controls */}
      <Card className={`absolute top-4 left-4 z-[1000] ${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Ruler className="w-4 h-4" />
            Measurement Tools
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={measurementMode === "distance" ? "default" : "outline"}
              onClick={startDistanceMeasurement}
            >
              <Ruler className="w-3 h-3 mr-1" />
              Distance
            </Button>
            <Button
              size="sm"
              variant={measurementMode === "area" ? "default" : "outline"}
              onClick={startAreaMeasurement}
            >
              <Square className="w-3 h-3 mr-1" />
              Area
            </Button>
          </div>

          {measurementMode && (
            <div className="space-y-2">
              <Badge variant="secondary" className="text-xs">
                {measurementMode === "distance"
                  ? "Click two points to measure distance"
                  : "Click points to draw area (double-click to finish)"}
              </Badge>

              {currentValue && (
                <Badge variant="default" className="text-xs">
                  {currentValue.value} {currentValue.unit}
                </Badge>
              )}

              <Button size="sm" variant="outline" onClick={stopMeasurement} className="w-full">
                Cancel
              </Button>
            </div>
          )}

          {measurements.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Measurements</span>
                <Button size="sm" variant="ghost" onClick={clearMeasurements}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              {measurements.map((measurement, index) => (
                <div key={measurement.id} className="flex items-center justify-between text-xs">
                  <span>
                    {index + 1}. {measurement.label}
                  </span>
                  <div className="flex gap-1">
                    {projectId && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => saveMeasurementToServer(measurement)}
                        disabled={createGeoMeasurement.isPending}
                      >
                        <Save className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMeasurement(measurement.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current measurement being drawn */}
      {currentPoints.length > 0 && (
        <>
          {/* Points */}
          {currentPoints.map((point) => (
            <Marker
              key={point.id}
              position={[point.lat, point.lng]}
              icon={L.divIcon({
                html: `<div style="
                  background-color: #ef4444;
                  width: 8px;
                  height: 8px;
                  border: 2px solid white;
                  border-radius: 50%;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                "></div>`,
                className: "measurement-point",
                iconSize: [12, 12],
                iconAnchor: [6, 6],
              })}
            />
          ))}

          {/* Line for distance or area perimeter */}
          {currentPoints.length > 1 && (
            <Polyline
              positions={currentPoints.map(p => [p.lat, p.lng])}
              color="#ef4444"
              weight={2}
              dashArray="5, 5"
              opacity={0.8}
            />
          )}

          {/* Area preview (close the polygon) */}
          {measurementMode === "area" && currentPoints.length >= 3 && (
            <Polyline
              positions={[
                currentPoints[currentPoints.length - 1],
                currentPoints[0],
              ].map(p => [p.lat, p.lng])}
              color="#ef4444"
              weight={2}
              dashArray="5, 5"
              opacity={0.5}
            />
          )}
        </>
      )}

      {/* Completed measurements */}
      {measurements.map((measurement) => (
        <React.Fragment key={measurement.id}>
          {/* Points */}
          {measurement.points.map((point) => (
            <Marker
              key={point.id}
              position={[point.lat, point.lng]}
              icon={L.divIcon({
                html: `<div style="
                  background-color: #3b82f6;
                  width: 6px;
                  height: 6px;
                  border: 2px solid white;
                  border-radius: 50%;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                "></div>`,
                className: "measurement-point-completed",
                iconSize: [10, 10],
                iconAnchor: [5, 5],
              })}
            />
          ))}

          {/* Line/Area */}
          <Polyline
            positions={measurement.points.map(p => [p.lat, p.lng])}
            color="#3b82f6"
            weight={2}
            opacity={0.8}
          >
            <Popup>
              <div className="space-y-1">
                <div className="font-semibold text-sm">
                  {measurement.type === "distance" ? "Distance" : "Area"} Measurement
                </div>
                <div className="text-sm">{measurement.label}</div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteMeasurement(measurement.id)}
                  >
                    Delete
                  </Button>
                  {projectId && (
                    <Button
                      size="sm"
                      onClick={() => saveMeasurementToServer(measurement)}
                      disabled={createGeoMeasurement.isPending}
                    >
                      Save
                    </Button>
                  )}
                </div>
              </div>
            </Popup>
          </Polyline>

          {/* Close area polygon */}
          {measurement.type === "area" && measurement.points.length >= 3 && (
            <Polyline
              positions={[
                measurement.points[measurement.points.length - 1],
                measurement.points[0],
              ].map(p => [p.lat, p.lng])}
              color="#3b82f6"
              weight={2}
              opacity={0.8}
            />
          )}
        </React.Fragment>
      ))}
    </>
  );
}

export default MeasurementTools;