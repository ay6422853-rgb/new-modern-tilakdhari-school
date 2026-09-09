import React, { useEffect, useState } from "react";
import { create, list } from "../../api";
import "./Exams.css";

export default function Exams() {
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [form, setForm] = useState({
    name: "",
    classId: "",
    className: "",
    session: "",
    date: "",
    subjects: [],
    published: false,
  });

  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const [examData, classData, subjectData] = await Promise.all([
        list("principal/exams"),
        list("principal/classes"),
        list("principal/subjects"),
      ]);

      setExams(Array.isArray(examData) ? examData : []);
      setClasses(Array.isArray(classData) ? classData : []);
      setSubjects(Array.isArray(subjectData) ? subjectData : []);
    } catch (err) {
      setError(
        err?.response?.data?.message || "Data load nahi ho saka."
      );
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClassChange = (e) => {
    const id = e.target.value;
    const selectedClass = classes.find((item) => item._id === id);

    setForm((prev) => ({
      ...prev,
      classId: id,
      className: selectedClass?.name || "",
    }));
  };

  const toggleSubject = (id) => {
    setSelectedSubjects((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!form.name.trim()) {
      setError("Exam name required hai.");
      return;
    }

    if (!form.classId) {
      setError("Class select karein.");
      return;
    }

    if (selectedSubjects.length === 0) {
      setError("Kam se kam ek subject select karein.");
      return;
    }

    try {
      setLoading(true);

      await create("principal/exams", {
        ...form,
        subjects: selectedSubjects,
      });

      setMessage("Exam successfully create ho gaya.");

      setForm({
        name: "",
        classId: "",
        className: "",
        session: "",
        date: "",
        subjects: [],
        published: false,
      });

      setSelectedSubjects([]);

      await loadData();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Exam create nahi ho saka."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="principal-exams-page">
      <div className="principal-exams-header">
        <div>
          <h1>Examinations</h1>
          <p>Create and manage school examinations</p>
        </div>

        <button onClick={loadData} className="principal-exams-refresh">
          ↻ Refresh
        </button>
      </div>

      {message && (
        <div className="principal-exams-success">
          {message}
        </div>
      )}

      {error && (
        <div className="principal-exams-error">
          {error}
        </div>
      )}

      <div className="principal-exams-grid">
        <section className="principal-exams-card">
          <div className="principal-exams-card-title">
            <h2>Create Examination</h2>
            <span>New Exam</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="principal-exams-form-grid">
              <div className="principal-exams-field full">
                <label>Exam Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Half Yearly Examination"
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                />
              </div>

              <div className="principal-exams-field">
                <label>Class *</label>
                <select
                  value={form.classId}
                  onChange={handleClassChange}
                >
                  <option value="">Select Class</option>

                  {classes.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="principal-exams-field">
                <label>Session</label>
                <input
                  type="text"
                  placeholder="2026-27"
                  value={form.session}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      session: e.target.value,
                    })
                  }
                />
              </div>

              <div className="principal-exams-field">
                <label>Exam Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      date: e.target.value,
                    })
                  }
                />
              </div>

              <div className="principal-exams-field">
                <label>Status</label>

                <label className="principal-exams-switch">
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        published: e.target.checked,
                      })
                    }
                  />
                  <span></span>
                  Published
                </label>
              </div>
            </div>

            <div className="principal-exams-subject-box">
              <div className="principal-exams-subject-heading">
                <label>Subjects *</label>
                <small>
                  {selectedSubjects.length} selected
                </small>
              </div>

              <div className="principal-exams-subject-list">
                {subjects.length === 0 ? (
                  <p>No subjects available.</p>
                ) : (
                  subjects.map((subject) => (
                    <label
                      key={subject._id}
                      className={
                        selectedSubjects.includes(subject._id)
                          ? "selected"
                          : ""
                      }
                    >
                      <input
                        type="checkbox"
                        checked={selectedSubjects.includes(
                          subject._id
                        )}
                        onChange={() =>
                          toggleSubject(subject._id)
                        }
                      />

                      <span>
                        {subject.name}
                        {subject.code && (
                          <small>{subject.code}</small>
                        )}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <button
              type="submit"
              className="principal-exams-submit"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Examination"}
            </button>
          </form>
        </section>

        <section className="principal-exams-card">
          <div className="principal-exams-card-title">
            <h2>Examination List</h2>
            <span>{exams.length} Exams</span>
          </div>

          <div className="principal-exams-list">
            {exams.length === 0 ? (
              <div className="principal-exams-empty">
                No examinations found.
              </div>
            ) : (
              exams.map((exam) => (
                <div
                  className="principal-exam-item"
                  key={exam._id}
                >
                  <div className="principal-exam-icon">
                    EX
                  </div>

                  <div className="principal-exam-info">
                    <h3>{exam.name}</h3>

                    <p>
                      {exam.className ||
                        exam.classId?.name ||
                        "Class not specified"}
                    </p>

                    <small>
                      {exam.date
                        ? new Date(
                            exam.date
                          ).toLocaleDateString()
                        : "Date not set"}

                      {exam.session
                        ? ` • ${exam.session}`
                        : ""}
                    </small>
                  </div>

                  <span
                    className={
                      exam.published
                        ? "principal-exam-status published"
                        : "principal-exam-status draft"
                    }
                  >
                    {exam.published ? "Published" : "Draft"}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}