
import bcrypt from "bcryptjs";

import {
  User,
  Student,
  Teacher,
  Parent,
  ClassRoom,
  Subject,
  Attendance,
  Exam,
  Mark,
  Homework,
  Notice,
  Event,
  Timetable
} from "../models/index.js";

/*
|--------------------------------------------------------------------------
| DASHBOARD
|--------------------------------------------------------------------------
*/

export async function dashboard(req, res) {
  try {
    const [
      students,
      teachers,
      parents,
      classes,
      subjects
    ] = await Promise.all([
      Student.countDocuments(),
      Teacher.countDocuments(),
      Parent.countDocuments(),
      ClassRoom.countDocuments(),
      Subject.countDocuments()
    ]);

    res.json({
      students,
      teachers,
      parents,
      classes,
      subjects
    });
  } catch (error) {
    console.error("DASHBOARD ERROR:", error);

    res.status(500).json({
      message: error.message || "Unable to load dashboard"
    });
  }
}

/*
|--------------------------------------------------------------------------
| STUDENTS
|--------------------------------------------------------------------------
*/

export async function students(req, res) {
  try {
    const data = await Student.find()
      .populate("parent")
      .populate("classId")
      .sort({ createdAt: -1 });

    res.json(data);
  } catch (error) {
    console.error("GET STUDENTS ERROR:", error);

    res.status(500).json({
      message: error.message || "Unable to load students"
    });
  }
}

export async function student(req, res) {
  try {
    const data = await Student.findById(req.params.id)
      .populate("parent")
      .populate("classId");

    if (!data) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    res.json(data);
  } catch (error) {
    console.error("GET STUDENT ERROR:", error);

    res.status(500).json({
      message: error.message || "Unable to load student"
    });
  }
}

export async function createStudent(req, res) {
  try {
    const student = await Student.create(req.body);

    res.status(201).json(student);
  } catch (error) {
    console.error("CREATE STUDENT ERROR:", error);

    res.status(500).json({
      message: error.message || "Unable to create student"
    });
  }
}

export async function updateStudent(req, res) {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!student) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    res.json(student);
  } catch (error) {
    console.error("UPDATE STUDENT ERROR:", error);

    res.status(500).json({
      message: error.message || "Unable to update student"
    });
  }
}

/*
|--------------------------------------------------------------------------
| TEACHERS
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| GET ALL TEACHERS
|--------------------------------------------------------------------------
*/

export async function teachers(req, res) {
  try {
    const data = await Teacher.find()
      .populate("subjects", "name code")
      .populate("classes", "name classCode")
      .sort({ createdAt: -1 });

    res.json(data);
  } catch (error) {
    console.error("GET TEACHERS ERROR:", error);

    res.status(500).json({
      message:
        error.message ||
        "Unable to load teachers"
    });
  }
}

/*
|--------------------------------------------------------------------------
| CREATE TEACHER
|--------------------------------------------------------------------------
*/

export async function createTeacher(req, res) {
  try {
    const {
      name,
      employeeId,
      phone,
      email,
      gender,
      dob,
      qualification,
      experience,
      subjects = [],
      classes = [],
      className,
      section,
      joiningDate,
      address,
      status = "Active"
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        message: "Teacher name is required"
      });
    }

    if (!email || !String(email).trim()) {
      return res.status(400).json({
        message: "Email is required"
      });
    }

    if (!dob) {
      return res.status(400).json({
        message: "Date of birth is required"
      });
    }

    const teacherEmail = String(email)
      .trim()
      .toLowerCase();

    const existingUser = await User.findOne({
      email: teacherEmail
    });

    if (existingUser) {
      return res.status(409).json({
        message:
          "An account with this email already exists"
      });
    }

    const dobDate = new Date(dob);

    if (Number.isNaN(dobDate.getTime())) {
      return res.status(400).json({
        message: "Invalid date of birth"
      });
    }

    const year = dobDate.getUTCFullYear();

    const month = String(
      dobDate.getUTCMonth() + 1
    ).padStart(2, "0");

    const day = String(
      dobDate.getUTCDate()
    ).padStart(2, "0");

    const initialPassword =
      `${day}${month}${year}`;

    const hashedPassword =
      await bcrypt.hash(
        initialPassword,
        10
      );

    const user = await User.create({
      name: String(name).trim(),

      email: teacherEmail,

      phone: phone
        ? String(phone).trim()
        : "",

      password: hashedPassword,

      role: "TEACHER",

      active: true,

      mustChangePassword: true
    });

    const teacher = await Teacher.create({
      name: String(name).trim(),

      employeeId: employeeId
        ? String(employeeId).trim()
        : "",

      phone: phone
        ? String(phone).trim()
        : "",

      email: teacherEmail,

      gender: gender || "",

      dob: dobDate,

      qualification:
        qualification || "",

      experience:
        experience || "",

      subjects:
        Array.isArray(subjects)
          ? subjects
          : [],

      classes:
        Array.isArray(classes)
          ? classes
          : [],

      className:
        className || "",

      section:
        section || "",

      joiningDate:
        joiningDate
          ? new Date(joiningDate)
          : null,

      address:
        address || "",

      status:
        status || "Active",

      active: true,

      user: user._id
    });

    const result =
      await Teacher.findById(
        teacher._id
      )
        .populate(
          "subjects",
          "name code"
        )
        .populate(
          "classes",
          "name classCode"
        );

    res.status(201).json({
      teacher: result,

      login: {
        email: teacherEmail,
        initialPassword,
        mustChangePassword: true
      }
    });
  } catch (error) {
    console.error(
      "CREATE TEACHER ERROR:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Unable to create teacher"
    });
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE TEACHER
|--------------------------------------------------------------------------
*/

