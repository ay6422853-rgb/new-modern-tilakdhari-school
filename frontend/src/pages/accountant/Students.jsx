
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../api";
import "./Students.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const downloadStudentsPDF = () => {
  if (filteredStudents.length === 0) {
    alert("No students available to download.");
    return;
  }

  const doc = new jsPDF("landscape");

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Student Management Report", 14, 18);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Generated on: ${new Date().toLocaleDateString("en-IN")}`,
    14,
    25
  );

  doc.text(
    `Total Students: ${filteredStudents.length}`,
    14,
    31
  );

  // Active filters
  const filters = [];

  if (classFilter) {
    const selectedClass = classes.find(
      (item) => item._id === classFilter
    );

    if (selectedClass) {
      filters.push(`Class: ${selectedClass.name}`);
    }
  }

  if (sectionFilter) {
    filters.push(`Section: ${sectionFilter}`);
  }

  if (sessionFilter) {
    filters.push(`Session: ${sessionFilter}`);
  }

  if (statusFilter) {
    filters.push(`Status: ${statusFilter}`);
  }

  if (search.trim()) {
    filters.push(`Search: ${search.trim()}`);
  }

  if (filters.length > 0) {
    doc.setFontSize(9);
    doc.text(
      `Filters: ${filters.join(" | ")}`,
      14,
      37
    );
  }

  const tableStartY =
    filters.length > 0 ? 43 : 38;

  const tableData = filteredStudents.map(
    (student, index) => [
      index + 1,
      student.name || "—",
      student.studentId || "—",
      student.registrationNo || "—",
      student.admissionNo || "—",
      student.className || "—",
      student.section || "—",
      student.rollNo || "—",
      student.phone || "—",
      student.status || "—",
    ]
  );

  autoTable(doc, {
    startY: tableStartY,

    head: [[
      "S.No.",
      "Student Name",
      "Student ID",
      "Registration No.",
      "Admission No.",
      "Class",
      "Section",
      "Roll No.",
      "Phone",
      "Status",
    ]],

    body: tableData,

    theme: "grid",

    styles: {
      fontSize: 8,
      cellPadding: 3,
      valign: "middle",
    },

    headStyles: {
      fontSize: 8,
      fontStyle: "bold",
    },

    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 38 },
      2: { cellWidth: 30 },
      3: { cellWidth: 32 },
      4: { cellWidth: 30 },
      5: { cellWidth: 20 },
      6: { cellWidth: 18 },
      7: { cellWidth: 18 },
      8: { cellWidth: 28 },
      9: { cellWidth: 24 },
    },

    margin: {
      left: 10,
      right: 10,
    },

    didDrawPage: function () {
      const pageHeight =
        doc.internal.pageSize.height;

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");

      doc.text(
        `Student Management System`,
        10,
        pageHeight - 8
      );

      doc.text(
        `Page ${doc.internal.getNumberOfPages()}`,
        doc.internal.pageSize.width - 25,
        pageHeight - 8
      );
    },
  });

  const fileName = `Students_Report_${new Date()
    .toISOString()
    .slice(0, 10)}.pdf`;

  doc.save(fileName);
};

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
  className: "",
  section: "",
  rollNo: "",
  session: "",
  registrationFee: 0,
  admissionFee: 0,
  status: "REGISTERED",
};

