
import mongoose from "mongoose";

import {
  Teacher,
  Student,
  Attendance,
  Exam,
  Mark,
  Homework,
  Notice,
  ClassRoom,
  Subject,
  Timetable,
} from "../models/index.js";

/* =========================================================
   HELPERS
========================================================= */

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const getTeacher = async (req) => {
  if (!req.user?._id) return null;

  return Teacher.findOne({
    user: req.user._id,
    active: true,
  })
    .populate("subjects")
    .populate("user", "name email phone role");
};

/*
  IMPORTANT:
  Teaching classes are NOT taken from Teacher.classes.

  Timetable is the source of truth.
  Timetable.teacher stores Teacher._id.
*/
async function getTeachingClasses(teacherId) {
  if (!teacherId || !isValidObjectId(teacherId)) {
    return [];
  }

  const timetableEntries = await Timetable.find({
    teacher: teacherId,
    active: true,
  })
    .populate("classId", "name classCode sections active")
    .lean();

  const map = new Map();

  for (const entry of timetableEntries) {
    if (!entry.classId) continue;

    const classId = String(entry.classId._id);

    if (!map.has(classId)) {
      map.set(classId, {
        ...entry.classId,
      });
    }
  }

  return Array.from(map.values());
}

async function getTeachingClassIds(teacherId) {
  const classes = await getTeachingClasses(teacherId);

  return classes.map((item) => item._id);
}

async function isTeachingClass(teacherId, classId) {
  if (
    !teacherId ||
    !classId ||
    !isValidObjectId(teacherId) ||
    !isValidObjectId(classId)
  ) {
    return false;
  }

  const timetable = await Timetable.exists({
    teacher: teacherId,
    classId,
    active: true,
  });

  return !!timetable;
}

async function getClassTeacherClasses(teacher) {
  if (!teacher?._id) return [];

  return ClassRoom.find({
    classTeacher: teacher._id,
    active: true,
  }).lean();
}

async function getClassTeacherClassIds(teacher) {
  const classes = await getClassTeacherClasses(teacher);

  return classes.map((item) => item._id);
}

async function isClassTeacher(teacherId, classId) {
  if (
    !teacherId ||
    !classId ||
    !isValidObjectId(teacherId) ||
    !isValidObjectId(classId)
  ) {
    return false;
  }

  const classroom = await ClassRoom.exists({
    _id: classId,
    classTeacher: teacherId,
    active: true,
  });

  return !!classroom;
}

function calculateGrade(marks, maxMarks) {
  const percentage =
    maxMarks > 0 ? (Number(marks) / Number(maxMarks)) * 100 : 0;

  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C";
  if (percentage >= 40) return "D";
  return "F";
}

/* =========================================================
   DASHBOARD
========================================================= */

export const dashboard = async (req, res) => {
  try {
    const teacher = await getTeacher(req);

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher profile not found",
      });
    }

    const classTeacherClasses = await getClassTeacherClasses(teacher);
    const teachingClasses = await getTeachingClasses(teacher._id);

    const classTeacherClassIds = classTeacherClasses.map(
      (item) => item._id
    );

    const teachingClassIds = teachingClasses.map(
      (item) => item._id
    );

    const classTeacherStudents = await Student.countDocuments({
      classId: { $in: classTeacherClassIds },
      active: true,
    });

    const teachingStudents = await Student.countDocuments({
      classId: { $in: teachingClassIds },
      active: true,
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayAttendance = await Attendance.countDocuments({
      markedBy: req.user._id,
      date: {
        $gte: todayStart,
        $lte: todayEnd,
      },
    });

    const homeworkCount = await Homework.countDocuments({
      createdBy: req.user._id,
    });

    const noticeCount = await Notice.countDocuments({
      published: true,
      audience: {
        $in: ["TEACHER", "ALL"],
      },
    });

    return res.json({
      teacher,
      stats: {
        classTeacherClasses: classTeacherClasses.length,
        teachingClasses: teachingClasses.length,
        classTeacherStudents,
        teachingStudents,
        todayAttendance,
        homeworkCount,
        noticeCount,
      },
      classTeacherClasses,
      teachingClasses,
    });
  } catch (error) {
    console.error("Teacher dashboard error:", error);

    return res.status(500).json({
      message: "Failed to load teacher dashboard",
      error: error.message,
    });
  }
};