export async function updateTeacher(req, res) {
  try {
    const teacher =
      await Teacher.findById(
        req.params.id
      );

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher not found"
      });
    }

    const {
      name,
      employeeId,
      phone,
      email,
      gender,
      dob,
      qualification,
      experience,
      subjects,
      classes,
      className,
      section,
      joiningDate,
      address,
      status
    } = req.body;

    if (name !== undefined) {
      teacher.name =
        String(name).trim();
    }

    if (employeeId !== undefined) {
      teacher.employeeId =
        String(employeeId).trim();
    }

    if (phone !== undefined) {
      teacher.phone =
        String(phone).trim();
    }

    if (email !== undefined) {
      teacher.email =
        String(email)
          .trim()
          .toLowerCase();
    }

    if (gender !== undefined) {
      teacher.gender = gender;
    }

    if (dob !== undefined && dob) {
      const dobDate = new Date(dob);

      if (Number.isNaN(dobDate.getTime())) {
        return res.status(400).json({
          message: "Invalid date of birth"
        });
      }

      teacher.dob = dobDate;
    }

    if (qualification !== undefined) {
      teacher.qualification =
        qualification;
    }

    if (experience !== undefined) {
      teacher.experience =
        experience;
    }

    if (subjects !== undefined) {
      teacher.subjects =
        Array.isArray(subjects)
          ? subjects
          : [];
    }

    if (classes !== undefined) {
      teacher.classes =
        Array.isArray(classes)
          ? classes
          : [];
    }

    if (className !== undefined) {
      teacher.className =
        className;
    }

    if (section !== undefined) {
      teacher.section =
        section;
    }

    if (
      joiningDate !== undefined &&
      joiningDate
    ) {
      const joiningDateValue =
        new Date(joiningDate);

      if (
        Number.isNaN(
          joiningDateValue.getTime()
        )
      ) {
        return res.status(400).json({
          message: "Invalid joining date"
        });
      }

      teacher.joiningDate =
        joiningDateValue;
    }

    if (address !== undefined) {
      teacher.address =
        address;
    }

    if (status !== undefined) {
      teacher.status =
        status;
    }

    let user = null;

    if (teacher.user) {
      user =
        await User.findById(
          teacher.user
        );
    }

    if (user) {
      if (email !== undefined) {
        const newEmail =
          String(email)
            .trim()
            .toLowerCase();

        const duplicate =
          await User.findOne({
            email: newEmail,
            _id: {
              $ne: user._id
            }
          });

        if (duplicate) {
          return res.status(409).json({
            message:
              "Another account already uses this email"
          });
        }

        user.email = newEmail;
      }

      if (name !== undefined) {
        user.name =
          String(name).trim();
      }

      if (phone !== undefined) {
        user.phone =
          String(phone).trim();
      }

      await user.save();
    }

    await teacher.save();

    const result =
      await Teacher.findById(
        teacher._id
      )
        .populate(
          "subjects",
          "name code"
        )
        .populate(
          "classes",
          "name classCode"
        );

    res.json(result);
  } catch (error) {
    console.error(
      "UPDATE TEACHER ERROR:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Unable to update teacher"
    });
  }
}

/*
|--------------------------------------------------------------------------
| DELETE TEACHER
|--------------------------------------------------------------------------
*/

export async function deleteTeacher(req, res) {
  try {
    const teacher =
      await Teacher.findById(
        req.params.id
      );

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher not found"
      });
    }

    if (teacher.user) {
      await User.findByIdAndDelete(
        teacher.user
      );
    } else if (teacher.email) {
      await User.findOneAndDelete({
        email:
          String(teacher.email)
            .trim()
            .toLowerCase(),

        role: "TEACHER"
      });
    }

    await Teacher.findByIdAndDelete(
      teacher._id
    );

    res.json({
      message:
        "Teacher and login account deleted successfully"
    });
  } catch (error) {
    console.error(
      "DELETE TEACHER ERROR:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Unable to delete teacher"
    });
  }
}

/*
|--------------------------------------------------------------------------
| CLASSES
|--------------------------------------------------------------------------
*/

export async function classes(req, res) {
  try {
    const data =
      await ClassRoom.find()
        .populate("classTeacher")
        .sort({ name: 1 });

    res.json(data);
  } catch (error) {
    console.error(
      "GET CLASSES ERROR:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Unable to load classes"
    });
  }
}

export async function createClass(req, res) {
  try {
    const data =
      await ClassRoom.create(
        req.body
      );

    res.status(201).json(data);
  } catch (error) {
    console.error(
      "CREATE CLASS ERROR:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Unable to create class"
    });
  }
}

