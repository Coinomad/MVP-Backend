import { ConnectionCreatedEvent } from "mongodb";
import {
  generateBTCWallet,
  getWalletBTCBalance,
} from "../helpers/wallets/btcWallet.js";
import { generateJwt } from "../helpers/generateJwt.js";
import { sendEmail } from "../helpers/mailer.js";
import {
  employeeSchema,
  resendTokenSchema,
  userSchemaActivate,
  userSchemaForgotPassword,
  userSchemaLogin,
  userSchemaLogout,
  userSchemaResetPassword,
} from "../helpers/validation.js";
import {
  Employee,
  Employer,

  // User,
} from "../model/userModel.js";

import {
  hashPassword,
  comparePasswords,
  decrypt,
  encrypt,
} from "../helpers/helpers.js";
import { v4 as uuid } from "uuid";
import { generatePolygonWallet } from "../helpers/wallets/polygonWallet.js";

export const employeeSignup = async (req, res) => {
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
      uniqueLink: value.uniqueLink,
      organizationName: value.organizationName,
    });
    if (!employer) {
      return res.status(404).json({
        success: false,
        message: "Employer not found",
      });
    }

    const hash = await hashPassword(value.password);
    // const id = uuid(); // Generate unique id for the employee
    // value.userId = id;
    delete value.confirmPassword;
    value.password = hash;

    const code = Math.floor(100000 + Math.random() * 900000);
    const expiry = Date.now() + 60 * 1000 * 15; // 15 mins in ms

    const sendCode = await sendEmail(value.email, code);
    if (sendCode.error) {
      return res.status(500).json({
        success: false,
        message: "Couldn't send verification email.",
      });
    }

    value.emailToken = code;
    value.emailTokenExpires = new Date(expiry);
    value.employer = employer._id; // Link employee to employer

    // Save the employee in MongoDB
    const newEmployee = new Employee(value);
    await newEmployee.save();

    // Add employee to employer's employee list
    employer.employees.push(newEmployee._id);
    await employer.save();

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("signup-error", error);
    return res.status(500).json({
      success: false,
      message: "Cannot Register",
    });
  }
};

export const employeeResendToken = async (req, res) => {
  try {
    // Validation of data entered
    const { value, error } = resendTokenSchema.validate(req.body);
    if (error) {
      console.log(error.message);
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    const code = Math.floor(100000 + Math.random() * 900000);
    const expiry = Date.now() + 60 * 1000 * 15; // 15 mins in ms

    const sendCode = await sendEmail(value.email, code);
    if (sendCode.error) {
      return res.status(500).json({
        success: false,
        message: "Couldn't send verification email.",
      });
    }

    // Find the user by email, token, and token expiry date
    const employee = await Employee.findOne({
      email: value.email,
    });

    if (!employee) {
      return res.status(400).json({
        success: false,
        message: "Invalid account",
      });
    }
    employee.emailToken = code;
    employee.emailTokenExpires = new Date(expiry);

    // Save the updated user to the database
    await employee.save();

    return res.status(200).json({
      success: true,
      message: "Token Sent",
    });
  } catch (error) {
    console.error("signup-error", error);
    return res.status(500).json({
      success: false,
      message: "Error",
    });
  }
};

// activate account
export const employeeActivate = async (req, res) => {
  try {
    // Validate the request body
    const { error, value } = userSchemaActivate.validate(req.body);
    if (error) {
      console.log(error.message);
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Find the user by email, token, and token expiry date
    const employee = await Employee.findOne({
      email: value.email,
      emailToken: value.code,
      emailTokenExpires: { $gt: Date.now() },
    });

    if (!employee) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or activation code",
      });
    }

    if (employee.active) {
      return res.status(400).json({
        success: false,
        message: "Account already activated",
      });
    }

    // Generate wallet
    const bitcoinWalletResult = await generateBTCWallet();
    if (bitcoinWalletResult.error) {
      return res.status(400).json({
        success: false,
        message: bitcoinWalletResult.error.message,
      });
    }

    // Generate wallet
    const polygonWalletResult = await generatePolygonWallet();
    if (polygonWalletResult.error) {
      return res.status(400).json({
        success: false,
        message: polygonWalletResult.error.message,
      });
    }


    // Hash the password
    // const hashedPassword = await hashPassword(value.password);

    // encrypt private key
    const encryptbitcoinWalletPrivateKey =  encrypt(bitcoinWalletResult.privateKey);
    const encryptploygonWalletPrivateKey =  encrypt(polygonWalletResult.privateKey);
    
    // Update user details
    employee.emailToken = "null";
    employee.emailTokenExpires = null;
    employee.active = true;
    // employee.password= hashedPassword;
    employee.bitcoinWalletprivateKey = encryptbitcoinWalletPrivateKey;
    employee.polygonWalletprivateKey = encryptploygonWalletPrivateKey;
    employee.bitcoinWalletAddress = bitcoinWalletResult.walletAddress;
    employee.polygonWalletAddress = polygonWalletResult.walletAddress;

    // Save the updated user to the database
    await employee.save();

    return res.status(200).json({
      success: true,
      message: "Account activated",
    });
  } catch (error) {
    console.error("activation-error", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while activating the account",
    });
  }
};

