"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import { MapPin, Navigation, Users } from "lucide-react";
import { useGPSTracking, useUpdateGPSLocation } from "@/hooks/use-geospatial";
import { useAuth } from "@/hooks/use-auth";
import type { UUID } from "@/types";

interface GPSTrackerProps {
  trackCurrentUser?: boolean;
  trackUsers?: UUID[];
  enableTracking?: boolean;
  showAccuracy?: boolean;
  onLocationUpdate?: (location: { latitude: number; longitude: number; accuracy?: number }) => void;
}

interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: string;
}

// GPS position marker with direction indicator
const createGPSIcon = (isCurrentUser: boolean = false, heading?: number) => {
  const color = isCurrentUser ? "#ef4444" : "#3b82f6";
  const size = isCurrentUser ? 16 : 12;

  let transform = "";
  if (heading !== undefined) {
    transform = `rotate(${heading}deg)`;
  }

  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        position: relative;
        transform: ${transform};
      ">
        ${heading !== undefined ? `
          <div style="
            position: absolute;
            top: -8px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 4px solid transparent;
            border-right: 4px solid transparent;
            border-bottom: 8px solid ${color};
          "></div>
        ` : ""}
      </div>
    `,
    className: "gps-marker",
    iconSize: [size + 6, size + 6],
    iconAnchor: [(size + 6) / 2, (size + 6) / 2],
  });
};

export function GPSTracker({
  trackCurrentUser = true,
  trackUsers = [],
  enableTracking = false,
  showAccuracy = true,
  onLocationUpdate,
}: GPSTrackerProps) {
  const { user } = useAuth();
  const [currentLocation, setCurrentLocation] = useState<GPSLocation | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | undefined>();

  const updateGPSLocation = useUpdateGPSLocation();

  // Track current user's location
  const { data: userGPSData } = useGPSTracking(user?.id);

  // Track other users' locations
  const trackedUsersData = trackUsers.map(userId =>
    useGPSTracking(userId)
  );

  // Start GPS tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation || !enableTracking) return;

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    const successCallback = (position: GeolocationPosition) => {
      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };

      setCurrentLocation(location);

      // Update heading if available
      if (position.coords.heading !== null && position.coords.heading !== undefined) {
        setHeading(position.coords.heading);
      }

      // Send location to server
      if (user?.id && enableTracking) {
        updateGPSLocation.mutate({
          userId: user.id,
          location,
        });
      }

      // Notify parent component
      if (onLocationUpdate) {
        onLocationUpdate(location);
      }
    };

    const errorCallback = (error: GeolocationPositionError) => {
      console.error("GPS tracking error:", error);
    };

    const id = navigator.geolocation.watchPosition(
      successCallback,
      errorCallback,
      options
    );

    setWatchId(id);
  }, [enableTracking, user?.id, updateGPSLocation, onLocationUpdate]);

  // Stop GPS tracking
  const stopTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  }, [watchId]);

  // Start/stop tracking based on enableTracking prop
  useEffect(() => {
    if (enableTracking && trackCurrentUser) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => stopTracking();
  }, [enableTracking, trackCurrentUser, startTracking, stopTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopTracking();
  }, [stopTracking]);

  return (
    <>
      {/* Current user's live location */}
      {currentLocation && trackCurrentUser && (
        <>
          <Marker
            position={[currentLocation.latitude, currentLocation.longitude]}
            icon={createGPSIcon(true, heading)}
          >
            <Popup>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-500" />
                  <span className="font-semibold">Your Location</span>
                </div>
                <div className="text-xs space-y-1">
                  <div>Lat: {currentLocation.latitude.toFixed(6)}</div>
                  <div>Lng: {currentLocation.longitude.toFixed(6)}</div>
                  {currentLocation.accuracy && (
                    <div>Accuracy: ±{Math.round(currentLocation.accuracy)}m</div>
                  )}
                  {heading !== undefined && (
                    <div className="flex items-center gap-1">
                      <Navigation className="w-3 h-3" />
                      Heading: {Math.round(heading)}°
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>

          {/* Accuracy circle */}
          {showAccuracy && currentLocation.accuracy && (
            <Circle
              center={[currentLocation.latitude, currentLocation.longitude]}
              radius={currentLocation.accuracy}
              color="#ef4444"
              fillOpacity={0.1}
              weight={1}
            />
          )}
        </>
      )}

      {/* Current user's server location (if different from live) */}
      {userGPSData?.data && trackCurrentUser && (
        <Marker
          position={[userGPSData.data.latitude, userGPSData.data.longitude]}
          icon={createGPSIcon(true)}
          opacity={currentLocation ? 0.5 : 1} // Fade if live location is available
        >
          <Popup>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-500" />
                <span className="font-semibold">Last Known Location</span>
              </div>
              <div className="text-xs space-y-1">
                <div>Lat: {userGPSData.data.latitude.toFixed(6)}</div>
                <div>Lng: {userGPSData.data.longitude.toFixed(6)}</div>
                {userGPSData.data.accuracy && (
                  <div>Accuracy: ±{Math.round(userGPSData.data.accuracy)}m</div>
                )}
                {userGPSData.data.timestamp && (
                  <div>Updated: {new Date(userGPSData.data.timestamp).toLocaleTimeString()}</div>
                )}
              </div>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Other tracked users */}
      {trackedUsersData.map((userData, index) => {
        if (!userData?.data) return null;

        const userId = trackUsers[index];
        return (
          <React.Fragment key={userId}>
            <Marker
              position={[userData.data.latitude, userData.data.longitude]}
              icon={createGPSIcon(false)}
            >
              <Popup>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="font-semibold">Team Member</span>
                  </div>
                  <div className="text-xs space-y-1">
                    <div>Lat: {userData.data.latitude.toFixed(6)}</div>
                    <div>Lng: {userData.data.longitude.toFixed(6)}</div>
                    {userData.data.accuracy && (
                      <div>Accuracy: ±{Math.round(userData.data.accuracy)}m</div>
                    )}
                    {userData.data.timestamp && (
                      <div>Updated: {new Date(userData.data.timestamp).toLocaleTimeString()}</div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>

            {/* Accuracy circle for tracked users */}
            {showAccuracy && userData.data.accuracy && (
              <Circle
                center={[userData.data.latitude, userData.data.longitude]}
                radius={userData.data.accuracy}
                color="#3b82f6"
                fillOpacity={0.1}
                weight={1}
              />
            )}
          </React.Fragment>
        );
      })}
    </>
  );
}

export default GPSTracker;