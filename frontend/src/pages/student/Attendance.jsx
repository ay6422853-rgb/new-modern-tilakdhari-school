
import { useEffect, useMemo, useState } from "react";
import api from "../../api";
import "./StudentCommon.css";

function Attendance() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    try {
      const res = await api.get("/student/attendance");
      setAttendance(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const present = attendance.filter(
      (x) => x.status === "PRESENT"
    ).length;

    const absent = attendance.filter(
      (x) => x.status === "ABSENT"
    ).length;

    const late = attendance.filter(
      (x) => x.status === "LATE"
    ).length;

    const leave = attendance.filter(
      (x) => x.status === "LEAVE"
    ).length;

    return {
      present,
      absent,
      late,
      leave,
      total: attendance.length,
      percentage: attendance.length
        ? Math.round((present / attendance.length) * 100)
        : 0
    };
  }, [attendance]);

  const filtered = attendance.filter((item) => {
    if (filter === "ALL") return true;
    return item.status === filter;
  });

  return (
    <div className="student-page">
      <div className="student-page-header">
        <div>
          <span className="student-eyebrow">ACADEMICS</span>
          <h1>Attendance</h1>
          <p>Track your daily attendance record.</p>
        </div>

        <button className="student-refresh-btn" onClick={loadAttendance}>
          ↻ Refresh
        </button>
      </div>

      <div className="student-stat-grid">
        <div className="student-stat-card">
          <div className="student-stat-icon">%</div>
          <div>
            <span>Attendance</span>
            <strong>{stats.percentage}%</strong>
          </div>
        </div>

        <div className="student-stat-card">
          <div className="student-stat-icon">P</div>
          <div>
            <span>Present</span>
            <strong>{stats.present}</strong>
          </div>
        </div>

        <div className="student-stat-card">
          <div className="student-stat-icon">A</div>
          <div>
            <span>Absent</span>
            <strong>{stats.absent}</strong>
          </div>
        </div>

        <div className="student-stat-card">
          <div className="student-stat-icon">L</div>
          <div>
            <span>Leave / Late</span>
            <strong>{stats.leave + stats.late}</strong>
          </div>
        </div>
      </div>

      <section className="student-card">
        <div className="student-card-header attendance-toolbar">
          <div>
            <h3>Attendance History</h3>
            <p>{stats.total} attendance records</p>
          </div>

          <select
            className="student-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="ALL">All Records</option>
            <option value="PRESENT">Present</option>
            <option value="ABSENT">Absent</option>
            <option value="LATE">Late</option>
            <option value="LEAVE">Leave</option>
          </select>
        </div>

        {loading ? (
          <div className="student-loading">Loading attendance...</div>
        ) : filtered.length === 0 ? (
          <div className="student-empty">
            No attendance records found.
          </div>
        ) : (
          <div className="student-table-wrap">
            <table className="student-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((item) => {
                  const date = item.date
                    ? new Date(item.date)
                    : null;

                  return (
                    <tr key={item._id}>
                      <td>
                        {date
                          ? date.toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            })
                          : "—"}
                      </td>

                      <td>
                        {date
                          ? date.toLocaleDateString("en-IN", {
                              weekday: "long"
                            })
                          : "—"}
                      </td>

                      <td>
                        <span
                          className={`student-status status-${String(
                            item.status || ""
                          ).toLowerCase()}`}
                        >
                          {item.status || "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default Attendance;
