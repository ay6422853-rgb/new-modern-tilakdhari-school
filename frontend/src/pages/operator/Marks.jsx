
import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import api from "../../api";

import "./Marks.css";

function getId(item) {
  if (!item) return "";
  return item._id || item.id || item.$oid || "";
}

function getName(item) {
  if (!item) return "";
  return item.name || item.subjectName || item.title || "";
}

function getList(data, key) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function calculateGrade(marks, maxMarks) {
  const m = Number(marks);
  const max = Number(maxMarks);

  if (!Number.isFinite(m) || !Number.isFinite(max) || max <= 0) {
    return "";
  }

  const p = (m / max) * 100;

  if (p >= 90) return "A+";
  if (p >= 80) return "A";
  if (p >= 70) return "B+";
  if (p >= 60) return "B";
  if (p >= 50) return "C";
  if (p >= 40) return "D";
  return "F";
}

function getResult(marks, maxMarks) {
  const m = Number(marks);
  const max = Number(maxMarks);

  if (!Number.isFinite(m) || !Number.isFinite(max) || max <= 0) {
    return "—";
  }

  return (m / max) * 100 >= 33 ? "PASS" : "FAIL";
}

function formatDate(date) {
  if (!date) return "";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) return "";

  return d.toLocaleDateString("en-IN");
}