export const employeeLogin = async (req, res) => {
  try {
    // Validate the request body
    const { error, value } = userSchemaLogin.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Find the employee by email
    const employee = await Employee.findOne({ email: value.email });

    // If employee is not found, return an error
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    // If the account is not activated, return an error
    if (!employee.active) {
      return res.status(400).json({
        success: false,
        message: "You must verify your email to activate your account",
      });
    }

    // Verify the password
    const isPasswordValid = await comparePasswords(
      value.password,
      employee.password
    );
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate the JWT access token
    const { error: tokenError, token } = await generateJwt(
      employee.email,
      employee._id
    );
    if (tokenError) {
      return res.status(500).json({
        success: false,
        message: "Couldn't create access token. Please try again later",
      });
    }



    // Get wallet Balance
    const walletBalance = await getWalletBTCBalance(employee.walletAddress);
    if (walletBalance.error) {
      return res.status(500).json({
        success: false,
        message: "Couldn't get wallet balance. Please try again later",
      });
    }

    // DecyrptedPrivateKey
    // const decryptedPrivateKey = decrypt(employee.privateKey, key, iv);


    const bitcoinWalletBalance = await getWalletBTCBalance(employee.bitcoinWalletAddress);
    if (bitcoinWalletBalance.error) {
      return res.status(500).json({
        success: false,
        message: `bitcoin wallet balance error:${bitcoinWalletBalance.error.message}`,
      });
    }

    const polygonWalletBalance = await getWalletPolygonBalance(employee.polygonWalletAddress);
    if (polygonWalletBalance.error) {
      return res.status(500).json({
        success: false,
        message: `polygon wallet error:${polygonWalletBalance.error.message}`,
      });
    }

    
    employee.bitcoinWalletBalance =bitcoinWalletBalance;
    employee.polygonWalletBalance = polygonWalletBalance;
    employee.accessToken = token;
    await employee.save();

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Employee logged in successfully",
      data: {
        accessToken: token,
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        walletBalance: walletBalance.balance,
        walletAddress: employee.walletAddress,
        bitcoinWalletBalance: bitcoinWalletBalance,
        polygonWalletBalance:polygonWalletBalance,
        bitcoinWalletAddress: employee.bitcoinWalletAddress,
        polygonWalletAddress: employee.polygonWalletAddress,
        bitcoinWalletprivateKey: employee.bitcoinWalletprivateKey,
        polygonWalletprivateKey:employee.polygonWalletprivateKey,

      },
    });
  } catch (err) {
    console.error("Login error", err);
    return res.status(500).json({
      success: false,
      message: "Couldn't login. Please try again later.",
    });
  }
};

export const employeeForgotPassword = async (req, res) => {
  try {
    // Validate the request body
    const { error, value } = userSchemaForgotPassword.validate(req.body);
    if (error) {
      console.log("Validation error:", error.message);
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Find the employee by email
    const employee = await Employee.findOne({ email: value.email });
    if (!employee) {
      console.log("Employee not found for email:", value.email);
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    // Generate a random code for password reset
    const resetCode = Math.floor(100000 + Math.random() * 900000);

    // Send the password reset email
    const emailResponse = await sendEmail(employee.email, resetCode);
    if (emailResponse.error) {
      console.error("Email sending error:", emailResponse.error.message);
      return res.status(500).json({
        success: false,
        message: "Couldn't send mail. Please try again later.",
      });
    }

    // Set the reset password token and expiry time
    const resetPasswordExpires = Date.now() + 60 * 1000 * 15; // 15 minutes
    employee.resetPasswordToken = resetCode;
    employee.resetPasswordExpires = resetPasswordExpires;

    // Save the changes to the employee document
    await employee.save();

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Password reset email sent successfully",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing your request.",
    });
  }
};

export const employeeResetPassword = async (req, res) => {
  try {
    // Validate the request body
    const { error, value } = userSchemaResetPassword.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Find the user by reset password token and expiry date
    const employee = await Employee.findOne({
      resetPasswordToken: value.token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Account not found or reset token expired",
      });
    }

    // Hash the new password
    const hashedPassword = await hashPassword(value.newPassword);

    // Update user password and reset token
    employee.password = hashedPassword;
    employee.resetPasswordToken = null;
    employee.resetPasswordExpires = null;

    // Save the changes
    await employee.save();

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Password has been changed successfully",
    });
  } catch (error) {
    console.error("reset-password-error", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const employeeLogout = async (req, res) => {
  try {
    // Validate the request body
    const { error, value } = userSchemaLogout.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Find the employee by user ID
    const employee = await Employee.findOne({ userId: value.id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Clear the access token
    employee.accessToken = "";
    employee.markModified("accessToken");
    // Save the changes
    await employee.save();

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Employee logged out successfully",
    });
  } catch (error) {
    console.error("employee-logout-error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing your request",
    });
  }
};
