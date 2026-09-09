
import bcrypt from "bcryptjs";
import {
  User,
  Student,
  Parent,
  Teacher,
  ClassRoom,
  Subject,
  Payment,
  Expense,
  Attendance,
  Exam,
  Mark,
  Homework,
  Notice,
  Event,
  Registration,
  Admission,
  FeeStructure
} from "../models/index.js";

function cleanUser(user) {
  if (!user) return null;

  const data = user.toObject ? user.toObject() : { ...user };
  delete data.password;

  return data;
}

function generateCode(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
}

/*
|--------------------------------------------------------------------------
| DASHBOARD
|--------------------------------------------------------------------------
*/

export async function dashboard(req, res) {
  const [
    students,
    teachers,
    parents,
    payments,
    expenses,
    registrations,
    admissions
  ] = await Promise.all([
    Student.countDocuments(),

    Teacher.countDocuments(),

    Parent.countDocuments(),

    Payment.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ]),

    Expense.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ]),

    Registration.countDocuments(),

    Admission.countDocuments()
  ]);

  res.json({
    students,
    teachers,
    parents,
    registrations,
    admissions,
    totalCollection: payments[0]?.total || 0,
    totalExpense: expenses[0]?.total || 0
  });
}

/*
|--------------------------------------------------------------------------
| STUDENTS
|--------------------------------------------------------------------------
*/

export async function listStudents(req, res) {
  const students = await Student.find()
    .populate("parent")
    .populate("user")
    .sort({ createdAt: -1 });

  res.json(students);
}

export async function getStudent(req, res) {
  const student = await Student.findById(req.params.id)
    .populate("parent")
    .populate("user");

  if (!student) {
    return res.status(404).json({
      message: "Student not found"
    });
  }

  res.json(student);
}

export async function createStudent(req, res) {
  const student = await Student.create(req.body);

  res.status(201).json({
    message: "Student created successfully",
    student
  });
}

export async function updateStudent(req, res) {
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

  res.json({
    message: "Student updated successfully",
    student
  });
}

export async function deleteStudent(req, res) {
  const student = await Student.findByIdAndDelete(req.params.id);

  if (!student) {
    return res.status(404).json({
      message: "Student not found"
    });
  }

  res.json({
    message: "Student deleted successfully"
  });
}

/*
|--------------------------------------------------------------------------
| TEACHERS
|--------------------------------------------------------------------------
*/

export async function listTeachers(req, res) {
  const teachers = await Teacher.find()
    .populate("subjects")
    .populate("classes")
    .populate("user")
    .sort({ createdAt: -1 });

  res.json(teachers);
}

export async function createTeacher(req, res) {
  const {
    name,
    employeeId,
    phone,
    email,
    qualification,
    subjects,
    classes,
    joiningDate
  } = req.body;

  const teacher = await Teacher.create({
    name,
    employeeId,
    phone,
    email,
    qualification,
    subjects,
    classes,
    joiningDate
  });

  res.status(201).json({
    message: "Teacher created successfully",
    teacher
  });
}

/*
|--------------------------------------------------------------------------
| CLASSES
|--------------------------------------------------------------------------
*/

export async function listClasses(req, res) {
  const classes = await ClassRoom.find()
    .populate("classTeacher")
    .sort({ name: 1 });

  res.json(classes);
}

export async function createClass(req, res) {
  const classroom = await ClassRoom.create(req.body);

  res.status(201).json({
    message: "Class created successfully",
    class: classroom
  });
}

export async function updateClass(req, res) {
  const classroom = await ClassRoom.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  if (!classroom) {
    return res.status(404).json({
      message: "Class not found"
    });
  }

  res.json(classroom);
}

export async function deleteClass(req, res) {
  const classroom = await ClassRoom.findByIdAndDelete(
    req.params.id
  );

  if (!classroom) {
    return res.status(404).json({
      message: "Class not found"
    });
  }

  res.json({
    message: "Class deleted successfully"
  });
}

/*
|--------------------------------------------------------------------------
| SUBJECTS
|--------------------------------------------------------------------------
*/

export async function listSubjects(req, res) {
  res.json(
    await Subject.find().populate("classIds")
  );
}

export async function createSubject(req, res) {
  const subject = await Subject.create(req.body);

  res.status(201).json({
    message: "Subject created successfully",
    subject
  });
}

export async function updateSubject(req, res) {
  const subject = await Subject.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  if (!subject) {
    return res.status(404).json({
      message: "Subject not found"
    });
  }

  res.json({
    message: "Subject updated successfully",
    subject
  });
}

export async function deleteSubject(req, res) {
  const subject = await Subject.findByIdAndDelete(
    req.params.id
  );

  if (!subject) {
    return res.status(404).json({
      message: "Subject not found"
    });
  }

  res.json({
    message: "Subject deleted successfully"
  });
}

/*
|--------------------------------------------------------------------------
| USERS / STAFF ACCOUNTS
|--------------------------------------------------------------------------
*/