export default function Marks() {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [allMarks, setAllMarks] = useState([]);

  const [classId, setClassId] = useState("");
  const [examId, setExamId] = useState("");
  const [subjectId, setSubjectId] = useState("");

  const [maxMarks, setMaxMarks] = useState(100);
  const [rows, setRows] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showSchoolModal, setShowSchoolModal] = useState(false);

  const [schoolDetails, setSchoolDetails] = useState({
    name: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    website: "",
    session: ""
  });

  // ==========================================
  // LOAD DATA
  // ==========================================

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const requests = await Promise.allSettled([
        api.get("/operator/classes"),
        api.get("/operator/subjects"),
        api.get("/operator/students"),
        api.get("/operator/exams"),
        api.get("/operator/marks")
      ]);

      const [classRes, subjectRes, studentRes, examRes, markRes] =
        requests;

      if (classRes.status === "fulfilled") {
        setClasses(getList(classRes.value.data, "classes"));
      }

      if (subjectRes.status === "fulfilled") {
        setSubjects(getList(subjectRes.value.data, "subjects"));
      }

      if (studentRes.status === "fulfilled") {
        setStudents(getList(studentRes.value.data, "students"));
      }

      if (examRes.status === "fulfilled") {
        setExams(getList(examRes.value.data, "exams"));
      }

      if (markRes.status === "fulfilled") {
        setAllMarks(getList(markRes.value.data, "marks"));
      }

      const failed = requests.find(
        (item) => item.status === "rejected"
      );

      if (failed) {
        console.error(
          "MARKS API ERROR:",
          failed.reason?.response?.data || failed.reason
        );
      }
    } catch (err) {
      console.error("LOAD MARKS ERROR:", err);
      setError(
        err?.response?.data?.message ||
          "Unable to load marks data"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // ==========================================
  // FILTER CLASSES
  // ==========================================

  const filteredStudents = useMemo(() => {
    if (!classId) return students;

    return students.filter((student) => {
      const studentClassId =
        student.classId?._id ||
        student.classId ||
        student.class?._id ||
        student.class ||
        "";

      return String(studentClassId) === String(classId);
    });
  }, [students, classId]);

  const filteredSubjects = useMemo(() => {
    if (!classId) return subjects;

    return subjects.filter((subject) => {
      const ids = subject.classIds || [];

      if (Array.isArray(ids)) {
        return ids.some(
          (id) =>
            String(id?._id || id) === String(classId)
        );
      }

      if (subject.classId) {
        return (
          String(
            subject.classId?._id || subject.classId
          ) === String(classId)
        );
      }

      return true;
    });
  }, [subjects, classId]);

  const selectedExam = exams.find(
    (exam) => String(getId(exam)) === String(examId)
  );

  // ==========================================
  // BUILD ROWS
  // ==========================================

  useEffect(() => {
    if (!examId || !subjectId) {
      setRows([]);
      return;
    }

    const newRows = filteredStudents.map((student) => {
      const existing = allMarks.find(
        (mark) =>
          String(getId(mark.student)) ===
            String(getId(student)) &&
          String(getId(mark.exam)) === String(examId) &&
          String(getId(mark.subject)) === String(subjectId)
      );

      const obtained = existing?.marks ?? "";

      return {
        student,
        markId: getId(existing),
        marks: obtained,
        grade:
          existing?.grade ||
          (obtained !== ""
            ? calculateGrade(obtained, existing?.maxMarks || maxMarks)
            : ""),
        remarks: existing?.remarks || "",
        existing: Boolean(existing)
      };
    });

    setRows(newRows);

    const existingMark = allMarks.find(
      (mark) =>
        String(getId(mark.exam)) === String(examId) &&
        String(getId(mark.subject)) === String(subjectId)
    );

    if (existingMark?.maxMarks) {
      setMaxMarks(existingMark.maxMarks);
    }
  }, [
    examId,
    subjectId,
    filteredStudents,
    allMarks,
    maxMarks
  ]);

  // ==========================================
  // CHANGE MARK
  // ==========================================

  function updateRow(index, field, value) {
    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;

        const updated = {
          ...row,
          [field]: value
        };

        if (field === "marks") {
          updated.grade = calculateGrade(
            value,
            maxMarks
          );
        }

        return updated;
      })
    );
  }

  // ==========================================
  // SAVE
  // ==========================================

  async function saveMarks() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!examId) {
        setError("Please select exam");
        return;
      }

      if (!subjectId) {
        setError("Please select subject");
        return;
      }

      const maximum = Number(maxMarks);

      if (!Number.isFinite(maximum) || maximum <= 0) {
        setError("Enter valid maximum marks");
        return;
      }

      const payloadMarks = rows
        .filter((row) => row.marks !== "")
        .map((row) => {
          const obtained = Number(row.marks);

          return {
            student: getId(row.student),
            marks: obtained,
            grade:
              row.grade ||
              calculateGrade(obtained, maximum),
            remarks: row.remarks || ""
          };
        });

      if (!payloadMarks.length) {
        setError("Please enter marks for at least one student");
        return;
      }

      await api.post("/operator/marks/bulk", {
        exam: examId,
        subject: subjectId,
        maxMarks: maximum,
        marks: payloadMarks
      });

      setSuccess("Marks saved successfully");

      await loadData();
    } catch (err) {
      console.error("SAVE MARKS ERROR:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to save marks"
      );
    } finally {
      setSaving(false);
    }
  }

  // ==========================================
  // OPEN PDF MODAL
  // ==========================================

  function openPdfModal() {
    if (!examId) {
      setError("Please select exam first");
      return;
    }

    if (!allMarks.length) {
      setError("No marks available for marksheet");
      return;
    }

    setSchoolDetails({
      name: "",
      address: "",
      city: "",
      phone: "",
      email: "",
      website: "",
      session:
        selectedExam?.session ||
        ""
    });

    setShowSchoolModal(true);
  }

  // ==========================================
  // PDF MARKSHEET
  // ==========================================

  async function downloadMarksheets() {
    try {
      setDownloading(true);
      setError("");

      const doc = new jsPDF("p", "mm", "a4");

      const examName =
        selectedExam?.name ||
        selectedExam?.title ||
        "Examination";

      const examMarks = allMarks.filter(
        (mark) =>
          String(getId(mark.exam)) ===
          String(examId)
      );

      const studentIds = [
        ...new Set(
          examMarks.map((mark) =>
            String(getId(mark.student))
          )
        )
      ];

      if (!studentIds.length) {
        setError("No marks found for selected exam");
        return;
      }

      studentIds.forEach((studentId, studentIndex) => {
        if (studentIndex > 0) {
          doc.addPage();
        }

        const studentMarks = examMarks.filter(
          (mark) =>
            String(getId(mark.student)) ===
            studentId
        );

        const student =
          studentMarks[0]?.student ||
          students.find(
            (s) =>
              String(getId(s)) === studentId
          );

        const studentName =
          student?.name || "Student";

        const admissionNo =
          student?.admissionNo ||
          student?.registrationNo ||
          student?.studentId ||
          "—";

        const fatherName =
          student?.fatherName ||
          student?.father ||
          "—";

        const studentClass =
          student?.className ||
          student?.classId?.name ||
          student?.class?.name ||
          "—";

        const section =
          student?.section || "—";

        const rollNo =
          student?.rollNo || "—";

        // HEADER
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.text(
          schoolDetails.name ||
            "SCHOOL NAME",
          105,
          18,
          { align: "center" }
        );

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");

        if (schoolDetails.address) {
          doc.text(
            schoolDetails.address,
            105,
            25,
            { align: "center" }
          );
        }

        if (schoolDetails.city) {
          doc.text(
            schoolDetails.city,
            105,
            31,
            { align: "center" }
          );
        }

        const contact = [
          schoolDetails.phone,
          schoolDetails.email,
          schoolDetails.website
        ]
          .filter(Boolean)
          .join(" | ");

        if (contact) {
          doc.text(
            contact,
            105,
            37,
            { align: "center" }
          );
        }

        doc.setFontSize(15);
        doc.setFont("helvetica", "bold");

        doc.text(
          "MARKSHEET",
          105,
          49,
          { align: "center" }
        );

        doc.setFontSize(11);
        doc.text(
          examName,
          105,
          56,
          { align: "center" }
        );

        // STUDENT INFO BOX
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);

        doc.rect(15, 64, 180, 36);

        doc.text(
          `Student Name: ${studentName}`,
          20,
          72
        );

        doc.text(
          `Father's Name: ${fatherName}`,
          20,
          80
        );

        doc.text(
          `Admission No: ${admissionNo}`,
          110,
          72
        );

        doc.text(
          `Class: ${studentClass}`,
          110,
          80
        );

        doc.text(
          `Section: ${section}`,
          20,
          89
        );

        doc.text(
          `Roll No: ${rollNo}`,
          110,
          89
        );

        doc.text(
          `Session: ${
            schoolDetails.session ||
            selectedExam?.session ||
            "—"
          }`,
          20,
          96
        );

        // TABLE
        let y = 112;

        doc.setFont("helvetica", "bold");

        doc.rect(15, y, 180, 10);

        doc.text("S.No", 20, y + 7);
        doc.text("Subject", 40, y + 7);
        doc.text("Max Marks", 115, y + 7);
        doc.text("Obtained", 145, y + 7);
        doc.text("Grade", 178, y + 7);

        y += 10;

        doc.setFont("helvetica", "normal");

        let totalMax = 0;
        let totalObtained = 0;

        studentMarks.forEach((mark, index) => {
          const max = Number(mark.maxMarks) || 0;
          const obtained = Number(mark.marks) || 0;

          totalMax += max;
          totalObtained += obtained;

          const subjectName =
            mark.subject?.name ||
            mark.subject?.subjectName ||
            "Subject";

          const grade =
            mark.grade ||
            calculateGrade(obtained, max);

          doc.rect(15, y, 180, 9);

          doc.text(
            String(index + 1),
            20,
            y + 6
          );

          doc.text(
            subjectName.substring(0, 32),
            40,
            y + 6
          );

          doc.text(
            String(max),
            120,
            y + 6
          );

          doc.text(
            String(obtained),
            151,
            y + 6
          );

          doc.text(
            grade,
            180,
            y + 6
          );

          y += 9;
        });

        const percentage =
          totalMax > 0
            ? (totalObtained / totalMax) * 100
            : 0;

        const overallGrade =
          calculateGrade(
            totalObtained,
            totalMax
          );

        const result =
          percentage >= 33
            ? "PASS"
            : "FAIL";

        // TOTAL
        y += 8;

        doc.setFont("helvetica", "bold");

        doc.text(
          `Total Marks: ${totalObtained} / ${totalMax}`,
          20,
          y
        );

        doc.text(
          `Percentage: ${percentage.toFixed(2)}%`,
          20,
          y + 9
        );

        doc.text(
          `Overall Grade: ${overallGrade}`,
          20,
          y + 18
        );

        doc.text(
          `Result: ${result}`,
          120,
          y + 18
        );

        // FOOTER
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);

        doc.text(
          `Generated on: ${formatDate(
            new Date()
          )}`,
          20,
          270
        );

        doc.line(25, 280, 75, 280);
        doc.line(135, 280, 185, 280);

        doc.text(
          "Class Teacher",
          50,
          286,
          { align: "center" }
        );

        doc.text(
          "Principal",
          160,
          286,
          { align: "center" }
        );
      });

      const safeExamName = examName
        .replace(/[^a-z0-9]/gi, "_")
        .replace(/_+/g, "_");

      doc.save(
        `${safeExamName}_marksheets.pdf`
      );

      setShowSchoolModal(false);
      setSuccess("Marksheet PDF downloaded successfully");
    } catch (err) {
      console.error("PDF ERROR:", err);

      setError(
        err?.message ||
          "Unable to create PDF"
      );
    } finally {
      setDownloading(false);
    }
  }

  // ==========================================
  // UI
  // ==========================================

  if (loading) {
    return (
      <div className="marks-page">
        <div className="marks-loading">
          Loading marks...
        </div>
      </div>
    );
  }

  return (
    <div className="marks-page">

      <div className="marks-header">
        <div>
          <h1>Marks Management</h1>
          <p>
            Enter, edit and manage student examination marks.
          </p>
        </div>

        <button
          className="pdf-btn"
          onClick={openPdfModal}
          disabled={!examId || downloading}
        >
          {downloading
            ? "Creating PDF..."
            : "Download Marksheet PDF"}
        </button>
      </div>

      {error && (
        <div className="marks-alert error">
          {error}
        </div>
      )}

      {success && (
        <div className="marks-alert success">
          {success}
        </div>
      )}

      {/* FILTERS */}

      <div className="marks-card filters-card">

        <div className="filter-item">
          <label>Class</label>

          <select
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              setSubjectId("");
            }}
          >
            <option value="">
              All Classes
            </option>

            {classes.map((item) => (
              <option
                key={getId(item)}
                value={getId(item)}
              >
                {getName(item)}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <label>Exam</label>

          <select
            value={examId}
            onChange={(e) =>
              setExamId(e.target.value)
            }
          >
            <option value="">
              Select Exam
            </option>

            {exams.map((exam) => (
              <option
                key={getId(exam)}
                value={getId(exam)}
              >
                {exam.name ||
                  exam.title ||
                  "Exam"}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <label>Subject</label>

          <select
            value={subjectId}
            onChange={(e) =>
              setSubjectId(e.target.value)
            }
          >
            <option value="">
              Select Subject
            </option>

            {filteredSubjects.map((subject) => (
              <option
                key={getId(subject)}
                value={getId(subject)}
              >
                {getName(subject)}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <label>Maximum Marks</label>

          <input
            type="number"
            min="1"
            value={maxMarks}
            onChange={(e) =>
              setMaxMarks(e.target.value)
            }
          />
        </div>

      </div>

      {/* MARKS TABLE */}

      <div className="marks-card">

        <div className="table-heading">
          <div>
            <h2>
              Student Marks
            </h2>

            <span>
              {rows.length} students
            </span>
          </div>

          <button
            className="save-btn"
            onClick={saveMarks}
            disabled={
              saving ||
              !examId ||
              !subjectId
            }
          >
            {saving
              ? "Saving..."
              : "Save Marks"}
          </button>
        </div>

        {!examId || !subjectId ? (
          <div className="empty-marks">
            Select an exam and subject
            to enter marks.
          </div>
        ) : rows.length === 0 ? (
          <div className="empty-marks">
            No students found.
          </div>
        ) : (
          <div className="marks-table-wrapper">

            <table className="marks-table">

              <thead>
                <tr>
                  <th>#</th>
                  <th>Student</th>
                  <th>Admission No.</th>
                  <th>Marks</th>
                  <th>Grade</th>
                  <th>Result</th>
                  <th>Remarks</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>

                {rows.map((row, index) => {

                  const result =
                    row.marks === ""
                      ? "—"
                      : getResult(
                          row.marks,
                          maxMarks
                        );

                  return (
                    <tr key={getId(row.student)}>

                      <td>
                        {index + 1}
                      </td>

                      <td className="student-cell">
                        <strong>
                          {getName(row.student)}
                        </strong>
                      </td>

                      <td>
                        {row.student?.admissionNo ||
                          row.student?.registrationNo ||
                          row.student?.studentId ||
                          "—"}
                      </td>

                      <td>
                        <input
                          className="marks-input"
                          type="number"
                          min="0"
                          max={maxMarks}
                          value={row.marks}
                          onChange={(e) =>
                            updateRow(
                              index,
                              "marks",
                              e.target.value
                            )
                          }
                        />
                      </td>

                      <td>
                        <span className="grade-badge">
                          {row.grade || "—"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={
                            result === "PASS"
                              ? "result-pass"
                              : result === "FAIL"
                              ? "result-fail"
                              : "result-none"
                          }
                        >
                          {result}
                        </span>
                      </td>

                      <td>
                        <input
                          className="remarks-input"
                          type="text"
                          value={row.remarks}
                          placeholder="Remarks"
                          onChange={(e) =>
                            updateRow(
                              index,
                              "remarks",
                              e.target.value
                            )
                          }
                        />
                      </td>

                      <td>
                        {row.existing ? (
                          <span className="saved-badge">
                            Saved
                          </span>
                        ) : (
                          <span className="new-badge">
                            New
                          </span>
                        )}
                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* SCHOOL DETAILS MODAL */}

      {showSchoolModal && (
        <div className="modal-overlay">

          <div className="school-modal">

            <div className="modal-header">
              <div>
                <h2>
                  Marksheet Details
                </h2>

                <p>
                  Enter school information
                  for the PDF marksheet.
                </p>
              </div>

              <button
                className="close-btn"
                onClick={() =>
                  setShowSchoolModal(false)
                }
              >
                ×
              </button>
            </div>

            <div className="school-form">

              <div className="form-group full">
                <label>
                  School Name *
                </label>

                <input
                  value={schoolDetails.name}
                  onChange={(e) =>
                    setSchoolDetails({
                      ...schoolDetails,
                      name: e.target.value
                    })
                  }
                  placeholder="Enter school name"
                />
              </div>

              <div className="form-group full">
                <label>
                  Address
                </label>

                <input
                  value={schoolDetails.address}
                  onChange={(e) =>
                    setSchoolDetails({
                      ...schoolDetails,
                      address: e.target.value
                    })
                  }
                  placeholder="School address"
                />
              </div>

              <div className="form-group">
                <label>City</label>

                <input
                  value={schoolDetails.city}
                  onChange={(e) =>
                    setSchoolDetails({
                      ...schoolDetails,
                      city: e.target.value
                    })
                  }
                  placeholder="City"
                />
              </div>

              <div className="form-group">
                <label>Phone</label>

                <input
                  value={schoolDetails.phone}
                  onChange={(e) =>
                    setSchoolDetails({
                      ...schoolDetails,
                      phone: e.target.value
                    })
                  }
                  placeholder="Phone"
                />
              </div>

              <div className="form-group">
                <label>Email</label>

                <input
                  value={schoolDetails.email}
                  onChange={(e) =>
                    setSchoolDetails({
                      ...schoolDetails,
                      email: e.target.value
                    })
                  }
                  placeholder="Email"
                />
              </div>

              <div className="form-group">
                <label>Website</label>

                <input
                  value={schoolDetails.website}
                  onChange={(e) =>
                    setSchoolDetails({
                      ...schoolDetails,
                      website: e.target.value
                    })
                  }
                  placeholder="Website"
                />
              </div>

              <div className="form-group">
                <label>Session</label>

                <input
                  value={schoolDetails.session}
                  onChange={(e) =>
                    setSchoolDetails({
                      ...schoolDetails,
                      session: e.target.value
                    })
                  }
                  placeholder="2026-27"
                />
              </div>

            </div>

            <div className="modal-actions">

              <button
                className="cancel-btn"
                onClick={() =>
                  setShowSchoolModal(false)
                }
              >
                Cancel
              </button>

              <button
                className="generate-btn"
                onClick={downloadMarksheets}
                disabled={downloading}
              >
                {downloading
                  ? "Generating..."
                  : "Generate PDF"}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
