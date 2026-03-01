import { Route, Switch, useLocation } from "wouter";
  import { QueryClientProvider } from "@tanstack/react-query";
  import { queryClient } from "./lib/queryClient";
  import { Toaster } from "@/components/ui/toaster";
  import Login from "./pages/Login";
  import Dashboard from "./pages/Dashboard";
  import Products from "./pages/Products";
  import Inventory from "./pages/Inventory";
  import Sales from "./pages/Sales";
  import Customers from "./pages/Customers";
  import OnlineOrders from "./pages/OnlineOrders";
  import PurchaseOrders from "./pages/PurchaseOrders";
  import Suppliers from "./pages/Suppliers";
  import Reports from "./pages/Reports";
  import Settings from "./pages/Settings";
  import NotFound from "./pages/not-found";
  import Layout from "./components/Layout";
  import { useEffect, useState } from "react";

  function App() {
    const [location] = useLocation();
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
      const token = localStorage.getItem("pharmacy_token");
      setIsAuthenticated(!!token);
    }, [location]);

    if (!isAuthenticated && location !== "/login") {
      window.location.href = "/login";
      return null;
    }

    if (isAuthenticated && location === "/login") {
      window.location.href = "/";
      return null;
    }

    return (
      <QueryClientProvider client={queryClient}>
        <Switch>
          <Route path="/login" component={Login} />
          <Route>
            <Layout>
              <Switch>
                <Route path="/" component={Dashboard} />
                <Route path="/products" component={Products} />
                <Route path="/inventory" component={Inventory} />
                <Route path="/sales" component={Sales} />
                <Route path="/customers" component={Customers} />
                <Route path="/online-orders" component={OnlineOrders} />
                <Route path="/purchase-orders" component={PurchaseOrders} />
                <Route path="/suppliers" component={Suppliers} />
                <Route path="/reports" component={Reports} />
                <Route path="/settings" component={Settings} />
                <Route component={NotFound} />
              </Switch>
            </Layout>
          </Route>
        </Switch>
        <Toaster />
      </QueryClientProvider>
    );
  }

  export default App;
  