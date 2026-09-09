import React, { useEffect, useState } from "react";
import { create, list } from "../../api";
import "./Payments.css";

const empty = {
  student: "",
  type: "TUITION",
  amount: "",
  method: "CASH",
  description: "",
};

const money = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

export default function Payments() {
  const [form, setForm] = useState(empty);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const data = await list("accountant/payments");
      setPayments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Payments load nahi ho sake."
      );
    }
  };

  useEffect(() => {
    load();
  }, []);

  const change = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await create("accountant/payments", {
        ...form,
        amount: Number(form.amount),
      });

      setForm(empty);
      await load();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Payment collect nahi ho saka."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payments-page">
      <div className="payments-head">
        <div>
          <span>ACCOUNTANT</span>
          <h1>Fee Collection</h1>
          <p>Collect and manage student payments.</p>
        </div>
      </div>

      {error && <div className="payment-error">{error}</div>}

      <form className="payment-form" onSubmit={submit}>
        <h2>Collect Fee</h2>

        <div className="payment-grid">
          <label>
            Student ID *
            <input
              name="student"
              value={form.student}
              onChange={change}
              required
              placeholder="Student MongoDB ID"
            />
          </label>

          <label>
            Fee Type
            <select
              name="type"
              value={form.type}
              onChange={change}
            >
              <option value="REGISTRATION">Registration</option>
              <option value="ADMISSION">Admission</option>
              <option value="TUITION">Tuition</option>
              <option value="TRANSPORT">Transport</option>
              <option value="EXAM">Exam</option>
              <option value="OTHER">Other</option>
              <option value="REFUND">Refund</option>
            </select>
          </label>

          <label>
            Amount *
            <input
              type="number"
              min="0"
              name="amount"
              value={form.amount}
              onChange={change}
              required
              placeholder="₹ Amount"
            />
          </label>

          <label>
            Payment Method
            <select
              name="method"
              value={form.method}
              onChange={change}
            >
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
              <option value="BANK">Bank</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </label>

          <label className="payment-full">
            Description
            <input
              name="description"
              value={form.description}
              onChange={change}
              placeholder="Payment description"
            />
          </label>
        </div>

        <button disabled={loading}>
          {loading ? "Collecting..." : "Collect Fee"}
        </button>
      </form>

      <div className="payments-table-card">
        <div className="table-title">
          <h2>Payment History</h2>
          <button onClick={load}>↻ Refresh</button>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Receipt</th>
                <th>Student</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-row">
                    No payments found
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <b>{p.receiptNo}</b>
                    </td>
                    <td>
                      {p.student?.name || p.student?._id || "-"}
                    </td>
                    <td>
                      <span className="payment-badge">
                        {p.type}
                      </span>
                    </td>
                    <td>{money(p.amount)}</td>
                    <td>{p.method}</td>
                    <td>
                      {p.date
                        ? new Date(p.date).toLocaleDateString("en-IN")
                        : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}