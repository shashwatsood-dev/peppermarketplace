import { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "admin" | "pod_lead_recruiter" | "capability_lead_am";

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  passwordSet: boolean;
  password: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  pod_lead_recruiter: "Pod Lead / Recruiter",
  capability_lead_am: "Capability Lead / Account Manager",
};

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role];
}

// Default users
const defaultUsers: AppUser[] = [
  { id: "u-1", email: "admin@pepper.com", name: "Admin User", role: "admin", passwordSet: true, password: "admin123" },
  { id: "u-2", email: "recruiter@pepper.com", name: "Neha Gupta", role: "pod_lead_recruiter", passwordSet: true, password: "recruiter123" },
  { id: "u-3", email: "amlead@pepper.com", name: "Priya Sharma", role: "capability_lead_am", passwordSet: true, password: "amlead123" },
];

interface AuthContextType {
  currentUser: AppUser | null;
  currentRole: UserRole;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  users: AppUser[];
  addUser: (email: string, name: string, role: UserRole) => void;
  setPassword: (userId: string, password: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<AppUser[]>(defaultUsers);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [viewAsRole, setViewAsRole] = useState<UserRole | null>(null);

  const isAuthenticated = !!currentUser;
  const currentRole = viewAsRole ?? currentUser?.role ?? "admin";

  const login = (email: string, password: string): boolean => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return false;
    if (!user.passwordSet) {
      // First login — set password
      const updated = users.map(u => u.id === user.id ? { ...u, password, passwordSet: true } : u);
      setUsers(updated);
      setCurrentUser({ ...user, password, passwordSet: true });
      setViewAsRole(null);
      return true;
    }
    if (user.password !== password) return false;
    setCurrentUser(user);
    setViewAsRole(null);
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    setViewAsRole(null);
  };

  const switchRole = (role: UserRole) => {
    if (currentUser?.role === "admin") {
      setViewAsRole(role);
    }
  };

  const addUser = (email: string, name: string, role: UserRole) => {
    const newUser: AppUser = {
      id: `u-${Date.now()}`,
      email,
      name,
      role,
      passwordSet: false,
      password: "",
    };
    setUsers(prev => [...prev, newUser]);
  };

  const setPasswordFn = (userId: string, password: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, password, passwordSet: true } : u));
  };

  return (
    <AuthContext.Provider value={{
      currentUser, currentRole, isAuthenticated,
      login, logout, switchRole,
      users, addUser, setPassword: setPasswordFn,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
