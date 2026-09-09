
import { useEffect, useMemo, useState } from "react";
import api from "../../api";
import "./TeacherAcademics.css";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function TeacherTimetable() {
  const [timetable, setTimetable] = useState([]);
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTimetable();
  }, []);

  const loadTimetable = async () => {
    try {
      setLoading(true);

      const res = await api.get("/teacher/timetable", {
        params: { _t: Date.now() },
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      const payload = res.data;

      const list = Array.isArray(payload)
        ? payload
        : payload?.timetable ||
          payload?.data ||
          payload?.results ||
          [];

      setTimetable(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Teacher timetable error:", error);
      setTimetable([]);
    } finally {
      setLoading(false);
    }
  };

  const daySchedule = useMemo(() => {
    return timetable
      .filter((item) => item.day === selectedDay)
      .sort((a, b) => Number(a.period) - Number(b.period));
  }, [timetable, selectedDay]);

  if (loading) {
    return (
      <div className="teacher-academic-page">
        <div className="academic-loading">
          Loading timetable...
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-academic-page">
      <div className="academic-header">
        <div>
          <h1>My Timetable</h1>
          <p>Your weekly teaching schedule</p>
        </div>

        <button className="academic-refresh" onClick={loadTimetable}>
          ↻ Refresh
        </button>
      </div>

      <div className="day-tabs">
        {DAYS.map((day) => (
          <button
            key={day}
            className={
              selectedDay === day ? "active" : ""
            }
            onClick={() => setSelectedDay(day)}
          >
            {day}
          </button>
        ))}
      </div>

      <div className="academic-table-card">
        {daySchedule.length === 0 ? (
          <div className="academic-empty">
            <div className="empty-icon">🗓️</div>
            <h3>No classes</h3>
            <p>
              No timetable entries found for {selectedDay}.
            </p>
          </div>
        ) : (
          <div className="academic-table-wrapper">
            <table className="academic-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Time</th>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Subject</th>
                  <th>Room</th>
                </tr>
              </thead>

              <tbody>
                {daySchedule.map((item, index) => {
                  const className =
                    item.className ||
                    item.classId?.name ||
                    "—";

                  const subjectName =
                    item.subjectName ||
                    item.subject?.name ||
                    "—";

                  return (
                    <tr key={item._id || index}>
                      <td>
                        <span className="period-number">
                          {item.period}
                        </span>
                      </td>

                      <td>
                        {item.startTime || "—"}
                        {" - "}
                        {item.endTime || "—"}
                      </td>

                      <td>
                        <strong>{className}</strong>
                      </td>

                      <td>{item.section || "—"}</td>

                      <td>
                        <span className="subject-pill">
                          {subjectName}
                        </span>
                      </td>

                      <td>{item.room || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
