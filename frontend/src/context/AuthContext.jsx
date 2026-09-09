import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  login as loginApi,
  me as meApi,
} from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");

      return savedUser
        ? JSON.parse(savedUser)
        : null;
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // Save login information
  const saveAuth = (data) => {
    if (data?.token) {
      localStorage.setItem("token", data.token);
    }

    if (data?.user) {
      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      setUser(data.user);
    }
  };

  // Login
  const login = async (credentials) => {
    const data = await loginApi(credentials);

    saveAuth(data);

    return data;
  };

  // Get current logged-in user
  const refreshUser = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setUser(null);
      return null;
    }

    try {
      const data = await meApi();

      const currentUser = data?.user || data;

      if (!currentUser) {
        throw new Error("User information not found");
      }

      localStorage.setItem(
        "user",
        JSON.stringify(currentUser)
      );

      setUser(currentUser);

      return currentUser;
    } catch (error) {
      logout();
      return null;
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
  };

  // Initialize authentication
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      await refreshUser();

      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Check role
  const hasRole = (...roles) => {
    if (!user?.role) {
      return false;
    }

    const currentRole = String(user.role).toUpperCase();

    return roles.some(
      (role) =>
        String(role).toUpperCase() === currentRole
    );
  };

  // Dashboard according to role
  const getDashboardPath = () => {
    if (!user?.role) {
      return "/login";
    }

    switch (
      String(user.role).toUpperCase()
    ) {
      case "PRINCIPAL":
        return "/principal";

      case "ACCOUNTANT":
        return "/accountant";

      case "OPERATOR":
        return "/operator";

      case "TEACHER":
        return "/teacher";

      case "PARENT":
        return "/parent";

      case "STUDENT":
        return "/student";

      default:
        return "/";
    }
  };

  const value = {
    user,
    setUser,

    loading,

    isAuthenticated:
      !!user &&
      !!localStorage.getItem("token"),

    login,
    logout,
    refreshUser,

    hasRole,
    getDashboardPath,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}

export default AuthContext;