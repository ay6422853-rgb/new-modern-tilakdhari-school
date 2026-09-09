import { useEffect, useMemo, useState } from "react";
import api from "../../api";
import "./Subjects.css";

const emptyForm = {
  name: "",
  code: "",
  classIds: [],
  classNames: [],
};

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const loadData = async () => {
    try {
      setLoading(true);

      const [subjectsRes, classesRes] = await Promise.all([
        api.get("/operator/subjects"),
        api.get("/operator/classes"),
      ]);

      setSubjects(subjectsRes.data || []);
      setClasses(classesRes.data || []);
    } catch (error) {
      console.error(error);
      alert(
        error?.response?.data?.message ||
          "Subjects load nahi ho paaye."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredSubjects = useMemo(() => {
    return subjects.filter((subject) => {
      const query = search.toLowerCase().trim();

      const matchesSearch =
        !query ||
        subject.name?.toLowerCase().includes(query) ||
        subject.code?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && subject.active !== false) ||
        (statusFilter === "INACTIVE" && subject.active === false);

      return matchesSearch && matchesStatus;
    });
  }, [subjects, search, statusFilter]);

  const openAddModal = () => {
    setEditingSubject(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (subject) => {
    setEditingSubject(subject);

    setForm({
      name: subject.name || "",
      code: subject.code || "",
      classIds: Array.isArray(subject.classIds)
        ? subject.classIds.map((item) =>
            typeof item === "object" ? item._id : item
          )
        : [],
      classNames: Array.isArray(subject.classNames)
        ? subject.classNames
        : [],
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingSubject(null);
    setForm(emptyForm);
  };

  const handleClassToggle = (classId) => {
    setForm((prev) => {
      const exists = prev.classIds.includes(classId);

      const newClassIds = exists
        ? prev.classIds.filter((id) => id !== classId)
        : [...prev.classIds, classId];

      const newClassNames = classes
        .filter((item) => newClassIds.includes(item._id))
        .map((item) => item.name);

      return {
        ...prev,
        classIds: newClassIds,
        classNames: newClassNames,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Subject name required hai.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
        classIds: form.classIds,
        classNames: form.classNames,
      };

      if (editingSubject) {
        await api.put(
          `/operator/subjects/${editingSubject._id}`,
          payload
        );
      } else {
        await api.post("/operator/subjects", payload);
      }

      await loadData();
      closeModal();
    } catch (error) {
      console.error(error);

      alert(
        error?.response?.data?.message ||
          "Subject save nahi ho saka."
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (subject) => {
    try {
      await api.put(`/operator/subjects/${subject._id}`, {
        active: subject.active === false,
      });

      await loadData();
    } catch (error) {
      console.error(error);

      alert(
        error?.response?.data?.message ||
          "Subject status update nahi hua."
      );
    }
  };

  return (
    <div className="operator-page subjects-page">
      <div className="page-header">
        <div>
          <h1>Subjects</h1>
          <p>Manage school subjects and class assignments</p>
        </div>

        <button className="primary-btn" onClick={openAddModal}>
          + Add Subject
        </button>
      </div>

      <div className="subject-stats">
        <div className="subject-stat-card">
          <span>Total Subjects</span>
          <strong>{subjects.length}</strong>
        </div>

        <div className="subject-stat-card">
          <span>Active</span>
          <strong>
            {subjects.filter((item) => item.active !== false).length}
          </strong>
        </div>

        <div className="subject-stat-card">
          <span>Inactive</span>
          <strong>
            {subjects.filter((item) => item.active === false).length}
          </strong>
        </div>

        <div className="subject-stat-card">
          <span>Classes</span>
          <strong>{classes.length}</strong>
        </div>
      </div>

      <div className="subject-toolbar">
        <input
          type="text"
          placeholder="Search subject or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div className="subjects-table-card">
        {loading ? (
          <div className="loading-state">Loading subjects...</div>
        ) : filteredSubjects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3>No subjects found</h3>
            <p>Add your first subject to get started.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Subject</th>
                  <th>Code</th>
                  <th>Classes</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredSubjects.map((subject, index) => {
                  const assignedClasses =
                    Array.isArray(subject.classNames) &&
                    subject.classNames.length
                      ? subject.classNames
                      : Array.isArray(subject.classIds)
                      ? subject.classIds.map((item) =>
                          typeof item === "object"
                            ? item.name
                            : item
                        )
                      : [];

                  return (
                    <tr key={subject._id}>
                      <td>{index + 1}</td>

                      <td>
                        <div className="subject-name">
                          <div className="subject-avatar">
                            {subject.name?.charAt(0)?.toUpperCase()}
                          </div>

                          <strong>{subject.name}</strong>
                        </div>
                      </td>

                      <td>
                        <span className="code-badge">
                          {subject.code || "—"}
                        </span>
                      </td>

                      <td>
                        <div className="class-tags">
                          {assignedClasses.length ? (
                            assignedClasses.map((name, i) => (
                              <span key={i}>{name}</span>
                            ))
                          ) : (
                            <em>All / Not assigned</em>
                          )}
                        </div>
                      </td>

                      <td>
                        <button
                          className={`status-badge ${
                            subject.active === false
                              ? "inactive"
                              : "active"
                          }`}
                          onClick={() => toggleStatus(subject)}
                        >
                          {subject.active === false
                            ? "Inactive"
                            : "Active"}
                        </button>
                      </td>

                      <td>
                        <button
                          className="edit-btn"
                          onClick={() => openEditModal(subject)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onMouseDown={closeModal}>
          <div
            className="modal-box"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>
                  {editingSubject
                    ? "Edit Subject"
                    : "Add Subject"}
                </h2>

                <p>
                  Create and assign a subject to classes
                </p>
              </div>

              <button
                className="modal-close"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Subject Name *</label>

                  <input
                    type="text"
                    value={form.name}
                    placeholder="e.g. Mathematics"
                    onChange={(e) =>
                      setForm({
                        ...form,
                        name: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Subject Code</label>

                  <input
                    type="text"
                    value={form.code}
                    placeholder="e.g. MATH101"
                    onChange={(e) =>
                      setForm({
                        ...form,
                        code: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Assign Classes</label>

                <div className="class-selector">
                  {classes.length === 0 ? (
                    <p>No classes available.</p>
                  ) : (
                    classes.map((item) => {
                      const selected =
                        form.classIds.includes(item._id);

                      return (
                        <label
                          key={item._id}
                          className={`class-option ${
                            selected ? "selected" : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() =>
                              handleClassToggle(item._id)
                            }
                          />

                          <span>
                            Class {item.name}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingSubject
                    ? "Update Subject"
                    : "Create Subject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}