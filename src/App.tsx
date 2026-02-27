import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth-context";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import RequisitionsAdvanced from "./pages/RequisitionsAdvanced";
import NewRequisition from "./pages/NewRequisition";
import DealMargins from "./pages/DealMargins";
import StudioDashboard from "./pages/StudioDashboard";
import CreatorHandover from "./pages/CreatorHandover";
import CreatorDatabase from "./pages/CreatorDatabase";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import ATSPipeline from "./pages/ATSPipeline";
import CandidateDatabaseATS from "./pages/CandidateDatabaseATS";
import ATSReporting from "./pages/ATSReporting";
import ATSOverview from "./pages/ATSOverview";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/requisitions" element={<RequisitionsAdvanced />} />
              <Route path="/requisitions/new" element={<NewRequisition />} />
              <Route path="/deals" element={<DealMargins />} />
              <Route path="/studio" element={<StudioDashboard />} />
              <Route path="/handover" element={<CreatorHandover />} />
              <Route path="/creators" element={<CreatorDatabase />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/ats" element={<ATSOverview />} />
              <Route path="/ats/:reqId" element={<ATSPipeline />} />
              <Route path="/candidates" element={<CandidateDatabaseATS />} />
              <Route path="/ats-reporting" element={<ATSReporting />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
