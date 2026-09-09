import { useEffect, useMemo, useState } from "react";
import api from "../../api";
import "./Attendance.css";

function Attendance() {
  const today = new Date().toISOString().split("T")[0];

  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState(today);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [classRes, studentRes, attendanceRes] =
        await Promise.all([
          api.get("/operator/classes"),
          api.get("/operator/students"),
          api.get("/operator/attendance"),
        ]);

      setClasses(classRes.data || []);
      setStudents(studentRes.data || []);

      const attendanceMap = {};

      (attendanceRes.data || []).forEach((item) => {
        const studentId =
          item.student?._id || item.student;

        const date = item.date
          ? String(item.date).split("T")[0]
          : "";

        if (
          studentId &&
          date === today
        ) {
          attendanceMap[studentId] =
            item.status || item.attendance || "PRESENT";
        }
      });

      setAttendance(attendanceMap);

      if (classRes.data?.length) {
        setSelectedClass(classRes.data[0]._id);
      }
    } catch (error) {
      console.error("Attendance loading error:", error);
    } finally {
      setLoading(false);
    }
  };

  const classStudents = useMemo(() => {
    if (!selectedClass) return [];

    return students.filter((student) => {
      const id =
        student.classId?._id ||
        student.classId;

      return String(id) === String(selectedClass);
    });
  }, [students, selectedClass]);

  const markStatus = (studentId, status) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const markAll = (status) => {
    const updated = { ...attendance };

    classStudents.forEach((student) => {
      updated[student._id] = status;
    });

    setAttendance(updated);
  };

  const saveAttendance = async () => {
    try {
      setSaving(true);

      for (const student of classStudents) {
        const status =
          attendance[student._id] || "PRESENT";

        await api.post("/operator/attendance", {
          student: student._id,
          classId: selectedClass,
          date: selectedDate,
          status,
        });
      }

      alert("Attendance saved successfully.");
    } catch (error) {
      console.error("Attendance save error:", error);

      alert(
        error?.response?.data?.message ||
          "Unable to save attendance"
      );
    } finally {
      setSaving(false);
    }
  };

  const presentCount = classStudents.filter(
    (student) =>
      (attendance[student._id] || "PRESENT") ===
      "PRESENT"
  ).length;

  const absentCount = classStudents.filter(
    (student) =>
      attendance[student._id] === "ABSENT"
  ).length;

  const leaveCount = classStudents.filter(
    (student) =>
      attendance[student._id] === "LEAVE"
  ).length;

  return (
    <div className="operator-attendance">
      <div className="attendance-header">
        <div>
          <h1>Attendance</h1>
          <p>Mark and manage student attendance.</p>
        </div>

        <button
          className="attendance-save-btn"
          onClick={saveAttendance}
          disabled={
            saving || classStudents.length === 0
          }
        >
          {saving ? "Saving..." : "Save Attendance"}
        </button>
      </div>

      <div className="attendance-filters">
        <div>
          <label>Class</label>

          <select
            value={selectedClass}
            onChange={(e) =>
              setSelectedClass(e.target.value)
            }
          >
            <option value="">Select Class</option>

            {classes.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
                {item.section
                  ? ` - ${item.section}`
                  : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Date</label>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) =>
              setSelectedDate(e.target.value)
            }
          />
        </div>
      </div>

      <div className="attendance-summary">
        <div>
          <span>👨‍🎓 Total</span>
          <strong>{classStudents.length}</strong>
        </div>

        <div className="present-summary">
          <span>✓ Present</span>
          <strong>{presentCount}</strong>
        </div>

        <div className="absent-summary">
          <span>✕ Absent</span>
          <strong>{absentCount}</strong>
        </div>

        <div className="leave-summary">
          <span>⏳ Leave</span>
          <strong>{leaveCount}</strong>
        </div>
      </div>

      <div className="attendance-card">
        <div className="attendance-card-header">
          <div>
            <h2>Student Attendance</h2>
            <p>
              Select attendance status for each student.
            </p>
          </div>

          <div className="attendance-bulk">
            <button onClick={() => markAll("PRESENT")}>
              Mark All Present
            </button>

            <button onClick={() => markAll("ABSENT")}>
              Mark All Absent
            </button>
          </div>
        </div>

        {loading ? (
          <div className="attendance-empty">
            Loading attendance...
          </div>
        ) : !selectedClass ? (
          <div className="attendance-empty">
            <div>📅</div>
            <h3>Select a class</h3>
            <p>
              Select a class to start marking attendance.
            </p>
          </div>
        ) : classStudents.length === 0 ? (
          <div className="attendance-empty">
            <div>🎓</div>
            <h3>No students found</h3>
            <p>
              There are no students assigned to this class.
            </p>
          </div>
        ) : (
          <div className="attendance-table-wrapper">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student</th>
                  <th>Roll No.</th>
                  <th>Father Name</th>
                  <th>Attendance</th>
                </tr>
              </thead>

              <tbody>
                {classStudents.map((student, index) => {
                  const status =
                    attendance[student._id] ||
                    "PRESENT";

                  return (
                    <tr key={student._id}>
                      <td>{index + 1}</td>

                      <td>
                        <div className="attendance-student">
                          <div className="attendance-avatar">
                            {student.name
                              ?.charAt(0)
                              ?.toUpperCase() || "S"}
                          </div>

                          <strong>
                            {student.name}
                          </strong>
                        </div>
                      </td>

                      <td>{student.rollNo || "-"}</td>

                      <td>
                        {student.fatherName || "-"}
                      </td>

                      <td>
                        <div className="attendance-buttons">
                          <button
                            className={
                              status === "PRESENT"
                                ? "active present"
                                : ""
                            }
                            onClick={() =>
                              markStatus(
                                student._id,
                                "PRESENT"
                              )
                            }
                          >
                            Present
                          </button>

                          <button
                            className={
                              status === "ABSENT"
                                ? "active absent"
                                : ""
                            }
                            onClick={() =>
                              markStatus(
                                student._id,
                                "ABSENT"
                              )
                            }
                          >
                            Absent
                          </button>

                          <button
                            className={
                              status === "LEAVE"
                                ? "active leave"
                                : ""
                            }
                            onClick={() =>
                              markStatus(
                                student._id,
                                "LEAVE"
                              )
                            }
                          >
                            Leave
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

export default Attendance;