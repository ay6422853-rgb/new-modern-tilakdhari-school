import bcrypt from "bcryptjs";

import {
  User,
  Student,
  Parent,
  Payment,
  Expense,
  Registration,
  Admission,
  FeeStructure,
  ClassRoom
} from "../models/index.js";


/* =========================
   HELPERS
========================= */

function code(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(
    100 + Math.random() * 900
  )}`;
}

function cleanUser(user) {
  const data = user.toObject();

  delete data.password;

  return data;
}


/*
  DOB -> Password

  15/08/2010
       ↓
  15082010
*/
function dobToPassword(dob) {
  if (!dob) return "";

  const value = String(dob).split("T")[0];

  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return "";
  }

  return `${day}${month}${year}`;
}


/* =========================
   FEE HELPERS
========================= */

/*
  Supported frequencies:

  MONTHLY
  QUARTERLY
  HALF_YEARLY
  YEARLY
  ONE_TIME
*/

function normalizeFrequency(value) {
  return String(value || "MONTHLY")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}


/*
  Academic year:

  2026-27
  2026/27
  2026-2027

  sabko first year se identify karne ke liye
  ye helper use hoga.
*/

function getSessionStartYear(session) {
  const match =
    String(session || "").match(
      /20\d{2}/
    );

  return match
    ? Number(match[0])
    : null;
}


/*
  Academic year April -> March
*/

function getAcademicYearRange(session) {
  const startYear =
    getSessionStartYear(session);

  if (!startYear) {
    return null;
  }

  return {
    start:
      new Date(
        startYear,
        3,
        1,
        0,
        0,
        0,
        0
      ),

    end:
      new Date(
        startYear + 1,
        3,
        1,
        0,
        0,
        0,
        0
      )
  };
}


/*
  Returns fee period for a particular date.

  MONTHLY:
    every calendar month

  QUARTERLY:
    Apr-Jun
    Jul-Sep
    Oct-Dec
    Jan-Mar

  HALF_YEARLY:
    Apr-Sep
    Oct-Mar

  YEARLY:
    Apr-Mar

  ONE_TIME:
    complete academic session
*/

function getFeePeriod(
  frequency,
  date,
  session
) {
  const value =
    normalizeFrequency(frequency);

  const current =
    new Date(date);

  const year =
    current.getFullYear();

  const month =
    current.getMonth();

  if (value === "MONTHLY") {
    return {
      key:
        `MONTHLY-${year}-${String(
          month + 1
        ).padStart(2, "0")}`,

      start:
        new Date(
          year,
          month,
          1,
          0,
          0,
          0,
          0
        ),

      end:
        new Date(
          year,
          month + 1,
          1,
          0,
          0,
          0,
          0
        )
    };
  }


  /*
    Academic month:

    Jan-Mar belongs to previous
    academic year.
  */

  let academicYear =
    year;

  if (month < 3) {
    academicYear =
      year - 1;
  }


  if (value === "QUARTERLY") {
    let quarter;

    if (month >= 3 && month <= 5) {
      quarter = 1;
    } else if (
      month >= 6 &&
      month <= 8
    ) {
      quarter = 2;
    } else if (
      month >= 9 &&
      month <= 11
    ) {
      quarter = 3;
    } else {
      quarter = 4;
    }

    const quarterRanges = {
      1: {
        start: new Date(
          academicYear,
          3,
          1
        ),
        end: new Date(
          academicYear,
          6,
          1
        )
      },

      2: {
        start: new Date(
          academicYear,
          6,
          1
        ),
        end: new Date(
          academicYear,
          9,
          1
        )
      },

      3: {
        start: new Date(
          academicYear,
          9,
          1
        ),
        end: new Date(
          academicYear,
          12,
          1
        )
      },

      4: {
        start: new Date(
          academicYear + 1,
          0,
          1
        ),
        end: new Date(
          academicYear + 1,
          3,
          1
        )
      }
    };

    return {
      key:
        `QUARTERLY-${academicYear}-Q${quarter}`,

      ...quarterRanges[quarter]
    };
  }


  if (value === "HALF_YEARLY") {
    if (
      month >= 3 &&
      month <= 8
    ) {
      return {
        key:
          `HALF_YEARLY-${academicYear}-H1`,

        start:
          new Date(
            academicYear,
            3,
            1
          ),

        end:
          new Date(
            academicYear,
            9,
            1
          )
      };
    }

    return {
      key:
        `HALF_YEARLY-${academicYear}-H2`,

      start:
        new Date(
          academicYear,
          9,
          1
        ),

      end:
        new Date(
          academicYear + 1,
          3,
          1
        )
    };
  }


  if (value === "YEARLY") {
    return {
      key:
        `YEARLY-${academicYear}`,

      start:
        new Date(
          academicYear,
          3,
          1
        ),

      end:
        new Date(
          academicYear + 1,
          3,
          1
        )
    };
  }


  if (value === "ONE_TIME") {
    const academicRange =
      getAcademicYearRange(session);

    if (academicRange) {
      return {
        key:
          `ONE_TIME-${academicYear}`,

        ...academicRange
      };
    }

    /*
      Fallback if session format
      cannot be detected.
    */

    return {
      key:
        `ONE_TIME-${year}`,

      start:
        new Date(
          year,
          0,
          1
        ),

      end:
        new Date(
          year + 1,
          0,
          1
        )
    };
  }


  /*
    Unknown frequency
    => monthly
  */

  return getFeePeriod(
    "MONTHLY",
    date,
    session
  );
}


/*
  Calculate total fee applicable
  for the selected period.
*/

function calculateApplicableFee(
  feeStructure,
  date,
  session
) {
  if (session) {
    const academicRange =
      getAcademicYearRange(session);

    const feeDate =
      new Date(date);

    if (
      academicRange &&
      (
        feeDate <
          academicRange.start ||
        feeDate >=
          academicRange.end
      )
    ) {
      return {
        total: 0,
        items: []
      };
    }
  }

  if (
    !feeStructure?.items ||
    !Array.isArray(
      feeStructure.items
    )
  ) {
    return {
      total: 0,
      items: []
    };
  }

  const applicableItems = [];

  for (
    const item of feeStructure.items
  ) {
    const frequency =
      normalizeFrequency(
        item.frequency
      );

    const amount =
      Number(item.amount || 0);

    if (
      !amount ||
      amount < 0
    ) {
      continue;
    }

    const period =
      getFeePeriod(
        frequency,
        date,
        session
      );

    if (!period) {
      continue;
    }

    /*
      ONE_TIME should be applicable
      only inside its academic session.
    */

    applicableItems.push({
      name:
        item.name,

      amount,

      frequency,

      periodKey:
        period.key,

      periodStart:
        period.start,

      periodEnd:
        period.end
    });
  }

  const total =
    applicableItems.reduce(
      (sum, item) =>
        sum + item.amount,
      0
    );

  return {
    total,
    items: applicableItems
  };
}


/*
  Calculate tuition already paid for the exact
  fee periods currently applicable.

  Payments are allocated once per period, so if
  multiple fee items share the same period
  (for example Tuition + Transport monthly),
  the same payment is NOT counted twice.
*/

function calculatePaidAmount(
  applicableItems,
  payments
) {
  if (
    !Array.isArray(applicableItems) ||
    !applicableItems.length
  ) {
    return 0;
  }

  const periods =
    new Map();

  for (
    const item of applicableItems
  ) {
    const key =
      item.periodKey;

    if (!periods.has(key)) {
      periods.set(
        key,
        {
          start:
            item.periodStart,

          end:
            item.periodEnd,

          amount: 0
        }
      );
    }

    periods.get(key).amount +=
      Number(
        item.amount || 0
      );
  }

  let paidTotal = 0;

  for (
    const period of periods.values()
  ) {
    const paid =
      (payments || [])
        .filter(
          payment => {
            const paymentDate =
              new Date(
                payment.date
              );

            return (
              paymentDate >=
                period.start &&
              paymentDate <
                period.end
            );
          }
        )
        .reduce(
          (
            sum,
            payment
          ) =>
            sum +
            Number(
              payment.amount || 0
            ),
          0
        );

    paidTotal +=
      Math.min(
        paid,
        period.amount
      );
  }

  const totalApplicable =
    applicableItems.reduce(
      (sum, item) =>
        sum +
        Number(
          item.amount || 0
        ),
      0
    );

  return Math.min(
    paidTotal,
    totalApplicable
  );
}


/*
  Get all active fee structures
  and match student class.
*/

async function findStudentFeeStructure(
  student,
  session
) {
  const query = {
    active: true,
    session
  };

  /*
    Prefer classId.
  */

  if (student.classId?._id) {
    query.classId =
      student.classId._id;
  } else if (student.classId) {
    query.classId =
      student.classId;
  } else if (
    student.className
  ) {
    query.className =
      student.className;
  } else {
    return null;
  }

  return FeeStructure.findOne(
    query
  )
    .sort({
      createdAt: -1
    })
    .lean();
}


/* =========================
   DASHBOARD
========================= */

export async function dashboard(
  req,
  res
) {
  try {
    const [
      students,
      registrations,
      admissions,
      paymentAgg,
      expenseAgg
    ] = await Promise.all([
      Student.countDocuments({
        active: true
      }),

      Registration.countDocuments(),

      Admission.countDocuments(),

      Payment.aggregate([
        {
          $match: {
            type: {
              $ne:
                "REFUND"
            }
          }
        },

        {
          $group: {
            _id: null,

            total: {
              $sum:
                "$amount"
            }
          }
        }
      ]),

      Expense.aggregate([
        {
          $group: {
            _id: null,

            total: {
              $sum:
                "$amount"
            }
          }
        }
      ])
    ]);

    const totalIncome =
      paymentAgg[0]?.total ||
      0;

    const totalExpense =
      expenseAgg[0]?.total ||
      0;

    res.json({
      students,

      registrations,

      admissions,

      totalIncome,

      totalExpense,

      balance:
        totalIncome -
        totalExpense
    });

  } catch (error) {

    console.error(
      "Accountant dashboard error:",
      error
    );

    res.status(500).json({
      message:
        error?.message ||
        "Dashboard load nahi ho paaya."
    });
  }
}


/* =========================
   PROFILE
========================= */

export async function profile(
  req,
  res
) {
  try {
    const user =
      await User.findById(
        req.user._id
      );

    if (!user) {
      return res.status(404).json({
        message:
          "Accountant not found."
      });
    }

    res.json({
      success: true,

      user:
        cleanUser(user)
    });

  } catch (error) {

    console.error(
      "Accountant profile error:",
      error
    );

    res.status(500).json({
      message:
        error?.message ||
        "Profile load nahi ho paaya."
    });
  }
}


/* =========================
   CLASSES
========================= */

export async function classes(
  req,
  res
) {
  try {
    const classes =
      await ClassRoom.find({
        active: true
      })
        .select(
          "_id name classCode sections"
        )
        .sort({
          name: 1
        });

    res.json({
      success: true,
      classes
    });

  } catch (error) {

    console.error(
      "Accountant classes error:",
      error
    );

    res.status(500).json({
      message:
        error?.message ||
        "Classes load nahi ho paayi."
    });
  }
}


/* =========================
   REGISTER STUDENT
========================= */

export async function registerStudent(
  req,
  res
) {
  try {
    const {
      name,
      email,
      dob,
      registrationFee = 0,
      paymentMethod = "CASH",
      ...studentData
    } = req.body;


    /* =========================
       VALIDATION
    ========================= */

    if (!name?.trim()) {
      return res.status(400).json({
        message:
          "Student name is required."
      });
    }


    /*
      Email is required because
      it will be student's login ID.
    */

    if (!email?.trim()) {
      return res.status(400).json({
        message:
          "Student email is required."
      });
    }


    /*
      DOB is required because
      DOB will be initial password.
    */

    if (!dob) {
      return res.status(400).json({
        message:
          "Date of birth is required because it is used as the initial login password."
      });
    }


    if (!studentData.className?.trim()) {
      return res.status(400).json({
        message:
          "Class is required."
      });
    }


    if (!studentData.section?.trim()) {
      return res.status(400).json({
        message:
          "Section is required."
      });
    }


    if (!studentData.session?.trim()) {
      return res.status(400).json({
        message:
          "Session is required."
      });
    }


    /* =========================
       NORMALIZE EMAIL
    ========================= */

    const loginEmail =
      email
        .trim()
        .toLowerCase();


    /* =========================
       CHECK EMAIL
    ========================= */

    const existingUser =
      await User.findOne({
        email:
          loginEmail
      });

    if (existingUser) {
      return res.status(409).json({
        message:
          "This email is already registered. Please use another email."
      });
    }


    /* =========================
       CREATE DOB PASSWORD
    ========================= */

    const initialPassword =
      dobToPassword(dob);

    if (!initialPassword) {
      return res.status(400).json({
        message:
          "Invalid date of birth."
      });
    }


    /* =========================
       FEE
    ========================= */

    const fee =
      Number(
        registrationFee
      ) || 0;

    if (fee < 0) {
      return res.status(400).json({
        message:
          "Registration fee cannot be negative."
      });
    }


    /* =========================
       NUMBERS
    ========================= */

    const registrationNo =
      req.body.registrationNo ||
      code("REG");

    const admissionNo =
      req.body.admissionNo ||
      code("ADM");


    /* =========================
       CREATE STUDENT
    ========================= */

    const student =
      await Student.create({
        ...studentData,

        name:
          name.trim(),

        email:
          loginEmail,

        dob,

        registrationNo,

        admissionNo,

        registrationFee:
          fee,

        admissionFee:
          0,

        status:
          "ACTIVE",

        active:
          true
      });


    /* =========================
       CREATE STUDENT LOGIN USER
    ========================= */

    const hashedPassword =
      await bcrypt.hash(
        initialPassword,
        12
      );


    const user =
      await User.create({
        name:
          name.trim(),

        email:
          loginEmail,

        phone:
          studentData.phone ||
          undefined,

        password:
          hashedPassword,

        role:
          "STUDENT",

        /*
          Student will be asked
          to change password after
          first login.
        */

        mustChangePassword:
          true,

        active:
          true,

        /*
          Connect User with Student
        */

        profileRef:
          student._id,

        profileModel:
          "Student"
      });


    /* =========================
       CONNECT STUDENT WITH USER
    ========================= */

    student.user =
      user._id;

    await student.save();


    /* =========================
       REGISTRATION
    ========================= */

    const registration =
      await Registration.create({
        registrationNo,

        student:
          student._id,

        fee,

        status:
          "COMPLETED",

        createdBy:
          req.user._id
      });


    /* =========================
       ADMISSION
    ========================= */

    const admission =
      await Admission.create({
        student:
          student._id,

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

        admissionDate:
          new Date(),

        status:
          "COMPLETED",

        notes:
          "Admission completed automatically during student registration.",

        createdBy:
          req.user._id
      });


    /* =========================
       PAYMENT
    ========================= */

    let payment =
      null;

    if (fee > 0) {
      payment =
        await Payment.create({
          receiptNo:
            code("REC"),

          student:
            student._id,

          type:
            "REGISTRATION",

          amount:
            fee,

          method:
            paymentMethod,

          date:
            new Date(),

          receivedBy:
            req.user._id,

          description:
            "Registration / Admission fee"
        });
    }


    /* =========================
       RESPONSE
    ========================= */

    res.status(201).json({
      success: true,

      message:
        "Student registration and admission completed successfully.",

      student,

      payment,

      registration,

      admission,


      /*
        LOGIN DETAILS

        Password is returned only
        during registration response.
      */

      loginCredentials: {
        email:
          loginEmail,

        temporaryPassword:
          initialPassword
      },


      receipt:
        payment
          ? {
              receiptNo:
                payment.receiptNo,

              amount:
                payment.amount,

              method:
                payment.method,

              type:
                payment.type
            }
          : null,


      registrationSummary: {
        registrationNo,

        admissionNo,

        registrationFee:
          fee,

        admissionFee:
          0,

        totalCollected:
          fee,

        status:
          "ACTIVE"
      }
    });

  } catch (error) {

    console.error(
      "Student registration error:",
      error
    );

    res.status(500).json({
      message:
        error?.message ||
        "Student registration nahi ho paayi."
    });
  }
}


/* =========================
   PAYMENTS
========================= */

export async function payments(
  req,
  res
) {
  try {
    const {
      studentId,
      type,
      from,
      to
    } = req.query;

    const filter = {};

    if (studentId) {
      filter.student =
        studentId;
    }

    if (type) {
      filter.type =
        type;
    }

    if (from || to) {
      filter.date = {};

      if (from) {
        filter.date.$gte =
          new Date(from);
      }

      if (to) {
        const endDate =
          new Date(to);

        endDate.setHours(
          23,
          59,
          59,
          999
        );

        filter.date.$lte =
          endDate;
      }
    }

    const data =
      await Payment.find(
        filter
      )
        .populate(
          "student",
          "name admissionNo registrationNo className section"
        )
        .populate(
          "receivedBy",
          "name email"
        )
        .sort({
          date: -1
        });

    res.json({
      success: true,

      payments:
        data
    });

  } catch (error) {

    console.error(
      "Payments error:",
      error
    );

    res.status(500).json({
      message:
        error?.message ||
        "Payments load nahi ho paayi."
    });
  }
}


/* =========================
   COLLECT PAYMENT
========================= */

export async function collectPayment(
  req,
  res
) {
  try {
    const {
      studentId,
      type,
      amount,
      method = "CASH",
      date,
      description
    } = req.body;

    if (!studentId) {
      return res.status(400).json({
        message:
          "Student is required."
      });
    }

    if (!type) {
      return res.status(400).json({
        message:
          "Payment type is required."
      });
    }

    const paymentAmount =
      Number(amount);

    if (
      !Number.isFinite(
        paymentAmount
      ) ||
      paymentAmount <= 0
    ) {
      return res.status(400).json({
        message:
          "Valid payment amount is required."
      });
    }

    const student =
      await Student.findById(
        studentId
      ).lean();

    if (!student) {
      return res.status(404).json({
        message:
          "Student not found."
      });
    }

    const paymentDate =
      date
        ? new Date(date)
        : new Date();

    if (
      Number.isNaN(
        paymentDate.getTime()
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid payment date."
      });
    }


    /* =========================
       TUITION PAYMENT
    ========================= */

    if (
      String(type)
        .toUpperCase() ===
      "TUITION"
    ) {

      if (!student.session) {
        return res.status(400).json({
          message:
            "Student session is missing."
        });
      }

      const feeStructure =
        await findStudentFeeStructure(
          student,
          student.session
        );

      if (!feeStructure) {
        return res.status(400).json({
          message:
            "No active fee structure found for this student's class and session."
        });
      }

      const applicable =
        calculateApplicableFee(
          feeStructure,
          paymentDate,
          student.session
        );

      if (
        applicable.total <= 0
      ) {
        return res.status(400).json({
          message:
            "No tuition fee is due for this period."
        });
      }

      const periodStart =
        applicable.items.reduce(
          (
            min,
            item
          ) =>
            !min ||
            item.periodStart <
              min
              ? item.periodStart
              : min,
          null
        );

      const periodEnd =
        applicable.items.reduce(
          (
            max,
            item
          ) =>
            !max ||
            item.periodEnd >
              max
              ? item.periodEnd
              : max,
          null
        );

      const existingPayments =
        await Payment.find({
          student:
            student._id,

          type:
            "TUITION",

          date: {
            $gte:
              periodStart,

            $lt:
              periodEnd
          }
        })
          .select(
            "amount date"
          )
          .lean();

      const alreadyPaid =
        calculatePaidAmount(
          applicable.items,
          existingPayments
        );

      const due =
        Math.max(
          Number(
            applicable.total ||
              0
          ) -
            alreadyPaid,
          0
        );

      if (due <= 0) {
        return res.status(400).json({
          message:
            "This student's fee is already fully paid for this period."
        });
      }

      if (
        paymentAmount >
        due
      ) {
        return res.status(400).json({
          message:
            `Maximum payable amount is ₹${due}.`
        });
      }
    }


    /* =========================
       CREATE PAYMENT
    ========================= */

    const payment =
      await Payment.create({
        receiptNo:
          code("REC"),

        student:
          student._id,

        type,

        amount:
          paymentAmount,

        method,

        date:
          paymentDate,

        description,

        receivedBy:
          req.user._id
      });


    res.status(201).json({
      success: true,

      message:
        "Payment collected successfully.",

      payment
    });

  } catch (error) {

    console.error(
      "Collect payment error:",
      error
    );

    res.status(500).json({
      message:
        error?.message ||
        "Payment collect nahi ho paaya."
    });
  }
}


/* =========================
   FEE STUDENTS
========================= */

export async function feeStudents(
  req,
  res
) {
  try {
    const {
      session,
      year,
      month,
      classId,
      className,
      section,
      search,
      status = "ALL"
    } = req.query;

    if (!session) {
      return res.status(400).json({
        message:
          "Session is required."
      });
    }

    if (
      !year ||
      !month
    ) {
      return res.status(400).json({
        message:
          "Year and month are required."
      });
    }

    const selectedYear =
      Number(year);

    const selectedMonth =
      Number(month);

    if (
      !Number.isInteger(
        selectedYear
      ) ||
      !Number.isInteger(
        selectedMonth
      ) ||
      selectedMonth < 1 ||
      selectedMonth > 12
    ) {
      return res.status(400).json({
        message:
          "Invalid year or month."
      });
    }


    /* =========================
       STUDENT FILTER
    ========================= */

    const studentQuery = {
      active: true
    };

    /*
      "ALL" means all active students.

      Actual session means only students
      from that academic session.
    */

    if (
      String(session)
        .toUpperCase() !==
      "ALL"
    ) {
      studentQuery.session =
        session;
    }

    if (classId) {
      studentQuery.classId =
        classId;
    }

    if (className) {
      studentQuery.className =
        className;
    }

    if (section) {
      studentQuery.section =
        section;
    }

    if (search?.trim()) {
      const regex =
        new RegExp(
          search.trim(),
          "i"
        );

      studentQuery.$or = [
        {
          name: regex
        },

        {
          admissionNo:
            regex
        },

        {
          registrationNo:
            regex
        },

        {
          phone:
            regex
        },

        {
          email:
            regex
        }
      ];
    }


    /* =========================
       GET STUDENTS
    ========================= */

    const students =
      await Student.find(
        studentQuery
      )
        .populate(
          "classId",
          "name classCode sections"
        )
        .sort({
          name: 1
        })
        .lean();

    if (!students.length) {
      return res.json({
        success: true,

        students: [],

        summary: {
          totalStudents:
            0,

          totalFee:
            0,

          totalPaid:
            0,

          totalDue:
            0,

          dueStudents:
            0,

          partialStudents:
            0,

          paidStudents:
            0
        }
      });
    }


    /* =========================
       SELECTED DATE
    ========================= */

    const selectedDate =
      new Date(
        selectedYear,
        selectedMonth - 1,
        1,
        12,
        0,
        0,
        0
      );


    /* =========================
       LOAD TUITION PAYMENTS
    ========================= */

    const payments =
      await Payment.find({
        type:
          "TUITION",

        student: {
          $in:
            students.map(
              student =>
                student._id
            )
        }
      })
        .select(
          "student amount date type"
        )
        .lean();


    const paymentMap =
      new Map();

    for (
      const payment of payments
    ) {
      const id =
        String(
          payment.student
        );

      if (
        !paymentMap.has(id)
      ) {
        paymentMap.set(
          id,
          []
        );
      }

      paymentMap
        .get(id)
        .push(payment);
    }


    /* =========================
       CALCULATE FEE
       FOR EACH STUDENT
    ========================= */

    const result = [];

    for (
      const student of students
    ) {

      if (!student.session) {
        result.push({
          ...student,

          feeStructure:
            null,

          feeItems:
            [],

          totalFee:
            0,

          feeAmount:
            0,

          monthlyTuitionFee:
            0,

          monthlyTuitionPaid:
            0,

          paidAmount:
            0,

          dueAmount:
            0,

          status:
            "NO_FEE_STRUCTURE"
        });

        continue;
      }


      const feeStructure =
        await findStudentFeeStructure(
          student,
          student.session
        );


      /*
        No fee structure means
        no fee due.
      */

      if (!feeStructure) {
        result.push({
          ...student,

          feeStructure:
            null,

          feeItems:
            [],

          totalFee:
            0,

          feeAmount:
            0,

          monthlyTuitionFee:
            0,

          monthlyTuitionPaid:
            0,

          paidAmount:
            0,

          dueAmount:
            0,

          status:
            "NO_FEE_STRUCTURE"
        });

        continue;
      }


      /* =========================
         APPLICABLE FEE
      ========================= */

      const applicable =
        calculateApplicableFee(
          feeStructure,
          selectedDate,
          student.session
        );

      const totalFee =
        Number(
          applicable.total ||
            0
        );


      /* =========================
         STUDENT PAYMENTS
      ========================= */

      const studentPayments =
        paymentMap.get(
          String(
            student._id
          )
        ) || [];


      /* =========================
         PAID AMOUNT
      ========================= */

      const paidAmount =
        calculatePaidAmount(
          applicable.items,
          studentPayments
        );


      /* =========================
         DUE AMOUNT
      ========================= */

      const dueAmount =
        Math.max(
          totalFee -
            paidAmount,
          0
        );


      /* =========================
         STATUS
      ========================= */

      let feeStatus =
        "NO_DUE";

      if (
        totalFee > 0
      ) {

        if (
          dueAmount <= 0
        ) {
          feeStatus =
            "PAID";

        } else if (
          paidAmount > 0
        ) {
          feeStatus =
            "PARTIAL";

        } else {
          feeStatus =
            "DUE";
        }
      }


      /* =========================
         MONTHLY FEE
      ========================= */

      const monthlyFee =
        applicable.items
          .filter(
            item =>
              item.frequency ===
              "MONTHLY"
          )
          .reduce(
            (
              sum,
              item
            ) =>
              sum +
              Number(
                item.amount ||
                  0
              ),
            0
          );


      const monthlyPaid =
        calculatePaidAmount(
          applicable.items.filter(
            item =>
              item.frequency ===
              "MONTHLY"
          ),
          studentPayments
        );


      /* =========================
         STATUS FILTER
      ========================= */

      const requestedStatus =
        String(
          status || "ALL"
        ).toUpperCase();

      if (
        requestedStatus !==
        "ALL"
      ) {

        const matches =
          requestedStatus ===
          "DUE"
            ? (
                feeStatus ===
                  "DUE" ||
                feeStatus ===
                  "PARTIAL"
              )
            : requestedStatus ===
              feeStatus;

        if (!matches) {
          continue;
        }
      }


      /* =========================
         RESULT
      ========================= */

      result.push({
        ...student,

        feeStructure: {
          _id:
            feeStructure._id,

          classId:
            feeStructure.classId,

          className:
            feeStructure.className,

          session:
            feeStructure.session,

          items:
            feeStructure.items
        },

        feeItems:
          applicable.items,

        totalFee,

        feeAmount:
          totalFee,

        monthlyTuitionFee:
          monthlyFee,

        monthlyTuitionPaid:
          monthlyPaid,

        paidAmount,

        dueAmount,

        status:
          feeStatus
      });
    }


    /* =========================
       SUMMARY
    ========================= */

    const summary =
      result.reduce(
        (
          acc,
          student
        ) => {

          acc.totalStudents +=
            1;

          acc.totalFee +=
            Number(
              student.totalFee ||
                0
            );

          acc.totalPaid +=
            Number(
              student.paidAmount ||
                0
            );

          acc.totalDue +=
            Number(
              student.dueAmount ||
                0
            );

          if (
            student.status ===
            "DUE"
          ) {
            acc.dueStudents +=
              1;
          }

          if (
            student.status ===
            "PARTIAL"
          ) {
            acc.partialStudents +=
              1;
          }

          if (
            student.status ===
            "PAID"
          ) {
            acc.paidStudents +=
              1;
          }

          return acc;
        },
        {
          totalStudents:
            0,

          totalFee:
            0,

          totalPaid:
            0,

          totalDue:
            0,

          dueStudents:
            0,

          partialStudents:
            0,

          paidStudents:
            0
        }
      );


    res.json({
      success: true,

      year:
        selectedYear,

      month:
        selectedMonth,

      session,

      students:
        result,

      summary
    });

  } catch (error) {

    console.error(
      "Fee students error:",
      error
    );

    res.status(500).json({
      message:
        error?.message ||
        "Fee students load nahi ho paaye."
    });
  }
}


/* =========================
   EXPENSES
========================= */

export async function expenses(
  req,
  res
) {
  try {
    const {
      from,
      to,
      category
    } = req.query;

    const filter = {};

    if (category) {
      filter.category =
        category;
    }

    if (
      from ||
      to
    ) {
      filter.date = {};

      if (from) {
        filter.date.$gte =
          new Date(from);
      }

      if (to) {
        const endDate =
          new Date(to);

        endDate.setHours(
          23,
          59,
          59,
          999
        );

        filter.date.$lte =
          endDate;
      }
    }

    const data =
      await Expense.find(
        filter
      )
        .populate(
          "paidBy",
          "name email"
        )
        .sort({
          date: -1
        });

    res.json({
      success: true,

      expenses:
        data
    });

  } catch (error) {

    console.error(
      "Expenses error:",
      error
    );

    res.status(500).json({
      message:
        error?.message ||
        "Expenses load nahi ho paayi."
    });
  }
}


/* =========================
   ADD EXPENSE
========================= */

export async function addExpense(
  req,
  res
) {
  try {
    const {
      category,
      description,
      amount,
      method = "CASH",
      date
    } = req.body;

    if (!category) {
      return res.status(400).json({
        message:
          "Expense category is required."
      });
    }

    const value =
      Number(amount);

    if (
      !value ||
      value <= 0
    ) {
      return res.status(400).json({
        message:
          "Valid expense amount is required."
      });
    }

    const expense =
      await Expense.create({
        voucherNo:
          code("VCH"),

        category,

        description,

        amount:
          value,

        method,

        date:
          date
            ? new Date(date)
            : new Date(),

        paidBy:
          req.user._id
      });

    res.status(201).json({
      success: true,

      message:
        "Expense added successfully.",

      expense
    });

  } catch (error) {

    console.error(
      "Add expense error:",
      error
    );

    res.status(500).json({
      message:
        error?.message ||
        "Expense add nahi ho paaya."
    });
  }
}


/* =========================
   FEE STRUCTURES
========================= */

export async function feeStructures(
  req,
  res
) {
  try {
    const {
      classId,
      session
    } = req.query;

    const filter = {
      active: true
    };

    if (classId) {
      filter.classId =
        classId;
    }

    if (session) {
      filter.session =
        session;
    }

    const data =
      await FeeStructure.find(
        filter
      )
        .populate(
          "classId",
          "name classCode"
        )
        .sort({
          createdAt: -1
        });

    res.json({
      success: true,

      feeStructures:
        data
    });

  } catch (error) {

    console.error(
      "Fee structures error:",
      error
    );

    res.status(500).json({
      message:
        error?.message ||
        "Fee structures load nahi ho paayi."
    });
  }
}


/* =========================
   CREATE FEE STRUCTURE
========================= */

export async function createFeeStructure(
  req,
  res
) {
  try {
    const {
      classId,
      className,
      session,
      items
    } = req.body;


    /* =========================
       SESSION VALIDATION
    ========================= */

    const finalSession =
      String(
        session || ""
      ).trim();

    if (!finalSession) {
      return res.status(400).json({
        message:
          "Session is required."
      });
    }


    /* =========================
       ITEMS VALIDATION
    ========================= */

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        message:
          "Fee items are required."
      });
    }


    /* =========================
       NORMALIZE ITEMS
    ========================= */

    const allowedFrequencies = [
      "MONTHLY",
      "QUARTERLY",
      "HALF_YEARLY",
      "YEARLY",
      "ONE_TIME"
    ];

    const normalizedItems =
      items.map(
        item => {

          const name =
            String(
              item?.name ||
                ""
            ).trim();

          const amount =
            Number(
              item?.amount
            );

          const frequency =
            normalizeFrequency(
              item?.frequency
            );


          if (!name) {
            throw new Error(
              "Fee item name is required."
            );
          }


          if (
            !Number.isFinite(
              amount
            ) ||
            amount < 0
          ) {
            throw new Error(
              `Invalid amount for fee item "${name}".`
            );
          }


          if (
            !allowedFrequencies.includes(
              frequency
            )
          ) {
            throw new Error(
              `Invalid frequency for fee item "${name}".`
            );
          }


          return {
            name,

            amount,

            frequency
          };
        }
      );


    /* =========================
       CLASS
    ========================= */

    let finalClassName =
      String(
        className || ""
      ).trim();


    if (classId) {

      const classroom =
        await ClassRoom.findById(
          classId
        )
          .select(
            "_id name classCode"
          )
          .lean();

      if (!classroom) {
        return res.status(404).json({
          message:
            "Selected class not found."
        });
      }

      finalClassName =
        classroom.name;
    }


    if (!finalClassName) {
      return res.status(400).json({
        message:
          "Class is required."
      });
    }


    /* =========================
       CREATE FEE STRUCTURE
    ========================= */

    const feeStructure =
      await FeeStructure.create({
        classId:
          classId ||
          null,

        className:
          finalClassName,

        session:
          finalSession,

        items:
          normalizedItems,

        active:
          true
      });


    /* =========================
       COUNT APPLICABLE STUDENTS
    ========================= */

    const studentFilter = {
      active:
        true,

      session:
        finalSession
    };


    if (classId) {
      studentFilter.classId =
        classId;
    } else {
      studentFilter.className =
        finalClassName;
    }


    const studentCount =
      await Student.countDocuments(
        studentFilter
      );


    res.status(201).json({
      success: true,

      message:
        "Fee structure created successfully. Applicable students will now show their fee as DUE until payment is collected.",

      feeStructure,

      applicableStudents:
        studentCount
    });

  } catch (error) {

    console.error(
      "Create fee structure error:",
      error
    );

    res.status(500).json({
      message:
        error?.message ||
        "Fee structure create nahi ho paaya."
    });
  }
}

/* =========================
   UPDATE FEE STRUCTURE
========================= */

export async function updateFeeStructure(req, res) {
  try {
    const {
      id
    } = req.params;

    const {
      classId,
      className,
      session,
      items,
      active
    } = req.body;

    const feeStructure =
      await FeeStructure.findByIdAndUpdate(
        id,
        {
          ...(classId !== undefined && {
            classId:
              classId || null
          }),

          ...(className !== undefined && {
            className
          }),

          ...(session !== undefined && {
            session
          }),

          ...(items !== undefined && {
            items
          }),

          ...(active !== undefined && {
            active
          })
        },
        {
          new: true,
          runValidators: true
        }
      );

    if (!feeStructure) {
      return res.status(404).json({
        message:
          "Fee structure not found."
      });
    }

    res.json({
      success: true,

      message:
        "Fee structure updated successfully.",

      feeStructure
    });

  } catch (error) {

    console.error(
      "Update fee structure error:",
      error
    );

    res.status(500).json({
      message:
        error?.message ||
        "Fee structure update nahi ho paaya."
    });
  }
}


/* =========================
   BULK COLLECT PAYMENT
========================= */

export async function bulkCollectPayment(
  req,
  res
) {
  try {
    const {
      studentIds,
      amount,
      method = "CASH",
      date,
      description
    } = req.body;

    if (
      !Array.isArray(studentIds) ||
      studentIds.length === 0
    ) {
      return res.status(400).json({
        message:
          "Students are required."
      });
    }

    const value =
      Number(amount);

    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      return res.status(400).json({
        message:
          "Valid amount is required."
      });
    }

    const paymentDate =
      date
        ? new Date(date)
        : new Date();

    if (
      Number.isNaN(
        paymentDate.getTime()
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid payment date."
      });
    }

    const students =
      await Student.find({
        _id: {
          $in:
            studentIds
        },

        active:
          true
      }).lean();

    if (
      students.length !==
      studentIds.length
    ) {
      return res.status(400).json({
        message:
          "One or more students not found."
      });
    }

    const createdPayments =
      [];

    const skipped =
      [];

    for (
      const student of students
    ) {

      if (!student.session) {
        skipped.push({
          studentId:
            student._id,

          name:
            student.name,

          reason:
            "Student session is missing."
        });

        continue;
      }


      /* =========================
         FIND FEE STRUCTURE
      ========================= */

      const feeStructure =
        await findStudentFeeStructure(
          student,
          student.session
        );

      if (!feeStructure) {
        skipped.push({
          studentId:
            student._id,

          name:
            student.name,

          reason:
            "No active fee structure found."
        });

        continue;
      }


      /* =========================
         APPLICABLE FEE
      ========================= */

      const applicable =
        calculateApplicableFee(
          feeStructure,
          paymentDate,
          student.session
        );

      if (
        applicable.total <= 0
      ) {
        skipped.push({
          studentId:
            student._id,

          name:
            student.name,

          reason:
            "No fee is due for this period."
        });

        continue;
      }


      /* =========================
         PERIOD
      ========================= */

      const periodStart =
        applicable.items.reduce(
          (
            min,
            item
          ) =>
            !min ||
            item.periodStart <
              min
              ? item.periodStart
              : min,
          null
        );

      const periodEnd =
        applicable.items.reduce(
          (
            max,
            item
          ) =>
            !max ||
            item.periodEnd >
              max
              ? item.periodEnd
              : max,
          null
        );


      /* =========================
         EXISTING PAYMENTS
      ========================= */

      const existingPayments =
        await Payment.find({
          student:
            student._id,

          type:
            "TUITION",

          date: {
            $gte:
              periodStart,

            $lt:
              periodEnd
          }
        })
          .select(
            "amount date"
          )
          .lean();


      const alreadyPaid =
        calculatePaidAmount(
          applicable.items,
          existingPayments
        );


      /* =========================
         CURRENT DUE
      ========================= */

      const due =
        Math.max(
          Number(
            applicable.total ||
              0
          ) -
            alreadyPaid,
          0
        );


      if (due <= 0) {
        skipped.push({
          studentId:
            student._id,

          name:
            student.name,

          reason:
            "Fee already fully paid."
        });

        continue;
      }


      /*
        Bulk collection me agar entered amount
        due se zyada hai to sirf due amount
        collect hoga.
      */

      const collectAmount =
        Math.min(
          value,
          due
        );


      /* =========================
         CREATE PAYMENT
      ========================= */

      const payment =
        await Payment.create({
          receiptNo:
            code("REC"),

          student:
            student._id,

          type:
            "TUITION",

          amount:
            collectAmount,

          method,

          date:
            paymentDate,

          description:
            description ||
            "Bulk tuition payment",

          receivedBy:
            req.user._id
        });


      createdPayments.push(
        payment
      );
    }


    /* =========================
       RESPONSE
    ========================= */

    res.status(201).json({
      success: true,

      message:
        "Bulk payment processing completed.",

      payments:
        createdPayments,

      skipped,

      collectedStudents:
        createdPayments.length,

      skippedStudents:
        skipped.length
    });

  } catch (error) {

    console.error(
      "Bulk payment error:",
      error
    );

    res.status(500).json({
      message:
        error?.message ||
        "Bulk payment collect nahi ho paaya."
    });
  }
}


/* =========================
   FINANCE REPORT
========================= */

export async function financeReport(
  req,
  res
) {
  try {
    const {
      from,
      to
    } = req.query;

    const match = {};


    /* =========================
       DATE FILTER
    ========================= */

    if (
      from ||
      to
    ) {
      match.date = {};

      if (from) {
        match.date.$gte =
          new Date(from);
      }

      if (to) {
        const endDate =
          new Date(to);

        endDate.setHours(
          23,
          59,
          59,
          999
        );

        match.date.$lte =
          endDate;
      }
    }


    /* =========================
       INCOME + EXPENSE
    ========================= */

    const [
      incomeAgg,
      expenseAgg
    ] = await Promise.all([

      Payment.aggregate([
        {
          $match:
            match
        },

        {
          $group: {
            _id:
              "$type",

            total: {
              $sum:
                "$amount"
            }
          }
        }
      ]),

      Expense.aggregate([
        {
          $match:
            match
        },

        {
          $group: {
            _id:
              "$category",

            total: {
              $sum:
                "$amount"
            }
          }
        }
      ])
    ]);


    /* =========================
       TOTAL INCOME
    ========================= */

    const totalIncome =
      incomeAgg.reduce(
        (
          sum,
          item
        ) =>
          sum +
          item.total,
        0
      );


    /* =========================
       TOTAL EXPENSE
    ========================= */

    const totalExpense =
      expenseAgg.reduce(
        (
          sum,
          item
        ) =>
          sum +
          item.total,
        0
      );


    /* =========================
       RESPONSE
    ========================= */

    res.json({
      success: true,

      income:
        incomeAgg,

      expenses:
        expenseAgg,

      totalIncome,

      totalExpense,

      balance:
        totalIncome -
        totalExpense
    });

  } catch (error) {

    console.error(
      "Finance report error:",
      error
    );

    res.status(500).json({
      message:
        error?.message ||
        "Finance report load nahi ho paayi."
    });
  }
}


/* =========================
   CREATE ACCOUNT
========================= */

export async function createAccount(
  req,
  res
) {
  try {
    const {
      name,
      email,
      phone,
      password,
      role
    } = req.body;


    /* =========================
       VALIDATION
    ========================= */

    if (
      !name ||
      !password ||
      !role
    ) {
      return res.status(400).json({
        message:
          "Name, password and role are required"
      });
    }


    /* =========================
       CREATE USER
    ========================= */

    const user =
      await User.create({
        name,

        email,

        phone,

        role,

        password:
          await bcrypt.hash(
            password,
            12
          ),

        mustChangePassword:
          true,

        active:
          true
      });


    /* =========================
       RESPONSE
    ========================= */

    res.status(201).json({
      message:
        "Account created",

      user:
        cleanUser(user)
    });

  } catch (error) {

    console.error(
      "Create account error:",
      error
    );

    res.status(500).json({
      message:
        error?.message ||
        "Account create nahi ho paaya."
    });
  }
}