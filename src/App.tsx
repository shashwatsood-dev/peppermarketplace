import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import RequisitionsAdvanced from "./pages/RequisitionsAdvanced";
import NewRequisition from "./pages/NewRequisition";
import TATracker from "./pages/TATracker";
import DealMargins from "./pages/DealMargins";
import StudioDashboard from "./pages/StudioDashboard";
import CreatorHandover from "./pages/CreatorHandover";
import CreatorDatabase from "./pages/CreatorDatabase";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/requisitions" element={<RequisitionsAdvanced />} />
            <Route path="/requisitions/new" element={<NewRequisition />} />
            <Route path="/ta-tracker" element={<TATracker />} />
            <Route path="/deals" element={<DealMargins />} />
            <Route path="/studio" element={<StudioDashboard />} />
            <Route path="/handover" element={<CreatorHandover />} />
            <Route path="/creators" element={<CreatorDatabase />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
