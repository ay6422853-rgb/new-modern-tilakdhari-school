
import { useEffect, useMemo, useState } from "react";
import api from "../../api";
import "./TeacherPanel.css";

export default function TeacherExams() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState("ALL");

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      const res = await api.get("/teacher/exams");
      setData(res.data);
    } catch (error) {
      console.error("Exams error:", error);
    } finally {
      setLoading(false);
    }
  };

  const exams = useMemo(() => {
    if (!data?.exams) return [];

    if (selectedClass === "ALL") {
      return data.exams;
    }

    return data.exams.filter(
      (exam) =>
        exam.classId?._id === selectedClass ||
        exam.classId === selectedClass
    );
  }, [data, selectedClass]);

  const formatDate = (date) => {
    if (!date) return "Date not set";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getExamStatus = (date) => {
    if (!date) return "UPCOMING";

    const examDate = new Date(date);
    const today = new Date();

    examDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (examDate < today) return "COMPLETED";
    if (examDate.getTime() === today.getTime()) return "TODAY";

    return "UPCOMING";
  };

  if (loading) {
    return (
      <div className="teacher-loading">
        <div className="teacher-spinner"></div>
        <p>Loading exams...</p>
      </div>
    );
  }

  return (
    <div className="teacher-page">
      <div className="teacher-page-header">
        <div>
          <span className="teacher-eyebrow">EXAMINATION</span>
          <h1>Exam Schedule</h1>
          <p>View exams and subjects for your class-teacher classes.</p>
        </div>

        <button className="teacher-refresh-btn" onClick={loadExams}>
          ↻ Refresh
        </button>
      </div>

      {/* Filter */}
      <div className="exam-filter-card">
        <div>
          <label>Filter by Class</label>

          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="ALL">All Classes</option>

            {data?.classes?.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div className="exam-total">
          <span>Total Exams</span>
          <strong>{exams.length}</strong>
        </div>
      </div>

      {/* Exam Cards */}
      {exams.length ? (
        <div className="exam-grid">
          {exams.map((exam) => {
            const status = getExamStatus(exam.date);

            return (
              <div className="exam-card" key={exam._id}>
                <div className="exam-card-top">
                  <div className="exam-calendar">
                    <span>
                      {exam.date
                        ? new Date(exam.date).toLocaleDateString(
                            "en-IN",
                            { month: "short" }
                          )
                        : "TBA"}
                    </span>

                    <strong>
                      {exam.date
                        ? new Date(exam.date).getDate()
                        : "—"}
                    </strong>
                  </div>

                  <span
                    className={`exam-status ${status.toLowerCase()}`}
                  >
                    {status}
                  </span>
                </div>

                <div className="exam-card-body">
                  <h2>{exam.name}</h2>

                  <div className="exam-class">
                    🏫 {exam.classId?.name || exam.className || "Class"}
                  </div>

                  {exam.session && (
                    <div className="exam-session">
                      Academic Session: <strong>{exam.session}</strong>
                    </div>
                  )}

                  <div className="exam-subject-heading">
                    <span>Subjects</span>
                    <b>{exam.subjects?.length || 0}</b>
                  </div>

                  <div className="exam-subject-list">
                    {exam.subjects?.length ? (
                      exam.subjects.map((subject) => (
                        <span key={subject._id}>
                          {subject.name}
                          {subject.code ? ` (${subject.code})` : ""}
                        </span>
                      ))
                    ) : (
                      <span>No subjects added</span>
                    )}
                  </div>
                </div>

                <div className="exam-card-footer">
                  <span>📅 {formatDate(exam.date)}</span>

                  <button
                    className="exam-details-btn"
                    onClick={() =>
                      alert(
                        `${exam.name}\n${exam.classId?.name || exam.className || ""}`
                      )
                    }
                  >
                    View Details →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="teacher-empty large">
          <div>📅</div>
          <h3>No exams found</h3>
          <p>No examination has been scheduled for your class yet.</p>
        </div>
      )}
    </div>
  );
}
