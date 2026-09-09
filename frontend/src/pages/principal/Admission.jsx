import { useCallback, useEffect, useState } from "react";
import api from "../../api";
import "./Admission.css";

const initialForm = {
  studentId: "",
  classId: "",
  className: "",
  section: "",
  session: "",
  admissionFee: 0,
  paymentMethod: "CASH",
};

export default function Admission() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [studentsRes, classesRes] = await Promise.all([
        api.get("/principal/students"),
        api.get("/principal/classes"),
      ]);

      setStudents(studentsRes.data || []);
      setClasses(classesRes.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load admission data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setMessage("");
  };

  const handleStudentChange = (e) => {
    const studentId = e.target.value;

    const student = students.find(
      (item) => item._id === studentId
    );

    setForm((previous) => ({
      ...previous,
      studentId,
      classId: student?.classId?._id || student?.classId || "",
      className: student?.className || "",
      section: student?.section || "",
      session: student?.session || "",
      admissionFee: student?.admissionFee || 0,
    }));

    setError("");
    setMessage("");
  };

  const handleClassChange = (e) => {
    const classId = e.target.value;

    const selectedClass = classes.find(
      (item) => item._id === classId
    );

    setForm((previous) => ({
      ...previous,
      classId,
      className: selectedClass?.name || "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.studentId) {
      setError("Please select a student.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = {
        studentId: form.studentId,
        classId: form.classId || null,
        className: form.className,
        section: form.section,
        session: form.session,
        admissionFee: Number(form.admissionFee || 0),
        paymentMethod: form.paymentMethod,
      };

      const response = await api.post(
        "/principal/admissions",
        payload
      );

      setMessage(
        response.data?.message ||
          "Admission completed successfully."
      );

      setForm(initialForm);

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to complete admission."
      );
    } finally {
      setSaving(false);
    }
  };

  const registeredStudents = students.filter(
    (student) => student.status === "REGISTERED"
  );

  if (loading) {
    return (
      <div className="principal-admission">
        <div className="admission-loading">
          <div className="admission-spinner"></div>
          <p>Loading admission data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="principal-admission">
      <div className="admission-header">
        <div>
          <span>ADMISSION MANAGEMENT</span>
          <h1>Student Admission</h1>
          <p>
            Complete admission for a registered student.
          </p>
        </div>

        <button
          className="admission-refresh"
          onClick={loadData}
        >
          ↻ Refresh
        </button>
      </div>

      {error && (
        <div className="admission-error">
          {error}
        </div>
      )}

      {message && (
        <div className="admission-success">
          ✓ {message}
        </div>
      )}

      <div className="admission-layout">
        <div className="admission-card">
          <div className="admission-card-header">
            <div className="admission-number">01</div>
            <div>
              <h2>Select Student</h2>
              <p>
                Choose a registered student for admission.
              </p>
            </div>
          </div>

          <div className="admission-field">
            <label>Registered Student *</label>

            <select
              name="studentId"
              value={form.studentId}
              onChange={handleStudentChange}
            >
              <option value="">
                Select registered student
              </option>

              {registeredStudents.map((student) => (
                <option
                  key={student._id}
                  value={student._id}
                >
                  {student.name}
                  {student.registrationNo
                    ? ` — ${student.registrationNo}`
                    : ""}
                </option>
              ))}
            </select>

            {registeredStudents.length === 0 && (
              <small className="admission-help">
                No registered students are currently available.
              </small>
            )}
          </div>

          {form.studentId && (
            <div className="selected-student">
              <div className="selected-avatar">
                {students
                  .find((s) => s._id === form.studentId)
                  ?.name?.charAt(0)
                  ?.toUpperCase()}
              </div>

              <div>
                <strong>
                  {
                    students.find(
                      (s) => s._id === form.studentId
                    )?.name
                  }
                </strong>

                <span>
                  Registration No:{" "}
                  {students.find(
                    (s) => s._id === form.studentId
                  )?.registrationNo || "—"}
                </span>
              </div>
            </div>
          )}
        </div>

        <form
          className="admission-card"
          onSubmit={handleSubmit}
        >
          <div className="admission-card-header">
            <div className="admission-number">02</div>
            <div>
              <h2>Admission Details</h2>
              <p>Enter class and payment information.</p>
            </div>
          </div>

          <div className="admission-form-grid">
            <div className="admission-field">
              <label>Class</label>

              <select
                name="classId"
                value={form.classId}
                onChange={handleClassChange}
              >
                <option value="">Select class</option>

                {classes.map((item) => (
                  <option
                    key={item._id}
                    value={item._id}
                  >
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="admission-field">
              <label>Section</label>

              <input
                name="section"
                value={form.section}
                onChange={handleChange}
                placeholder="A / B / C"
              />
            </div>

            <div className="admission-field">
              <label>Session</label>

              <input
                name="session"
                value={form.session}
                onChange={handleChange}
                placeholder="2026-27"
              />
            </div>

            <div className="admission-field">
              <label>Admission Fee</label>

              <input
                type="number"
                min="0"
                name="admissionFee"
                value={form.admissionFee}
                onChange={handleChange}
              />
            </div>

            <div className="admission-field full">
              <label>Payment Method</label>

              <select
                name="paymentMethod"
                value={form.paymentMethod}
                onChange={handleChange}
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
                <option value="BANK">Bank</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>
          </div>

          <div className="admission-submit-area">
            <button
              type="submit"
              disabled={saving || !form.studentId}
            >
              {saving
                ? "Processing Admission..."
                : "Complete Admission"}
            </button>
          </div>
        </form>
      </div>

      <div className="admission-info">
        <div className="info-icon">i</div>
        <div>
          <strong>Admission workflow</strong>
          <p>
            Once admission is completed, the backend changes
            the student's status to <b>ACTIVE</b> and creates
            the admission record. If an admission fee is
            entered, the corresponding payment is also recorded.
          </p>
        </div>
      </div>
    </div>
  );
}