import express from "express";
import {
  employerDetails,
  employerEmailSignup,
  employerForgotPassword,
  employerLogin,
  employerResendToken,
  employerResetPassword,
  employerVerfiyEmailSignup,
} from "../controllers/employerAuthController.js";

const employerauthRoutes = express.Router();


employerauthRoutes.post("/signup/email", employerEmailSignup);

employerauthRoutes.post("/signup/verify-email", employerVerfiyEmailSignup);

employerauthRoutes.post("/signup/resend-token", employerResendToken);

employerauthRoutes.post("/signup/employer-details", employerDetails);

employerauthRoutes.post("/login", employerLogin);

employerauthRoutes.patch("/forgot", employerForgotPassword);

employerauthRoutes.patch("/reset", employerResetPassword);

// employerauthRoutes.get("/logout", validateToken, Logout);

export default employerauthRoutes;