/* =========================================================
   PROFILE
========================================================= */

export const profile = async (req, res) => {
  try {
    const teacher = await getTeacher(req);

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher profile not found",
      });
    }

    return res.json({
      teacher,
    });
  } catch (error) {
    console.error("Teacher profile error:", error);

    return res.status(500).json({
      message: "Failed to load teacher profile",
      error: error.message,
    });
  }
};

/* =========================================================
   STUDENTS
========================================================= */

export const students = async (req, res) => {
  try {
    const teacher = await getTeacher(req);

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher profile not found",
      });
    }

    const classTeacherClasses = await getClassTeacherClasses(teacher);
    const teachingClasses = await getTeachingClasses(teacher._id);

    const classTeacherClassIds = classTeacherClasses.map(
      (item) => item._id
    );

    const teachingClassIds = teachingClasses.map(
      (item) => item._id
    );

    const classTeacherStudents = await Student.find({
      classId: {
        $in: classTeacherClassIds,
      },
      active: true,
    })
      .populate("classId", "name classCode")
      .populate("parent", "name phone email")
      .sort({
        name: 1,
      })
      .lean();

    const teachingStudents = await Student.find({
      classId: {
        $in: teachingClassIds,
      },
      active: true,
    })
      .populate("classId", "name classCode")
      .populate("parent", "name phone email")
      .sort({
        name: 1,
      })
      .lean();

    return res.json({
      classTeacherStudents,
      teachingStudents,
      classTeacherClasses,
      teachingClasses,
    });
  } catch (error) {
    console.error("Teacher students error:", error);

    return res.status(500).json({
      message: "Failed to load students",
      error: error.message,
    });
  }
};

/* =========================================================
   ATTENDANCE
========================================================= */

export const attendance = async (req, res) => {
  try {
    const teacher = await getTeacher(req);

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher profile not found",
      });
    }

    const classIds = await getClassTeacherClassIds(teacher);

    const attendance = await Attendance.find({
      classId: {
        $in: classIds,
      },
    })
      .populate("student", "name studentId rollNo className section")
      .populate("classId", "name classCode")
      .populate("markedBy", "name role")
      .sort({
        date: -1,
      })
      .lean();

    return res.json({
      attendance,
    });
  } catch (error) {
    console.error("Teacher attendance error:", error);

    return res.status(500).json({
      message: "Failed to load attendance",
      error: error.message,
    });
  }
};

export const markAttendance = async (req, res) => {
  try {
    const teacher = await getTeacher(req);

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher profile not found",
      });
    }

    const {
      student,
      classId,
      date,
      status,
    } = req.body;

    if (!student || !classId || !date || !status) {
      return res.status(400).json({
        message:
          "student, classId, date and status are required",
      });
    }

    if (!isValidObjectId(student) || !isValidObjectId(classId)) {
      return res.status(400).json({
        message: "Invalid student or class ID",
      });
    }

    const allowed = await isClassTeacher(
      teacher._id,
      classId
    );

    if (!allowed) {
      return res.status(403).json({
        message:
          "You can mark attendance only for your class-teacher class",
      });
    }

    const attendance = await Attendance.findOneAndUpdate(
      {
        student,
        date: new Date(date),
      },
      {
        student,
        classId,
        date: new Date(date),
        status,
        markedBy: req.user._id,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.json({
      message: "Attendance marked successfully",
      attendance,
    });
  } catch (error) {
    console.error("Mark attendance error:", error);

    return res.status(500).json({
      message: "Failed to mark attendance",
      error: error.message,
    });
  }
};

