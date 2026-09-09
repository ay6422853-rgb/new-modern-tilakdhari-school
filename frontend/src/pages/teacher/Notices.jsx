
import { useEffect, useState } from "react";
import api from "../../api";
import "./TeacherAcademics.css";

export default function TeacherNotices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    try {
      setLoading(true);

      const res = await api.get("/teacher/notices", {
        params: { _t: Date.now() },
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      const payload = res.data;

      const list = Array.isArray(payload)
        ? payload
        : payload?.notices ||
          payload?.data ||
          payload?.results ||
          [];

      setNotices(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Teacher notices error:", error);
      setNotices([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="teacher-academic-page">
        <div className="academic-loading">
          Loading notices...
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-academic-page">
      <div className="academic-header">
        <div>
          <h1>Notices</h1>
          <p>Important school announcements</p>
        </div>

        <button className="academic-refresh" onClick={loadNotices}>
          ↻ Refresh
        </button>
      </div>

      {notices.length === 0 ? (
        <div className="academic-table-card">
          <div className="academic-empty">
            <div className="empty-icon">📢</div>
            <h3>No notices</h3>
            <p>There are no notices available right now.</p>
          </div>
        </div>
      ) : (
        <div className="notice-grid">
          {notices.map((notice, index) => (
            <div
              className="notice-card"
              key={notice._id || index}
            >
              <div className="notice-card-top">
                <span className="notice-icon">📢</span>

                <span className="notice-date">
                  {notice.publishedAt || notice.createdAt
                    ? new Date(
                        notice.publishedAt ||
                          notice.createdAt
                      ).toLocaleDateString("en-IN")
                    : "—"}
                </span>
              </div>

              <h2>{notice.title || "Notice"}</h2>

              <p>
                {notice.body ||
                  notice.description ||
                  "No notice details available."}
              </p>

              {notice.audience?.length > 0 && (
                <div className="notice-audience">
                  {notice.audience.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
