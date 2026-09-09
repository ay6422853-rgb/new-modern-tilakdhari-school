
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const opts = {
  timestamps: true
};


/* =========================
   USER / LOGIN
========================= */

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true
    },

    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: [
        'PRINCIPAL',
        'ACCOUNTANT',
        'OPERATOR',
        'TEACHER',
        'PARENT',
        'STUDENT'
      ],
      required: true
    },

    mustChangePassword: {
      type: Boolean,
      default: true
    },

    active: {
      type: Boolean,
      default: true
    },

    profileRef: {
      type: Schema.Types.ObjectId,
      refPath: 'profileModel',
      default: null
    },

    profileModel: {
      type: String,
      enum: [
        'Teacher',
        'Parent',
        'Student'
      ],
      default: null
    }
  },
  {
    ...opts,

    toJSON: {
      transform: (_, ret) => {
        delete ret.password;
        return ret;
      }
    }
  }
);


/* =========================
   CLASS
========================= */

const ClassSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    classCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },

    sections: [
      {
        type: String,
        trim: true
      }
    ],

    classTeacher: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null
    },

    active: {
      type: Boolean,
      default: true
    }
  },
  opts
);


/* =========================
   SUBJECT
========================= */

const SubjectSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    code: {
      type: String,
      trim: true
    },

    classIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'ClassRoom'
      }
    ],

    classNames: [
      {
        type: String
      }
    ],

    active: {
      type: Boolean,
      default: true
    }
  },
  opts
);


/* =========================
   PARENT
========================= */

const ParentSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    parentId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },

    relation: {
      type: String,
      trim: true
    },

    phone: {
      type: String,
      trim: true
    },

    email: {
      type: String,
      lowercase: true,
      trim: true
    },

    address: {
      type: String
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    students: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Student'
      }
    ],

    active: {
      type: Boolean,
      default: true
    }
  },
  opts
);


/* =========================
   TEACHER
========================= */

const TeacherSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    employeeId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },

    phone: {
      type: String,
      trim: true
    },

    email: {
      type: String,
      lowercase: true,
      trim: true
    },

    qualification: {
      type: String
    },

    subjects: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Subject'
      }
    ],

    classes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'ClassRoom'
      }
    ],

    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    joiningDate: {
      type: Date
    },

    active: {
      type: Boolean,
      default: true
    }
  },
  opts
);


/* =========================
   STUDENT
========================= */

const StudentSchema = new Schema(
  {
    studentId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },

    registrationNo: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },

    admissionNo: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    fatherName: {
      type: String,
      trim: true
    },

    motherName: {
      type: String,
      trim: true
    },

    dob: {
      type: Date
    },

    gender: {
      type: String,
      trim: true
    },

    phone: {
      type: String,
      trim: true
    },

    email: {
      type: String,
      lowercase: true,
      trim: true
    },

    address: {
      type: String
    },

    classId: {
      type: Schema.Types.ObjectId,
      ref: 'ClassRoom',
      default: null
    },

    className: {
      type: String,
      trim: true
    },

    section: {
      type: String,
      trim: true
    },

    rollNo: {
      type: String,
      trim: true
    },

    session: {
      type: String,
      trim: true
    },

    status: {
      type: String,
      enum: [
        'REGISTERED',
        'ACTIVE',
        'INACTIVE',
        'LEFT'
      ],
      default: 'REGISTERED'
    },

    registrationFee: {
      type: Number,
      default: 0,
      min: 0
    },

    admissionFee: {
      type: Number,
      default: 0,
      min: 0
    },

    parent: {
      type: Schema.Types.ObjectId,
      ref: 'Parent',
      default: null
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    documents: [
      {
        name: String,
        url: String
      }
    ],

    active: {
      type: Boolean,
      default: true
    }
  },
  opts
);


/* =========================
   ADMISSION
========================= */

const AdmissionSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },

    registrationNo: {
      type: String
    },

    admissionNo: {
      type: String
    },

    classId: {
      type: Schema.Types.ObjectId,
      ref: 'ClassRoom',
      default: null
    },

    className: {
      type: String
    },

    section: {
      type: String
    },

    session: {
      type: String
    },

    admissionDate: {
      type: Date,
      default: Date.now
    },

    status: {
      type: String,
      enum: [
        'COMPLETED',
        'CANCELLED'
      ],
      default: 'COMPLETED'
    },

    notes: {
      type: String
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  opts
);


/* =========================
   PAYMENT / FEES
========================= */

