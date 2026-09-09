
import { useEffect, useMemo, useState } from "react";
import api from "../../api";
import "./Teachers.css";

const emptyForm = {
  name: "",
  employeeId: "",
  phone: "",
  email: "",
  gender: "",
  dob: "",
  qualification: "",
  experience: "",
  subjects: [],
  className: "",
  section: "",
  joiningDate: "",
  address: "",
  status: "Active",
};

function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [loginDetails, setLoginDetails] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | LOAD TEACHERS + SUBJECTS
  |--------------------------------------------------------------------------
  */

  const loadData = async () => {
    try {
      setLoading(true);

      const [teacherRes, subjectRes] = await Promise.all([
        api.get("/operator/teachers"),
        api.get("/operator/subjects"),
      ]);

      setTeachers(
        Array.isArray(teacherRes.data)
          ? teacherRes.data
          : teacherRes.data?.teachers || []
      );

      setSubjects(
        Array.isArray(subjectRes.data)
          ? subjectRes.data
          : subjectRes.data?.subjects || []
      );
    } catch (error) {
      console.error("Failed to load teachers/subjects:", error);

      alert(
        error?.response?.data?.message ||
          "Unable to load teachers or subjects."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | SEARCH
  |--------------------------------------------------------------------------
  */

  const filteredTeachers = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return teachers;

    return teachers.filter((teacher) => {
      const subjectText = Array.isArray(teacher.subjects)
        ? teacher.subjects
            .map((subject) =>
              typeof subject === "object"
                ? subject?.name || subject?.code || ""
                : subject
            )
            .join(" ")
        : teacher.subject || "";

      return (
        teacher.name?.toLowerCase().includes(value) ||
        teacher.employeeId?.toLowerCase().includes(value) ||
        teacher.phone?.toLowerCase().includes(value) ||
        teacher.email?.toLowerCase().includes(value) ||
        subjectText.toLowerCase().includes(value)
      );
    });
  }, [teachers, search]);

  /*
  |--------------------------------------------------------------------------
  | FORM CHANGE
  |--------------------------------------------------------------------------
  */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | SUBJECT CHANGE
  |--------------------------------------------------------------------------
  */

  const handleSubjectChange = (e) => {
    const value = e.target.value;

    setForm((prev) => ({
      ...prev,
      subjects: value ? [value] : [],
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | OPEN ADD
  |--------------------------------------------------------------------------
  */

  const openAddModal = () => {
    setEditing(null);
    setForm(emptyForm);
    setLoginDetails(null);
    setShowModal(true);
  };

  /*
  |--------------------------------------------------------------------------
  | OPEN EDIT
  |--------------------------------------------------------------------------
  */

  const openEditModal = (teacher) => {
    setEditing(teacher);
    setLoginDetails(null);

    const subjectIds = Array.isArray(teacher.subjects)
      ? teacher.subjects
          .map((subject) =>
            typeof subject === "object"
              ? subject?._id
              : subject
          )
          .filter(Boolean)
      : teacher.subject
        ? [teacher.subject]
        : [];

    setForm({
      name: teacher.name || "",
      employeeId: teacher.employeeId || "",
      phone: teacher.phone || "",
      email: teacher.email || "",
      gender: teacher.gender || "",
      dob: teacher.dob
        ? String(teacher.dob).substring(0, 10)
        : "",
      qualification: teacher.qualification || "",
      experience: teacher.experience || "",
      subjects: subjectIds,
      className: teacher.className || "",
      section: teacher.section || "",
      joiningDate: teacher.joiningDate
        ? String(teacher.joiningDate).substring(0, 10)
        : "",
      address: teacher.address || "",
      status: teacher.status || "Active",
    });

    setShowModal(true);
  };

  /*
  |--------------------------------------------------------------------------
  | CLOSE MODAL
  |--------------------------------------------------------------------------
  */

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditing(null);
    setForm(emptyForm);
  };

  /*
  |--------------------------------------------------------------------------
  | SAVE TEACHER
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Teacher name is required.");
      return;
    }

    if (!form.email.trim()) {
      alert("Teacher email is required.");
      return;
    }

    if (!form.dob) {
      alert("Teacher DOB is required.");
      return;
    }

    if (!form.subjects.length) {
      alert("Please select a subject.");
      return;
    }

    try {
      setSaving(true);
      setLoginDetails(null);

      let response;

      if (editing) {
        response = await api.put(
          `/operator/teachers/${editing._id || editing.id}`,
          form
        );

        alert(
          response?.data?.message ||
            "Teacher updated successfully."
        );
      } else {
        response = await api.post(
          "/operator/teachers",
          form
        );

        /*
        |--------------------------------------------------------------------------
        | LOGIN DETAILS FROM BACKEND
        |--------------------------------------------------------------------------
        */

        if (response?.data?.login) {
          setLoginDetails(response.data.login);
        }

        alert(
          response?.data?.message ||
            "Teacher created successfully."
        );
      }

      await loadData();

      /*
      |--------------------------------------------------------------------------
      | Keep modal open after creation so login details can be shown
      |--------------------------------------------------------------------------
      */

      if (editing) {
        closeModal();
      } else {
        setForm(emptyForm);
      }
    } catch (error) {
      console.error("Teacher save error:", error);

      alert(
        error?.response?.data?.message ||
          "Unable to save teacher."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | DELETE TEACHER
  |--------------------------------------------------------------------------
  */

  const handleDelete = async (teacher) => {
    const teacherId = teacher._id || teacher.id;

    if (!teacherId) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${teacher.name || "this teacher"}?`
    );

    if (!confirmed) return;

    try {
      await api.delete(
        `/operator/teachers/${teacherId}`
      );

      await loadData();

      alert("Teacher deleted successfully.");
    } catch (error) {
      console.error("Teacher delete error:", error);

      alert(
        error?.response?.data?.message ||
          "Unable to delete teacher."
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | SUBJECT NAME
  |--------------------------------------------------------------------------
  */

  const getSubjectNames = (teacher) => {
    if (Array.isArray(teacher.subjects)) {
      const names = teacher.subjects
        .map((subject) =>
          typeof subject === "object"
            ? subject?.name || subject?.code
            : subject
        )
        .filter(Boolean);

      if (names.length) {
        return names.join(", ");
      }
    }

    return teacher.subject || "—";
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="teachers-page">
        <div className="teachers-loading">
          Loading teachers...
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <div className="teachers-page">

      {/* HEADER */}

      <div className="teachers-header">
        <div>
          <h1>Teachers</h1>

          <p>
            Manage teachers, subjects and teacher accounts
          </p>
        </div>

        <button
          type="button"
          className="primary-btn"
          onClick={openAddModal}
        >
          + Add Teacher
        </button>
      </div>

      {/* SEARCH */}

      <div className="teachers-toolbar">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, employee ID, phone or subject..."
          className="search-input"
        />

        <div className="teacher-count">
          {filteredTeachers.length} Teacher
          {filteredTeachers.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* TEACHER LIST */}

      {filteredTeachers.length === 0 ? (
        <div className="empty-state">
          <h3>No teachers found</h3>

          <p>
            {search
              ? "Try another search."
              : "Add your first teacher."}
          </p>
        </div>
      ) : (
        <div className="teachers-grid">
          {filteredTeachers.map((teacher) => (
            <div
              className="teacher-card"
              key={teacher._id || teacher.id}
            >

              <div className="teacher-card-top">

                <div className="teacher-avatar">
                  {teacher.name
                    ?.charAt(0)
                    ?.toUpperCase() || "T"}
                </div>

                <div className="teacher-main-info">
                  <h3>
                    {teacher.name || "Unnamed Teacher"}
                  </h3>

                  <span>
                    {teacher.employeeId
                      ? `Employee ID: ${teacher.employeeId}`
                      : "Teacher"}
                  </span>
                </div>

                <div
                  className={`teacher-status ${
                    String(
                      teacher.status || "Active"
                    ).toLowerCase() === "active"
                      ? "active"
                      : "inactive"
                  }`}
                >
                  {teacher.status || "Active"}
                </div>

              </div>

              <div className="teacher-card-body">

                <div className="teacher-detail">
                  <span>Subject</span>
                  <strong>
                    {getSubjectNames(teacher)}
                  </strong>
                </div>

                <div className="teacher-detail">
                  <span>Class</span>
                  <strong>
                    {teacher.className || "—"}
                    {teacher.section
                      ? ` - ${teacher.section}`
                      : ""}
                  </strong>
                </div>

                <div className="teacher-detail">
                  <span>Phone</span>
                  <strong>
                    {teacher.phone || "—"}
                  </strong>
                </div>

                <div className="teacher-detail">
                  <span>Email</span>
                  <strong>
                    {teacher.email || "—"}
                  </strong>
                </div>

              </div>

              <div className="teacher-card-actions">

                <button
                  type="button"
                  className="edit-btn"
                  onClick={() =>
                    openEditModal(teacher)
                  }
                >
                  Edit
                </button>

                <button
                  type="button"
                  className="delete-btn"
                  onClick={() =>
                    handleDelete(teacher)
                  }
                >
                  Delete
                </button>

              </div>

            </div>
          ))}
        </div>
      )}

      {/* MODAL */}

      {showModal && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget &&
              !saving
            ) {
              closeModal();
            }
          }}
        >

          <div className="teacher-modal">

            <div className="modal-header">

              <div>
                <h2>
                  {editing
                    ? "Edit Teacher"
                    : "Add Teacher"}
                </h2>

                <p>
                  {editing
                    ? "Update teacher information"
                    : "Create teacher profile and login account"}
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeModal}
                disabled={saving}
              >
                ×
              </button>

            </div>

            {/* LOGIN DETAILS */}

            {loginDetails && (
              <div className="teacher-login-box">

                <div className="login-box-title">
                  Teacher Login Created
                </div>

                <div className="login-row">
                  <span>Login ID</span>

                  <strong>
                    {loginDetails.email ||
                      form.email}
                  </strong>
                </div>

                <div className="login-row">
                  <span>Initial Password</span>

                  <strong>
                    {loginDetails.initialPassword ||
                      "DDMMYYYY"}
                  </strong>
                </div>

                <small>
                  Teacher must change the password after
                  first login.
                </small>

              </div>
            )}

            <form
              className="teacher-form"
              onSubmit={handleSubmit}
            >

              {/* BASIC INFORMATION */}

              <div className="form-section">
                <h3>Basic Information</h3>

                <div className="form-grid">

                  <div className="form-group">
                    <label>
                      Teacher Name *
                    </label>

                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Enter teacher name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Employee ID
                    </label>

                    <input
                      name="employeeId"
                      value={form.employeeId}
                      onChange={handleChange}
                      placeholder="EMP001"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Phone
                    </label>

                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Email / Login ID *
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="teacher@example.com"
                      required
                    />

                    {!editing && (
                      <small>
                        This email will be used as the
                        teacher login ID.
                      </small>
                    )}
                  </div>

                  <div className="form-group">
                    <label>
                      Gender
                    </label>

                    <select
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                    >
                      <option value="">
                        Select gender
                      </option>

                      <option value="Male">
                        Male
                      </option>

                      <option value="Female">
                        Female
                      </option>

                      <option value="Other">
                        Other
                      </option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>
                      Date of Birth *
                    </label>

                    <input
                      type="date"
                      name="dob"
                      value={form.dob}
                      onChange={handleChange}
                      required
                    />

                    {!editing && (
                      <small>
                        Initial password will be DOB in
                        DDMMYYYY format.
                      </small>
                    )}
                  </div>

                </div>
              </div>

              {/* PROFESSIONAL INFORMATION */}

              <div className="form-section">
                <h3>Professional Information</h3>

                <div className="form-grid">

                  <div className="form-group">
                    <label>
                      Qualification
                    </label>

                    <input
                      name="qualification"
                      value={form.qualification}
                      onChange={handleChange}
                      placeholder="M.Com, B.Ed"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Experience
                    </label>

                    <input
                      name="experience"
                      value={form.experience}
                      onChange={handleChange}
                      placeholder="5 Years"
                    />
                  </div>

                  {/* BACKEND SUBJECT DROPDOWN */}

                  <div className="form-group">
                    <label>
                      Subject *
                    </label>

                    <select
                      value={
                        form.subjects?.[0] || ""
                      }
                      onChange={handleSubjectChange}
                      required
                    >
                      <option value="">
                        Select Subject
                      </option>

                      {subjects.map((subject) => (
                        <option
                          key={
                            subject._id ||
                            subject.id
                          }
                          value={
                            subject._id ||
                            subject.id
                          }
                        >
                          {subject.name}
                          {subject.code
                            ? ` (${subject.code})`
                            : ""}
                        </option>
                      ))}
                    </select>

                    {subjects.length === 0 && (
                      <small className="form-error">
                        No subjects found. Please create a
                        subject first.
                      </small>
                    )}
                  </div>

                  <div className="form-group">
                    <label>
                      Class
                    </label>

                    <input
                      name="className"
                      value={form.className}
                      onChange={handleChange}
                      placeholder="Class 10"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Section
                    </label>

                    <input
                      name="section"
                      value={form.section}
                      onChange={handleChange}
                      placeholder="A"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Joining Date
                    </label>

                    <input
                      type="date"
                      name="joiningDate"
                      value={form.joiningDate}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Status
                    </label>

                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                    >
                      <option value="Active">
                        Active
                      </option>

                      <option value="Inactive">
                        Inactive
                      </option>
                    </select>
                  </div>

                </div>
              </div>

              {/* ADDRESS */}

              <div className="form-section">
                <h3>Address</h3>

                <div className="form-group">
                  <label>
                    Address
                  </label>

                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Enter complete address"
                    rows="3"
                  />
                </div>
              </div>

              {/* ACTIONS */}

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={
                    saving ||
                    (!editing && subjects.length === 0)
                  }
                >
                  {saving
                    ? "Saving..."
                    : editing
                      ? "Update Teacher"
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

export default Teachers;
