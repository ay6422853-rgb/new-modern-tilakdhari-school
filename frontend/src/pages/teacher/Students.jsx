
import { useEffect, useMemo, useState } from "react";
import api from "../../api";
import "./TeacherPanel.css";

export default function TeacherStudents() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("classTeacher");
  const [error, setError] = useState("");

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/teacher/students", {
        params: {
          _t: Date.now(),
        },
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      console.log(
        "================ TEACHER STUDENTS FRONTEND ================"
      );
      console.log("API Response:", res.data);
      console.log(
        "Class Teacher Students:",
        res.data?.classTeacherStudents
      );
      console.log(
        "Teaching Students:",
        res.data?.teachingStudents
      );
      console.log(
        "Class Teacher Count:",
        res.data?.classTeacherStudents?.length
      );
      console.log(
        "Teaching Count:",
        res.data?.teachingStudents?.length
      );
      console.log(
        "============================================================"
      );

      setData(res.data);
    } catch (error) {
      console.error("Students error:", error);

      setError(
        error?.response?.data?.message ||
          "Unable to load students."
      );

      setData(null);
    } finally {
      setLoading(false);
    }
  };

  /*
   * Backend arrays
   */
  const classTeacherStudents = Array.isArray(
    data?.classTeacherStudents
  )
    ? data.classTeacherStudents
    : [];

  const teachingStudents = Array.isArray(
    data?.teachingStudents
  )
    ? data.teachingStudents
    : [];

  /*
   * Current selected students
   */
  const students =
    activeTab === "classTeacher"
      ? classTeacherStudents
      : teachingStudents;

  /*
   * Remove duplicate students safely.
   */
  const uniqueStudents = useMemo(() => {
    const map = new Map();

    students.forEach((student) => {
      const key =
        student?._id ||
        student?.studentId ||
        student?.registrationNo ||
        student?.admissionNo ||
        `${student?.name}-${student?.rollNo}`;

      if (!map.has(String(key))) {
        map.set(String(key), student);
      }
    });

    return Array.from(map.values());
  }, [students]);

  /*
   * Search
   */
  const filteredStudents = useMemo(() => {
    const searchText = search
      .toLowerCase()
      .trim();

    if (!searchText) {
      return uniqueStudents;
    }

    return uniqueStudents.filter((student) => {
      const text = `
        ${student?.name || ""}
        ${student?.studentId || ""}
        ${student?.registrationNo || ""}
        ${student?.admissionNo || ""}
        ${student?.rollNo || ""}
        ${student?.phone || ""}
        ${student?.email || ""}
        ${student?.className || ""}
        ${student?.section || ""}
      `.toLowerCase();

      return text.includes(searchText);
    });
  }, [uniqueStudents, search]);

  /*
   * Combined students.
   * Useful when a teacher wants to see all students
   * from both Class Teacher and Timetable classes.
   */
  const allStudents = useMemo(() => {
    const map = new Map();

    [
      ...classTeacherStudents,
      ...teachingStudents,
    ].forEach((student) => {
      const key =
        student?._id ||
        student?.studentId ||
        student?.registrationNo ||
        student?.admissionNo ||
        `${student?.name}-${student?.rollNo}`;

      if (!map.has(String(key))) {
        map.set(String(key), student);
      }
    });

    return Array.from(map.values());
  }, [classTeacherStudents, teachingStudents]);

  /*
   * Loading
   */
  if (loading) {
    return (
      <div className="teacher-loading">
        <div className="teacher-spinner"></div>
        <p>Loading students...</p>
      </div>
    );
  }

  /*
   * Error
   */
  if (error) {
    return (
      <div className="teacher-page">
        <div className="teacher-empty large">
          <div>⚠️</div>

          <h3>Unable to load students</h3>

          <p>{error}</p>

          <button
            type="button"
            className="teacher-refresh-btn"
            onClick={loadStudents}
          >
            ↻ Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-page">

      {/* ================= HEADER ================= */}

      <div className="teacher-page-header">
        <div>
          <span className="teacher-eyebrow">
            STUDENTS
          </span>

          <h1>My Students</h1>

          <p>
            View students from your assigned classes.
          </p>
        </div>

        <div className="teacher-count-badge">
          {filteredStudents.length} Students
        </div>
      </div>

      {/* ================= SUMMARY ================= */}

      <div className="teacher-tabs">

        {/* Class Teacher */}
        <button
          type="button"
          className={
            activeTab === "classTeacher"
              ? "active"
              : ""
          }
          onClick={() => {
            setActiveTab("classTeacher");
            setSearch("");
          }}
        >
          <span>🏫</span>

          Class Teacher Students

          <b>
            {classTeacherStudents.length}
          </b>
        </button>

        {/* Teaching */}
        <button
          type="button"
          className={
            activeTab === "teaching"
              ? "active"
              : ""
          }
          onClick={() => {
            setActiveTab("teaching");
            setSearch("");
          }}
        >
          <span>📚</span>

          Teaching Students

          <b>
            {teachingStudents.length}
          </b>
        </button>

      </div>

      {/* ================= TOOLBAR ================= */}

      <div className="teacher-toolbar">

        <div className="teacher-search">
          <span>⌕</span>

          <input
            type="text"
            placeholder="Search student by name, ID, roll no..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          {search && (
            <button
              type="button"
              className="teacher-search-clear"
              onClick={() => setSearch("")}
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <button
          type="button"
          className="teacher-refresh-btn"
          onClick={loadStudents}
        >
          ↻ Refresh
        </button>

      </div>

      {/* ================= DEBUG SUMMARY ================= */}

      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "18px",
        }}
      >
        <div
          style={{
            padding: "10px 16px",
            borderRadius: "10px",
            background: "#f3f4f6",
            fontSize: "14px",
          }}
        >
          Class Teacher:{" "}
          <strong>
            {classTeacherStudents.length}
          </strong>
        </div>

        <div
          style={{
            padding: "10px 16px",
            borderRadius: "10px",
            background: "#f3f4f6",
            fontSize: "14px",
          }}
        >
          Teaching:{" "}
          <strong>
            {teachingStudents.length}
          </strong>
        </div>

        <div
          style={{
            padding: "10px 16px",
            borderRadius: "10px",
            background: "#f3f4f6",
            fontSize: "14px",
          }}
        >
          Total Unique:{" "}
          <strong>
            {allStudents.length}
          </strong>
        </div>
      </div>

      {/* ================= TABLE CARD ================= */}

      <div className="teacher-table-card">

        {/* Header */}
        <div className="teacher-table-header">

          <div>
            <h2>
              {activeTab === "classTeacher"
                ? "Class Teacher Students"
                : "Teaching Students"}
            </h2>

            <p>
              {activeTab === "classTeacher"
                ? "Students of classes where you are the class teacher."
                : "Students from classes assigned to you through the timetable."}
            </p>
          </div>

          <div className="teacher-table-result-count">
            {filteredStudents.length} of{" "}
            {students.length}
          </div>

        </div>

        {/* ================= TABLE ================= */}

        {filteredStudents.length > 0 ? (
          <div className="teacher-table-wrapper">

            <table className="teacher-table">

              <thead>
                <tr>
                  <th>#</th>
                  <th>Student</th>
                  <th>Student ID</th>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Roll No.</th>
                  <th>Phone</th>
                </tr>
              </thead>

              <tbody>

                {filteredStudents.map(
                  (student, index) => {

                    const studentKey =
                      student?._id ||
                      student?.studentId ||
                      student?.registrationNo ||
                      student?.admissionNo ||
                      `${student?.name}-${index}`;

                    return (
                      <tr
                        key={studentKey}
                      >

                        {/* Number */}
                        <td>
                          {index + 1}
                        </td>

                        {/* Student */}
                        <td>
                          <div className="student-cell">

                            <div className="student-avatar">
                              {student?.name
                                ?.charAt(0)
                                ?.toUpperCase() ||
                                "S"}
                            </div>

                            <div>
                              <strong>
                                {student?.name ||
                                  "Unnamed Student"}
                              </strong>

                              <span>
                                {student?.email ||
                                  "No email"}
                              </span>
                            </div>

                          </div>
                        </td>

                        {/* Student ID */}
                        <td>
                          <span className="id-badge">
                            {student?.studentId ||
                              student?.registrationNo ||
                              student?.admissionNo ||
                              "—"}
                          </span>
                        </td>

                        {/* Class */}
                        <td>
                          {student?.className ||
                            student?.classId?.name ||
                            "—"}
                        </td>

                        {/* Section */}
                        <td>
                          {student?.section || "—"}
                        </td>

                        {/* Roll */}
                        <td>
                          {student?.rollNo || "—"}
                        </td>

                        {/* Phone */}
                        <td>
                          {student?.phone || "—"}
                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>
        ) : (
          <div className="teacher-empty large">

            <div>👨‍🎓</div>

            <h3>
              No students found
            </h3>

            <p>
              {search
                ? "Try a different search term."
                : activeTab === "classTeacher"
                ? "No students are available in your Class Teacher classes."
                : "No students are available in your timetable-assigned teaching classes."}
            </p>

            {!search && (
              <button
                type="button"
                className="teacher-refresh-btn"
                onClick={loadStudents}
              >
                ↻ Refresh Students
              </button>
            )}

          </div>
        )}

      </div>

    </div>
  );
}
