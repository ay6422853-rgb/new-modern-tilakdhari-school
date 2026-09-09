import {
  Parent,
  Student,
  Attendance,
  Payment,
  Homework,
  Mark,
  Notice,
  Exam
} from "../models/index.js";

async function getParent(req) {
  return Parent.findOne({
    user: req.user._id
  }).populate("students");
}

/*
|--------------------------------------------------------------------------
| DASHBOARD
|--------------------------------------------------------------------------
*/

export async function dashboard(req, res) {
  const parent = await getParent(req);

  if (!parent) {
    return res.status(404).json({
      message: "Parent profile not found"
    });
  }

  const ids = parent.students.map(
    student => student._id
  );

  const classes = parent.students
    .map(student => student.classId)
    .filter(Boolean);

  const [
    attendance,
    payments,
    homework,
    marks,
    notices
  ] = await Promise.all([
    Attendance.find({
      student: { $in: ids }
    })
      .sort({ date: -1 })
      .limit(100),

    Payment.find({
      student: { $in: ids }
    })
      .sort({ date: -1 })
      .limit(100),

    Homework.find({
      classId: { $in: classes }
    })
      .populate("subject")
      .sort({ dueDate: -1 })
      .limit(100),

    Mark.find({
      student: { $in: ids }
    })
      .populate("exam")
      .populate("subject")
      .sort({ createdAt: -1 })
      .limit(100),

    Notice.find({
      published: true,
      $or: [
        { audience: { $size: 0 } },
        { audience: { $in: ["PARENT", "ALL"] } }
      ]
    })
      .sort({ publishedAt: -1 })
      .limit(50)
  ]);

  res.json({
    parent,
    children: parent.students,
    attendance,
    payments,
    homework,
    marks,
    notices
  });
}

/*
|--------------------------------------------------------------------------
| PROFILE
|--------------------------------------------------------------------------
*/

export async function profile(req, res) {
  const parent = await getParent(req);

  if (!parent) {
    return res.status(404).json({
      message: "Parent profile not found"
    });
  }

  res.json(parent);
}

/*
|--------------------------------------------------------------------------
| CHILDREN
|--------------------------------------------------------------------------
*/

export async function children(req, res) {
  const parent = await getParent(req);

  if (!parent) {
    return res.status(404).json({
      message: "Parent profile not found"
    });
  }

  res.json(parent.students);
}

export async function child(req, res) {
  const parent = await getParent(req);

  if (!parent) {
    return res.status(404).json({
      message: "Parent profile not found"
    });
  }

  const allowed = parent.students.some(
    student =>
      String(student._id) ===
      String(req.params.id)
  );

  if (!allowed) {
    return res.status(403).json({
      message: "Access denied"
    });
  }

  const student = await Student.findById(
    req.params.id
  )
    .populate("parent")
    .populate("classId");

  res.json(student);
}

/*
|--------------------------------------------------------------------------
| ATTENDANCE
|--------------------------------------------------------------------------
*/

export async function attendance(req, res) {
  const parent = await getParent(req);

  if (!parent) {
    return res.status(404).json({
      message: "Parent profile not found"
    });
  }

  res.json(
    await Attendance.find({
      student: {
        $in: parent.students.map(x => x._id)
      }
    })
      .populate("student")
      .sort({ date: -1 })
  );
}

/*
|--------------------------------------------------------------------------
| FEES
|--------------------------------------------------------------------------
*/

export async function fees(req, res) {
  const parent = await getParent(req);

  if (!parent) {
    return res.status(404).json({
      message: "Parent profile not found"
    });
  }

  res.json(
    await Payment.find({
      student: {
        $in: parent.students.map(x => x._id)
      }
    })
      .populate("student")
      .sort({ date: -1 })
  );
}

/*
|--------------------------------------------------------------------------
| HOMEWORK
|--------------------------------------------------------------------------
*/

export async function homework(req, res) {
  const parent = await getParent(req);

  if (!parent) {
    return res.status(404).json({
      message: "Parent profile not found"
    });
  }

  const classes = parent.students
    .map(x => x.classId)
    .filter(Boolean);

  res.json(
    await Homework.find({
      classId: { $in: classes }
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
  const parent = await getParent(req);

  if (!parent) {
    return res.status(404).json({
      message: "Parent profile not found"
    });
  }

  res.json(
    await Mark.find({
      student: {
        $in: parent.students.map(x => x._id)
      }
    })
      .populate("student")
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
  const parent = await getParent(req);

  const classes = parent.students
    .map(x => x.classId)
    .filter(Boolean);

  res.json(
    await Exam.find({
      classId: { $in: classes }
    })
      .populate("classId")
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
        { audience: { $in: ["PARENT", "ALL"] } }
      ]
    })
      .sort({ publishedAt: -1 })
  );
}