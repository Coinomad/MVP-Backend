
import { employeeSchema, employeeUpdateSchema } from "../helpers/validation.js";
import {
  Employee,
  Employer,

  // User,
} from "../model/userModel.js";

export const registerEmployee = async (req, res) => {
  const employerId = req.user.id;
  try {
    // Validation of data entered
    const { value, error } = employeeSchema.validate(req.body);
    if (error) {
      console.log(error.message);
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Check if email is already used
    const existingEmployee = await Employee.findOne({
      email: value.email,
    });
    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: "Email is already in use",
      });
    }
    const existingEmployeeWallet = await Employee.findOne({
      walletAddress: value.walletAddress,
    });
    if (existingEmployeeWallet) {
      return res.status(400).json({
        success: false,
        message: "Wallet Address is already exist",
      });
    }

    // Find employer by unique link
    const employer = await Employer.findById(employerId);
    if (!employer) {
      return res.status(404).json({
        success: false,
        message: "Employer not found",
      });
    }

    // Link employee to employer
    value.employer = employer;

    // Save the employee in MongoDB
    const newEmployee = new Employee(value);
    await newEmployee.save();

    // Add employee to employer's employee list
    employer.employees.push(newEmployee._id);
    await employer.save();

    return res.status(201).json({
      success: true,
      message: "Employee Added Successfully",
    });
  } catch (error) {
    console.error("signup-error", error);
    return res.status(500).json({
      success: false,
      message: "Cannot Register",
    });
  }
};

export const getEmployees = async (req, res) => {
  const employerId = req.user.id;
  try {
    // Find the Employer by email
    const employer = await Employer.findById(employerId);
    if (!employer) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }
    // Find employees under the employer
    const employees = await Employee.find({ employer: employer._id })
      .populate("employer")
      .populate("transactions")
      .populate("scheduleTransaction");

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Employees found successfully",
      data: employees.map((employee) => ({
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        asset: employee.asset,
        walletAddress: employee.walletAddress,
        employeeId: employee._id,
        scheduleTransaction: employee.scheduleTransaction,
      }))
    });
  } catch (err) {
    console.error("Login error", err);
    return res.status(500).json({
      success: false,
      message: "Couldn't login. Please try again later.",
    });
  }
};

export const updateEmployeeData = async (req, res) => {
  const {employeeId} = req.params;
  const employerId = req.user.id;
  try {
    const { value, error } = employeeUpdateSchema.validate(req.body);
    if (error) {
      console.log(error.message);
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Find the Employer by email
    const employer = await Employer.findById(employerId);
    if (!employer) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Check if the employee belongs to the employer
    const employee = await Employee.findOne({
      _id: employeeId,
      employer: employer._id,
    });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found or does not belong to your company",
      });
    }

    // Update and save employee
    const updatedEmployee = await Employee.findByIdAndUpdate(
      employeeId,
      value,
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      data: updatedEmployee,
    });
  } catch (error) {
    console.error("update-employee-error", error);
    return res.status(500).json({
      success: false,
      message: "Couldn't update. Please try again later.",
    });
  }
};

export const deleteEmployee = async (req, res) => {
  const { employeeId } = req.params;
  const employerId = req.user.id;
  try {
    
    // Find the Employer by email
    const employer = await Employer.findById(employerId);
    if (!employer) {
      return res.status(404).json({
        success: false,
        message: "Employer not found",
      });
    }

    // Check if the employee belongs to the employer
    const employee = await Employee.findOne({
      _id: employeeId,
      employer: employer._id,
    });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found or does not belong to your company",
      });
    }

    // Delete the employee
     await Employee.findByIdAndDelete(employeeId);

    return res.status(200).json({
      success: true,
      message: "Employee deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting employee", err);
    return res.status(500).json({
      success: false,
      message: "Couldn't delete employee. Please try again later.",
    });
  }
};
