import { useState } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import "./AppLayout.css";

const menuConfig = {
  PRINCIPAL: [
    { label: "Dashboard", path: "/principal", icon: "▦" },
    { label: "Students", path: "/principal/students", icon: "👨‍🎓" },
    { label: "Teachers", path: "/principal/teachers", icon: "👨‍🏫" },
    { label: "Classes", path: "/principal/classes", icon: "🏫" },
    { label: "Subjects", path: "/principal/subjects", icon: "📚" },
    { label: "Users / Accounts", path: "/principal/users", icon: "👥" },
    { label: "Payments", path: "/principal/payments", icon: "💳" },
    { label: "Expenses", path: "/principal/expenses", icon: "💰" },
    { label: "Fee Structure", path: "/principal/fees", icon: "🧾" },
    { label: "Attendance", path: "/principal/attendance", icon: "📅" },
    { label: "Exams", path: "/principal/exams", icon: "📋" },
    { label: "Marks", path: "/principal/marks", icon: "📊" },
    { label: "Homework", path: "/principal/homework", icon: "📖" },
    { label: "Notices", path: "/principal/notices", icon: "📢" },
    { label: "Events", path: "/principal/events", icon: "🎉" },
    { label: "Cashbook", path: "/principal/cashbook", icon: "💼" },
    { label: "Reports", path: "/principal/reports", icon: "📈" },
    { label: "Profile", path: "/principal/profile", icon: "👤" },
    { label: "Settings", path: "/principal/settings", icon: "⚙️" },
  ],

  ACCOUNTANT: [
    { label: "Dashboard", path: "/accountant", icon: "▦" },
    { label: "Registration", path: "/accountant/registration", icon: "📝" },
    { label: "Payments", path: "/accountant/payments", icon: "💳" },
    { label: "Expenses", path: "/accountant/expenses", icon: "💰" },
    { label: "Fees", path: "/accountant/fees", icon: "💰" },
    { label: "Fee Structure", path: "/accountant/fee-structure", icon: "🧾" },
    { label: "Cashbook", path: "/accountant/cashbook", icon: "💼" },
    { label: "Reports", path: "/accountant/reports", icon: "📈" },
    { label: "Profile", path: "/accountant/profile", icon: "👤" },

  ],

  OPERATOR: [
    { label: "Dashboard", path: "/operator", icon: "▦" },
    { label: "Students", path: "/operator/students", icon: "👨‍🎓" },
    { label: "Classes", path: "/operator/classes", icon: "🏫" },
    { label: "Subjects", path: "/operator/subjects", icon: "🏫" },
    { label: "Teachers", path: "/operator/teachers", icon: "👨‍🏫" },
    { label: "Attendance", path: "/operator/attendance", icon: "📅" },
    { label: "Exams", path: "/operator/exams", icon: "📋" },
    { label: "Marks", path: "/operator/marks", icon: "📊" },
    { label: "Accounts", path: "/operator/accounts", icon: "📊" },
    { label: "Time Table", path: "/operator/timetable", icon: "📋" },
    { label: "Notices", path: "/operator/notices", icon: "📢" },
    { label: "Profile", path: "/operator/profile", icon: "👤" },
  ],

  TEACHER: [
    { label: "Dashboard", path: "/teacher", icon: "▦" },
    { label: "Students", path: "/teacher/students", icon: "👨‍🎓" },
    { label: "Attendance", path: "/teacher/attendance", icon: "📅" },
    { label: "Time Table", path: "/teacher/homework", icon: "📖" },
    { label: "Exams", path: "/teacher/exams", icon: "📋" },
    { label: "Marks", path: "/teacher/marks", icon: "📊" },
    { label: "Notices", path: "/teacher/notices", icon: "📢" },
    { label: "Profile", path: "/teacher/profile", icon: "👤" },
  ],

  PARENT: [
    { label: "Dashboard", path: "/parent", icon: "▦" },
    { label: "My Children", path: "/parent/children", icon: "👨‍👩‍👧" },
    { label: "Attendance", path: "/parent/attendance", icon: "📅" },
    { label: "Fees", path: "/parent/fees", icon: "💳" },
    { label: "Homework", path: "/parent/homework", icon: "📖" },
    { label: "Timetable", path: "/parent/timetable", icon: "🗓️" },
    { label: "Exams", path: "/parent/exams", icon: "📋" },
    { label: "Results", path: "/parent/results", icon: "📊" },
    { label: "Notices", path: "/parent/notices", icon: "📢" },
    { label: "Events", path: "/parent/events", icon: "🎉" },
    { label: "Documents", path: "/parent/documents", icon: "📁" },
    { label: "Profile", path: "/parent/profile", icon: "👤" },
  ],

  STUDENT: [
    { label: "Dashboard", path: "/student", icon: "▦" },
    { label: "My Profile", path: "/student/profile", icon: "👤" },
    { label: "Attendance", path: "/student/attendance", icon: "📅" },
    { label: "Fees", path: "/student/fees", icon: "💳" },
    { label: "Timetable", path: "/student/timetable", icon: "🗓️" },
    { label: "Exams", path: "/student/exams", icon: "📋" },
    { label: "Results", path: "/student/results", icon: "📊" },
    { label: "Notices", path: "/student/notices", icon: "📢" },
  ],
};

