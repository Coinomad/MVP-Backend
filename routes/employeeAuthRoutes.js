import express from "express";
import {
  employeeActivate,
  employeeForgotPassword,
  employeeLogin,
  employeeResendToken,
  employeeResetPassword,
  employeeSignup,
} from "../controllers/employeeAuthController.js";

const employeeauthRoutes = express.Router();

employeeauthRoutes.post("/signup", employeeSignup);

employeeauthRoutes.post("/resendtoken", employeeResendToken);

employeeauthRoutes.patch("/activate", employeeActivate);

employeeauthRoutes.post("/login", employeeLogin);

employeeauthRoutes.patch("/forgot", employeeForgotPassword);

employeeauthRoutes.patch("/reset", employeeResetPassword);

// employeeauthRoutes.get("/logout", validateToken, Logout);

export default employeeauthRoutes;
