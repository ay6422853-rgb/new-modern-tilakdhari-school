import React, { useEffect, useState } from "react";
import { create, list } from "../../api";
import "./Notices.css";

const AUDIENCES = [
  "ALL",
  "PRINCIPAL",
  "ACCOUNTANT",
  "OPERATOR",
  "TEACHER",
  "PARENT",
  "STUDENT",
];

export default function Notices() {
  const [notices, setNotices] = useState([]);

  const [form, setForm] = useState({
    title: "",
    body: "",
    audience: ["ALL"],
    published: true,
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadNotices = async () => {
    try {
      const data = await list("principal/notices");
      setNotices(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Notices load nahi ho sake."
      );
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

  const toggleAudience = (role) => {
    if (role === "ALL") {
      setForm((prev) => ({
        ...prev,
        audience: ["ALL"],
      }));
      return;
    }

    setForm((prev) => {
      const current = prev.audience.filter(
        (item) => item !== "ALL"
      );

      const exists = current.includes(role);

      const next = exists
        ? current.filter((item) => item !== role)
        : [...current, role];

      return {
        ...prev,
        audience: next.length ? next : ["ALL"],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!form.title.trim()) {
      setError("Notice title required hai.");
      return;
    }

    if (!form.body.trim()) {
      setError("Notice message required hai.");
      return;
    }

    try {
      await create("principal/notices", form);

      setMessage("Notice successfully publish ho gaya.");

      setForm({
        title: "",
        body: "",
        audience: ["ALL"],
        published: true,
      });

      await loadNotices();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Notice create nahi ho saka."
      );
    }
  };

  return (
    <div className="principal-notices-page">
      <div className="principal-notices-header">
        <div>
          <h1>Notice Board</h1>
          <p>Create and publish school notices</p>
        </div>

        <button onClick={loadNotices}>↻ Refresh</button>
      </div>

      {message && (
        <div className="principal-notices-success">
          {message}
        </div>
      )}

      {error && (
        <div className="principal-notices-error">
          {error}
        </div>
      )}

      <div className="principal-notices-layout">
        <section className="principal-notices-card">
          <h2>Create Notice</h2>

          <form onSubmit={handleSubmit}>
            <div className="principal-notices-field">
              <label>Notice Title *</label>
              <input
                type="text"
                placeholder="Enter notice title"
                value={form.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    title: e.target.value,
                  })
                }
              />
            </div>

            <div className="principal-notices-field">
              <label>Notice Message *</label>
              <textarea
                rows="8"
                placeholder="Write your notice here..."
                value={form.body}
                onChange={(e) =>
                  setForm({
                    ...form,
                    body: e.target.value,
                  })
                }
              />
            </div>

            <div className="principal-notices-field">
              <label>Audience</label>

              <div className="principal-notices-audience">
                {AUDIENCES.map((role) => (
                  <label
                    key={role}
                    className={
                      form.audience.includes(role)
                        ? "active"
                        : ""
                    }
                  >
                    <input
                      type="checkbox"
                      checked={form.audience.includes(role)}
                      onChange={() => toggleAudience(role)}
                    />
                    {role}
                  </label>
                ))}
              </div>
            </div>

            <label className="principal-notices-publish">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) =>
                  setForm({
                    ...form,
                    published: e.target.checked,
                  })
                }
              />
              Publish notice immediately
            </label>

            <button
              type="submit"
              className="principal-notices-submit"
            >
              Publish Notice
            </button>
          </form>
        </section>

        <section className="principal-notices-card">
          <div className="principal-notices-list-header">
            <h2>Published Notices</h2>
            <span>{notices.length}</span>
          </div>

          <div className="principal-notices-list">
            {notices.length === 0 ? (
              <div className="principal-notices-empty">
                No notices found.
              </div>
            ) : (
              notices.map((notice) => (
                <article
                  className="principal-notice-item"
                  key={notice._id}
                >
                  <div className="principal-notice-top">
                    <div className="principal-notice-badge">
                      NOTICE
                    </div>

                    <span>
                      {notice.publishedAt
                        ? new Date(
                            notice.publishedAt
                          ).toLocaleDateString()
                        : "—"}
                    </span>
                  </div>

                  <h3>{notice.title}</h3>

                  <p>{notice.body}</p>

                  <div className="principal-notice-bottom">
                    <div>
                      {Array.isArray(notice.audience)
                        ? notice.audience.join(", ")
                        : "ALL"}
                    </div>

                    <span
                      className={
                        notice.published
                          ? "published"
                          : "draft"
                      }
                    >
                      {notice.published
                        ? "Published"
                        : "Draft"}
                    </span>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}