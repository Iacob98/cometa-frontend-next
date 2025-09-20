"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import {
  Map,
  MapPin,
  Navigation,
  Layers,
  Ruler,
  Globe,
  Settings,
  Download,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useProjects } from "@/hooks/use-projects";
import {
  useGeospatialFeatures,
  useGeoRoutes,
  useGeoLayers,
  useGeoMeasurements,
  useProjectGeospatialFeatures,
} from "@/hooks/use-geospatial";
import { useAuth } from "@/hooks/use-auth";
import type { UUID } from "@/types";

// Dynamic import to avoid SSR issues
const ProjectMap = dynamic(() => import("@/components/maps/project-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] bg-muted rounded-lg flex items-center justify-center">
      <div className="text-center">
        <Map className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    </div>
  ),
});

export default function GeospatialPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<UUID | undefined>();
  const [activeTab, setActiveTab] = useState("map");
  const { user } = useAuth();

  // Data queries
  const { data: projects } = useProjects({ page: 1, per_page: 100 });
  const { data: allFeatures } = useGeospatialFeatures();
  const { data: allRoutes } = useGeoRoutes();
  const { data: allLayers } = useGeoLayers();
  const { data: allMeasurements } = useGeoMeasurements();
  const { data: projectFeatures } = useProjectGeospatialFeatures(
    selectedProjectId || ""
  );

  const getStatsForProject = (projectId?: UUID) => {
    if (!projectId) {
      return {
        features: allFeatures?.total || 0,
        routes: allRoutes?.total || 0,
        layers: allLayers?.total || 0,
        measurements: allMeasurements?.total || 0,
      };
    }

    // In a real implementation, we'd have project-specific stats
    return {
      features: projectFeatures?.total || 0,
      routes: 0,
      layers: 0,
      measurements: 0,
    };
  };

  const stats = getStatsForProject(selectedProjectId);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Geospatial</h2>
          <p className="text-muted-foreground">
            Interactive maps and geospatial data management
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Import GIS Data
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
          <Button>
            <Settings className="mr-2 h-4 w-4" />
            Map Settings
          </Button>
        </div>
      </div>

      {/* Project Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project Selection</CardTitle>
          <CardDescription>
            Choose a project to view its geospatial data, or view all data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Select
                value={selectedProjectId || "all"}
                onValueChange={(value) =>
                  setSelectedProjectId(value === "all" ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects?.data?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary">
                <MapPin className="w-3 h-3 mr-1" />
                {stats.features} Features
              </Badge>
              <Badge variant="secondary">
                <Navigation className="w-3 h-3 mr-1" />
                {stats.routes} Routes
              </Badge>
              <Badge variant="secondary">
                <Layers className="w-3 h-3 mr-1" />
                {stats.layers} Layers
              </Badge>
              <Badge variant="secondary">
                <Ruler className="w-3 h-3 mr-1" />
                {stats.measurements} Measurements
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="map">
            <Map className="w-4 h-4 mr-2" />
            Interactive Map
          </TabsTrigger>
          <TabsTrigger value="features">
            <MapPin className="w-4 h-4 mr-2" />
            Features
          </TabsTrigger>
          <TabsTrigger value="routes">
            <Navigation className="w-4 h-4 mr-2" />
            Routes
          </TabsTrigger>
          <TabsTrigger value="layers">
            <Layers className="w-4 h-4 mr-2" />
            Layers
          </TabsTrigger>
          <TabsTrigger value="measurements">
            <Ruler className="w-4 h-4 mr-2" />
            Measurements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Map</CardTitle>
              <CardDescription>
                Interactive map with geospatial features, GPS tracking, and measurement tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedProjectId ? (
                <ProjectMap
                  projectId={selectedProjectId}
                  height="600px"
                  showControls={true}
                  showMeasurementTools={user?.role === "admin" || user?.role === "pm"}
                  showGPSTracking={true}
                  defaultCenter={[52.52, 13.405]} // Berlin as default
                  defaultZoom={13}
                />
              ) : (
                <div className="h-[600px] bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Globe className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Project Selected</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Select a project above to view its geospatial data on the map
                    </p>
                    <Button
                      onClick={() => {
                        if (projects?.data?.[0]) {
                          setSelectedProjectId(projects.data[0].id);
                        }
                      }}
                      disabled={!projects?.data?.length}
                    >
                      <Map className="w-4 h-4 mr-2" />
                      View First Project
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Geospatial Features</CardTitle>
              <CardDescription>
                Manage points, lines, and polygons associated with your projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search features..."
                      className="w-64"
                    />
                    <Select defaultValue="all">
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="point">Points</SelectItem>
                        <SelectItem value="line">Lines</SelectItem>
                        <SelectItem value="polygon">Polygons</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button>
                    <MapPin className="w-4 h-4 mr-2" />
                    Add Feature
                  </Button>
                </div>

                {/* Features will be displayed here */}
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="w-8 h-8 mx-auto mb-2" />
                  <p>No features found for the selected project</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="routes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Routes</CardTitle>
              <CardDescription>
                Planned and optimized routes for project work
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search routes..."
                      className="w-64"
                    />
                    <Select defaultValue="all">
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="planned">Planned</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button>
                    <Navigation className="w-4 h-4 mr-2" />
                    Create Route
                  </Button>
                </div>

                <div className="text-center py-8 text-muted-foreground">
                  <Navigation className="w-8 h-8 mx-auto mb-2" />
                  <p>No routes found for the selected project</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Map Layers</CardTitle>
              <CardDescription>
                Organize geospatial data into thematic layers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search layers..."
                      className="w-64"
                    />
                    <Select defaultValue="all">
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="base">Base</SelectItem>
                        <SelectItem value="overlay">Overlay</SelectItem>
                        <SelectItem value="annotation">Annotation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button>
                    <Layers className="w-4 h-4 mr-2" />
                    Create Layer
                  </Button>
                </div>

                <div className="text-center py-8 text-muted-foreground">
                  <Layers className="w-8 h-8 mx-auto mb-2" />
                  <p>No layers found for the selected project</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="measurements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Measurements</CardTitle>
              <CardDescription>
                Distance and area measurements taken on the map
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search measurements..."
                      className="w-64"
                    />
                    <Select defaultValue="all">
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="distance">Distance</SelectItem>
                        <SelectItem value="area">Area</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button>
                    <Ruler className="w-4 h-4 mr-2" />
                    New Measurement
                  </Button>
                </div>

                <div className="text-center py-8 text-muted-foreground">
                  <Ruler className="w-8 h-8 mx-auto mb-2" />
                  <p>No measurements found for the selected project</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}