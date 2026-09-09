
import { Router } from "express";

import { auth, roles } from "../middleware/auth.js";

import * as controller from "../controllers/operator.js";

const router = Router();


/*
|--------------------------------------------------------------------------
| OPERATOR AUTHORIZATION
|--------------------------------------------------------------------------
*/

router.use(
  auth,
  roles("OPERATOR")
);


/*
|--------------------------------------------------------------------------
| DASHBOARD
|--------------------------------------------------------------------------
*/

router.get(
  "/dashboard",
  controller.dashboard
);


/*
|--------------------------------------------------------------------------
| STUDENTS
|--------------------------------------------------------------------------
*/

router.get(
  "/students",
  controller.students
);

router.get(
  "/students/:id",
  controller.student
);

router.post(
  "/students",
  controller.createStudent
);

router.put(
  "/students/:id",
  controller.updateStudent
);



/*
|--------------------------------------------------------------------------
| TEACHERS
|--------------------------------------------------------------------------
*/

router.get(
  "/teachers",
  controller.teachers
);

router.post(
  "/teachers",
  controller.createTeacher
);

router.put(
  "/teachers/:id",
  controller.updateTeacher
);

router.delete(
  "/teachers/:id",
  controller.deleteTeacher
);


/*
|--------------------------------------------------------------------------
| CLASSES
|--------------------------------------------------------------------------
*/

router.get(
  "/classes",
  controller.classes
);

router.post(
  "/classes",
  controller.createClass
);

router.put(
  "/classes/:id",
  controller.updateClass
);


/*
|--------------------------------------------------------------------------
| SUBJECTS
|--------------------------------------------------------------------------
*/

router.get(
  "/subjects",
  controller.subjects
);

router.post(
  "/subjects",
  controller.createSubject
);

router.put(
  "/subjects/:id",
  controller.updateSubject
);


/*
|--------------------------------------------------------------------------
| ATTENDANCE
|--------------------------------------------------------------------------
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
| EXAMS
|--------------------------------------------------------------------------
*/

router.get(
  "/exams",
  controller.exams
);

router.post(
  "/exams",
  controller.createExam
);

router.put("/exams/:id/publish", controller.publishExam);

/*
|--------------------------------------------------------------------------
| MARKS
|--------------------------------------------------------------------------
*/

router.get(
  "/marks",
  controller.marks
);

router.post(
  "/marks",
  controller.enterMarks
);

router.post(
  "/marks/bulk",
  controller.bulkEnterMarks
);


/*
|--------------------------------------------------------------------------
| HOMEWORK
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
| NOTICES
|--------------------------------------------------------------------------
*/

router.get(
  "/notices",
  controller.notices
);

router.post(
  "/notices",
  controller.createNotice
);


/*
|--------------------------------------------------------------------------
| EVENTS
|--------------------------------------------------------------------------
*/

router.get(
  "/events",
  controller.events
);

router.post(
  "/events",
  controller.createEvent
);


/*
|--------------------------------------------------------------------------
| ACCOUNT MANAGEMENT
|--------------------------------------------------------------------------
*/

/*
 * Get all accounts
 *
 * Principal account is automatically excluded
 */
router.get(
  "/accounts",
  controller.accounts
);


/*
 * Get one account
 *
 * Principal account cannot be accessed
 */
router.get(
  "/accounts/:id",
  controller.account
);


/*
 * Edit account
 *
 * Operator can update:
 * - Name
 * - Email
 * - Phone
 *
 * Role cannot be changed.
 * Principal account cannot be modified.
 */
router.put(
  "/accounts/:id",
  controller.updateAccount
);


/*
 * Reset password
 *
 * Current password is NOT required.
 */
router.put(
  "/accounts/:id/password",
  controller.resetPassword
);


/*
 * Activate / Deactivate account
 *
 * Principal account cannot be modified.
 */
router.put(
  "/accounts/:id/status",
  controller.updateAccountStatus
);

/*
|--------------------------------------------------------------------------
| TIMETABLE
|--------------------------------------------------------------------------
|
| COMPUTER OPERATOR HAS FULL CONTROL
|
| Operator can:
| - Create timetable
| - Edit timetable
| - Delete timetable
| - Assign class
| - Assign section
| - Assign subject
| - Assign teacher
| - Assign substitute teacher
| - Change day
| - Change period
| - Change timing
| - Change room
| - Change academic session
| - Check teacher availability
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| GET ALL TIMETABLE ENTRIES
|--------------------------------------------------------------------------
|
| Optional query filters:
|
| ?classId=...
| ?section=A
| ?day=Monday
| ?session=2026-27
|
| Examples:
|
| GET /operator/timetable
| GET /operator/timetable?classId=xxxxx
| GET /operator/timetable?day=Monday
|
|--------------------------------------------------------------------------
*/

router.get(
  "/timetable",
  controller.timetable
);


/*
|--------------------------------------------------------------------------
| GET FREE TEACHERS
|--------------------------------------------------------------------------
|
| IMPORTANT:
| This route MUST come before:
|
| /timetable/:id
|
| Otherwise Express may treat "free-teachers" as an ID.
|
| Optional query:
|
| ?day=Monday
| &period=1
|
|--------------------------------------------------------------------------
*/

router.get(
  "/timetable/free-teachers",
  controller.freeTeachers
);


/*
|--------------------------------------------------------------------------
| GET SINGLE TIMETABLE ENTRY
|--------------------------------------------------------------------------
*/

router.get(
  "/timetable/:id",
  controller.timetableEntry
);


/*
|--------------------------------------------------------------------------
| CREATE TIMETABLE ENTRY
|--------------------------------------------------------------------------
*/

router.post(
  "/timetable",
  controller.createTimetable
);


/*
|--------------------------------------------------------------------------
| UPDATE TIMETABLE ENTRY
|--------------------------------------------------------------------------
*/

router.put(
  "/timetable/:id",
  controller.updateTimetable
);


/*
|--------------------------------------------------------------------------
| DELETE TIMETABLE ENTRY
|--------------------------------------------------------------------------
*/

router.delete(
  "/timetable/:id",
  controller.deleteTimetable
);


export default router;
