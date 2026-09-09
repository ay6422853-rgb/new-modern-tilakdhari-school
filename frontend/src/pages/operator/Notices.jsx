import { useEffect, useMemo, useState } from "react";
import api from "../../api";
import "./Notices.css";

const emptyForm = {
  title: "",
  body: "",
  audience: "ALL",
  classId: "",
  priority: "Normal",
  date: "",
  expiryDate: "",
  published: true,
};

const idOf = (item) =>
  item?._id || item?.id || "";

const classNameOf = (item) =>
  item?.name ||
  item?.className ||
  item?.title ||
  "—";

const audienceLabel = (audience) => {
  const labels = {
    ALL: "All",
    STUDENT: "Students",
    TEACHER: "Teachers",
    PARENT: "Parents",
  };

  return labels[audience] || audience || "All";
};

function Notices() {
  const [notices, setNotices] = useState([]);
  const [classes, setClasses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const loadData = async () => {
    try {
      setLoading(true);

      const [noticeRes, classRes] = await Promise.all([
        api.get("/operator/notices"),
        api.get("/operator/classes"),
      ]);

      setNotices(noticeRes.data || []);
      setClasses(classRes.data || []);
    } catch (error) {
      console.error(error);

      alert(
        error?.response?.data?.message ||
          "Unable to load notices"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredNotices = useMemo(() => {
    return notices.filter((notice) => {
      const text =
        `${notice.title || ""} ${
          notice.body || ""
        }`.toLowerCase();

      const matchesSearch = text.includes(
        search.toLowerCase()
      );

      const matchesFilter =
        filter === "All" ||
        (filter === "Published" && notice.published) ||
        (filter === "Draft" && !notice.published);

      return matchesSearch && matchesFilter;
    });
  }, [notices, search, filter]);

  const openCreate = () => {
    setEditing(null);

    setForm({
      ...emptyForm,
      date: new Date()
        .toISOString()
        .slice(0, 10),
    });

    setModal(true);
  };

  const openEdit = (notice) => {
    setEditing(notice);

    setForm({
      title: notice.title || "",
      body: notice.body || "",
      audience: notice.audience || "ALL",
      classId: idOf(notice.classId),

      priority: notice.priority || "Normal",

      date: notice.date
        ? new Date(notice.date)
            .toISOString()
            .slice(0, 10)
        : "",

      expiryDate: notice.expiryDate
        ? new Date(notice.expiryDate)
            .toISOString()
            .slice(0, 10)
        : "",

      published: notice.published !== false,
    });

    setModal(true);
  };

  const handleChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  const saveNotice = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("Notice title is required");
      return;
    }

    if (!form.body.trim()) {
      alert("Notice body is required");
      return;
    }

    if (
      form.audience === "SPECIFIC_CLASS" &&
      !form.classId
    ) {
      alert("Please select a class");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        title: form.title.trim(),
        body: form.body.trim(),

        audience:
          form.audience === "SPECIFIC_CLASS"
            ? "STUDENT"
            : form.audience,

        classId:
          form.audience === "SPECIFIC_CLASS"
            ? form.classId
            : null,

        priority: form.priority,

        date: form.date || null,

        expiryDate:
          form.expiryDate || null,

        published: form.published,
      };

      console.log("Notice payload:", payload);

      if (editing) {
        await api.put(
          `/operator/notices/${idOf(editing)}`,
          payload
        );
      } else {
        await api.post(
          "/operator/notices",
          payload
        );
      }

      setModal(false);
      setEditing(null);

      await loadData();
    } catch (error) {
      console.error(error);

      alert(
        error?.response?.data?.message ||
          "Unable to save notice"
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteNotice = async (notice) => {
    if (
      !window.confirm(
        `Delete "${notice.title}"?`
      )
    ) {
      return;
    }

    try {
      await api.delete(
        `/operator/notices/${idOf(notice)}`
      );

      await loadData();
    } catch (error) {
      console.error(error);

      alert(
        error?.response?.data?.message ||
          "Unable to delete notice"
      );
    }
  };

  const togglePublish = async (notice) => {
    try {
      await api.put(
        `/operator/notices/${idOf(notice)}`,
        {
          published: !notice.published,
        }
      );

      await loadData();
    } catch (error) {
      console.error(error);

      alert(
        error?.response?.data?.message ||
          "Unable to update notice"
      );
    }
  };

  return (
    <div className="notices-page">
      {/* HEADER */}
      <div className="notices-header">
        <div>
          <h1>Notices</h1>

          <p>
            Create and manage school announcements
          </p>
        </div>

        <button
          className="notice-primary-btn"
          onClick={openCreate}
        >
          + Create Notice
        </button>
      </div>

      {/* STATS */}
      <div className="notice-stats">
        <div className="notice-stat-card">
          <span>Total Notices</span>

          <strong>
            {notices.length}
          </strong>
        </div>

        <div className="notice-stat-card">
          <span>Published</span>

          <strong>
            {
              notices.filter(
                (n) => n.published
              ).length
            }
          </strong>
        </div>

        <div className="notice-stat-card">
          <span>Drafts</span>

          <strong>
            {
              notices.filter(
                (n) => !n.published
              ).length
            }
          </strong>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="notice-toolbar">
        <input
          placeholder="Search notices..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

        <select
          value={filter}
          onChange={(e) =>
            setFilter(e.target.value)
          }
        >
          <option value="All">
            All
          </option>

          <option value="Published">
            Published
          </option>

          <option value="Draft">
            Draft
          </option>
        </select>
      </div>

      {/* NOTICE LIST */}
      <div className="notices-list">
        {loading ? (
          <div className="notice-empty">
            Loading notices...
          </div>
        ) : filteredNotices.length === 0 ? (
          <div className="notice-empty">
            No notices found
          </div>
        ) : (
          filteredNotices.map((notice) => (
            <div
              className="notice-card"
              key={idOf(notice)}
            >
              <div className="notice-card-top">
                <div>
                  <span
                    className={`notice-priority ${(
                      notice.priority ||
                      "Normal"
                    ).toLowerCase()}`}
                  >
                    {notice.priority ||
                      "Normal"}
                  </span>

                  <h3>
                    {notice.title}
                  </h3>
                </div>

                <span
                  className={`notice-status ${
                    notice.published
                      ? "published"
                      : "draft"
                  }`}
                >
                  {notice.published
                    ? "Published"
                    : "Draft"}
                </span>
              </div>

              <p>
                {notice.body}
              </p>

              <div className="notice-meta">
                <span>
                  📅{" "}
                  {notice.date
                    ? new Date(
                        notice.date
                      ).toLocaleDateString()
                    : "—"}
                </span>

                <span>
                  👥{" "}
                  {audienceLabel(
                    notice.audience
                  )}
                </span>

                {notice.classId && (
                  <span>
                    🏫{" "}
                    {classNameOf(
                      notice.classId
                    )}
                  </span>
                )}
              </div>

              <div className="notice-actions">
                <button
                  onClick={() =>
                    togglePublish(notice)
                  }
                >
                  {notice.published
                    ? "Unpublish"
                    : "Publish"}
                </button>

                <button
                  onClick={() =>
                    openEdit(notice)
                  }
                >
                  Edit
                </button>

                <button
                  className="danger"
                  onClick={() =>
                    deleteNotice(notice)
                  }
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL */}
      {modal && (
        <div className="notice-modal-backdrop">
          <div className="notice-modal">

            <div className="notice-modal-header">
              <div>
                <h2>
                  {editing
                    ? "Edit Notice"
                    : "Create Notice"}
                </h2>

                <p>
                  Add announcement details
                </p>
              </div>

              <button
                type="button"
                className="notice-close"
                onClick={() =>
                  setModal(false)
                }
              >
                ×
              </button>
            </div>

            <form onSubmit={saveNotice}>

              <div className="notice-form-grid">

                {/* TITLE */}
                <label>
                  Title

                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Enter notice title"
                  />
                </label>

                {/* PRIORITY */}
                <label>
                  Priority

                  <select
                    name="priority"
                    value={form.priority}
                    onChange={handleChange}
                  >
                    <option value="Normal">
                      Normal
                    </option>

                    <option value="Important">
                      Important
                    </option>

                    <option value="Urgent">
                      Urgent
                    </option>
                  </select>
                </label>

                {/* AUDIENCE */}
                <label>
                  Audience

                  <select
                    name="audience"
                    value={form.audience}
                    onChange={handleChange}
                  >
                    <option value="ALL">
                      All
                    </option>

                    <option value="STUDENT">
                      Students
                    </option>

                    <option value="TEACHER">
                      Teachers
                    </option>

                    <option value="PARENT">
                      Parents
                    </option>

                    <option value="SPECIFIC_CLASS">
                      Specific Class
                    </option>
                  </select>
                </label>

                {/* CLASS */}
                {form.audience ===
                  "SPECIFIC_CLASS" && (
                  <label>
                    Class

                    <select
                      name="classId"
                      value={form.classId}
                      onChange={handleChange}
                    >
                      <option value="">
                        Select Class
                      </option>

                      {classes.map((cls) => (
                        <option
                          key={idOf(cls)}
                          value={idOf(cls)}
                        >
                          {classNameOf(cls)}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {/* DATE */}
                <label>
                  Date

                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                  />
                </label>

                {/* EXPIRY */}
                <label>
                  Expiry Date

                  <input
                    type="date"
                    name="expiryDate"
                    value={
                      form.expiryDate
                    }
                    onChange={handleChange}
                  />
                </label>

              </div>

              {/* BODY */}
              <label className="notice-description">
                Notice Body

                <textarea
                  name="body"
                  value={form.body}
                  onChange={handleChange}
                  rows="6"
                  placeholder="Write notice..."
                  required
                />
              </label>

              {/* PUBLISH */}
              <label className="notice-publish-check">
                <input
                  type="checkbox"
                  name="published"
                  checked={
                    form.published
                  }
                  onChange={handleChange}
                />

                Publish this notice immediately
              </label>

              {/* ACTIONS */}
              <div className="notice-modal-actions">
                <button
                  type="button"
                  onClick={() =>
                    setModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="notice-primary-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editing
                    ? "Update Notice"
                    : "Create Notice"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Notices;