const PaymentSchema = new Schema(
  {
    receiptNo: {
      type: String,
      unique: true,
      sparse: true
    },

    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      default: null
    },

    type: {
      type: String,
      enum: [
        'REGISTRATION',
        'ADMISSION',
        'TUITION',
        'TRANSPORT',
        'EXAM',
        'OTHER',
        'REFUND'
      ],
      required: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    method: {
      type: String,
      enum: [
        'CASH',
        'UPI',
        'CARD',
        'BANK',
        'CHEQUE'
      ],
      default: 'CASH'
    },

    date: {
      type: Date,
      default: Date.now
    },

    description: {
      type: String
    },

    receivedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  opts
);


/* =========================
   EXPENSE
========================= */

const ExpenseSchema = new Schema(
  {
    voucherNo: {
      type: String,
      unique: true,
      sparse: true
    },

    category: {
      type: String
    },

    description: {
      type: String
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    method: {
      type: String,
      enum: [
        'CASH',
        'UPI',
        'CARD',
        'BANK',
        'CHEQUE'
      ],
      default: 'CASH'
    },

    date: {
      type: Date,
      default: Date.now
    },

    paidBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  opts
);


/* =========================
   ATTENDANCE
========================= */

const AttendanceSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },

    classId: {
      type: Schema.Types.ObjectId,
      ref: 'ClassRoom',
      default: null
    },

    date: {
      type: Date,
      required: true
    },

    status: {
      type: String,
      enum: [
        'PRESENT',
        'ABSENT',
        'LATE',
        'LEAVE'
      ],
      required: true
    },

    markedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  opts
);

AttendanceSchema.index(
  {
    student: 1,
    date: 1
  },
  {
    unique: true
  }
);


/* =========================
   EXAM
========================= */

const ExamSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },

    classId: {
      type: Schema.Types.ObjectId,
      ref: 'ClassRoom',
      default: null
    },

    className: {
      type: String
    },

    session: {
      type: String
    },

    date: {
      type: Date
    },

    subjects: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Subject'
      }
    ],

    published: {
      type: Boolean,
      default: false
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  opts
);


/* =========================
   MARKS / RESULTS
========================= */

const MarkSchema = new Schema(
  {
    exam: {
      type: Schema.Types.ObjectId,
      ref: 'Exam',
      required: true
    },

    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },

    subject: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: true
    },

    maxMarks: {
      type: Number,
      required: true
    },

    marks: {
      type: Number,
      required: true,
      min: 0
    },

    grade: {
      type: String
    },

    remarks: {
      type: String
    },

    enteredBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  opts
);

MarkSchema.index(
  {
    exam: 1,
    student: 1,
    subject: 1
  },
  {
    unique: true
  }
);


/* =========================
   HOMEWORK
========================= */

