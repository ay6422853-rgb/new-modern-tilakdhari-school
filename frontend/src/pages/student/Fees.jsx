
import { useEffect, useMemo, useState } from "react";
import api from "../../api";
import "./StudentCommon.css";

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
      console.error(err);
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
      result[type] = (result[type] || 0) + Number(payment.amount || 0);
    });

    return result;
  }, [payments]);

  return (
    <div className="student-page">
      <div className="student-page-header">
        <div>
          <span className="student-eyebrow">FINANCE</span>
          <h1>Fees & Payments</h1>
          <p>View your school fee payment history.</p>
        </div>

        <button className="student-refresh-btn" onClick={loadFees}>
          ↻ Refresh
        </button>
      </div>

      <div className="student-stat-grid">
        <div className="student-stat-card">
          <div className="student-stat-icon">₹</div>
          <div>
            <span>Total Paid</span>
            <strong>₹{total.toLocaleString()}</strong>
          </div>
        </div>

        <div className="student-stat-card">
          <div className="student-stat-icon">#</div>
          <div>
            <span>Transactions</span>
            <strong>{payments.length}</strong>
          </div>
        </div>

        <div className="student-stat-card">
          <div className="student-stat-icon">T</div>
          <div>
            <span>Tuition</span>
            <strong>
              ₹{(types.TUITION || 0).toLocaleString()}
            </strong>
          </div>
        </div>

        <div className="student-stat-card">
          <div className="student-stat-icon">A</div>
          <div>
            <span>Admission</span>
            <strong>
              ₹{(types.ADMISSION || 0).toLocaleString()}
            </strong>
          </div>
        </div>
      </div>

      <section className="student-card">
        <div className="student-card-header">
          <div>
            <h3>Payment History</h3>
            <p>All recorded fee payments</p>
          </div>
        </div>

        {loading ? (
          <div className="student-loading">Loading payments...</div>
        ) : payments.length === 0 ? (
          <div className="student-empty">
            No payment records found.
          </div>
        ) : (
          <div className="student-table-wrap">
            <table className="student-table">
              <thead>
                <tr>
                  <th>Receipt No.</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Date</th>
                  <th>Description</th>
                </tr>
              </thead>

              <tbody>
                {payments.map((payment) => (
                  <tr key={payment._id}>
                    <td>
                      <strong>{payment.receiptNo || "—"}</strong>
                    </td>

                    <td>
                      <span className="student-type-badge">
                        {payment.type || "OTHER"}
                      </span>
                    </td>

                    <td>
                      <strong>
                        ₹{Number(payment.amount || 0).toLocaleString()}
                      </strong>
                    </td>

                    <td>{payment.method || "—"}</td>

                    <td>
                      {payment.date
                        ? new Date(payment.date).toLocaleDateString(
                            "en-IN"
                          )
                        : "—"}
                    </td>

                    <td>{payment.description || "—"}</td>
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
