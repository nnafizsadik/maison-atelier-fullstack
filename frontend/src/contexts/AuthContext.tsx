import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: string;
  email: string;
  full_name?: string;
  is_admin?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("auth_token"));

  // On mount: restore user from localStorage AND verify admin status live from the server
  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");

    if (!storedToken || !storedUser) {
      setIsLoading(false);
      return;
    }

    try {
      const userData: User = JSON.parse(storedUser);
      setUser(userData);
      setToken(storedToken);

      // ✅ Live check: fetch the real is_admin from the server so it's always fresh
      const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
      fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.is_admin !== undefined) {
            setIsAdmin(data.is_admin);
            // Update localStorage with fresh data
            const updated = { ...userData, is_admin: data.is_admin };
            localStorage.setItem("auth_user", JSON.stringify(updated));
            setUser(updated);
          } else {
            // Fall back to stored value
            setIsAdmin(userData.is_admin || false);
          }
        })
        .catch(() => {
          // Offline fallback
          setIsAdmin(userData.is_admin || false);
        })
        .finally(() => setIsLoading(false));
    } catch {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      setIsLoading(false);
    }
  }, []);

  const login = (newToken: string, userData: User) => {
    localStorage.setItem("auth_token", newToken);
    localStorage.setItem("auth_user", JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    setIsAdmin(userData.is_admin || false);
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setToken(null);
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAdmin,
      isAuthenticated: !!token,
      login,
      logout,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
