import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth, RequireRole } from "./components/auth/RouteGuards";
import { AppLayout } from "./components/layout/AppLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { MyTicketsPage } from "./pages/MyTicketsPage";
import { NotFoundPage } from "./pages/PlaceholderPage";
import { TicketDetailsPage } from "./pages/TicketDetailsPage";
import { TicketFormPage } from "./pages/TicketFormPage";
import { TicketWorkspacePage } from "./pages/TicketWorkspacePage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { UsersPage } from "./pages/UsersPage";

export default function App() {
  return <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route element={<RequireAuth />}><Route element={<AppLayout />}>
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route element={<RequireRole roles={["STUDENT", "FACULTY"]} />}>
        <Route path="tickets" element={<MyTicketsPage />} />
        <Route path="tickets/new" element={<TicketFormPage />} />
        <Route path="tickets/:ticketId/edit" element={<TicketFormPage edit />} />
      </Route>
      <Route path="tickets/:ticketId" element={<TicketDetailsPage />} />
      <Route element={<RequireRole roles={["TECHNICIAN"]} />}><Route path="queue" element={<TicketWorkspacePage mode="queue" />} /><Route path="assigned" element={<TicketWorkspacePage mode="assigned" />} /></Route>
      <Route element={<RequireRole roles={["ADMIN"]} />}><Route path="admin/tickets" element={<TicketWorkspacePage mode="admin" />} /><Route path="admin/categories" element={<CategoriesPage />} /><Route path="admin/users" element={<UsersPage />} /></Route>
    </Route></Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes>;
}
