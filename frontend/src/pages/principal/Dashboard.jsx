import { useCallback, useEffect, useState } from "react";
import api from "../../api";
import "./Dashboard.css";

function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/principal/dashboard");
      setData(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return (
      <div className="principal-dashboard">
        <div className="dashboard-loading">
          <div className="dashboard-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="principal-dashboard">
        <div className="dashboard-error">
          <div className="error-icon">!</div>
          <h3>Dashboard could not be loaded</h3>
          <p>{error}</p>
          <button onClick={loadDashboard}>Try Again</button>
        </div>
      </div>
    );
  }

  const netBalance =
    Number(data?.totalCollection || 0) -
    Number(data?.totalExpense || 0);

  const stats = [
    {
      title: "Total Students",
      value: data?.students || 0,
      icon: "🎓",
      className: "students",
    },
    {
      title: "Total Teachers",
      value: data?.teachers || 0,
      icon: "👨‍🏫",
      className: "teachers",
    },
    {
      title: "Total Parents",
      value: data?.parents || 0,
      icon: "👨‍👩‍👧",
      className: "parents",
    },
    {
      title: "Registrations",
      value: data?.registrations || 0,
      icon: "📝",
      className: "registrations",
    },
    {
      title: "Admissions",
      value: data?.admissions || 0,
      icon: "🏫",
      className: "admissions",
    },
    {
      title: "Total Collection",
      value: formatMoney(data?.totalCollection),
      icon: "💰",
      className: "collection",
    },
    {
      title: "Total Expense",
      value: formatMoney(data?.totalExpense),
      icon: "💳",
      className: "expense",
    },
    {
      title: "Net Balance",
      value: formatMoney(netBalance),
      icon: "📊",
      className: "balance",
    },
  ];

  return (
    <div className="principal-dashboard">
      <div className="dashboard-header">
        <div>
          <span className="dashboard-label">PRINCIPAL PANEL</span>
          <h1>School Dashboard</h1>
          <p>
            Overview of students, staff, admissions and school finances.
          </p>
        </div>

        <button
          className="dashboard-refresh"
          onClick={loadDashboard}
          title="Refresh dashboard"
        >
          ↻ <span>Refresh</span>
        </button>
      </div>

      <div className="dashboard-grid">
        {stats.map((item) => (
          <div
            className={`dashboard-stat-card ${item.className}`}
            key={item.title}
          >
            <div className="stat-icon">{item.icon}</div>

            <div className="stat-content">
              <span>{item.title}</span>
              <strong>{item.value}</strong>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-finance">
        <div className="finance-heading">
          <div>
            <span>FINANCIAL OVERVIEW</span>
            <h2>School Finance</h2>
          </div>
        </div>

        <div className="finance-cards">
          <div className="finance-item">
            <div className="finance-icon">₹</div>
            <div>
              <span>Total Collection</span>
              <strong>{formatMoney(data?.totalCollection)}</strong>
            </div>
          </div>

          <div className="finance-item">
            <div className="finance-icon">−</div>
            <div>
              <span>Total Expense</span>
              <strong>{formatMoney(data?.totalExpense)}</strong>
            </div>
          </div>

          <div className="finance-item">
            <div className="finance-icon">=</div>
            <div>
              <span>Net Balance</span>
              <strong>{formatMoney(netBalance)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}