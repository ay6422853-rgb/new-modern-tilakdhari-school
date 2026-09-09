import { Router } from "express";

import { auth, roles } from "../middleware/auth.js";

import * as controller from "../controllers/Accountant.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| ACCOUNTANT AUTH
|--------------------------------------------------------------------------
*/

router.use(
  auth,
  roles("ACCOUNTANT")
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
| PROFILE
|--------------------------------------------------------------------------
*/

router.get(
  "/profile",
  controller.profile
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

/*
|--------------------------------------------------------------------------
| STUDENT REGISTRATION
|--------------------------------------------------------------------------
*/

router.post(
  "/registrations",
  controller.registerStudent
);


/*
|--------------------------------------------------------------------------
| PAYMENTS
|--------------------------------------------------------------------------
*/

router.get(
  "/payments",
  controller.payments
);

router.post(
  "/payments",
  controller.collectPayment
);

/*
|--------------------------------------------------------------------------
| BULK FEE COLLECTION
|--------------------------------------------------------------------------
*/

router.post(
  "/payments/bulk",
  controller.bulkCollectPayment
);

/*
|--------------------------------------------------------------------------
| FEE STUDENTS
|--------------------------------------------------------------------------
*/

router.get(
  "/fee-students",
  controller.feeStudents
);

/*
|--------------------------------------------------------------------------
| EXPENSES
|--------------------------------------------------------------------------
*/

router.get(
  "/expenses",
  controller.expenses
);

router.post(
  "/expenses",
  controller.addExpense
);

/*
|--------------------------------------------------------------------------
| FEE STRUCTURE
|--------------------------------------------------------------------------
*/

router.get(
  "/fee-structures",
  controller.feeStructures
);

router.post(
  "/fee-structures",
  controller.createFeeStructure
);

router.put(
  "/fee-structures/:id",
  controller.updateFeeStructure
);

/*
|--------------------------------------------------------------------------
| FINANCIAL REPORT
|--------------------------------------------------------------------------
*/

router.get(
  "/reports/finance",
  controller.financeReport
);

/*
|--------------------------------------------------------------------------
| ACCOUNT CREATION
|--------------------------------------------------------------------------
*/

router.post(
  "/accounts",
  controller.createAccount
);

export default router;