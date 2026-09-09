import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ roles = [], children }) {
  const location = useLocation();

  const token = localStorage.getItem("token");
  const userRaw = localStorage.getItem("user");

  // Login required
  if (!token || !userRaw) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  let user;

  try {
    user = JSON.parse(userRaw);
  } catch (error) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    return <Navigate to="/login" replace />;
  }

  // Invalid user data
  if (!user || !user.role) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    return <Navigate to="/login" replace />;
  }

  // Inactive account
  if (user.active === false) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    return <Navigate to="/login" replace />;
  }

  // Force password change
  if (
    user.mustChangePassword === true &&
    location.pathname !== "/change-password"
  ) {
    return <Navigate to="/change-password" replace />;
  }

  // Role protection
  if (roles.length > 0) {
    const userRole = String(user.role).toUpperCase();

    const allowedRoles = roles.map((role) =>
      String(role).toUpperCase()
    );

    if (!allowedRoles.includes(userRole)) {
      return (
        <Navigate
          to={`/${userRole.toLowerCase()}`}
          replace
        />
      );
    }
  }

  return children;
}