import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { changePassword } from "../../api";
import { useAuth } from "../../context/AuthContext";

export default function ChangePassword() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (form.newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    if (form.currentPassword === form.newPassword) {
      setError("New password must be different from current password.");
      return;
    }

    try {
      setLoading(true);

      await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      await refreshUser();

      setMessage("Password changed successfully.");

      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        const role = String(user?.role || "").toLowerCase();

        const dashboardMap = {
          principal: "/principal",
          accountant: "/accountant",
          operator: "/operator",
          teacher: "/teacher",
          parent: "/parent",
          student: "/student",
        };

        navigate(dashboardMap[role] || "/");
      }, 800);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to change password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-header">
          <h1>Change Password</h1>
          <p>
            Please create a new password for your account.
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {message && (
          <div className="alert alert-success">
            {message}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Current Password</label>
            <input
              type="password"
              name="currentPassword"
              placeholder="Enter current password"
              value={form.currentPassword}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
          </div>

          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              name="newPassword"
              placeholder="Enter new password"
              value={form.newPassword}
              onChange={handleChange}
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>

          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm new password"
              value={form.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>

          <button
            type="submit"
            className="btn"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}