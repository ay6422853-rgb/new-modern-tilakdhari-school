import React, { useEffect, useMemo, useState } from "react";
import { create, list } from "../../api";
import "./Payments.css";

const PAYMENT_TYPES = [
  "REGISTRATION",
  "ADMISSION",
  "TUITION",
  "TRANSPORT",
  "EXAM",
  "OTHER",
  "REFUND",
];

const METHODS = ["CASH", "UPI", "CARD", "BANK", "CHEQUE"];

function Payments() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState("newest");

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    student: "",
    type: "TUITION",
    amount: "",
    method: "CASH",
    date: new Date().toISOString().slice(0, 10),
    description: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [paymentData, studentData] = await Promise.all([
        list("principal/payments"),
        list("principal/students"),
      ]);

      setPayments(Array.isArray(paymentData) ? paymentData : []);
      setStudents(Array.isArray(studentData) ? studentData : []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Payments data load nahi ho saka."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getStudentName = (payment) => {
    if (!payment.student) return "-";

    if (typeof payment.student === "object") {
      return payment.student.name || "-";
    }

    const student = students.find(
      (s) => String(s._id) === String(payment.student)
    );

    return student?.name || "-";
  };

  const filteredPayments = useMemo(() => {
    let data = [...payments];

    const query = search.trim().toLowerCase();

    if (query) {
      data = data.filter((p) => {
        const studentName = getStudentName(p).toLowerCase();

        return (
          studentName.includes(query) ||
          String(p.receiptNo || "").toLowerCase().includes(query) ||
          String(p.description || "").toLowerCase().includes(query)
        );
      });
    }

    if (typeFilter) {
      data = data.filter((p) => p.type === typeFilter);
    }

    if (methodFilter) {
      data = data.filter((p) => p.method === methodFilter);
    }

    if (dateFrom) {
      data = data.filter(
        (p) => new Date(p.date) >= new Date(`${dateFrom}T00:00:00`)
      );
    }

    if (dateTo) {
      data = data.filter(
        (p) => new Date(p.date) <= new Date(`${dateTo}T23:59:59`)
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
    payments,
    students,
    search,
    typeFilter,
    methodFilter,
    dateFrom,
    dateTo,
    sort,
  ]);

  const totalCollection = useMemo(
    () =>
      filteredPayments.reduce(
        (sum, payment) => sum + Number(payment.amount || 0),
        0
      ),
    [filteredPayments]
  );

  const todayCollection = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);

    return payments
      .filter(
        (p) => new Date(p.date).toISOString().slice(0, 10) === today
      )
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [payments]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const submitPayment = async (e) => {
    e.preventDefault();

    if (!form.student || !form.amount || Number(form.amount) <= 0) {
      setError("Student aur valid amount required hai.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const result = await create("principal/payments", {
        student: form.student,
        type: form.type,
        amount: Number(form.amount),
        method: form.method,
        date: form.date,
        description: form.description.trim(),
      });

      setPayments((prev) => [result.payment || result, ...prev]);

      setSuccess(
        `Payment recorded successfully. Receipt: ${
          result.payment?.receiptNo || "Generated"
        }`
      );

      setForm({
        student: "",
        type: "TUITION",
        amount: "",
        method: "CASH",
        date: new Date().toISOString().slice(0, 10),
        description: "",
      });

      setShowForm(false);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Payment save nahi ho saka."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="payments-page">
      <div className="payments-header">
        <div>
          <h1>Payments</h1>
          <p>School fee collection aur payment records manage karein.</p>
        </div>

        <button
          className="payments-primary-btn"
          onClick={() => {
            setShowForm(!showForm);
            setError("");
            setSuccess("");
          }}
        >
          {showForm ? "Close Form" : "+ Record Payment"}
        </button>
      </div>

      {error && <div className="payments-alert error">{error}</div>}
      {success && <div className="payments-alert success">{success}</div>}

      <div className="payments-summary">
        <div className="payments-card">
          <span>Today's Collection</span>
          <strong>₹{todayCollection.toLocaleString("en-IN")}</strong>
        </div>

        <div className="payments-card">
          <span>Filtered Collection</span>
          <strong>₹{totalCollection.toLocaleString("en-IN")}</strong>
        </div>

        <div className="payments-card">
          <span>Transactions</span>
          <strong>{filteredPayments.length}</strong>
        </div>

        <div className="payments-card">
          <span>Total Records</span>
          <strong>{payments.length}</strong>
        </div>
      </div>

      {showForm && (
        <form className="payments-form" onSubmit={submitPayment}>
          <div className="payments-form-title">
            <h2>Record New Payment</h2>
          </div>

          <div className="payments-grid">
            <div className="payments-field">
              <label>Student *</label>
              <select
                name="student"
                value={form.student}
                onChange={handleChange}
              >
                <option value="">Select Student</option>
                {students.map((student) => (
                  <option key={student._id} value={student._id}>
                    {student.name}
                    {student.studentId
                      ? ` (${student.studentId})`
                      : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="payments-field">
              <label>Payment Type *</label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
              >
                {PAYMENT_TYPES.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="payments-field">
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

            <div className="payments-field">
              <label>Payment Method *</label>
              <select
                name="method"
                value={form.method}
                onChange={handleChange}
              >
                {METHODS.map((method) => (
                  <option key={method}>{method}</option>
                ))}
              </select>
            </div>

            <div className="payments-field">
              <label>Date *</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
              />
            </div>

            <div className="payments-field">
              <label>Description</label>
              <input
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Optional description"
              />
            </div>
          </div>

          <button
            className="payments-submit-btn"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Payment"}
          </button>
        </form>
      )}

      <div className="payments-filters">
        <input
          placeholder="Search student / receipt..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All Types</option>
          {PAYMENT_TYPES.map((type) => (
            <option key={type}>{type}</option>
          ))}
        </select>

        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
        >
          <option value="">All Methods</option>
          {METHODS.map((method) => (
            <option key={method}>{method}</option>
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

      <div className="payments-table-wrap">
        {loading ? (
          <div className="payments-state">Loading payments...</div>
        ) : filteredPayments.length === 0 ? (
          <div className="payments-state">No payment records found.</div>
        ) : (
          <table className="payments-table">
            <thead>
              <tr>
                <th>Receipt</th>
                <th>Date</th>
                <th>Student</th>
                <th>Type</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Description</th>
              </tr>
            </thead>

            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment._id}>
                  <td>
                    <strong>{payment.receiptNo || "-"}</strong>
                  </td>
                  <td>
                    {payment.date
                      ? new Date(payment.date).toLocaleDateString("en-IN")
                      : "-"}
                  </td>
                  <td>{getStudentName(payment)}</td>
                  <td>
                    <span className="payments-badge">
                      {payment.type}
                    </span>
                  </td>
                  <td>{payment.method}</td>
                  <td>
                    <strong>
                      ₹{Number(payment.amount || 0).toLocaleString("en-IN")}
                    </strong>
                  </td>
                  <td>{payment.description || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Payments;