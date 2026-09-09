import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../api";
import "./Teachers.css";

const initialForm = {
  name: "",
  employeeId: "",
  phone: "",
  email: "",
  qualification: "",
  subjects: [],
  classes: [],
  joiningDate: "",
};

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [teacherRes, subjectRes, classRes] =
        await Promise.all([
          api.get("/principal/teachers"),
          api.get("/principal/subjects"),
          api.get("/principal/classes"),
        ]);

      setTeachers(teacherRes.data || []);
      setSubjects(subjectRes.data || []);
      setClasses(classRes.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load teachers."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredTeachers = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return teachers;

    return teachers.filter((teacher) =>
      [
        teacher.name,
        teacher.employeeId,
        teacher.phone,
        teacher.email,
        teacher.qualification,
      ]
        .filter(Boolean)
        .some((field) =>
          String(field).toLowerCase().includes(value)
        )
    );
  }, [teachers, search]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleMultiSelect = (name, value) => {
    setForm((previous) => {
      const current = previous[name];

      return {
        ...previous,
        [name]: current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value],
      };
    });
  };

  const openForm = () => {
    setForm(initialForm);
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setForm(initialForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setError("Teacher name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        name: form.name,
        employeeId: form.employeeId,
        phone: form.phone,
        email: form.email,
        qualification: form.qualification,
        subjects: form.subjects,
        classes: form.classes,
        joiningDate: form.joiningDate || undefined,
      };

      const response = await api.post(
        "/principal/teachers",
        payload
      );

      setSuccess(
        response.data?.message ||
          "Teacher created successfully."
      );

      setForm(initialForm);
      setShowForm(false);

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to create teacher."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="principal-teachers">
      <div className="teachers-header">
        <div>
          <span>STAFF MANAGEMENT</span>
          <h1>Teachers</h1>
          <p>Manage teaching staff and their assignments.</p>
        </div>

        <button
          className="teachers-add-btn"
          onClick={openForm}
        >
          + Add Teacher
        </button>
      </div>

      {error && (
        <div className="teachers-alert error">
          <span>{error}</span>
          <button onClick={() => setError("")}>×</button>
        </div>
      )}

      {success && (
        <div className="teachers-alert success">
          <span>✓ {success}</span>
          <button onClick={() => setSuccess("")}>×</button>
        </div>
      )}

      <div className="teachers-toolbar">
        <div className="teachers-search">
          <span>⌕</span>

          <input
            type="text"
            placeholder="Search teacher, employee ID, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <span className="teachers-total">
          {filteredTeachers.length} Teachers
        </span>

        <button
          className="teachers-refresh"
          onClick={loadData}
        >
          ↻ Refresh
        </button>
      </div>

      {loading ? (
        <div className="teachers-loading">
          <div className="teachers-spinner"></div>
          <p>Loading teachers...</p>
        </div>
      ) : (
        <div className="teachers-table-card">
          <div className="teachers-table-wrapper">
            <table className="teachers-table">
              <thead>
                <tr>
                  <th>Teacher</th>
                  <th>Employee ID</th>
                  <th>Qualification</th>
                  <th>Subjects</th>
                  <th>Classes</th>
                  <th>Phone</th>
                  <th>Email</th>
                </tr>
              </thead>

              <tbody>
                {filteredTeachers.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="teachers-empty"
                    >
                      No teachers found.
                    </td>
                  </tr>
                ) : (
                  filteredTeachers.map((teacher) => (
                    <tr key={teacher._id}>
                      <td>
                        <div className="teacher-name-cell">
                          <div className="teacher-avatar">
                            {teacher.name
                              ?.charAt(0)
                              ?.toUpperCase() || "T"}
                          </div>

                          <div>
                            <strong>{teacher.name}</strong>

                            <small>
                              {teacher.joiningDate
                                ? new Date(
                                    teacher.joiningDate
                                  ).toLocaleDateString("en-IN")
                                : "Joining date not set"}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>
                        {teacher.employeeId || "—"}
                      </td>

                      <td>
                        {teacher.qualification || "—"}
                      </td>

                      <td>
                        <div className="teacher-tags">
                          {(teacher.subjects || []).length
                            ? teacher.subjects.map((subject) => (
                                <span key={subject._id}>
                                  {subject.name || subject}
                                </span>
                              ))
                            : "—"}
                        </div>
                      </td>

                      <td>
                        <div className="teacher-tags">
                          {(teacher.classes || []).length
                            ? teacher.classes.map((classItem) => (
                                <span key={classItem._id}>
                                  {classItem.name || classItem}
                                </span>
                              ))
                            : "—"}
                        </div>
                      </td>

                      <td>{teacher.phone || "—"}</td>

                      <td>{teacher.email || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <div className="teachers-modal-backdrop">
          <div className="teachers-modal">
            <div className="teachers-modal-header">
              <div>
                <span>STAFF RECORD</span>
                <h2>Add Teacher</h2>
              </div>

              <button
                className="teachers-close"
                onClick={closeForm}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="teacher-form-grid">
                <div className="teacher-field">
                  <label>Teacher Name *</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Teacher name"
                    required
                  />
                </div>

                <div className="teacher-field">
                  <label>Employee ID</label>
                  <input
                    name="employeeId"
                    value={form.employeeId}
                    onChange={handleChange}
                    placeholder="EMP-001"
                  />
                </div>

                <div className="teacher-field">
                  <label>Phone</label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Phone number"
                  />
                </div>

                <div className="teacher-field">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Email address"
                  />
                </div>

                <div className="teacher-field">
                  <label>Qualification</label>
                  <input
                    name="qualification"
                    value={form.qualification}
                    onChange={handleChange}
                    placeholder="M.Com, B.Ed..."
                  />
                </div>

                <div className="teacher-field">
                  <label>Joining Date</label>
                  <input
                    type="date"
                    name="joiningDate"
                    value={form.joiningDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="teacher-field full">
                  <label>Subjects</label>

                  <div className="multi-select-box">
                    {subjects.length === 0 ? (
                      <span className="no-options">
                        No subjects available.
                      </span>
                    ) : (
                      subjects.map((subject) => (
                        <label
                          className="multi-option"
                          key={subject._id}
                        >
                          <input
                            type="checkbox"
                            checked={form.subjects.includes(
                              subject._id
                            )}
                            onChange={() =>
                              handleMultiSelect(
                                "subjects",
                                subject._id
                              )
                            }
                          />
                          <span>
                            {subject.name}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <div className="teacher-field full">
                  <label>Classes</label>

                  <div className="multi-select-box">
                    {classes.length === 0 ? (
                      <span className="no-options">
                        No classes available.
                      </span>
                    ) : (
                      classes.map((classItem) => (
                        <label
                          className="multi-option"
                          key={classItem._id}
                        >
                          <input
                            type="checkbox"
                            checked={form.classes.includes(
                              classItem._id
                            )}
                            onChange={() =>
                              handleMultiSelect(
                                "classes",
                                classItem._id
                              )
                            }
                          />
                          <span>
                            {classItem.name}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="teacher-form-footer">
                <button
                  type="button"
                  className="teacher-cancel"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="teacher-save"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Create Teacher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}