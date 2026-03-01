import { useQuery } from "@tanstack/react-query";
  import {
    ShoppingCart, Package, AlertTriangle, ShoppingBag,
    TrendingUp, Users, IndianRupee
  } from "lucide-react";
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
  import { Badge } from "@/components/ui/badge";

  export default function Dashboard() {
    const token = localStorage.getItem("pharmacy_token");

    const { data: stats, isLoading } = useQuery({
      queryKey: ["dashboard-stats"],
      queryFn: async () => {
        const response = await fetch("/api/dashboard/stats", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error("Failed to fetch stats");
        return response.json();
      },
    });

    const StatCard = ({ title, value, subtitle, icon: Icon, trend, badge }: any) => (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <Icon className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold">{value}</div>
            {badge && (
              <Badge variant={badge.variant || "default"}>
                {badge.text}
              </Badge>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center mt-2 text-xs">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-green-500">{trend}</span>
            </div>
          )}
        </CardContent>
      </Card>
    );

    if (isLoading) {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Loading statistics...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to Suvidha Pharmacy Management System
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Today's Sales"
            value={`₹${stats?.todaySales?.total || 0}`}
            subtitle={`${stats?.todaySales?.count || 0} transactions`}
            icon={IndianRupee}
            trend="+12% from yesterday"
          />

          <StatCard
            title="Low Stock Items"
            value={stats?.lowStockItems || 0}
            subtitle="Need to reorder"
            icon={Package}
            badge={
              stats?.lowStockItems > 0
                ? { text: "Action Required", variant: "destructive" }
                : null
            }
          />

          <StatCard
            title="Expiring Soon"
            value={stats?.expiringItems || 0}
            subtitle="Within 30 days"
            icon={AlertTriangle}
            badge={
              stats?.expiringItems > 0
                ? { text: "Review", variant: "warning" }
                : null
            }
          />

          <StatCard
            title="Pending Orders"
            value={stats?.pendingOrders || 0}
            subtitle="Online orders to process"
            icon={ShoppingBag}
            badge={
              stats?.pendingOrders > 0
                ? { text: "New", variant: "default" }
                : null
            }
          />
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                New Sale
              </CardTitle>
              <CardDescription>
                Create a new bill for walk-in customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a
                href="/sales"
                className="text-sm font-medium text-primary hover:underline"
              >
                Go to Sales →
              </a>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Online Orders
              </CardTitle>
              <CardDescription>
                View and process customer online orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a
                href="/online-orders"
                className="text-sm font-medium text-primary hover:underline"
              >
                View Orders →
              </a>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Inventory
              </CardTitle>
              <CardDescription>
                Manage stock levels and batches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a
                href="/inventory"
                className="text-sm font-medium text-primary hover:underline"
              >
                Manage Inventory →
              </a>
            </CardContent>
          </Card>
        </div>

        {/* Alerts Section */}
        {(stats?.lowStockItems > 0 || stats?.expiringItems > 0) && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-5 w-5" />
                Attention Required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats?.lowStockItems > 0 && (
                <p className="text-sm text-yellow-700">
                  • <strong>{stats.lowStockItems}</strong> items are running low on stock
                </p>
              )}
              {stats?.expiringItems > 0 && (
                <p className="text-sm text-yellow-700">
                  • <strong>{stats.expiringItems}</strong> items will expire within 30 days
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }
  