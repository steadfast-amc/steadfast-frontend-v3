import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import { ToastProvider } from "./lib/toast";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppShell } from "./components/layout/AppShell";
import { adminNavItems, engineerNavItems, clientNavItems } from "./lib/navigation";
import { Login } from "./pages/auth/Login";
import { VerifyJob } from "./pages/VerifyJob";
import { Dashboard } from "./pages/admin/Dashboard";
import { Contracts } from "./pages/admin/Contracts";
import { ContractDetail } from "./pages/admin/ContractDetail";
import { Complaints } from "./pages/admin/Complaints";
import { ComplaintDetail } from "./pages/admin/ComplaintDetail";
import { Jobs } from "./pages/admin/Jobs";
import { JobDetail } from "./pages/admin/JobDetail";
import { Inventory } from "./pages/admin/Inventory";
import { Invoices } from "./pages/admin/Invoices";
import { Engineers } from "./pages/admin/Engineers";
import { Clients } from "./pages/admin/Clients";
import { MyJobs } from "./pages/engineer/MyJobs";
import { JobExecution } from "./pages/engineer/JobExecution";
import { ClientDashboard } from "./pages/client/ClientDashboard";
import { MyContracts } from "./pages/client/MyContracts";
import { ContractView } from "./pages/client/ContractView";
import { MyComplaints } from "./pages/client/MyComplaints";
import { ComplaintView } from "./pages/client/ComplaintView";
import { MyInvoices } from "./pages/client/MyInvoices";
import { ServiceHistory } from "./pages/client/ServiceHistory";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Public — no login, this is what a QR code scan opens */}
          <Route path="/verify/:token" element={<VerifyJob />} />

          {/* --- Admin --- */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AppShell navItems={adminNavItems} />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="contracts" element={<Contracts />} />
            <Route path="contracts/:id" element={<ContractDetail />} />
            <Route path="complaints" element={<Complaints />} />
            <Route path="complaints/:id" element={<ComplaintDetail />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="jobs/:id" element={<JobDetail />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="engineers" element={<Engineers />} />
            <Route path="clients" element={<Clients />} />
          </Route>

          {/* --- Engineer --- */}
          <Route
            path="/engineer"
            element={
              <ProtectedRoute allowedRoles={["engineer"]}>
                <AppShell navItems={engineerNavItems} />
              </ProtectedRoute>
            }
          >
            <Route index element={<MyJobs />} />
            <Route path="jobs/:id" element={<JobExecution />} />
          </Route>

          {/* --- Client --- */}
          <Route
            path="/client"
            element={
              <ProtectedRoute allowedRoles={["client"]}>
                <AppShell navItems={clientNavItems} />
              </ProtectedRoute>
            }
          >
            <Route index element={<ClientDashboard />} />
            <Route path="contracts" element={<MyContracts />} />
            <Route path="contracts/:id" element={<ContractView />} />
            <Route path="complaints" element={<MyComplaints />} />
            <Route path="complaints/:id" element={<ComplaintView />} />
            <Route path="history" element={<ServiceHistory />} />
            <Route path="invoices" element={<MyInvoices />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

