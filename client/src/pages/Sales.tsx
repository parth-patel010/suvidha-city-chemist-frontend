import { useQuery } from "@tanstack/react-query";
  import { ShoppingCart, Plus, Receipt } from "lucide-react";
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

  export default function Sales() {
    const token = localStorage.getItem("pharmacy_token");

    const { data: sales, isLoading } = useQuery({
      queryKey: ["sales"],
      queryFn: async () => {
        const response = await fetch("/api/sales", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch sales");
        return response.json();
      },
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Sales</h1>
            <p className="text-muted-foreground">
              Manage billing and transactions
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Sale
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Today's Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{sales?.reduce((sum: number, s: any) => {
                  const today = new Date().toDateString();
                  const saleDate = new Date(s.saleDate).toDateString();
                  return today === saleDate ? sum + parseFloat(s.totalAmount) : sum;
                }, 0).toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {sales?.filter((s: any) => new Date(s.saleDate).toDateString() === new Date().toDateString()).length || 0} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{sales?.slice(0, 50).reduce((sum: number, s: any) => sum + parseFloat(s.totalAmount), 0).toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.min(sales?.length || 0, 50)} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average Bill Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{sales && sales.length > 0 ? (sales.reduce((sum: number, s: any) => sum + parseFloat(s.totalAmount), 0) / sales.length).toFixed(2) : '0.00'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Based on recent sales
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">Loading sales...</p>
            ) : sales && sales.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.slice(0, 20).map((sale: any) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-mono text-sm">
                        {sale.invoiceNumber}
                      </TableCell>
                      <TableCell>
                        {new Date(sale.saleDate).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {sale.customer?.customerName || "Walk-in"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {sale.saleItems?.length || 0} items
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{sale.paymentMethod}</Badge>
                      </TableCell>
                      <TableCell className="font-bold">
                        ₹{parseFloat(sale.totalAmount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            sale.status === "COMPLETED"
                              ? "default"
                              : sale.status === "CANCELLED"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {sale.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No sales records found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
  