"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter, MapPin, Calendar, User, Eye, CheckCircle, Clock, Building2, Camera, Ruler } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useWorkEntries, usePendingApprovals, useApproveWorkEntry } from "@/hooks/use-work-entries";
import { useAuth, usePermissions } from "@/hooks/use-auth";
import type { StageCode, WorkEntryFilters } from "@/types";

export default function WorkEntriesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { canApproveWork, canManageWork } = usePermissions();
  const approveWorkEntry = useApproveWorkEntry();

  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<StageCode | "all">("all");
  const [approvalFilter, setApprovalFilter] = useState<"all" | "approved" | "pending">("all");

  const filters: WorkEntryFilters = {
    stage_code: stageFilter === "all" ? undefined : stageFilter,
    approved: approvalFilter === "all" ? undefined : approvalFilter === "approved",
    page: 1,
    per_page: 20,
  };

  const { data: workEntriesResponse, isLoading, error } = useWorkEntries(filters);
  const { data: pendingApprovalsResponse } = usePendingApprovals();

  const workEntries = workEntriesResponse?.items || [];
  const pendingApprovals = pendingApprovalsResponse?.items || [];

  const handleApproveWorkEntry = async (workEntryId: string) => {
    try {
      await approveWorkEntry.mutateAsync(workEntryId);
    } catch (error) {
      console.error("Failed to approve work entry:", error);
    }
  };

  const getStageLabel = (stageCode: StageCode) => {
    const stageLabels: Record<StageCode, string> = {
      stage_1_marking: "Marking",
      stage_2_excavation: "Excavation",
      stage_3_conduit: "Conduit Installation",
      stage_4_cable_pulling: "Cable Pulling",
      stage_5_closure: "Closure",
      stage_6_testing: "Testing",
      stage_7_backfill: "Backfilling",
      stage_8_restoration: "Surface Restoration",
      stage_9_documentation: "Documentation",
      stage_10_quality_check: "Quality Check",
    };
    return stageLabels[stageCode] || stageCode;
  };

  const getStageBadgeVariant = (stageCode: StageCode) => {
    if (stageCode.includes("marking") || stageCode.includes("excavation")) return "secondary";
    if (stageCode.includes("cable") || stageCode.includes("conduit")) return "default";
    if (stageCode.includes("testing") || stageCode.includes("quality")) return "outline";
    return "secondary";
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Work Entries</h1>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              Failed to load work entries. Please try again later.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Work Entries</h1>
          <p className="text-muted-foreground">
            Track and manage field work progress across all projects
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/work-entries/new")}>
          <Plus className="mr-2 h-4 w-4" />
          New Work Entry
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Work Entries</TabsTrigger>
          {canApproveWork && (
            <TabsTrigger value="pending">
              Pending Approval ({pendingApprovals.length})
            </TabsTrigger>
          )}
          <TabsTrigger value="my-work">My Work</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Work Entries</CardTitle>
              <CardDescription>
                Search and filter work entries by various criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by project, notes, or worker..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select value={stageFilter} onValueChange={(value: StageCode | "all") => setStageFilter(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    <SelectItem value="stage_1_marking">Marking</SelectItem>
                    <SelectItem value="stage_2_excavation">Excavation</SelectItem>
                    <SelectItem value="stage_3_conduit">Conduit Installation</SelectItem>
                    <SelectItem value="stage_4_cable_pulling">Cable Pulling</SelectItem>
                    <SelectItem value="stage_5_closure">Closure</SelectItem>
                    <SelectItem value="stage_6_testing">Testing</SelectItem>
                    <SelectItem value="stage_7_backfill">Backfilling</SelectItem>
                    <SelectItem value="stage_8_restoration">Surface Restoration</SelectItem>
                    <SelectItem value="stage_9_documentation">Documentation</SelectItem>
                    <SelectItem value="stage_10_quality_check">Quality Check</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={approvalFilter} onValueChange={(value: "all" | "approved" | "pending") => setApprovalFilter(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by approval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending Approval</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Work Entries Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Work Entries ({workEntriesResponse?.total || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex space-x-4">
                      <div className="h-4 bg-muted animate-pulse rounded flex-1" />
                      <div className="h-4 bg-muted animate-pulse rounded w-20" />
                      <div className="h-4 bg-muted animate-pulse rounded w-16" />
                    </div>
                  ))}
                </div>
              ) : workEntries.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold">No work entries found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {searchQuery || stageFilter !== "all" || approvalFilter !== "all"
                      ? "No work entries match your current filters."
                      : "Get started by creating your first work entry."}
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => router.push("/dashboard/work-entries/new")}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Work Entry
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Worker</TableHead>
                      <TableHead>Stage & Progress</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Photos</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {new Date(entry.date).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span>{entry.user?.full_name || "Unknown"}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant={getStageBadgeVariant(entry.stage_code)}>
                              {getStageLabel(entry.stage_code)}
                            </Badge>
                            <div className="text-sm text-muted-foreground flex items-center space-x-1">
                              <Ruler className="h-3 w-3" />
                              <span>{entry.meters_done_m}m</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            Project {entry.project_id}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm flex items-center space-x-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span>
                              {entry.cut_id ? `Cut ${entry.cut_id}` :
                               entry.cabinet_id ? `Cabinet ${entry.cabinet_id}` : "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {entry.approved_at ? (
                            <div className="flex items-center space-x-1 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm">Approved</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1 text-amber-600">
                              <Clock className="h-4 w-4" />
                              <span className="text-sm">Pending</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Camera className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{entry.photos?.length || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <Filter className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => router.push(`/dashboard/work-entries/${entry.id}`)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              {canApproveWork && !entry.approved_at && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleApproveWorkEntry(entry.id)}
                                    disabled={approveWorkEntry.isPending}
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Approve Entry
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {canApproveWork && (
          <TabsContent value="pending" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Pending Approvals ({pendingApprovals.length})
                </CardTitle>
                <CardDescription>
                  Work entries waiting for your approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingApprovals.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-semibold">No pending approvals</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      All work entries have been approved.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingApprovals.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="space-y-1">
                          <div className="font-medium">
                            {getStageLabel(entry.stage_code)} - {entry.meters_done_m}m
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {entry.user?.full_name} • {new Date(entry.date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/work-entries/${entry.id}`)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApproveWorkEntry(entry.id)}
                            disabled={approveWorkEntry.isPending}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="my-work" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Work Entries</CardTitle>
              <CardDescription>
                Work entries you have created
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                My work entries view will be implemented based on current user context.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}