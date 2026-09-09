
import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import api from "../../api";
import "./Marks.css";

const EMPTY_SCHOOL = {
  name: "",
  address: "",
  phone: "",
  email: "",
};

export default function TeacherMarks() {
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [existingMarks, setExistingMarks] = useState([]);

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedExam, setSelectedExam] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  const [maxMarks, setMaxMarks] = useState(100);
  const [search, setSearch] = useState("");
  const [marksData, setMarksData] = useState({});

  const [loading, setLoading] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [downloadMode, setDownloadMode] = useState(null);
  const [downloadStudent, setDownloadStudent] = useState(null);
  const [schoolDetails, setSchoolDetails] =
    useState(EMPTY_SCHOOL);

  /* =========================
     INITIAL LOAD
  ========================= */

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      const [
        classResponse,
        examResponse,
        studentResponse,
        markResponse,
      ] = await Promise.all([
        api.get("/teacher/classes"),
        api.get("/teacher/exams"),
        api.get("/teacher/students"),
        api.get("/teacher/marks"),
      ]);

      const classList =
        classResponse.data?.classTeacherClasses || [];

      const examList =
        examResponse.data?.exams ||
        examResponse.data?.data ||
        examResponse.data?.results ||
        [];

      const studentList =
        studentResponse.data?.classTeacherStudents || [];

      const markList =
        markResponse.data?.marks ||
        markResponse.data?.data ||
        markResponse.data?.results ||
        [];

      setClasses(Array.isArray(classList) ? classList : []);
      setExams(Array.isArray(examList) ? examList : []);
      setStudents(
        Array.isArray(studentList) ? studentList : []
      );
      setExistingMarks(
        Array.isArray(markList) ? markList : []
      );

      if (classList.length) {
        setSelectedClass(String(classList[0]._id));
      }
    } catch (error) {
      console.error(error);
      alert(
        error?.response?.data?.message ||
          "Failed to load marks data."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     CLASS SUBJECTS
  ========================= */

  useEffect(() => {
    setSelectedSubject("");

    if (!selectedClass) {
      setSubjects([]);
      return;
    }

    loadClassSubjects();
  }, [selectedClass]);

  const loadClassSubjects = async () => {
    try {
      setLoadingSubjects(true);

      const response = await api.get(
        "/teacher/subjects",
        {
          params: {
            classId: selectedClass,
            _t: Date.now(),
          },
        }
      );

      const list =
        response.data?.subjects ||
        response.data?.data ||
        response.data?.results ||
        [];

      setSubjects(Array.isArray(list) ? list : []);

      if (list.length) {
        setSelectedSubject(String(list[0]._id));
      }
    } catch (error) {
      console.error(error);
      setSubjects([]);
      setSelectedSubject("");

      alert(
        error?.response?.data?.message ||
          "Failed to load subjects."
      );
    } finally {
      setLoadingSubjects(false);
    }
  };

  /* =========================
     CLASS EXAMS
  ========================= */

  const classExams = useMemo(() => {
    if (!selectedClass) return [];

    return exams.filter((exam) => {
      const examClass =
        exam.classId?._id || exam.classId;

      return (
        String(examClass) === String(selectedClass)
      );
    });
  }, [exams, selectedClass]);

  useEffect(() => {
    if (!classExams.length) {
      setSelectedExam("");
      return;
    }

    const exists = classExams.some(
      (exam) =>
        String(exam._id) === String(selectedExam)
    );

    if (!exists) {
      setSelectedExam(String(classExams[0]._id));
    }
  }, [classExams, selectedExam]);

  /* =========================
     MARKS DATA
  ========================= */

  useEffect(() => {
    if (
      !selectedClass ||
      !selectedExam ||
      !selectedSubject ||
      !students.length
    ) {
      setMarksData({});
      return;
    }

    const data = {};

    students.forEach((student) => {
      const studentId = String(student._id);

      const found = existingMarks.find((item) => {
        const itemStudent =
          item.student?._id || item.student;

        const itemExam =
          item.exam?._id || item.exam;

        const itemSubject =
          item.subject?._id || item.subject;

        return (
          String(itemStudent) === studentId &&
          String(itemExam) === String(selectedExam) &&
          String(itemSubject) === String(selectedSubject)
        );
      });

      data[studentId] = {
        marks:
          found?.marks !== undefined &&
          found?.marks !== null
            ? found.marks
            : "",

        grade: found?.grade || "",
        remarks: found?.remarks || "",
        maxMarks: found?.maxMarks || maxMarks,
      };
    });

    setMarksData(data);
  }, [
    selectedClass,
    selectedExam,
    selectedSubject,
    students,
    existingMarks,
    maxMarks,
  ]);

  /* =========================
     HELPERS
  ========================= */

  const selectedClassName = () => {
    const item = classes.find(
      (cls) =>
        String(cls._id) === String(selectedClass)
    );

    return item?.name || item?.classCode || "—";
  };

  const selectedExamData = useMemo(
    () =>
      classExams.find(
        (exam) =>
          String(exam._id) === String(selectedExam)
      ),
    [classExams, selectedExam]
  );

  const selectedSubjectData = useMemo(
    () =>
      subjects.find(
        (subject) =>
          String(subject._id) ===
          String(selectedSubject)
      ),
    [subjects, selectedSubject]
  );

  const calculateGrade = (marks, maximum) => {
    if (
      marks === "" ||
      marks === null ||
      marks === undefined
    ) {
      return "";
    }

    const value = Number(marks);
    const max = Number(maximum);

    if (Number.isNaN(value) || max <= 0) return "";

    const percentage = (value / max) * 100;

    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B+";
    if (percentage >= 60) return "B";
    if (percentage >= 50) return "C";
    if (percentage >= 40) return "D";

    return "F";
  };

  const findStudentSubjectMark = (
    studentId,
    subjectId
  ) => {
    return existingMarks.find((item) => {
      const itemStudent =
        item.student?._id || item.student;

      const itemExam =
        item.exam?._id || item.exam;

      const itemSubject =
        item.subject?._id || item.subject;

      return (
        String(itemStudent) === String(studentId) &&
        String(itemExam) === String(selectedExam) &&
        String(itemSubject) === String(subjectId)
      );
    });
  };

  /* =========================
     UPDATE MARK
  ========================= */

  const updateMark = (
    studentId,
    field,
    value
  ) => {
    setMarksData((prev) => {
      const current = {
        ...(prev[studentId] || {}),
      };

      current[field] = value;

      if (field === "marks") {
        current.grade = calculateGrade(
          value,
          current.maxMarks || maxMarks
        );
      }

      return {
        ...prev,
        [studentId]: current,
      };
    });
  };

  /* =========================
     SAVE
  ========================= */

  const saveAllMarks = async () => {
    if (!selectedClass) {
      alert("Please select a class.");
      return;
    }

    if (!selectedExam) {
      alert("Please select an exam.");
      return;
    }

    if (!selectedSubject) {
      alert("Please select a subject.");
      return;
    }

    const payloadMarks = [];

    for (const student of students) {
      const item =
        marksData[String(student._id)];

      if (
        !item ||
        item.marks === "" ||
        item.marks === null ||
        item.marks === undefined
      ) {
        continue;
      }

      const numericMarks = Number(item.marks);

      if (
        Number.isNaN(numericMarks) ||
        numericMarks < 0 ||
        numericMarks > Number(maxMarks)
      ) {
        alert(
          `${student.name}: Maximum ${maxMarks} marks allowed.`
        );
        return;
      }

      payloadMarks.push({
        student: String(student._id),
        marks: numericMarks,
        remarks: item.remarks || "",
      });
    }

    if (!payloadMarks.length) {
      alert("Please enter at least one mark.");
      return;
    }

    try {
      setSaving(true);

      const response = await api.post(
        "/teacher/marks/bulk",
        {
          exam: selectedExam,
          subject: selectedSubject,
          maxMarks: Number(maxMarks),
          marks: payloadMarks,
        }
      );

      alert(
        response.data?.message ||
          "Marks saved successfully."
      );

      await reloadMarks();
    } catch (error) {
      console.error(error);

      alert(
        error?.response?.data?.message ||
          "Failed to save marks."
      );
    } finally {
      setSaving(false);
    }
  };

  const reloadMarks = async () => {
    try {
      const response = await api.get(
        "/teacher/marks",
        {
          params: {
            _t: Date.now(),
          },
        }
      );

      const list =
        response.data?.marks ||
        response.data?.data ||
        response.data?.results ||
        [];

      setExistingMarks(
        Array.isArray(list) ? list : []
      );
    } catch (error) {
      console.error(error);
    }
  };

  /* =========================
     SEARCH
  ========================= */

  const filteredStudents = useMemo(() => {
    const keyword =
      search.toLowerCase().trim();

    if (!keyword) return students;

    return students.filter((student) => {
      const text = `
        ${student.name || ""}
        ${student.studentId || ""}
        ${student.registrationNo || ""}
        ${student.rollNo || ""}
      `.toLowerCase();

      return text.includes(keyword);
    });
  }, [students, search]);

  /* =========================
     DOWNLOAD MODAL
  ========================= */

  const resetDownload = () => {
    setShowSchoolModal(false);
    setDownloadMode(null);
    setDownloadStudent(null);
    setSchoolDetails(EMPTY_SCHOOL);
  };

  const openIndividualMarksheet = (student) => {
    setDownloadMode("single");
    setDownloadStudent(student);
    setSchoolDetails(EMPTY_SCHOOL);
    setShowSchoolModal(true);
  };

  const openAllMarksheets = () => {
    if (!selectedClass) {
      alert("Please select a class.");
      return;
    }

    if (!selectedExam) {
      alert("Please select an exam.");
      return;
    }

    if (!students.length) {
      alert("No students found.");
      return;
    }

    setDownloadMode("all");
    setDownloadStudent(null);
    setSchoolDetails(EMPTY_SCHOOL);
    setShowSchoolModal(true);
  };

  const handleSchoolDetailsSubmit = async () => {
    if (!schoolDetails.name.trim()) {
      alert("School name is required.");
      return;
    }

    try {
      setGenerating(true);

      setShowSchoolModal(false);

      if (downloadMode === "single") {
        await generateMarksheet(
          downloadStudent,
          schoolDetails
        );
      }

      if (downloadMode === "all") {
        await generateAllMarksheets(
          schoolDetails
        );
      }
    } finally {
      setGenerating(false);
      setDownloadMode(null);
      setDownloadStudent(null);
      setSchoolDetails(EMPTY_SCHOOL);
    }
  };

  /* =========================
     PDF DESIGN
  ========================= */

  const addPdfHeader = (
    pdf,
    school,
    exam
  ) => {
    pdf.setFillColor(20, 28, 55);
    pdf.roundedRect(
      12,
      12,
      186,
      34,
      4,
      4,
      "F"
    );

    pdf.setTextColor(255, 255, 255);

    pdf.setFontSize(18);
    pdf.setFont(undefined, "bold");
    pdf.text(
      school.name || "School Name",
      105,
      23,
      { align: "center" }
    );

    pdf.setFontSize(8);
    pdf.setFont(undefined, "normal");

    if (school.address) {
      pdf.text(
        school.address,
        105,
        29,
        { align: "center" }
      );
    }

    const contact = [
      school.phone,
      school.email,
    ]
      .filter(Boolean)
      .join("  •  ");

    if (contact) {
      pdf.text(
        contact,
        105,
        35,
        { align: "center" }
      );
    }

    pdf.setFontSize(11);
    pdf.setFont(undefined, "bold");

    pdf.text(
      "STUDENT PERFORMANCE REPORT",
      105,
      42,
      { align: "center" }
    );

    pdf.setTextColor(30, 35, 50);

    pdf.setFontSize(9);
    pdf.setFont(undefined, "normal");

    pdf.text(
      `EXAM  ${exam?.name || "—"}`,
      15,
      54
    );

    pdf.text(
      `SESSION  ${exam?.session || "—"}`,
      195,
      54,
      { align: "right" }
    );

    return 62;
  };

  const addStudentMarksheetPage = (
    pdf,
    student,
    school,
    exam
  ) => {
    let y = addPdfHeader(
      pdf,
      school,
      exam
    );

    /* STUDENT CARD */

    pdf.setFillColor(245, 247, 251);

    pdf.roundedRect(
      12,
      y,
      186,
      32,
      4,
      4,
      "F"
    );

    pdf.setTextColor(25, 30, 45);

    pdf.setFontSize(11);
    pdf.setFont(undefined, "bold");

    pdf.text(
      student.name || "Student",
      20,
      y + 10
    );

    pdf.setFontSize(8);
    pdf.setFont(undefined, "normal");

    pdf.text(
      `Student ID: ${
        student.studentId ||
        student.registrationNo ||
        "—"
      }`,
      20,
      y + 17
    );

    pdf.text(
      `Father: ${student.fatherName || "—"}`,
      20,
      y + 24
    );

    pdf.text(
      `Class: ${
        student.className ||
        selectedClassName()
      }`,
      112,
      y + 10
    );

    pdf.text(
      `Section: ${student.section || "—"}`,
      112,
      y + 17
    );

    pdf.text(
      `Roll No: ${student.rollNo || "—"}`,
      112,
      y + 24
    );

    y += 43;

    /* TABLE */

    const x = 12;
    const width = 186;
    const rowHeight = 9;

    pdf.setFillColor(20, 28, 55);
    pdf.roundedRect(
      x,
      y,
      width,
      rowHeight,
      2,
      2,
      "F"
    );

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.setFont(undefined, "bold");

    pdf.text("SUBJECT", 17, y + 6);
    pdf.text("MAX", 104, y + 6);
    pdf.text("OBTAINED", 122, y + 6);
    pdf.text("GRADE", 151, y + 6);
    pdf.text("REMARKS", 174, y + 6);

    y += rowHeight;

    pdf.setTextColor(30, 35, 50);
    pdf.setFont(undefined, "normal");

    let totalMarks = 0;
    let totalMaxMarks = 0;
    let allEntered = true;

    subjects.forEach((subject, index) => {
      if (y > 258) {
        pdf.addPage();
        y = 20;

        pdf.setFillColor(20, 28, 55);
        pdf.roundedRect(
          x,
          y,
          width,
          rowHeight,
          2,
          2,
          "F"
        );

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(8);
        pdf.setFont(undefined, "bold");

        pdf.text("SUBJECT", 17, y + 6);
        pdf.text("MAX", 104, y + 6);
        pdf.text("OBTAINED", 122, y + 6);
        pdf.text("GRADE", 151, y + 6);
        pdf.text("REMARKS", 174, y + 6);

        y += rowHeight;

        pdf.setTextColor(30, 35, 50);
        pdf.setFont(undefined, "normal");
      }

      const mark = findStudentSubjectMark(
        student._id,
        subject._id
      );

      const maximum = Number(
        mark?.maxMarks || maxMarks
      );

      const obtained =
        mark?.marks !== undefined &&
        mark?.marks !== null
          ? Number(mark.marks)
          : null;

      if (obtained === null) {
        allEntered = false;
      } else {
        totalMarks += obtained;
      }

      totalMaxMarks += maximum;

      if (index % 2 === 0) {
        pdf.setFillColor(248, 249, 252);
        pdf.rect(
          x,
          y,
          width,
          rowHeight,
          "F"
        );
      }

      pdf.setDrawColor(225, 228, 235);
      pdf.line(
        x,
        y + rowHeight,
        x + width,
        y + rowHeight
      );

      pdf.setFontSize(8);

      pdf.text(
        String(subject.name || "—").substring(
          0,
          34
        ),
        17,
        y + 6
      );

      pdf.text(
        String(maximum),
        104,
        y + 6
      );

      pdf.text(
        obtained === null
          ? "—"
          : String(obtained),
        126,
        y + 6
      );

      pdf.text(
        mark?.grade ||
          (obtained !== null
            ? calculateGrade(
                obtained,
                maximum
              )
            : "—"),
        153,
        y + 6
      );

      pdf.text(
        String(mark?.remarks || "").substring(
          0,
          14
        ),
        174,
        y + 6
      );

      y += rowHeight;
    });

    /* SUMMARY */

    y += 12;

    const percentage =
      totalMaxMarks > 0
        ? (
            (totalMarks / totalMaxMarks) *
            100
          ).toFixed(2)
        : "0.00";

    const overallGrade = allEntered
      ? calculateGrade(
          totalMarks,
          totalMaxMarks
        )
      : "";

    const result = !allEntered
      ? "PENDING"
      : overallGrade === "F"
      ? "FAIL"
      : "PASS";

    const cards = [
      {
        label: "TOTAL",
        value: `${totalMarks}/${totalMaxMarks}`,
      },
      {
        label: "PERCENTAGE",
        value: `${percentage}%`,
      },
      {
        label: "GRADE",
        value: overallGrade || "—",
      },
      {
        label: "RESULT",
        value: result,
      },
    ];

    cards.forEach((card, index) => {
      const cardX = 12 + index * 47;
      const cardWidth = 43;

      pdf.setFillColor(245, 247, 251);

      pdf.roundedRect(
        cardX,
        y,
        cardWidth,
        25,
        3,
        3,
        "F"
      );

      pdf.setTextColor(100, 105, 120);
      pdf.setFontSize(6.5);
      pdf.setFont(undefined, "bold");

      pdf.text(
        card.label,
        cardX + cardWidth / 2,
        y + 8,
        { align: "center" }
      );

      pdf.setTextColor(25, 30, 45);
      pdf.setFontSize(10);
      pdf.setFont(undefined, "bold");

      pdf.text(
        card.value,
        cardX + cardWidth / 2,
        y + 18,
        { align: "center" }
      );
    });

    y += 45;

    /* SIGNATURES */

    pdf.setDrawColor(170, 175, 185);

    pdf.line(25, y, 80, y);
    pdf.line(130, y, 185, y);

    pdf.setTextColor(80, 85, 100);
    pdf.setFontSize(8);
    pdf.setFont(undefined, "normal");

    pdf.text(
      "Class Teacher",
      52,
      y + 6,
      { align: "center" }
    );

    pdf.text(
      "Principal",
      157,
      y + 6,
      { align: "center" }
    );

    pdf.setFontSize(6.5);

    pdf.text(
      "Generated electronically",
      105,
      286,
      { align: "center" }
    );
  };

  /* =========================
     SINGLE PDF
  ========================= */

  const generateMarksheet = (
    student,
    school
  ) => {
    const exam = selectedExamData;

    if (!exam) {
      alert("Exam not found.");
      return;
    }

    const pdf = new jsPDF();

    addStudentMarksheetPage(
      pdf,
      student,
      school,
      exam
    );

    const safeName = String(
      student.name || "student"
    )
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase();

    pdf.save(
      `${safeName}_marksheet.pdf`
    );
  };

  /* =========================
     ALL - ONE PDF
  ========================= */

  const generateAllMarksheets = (
    school
  ) => {
    const exam = selectedExamData;

    if (!exam) {
      alert("Exam not found.");
      return;
    }

    if (!students.length) {
      alert("No students found.");
      return;
    }

    const pdf = new jsPDF();

    students.forEach((student, index) => {
      if (index > 0) {
        pdf.addPage();
      }

      addStudentMarksheetPage(
        pdf,
        student,
        school,
        exam
      );
    });

    const className = selectedClassName()
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase();

    const examName = String(
      exam.name || "exam"
    )
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase();

    pdf.save(
      `${className}_${examName}_all_marksheets.pdf`
    );

    alert(
      `${students.length} marksheets combined into one PDF.`
    );
  };

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <div className="teacher-marks-page">
        <div className="marks-loading">
          <div className="marks-spinner" />
          <strong>Loading Marks</strong>
          <span>
            Preparing your academic workspace...
          </span>
        </div>
      </div>
    );
  }

  /* =========================
     UI
  ========================= */

  return (
    <div className="teacher-marks-page">

      {/* HERO */}

      <section className="marks-hero">

        <div className="marks-hero-content">

          <div className="marks-hero-icon">
            ✦
          </div>

          <div>
            <div className="marks-eyebrow">
              ACADEMIC MANAGEMENT
            </div>

            <h1>
              Marks Management
            </h1>

            <p>
              Enter, review and generate
              professional student performance
              reports.
            </p>
          </div>

        </div>

        <div className="marks-hero-actions">

          <button
            className="marks-btn marks-btn-light"
            onClick={loadInitialData}
            disabled={saving || generating}
          >
            ↻ Refresh
          </button>

          <button
            className="marks-btn marks-btn-primary"
            onClick={openAllMarksheets}
            disabled={
              !selectedExam ||
              !students.length ||
              saving ||
              generating
            }
          >
            ↓ Download All
          </button>

          <button
            className="marks-btn marks-btn-save"
            onClick={saveAllMarks}
            disabled={
              saving ||
              !students.length ||
              !selectedSubject ||
              generating
            }
          >
            {saving
              ? "Saving..."
              : "✓ Save Marks"}
          </button>

        </div>

      </section>

      {/* QUICK STATS */}

      <section className="marks-stats">

        <div className="marks-stat-card">
          <div className="stat-icon">◈</div>
          <div>
            <span>CLASS</span>
            <strong>
              {selectedClassName()}
            </strong>
          </div>
        </div>

        <div className="marks-stat-card">
          <div className="stat-icon">◎</div>
          <div>
            <span>STUDENTS</span>
            <strong>
              {students.length}
            </strong>
          </div>
        </div>

        <div className="marks-stat-card">
          <div className="stat-icon">◇</div>
          <div>
            <span>SUBJECTS</span>
            <strong>
              {subjects.length}
            </strong>
          </div>
        </div>

        <div className="marks-stat-card">
          <div className="stat-icon">◷</div>
          <div>
            <span>EXAMINATION</span>
            <strong>
              {selectedExamData?.name || "—"}
            </strong>
          </div>
        </div>

      </section>

      {/* FILTERS */}

      <section className="marks-control-card">

        <div className="control-heading">
          <div>
            <span className="control-label">
              WORKSPACE
            </span>

            <h2>
              Select Academic Details
            </h2>
          </div>

          <span className="control-status">
            ● Live
          </span>
        </div>

        <div className="marks-filters">

          <div className="marks-field">
            <label>Class</label>

            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(
                  e.target.value
                );
                setSelectedExam("");
                setSelectedSubject("");
              }}
            >
              <option value="">
                Select Class
              </option>

              {classes.map((item) => (
                <option
                  key={item._id}
                  value={item._id}
                >
                  {item.name ||
                    item.classCode}
                </option>
              ))}
            </select>
          </div>

          <div className="marks-field">
            <label>Examination</label>

            <select
              value={selectedExam}
              onChange={(e) =>
                setSelectedExam(
                  e.target.value
                )
              }
            >
              <option value="">
                Select Examination
              </option>

              {classExams.map((exam) => (
                <option
                  key={exam._id}
                  value={exam._id}
                >
                  {exam.name}
                </option>
              ))}
            </select>
          </div>

          <div className="marks-field">
            <label>Subject</label>

            <select
              value={selectedSubject}
              onChange={(e) =>
                setSelectedSubject(
                  e.target.value
                )
              }
              disabled={
                loadingSubjects ||
                !subjects.length
              }
            >
              <option value="">
                {loadingSubjects
                  ? "Loading..."
                  : subjects.length
                  ? "Select Subject"
                  : "No Subjects Found"}
              </option>

              {subjects.map((subject) => (
                <option
                  key={subject._id}
                  value={subject._id}
                >
                  {subject.name}
                  {subject.code
                    ? ` (${subject.code})`
                    : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="marks-field marks-field-small">
            <label>Maximum Marks</label>

            <input
              type="number"
              min="1"
              value={maxMarks}
              onChange={(e) =>
                setMaxMarks(
                  e.target.value
                )
              }
            />
          </div>

          <div className="marks-field marks-search-field">
            <label>Find Student</label>

            <div className="marks-search">
              <span>⌕</span>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search by name, ID or roll..."
              />

              {search && (
                <button
                  onClick={() =>
                    setSearch("")
                  }
                >
                  ×
                </button>
              )}
            </div>
          </div>

        </div>

      </section>

      {/* SUBJECT BAR */}

      {selectedSubjectData && (
        <section className="active-subject">

          <div className="active-subject-left">

            <div className="active-subject-icon">
              {selectedSubjectData.name
                ?.charAt(0)
                ?.toUpperCase() || "S"}
            </div>

            <div>
              <span>
                CURRENT SUBJECT
              </span>

              <h3>
                {selectedSubjectData.name}
              </h3>
            </div>

          </div>

          <div className="active-subject-meta">

            <div>
              <span>EXAM</span>
              <strong>
                {selectedExamData?.name ||
                  "—"}
              </strong>
            </div>

            <div>
              <span>STUDENTS</span>
              <strong>
                {filteredStudents.length}
              </strong>
            </div>

          </div>

        </section>
      )}

      {/* TABLE */}

      {selectedClass &&
      selectedExam &&
      selectedSubject ? (
        <section className="marks-main-card">

          <div className="marks-table-header">

            <div>
              <span className="table-kicker">
                MARK ENTRY
              </span>

              <h2>
                Student Performance
              </h2>

              <p>
                Enter marks for{" "}
                <strong>
                  {selectedSubjectData?.name}
                </strong>
              </p>
            </div>

            <div className="table-count">
              <strong>
                {filteredStudents.length}
              </strong>
              <span>
                Students
              </span>
            </div>

          </div>

          {filteredStudents.length === 0 ? (
            <div className="marks-empty">
              <div className="empty-symbol">
                ◌
              </div>

              <h3>
                No students found
              </h3>

              <p>
                Try changing your search
                keyword.
              </p>
            </div>
          ) : (
            <div className="marks-table-scroll">

              <table className="marks-table">

                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student</th>
                    <th>ID</th>
                    <th>Roll</th>
                    <th>Max</th>
                    <th>Marks</th>
                    <th>Grade</th>
                    <th>Remarks</th>
                    <th>Report</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map(
                    (student, index) => {
                      const studentId =
                        String(student._id);

                      const item =
                        marksData[
                          studentId
                        ] || {};

                      const value =
                        item.marks;

                      const numericValue =
                        Number(value);

                      const invalid =
                        value !== "" &&
                        (
                          Number.isNaN(
                            numericValue
                          ) ||
                          numericValue < 0 ||
                          numericValue >
                            Number(maxMarks)
                        );

                      const grade =
                        item.grade || "";

                      return (
                        <tr
                          key={student._id}
                        >

                          <td>
                            <span className="table-number">
                              {String(
                                index + 1
                              ).padStart(2, "0")}
                            </span>
                          </td>

                          <td>
                            <div className="student-profile">

                              <div className="student-avatar">
                                {(
                                  student.name ||
                                  "S"
                                )
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>
                                <strong>
                                  {student.name}
                                </strong>

                                <span>
                                  {student.fatherName ||
                                    "Student"}
                                </span>
                              </div>

                            </div>
                          </td>

                          <td>
                            <span className="student-id">
                              {student.studentId ||
                                student.registrationNo ||
                                "—"}
                            </span>
                          </td>

                          <td>
                            <span className="roll-pill">
                              {student.rollNo ||
                                "—"}
                            </span>
                          </td>

                          <td>
                            <span className="max-marks">
                              {maxMarks}
                            </span>
                          </td>

                          <td>
                            <input
                              className={`marks-entry ${
                                invalid
                                  ? "marks-invalid"
                                  : ""
                              }`}
                              type="number"
                              min="0"
                              max={maxMarks}
                              step="0.5"
                              value={
                                value ?? ""
                              }
                              placeholder="—"
                              onChange={(e) =>
                                updateMark(
                                  studentId,
                                  "marks",
                                  e.target.value
                                )
                              }
                            />

                            {invalid && (
                              <small className="marks-warning">
                                Max {maxMarks}
                              </small>
                            )}
                          </td>

                          <td>
                            <span
                              className={`grade-pill ${
                                grade
                                  ? `grade-${grade
                                      .replace(
                                        "+",
                                        "plus"
                                      )
                                      .toLowerCase()}`
                                  : "grade-empty"
                              }`}
                            >
                              {grade || "—"}
                            </span>
                          </td>

                          <td>
                            <input
                              className="remarks-entry"
                              type="text"
                              value={
                                item.remarks ||
                                ""
                              }
                              placeholder="Add remark..."
                              onChange={(e) =>
                                updateMark(
                                  studentId,
                                  "remarks",
                                  e.target.value
                                )
                              }
                            />
                          </td>

                          <td>
                            <button
                              className="report-button"
                              onClick={() =>
                                openIndividualMarksheet(
                                  student
                                )
                              }
                              disabled={
                                generating
                              }
                              title="Generate marksheet"
                            >
                              <span>↗</span>
                              PDF
                            </button>
                          </td>

                        </tr>
                      );
                    }
                  )}
                </tbody>

              </table>

            </div>
          )}

        </section>
      ) : (
        <section className="marks-welcome">

          <div className="welcome-icon">
            ✦
          </div>

          <span className="welcome-label">
            READY WHEN YOU ARE
          </span>

          <h2>
            Start entering student marks
          </h2>

          <p>
            Select a class, examination and
            subject to open the marks workspace.
          </p>

          <div className="welcome-steps">

            <div>
              <b>01</b>
              <span>Select Class</span>
            </div>

            <div>
              <b>02</b>
              <span>Select Exam</span>
            </div>

            <div>
              <b>03</b>
              <span>Select Subject</span>
            </div>

          </div>

        </section>
      )}

      {/* SCHOOL MODAL */}

      {showSchoolModal && (
        <div
          className="school-modal-backdrop"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget
            ) {
              resetDownload();
            }
          }}
        >

          <div className="school-modal">

            <div className="modal-top">

              <div className="modal-brand">
                <div className="modal-school-icon">
                  ✦
                </div>

                <div>
                  <span>
                    REPORT GENERATOR
                  </span>

                  <h2>
                    School Information
                  </h2>
                </div>
              </div>

              <button
                className="modal-close"
                onClick={resetDownload}
              >
                ×
              </button>

            </div>

            <div className="modal-notice">

              <div className="notice-icon">
                {downloadMode === "all"
                  ? "▣"
                  : "◇"}
              </div>

              <div>
                <strong>
                  {downloadMode === "all"
                    ? "Combined Marksheets"
                    : "Student Marksheet"}
                </strong>

                <span>
                  {downloadMode === "all"
                    ? `${students.length} student reports will be placed in one PDF`
                    : `Generating report for ${
                        downloadStudent?.name ||
                        "student"
                      }`}
                </span>
              </div>

            </div>

            <div className="modal-form">

              <div className="modal-field modal-full">
                <label>
                  School Name <i>*</i>
                </label>

                <input
                  type="text"
                  autoFocus
                  value={schoolDetails.name}
                  onChange={(e) =>
                    setSchoolDetails({
                      ...schoolDetails,
                      name: e.target.value,
                    })
                  }
                  placeholder="e.g. Delhi Public School"
                />
              </div>

              <div className="modal-field modal-full">
                <label>School Address</label>

                <textarea
                  rows="3"
                  value={schoolDetails.address}
                  onChange={(e) =>
                    setSchoolDetails({
                      ...schoolDetails,
                      address:
                        e.target.value,
                    })
                  }
                  placeholder="Complete school address"
                />
              </div>

              <div className="modal-field">
                <label>Phone Number</label>

                <input
                  type="text"
                  value={schoolDetails.phone}
                  onChange={(e) =>
                    setSchoolDetails({
                      ...schoolDetails,
                      phone: e.target.value,
                    })
                  }
                  placeholder="School phone"
                />
              </div>

              <div className="modal-field">
                <label>Email Address</label>

                <input
                  type="email"
                  value={schoolDetails.email}
                  onChange={(e) =>
                    setSchoolDetails({
                      ...schoolDetails,
                      email: e.target.value,
                    })
                  }
                  placeholder="school@example.com"
                />
              </div>

            </div>

            <div className="modal-footer">

              <button
                className="modal-cancel"
                onClick={resetDownload}
                disabled={generating}
              >
                Cancel
              </button>

              <button
                className="modal-generate"
                onClick={
                  handleSchoolDetailsSubmit
                }
                disabled={generating}
              >
                {generating
                  ? "Generating..."
                  : downloadMode === "all"
                  ? "↓ Generate Combined PDF"
                  : "↓ Generate Marksheet"}
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
