
import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  create,
  list,
} from "../../api";

import "./Expenses.css";

const initial = {
  category: "",
  description: "",
  amount: "",
  method: "CASH",
};

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

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getMonthKey = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
};

const getMonthName = (monthKey) => {
  if (!monthKey) return "-";

  const [year, month] =
    monthKey.split("-");

  const date = new Date(
    Number(year),
    Number(month) - 1,
    1
  );

  return date.toLocaleDateString(
    "en-IN",
    {
      month: "long",
      year: "numeric",
    }
  );
};

const getDateValue = (value) => {
  if (!value) return 0;

  const time = new Date(value).getTime();

  return Number.isNaN(time)
    ? 0
    : time;
};

export default function Expenses() {
  const [form, setForm] =
    useState(initial);

  const [expenses, setExpenses] =
    useState([]);

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [loadingList, setLoadingList] =
    useState(true);

  const [sortBy, setSortBy] =
    useState("latest");

  const [monthFilter, setMonthFilter] =
    useState("ALL");

  /*
  ==========================================
  LOAD EXPENSES
  ==========================================
  */

  const load = async () => {
    try {
      setLoadingList(true);
      setError("");

      const data =
        await list(
          "accountant/expenses"
        );

      /*
      Backend response:

      {
        success: true,
        expenses: [...]
      }
      */

      const expenseList =
        Array.isArray(
          data?.expenses
        )
          ? data.expenses
          : Array.isArray(data)
          ? data
          : [];

      setExpenses(expenseList);
    } catch (err) {
      console.error(
        "Expenses load error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Expenses load nahi ho sake."
      );
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /*
  ==========================================
  FORM CHANGE
  ==========================================
  */

  const change = (e) => {
    setForm({
      ...form,
      [e.target.name]:
        e.target.value,
    });
  };

  /*
  ==========================================
  ADD EXPENSE
  ==========================================
  */

  const submit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      await create(
        "accountant/expenses",
        {
          ...form,
          amount: Number(
            form.amount
          ),
        }
      );

      setForm(initial);

      await load();
    } catch (err) {
      console.error(
        "Expense save error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Expense save nahi hua."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  ==========================================
  MONTH LIST
  ==========================================
  */

  const months = useMemo(() => {
    const monthSet =
      new Set();

    expenses.forEach(
      (expense) => {
        const key =
          getMonthKey(
            expense?.date
          );

        if (key) {
          monthSet.add(key);
        }
      }
    );

    return Array.from(
      monthSet
    ).sort((a, b) =>
      b.localeCompare(a)
    );
  }, [expenses]);

  /*
  ==========================================
  SUMMARY
  ==========================================
  */

  const summary = useMemo(() => {
    const today =
      new Date();

    let total = 0;
    let todayTotal = 0;
    let monthTotal = 0;

    const currentMonth =
      `${today.getFullYear()}-${String(
        today.getMonth() + 1
      ).padStart(2, "0")}`;

    expenses.forEach(
      (expense) => {
        const amount =
          Number(
            expense?.amount || 0
          );

        total += amount;

        const date =
          new Date(
            expense?.date
          );

        if (
          !Number.isNaN(
            date.getTime()
          )
        ) {
          if (
            date.getFullYear() ===
              today.getFullYear() &&
            date.getMonth() ===
              today.getMonth() &&
            date.getDate() ===
              today.getDate()
          ) {
            todayTotal += amount;
          }
        }

        if (
          getMonthKey(
            expense?.date
          ) === currentMonth
        ) {
          monthTotal += amount;
        }
      }
    );

    return {
      total,
      todayTotal,
      monthTotal,
    };
  }, [expenses]);

  /*
  ==========================================
  FILTER + SORT
  ==========================================
  */

  const filteredExpenses =
    useMemo(() => {
      let data = [...expenses];

      if (
        monthFilter !== "ALL"
      ) {
        data = data.filter(
          (expense) =>
            getMonthKey(
              expense?.date
            ) === monthFilter
        );
      }

      data.sort(
        (a, b) => {
          if (
            sortBy === "latest"
          ) {
            return (
              getDateValue(
                b?.date
              ) -
              getDateValue(
                a?.date
              )
            );
          }

          if (
            sortBy === "oldest"
          ) {
            return (
              getDateValue(
                a?.date
              ) -
              getDateValue(
                b?.date
              )
            );
          }

          if (
            sortBy === "highest"
          ) {
            return (
              Number(
                b?.amount || 0
              ) -
              Number(
                a?.amount || 0
              )
            );
          }

          if (
            sortBy === "lowest"
          ) {
            return (
              Number(
                a?.amount || 0
              ) -
              Number(
                b?.amount || 0
              )
            );
          }

          return 0;
        }
      );

      return data;
    }, [
      expenses,
      monthFilter,
      sortBy,
    ]);

  /*
  ==========================================
  FILTERED TOTAL
  ==========================================
  */

  const filteredTotal =
    useMemo(() => {
      return filteredExpenses.reduce(
        (sum, expense) =>
          sum +
          Number(
            expense?.amount || 0
          ),
        0
      );
    }, [filteredExpenses]);

  return (
    <div className="expenses-page">
      {/* =========================
          HEADER
      ========================== */}

      <div className="expenses-head">
        <span>ACCOUNTANT</span>

        <h1>Expenses</h1>

        <p>
          Record and manage school
          expenses.
        </p>
      </div>

      {error && (
        <div className="expense-error">
          {error}
        </div>
      )}

      {/* =========================
          SUMMARY
      ========================== */}

      <div className="expense-summary">
        <div className="expense-summary-card">
          <span>Total Expenses</span>

          <strong>
            {formatMoney(
              summary.total
            )}
          </strong>

          <small>
            All recorded expenses
          </small>
        </div>

        <div className="expense-summary-card">
          <span>This Month</span>

          <strong>
            {formatMoney(
              summary.monthTotal
            )}
          </strong>

          <small>
            Current month expense
          </small>
        </div>

        <div className="expense-summary-card">
          <span>Today</span>

          <strong>
            {formatMoney(
              summary.todayTotal
            )}
          </strong>

          <small>
            Today's expense
          </small>
        </div>

        <div className="expense-summary-card">
          <span>Showing</span>

          <strong>
            {formatMoney(
              filteredTotal
            )}
          </strong>

          <small>
            Filtered expenses
          </small>
        </div>
      </div>

      {/* =========================
          RECORD EXPENSE
      ========================== */}

      <form
        className="expense-form"
        onSubmit={submit}
      >
        <h2>
          Record Expense
        </h2>

        <div className="expense-grid">
          <label>
            Category *

            <input
              name="category"
              value={
                form.category
              }
              onChange={change}
              required
              placeholder="e.g. Electricity"
            />
          </label>

          <label>
            Amount *

            <input
              type="number"
              min="0"
              name="amount"
              value={
                form.amount
              }
              onChange={change}
              required
              placeholder="₹ Amount"
            />
          </label>

          <label>
            Payment Method

            <select
              name="method"
              value={
                form.method
              }
              onChange={change}
            >
              <option value="CASH">
                Cash
              </option>

              <option value="UPI">
                UPI
              </option>

              <option value="CARD">
                Card
              </option>

              <option value="BANK">
                Bank
              </option>

              <option value="CHEQUE">
                Cheque
              </option>
            </select>
          </label>

          <label>
            Description

            <input
              name="description"
              value={
                form.description
              }
              onChange={change}
              placeholder="Expense description"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Saving..."
            : "Record Expense"}
        </button>
      </form>

      {/* =========================
          EXPENSE HISTORY
      ========================== */}

      <div className="expense-list">
        <div className="expense-list-head">
          <div>
            <h2>
              Expense History
            </h2>

            <p>
              Month-wise expense
              records.
            </p>
          </div>

          <div className="expense-controls">
            <select
              value={
                monthFilter
              }
              onChange={(e) =>
                setMonthFilter(
                  e.target.value
                )
              }
            >
              <option value="ALL">
                All Months
              </option>

              {months.map(
                (month) => (
                  <option
                    key={month}
                    value={month}
                  >
                    {getMonthName(
                      month
                    )}
                  </option>
                )
              )}
            </select>

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value
                )
              }
            >
              <option value="latest">
                Latest First
              </option>

              <option value="oldest">
                Oldest First
              </option>

              <option value="highest">
                Highest Amount
              </option>

              <option value="lowest">
                Lowest Amount
              </option>
            </select>

            <button
              type="button"
              onClick={load}
              disabled={
                loadingList
              }
            >
              {loadingList
                ? "Loading..."
                : "↻ Refresh"}
            </button>
          </div>
        </div>

        <div className="expense-filter-total">
          <span>
            Showing{" "}
            <strong>
              {
                filteredExpenses.length
              }
            </strong>{" "}
            expense records
          </span>

          <strong>
            Total:{" "}
            {formatMoney(
              filteredTotal
            )}
          </strong>
        </div>

        <div className="expense-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Voucher</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Date</th>
                <th>Time</th>
              </tr>
            </thead>

            <tbody>
              {loadingList ? (
                <tr>
                  <td
                    colSpan="7"
                    className="empty-expense"
                  >
                    Loading expenses...
                  </td>
                </tr>
              ) : filteredExpenses.length ===
                0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="empty-expense"
                  >
                    No expenses found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(
                  (expense) => (
                    <tr
                      key={
                        expense?._id
                      }
                    >
                      <td>
                        {expense?.voucherNo ||
                          "-"}
                      </td>

                      <td>
                        <b>
                          {
                            expense?.category
                          }
                        </b>
                      </td>

                      <td>
                        {
                          expense?.description ||
                          "-"
                        }
                      </td>

                      <td>
                        <strong>
                          {formatMoney(
                            expense?.amount
                          )}
                        </strong>
                      </td>

                      <td>
                        {expense?.method ||
                          "-"}
                      </td>

                      <td>
                        {formatDate(
                          expense?.date
                        )}
                      </td>

                      <td>
                        {formatTime(
                          expense?.date
                        )}
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
