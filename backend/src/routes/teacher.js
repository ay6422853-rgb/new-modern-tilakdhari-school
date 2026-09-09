
import { Router } from "express";

import { auth, roles } from "../middleware/auth.js";
import * as controller from "../controllers/teacher.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| Teacher Authentication
|--------------------------------------------------------------------------
*/

router.use(
  auth,
  roles("TEACHER")
);

/*
|--------------------------------------------------------------------------
| Dashboard
|--------------------------------------------------------------------------
*/

router.get(
  "/dashboard",
  controller.dashboard
);

/*
|--------------------------------------------------------------------------
| Profile
|--------------------------------------------------------------------------
*/

router.get(
  "/profile",
  controller.profile
);

/*
|--------------------------------------------------------------------------
| Students
|--------------------------------------------------------------------------
|
| Returns:
| - Class Teacher Classes
| - Teaching Classes
| - Class Teacher Students
| - Teaching Students
|
*/

router.get(
  "/students",
  controller.students
);

/*
|--------------------------------------------------------------------------
| Attendance
|--------------------------------------------------------------------------
|
| Attendance is allowed only for the class where
| the teacher is assigned as Class Teacher.
|
*/

router.get(
  "/attendance",
  controller.attendance
);

router.post(
  "/attendance",
  controller.markAttendance
);

/*
|--------------------------------------------------------------------------
| Exams
|--------------------------------------------------------------------------
*/

router.get(
  "/exams",
  controller.exams
);

/*
|--------------------------------------------------------------------------
| Marks
|--------------------------------------------------------------------------
|
| Single mark entry
|
*/

router.get(
  "/marks",
  controller.marks
);

router.post(
  "/marks",
  controller.enterMarks
);

/*
|--------------------------------------------------------------------------
| Bulk Marks
|--------------------------------------------------------------------------
|
| Bulk marks entry for an entire class/subject.
|
*/

router.post(
  "/marks/bulk",
  controller.bulkMarks
);

router.post(
  "/marks/class-bulk",
  controller.classBulkMarks
);

/*
|--------------------------------------------------------------------------
| Marksheet
|--------------------------------------------------------------------------
|
| Query examples:
|
| /marksheet?exam=EXAM_ID&student=STUDENT_ID
|
| /marksheet?exam=EXAM_ID&students=ID1,ID2,ID3
|
*/

router.get(
  "/marksheet",
  controller.marksheet
);

/*
|--------------------------------------------------------------------------
| Homework
|--------------------------------------------------------------------------
*/

router.get(
  "/homework",
  controller.homework
);

router.post(
  "/homework",
  controller.createHomework
);

/*
|--------------------------------------------------------------------------
| Notices
|--------------------------------------------------------------------------
*/

router.get(
  "/notices",
  controller.notices
);

/*
|--------------------------------------------------------------------------
| Classes
|--------------------------------------------------------------------------
|
| Returns:
| - Class Teacher Classes
| - Teaching Classes
|
*/

router.get(
  "/classes",
  controller.classes
);

/*
|--------------------------------------------------------------------------
| Subjects
|--------------------------------------------------------------------------
*/

router.get(
  "/subjects",
  controller.subjects
);

/*
|--------------------------------------------------------------------------
| Timetable
|--------------------------------------------------------------------------
*/

router.get(
  "/timetable",
  controller.timetable
);

export default router;