/* =========================================================
   EXAMS
========================================================= */

export const exams = async (req, res) => {
  try {
    const teacher = await getTeacher(req);

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher profile not found",
      });
    }

    /*
      Teacher can access exams for:
      1. Class-teacher classes
      2. Classes assigned through Timetable
    */

    const classTeacherClassIds =
      await getClassTeacherClassIds(teacher);

    const teachingClassIds =
      await getTeachingClassIds(teacher._id);

    const allClassIds = [
      ...classTeacherClassIds,
      ...teachingClassIds,
    ].map(String);

    const uniqueClassIds = [
      ...new Set(allClassIds),
    ];

    const exams = await Exam.find({
      classId: {
        $in: uniqueClassIds,
      },
    })
      .populate("classId", "name classCode")
      .populate("subjects", "name code")
      .populate("createdBy", "name")
      .sort({
        date: -1,
      })
      .lean();

    return res.json({
      exams,
      data: exams,
      results: exams,
    });
  } catch (error) {
    console.error("Teacher exams error:", error);

    return res.status(500).json({
      message: "Failed to load exams",
      error: error.message,
    });
  }
};

/* =========================================================
   MARKS
========================================================= */

export const marks = async (req, res) => {
  try {
    const teacher = await getTeacher(req);

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher profile not found",
      });
    }

    /*
      Teacher can see marks of students belonging to
      class-teacher OR teaching classes.
    */

    const classTeacherClassIds =
      await getClassTeacherClassIds(teacher);

    const teachingClassIds =
      await getTeachingClassIds(teacher._id);

    const allClassIds = [
      ...classTeacherClassIds,
      ...teachingClassIds,
    ].map(String);

    const uniqueClassIds = [
      ...new Set(allClassIds),
    ];

    const students = await Student.find({
      classId: {
        $in: uniqueClassIds,
      },
      active: true,
    }).select(
      "_id name studentId registrationNo admissionNo className section rollNo"
    );

    const studentIds = students.map(
      (student) => student._id
    );

    if (!studentIds.length) {
      return res.json({
        marks: [],
        data: [],
        results: [],
      });
    }

    const marks = await Mark.find({
      student: {
        $in: studentIds,
      },
    })
      .populate(
        "student",
        "name studentId registrationNo admissionNo className section rollNo"
      )
      .populate(
        "exam",
        "name classId className session date published"
      )
      .populate(
        "subject",
        "name code"
      )
      .populate(
        "enteredBy",
        "name role"
      )
      .sort({
        _id: -1,
      })
      .lean();

    return res.json({
      marks,
      data: marks,
      results: marks,
    });
  } catch (error) {
    console.error("Teacher marks error:", error);

    return res.status(500).json({
      message: "Failed to load marks",
      error: error.message,
    });
  }
};

/* =========================================================
   ENTER SINGLE MARK
========================================================= */