export async function updateClass(req, res) {
  try {
    const data =
      await ClassRoom.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true
        }
      );

    if (!data) {
      return res.status(404).json({
        message: "Class not found"
      });
    }

    res.json(data);
  } catch (error) {
    console.error(
      "UPDATE CLASS ERROR:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Unable to update class"
    });
  }
}

/*
|--------------------------------------------------------------------------
| SUBJECTS
|--------------------------------------------------------------------------
*/

export async function subjects(req, res) {
  try {
    const data =
      await Subject.find()
        .populate("classIds")
        .sort({ name: 1 });

    res.json(data);
  } catch (error) {
    console.error(
      "GET SUBJECTS ERROR:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Unable to load subjects"
    });
  }
}

export async function createSubject(req, res) {
  try {
    const {
      name,
      code,
      classIds = [],
      classNames = []
    } = req.body;

    if (
      !name ||
      !String(name).trim()
    ) {
      return res.status(400).json({
        message:
          "Subject name is required"
      });
    }

    const subject =
      await Subject.create({
        name:
          String(name).trim(),

        code:
          code
            ? String(code).trim()
            : "",

        classIds,

        classNames
      });

    res.status(201).json(
      subject
    );
  } catch (error) {
    console.error(
      "CREATE SUBJECT ERROR:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Unable to create subject"
    });
  }
}

export async function updateSubject(req, res) {
  try {
    const subject =
      await Subject.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true
        }
      );

    if (!subject) {
      return res.status(404).json({
        message:
          "Subject not found"
      });
    }

    res.json(subject);
  } catch (error) {
    console.error(
      "UPDATE SUBJECT ERROR:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Unable to update subject"
    });
  }
}

/*
|--------------------------------------------------------------------------
| ATTENDANCE
|--------------------------------------------------------------------------
*/

export async function attendance(req, res) {
  try {
    const data =
      await Attendance.find()
        .populate("student")
        .populate("classId")
        .populate(
          "markedBy",
          "name"
        )
        .sort({
          date: -1
        });

    res.json(data);
  } catch (error) {
    console.error(
      "GET ATTENDANCE ERROR:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Unable to load attendance"
    });
  }
}

export async function markAttendance(req, res) {
  try {
    const {
      student,
      classId,
      date,
      status
    } = req.body;

    if (!student) {
      return res.status(400).json({
        message:
          "Student is required"
      });
    }

    if (!date) {
      return res.status(400).json({
        message:
          "Date is required"
      });
    }

    if (!status) {
      return res.status(400).json({
        message:
          "Attendance status is required"
      });
    }

    const attendanceDate =
      new Date(date);

    if (
      Number.isNaN(
        attendanceDate.getTime()
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid attendance date"
      });
    }

    const data =
      await Attendance.findOneAndUpdate(
        {
          student,
          date: attendanceDate
        },
        {
          ...req.body,
          markedBy:
            req.user._id
        },
        {
          upsert: true,
          new: true,
          runValidators: true
        }
      );

    res.status(201).json(
      data
    );
  } catch (error) {
    console.error(
      "MARK ATTENDANCE ERROR:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Unable to mark attendance"
    });
  }
}

/*
|--------------------------------------------------------------------------
| EXAMS
|--------------------------------------------------------------------------
*/

export async function exams(req, res) {
  try {
    const data =
      await Exam.find()
        .populate("classId")
        .populate("subjects")
        .populate(
          "createdBy",
          "name role"
        )
        .sort({
          date: -1
        });

    res.json(data);
  } catch (error) {
    console.error(
      "GET EXAMS ERROR:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Unable to load exams"
    });
  }
}

export async function createExam(req, res) {
  try {
    const {
      name,
      classId,
      className,
      session,
      date,
      subjects = []
    } = req.body;

    if (
      !name ||
      !String(name).trim()
    ) {
      return res.status(400).json({
        message:
          "Exam name is required"
      });
    }

    if (!classId) {
      return res.status(400).json({
        message:
          "Class is required"
      });
    }

    const exam =
      await Exam.create({
        name:
          String(name).trim(),

        classId,

        className,

        session,

        date,

        subjects,

        createdBy:
          req.user._id
      });

    res.status(201).json(
      exam
    );
  } catch (error) {
    console.error(
      "CREATE EXAM ERROR:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Unable to create exam"
    });
  }
}

export async function updateExam(req, res) {
  try {
    const exam =
      await Exam.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true
        }
      );

    if (!exam) {
      return res.status(404).json({
        message:
          "Exam not found"
      });
    }

    res.json(exam);
  } catch (error) {
    console.error(
      "UPDATE EXAM ERROR:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Unable to update exam"
    });
  }
}

export async function publishExam(req, res) {
  try {
    const exam =
      await Exam.findById(
        req.params.id
      );

    if (!exam) {
      return res.status(404).json({
        message:
          "Exam not found"
      });
    }

    exam.published = true;

    await exam.save();

    res.json({
      message:
        "Exam published successfully",

      exam
    });
  } catch (error) {
    console.error(
      "PUBLISH EXAM ERROR:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Unable to publish exam"
    });
  }
}

