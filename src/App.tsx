// TODO: separate these into different files
import { Navigate, Route, Routes } from "react-router-dom";

function LoginPage() {
  return <h1>Login</h1>;
}

function DashboardPage() {
  return <h1>Dashboard</h1>;
}

function NewTicketPage() {
  return <h1>Create Ticket</h1>;
}

function TicketPage() {
  return <h1>Ticket Details</h1>;
}

function NotFoundPage() {
  return <h1>404 — Page Not Found</h1>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/tickets/new" element={<NewTicketPage />} />
      <Route path="/tickets/:ticketId" element={<TicketPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}