const HomeworkSchema = new Schema(
  {
    title: {
      type: String,
      required: true
    },

    subject: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      default: null
    },

    classId: {
      type: Schema.Types.ObjectId,
      ref: 'ClassRoom',
      default: null
    },

    className: {
      type: String
    },

    section: {
      type: String
    },

    description: {
      type: String
    },

    dueDate: {
      type: Date
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  opts
);


/* =========================
   NOTICE
========================= */

const NoticeSchema = new Schema(
  {
    title: {
      type: String,
      required: true
    },

    body: {
      type: String,
      required: true
    },

    audience: [
      {
        type: String,
        enum: [
          'PRINCIPAL',
          'ACCOUNTANT',
          'OPERATOR',
          'TEACHER',
          'PARENT',
          'STUDENT',
          'ALL'
        ]
      }
    ],

    published: {
      type: Boolean,
      default: true
    },

    publishedAt: {
      type: Date,
      default: Date.now
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  opts
);


/* =========================
   EVENTS
========================= */

const EventSchema = new Schema(
  {
    title: {
      type: String,
      required: true
    },

    description: {
      type: String
    },

    date: {
      type: Date
    },

    location: {
      type: String
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  opts
);


/* =========================
   REGISTRATION
========================= */

const RegistrationSchema = new Schema(
  {
    registrationNo: {
      type: String,
      unique: true,
      required: true
    },

    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },

    fee: {
      type: Number,
      default: 0,
      min: 0
    },

    status: {
      type: String,
      enum: [
        'PENDING',
        'COMPLETED',
        'CANCELLED'
      ],
      default: 'PENDING'
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  opts
);


/* =========================
   FEE STRUCTURE
========================= */

const FeeStructureSchema = new Schema(
  {
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'ClassRoom',
      default: null
    },

    className: {
      type: String
    },

    session: {
      type: String
    },

    items: [
      {
        name: {
          type: String,
          required: true
        },

        amount: {
          type: Number,
          required: true,
          min: 0
        },

        frequency: {
          type: String,
          enum: [
            'ONE_TIME',
            'MONTHLY',
            'QUARTERLY',
            'HALF_YEARLY',
            'YEARLY'
          ],
          default: 'MONTHLY'
        }
      }
    ],

    active: {
      type: Boolean,
      default: true
    }
  },
  opts
);


/* =========================
   TIMETABLE
========================= */

const TimetableSchema = new Schema(
  {
    /*
     * CLASS
     */
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'ClassRoom',
      required: true
    },

    /*
     * Stored separately for quick display/search
     */
    className: {
      type: String,
      trim: true
    },

    /*
     * Section of the class
     * Example: A, B, C
     */
    section: {
      type: String,
      required: true,
      trim: true
    },


    /*
     * SUBJECT
     */
    subject: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: true
    },

    subjectName: {
      type: String,
      trim: true
    },


    /*
     * MAIN TEACHER
     */
    teacher: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true
    },

    teacherName: {
      type: String,
      trim: true
    },


    /*
     * SUBSTITUTE TEACHER
     *
     * Optional.
     * Operator can assign another teacher when required.
     */
    substituteTeacher: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null
    },


    /*
     * DAY
     */
    day: {
      type: String,
      enum: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday'
      ],
      required: true
    },


    /*
     * PERIOD NUMBER
     *
     * Example:
     * 1 = First Period
     * 2 = Second Period
     * etc.
     */
    period: {
      type: Number,
      required: true,
      min: 1
    },


    /*
     * PERIOD TIME
     */
    startTime: {
      type: String,
      trim: true
    },

    endTime: {
      type: String,
      trim: true
    },


    /*
     * ROOM
     */
    room: {
      type: String,
      trim: true,
      default: ''
    },


    /*
     * ACADEMIC SESSION
     *
     * Example:
     * 2026-27
     */
    session: {
      type: String,
      trim: true
    },


    /*
     * ACTIVE / SOFT DELETE
     */
    active: {
      type: Boolean,
      default: true
    },


    /*
     * WHO CREATED THIS ENTRY
     */
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  opts
);


/*
|--------------------------------------------------------------------------
| TIMETABLE INDEXES
|--------------------------------------------------------------------------
|
| These indexes make conflict checking and timetable filtering faster.
|
|--------------------------------------------------------------------------
*/


/*
 * Class + Section + Day + Period
 *
 * Prevents two timetable entries for the same class/section
 * in the same period.
 */
TimetableSchema.index({
  classId: 1,
  section: 1,
  day: 1,
  period: 1
});


/*
 * Teacher + Day + Period
 *
 * Helps detect teacher clashes.
 */
TimetableSchema.index({
  teacher: 1,
  day: 1,
  period: 1
});


/*
 * Substitute Teacher + Day + Period
 */
TimetableSchema.index({
  substituteTeacher: 1,
  day: 1,
  period: 1
});


/*
 * Room + Day + Period
 */
TimetableSchema.index({
  room: 1,
  day: 1,
  period: 1
});


/*
 * Session + Class + Day
 */
TimetableSchema.index({
  session: 1,
  classId: 1,
  day: 1
});


/* =========================
   EXPORT MODELS
========================= */

export const User =
  model('User', UserSchema);

export const Student =
  model('Student', StudentSchema);

export const Parent =
  model('Parent', ParentSchema);

export const Teacher =
  model('Teacher', TeacherSchema);

export const ClassRoom =
  model('ClassRoom', ClassSchema);

export const Subject =
  model('Subject', SubjectSchema);

export const Admission =
  model('Admission', AdmissionSchema);

export const Payment =
  model('Payment', PaymentSchema);

export const Expense =
  model('Expense', ExpenseSchema);

export const Attendance =
  model('Attendance', AttendanceSchema);

export const Exam =
  model('Exam', ExamSchema);

export const Mark =
  model('Mark', MarkSchema);

export const Homework =
  model('Homework', HomeworkSchema);

export const Notice =
  model('Notice', NoticeSchema);

export const Event =
  model('Event', EventSchema);

export const Registration =
  model('Registration', RegistrationSchema);

export const FeeStructure =
  model('FeeStructure', FeeStructureSchema);

export const Timetable =
  model('Timetable', TimetableSchema);
