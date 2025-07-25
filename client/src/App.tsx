import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BehavioralProvider } from "@/contexts/BehavioralContext";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import DemoHome from "@/pages/DemoHome";
import Profile from "@/pages/Profile";
import ReAuth from "@/pages/ReAuth";
import BehavioralDashboard from "@/pages/BehavioralDashboard";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={DemoHome} />
          <Route path="/profile" component={Profile} />
          <Route path="/reauth" component={ReAuth} />
          <Route path="/behavioral-dashboard" component={BehavioralDashboard} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BehavioralProvider>
          <Toaster />
          <Router />
        </BehavioralProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
