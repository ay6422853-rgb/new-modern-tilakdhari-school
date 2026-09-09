
import { useEffect, useState } from "react";
import api from "../../api";
import "./TeacherAcademics.css";

export default function TeacherProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);

      const res = await api.get("/teacher/profile", {
        params: { _t: Date.now() },
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      const payload = res.data;

      setProfile(
        payload?.teacher ||
          payload?.profile ||
          payload?.data ||
          payload
      );
    } catch (error) {
      console.error("Teacher profile error:", error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="teacher-academic-page">
        <div className="academic-loading">
          Loading profile...
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="teacher-academic-page">
        <div className="academic-empty">
          <div className="empty-icon">👤</div>
          <h3>Profile not found</h3>
          <p>Teacher profile could not be loaded.</p>
          <button
            className="academic-refresh"
            onClick={loadProfile}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const user = profile.user || {};

  const subjects = Array.isArray(profile.subjects)
    ? profile.subjects
    : [];

  return (
    <div className="teacher-academic-page">
      <div className="academic-header">
        <div>
          <h1>My Profile</h1>
          <p>View your teacher information</p>
        </div>

        <button className="academic-refresh" onClick={loadProfile}>
          ↻ Refresh
        </button>
      </div>

      <div className="profile-card">
        <div className="profile-avatar">
          {(profile.name || user.name || "T")
            .charAt(0)
            .toUpperCase()}
        </div>

        <div className="profile-main">
          <h2>{profile.name || user.name || "Teacher"}</h2>

          <span className="profile-role">
            Teacher
          </span>

          {profile.employeeId && (
            <p>
              Employee ID: <strong>{profile.employeeId}</strong>
            </p>
          )}
        </div>
      </div>

      <div className="profile-section">
        <h2>Personal Information</h2>

        <div className="profile-grid">
          <div className="profile-field">
            <span>Name</span>
            <strong>
              {profile.name || user.name || "—"}
            </strong>
          </div>

          <div className="profile-field">
            <span>Employee ID</span>
            <strong>{profile.employeeId || "—"}</strong>
          </div>

          <div className="profile-field">
            <span>Email</span>
            <strong>
              {profile.email || user.email || "—"}
            </strong>
          </div>

          <div className="profile-field">
            <span>Phone</span>
            <strong>
              {profile.phone || user.phone || "—"}
            </strong>
          </div>

          <div className="profile-field">
            <span>Qualification</span>
            <strong>
              {profile.qualification || "—"}
            </strong>
          </div>

          <div className="profile-field">
            <span>Joining Date</span>
            <strong>
              {profile.joiningDate
                ? new Date(
                    profile.joiningDate
                  ).toLocaleDateString("en-IN")
                : "—"}
            </strong>
          </div>
        </div>
      </div>

      <div className="profile-section">
        <h2>Subjects</h2>

        {subjects.length === 0 ? (
          <p className="profile-muted">
            No subjects assigned.
          </p>
        ) : (
          <div className="profile-subjects">
            {subjects.map((subject, index) => (
              <div
                className="profile-subject"
                key={subject._id || index}
              >
                <strong>
                  {subject.name || "Subject"}
                </strong>

                {subject.code && (
                  <span>{subject.code}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
