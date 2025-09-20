"use client";

import React, { ReactNode, useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  iconUrl: "/leaflet/marker-icon.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

interface MapBaseProps {
  center?: [number, number];
  zoom?: number;
  className?: string;
  children?: ReactNode;
  onMapReady?: (map: L.Map) => void;
  height?: string;
  width?: string;
}

// Component to get map instance and pass it to parent
function MapInstanceProvider({ onMapReady }: { onMapReady?: (map: L.Map) => void }) {
  const map = useMap();

  useEffect(() => {
    if (onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);

  return null;
}

export function MapBase({
  center = [52.52, 13.405], // Default to Berlin
  zoom = 13,
  className,
  children,
  onMapReady,
  height = "400px",
  width = "100%",
}: MapBaseProps) {
  const mapRef = useRef<L.Map | null>(null);

  return (
    <div
      className={cn("relative overflow-hidden rounded-lg border", className)}
      style={{ height, width }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {onMapReady && <MapInstanceProvider onMapReady={onMapReady} />}
        {children}
      </MapContainer>
    </div>
  );
}

export default MapBase;