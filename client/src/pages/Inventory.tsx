import { useState } from "react";
  import { useQuery } from "@tanstack/react-query";
  import { Package, AlertTriangle, Plus } from "lucide-react";
  import { Button } from "@/components/ui/button";
  import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
  import { Badge } from "@/components/ui/badge";
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";

  export default function Inventory() {
    const token = localStorage.getItem("pharmacy_token");

    const { data: inventory, isLoading } = useQuery({
      queryKey: ["inventory"],
      queryFn: async () => {
        const response = await fetch("/api/inventory", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch inventory");
        return response.json();
      },
    });

    const getStockStatus = (current: number, reorder: number) => {
      if (current === 0) return { label: "Out of Stock", variant: "destructive" };
      if (current <= reorder) return { label: "Low Stock", variant: "warning" };
      return { label: "In Stock", variant: "default" };
    };

    const getExpiryStatus = (expiryDate: string) => {
      const today = new Date();
      const expiry = new Date(expiryDate);
      const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry < 0) return { label: "Expired", variant: "destructive" };
      if (daysUntilExpiry <= 30) return { label: `${daysUntilExpiry}d`, variant: "destructive" };
      if (daysUntilExpiry <= 90) return { label: `${daysUntilExpiry}d`, variant: "warning" };
      return { label: `${daysUntilExpiry}d`, variant: "default" };
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Inventory</h1>
            <p className="text-muted-foreground">
              Track stock levels and expiry dates
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Stock
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Current Stock</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">Loading inventory...</p>
            ) : inventory && inventory.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Batch Number</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Reorder Level</TableHead>
                    <TableHead>MRP</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map((item: any) => {
                    const stockStatus = getStockStatus(item.quantityInStock, item.reorderLevel);
                    const expiryStatus = getExpiryStatus(item.expiryDate);
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.product?.productName}
                          <div className="text-xs text-muted-foreground">
                            {item.product?.productCode}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {item.batchNumber}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{item.quantityInStock}</span>
                            <span className="text-muted-foreground text-sm">
                              {item.product?.unit}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.reorderLevel}
                        </TableCell>
                        <TableCell>₹{item.mrp}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {new Date(item.expiryDate).toLocaleDateString()}
                            <Badge variant={expiryStatus.variant as any}>
                              {expiryStatus.label}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.location || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={stockStatus.variant as any}>
                            {stockStatus.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No inventory items found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
  