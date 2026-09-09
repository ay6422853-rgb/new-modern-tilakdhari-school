import { useEffect, useMemo, useState } from "react";
import api from "../../api";
import "./Students.css";

const emptyForm = {
  name: "",
  fatherName: "",
  motherName: "",
  dob: "",
  gender: "",
  phone: "",
  email: "",
  address: "",
  classId: "",
  section: "",
  rollNo: "",
  session: "",
};

function Students() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [studentsRes, classesRes] = await Promise.all([
        api.get("/operator/students"),
        api.get("/operator/classes"),
      ]);

      setStudents(studentsRes.data || []);
      setClasses(classesRes.data || []);
    } catch (error) {
      console.error("Students loading error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    const value = search.trim().toLowerCase();

    return students.filter((student) => {
      const studentClass =
        student.classId?.name ||
        student.className ||
        "";

      const matchesSearch =
        !value ||
        student.name?.toLowerCase().includes(value) ||
        student.phone?.toLowerCase().includes(value) ||
        student.email?.toLowerCase().includes(value) ||
        String(student.rollNo || "").includes(value);

      const matchesClass =
        !classFilter ||
        String(student.classId?._id || student.classId) ===
          String(classFilter);

      return matchesSearch && matchesClass;
    });
  }, [students, search, classFilter]);

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (student) => {
    setEditingId(student._id);

    setForm({
      name: student.name || "",
      fatherName: student.fatherName || "",
      motherName: student.motherName || "",
      dob: student.dob
        ? String(student.dob).split("T")[0]
        : "",
      gender: student.gender || "",
      phone: student.phone || "",
      email: student.email || "",
      address: student.address || "",
      classId:
        student.classId?._id ||
        student.classId ||
        "",
      section: student.section || "",
      rollNo: student.rollNo || "",
      session: student.session || "",
    });

    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const saveStudent = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      if (editingId) {
        await api.put(
          `/operator/students/${editingId}`,
          form
        );
      } else {
        await api.post("/operator/students", form);
      }

      setShowModal(false);
      setForm(emptyForm);
      setEditingId(null);

      await loadData();
    } catch (error) {
      console.error("Student save error:", error);

      alert(
        error?.response?.data?.message ||
          "Unable to save student"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="operator-students">
      <div className="students-header">
        <div>
          <h1>Students</h1>
          <p>Manage all school students.</p>
        </div>

        <button
          className="primary-btn"
          onClick={openAddModal}
        >
          + Add Student
        </button>
      </div>

      <div className="students-toolbar">
        <div className="search-box">
          🔍
          <input
            type="text"
            placeholder="Search student, phone, email or roll no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
        >
          <option value="">All Classes</option>

          {classes.map((item) => (
            <option key={item._id} value={item._id}>
              {item.name}
              {item.section ? ` - ${item.section}` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="students-card">
        <div className="table-top">
          <div>
            <h2>Student List</h2>
            <span>
              Showing {filteredStudents.length} of{" "}
              {students.length} students
            </span>
          </div>
        </div>

        {loading ? (
          <div className="table-loading">
            Loading students...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="empty-state">
            <div>🎓</div>
            <h3>No students found</h3>
            <p>
              Try changing your search or add a new student.
            </p>
          </div>
        ) : (
          <div className="students-table-wrapper">
            <table className="students-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student</th>
                  <th>Father Name</th>
                  <th>Class</th>
                  <th>Roll No.</th>
                  <th>Phone</th>
                  <th>Session</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map((student, index) => {
                  const className =
                    student.classId?.name ||
                    student.className ||
                    "-";

                  const section =
                    student.section ||
                    student.classId?.section ||
                    "";

                  return (
                    <tr key={student._id}>
                      <td>{index + 1}</td>

                      <td>
                        <div className="student-name">
                          <div className="student-avatar">
                            {student.name
                              ?.charAt(0)
                              ?.toUpperCase() || "S"}
                          </div>

                          <div>
                            <strong>
                              {student.name || "-"}
                            </strong>

                            <small>
                              {student.email || "No email"}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>{student.fatherName || "-"}</td>

                      <td>
                        <span className="class-badge">
                          {className}
                          {section
                            ? ` - ${section}`
                            : ""}
                        </span>
                      </td>

                      <td>{student.rollNo || "-"}</td>

                      <td>{student.phone || "-"}</td>

                      <td>{student.session || "-"}</td>

                      <td>
                        <button
                          className="edit-btn"
                          onClick={() =>
                            openEditModal(student)
                          }
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
        <div
          className="modal-overlay"
          onMouseDown={() => setShowModal(false)}
        >
          <div
            className="student-modal"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>
                  {editingId
                    ? "Edit Student"
                    : "Add Student"}
                </h2>

                <p>
                  Enter student's basic information.
                </p>
              </div>

              <button
                className="close-btn"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={saveStudent}>
              <div className="form-grid">
                <div className="form-group full">
                  <label>Student Name *</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Father Name</label>
                  <input
                    name="fatherName"
                    value={form.fatherName}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Mother Name</label>
                  <input
                    name="motherName"
                    value={form.motherName}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    name="dob"
                    value={form.dob}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Gender</label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                  >
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Phone</label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Class</label>
                  <select
                    name="classId"
                    value={form.classId}
                    onChange={handleChange}
                  >
                    <option value="">
                      Select Class
                    </option>

                    {classes.map((item) => (
                      <option
                        key={item._id}
                        value={item._id}
                      >
                        {item.name}
                        {item.section
                          ? ` - ${item.section}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Section</label>
                  <input
                    name="section"
                    value={form.section}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Roll No.</label>
                  <input
                    name="rollNo"
                    value={form.rollNo}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Session</label>
                  <input
                    name="session"
                    value={form.session}
                    onChange={handleChange}
                    placeholder="2026-27"
                  />
                </div>

                <div className="form-group full">
                  <label>Address</label>
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    rows="3"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowModal(false)}
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
                    : editingId
                    ? "Update Student"
                    : "Save Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Students;