/*
|--------------------------------------------------------------------------
| MARKS
|--------------------------------------------------------------------------
*/

/*
 * GET ALL MARKS
 *
 * Teacher aur Computer Operator dono
 * same Mark collection use karte hain.
 *
 * GET /operator/marks
 *
 * Existing teacher-uploaded marks bhi
 * yahin se milenge.
 */

export async function marks(req, res) {
  try {
    const data =
      await Mark.find({})
        .populate({
          path: "student",
          select:
            "name studentId registrationNo admissionNo fatherName classId className section rollNo session"
        })
        .populate({
          path: "exam",
          select:
            "name classId className session date subjects published"
        })
        .populate({
          path: "subject",
          select:
            "name code classIds classNames"
        })
        .populate({
          path: "enteredBy",
          select:
            "name role"
        })
        .sort({
          createdAt: -1
        })
        .lean();

    console.log(
      `OPERATOR MARKS: ${data.length} records found`
    );

    return res.json({
      marks: data,
      total: data.length
    });
  } catch (error) {
    console.error(
      "GET OPERATOR MARKS ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to load marks",

      error:
        error.message
    });
  }
}

/*
|--------------------------------------------------------------------------
| ENTER / UPDATE SINGLE MARK
|--------------------------------------------------------------------------
*/

export async function enterMarks(req, res) {
  try {
    const {
      exam,
      student,
      subject,
      maxMarks,
      marks,
      grade = "",
      remarks = ""
    } = req.body;

    if (!exam) {
      return res.status(400).json({
        message:
          "Exam is required"
      });
    }

    if (!student) {
      return res.status(400).json({
        message:
          "Student is required"
      });
    }

    if (!subject) {
      return res.status(400).json({
        message:
          "Subject is required"
      });
    }

    const maximum =
      Number(maxMarks);

    const obtained =
      Number(marks);

    if (
      !Number.isFinite(maximum) ||
      maximum <= 0
    ) {
      return res.status(400).json({
        message:
          "Invalid maximum marks"
      });
    }

    if (
      !Number.isFinite(obtained) ||
      obtained < 0 ||
      obtained > maximum
    ) {
      return res.status(400).json({
        message:
          "Invalid obtained marks"
      });
    }

    const mark =
      await Mark.findOneAndUpdate(
        {
          exam,
          student,
          subject
        },
        {
          $set: {
            exam,
            student,
            subject,
            maxMarks:
              maximum,
            marks:
              obtained,
            grade,
            remarks,
            enteredBy:
              req.user._id
          }
        },
        {
          upsert: true,
          new: true,
          runValidators: true
        }
      );

    return res.status(201).json({
      message:
        "Mark saved successfully",

      mark
    });
  } catch (error) {
    console.error(
      "ENTER MARK ERROR:",
      error
    );

    return res.status(500).json({
      message:
        error.message ||
        "Unable to save mark"
    });
  }
}

/*
|--------------------------------------------------------------------------
| BULK ENTER / UPDATE MARKS
|--------------------------------------------------------------------------
*/

export async function bulkEnterMarks(req, res) {
  try {
    const {
      exam,
      subject,
      maxMarks,
      marks = []
    } = req.body;

    if (!exam) {
      return res.status(400).json({
        message:
          "Exam is required"
      });
    }

    if (!subject) {
      return res.status(400).json({
        message:
          "Subject is required"
      });
    }

    const maximum =
      Number(maxMarks);

    if (
      !Number.isFinite(maximum) ||
      maximum <= 0
    ) {
      return res.status(400).json({
        message:
          "Invalid maximum marks"
      });
    }

    if (
      !Array.isArray(marks) ||
      marks.length === 0
    ) {
      return res.status(400).json({
        message:
          "No marks data provided"
      });
    }

    for (const item of marks) {
      if (!item.student) {
        return res.status(400).json({
          message:
            "Student is required"
        });
      }

      const obtained =
        Number(item.marks);

      if (
        !Number.isFinite(obtained) ||
        obtained < 0 ||
        obtained > maximum
      ) {
        return res.status(400).json({
          message:
            `Invalid marks for student ${item.student}`
        });
      }
    }

    const operations =
      marks.map(
        (item) => ({
          updateOne: {
            filter: {
              exam,
              student:
                item.student,
              subject
            },

            update: {
              $set: {
                exam,
                student:
                  item.student,
                subject,
                maxMarks:
                  maximum,
                marks:
                  Number(
                    item.marks
                  ),
                grade:
                  item.grade || "",
                remarks:
                  item.remarks || "",
                enteredBy:
                  req.user._id
              }
            },

            upsert: true
          }
        })
      );

    const result =
      await Mark.bulkWrite(
        operations
      );

    return res.status(201).json({
      message:
        "Marks saved successfully",

      total:
        marks.length,

      inserted:
        result.upsertedCount || 0,

      updated:
        result.modifiedCount || 0
    });
  } catch (error) {
    console.error(
      "BULK MARKS ERROR:",
      error
    );

    return res.status(500).json({
      message:
        error.message ||
        "Unable to save bulk marks"
    });
  }
}

