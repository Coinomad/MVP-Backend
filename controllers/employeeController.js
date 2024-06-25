import {
  generateBTCWallet,
  getWalletBTCBalance,
} from "../helpers/wallets/btcWallet.js";

import { employeeSchema } from "../helpers/validation.js";
import {
  Employee,
  Employer,

  // User,
} from "../model/userModel.js";

export const registerEmployee = async (req, res) => {
  const employeremail = req.user.email;
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

    // Find employer by unique link
    const employer = await Employer.findOne({
      email: employeremail,
    });
    if (!employer) {
      return res.status(404).json({
        success: false,
        message: "Employer not found",
      });
    }

    // Link employee to employer
    value.employer = employer._id;

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

// activate account

export const getEmployees = async (req, res) => {
  const employeremail = req.user.email;

  try {
    // Find the Employer by email
    const employer = await Employer.findOne({ email: employeremail });
    if (!employer) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }
    // Find employees under the employer
    const employees = await Employee.find({ employer: employer._id })
      .populate("employer")
      .populate("transactions");

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Employee logged in successfully",
      data: [...employees],
    });
  } catch (err) {
    console.error("Login error", err);
    return res.status(500).json({
      success: false,
      message: "Couldn't login. Please try again later.",
    });
  }
};
