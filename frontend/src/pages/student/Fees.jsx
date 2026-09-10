import { useEffect, useMemo, useState } from "react";
import api from "../../api";
import "./Fees.css";

function Fees() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFees();
  }, []);

  const loadFees = async () => {
    try {
      const res = await api.get("/student/fees");
      setPayments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fee loading error:", err);
    } finally {
      setLoading(false);
    }
  };

  const total = useMemo(
    () =>
      payments.reduce(
        (sum, payment) => sum + Number(payment.amount || 0),
        0
      ),
    [payments]
  );

  const types = useMemo(() => {
    const result = {};

    payments.forEach((payment) => {
      const type = payment.type || "OTHER";

      result[type] =
        (result[type] || 0) + Number(payment.amount || 0);
    });

    return result;
  }, [payments]);

  /* =====================================================
     DOWNLOAD RECEIPT
  ===================================================== */

  const downloadReceipt = (payment) => {
    const receiptWindow = window.open("", "_blank");

    if (!receiptWindow) {
      alert("Please allow pop-ups to download the receipt.");
      return;
    }

    const amount = Number(payment.amount || 0);

    const date = payment.date
      ? new Date(payment.date).toLocaleDateString("en-IN")
      : "—";

    const student = payment.student || {};

    const escapeHtml = (value) => {
      return String(value ?? "—")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    receiptWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>

        <title>
          Fee Receipt - ${escapeHtml(payment.receiptNo || "")}
        </title>

        <style>

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 30px;

            background: #f3f4f6;

            font-family:
              Arial,
              Helvetica,
              sans-serif;

            color: #111827;
          }

          .receipt {
            width: 800px;
            max-width: 100%;

            margin: 0 auto;

            background: #ffffff;

            border: 1px solid #d1d5db;

            padding: 35px;
          }

          /* SCHOOL HEADER */

          .school-header {
            text-align: center;

            border-bottom: 2px solid #111827;

            padding-bottom: 18px;

            margin-bottom: 22px;
          }

          .school-header h1 {
            margin: 0;

            font-size: 27px;

            color: #111827;

            text-transform: uppercase;
          }

          .school-header p {
            margin: 6px 0 0;

            font-size: 13px;

            color: #4b5563;
          }

          /* RECEIPT TITLE */

          .receipt-title {
            text-align: center;

            margin-bottom: 22px;
          }

          .receipt-title h2 {
            display: inline-block;

            margin: 0;

            padding: 7px 25px;

            border: 1px solid #111827;

            font-size: 17px;

            text-transform: uppercase;
          }

          /* RECEIPT META */

          .receipt-meta {
            display: grid;

            grid-template-columns:
              repeat(2, 1fr);

            gap: 15px;

            margin-bottom: 20px;
          }

          .meta-box {
            border: 1px solid #d1d5db;

            padding: 12px;
          }

          .meta-box strong {
            display: block;

            margin-bottom: 5px;

            color: #6b7280;

            font-size: 10px;

            text-transform: uppercase;
          }

          .meta-box span {
            font-size: 14px;

            font-weight: 700;
          }

          /* STUDENT DETAILS */

          .section-title {
            margin: 20px 0 10px;

            padding-bottom: 6px;

            border-bottom: 1px solid #d1d5db;

            font-size: 14px;

            font-weight: 700;

            text-transform: uppercase;

            color: #111827;
          }

          .student-details {
            display: grid;

            grid-template-columns:
              repeat(2, 1fr);

            border: 1px solid #d1d5db;
          }

          .student-detail {
            padding: 10px 12px;

            border-right: 1px solid #d1d5db;

            border-bottom: 1px solid #d1d5db;
          }

          .student-detail:nth-child(even) {
            border-right: 0;
          }

          .student-detail strong {
            display: block;

            margin-bottom: 4px;

            color: #6b7280;

            font-size: 10px;

            text-transform: uppercase;
          }

          .student-detail span {
            font-size: 13px;

            font-weight: 600;

            color: #111827;
          }

          /* PAYMENT TABLE */

          table {
            width: 100%;

            border-collapse: collapse;

            margin-top: 15px;
          }

          th,
          td {
            border: 1px solid #d1d5db;

            padding: 12px;

            text-align: left;

            font-size: 13px;
          }

          th {
            background: #f3f4f6;

            font-weight: 700;
          }

          .amount {
            text-align: right;

            font-weight: 700;
          }

          .total-row td {
            font-size: 15px;

            font-weight: 700;

            background: #f9fafb;
          }

          /* PAYMENT INFO */

          .payment-info {
            margin-top: 20px;

            border: 1px solid #d1d5db;

            padding: 14px;
          }

          .payment-info p {
            margin: 5px 0;

            font-size: 13px;
          }

          /* FOOTER */

          .footer {
            margin-top: 55px;

            display: flex;

            justify-content: space-between;

            align-items: flex-end;

            font-size: 12px;
          }

          .signature {
            width: 180px;

            text-align: center;

            border-top: 1px solid #111827;

            padding-top: 7px;
          }

          /* PRINT BUTTON */

          .print-button {
            display: block;

            margin: 0 auto 20px;

            padding: 10px 25px;

            border: 0;

            border-radius: 6px;

            background: #111827;

            color: white;

            cursor: pointer;

            font-size: 14px;
          }

          /* PRINT */

          @media print {

            body {
              padding: 0;

              background: #ffffff;
            }

            .receipt {
              width: 100%;

              border: 0;

              padding: 20px;
            }

            .print-button {
              display: none;
            }

          }

        </style>

      </head>

      <body>

        <button
          class="print-button"
          onclick="window.print()"
        >
          Download / Save as PDF
        </button>

        <div class="receipt">

          <!-- SCHOOL -->

          <div class="school-header">

            <h1>
              Vidyapeeth Martinganj
            </h1>

            <p>
              School Management System
            </p>

          </div>

          <!-- TITLE -->

          <div class="receipt-title">

            <h2>
              Fee Receipt
            </h2>

          </div>

          <!-- RECEIPT INFORMATION -->

          <div class="receipt-meta">

            <div class="meta-box">

              <strong>
                Receipt No.
              </strong>

              <span>
                ${escapeHtml(payment.receiptNo || "—")}
              </span>

            </div>

            <div class="meta-box">

              <strong>
                Payment Date
              </strong>

              <span>
                ${escapeHtml(date)}
              </span>

            </div>

          </div>

          <!-- STUDENT DETAILS -->

          <div class="section-title">
            Student Details
          </div>

          <div class="student-details">

            <div class="student-detail">

              <strong>
                Student Name
              </strong>

              <span>
                ${escapeHtml(student.name)}
              </span>

            </div>

            <div class="student-detail">

              <strong>
                Student ID
              </strong>

              <span>
                ${escapeHtml(student.studentId)}
              </span>

            </div>

            <div class="student-detail">

              <strong>
                Admission No.
              </strong>

              <span>
                ${escapeHtml(student.admissionNo)}
              </span>

            </div>

            <div class="student-detail">

              <strong>
                Registration No.
              </strong>

              <span>
                ${escapeHtml(student.registrationNo)}
              </span>

            </div>

            <div class="student-detail">

              <strong>
                Father's Name
              </strong>

              <span>
                ${escapeHtml(student.fatherName)}
              </span>

            </div>

            <div class="student-detail">

              <strong>
                Mother's Name
              </strong>

              <span>
                ${escapeHtml(student.motherName)}
              </span>

            </div>

            <div class="student-detail">

              <strong>
                Class
              </strong>

              <span>
                ${escapeHtml(student.className)}
              </span>

            </div>

            <div class="student-detail">

              <strong>
                Section
              </strong>

              <span>
                ${escapeHtml(student.section)}
              </span>

            </div>

            <div class="student-detail">

              <strong>
                Roll No.
              </strong>

              <span>
                ${escapeHtml(student.rollNo)}
              </span>

            </div>

            <div class="student-detail">

              <strong>
                Session
              </strong>

              <span>
                ${escapeHtml(student.session)}
              </span>

            </div>

          </div>

          <!-- PAYMENT DETAILS -->

          <div class="section-title">
            Payment Details
          </div>

          <table>

            <thead>

              <tr>

                <th>
                  Description
                </th>

                <th>
                  Payment Type
                </th>

                <th>
                  Payment Method
                </th>

                <th class="amount">
                  Amount
                </th>

              </tr>

            </thead>

            <tbody>

              <tr>

                <td>
                  ${escapeHtml(
                    payment.description ||
                    "School Fee Payment"
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    payment.type || "OTHER"
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    payment.method || "—"
                  )}
                </td>

                <td class="amount">
                  ₹${amount.toLocaleString("en-IN")}
                </td>

              </tr>

              <tr class="total-row">

                <td colspan="3">
                  Total Paid
                </td>

                <td class="amount">
                  ₹${amount.toLocaleString("en-IN")}
                </td>

              </tr>

            </tbody>

          </table>

          <!-- PAYMENT STATUS -->

          <div class="payment-info">

            <p>
              <strong>
                Payment Status:
              </strong>

              PAID
            </p>

            <p>
              <strong>
                Amount:
              </strong>

              ₹${amount.toLocaleString("en-IN")}
            </p>

          </div>

          <!-- FOOTER -->

          <div class="footer">

            <div>
              Thank you for your payment.
            </div>

            <div class="signature">
              Authorized Signature
            </div>

          </div>

        </div>

        <script>

          window.onload = function() {

            setTimeout(function() {

              window.print();

            }, 500);

          };

        </script>

      </body>

      </html>
    `);

    receiptWindow.document.close();
  };

  return (
    <div className="fees-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="fees-page-header">

        <div>
          <span className="fees-eyebrow">
            FINANCE
          </span>

          <h1>
            Fees & Payments
          </h1>

          <p>
            View your school fee payment history.
          </p>
        </div>

        <button
          type="button"
          className="fees-refresh-btn"
          onClick={loadFees}
        >
          ↻ Refresh
        </button>

      </div>

      {/* =================================================
          STATISTICS
      ================================================= */}

      <div className="fees-stat-grid">

        <div className="fees-stat-card">

          <div className="fees-stat-icon">
            ₹
          </div>

          <div>
            <span>Total Paid</span>

            <strong>
              ₹{total.toLocaleString("en-IN")}
            </strong>
          </div>

        </div>

        <div className="fees-stat-card">

          <div className="fees-stat-icon">
            #
          </div>

          <div>
            <span>Transactions</span>

            <strong>
              {payments.length}
            </strong>
          </div>

        </div>

        <div className="fees-stat-card">

          <div className="fees-stat-icon">
            T
          </div>

          <div>
            <span>Tuition</span>

            <strong>
              ₹{(types.TUITION || 0).toLocaleString("en-IN")}
            </strong>
          </div>

        </div>

        <div className="fees-stat-card">

          <div className="fees-stat-icon">
            A
          </div>

          <div>
            <span>Admission</span>

            <strong>
              ₹{(types.ADMISSION || 0).toLocaleString("en-IN")}
            </strong>
          </div>

        </div>

      </div>

      {/* =================================================
          PAYMENT HISTORY
      ================================================= */}

      <section className="fees-card">

        <div className="fees-card-header">

          <div>
            <h3>
              Payment History
            </h3>

            <p>
              All recorded fee payments
            </p>
          </div>

        </div>

        {loading ? (

          <div className="fees-loading">
            Loading payments...
          </div>

        ) : payments.length === 0 ? (

          <div className="fees-empty">
            No payment records found.
          </div>

        ) : (

          <div className="fees-table-wrap">

            <table className="fees-table">

              <thead>

                <tr>
                  <th>Receipt No.</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Receipt</th>
                </tr>

              </thead>

              <tbody>

                {payments.map((payment) => (

                  <tr key={payment._id}>

                    <td>
                      <strong>
                        {payment.receiptNo || "—"}
                      </strong>
                    </td>

                    <td>
                      <span className="fees-type-badge">
                        {payment.type || "OTHER"}
                      </span>
                    </td>

                    <td>
                      <strong>
                        ₹
                        {Number(
                          payment.amount || 0
                        ).toLocaleString("en-IN")}
                      </strong>
                    </td>

                    <td>
                      {payment.method || "—"}
                    </td>

                    <td>
                      {payment.date
                        ? new Date(
                            payment.date
                          ).toLocaleDateString("en-IN")
                        : "—"}
                    </td>

                    <td>
                      {payment.description || "—"}
                    </td>

                    <td>

                      <button
                        type="button"
                        className="fees-receipt-btn"
                        onClick={() =>
                          downloadReceipt(payment)
                        }
                      >
                        ↓ Receipt
                      </button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </section>

    </div>
  );
}

export default Fees;