/*
|--------------------------------------------------------------------------
| HOMEWORK
|--------------------------------------------------------------------------
*/

export async function homework(req, res) {
  try {
    const data =
      await Homework.find()
        .populate("classId")
        .populate("subject")
        .sort({
          dueDate: -1
        });

    res.json(data);
  } catch (error) {
    console.error(
      "GET HOMEWORK ERROR:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Unable to load homework"
    });
  }
}

export async function createHomework(req, res) {
  try {
    const data =
      await Homework.create({
        ...req.body,
        createdBy:
          req.user._id
      });

    res.status(201).json(data);
  } catch (error) {
    console.error(
      "CREATE HOMEWORK ERROR:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Unable to create homework"
    });
  }
}

/*
|--------------------------------------------------------------------------
| NOTICES
|--------------------------------------------------------------------------
*/

export async function notices(req, res) {
  try {
    const data =
      await Notice.find()
        .populate(
          "createdBy",
          "name role"
        )
        .sort({
          publishedAt: -1
        });

    res.json(data);
  } catch (error) {
    console.error(
      "GET NOTICES ERROR:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Unable to load notices"
    });
  }
}

export async function createNotice(req, res) {
  try {
    const {
      title,
      body,
      audience = [],
      published = false
    } = req.body;

    if (
      !title ||
      !String(title).trim()
    ) {
      return res.status(400).json({
        message:
          "Notice title is required"
      });
    }

    if (
      !body ||
      !String(body).trim()
    ) {
      return res.status(400).json({
        message:
          "Notice body is required"
      });
    }

    const notice =
      await Notice.create({
        title:
          String(title).trim(),

        body:
          String(body).trim(),

        audience,

        published,

        publishedAt:
          published
            ? new Date()
            : null,

        createdBy:
          req.user._id
      });

    res.status(201).json(
      notice
    );
  } catch (error) {
    console.error(
      "CREATE NOTICE ERROR:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Unable to create notice"
    });
  }
}

export async function updateNotice(req, res) {
  try {
    const notice =
      await Notice.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true
        }
      );

    if (!notice) {
      return res.status(404).json({
        message:
          "Notice not found"
      });
    }

    res.json(notice);
  } catch (error) {
    console.error(
      "UPDATE NOTICE ERROR:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Unable to update notice"
    });
  }
}

export async function publishNotice(req, res) {
  try {
    const notice =
      await Notice.findById(
        req.params.id
      );

    if (!notice) {
      return res.status(404).json({
        message:
          "Notice not found"
      });
    }

    notice.published = true;

    notice.publishedAt =
      new Date();

    await notice.save();

    res.json({
      message:
        "Notice published successfully",

      notice
    });
  } catch (error) {
    console.error(
      "PUBLISH NOTICE ERROR:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Unable to publish notice"
    });
  }
}

/*
|--------------------------------------------------------------------------
| EVENTS
|--------------------------------------------------------------------------
*/

export async function events(req, res) {
  try {
    const data =
      await Event.find()
        .populate(
          "createdBy",
          "name role"
        )
        .sort({
          date: -1
        });

    res.json(data);
  } catch (error) {
    console.error(
      "GET EVENTS ERROR:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Unable to load events"
    });
  }
}

export async function createEvent(req, res) {
  try {
    const data =
      await Event.create({
        ...req.body,

        createdBy:
          req.user._id
      });

    res.status(201).json(data);
  } catch (error) {
    console.error(
      "CREATE EVENT ERROR:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Unable to create event"
    });
  }
}

/*
|--------------------------------------------------------------------------
| TIMETABLE
|--------------------------------------------------------------------------
*/

export async function timetable(req, res) {
  try {
    const {
      classId,
      section,
      day,
      session,
      teacher
    } = req.query;

    const filter = {
      active: true
    };

    if (classId) {
      filter.classId =
        classId;
    }

    if (section) {
      filter.section =
        section;
    }

    if (day) {
      filter.day =
        day;
    }

    if (session) {
      filter.session =
        session;
    }

    if (teacher) {
      filter.teacher =
        teacher;
    }

    const data =
      await Timetable.find(
        filter
      )
        .populate(
          "classId",
          "name classCode sections"
        )
        .populate(
          "subject",
          "name code"
        )
        .populate(
          "teacher",
          "name"
        )
        .populate(
          "substituteTeacher",
          "name"
        )
        .populate(
          "createdBy",
          "name role"
        )
        .sort({
          day: 1,
          period: 1,
          startTime: 1
        });

    res.json(data);
  } catch (error) {
    console.error(
      "GET TIMETABLE ERROR:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Unable to load timetable"
    });
  }
}

/*
|--------------------------------------------------------------------------
| SINGLE TIMETABLE ENTRY
|--------------------------------------------------------------------------
*/

