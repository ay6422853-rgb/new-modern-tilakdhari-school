
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import "./TeacherPanel.css";

export default function TeacherDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await api.get("/teacher/dashboard");
      setData(res.data);
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="teacher-loading">
        <div className="teacher-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const teacher = data?.teacher;
  const stats = data?.stats || {};

  const classTeacherClasses = data?.classTeacherClasses || [];
  const teachingClasses = data?.teachingClasses || [];

  return (
    <div className="teacher-page">

      {/* Header */}
      <div className="teacher-page-header">
        <div>
          <span className="teacher-eyebrow">
            TEACHER PANEL
          </span>

          <h1>
            Good Morning, {teacher?.name || "Teacher"} 👋
          </h1>

          <p>
            Manage your classes, students, attendance,
            exams, marks and timetable.
          </p>
        </div>

        <Link
          to="/teacher/profile"
          className="teacher-profile-btn"
        >
          <span>👤</span>
          My Profile
        </Link>
      </div>

      {/* Stats */}
      <div className="teacher-stat-grid">

        {/* Class Teacher Classes */}
        <div className="teacher-stat-card">
          <div className="teacher-stat-icon blue">
            🏫
          </div>

          <div>
            <span>Class Teacher Classes</span>
            <strong>
              {stats.classTeacherClasses || 0}
            </strong>
          </div>
        </div>

        {/* Teaching Classes */}
        <div className="teacher-stat-card">
          <div className="teacher-stat-icon purple">
            📚
          </div>

          <div>
            <span>Teaching Classes</span>
            <strong>
              {stats.teachingClasses || 0}
            </strong>
          </div>
        </div>

        {/* Students */}
        <div className="teacher-stat-card">
          <div className="teacher-stat-icon green">
            👨‍🎓
          </div>

          <div>
            <span>My Class Students</span>
            <strong>
              {stats.classTeacherStudents || 0}
            </strong>
          </div>
        </div>

        {/* Exams */}
        <div className="teacher-stat-card">
          <div className="teacher-stat-icon orange">
            📝
          </div>

          <div>
            <span>Exams</span>
            <strong>
              {stats.exams || 0}
            </strong>
          </div>
        </div>

      </div>

      {/* Quick Actions */}
      <section className="teacher-section">

        <div className="teacher-section-title">
          <div>
            <h2>Quick Actions</h2>
            <p>
              Frequently used teacher tools
            </p>
          </div>
        </div>

        <div className="teacher-action-grid">

          {/* Students */}
          <Link
            to="/teacher/students"
            className="teacher-action-card"
          >
            <div className="action-icon blue">
              👨‍🎓
            </div>

            <div>
              <h3>Students</h3>
              <p>
                View students from your classes
              </p>
            </div>

            <span>→</span>
          </Link>

          {/* Attendance */}
          <Link
            to="/teacher/attendance"
            className="teacher-action-card"
          >
            <div className="action-icon green">
              ✓
            </div>

            <div>
              <h3>Attendance</h3>
              <p>
                Mark today's attendance
              </p>
            </div>

            <span>→</span>
          </Link>

          {/* Exams */}
          <Link
            to="/teacher/exams"
            className="teacher-action-card"
          >
            <div className="action-icon purple">
              📅
            </div>

            <div>
              <h3>Exams</h3>
              <p>
                View upcoming exams
              </p>
            </div>

            <span>→</span>
          </Link>

          {/* Marks */}
          <Link
            to="/teacher/marks"
            className="teacher-action-card"
          >
            <div className="action-icon orange">
              📊
            </div>

            <div>
              <h3>Marks</h3>
              <p>
                Enter student marks
              </p>
            </div>

            <span>→</span>
          </Link>

          {/* Homework */}
          <Link
            to="/teacher/homework"
            className="teacher-action-card"
          >
            <div className="action-icon blue">
              📖
            </div>

            <div>
              <h3>Homework</h3>
              <p>
                Manage class homework
              </p>
            </div>

            <span>→</span>
          </Link>

          {/* Timetable */}
          <Link
            to="/teacher/timetable"
            className="teacher-action-card"
          >
            <div className="action-icon purple">
              🗓️
            </div>

            <div>
              <h3>Timetable</h3>
              <p>
                View your teaching timetable
              </p>
            </div>

            <span>→</span>
          </Link>

        </div>
      </section>

      {/* Class Information */}
      <div className="teacher-two-column">

        {/* Class Teacher Classes */}
        <section className="teacher-panel-card">

          <div className="teacher-panel-heading">
            <div>
              <h2>
                Class Teacher Classes
              </h2>

              <p>
                Classes assigned to you as class teacher
              </p>
            </div>

            <Link to="/teacher/classes">
              View All
            </Link>
          </div>

          {classTeacherClasses.length > 0 ? (
            <div className="teacher-class-list">

              {classTeacherClasses.map((item) => (
                <div
                  className="teacher-class-item"
                  key={item._id}
                >

                  <div className="class-avatar">
                    {item.name
                      ?.charAt(0)
                      ?.toUpperCase() || "C"}
                  </div>

                  <div>
                    <strong>
                      {item.name}
                    </strong>

                    <span>
                      {item.classCode || "Class"}

                      {item.sections?.length
                        ? ` • ${item.sections.length} Sections`
                        : ""}
                    </span>
                  </div>

                </div>
              ))}

            </div>
          ) : (
            <div className="teacher-empty">
              No class assigned as Class Teacher.
            </div>
          )}

        </section>

        {/* Teaching Classes */}
        <section className="teacher-panel-card">

          <div className="teacher-panel-heading">
            <div>
              <h2>
                Teaching Classes
              </h2>

              <p>
                Classes assigned through timetable
              </p>
            </div>

            <Link to="/teacher/timetable">
              Timetable
            </Link>
          </div>

          {teachingClasses.length > 0 ? (
            <div className="teacher-class-list">

              {teachingClasses.map((item) => (
                <div
                  className="teacher-class-item"
                  key={item._id}
                >

                  <div className="class-avatar purple">
                    {item.name
                      ?.charAt(0)
                      ?.toUpperCase() || "C"}
                  </div>

                  <div>
                    <strong>
                      {item.name}
                    </strong>

                    <span>
                      {item.classCode ||
                        "Teaching Class"}
                    </span>
                  </div>

                </div>
              ))}

            </div>
          ) : (
            <div className="teacher-empty">
              No teaching class assigned through timetable.
            </div>
          )}

        </section>

      </div>

    </div>
  );
}
