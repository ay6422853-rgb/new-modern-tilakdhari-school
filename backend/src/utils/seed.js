import "dotenv/config";
import bcrypt from "bcryptjs";

import { connectDB } from "../config/db.js";
import {
  User,
  ClassRoom,
  Subject,
  Teacher,
  Parent,
  Student
} from "../models/index.js";


// ======================================================
// DATABASE CONNECTION
// ======================================================

await connectDB();

console.log("MongoDB connected. Starting safe seed...");


// ======================================================
// PASSWORD
// ======================================================

const DEMO_PASSWORD = "Admin@123";

const hashedPassword = await bcrypt.hash(
  DEMO_PASSWORD,
  12
);


// ======================================================
// HELPER
// ======================================================

async function upsertUser({
  name,
  email,
  role
}) {
  const user = await User.findOneAndUpdate(
    { email },
    {
      $set: {
        name,
        role,
        mustChangePassword: false,
        active: true
      },
      $setOnInsert: {
        password: hashedPassword
      }
    },
    {
      new: true,
      upsert: true
    }
  );

  return user;
}


// ======================================================
// 1. USERS
// ======================================================

console.log("\nCreating users...");

const principalUser = await upsertUser({
  name: "Principal",
  email: "principal@school.local",
  role: "PRINCIPAL"
});

const accountantUser = await upsertUser({
  name: "Accountant",
  email: "accountant@school.local",
  role: "ACCOUNTANT"
});

const operatorUser = await upsertUser({
  name: "Computer Operator",
  email: "operator@school.local",
  role: "OPERATOR"
});

const teacherUser = await upsertUser({
  name: "Teacher",
  email: "teacher@school.local",
  role: "TEACHER"
});

const parentUser = await upsertUser({
  name: "Parent",
  email: "parent@school.local",
  role: "PARENT"
});

const studentUser = await upsertUser({
  name: "Student",
  email: "student@school.local",
  role: "STUDENT"
});

console.log("Users ready.");


// ======================================================
// 2. CLASSES
// ======================================================

console.log("\nCreating classes...");

async function upsertClass({
  name,
  classCode
}) {
  return ClassRoom.findOneAndUpdate(
    { classCode },
    {
      $set: {
        name,
        active: true
      },
      $setOnInsert: {
        classCode
      }
    },
    {
      new: true,
      upsert: true
    }
  );
}

const class6 = await upsertClass({
  name: "Class 6",
  classCode: "CLASS-06"
});

const class7 = await upsertClass({
  name: "Class 7",
  classCode: "CLASS-07"
});

const class8 = await upsertClass({
  name: "Class 8",
  classCode: "CLASS-08"
});

const class9 = await upsertClass({
  name: "Class 9",
  classCode: "CLASS-09"
});

const class10 = await upsertClass({
  name: "Class 10",
  classCode: "CLASS-10"
});

const class11 = await upsertClass({
  name: "Class 11",
  classCode: "CLASS-11"
});

const class12 = await upsertClass({
  name: "Class 12",
  classCode: "CLASS-12"
});

console.log("Classes ready.");


// ======================================================
// 3. SUBJECTS
// ======================================================

console.log("\nCreating subjects...");

async function upsertSubject({
  name,
  code,
  classIds,
  classNames
}) {
  return Subject.findOneAndUpdate(
    { code },
    {
      $set: {
        name,
        classIds,
        classNames,
        active: true
      },
      $setOnInsert: {
        code
      }
    },
    {
      new: true,
      upsert: true
    }
  );
}


// Common subjects

const english = await upsertSubject({
  name: "English",
  code: "ENG",
  classIds: [
    class6._id,
    class7._id,
    class8._id,
    class9._id,
    class10._id,
    class11._id,
    class12._id
  ],
  classNames: [
    "Class 6",
    "Class 7",
    "Class 8",
    "Class 9",
    "Class 10",
    "Class 11",
    "Class 12"
  ]
});

const hindi = await upsertSubject({
  name: "Hindi",
  code: "HIN",
  classIds: [
    class6._id,
    class7._id,
    class8._id,
    class9._id,
    class10._id,
    class11._id,
    class12._id
  ],
  classNames: [
    "Class 6",
    "Class 7",
    "Class 8",
    "Class 9",
    "Class 10",
    "Class 11",
    "Class 12"
  ]
});

const mathematics = await upsertSubject({
  name: "Mathematics",
  code: "MATH",
  classIds: [
    class6._id,
    class7._id,
    class8._id,
    class9._id,
    class10._id,
    class11._id,
    class12._id
  ],
  classNames: [
    "Class 6",
    "Class 7",
    "Class 8",
    "Class 9",
    "Class 10",
    "Class 11",
    "Class 12"
  ]
});

const science = await upsertSubject({
  name: "Science",
  code: "SCI",
  classIds: [
    class6._id,
    class7._id,
    class8._id,
    class9._id,
    class10._id
  ],
  classNames: [
    "Class 6",
    "Class 7",
    "Class 8",
    "Class 9",
    "Class 10"
  ]
});

const socialScience = await upsertSubject({
  name: "Social Science",
  code: "SST",
  classIds: [
    class6._id,
    class7._id,
    class8._id,
    class9._id,
    class10._id
  ],
  classNames: [
    "Class 6",
    "Class 7",
    "Class 8",
    "Class 9",
    "Class 10"
  ]
});

