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

function Registration() {
  const [form, setForm] = useState(initialForm);

  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  // =========================================
  // LOAD CLASSES FROM DATABASE
  // =========================================

  useEffect(() => {
    const loadClasses = async () => {
      try {
        setLoadingClasses(true);
        setError("");

        const data = await list("accountant/classes");

        console.log("CLASSES FROM DATABASE:", data);

        // Backend response:
        // {
        //   success: true,
        //   classes: [...]
        // }

        const classList = Array.isArray(data?.classes)
          ? data.classes
          : [];

        setClasses(classList);

      } catch (err) {
        console.error("Classes load error:", err);

        setClasses([]);

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

  // =========================================
  // INPUT CHANGE
  // =========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccess(null);
  };

  // =========================================
  // CLASS CHANGE
  // =========================================

  const handleClassChange = (e) => {
    const classId = e.target.value;

    const selected = classes.find(
      (item) => String(item._id) === String(classId)
    );

    setForm((prev) => ({
      ...prev,
      classId,
      className: selected?.name || "",
      section: "",
    }));

    setError("");
    setSuccess(null);
  };

  // =========================================
  // SELECTED CLASS
  // =========================================

  const selectedClass = classes.find(
    (item) =>
      String(item._id) === String(form.classId)
  );

  const sections = selectedClass?.sections || [];

  // =========================================
  // SUBMIT
  // =========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess(null);

    // Basic validation
    if (!form.name.trim()) {
      setError("Student name required hai.");
      return;
    }

    if (!form.dob) {
      setError("Date of birth required hai.");
      return;
    }

    if (!form.email.trim()) {
      setError("Email required hai.");
      return;
    }

    if (!form.classId) {
      setError("Class select karein.");
      return;
    }

    if (!form.section) {
      setError("Section select karein.");
      return;
    }

    if (!form.session.trim()) {
      setError("Session required hai.");
      return;
    }

    if (
      form.registrationFee === "" ||
      Number(form.registrationFee) < 0
    ) {
      setError("Valid registration fee enter karein.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: form.name.trim(),
        fatherName: form.fatherName.trim(),
        motherName: form.motherName.trim(),
        dob: form.dob,
        gender: form.gender,
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),

        classId: form.classId,
        className: form.className,
        section: form.section,

        session: form.session.trim(),

        registrationFee: Number(
          form.registrationFee || 0
        ),

        paymentMethod: form.paymentMethod,
      };

      console.log(
        "REGISTER STUDENT PAYLOAD:",
        payload
      );

      const response = await registerStudent(payload);

      console.log(
        "REGISTER STUDENT RESPONSE:",
        response
      );

      setSuccess(response);

      setForm(initialForm);

    } catch (err) {
      console.error(
        "Student registration error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Student registration failed."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // SUCCESS DATA
  // =========================================

  const result = success?.student || success?.data?.student || success;

  return (
    <div className="registration-page">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="registration-header">
        <div>
          <h1>Student Registration</h1>

          <p>
            New student ko school management
            system me register karein.
          </p>
        </div>
      </div>

      {/* =====================================
          ERROR
      ===================================== */}

      {error && (
        <div className="registration-alert error">
          {error}
        </div>
      )}

      {/* =====================================
          SUCCESS
      ===================================== */}

      {success && (
        <div className="registration-success">

          <div className="success-title">
            <span>✓</span>

            <div>
              <h2>Student Registered Successfully</h2>

              <p>
                Student registration complete ho gaya.
              </p>
            </div>
          </div>

          <div className="success-grid">

            <div className="success-item">
              <span>Student Name</span>
              <strong>
                {result?.name ||
                  success?.student?.name ||
                  "-"}
              </strong>
            </div>

            <div className="success-item">
              <span>Registration No.</span>
              <strong>
                {result?.registrationNo ||
                  success?.registrationNo ||
                  "-"}
              </strong>
            </div>

            <div className="success-item">
              <span>Admission No.</span>
              <strong>
                {result?.admissionNo ||
                  success?.admissionNo ||
                  "-"}
              </strong>
            </div>

            <div className="success-item">
              <span>Class</span>
              <strong>
                {result?.className ||
                  form.className ||
                  "-"}
              </strong>
            </div>

            <div className="success-item">
              <span>Section</span>
              <strong>
                {result?.section ||
                  form.section ||
                  "-"}
              </strong>
            </div>

            <div className="success-item">
              <span>Session</span>
              <strong>
                {result?.session ||
                  form.session ||
                  "-"}
              </strong>
            </div>

            <div className="success-item">
              <span>Status</span>
              <strong>
                {result?.status || "REGISTERED"}
              </strong>
            </div>

            <div className="success-item">
              <span>Registration Fee</span>
              <strong>
                ₹
                {result?.registrationFee ??
                  success?.registrationFee ??
                  0}
              </strong>
            </div>

            <div className="success-item">
              <span>Receipt No.</span>
              <strong>
                {success?.receiptNo ||
                  success?.payment?.receiptNo ||
                  "-"}
              </strong>
            </div>

          </div>

          {/* LOGIN DETAILS */}

          {(success?.login ||
            success?.credentials ||
            success?.email ||
            success?.password) && (
            <div className="login-details">

              <h3>Student Login Details</h3>

              <div className="login-grid">

                <div>
                  <span>Email</span>
                  <strong>
                    {success?.login?.email ||
                      success?.credentials?.email ||
                      success?.email ||
                      "-"}
                  </strong>
                </div>

                <div>
                  <span>Password</span>
                  <strong>
                    {success?.login?.password ||
                      success?.credentials?.password ||
                      success?.password ||
                      "-"}
                  </strong>
                </div>

              </div>

            </div>
          )}

        </div>
      )}

      {/* =====================================
          FORM
      ===================================== */}

      <form
        className="registration-form"
        onSubmit={handleSubmit}
      >

        {/* ===================================
            PERSONAL INFORMATION
        =================================== */}

        <div className="form-section">

          <div className="section-heading">
            <h2>Personal Information</h2>

            <p>
              Student ki basic information enter karein.
            </p>
          </div>

          <div className="form-grid">

            <div className="form-group full">
              <label>
                Student Name
                <span>*</span>
              </label>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter student name"
              />
            </div>

            <div className="form-group">
              <label>Father Name</label>

              <input
                type="text"
                name="fatherName"
                value={form.fatherName}
                onChange={handleChange}
                placeholder="Enter father name"
              />
            </div>

            <div className="form-group">
              <label>Mother Name</label>

              <input
                type="text"
                name="motherName"
                value={form.motherName}
                onChange={handleChange}
                placeholder="Enter mother name"
              />
            </div>

            <div className="form-group">
              <label>
                Date of Birth
                <span>*</span>
              </label>

              <input
                type="date"
                name="dob"
                value={form.dob}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Gender</label>

              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
              >
                <option value="">
                  Select Gender
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
            </div>

            <div className="form-group">
              <label>Phone</label>

              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
              />
            </div>

            <div className="form-group">
              <label>
                Email
                <span>*</span>
              </label>

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter email address"
              />
            </div>

            <div className="form-group full">
              <label>Address</label>

              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Enter complete address"
                rows="3"
              />
            </div>

          </div>

        </div>

        {/* ===================================
            ACADEMIC INFORMATION
        =================================== */}

        <div className="form-section">

          <div className="section-heading">
            <h2>Academic Information</h2>

            <p>
              Student ki class aur session select karein.
            </p>
          </div>

          <div className="form-grid">

            {/* CLASS */}

            <div className="form-group">

              <label>
                Class
                <span>*</span>
              </label>

              <select
                name="classId"
                value={form.classId}
                onChange={handleClassChange}
                disabled={loadingClasses}
              >

                <option value="">
                  {loadingClasses
                    ? "Classes loading..."
                    : classes.length === 0
                    ? "No classes found"
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

              {!loadingClasses &&
                classes.length === 0 && (
                  <small className="field-error">
                    Database se koi active class nahi mili.
                  </small>
                )}

            </div>

            {/* SECTION */}

            <div className="form-group">

              <label>
                Section
                <span>*</span>
              </label>

              <select
                name="section"
                value={form.section}
                onChange={handleChange}
                disabled={
                  !form.classId ||
                  sections.length === 0
                }
              >

                <option value="">
                  {!form.classId
                    ? "Pehle class select karein"
                    : sections.length === 0
                    ? "No section found"
                    : "Select Section"}
                </option>

                {sections.map(
                  (section, index) => {

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
                  }
                )}

              </select>

              {form.classId &&
                sections.length === 0 && (
                  <small className="field-error">
                    Is class ke liye database me
                    section available nahi hai.
                  </small>
                )}

            </div>

            {/* SESSION */}

            <div className="form-group">

              <label>
                Session
                <span>*</span>
              </label>

              <input
                type="text"
                name="session"
                value={form.session}
                onChange={handleChange}
                placeholder="2026-2027"
              />

            </div>

          </div>

        </div>

        {/* ===================================
            REGISTRATION PAYMENT
        =================================== */}

        <div className="form-section">

          <div className="section-heading">
            <h2>Registration Payment</h2>

            <p>
              Registration fee ki information enter karein.
            </p>
          </div>

          <div className="form-grid">

            <div className="form-group">

              <label>
                Registration Fee
                <span>*</span>
              </label>

              <input
                type="number"
                name="registrationFee"
                value={form.registrationFee}
                onChange={handleChange}
                placeholder="Enter amount"
                min="0"
              />

            </div>

            <div className="form-group">

              <label>Payment Method</label>

              <select
                name="paymentMethod"
                value={form.paymentMethod}
                onChange={handleChange}
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
                  Bank Transfer
                </option>

                <option value="CHEQUE">
                  Cheque
                </option>

              </select>

            </div>

          </div>

        </div>

        {/* ===================================
            SUBMIT
        =================================== */}

        <div className="form-actions">

          <button
            type="button"
            className="secondary-btn"
            onClick={() => {
              setForm(initialForm);
              setError("");
              setSuccess(null);
            }}
            disabled={loading}
          >
            Reset
          </button>

          <button
            type="submit"
            className="primary-btn"
            disabled={
              loading ||
              loadingClasses ||
              !form.name ||
              !form.dob ||
              !form.email ||
              !form.classId ||
              !form.section ||
              !form.session ||
              form.registrationFee === ""
            }
          >

            {loading
              ? "Registering..."
              : "Register Student"}

          </button>

        </div>

      </form>

    </div>
  );
}

export default Registration;