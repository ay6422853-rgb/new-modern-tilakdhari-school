
import { useEffect, useState } from "react";
import api from "../../api";
import "./StudentCommon.css";

function Notices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    try {
      const res = await api.get("/student/notices");
      setNotices(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="student-page">
      <div className="student-page-header">
        <div>
          <span className="student-eyebrow">SCHOOL</span>
          <h1>Notices</h1>
          <p>Important announcements from your school.</p>
        </div>

        <button className="student-refresh-btn" onClick={loadNotices}>
          ↻ Refresh
        </button>
      </div>

      {loading ? (
        <div className="student-loading">Loading notices...</div>
      ) : notices.length === 0 ? (
        <div className="student-card">
          <div className="student-empty">
            No notices available.
          </div>
        </div>
      ) : (
        <div className="student-notices-grid">
          {notices.map((notice) => (
            <article className="student-notice-card" key={notice._id}>
              <div className="student-notice-card-top">
                <div className="student-notice-icon">N</div>

                <span>
                  {notice.publishedAt
                    ? new Date(
                        notice.publishedAt
                      ).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      })
                    : "—"}
                </span>
              </div>

              <h3>{notice.title}</h3>

              <p>
                {notice.body?.length > 150
                  ? `${notice.body.slice(0, 150)}...`
                  : notice.body}
              </p>

              <button
                className="student-text-btn"
                onClick={() => setSelected(notice)}
              >
                Read notice →
              </button>
            </article>
          ))}
        </div>
      )}

      {selected && (
        <div
          className="student-modal-overlay"
          onClick={() => setSelected(null)}
        >
          <div
            className="student-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="student-modal-header">
              <div>
                <span className="student-eyebrow">NOTICE</span>
                <h2>{selected.title}</h2>
              </div>

              <button
                className="student-modal-close"
                onClick={() => setSelected(null)}
              >
                ×
              </button>
            </div>

            <div className="student-modal-date">
              {selected.publishedAt
                ? new Date(
                    selected.publishedAt
                  ).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric"
                  })
                : ""}
            </div>

            <div className="student-notice-body">
              {selected.body}
            </div>

            <div className="student-modal-footer">
              <button
                className="student-primary-btn"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Notices;
