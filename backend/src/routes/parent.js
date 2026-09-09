import { Router } from "express";
import { auth, roles } from "../middleware/auth.js";
import * as controller from "../controllers/parent.js";

const router = Router();

router.use(
  auth,
  roles("PARENT")
);

router.get(
  "/dashboard",
  controller.dashboard
);

router.get(
  "/profile",
  controller.profile
);

router.get(
  "/children",
  controller.children
);

router.get(
  "/children/:id",
  controller.child
);

router.get(
  "/attendance",
  controller.attendance
);

router.get(
  "/fees",
  controller.fees
);

router.get(
  "/homework",
  controller.homework
);

router.get(
  "/results",
  controller.results
);

router.get(
  "/exams",
  controller.exams
);

router.get(
  "/notices",
  controller.notices
);

export default router;