import React, { useState } from "react";
import { changePassword } from "../../api";
import { useAuth } from "../../context/AuthContext";
import "./Profile.css";

export default function Profile() {
  const { user, refreshUser } = useAuth();

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (
      !form.currentPassword ||
      !form.newPassword ||
      !form.confirmPassword
    ) {
      setError("Sabhi password fields fill karein.");
      return;
    }

    if (form.newPassword.length < 6) {
      setError("New password kam se kam 6 characters ka hona chahiye.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("New password aur confirm password match nahi kar rahe.");
      return;
    }

    try {
      setLoading(true);

      await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      setMessage("Password successfully change ho gaya.");

      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      await refreshUser();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Password change nahi ho saka."
      );
    } finally {
      setLoading(false);
    }
  };

  const initials =
    user?.name
      ?.split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "P";

  return (
    <div className="principal-profile-page">
      <div className="principal-profile-header">
        <div>
          <h1>My Profile</h1>
          <p>Manage your principal account</p>
        </div>
      </div>

      {message && (
        <div className="principal-profile-success">
          {message}
        </div>
      )}

      {error && (
        <div className="principal-profile-error">
          {error}
        </div>
      )}

      <div className="principal-profile-grid">
        <section className="principal-profile-card principal-profile-main">
          <div className="principal-profile-avatar">
            {initials}
          </div>

          <h2>{user?.name || "Principal"}</h2>

          <span className="principal-profile-role">
            {user?.role || "PRINCIPAL"}
          </span>

          <div className="principal-profile-details">
            <div>
              <span>Email</span>
              <strong>{user?.email || "Not available"}</strong>
            </div>

            <div>
              <span>Phone</span>
              <strong>{user?.phone || "Not available"}</strong>
            </div>

            <div>
              <span>Account Status</span>
              <strong>
                {user?.active === false
                  ? "Inactive"
                  : "Active"}
              </strong>
            </div>

            <div>
              <span>Account Role</span>
              <strong>{user?.role || "PRINCIPAL"}</strong>
            </div>
          </div>
        </section>

        <section className="principal-profile-card">
          <div className="principal-profile-card-title">
            <h2>Change Password</h2>
            <span>Security</span>
          </div>

          <form onSubmit={handlePasswordChange}>
            <div className="principal-profile-field">
              <label>Current Password</label>
              <input
                type="password"
                value={form.currentPassword}
                onChange={(e) =>
                  setForm({
                    ...form,
                    currentPassword: e.target.value,
                  })
                }
                placeholder="Enter current password"
              />
            </div>

            <div className="principal-profile-field">
              <label>New Password</label>
              <input
                type="password"
                value={form.newPassword}
                onChange={(e) =>
                  setForm({
                    ...form,
                    newPassword: e.target.value,
                  })
                }
                placeholder="Enter new password"
              />
            </div>

            <div className="principal-profile-field">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm({
                    ...form,
                    confirmPassword: e.target.value,
                  })
                }
                placeholder="Confirm new password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="principal-profile-password-btn"
            >
              {loading
                ? "Changing..."
                : "Change Password"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}