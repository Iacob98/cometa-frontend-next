"use client"

import * as React from "react"
import { useState } from "react"
import { format, isToday, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from "date-fns"
import { Calendar as CalendarIcon, Plus, Filter, Users, Briefcase, Clock, MapPin } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/hooks/use-auth"

import type {
  WorkEntry,
  Project,
  HouseAppointment,
  MaintenanceRecord,
  PaymentSchedule,
  WorkEntryFilters,
  UUID
} from "@/types"

// Calendar event types
type CalendarEventType = 'work_entry' | 'project_deadline' | 'appointment' | 'maintenance' | 'payment_due'

interface CalendarEvent {
  id: string
  title: string
  date: Date
  type: CalendarEventType
  description?: string
  project?: Project
  workEntry?: WorkEntry
  appointment?: HouseAppointment
  maintenance?: MaintenanceRecord
  payment?: PaymentSchedule
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
}

interface CalendarFilters {
  projects: UUID[]
  eventTypes: CalendarEventType[]
  crews: UUID[]
  dateRange: 'week' | 'month' | 'quarter'
}

export default function CalendarPage() {
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')
  const [filters, setFilters] = useState<CalendarFilters>({
    projects: [],
    eventTypes: ['work_entry', 'project_deadline', 'appointment', 'maintenance', 'payment_due'],
    crews: [],
    dateRange: 'month'
  })
  const [showFilters, setShowFilters] = useState(false)

  // Fetch calendar events from multiple sources
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendar-events', filters, selectedDate],
    queryFn: async (): Promise<CalendarEvent[]> => {
      const currentDate = selectedDate || new Date()
      const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd')
      const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd')

      const allEvents: CalendarEvent[] = []

      try {
        // Fetch work entries
        if (filters.eventTypes.includes('work_entry')) {
          const workEntriesResponse = await fetch(`/api/work-entries?date_from=${startDate}&date_to=${endDate}&page=1&per_page=100`)
          if (workEntriesResponse.ok) {
            const workEntriesData = await workEntriesResponse.json()
            const workEntryEvents: CalendarEvent[] = workEntriesData.items?.map((entry: WorkEntry) => ({
              id: `work_${entry.id}`,
              title: `${entry.stage_code.replace('stage_', 'Stage ').replace('_', ' ')} - ${entry.meters_done_m}m`,
              date: parseISO(entry.date),
              type: 'work_entry' as CalendarEventType,
              description: `${entry.notes || 'Work entry'} - ${entry.user?.first_name} ${entry.user?.last_name}`,
              workEntry: entry,
              priority: entry.approved_by ? 'low' : 'medium',
              status: entry.approved_by ? 'completed' : 'pending'
            })) || []
            allEvents.push(...workEntryEvents)
          }
        }

        // Fetch project deadlines
        if (filters.eventTypes.includes('project_deadline')) {
          const projectsResponse = await fetch('/api/projects?page=1&per_page=100')
          if (projectsResponse.ok) {
            const projectsData = await projectsResponse.json()
            const projectDeadlines: CalendarEvent[] = projectsData.projects?.filter((project: Project) =>
              project.end_date_plan &&
              parseISO(project.end_date_plan) >= parseISO(startDate) &&
              parseISO(project.end_date_plan) <= parseISO(endDate)
            ).map((project: Project) => ({
              id: `project_${project.id}`,
              title: `${project.name} Deadline`,
              date: parseISO(project.end_date_plan!),
              type: 'project_deadline' as CalendarEventType,
              description: `Project completion deadline - ${project.customer}`,
              project,
              priority: project.status === 'active' ? 'high' : 'medium',
              status: project.status === 'closed' ? 'completed' : 'pending'
            })) || []
            allEvents.push(...projectDeadlines)
          }
        }

        // Add mock events for other types (since these APIs might not exist yet)
        if (filters.eventTypes.includes('appointment')) {
          allEvents.push({
            id: 'appointment_1',
            title: 'House Connection - Schmidt',
            date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            type: 'appointment',
            description: 'Customer: Schmidt, 14:00-16:00',
            priority: 'medium',
            status: 'pending'
          })
        }

        if (filters.eventTypes.includes('maintenance')) {
          allEvents.push({
            id: 'maintenance_1',
            title: 'Equipment Maintenance',
            date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            type: 'maintenance',
            description: 'Excavator service due',
            priority: 'medium',
            status: 'pending'
          })
        }

        if (filters.eventTypes.includes('payment_due')) {
          allEvents.push({
            id: 'payment_1',
            title: 'Invoice Payment Due',
            date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            type: 'payment_due',
            description: 'Project Alpha invoice payment',
            priority: 'high',
            status: 'pending'
          })
        }

      } catch (error) {
        console.error('Error fetching calendar events:', error)
        // Return fallback mock events
        return [
          {
            id: 'fallback_1',
            title: 'Sample Work Entry',
            date: new Date(),
            type: 'work_entry',
            description: 'Fallback data - check API connection',
            priority: 'medium',
            status: 'pending'
          }
        ]
      }

      return allEvents.sort((a, b) => a.date.getTime() - b.date.getTime())
    }
  })

  // Fetch projects for filter
  const { data: projects = [] } = useQuery({
    queryKey: ['projects-list'],
    queryFn: async (): Promise<Project[]> => {
      const response = await fetch('/api/projects')
      if (!response.ok) throw new Error('Failed to fetch projects')
      const data = await response.json()
      return data.projects || []
    }
  })

  // Get events for a specific date
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    return events.filter(event => isSameDay(event.date, date))
  }

  // Get selected date events
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []

  // Event type configuration
  const eventTypeConfig = {
    work_entry: {
      label: 'Work Entries',
      color: 'bg-blue-500',
      icon: Briefcase
    },
    project_deadline: {
      label: 'Project Deadlines',
      color: 'bg-red-500',
      icon: Clock
    },
    appointment: {
      label: 'Appointments',
      color: 'bg-green-500',
      icon: Users
    },
    maintenance: {
      label: 'Maintenance',
      color: 'bg-yellow-500',
      icon: MapPin
    },
    payment_due: {
      label: 'Payments Due',
      color: 'bg-purple-500',
      icon: CalendarIcon
    }
  }

  // Priority colors
  const priorityColors = {
    low: 'border-gray-300',
    medium: 'border-yellow-400',
    high: 'border-red-500'
  }

  // Status colors
  const statusColors = {
    pending: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700'
  }

  const renderEventCard = (event: CalendarEvent) => {
    const config = eventTypeConfig[event.type]
    const IconComponent = config.icon

    return (
      <Card key={event.id} className={cn("mb-2 cursor-pointer hover:shadow-md transition-shadow", priorityColors[event.priority])}>
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <div className={cn("w-3 h-3 rounded-full mt-1", config.color)} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <IconComponent className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">{event.title}</span>
                <Badge variant="secondary" className={statusColors[event.status]}>
                  {event.status.replace('_', ' ')}
                </Badge>
              </div>
              {event.description && (
                <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {format(event.date, 'MMM d, HH:mm')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">
            Manage work schedules, deadlines, and appointments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button>
            <Plus className="h-4 w-4" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Event Types */}
              <div>
                <label className="text-sm font-medium mb-2 block">Event Types</label>
                <div className="space-y-2">
                  {Object.entries(eventTypeConfig).map(([type, config]) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={type}
                        checked={filters.eventTypes.includes(type as CalendarEventType)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFilters(prev => ({
                              ...prev,
                              eventTypes: [...prev.eventTypes, type as CalendarEventType]
                            }))
                          } else {
                            setFilters(prev => ({
                              ...prev,
                              eventTypes: prev.eventTypes.filter(t => t !== type)
                            }))
                          }
                        }}
                      />
                      <label htmlFor={type} className="text-sm flex items-center gap-2">
                        <div className={cn("w-3 h-3 rounded-full", config.color)} />
                        {config.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Projects */}
              <div>
                <label className="text-sm font-medium mb-2 block">Projects</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="All projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div>
                <label className="text-sm font-medium mb-2 block">View</label>
                <Select value={view} onValueChange={(value: 'month' | 'week' | 'day') => setView(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day View</SelectItem>
                    <SelectItem value="week">Week View</SelectItem>
                    <SelectItem value="month">Month View</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
        {/* Mobile/Tablet: Stack layout, Desktop: Grid layout */}

        {/* Calendar */}
        <Card className="lg:col-span-2 order-1 lg:order-1">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {selectedDate ? format(selectedDate, 'MMMM yyyy') : 'Calendar'}
              </CardTitle>
              {/* Mobile view selector */}
              <div className="sm:hidden">
                <Select value={view} onValueChange={(value: 'month' | 'week' | 'day') => setView(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Responsive calendar container */}
            <div className="w-full overflow-hidden">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border w-full mx-auto max-w-full"
                modifiers={{
                  hasEvents: (date) => getEventsForDate(date).length > 0,
                  today: isToday
                }}
                modifiersStyles={{
                  hasEvents: {
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)'
                  }
                }}
              />
            </div>

            {/* Event indicators legend */}
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium mb-2">Legend</p>
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
                {Object.entries(eventTypeConfig).map(([type, config]) => (
                  <div key={type} className="flex items-center gap-1 text-xs">
                    <div className={cn("w-2 h-2 rounded-full flex-shrink-0", config.color)} />
                    <span className="truncate">{config.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Events for Selected Date */}
        <Card className="order-2 lg:order-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg sm:text-xl">
              {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Select a date'}
            </CardTitle>
            <CardDescription>
              {selectedDateEvents.length} event{selectedDateEvents.length !== 1 ? 's' : ''} scheduled
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-muted rounded-md" />
                  </div>
                ))}
              </div>
            ) : selectedDateEvents.length > 0 ? (
              <div className="space-y-2 max-h-[400px] lg:max-h-[600px] overflow-y-auto">
                {selectedDateEvents.map(renderEventCard)}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm sm:text-base">No events scheduled for this date</p>
                <Button variant="outline" size="sm" className="mt-2">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Event</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>Next 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="work_entry">Work</TabsTrigger>
              <TabsTrigger value="appointment">Appointments</TabsTrigger>
              <TabsTrigger value="project_deadline">Deadlines</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            </TabsList>

            {Object.entries(eventTypeConfig).map(([type, config]) => (
              <TabsContent key={type} value={type} className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {events
                    .filter(event => event.type === type)
                    .slice(0, 6)
                    .map(renderEventCard)}
                </div>
              </TabsContent>
            ))}

            <TabsContent value="all" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.slice(0, 9).map(renderEventCard)}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}