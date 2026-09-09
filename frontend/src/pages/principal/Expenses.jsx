import React, { useEffect, useMemo, useState } from "react";
import { create, list } from "../../api";
import "./Expenses.css";

const METHODS = ["CASH", "UPI", "CARD", "BANK", "CHEQUE"];

function Expenses() {
  const [expenses, setExpenses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [method, setMethod] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState("newest");

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    category: "",
    description: "",
    amount: "",
    method: "CASH",
    date: new Date().toISOString().slice(0, 10),
  });

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const data = await list("principal/expenses");
      setExpenses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Expenses load nahi ho sake."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const categories = useMemo(
    () =>
      [...new Set(
        expenses
          .map((e) => e.category)
          .filter(Boolean)
      )].sort(),
    [expenses]
  );

  const filteredExpenses = useMemo(() => {
    let data = [...expenses];
    const q = search.trim().toLowerCase();

    if (q) {
      data = data.filter(
        (e) =>
          String(e.voucherNo || "").toLowerCase().includes(q) ||
          String(e.category || "").toLowerCase().includes(q) ||
          String(e.description || "").toLowerCase().includes(q)
      );
    }

    if (category) {
      data = data.filter((e) => e.category === category);
    }

    if (method) {
      data = data.filter((e) => e.method === method);
    }

    if (dateFrom) {
      data = data.filter(
        (e) => new Date(e.date) >= new Date(`${dateFrom}T00:00:00`)
      );
    }

    if (dateTo) {
      data = data.filter(
        (e) => new Date(e.date) <= new Date(`${dateTo}T23:59:59`)
      );
    }

    data.sort((a, b) => {
      if (sort === "amountHigh") return Number(b.amount) - Number(a.amount);
      if (sort === "amountLow") return Number(a.amount) - Number(b.amount);

      const da = new Date(a.date || 0);
      const db = new Date(b.date || 0);

      return sort === "oldest" ? da - db : db - da;
    });

    return data;
  }, [
    expenses,
    search,
    category,
    method,
    dateFrom,
    dateTo,
    sort,
  ]);

  const totalExpense = filteredExpenses.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const todayExpense = expenses
    .filter(
      (e) =>
        new Date(e.date).toISOString().slice(0, 10) ===
        new Date().toISOString().slice(0, 10)
    )
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const submitExpense = async (e) => {
    e.preventDefault();

    if (!form.category.trim() || !form.amount || Number(form.amount) <= 0) {
      setError("Category aur valid amount required hai.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const result = await create("principal/expenses", {
        category: form.category.trim(),
        description: form.description.trim(),
        amount: Number(form.amount),
        method: form.method,
        date: form.date,
      });

      setExpenses((prev) => [result.expense || result, ...prev]);

      setSuccess(
        `Expense recorded successfully. Voucher: ${
          result.expense?.voucherNo || "Generated"
        }`
      );

      setForm({
        category: "",
        description: "",
        amount: "",
        method: "CASH",
        date: new Date().toISOString().slice(0, 10),
      });

      setShowForm(false);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Expense save nahi ho saka."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="expenses-page">
      <div className="expenses-header">
        <div>
          <h1>Expenses</h1>
          <p>School ke saare expenses aur vouchers manage karein.</p>
        </div>

        <button
          className="expenses-primary-btn"
          onClick={() => {
            setShowForm(!showForm);
            setError("");
            setSuccess("");
          }}
        >
          {showForm ? "Close Form" : "+ Add Expense"}
        </button>
      </div>

      {error && <div className="expenses-alert error">{error}</div>}
      {success && <div className="expenses-alert success">{success}</div>}

      <div className="expenses-summary">
        <div>
          <span>Today's Expense</span>
          <strong>₹{todayExpense.toLocaleString("en-IN")}</strong>
        </div>

        <div>
          <span>Filtered Expense</span>
          <strong>₹{totalExpense.toLocaleString("en-IN")}</strong>
        </div>

        <div>
          <span>Transactions</span>
          <strong>{filteredExpenses.length}</strong>
        </div>

        <div>
          <span>Total Records</span>
          <strong>{expenses.length}</strong>
        </div>
      </div>

      {showForm && (
        <form className="expenses-form" onSubmit={submitExpense}>
          <h2>Record Expense</h2>

          <div className="expenses-grid">
            <div className="expenses-field">
              <label>Category *</label>
              <input
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="Salary, Electricity, Stationery..."
              />
            </div>

            <div className="expenses-field">
              <label>Description</label>
              <input
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Expense details"
              />
            </div>

            <div className="expenses-field">
              <label>Amount *</label>
              <input
                type="number"
                min="1"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                placeholder="Enter amount"
              />
            </div>

            <div className="expenses-field">
              <label>Payment Method *</label>
              <select
                name="method"
                value={form.method}
                onChange={handleChange}
              >
                {METHODS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="expenses-field">
              <label>Date *</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            className="expenses-submit-btn"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Expense"}
          </button>
        </form>
      )}

      <div className="expenses-filters">
        <input
          placeholder="Search voucher / category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
        >
          <option value="">All Methods</option>
          {METHODS.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />

        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
        />

        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="amountHigh">Amount High → Low</option>
          <option value="amountLow">Amount Low → High</option>
        </select>
      </div>

      <div className="expenses-table-wrap">
        {loading ? (
          <div className="expenses-state">Loading expenses...</div>
        ) : filteredExpenses.length === 0 ? (
          <div className="expenses-state">No expenses found.</div>
        ) : (
          <table className="expenses-table">
            <thead>
              <tr>
                <th>Voucher</th>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Method</th>
                <th>Amount</th>
              </tr>
            </thead>

            <tbody>
              {filteredExpenses.map((expense) => (
                <tr key={expense._id}>
                  <td>
                    <strong>{expense.voucherNo || "-"}</strong>
                  </td>
                  <td>
                    {expense.date
                      ? new Date(expense.date).toLocaleDateString("en-IN")
                      : "-"}
                  </td>
                  <td>{expense.category}</td>
                  <td>{expense.description || "-"}</td>
                  <td>{expense.method}</td>
                  <td>
                    <strong>
                      ₹{Number(expense.amount || 0).toLocaleString("en-IN")}
                    </strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Expenses;