import React, { useEffect, useState } from "react";
import { list } from "../../api";
import "./Profile.css";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await list("accountant/profile");
        setUser(data?.user || data);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            "Profile load nahi ho saka."
        );
      }
    };

    load();
  }, []);

  return (
    <div className="accountant-profile">
      <div className="profile-head">
        <span>ACCOUNTANT</span>
        <h1>My Profile</h1>
        <p>Accountant account information.</p>
      </div>

      {error && <div className="profile-error">{error}</div>}

      <div className="profile-card">
        <div className="profile-avatar">
          {user?.name?.charAt(0)?.toUpperCase() || "A"}
        </div>

        <div className="profile-main">
          <h2>{user?.name || "Accountant"}</h2>

          <span className="role-badge">
            {user?.role || "ACCOUNTANT"}
          </span>
        </div>

        <div className="profile-info">
          <div>
            <span>Email</span>
            <strong>{user?.email || "-"}</strong>
          </div>

          <div>
            <span>Phone</span>
            <strong>{user?.phone || "-"}</strong>
          </div>

          <div>
            <span>Status</span>
            <strong>
              {user?.active === false ? "Inactive" : "Active"}
            </strong>
          </div>

          <div>
            <span>Account ID</span>
            <strong>{user?._id || "-"}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}