const pageTitles = {
  students: "Students",
  registration: "Student Registration",
  admission: "Student Admission",
  teachers: "Teachers",
  classes: "Classes & Sections",
  subjects: "Subjects",
  users: "Users / Accounts",
  payments: "Payments",
  expenses: "Expenses",
  fees: "Fee Structure",
  attendance: "Attendance",
  exams: "Examinations",
  marks: "Marks",
  homework: "Homework",
  notices: "Notices",
  events: "Events",
  cashbook: "Cashbook",
  reports: "Reports",
  profile: "My Profile",
  settings: "Settings",
  timetable: "Timetable",
  children: "My Children",
  results: "Results",
  documents: "Documents",
};

export default function AppLayout({
  role,
  children,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentRole = String(
    user?.role || role || "PRINCIPAL"
  ).toUpperCase();

  const menu = menuConfig[currentRole] || [];

  const basePath = `/${currentRole.toLowerCase()}`;

  const getPageTitle = () => {
    if (location.pathname === basePath) {
      switch (currentRole) {
        case "PRINCIPAL":
          return "Principal Dashboard";

        case "ACCOUNTANT":
          return "Accountant Dashboard";

        case "OPERATOR":
          return "Operator Dashboard";

        case "TEACHER":
          return "Teacher Dashboard";

        case "PARENT":
          return "Parent Dashboard";

        case "STUDENT":
          return "Student Dashboard";

        default:
          return "Dashboard";
      }
    }

    const lastPart = location.pathname
      .split("/")
      .filter(Boolean)
      .pop();

    return pageTitles[lastPart] || "School Management";
  };

  const handleLogout = () => {
    setSidebarOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="app-layout">

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeSidebar}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`sidebar ${
          sidebarOpen ? "sidebar-open" : ""
        }`}
      >

        {/* BRAND */}
        <div className="sidebar-brand">

          <div className="brand-logo">
            V
          </div>

          <div className="brand-text">
            <h2>Vidyapeeth</h2>
            <span>School Management</span>
          </div>

          <button
            className="sidebar-close"
            onClick={closeSidebar}
            aria-label="Close menu"
          >
            ×
          </button>

        </div>

        {/* ROLE */}
        <div className="menu-title">
          {currentRole} PANEL
        </div>

        {/* MENU */}
        <nav className="sidebar-nav">

          {menu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === basePath}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `sidebar-link ${
                  isActive ? "active" : ""
                }`
              }
            >
              <span className="menu-icon">
                {item.icon}
              </span>

              <span className="menu-label">
                {item.label}
              </span>
            </NavLink>
          ))}

        </nav>

        {/* SIDEBAR BOTTOM */}
        <div className="sidebar-bottom">

          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            <span>↪</span>
            <span>Logout</span>
          </button>

        </div>

      </aside>

      {/* MAIN AREA */}
      <div className="main-area">

        {/* HEADER */}
        <header className="top-header">

          <div className="header-left">

            <button
              className="mobile-menu"
              onClick={() =>
                setSidebarOpen(true)
              }
              aria-label="Open menu"
            >
              ☰
            </button>

            <div className="header-title">

              <h1>
                {getPageTitle()}
              </h1>

              <p>
                Welcome back,{" "}
                {user?.name || currentRole}
              </p>

            </div>

          </div>

          <div className="header-right">

            <button
              className="notification-btn"
              type="button"
              aria-label="Notifications"
            >
              🔔
              <span className="notification-dot" />
            </button>

            <div className="profile-box">

              <div className="profile-avatar">
                {(user?.name || "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="profile-info">

                <strong>
                  {user?.name || "User"}
                </strong>

                <span>
                  {user?.role || currentRole}
                </span>

              </div>

            </div>

          </div>

        </header>

        {/* PAGE CONTENT */}
        <main className="page-content">
          {children || <Outlet />}
        </main>

      </div>

    </div>
  );
}