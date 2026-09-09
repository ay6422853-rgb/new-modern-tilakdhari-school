
import { useEffect, useState } from "react";
import api from "../../api";
import "./StudentCommon.css";

function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get("/student/dashboard");
      setData(res.data);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load dashboard"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="student-page">
        <div className="student-loading">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-page">
        <div className="student-error">{error}</div>
      </div>
    );
  }

  const student = data?.student;
  const attendance = data?.attendance || [];
  const payments = data?.payments || [];
  const homework = data?.homework || [];
  const marks = data?.marks || [];
  const exams = data?.exams || [];
  const notices = data?.notices || [];

  const present = attendance.filter(
    (item) => item.status === "PRESENT"
  ).length;

  const attendancePercentage = attendance.length
    ? Math.round((present / attendance.length) * 100)
    : 0;

  const totalFees = payments.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  return (
    <div className="student-page">
      <div className="student-page-header">
        <div>
          <span className="student-eyebrow">STUDENT PORTAL</span>
          <h1>Good to see you, {student?.name || "Student"}</h1>
          <p>
            {student?.className || student?.classId?.name || "Class"}{" "}
            {student?.section ? `• Section ${student.section}` : ""}
          </p>
        </div>

        <button className="student-refresh-btn" onClick={loadDashboard}>
          ↻ Refresh
        </button>
      </div>

      <div className="student-profile-banner">
        <div className="student-avatar large">
          {(student?.name || "S").charAt(0).toUpperCase()}
        </div>

        <div className="student-banner-info">
          <h2>{student?.name || "Student"}</h2>
          <p>
            Student ID: {student?.studentId || "Not available"}
          </p>
          <div className="student-banner-tags">
            <span>
              {student?.className || student?.classId?.name || "Class"}
            </span>
            {student?.section && <span>Section {student.section}</span>}
            {student?.rollNo && <span>Roll {student.rollNo}</span>}
          </div>
        </div>

        <div className="student-status-badge">
          {student?.status || "REGISTERED"}
        </div>
      </div>

      <div className="student-stat-grid">
        <div className="student-stat-card">
          <div className="student-stat-icon">A</div>
          <div>
            <span>Attendance</span>
            <strong>{attendancePercentage}%</strong>
          </div>
        </div>

        <div className="student-stat-card">
          <div className="student-stat-icon">₹</div>
          <div>
            <span>Total Payments</span>
            <strong>₹{totalFees.toLocaleString()}</strong>
          </div>
        </div>

        <div className="student-stat-card">
          <div className="student-stat-icon">E</div>
          <div>
            <span>Exams</span>
            <strong>{exams.length}</strong>
          </div>
        </div>

        <div className="student-stat-card">
          <div className="student-stat-icon">R</div>
          <div>
            <span>Results</span>
            <strong>{marks.length}</strong>
          </div>
        </div>
      </div>

      <div className="student-dashboard-grid">
        <section className="student-card">
          <div className="student-card-header">
            <div>
              <h3>Upcoming Exams</h3>
              <p>Your scheduled examinations</p>
            </div>
          </div>

          {exams.length === 0 ? (
            <div className="student-empty">No exams available.</div>
          ) : (
            <div className="student-list">
              {exams.slice(0, 5).map((exam) => (
                <div className="student-list-item" key={exam._id}>
                  <div className="student-list-main">
                    <strong>{exam.name}</strong>
                    <span>
                      {exam.className ||
                        exam.classId?.name ||
                        "Class"}
                    </span>
                  </div>

                  <div className="student-list-value">
                    {exam.date
                      ? new Date(exam.date).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          }
                        )
                      : "Date not set"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="student-card">
          <div className="student-card-header">
            <div>
              <h3>Latest Notices</h3>
              <p>School announcements</p>
            </div>
          </div>

          {notices.length === 0 ? (
            <div className="student-empty">No notices available.</div>
          ) : (
            <div className="student-list">
              {notices.slice(0, 5).map((notice) => (
                <div className="student-list-item notice-item" key={notice._id}>
                  <div className="student-notice-dot" />
                  <div className="student-list-main">
                    <strong>{notice.title}</strong>
                    <span>
                      {notice.body?.slice(0, 80)}
                      {notice.body?.length > 80 ? "..." : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="student-card">
        <div className="student-card-header">
          <div>
            <h3>Recent Homework</h3>
            <p>Latest work assigned to your class</p>
          </div>
        </div>

        {homework.length === 0 ? (
          <div className="student-empty">No homework available.</div>
        ) : (
          <div className="student-table-wrap">
            <table className="student-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Subject</th>
                  <th>Due Date</th>
                  <th>Description</th>
                </tr>
              </thead>

              <tbody>
                {homework.slice(0, 6).map((item) => (
                  <tr key={item._id}>
                    <td>
                      <strong>{item.title}</strong>
                    </td>
                    <td>
                      {item.subject?.name || "—"}
                    </td>
                    <td>
                      {item.dueDate
                        ? new Date(item.dueDate).toLocaleDateString(
                            "en-IN"
                          )
                        : "—"}
                    </td>
                    <td>
                      {item.description
                        ? item.description.slice(0, 80)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default StudentDashboard;
