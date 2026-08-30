import type { User, UserRole } from "./user";

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  startMicrosoftLogin: () => void;
  developmentLogin: (role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}