export const enterMarks = async (req, res) => {
  try {
    const teacher = await getTeacher(req);

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher profile not found",
      });
    }

    const {
      exam,
      student,
      subject,
      maxMarks,
      marks,
      remarks,
    } = req.body;

    if (
      !exam ||
      !student ||
      !subject ||
      maxMarks === undefined ||
      marks === undefined
    ) {
      return res.status(400).json({
        message:
          "exam, student, subject, maxMarks and marks are required",
      });
    }

    if (
      !isValidObjectId(exam) ||
      !isValidObjectId(student) ||
      !isValidObjectId(subject)
    ) {
      return res.status(400).json({
        message: "Invalid exam, student or subject ID",
      });
    }

    const studentDoc = await Student.findById(student);

    if (!studentDoc) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    const allowed =
      (await isClassTeacher(
        teacher._id,
        studentDoc.classId
      )) ||
      (await isTeachingClass(
        teacher._id,
        studentDoc.classId
      ));

    if (!allowed) {
      return res.status(403).json({
        message:
          "You are not assigned to this student's class",
      });
    }

    const numericMarks = Number(marks);
    const numericMaxMarks = Number(maxMarks);

    if (
      Number.isNaN(numericMarks) ||
      Number.isNaN(numericMaxMarks) ||
      numericMaxMarks <= 0 ||
      numericMarks < 0 ||
      numericMarks > numericMaxMarks
    ) {
      return res.status(400).json({
        message: "Invalid marks or maxMarks",
      });
    }

    const grade = calculateGrade(
      numericMarks,
      numericMaxMarks
    );

    const savedMark = await Mark.findOneAndUpdate(
      {
        exam,
        student,
        subject,
      },
      {
        exam,
        student,
        subject,
        maxMarks: numericMaxMarks,
        marks: numericMarks,
        grade,
        remarks: remarks || "",
        enteredBy: req.user._id,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.json({
      message: "Marks saved successfully",
      mark: savedMark,
    });
  } catch (error) {
    console.error("Enter marks error:", error);

    return res.status(500).json({
      message: "Failed to save marks",
      error: error.message,
    });
  }
};

export const classBulkMarks = async (req, res) => {
  try {
    const teacher = await getTeacher(req);

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher profile not found",
      });
    }

    const {
      classId,
      exam,
      maxMarks = 100,
      marks,
    } = req.body;

    if (
      !classId ||
      !exam ||
      !Array.isArray(marks)
    ) {
      return res.status(400).json({
        message:
          "classId, exam and marks array are required",
      });
    }

    if (
      !isValidObjectId(classId) ||
      !isValidObjectId(exam)
    ) {
      return res.status(400).json({
        message: "Invalid classId or exam",
      });
    }

    /*
      Only class teacher can use this endpoint.
    */

    const allowed = await isClassTeacher(
      teacher._id,
      classId
    );

    if (!allowed) {
      return res.status(403).json({
        message:
          "Only class teacher can enter marks for this class",
      });
    }

    const examDoc = await Exam.findOne({
      _id: exam,
      classId,
    }).lean();

    if (!examDoc) {
      return res.status(404).json({
        message:
          "Exam not found for this class",
      });
    }

    const numericMaxMarks = Number(maxMarks);

    if (
      Number.isNaN(numericMaxMarks) ||
      numericMaxMarks <= 0
    ) {
      return res.status(400).json({
        message: "Invalid maximum marks",
      });
    }

    /*
      Get all subjects of this class.
    */

    const subjects = await Subject.find({
      classIds: classId,
      active: true,
    })
      .select("_id name code")
      .lean();

    const subjectIds = new Set(
      subjects.map((subject) =>
        String(subject._id)
      )
    );

    const students = await Student.find({
      classId,
      active: true,
    })
      .select("_id")
      .lean();

    const studentIds = new Set(
      students.map((student) =>
        String(student._id)
      )
    );

    const operations = [];

    for (const item of marks) {
      if (
        !item.student ||
        !item.subject
      ) {
        continue;
      }

      if (
        !isValidObjectId(item.student) ||
        !isValidObjectId(item.subject)
      ) {
        continue;
      }

      /*
        Security:
        Student must belong to this class.
      */

      if (
        !studentIds.has(
          String(item.student)
        )
      ) {
        continue;
      }

      /*
        Security:
        Subject must belong to this class.
      */

      if (
        !subjectIds.has(
          String(item.subject)
        )
      ) {
        continue;
      }

      /*
        Blank marks are skipped.
      */

      if (
        item.marks === "" ||
        item.marks === null ||
        item.marks === undefined
      ) {
        continue;
      }

      const numericMarks =
        Number(item.marks);

      if (
        Number.isNaN(numericMarks) ||
        numericMarks < 0 ||
        numericMarks > numericMaxMarks
      ) {
        continue;
      }

      operations.push({
        updateOne: {
          filter: {
            exam,
            student: item.student,
            subject: item.subject,
          },

          update: {
            $set: {
              exam,
              student: item.student,
              subject: item.subject,
              maxMarks: numericMaxMarks,
              marks: numericMarks,

              grade: calculateGrade(
                numericMarks,
                numericMaxMarks
              ),

              remarks:
                item.remarks || "",

              enteredBy:
                req.user._id,
            },
          },

          upsert: true,
        },
      });
    }

    if (!operations.length) {
      return res.status(400).json({
        message:
          "No valid marks found to save",
      });
    }

    const result =
      await Mark.bulkWrite(
        operations
      );

    return res.json({
      message:
        "Class marks saved successfully",

      saved:
        operations.length,

      result,
    });
  } catch (error) {
    console.error(
      "Class bulk marks error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to save class marks",

      error: error.message,
    });
  }
};

