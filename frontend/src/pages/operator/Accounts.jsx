
import { useEffect, useMemo, useState } from "react";
import api from "../../api";
import "./Accounts.css";

const emptyEditForm = {
  name: "",
  email: "",
  phone: "",
  active: true,
};

function getId(user) {
  return user?._id || user?.id;
}

function getInitials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("") || "U"
  );
}

function formatDate(date) {
  if (!date) return "-";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "-";
  }

  return value.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function roleLabel(role) {
  if (!role) return "User";

  return String(role)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);

  const [editForm, setEditForm] = useState(emptyEditForm);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/operator/accounts");

      setAccounts(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (err) {
      console.error("LOAD ACCOUNTS ERROR:", err);

      setError(
        err?.response?.data?.message ||
          "Failed to load accounts"
      );
    } finally {
      setLoading(false);
    }
  }

  const roles = useMemo(() => {
    const values = accounts
      .map((user) => user.role)
      .filter(Boolean);

    return [...new Set(values)];
  }, [accounts]);

  const filteredAccounts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return accounts.filter((user) => {
      const matchesSearch =
        !query ||
        String(user.name || "")
          .toLowerCase()
          .includes(query) ||
        String(user.email || "")
          .toLowerCase()
          .includes(query) ||
        String(user.phone || "")
          .toLowerCase()
          .includes(query) ||
        String(user.role || "")
          .toLowerCase()
          .includes(query);

      const matchesRole =
        roleFilter === "ALL" ||
        user.role === roleFilter;

      const isActive =
        user.active !== false;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && isActive) ||
        (statusFilter === "INACTIVE" && !isActive);

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      );
    });
  }, [
    accounts,
    search,
    roleFilter,
    statusFilter,
  ]);

  const totalAccounts = accounts.length;

  const activeAccounts = accounts.filter(
    (user) => user.active !== false
  ).length;

  const inactiveAccounts =
    totalAccounts - activeAccounts;

  function showSuccess(message) {
    setSuccess(message);

    window.setTimeout(() => {
      setSuccess("");
    }, 3000);
  }

  function openEdit(user) {
    setSelectedUser(user);

    setEditForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      active: user.active !== false,
    });

    setError("");
    setEditOpen(true);
  }

  function closeEdit() {
    if (saving) return;

    setEditOpen(false);
    setSelectedUser(null);
    setEditForm(emptyEditForm);
  }

  function openPassword(user) {
    setSelectedUser(user);

    setPassword("");
    setConfirmPassword("");

    setError("");
    setPasswordOpen(true);
  }

  function closePassword() {
    if (passwordSaving) return;

    setPasswordOpen(false);
    setSelectedUser(null);
    setPassword("");
    setConfirmPassword("");
  }

  async function saveEdit(event) {
    event.preventDefault();

    if (!selectedUser) return;

    if (!editForm.name.trim()) {
      setError("Name is required");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const userId = getId(selectedUser);

      await api.put(
        `/operator/accounts/${userId}`,
        {
          name: editForm.name.trim(),
          email: editForm.email.trim(),
          phone: editForm.phone.trim(),
        }
      );

      await api.put(
        `/operator/accounts/${userId}/status`,
        {
          active: editForm.active,
        }
      );

      await loadAccounts();

      closeEdit();

      showSuccess(
        "Account updated successfully"
      );
    } catch (err) {
      console.error("UPDATE ACCOUNT ERROR:", err);

      setError(
        err?.response?.data?.message ||
          "Failed to update account"
      );
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();

    if (!selectedUser) return;

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters"
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setPasswordSaving(true);
      setError("");

      const userId = getId(selectedUser);

      await api.put(
        `/operator/accounts/${userId}/password`,
        {
          password,
        }
      );

      closePassword();

      showSuccess(
        "Password changed successfully"
      );
    } catch (err) {
      console.error(
        "CHANGE PASSWORD ERROR:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to change password"
      );
    } finally {
      setPasswordSaving(false);
    }
  }

  async function toggleStatus(user) {
    const userId = getId(user);

    const newStatus = user.active === false;

    const action = newStatus
      ? "activate"
      : "deactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} this account?`
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.put(
        `/operator/accounts/${userId}/status`,
        {
          active: newStatus,
        }
      );

      await loadAccounts();

      showSuccess(
        newStatus
          ? "Account activated successfully"
          : "Account deactivated successfully"
      );
    } catch (err) {
      console.error(
        "STATUS UPDATE ERROR:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to update account status"
      );
    }
  }

  return (
    <div className="accounts-page">

      {/* HEADER */}
      <div className="accounts-header">
        <div>
          <div className="accounts-breadcrumb">
            Operator / Accounts
          </div>

          <h1>Account Management</h1>

          <p>
            Manage user accounts, contact details,
            passwords and account status.
          </p>
        </div>

        <button
          className="refresh-btn"
          onClick={loadAccounts}
          disabled={loading}
        >
          ↻ Refresh
        </button>
      </div>

      {/* ALERTS */}
      {error && (
        <div className="account-alert error">
          <span>⚠</span>
          {error}

          <button
            onClick={() => setError("")}
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="account-alert success">
          <span>✓</span>
          {success}
        </div>
      )}

      {/* STATS */}
      <div className="account-stats">

        <div className="stat-card">
          <div className="stat-icon blue">👥</div>

          <div>
            <span>Total Accounts</span>
            <strong>{totalAccounts}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">✓</div>

          <div>
            <span>Active</span>
            <strong>{activeAccounts}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon red">⊘</div>

          <div>
            <span>Inactive</span>
            <strong>{inactiveAccounts}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">◆</div>

          <div>
            <span>Roles</span>
            <strong>{roles.length}</strong>
          </div>
        </div>

      </div>

      {/* TOOLBAR */}
      <div className="accounts-toolbar">

        <div className="search-box">
          <span>⌕</span>

          <input
            type="text"
            placeholder="Search by name, email, phone or role..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

          {search && (
            <button
              onClick={() => setSearch("")}
            >
              ×
            </button>
          )}
        </div>

        <select
          value={roleFilter}
          onChange={(event) =>
            setRoleFilter(event.target.value)
          }
        >
          <option value="ALL">
            All Roles
          </option>

          {roles.map((role) => (
            <option
              key={role}
              value={role}
            >
              {roleLabel(role)}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
        >
          <option value="ALL">
            All Status
          </option>

          <option value="ACTIVE">
            Active
          </option>

          <option value="INACTIVE">
            Inactive
          </option>
        </select>

      </div>

      {/* TABLE */}
      <div className="accounts-card">

        <div className="accounts-card-header">
          <div>
            <h2>User Accounts</h2>

            <p>
              Showing{" "}
              <strong>
                {filteredAccounts.length}
              </strong>{" "}
              of {totalAccounts} accounts
            </p>
          </div>
        </div>

        {loading ? (
          <div className="accounts-loading">
            <div className="loader"></div>
            <p>Loading accounts...</p>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="empty-accounts">
            <div className="empty-icon">
              👥
            </div>

            <h3>No accounts found</h3>

            <p>
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="accounts-table">

              <thead>
                <tr>
                  <th>User</th>
                  <th>Contact</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Password</th>
                  <th>Created</th>
                  <th className="action-column">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredAccounts.map((user) => {
                  const userId = getId(user);

                  const active =
                    user.active !== false;

                  return (
                    <tr key={userId}>

                      <td>
                        <div className="user-cell">

                          <div className="user-avatar">
                            {getInitials(
                              user.name
                            )}
                          </div>

                          <div className="user-info">
                            <strong>
                              {user.name || "Unnamed User"}
                            </strong>

                            <span>
                              ID:{" "}
                              {String(userId).slice(-8)}
                            </span>
                          </div>

                        </div>
                      </td>

                      <td>
                        <div className="contact-cell">

                          {user.email && (
                            <span>
                              ✉ {user.email}
                            </span>
                          )}

                          {user.phone && (
                            <span>
                              ☎ {user.phone}
                            </span>
                          )}

                          {!user.email &&
                            !user.phone && (
                              <span className="muted">
                                No contact details
                              </span>
                            )}

                        </div>
                      </td>

                      <td>
                        <span
                          className={`role-badge role-${String(
                            user.role || "USER"
                          ).toLowerCase()}`}
                        >
                          {roleLabel(user.role)}
                        </span>
                      </td>

                      <td>
                        <span
                          className={
                            active
                              ? "status-badge active"
                              : "status-badge inactive"
                          }
                        >
                          <i></i>

                          {active
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      <td>
                        {user.mustChangePassword ? (
                          <span className="password-badge warning">
                            ⚠ Change required
                          </span>
                        ) : (
                          <span className="password-badge">
                            ✓ Set
                          </span>
                        )}
                      </td>

                      <td>
                        <span className="created-date">
                          {formatDate(
                            user.createdAt
                          )}
                        </span>
                      </td>

                      <td>
                        <div className="row-actions">

                          <button
                            className="action-btn edit"
                            title="Edit account"
                            onClick={() =>
                              openEdit(user)
                            }
                          >
                            ✎
                          </button>

                          <button
                            className="action-btn password"
                            title="Change password"
                            onClick={() =>
                              openPassword(user)
                            }
                          >
                            🔑
                          </button>

                          <button
                            className={`action-btn ${
                              active
                                ? "deactivate"
                                : "activate"
                            }`}
                            title={
                              active
                                ? "Deactivate"
                                : "Activate"
                            }
                            onClick={() =>
                              toggleStatus(user)
                            }
                          >
                            {active ? "⊘" : "✓"}
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

      {/* EDIT MODAL */}
      {editOpen && selectedUser && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeEdit();
            }
          }}
        >
          <div className="account-modal">

            <div className="modal-header">

              <div>
                <span className="modal-icon">
                  ✎
                </span>

                <div>
                  <h2>Edit Account</h2>
                  <p>
                    Update user account details
                  </p>
                </div>
              </div>

              <button
                className="modal-close"
                onClick={closeEdit}
              >
                ×
              </button>

            </div>

            <form onSubmit={saveEdit}>

              <div className="modal-body">

                <div className="profile-preview">
                  <div className="large-avatar">
                    {getInitials(
                      selectedUser.name
                    )}
                  </div>

                  <div>
                    <strong>
                      {selectedUser.name}
                    </strong>

                    <span>
                      {roleLabel(
                        selectedUser.role
                      )}
                    </span>
                  </div>
                </div>

                <div className="form-grid">

                  <label>
                    <span>
                      Full Name
                      <b>*</b>
                    </span>

                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(event) =>
                        setEditForm({
                          ...editForm,
                          name: event.target.value,
                        })
                      }
                      placeholder="Enter full name"
                    />
                  </label>

                  <label>
                    <span>Email</span>

                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(event) =>
                        setEditForm({
                          ...editForm,
                          email: event.target.value,
                        })
                      }
                      placeholder="Enter email address"
                    />
                  </label>

                  <label>
                    <span>Phone</span>

                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(event) =>
                        setEditForm({
                          ...editForm,
                          phone: event.target.value,
                        })
                      }
                      placeholder="Enter phone number"
                    />
                  </label>

                  <label>
                    <span>Role</span>

                    <input
                      type="text"
                      value={roleLabel(
                        selectedUser.role
                      )}
                      disabled
                    />
                  </label>

                </div>

                <div className="status-toggle">

                  <div>
                    <strong>
                      Account Status
                    </strong>

                    <span>
                      Allow this user to login
                    </span>
                  </div>

                  <label className="switch">

                    <input
                      type="checkbox"
                      checked={editForm.active}
                      onChange={(event) =>
                        setEditForm({
                          ...editForm,
                          active:
                            event.target.checked,
                        })
                      }
                    />

                    <span></span>

                  </label>

                </div>

              </div>

              <div className="modal-footer">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={closeEdit}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {/* PASSWORD MODAL */}
      {passwordOpen && selectedUser && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closePassword();
            }
          }}
        >
          <div className="account-modal password-modal">

            <div className="modal-header">

              <div>
                <span className="modal-icon password-icon">
                  🔑
                </span>

                <div>
                  <h2>Change Password</h2>
                  <p>
                    Set a new password for this account
                  </p>
                </div>
              </div>

              <button
                className="modal-close"
                onClick={closePassword}
              >
                ×
              </button>

            </div>

            <form onSubmit={changePassword}>

              <div className="modal-body">

                <div className="password-user">

                  <div className="large-avatar">
                    {getInitials(
                      selectedUser.name
                    )}
                  </div>

                  <div>
                    <strong>
                      {selectedUser.name}
                    </strong>

                    <span>
                      {selectedUser.email ||
                        "No email"}
                    </span>
                  </div>

                </div>

                <div className="password-note">
                  <span>ℹ</span>

                  <p>
                    After resetting the password,
                    the user will be required to
                    change it on their next login.
                  </p>
                </div>

                <label className="full-label">
                  <span>
                    New Password
                    <b>*</b>
                  </span>

                  <input
                    type="password"
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    placeholder="Minimum 6 characters"
                    autoFocus
                  />
                </label>

                <label className="full-label">
                  <span>
                    Confirm Password
                    <b>*</b>
                  </span>

                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value
                      )
                    }
                    placeholder="Re-enter new password"
                  />
                </label>

              </div>

              <div className="modal-footer">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={closePassword}
                  disabled={passwordSaving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="password-save-btn"
                  disabled={passwordSaving}
                >
                  {passwordSaving
                    ? "Changing..."
                    : "Change Password"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
