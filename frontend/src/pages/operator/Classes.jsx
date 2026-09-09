import { useEffect, useState } from "react";
import api from "../../api";
import "./Classes.css";

const emptyForm = {
  name: "",
  classCode: "",
  sections: [],
  session: "",
  classTeacher: "",
};

function Classes() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [classRes, teacherRes] = await Promise.all([
        api.get("/operator/classes"),
        api.get("/operator/teachers"),
      ]);

      setClasses(classRes.data || []);
      setTeachers(teacherRes.data || []);
    } catch (error) {
      console.error("Classes loading error:", error);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      sections: [],
    });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingId(item._id);

    setForm({
      name: item.name || "",
      classCode: item.classCode || "",
      sections: Array.isArray(item.sections)
        ? item.sections
        : item.section
        ? [item.section]
        : [],
      session: item.session || "",
      classTeacher:
        item.classTeacher?._id ||
        item.classTeacher ||
        "",
    });

    setShowModal(true);
  };

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSectionsChange = (e) => {
    const sections = e.target.value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    setForm((prev) => ({
      ...prev,
      sections,
    }));
  };

  const saveClass = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        classCode: form.classCode.trim(),
        sections: form.sections,
        classTeacher: form.classTeacher || null,
      };

      // Session tabhi bhejenge agar value di gayi ho
      if (form.session.trim()) {
        payload.session = form.session.trim();
      }

      if (editingId) {
        await api.put(
          `/operator/classes/${editingId}`,
          payload
        );
      } else {
        await api.post(
          "/operator/classes",
          payload
        );
      }

      setShowModal(false);
      setEditingId(null);
      setForm({
        ...emptyForm,
        sections: [],
      });

      await loadData();
    } catch (error) {
      console.error("Class save error:", error);

      alert(
        error?.response?.data?.message ||
          "Unable to save class"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="operator-classes">
      <div className="classes-header">
        <div>
          <h1>Classes</h1>
          <p>
            Manage classes, sections and class teachers.
          </p>
        </div>

        <button
          className="class-primary-btn"
          onClick={openAddModal}
        >
          + Add Class
        </button>
      </div>

      {loading ? (
        <div className="classes-loading">
          Loading classes...
        </div>
      ) : classes.length === 0 ? (
        <div className="classes-empty">
          <div>🏫</div>

          <h3>No classes found</h3>

          <p>
            Create your first class to get started.
          </p>

          <button
            className="class-primary-btn"
            onClick={openAddModal}
          >
            + Add Class
          </button>
        </div>
      ) : (
        <div className="classes-grid">
          {classes.map((item) => (
            <div
              className="class-card"
              key={item._id}
            >
              <div className="class-card-top">
                <div className="class-icon">
                  🏫
                </div>

                <button
                  className="class-edit-btn"
                  onClick={() =>
                    openEditModal(item)
                  }
                >
                  Edit
                </button>
              </div>

              <h2>
                {item.name || "Class"}
              </h2>

              <div className="class-details">
                {/* Sections */}
                <div>
                  <span>Sections</span>

                  <strong>
                    {item.sections?.length
                      ? item.sections
                          .join(", ")
                          .toUpperCase()
                      : "-"}
                  </strong>
                </div>

                {/* Class Code */}
                <div>
                  <span>Class Code</span>

                  <strong>
                    {item.classCode || "-"}
                  </strong>
                </div>

                {/* Session */}
                <div>
                  <span>Session</span>

                  <strong>
                    {item.session || "-"}
                  </strong>
                </div>

                {/* Class Teacher */}
                <div>
                  <span>Class Teacher</span>

                  <strong>
                    {item.classTeacher?.name ||
                      "Not assigned"}
                  </strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div
          className="class-modal-overlay"
          onMouseDown={() =>
            setShowModal(false)
          }
        >
          <div
            className="class-modal"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >
            <div className="class-modal-header">
              <div>
                <h2>
                  {editingId
                    ? "Edit Class"
                    : "Add Class"}
                </h2>

                <p>
                  Enter class and section
                  information.
                </p>
              </div>

              <button
                className="class-close-btn"
                onClick={() =>
                  setShowModal(false)
                }
              >
                ×
              </button>
            </div>

            <form onSubmit={saveClass}>
              {/* Class Name */}
              <div className="class-form-group">
                <label>
                  Class Name *
                </label>

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Example: 11"
                  required
                />
              </div>

              {/* Class Code */}
              <div className="class-form-group">
                <label>
                  Class Code
                </label>

                <input
                  name="classCode"
                  value={form.classCode}
                  onChange={handleChange}
                  placeholder="Example: 11A"
                />
              </div>

              {/* Sections */}
              <div className="class-form-group">
                <label>
                  Sections
                </label>

                <input
                  name="sections"
                  value={form.sections.join(", ")}
                  onChange={handleSectionsChange}
                  placeholder="Example: A, B, C"
                />

                <small>
                  Multiple sections ke liye comma
                  use karein. Example: A, B, C
                </small>
              </div>

              {/* Session */}
              <div className="class-form-group">
                <label>
                  Session
                </label>

                <input
                  name="session"
                  value={form.session}
                  onChange={handleChange}
                  placeholder="Example: 2026-27"
                />
              </div>

              {/* Class Teacher */}
              <div className="class-form-group">
                <label>
                  Class Teacher
                </label>

                <select
                  name="classTeacher"
                  value={form.classTeacher}
                  onChange={handleChange}
                >
                  <option value="">
                    Select Class Teacher
                  </option>

                  {teachers.map((teacher) => (
                    <option
                      key={teacher._id}
                      value={teacher._id}
                    >
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Footer */}
              <div className="class-modal-footer">
                <button
                  type="button"
                  className="class-cancel-btn"
                  onClick={() =>
                    setShowModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="class-primary-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Class"
                    : "Save Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Classes;