/* =========================================================
   BULK MARKS
========================================================= */

export const bulkMarks = async (req, res) => {
  try {
    const teacher = await getTeacher(req);

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher profile not found",
      });
    }

    const {
      exam,
      subject,
      maxMarks,
      marks,
    } = req.body;

    if (
      !exam ||
      !subject ||
      maxMarks === undefined ||
      !Array.isArray(marks)
    ) {
      return res.status(400).json({
        message:
          "exam, subject, maxMarks and marks array are required",
      });
    }

    if (
      !isValidObjectId(exam) ||
      !isValidObjectId(subject)
    ) {
      return res.status(400).json({
        message: "Invalid exam or subject ID",
      });
    }

    const numericMaxMarks = Number(maxMarks);

    if (
      Number.isNaN(numericMaxMarks) ||
      numericMaxMarks <= 0
    ) {
      return res.status(400).json({
        message: "Invalid maxMarks",
      });
    }

    const operations = [];

    for (const item of marks) {
      if (!item.student) continue;

      if (!isValidObjectId(item.student)) {
        continue;
      }

      const studentDoc = await Student.findById(
        item.student
      ).select("_id classId");

      if (!studentDoc) continue;

      const allowed =
        (await isClassTeacher(
          teacher._id,
          studentDoc.classId
        )) ||
        (await isTeachingClass(
          teacher._id,
          studentDoc.classId
        ));

      if (!allowed) continue;

      const numericMarks = Number(item.marks);

      if (
        Number.isNaN(numericMarks) ||
        numericMarks < 0 ||
        numericMarks > numericMaxMarks
      ) {
        continue;
      }

      operations.push({
        updateOne: {
          filter: {
            exam,
            student: item.student,
            subject,
          },
          update: {
            $set: {
              exam,
              student: item.student,
              subject,
              maxMarks: numericMaxMarks,
              marks: numericMarks,
              grade: calculateGrade(
                numericMarks,
                numericMaxMarks
              ),
              remarks: item.remarks || "",
              enteredBy: req.user._id,
            },
          },
          upsert: true,
        },
      });
    }

    if (!operations.length) {
      return res.status(400).json({
        message: "No valid marks found",
      });
    }

    const result = await Mark.bulkWrite(operations);

    return res.json({
      message: "Bulk marks saved successfully",
      result,
    });
  } catch (error) {
    console.error("Bulk marks error:", error);

    return res.status(500).json({
      message: "Failed to save bulk marks",
      error: error.message,
    });
  }
};

/* =========================================================
   MARKSHEET
========================================================= */

