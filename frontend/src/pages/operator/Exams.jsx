import { useEffect, useMemo, useState } from "react";
import api from "../../api";
import "./Exams.css";

const emptyExam = {
  name: "",
  classId: "",
  className: "",
  session: "",
  date: "",
  subjects: [],
};

const emptyMark = {
  exam: "",
  student: "",
  subject: "",
  maxMarks: 100,
  marks: "",
  grade: "",
  remarks: "",
};

const idOf = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || value.id || "";
};

const nameOf = (value, fallback = "") => {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  return value.name || value.title || fallback;
};

const getClassName = (item) =>
  item?.name || item?.className || "";

const getStudentName = (student) =>
  student?.name ||
  [student?.firstName, student?.lastName].filter(Boolean).join(" ") ||
  "Unnamed Student";

const getSubjectName = (subject) =>
  subject?.name || subject?.subjectName || "Subject";

function calculateGrade(marks, maxMarks) {
  const obtained = Number(marks);
  const maximum = Number(maxMarks);

  if (
    Number.isNaN(obtained) ||
    Number.isNaN(maximum) ||
    maximum <= 0
  ) {
    return "";
  }

  const percentage = (obtained / maximum) * 100;

  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C";
  if (percentage >= 40) return "D";
  return "F";
}

function ExamsMarks() {
  const [activeTab, setActiveTab] = useState("exams");

  const [exams, setExams] = useState([]);
  const [marks, setMarks] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [examModal, setExamModal] = useState(false);
  const [markModal, setMarkModal] = useState(false);

  const [editingExam, setEditingExam] = useState(null);

  const [examForm, setExamForm] = useState(emptyExam);
  const [markForm, setMarkForm] = useState(emptyMark);

  const [examSearch, setExamSearch] = useState("");
  const [markSearch, setMarkSearch] = useState("");

  const [classFilter, setClassFilter] = useState("");
  const [sessionFilter, setSessionFilter] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);

      const [
        examsRes,
        marksRes,
        classesRes,
        subjectsRes,
        studentsRes,
      ] = await Promise.all([
        api.get("/operator/exams"),
        api.get("/operator/marks"),
        api.get("/operator/classes"),
        api.get("/operator/subjects"),
        api.get("/operator/students"),
      ]);

      setExams(Array.isArray(examsRes.data) ? examsRes.data : []);
      setMarks(Array.isArray(marksRes.data) ? marksRes.data : []);
      setClasses(Array.isArray(classesRes.data) ? classesRes.data : []);
      setSubjects(
        Array.isArray(subjectsRes.data) ? subjectsRes.data : []
      );
      setStudents(
        Array.isArray(studentsRes.data) ? studentsRes.data : []
      );
    } catch (error) {
      console.error(error);
      alert(
        error?.response?.data?.message ||
          "Failed to load exams and marks."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const text = [
        exam?.name,
        exam?.className,
        exam?.session,
      ]
        .join(" ")
        .toLowerCase();

      const searchMatch = text.includes(
        examSearch.toLowerCase()
      );

      const classMatch =
        !classFilter ||
        idOf(exam?.classId) === classFilter;

      const sessionMatch =
        !sessionFilter ||
        String(exam?.session || "") === sessionFilter;

      return searchMatch && classMatch && sessionMatch;
    });
  }, [
    exams,
    examSearch,
    classFilter,
    sessionFilter,
  ]);

  const filteredMarks = useMemo(() => {
    return marks.filter((item) => {
      const studentName = getStudentName(item?.student);
      const examName = nameOf(item?.exam);
      const subjectName = getSubjectName(item?.subject);

      const text = [
        studentName,
        examName,
        subjectName,
        item?.grade,
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(markSearch.toLowerCase());
    });
  }, [marks, markSearch]);

  const sessions = useMemo(() => {
    return [
      ...new Set(
        exams
          .map((item) => item?.session)
          .filter(Boolean)
      ),
    ];
  }, [exams]);

  const stats = useMemo(() => {
    const published = exams.filter(
      (exam) => exam?.published
    ).length;

    const pending = exams.length - published;

    return {
      totalExams: exams.length,
      published,
      pending,
      totalMarks: marks.length,
    };
  }, [exams, marks]);

  const openCreateExam = () => {
    setEditingExam(null);

    setExamForm({
      ...emptyExam,
      session:
        sessions[0] ||
        `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    });

    setExamModal(true);
  };

  const openEditExam = (exam) => {
    setEditingExam(exam);

    const subjectIds = Array.isArray(exam?.subjects)
      ? exam.subjects.map(idOf).filter(Boolean)
      : [];

    setExamForm({
      name: exam?.name || "",
      classId: idOf(exam?.classId),
      className:
        exam?.className ||
        getClassName(exam?.classId),
      session: exam?.session || "",
      date: exam?.date
        ? String(exam.date).slice(0, 10)
        : "",
      subjects: subjectIds,
    });

    setExamModal(true);
  };

  const handleClassChange = (classId) => {
    const selected = classes.find(
      (item) => idOf(item) === classId
    );

    setExamForm((prev) => ({
      ...prev,
      classId,
      className: getClassName(selected),
      subjects: [],
    }));
  };

  const toggleExamSubject = (subjectId) => {
    setExamForm((prev) => {
      const exists = prev.subjects.includes(subjectId);

      return {
        ...prev,
        subjects: exists
          ? prev.subjects.filter(
              (id) => id !== subjectId
            )
          : [...prev.subjects, subjectId],
      };
    });
  };

  const availableSubjects = useMemo(() => {
    if (!examForm.classId) return subjects;

    const selectedClass = classes.find(
      (item) => idOf(item) === examForm.classId
    );

    const selectedClassName =
      getClassName(selectedClass);

    const filtered = subjects.filter((subject) => {
      const classIds = Array.isArray(subject?.classIds)
        ? subject.classIds.map(idOf)
        : [];

      const classNames = Array.isArray(
        subject?.classNames
      )
        ? subject.classNames
        : [];

      if (classIds.includes(examForm.classId)) {
        return true;
      }

      if (
        selectedClassName &&
        classNames.includes(selectedClassName)
      ) {
        return true;
      }

      return false;
    });

    return filtered.length ? filtered : subjects;
  }, [
    subjects,
    classes,
    examForm.classId,
  ]);

  const saveExam = async (event) => {
    event.preventDefault();

    if (!examForm.name.trim()) {
      alert("Exam name is required.");
      return;
    }

    if (!examForm.classId) {
      alert("Please select class.");
      return;
    }

    if (!examForm.date) {
      alert("Please select exam date.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: examForm.name.trim(),
        classId: examForm.classId,
        className: examForm.className,
        session: examForm.session.trim(),
        date: examForm.date,
        subjects: examForm.subjects,
      };

      if (editingExam) {
        await api.put(
          `/operator/exams/${editingExam._id}`,
          payload
        );
      } else {
        await api.post(
          "/operator/exams",
          payload
        );
      }

      setExamModal(false);
      setEditingExam(null);
      setExamForm(emptyExam);

      await loadData();
    } catch (error) {
      console.error(error);

      alert(
        error?.response?.data?.message ||
          "Unable to save exam."
      );
    } finally {
      setSaving(false);
    }
  };

  const publishExam = async (exam) => {
    if (exam?.published) return;

    const ok = window.confirm(
      `Publish "${exam?.name}"?`
    );

    if (!ok) return;

    try {
      await api.put(
        `/operator/exams/${exam._id}/publish`
      );

      await loadData();
    } catch (error) {
      console.error(error);

      alert(
        error?.response?.data?.message ||
          "Unable to publish exam."
      );
    }
  };

  const openCreateMark = () => {
    setMarkForm({
      ...emptyMark,
      exam: exams[0]?._id || "",
    });

    setMarkModal(true);
  };

  const selectedExam = exams.find(
    (exam) => idOf(exam) === markForm.exam
  );

  const markStudents = useMemo(() => {
    if (!selectedExam?.classId) {
      return students;
    }

    const classId = idOf(selectedExam.classId);
    const className = selectedExam.className;

    const filtered = students.filter((student) => {
      const studentClassId = idOf(
        student?.classId
      );

      const studentClassName =
        student?.className ||
        getClassName(student?.classId);

      return (
        studentClassId === classId ||
        (className &&
          studentClassName === className)
      );
    });

    return filtered.length ? filtered : students;
  }, [students, selectedExam]);

  const markSubjects = useMemo(() => {
    if (!selectedExam) return subjects;

    if (
      Array.isArray(selectedExam.subjects) &&
      selectedExam.subjects.length
    ) {
      const ids = selectedExam.subjects.map(idOf);

      const filtered = subjects.filter((subject) =>
        ids.includes(idOf(subject))
      );

      if (filtered.length) {
        return filtered;
      }
    }

    return subjects;
  }, [subjects, selectedExam]);

  const handleMarkChange = (field, value) => {
    setMarkForm((prev) => {
      const next = {
        ...prev,
        [field]: value,
      };

      if (
        field === "marks" ||
        field === "maxMarks"
      ) {
        next.grade = calculateGrade(
          field === "marks"
            ? value
            : prev.marks,
          field === "maxMarks"
            ? value
            : prev.maxMarks
        );
      }

      return next;
    });
  };

  const saveMark = async (event) => {
    event.preventDefault();

    if (!markForm.exam) {
      alert("Please select exam.");
      return;
    }

    if (!markForm.student) {
      alert("Please select student.");
      return;
    }

    if (!markForm.subject) {
      alert("Please select subject.");
      return;
    }

    if (
      markForm.marks === "" ||
      markForm.marks === null
    ) {
      alert("Please enter marks.");
      return;
    }

    if (
      Number(markForm.marks) >
      Number(markForm.maxMarks)
    ) {
      alert("Obtained marks cannot exceed maximum marks.");
      return;
    }

    try {
      setSaving(true);

      await api.post("/operator/marks", {
        exam: markForm.exam,
        student: markForm.student,
        subject: markForm.subject,
        maxMarks: Number(markForm.maxMarks),
        marks: Number(markForm.marks),
        grade:
          markForm.grade ||
          calculateGrade(
            markForm.marks,
            markForm.maxMarks
          ),
        remarks: markForm.remarks.trim(),
      });

      setMarkModal(false);
      setMarkForm(emptyMark);

      await loadData();
    } catch (error) {
      console.error(error);

      alert(
        error?.response?.data?.message ||
          "Unable to save marks."
      );
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  return (
    <div className="om-page">
      <div className="om-header">
        <div>
          <span className="om-kicker">
            COMPUTER OPERATOR
          </span>

          <h1>Exams & Marks</h1>

          <p>
            Manage examinations, subjects and student
            marks from one place.
          </p>
        </div>

        <button
          className="om-primary-btn"
          onClick={
            activeTab === "exams"
              ? openCreateExam
              : openCreateMark
          }
        >
          <span>＋</span>
          {activeTab === "exams"
            ? "Create Exam"
            : "Enter Marks"}
        </button>
      </div>

      <div className="om-stats">
        <div className="om-stat-card">
          <div className="om-stat-icon">📝</div>
          <div>
            <span>Total Exams</span>
            <strong>{stats.totalExams}</strong>
          </div>
        </div>

        <div className="om-stat-card">
          <div className="om-stat-icon">✅</div>
          <div>
            <span>Published</span>
            <strong>{stats.published}</strong>
          </div>
        </div>

        <div className="om-stat-card">
          <div className="om-stat-icon">⏳</div>
          <div>
            <span>Pending</span>
            <strong>{stats.pending}</strong>
          </div>
        </div>

        <div className="om-stat-card">
          <div className="om-stat-icon">📊</div>
          <div>
            <span>Marks Entries</span>
            <strong>{stats.totalMarks}</strong>
          </div>
        </div>
      </div>

      <div className="om-tabs">
        <button
          className={
            activeTab === "exams"
              ? "active"
              : ""
          }
          onClick={() => setActiveTab("exams")}
        >
          📝 Exams
        </button>

        <button
          className={
            activeTab === "marks"
              ? "active"
              : ""
          }
          onClick={() => setActiveTab("marks")}
        >
          📊 Marks
        </button>
      </div>

      {activeTab === "exams" && (
        <>
          <div className="om-toolbar">
            <div className="om-search">
              🔎
              <input
                type="text"
                placeholder="Search exam..."
                value={examSearch}
                onChange={(e) =>
                  setExamSearch(e.target.value)
                }
              />
            </div>

            <select
              value={classFilter}
              onChange={(e) =>
                setClassFilter(e.target.value)
              }
            >
              <option value="">
                All Classes
              </option>

              {classes.map((item) => (
                <option
                  key={item._id}
                  value={item._id}
                >
                  {getClassName(item)}
                </option>
              ))}
            </select>

            <select
              value={sessionFilter}
              onChange={(e) =>
                setSessionFilter(e.target.value)
              }
            >
              <option value="">
                All Sessions
              </option>

              {sessions.map((session) => (
                <option
                  key={session}
                  value={session}
                >
                  {session}
                </option>
              ))}
            </select>
          </div>

          <div className="om-card">
            <div className="om-card-head">
              <div>
                <h2>Examination List</h2>
                <p>
                  {filteredExams.length} examination
                  {filteredExams.length !== 1
                    ? "s"
                    : ""}{" "}
                  found
                </p>
              </div>
            </div>

            {loading ? (
              <div className="om-loading">
                Loading exams...
              </div>
            ) : filteredExams.length === 0 ? (
              <div className="om-empty">
                <div>📝</div>
                <h3>No exams found</h3>
                <p>
                  Create your first examination to
                  get started.
                </p>
              </div>
            ) : (
              <div className="om-table-wrap">
                <table className="om-table">
                  <thead>
                    <tr>
                      <th>Exam</th>
                      <th>Class</th>
                      <th>Session</th>
                      <th>Date</th>
                      <th>Subjects</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredExams.map((exam) => (
                      <tr key={exam._id}>
                        <td>
                          <div className="om-title-cell">
                            <strong>
                              {exam.name}
                            </strong>

                            <small>
                              ID:{" "}
                              {String(
                                exam._id
                              ).slice(-6)}
                            </small>
                          </div>
                        </td>

                        <td>
                          <span className="om-class-pill">
                            {exam.className ||
                              getClassName(
                                exam.classId
                              ) ||
                              "-"}
                          </span>
                        </td>

                        <td>
                          {exam.session || "-"}
                        </td>

                        <td>
                          {formatDate(exam.date)}
                        </td>

                        <td>
                          <div className="om-subject-count">
                            {Array.isArray(
                              exam.subjects
                            )
                              ? exam.subjects.length
                              : 0}{" "}
                            subject
                            {Array.isArray(
                              exam.subjects
                            ) &&
                            exam.subjects.length !==
                              1
                              ? "s"
                              : ""}
                          </div>
                        </td>

                        <td>
                          <span
                            className={
                              exam.published
                                ? "om-status published"
                                : "om-status pending"
                            }
                          >
                            {exam.published
                              ? "Published"
                              : "Pending"}
                          </span>
                        </td>

                        <td>
                          <div className="om-actions">
                            <button
                              className="om-icon-btn"
                              title="Edit"
                              onClick={() =>
                                openEditExam(exam)
                              }
                            >
                              ✏️
                            </button>

                            {!exam.published && (
                              <button
                                className="om-action-btn"
                                onClick={() =>
                                  publishExam(exam)
                                }
                              >
                                Publish
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "marks" && (
        <>
          <div className="om-toolbar">
            <div className="om-search wide">
              🔎
              <input
                type="text"
                placeholder="Search student, exam or subject..."
                value={markSearch}
                onChange={(e) =>
                  setMarkSearch(e.target.value)
                }
              />
            </div>

            <button
              className="om-refresh-btn"
              onClick={loadData}
            >
              ↻ Refresh
            </button>
          </div>

          <div className="om-card">
            <div className="om-card-head">
              <div>
                <h2>Student Marks</h2>
                <p>
                  {filteredMarks.length} marks
                  {filteredMarks.length !== 1
                    ? " entries"
                    : " entry"}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="om-loading">
                Loading marks...
              </div>
            ) : filteredMarks.length === 0 ? (
              <div className="om-empty">
                <div>📊</div>
                <h3>No marks found</h3>
                <p>
                  Enter marks for students using the
                  button above.
                </p>
              </div>
            ) : (
              <div className="om-table-wrap">
                <table className="om-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Exam</th>
                      <th>Subject</th>
                      <th>Marks</th>
                      <th>Percentage</th>
                      <th>Grade</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredMarks.map((item) => {
                      const max =
                        Number(item.maxMarks) || 0;

                      const obtained =
                        Number(item.marks) || 0;

                      const percentage =
                        max > 0
                          ? (
                              (obtained / max) *
                              100
                            ).toFixed(1)
                          : "0.0";

                      return (
                        <tr key={item._id}>
                          <td>
                            <div className="om-student-cell">
                              <div className="om-avatar">
                                {getStudentName(
                                  item.student
                                )
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>
                                <strong>
                                  {getStudentName(
                                    item.student
                                  )}
                                </strong>

                                <small>
                                  {item?.student
                                    ?.rollNo
                                    ? `Roll No: ${item.student.rollNo}`
                                    : ""}
                                </small>
                              </div>
                            </div>
                          </td>

                          <td>
                            {nameOf(
                              item.exam,
                              "-"
                            )}
                          </td>

                          <td>
                            {getSubjectName(
                              item.subject
                            )}
                          </td>

                          <td>
                            <strong>
                              {obtained}/{max}
                            </strong>
                          </td>

                          <td>
                            {percentage}%
                          </td>

                          <td>
                            <span className="om-grade">
                              {item.grade ||
                                calculateGrade(
                                  obtained,
                                  max
                                ) ||
                                "-"}
                            </span>
                          </td>

                          <td>
                            <span className="om-remarks">
                              {item.remarks || "-"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {examModal && (
        <div
          className="om-modal-overlay"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget &&
              !saving
            ) {
              setExamModal(false);
            }
          }}
        >
          <div className="om-modal">
            <div className="om-modal-head">
              <div>
                <span className="om-kicker">
                  EXAMINATION
                </span>

                <h2>
                  {editingExam
                    ? "Edit Exam"
                    : "Create Exam"}
                </h2>
              </div>

              <button
                className="om-close"
                onClick={() =>
                  !saving && setExamModal(false)
                }
              >
                ×
              </button>
            </div>

            <form onSubmit={saveExam}>
              <div className="om-form-grid">
                <div className="om-field full">
                  <label>Exam Name *</label>

                  <input
                    type="text"
                    placeholder="e.g. Half Yearly Examination"
                    value={examForm.name}
                    onChange={(e) =>
                      setExamForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="om-field">
                  <label>Class *</label>

                  <select
                    value={examForm.classId}
                    onChange={(e) =>
                      handleClassChange(
                        e.target.value
                      )
                    }
                  >
                    <option value="">
                      Select Class
                    </option>

                    {classes.map((item) => (
                      <option
                        key={item._id}
                        value={item._id}
                      >
                        {getClassName(item)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="om-field">
                  <label>Session</label>

                  <input
                    type="text"
                    placeholder="2026-27"
                    value={examForm.session}
                    onChange={(e) =>
                      setExamForm((prev) => ({
                        ...prev,
                        session: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="om-field">
                  <label>Exam Date *</label>

                  <input
                    type="date"
                    value={examForm.date}
                    onChange={(e) =>
                      setExamForm((prev) => ({
                        ...prev,
                        date: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="om-field">
                  <label>
                    Selected Subjects
                  </label>

                  <div className="om-selected-count">
                    {examForm.subjects.length} selected
                  </div>
                </div>

                <div className="om-field full">
                  <label>Select Subjects</label>

                  <div className="om-subject-box">
                    {availableSubjects.length === 0 ? (
                      <div className="om-no-subject">
                        No subjects available.
                      </div>
                    ) : (
                      availableSubjects.map(
                        (subject) => {
                          const subjectId =
                            idOf(subject);

                          const checked =
                            examForm.subjects.includes(
                              subjectId
                            );

                          return (
                            <label
                              key={subjectId}
                              className={
                                checked
                                  ? "om-subject-option checked"
                                  : "om-subject-option"
                              }
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  toggleExamSubject(
                                    subjectId
                                  )
                                }
                              />

                              <span>
                                {getSubjectName(
                                  subject
                                )}
                              </span>

                              {subject?.code && (
                                <small>
                                  {subject.code}
                                </small>
                              )}
                            </label>
                          );
                        }
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="om-modal-footer">
                <button
                  type="button"
                  className="om-cancel-btn"
                  disabled={saving}
                  onClick={() =>
                    setExamModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="om-primary-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingExam
                    ? "Update Exam"
                    : "Create Exam"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {markModal && (
        <div
          className="om-modal-overlay"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget &&
              !saving
            ) {
              setMarkModal(false);
            }
          }}
        >
          <div className="om-modal small">
            <div className="om-modal-head">
              <div>
                <span className="om-kicker">
                  MARK ENTRY
                </span>

                <h2>Enter Student Marks</h2>
              </div>

              <button
                className="om-close"
                onClick={() =>
                  !saving && setMarkModal(false)
                }
              >
                ×
              </button>
            </div>

            <form onSubmit={saveMark}>
              <div className="om-form-grid">
                <div className="om-field full">
                  <label>Exam *</label>

                  <select
                    value={markForm.exam}
                    onChange={(e) =>
                      setMarkForm((prev) => ({
                        ...prev,
                        exam: e.target.value,
                        student: "",
                        subject: "",
                      }))
                    }
                  >
                    <option value="">
                      Select Exam
                    </option>

                    {exams.map((exam) => (
                      <option
                        key={exam._id}
                        value={exam._id}
                      >
                        {exam.name} —{" "}
                        {exam.className ||
                          getClassName(
                            exam.classId
                          )}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="om-field full">
                  <label>Student *</label>

                  <select
                    value={markForm.student}
                    onChange={(e) =>
                      setMarkForm((prev) => ({
                        ...prev,
                        student: e.target.value,
                      }))
                    }
                  >
                    <option value="">
                      Select Student
                    </option>

                    {markStudents.map((student) => (
                      <option
                        key={student._id}
                        value={student._id}
                      >
                        {getStudentName(student)}
                        {student.rollNo
                          ? ` — Roll ${student.rollNo}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="om-field full">
                  <label>Subject *</label>

                  <select
                    value={markForm.subject}
                    onChange={(e) =>
                      setMarkForm((prev) => ({
                        ...prev,
                        subject: e.target.value,
                      }))
                    }
                  >
                    <option value="">
                      Select Subject
                    </option>

                    {markSubjects.map(
                      (subject) => (
                        <option
                          key={subject._id}
                          value={subject._id}
                        >
                          {getSubjectName(subject)}
                          {subject.code
                            ? ` (${subject.code})`
                            : ""}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="om-field">
                  <label>Maximum Marks *</label>

                  <input
                    type="number"
                    min="1"
                    value={markForm.maxMarks}
                    onChange={(e) =>
                      handleMarkChange(
                        "maxMarks",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="om-field">
                  <label>Obtained Marks *</label>

                  <input
                    type="number"
                    min="0"
                    max={markForm.maxMarks}
                    value={markForm.marks}
                    onChange={(e) =>
                      handleMarkChange(
                        "marks",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="om-field">
                  <label>Grade</label>

                  <input
                    type="text"
                    value={markForm.grade}
                    readOnly
                    placeholder="Auto"
                  />
                </div>

                <div className="om-field">
                  <label>Percentage</label>

                  <input
                    type="text"
                    readOnly
                    value={
                      markForm.marks !== "" &&
                      Number(markForm.maxMarks) > 0
                        ? `${(
                            (Number(
                              markForm.marks
                            ) /
                              Number(
                                markForm.maxMarks
                              )) *
                            100
                          ).toFixed(1)}%`
                        : ""
                    }
                    placeholder="Auto"
                  />
                </div>

                <div className="om-field full">
                  <label>Remarks</label>

                  <textarea
                    rows="3"
                    placeholder="Optional remarks..."
                    value={markForm.remarks}
                    onChange={(e) =>
                      setMarkForm((prev) => ({
                        ...prev,
                        remarks: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="om-modal-footer">
                <button
                  type="button"
                  className="om-cancel-btn"
                  disabled={saving}
                  onClick={() =>
                    setMarkModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="om-primary-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Save Marks"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExamsMarks;