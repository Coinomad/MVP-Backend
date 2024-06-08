import express from "express";
import {
  employerActivate,
  employerForgotPassword,
  employerLogin,
  employerResendToken,
  employerResetPassword,
  employerSignup,
} from "../controllers/employerAuthController.js";

const employerauthRoutes = express.Router();

employerauthRoutes.post("/signup", employerSignup);

employerauthRoutes.post("/resendtoken", employerResendToken);

employerauthRoutes.patch("/activate", employerActivate);

employerauthRoutes.post("/login", employerLogin);

employerauthRoutes.patch("/forgot", employerForgotPassword);

employerauthRoutes.patch("/reset", employerResetPassword);

// employerauthRoutes.get("/logout", validateToken, Logout);

export default employerauthRoutes;
