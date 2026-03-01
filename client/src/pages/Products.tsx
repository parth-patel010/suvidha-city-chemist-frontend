import { useState } from "react";
  import { useQuery } from "@tanstack/react-query";
  import { Plus, Search, Package } from "lucide-react";
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

  export default function Products() {
    const [search, setSearch] = useState("");
    const token = localStorage.getItem("pharmacy_token");

    const { data: products, isLoading } = useQuery({
      queryKey: ["products", search],
      queryFn: async () => {
        const url = new URL("/api/products", window.location.origin);
        if (search) url.searchParams.set("search", search);
        
        const response = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch products");
        return response.json();
      },
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Products</h1>
            <p className="text-muted-foreground">
              Manage your pharmacy product catalog
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, code, or generic name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">Loading products...</p>
            ) : products && products.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Generic Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Manufacturer</TableHead>
                    <TableHead>HSN Code</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product: any) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-mono text-sm">
                        {product.productCode}
                      </TableCell>
                      <TableCell className="font-medium">
                        {product.productName}
                        {product.requiresPrescription && (
                          <Badge variant="outline" className="ml-2 text-xs">Rx</Badge>
                        )}
                        {product.isScheduleH && (
                          <Badge variant="destructive" className="ml-1 text-xs">H</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {product.genericName || "-"}
                      </TableCell>
                      <TableCell>{product.category?.categoryName || "-"}</TableCell>
                      <TableCell>{product.manufacturer?.manufacturerName || "-"}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {product.hsnCode}
                      </TableCell>
                      <TableCell>
                        {product.isActive ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No products found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
  