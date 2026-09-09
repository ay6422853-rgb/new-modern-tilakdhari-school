import React, { useEffect, useState } from "react";
import { financeReport } from "../../api";
import "./Reports.css";

const money = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default function Reports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const data = await financeReport();
      setReport(data);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Financial report load nahi hui."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="reports-page">
        <div className="reports-loading">
          Loading financial report...
        </div>
      </div>
    );
  }

  return (
    <div className="reports-page">
      <div className="reports-head">
        <div>
          <span>ACCOUNTANT</span>
          <h1>Financial Reports</h1>
          <p>School income and expense overview.</p>
        </div>

        <button onClick={load}>↻ Refresh</button>
      </div>

      {error && <div className="report-error">{error}</div>}

      <div className="report-summary">
        <div>
          <span>Total Income</span>
          <strong>
            {money(report?.totalIncome)}
          </strong>
        </div>

        <div>
          <span>Total Expense</span>
          <strong>
            {money(report?.totalExpense)}
          </strong>
        </div>

        <div>
          <span>Net Balance</span>
          <strong>
            {money(report?.netBalance)}
          </strong>
        </div>
      </div>

      <div className="report-columns">
        <div className="report-card">
          <h2>Income by Type</h2>

          {report?.income?.length ? (
            report.income.map((item) => (
              <div className="report-row" key={item._id}>
                <span>{item._id}</span>
                <b>{money(item.total)}</b>
              </div>
            ))
          ) : (
            <p className="report-empty">No income data.</p>
          )}
        </div>

        <div className="report-card">
          <h2>Expenses by Category</h2>

          {report?.expenses?.length ? (
            report.expenses.map((item) => (
              <div className="report-row" key={item._id}>
                <span>{item._id}</span>
                <b>{money(item.total)}</b>
              </div>
            ))
          ) : (
            <p className="report-empty">No expense data.</p>
          )}
        </div>
      </div>
    </div>
  );
}