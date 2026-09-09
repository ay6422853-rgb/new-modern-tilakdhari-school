
import { useEffect, useMemo, useState } from "react";
import api from "../../api";
import "./TeacherPanel.css";

const statusOptions = [
  {
    value: "PRESENT",
    label: "Present",
    short: "P",
  },
  {
    value: "ABSENT",
    label: "Absent",
    short: "A",
  },
  {
    value: "LATE",
    label: "Late",
    short: "L",
  },
  {
    value: "LEAVE",
    label: "Leave",
    short: "LV",
  },
];

export default function TeacherAttendance() {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  const [classId, setClassId] = useState("");

  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [attendance, setAttendance] = useState({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");

  /* =========================================================
     LOAD DATA
  ========================================================= */

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [classesResponse, studentsResponse, attendanceResponse] =
        await Promise.all([
          api.get("/teacher/classes"),
          api.get("/teacher/students"),
          api.get("/teacher/attendance"),
        ]);

      /*
        /teacher/classes response:
        {
          classTeacherClasses: [],
          teachingClasses: []
        }

        Attendance can only be marked for
        class-teacher classes.
      */

      const classTeacherClasses =
        classesResponse.data?.classTeacherClasses || [];

      setClasses(classTeacherClasses);

      /*
        /teacher/students response:
        {
          classTeacherStudents: [],
          teachingStudents: []
        }
      */

      const classTeacherStudents =
        studentsResponse.data?.classTeacherStudents || [];

      setStudents(classTeacherStudents);

      /*
        Attendance history
      */

      const existingAttendance =
        attendanceResponse.data?.attendance || [];

      setAttendanceRecords(existingAttendance);

      /*
        Automatically select first class
      */

      if (classTeacherClasses.length > 0) {
        setClassId(classTeacherClasses[0]._id);
      }
    } catch (error) {
      console.error("Teacher attendance loading error:", error);

      alert(
        error?.response?.data?.message ||
          "Failed to load attendance data."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     SELECTED CLASS
  ========================================================= */

  const selectedClass = useMemo(() => {
    return classes.find(
      (item) => String(item._id) === String(classId)
    );
  }, [classes, classId]);

  /* =========================================================
     CLASS STUDENTS
  ========================================================= */

  const classStudents = useMemo(() => {
    if (!classId) return [];

    return students.filter((student) => {
      const studentClassId =
        student.classId?._id || student.classId;

      return String(studentClassId) === String(classId);
    });
  }, [students, classId]);

  /* =========================================================
     LOAD EXISTING ATTENDANCE FOR SELECTED DATE
  ========================================================= */

  useEffect(() => {
    if (!classId) {
      setAttendance({});
      return;
    }

    const existing = {};

    attendanceRecords.forEach((record) => {
      const recordClassId =
        record.classId?._id || record.classId;

      const recordStudentId =
        record.student?._id || record.student;

      if (
        String(recordClassId) === String(classId) &&
        String(recordStudentId)
      ) {
        const recordDate = record.date
          ? new Date(record.date)
              .toISOString()
              .split("T")[0]
          : "";

        if (recordDate === date) {
          existing[recordStudentId] = record.status;
        }
      }
    });

    setAttendance(existing);
  }, [classId, date, attendanceRecords]);

  /* =========================================================
     SEARCH
  ========================================================= */

  const filteredStudents = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    if (!searchText) {
      return classStudents;
    }

    return classStudents.filter((student) => {
      const text = `
        ${student.name || ""}
        ${student.studentId || ""}
        ${student.registrationNo || ""}
        ${student.admissionNo || ""}
        ${student.rollNo || ""}
      `.toLowerCase();

      return text.includes(searchText);
    });
  }, [classStudents, search]);

  /* =========================================================
     CHANGE CLASS
  ========================================================= */

  const handleClassChange = (value) => {
    setClassId(value);
    setAttendance({});
  };

  /* =========================================================
     SET STUDENT STATUS
  ========================================================= */

  const setStudentStatus = (studentId, status) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  /* =========================================================
     MARK ALL
  ========================================================= */

  const markAll = (status) => {
    const updated = {};

    classStudents.forEach((student) => {
      updated[student._id] = status;
    });

    setAttendance(updated);
  };

  /* =========================================================
     SAVE ATTENDANCE
  ========================================================= */

  const saveAttendance = async () => {
    if (!classId) {
      alert("Please select a class.");
      return;
    }

    if (!classStudents.length) {
      alert("No students found in this class.");
      return;
    }

    try {
      setSaving(true);

      /*
        Backend accepts ONE student per request:

        {
          student,
          classId,
          date,
          status
        }

        So we send requests for every student.
      */

      const requests = classStudents.map((student) => {
        return api.post("/teacher/attendance", {
          student: student._id,
          classId,
          date,
          status: attendance[student._id] || "PRESENT",
        });
      });

      await Promise.all(requests);

      alert("Attendance saved successfully.");

      /*
        Reload attendance history so that
        the current saved data is available.
      */

      const response = await api.get("/teacher/attendance");

      setAttendanceRecords(
        response.data?.attendance || []
      );
    } catch (error) {
      console.error("Save attendance error:", error);

      alert(
        error?.response?.data?.message ||
          "Failed to save attendance."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     SUMMARY
  ========================================================= */

  const presentCount = classStudents.filter(
    (student) =>
      (attendance[student._id] || "PRESENT") ===
      "PRESENT"
  ).length;

  const absentCount = classStudents.filter(
    (student) =>
      attendance[student._id] === "ABSENT"
  ).length;

  const lateCount = classStudents.filter(
    (student) =>
      attendance[student._id] === "LATE"
  ).length;

  const leaveCount = classStudents.filter(
    (student) =>
      attendance[student._id] === "LEAVE"
  ).length;

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="teacher-loading">
        <div className="teacher-spinner"></div>
        <p>Loading attendance...</p>
      </div>
    );
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="teacher-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="teacher-page-header">
        <div>
          <span className="teacher-eyebrow">
            ATTENDANCE
          </span>

          <h1>Student Attendance</h1>

          <p>
            Mark attendance for your Class Teacher class.
          </p>
        </div>

        <div className="attendance-date-badge">
          📅 {date}
        </div>
      </div>

      {/* =====================================================
          NO CLASS
      ===================================================== */}

      {!classes.length ? (
        <div className="teacher-empty large">
          <div>🏫</div>

          <h3>No Class Teacher Class Assigned</h3>

          <p>
            You can mark attendance only for a class
            where you are assigned as Class Teacher.
          </p>
        </div>
      ) : (
        <>
          {/* =================================================
              CONTROLS
          ================================================= */}

          <div className="attendance-control-card">

            <div className="attendance-control">
              <label>Class</label>

              <select
                value={classId}
                onChange={(e) =>
                  handleClassChange(e.target.value)
                }
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
                    {item.classCode
                      ? ` (${item.classCode})`
                      : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="attendance-control">
              <label>Date</label>

              <input
                type="date"
                value={date}
                onChange={(e) =>
                  setDate(e.target.value)
                }
              />
            </div>

            <div className="attendance-info">
              <span>
                Class Teacher
              </span>

              <strong>
                {selectedClass?.name || "—"}
              </strong>
            </div>
          </div>

          {/* ================================================
              SUMMARY
          ================================================ */}

          <div className="attendance-summary">

            <div className="attendance-summary-item present">
              <span>Present</span>
              <strong>{presentCount}</strong>
            </div>

            <div className="attendance-summary-item absent">
              <span>Absent</span>
              <strong>{absentCount}</strong>
            </div>

            <div className="attendance-summary-item late">
              <span>Late</span>
              <strong>{lateCount}</strong>
            </div>

            <div className="attendance-summary-item leave">
              <span>Leave</span>
              <strong>{leaveCount}</strong>
            </div>

            <div className="attendance-summary-item total">
              <span>Total</span>
              <strong>{classStudents.length}</strong>
            </div>

          </div>

          {/* ================================================
              TABLE CARD
          ================================================ */}

          <div className="teacher-table-card">

            <div className="teacher-table-header attendance-header">

              <div>
                <h2>
                  Mark Attendance
                </h2>

                <p>
                  {classStudents.length} students in{" "}
                  {selectedClass?.name || "selected class"}
                </p>
              </div>

              <div className="attendance-actions">

                <button
                  type="button"
                  className="attendance-bulk-btn present"
                  onClick={() =>
                    markAll("PRESENT")
                  }
                >
                  ✓ All Present
                </button>

                <button
                  type="button"
                  className="attendance-bulk-btn absent"
                  onClick={() =>
                    markAll("ABSENT")
                  }
                >
                  ✕ All Absent
                </button>

              </div>

            </div>

            {/* ==============================================
                SEARCH
            ============================================== */}

            <div className="teacher-toolbar compact">

              <div className="teacher-search">

                <span>⌕</span>

                <input
                  type="text"
                  placeholder="Search student..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                />

              </div>

            </div>

            {/* ==============================================
                STUDENT TABLE
            ============================================== */}

            {filteredStudents.length ? (

              <div className="teacher-table-wrapper">

                <table className="teacher-table attendance-table">

                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Student</th>
                      <th>Roll No.</th>
                      <th>Attendance Status</th>
                    </tr>
                  </thead>

                  <tbody>

                    {filteredStudents.map(
                      (student, index) => {

                        const currentStatus =
                          attendance[student._id] ||
                          "PRESENT";

                        return (
                          <tr
                            key={student._id}
                          >

                            <td>
                              {index + 1}
                            </td>

                            <td>

                              <div className="student-cell">

                                <div className="student-avatar">
                                  {student.name
                                    ?.charAt(0)
                                    ?.toUpperCase() ||
                                    "S"}
                                </div>

                                <div>

                                  <strong>
                                    {student.name ||
                                      "Student"}
                                  </strong>

                                  <span>
                                    {student.studentId ||
                                      student.registrationNo ||
                                      student.admissionNo ||
                                      "No ID"}
                                  </span>

                                </div>

                              </div>

                            </td>

                            <td>
                              {student.rollNo || "—"}
                            </td>

                            <td>

                              <div className="attendance-status-buttons">

                                {statusOptions.map(
                                  (option) => (

                                    <button
                                      type="button"
                                      key={
                                        option.value
                                      }
                                      className={
                                        currentStatus ===
                                        option.value
                                          ? `selected ${option.value.toLowerCase()}`
                                          : ""
                                      }
                                      onClick={() =>
                                        setStudentStatus(
                                          student._id,
                                          option.value
                                        )
                                      }
                                    >
                                      <span>
                                        {
                                          option.short
                                        }
                                      </span>

                                      {
                                        option.label
                                      }
                                    </button>

                                  )
                                )}

                              </div>

                            </td>

                          </tr>
                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>

            ) : (

              <div className="teacher-empty large">

                <div>📋</div>

                <h3>
                  No students found
                </h3>

                <p>
                  There are no students assigned
                  to this class.
                </p>

              </div>

            )}

            {/* ==============================================
                SAVE BAR
            ============================================== */}

            <div className="attendance-save-bar">

              <span>
                Attendance for{" "}
                <strong>{date}</strong>
              </span>

              <button
                type="button"
                className="teacher-primary-btn"
                onClick={saveAttendance}
                disabled={
                  saving ||
                  !classStudents.length
                }
              >
                {saving
                  ? "Saving..."
                  : "✓ Save Attendance"}
              </button>

            </div>

          </div>
        </>
      )}

    </div>
  );
}
