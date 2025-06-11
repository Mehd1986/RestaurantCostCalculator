import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Sidebar from "@/components/sidebar";
import POSPage from "@/pages/pos";
import InventoryPage from "@/pages/inventory";
import CostTrackingPage from "@/pages/cost-tracking";
import AnalyticsPage from "@/pages/analytics";
import ReportsPage from "@/pages/reports";

function Router() {
  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50 dark:bg-neutral-950">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Switch>
          <Route path="/" component={POSPage} />
          <Route path="/pos" component={POSPage} />
          <Route path="/inventory" component={InventoryPage} />
          <Route path="/costs" component={CostTrackingPage} />
          <Route path="/analytics" component={AnalyticsPage} />
          <Route path="/reports" component={ReportsPage} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
