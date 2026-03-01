import { ReactNode } from "react";
  import { Link, useLocation } from "wouter";
  import {
    LayoutDashboard, Package, ShoppingCart, Users, ShoppingBag,
    Truck, FileText, Settings, LogOut, Menu, Building2, AlertCircle,
    Bell
  } from "lucide-react";
  import { Button } from "@/components/ui/button";
  import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
  import { Badge } from "@/components/ui/badge";

  interface LayoutProps {
    children: ReactNode;
  }

  export default function Layout({ children }: LayoutProps) {
    const [location] = useLocation();
    const user = JSON.parse(localStorage.getItem("pharmacy_user") || "{}");

    const handleLogout = () => {
      localStorage.removeItem("pharmacy_token");
      localStorage.removeItem("pharmacy_user");
      window.location.href = "/login";
    };

    const menuItems = [
      { path: "/", label: "Dashboard", icon: LayoutDashboard },
      { path: "/products", label: "Products", icon: Package },
      { path: "/inventory", label: "Inventory", icon: ShoppingBag },
      { path: "/sales", label: "Sales", icon: ShoppingCart },
      { path: "/customers", label: "Customers", icon: Users },
      { path: "/online-orders", label: "Online Orders", icon: Bell, badge: true },
      { path: "/purchase-orders", label: "Purchase Orders", icon: FileText },
      { path: "/suppliers", label: "Suppliers", icon: Truck },
      { path: "/reports", label: "Reports", icon: FileText },
      { path: "/settings", label: "Settings", icon: Settings },
    ];

    const NavItems = () => (
      <>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <a
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
                {item.badge && (
                  <Badge variant="destructive" className="ml-auto">3</Badge>
                )}
              </a>
            </Link>
          );
        })}
      </>
    );

    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center px-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="flex h-16 items-center border-b px-6">
                  <Building2 className="h-6 w-6 text-primary" />
                  <span className="ml-2 text-lg font-bold">Suvidha Pharmacy</span>
                </div>
                <div className="space-y-1 p-4">
                  <NavItems />
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary hidden md:block" />
              <span className="text-lg font-bold hidden md:inline">
                Suvidha City Chemist
              </span>
            </div>

            <div className="ml-auto flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Branch:</span>
                <span className="font-medium">{user.branch?.branchName || "Main"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{user.fullName}</span>
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Sidebar & Main Content */}
        <div className="container flex px-4 py-6">
          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-64 pr-6">
            <nav className="space-y-1 sticky top-20">
              <NavItems />
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    );
  }
  