import { Router } from "express";

import {
  login,
  me,
  changePassword
} from "../controllers/auth.js";

import { auth } from "../middleware/auth.js";

const router = Router();

router.post(
  "/login",
  login
);

router.get(
  "/me",
  auth,
  me
);

router.post(
  "/change-password",
  auth,
  changePassword
);

export default router;