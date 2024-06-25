import express from "express";
import {
  getEmployees,
  registerEmployee,
} from "../controllers/employeeController.js";
import { authMiddleware } from "../middleware/ProtectRoutes.js";

const employeeauthRoutes = express.Router();

employeeauthRoutes.post("/registeremployee", authMiddleware,registerEmployee);

employeeauthRoutes.post("/getemployees",authMiddleware,getEmployees);

// employeeauthRoutes.get("/logout", validateToken, Logout);

export default employeeauthRoutes;