export const marksheet = async (req, res) => {
  try {
    const teacher = await getTeacher(req);

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher profile not found",
      });
    }

    const {
      studentId,
      examId,
    } = req.query;

    if (
      !studentId ||
      !examId ||
      !isValidObjectId(studentId) ||
      !isValidObjectId(examId)
    ) {
      return res.status(400).json({
        message:
          "Valid studentId and examId are required",
      });
    }

    const student = await Student.findById(studentId)
      .populate("classId", "name classCode");

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    const allowed =
      (await isClassTeacher(
        teacher._id,
        student.classId?._id
      )) ||
      (await isTeachingClass(
        teacher._id,
        student.classId?._id
      ));

    if (!allowed) {
      return res.status(403).json({
        message:
          "You are not assigned to this student's class",
      });
    }

    const examDoc = await Exam.findById(examId)
      .populate("classId", "name classCode")
      .populate("subjects", "name code");

    if (!examDoc) {
      return res.status(404).json({
        message: "Exam not found",
      });
    }

    const marks = await Mark.find({
      exam: examId,
      student: studentId,
    })
      .populate("subject", "name code")
      .sort({
        _id: 1,
      })
      .lean();

    const totalMarks = marks.reduce(
      (sum, item) => sum + Number(item.marks || 0),
      0
    );

    const totalMaxMarks = marks.reduce(
      (sum, item) => sum + Number(item.maxMarks || 0),
      0
    );

    const percentage =
      totalMaxMarks > 0
        ? ((totalMarks / totalMaxMarks) * 100).toFixed(2)
        : "0.00";

    return res.json({
      student,
      exam: examDoc,
      marks,
      summary: {
        totalMarks,
        totalMaxMarks,
        percentage,
        grade: calculateGrade(
          totalMarks,
          totalMaxMarks
        ),
      },
    });
  } catch (error) {
    console.error("Teacher marksheet error:", error);

    return res.status(500).json({
      message: "Failed to load marksheet",
      error: error.message,
    });
  }
};

/* =========================================================
   HOMEWORK
========================================================= */

export const homework = async (req, res) => {
  try {
    const teacher = await getTeacher(req);

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher profile not found",
      });
    }

    const classIds = await getTeachingClassIds(
      teacher._id
    );

    const classTeacherIds =
      await getClassTeacherClassIds(teacher);

    const allClassIds = [
      ...new Set(
        [
          ...classIds,
          ...classTeacherIds,
        ].map(String)
      ),
    ];

    const homework = await Homework.find({
      $or: [
        {
          createdBy: req.user._id,
        },
        {
          classId: {
            $in: allClassIds,
          },
        },
      ],
    })
      .populate("subject", "name code")
      .populate("classId", "name classCode")
      .populate("createdBy", "name role")
      .sort({
        dueDate: 1,
        _id: -1,
      })
      .lean();

    return res.json({
      homework,
    });
  } catch (error) {
    console.error("Teacher homework error:", error);

    return res.status(500).json({
      message: "Failed to load homework",
      error: error.message,
    });
  }
};

export const createHomework = async (req, res) => {
  try {
    const teacher = await getTeacher(req);

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher profile not found",
      });
    }

    const {
      title,
      subject,
      classId,
      className,
      section,
      description,
      dueDate,
    } = req.body;

    if (!title || !subject || !classId) {
      return res.status(400).json({
        message:
          "title, subject and classId are required",
      });
    }

    if (
      !isValidObjectId(subject) ||
      !isValidObjectId(classId)
    ) {
      return res.status(400).json({
        message: "Invalid subject or class ID",
      });
    }

    const allowed =
      (await isTeachingClass(
        teacher._id,
        classId
      )) ||
      (await isClassTeacher(
        teacher._id,
        classId
      ));

    if (!allowed) {
      return res.status(403).json({
        message:
          "You are not assigned to this class",
      });
    }

    const homework = await Homework.create({
      title,
      subject,
      classId,
      className: className || "",
      section: section || "",
      description: description || "",
      dueDate: dueDate || null,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      message: "Homework created successfully",
      homework,
    });
  } catch (error) {
    console.error("Create homework error:", error);

    return res.status(500).json({
      message: "Failed to create homework",
      error: error.message,
    });
  }
};