export async function timetableEntry(
  req,
  res
) {
  try {
    const data =
      await Timetable.findById(
        req.params.id
      )
        .populate(
          "classId",
          "name classCode sections"
        )
        .populate(
          "subject",
          "name code"
        )
        .populate(
          "teacher",
          "name"
        )
        .populate(
          "substituteTeacher",
          "name"
        )
        .populate(
          "createdBy",
          "name role"
        );

    if (!data) {
      return res.status(404).json({
        message:
          "Timetable entry not found"
      });
    }

    res.json(data);
  } catch (error) {
    console.error(
      "GET TIMETABLE ENTRY ERROR:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Unable to load timetable entry"
    });
  }
}

/*
|--------------------------------------------------------------------------
| TIMETABLE CONFLICT CHECK
|--------------------------------------------------------------------------
*/

async function checkTimetableConflict({
  classId,
  section,
  teacher,
  substituteTeacher,
  room,
  day,
  period,
  excludeId = null
}) {
  const baseFilter = {
    day,
    period,
    active: true
  };

  if (excludeId) {
    baseFilter._id = {
      $ne: excludeId
    };
  }

  /*
  |--------------------------------------------------------------------------
  | CLASS CONFLICT
  |--------------------------------------------------------------------------
  */

  if (classId) {
    const classConflict =
      await Timetable.findOne({
        ...baseFilter,
        classId,
        section
      });

    if (classConflict) {
      return {
        conflict: true,
        type: "CLASS",
        message:
          `This class already has a timetable entry for ${day}, period ${period}.`
      };
    }
  }

  /*
  |--------------------------------------------------------------------------
  | TEACHER CONFLICT
  |--------------------------------------------------------------------------
  */

  if (teacher) {
    const teacherConflict =
      await Timetable.findOne({
        ...baseFilter,

        $or: [
          {
            teacher
          },
          {
            substituteTeacher:
              teacher
          }
        ]
      });

    if (teacherConflict) {
      return {
        conflict: true,
        type: "TEACHER",
        message:
          `This teacher is already assigned on ${day}, period ${period}.`
      };
    }
  }

  /*
  |--------------------------------------------------------------------------
  | SUBSTITUTE TEACHER CONFLICT
  |--------------------------------------------------------------------------
  */

  if (substituteTeacher) {
    const substituteConflict =
      await Timetable.findOne({
        ...baseFilter,

        $or: [
          {
            teacher:
              substituteTeacher
          },
          {
            substituteTeacher
          }
        ]
      });

    if (substituteConflict) {
      return {
        conflict: true,
        type:
          "SUBSTITUTE_TEACHER",

        message:
          `This substitute teacher is already assigned on ${day}, period ${period}.`
      };
    }
  }

  /*
  |--------------------------------------------------------------------------
  | ROOM CONFLICT
  |--------------------------------------------------------------------------
  */

  if (
    room &&
    String(room).trim()
  ) {
    const roomConflict =
      await Timetable.findOne({
        ...baseFilter,

        room:
          String(room).trim()
      });

    if (roomConflict) {
      return {
        conflict: true,
        type: "ROOM",

        message:
          `Room ${room} is already occupied on ${day}, period ${period}.`
      };
    }
  }

  return {
    conflict: false
  };
}

/*
|--------------------------------------------------------------------------
| CREATE TIMETABLE ENTRY
|--------------------------------------------------------------------------
*/

