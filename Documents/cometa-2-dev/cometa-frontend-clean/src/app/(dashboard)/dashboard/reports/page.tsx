"use client";

import { useState, useMemo } from "react";
import {
  BarChart3,
  FileText,
  Download,
  Calendar,
  Users,
  Activity,
  DollarSign,
  TrendingUp,
  Building2,
  Clock,
  MapPin,
  Filter,
  Package,
  Truck,
  Settings,
  AlertTriangle,
  CheckCircle,
  TrendingDown
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';

// Import hooks for real data
import { useProjects } from "@/hooks/use-projects";
import { useWorkEntries } from "@/hooks/use-work-entries";
import { useCrews } from "@/hooks/use-crews";
import { useFinancialSummary } from "@/hooks/use-financial";
import { useMaterials } from "@/hooks/use-materials";
import { useEquipment } from "@/hooks/use-equipment";
import { useAllocations } from "@/hooks/use-allocations";
import { useOrders } from "@/hooks/use-materials";

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedProject, setSelectedProject] = useState("all");

  // Fetch real data from hooks
  const { data: projectsResponse, isLoading: projectsLoading } = useProjects({ page: 1, per_page: 1000 });
  const { data: workEntriesResponse, isLoading: workEntriesLoading } = useWorkEntries({ page: 1, per_page: 1000 });
  const { data: crewsResponse, isLoading: crewsLoading } = useCrews({ page: 1, per_page: 1000 });
  const { data: financialResponse, isLoading: financialLoading } = useFinancialSummary();
  const { data: materialsResponse, isLoading: materialsLoading } = useMaterials({ page: 1, per_page: 1000 });
  const { data: equipmentResponse, isLoading: equipmentLoading } = useEquipment({ per_page: 1000 });
  const { data: allocationsResponse, isLoading: allocationsLoading } = useAllocations({ page: 1, per_page: 1000 });
  const { data: ordersResponse, isLoading: ordersLoading } = useOrders({ page: 1, per_page: 1000 });

  // Extract data arrays
  const projects = projectsResponse?.items || [];
  const workEntries = workEntriesResponse?.items || [];
  const crews = crewsResponse?.items || [];
  const materials = materialsResponse?.items || [];
  const equipment = equipmentResponse?.items || [];
  const allocations = allocationsResponse?.items || [];
  const orders = ordersResponse?.items || [];

  // Calculate real metrics
  const reportMetrics = useMemo(() => {
    // Project Progress
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const totalProjects = projects.length;
    const projectProgress = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;

    // Active Teams/Crews
    const activeCrews = crews.filter(c => c.status === 'active').length;

    // Work Entries (current month)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyWorkEntries = workEntries.filter(entry => {
      if (!entry.created_at) return false;
      const entryDate = new Date(entry.created_at);
      return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
    }).length;

    // Budget/Financial data
    const totalBudget = projects.reduce((sum, project) => sum + (project.budget || 0), 0);
    const totalSpent = financialResponse?.summary?.total_expenses || 0;

    return {
      projectProgress,
      activeCrews,
      monthlyWorkEntries,
      totalBudget,
      totalSpent,
      budgetUtilization: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0
    };
  }, [projects, workEntries, crews, financialResponse]);

  // Real report cards based on actual data
  const reportCards = [
    {
      title: "Project Progress",
      description: "Overall project completion status",
      icon: Building2,
      value: `${reportMetrics.projectProgress}%`,
      trend: `${projects.filter(p => p.status === 'completed').length}/${projects.length}`,
      trendUp: reportMetrics.projectProgress > 50,
    },
    {
      title: "Active Teams",
      description: "Currently working crews",
      icon: Users,
      value: reportMetrics.activeCrews.toString(),
      trend: `${crews.length} total`,
      trendUp: reportMetrics.activeCrews > 0,
    },
    {
      title: "Work Entries",
      description: "Total work entries this month",
      icon: Activity,
      value: reportMetrics.monthlyWorkEntries.toString(),
      trend: `${workEntries.length} total`,
      trendUp: reportMetrics.monthlyWorkEntries > 0,
    },
    {
      title: "Budget Utilization",
      description: "Current budget usage",
      icon: DollarSign,
      value: new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(reportMetrics.totalSpent),
      trend: `${reportMetrics.budgetUtilization}% used`,
      trendUp: reportMetrics.budgetUtilization < 80,
    },
  ];

  // Dynamic report generation based on real data availability
  const availableReports = [
    {
      id: "project-summary",
      name: "Project Summary Report",
      description: `Comprehensive overview of ${projects.length} projects`,
      category: "Project",
      format: ["PDF", "Excel"],
      dataCount: projects.length,
      enabled: projects.length > 0,
    },
    {
      id: "team-performance",
      name: "Team Performance Report",
      description: `Performance metrics for ${crews.length} teams`,
      category: "Team",
      format: ["PDF", "Excel"],
      dataCount: crews.length,
      enabled: crews.length > 0,
    },
    {
      id: "financial-summary",
      name: "Financial Summary",
      description: "Budget, costs, and financial tracking",
      category: "Financial",
      format: ["PDF", "Excel"],
      dataCount: projects.filter(p => p.budget).length,
      enabled: projects.some(p => p.budget),
    },
    {
      id: "materials-usage",
      name: "Materials Usage Report",
      description: `Material consumption for ${materials.length} items`,
      category: "Materials",
      format: ["PDF", "Excel"],
      dataCount: materials.length,
      enabled: materials.length > 0,
    },
    {
      id: "work-progress",
      name: "Work Progress Report",
      description: `Analysis of ${workEntries.length} work entries`,
      category: "Progress",
      format: ["PDF", "Excel"],
      dataCount: workEntries.length,
      enabled: workEntries.length > 0,
    },
    {
      id: "equipment-usage",
      name: "Equipment Usage Report",
      description: `Utilization of ${equipment.length} equipment items`,
      category: "Equipment",
      format: ["PDF", "Excel"],
      dataCount: equipment.length,
      enabled: equipment.length > 0,
    },
    {
      id: "material-orders",
      name: "Material Orders Report",
      description: `Status of ${orders.length} purchase orders`,
      category: "Orders",
      format: ["PDF", "Excel"],
      dataCount: orders.length,
      enabled: orders.length > 0,
    },
    {
      id: "allocations-summary",
      name: "Resource Allocations Report",
      description: `Overview of ${allocations.length} resource allocations`,
      category: "Allocations",
      format: ["PDF", "Excel"],
      dataCount: allocations.length,
      enabled: allocations.length > 0,
    },
  ];

  const handleGenerateReport = async (reportId: string, format: string) => {
    try {
      // Real report generation API call
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId,
          format,
          period: selectedPeriod,
          project: selectedProject,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportId}-${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Project: "bg-blue-100 text-blue-800",
      Team: "bg-green-100 text-green-800",
      Financial: "bg-yellow-100 text-yellow-800",
      Materials: "bg-purple-100 text-purple-800",
      Progress: "bg-indigo-100 text-indigo-800",
      Equipment: "bg-red-100 text-red-800",
      Orders: "bg-orange-100 text-orange-800",
      Allocations: "bg-teal-100 text-teal-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  // Loading state
  const isLoading = projectsLoading || workEntriesLoading || crewsLoading ||
                   financialLoading || materialsLoading || equipmentLoading ||
                   allocationsLoading || ordersLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground">Loading reports data...</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-8 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Real-time data insights and comprehensive project reports
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {reportCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  {card.trendUp ? (
                    <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3 text-red-600" />
                  )}
                  <span className={card.trendUp ? "text-green-600" : "text-red-600"}>
                    {card.trend}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Analytics Dashboard */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Project Status Distribution</CardTitle>
            <CardDescription>Current status of all projects</CardDescription>
          </CardHeader>
          <CardContent>
            <ProjectStatusChart projects={projects} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Work Activity Trends</CardTitle>
            <CardDescription>Work entries over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <WorkActivityChart workEntries={workEntries} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Material Usage Overview</CardTitle>
            <CardDescription>Current inventory and allocation status</CardDescription>
          </CardHeader>
          <CardContent>
            <MaterialUsageChart materials={materials} allocations={allocations} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget Utilization</CardTitle>
            <CardDescription>Project budget vs actual spending</CardDescription>
          </CardHeader>
          <CardContent>
            <BudgetChart projects={projects} financialData={financialResponse} />
          </CardContent>
        </Card>
      </div>

      {/* Available Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Available Reports</span>
          </CardTitle>
          <CardDescription>
            Generate and download comprehensive project reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
            {availableReports.filter(report => report.enabled).map((report) => (
              <Card key={report.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">{report.name}</h3>
                      <Badge
                        variant="secondary"
                        className={getCategoryColor(report.category)}
                      >
                        {report.category}
                      </Badge>
                      <Badge variant="outline">
                        {report.dataCount} items
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {report.description}
                    </p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <CheckCircle className="mr-1 h-3 w-3 text-green-600" />
                      Data available: {report.dataCount} records
                    </div>
                  </div>
                  <div className="flex flex-col space-y-1">
                    {report.format.map((format) => (
                      <Button
                        key={format}
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateReport(report.id, format)}
                        className="min-w-20"
                      >
                        <Download className="mr-1 h-3 w-3" />
                        {format}
                      </Button>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {availableReports.filter(report => !report.enabled).length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                Reports with no data available:
              </h4>
              <div className="grid gap-2 md:grid-cols-2">
                {availableReports.filter(report => !report.enabled).map((report) => (
                  <div key={report.id} className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{report.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Quick Analysis</span>
          </CardTitle>
          <CardDescription>
            Instant insights from current data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-6 w-6 text-blue-600" />
                <div>
                  <div className="text-lg font-semibold">{workEntries.length}</div>
                  <div className="text-sm text-muted-foreground">Total Work Entries</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-6 w-6 text-green-600" />
                <div>
                  <div className="text-lg font-semibold">{crews.length}</div>
                  <div className="text-sm text-muted-foreground">Active Teams</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="h-6 w-6 text-purple-600" />
                <div>
                  <div className="text-lg font-semibold">{materials.length}</div>
                  <div className="text-sm text-muted-foreground">Material Types</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <Settings className="h-6 w-6 text-red-600" />
                <div>
                  <div className="text-lg font-semibold">{equipment.length}</div>
                  <div className="text-sm text-muted-foreground">Equipment Items</div>
                </div>
              </div>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Chart Components
const ProjectStatusChart = ({ projects }: { projects: any[] }) => {
  const statusData = projects.reduce((acc, project) => {
    const status = project.status || 'unknown';
    const existing = acc.find(item => item.status === status);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ status: status.charAt(0).toUpperCase() + status.slice(1), count: 1 });
    }
    return acc;
  }, [] as Array<{ status: string; count: number }>);

  const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={statusData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ status, count }) => `${status}: ${count}`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="count"
        >
          {statusData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
};

const WorkActivityChart = ({ workEntries }: { workEntries: any[] }) => {
  // Group work entries by day for the last 30 days
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return {
      date: date.toISOString().split('T')[0],
      day: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: 0
    };
  }).reverse();

  workEntries.forEach(entry => {
    if (entry.created_at) {
      const entryDate = new Date(entry.created_at).toISOString().split('T')[0];
      const dayData = last30Days.find(d => d.date === entryDate);
      if (dayData) {
        dayData.count += 1;
      }
    }
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={last30Days}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="day" />
        <YAxis />
        <Tooltip />
        <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

const MaterialUsageChart = ({ materials, allocations }: { materials: any[]; allocations: any[] }) => {
  const usageData = materials.map(material => {
    const allocated = allocations
      .filter(alloc => alloc.material?.id === material.id)
      .reduce((sum, alloc) => sum + (alloc.allocated_qty || 0), 0);

    return {
      name: material.name.length > 15 ? material.name.substring(0, 15) + '...' : material.name,
      stock: material.current_stock_qty || 0,
      allocated: allocated
    };
  }).slice(0, 8); // Show top 8 materials

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={usageData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="stock" fill="#22c55e" name="In Stock" />
        <Bar dataKey="allocated" fill="#3b82f6" name="Allocated" />
      </BarChart>
    </ResponsiveContainer>
  );
};

const BudgetChart = ({ projects, financialData }: { projects: any[]; financialData: any }) => {
  const budgetData = projects
    .filter(p => p.budget && p.budget > 0)
    .map(project => ({
      name: project.name.length > 20 ? project.name.substring(0, 20) + '...' : project.name,
      budget: project.budget,
      spent: 0 // Would need to calculate actual spending per project
    }))
    .slice(0, 6); // Show top 6 projects

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={budgetData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip formatter={(value: any) => [`€${value.toLocaleString()}`, '']} />
        <Bar dataKey="budget" fill="#3b82f6" name="Budget" />
        <Bar dataKey="spent" fill="#ef4444" name="Spent" />
      </BarChart>
    </ResponsiveContainer>
  );
};