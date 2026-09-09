import React, { useEffect, useMemo, useState } from "react";
import { list } from "../../api";
import "./Reports.css";

function Reports() {
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        studentData,
        teacherData,
        paymentData,
        expenseData,
      ] = await Promise.all([
        list("principal/students"),
        list("principal/teachers"),
        list("principal/payments"),
        list("principal/expenses"),
      ]);

      setStudents(Array.isArray(studentData) ? studentData : []);
      setTeachers(Array.isArray(teacherData) ? teacherData : []);
      setPayments(Array.isArray(paymentData) ? paymentData : []);
      setExpenses(Array.isArray(expenseData) ? expenseData : []);

      // Registration records are not exposed by the current
      // principal backend GET API.
      setRegistrations([]);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load reports."
      );
    } finally {
      setLoading(false);
    }
  };

  const totalCollection = useMemo(
    () =>
      payments.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      ),
    [payments]
  );

  const totalExpense = useMemo(
    () =>
      expenses.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      ),
    [expenses]
  );

  const netBalance = totalCollection - totalExpense;

  const paymentByType = useMemo(() => {
    const result = {};

    payments.forEach((item) => {
      const key = item.type || "OTHER";
      result[key] =
        (result[key] || 0) + Number(item.amount || 0);
    });

    return Object.entries(result).sort(
      (a, b) => b[1] - a[1]
    );
  }, [payments]);

  const expenseByCategory = useMemo(() => {
    const result = {};

    expenses.forEach((item) => {
      const key = item.category || "OTHER";
      result[key] =
        (result[key] || 0) + Number(item.amount || 0);
    });

    return Object.entries(result).sort(
      (a, b) => b[1] - a[1]
    );
  }, [expenses]);

  const formatAmount = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN")}`;

  return (
    <div className="reports-page">
      <div className="reports-header">
        <div>
          <h1>Reports</h1>
          <p>
            Overview of school students, staff and financial
            activity.
          </p>
        </div>

        <button
          className="reports-refresh-btn"
          onClick={loadReports}
        >
          ↻ Refresh
        </button>
      </div>

      {error && (
        <div className="reports-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="reports-loading">
          Loading reports...
        </div>
      ) : (
        <>
          <div className="reports-summary">
            <div className="report-stat">
              <span>Total Students</span>
              <strong>{students.length}</strong>
            </div>

            <div className="report-stat">
              <span>Total Teachers</span>
              <strong>{teachers.length}</strong>
            </div>

            <div className="report-stat">
              <span>Total Collection</span>
              <strong>{formatAmount(totalCollection)}</strong>
            </div>

            <div className="report-stat">
              <span>Total Expense</span>
              <strong>{formatAmount(totalExpense)}</strong>
            </div>

            <div className="report-stat">
              <span>Net Balance</span>
              <strong>{formatAmount(netBalance)}</strong>
            </div>

            <div className="report-stat">
              <span>Transactions</span>
              <strong>
                {payments.length + expenses.length}
              </strong>
            </div>
          </div>

          <div className="reports-grid">
            <section className="report-panel">
              <div className="report-panel-header">
                <h2>Collection by Fee Type</h2>
              </div>

              {paymentByType.length === 0 ? (
                <div className="report-empty">
                  No payment data available.
                </div>
              ) : (
                <div className="report-list">
                  {paymentByType.map(
                    ([type, amount]) => (
                      <div
                        className="report-row"
                        key={type}
                      >
                        <span>{type}</span>
                        <strong>
                          {formatAmount(amount)}
                        </strong>
                      </div>
                    )
                  )}
                </div>
              )}
            </section>

            <section className="report-panel">
              <div className="report-panel-header">
                <h2>Expenses by Category</h2>
              </div>

              {expenseByCategory.length === 0 ? (
                <div className="report-empty">
                  No expense data available.
                </div>
              ) : (
                <div className="report-list">
                  {expenseByCategory.map(
                    ([category, amount]) => (
                      <div
                        className="report-row"
                        key={category}
                      >
                        <span>{category}</span>
                        <strong>
                          {formatAmount(amount)}
                        </strong>
                      </div>
                    )
                  )}
                </div>
              )}
            </section>
          </div>

          <section className="report-panel report-info-panel">
            <div className="report-panel-header">
              <h2>Report Information</h2>
            </div>

            <div className="report-info-grid">
              <div>
                <span>Students</span>
                <strong>
                  {students.length}
                </strong>
              </div>

              <div>
                <span>Teachers</span>
                <strong>
                  {teachers.length}
                </strong>
              </div>

              <div>
                <span>Payment Entries</span>
                <strong>
                  {payments.length}
                </strong>
              </div>

              <div>
                <span>Expense Entries</span>
                <strong>
                  {expenses.length}
                </strong>
              </div>
            </div>
          </section>
        </>
      )}

      <div className="reports-note">
        <strong>Note:</strong> These reports use the data
        currently exposed by the Principal APIs. Registration
        and Admission listing APIs are not currently available
        in the backend, so no dummy figures are shown for them.
      </div>
    </div>
  );
}

export default Reports;