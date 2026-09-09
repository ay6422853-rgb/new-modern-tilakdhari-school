
import { useEffect, useState } from "react";
import api from "../../api";
import "./StudentCommon.css";

function Exams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      const res = await api.get("/student/exams");
      setExams(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="student-page">
      <div className="student-page-header">
        <div>
          <span className="student-eyebrow">ACADEMICS</span>
          <h1>Exams</h1>
          <p>View your upcoming and scheduled examinations.</p>
        </div>

        <button className="student-refresh-btn" onClick={loadExams}>
          ↻ Refresh
        </button>
      </div>

      {loading ? (
        <div className="student-loading">Loading exams...</div>
      ) : exams.length === 0 ? (
        <div className="student-card">
          <div className="student-empty">
            No exams have been scheduled.
          </div>
        </div>
      ) : (
        <div className="student-exam-grid">
          {exams.map((exam) => (
            <div className="student-exam-card" key={exam._id}>
              <div className="student-exam-date">
                <span>
                  {exam.date
                    ? new Date(exam.date).toLocaleDateString(
                        "en-IN",
                        { month: "short" }
                      )
                    : "—"}
                </span>

                <strong>
                  {exam.date
                    ? new Date(exam.date).getDate()
                    : "—"}
                </strong>
              </div>

              <div className="student-exam-content">
                <h3>{exam.name}</h3>

                <p>
                  {exam.className ||
                    exam.classId?.name ||
                    "Class"}
                  {exam.session ? ` • ${exam.session}` : ""}
                </p>

                <div className="student-subject-list">
                  {(exam.subjects || []).length === 0 ? (
                    <span>No subjects listed</span>
                  ) : (
                    exam.subjects.map((subject) => (
                      <span key={subject._id}>
                        {subject.name}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="student-exam-status">
                {exam.published ? "Published" : "Scheduled"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Exams;
