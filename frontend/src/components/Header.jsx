import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Header.css";

function getPageTitle(pathname) {
  if (pathname === "/principal") return "Dashboard";

  const last = pathname
    .split("/")
    .filter(Boolean)
    .pop();

  const titles = {
    students: "Students",
    registration: "Student Registration",
    admission: "Student Admission",
    teachers: "Teachers",
    classes: "Classes & Sections",
    subjects: "Subjects",
    users: "User Accounts",
    payments: "Payments",
    expenses: "Expenses",
    fees: "Fee Structure",
    attendance: "Attendance",
    exams: "Examinations",
    marks: "Marks",
    homework: "Homework",
    notices: "Notices",
    events: "Events",
    reports: "Reports",
    profile: "My Profile",
    settings: "Settings",
  };

  return titles[last] || "School Management";
}

export default function Header({ onMenuClick }) {
  const location = useLocation();
  const { user } = useAuth();

  const title = getPageTitle(location.pathname);

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          className="menu-button"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          ☰
        </button>

        <div>
          <h1>{title}</h1>
          <p>School Management System</p>
        </div>
      </div>

      <div className="header-right">
        <button className="notification-button">
          🔔
          <span />
        </button>

        <div className="header-user">
          <div className="header-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>

          <div className="header-user-info">
            <strong>{user?.name || "User"}</strong>
            <small>{user?.role || ""}</small>
          </div>
        </div>
      </div>
    </header>
  );
}