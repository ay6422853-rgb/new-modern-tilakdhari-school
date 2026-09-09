import React, { useEffect, useState } from "react";
import { create, list } from "../../api";
import "./Marks.css";

export default function Marks() {
  const [marks, setMarks] = useState([]);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [form, setForm] = useState({
    exam: "",
    student: "",
    subject: "",
    maxMarks: 100,
    marks: "",
    grade: "",
    remarks: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      const [markData, studentData, examData, subjectData] =
        await Promise.all([
          list("principal/marks"),
          list("principal/students"),
          list("principal/exams"),
          list("principal/subjects"),
        ]);

      setMarks(Array.isArray(markData) ? markData : []);
      setStudents(Array.isArray(studentData) ? studentData : []);
      setExams(Array.isArray(examData) ? examData : []);
      setSubjects(Array.isArray(subjectData) ? subjectData : []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Marks data load nahi ho saka."
      );
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const calculateGrade = (marks, maxMarks) => {
    if (marks === "" || !maxMarks) return "";

    const percentage = (Number(marks) / Number(maxMarks)) * 100;

    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B+";
    if (percentage >= 60) return "B";
    if (percentage >= 50) return "C";
    if (percentage >= 40) return "D";
    return "F";
  };

  const handleMarksChange = (value) => {
    setForm((prev) => ({
      ...prev,
      marks: value,
      grade: calculateGrade(value, prev.maxMarks),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (
      !form.exam ||
      !form.student ||
      !form.subject ||
      form.marks === ""
    ) {
      setError("Exam, student, subject aur marks required hain.");
      return;
    }

    if (Number(form.marks) > Number(form.maxMarks)) {
      setError("Marks maximum marks se zyada nahi ho sakte.");
      return;
    }

    try {
      await create("principal/marks", {
        ...form,
        maxMarks: Number(form.maxMarks),
        marks: Number(form.marks),
      });

      setMessage("Marks successfully enter ho gaye.");

      setForm({
        exam: "",
        student: "",
        subject: "",
        maxMarks: 100,
        marks: "",
        grade: "",
        remarks: "",
      });

      await loadData();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Marks save nahi ho sake. Duplicate mark entry check karein."
      );
    }
  };

  return (
    <div className="principal-marks-page">
      <div className="principal-marks-header">
        <div>
          <h1>Marks Management</h1>
          <p>Enter and manage student examination marks</p>
        </div>

        <button onClick={loadData}>↻ Refresh</button>
      </div>

      {message && (
        <div className="principal-marks-success">{message}</div>
      )}

      {error && (
        <div className="principal-marks-error">{error}</div>
      )}

      <div className="principal-marks-layout">
        <section className="principal-marks-card">
          <div className="principal-marks-title">
            <h2>Enter Marks</h2>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="principal-marks-fields">
              <div>
                <label>Examination *</label>
                <select
                  value={form.exam}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      exam: e.target.value,
                    })
                  }
                >
                  <option value="">Select Exam</option>

                  {exams.map((exam) => (
                    <option key={exam._id} value={exam._id}>
                      {exam.name}{" "}
                      {exam.className
                        ? `- ${exam.className}`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Student *</label>
                <select
                  value={form.student}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      student: e.target.value,
                    })
                  }
                >
                  <option value="">Select Student</option>

                  {students.map((student) => (
                    <option
                      key={student._id}
                      value={student._id}
                    >
                      {student.name}{" "}
                      {student.studentId
                        ? `(${student.studentId})`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Subject *</label>
                <select
                  value={form.subject}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      subject: e.target.value,
                    })
                  }
                >
                  <option value="">Select Subject</option>

                  {subjects.map((subject) => (
                    <option
                      key={subject._id}
                      value={subject._id}
                    >
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="principal-marks-two">
                <div>
                  <label>Maximum Marks</label>
                  <input
                    type="number"
                    min="1"
                    value={form.maxMarks}
                    onChange={(e) => {
                      const maxMarks = e.target.value;

                      setForm((prev) => ({
                        ...prev,
                        maxMarks,
                        grade: calculateGrade(
                          prev.marks,
                          maxMarks
                        ),
                      }));
                    }}
                  />
                </div>

                <div>
                  <label>Obtained Marks *</label>
                  <input
                    type="number"
                    min="0"
                    value={form.marks}
                    onChange={(e) =>
                      handleMarksChange(e.target.value)
                    }
                  />
                </div>
              </div>

              <div>
                <label>Grade</label>
                <input
                  type="text"
                  value={form.grade}
                  readOnly
                  placeholder="Auto calculated"
                />
              </div>

              <div>
                <label>Remarks</label>
                <textarea
                  rows="3"
                  placeholder="Optional remarks"
                  value={form.remarks}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      remarks: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <button
              type="submit"
              className="principal-marks-submit"
            >
              Save Marks
            </button>
          </form>
        </section>

        <section className="principal-marks-card">
          <div className="principal-marks-title">
            <h2>Recent Marks</h2>
            <span>{marks.length} Records</span>
          </div>

          <div className="principal-marks-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Exam</th>
                  <th>Subject</th>
                  <th>Marks</th>
                  <th>Grade</th>
                </tr>
              </thead>

              <tbody>
                {marks.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty">
                      No marks found.
                    </td>
                  </tr>
                ) : (
                  marks.map((item) => (
                    <tr key={item._id}>
                      <td>
                        {item.student?.name || "—"}
                      </td>

                      <td>
                        {item.exam?.name || "—"}
                      </td>

                      <td>
                        {item.subject?.name || "—"}
                      </td>

                      <td>
                        <strong>
                          {item.marks}/{item.maxMarks}
                        </strong>
                      </td>

                      <td>
                        <span className="principal-mark-grade">
                          {item.grade || "—"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}