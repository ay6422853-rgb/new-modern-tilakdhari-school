import React, { useEffect, useMemo, useState } from "react";
import { create, list } from "../../api";
import "./Attendance.css";

const STATUSES = ["PRESENT", "ABSENT", "LATE", "LEAVE"];

function Attendance() {
  const [attendance, setAttendance] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState("newest");

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    student: "",
    classId: "",
    date: new Date().toISOString().slice(0, 10),
    status: "PRESENT",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [attendanceData, studentData, classData] =
        await Promise.all([
          list("principal/attendance"),
          list("principal/students"),
          list("principal/classes"),
        ]);

      setAttendance(
        Array.isArray(attendanceData) ? attendanceData : []
      );

      setStudents(
        Array.isArray(studentData) ? studentData : []
      );

      setClasses(
        Array.isArray(classData) ? classData : []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Attendance data load nahi ho saka."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedClass = classes.find(
    (c) => String(c._id) === String(form.classId)
  );

  const availableSections =
    selectedClass?.sections || [];

  const getStudent = (item) => {
    if (!item.student) return null;

    if (typeof item.student === "object") {
      return item.student;
    }

    return students.find(
      (s) => String(s._id) === String(item.student)
    );
  };

  const getClassName = (item) => {
    if (item.classId && typeof item.classId === "object") {
      return item.classId.name || "-";
    }

    const classroom = classes.find(
      (c) => String(c._id) === String(item.classId)
    );

    return (
      item.className ||
      classroom?.name ||
      getStudent(item)?.className ||
      "-"
    );
  };

  const filteredAttendance = useMemo(() => {
    let data = [...attendance];

    const q = search.trim().toLowerCase();

    if (q) {
      data = data.filter((item) => {
        const student = getStudent(item);

        return (
          String(student?.name || "")
            .toLowerCase()
            .includes(q) ||
          String(student?.studentId || "")
            .toLowerCase()
            .includes(q)
        );
      });
    }

    if (dateFilter) {
      data = data.filter(
        (item) =>
          new Date(item.date).toISOString().slice(0, 10) ===
          dateFilter
      );
    }

    if (classFilter) {
      data = data.filter(
        (item) =>
          String(
            item.classId?._id || item.classId
          ) === String(classFilter)
      );
    }

    if (sectionFilter) {
      data = data.filter((item) => {
        const student = getStudent(item);
        return String(
          item.section || student?.section || ""
        ) === sectionFilter;
      });
    }

    if (statusFilter) {
      data = data.filter(
        (item) => item.status === statusFilter
      );
    }

    data.sort((a, b) => {
      const da = new Date(a.date || 0);
      const db = new Date(b.date || 0);

      return sort === "oldest" ? da - db : db - da;
    });

    return data;
  }, [
    attendance,
    students,
    classes,
    search,
    dateFilter,
    classFilter,
    sectionFilter,
    statusFilter,
    sort,
  ]);

  const stats = useMemo(() => {
    const data = filteredAttendance;

    return {
      total: data.length,
      present: data.filter((x) => x.status === "PRESENT").length,
      absent: data.filter((x) => x.status === "ABSENT").length,
      late: data.filter((x) => x.status === "LATE").length,
      leave: data.filter((x) => x.status === "LEAVE").length,
    };
  }, [filteredAttendance]);

  const formStudents = useMemo(() => {
    return students.filter((student) => {
      if (!form.classId) return true;

      return (
        String(student.classId?._id || student.classId) ===
        String(form.classId)
      );
    });
  }, [students, form.classId]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "classId") {
      setForm((prev) => ({
        ...prev,
        classId: value,
        student: "",
      }));
    }
  };

  const submitAttendance = async (e) => {
    e.preventDefault();

    if (!form.student || !form.classId || !form.date) {
      setError("Student, class aur date required hai.");
      return;
    }

    const alreadyMarked = attendance.some((item) => {
      const studentId =
        item.student?._id || item.student;

      const itemDate = item.date
        ? new Date(item.date).toISOString().slice(0, 10)
        : "";

      return (
        String(studentId) === String(form.student) &&
        itemDate === form.date
      );
    });

    if (alreadyMarked) {
      setError(
        "Is student ki attendance is date par already marked hai."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const result = await create("principal/attendance", {
        student: form.student,
        classId: form.classId,
        date: form.date,
        status: form.status,
      });

      setAttendance((prev) => [
        result.attendance || result,
        ...prev,
      ]);

      setSuccess("Attendance marked successfully.");

      setForm({
        student: "",
        classId: "",
        date: new Date().toISOString().slice(0, 10),
        status: "PRESENT",
      });

      setShowForm(false);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Attendance save nahi ho saki.";

      if (
        message.toLowerCase().includes("duplicate") ||
        message.toLowerCase().includes("e11000")
      ) {
        setError(
          "Is student ki attendance is date par already marked hai."
        );
      } else {
        setError(message);
      }
    } finally {
      setSaving(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setDateFilter("");
    setClassFilter("");
    setSectionFilter("");
    setStatusFilter("");
    setSort("newest");
  };

  return (
    <div className="attendance-page">
      <div className="attendance-header">
        <div>
          <h1>Attendance</h1>
          <p>Student attendance records manage karein.</p>
        </div>

        <button
          className="attendance-primary-btn"
          onClick={() => {
            setShowForm(!showForm);
            setError("");
            setSuccess("");
          }}
        >
          {showForm ? "Close Form" : "+ Mark Attendance"}
        </button>
      </div>

      {error && (
        <div className="attendance-alert error">
          {error}
        </div>
      )}

      {success && (
        <div className="attendance-alert success">
          {success}
        </div>
      )}

      <div className="attendance-stats">
        <div>
          <span>Total</span>
          <strong>{stats.total}</strong>
        </div>

        <div>
          <span>Present</span>
          <strong>{stats.present}</strong>
        </div>

        <div>
          <span>Absent</span>
          <strong>{stats.absent}</strong>
        </div>

        <div>
          <span>Late</span>
          <strong>{stats.late}</strong>
        </div>

        <div>
          <span>Leave</span>
          <strong>{stats.leave}</strong>
        </div>
      </div>

      {showForm && (
        <form
          className="attendance-form"
          onSubmit={submitAttendance}
        >
          <h2>Mark Student Attendance</h2>

          <div className="attendance-form-grid">
            <div className="attendance-field">
              <label>Class *</label>

              <select
                name="classId"
                value={form.classId}
                onChange={handleFormChange}
              >
                <option value="">Select Class</option>

                {classes.map((classroom) => (
                  <option
                    key={classroom._id}
                    value={classroom._id}
                  >
                    {classroom.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="attendance-field">
              <label>Student *</label>

              <select
                name="student"
                value={form.student}
                onChange={handleFormChange}
              >
                <option value="">Select Student</option>

                {formStudents.map((student) => (
                  <option
                    key={student._id}
                    value={student._id}
                  >
                    {student.name}
                    {student.section
                      ? ` - ${student.section}`
                      : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="attendance-field">
              <label>Date *</label>

              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleFormChange}
              />
            </div>

            <div className="attendance-field">
              <label>Status *</label>

              <select
                name="status"
                value={form.status}
                onChange={handleFormChange}
              >
                {STATUSES.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            className="attendance-submit-btn"
            disabled={saving}
          >
            {saving ? "Saving..." : "Mark Attendance"}
          </button>
        </form>
      )}

      <div className="attendance-filters">
        <input
          placeholder="Search student..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />

        <select
          value={classFilter}
          onChange={(e) => {
            setClassFilter(e.target.value);
            setSectionFilter("");
          }}
        >
          <option value="">All Classes</option>

          {classes.map((classroom) => (
            <option
              key={classroom._id}
              value={classroom._id}
            >
              {classroom.name}
            </option>
          ))}
        </select>

        <select
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value)}
        >
          <option value="">All Sections</option>

          {(
            classes.find(
              (c) => String(c._id) === String(classFilter)
            )?.sections || []
          ).map((section) => (
            <option key={section} value={section}>
              {section}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>

          {STATUSES.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>

        <button
          className="attendance-clear-btn"
          onClick={clearFilters}
        >
          Clear
        </button>
      </div>

      <div className="attendance-table-wrap">
        {loading ? (
          <div className="attendance-state">
            Loading attendance...
          </div>
        ) : filteredAttendance.length === 0 ? (
          <div className="attendance-state">
            No attendance records found.
          </div>
        ) : (
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Student</th>
                <th>Class</th>
                <th>Section</th>
                <th>Status</th>
                <th>Marked By</th>
              </tr>
            </thead>

            <tbody>
              {filteredAttendance.map((item) => {
                const student = getStudent(item);

                return (
                  <tr key={item._id}>
                    <td>
                      {item.date
                        ? new Date(
                            item.date
                          ).toLocaleDateString("en-IN")
                        : "-"}
                    </td>

                    <td>
                      <strong>
                        {student?.name || "-"}
                      </strong>

                      {student?.studentId && (
                        <small>
                          {student.studentId}
                        </small>
                      )}
                    </td>

                    <td>{getClassName(item)}</td>

                    <td>
                      {item.section ||
                        student?.section ||
                        "-"}
                    </td>

                    <td>
                      <span
                        className={`attendance-status ${String(
                          item.status || ""
                        ).toLowerCase()}`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td>
                      {item.markedBy?.name || "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Attendance;