export async function createUser(req, res) {
  const {
    name,
    email,
    phone,
    password,
    role
  } = req.body;

  if (!name || !password || !role) {
    return res.status(400).json({
      message: "Name, password and role are required"
    });
  }

  const existing = await User.findOne({
    $or: [
      ...(email
        ? [{ email: email.toLowerCase() }]
        : []),

      ...(phone
        ? [{ phone }]
        : [])
    ]
  });

  if (existing) {
    return res.status(409).json({
      message: "User already exists"
    });
  }

  const user = await User.create({
    name,
    email,
    phone,
    role,
    password: await bcrypt.hash(password, 12),
    mustChangePassword: true,
    active: true
  });

  res.status(201).json({
    message: "Account created successfully",
    user: cleanUser(user)
  });
}

export async function listUsers(req, res) {
  const users = await User.find()
    .sort({ createdAt: -1 });

  res.json(users);
}

export async function updateUser(req, res) {
  const allowed = [
    "name",
    "email",
    "phone",
    "role",
    "active"
  ];

  const update = {};

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      update[key] = req.body[key];
    }
  }

  if (req.body.password) {
    update.password = await bcrypt.hash(
      req.body.password,
      12
    );

    update.mustChangePassword = true;
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    update,
    {
      new: true,
      runValidators: true
    }
  );

  if (!user) {
    return res.status(404).json({
      message: "User not found"
    });
  }

  res.json({
    message: "User updated successfully",
    user: cleanUser(user)
  });
}

/*
|--------------------------------------------------------------------------
| PAYMENTS
|--------------------------------------------------------------------------
*/

export async function listPayments(req, res) {
  const payments = await Payment.find()
    .populate("student")
    .populate("receivedBy", "name role")
    .sort({ date: -1 });

  res.json(payments);
}

export async function createPayment(req, res) {
  const payment = await Payment.create({
    ...req.body,

    receiptNo:
      req.body.receiptNo ||
      generateCode("REC"),

    receivedBy: req.user._id
  });

  res.status(201).json({
    message: "Payment recorded successfully",
    payment
  });
}

/*
|--------------------------------------------------------------------------
| EXPENSES
|--------------------------------------------------------------------------
*/

export async function listExpenses(req, res) {
  res.json(
    await Expense.find()
      .populate("paidBy", "name role")
      .sort({ date: -1 })
  );
}

export async function createExpense(req, res) {
  const expense = await Expense.create({
    ...req.body,

    voucherNo:
      req.body.voucherNo ||
      generateCode("VCH"),

    paidBy: req.user._id
  });

  res.status(201).json({
    message: "Expense recorded successfully",
    expense
  });
}

/*
|--------------------------------------------------------------------------
| STUDENT REGISTRATION + FINAL ADMISSION
|--------------------------------------------------------------------------
|
| New business flow:
|
| Student Registration
|        ↓
| Registration / Admission Fee
|        ↓
| Receipt
|        ↓
| Student ACTIVE
|        ↓
| Admission No. Generated
|        ↓
| Student / Parent Portal
|
| There is NO separate admission step.
|
*/