export default function Students() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [sessionFilter, setSessionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const loadStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [studentRes, classRes] = await Promise.all([
        api.get("/principal/students"),
        api.get("/principal/classes"),
      ]);

      setStudents(studentRes.data || []);
      setClasses(classRes.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load students."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const sessions = useMemo(() => {
    return [
      ...new Set(
        students
          .map((student) => student.session)
          .filter(Boolean)
      ),
    ].sort();
  }, [students]);

  const sections = useMemo(() => {
    return [
      ...new Set(
        students
          .map((student) => student.section)
          .filter(Boolean)
      ),
    ].sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    const value = search.trim().toLowerCase();

    let result = students.filter((student) => {
      const matchesSearch =
        !value ||
        [
          student.name,
          student.studentId,
          student.registrationNo,
          student.admissionNo,
          student.phone,
          student.email,
          student.fatherName,
          student.motherName,
          student.className,
          student.section,
          student.rollNo,
        ]
          .filter(Boolean)
          .some((field) =>
            String(field).toLowerCase().includes(value)
          );

      const matchesClass =
        !classFilter ||
        String(student.classId?._id || student.classId || "") ===
          String(classFilter);

      const matchesSection =
        !sectionFilter ||
        String(student.section || "") === sectionFilter;

      const matchesSession =
        !sessionFilter ||
        String(student.session || "") === sessionFilter;

      const matchesStatus =
        !statusFilter ||
        String(student.status || "") === statusFilter;

      return (
        matchesSearch &&
        matchesClass &&
        matchesSection &&
        matchesSession &&
        matchesStatus
      );
    });

    result.sort((a, b) => {
      let first = a[sortBy];
      let second = b[sortBy];

      if (sortBy === "className") {
        first = a.className || "";
        second = b.className || "";
      }

      if (sortBy === "rollNo") {
        const firstNum = Number(first);
        const secondNum = Number(second);

        if (!Number.isNaN(firstNum) && !Number.isNaN(secondNum)) {
          return sortOrder === "asc"
            ? firstNum - secondNum
            : secondNum - firstNum;
        }
      }

      first = String(first || "").toLowerCase();
      second = String(second || "").toLowerCase();

      const comparison = first.localeCompare(second, undefined, {
        numeric: true,
        sensitivity: "base",
      });

      return sortOrder === "asc"
        ? comparison
        : -comparison;
    });

    return result;
  }, [
    students,
    search,
    classFilter,
    sectionFilter,
    sessionFilter,
    statusFilter,
    sortBy,
    sortOrder,
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleClassChange = (e) => {
    const classId = e.target.value;

    const selectedClass = classes.find(
      (item) => item._id === classId
    );

    setForm((previous) => ({
      ...previous,
      classId,
      className: selectedClass?.name || "",
    }));
  };

  const openAdd = () => {
    setEditingId(null);

    setForm({
      ...emptyForm,
      session: "2026-2027",
    });

    setShowForm(true);
    setError("");
  };

  const openEdit = (student) => {
    setEditingId(student._id);

    setForm({
      name: student.name || "",
      fatherName: student.fatherName || "",
      motherName: student.motherName || "",
      dob: student.dob
        ? String(student.dob).substring(0, 10)
        : "",
      gender: student.gender || "",
      phone: student.phone || "",
      email: student.email || "",
      address: student.address || "",
      classId:
        student.classId?._id ||
        student.classId ||
        "",
      className: student.className || "",
      section: student.section || "",
      rollNo: student.rollNo || "",
      session: student.session || "",
      registrationFee: student.registrationFee || 0,
      admissionFee: student.admissionFee || 0,
      status: student.status || "REGISTERED",
    });

    setShowForm(true);
    setError("");
  };

  const openView = (student) => {
    setSelectedStudent(student);
    setShowView(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const closeView = () => {
    setShowView(false);
    setSelectedStudent(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setError("Student name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        ...form,
        registrationFee: Number(
          form.registrationFee || 0
        ),
        admissionFee: Number(
          form.admissionFee || 0
        ),
      };

      if (editingId) {
        await api.put(
          `/principal/students/${editingId}`,
          payload
        );
      } else {
        await api.post(
          "/principal/students",
          payload
        );
      }

      closeForm();
      await loadStudents();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save student."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this student?"
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.delete(
        `/principal/students/${id}`
      );

      await loadStudents();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to delete student."
      );
    }
  };

  const clearFilters = () => {
    setSearch("");
    setClassFilter("");
    setSectionFilter("");
    setSessionFilter("");
    setStatusFilter("");
    setSortBy("name");
    setSortOrder("asc");
  };

  const changeSort = (e) => {
    setSortBy(e.target.value);
  };

  const toggleSortOrder = () => {
    setSortOrder((previous) =>
      previous === "asc" ? "desc" : "asc"
    );
  };

  const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (value) => {
    return `₹${Number(value || 0).toLocaleString(
      "en-IN"
    )}`;
  };

  const getInitial = (name) => {
    return (
      name?.trim()?.charAt(0)?.toUpperCase() ||
      "S"
    );
  };

  return (
    <div className="principal-students">

      {/* HEADER */}
      <div className="students-header">
        <div>
          <span className="students-label">
            STUDENT MANAGEMENT
          </span>

          <h1>Students</h1>

          <p>
            Manage student records, profiles and
            academic information.
          </p>
        </div>

        <div className="students-header-actions">

            <button
                className="students-pdf-btn"
                onClick={downloadStudentsPDF}
            >
                ↓ Download PDF
            </button>

            <button
                className="students-add-btn"
                onClick={openAdd}
            >
                + Add Student
            </button>

</div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="students-alert">
          <span>{error}</span>

          <button
            onClick={() => setError("")}
          >
            ×
          </button>
        </div>
      )}

      {/* FILTER AREA */}
      <div className="students-filter-card">

        <div className="students-search large">
          <span>⌕</span>

          <input
            type="text"
            placeholder="Search name, admission no., registration no., father name, phone..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <div className="students-filter-grid">

          <select
            value={classFilter}
            onChange={(e) =>
              setClassFilter(e.target.value)
            }
          >
            <option value="">
              All Classes
            </option>

            {classes.map((item) => (
              <option
                key={item._id}
                value={item._id}
              >
                Class {item.name}
              </option>
            ))}
          </select>

          <select
            value={sectionFilter}
            onChange={(e) =>
              setSectionFilter(e.target.value)
            }
          >
            <option value="">
              All Sections
            </option>

            {sections.map((section) => (
              <option
                key={section}
                value={section}
              >
                Section {section}
              </option>
            ))}
          </select>

          <select
            value={sessionFilter}
            onChange={(e) =>
              setSessionFilter(e.target.value)
            }
          >
            <option value="">
              All Sessions
            </option>

            {sessions.map((session) => (
              <option
                key={session}
                value={session}
              >
                {session}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
          >
            <option value="">
              All Status
            </option>

            <option value="ACTIVE">
              Active
            </option>

            <option value="REGISTERED">
              Registered
            </option>

            <option value="INACTIVE">
              Inactive
            </option>

            <option value="LEFT">
              Left
            </option>
          </select>

        </div>

        <div className="students-filter-bottom">

          <div className="sort-box">
            <span>Sort by</span>

            <select
              value={sortBy}
              onChange={changeSort}
            >
              <option value="name">
                Name
              </option>

              <option value="admissionNo">
                Admission No.
              </option>

              <option value="registrationNo">
                Registration No.
              </option>

              <option value="className">
                Class
              </option>

              <option value="rollNo">
                Roll No.
              </option>

              <option value="session">
                Session
              </option>
            </select>

            <button
              className="sort-direction"
              onClick={toggleSortOrder}
              title={
                sortOrder === "asc"
                  ? "Ascending"
                  : "Descending"
              }
            >
              {sortOrder === "asc"
                ? "↑"
                : "↓"}
            </button>
          </div>

          <button
            className="clear-filter-btn"
            onClick={clearFilters}
          >
            Clear Filters
          </button>

        </div>
      </div>

      {/* TOOLBAR */}
      <div className="students-toolbar">

        <div className="students-count">
          Showing{" "}
          <strong>
            {filteredStudents.length}
          </strong>{" "}
          of{" "}
          <strong>
            {students.length}
          </strong>{" "}
          students
        </div>

        <button
          className="students-refresh"
          onClick={loadStudents}
        >
          ↻ Refresh
        </button>

      </div>

      {/* TABLE */}
      {loading ? (
        <div className="students-loading">
          <div className="students-spinner"></div>

          <p>
            Loading students...
          </p>
        </div>
      ) : (
        <div className="students-table-card">

          <div className="students-table-wrapper">

            <table className="students-table">

              <thead>
                <tr>
                  <th>Student</th>
                  <th>Registration No.</th>
                  <th>Admission No.</th>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {filteredStudents.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="students-empty"
                    >
                      <div className="empty-icon">
                        👨‍🎓
                      </div>

                      <strong>
                        No students found
                      </strong>

                      <small>
                        Try changing your
                        search or filters.
                      </small>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(
                    (student) => (
                      <tr
                        key={student._id}
                      >

                        <td>
                          <div className="student-name-cell">

                            <div className="student-avatar">
                              {getInitial(
                                student.name
                              )}
                            </div>

                            <div>
                              <strong>
                                {student.name}
                              </strong>

                              <small>
                                {student.studentId ||
                                  "No Student ID"}
                              </small>
                            </div>

                          </div>
                        </td>

                        <td>
                          {student.registrationNo ||
                            "—"}
                        </td>

                        <td>
                          {student.admissionNo ||
                            "—"}
                        </td>

                        <td>
                          {student.className ||
                            "—"}
                        </td>

                        <td>
                          {student.section ||
                            "—"}
                        </td>

                        <td>
                          {student.phone ||
                            "—"}
                        </td>

                        <td>
                          <span
                            className={`student-status ${String(
                              student.status || ""
                            ).toLowerCase()}`}
                          >
                            {student.status ||
                              "—"}
                          </span>
                        </td>

                        <td>
                          <div className="student-actions">

                            <button
                              className="view-btn"
                              onClick={() =>
                                openView(
                                  student
                                )
                              }
                            >
                              👁 View
                            </button>

                            <button
                              className="edit-btn"
                              onClick={() =>
                                openEdit(
                                  student
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              className="delete-btn"
                              onClick={() =>
                                handleDelete(
                                  student._id
                                )
                              }
                            >
                              Delete
                            </button>

                          </div>
                        </td>

                      </tr>
                    )
                  )
                )}

              </tbody>

            </table>

          </div>
        </div>
      )}

      {/* VIEW STUDENT MODAL */}
      {showView && selectedStudent && (
        <div
          className="students-modal-backdrop"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget
            ) {
              closeView();
            }
          }}
        >

          <div className="student-profile-modal">

            <div className="student-profile-header">

              <div className="profile-main">

                <div className="profile-avatar">
                  {getInitial(
                    selectedStudent.name
                  )}
                </div>

                <div>
                  <span>
                    STUDENT PROFILE
                  </span>

                  <h2>
                    {selectedStudent.name}
                  </h2>

                  <p>
                    {selectedStudent.admissionNo ||
                      "No Admission No."}
                  </p>
                </div>

              </div>

              <button
                className="modal-close"
                onClick={closeView}
              >
                ×
              </button>

            </div>

            <div className="profile-status-bar">

              <span
                className={`student-status ${String(
                  selectedStudent.status ||
                    ""
                ).toLowerCase()}`}
              >
                {selectedStudent.status ||
                  "UNKNOWN"}
              </span>

              <span>
                Session:{" "}
                <strong>
                  {selectedStudent.session ||
                    "—"}
                </strong>
              </span>

              <span>
                Class:{" "}
                <strong>
                  {selectedStudent.className ||
                    "—"}
                </strong>
              </span>

              <span>
                Section:{" "}
                <strong>
                  {selectedStudent.section ||
                    "—"}
                </strong>
              </span>

            </div>

            <div className="profile-content">

              {/* PERSONAL */}
              <section className="profile-section">

                <div className="profile-section-title">
                  <span>01</span>
                  <h3>
                    Personal Information
                  </h3>
                </div>

                <div className="profile-grid">

                  <ProfileItem
                    label="Full Name"
                    value={
                      selectedStudent.name
                    }
                  />

                  <ProfileItem
                    label="Date of Birth"
                    value={formatDate(
                      selectedStudent.dob
                    )}
                  />

                  <ProfileItem
                    label="Gender"
                    value={
                      selectedStudent.gender
                    }
                  />

                  <ProfileItem
                    label="Phone"
                    value={
                      selectedStudent.phone
                    }
                  />

                  <ProfileItem
                    label="Email"
                    value={
                      selectedStudent.email
                    }
                  />

                  <ProfileItem
                    label="Address"
                    value={
                      selectedStudent.address
                    }
                    full
                  />

                </div>

              </section>

              {/* PARENT */}
              <section className="profile-section">

                <div className="profile-section-title">
                  <span>02</span>
                  <h3>
                    Family Information
                  </h3>
                </div>

                <div className="profile-grid">

                  <ProfileItem
                    label="Father Name"
                    value={
                      selectedStudent.fatherName
                    }
                  />

                  <ProfileItem
                    label="Mother Name"
                    value={
                      selectedStudent.motherName
                    }
                  />

                </div>

              </section>

              {/* ACADEMIC */}
              <section className="profile-section">

                <div className="profile-section-title">
                  <span>03</span>
                  <h3>
                    Academic Information
                  </h3>
                </div>

                <div className="profile-grid">

                  <ProfileItem
                    label="Student ID"
                    value={
                      selectedStudent.studentId
                    }
                  />

                  <ProfileItem
                    label="Registration No."
                    value={
                      selectedStudent.registrationNo
                    }
                  />

                  <ProfileItem
                    label="Admission No."
                    value={
                      selectedStudent.admissionNo
                    }
                  />

                  <ProfileItem
                    label="Class"
                    value={
                      selectedStudent.className
                    }
                  />

                  <ProfileItem
                    label="Section"
                    value={
                      selectedStudent.section
                    }
                  />

                  <ProfileItem
                    label="Roll No."
                    value={
                      selectedStudent.rollNo
                    }
                  />

                  <ProfileItem
                    label="Academic Session"
                    value={
                      selectedStudent.session
                    }
                  />

                  <ProfileItem
                    label="Status"
                    value={
                      selectedStudent.status
                    }
                  />

                </div>

              </section>

              {/* FEES */}
              <section className="profile-section">

                <div className="profile-section-title">
                  <span>04</span>
                  <h3>
                    Admission & Fee Information
                  </h3>
                </div>

                <div className="profile-fee-cards">

                  <div className="profile-fee-card">
                    <small>
                      Registration Fee
                    </small>

                    <strong>
                      {formatCurrency(
                        selectedStudent.registrationFee
                      )}
                    </strong>
                  </div>

                  <div className="profile-fee-card">
                    <small>
                      Admission Fee
                    </small>

                    <strong>
                      {formatCurrency(
                        selectedStudent.admissionFee
                      )}
                    </strong>
                  </div>

                  <div className="profile-fee-card">
                    <small>
                      Total Recorded
                    </small>

                    <strong>
                      {formatCurrency(
                        Number(
                          selectedStudent.registrationFee ||
                            0
                        ) +
                          Number(
                            selectedStudent.admissionFee ||
                              0
                          )
                      )}
                    </strong>
                  </div>

                </div>

              </section>

              {/* PORTAL */}
              <section className="profile-section">

                <div className="profile-section-title">
                  <span>05</span>
                  <h3>
                    Portal & Account
                  </h3>
                </div>

                <div className="profile-grid">

                  <ProfileItem
                    label="Portal Account"
                    value={
                      selectedStudent.user
                        ? "Account Created"
                        : "Not Created"
                    }
                  />

                  <ProfileItem
                    label="Parent Account"
                    value={
                      selectedStudent.parent
                        ? "Linked"
                        : "Not Linked"
                    }
                  />

                  <ProfileItem
                    label="Active"
                    value={
                      selectedStudent.active
                        ? "Yes"
                        : "No"
                    }
                  />

                </div>

              </section>

              {/* DOCUMENTS */}
              <section className="profile-section">

                <div className="profile-section-title">
                  <span>06</span>
                  <h3>
                    Documents
                  </h3>
                </div>

                {Array.isArray(
                  selectedStudent.documents
                ) &&
                selectedStudent.documents.length >
                  0 ? (
                  <div className="profile-documents">

                    {selectedStudent.documents.map(
                      (document, index) => (
                        <div
                          className="profile-document"
                          key={
                            document._id ||
                            index
                          }
                        >
                          <span>📄</span>

                          <div>
                            <strong>
                              {document.name ||
                                document.title ||
                                `Document ${
                                  index + 1
                                }`}
                            </strong>

                            <small>
                              Document available
                            </small>
                          </div>
                        </div>
                      )
                    )}

                  </div>
                ) : (
                  <div className="no-documents">
                    No documents uploaded.
                  </div>
                )}

              </section>

            </div>

            <div className="student-profile-footer">

              <button
                className="student-cancel"
                onClick={closeView}
              >
                Close
              </button>

              <button
                className="student-save"
                onClick={() => {
                  closeView();
                  openEdit(
                    selectedStudent
                  );
                }}
              >
                Edit Student
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {showForm && (
        <div className="students-modal-backdrop">

          <div className="students-modal">

            <div className="students-modal-header">

              <div>
                <span>
                  STUDENT RECORD
                </span>

                <h2>
                  {editingId
                    ? "Edit Student"
                    : "Add Student"}
                </h2>
              </div>

              <button
                className="modal-close"
                onClick={closeForm}
              >
                ×
              </button>

            </div>

            <form onSubmit={handleSubmit}>

              <div className="student-form-grid">

                <div className="student-field full">
                  <label>
                    Student Name *
                  </label>

                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter student name"
                    required
                  />
                </div>

                <div className="student-field">
                  <label>
                    Father Name
                  </label>

                  <input
                    name="fatherName"
                    value={form.fatherName}
                    onChange={handleChange}
                    placeholder="Father name"
                  />
                </div>

                <div className="student-field">
                  <label>
                    Mother Name
                  </label>

                  <input
                    name="motherName"
                    value={form.motherName}
                    onChange={handleChange}
                    placeholder="Mother name"
                  />
                </div>

                <div className="student-field">
                  <label>
                    Date of Birth
                  </label>

                  <input
                    type="date"
                    name="dob"
                    value={form.dob}
                    onChange={handleChange}
                  />
                </div>

                <div className="student-field">
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

                    <option value="MALE">
                      Male
                    </option>

                    <option value="FEMALE">
                      Female
                    </option>

                    <option value="OTHER">
                      Other
                    </option>
                  </select>
                </div>

                <div className="student-field">
                  <label>
                    Phone
                  </label>

                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Phone number"
                  />
                </div>

                <div className="student-field">
                  <label>
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Email address"
                  />
                </div>

                <div className="student-field">
                  <label>
                    Class
                  </label>

                  <select
                    name="classId"
                    value={form.classId}
                    onChange={handleClassChange}
                  >
                    <option value="">
                      Select class
                    </option>

                    {classes.map((item) => (
                      <option
                        key={item._id}
                        value={item._id}
                      >
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="student-field">
                  <label>
                    Section
                  </label>

                  <input
                    name="section"
                    value={form.section}
                    onChange={handleChange}
                    placeholder="A / B / C"
                  />
                </div>

                <div className="student-field">
                  <label>
                    Roll No.
                  </label>

                  <input
                    name="rollNo"
                    value={form.rollNo}
                    onChange={handleChange}
                    placeholder="Roll number"
                  />
                </div>

                <div className="student-field">
                  <label>
                    Session
                  </label>

                  <input
                    name="session"
                    value={form.session}
                    onChange={handleChange}
                    placeholder="2026-2027"
                  />
                </div>

                <div className="student-field">
                  <label>
                    Registration Fee
                  </label>

                  <input
                    type="number"
                    min="0"
                    name="registrationFee"
                    value={
                      form.registrationFee
                    }
                    onChange={handleChange}
                  />
                </div>

                <div className="student-field">
                  <label>
                    Admission Fee
                  </label>

                  <input
                    type="number"
                    min="0"
                    name="admissionFee"
                    value={
                      form.admissionFee
                    }
                    onChange={handleChange}
                  />
                </div>

                <div className="student-field">
                  <label>
                    Status
                  </label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    <option value="REGISTERED">
                      Registered
                    </option>

                    <option value="ACTIVE">
                      Active
                    </option>

                    <option value="INACTIVE">
                      Inactive
                    </option>

                    <option value="LEFT">
                      Left
                    </option>
                  </select>
                </div>

                <div className="student-field full">
                  <label>
                    Address
                  </label>

                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Student address"
                    rows="3"
                  />
                </div>

              </div>

              <div className="student-form-footer">

                <button
                  type="button"
                  className="student-cancel"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="student-save"
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

function ProfileItem({
  label,
  value,
  full = false,
}) {
  return (
    <div
      className={`profile-item ${
        full ? "profile-item-full" : ""
      }`}
    >
      <small>{label}</small>

      <strong>
        {value || "—"}
      </strong>
    </div>
  );
}
