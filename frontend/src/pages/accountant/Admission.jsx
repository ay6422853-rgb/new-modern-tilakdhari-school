import React, { useEffect, useState } from "react";
import { admission, list } from "../../api";
import "./Admission.css";

const initialForm = {
  studentId: "",
  classId: "",
  className: "",
  section: "",
  session: "",
  admissionFee: "",
  paymentMethod: "CASH",
};

export default function Admission() {
  const [form, setForm] = useState(initialForm);

  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =========================
  // LOAD CLASSES FROM DATABASE
  // =========================
  useEffect(() => {
    const loadClasses = async () => {
      try {
        setLoadingClasses(true);

        const data = await list("accountant/classes");

        setClasses(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Classes load error:", err);

        setError(
          err?.response?.data?.message ||
            "Classes load nahi ho paayi."
        );
      } finally {
        setLoadingClasses(false);
      }
    };

    loadClasses();
  }, []);

  // =========================
  // INPUT CHANGE
  // =========================
  const change = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================
  // CLASS CHANGE
  // =========================
  const classChange = (e) => {
    const classId = e.target.value;

    const selectedClass = classes.find(
      (item) => String(item._id) === String(classId)
    );

    setForm((prev) => ({
      ...prev,
      classId: selectedClass?._id || "",
      className: selectedClass?.name || "",
      section: "",
    }));
  };

  // =========================
  // SUBMIT
  // =========================
  const submit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const data = await admission({
        ...form,
        admissionFee: Number(form.admissionFee || 0),
      });

      setMessage(
        `Admission completed. Admission No: ${
          data.student?.admissionNo || "-"
        }`
      );

      setForm(initialForm);
    } catch (err) {
      console.error("Admission error:", err);

      setError(
        err?.response?.data?.message ||
          "Admission failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // SELECTED CLASS
  // =========================
  const selectedClass = classes.find(
    (item) => String(item._id) === String(form.classId)
  );

  const sections = selectedClass?.sections || [];

  return (
    <div className="admission-page">
      <div className="admission-head">
        <span>ACCOUNTANT</span>

        <h1>Student Admission</h1>

        <p>
          Complete admission for a registered student.
        </p>
      </div>

      {error && (
        <div className="admission-alert error">
          {error}
        </div>
      )}

      {message && (
        <div className="admission-alert success">
          {message}
        </div>
      )}

      <form
        className="admission-card"
        onSubmit={submit}
      >
        <h2>Admission Details</h2>

        <div className="admission-grid">

          {/* STUDENT ID */}
          <label>
            Student ID *

            <input
              name="studentId"
              value={form.studentId}
              onChange={change}
              required
              placeholder="MongoDB Student ID"
            />
          </label>

          {/* CLASS */}
          <label>
            Class *

            <select
              name="classId"
              value={form.classId}
              onChange={classChange}
              required
              disabled={loadingClasses}
            >
              <option value="">
                {loadingClasses
                  ? "Loading classes..."
                  : "Select Class"}
              </option>

              {classes.map((item) => (
                <option
                  key={item._id}
                  value={item._id}
                >
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          {/* SECTION */}
          <label>
            Section *

            <select
              name="section"
              value={form.section}
              onChange={change}
              required
              disabled={!form.classId}
            >
              <option value="">
                {form.classId
                  ? "Select Section"
                  : "Select Class First"}
              </option>

              {sections.map((section, index) => {
                /*
                  Supports both:
                  "A"
                  and
                  { name: "A" }
                */
                const sectionValue =
                  typeof section === "string"
                    ? section
                    : section?.name || section?.section || "";

                if (!sectionValue) return null;

                return (
                  <option
                    key={`${sectionValue}-${index}`}
                    value={sectionValue}
                  >
                    {sectionValue}
                  </option>
                );
              })}
            </select>
          </label>

          {/* SESSION */}
          <label>
            Session *

            <input
              name="session"
              value={form.session}
              onChange={change}
              required
              placeholder="2026-27"
            />
          </label>

          {/* ADMISSION FEE */}
          <label>
            Admission Fee

            <input
              type="number"
              min="0"
              name="admissionFee"
              value={form.admissionFee}
              onChange={change}
              placeholder="0"
            />
          </label>

          {/* PAYMENT METHOD */}
          <label>
            Payment Method

            <select
              name="paymentMethod"
              value={form.paymentMethod}
              onChange={change}
            >
              <option value="CASH">
                Cash
              </option>

              <option value="UPI">
                UPI
              </option>

              <option value="CARD">
                Card
              </option>

              <option value="BANK">
                Bank
              </option>

              <option value="CHEQUE">
                Cheque
              </option>
            </select>
          </label>

        </div>

        {/* SELECTED CLASS INFO */}
        {form.classId && (
          <div className="selected-class-info">
            <strong>Selected Class:</strong>{" "}
            {form.className}

            {form.section && (
              <>
                {" "}
                —{" "}
                <strong>Section:</strong>{" "}
                {form.section}
              </>
            )}
          </div>
        )}

        <button
          className="admission-btn"
          disabled={
            loading ||
            loadingClasses ||
            !form.classId ||
            !form.section
          }
        >
          {loading
            ? "Processing..."
            : "Complete Admission"}
        </button>
      </form>
    </div>
  );
}