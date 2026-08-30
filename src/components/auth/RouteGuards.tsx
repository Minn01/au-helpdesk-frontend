import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import type { UserRole } from "../../types/user";
import { LoadingState } from "../ui/States";
export function RequireAuth() { const auth = useAuth(); const location = useLocation(); if (auth.isLoading) return <main className="center-screen"><LoadingState label="Opening HelpDesk" /></main>; if (!auth.isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />; return <Outlet />; }
export function RequireRole({ roles }: { roles: UserRole[] }) { const { user } = useAuth(); return user && roles.includes(user.role) ? <Outlet /> : <Navigate to="/dashboard" replace />; }
