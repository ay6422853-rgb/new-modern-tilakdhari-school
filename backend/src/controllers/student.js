import {
  Student,
  Attendance,
  Payment,
  Homework,
  Mark,
  Notice,
  Exam,
  Timetable
} from "../models/index.js";

async function getStudent(req) {
  return Student.findOne({
    user: req.user._id
  })
    .populate("parent")
    .populate("classId");
}

/*
|--------------------------------------------------------------------------
| TIMETABLE
|--------------------------------------------------------------------------
*/

export async function timetable(req, res) {
  const student = await getStudent(req);

  if (!student) {
    return res.status(404).json({
      message: "Student profile not found"
    });
  }

  if (!student.classId) {
    return res.json([]);
  }

  const timetable = await Timetable.find({
    classId: student.classId._id || student.classId,
    section: student.section,
    active: true
  })
    .populate("subject", "name code")
    .populate("teacher", "name employeeId")
    .sort({
      day: 1,
      period: 1
    });

  res.json(timetable);
}

/*
|--------------------------------------------------------------------------
| DASHBOARD
|--------------------------------------------------------------------------
*/

export async function dashboard(req, res) {
  const student = await getStudent(req);

  if (!student) {
    return res.status(404).json({
      message: "Student profile not found"
    });
  }

  const [
    attendance,
    payments,
    homework,
    marks,
    exams,
    notices
  ] = await Promise.all([
    Attendance.find({
      student: student._id
    })
      .sort({ date: -1 })
      .limit(100),

    Payment.find({
      student: student._id
    })
      .sort({ date: -1 })
      .limit(100),

    Homework.find({
      classId: student.classId
    })
      .populate("subject")
      .sort({ dueDate: -1 })
      .limit(100),

    Mark.find({
      student: student._id
    })
      .populate("exam")
      .populate("subject")
      .sort({ createdAt: -1 })
      .limit(100),

    Exam.find({
      classId: student.classId
    })
      .populate("subjects")
      .sort({ date: 1 })
      .limit(50),

    Notice.find({
      published: true,
      $or: [
        { audience: { $size: 0 } },
        { audience: { $in: ["STUDENT", "ALL"] } }
      ]
    })
      .sort({ publishedAt: -1 })
      .limit(50)
  ]);

  res.json({
    student,
    attendance,
    payments,
    homework,
    marks,
    exams,
    notices
  });
}

/*
|--------------------------------------------------------------------------
| PROFILE
|--------------------------------------------------------------------------
*/

export async function profile(req, res) {
  const student = await getStudent(req);

  if (!student) {
    return res.status(404).json({
      message: "Student profile not found"
    });
  }

  res.json(student);
}

/*
|--------------------------------------------------------------------------
| ATTENDANCE
|--------------------------------------------------------------------------
*/

export async function attendance(req, res) {
  res.json(
    await Attendance.find({
      student: req.user.profileRef
    }).sort({ date: -1 })
  );
}

/*
|--------------------------------------------------------------------------
| FEES
|--------------------------------------------------------------------------
*/

export async function fees(req, res) {
  try {
    const payments = await Payment.find({
      student: req.user.profileRef
    })
      .populate(
        "student",
        "studentId registrationNo admissionNo name fatherName motherName className section rollNo session phone email address"
      )
      .sort({ date: -1 });

    res.json(payments);
  } catch (error) {
    console.error("Student fees error:", error);

    res.status(500).json({
      message: error?.message || "Fees load nahi ho paayi."
    });
  }
}

/*
|--------------------------------------------------------------------------
| HOMEWORK
|--------------------------------------------------------------------------
*/

export async function homework(req, res) {
  const student = await getStudent(req);

  if (!student) {
    return res.status(404).json({
      message: "Student profile not found"
    });
  }

  res.json(
    await Homework.find({
      classId: student.classId
    })
      .populate("subject")
      .sort({ dueDate: -1 })
  );
}

/*
|--------------------------------------------------------------------------
| RESULTS
|--------------------------------------------------------------------------
*/

export async function results(req, res) {
  res.json(
    await Mark.find({
      student: req.user.profileRef
    })
      .populate("exam")
      .populate("subject")
      .sort({ createdAt: -1 })
  );
}

/*
|--------------------------------------------------------------------------
| EXAMS
|--------------------------------------------------------------------------
*/

export async function exams(req, res) {
  const student = await getStudent(req);

  if (!student) {
    return res.status(404).json({
      message: "Student profile not found"
    });
  }

  res.json(
    await Exam.find({
      classId: student.classId
    })
      .populate("subjects")
      .sort({ date: 1 })
  );
}

/*
|--------------------------------------------------------------------------
| NOTICES
|--------------------------------------------------------------------------
*/

export async function notices(req, res) {
  res.json(
    await Notice.find({
      published: true,
      $or: [
        { audience: { $size: 0 } },
        { audience: { $in: ["STUDENT", "ALL"] } }
      ]
    })
      .sort({ publishedAt: -1 })
  );
}