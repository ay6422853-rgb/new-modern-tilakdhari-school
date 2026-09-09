
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  roleDashboard,
  accountantPayments,
  accountantExpenses,
} from "../../api";

import "./Dashboard.css";

const formatMoney = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
};

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getDateValue = (value) => {
  if (!value) return 0;

  const time = new Date(value).getTime();

  return Number.isNaN(time) ? 0 : time;
};

const getMonthKey = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
};

const getMonthName = (monthKey) => {
  if (!monthKey) return "-";

  const [year, month] = monthKey.split("-");

  const date = new Date(
    Number(year),
    Number(month) - 1,
    1
  );

  return date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState({
    students: 0,
    registrations: 0,
    admissions: 0,
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  });

  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [sortBy, setSortBy] = useState("latest");

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [
        dashboardResult,
        paymentResult,
        expenseResult,
      ] = await Promise.all([
        roleDashboard("ACCOUNTANT"),
        accountantPayments(),
        accountantExpenses(),
      ]);

      setDashboardData({
        students: Number(dashboardResult?.students) || 0,
        registrations:
          Number(dashboardResult?.registrations) || 0,
        admissions:
          Number(dashboardResult?.admissions) || 0,
        totalIncome:
          Number(dashboardResult?.totalIncome) || 0,
        totalExpense:
          Number(dashboardResult?.totalExpense) || 0,
        balance:
          Number(dashboardResult?.balance) || 0,
      });

      const paymentList =
        Array.isArray(paymentResult?.payments)
          ? paymentResult.payments
          : Array.isArray(paymentResult)
          ? paymentResult
          : [];

      setPayments(paymentList);

      const expenseList =
        Array.isArray(expenseResult?.expenses)
          ? expenseResult.expenses
          : Array.isArray(expenseResult)
          ? expenseResult
          : [];

      setExpenses(expenseList);
    } catch (err) {
      console.error(
        "Accountant dashboard error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Dashboard data load nahi ho saka."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  /*
  ==========================================
  TODAY'S CALCULATION
  ==========================================
  */

  const todayStats = useMemo(() => {
    const today = new Date();

    const year = today.getFullYear();
    const month = today.getMonth();
    const dateNumber = today.getDate();

    let collection = 0;
    let expense = 0;

    let paymentCount = 0;
    let expenseCount = 0;

    payments.forEach((payment) => {
      if (
        String(payment?.type || "").toUpperCase() ===
        "REFUND"
      ) {
        return;
      }

      const date = new Date(payment?.date);

      if (
        date.getFullYear() === year &&
        date.getMonth() === month &&
        date.getDate() === dateNumber
      ) {
        collection += Number(payment?.amount || 0);
        paymentCount++;
      }
    });

    expenses.forEach((item) => {
      const date = new Date(item?.date);

      if (
        date.getFullYear() === year &&
        date.getMonth() === month &&
        date.getDate() === dateNumber
      ) {
        expense += Number(item?.amount || 0);
        expenseCount++;
      }
    });

    return {
      collection,
      expense,
      balance: collection - expense,
      paymentCount,
      expenseCount,
    };
  }, [payments, expenses]);

  /*
  ==========================================
  MONTH WISE FINANCE
  ==========================================
  */

  const monthlyFinance = useMemo(() => {
    const monthMap = {};

    payments.forEach((payment) => {
      if (
        String(payment?.type || "").toUpperCase() ===
        "REFUND"
      ) {
        return;
      }

      const monthKey = getMonthKey(payment?.date);

      if (!monthKey) return;

      if (!monthMap[monthKey]) {
        monthMap[monthKey] = {
          monthKey,
          income: 0,
          expense: 0,
          balance: 0,
          incomeCount: 0,
          expenseCount: 0,
        };
      }

      monthMap[monthKey].income += Number(
        payment?.amount || 0
      );

      monthMap[monthKey].incomeCount++;
    });

    expenses.forEach((expense) => {
      const monthKey = getMonthKey(expense?.date);

      if (!monthKey) return;

      if (!monthMap[monthKey]) {
        monthMap[monthKey] = {
          monthKey,
          income: 0,
          expense: 0,
          balance: 0,
          incomeCount: 0,
          expenseCount: 0,
        };
      }

      monthMap[monthKey].expense += Number(
        expense?.amount || 0
      );

      monthMap[monthKey].expenseCount++;
    });

    Object.values(monthMap).forEach((item) => {
      item.balance = item.income - item.expense;
    });

    return Object.values(monthMap).sort((a, b) => {
      if (sortBy === "latest") {
        return (
          b.monthKey.localeCompare(a.monthKey)
        );
      }

      if (sortBy === "oldest") {
        return (
          a.monthKey.localeCompare(b.monthKey)
        );
      }

      if (sortBy === "highest-income") {
        return b.income - a.income;
      }

      if (sortBy === "highest-expense") {
        return b.expense - a.expense;
      }

      if (sortBy === "highest-balance") {
        return b.balance - a.balance;
      }

      return 0;
    });
  }, [payments, expenses, sortBy]);

  /*
  ==========================================
  RECENT TRANSACTIONS
  ==========================================
  */

  const transactions = useMemo(() => {
    const paymentTransactions = payments.map(
      (payment) => ({
        id: `payment-${payment?._id}`,

        type:
          String(
            payment?.type || "PAYMENT"
          ).toUpperCase() === "REFUND"
            ? "REFUND"
            : "INCOME",

        title:
          payment?.student?.name ||
          "Student Payment",

        description:
          payment?.type || "Payment",

        amount: Number(
          payment?.amount || 0
        ),

        method:
          payment?.method || "-",

        date: payment?.date,

        receipt:
          payment?.receiptNo || "-",
      })
    );

    const expenseTransactions = expenses.map(
      (expense) => ({
        id: `expense-${expense?._id}`,

        type: "EXPENSE",

        title:
          expense?.category ||
          "Expense",

        description:
          expense?.description ||
          "School Expense",

        amount: Number(
          expense?.amount || 0
        ),

        method:
          expense?.method || "-",

        date: expense?.date,

        receipt:
          expense?.voucherNo || "-",
      })
    );

    return [
      ...paymentTransactions,
      ...expenseTransactions,
    ].sort((a, b) => {
      return (
        getDateValue(b.date) -
        getDateValue(a.date)
      );
    });
  }, [payments, expenses]);

  const recentTransactions =
    transactions.slice(0, 10);

  return (
    <div className="accountant-dashboard">
      <div className="dashboard-header">
        <div>
          <span className="dashboard-role">
            ACCOUNTANT
          </span>

          <h1>Accountant Dashboard</h1>

          <p>
            School income, expenses and financial
            overview.
          </p>
        </div>

        <button
          className="refresh-btn"
          onClick={loadDashboard}
          disabled={loading}
        >
          {loading ? "Loading..." : "↻ Refresh"}
        </button>
      </div>

      {error && (
        <div className="dashboard-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="dashboard-loading">
          Loading dashboard...
        </div>
      ) : (
        <>
          {/* =========================
              MAIN STATS
          ========================== */}

          <div className="dashboard-stats">
            <div className="dashboard-card">
              <span>Total Students</span>
              <strong>
                {dashboardData.students}
              </strong>
              <small>
                Active students
              </small>
            </div>

            <div className="dashboard-card">
              <span>Registrations</span>
              <strong>
                {dashboardData.registrations}
              </strong>
              <small>
                Registration records
              </small>
            </div>

            <div className="dashboard-card">
              <span>Admissions</span>
              <strong>
                {dashboardData.admissions}
              </strong>
              <small>
                Admission records
              </small>
            </div>

            <div className="dashboard-card income">
              <span>Total Income</span>
              <strong>
                {formatMoney(
                  dashboardData.totalIncome
                )}
              </strong>
              <small>
                All collections
              </small>
            </div>

            <div className="dashboard-card expense">
              <span>Total Expense</span>
              <strong>
                {formatMoney(
                  dashboardData.totalExpense
                )}
              </strong>
              <small>
                All expenses
              </small>
            </div>

            <div className="dashboard-card balance">
              <span>Available Balance</span>
              <strong>
                {formatMoney(
                  dashboardData.balance
                )}
              </strong>
              <small>
                Income − Expense
              </small>
            </div>
          </div>

          {/* =========================
              TODAY
          ========================== */}

          <section className="today-section">
            <div className="section-heading">
              <div>
                <h2>Today's Finance</h2>
                <p>
                  Today's income, expenses and
                  balance.
                </p>
              </div>
            </div>

            <div className="today-grid">
              <div className="today-card">
                <span>Today's Income</span>

                <strong>
                  {formatMoney(
                    todayStats.collection
                  )}
                </strong>

                <small>
                  {todayStats.paymentCount} payment
                  {todayStats.paymentCount !== 1
                    ? "s"
                    : ""}
                </small>
              </div>

              <div className="today-card">
                <span>Today's Expense</span>

                <strong>
                  {formatMoney(
                    todayStats.expense
                  )}
                </strong>

                <small>
                  {todayStats.expenseCount} expense
                  {todayStats.expenseCount !== 1
                    ? "s"
                    : ""}
                </small>
              </div>

              <div className="today-card">
                <span>Today's Balance</span>

                <strong>
                  {formatMoney(
                    todayStats.balance
                  )}
                </strong>

                <small>
                  Income − Expense
                </small>
              </div>
            </div>
          </section>

          {/* =========================
              MONTHLY FINANCE
          ========================== */}

          <section className="monthly-section">
            <div className="section-heading monthly-heading">
              <div>
                <h2>Month Wise Finance</h2>

                <p>
                  Month-wise income, expense and
                  balance.
                </p>
              </div>

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value)
                }
                className="sort-select"
              >
                <option value="latest">
                  Latest Month
                </option>

                <option value="oldest">
                  Oldest Month
                </option>

                <option value="highest-income">
                  Highest Income
                </option>

                <option value="highest-expense">
                  Highest Expense
                </option>

                <option value="highest-balance">
                  Highest Balance
                </option>
              </select>
            </div>

            <div className="monthly-table-wrap">
              <table className="monthly-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Income</th>
                    <th>Expense</th>
                    <th>Balance</th>
                    <th>Income Entries</th>
                    <th>Expense Entries</th>
                  </tr>
                </thead>

                <tbody>
                  {monthlyFinance.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="empty-row"
                      >
                        No monthly finance data found.
                      </td>
                    </tr>
                  ) : (
                    monthlyFinance.map(
                      (item) => (
                        <tr
                          key={
                            item.monthKey
                          }
                        >
                          <td>
                            <strong>
                              {getMonthName(
                                item.monthKey
                              )}
                            </strong>
                          </td>

                          <td className="income-text">
                            +{" "}
                            {formatMoney(
                              item.income
                            )}
                          </td>

                          <td className="expense-text">
                            -{" "}
                            {formatMoney(
                              item.expense
                            )}
                          </td>

                          <td
                            className={
                              item.balance >=
                              0
                                ? "balance-text"
                                : "negative-balance"
                            }
                          >
                            {formatMoney(
                              item.balance
                            )}
                          </td>

                          <td>
                            {
                              item.incomeCount
                            }
                          </td>

                          <td>
                            {
                              item.expenseCount
                            }
                          </td>
                        </tr>
                      )
                    )
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* =========================
              RECENT TRANSACTIONS
          ========================== */}

          <section className="transactions-section">
            <div className="section-heading">
              <div>
                <h2>
                  Recent Transactions
                </h2>

                <p>
                  Latest income and expenses.
                </p>
              </div>
            </div>

            <div className="transaction-table-wrap">
              <table className="transaction-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Details</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Reference</th>
                  </tr>
                </thead>

                <tbody>
                  {recentTransactions.length ===
                  0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="empty-row"
                      >
                        No transactions found.
                      </td>
                    </tr>
                  ) : (
                    recentTransactions.map(
                      (item) => (
                        <tr key={item.id}>
                          <td>
                            <span
                              className={`transaction-badge ${item.type.toLowerCase()}`}
                            >
                              {item.type}
                            </span>
                          </td>

                          <td>
                            <strong>
                              {item.title}
                            </strong>

                            <small>
                              {
                                item.description
                              }
                            </small>
                          </td>

                          <td>
                            <strong>
                              {formatMoney(
                                item.amount
                              )}
                            </strong>
                          </td>

                          <td>
                            {item.method}
                          </td>

                          <td>
                            {formatDate(
                              item.date
                            )}
                          </td>

                          <td>
                            {formatTime(
                              item.date
                            )}
                          </td>

                          <td>
                            {item.receipt}
                          </td>
                        </tr>
                      )
                    )
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* =========================
              CALCULATION
          ========================== */}

          <section className="calculation-card">
            <div>
              <span>Total Income</span>
              <strong>
                {formatMoney(
                  dashboardData.totalIncome
                )}
              </strong>
            </div>

            <div>
              <span>Total Expenses</span>
              <strong>
                {formatMoney(
                  dashboardData.totalExpense
                )}
              </strong>
            </div>

            <div>
              <span>Balance</span>
              <strong>
                {formatMoney(
                  dashboardData.balance
                )}
              </strong>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
