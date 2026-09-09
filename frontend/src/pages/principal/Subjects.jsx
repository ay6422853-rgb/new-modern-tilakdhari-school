import { useEffect, useState } from "react";
import { create, list, remove, update } from "../../api";
import "./Subjects.css";

const initialForm = {
  name: "",
  code: "",
  classIds: [],
  active: true,
};

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);

  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [subjectData, classData] =
        await Promise.all([
          list("principal/subjects"),
          list("principal/classes"),
        ]);

      setSubjects(
        Array.isArray(subjectData)
          ? subjectData
          : []
      );

      setClasses(
        Array.isArray(classData)
          ? classData
          : []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load subjects."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  const toggleClass = (id) => {
    setForm((prev) => ({
      ...prev,
      classIds: prev.classIds.includes(id)
        ? prev.classIds.filter(
            (item) => item !== id
          )
        : [...prev.classIds, id],
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setError("Subject name is required.");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const selectedClasses = classes.filter(
        (item) =>
          form.classIds.includes(item._id)
      );

      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
        classIds: form.classIds,
        classNames: selectedClasses.map(
          (item) => item.name
        ),
        active: form.active,
      };

      if (editingId) {
        await update(
          "principal/subjects",
          editingId,
          payload
        );

        setMessage(
          "Subject updated successfully."
        );
      } else {
        await create(
          "principal/subjects",
          payload
        );

        setMessage(
          "Subject created successfully."
        );
      }

      resetForm();
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save subject."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);

    const classIds = Array.isArray(item.classIds)
      ? item.classIds.map((value) =>
          typeof value === "object"
            ? value._id
            : value
        )
      : [];

    setForm({
      name: item.name || "",
      code: item.code || "",
      classIds,
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
        "Are you sure you want to delete this subject?"
      )
    ) {
      return;
    }

    try {
      setMessage("");
      setError("");

      await remove(
        "principal/subjects",
        id
      );

      setMessage(
        "Subject deleted successfully."
      );

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to delete subject."
      );
    }
  };

  return (
    <div className="subjects-page">
      <div className="subjects-header">
        <div>
          <h2>Subjects</h2>
          <p>
            Create subjects and assign them to classes.
          </p>
        </div>

        <div className="subjects-badge">
          {subjects.length} SUBJECTS
        </div>
      </div>

      {message && (
        <div className="subjects-alert subjects-success">
          <span>✓</span>
          {message}
        </div>
      )}

      {error && (
        <div className="subjects-alert subjects-error">
          <span>!</span>
          {error}
        </div>
      )}

      <div className="subjects-form-card">
        <div className="subjects-card-header">
          <div className="subjects-card-icon">
            📚
          </div>

          <div>
            <h3>
              {editingId
                ? "Edit Subject"
                : "Create New Subject"}
            </h3>

            <p>
              Enter subject information and assign classes.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="subjects-form-grid">
            <div className="subjects-field">
              <label>
                Subject Name <span>*</span>
              </label>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Mathematics"
                required
              />
            </div>

            <div className="subjects-field">
              <label>Subject Code</label>

              <input
                type="text"
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder="e.g. MAT101"
              />
            </div>

            <div className="subjects-field subjects-full">
              <label>Assign to Classes</label>

              <div className="subjects-class-grid">
                {classes.length === 0 ? (
                  <div className="subjects-no-options">
                    No classes available. Create a class
                    first.
                  </div>
                ) : (
                  classes.map((item) => (
                    <label
                      key={item._id}
                      className={`subjects-class-check ${
                        form.classIds.includes(
                          item._id
                        )
                          ? "selected"
                          : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={form.classIds.includes(
                          item._id
                        )}
                        onChange={() =>
                          toggleClass(
                            item._id
                          )
                        }
                      />

                      <span>{item.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="subjects-checkbox">
              <input
                id="subject-active"
                type="checkbox"
                name="active"
                checked={form.active}
                onChange={handleChange}
              />

              <label htmlFor="subject-active">
                Active Subject
              </label>
            </div>
          </div>

          <div className="subjects-actions">
            {editingId && (
              <button
                type="button"
                className="subjects-secondary-btn"
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            )}

            <button
              type="submit"
              className="subjects-primary-btn"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId
                ? "Update Subject"
                : "Create Subject"}
            </button>
          </div>
        </form>
      </div>

      <div className="subjects-table-card">
        <div className="subjects-table-header">
          <div>
            <h3>Subject List</h3>
            <p>
              All subjects configured in the school.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="subjects-empty">
            <div className="subjects-loader"></div>
            Loading subjects...
          </div>
        ) : subjects.length === 0 ? (
          <div className="subjects-empty">
            <div className="subjects-empty-icon">
              📚
            </div>

            <strong>No subjects found</strong>

            <span>
              Create your first subject above.
            </span>
          </div>
        ) : (
          <div className="subjects-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Subject</th>
                  <th>Code</th>
                  <th>Classes</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {subjects.map((item, index) => {
                  const assignedClasses =
                    Array.isArray(item.classIds)
                      ? item.classIds
                      : [];

                  return (
                    <tr key={item._id}>
                      <td className="subjects-index">
                        {index + 1}
                      </td>

                      <td>
                        <strong>
                          {item.name}
                        </strong>
                      </td>

                      <td>
                        {item.code || "—"}
                      </td>

                      <td>
                        <div className="subjects-class-tags">
                          {assignedClasses.length >
                          0 ? (
                            assignedClasses.map(
                              (cls, i) => (
                                <span
                                  key={i}
                                  className="subjects-class-tag"
                                >
                                  {typeof cls ===
                                  "object"
                                    ? cls.name
                                    : cls}
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
                          className={`subjects-status ${
                            item.active
                              ? "subjects-status-active"
                              : "subjects-status-inactive"
                          }`}
                        >
                          <span></span>

                          {item.active
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      <td>
                        <div className="subjects-table-actions">
                          <button
                            type="button"
                            className="subjects-edit-btn"
                            onClick={() =>
                              handleEdit(item)
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="subjects-delete-btn"
                            onClick={() =>
                              handleDelete(
                                item._id
                              )
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}