/* =========================================================
   NOTICES
========================================================= */

export const notices = async (req, res) => {
  try {
    const notices = await Notice.find({
      published: true,
      $or: [
        {
          audience: {
            $size: 0,
          },
        },
        {
          audience: {
            $in: ["TEACHER", "ALL"],
          },
        },
      ],
    })
      .populate("createdBy", "name role")
      .sort({
        publishedAt: -1,
        _id: -1,
      })
      .lean();

    return res.json({
      notices,
      data: notices,
      results: notices,
    });
  } catch (error) {
    console.error("Teacher notices error:", error);

    return res.status(500).json({
      message: "Failed to load notices",
      error: error.message,
    });
  }
};

/* =========================================================
   CLASSES
========================================================= */

export const classes = async (req, res) => {
  try {
    const teacher = await getTeacher(req);

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher profile not found",
      });
    }

    const classTeacherClasses =
      await getClassTeacherClasses(teacher);

    const teachingClasses =
      await getTeachingClasses(teacher._id);

    return res.json({
      classTeacherClasses,
      teachingClasses,
    });
  } catch (error) {
    console.error("Teacher classes error:", error);

    return res.status(500).json({
      message: "Failed to load classes",
      error: error.message,
    });
  }
};

/* =========================================================
   SUBJECTS
========================================================= */

export const subjects = async (req, res) => {
  try {
    const teacher = await getTeacher(req);

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher profile not found",
      });
    }

    const { classId } = req.query;

    /*
      Agar classId diya gaya hai:
      Sirf us class ke subjects return honge.

      IMPORTANT:
      Subject.classIds hi class-subject relation hai.
    */

    if (classId) {
      if (!isValidObjectId(classId)) {
        return res.status(400).json({
          message: "Invalid class ID",
        });
      }

      const allowed = await isClassTeacher(
        teacher._id,
        classId
      );

      if (!allowed) {
        return res.status(403).json({
          message:
            "You can access subjects only for your class-teacher class",
        });
      }

      const classSubjects = await Subject.find({
        classIds: classId,
        active: true,
      })
        .select(
          "_id name code classIds classNames active"
        )
        .sort({
          name: 1,
        })
        .lean();

      return res.json({
        subjects: classSubjects,
        data: classSubjects,
        results: classSubjects,
      });
    }

    /*
      Agar classId nahi diya gaya,
      teacher ke assigned subjects return honge.
    */

    const teacherSubjects = await Teacher.findById(
      teacher._id
    )
      .populate(
        "subjects",
        "name code classIds classNames active"
      )
      .select("subjects")
      .lean();

    return res.json({
      subjects: teacherSubjects?.subjects || [],
      data: teacherSubjects?.subjects || [],
      results: teacherSubjects?.subjects || [],
    });
  } catch (error) {
    console.error(
      "Teacher subjects error:",
      error
    );

    return res.status(500).json({
      message: "Failed to load subjects",
      error: error.message,
    });
  }
};

/* =========================================================
   TIMETABLE
========================================================= */

export const timetable = async (req, res) => {
  try {
    const teacher = await getTeacher(req);

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher profile not found",
      });
    }

    const timetable = await Timetable.find({
      teacher: teacher._id,
      active: true,
    })
      .populate(
        "classId",
        "name classCode sections active"
      )
      .populate(
        "subject",
        "name code active"
      )
      .populate(
        "teacher",
        "name employeeId phone email active"
      )
      .populate(
        "substituteTeacher",
        "name employeeId phone email active"
      )
      .populate(
        "createdBy",
        "name role"
      )
      .sort({
        day: 1,
        period: 1,
      })
      .lean();

    return res.json({
      timetable,
      data: timetable,
      results: timetable,
    });
  } catch (error) {
    console.error("Teacher timetable error:", error);

    return res.status(500).json({
      message: "Failed to load timetable",
      error: error.message,
    });
  }
};
