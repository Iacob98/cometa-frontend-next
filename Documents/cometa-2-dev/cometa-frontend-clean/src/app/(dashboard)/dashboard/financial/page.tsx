"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, TrendingUp, TrendingDown, DollarSign, CreditCard, Receipt, Calendar, Filter, Search, BarChart3, PieChart, Eye, Edit, Trash2 } from "lucide-react";

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

import { useTransactions, useFinancialSummary, formatCurrency, getCategoryLabel, getCategoryColor, getPaymentMethodLabel, getTransactionTypeColor, TRANSACTION_CATEGORIES, PAYMENT_METHODS } from "@/hooks/use-financial";
import { useProjects } from "@/hooks/use-projects";
import { useAuth, usePermissions } from "@/hooks/use-auth";
import type { FinancialFilters, TransactionCategory, PaymentMethod } from "@/types";

export default function FinancialPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { canManageFinances, canViewFinances } = usePermissions();

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense" | "transfer">("all");
  const [categoryFilter, setCategoryFilter] = useState<TransactionCategory | "all">("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<PaymentMethod | "all">("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filters: FinancialFilters = {
    type: typeFilter === "all" ? undefined : typeFilter,
    category: categoryFilter === "all" ? undefined : categoryFilter,
    payment_method: paymentMethodFilter === "all" ? undefined : paymentMethodFilter,
    project_id: projectFilter === "all" ? undefined : projectFilter,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    search: searchQuery || undefined,
    page: 1,
    per_page: 20,
  };

  const { data: transactionsResponse, isLoading: transactionsLoading, error: transactionsError } = useTransactions(filters);
  const { data: financialSummary, isLoading: summaryLoading } = useFinancialSummary({
    type: filters.type,
    project_id: filters.project_id,
    date_from: filters.date_from,
    date_to: filters.date_to,
  });
  const { data: projectsResponse } = useProjects({});

  const transactions = transactionsResponse?.transactions || [];
  const projects = projectsResponse?.items || [];

  if (!canViewFinances) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Financial Tracking</h1>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              You don't have permission to view financial information.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (transactionsError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Financial Tracking</h1>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              Failed to load financial data. Please try again later.
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
          <h1 className="text-3xl font-bold tracking-tight">Financial Tracking</h1>
          <p className="text-muted-foreground">
            Monitor expenses, income, and financial performance across projects
          </p>
        </div>
        {canManageFinances && (
          <Button onClick={() => router.push("/dashboard/financial/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Transaction
          </Button>
        )}
      </div>

      {/* Financial Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <div className="h-6 bg-muted animate-pulse rounded" />
            ) : (
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(financialSummary?.total_income || 0, financialSummary?.currency)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {financialSummary?.period ? `From ${financialSummary.period.from} to ${financialSummary.period.to}` : 'This period'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <div className="h-6 bg-muted animate-pulse rounded" />
            ) : (
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(financialSummary?.total_expenses || 0, financialSummary?.currency)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {financialSummary?.period ? `From ${financialSummary.period.from} to ${financialSummary.period.to}` : 'This period'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <div className="h-6 bg-muted animate-pulse rounded" />
            ) : (
              <div className={`text-2xl font-bold ${(financialSummary?.net_profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(financialSummary?.net_profit || 0, financialSummary?.currency)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Income minus expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <div className="h-6 bg-muted animate-pulse rounded" />
            ) : (
              <div className="text-2xl font-bold">
                {financialSummary?.pending_invoices || 0}
              </div>
            )}
            <p className="text-xs text-red-600">
              {financialSummary?.overdue_invoices || 0} overdue
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">All Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Transactions</CardTitle>
              <CardDescription>
                Search and filter transactions by various criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by description, reference, or notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>

                  <Select value={typeFilter} onValueChange={(value: "all" | "income" | "expense" | "transfer") => setTypeFilter(value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={categoryFilter} onValueChange={(value: TransactionCategory | "all") => setCategoryFilter(value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {TRANSACTION_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {getCategoryLabel(category)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
                  <Select value={paymentMethodFilter} onValueChange={(value: PaymentMethod | "all") => setPaymentMethodFilter(value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      {PAYMENT_METHODS.map((method) => (
                        <SelectItem key={method} value={method}>
                          {getPaymentMethodLabel(method)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={projectFilter} onValueChange={setProjectFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by project" />
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

                  <div className="flex space-x-2">
                    <Input
                      type="date"
                      placeholder="From date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-40"
                    />
                    <Input
                      type="date"
                      placeholder="To date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-40"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Transactions ({transactionsResponse?.total || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex space-x-4">
                      <div className="h-4 bg-muted animate-pulse rounded flex-1" />
                      <div className="h-4 bg-muted animate-pulse rounded w-20" />
                      <div className="h-4 bg-muted animate-pulse rounded w-16" />
                    </div>
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold">No transactions found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {searchQuery || typeFilter !== "all" || categoryFilter !== "all" || projectFilter !== "all"
                      ? "No transactions match your current filters."
                      : "Get started by creating your first transaction."}
                  </p>
                  {canManageFinances && (
                    <Button
                      className="mt-4"
                      onClick={() => router.push("/dashboard/financial/new")}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Transaction
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Description</TableHead>
                      <TableHead>Type & Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {new Date(transaction.transaction_date).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {transaction.description}
                            </div>
                            {transaction.reference_number && (
                              <div className="text-xs text-muted-foreground">
                                Ref: {transaction.reference_number}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant={transaction.type === 'income' ? 'default' : transaction.type === 'expense' ? 'destructive' : 'secondary'}>
                              {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                            </Badge>
                            <div className="text-sm">
                              <Badge variant="outline" className={getCategoryColor(transaction.category)}>
                                {getCategoryLabel(transaction.category)}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`font-semibold ${getTransactionTypeColor(transaction.type)}`}>
                            {transaction.type === 'expense' ? '-' : '+'}
                            {formatCurrency(transaction.amount, transaction.currency)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {getPaymentMethodLabel(transaction.payment_method)}
                          </div>
                          {transaction.receipt_url && (
                            <div className="text-xs text-green-600">
                              Has receipt
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {transaction.project_name || 'General'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {transaction.approved_at ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              Approved
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              Pending
                            </Badge>
                          )}
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
                                onClick={() => router.push(`/dashboard/financial/${transaction.id}`)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              {canManageFinances && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => router.push(`/dashboard/financial/${transaction.id}/edit`)}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-red-600">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
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

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Expenses by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summaryLoading ? (
                  <div className="h-64 bg-muted animate-pulse rounded" />
                ) : (
                  <div className="space-y-4">
                    {financialSummary?.by_category.slice(0, 8).map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className={getCategoryColor(item.category)}>
                            {getCategoryLabel(item.category)}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {formatCurrency(item.amount, financialSummary.currency)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {item.percentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Monthly Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summaryLoading ? (
                  <div className="h-64 bg-muted animate-pulse rounded" />
                ) : (
                  <div className="space-y-4">
                    {financialSummary?.monthly_trend.slice(-6).map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{item.month}</span>
                          <span className={item.net >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(item.net, financialSummary.currency)}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 text-xs">
                            <div className="w-2 h-2 bg-green-500 rounded"></div>
                            <span>Income: {formatCurrency(item.income, financialSummary.currency)}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs">
                            <div className="w-2 h-2 bg-red-500 rounded"></div>
                            <span>Expenses: {formatCurrency(item.expenses, financialSummary.currency)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Financial Reports</CardTitle>
              <CardDescription>
                Generate detailed financial reports and export data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Button variant="outline" className="h-20 flex-col">
                  <Receipt className="h-6 w-6 mb-2" />
                  Expense Report
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <TrendingUp className="h-6 w-6 mb-2" />
                  Profit & Loss
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <BarChart3 className="h-6 w-6 mb-2" />
                  Budget Analysis
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Calendar className="h-6 w-6 mb-2" />
                  Monthly Summary
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <DollarSign className="h-6 w-6 mb-2" />
                  Cash Flow
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <PieChart className="h-6 w-6 mb-2" />
                  Category Breakdown
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}