const computer = await upsertSubject({
  name: "Computer",
  code: "COMP",
  classIds: [
    class6._id,
    class7._id,
    class8._id,
    class9._id,
    class10._id,
    class11._id,
    class12._id
  ],
  classNames: [
    "Class 6",
    "Class 7",
    "Class 8",
    "Class 9",
    "Class 10",
    "Class 11",
    "Class 12"
  ]
});

console.log("Subjects ready.");


// ======================================================
// 4. TEACHER PROFILE
// ======================================================

console.log("\nCreating teacher profile...");

let teacher = await Teacher.findOne({
  user: teacherUser._id
});

if (!teacher) {
  teacher = await Teacher.create({
    name: "Demo Teacher",
    employeeId: "EMP-001",
    user: teacherUser._id,
    active: true
  });
} else {
  teacher.name = "Demo Teacher";
  teacher.employeeId = "EMP-001";
  teacher.user = teacherUser._id;
  teacher.active = true;

  await teacher.save();
}


// Link teacher profile to User

await User.findByIdAndUpdate(
  teacherUser._id,
  {
    $set: {
      profileRef: teacher._id,
      profileModel: "Teacher"
    }
  }
);

console.log("Teacher ready.");


// ======================================================
// 5. PARENT PROFILE
// ======================================================

console.log("\nCreating parent profile...");

let parent = await Parent.findOne({
  user: parentUser._id
});

if (!parent) {
  parent = await Parent.create({
    name: "Demo Parent",
    parentId: "PAR-001",
    relation: "Father",
    phone: "9999999999",
    email: "parent@school.local",
    address: "Martinganj",
    user: parentUser._id,
    students: [],
    active: true
  });
} else {
  parent.name = "Demo Parent";
  parent.parentId = "PAR-001";
  parent.relation = "Father";
  parent.email = "parent@school.local";
  parent.user = parentUser._id;
  parent.active = true;

  await parent.save();
}


// Link parent profile to User

await User.findByIdAndUpdate(
  parentUser._id,
  {
    $set: {
      profileRef: parent._id,
      profileModel: "Parent"
    }
  }
);

console.log("Parent ready.");


// ======================================================
// 6. STUDENT PROFILE
// ======================================================

console.log("\nCreating student profile...");

let student = await Student.findOne({
  user: studentUser._id
});

if (!student) {
  student = await Student.create({
    studentId: "STU-001",
    registrationNo: "REG-001",
    admissionNo: "ADM-001",

    name: "Demo Student",

    fatherName: "Demo Father",
    motherName: "Demo Mother",

    dob: new Date("2012-01-15"),

    gender: "MALE",

    phone: "9999999998",
    email: "student@school.local",

    address: "Martinganj",

    classId: class10._id,
    className: "Class 10",

    section: "A",
    rollNo: 1,

    session: "2026-27",

    status: "ACTIVE",

    registrationFee: 0,
    admissionFee: 0,

    parent: parent._id,
    user: studentUser._id,

    documents: [],

    active: true
  });
} else {
  student.name = "Demo Student";
  student.classId = class10._id;
  student.className = "Class 10";
  student.section = "A";
  student.rollNo = 1;
  student.session = "2026-27";
  student.status = "ACTIVE";
  student.parent = parent._id;
  student.user = studentUser._id;
  student.active = true;

  await student.save();
}


// Link student profile to User

await User.findByIdAndUpdate(
  studentUser._id,
  {
    $set: {
      profileRef: student._id,
      profileModel: "Student"
    }
  }
);


// Link student to parent

await Parent.findByIdAndUpdate(
  parent._id,
  {
    $addToSet: {
      students: student._id
    }
  }
);

console.log("Student ready.");


// ======================================================
// 7. ASSIGN TEACHER TO CLASS
// ======================================================

await ClassRoom.findByIdAndUpdate(
  class10._id,
  {
    $set: {
      classTeacher: teacher._id
    }
  }
);


// ======================================================
// DONE
// ======================================================

console.log("\n========================================");
console.log("        SEED COMPLETED SUCCESSFULLY");
console.log("========================================");

console.log("\nDemo Login Accounts:");

console.log("\nPRINCIPAL");
console.log("Email    : principal@school.local");
console.log("Password : Admin@123");

console.log("\nACCOUNTANT");
console.log("Email    : accountant@school.local");
console.log("Password : Admin@123");

console.log("\nOPERATOR");
console.log("Email    : operator@school.local");
console.log("Password : Admin@123");

console.log("\nTEACHER");
console.log("Email    : teacher@school.local");
console.log("Password : Admin@123");

console.log("\nPARENT");
console.log("Email    : parent@school.local");
console.log("Password : Admin@123");

console.log("\nSTUDENT");
console.log("Email    : student@school.local");
console.log("Password : Admin@123");

console.log("\nClasses created: 6 to 12");
console.log("Subjects created.");
console.log("Teacher profile created.");
console.log("Parent profile created.");
console.log("Student profile created.");

console.log("\nSafe seed finished.");
console.log("Existing records were NOT deleted.");

process.exit(0);