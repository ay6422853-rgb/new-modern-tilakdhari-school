import { useEffect, useState } from "react";
import api from "../../api";
import "./Dashboard.css";

function Dashboard() {
  const [data, setData] = useState({
    students: 0,
    teachers: 0,
    parents: 0,
    classes: 0,
    subjects: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await api.get("/operator/dashboard");
      setData(res.data);
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      title: "Total Students",
      value: data.students,
      icon: "🎓",
      className: "blue",
    },
    {
      title: "Total Teachers",
      value: data.teachers,
      icon: "👨‍🏫",
      className: "green",
    },
    {
      title: "Total Parents",
      value: data.parents,
      icon: "👨‍👩‍👧",
      className: "orange",
    },
    {
      title: "Total Classes",
      value: data.classes,
      icon: "🏫",
      className: "purple",
    },
    {
      title: "Total Subjects",
      value: data.subjects,
      icon: "📚",
      className: "red",
    },
  ];

  return (
    <div className="operator-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Computer Operator Dashboard</h1>
          <p>Manage school operations from one place.</p>
        </div>

        <div className="dashboard-badge">
          🖥️ Computer Operator
        </div>
      </div>

      {loading ? (
        <div className="dashboard-loading">
          Loading dashboard...
        </div>
      ) : (
        <>
          <div className="dashboard-cards">
            {cards.map((card) => (
              <div
                className={`dashboard-card ${card.className}`}
                key={card.title}
              >
                <div className="dashboard-card-icon">
                  {card.icon}
                </div>

                <div className="dashboard-card-content">
                  <span>{card.title}</span>
                  <strong>{card.value}</strong>
                </div>
              </div>
            ))}
          </div>

          <div className="dashboard-grid">
            <div className="dashboard-panel">
              <div className="panel-header">
                <div>
                  <h2>Quick Actions</h2>
                  <p>Frequently used operator functions</p>
                </div>
              </div>

              <div className="quick-actions">
                <button>
                  🎓
                  <span>
                    <strong>Manage Students</strong>
                    <small>Add and update students</small>
                  </span>
                </button>

                <button>
                  📅
                  <span>
                    <strong>Attendance</strong>
                    <small>Mark today's attendance</small>
                  </span>
                </button>

                <button>
                  🏫
                  <span>
                    <strong>Manage Classes</strong>
                    <small>Create and update classes</small>
                  </span>
                </button>

                <button>
                  📚
                  <span>
                    <strong>Manage Subjects</strong>
                    <small>Manage school subjects</small>
                  </span>
                </button>
              </div>
            </div>

            <div className="dashboard-panel operator-info">
              <div className="panel-header">
                <div>
                  <h2>Operator Responsibilities</h2>
                  <p>Your current system permissions</p>
                </div>
              </div>

              <div className="permission-list">
                <div>
                  <span>Students</span>
                  <b>Manage</b>
                </div>

                <div>
                  <span>Attendance</span>
                  <b>Manage</b>
                </div>

                <div>
                  <span>Classes</span>
                  <b>Manage</b>
                </div>

                <div>
                  <span>Subjects</span>
                  <b>Manage</b>
                </div>

                <div>
                  <span>Timetable</span>
                  <b>Full Control</b>
                </div>

                <div>
                  <span>Fees / Expenses</span>
                  <b className="restricted">Restricted</b>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;