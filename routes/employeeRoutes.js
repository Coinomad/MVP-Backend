import express from "express";
import {
  deleteEmployee,
  getEmployees,
  registerEmployee,
  updateEmployeeData,
} from "../controllers/employeeController.js";
import { authMiddleware } from "../middleware/ProtectRoutes.js";

const employeeRoutes = express.Router();

employeeRoutes.post("/register", authMiddleware, registerEmployee);

employeeRoutes.get("/getemployees", authMiddleware, getEmployees);

employeeRoutes.put("/update/:employeeId", authMiddleware, updateEmployeeData);

employeeRoutes.delete(
  "/delete/:employeeId",
  authMiddleware,
  deleteEmployee
);

export default employeeRoutes;
