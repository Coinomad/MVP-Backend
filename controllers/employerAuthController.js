import { generateWallet } from "../helpers/createWallet.js";
import { generateJwt } from "../helpers/generateJwt.js";
import { sendEmail } from "../helpers/mailer.js";
import {
  resendTokenSchema,
  userSchema,
  userSchemaActivate,
  userSchemaForgotPassword,
  userSchemaLogin,
  userSchemaLogout,
  userSchemaResetPassword,
} from "../helpers/validation.js";
import {
  comparePasswords,
  Employer,
  hashPassword,
} from "../model/userModel.js";
import { v4 as uuid } from "uuid";
import employerauthRoutes from "../routes/employerAuthRoutes.js";

export const employerSignup = async (req, res) => {
  try {
    // Validate the data entered
    const { error, value } = userSchema.validate(req.body);
    if (error) {
      console.log(error.message);
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Check if email is already in use
    const existingemployer = await Employer.findOne({ email: value.email });
    if (existingemployer) {
      return res.status(400).json({
        success: false,
        message: "Email is already in use",
      });
    }

    // Hash the password
    const hashedPassword = await hashPassword(value.password);
    const userId = uuid(); // Generate unique ID for the user
    value.userId = userId;
    delete value.confirmPassword;
    value.password = hashedPassword;

    // Generate email verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000);
    const codeExpiry = Date.now() + 60 * 1000 * 15; // 15 mins in milliseconds

    // Send verification email
    const emailResult = await sendEmail(value.email, verificationCode);
    if (emailResult.error) {
      return res.status(500).json({
        success: false,
        message: "Couldn't send verification email.",
      });
    }

    // Store the verification code and its expiry
    value.emailToken = verificationCode;
    value.emailTokenExpires = new Date(codeExpiry);

    // Create a new employer
    const newEmployer = new Employer({
      ...value,
      uniqueLink: uuid(),
    });

    await newEmployer.save();

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


export const employerResendToken = async () => {
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

    const sendCode = await sendEmail(result.value.email, code);
    if (sendCode.error) {
      return res.status(500).json({
        success: false,
        message: "Couldn't send verification email.",
      });
    }
    // Find the user by email, token, and token expiry date
    const employer = await Employer.findOne({
      email: value.email,
    });

    if (!employer) {
      return res.status(400).json({
        success: false,
        message: "Invalid account",
      });
    }
    employer.emailToken = code;
    employer.emailTokenExpires = new Date(expiry);

    // Save the updated user to the database
    await employer.save();

    return res.status(200).json({
      success: true,
      message: "Token Sent",
    });
  } catch (error) {
    console.error("signup-error", error);
    return res.status(500).json({
      success: false,
      message: "Error Occured",
    });
  }
};



// activate account
export const employerActivate = async (req, res) => {
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

    // Generate wallet
    const walletResult = await generateWallet();
    if (walletResult.error) {
      return res.status(400).json({
        success: false,
        message: walletResult.error.message,
      });
    }

    // Find the user by email, token, and token expiry date
    const employer = await Employer.findOne({
      email: value.email,
      emailToken: value.code,
      emailTokenExpires: { $gt: Date.now() },
    });

    if (!employer) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or activation code",
      });
    }

    if (employer.active) {
      return res.status(400).json({
        success: false,
        message: "Account already activated",
      });
    }

    // Update user details
    employer.emailToken = null;
    employer.emailTokenExpires = null;
    employer.active = true;
    employer.privateKey = walletResult.privateKey;
    employer.walletAddress = walletResult.walletAddress;

    // Save the updated user to the database
    await employer.save();

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

export const employerLogin = async (req, res) => {
  try {
    // Validate the request body
    const { error, value } = userSchemaLogin.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Find the employer by email
    const employer = await Employer.findOne({ email: value.email });

    // If employer is not found, return an error
    if (!employer) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    // If the account is not activated, return an error
    if (!employer.active) {
      return res.status(400).json({
        success: false,
        message: "You must verify your email to activate your account",
      });
    }

    // Verify the password
    const isPasswordValid = await comparePasswords(
      value.password,
      employer.password
    );
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate the JWT access token
    const { error: tokenError, token } = await generateJwt(
      employer.email,
      employer.userId
    );
    if (tokenError) {
      return res.status(500).json({
        success: false,
        message: "Couldn't create access token. Please try again later",
      });
    }

    // Save the access token to the employer
    employer.accessToken = token;
    await employer.save();

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Employer logged in successfully",
      accessToken: token,
    });
  } catch (err) {
    console.error("Login error", err);
    return res.status(500).json({
      success: false,
      message: "Couldn't login. Please try again later.",
    });
  }
};

export const employerForgotPassword = async (req, res) => {
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

    // Find the employer by email
    const employer = await Employer.findOne({ email: value.email });
    if (!employer) {
      console.log("Employer not found for email:", value.email);
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    // Generate a random code for password reset
    const resetCode = Math.floor(100000 + Math.random() * 900000);

    // Send the password reset email
    const emailResponse = await sendEmail(employer.email, resetCode);
    if (emailResponse.error) {
      console.error("Email sending error:", emailResponse.error.message);
      return res.status(500).json({
        success: false,
        message: "Couldn't send mail. Please try again later.",
      });
    }

    // Set the reset password token and expiry time
    const resetPasswordExpires = Date.now() + 60 * 1000 * 15; // 15 minutes
    employer.resetPasswordToken = resetCode;
    employer.resetPasswordExpires = resetPasswordExpires;

    // Save the changes to the employer document
    await employer.save();

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

export const employerResetPassword = async (req, res) => {
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
    const employer = await Employer.findOne({
      resetPasswordToken: value.token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!employer) {
      return res.status(404).json({
        success: false,
        message: "Account not found or reset token expired",
      });
    }

    // Hash the new password
    const hashedPassword = await hashPassword(value.newPassword);

    // Update user password and reset token
    employer.password = hashedPassword;
    employer.resetPasswordToken = null;
    employer.resetPasswordExpires = null;

    // Save the changes
    await employer.save();

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

export const employerLogout = async (req, res) => {
  try {
    // Validate the request body
    const { error, value } = userSchemaLogout.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Find the employer by user ID
    const employer = await Employer.findOne({ userId: value.id });
    if (!employer) {
      return res.status(404).json({
        success: false,
        message: "Employer not found",
      });
    }

    // Clear the access token
    employer.accessToken = "";
    employer.markModified("accessToken");
    // Save the changes
    await employer.save();

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Employer logged out successfully",
    });
  } catch (error) {
    console.error("employer-logout-error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing your request",
    });
  }
};