export async function createTimetable(
  req,
  res
) {
  try {
    const {
      classId,
      className,
      section,
      subject,
      subjectName,
      teacher,
      teacherName,
      substituteTeacher,
      day,
      period,
      startTime,
      endTime,
      room,
      session
    } = req.body;

    if (!classId) {
      return res.status(400).json({
        message:
          "Class is required"
      });
    }

    if (!section) {
      return res.status(400).json({
        message:
          "Section is required"
      });
    }

    if (!subject) {
      return res.status(400).json({
        message:
          "Subject is required"
      });
    }

    if (!teacher) {
      return res.status(400).json({
        message:
          "Teacher is required"
      });
    }

    if (!day) {
      return res.status(400).json({
        message:
          "Day is required"
      });
    }

    if (
      period === undefined ||
      period === null ||
      period === ""
    ) {
      return res.status(400).json({
        message:
          "Period is required"
      });
    }

    const conflict =
      await checkTimetableConflict({
        classId,
        section,
        teacher,
        substituteTeacher,
        room,
        day,
        period
      });

    if (conflict.conflict) {
      return res.status(409).json(
        conflict
      );
    }

    const data =
      await Timetable.create({
        classId,

        className,

        section,

        subject,

        subjectName,

        teacher,

        teacherName,

        substituteTeacher:
          substituteTeacher || null,

        day,

        period,

        startTime,

        endTime,

        room,

        session,

        active: true,

        createdBy:
          req.user._id
      });

    const result =
      await Timetable.findById(
        data._id
      )
        .populate(
          "classId",
          "name classCode sections"
        )
        .populate(
          "subject",
          "name code"
        )
        .populate(
          "teacher",
          "name"
        )
        .populate(
          "substituteTeacher",
          "name"
        )
        .populate(
          "createdBy",
          "name role"
        );

    res.status(201).json(
      result
    );
  } catch (error) {
    console.error(
      "CREATE TIMETABLE ERROR:",
      error
    );

    res.status(500).json({
      message:
        "Failed to create timetable entry",

      error:
        error.message
    });
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE TIMETABLE ENTRY
|--------------------------------------------------------------------------
*/

export async function updateTimetable(
  req,
  res
) {
  try {
    const existing =
      await Timetable.findById(
        req.params.id
      );

    if (!existing) {
      return res.status(404).json({
        message:
          "Timetable entry not found"
      });
    }

    const {
      classId,
      className,
      section,
      subject,
      subjectName,
      teacher,
      teacherName,
      substituteTeacher,
      day,
      period,
      startTime,
      endTime,
      room,
      session,
      active
    } = req.body;

    const finalClassId =
      classId ??
      existing.classId;

    const finalSection =
      section ??
      existing.section;

    const finalTeacher =
      teacher ??
      existing.teacher;

    const finalSubstituteTeacher =
      substituteTeacher ??
      existing.substituteTeacher;

    const finalRoom =
      room ??
      existing.room;

    const finalDay =
      day ??
      existing.day;

    const finalPeriod =
      period ??
      existing.period;

    const conflict =
      await checkTimetableConflict({
        classId:
          finalClassId,

        section:
          finalSection,

        teacher:
          finalTeacher,

        substituteTeacher:
          finalSubstituteTeacher,

        room:
          finalRoom,

        day:
          finalDay,

        period:
          finalPeriod,

        excludeId:
          req.params.id
      });

    if (conflict.conflict) {
      return res.status(409).json(
        conflict
      );
    }

    existing.classId =
      finalClassId;

    existing.className =
      className ??
      existing.className;

    existing.section =
      finalSection;

    existing.subject =
      subject ??
      existing.subject;

    existing.subjectName =
      subjectName ??
      existing.subjectName;

    existing.teacher =
      finalTeacher;

    existing.teacherName =
      teacherName ??
      existing.teacherName;

    existing.substituteTeacher =
      finalSubstituteTeacher ||
      null;

    existing.day =
      finalDay;

    existing.period =
      finalPeriod;

    existing.startTime =
      startTime ??
      existing.startTime;

    existing.endTime =
      endTime ??
      existing.endTime;

    existing.room =
      finalRoom;

    existing.session =
      session ??
      existing.session;

    if (
      typeof active === "boolean"
    ) {
      existing.active =
        active;
    }

    await existing.save();

    const result =
      await Timetable.findById(
        existing._id
      )
        .populate(
          "classId",
          "name classCode sections"
        )
        .populate(
          "subject",
          "name code"
        )
        .populate(
          "teacher",
          "name"
        )
        .populate(
          "substituteTeacher",
          "name"
        )
        .populate(
          "createdBy",
          "name role"
        );

    res.json(result);
  } catch (error) {
    console.error(
      "UPDATE TIMETABLE ERROR:",
      error
    );

    res.status(500).json({
      message:
        "Failed to update timetable entry",

      error:
        error.message
    });
  }
}

/*
|--------------------------------------------------------------------------
| DELETE TIMETABLE ENTRY
|--------------------------------------------------------------------------
*/

export async function deleteTimetable(
  req,
  res
) {
  try {
    const data =
      await Timetable.findById(
        req.params.id
      );

    if (!data) {
      return res.status(404).json({
        message:
          "Timetable entry not found"
      });
    }

    data.active = false;

    await data.save();

    res.json({
      message:
        "Timetable entry deleted successfully"
    });
  } catch (error) {
    console.error(
      "DELETE TIMETABLE ERROR:",
      error
    );

    res.status(500).json({
      message:
        "Failed to delete timetable entry",

      error:
        error.message
    });
  }
}

/*
|--------------------------------------------------------------------------
| RESTORE TIMETABLE ENTRY
|--------------------------------------------------------------------------
*/

export async function restoreTimetable(
  req,
  res
) {
  try {
    const data =
      await Timetable.findById(
        req.params.id
      );

    if (!data) {
      return res.status(404).json({
        message:
          "Timetable entry not found"
      });
    }

    const conflict =
      await checkTimetableConflict({
        classId:
          data.classId,

        section:
          data.section,

        teacher:
          data.teacher,

        substituteTeacher:
          data.substituteTeacher,

        room:
          data.room,

        day:
          data.day,

        period:
          data.period,

        excludeId:
          data._id
      });

    if (conflict.conflict) {
      return res.status(409).json(
        conflict
      );
    }

    data.active = true;

    await data.save();

    res.json({
      message:
        "Timetable entry restored successfully",

      data
    });
  } catch (error) {
    console.error(
      "RESTORE TIMETABLE ERROR:",
      error
    );

    res.status(500).json({
      message:
        "Failed to restore timetable entry",

      error:
        error.message
    });
  }
}

/*
|--------------------------------------------------------------------------
| FREE TEACHERS
|--------------------------------------------------------------------------
*/

export async function freeTeachers(
  req,
  res
) {
  try {
    const {
      day,
      period
    } = req.query;

    if (
      !day ||
      period === undefined
    ) {
      return res.status(400).json({
        message:
          "day and period are required"
      });
    }

    const busyEntries =
      await Timetable.find({
        day,
        period,
        active: true
      }).select(
        "teacher substituteTeacher"
      );

    const busyTeacherIds =
      new Set();

    busyEntries.forEach(
      (entry) => {
        if (entry.teacher) {
          busyTeacherIds.add(
            String(
              entry.teacher
            )
          );
        }

        if (
          entry.substituteTeacher
        ) {
          busyTeacherIds.add(
            String(
              entry.substituteTeacher
            )
          );
        }
      }
    );

    const teachers =
      await Teacher.find({
        active: true
      })
        .select("name")
        .sort({
          name: 1
        });

    const free =
      teachers.filter(
        (teacher) =>
          !busyTeacherIds.has(
            String(
              teacher._id
            )
          )
      );

    res.json(free);
  } catch (error) {
    console.error(
      "FREE TEACHERS ERROR:",
      error
    );

    res.status(500).json({
      message:
        "Failed to load free teachers",

      error:
        error.message
    });
  }
}

/*
|--------------------------------------------------------------------------
| ACCOUNT MANAGEMENT
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| UPDATE ACCOUNT
|--------------------------------------------------------------------------
*/

export async function updateAccount(
  req,
  res
) {
  try {
    const {
      name,
      email,
      phone
    } = req.body;

    const user =
      await User.findOne({
        _id:
          req.params.id,

        role: {
          $ne: "PRINCIPAL"
        }
      });

    if (!user) {
      return res.status(404).json({
        message:
          "Account not found"
      });
    }

    if (
      name !== undefined &&
      !String(name).trim()
    ) {
      return res.status(400).json({
        message:
          "Name is required"
      });
    }

    if (name !== undefined) {
      user.name =
        String(name).trim();
    }

    if (email !== undefined) {
      const newEmail =
        String(email)
          .trim()
          .toLowerCase();

      const duplicate =
        await User.findOne({
          email: newEmail,
          _id: {
            $ne: user._id
          }
        });

      if (duplicate) {
        return res.status(409).json({
          message:
            "Another account already uses this email"
        });
      }

      user.email =
        newEmail;
    }

    if (phone !== undefined) {
      user.phone =
        String(phone).trim();
    }

    await user.save();

    const result =
      user.toObject();

    delete result.password;

    res.json(result);
  } catch (error) {
    console.error(
      "UPDATE ACCOUNT ERROR:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Failed to update account"
    });
  }
}

/*
|--------------------------------------------------------------------------
| ALL ACCOUNTS
|--------------------------------------------------------------------------
*/

export async function accounts(
  req,
  res
) {
  try {
    const users =
      await User.find({
        role: {
          $ne: "PRINCIPAL"
        }
      })
        .select("-password")
        .sort({
          createdAt: -1
        });

    res.json(users);
  } catch (error) {
    console.error(
      "GET ACCOUNTS ERROR:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Unable to load accounts"
    });
  }
}

