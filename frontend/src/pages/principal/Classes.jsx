import { useEffect, useState } from "react";
import { create, list, remove, update } from "../../api";
import "./Classes.css";

const initialForm = {
  name: "",
  classCode: "",
  sections: "",
  active: true,
};

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState(initialForm);

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);

      const data = await list("principal/classes");

      setClasses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load classes."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        name: form.name.trim(),
        classCode: form.classCode.trim(),
        sections: form.sections
          .split(",")
          .map((section) => section.trim())
          .filter(Boolean),
        active: form.active,
      };

      if (editingId) {
        await update(
          "principal/classes",
          editingId,
          payload
        );

        setMessage("Class updated successfully.");
      } else {
        await create(
          "principal/classes",
          payload
        );

        setMessage("Class created successfully.");
      }

      resetForm();
      await loadClasses();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save class."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);

    setForm({
      name: item.name || "",
      classCode: item.classCode || "",
      sections: Array.isArray(item.sections)
        ? item.sections.join(", ")
        : "",
      active: item.active !== false,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this class?"
      )
    ) {
      return;
    }

    try {
      setMessage("");
      setError("");

      await remove("principal/classes", id);

      setMessage("Class deleted successfully.");

      await loadClasses();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to delete class."
      );
    }
  };

  return (
    <div className="classes-page">
      <div className="classes-header">
        <div>
          <h2>Classes & Sections</h2>
          <p>
            Create and manage school classes and sections.
          </p>
        </div>

        <div className="classes-badge">
          {classes.length} CLASSES
        </div>
      </div>

      {message && (
        <div className="classes-alert classes-success">
          <span>✓</span>
          {message}
        </div>
      )}

      {error && (
        <div className="classes-alert classes-error">
          <span>!</span>
          {error}
        </div>
      )}

      <div className="classes-form-card">
        <div className="classes-card-header">
          <div className="classes-card-icon">🏫</div>

          <div>
            <h3>
              {editingId
                ? "Edit Class"
                : "Create New Class"}
            </h3>

            <p>
              Add class name, code and sections.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="classes-form-grid">
            <div className="classes-field">
              <label>
                Class Name <span>*</span>
              </label>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Class 10"
                required
              />
            </div>

            <div className="classes-field">
              <label>Class Code</label>

              <input
                type="text"
                name="classCode"
                value={form.classCode}
                onChange={handleChange}
                placeholder="e.g. CLS10"
              />
            </div>

            <div className="classes-field classes-full">
              <label>Sections</label>

              <input
                type="text"
                name="sections"
                value={form.sections}
                onChange={handleChange}
                placeholder="e.g. A, B, C"
              />

              <small>
                Enter sections separated by commas.
              </small>
            </div>

            <div className="classes-checkbox">
              <input
                id="classes-active"
                type="checkbox"
                name="active"
                checked={form.active}
                onChange={handleChange}
              />

              <label htmlFor="classes-active">
                Active Class
              </label>
            </div>
          </div>

          <div className="classes-actions">
            {editingId && (
              <button
                type="button"
                className="classes-secondary-btn"
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            )}

            <button
              type="submit"
              className="classes-primary-btn"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId
                ? "Update Class"
                : "Create Class"}
            </button>
          </div>
        </form>
      </div>

      <div className="classes-table-card">
        <div className="classes-table-header">
          <div>
            <h3>All Classes</h3>
            <p>Manage existing classes.</p>
          </div>
        </div>

        {loading ? (
          <div className="classes-empty">
            <div className="classes-loader"></div>
            Loading classes...
          </div>
        ) : classes.length === 0 ? (
          <div className="classes-empty">
            <div className="classes-empty-icon">🏫</div>
            <strong>No classes found</strong>
            <span>
              Create your first class above.
            </span>
          </div>
        ) : (
          <div className="classes-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Class</th>
                  <th>Code</th>
                  <th>Sections</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {classes.map((item, index) => (
                  <tr key={item._id}>
                    <td className="classes-index">
                      {index + 1}
                    </td>

                    <td>
                      <strong>{item.name}</strong>
                    </td>

                    <td>
                      {item.classCode || "—"}
                    </td>

                    <td>
                      <div className="classes-section-tags">
                        {Array.isArray(item.sections) &&
                        item.sections.length > 0 ? (
                          item.sections.map(
                            (section, i) => (
                              <span
                                key={i}
                                className="classes-section-tag"
                              >
                                {section}
                              </span>
                            )
                          )
                        ) : (
                          "—"
                        )}
                      </div>
                    </td>

                    <td>
                      <span
                        className={`classes-status ${
                          item.active
                            ? "classes-status-active"
                            : "classes-status-inactive"
                        }`}
                      >
                        <span></span>
                        {item.active
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <div className="classes-table-actions">
                        <button
                          type="button"
                          className="classes-edit-btn"
                          onClick={() =>
                            handleEdit(item)
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="classes-delete-btn"
                          onClick={() =>
                            handleDelete(item._id)
                          }
                        >
                          Delete
                        </button>
                      </div>
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