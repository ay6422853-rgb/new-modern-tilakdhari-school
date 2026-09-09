import React, { useEffect, useMemo, useState } from "react";
import { create, list, update } from "../../api";
import "./FeeStructure.css";

const FREQUENCIES = [
  "ONE_TIME",
  "MONTHLY",
  "QUARTERLY",
  "HALF_YEARLY",
  "YEARLY",
];

function FeeStructure() {
  const [fees, setFees] = useState([]);
  const [classes, setClasses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [sessionFilter, setSessionFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState("newest");

  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    classId: "",
    session: "",
    active: true,
    items: [
      {
        name: "",
        amount: "",
        frequency: "MONTHLY",
      },
    ],
  });

  const loadData = async () => {
    try {
      setLoading(true);

      const [feeData, classData] = await Promise.all([
        list("principal/fee-structures"),
        list("principal/classes"),
      ]);

      setFees(Array.isArray(feeData) ? feeData : []);
      setClasses(Array.isArray(classData) ? classData : []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Fee structures load nahi ho sake."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const sessions = useMemo(
    () =>
      [...new Set(
        fees
          .map((fee) => fee.session)
          .filter(Boolean)
      )].sort(),
    [fees]
  );

  const filteredFees = useMemo(() => {
    let data = [...fees];
    const q = search.trim().toLowerCase();

    if (q) {
      data = data.filter(
        (fee) =>
          String(fee.className || "").toLowerCase().includes(q) ||
          String(fee.session || "").toLowerCase().includes(q)
      );
    }

    if (sessionFilter) {
      data = data.filter((fee) => fee.session === sessionFilter);
    }

    if (classFilter) {
      data = data.filter(
        (fee) => String(fee.classId?._id || fee.classId) === classFilter
      );
    }

    if (statusFilter) {
      data = data.filter((fee) =>
        statusFilter === "ACTIVE" ? fee.active !== false : fee.active === false
      );
    }

    data.sort((a, b) => {
      if (sort === "classAZ") {
        return String(a.className || "").localeCompare(
          String(b.className || "")
        );
      }

      const da = new Date(a.createdAt || 0);
      const db = new Date(b.createdAt || 0);

      return sort === "oldest" ? da - db : db - da;
    });

    return data;
  }, [
    fees,
    search,
    sessionFilter,
    classFilter,
    statusFilter,
    sort,
  ]);

  const getClassName = (fee) => {
    if (fee.className) return fee.className;

    if (fee.classId && typeof fee.classId === "object") {
      return fee.classId.name || "-";
    }

    return (
      classes.find((c) => String(c._id) === String(fee.classId))?.name ||
      "-"
    );
  };

  const resetForm = () => {
    setForm({
      classId: "",
      session: "",
      active: true,
      items: [
        {
          name: "",
          amount: "",
          frequency: "MONTHLY",
        },
      ],
    });

    setEditingId(null);
  };

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          name: "",
          amount: "",
          frequency: "MONTHLY",
        },
      ],
    }));
  };

  const removeItem = (index) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      ),
    }));
  };

  const submitFee = async (e) => {
    e.preventDefault();

    const selectedClass = classes.find(
      (c) => String(c._id) === String(form.classId)
    );

    if (!form.classId || !form.session.trim()) {
      setError("Class aur session required hai.");
      return;
    }

    if (
      form.items.some(
        (item) =>
          !item.name.trim() ||
          !item.amount ||
          Number(item.amount) < 0
      )
    ) {
      setError("Har fee item ka name aur valid amount required hai.");
      return;
    }

    const payload = {
      classId: form.classId,
      className: selectedClass?.name || "",
      session: form.session.trim(),
      active: form.active,
      items: form.items.map((item) => ({
        name: item.name.trim(),
        amount: Number(item.amount),
        frequency: item.frequency,
      })),
    };

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (editingId) {
        const result = await update(
          "principal/fee-structures",
          editingId,
          payload
        );

        const updated = result.fee || result;

        setFees((prev) =>
          prev.map((fee) =>
            fee._id === editingId ? updated : fee
          )
        );

        setSuccess("Fee structure updated successfully.");
      } else {
        const result = await create(
          "principal/fee-structures",
          payload
        );

        setFees((prev) => [
          result.fee || result,
          ...prev,
        ]);

        setSuccess("Fee structure created successfully.");
      }

      resetForm();
      setShowForm(false);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Fee structure save nahi ho saka."
      );
    } finally {
      setSaving(false);
    }
  };

  const editFee = (fee) => {
    setEditingId(fee._id);

    setForm({
      classId:
        typeof fee.classId === "object"
          ? fee.classId._id
          : fee.classId || "",
      session: fee.session || "",
      active: fee.active !== false,
      items: (fee.items || []).map((item) => ({
        name: item.name || "",
        amount: item.amount ?? "",
        frequency: item.frequency || "MONTHLY",
      })),
    });

    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalFee = (fee) =>
    (fee.items || []).reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

  return (
    <div className="fees-page">
      <div className="fees-header">
        <div>
          <h1>Fee Structure</h1>
          <p>Class aur session ke according school fees manage karein.</p>
        </div>

        <button
          className="fees-primary-btn"
          onClick={() => {
            if (showForm) {
              resetForm();
            }
            setShowForm(!showForm);
            setError("");
            setSuccess("");
          }}
        >
          {showForm ? "Close Form" : "+ Add Fee Structure"}
        </button>
      </div>

      {error && <div className="fees-alert error">{error}</div>}
      {success && <div className="fees-alert success">{success}</div>}

      {showForm && (
        <form className="fees-form" onSubmit={submitFee}>
          <div className="fees-form-head">
            <h2>
              {editingId ? "Edit Fee Structure" : "New Fee Structure"}
            </h2>
          </div>

          <div className="fees-top-grid">
            <div className="fees-field">
              <label>Class *</label>
              <select
                value={form.classId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    classId: e.target.value,
                  })
                }
              >
                <option value="">Select Class</option>
                {classes.map((classroom) => (
                  <option key={classroom._id} value={classroom._id}>
                    {classroom.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="fees-field">
              <label>Session *</label>
              <input
                value={form.session}
                onChange={(e) =>
                  setForm({
                    ...form,
                    session: e.target.value,
                  })
                }
                placeholder="2026-27"
              />
            </div>

            <label className="fees-active">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) =>
                  setForm({
                    ...form,
                    active: e.target.checked,
                  })
                }
              />
              Active
            </label>
          </div>

          <div className="fees-items-head">
            <h3>Fee Items</h3>
            <button
              type="button"
              className="fees-add-item"
              onClick={addItem}
            >
              + Add Item
            </button>
          </div>

          {form.items.map((item, index) => (
            <div className="fees-item-row" key={index}>
              <input
                placeholder="Fee name e.g. Tuition Fee"
                value={item.name}
                onChange={(e) =>
                  updateItem(index, "name", e.target.value)
                }
              />

              <input
                type="number"
                min="0"
                placeholder="Amount"
                value={item.amount}
                onChange={(e) =>
                  updateItem(index, "amount", e.target.value)
                }
              />

              <select
                value={item.frequency}
                onChange={(e) =>
                  updateItem(index, "frequency", e.target.value)
                }
              >
                {FREQUENCIES.map((frequency) => (
                  <option key={frequency}>{frequency}</option>
                ))}
              </select>

              {form.items.length > 1 && (
                <button
                  type="button"
                  className="fees-remove-item"
                  onClick={() => removeItem(index)}
                >
                  ×
                </button>
              )}
            </div>
          ))}

          <button
            className="fees-submit-btn"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : editingId
              ? "Update Fee Structure"
              : "Save Fee Structure"}
          </button>
        </form>
      )}

      <div className="fees-filters">
        <input
          placeholder="Search class / session..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={sessionFilter}
          onChange={(e) => setSessionFilter(e.target.value)}
        >
          <option value="">All Sessions</option>
          {sessions.map((session) => (
            <option key={session}>{session}</option>
          ))}
        </select>

        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
        >
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="classAZ">Class A → Z</option>
        </select>
      </div>

      <div className="fees-table-wrap">
        {loading ? (
          <div className="fees-state">Loading fee structures...</div>
        ) : filteredFees.length === 0 ? (
          <div className="fees-state">No fee structures found.</div>
        ) : (
          <table className="fees-table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Session</th>
                <th>Fee Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredFees.map((fee) => (
                <tr key={fee._id}>
                  <td>
                    <strong>{getClassName(fee)}</strong>
                  </td>

                  <td>{fee.session || "-"}</td>

                  <td>
                    <div className="fees-items-list">
                      {(fee.items || []).map((item, index) => (
                        <div key={index}>
                          {item.name} — ₹
                          {Number(item.amount || 0).toLocaleString("en-IN")}
                          <small> ({item.frequency})</small>
                        </div>
                      ))}
                    </div>
                  </td>

                  <td>
                    <strong>
                      ₹{totalFee(fee).toLocaleString("en-IN")}
                    </strong>
                  </td>

                  <td>
                    <span
                      className={
                        fee.active !== false
                          ? "fees-status active"
                          : "fees-status inactive"
                      }
                    >
                      {fee.active !== false ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>

                  <td>
                    <button
                      className="fees-edit-btn"
                      onClick={() => editFee(fee)}
                    >
                      Edit
                    </button>
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

export default FeeStructure;