const express = require("express");
const {
  deleteEmployee,
  getEmployees,
  registerEmployee,
  updateEmployeeData,
} = require("../controllers/employeeController.js");
const { authMiddleware } = require("../middleware/ProtectRoutes.js");

const employeeRoutes = express.Router();

employeeRoutes.post("/register", authMiddleware, registerEmployee);

employeeRoutes.get("/getemployees", authMiddleware, getEmployees);

employeeRoutes.put("/update/:employeeId", authMiddleware, updateEmployeeData);

employeeRoutes.delete("/delete/:employeeId", authMiddleware, deleteEmployee);

module.exports = employeeRoutes;
