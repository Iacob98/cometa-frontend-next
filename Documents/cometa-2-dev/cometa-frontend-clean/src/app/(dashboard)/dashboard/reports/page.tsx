"use client";

import { useState } from "react";
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
  Filter
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

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedProject, setSelectedProject] = useState("all");

  // Mock data for demonstration
  const reportCards = [
    {
      title: "Project Progress",
      description: "Overall project completion status",
      icon: Building2,
      value: "73%",
      trend: "+5%",
      trendUp: true,
    },
    {
      title: "Active Teams",
      description: "Currently working teams",
      icon: Users,
      value: "12",
      trend: "+2",
      trendUp: true,
    },
    {
      title: "Work Entries",
      description: "Total work entries this month",
      icon: Activity,
      value: "248",
      trend: "+18",
      trendUp: true,
    },
    {
      title: "Budget Utilization",
      description: "Current budget usage",
      icon: DollarSign,
      value: "€127,350",
      trend: "+12%",
      trendUp: true,
    },
  ];

  const availableReports = [
    {
      id: "project-summary",
      name: "Project Summary Report",
      description: "Comprehensive overview of all projects",
      category: "Project",
      format: ["PDF", "Excel"],
      lastGenerated: "2 hours ago",
    },
    {
      id: "team-performance",
      name: "Team Performance Report",
      description: "Team productivity and work quality metrics",
      category: "Team",
      format: ["PDF", "Excel"],
      lastGenerated: "1 day ago",
    },
    {
      id: "financial-summary",
      name: "Financial Summary",
      description: "Budget, costs, and financial tracking",
      category: "Financial",
      format: ["PDF", "Excel"],
      lastGenerated: "3 hours ago",
    },
    {
      id: "materials-usage",
      name: "Materials Usage Report",
      description: "Material consumption and inventory status",
      category: "Materials",
      format: ["PDF", "Excel"],
      lastGenerated: "5 hours ago",
    },
    {
      id: "work-progress",
      name: "Work Progress Report",
      description: "Detailed work entries and progress tracking",
      category: "Progress",
      format: ["PDF", "Excel"],
      lastGenerated: "1 hour ago",
    },
    {
      id: "equipment-usage",
      name: "Equipment Usage Report",
      description: "Equipment allocation and utilization",
      category: "Equipment",
      format: ["PDF", "Excel"],
      lastGenerated: "4 hours ago",
    },
  ];

  const handleGenerateReport = (reportId: string, format: string) => {
    // Mock report generation
    console.log(`Generating report ${reportId} in ${format} format`);
    // In real implementation, this would trigger report generation
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Project: "bg-blue-100 text-blue-800",
      Team: "bg-green-100 text-green-800",
      Financial: "bg-yellow-100 text-yellow-800",
      Materials: "bg-purple-100 text-purple-800",
      Progress: "bg-indigo-100 text-indigo-800",
      Equipment: "bg-red-100 text-red-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate and download project reports and analytics
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
              <SelectItem value="active">Active Projects</SelectItem>
              <SelectItem value="completed">Completed Projects</SelectItem>
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
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp
                    className={`mr-1 h-3 w-3 ${
                      card.trendUp ? "text-green-600" : "text-red-600"
                    }`}
                  />
                  <span className={card.trendUp ? "text-green-600" : "text-red-600"}>
                    {card.trend}
                  </span>
                  <span className="ml-1">from last period</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Available Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Available Reports</span>
          </CardTitle>
          <CardDescription>
            Generate and download various project reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
            {availableReports.map((report) => (
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
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {report.description}
                    </p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="mr-1 h-3 w-3" />
                      Last generated: {report.lastGenerated}
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
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Quick Actions</span>
          </CardTitle>
          <CardDescription>
            Common reporting tasks and analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Activity className="h-6 w-6" />
              <span className="text-sm">Daily Progress</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Users className="h-6 w-6" />
              <span className="text-sm">Team Summary</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <DollarSign className="h-6 w-6" />
              <span className="text-sm">Cost Analysis</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <MapPin className="h-6 w-6" />
              <span className="text-sm">Site Reports</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}