import { Router } from "express";

import authRoutes from "./auth.js";

import principalRoutes from "./principal.js";
import accountantRoutes from "./accountant.js";
import operatorRoutes from "./operator.js";
import teacherRoutes from "./teacher.js";
import parentRoutes from "./parent.js";
import studentRoutes from "./student.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| AUTH
|--------------------------------------------------------------------------
*/

router.use(
  "/auth",
  authRoutes
);

/*
|--------------------------------------------------------------------------
| PRINCIPAL
|--------------------------------------------------------------------------
*/

router.use(
  "/principal",
  principalRoutes
);

/*
|--------------------------------------------------------------------------
| ACCOUNTANT
|--------------------------------------------------------------------------
*/

router.use(
  "/accountant",
  accountantRoutes
);

/*
|--------------------------------------------------------------------------
| COMPUTER OPERATOR
|--------------------------------------------------------------------------
*/

router.use(
  "/operator",
  operatorRoutes
);

/*
|--------------------------------------------------------------------------
| TEACHER
|--------------------------------------------------------------------------
*/

router.use(
  "/teacher",
  teacherRoutes
);

/*
|--------------------------------------------------------------------------
| PARENT
|--------------------------------------------------------------------------
*/

router.use(
  "/parent",
  parentRoutes
);

/*
|--------------------------------------------------------------------------
| STUDENT
|--------------------------------------------------------------------------
*/

router.use(
  "/student",
  studentRoutes
);

export default router;