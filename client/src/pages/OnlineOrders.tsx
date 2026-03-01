import { useState } from "react";
  import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
  import { ShoppingBag, CheckCircle, Truck, Package } from "lucide-react";
  import { Button } from "@/components/ui/button";
  import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
  import { Badge } from "@/components/ui/badge";
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";
  import { useToast } from "@/hooks/use-toast";

  export default function OnlineOrders() {
    const [statusFilter, setStatusFilter] = useState("PENDING");
    const token = localStorage.getItem("pharmacy_token");
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: orders, isLoading } = useQuery({
      queryKey: ["online-orders", statusFilter],
      queryFn: async () => {
        const url = new URL("/api/online-orders", window.location.origin);
        if (statusFilter !== "ALL") {
          url.searchParams.set("status", statusFilter);
        }
        
        const response = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch orders");
        return response.json();
      },
    });

    const confirmMutation = useMutation({
      mutationFn: async (orderId: number) => {
        const response = await fetch(`/api/online-orders/${orderId}/confirm`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to confirm order");
        return response.json();
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["online-orders"] });
        toast({ title: "Order confirmed successfully" });
      },
    });

    const dispatchMutation = useMutation({
      mutationFn: async (orderId: number) => {
        const response = await fetch(`/api/online-orders/${orderId}/dispatch`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to dispatch order");
        return response.json();
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["online-orders"] });
        toast({ title: "Order dispatched successfully" });
      },
    });

    const getStatusBadge = (status: string) => {
      const variants: Record<string, any> = {
        PENDING: { variant: "secondary", label: "Pending" },
        CONFIRMED: { variant: "default", label: "Confirmed" },
        PROCESSING: { variant: "default", label: "Processing" },
        READY: { variant: "default", label: "Ready" },
        DISPATCHED: { variant: "default", label: "Dispatched" },
        DELIVERED: { variant: "default", label: "Delivered" },
        CANCELLED: { variant: "destructive", label: "Cancelled" },
      };
      return variants[status] || variants.PENDING;
    };

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Online Orders</h1>
          <p className="text-muted-foreground">
            Manage customer online orders from portal
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {orders?.filter((o: any) => o.status === "PENDING").length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                To Confirm
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {orders?.filter((o: any) => o.status === "PENDING" || o.status === "CONFIRMED").length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ready to Dispatch
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {orders?.filter((o: any) => o.status === "CONFIRMED" || o.status === "READY").length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{orders?.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount), 0).toFixed(2) || '0.00'}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
              <TabsList>
                <TabsTrigger value="PENDING">Pending</TabsTrigger>
                <TabsTrigger value="CONFIRMED">Confirmed</TabsTrigger>
                <TabsTrigger value="DISPATCHED">Dispatched</TabsTrigger>
                <TabsTrigger value="DELIVERED">Delivered</TabsTrigger>
                <TabsTrigger value="ALL">All</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">Loading orders...</p>
            ) : orders && orders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Delivery Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order: any) => {
                    const statusBadge = getStatusBadge(order.status);
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm font-medium">
                          {order.orderNumber}
                        </TableCell>
                        <TableCell>
                          {new Date(order.orderDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.customer?.customerName}</div>
                            <div className="text-sm text-muted-foreground font-mono">
                              {order.contactPhone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {order.orderItems?.length || 0} items
                        </TableCell>
                        <TableCell className="font-bold">
                          ₹{parseFloat(order.totalAmount).toFixed(2)}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="text-sm truncate">{order.deliveryAddress}</div>
                          <div className="text-xs text-muted-foreground">
                            {order.deliveryCity}, {order.deliveryPincode}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadge.variant}>
                            {statusBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {order.status === "PENDING" && (
                              <Button
                                size="sm"
                                onClick={() => confirmMutation.mutate(order.id)}
                                disabled={confirmMutation.isPending}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Confirm
                              </Button>
                            )}
                            {order.status === "CONFIRMED" && (
                              <Button
                                size="sm"
                                onClick={() => dispatchMutation.mutate(order.id)}
                                disabled={dispatchMutation.isPending}
                              >
                                <Truck className="h-3 w-3 mr-1" />
                                Dispatch
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No orders found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
  