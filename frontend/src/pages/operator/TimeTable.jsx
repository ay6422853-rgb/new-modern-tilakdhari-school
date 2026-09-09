import { useEffect, useMemo, useState } from "react";
import api from "../../api";
import "./TimeTable.css";

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const periods = [1, 2, 3, 4, 5, 6, 7];

const ALL_DAYS = "ALL";

const emptyForm = {
  classId: "",
  className: "",
  section: "",
  subject: "",
  subjectName: "",
  teacher: "",
  teacherName: "",
  day: "Monday",
  period: 1,
  startTime: "08:00",
  endTime: "08:45",
  room: "",
  session: "",
};

const idOf = (item) =>
  item?._id || item?.id || "";

const nameOf = (item) =>
  item?.name ||
  item?.subjectName ||
  item?.teacherName ||
  "";

function TimeTable() {
  const [entries, setEntries] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [selectedClass, setSelectedClass] =
    useState("");

  const [selectedSection, setSelectedSection] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState(emptyForm);

  // -----------------------------------------
  // LOAD DATA
  // -----------------------------------------

  const loadData = async () => {
    try {
      setLoading(true);

      const [
        timetableRes,
        classRes,
        subjectRes,
        teacherRes,
      ] = await Promise.all([
        api.get("/operator/timetable"),
        api.get("/operator/classes"),
        api.get("/operator/subjects"),
        api.get("/operator/teachers"),
      ]);

      setEntries(timetableRes.data || []);
      setClasses(classRes.data || []);
      setSubjects(subjectRes.data || []);
      setTeachers(teacherRes.data || []);
    } catch (error) {
      console.error(
        "Timetable loading error:",
        error
      );

      alert(
        error?.response?.data?.message ||
          "Unable to load timetable"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // -----------------------------------------
  // SELECTED CLASS
  // -----------------------------------------

  const selectedClassObject = useMemo(() => {
    return classes.find(
      (item) =>
        idOf(item) === selectedClass
    );
  }, [classes, selectedClass]);

  // -----------------------------------------
  // CLASS SECTIONS
  // -----------------------------------------

  const sections = useMemo(() => {
    if (!selectedClassObject) {
      return [];
    }

    if (
      Array.isArray(
        selectedClassObject.sections
      )
    ) {
      return selectedClassObject.sections.filter(
        Boolean
      );
    }

    if (selectedClassObject.section) {
      return [selectedClassObject.section];
    }

    return [];
  }, [selectedClassObject]);

  // -----------------------------------------
  // FILTER ENTRIES
  // -----------------------------------------

  const filteredEntries = useMemo(() => {
    return entries.filter((item) => {
      const classMatch =
        !selectedClass ||
        idOf(item.classId) === selectedClass;

      const sectionMatch =
        !selectedSection ||
        item.section === selectedSection;

      return (
        classMatch &&
        sectionMatch
      );
    });
  }, [
    entries,
    selectedClass,
    selectedSection,
  ]);

  // -----------------------------------------
  // FIND TIMETABLE ENTRY
  // -----------------------------------------

  const getEntry = (day, period) => {
    return filteredEntries.find(
      (item) =>
        item.day === day &&
        Number(item.period) ===
          Number(period)
    );
  };

  // -----------------------------------------
  // GET MODAL SECTIONS
  // -----------------------------------------

  const getModalSections = () => {
    const modalClass =
      classes.find(
        (cls) =>
          idOf(cls) === form.classId
      );

    if (
      Array.isArray(
        modalClass?.sections
      )
    ) {
      return modalClass.sections.filter(
        Boolean
      );
    }

    if (modalClass?.section) {
      return [modalClass.section];
    }

    return [];
  };

  // -----------------------------------------
  // OPEN CREATE
  // -----------------------------------------

  const openCreate = (
    day = "Monday",
    period = 1
  ) => {
    if (!selectedClass) {
      alert("Please select class first");
      return;
    }

    if (!selectedSection) {
      alert("Please select section first");
      return;
    }

    const cls = classes.find(
      (item) =>
        idOf(item) === selectedClass
    );

    setEditing(null);

    setForm({
      ...emptyForm,

      classId: selectedClass,

      className: cls
        ? nameOf(cls)
        : "",

      section: selectedSection,

      day,

      period,

      session:
        cls?.session || "",
    });

    setModal(true);
  };

  // -----------------------------------------
  // OPEN EDIT
  // -----------------------------------------

  const openEdit = (entry) => {
    setEditing(entry);

    setForm({
      classId: idOf(entry.classId),

      className:
        entry.className || "",

      section:
        entry.section || "",

      subject:
        idOf(entry.subject),

      subjectName:
        entry.subjectName || "",

      teacher:
        idOf(entry.teacher),

      teacherName:
        entry.teacherName || "",

      day:
        entry.day || "Monday",

      period:
        entry.period || 1,

      startTime:
        entry.startTime || "08:00",

      endTime:
        entry.endTime || "08:45",

      room:
        entry.room || "",

      session:
        entry.session || "",
    });

    setModal(true);
  };

  // -----------------------------------------
  // HANDLE FORM CHANGE
  // -----------------------------------------

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    // CLASS
    if (name === "classId") {
      const cls = classes.find(
        (item) =>
          idOf(item) === value
      );

      setForm((prev) => ({
        ...prev,

        classId: value,

        className: cls
          ? nameOf(cls)
          : "",

        section: "",

        session:
          cls?.session || "",
      }));

      return;
    }

    // SUBJECT
    if (name === "subject") {
      const subject =
        subjects.find(
          (item) =>
            idOf(item) === value
        );

      setForm((prev) => ({
        ...prev,

        subject: value,

        subjectName:
          subject
            ? nameOf(subject)
            : "",
      }));

      return;
    }

    // TEACHER
    if (name === "teacher") {
      const teacher =
        teachers.find(
          (item) =>
            idOf(item) === value
        );

      setForm((prev) => ({
        ...prev,

        teacher: value,

        teacherName:
          teacher
            ? nameOf(teacher)
            : "",
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // -----------------------------------------
  // SAVE
  // -----------------------------------------

  const saveEntry = async (e) => {
    e.preventDefault();

    if (!form.classId) {
      alert("Select class");
      return;
    }

    if (!form.section) {
      alert("Select section");
      return;
    }

    if (!form.subject) {
      alert("Select subject");
      return;
    }

    if (!form.teacher) {
      alert("Select teacher");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...form,

        period:
          Number(form.period),

        className:
          form.className.trim(),

        section:
          form.section.trim(),

        subjectName:
          form.subjectName.trim(),

        teacherName:
          form.teacherName.trim(),
      };

      // -------------------------------------
      // EDIT EXISTING ENTRY
      // -------------------------------------

      if (editing) {
        await api.put(
          `/operator/timetable/${idOf(
            editing
          )}`,
          payload
        );
      }

      // -------------------------------------
      // CREATE NEW ENTRY
      // -------------------------------------

      else {
        // ALL DAYS
        if (form.day === ALL_DAYS) {
          await Promise.all(
            days.map((day) =>
              api.post(
                "/operator/timetable",
                {
                  ...payload,
                  day,
                }
              )
            )
          );
        }

        // SINGLE DAY
        else {
          await api.post(
            "/operator/timetable",
            payload
          );
        }
      }

      setModal(false);
      setEditing(null);
      setForm(emptyForm);

      await loadData();

    } catch (error) {
      console.error(
        "Timetable save error:",
        error
      );

      alert(
        error?.response?.data?.message ||
          "Unable to save timetable"
      );
    } finally {
      setSaving(false);
    }
  };

  // -----------------------------------------
  // DELETE
  // -----------------------------------------

  const deleteEntry = async () => {
    if (!editing) return;

    if (
      !window.confirm(
        "Delete this timetable entry?"
      )
    ) {
      return;
    }

    try {
      setSaving(true);

      await api.delete(
        `/operator/timetable/${idOf(
          editing
        )}`
      );

      setModal(false);
      setEditing(null);

      await loadData();

    } catch (error) {
      console.error(
        "Delete timetable error:",
        error
      );

      alert(
        error?.response?.data?.message ||
          "Unable to delete timetable"
      );
    } finally {
      setSaving(false);
    }
  };

  // -----------------------------------------
  // PRINT
  // -----------------------------------------

  const printTimetable = () => {
    const classText =
      selectedClassObject?.name ||
      "All Classes";

    const sectionText =
      selectedSection
        ? ` - Section ${selectedSection}`
        : "";

    const rows = filteredEntries
      .slice()
      .sort((a, b) => {
        const dayA =
          days.indexOf(a.day);

        const dayB =
          days.indexOf(b.day);

        if (dayA !== dayB) {
          return dayA - dayB;
        }

        return (
          Number(a.period) -
          Number(b.period)
        );
      })
      .map(
        (item) => `
          <tr>
            <td>${item.day || ""}</td>

            <td>
              ${item.period || ""}
            </td>

            <td>
              ${item.startTime || ""}
              -
              ${item.endTime || ""}
            </td>

            <td>
              ${item.subjectName || ""}
            </td>

            <td>
              ${item.teacherName || ""}
            </td>

            <td>
              ${item.room || ""}
            </td>
          </tr>
        `
      )
      .join("");

    const win =
      window.open("", "_blank");

    if (!win) {
      alert(
        "Please allow popup window to print timetable."
      );
      return;
    }

    win.document.write(`
      <html>

        <head>

          <title>
            Class Timetable
          </title>

          <style>

            body {
              font-family: Arial;
              padding: 30px;
            }

            h1 {
              text-align: center;
            }

            h3 {
              text-align: center;
              font-weight: normal;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 25px;
            }

            th,
            td {
              border: 1px solid #222;
              padding: 10px;
              text-align: center;
            }

            th {
              background: #f1f1f1;
            }

          </style>

        </head>

        <body>

          <h1>
            Class Time Table
          </h1>

          <h3>
            ${classText}${sectionText}
          </h3>

          <table>

            <thead>

              <tr>

                <th>
                  Day
                </th>

                <th>
                  Period
                </th>

                <th>
                  Time
                </th>

                <th>
                  Subject
                </th>

                <th>
                  Teacher
                </th>

                <th>
                  Room
                </th>

              </tr>

            </thead>

            <tbody>
              ${rows}
            </tbody>

          </table>

          <script>
            window.print();
          </script>

        </body>

      </html>
    `);

    win.document.close();
  };

  // -----------------------------------------
  // RENDER
  // -----------------------------------------

  return (
    <div className="timetable-page">

      {/* HEADER */}

      <div className="timetable-header">

        <div>

          <h1>
            Time Table
          </h1>

          <p>
            Manage regular weekly class timetable
          </p>

        </div>

        <div className="timetable-header-actions">

          <button
            className="timetable-print-btn"
            onClick={printTimetable}
          >
            🖨 Print / Download
          </button>

          <button
            className="timetable-primary-btn"
            onClick={() =>
              openCreate()
            }
          >
            + Add Period
          </button>

        </div>

      </div>

      {/* FILTERS */}

      <div className="timetable-filters">

        {/* CLASS */}

        <select
          value={selectedClass}
          onChange={(e) => {
            setSelectedClass(
              e.target.value
            );

            setSelectedSection("");
          }}
        >

          <option value="">
            Select Class
          </option>

          {classes.map((cls) => (

            <option
              key={idOf(cls)}
              value={idOf(cls)}
            >
              {nameOf(cls)}
            </option>

          ))}

        </select>

        {/* SECTION */}

        <select
          value={selectedSection}
          disabled={!selectedClass}
          onChange={(e) =>
            setSelectedSection(
              e.target.value
            )
          }
        >

          <option value="">
            Select Section
          </option>

          {sections.map(
            (section) => (

              <option
                key={section}
                value={section}
              >
                Section {section}
              </option>

            )
          )}

        </select>

      </div>

      {/* NO SECTION */}

      {selectedClass &&
        sections.length === 0 && (

          <div className="timetable-empty">

            No sections found for this class.
            Please add sections from Classes page.

          </div>

        )}

      {/* BOARD */}

      {selectedClass &&
        selectedSection && (

          <div className="timetable-board">

            {loading ? (

              <div className="timetable-empty">
                Loading timetable...
              </div>

            ) : (

              <div className="timetable-scroll">

                <table>

                  <thead>

                    <tr>

                      <th className="day-heading">
                        Day
                      </th>

                      {periods.map(
                        (period) => (

                          <th
                            key={period}
                          >
                            Period {period}
                          </th>

                        )
                      )}

                    </tr>

                  </thead>

                  <tbody>

                    {days.map(
                      (day) => (

                        <tr key={day}>

                          <td className="day-cell">
                            {day}
                          </td>

                          {periods.map(
                            (period) => {

                              const item =
                                getEntry(
                                  day,
                                  period
                                );

                              return (

                                <td
                                  key={period}
                                  className={
                                    item
                                      ? "period-cell filled"
                                      : "period-cell empty"
                                  }
                                  onClick={() =>
                                    item
                                      ? openEdit(
                                          item
                                        )
                                      : openCreate(
                                          day,
                                          period
                                        )
                                  }
                                >

                                  {item ? (

                                    <div className="timetable-cell-content">

                                      <strong>
                                        {item.teacherName ||
                                          "Teacher"}
                                      </strong>

                                      <span>
                                        {item.subjectName ||
                                          "Subject"}
                                      </span>

                                      <small>
                                        {
                                          item.startTime
                                        }
                                        {" - "}
                                        {
                                          item.endTime
                                        }
                                      </small>

                                      {item.room && (

                                        <small>
                                          Room{" "}
                                          {
                                            item.room
                                          }
                                        </small>

                                      )}

                                      <button
                                        type="button"
                                        className="cell-edit-btn"
                                        onClick={(
                                          e
                                        ) => {

                                          e.stopPropagation();

                                          openEdit(
                                            item
                                          );

                                        }}
                                      >
                                        Edit
                                      </button>

                                    </div>

                                  ) : (

                                    <button
                                      type="button"
                                      className="empty-period-btn"
                                      onClick={(
                                        e
                                      ) => {

                                        e.stopPropagation();

                                        openCreate(
                                          day,
                                          period
                                        );

                                      }}
                                    >
                                      +
                                    </button>

                                  )}

                                </td>

                              );

                            }
                          )}

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        )}

      {/* SELECT CLASS / SECTION */}

      {!loading &&
        (!selectedClass ||
          !selectedSection) && (

          <div className="timetable-empty">

            <div className="timetable-empty-icon">
              📅
            </div>

            <h3>
              Select Class & Section
            </h3>

            <p>
              Class and section select karne
              ke baad weekly timetable yahan
              dikhega.
            </p>

          </div>

        )}

      {/* MODAL */}

      {modal && (

        <div
          className="timetable-modal-backdrop"
          onMouseDown={() =>
            setModal(false)
          }
        >

          <div
            className="timetable-modal"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="timetable-modal-header">

              <div>

                <h2>
                  {editing
                    ? "Edit Period"
                    : "Assign Teacher"}
                </h2>

                <p>

                  {form.className}
                  {" - "}
                  Section {form.section}
                  {" | "}
                  {form.day === ALL_DAYS
                    ? "All Days"
                    : form.day}
                  {" | "}
                  Period {form.period}

                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setModal(false)
                }
              >
                ×
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={saveEntry}
            >

              <div className="timetable-form-grid">

                {/* CLASS */}

                <label>

                  Class

                  <select
                    name="classId"
                    value={form.classId}
                    onChange={
                      handleChange
                    }
                  >

                    <option value="">
                      Select Class
                    </option>

                    {classes.map(
                      (cls) => (

                        <option
                          key={idOf(cls)}
                          value={idOf(cls)}
                        >
                          {nameOf(cls)}
                        </option>

                      )
                    )}

                  </select>

                </label>

                {/* SECTION */}

                <label>

                  Section

                  <select
                    name="section"
                    value={form.section}
                    onChange={
                      handleChange
                    }
                  >

                    <option value="">
                      Select Section
                    </option>

                    {getModalSections().map(
                      (section) => (

                        <option
                          key={section}
                          value={section}
                        >
                          Section {section}
                        </option>

                      )
                    )}

                  </select>

                </label>

                {/* TEACHER */}

                <label>

                  Teacher

                  <select
                    name="teacher"
                    value={form.teacher}
                    onChange={
                      handleChange
                    }
                  >

                    <option value="">
                      Select Teacher
                    </option>

                    {teachers.map(
                      (teacher) => (

                        <option
                          key={idOf(
                            teacher
                          )}
                          value={idOf(
                            teacher
                          )}
                        >
                          {nameOf(
                            teacher
                          )}
                        </option>

                      )
                    )}

                  </select>

                </label>

                {/* SUBJECT */}

                <label>

                  Subject

                  <select
                    name="subject"
                    value={form.subject}
                    onChange={
                      handleChange
                    }
                  >

                    <option value="">
                      Select Subject
                    </option>

                    {subjects.map(
                      (subject) => (

                        <option
                          key={idOf(
                            subject
                          )}
                          value={idOf(
                            subject
                          )}
                        >
                          {nameOf(
                            subject
                          )}
                        </option>

                      )
                    )}

                  </select>

                </label>

                {/* DAY */}

                <label>

                  Day

                  <select
                    name="day"
                    value={form.day}
                    onChange={
                      handleChange
                    }
                  >

                    {/* ALL DAYS */}

                    <option value={ALL_DAYS}>
                      All Days
                    </option>

                    {/* INDIVIDUAL DAYS */}

                    {days.map(
                      (day) => (

                        <option
                          key={day}
                          value={day}
                        >
                          {day}
                        </option>

                      )
                    )}

                  </select>

                </label>

                {/* PERIOD */}

                <label>

                  Period

                  <input
                    type="number"
                    min="1"
                    max="12"
                    name="period"
                    value={form.period}
                    onChange={
                      handleChange
                    }
                  />

                </label>

                {/* START */}

                <label>

                  Start Time

                  <input
                    type="time"
                    name="startTime"
                    value={
                      form.startTime
                    }
                    onChange={
                      handleChange
                    }
                  />

                </label>

                {/* END */}

                <label>

                  End Time

                  <input
                    type="time"
                    name="endTime"
                    value={
                      form.endTime
                    }
                    onChange={
                      handleChange
                    }
                  />

                </label>

                {/* ROOM */}

                <label>

                  Room

                  <input
                    name="room"
                    value={form.room}
                    onChange={
                      handleChange
                    }
                    placeholder="Room 101"
                  />

                </label>

                {/* SESSION */}

                <label>

                  Session

                  <input
                    name="session"
                    value={
                      form.session
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="2026-27"
                  />

                </label>

              </div>

              {/* ALL DAYS INFO */}

              {!editing &&
                form.day === ALL_DAYS && (

                  <div
                    style={{
                      marginTop: "12px",
                      padding: "12px 14px",
                      borderRadius: "8px",
                      background:
                        "#eef6ff",
                      fontSize: "14px",
                      lineHeight: "1.5",
                    }}
                  >
                    <strong>
                      All Days selected
                    </strong>

                    <div>
                      This teacher will be
                      assigned to this period
                      from Monday to Saturday.
                    </div>
                  </div>

                )}

              {/* ACTIONS */}

              <div className="timetable-modal-actions">

                {editing && (

                  <button
                    type="button"
                    className="timetable-delete-btn"
                    onClick={
                      deleteEntry
                    }
                    disabled={saving}
                  >
                    Delete
                  </button>

                )}

                <span />

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
                  className="timetable-primary-btn"
                  disabled={saving}
                >

                  {saving
                    ? "Saving..."
                    : editing
                    ? "Update Period"
                    : form.day === ALL_DAYS
                    ? "Assign All Days"
                    : "Assign Teacher"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default TimeTable;