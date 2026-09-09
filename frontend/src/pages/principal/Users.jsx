import { useEffect, useState } from "react";
import { create, list, update } from "../../api";
import "./Users.css";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "ACCOUNTANT",
  active: true,
};

const roles = [
  {
    value: "ACCOUNTANT",
    label: "Accountant",
  },
  {
    value: "OPERATOR",
    label: "Computer Operator",
  },
  {
    value: "TEACHER",
    label: "Teacher",
  },
  {
    value: "PARENT",
    label: "Parent",
  },
  {
    value: "STUDENT",
    label: "Student",
  },
];

export default function Users() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(initialForm);

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);

      const data = await list(
        "principal/users"
      );

      setUsers(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load accounts."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: form.role,
        active: form.active,
      };

      if (!editingId) {
        if (!form.password.trim()) {
          setError(
            "Password is required for a new account."
          );

          setSaving(false);
          return;
        }

        payload.password = form.password;

        await create(
          "principal/users",
          payload
        );

        setMessage(
          "Account created successfully."
        );
      } else {
        if (form.password.trim()) {
          payload.password = form.password;
        }

        await update(
          "principal/users",
          editingId,
          payload
        );

        setMessage(
          "Account updated successfully."
        );
      }

      resetForm();
      await loadUsers();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save account."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (user) => {
    setEditingId(user._id);

    setForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      password: "",
      role: user.role || "ACCOUNTANT",
      active: user.active !== false,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const getRoleLabel = (role) => {
    const found = roles.find(
      (item) => item.value === role
    );

    return found?.label || role;
  };

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h2>Users / Accounts</h2>
          <p>
            Create and manage school login accounts.
          </p>
        </div>

        <div className="users-badge">
          {users.length} ACCOUNTS
        </div>
      </div>

      {message && (
        <div className="users-alert users-success">
          <span>✓</span>
          {message}
        </div>
      )}

      {error && (
        <div className="users-alert users-error">
          <span>!</span>
          {error}
        </div>
      )}

      <div className="users-form-card">
        <div className="users-card-header">
          <div className="users-card-icon">
            👥
          </div>

          <div>
            <h3>
              {editingId
                ? "Edit Account"
                : "Create New Account"}
            </h3>

            <p>
              Create login credentials for school users.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="users-form-grid">
            <div className="users-field">
              <label>
                Full Name <span>*</span>
              </label>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter full name"
                required
              />
            </div>

            <div className="users-field">
              <label>Email Address</label>

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter email"
              />
            </div>

            <div className="users-field">
              <label>Phone Number</label>

              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter mobile number"
              />
            </div>

            <div className="users-field">
              <label>
                Account Role <span>*</span>
              </label>

              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                required
              >
                {roles.map((role) => (
                  <option
                    key={role.value}
                    value={role.value}
                  >
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="users-field">
              <label>
                Password{" "}
                {editingId ? (
                  "(optional)"
                ) : (
                  <span>*</span>
                )}
              </label>

              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder={
                  editingId
                    ? "Leave blank to keep current"
                    : "Enter initial password"
                }
                required={!editingId}
              />

              {!editingId && (
                <small>
                  User will be required to change the
                  password after first login.
                </small>
              )}
            </div>

            <div className="users-checkbox">
              <input
                id="users-active"
                type="checkbox"
                name="active"
                checked={form.active}
                onChange={handleChange}
              />

              <label htmlFor="users-active">
                Account Active
              </label>
            </div>
          </div>

          <div className="users-actions">
            {editingId && (
              <button
                type="button"
                className="users-secondary-btn"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              className="users-primary-btn"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId
                ? "Update Account"
                : "Create Account"}
            </button>
          </div>
        </form>
      </div>

      <div className="users-table-card">
        <div className="users-table-header">
          <div>
            <h3>All Accounts</h3>
            <p>
              Staff and user login accounts.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="users-empty">
            <div className="users-loader"></div>
            Loading accounts...
          </div>
        ) : users.length === 0 ? (
          <div className="users-empty">
            <div className="users-empty-icon">
              👥
            </div>

            <strong>No accounts found</strong>

            <span>
              Create an account above.
            </span>
          </div>
        ) : (
          <div className="users-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>User</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user, index) => (
                  <tr key={user._id}>
                    <td className="users-index">
                      {index + 1}
                    </td>

                    <td>
                      <div className="users-user-cell">
                        <div className="users-avatar">
                          {(user.name || "U")
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <strong>
                            {user.name}
                          </strong>

                          {user.mustChangePassword && (
                            <small>
                              Password change required
                            </small>
                          )}
                        </div>
                      </div>
                    </td>

                    <td>
                      {user.email || "—"}
                    </td>

                    <td>
                      {user.phone || "—"}
                    </td>

                    <td>
                      <span className="users-role">
                        {getRoleLabel(user.role)}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`users-status ${
                          user.active
                            ? "users-status-active"
                            : "users-status-inactive"
                        }`}
                      >
                        <span></span>

                        {user.active
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="users-edit-btn"
                        onClick={() =>
                          handleEdit(user)
                        }
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}