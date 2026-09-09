import React, { useEffect, useMemo, useState } from "react";
import { list } from "../../api";
import "./CashBook.css";

function CashBook() {
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("ALL");
  const [method, setMethod] = useState("ALL");
  const [error, setError] = useState("");

  useEffect(() => {
    loadCashbook();
  }, []);

  const loadCashbook = async () => {
    try {
      setLoading(true);
      setError("");

      const [paymentData, expenseData] = await Promise.all([
        list("principal/payments"),
        list("principal/expenses"),
      ]);

      setPayments(Array.isArray(paymentData) ? paymentData : []);
      setExpenses(Array.isArray(expenseData) ? expenseData : []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load cashbook data."
      );
    } finally {
      setLoading(false);
    }
  };

  const entries = useMemo(() => {
    const incomeEntries = payments.map((item) => ({
      id: `payment-${item._id}`,
      date: item.date,
      receiptNo: item.receiptNo,
      description:
        item.description ||
        `${item.type || "Payment"} received`,
      method: item.method,
      amount: Number(item.amount || 0),
      entryType: "INCOME",
      student: item.student?.name || "-",
    }));

    const expenseEntries = expenses.map((item) => ({
      id: `expense-${item._id}`,
      date: item.date,
      receiptNo: item.voucherNo,
      description:
        item.description ||
        `${item.category || "Expense"}`,
      method: item.method,
      amount: Number(item.amount || 0),
      entryType: "EXPENSE",
      student: "-",
    }));

    return [...incomeEntries, ...expenseEntries]
      .filter((item) => {
        const text = `
          ${item.receiptNo}
          ${item.description}
          ${item.method}
          ${item.student}
        `.toLowerCase();

        const searchMatch = text.includes(search.toLowerCase());

        const typeMatch =
          type === "ALL" || item.entryType === type;

        const methodMatch =
          method === "ALL" || item.method === method;

        return searchMatch && typeMatch && methodMatch;
      })
      .sort(
        (a, b) =>
          new Date(b.date || 0) -
          new Date(a.date || 0)
      );
  }, [payments, expenses, search, type, method]);

  const totalIncome = entries
    .filter((item) => item.entryType === "INCOME")
    .reduce((sum, item) => sum + item.amount, 0);

  const totalExpense = entries
    .filter((item) => item.entryType === "EXPENSE")
    .reduce((sum, item) => sum + item.amount, 0);

  const balance = totalIncome - totalExpense;

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatAmount = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN")}`;

  return (
    <div className="cashbook-page">
      <div className="cashbook-header">
        <div>
          <h1>Cash Book</h1>
          <p>Track school income, expenses and available balance.</p>
        </div>

        <button
          className="cashbook-refresh-btn"
          onClick={loadCashbook}
        >
          ↻ Refresh
        </button>
      </div>

      {error && (
        <div className="cashbook-error">
          {error}
        </div>
      )}

      <div className="cashbook-summary">
        <div className="cashbook-card income">
          <span>Total Income</span>
          <strong>{formatAmount(totalIncome)}</strong>
        </div>

        <div className="cashbook-card expense">
          <span>Total Expense</span>
          <strong>{formatAmount(totalExpense)}</strong>
        </div>

        <div className="cashbook-card balance">
          <span>Net Balance</span>
          <strong>{formatAmount(balance)}</strong>
        </div>

        <div className="cashbook-card entries">
          <span>Total Entries</span>
          <strong>{entries.length}</strong>
        </div>
      </div>

      <div className="cashbook-toolbar">
        <input
          type="text"
          placeholder="Search receipt, student, description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="ALL">All Types</option>
          <option value="INCOME">Income</option>
          <option value="EXPENSE">Expense</option>
        </select>

        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
        >
          <option value="ALL">All Methods</option>
          <option value="CASH">Cash</option>
          <option value="UPI">UPI</option>
          <option value="CARD">Card</option>
          <option value="BANK">Bank</option>
          <option value="CHEQUE">Cheque</option>
        </select>
      </div>

      <div className="cashbook-table-card">
        <div className="cashbook-table-header">
          <h2>Transaction Ledger</h2>
          <span>{entries.length} entries</span>
        </div>

        {loading ? (
          <div className="cashbook-empty">
            Loading cashbook...
          </div>
        ) : entries.length === 0 ? (
          <div className="cashbook-empty">
            No cashbook entries found.
          </div>
        ) : (
          <div className="cashbook-table-wrapper">
            <table className="cashbook-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Receipt / Voucher</th>
                  <th>Description</th>
                  <th>Student</th>
                  <th>Method</th>
                  <th>Type</th>
                  <th>Amount</th>
                </tr>
              </thead>

              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{formatDate(entry.date)}</td>

                    <td>
                      <strong>{entry.receiptNo || "-"}</strong>
                    </td>

                    <td>{entry.description}</td>

                    <td>{entry.student}</td>

                    <td>
                      <span className="cashbook-method">
                        {entry.method || "-"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`cashbook-type ${entry.entryType.toLowerCase()}`}
                      >
                        {entry.entryType}
                      </span>
                    </td>

                    <td
                      className={
                        entry.entryType === "INCOME"
                          ? "cashbook-income-amount"
                          : "cashbook-expense-amount"
                      }
                    >
                      {entry.entryType === "INCOME"
                        ? "+"
                        : "-"}
                      {formatAmount(entry.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default CashBook;