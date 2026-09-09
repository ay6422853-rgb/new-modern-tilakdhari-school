import { Router } from "express";
import { auth, roles } from "../middleware/auth.js";
import * as controller from "../controllers/principal.js";

const router = Router();

router.use(
  auth,
  roles("PRINCIPAL")
);

/* Dashboard */
router.get("/dashboard", controller.dashboard);

/* Students */
router.get("/students", controller.listStudents);
router.get("/students/:id", controller.getStudent);
router.post("/students", controller.createStudent);
router.put("/students/:id", controller.updateStudent);
router.delete("/students/:id", controller.deleteStudent);

/* Teachers */
router.get("/teachers", controller.listTeachers);
router.post("/teachers", controller.createTeacher);

/* Classes */
router.get("/classes", controller.listClasses);
router.post("/classes", controller.createClass);
router.put("/classes/:id", controller.updateClass);
router.delete("/classes/:id", controller.deleteClass);

/* Subjects */
router.get("/subjects", controller.listSubjects);
router.post("/subjects", controller.createSubject);
router.put("/subjects/:id", controller.updateSubject);
router.delete("/subjects/:id", controller.deleteSubject);

/* Users */
router.get("/users", controller.listUsers);
router.post("/users", controller.createUser);
router.put("/users/:id", controller.updateUser);

/* Finance */
router.get("/payments", controller.listPayments);
router.post("/payments", controller.createPayment);

router.get("/expenses", controller.listExpenses);
router.post("/expenses", controller.createExpense);

/* Registration */
router.post(
  "/registrations",
  controller.createRegistration
);


/* Fee Structure */
router.get(
  "/fee-structures",
  controller.listFeeStructures
);

router.post(
  "/fee-structures",
  controller.createFeeStructure
);

router.put(
  "/fee-structures/:id",
  controller.updateFeeStructure
);

/* Attendance */
router.get(
  "/attendance",
  controller.listAttendance
);

router.post(
  "/attendance",
  controller.createAttendance
);

/* Exams */
router.get("/exams", controller.listExams);
router.post("/exams", controller.createExam);

/* Marks */
router.get("/marks", controller.listMarks);
router.post("/marks", controller.createMark);

/* Homework */
router.get(
  "/homework",
  controller.listHomework
);

router.post(
  "/homework",
  controller.createHomework
);

/* Notices */
router.get(
  "/notices",
  controller.listNotices
);

router.post(
  "/notices",
  controller.createNotice
);

/* Events */
router.get(
  "/events",
  controller.listEvents
);

router.post(
  "/events",
  controller.createEvent
);

export default router;