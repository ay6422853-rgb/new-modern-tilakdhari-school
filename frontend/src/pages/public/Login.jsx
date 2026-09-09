import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("PRINCIPAL");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, getDashboardPath } = useAuth();

  const nav = useNavigate();
  const location = useLocation();

  const go = async (e) => {
    e.preventDefault();

    setErr("");
    setLoading(true);

    try {
      const data = await login({
        email: email.trim(),
        password,
      });

      if (!data?.user) {
        throw new Error("Invalid login response from server.");
      }

      const actualRole = String(data.user.role || "").toUpperCase();

      // Optional safety check:
      // If user selected a role that doesn't match their actual account role,
      // don't allow them to continue.
      if (role && actualRole !== role) {
        throw new Error(
          `This account is registered as ${actualRole}, not ${role}.`
        );
      }

      // Force password change if required
      if (data.user.mustChangePassword === true) {
        nav("/change-password", { replace: true });
        return;
      }

      // If user originally tried to access a protected page,
      // send them there after login.
      const from = location.state?.from?.pathname;

      if (from && from !== "/login" && from !== "/") {
        nav(from, { replace: true });
        return;
      }

      // Otherwise go to the correct role dashboard
      nav(getDashboardPath(), { replace: true });

    } catch (x) {
      setErr(
        x.response?.data?.message ||
          x.message ||
          "Login failed. Please check your details."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* BACKGROUND */}
      <div className="login-bg"></div>
      <div className="login-overlay"></div>

      {/* LOGIN CARD */}
      <div className="login-wrapper">
        <div className="login-box">

          {/* ICON */}
          <div className="login-icon">
            🏫
          </div>

          {/* TITLE */}
          <h1>School Portal</h1>

          <p className="login-subtitle">
            Sign in to continue
          </p>

          {/* ERROR */}
          {err && (
            <div className="alert">
              {err}
            </div>
          )}

          {/* FORM */}
          <form
            className="login-form"
            onSubmit={go}
          >

            {/* EMAIL */}
            <div className="input-group">
              <label htmlFor="email">
                Email Address
              </label>

              <input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                type="email"
                autoComplete="email"
                required
              />
            </div>

            {/* PASSWORD */}
            <div className="input-group">
              <label htmlFor="password">
                Password
              </label>

              <input
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>

            {/* ROLE */}
            <div className="input-group">
              <label htmlFor="role">
                Login As
              </label>

              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="PRINCIPAL">
                  Principal / Admin
                </option>

                <option value="ACCOUNTANT">
                  Accountant
                </option>

                <option value="OPERATOR">
                  Computer Operator
                </option>

                <option value="TEACHER">
                  Teacher
                </option>

                <option value="PARENT">
                  Parent
                </option>

                <option value="STUDENT">
                  Student
                </option>
              </select>
            </div>

            {/* LOGIN BUTTON */}
            <button
              className="login-btn"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <span>→</span>
                </>
              )}
            </button>

          </form>

          {/* FOOTER */}
          <div className="login-footer">
            <span>
              Secure School Management System
            </span>
          </div>

        </div>
      </div>

    </div>
  );
}