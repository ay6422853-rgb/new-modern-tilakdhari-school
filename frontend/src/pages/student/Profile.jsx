
import { useEffect, useState } from "react";
import api from "../../api";
import "./StudentCommon.css";

function MyProfile() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await api.get("/student/profile");
      setStudent(res.data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load profile"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="student-page">
        <div className="student-loading">Loading profile...</div>
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

  const className =
    student?.className || student?.classId?.name || "Not assigned";

  return (
    <div className="student-page">
      <div className="student-page-header">
        <div>
          <span className="student-eyebrow">ACCOUNT</span>
          <h1>My Profile</h1>
          <p>View your personal and academic information.</p>
        </div>

        <button className="student-refresh-btn" onClick={loadProfile}>
          ↻ Refresh
        </button>
      </div>

      <section className="student-profile-card">
        <div className="student-profile-top">
          <div className="student-avatar xl">
            {(student?.name || "S").charAt(0).toUpperCase()}
          </div>

          <div>
            <h2>{student?.name || "Student"}</h2>
            <p>
              Student ID: {student?.studentId || "Not available"}
            </p>
            <span className="student-status-badge">
              {student?.status || "REGISTERED"}
            </span>
          </div>
        </div>
      </section>

      <div className="student-info-grid">
        <section className="student-card">
          <div className="student-card-header">
            <div>
              <h3>Personal Information</h3>
              <p>Your basic details</p>
            </div>
          </div>

          <div className="student-detail-grid">
            <div>
              <span>Full Name</span>
              <strong>{student?.name || "—"}</strong>
            </div>

            <div>
              <span>Gender</span>
              <strong>{student?.gender || "—"}</strong>
            </div>

            <div>
              <span>Date of Birth</span>
              <strong>
                {student?.dob
                  ? new Date(student.dob).toLocaleDateString("en-IN")
                  : "—"}
              </strong>
            </div>

            <div>
              <span>Phone</span>
              <strong>{student?.phone || "—"}</strong>
            </div>

            <div>
              <span>Email</span>
              <strong>{student?.email || "—"}</strong>
            </div>

            <div>
              <span>Session</span>
              <strong>{student?.session || "—"}</strong>
            </div>
          </div>
        </section>

        <section className="student-card">
          <div className="student-card-header">
            <div>
              <h3>Academic Information</h3>
              <p>Current academic details</p>
            </div>
          </div>

          <div className="student-detail-grid">
            <div>
              <span>Student ID</span>
              <strong>{student?.studentId || "—"}</strong>
            </div>

            <div>
              <span>Registration No.</span>
              <strong>{student?.registrationNo || "—"}</strong>
            </div>

            <div>
              <span>Admission No.</span>
              <strong>{student?.admissionNo || "—"}</strong>
            </div>

            <div>
              <span>Class</span>
              <strong>{className}</strong>
            </div>

            <div>
              <span>Section</span>
              <strong>{student?.section || "—"}</strong>
            </div>

            <div>
              <span>Roll No.</span>
              <strong>{student?.rollNo || "—"}</strong>
            </div>
          </div>
        </section>
      </div>

      <section className="student-card">
        <div className="student-card-header">
          <div>
            <h3>Parent / Guardian</h3>
            <p>Parent information connected with your account</p>
          </div>
        </div>

        <div className="student-detail-grid">
          <div>
            <span>Name</span>
            <strong>{student?.parent?.name || "—"}</strong>
          </div>

          <div>
            <span>Relation</span>
            <strong>{student?.parent?.relation || "—"}</strong>
          </div>

          <div>
            <span>Phone</span>
            <strong>{student?.parent?.phone || "—"}</strong>
          </div>

          <div>
            <span>Email</span>
            <strong>{student?.parent?.email || "—"}</strong>
          </div>

          <div className="student-detail-full">
            <span>Address</span>
            <strong>{student?.address || student?.parent?.address || "—"}</strong>
          </div>
        </div>
      </section>
    </div>
  );
}

export default MyProfile;
