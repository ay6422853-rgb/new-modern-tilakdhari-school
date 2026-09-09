import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Sidebar.css";

const menuConfig = {
  PRINCIPAL: [
    { label: "Dashboard", icon: "▦", path: "/principal" },
    { label: "Students", icon: "🎓", path: "/principal/students" },
    { label: "Registration", icon: "📝", path: "/principal/registration" },
    { label: "Admission", icon: "📋", path: "/principal/admission" },
    { label: "Teachers", icon: "👨‍🏫", path: "/principal/teachers" },
    { label: "Classes", icon: "🏫", path: "/principal/classes" },
    { label: "Subjects", icon: "📚", path: "/principal/subjects" },
    { label: "Users", icon: "👥", path: "/principal/users" },
    { label: "Payments", icon: "💰", path: "/principal/payments" },
    { label: "Expenses", icon: "💸", path: "/principal/expenses" },
    { label: "Fee Structure", icon: "🧾", path: "/principal/fees" },
    { label: "Attendance", icon: "✓", path: "/principal/attendance" },
    { label: "Exams", icon: "📝", path: "/principal/exams" },
    { label: "Marks", icon: "📊", path: "/principal/marks" },
    { label: "Homework", icon: "📖", path: "/principal/homework" },
    { label: "Notices", icon: "📢", path: "/principal/notices" },
    { label: "Events", icon: "📅", path: "/principal/events" },
    { label: "Reports", icon: "📈", path: "/principal/reports" },
  ],
};

export default function Sidebar({ mobileOpen, closeMobile }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const role = String(user?.role || "").toUpperCase();
  const menuItems = menuConfig[role] || [];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeMobile}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-logo">S</div>

          <div className="brand-text">
            <h2>SchoolERP</h2>
            <span>Management System</span>
          </div>
        </div>

        <div className="sidebar-role">
          <span className="role-dot" />
          {role}
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/principal"}
              onClick={closeMobile}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <NavLink
            to={`/${role.toLowerCase()}/profile`}
            onClick={closeMobile}
            className="sidebar-link"
          >
            <span className="sidebar-icon">👤</span>
            <span>Profile</span>
          </NavLink>

          <button
            className="sidebar-logout"
            onClick={handleLogout}
          >
            <span>↪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}