
import React, { useEffect, useState } from "react";
import { registerStudent, list } from "../../api";
import "./Registration.css";

const initialForm = {
  name: "",
  fatherName: "",
  motherName: "",
  dob: "",
  gender: "",
  phone: "",
  email: "",
  address: "",
  classId: "",
  className: "",
  section: "",
  session: "2026-2027",
  registrationFee: "",
  paymentMethod: "CASH",
};

export default function Registration() {
  const [form, setForm] = useState(initialForm);

  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // =========================
  // LOAD CLASSES
  // =========================
  useEffect(() => {
    const loadClasses = async () => {
      try {
        setLoadingClasses(true);
        setError("");

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
  // REGISTRATION = FINAL ADMISSION
  // =========================
  const submit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setResult(null);

    try {
      if (!form.name.trim()) {
        throw new Error("Student name is required.");
      }

      if (!form.classId) {
        throw new Error("Please select a class.");
      }

      if (!form.section) {
        throw new Error("Please select a section.");
      }

      if (!form.session.trim()) {
        throw new Error("Please enter session.");
      }

      const fee = Number(form.registrationFee || 0);

      if (!Number.isFinite(fee) || fee < 0) {
        throw new Error("Please enter a valid registration fee.");
      }

      const payload = {
        name: form.name.trim(),
        fatherName: form.fatherName.trim(),
        motherName: form.motherName.trim(),
        dob: form.dob || null,
        gender: form.gender,
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),

        classId: form.classId,
        className: form.className,
        section: form.section,
        session: form.session.trim(),

        registrationFee: fee,
        paymentMethod: form.paymentMethod,
      };

      const data = await registerStudent(payload);

      setResult(data);

      setForm(initialForm);
    } catch (err) {
      console.error("Registration error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Registration failed."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // SELECTED CLASS
  // =========================
  const selectedClass = classes.find(
    (item) =>
      String(item._id) === String(form.classId)
  );

  const sections = selectedClass?.sections || [];

  // =========================
  // SUCCESS STUDENT
  // =========================
  const registeredStudent = result?.student;

  const receipt = result?.receipt;

  return (
    <div className="acc-page">

      {/* ================= HEADER ================= */}
      <div className="acc-page-head">
        <div>
          <span>ACCOUNTANT</span>

          <h1>Student Registration & Admission</h1>

          <p>
            Register the student, collect the registration/admission
            fee and activate the student in one step.
          </p>
        </div>
      </div>

      {/* ================= ERROR ================= */}
      {error && (
        <div className="acc-alert error">
          {error}
        </div>
      )}

      {/* ================= SUCCESS ================= */}
      {result && registeredStudent && (
        <div className="acc-alert success">

          <strong>
            Student Registration & Admission completed successfully.
          </strong>

          <div style={{ marginTop: "12px" }}>
            Registration No:{" "}
            <b>
              {registeredStudent.registrationNo || "-"}
            </b>
          </div>

          <div>
            Admission No:{" "}
            <b>
              {registeredStudent.admissionNo || "-"}
            </b>
          </div>

          <div>
            Student:{" "}
            <b>
              {registeredStudent.name || "-"}
            </b>
          </div>

          <div>
            Class:{" "}
            <b>
              {registeredStudent.className || "-"}
            </b>
            {" — "}
            Section:{" "}
            <b>
              {registeredStudent.section || "-"}
            </b>
          </div>

          <div>
            Session:{" "}
            <b>
              {registeredStudent.session || "-"}
            </b>
          </div>

          <div>
            Status:{" "}
            <b>
              {registeredStudent.status || "ACTIVE"}
            </b>
          </div>

          <div>
            Registration / Admission Fee:{" "}
            <b>
              ₹
              {Number(
                registeredStudent.registrationFee || 0
              ).toLocaleString("en-IN")}
            </b>
          </div>

          {receipt?.receiptNo && (
            <div>
              Receipt No:{" "}
              <b>
                {receipt.receiptNo}
              </b>
            </div>
          )}

          {receipt?.amount !== undefined && (
            <div>
              Amount Collected:{" "}
              <b>
                ₹
                {Number(
                  receipt.amount || 0
                ).toLocaleString("en-IN")}
              </b>
            </div>
          )}

          <div style={{ marginTop: "8px" }}>
            <b>
              Student is now ACTIVE and ready for fee collection.
            </b>
          </div>

        </div>
      )}

      {/* ================= FORM ================= */}
      <form
        className="acc-form-card"
        onSubmit={submit}
      >

        {/* ================= STUDENT INFORMATION ================= */}
        <div className="section-title">
          Student Information
        </div>

        <div className="acc-grid">

          {/* STUDENT NAME */}
          <label>
            Student Name *

            <input
              name="name"
              value={form.name}
              onChange={change}
              required
              placeholder="Enter student name"
            />
          </label>

          {/* FATHER NAME */}
          <label>
            Father's Name

            <input
              name="fatherName"
              value={form.fatherName}
              onChange={change}
              placeholder="Father's name"
            />
          </label>

          {/* MOTHER NAME */}
          <label>
            Mother's Name

            <input
              name="motherName"
              value={form.motherName}
              onChange={change}
              placeholder="Mother's name"
            />
          </label>

          {/* DOB */}
          <label>
            Date of Birth

            <input
              type="date"
              name="dob"
              value={form.dob}
              onChange={change}
            />
          </label>

          {/* GENDER */}
          <label>
            Gender

            <select
              name="gender"
              value={form.gender}
              onChange={change}
            >
              <option value="">
                Select gender
              </option>

              <option value="MALE">
                Male
              </option>

              <option value="FEMALE">
                Female
              </option>

              <option value="OTHER">
                Other
              </option>
            </select>
          </label>

          {/* PHONE */}
          <label>
            Phone

            <input
              name="phone"
              value={form.phone}
              onChange={change}
              placeholder="Mobile number"
            />
          </label>

          {/* EMAIL */}
          <label>
            Email

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={change}
              placeholder="Email address"
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
                const sectionValue =
                  typeof section === "string"
                    ? section
                    : section?.name ||
                      section?.section ||
                      "";

                if (!sectionValue) {
                  return null;
                }

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
              placeholder="2026-2027"
            />
          </label>

          {/* ADDRESS */}
          <label className="full">
            Address

            <textarea
              name="address"
              value={form.address}
              onChange={change}
              placeholder="Student address"
            />
          </label>

        </div>

        {/* ================= PAYMENT ================= */}
        <div className="section-title payment-title">
          Registration / Admission Fee
        </div>

        <div className="acc-grid fee-grid">

          {/* FEE */}
          <label>
            Registration / Admission Fee

            <input
              type="number"
              min="0"
              step="0.01"
              name="registrationFee"
              value={form.registrationFee}
              onChange={change}
              placeholder="0"
            />

            <small>
              This fee is collected during registration.
              No separate admission step is required.
            </small>
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

        {/* ================= SELECTED CLASS ================= */}
        {form.classId && (
          <div className="selected-class-info">

            <strong>Class:</strong>{" "}
            {form.className}

            {form.section && (
              <>
                {" | "}
                <strong>Section:</strong>{" "}
                {form.section}
              </>
            )}

            {form.session && (
              <>
                {" | "}
                <strong>Session:</strong>{" "}
                {form.session}
              </>
            )}

          </div>
        )}

        {/* ================= FINAL INFO ================= */}
        <div className="registration-note">
          <strong>Note:</strong>{" "}
          Completing this form will:

          <ul>
            <li>Create the student registration.</li>
            <li>Generate Registration No. and Admission No.</li>
            <li>Collect the registration/admission fee.</li>
            <li>Generate the payment receipt.</li>
            <li>Make the student <b>ACTIVE</b>.</li>
            <li>No separate Admission process is required.</li>
          </ul>
        </div>

        {/* ================= SUBMIT ================= */}
        <button
          type="submit"
          className="primary-btn"
          disabled={
            loading ||
            loadingClasses ||
            !form.name.trim() ||
            !form.classId ||
            !form.section ||
            !form.session.trim()
          }
        >
          {loading
            ? "Registering & Activating..."
            : "Register & Complete Admission"}
        </button>

      </form>
    </div>
  );
}
