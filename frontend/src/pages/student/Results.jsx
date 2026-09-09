
import { useEffect, useMemo, useState } from "react";
import api from "../../api";
import "./StudentCommon.css";

function Results() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      const res = await api.get("/student/results");
      setResults(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    const totalMarks = results.reduce(
      (sum, item) => sum + Number(item.marks || 0),
      0
    );

    const totalMax = results.reduce(
      (sum, item) => sum + Number(item.maxMarks || 0),
      0
    );

    return {
      totalMarks,
      totalMax,
      percentage: totalMax
        ? ((totalMarks / totalMax) * 100).toFixed(1)
        : "0.0"
    };
  }, [results]);

  return (
    <div className="student-page">
      <div className="student-page-header">
        <div>
          <span className="student-eyebrow">ACADEMICS</span>
          <h1>Results</h1>
          <p>View your examination marks and grades.</p>
        </div>

        <button className="student-refresh-btn" onClick={loadResults}>
          ↻ Refresh
        </button>
      </div>

      <div className="student-stat-grid">
        <div className="student-stat-card">
          <div className="student-stat-icon">M</div>
          <div>
            <span>Total Marks</span>
            <strong>{summary.totalMarks}</strong>
          </div>
        </div>

        <div className="student-stat-card">
          <div className="student-stat-icon">T</div>
          <div>
            <span>Maximum Marks</span>
            <strong>{summary.totalMax}</strong>
          </div>
        </div>

        <div className="student-stat-card">
          <div className="student-stat-icon">%</div>
          <div>
            <span>Overall Percentage</span>
            <strong>{summary.percentage}%</strong>
          </div>
        </div>

        <div className="student-stat-card">
          <div className="student-stat-icon">R</div>
          <div>
            <span>Subjects</span>
            <strong>{results.length}</strong>
          </div>
        </div>
      </div>

      <section className="student-card">
        <div className="student-card-header">
          <div>
            <h3>Mark Details</h3>
            <p>Your recorded examination results</p>
          </div>
        </div>

        {loading ? (
          <div className="student-loading">Loading results...</div>
        ) : results.length === 0 ? (
          <div className="student-empty">
            No results have been published yet.
          </div>
        ) : (
          <div className="student-table-wrap">
            <table className="student-table">
              <thead>
                <tr>
                  <th>Exam</th>
                  <th>Subject</th>
                  <th>Marks</th>
                  <th>Maximum</th>
                  <th>Percentage</th>
                  <th>Grade</th>
                  <th>Remarks</th>
                </tr>
              </thead>

              <tbody>
                {results.map((item) => {
                  const percentage = item.maxMarks
                    ? (
                        (Number(item.marks || 0) /
                          Number(item.maxMarks)) *
                        100
                      ).toFixed(1)
                    : "0.0";

                  return (
                    <tr key={item._id}>
                      <td>
                        <strong>
                          {item.exam?.name || "Exam"}
                        </strong>
                      </td>

                      <td>
                        {item.subject?.name || "Subject"}
                      </td>

                      <td>
                        <strong>{item.marks}</strong>
                      </td>

                      <td>{item.maxMarks}</td>

                      <td>{percentage}%</td>

                      <td>
                        <span className="student-grade">
                          {item.grade || "—"}
                        </span>
                      </td>

                      <td>{item.remarks || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default Results;
