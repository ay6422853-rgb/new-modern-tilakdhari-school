
import { useEffect, useMemo, useState } from "react";
import api from "../../api";
import "./StudentCommon.css";

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

function Timetable() {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState("Monday");

  useEffect(() => {
    loadTimetable();
  }, []);

  const loadTimetable = async () => {
    try {
      const res = await api.get("/student/timetable");
      setTimetable(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const dayEntries = useMemo(() => {
    return timetable
      .filter((item) => item.day === selectedDay)
      .sort((a, b) => Number(a.period) - Number(b.period));
  }, [timetable, selectedDay]);

  return (
    <div className="student-page">
      <div className="student-page-header">
        <div>
          <span className="student-eyebrow">ACADEMICS</span>
          <h1>Class Timetable</h1>
          <p>Your weekly class schedule.</p>
        </div>

        <button className="student-refresh-btn" onClick={loadTimetable}>
          ↻ Refresh
        </button>
      </div>

      <div className="student-day-tabs">
        {days.map((day) => (
          <button
            key={day}
            className={
              selectedDay === day
                ? "student-day-tab active"
                : "student-day-tab"
            }
            onClick={() => setSelectedDay(day)}
          >
            {day.slice(0, 3)}
          </button>
        ))}
      </div>

      <section className="student-card">
        <div className="student-card-header">
          <div>
            <h3>{selectedDay}</h3>
            <p>{dayEntries.length} scheduled periods</p>
          </div>
        </div>

        {loading ? (
          <div className="student-loading">Loading timetable...</div>
        ) : dayEntries.length === 0 ? (
          <div className="student-empty">
            No classes scheduled for {selectedDay}.
          </div>
        ) : (
          <div className="student-timetable">
            {dayEntries.map((item) => (
              <div className="student-period-card" key={item._id}>
                <div className="student-period-number">
                  <span>Period</span>
                  <strong>{item.period}</strong>
                </div>

                <div className="student-period-info">
                  <strong>
                    {item.subject?.name ||
                      item.subjectName ||
                      "Subject"}
                  </strong>

                  <span>
                    {item.teacher?.name ||
                      item.teacherName ||
                      "Teacher not assigned"}
                  </span>
                </div>

                <div className="student-period-time">
                  <strong>
                    {item.startTime || "--:--"}{" "}
                    {item.endTime ? `- ${item.endTime}` : ""}
                  </strong>

                  <span>
                    {item.room ? `Room ${item.room}` : "Room not set"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Timetable;
