"use client";

import React, { useEffect, useMemo } from "react";
import { Marker, Popup, Polyline, Polygon, useMap } from "react-leaflet";
import L from "leaflet";
import type { GeospatialFeature, GeoPoint, GeoLineString, GeoPolygon } from "@/types";

interface FeatureLayerProps {
  features: GeospatialFeature[];
  onFeatureClick?: (feature: GeospatialFeature) => void;
  onFeatureEdit?: (feature: GeospatialFeature) => void;
  editable?: boolean;
  selectedFeatureId?: string;
}

// Custom marker icons for different entity types
const createCustomIcon = (entityType: string, isSelected: boolean = false) => {
  const color = isSelected ? "#ef4444" : getEntityColor(entityType);

  return L.divIcon({
    html: `<div style="
      background-color: ${color};
      width: 12px;
      height: 12px;
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    "></div>`,
    className: "custom-marker",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

const getEntityColor = (entityType: string): string => {
  switch (entityType) {
    case "project":
      return "#3b82f6"; // blue
    case "cabinet":
      return "#10b981"; // green
    case "segment":
      return "#f59e0b"; // orange
    case "cut":
      return "#ef4444"; // red
    case "work_entry":
      return "#8b5cf6"; // purple
    case "house":
      return "#06b6d4"; // cyan
    case "measurement":
      return "#84cc16"; // lime
    default:
      return "#6b7280"; // gray
  }
};

export function FeatureLayer({
  features,
  onFeatureClick,
  onFeatureEdit,
  editable = false,
  selectedFeatureId,
}: FeatureLayerProps) {
  const map = useMap();

  // Group features by geometry type for better performance
  const groupedFeatures = useMemo(() => {
    return features.reduce((acc, feature) => {
      const type = feature.geometry.type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(feature);
      return acc;
    }, {} as Record<string, GeospatialFeature[]>);
  }, [features]);

  // Auto-fit map to features bounds
  useEffect(() => {
    if (features.length > 0) {
      const bounds = L.latLngBounds([]);

      features.forEach((feature) => {
        const { geometry } = feature;

        if (geometry.type === "Point") {
          const point = geometry as GeoPoint;
          bounds.extend([point.coordinates[1], point.coordinates[0]]);
        } else if (geometry.type === "LineString") {
          const line = geometry as GeoLineString;
          line.coordinates.forEach(([lng, lat]) => {
            bounds.extend([lat, lng]);
          });
        } else if (geometry.type === "Polygon") {
          const polygon = geometry as GeoPolygon;
          polygon.coordinates[0].forEach(([lng, lat]) => {
            bounds.extend([lat, lng]);
          });
        }
      });

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [features, map]);

  const handleFeatureClick = (feature: GeospatialFeature) => {
    if (onFeatureClick) {
      onFeatureClick(feature);
    }
  };

  const renderFeaturePopup = (feature: GeospatialFeature) => (
    <Popup>
      <div className="space-y-2">
        <div className="font-semibold text-sm">
          {feature.entity_type.charAt(0).toUpperCase() + feature.entity_type.slice(1)}
        </div>
        {feature.properties && (
          <div className="text-xs space-y-1">
            {Object.entries(feature.properties).map(([key, value]) => (
              <div key={key}>
                <span className="font-medium">{key}:</span> {String(value)}
              </div>
            ))}
          </div>
        )}
        {editable && onFeatureEdit && (
          <button
            onClick={() => onFeatureEdit(feature)}
            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
          >
            Edit
          </button>
        )}
      </div>
    </Popup>
  );

  return (
    <>
      {/* Render Point features as Markers */}
      {groupedFeatures.Point?.map((feature) => {
        const point = feature.geometry as GeoPoint;
        const [lng, lat] = point.coordinates;
        const isSelected = feature.id === selectedFeatureId;

        return (
          <Marker
            key={feature.id}
            position={[lat, lng]}
            icon={createCustomIcon(feature.entity_type, isSelected)}
            eventHandlers={{
              click: () => handleFeatureClick(feature),
            }}
          >
            {renderFeaturePopup(feature)}
          </Marker>
        );
      })}

      {/* Render LineString features as Polylines */}
      {groupedFeatures.LineString?.map((feature) => {
        const line = feature.geometry as GeoLineString;
        const positions = line.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
        const isSelected = feature.id === selectedFeatureId;

        return (
          <Polyline
            key={feature.id}
            positions={positions}
            color={getEntityColor(feature.entity_type)}
            weight={isSelected ? 5 : 3}
            opacity={0.8}
            eventHandlers={{
              click: () => handleFeatureClick(feature),
            }}
          >
            {renderFeaturePopup(feature)}
          </Polyline>
        );
      })}

      {/* Render Polygon features as Polygons */}
      {groupedFeatures.Polygon?.map((feature) => {
        const polygon = feature.geometry as GeoPolygon;
        const positions = polygon.coordinates[0].map(([lng, lat]) => [lat, lng] as [number, number]);
        const isSelected = feature.id === selectedFeatureId;

        return (
          <Polygon
            key={feature.id}
            positions={positions}
            color={getEntityColor(feature.entity_type)}
            weight={isSelected ? 3 : 2}
            fillOpacity={0.3}
            eventHandlers={{
              click: () => handleFeatureClick(feature),
            }}
          >
            {renderFeaturePopup(feature)}
          </Polygon>
        );
      })}
    </>
  );
}

export default FeatureLayer;