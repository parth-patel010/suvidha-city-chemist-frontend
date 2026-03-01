import { useState } from "react";
  import { useQuery } from "@tanstack/react-query";
  import { Users, Plus, Search, Crown } from "lucide-react";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
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

  export default function Customers() {
    const [search, setSearch] = useState("");
    const token = localStorage.getItem("pharmacy_token");

    const { data: customers, isLoading } = useQuery({
      queryKey: ["customers", search],
      queryFn: async () => {
        const url = new URL("/api/customers", window.location.origin);
        if (search) url.searchParams.set("search", search);
        
        const response = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch customers");
        return response.json();
      },
    });

    const getTierBadge = (tier: string) => {
      const variants: Record<string, any> = {
        BRONZE: { variant: "secondary", color: "text-orange-700" },
        SILVER: { variant: "default", color: "text-gray-600" },
        GOLD: { variant: "default", color: "text-yellow-600" },
        PLATINUM: { variant: "default", color: "text-purple-600" },
      };
      return variants[tier] || variants.BRONZE;
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Customers</h1>
            <p className="text-muted-foreground">
              Manage customer profiles and loyalty program
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone, or customer code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">Loading customers...</p>
            ) : customers && customers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Loyalty Tier</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Total Purchases</TableHead>
                    <TableHead>WhatsApp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer: any) => {
                    const tierStyle = getTierBadge(customer.loyaltyTier);
                    return (
                      <TableRow key={customer.id}>
                        <TableCell className="font-mono text-sm">
                          {customer.customerCode}
                        </TableCell>
                        <TableCell className="font-medium">
                          {customer.customerName}
                        </TableCell>
                        <TableCell className="font-mono">
                          {customer.phone}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {customer.email || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={tierStyle.variant} className={tierStyle.color}>
                            <Crown className="h-3 w-3 mr-1" />
                            {customer.loyaltyTier}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold">
                          {customer.loyaltyPoints}
                        </TableCell>
                        <TableCell>
                          ₹{parseFloat(customer.totalPurchases).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {customer.whatsappOptIn ? (
                            <Badge variant="default">Enabled</Badge>
                          ) : (
                            <Badge variant="outline">Disabled</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No customers found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
  