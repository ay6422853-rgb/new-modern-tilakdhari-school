
import React, { useEffect, useMemo, useState } from "react";
import {
  collectPayment,
  feeStudents,
  list,
} from "../../api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./Fees.css";

// ======================================================
// HELPERS
// ======================================================

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const getToday = () => {
  const d = new Date();

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getCurrentSession = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  // April-March academic session
  if (month >= 4) {
    return `${year}-${year + 1}`;
  }

  return `${year - 1}-${year}`;
};

const money = (value) => {
  const number = Number(value || 0);

  return `₹${number.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

const getArray = (response, keys = []) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (!response || typeof response !== "object") {
    return [];
  }

  for (const key of keys) {
    if (Array.isArray(response[key])) {
      return response[key];
    }
  }

  if (Array.isArray(response.data)) {
    return response.data;
  }

  if (response.data && typeof response.data === "object") {
    for (const key of keys) {
      if (Array.isArray(response.data[key])) {
        return response.data[key];
      }
    }
  }

  return [];
};

const getStudentName = (student) => {
  if (!student) return "-";

  if (student.name) return student.name;

  if (student.user?.name) return student.user.name;

  if (student.userId?.name) return student.userId.name;

  return "-";
};

const getAdmissionNo = (student) => {
  if (!student) return "-";

  return (
    student.admissionNo ||
    student.admissionNumber ||
    student.registrationNo ||
    student.studentId ||
    "-"
  );
};

const getRollNo = (student) => {
  if (!student) return "-";

  return student.rollNo || student.rollNumber || "-";
};

const getClassName = (student) => {
  if (!student) return "-";

  if (typeof student.className === "string") {
    return student.className;
  }

  if (student.classId?.name) {
    return student.classId.name;
  }

  if (student.classRoom?.name) {
    return student.classRoom.name;
  }

  if (student.class?.name) {
    return student.class.name;
  }

  return "-";
};

const getSectionName = (student) => {
  if (!student) return "-";

  if (typeof student.section === "string") {
    return student.section;
  }

  if (student.section?.name) {
    return student.section.name;
  }

  return "-";
};

const getFee = (student) => {
  return Number(
    student?.fee ??
      student?.totalFee ??
      student?.applicableFee ??
      student?.feeAmount ??
      0
  );
};

const getPaid = (student) => {
  return Number(
    student?.paid ??
      student?.paidAmount ??
      student?.totalPaid ??
      0
  );
};

const getDue = (student) => {
  if (
    student?.due !== undefined &&
    student?.due !== null
  ) {
    return Number(student.due);
  }

  if (
    student?.dueAmount !== undefined &&
    student?.dueAmount !== null
  ) {
    return Number(student.dueAmount);
  }

  return Math.max(0, getFee(student) - getPaid(student));
};

const getStatus = (student) => {
  const backendStatus =
    student?.status ||
    student?.feeStatus ||
    student?.paymentStatus;

  if (backendStatus) {
    return String(backendStatus).toUpperCase();
  }

  const fee = getFee(student);
  const paid = getPaid(student);
  const due = getDue(student);

  if (fee <= 0) {
    return "NO_FEE_STRUCTURE";
  }

  if (due <= 0 && paid > 0) {
    return "PAID";
  }

  if (paid > 0 && due > 0) {
    return "PARTIAL";
  }

  return "DUE";
};

// ======================================================
// COMPONENT
// ======================================================

function Fees() {
  const currentDate = new Date();

  // ----------------------------------------------------
  // STATES
  // ----------------------------------------------------

  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);

  const [filters, setFilters] = useState({
    classId: "",
    section: "",
    session: getCurrentSession(),
    year: currentDate.getFullYear(),
    month: currentDate.getMonth() + 1,
    status: "ALL",
    search: "",
  });

  const [loadingClasses, setLoadingClasses] =
    useState(true);

  const [loadingStudents, setLoadingStudents] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedStudent, setSelectedStudent] =
    useState(null);

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    method: "CASH",
    date: getToday(),
    description: "",
  });

  const [paymentLoading, setPaymentLoading] =
    useState(false);

  // ----------------------------------------------------
  // LOAD CLASSES
  // ----------------------------------------------------

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoadingClasses(true);
      setError("");

      const response = await list(
        "accountant/classes"
      );

      const data = getArray(response, [
        "classes",
        "items",
        "results",
      ]);

      setClasses(data);

      // If there is only one class, automatically select it.
      if (data.length === 1) {
        const onlyClass = data[0];

        const id =
          onlyClass._id ||
          onlyClass.id ||
          onlyClass.classId ||
          "";

        if (id) {
          setFilters((prev) => ({
            ...prev,
            classId: id,
          }));
        }
      }
    } catch (err) {
      console.error(
        "Failed to load classes:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Classes load nahi ho payi."
      );
    } finally {
      setLoadingClasses(false);
    }
  };

  // ----------------------------------------------------
  // LOAD STUDENTS
  // ----------------------------------------------------

  useEffect(() => {
    loadFeeStudents();
  }, [
    filters.classId,
    filters.section,
    filters.session,
    filters.year,
    filters.month,
    filters.status,
  ]);

  const loadFeeStudents = async () => {
    try {
      setLoadingStudents(true);
      setError("");

      const params = {
        session: filters.session,
        year: filters.year,
        month: filters.month,
      };

      // Only send classId when selected.
      if (filters.classId) {
        params.classId = filters.classId;
      }

      if (filters.section) {
        params.section = filters.section;
      }

      // Do not send ALL to backend.
      if (
        filters.status &&
        filters.status !== "ALL"
      ) {
        params.status = filters.status;
      }

      if (filters.search.trim()) {
        params.search = filters.search.trim();
      }

      console.log(
        "Loading fee students with:",
        params
      );

      const response = await feeStudents(params);

      console.log(
        "Fee students response:",
        response
      );

      const data = getArray(response, [
        "students",
        "feeStudents",
        "items",
        "results",
      ]);

      setStudents(data);
    } catch (err) {
      console.error(
        "Failed to load fee students:",
        err
      );

      setStudents([]);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Students ki list load nahi ho payi."
      );
    } finally {
      setLoadingStudents(false);
    }
  };

  // ----------------------------------------------------
  // SEARCH
  // ----------------------------------------------------

  const filteredStudents = useMemo(() => {
    const search =
      filters.search.trim().toLowerCase();

    if (!search) {
      return students;
    }

    return students.filter((student) => {
      const name = getStudentName(student)
        .toLowerCase();

      const admissionNo =
        String(getAdmissionNo(student))
          .toLowerCase();

      const rollNo =
        String(getRollNo(student))
          .toLowerCase();

      return (
        name.includes(search) ||
        admissionNo.includes(search) ||
        rollNo.includes(search)
      );
    });
  }, [students, filters.search]);

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------

  const summary = useMemo(() => {
    let totalFee = 0;
    let totalPaid = 0;
    let totalDue = 0;

    let paidCount = 0;
    let partialCount = 0;
    let dueCount = 0;
    let noFeeCount = 0;

    filteredStudents.forEach((student) => {
      const fee = getFee(student);
      const paid = getPaid(student);
      const due = getDue(student);
      const status = getStatus(student);

      totalFee += fee;
      totalPaid += paid;
      totalDue += due;

      if (status === "PAID") {
        paidCount++;
      } else if (status === "PARTIAL") {
        partialCount++;
      } else if (status === "DUE") {
        dueCount++;
      } else if (
        status === "NO_FEE_STRUCTURE"
      ) {
        noFeeCount++;
      }
    });

    return {
      totalFee,
      totalPaid,
      totalDue,
      paidCount,
      partialCount,
      dueCount,
      noFeeCount,
      totalStudents: filteredStudents.length,
    };
  }, [filteredStudents]);

  // ----------------------------------------------------
  // FILTER HANDLERS
  // ----------------------------------------------------

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSearch = (e) => {
    handleFilterChange(
      "search",
      e.target.value
    );
  };

  // ----------------------------------------------------
  // PAYMENT MODAL
  // ----------------------------------------------------

  const openPaymentModal = (student) => {
    setSelectedStudent(student);

    setPaymentForm({
      amount:
        getDue(student) > 0
          ? String(getDue(student))
          : "",
      method: "CASH",
      date: getToday(),
      description: "",
    });

    setError("");
    setSuccess("");
  };

  const closePaymentModal = () => {
    if (paymentLoading) return;

    setSelectedStudent(null);

    setPaymentForm({
      amount: "",
      method: "CASH",
      date: getToday(),
      description: "",
    });
  };

  const handlePaymentChange = (
    field,
    value
  ) => {
    setPaymentForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const submitPayment = async (e) => {
    e.preventDefault();

    if (!selectedStudent) {
      return;
    }

    const amount = Number(
      paymentForm.amount
    );

    const due = getDue(selectedStudent);

    if (!amount || amount <= 0) {
      setError(
        "Payment amount valid hona chahiye."
      );
      return;
    }

    if (amount > due) {
      setError(
        `Payment due amount se zyada nahi ho sakta. Due: ${money(
          due
        )}`
      );
      return;
    }

    try {
      setPaymentLoading(true);
      setError("");
      setSuccess("");

      await collectPayment({
        studentId:
          selectedStudent._id ||
          selectedStudent.id ||
          selectedStudent.studentId,

        type: "TUITION",

        amount,

        method: paymentForm.method,

        date: paymentForm.date,

        description:
          paymentForm.description.trim(),
      });

      setSuccess(
        `Payment successfully collect ho gaya. ${money(
          amount
        )}`
      );

      closePaymentModal();

      await loadFeeStudents();
    } catch (err) {
      console.error(
        "Payment failed:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Payment collect nahi ho paya."
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  // ----------------------------------------------------
  // PDF
  // ----------------------------------------------------

  const downloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(
      "School Fee Report",
      14,
      18
    );

    doc.setFontSize(10);

    doc.text(
      `Session: ${filters.session}`,
      14,
      27
    );

    doc.text(
      `Month: ${
        MONTHS[filters.month - 1]
      } ${filters.year}`,
      14,
      33
    );

    doc.text(
      `Students: ${summary.totalStudents}`,
      14,
      39
    );

    doc.text(
      `Total Fee: ${money(
        summary.totalFee
      )}`,
      14,
      45
    );

    doc.text(
      `Total Paid: ${money(
        summary.totalPaid
      )}`,
      14,
      51
    );

    doc.text(
      `Total Due: ${money(
        summary.totalDue
      )}`,
      14,
      57
    );

    const rows =
      filteredStudents.map(
        (student, index) => [
          index + 1,
          getAdmissionNo(student),
          getStudentName(student),
          getClassName(student),
          getSectionName(student),
          money(getFee(student)),
          money(getPaid(student)),
          money(getDue(student)),
          getStatus(student),
        ]
      );

    autoTable(doc, {
      startY: 64,
      head: [
        [
          "#",
          "Admission No",
          "Student",
          "Class",
          "Section",
          "Fee",
          "Paid",
          "Due",
          "Status",
        ],
      ],
      body: rows,
      styles: {
        fontSize: 8,
      },
      headStyles: {
        fontSize: 8,
      },
    });

    doc.save(
      `fee-report-${filters.session}-${filters.month}-${filters.year}.pdf`
    );
  };

  // ----------------------------------------------------
  // RENDER
  // ----------------------------------------------------

  return (
    <div className="fees-page">

      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="fees-header">
        <div>
          <h1>Fee Management</h1>

          <p>
            Students ki fee, payment aur due
            amount manage karein.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={downloadPDF}
          disabled={
            filteredStudents.length === 0
          }
        >
          Download PDF
        </button>
      </div>

      {/* ==================================================
          SUCCESS / ERROR
      ================================================== */}

      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          {error}

          <button
            type="button"
            onClick={() => setError("")}
          >
            ×
          </button>
        </div>
      )}

      {/* ==================================================
          FILTERS
      ================================================== */}

      <div className="fees-card filters-card">

        <div className="card-title">
          <h2>Fee Filters</h2>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadFeeStudents}
            disabled={loadingStudents}
          >
            {loadingStudents
              ? "Loading..."
              : "Refresh"}
          </button>
        </div>

        <div className="filters-grid">

          {/* CLASS */}

          <div className="form-group">
            <label>Class</label>

            <select
              value={filters.classId}
              onChange={(e) =>
                handleFilterChange(
                  "classId",
                  e.target.value
                )
              }
              disabled={loadingClasses}
            >
              <option value="">
                All Classes
              </option>

              {classes.map((item) => {
                const id =
                  item._id ||
                  item.id ||
                  item.classId;

                const name =
                  item.name ||
                  item.className ||
                  item.title ||
                  `Class ${id}`;

                return (
                  <option
                    key={id}
                    value={id}
                  >
                    {name}
                  </option>
                );
              })}
            </select>
          </div>

          {/* SECTION */}

          <div className="form-group">
            <label>Section</label>

            <input
              type="text"
              placeholder="All sections"
              value={filters.section}
              onChange={(e) =>
                handleFilterChange(
                  "section",
                  e.target.value
                )
              }
            />
          </div>

          {/* SESSION */}

          <div className="form-group">
            <label>Academic Session</label>

            <input
              type="text"
              value={filters.session}
              onChange={(e) =>
                handleFilterChange(
                  "session",
                  e.target.value
                )
              }
              placeholder="2026-2027"
            />
          </div>

          {/* YEAR */}

          <div className="form-group">
            <label>Year</label>

            <input
              type="number"
              value={filters.year}
              onChange={(e) =>
                handleFilterChange(
                  "year",
                  Number(e.target.value)
                )
              }
            />
          </div>

          {/* MONTH */}

          <div className="form-group">
            <label>Month</label>

            <select
              value={filters.month}
              onChange={(e) =>
                handleFilterChange(
                  "month",
                  Number(e.target.value)
                )
              }
            >
              {MONTHS.map(
                (month, index) => (
                  <option
                    key={month}
                    value={index + 1}
                  >
                    {month}
                  </option>
                )
              )}
            </select>
          </div>

          {/* SEARCH */}

          <div className="form-group">
            <label>Search Student</label>

            <input
              type="text"
              placeholder="Name / admission no / roll no"
              value={filters.search}
              onChange={handleSearch}
            />
          </div>

        </div>
      </div>

      {/* ==================================================
          SUMMARY
      ================================================== */}

      <div className="summary-grid">

        <div className="summary-card">
          <span>Total Students</span>
          <strong>
            {summary.totalStudents}
          </strong>
        </div>

        <div className="summary-card">
          <span>Total Fee</span>
          <strong>
            {money(summary.totalFee)}
          </strong>
        </div>

        <div className="summary-card">
          <span>Total Paid</span>
          <strong>
            {money(summary.totalPaid)}
          </strong>
        </div>

        <div className="summary-card">
          <span>Total Due</span>
          <strong>
            {money(summary.totalDue)}
          </strong>
        </div>

      </div>

      {/* ==================================================
          STATUS
      ================================================== */}

      <div className="fees-card status-card">

        <div className="status-tabs">

          {[
            ["ALL", "All"],
            ["PAID", "Paid"],
            ["PARTIAL", "Partial"],
            ["DUE", "Due"],
            [
              "NO_FEE_STRUCTURE",
              "No Fee Structure",
            ],
          ].map(
            ([value, label]) => (
              <button
                key={value}
                type="button"
                className={
                  filters.status === value
                    ? "status-tab active"
                    : "status-tab"
                }
                onClick={() =>
                  handleFilterChange(
                    "status",
                    value
                  )
                }
              >
                {label}
              </button>
            )
          )}

        </div>

      </div>

      {/* ==================================================
          STUDENTS TABLE
      ================================================== */}

      <div className="fees-card students-card">

        <div className="card-title">
          <div>
            <h2>Students Fee List</h2>

            <span className="record-count">
              {filteredStudents.length} students
            </span>
          </div>
        </div>

        {loadingStudents ? (
          <div className="loading-box">
            <div className="spinner"></div>
            <p>
              Students ki fee list load ho rahi
              hai...
            </p>
          </div>
        ) : filteredStudents.length ===
          0 ? (
          <div className="empty-box">
            <h3>
              Students nahi mile
            </h3>

            <p>
              Selected class, session, month
              ya search ko check karein.
            </p>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={loadFeeStudents}
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="fees-table">

              <thead>
                <tr>
                  <th>#</th>
                  <th>Student</th>
                  <th>Admission No</th>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Total Fee</th>
                  <th>Paid</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map(
                  (student, index) => {
                    const fee =
                      getFee(student);

                    const paid =
                      getPaid(student);

                    const due =
                      getDue(student);

                    const status =
                      getStatus(student);

                    return (
                      <tr
                        key={
                          student._id ||
                          student.id ||
                          student.studentId ||
                          index
                        }
                      >

                        <td>
                          {index + 1}
                        </td>

                        <td>
                          <div className="student-name">
                            {getStudentName(
                              student
                            )}
                          </div>
                        </td>

                        <td>
                          {getAdmissionNo(
                            student
                          )}
                        </td>

                        <td>
                          {getClassName(
                            student
                          )}
                        </td>

                        <td>
                          {getSectionName(
                            student
                          )}
                        </td>

                        <td>
                          {money(fee)}
                        </td>

                        <td className="paid-amount">
                          {money(paid)}
                        </td>

                        <td className="due-amount">
                          {money(due)}
                        </td>

                        <td>
                          <span
                            className={`fee-status status-${status.toLowerCase()}`}
                          >
                            {status ===
                            "NO_FEE_STRUCTURE"
                              ? "No Fee"
                              : status}
                          </span>
                        </td>

                        <td>
                          {due > 0 ? (
                            <button
                              type="button"
                              className="btn btn-small btn-primary"
                              onClick={() =>
                                openPaymentModal(
                                  student
                                )
                              }
                            >
                              Collect
                            </button>
                          ) : (
                            <span className="paid-label">
                              Paid
                            </span>
                          )}
                        </td>

                      </tr>
                    );
                  }
                )}
              </tbody>

            </table>
          </div>
        )}

      </div>

      {/* ==================================================
          PAYMENT MODAL
      ================================================== */}

      {selectedStudent && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              closePaymentModal();
            }
          }}
        >

          <div className="payment-modal">

            <div className="modal-header">
              <div>
                <h2>
                  Collect Fee
                </h2>

                <p>
                  {getStudentName(
                    selectedStudent
                  )}
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={
                  closePaymentModal
                }
                disabled={
                  paymentLoading
                }
              >
                ×
              </button>
            </div>

            <div className="payment-summary">

              <div>
                <span>
                  Total Fee
                </span>

                <strong>
                  {money(
                    getFee(
                      selectedStudent
                    )
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Already Paid
                </span>

                <strong>
                  {money(
                    getPaid(
                      selectedStudent
                    )
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Due
                </span>

                <strong>
                  {money(
                    getDue(
                      selectedStudent
                    )
                  )}
                </strong>
              </div>

            </div>

            <form
              onSubmit={submitPayment}
            >

              <div className="form-group">
                <label>
                  Payment Amount
                </label>

                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={
                    paymentForm.amount
                  }
                  onChange={(e) =>
                    handlePaymentChange(
                      "amount",
                      e.target.value
                    )
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Payment Method
                </label>

                <select
                  value={
                    paymentForm.method
                  }
                  onChange={(e) =>
                    handlePaymentChange(
                      "method",
                      e.target.value
                    )
                  }
                >
                  <option value="CASH">
                    CASH
                  </option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  Payment Date
                </label>

                <input
                  type="date"
                  value={
                    paymentForm.date
                  }
                  onChange={(e) =>
                    handlePaymentChange(
                      "date",
                      e.target.value
                    )
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Description
                </label>

                <textarea
                  rows="3"
                  value={
                    paymentForm.description
                  }
                  onChange={(e) =>
                    handlePaymentChange(
                      "description",
                      e.target.value
                    )
                  }
                  placeholder="Optional"
                />
              </div>

              <div className="modal-actions">

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={
                    closePaymentModal
                  }
                  disabled={
                    paymentLoading
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={
                    paymentLoading
                  }
                >
                  {paymentLoading
                    ? "Processing..."
                    : "Collect Payment"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default Fees;