export async function createRegistration(req, res) {
  const {
    name,
    registrationFee = 0,
    paymentMethod = "CASH",
    registrationNo: requestedRegistrationNo,
    ...studentData
  } = req.body;

  if (!name || !String(name).trim()) {
    return res.status(400).json({
      message: "Student name is required"
    });
  }

  const fee = Number(registrationFee) || 0;

  if (fee < 0) {
    return res.status(400).json({
      message: "Registration fee cannot be negative"
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Generate Registration + Admission Numbers
  |--------------------------------------------------------------------------
  */

  const registrationNo =
    requestedRegistrationNo ||
    generateCode("REG");

  const admissionNo = generateCode("ADM");

  /*
  |--------------------------------------------------------------------------
  | Create Student
  |--------------------------------------------------------------------------
  |
  | Registration itself is final admission.
  |
  */

  const student = await Student.create({
    ...studentData,

    name: String(name).trim(),

    registrationNo,

    admissionNo,

    registrationFee: fee,

    // No separate admission fee.
    admissionFee: 0,

    status: "ACTIVE",

    active: true
  });

  /*
  |--------------------------------------------------------------------------
  | Registration Record
  |--------------------------------------------------------------------------
  */

  const registration = await Registration.create({
    registrationNo,

    student: student._id,

    fee,

    status: "COMPLETED",

    createdBy: req.user._id
  });

  /*
  |--------------------------------------------------------------------------
  | Admission Record
  |--------------------------------------------------------------------------
  |
  | Admission is automatically completed here.
  | This keeps admission history/reporting available
  | without requiring a separate admission UI.
  |
  */

  const admission = await Admission.create({
    student: student._id,

    registrationNo,

    admissionNo,

    classId:
      studentData.classId ||
      null,

    className:
      studentData.className,

    section:
      studentData.section,

    session:
      studentData.session,

    admissionDate: new Date(),

    status: "COMPLETED",

    notes:
      "Admission completed automatically during student registration.",

    createdBy: req.user._id
  });

  /*
  |--------------------------------------------------------------------------
  | Payment / Receipt
  |--------------------------------------------------------------------------
  */

  let payment = null;

  if (fee > 0) {
    payment = await Payment.create({
      receiptNo: generateCode("REC"),

      student: student._id,

      type: "REGISTRATION",

      amount: fee,

      method: paymentMethod,

      date: new Date(),

      receivedBy: req.user._id,

      description:
        "Registration / Admission fee"
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Response
  |--------------------------------------------------------------------------
  */

  res.status(201).json({
    success: true,

    message:
      "Student registration and admission completed successfully.",

    student,

    registration,

    admission,

    payment,

    receipt: payment
      ? {
          receiptNo: payment.receiptNo,
          amount: payment.amount,
          method: payment.method,
          date: payment.date,
          type: payment.type
        }
      : null,

    registrationSummary: {
      registrationNo,

      admissionNo,

      registrationFee: fee,

      admissionFee: 0,

      totalCollected: fee,

      status: "ACTIVE"
    }
  });
}

/*
|--------------------------------------------------------------------------
| NOTE:
| completeAdmission() HAS BEEN REMOVED.
|--------------------------------------------------------------------------
|
| Admission is now automatically completed inside
| createRegistration().
|
| Do NOT create another admission API.
|
*/

/*
|--------------------------------------------------------------------------
| FEE STRUCTURE
|--------------------------------------------------------------------------
*/

export async function listFeeStructures(req, res) {
  res.json(
    await FeeStructure.find()
      .sort({ createdAt: -1 })
  );
}

export async function createFeeStructure(req, res) {
  const fee = await FeeStructure.create(req.body);

  res.status(201).json({
    message: "Fee structure created successfully",
    fee
  });
}

export async function updateFeeStructure(req, res) {
  const fee = await FeeStructure.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  if (!fee) {
    return res.status(404).json({
      message: "Fee structure not found"
    });
  }

  res.json({
    message: "Fee structure updated successfully",
    fee
  });
}

/*
|--------------------------------------------------------------------------
| ATTENDANCE
|--------------------------------------------------------------------------
*/

export async function listAttendance(req, res) {
  res.json(
    await Attendance.find()
      .populate("student")
      .populate("markedBy", "name")
      .sort({ date: -1 })
  );
}

export async function createAttendance(req, res) {
  const attendance = await Attendance.create({
    ...req.body,
    markedBy: req.user._id
  });

  res.status(201).json(attendance);
}

/*
|--------------------------------------------------------------------------
| EXAMS
|--------------------------------------------------------------------------
*/

export async function listExams(req, res) {
  res.json(
    await Exam.find()
      .populate("classId")
      .populate("subjects")
      .sort({ date: -1 })
  );
}

export async function createExam(req, res) {
  const exam = await Exam.create({
    ...req.body,
    createdBy: req.user._id
  });

  res.status(201).json(exam);
}

/*
|--------------------------------------------------------------------------
| MARKS
|--------------------------------------------------------------------------
*/

export async function listMarks(req, res) {
  res.json(
    await Mark.find()
      .populate("student")
      .populate("exam")
      .populate("subject")
      .sort({ createdAt: -1 })
  );
}

export async function createMark(req, res) {
  const mark = await Mark.create({
    ...req.body,
    enteredBy: req.user._id
  });

  res.status(201).json(mark);
}

/*
|--------------------------------------------------------------------------
| HOMEWORK
|--------------------------------------------------------------------------
*/

export async function listHomework(req, res) {
  res.json(
    await Homework.find()
      .populate("classId")
      .populate("subject")
      .sort({ dueDate: -1 })
  );
}

export async function createHomework(req, res) {
  const homework = await Homework.create({
    ...req.body,
    createdBy: req.user._id
  });

  res.status(201).json(homework);
}

/*
|--------------------------------------------------------------------------
| NOTICES
|--------------------------------------------------------------------------
*/

export async function listNotices(req, res) {
  res.json(
    await Notice.find()
      .populate("createdBy", "name role")
      .sort({ publishedAt: -1 })
  );
}

export async function createNotice(req, res) {
  const notice = await Notice.create({
    ...req.body,
    createdBy: req.user._id
  });

  res.status(201).json(notice);
}

/*
|--------------------------------------------------------------------------
| EVENTS
|--------------------------------------------------------------------------
*/

export async function listEvents(req, res) {
  res.json(
    await Event.find()
      .populate("createdBy", "name role")
      .sort({ date: -1 })
  );

  res.json(
    await Event.find()
      .populate("createdBy", "name role")
      .sort({ date: -1 })
  );
}

export async function createEvent(req, res) {
  const event = await Event.create({
    ...req.body,
    createdBy: req.user._id
  });

  res.status(201).json(event);
}
