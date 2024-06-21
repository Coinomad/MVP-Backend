import { generateBTCWallet, getWalletBTCBalance } from "../helpers/wallets/btcWallet.js";
import { generateJwt } from "../helpers/generateJwt.js";
import { sendEmail } from "../helpers/mailer.js";
import {
  employerDetailsSchema,
  employerEmailSchema,
  employerSchema,
  employerVerfiyEmailSchema,
  resendTokenSchema,
  userSchema,
  userSchemaActivate,
  userSchemaForgotPassword,
  userSchemaLogin,
  userSchemaLogout,
  userSchemaResetPassword,
} from "../helpers/validation.js";
import {
  
  Employer,
 
} from "../model/userModel.js";
import { v4 as uuid } from "uuid";
import employerauthRoutes from "../routes/employerAuthRoutes.js";
import { hashPassword, comparePasswords,decrypt,encrypt } from "../helpers/helpers.js";
import { getWalletPolygonBalance } from "../helpers/wallets/polygonWallet.js";

export const employerEmailSignup = async (req, res) => {
  try {
    // Validate the data entered
    const { error, value } = employerEmailSchema.validate(req.body);

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

    // Generate unique ID for the user
    const userId = uuid();
    value.userId = userId;

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

export const employerVerfiyEmailSignup = async (req, res) => {
  try {
    // Validate the data entered
    const { error, value } = userSchemaActivate.validate(req.body);
    if (error) {
      console.log(error.message);
      return res.status(400).json({
        success: false,
        message: error.message,
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

    // Save the updated user to the database
    await employer.save();

    return res.status(200).json({
      success: true,
      message: "Account activated",
    });
  } catch (error) {
    console.error("signup-error", error);
    return res.status(500).json({
      success: false,
      message: "Cannot Register",
    });
  }
};

export const employerResendToken = async (req, res) => {
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
    const employer = await Employer.findOne({
      email: value.email,
    });

    if (!employer) {
      return res.status(404).json({
        success: false,
        message: "Invalid account",
      });
    }

    // Update user details
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

export const employerDetails = async (req, res) => {
  try {
    // Validate the data entered
    const { error, value } = employerDetailsSchema.validate(req.body);

    if (error) {
      console.log(error.message);
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Check if email or organization name is already in use
    const [employerByEmail, employerByOrgName] = await Promise.all([
      Employer.findOne({ email: value.email }),
      Employer.findOne({ organizationName: value.organizationName }),
    ]);

    // Check if email is not registered
    if (!employerByEmail) {
      return res.status(404).json({
        success: false,
        message: "Email is not registered",
      });
    }

    // Check if organization name is already in use
    if (employerByOrgName) {
      return res.status(400).json({
        success: false,
        message: "Organization name is already in use",
      });
    }

    // Generate wallet
    const walletResult = await generateBTCWallet();
    if (walletResult.error) {
      return res.status(400).json({
        success: false,
        message: walletResult.error.message,
      });
    }

    // Hash the password
    const hashedPassword = await hashPassword(value.password);

    // hash private key
    const encryptPrivateKey = await encrypt(walletResult.privateKey);
    employerByEmail.firstName = value.firstName;
    employerByEmail.lastName = value.lastName;
    employerByEmail.organizationName = value.organizationName;
    employerByEmail.password = hashedPassword;
    employerByEmail.privateKey = encryptPrivateKey;
    employerByEmail.walletAddress = walletResult.walletAddress;

    // Save the changes
    await employerByEmail.save();

    return res.status(201).json({
      success: true,
      message: "User Details registered successfully",
    });
  } catch (error) {
    console.error("signup-error", error);
    return res.status(500).json({
      success: false,
      message: "Cannot Register",
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

    const bitcoinWalletBalance = await getWalletBTCBalance(employer.walletAddress);
    if (bitcoinWalletBalance.error) {
      return res.status(500).json({
        success: false,
        message: "Couldn't get bitcoin wallet balance. Please try again later",
      });
    }

    const polygonWalletBalance = await getWalletPolygonBalance(employer.walletAddress)
    if (polygonWalletBalance.error) {
      return res.status(500).json({
        success: false,
        message: "Couldn't get polygon wallet balance. Please try again later",
      });
    }


    // DecyrptedPrivateKey
    // const decryptedPrivateKey = await decrypt(employer.privateKey);



    // Return success response
    return res.status(200).json({
      success: true,
      message: "Employer logged in successfully",
      data: {
        accessToken: token,
        email: employer.email,
        firstName: employer.firstName,
        lastName: employer.lastName,
        organizationName: employer.organizationName,
        bitcoinWalletBalance: bitcoinWalletBalance,
        polygonWalletBalance:polygonWalletBalance,
        walletAddress: employer.walletAddress,
        privateKey: employer.privateKey,
        uniqueLink: employer.uniqueLink
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

// export const employerLogout = async (req, res) => {
//   try {
//     // Validate the request body
//     const { error, value } = userSchemaLogout.validate(req.body);
//     if (error) {
//       return res.status(400).json({
//         success: false,
//         message: error.message,
//       });
//     }

//     // Find the employer by user ID
//     const employer = await Employer.findOne({ userId: value.id });
//     if (!employer) {
//       return res.status(404).json({
//         success: false,
//         message: "Employer not found",
//       });
//     }

//     // Clear the access token
//     employer.accessToken = "";

//     // Save the changes
//     await employer.save();

//     // Return success response
//     return res.status(200).json({
//       success: true,
//       message: "Employer logged out successfully",
//     });
//   } catch (error) {
//     console.error("employer-logout-error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "An error occurred while processing your request",
//     });
//   }
// };