/*
|--------------------------------------------------------------------------
| SINGLE ACCOUNT
|--------------------------------------------------------------------------
*/

export async function account(
  req,
  res
) {
  try {
    const user =
      await User.findOne({
        _id:
          req.params.id,

        role: {
          $ne: "PRINCIPAL"
        }
      })
        .select("-password");

    if (!user) {
      return res.status(404).json({
        message:
          "Account not found"
      });
    }

    res.json(user);
  } catch (error) {
    console.error(
      "GET ACCOUNT ERROR:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Unable to load account"
    });
  }
}

/*
|--------------------------------------------------------------------------
| RESET PASSWORD
|--------------------------------------------------------------------------
*/

export async function resetPassword(
  req,
  res
) {
  try {
    const {
      password
    } = req.body;

    if (
      !password ||
      String(password).length < 6
    ) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters"
      });
    }

    const user =
      await User.findOne({
        _id:
          req.params.id,

        role: {
          $ne: "PRINCIPAL"
        }
      });

    if (!user) {
      return res.status(404).json({
        message:
          "Account not found"
      });
    }

    const hashedPassword =
      await bcrypt.hash(
        String(password),
        10
      );

    user.password =
      hashedPassword;

    user.mustChangePassword =
      true;

    await user.save();

    res.json({
      message:
        "Password reset successfully"
    });
  } catch (error) {
    console.error(
      "RESET PASSWORD ERROR:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Unable to reset password"
    });
  }
}

/*
|--------------------------------------------------------------------------
| ACTIVE / INACTIVE
|--------------------------------------------------------------------------
*/

export async function updateAccountStatus(
  req,
  res
) {
  try {
    const {
      active
    } = req.body;

    if (
      typeof active !== "boolean"
    ) {
      return res.status(400).json({
        message:
          "active must be true or false"
      });
    }

    const user =
      await User.findOne({
        _id:
          req.params.id,

        role: {
          $ne: "PRINCIPAL"
        }
      });

    if (!user) {
      return res.status(404).json({
        message:
          "Account not found"
      });
    }

    user.active =
      active;

    await user.save();

    res.json({
      message:
        active
          ? "Account activated successfully"
          : "Account deactivated successfully",

      active:
        user.active
    });
  } catch (error) {
    console.error(
      "UPDATE ACCOUNT STATUS ERROR:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Unable to update account status"
    });
  }
}
