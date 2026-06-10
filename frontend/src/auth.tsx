import React, { createContext, useContext, useState } from "react";
import { api } from "./api";

interface AuthState { token: string | null; role: string | null; email: string | null; }
interface Ctx extends AuthState { login: (e: string, p: string) => Promise<void>; logout: () => void; isEditor: boolean; }

const AuthContext = createContext<Ctx>(null as any);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: localStorage.getItem("token"),
    role: localStorage.getItem("role"),
    email: localStorage.getItem("email"),
  });
  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    localStorage.setItem("token", res.token);
    localStorage.setItem("role", res.user.role);
    localStorage.setItem("email", res.user.email);
    setState({ token: res.token, role: res.user.role, email: res.user.email });
  };
  const logout = () => { localStorage.clear(); setState({ token: null, role: null, email: null }); };
  return (
    <AuthContext.Provider value={{ ...state, login, logout, isEditor: state.role === "pm_editor" }}>
      {children}
    </AuthContext.Provider>
  );
}
