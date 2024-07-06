import {
  generateBTCWallet,
  getCryptoPriceInUSD,
  getWalletBTCBalance,
} from "../helpers/wallets/btcWallet.js";
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
import { Employer } from "../model/userModel.js";
import { v4 as uuid } from "uuid";
import employerauthRoutes from "../routes/employerAuthRoutes.js";
import {
  hashPassword,
  comparePasswords,
  decrypt,
  encrypt,
  getBitcoinActualBalance,
  convertWalletAddressToQRCode,
  createWebhookSubscription,
} from "../helpers/helpers.js";
import {
  generatePolygonWallet,
  getWalletPolygonBalance,
} from "../helpers/wallets/polygonWallet.js";

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
    // const userId = uuid();
    // value.userId = userId;

    // Store the verification code and its expiry
    value.emailToken = verificationCode;
    value.emailTokenExpires = new Date(codeExpiry);

    // Create a new employer
    const newEmployer = new Employer({
      ...value,
      uniqueLink: uuid(),
    });
    await newEmployer.save()


 

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
    const bitcoinWalletResult = await generateBTCWallet();
    if (bitcoinWalletResult.error) {
      return res.status(400).json({
        success: false,
        message: `bitcoin wallet error:${bitcoinWalletResult.error.message}`,
      });
    }

    // Generate wallet
    const polygonWalletResult = await generatePolygonWallet();
    if (polygonWalletResult.error) {
      return res.status(400).json({
        success: false,
        message: `polygon wallet error:${polygonWalletResult.error.message}`,
      });
    }

    // Hash the password
    const hashedPassword = await hashPassword(value.password);

    // hash private key
    const encryptbitcoinWalletPrivateKey = encrypt(
      bitcoinWalletResult.privateKey
    );
    const encryptploygonWalletPrivateKey = encrypt(
      polygonWalletResult.privateKey
    );

    employerByEmail.firstName = value.firstName;
    employerByEmail.lastName = value.lastName;
    employerByEmail.organizationName = value.organizationName;
    employerByEmail.password = hashedPassword;
    employerByEmail.bitcoinWalletprivateKey = encryptbitcoinWalletPrivateKey;
    employerByEmail.polygonWalletprivateKey = encryptploygonWalletPrivateKey;
    employerByEmail.bitcoinWalletAddress = bitcoinWalletResult.walletAddress;
    employerByEmail.polygonWalletAddress = polygonWalletResult.walletAddress;

    // Save the changes
    await employerByEmail.save();
    

    const result = await createWebhookSubscription(employerByEmail);
    if (result.error) {
      console.log(result.error);
      return res.status(500).json({
        success: false,
        message: `Error registering webhook`,
      });
    }


    // Save the updated user to the database
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
      employer._id
    );

    if (tokenError) {
      return res.status(500).json({
        success: false,
        message: "Couldn't create access token. Please try again later",
      });
    }

    const bitcoinWalletBalance = await getWalletBTCBalance(
      employer.bitcoinWalletAddress
    );
    if (bitcoinWalletBalance.error) {
      console.log("bitcoinWalletBalance.error",bitcoinWalletBalance.error);
      return res.status(500).json({
        success: false,
        message: `bitcoin wallet balance error`,
      });
    }
    console.log(bitcoinWalletBalance);

    const bitcoinActualBalance = await getBitcoinActualBalance(
      Number(bitcoinWalletBalance.incoming),
      Number(bitcoinWalletBalance.incomingPending),
      Number(bitcoinWalletBalance.outgoing),
      Number(bitcoinWalletBalance.outgoingPending)
    );
    console.log(bitcoinActualBalance);

    const polygonWalletBalance = await getWalletPolygonBalance(
      employer.polygonWalletAddress
    );
    if (polygonWalletBalance.error) {
      return res.status(500).json({
        success: false,
        message: `polygon wallet error:${polygonWalletBalance.error.message}`,
      });
    }

    employer.bitcoinWalletBalance = bitcoinWalletBalance;
    employer.polygonWalletBalance = polygonWalletBalance;
    employer.accessToken = token;

 

    await employer.save();

    //convert bitcoin wallet address to qr code
    const employerbitcoinWalletQrCode = await convertWalletAddressToQRCode(
      employer.bitcoinWalletAddress
    );

    //convert polygon wallet address to qr code
    const employerPolygonWalletQrCode = await convertWalletAddressToQRCode(
      employer.polygonWalletAddress
    );

    const bitcoinAmountInDollars = await getCryptoPriceInUSD("BTC");
    if (bitcoinAmountInDollars.error) {
      return res.status(500).json({
        success: false,
        message: `bitcoin wallet error`,
      });
    }
    const dollarBitcoinBalance  = parseFloat(bitcoinAmountInDollars) *  bitcoinActualBalance;

    const polygonAmountInDollars = await getCryptoPriceInUSD("MATIC");
    if (polygonAmountInDollars.error) {
      return res.status(500).json({
        success: false,
        message: `polygon wallet error`,
      });
    }
    const dollarMaticBalance  = parseFloat(bitcoinAmountInDollars) *   polygonWalletBalance;

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
        polygonWalletBalance: polygonWalletBalance,
        bitcoinTotalBalance: bitcoinActualBalance,
        bitcoinWalletQrCode: employerbitcoinWalletQrCode,
        polygonWalletQrCode: employerPolygonWalletQrCode,
        bitcoinWalletAddress: employer.bitcoinWalletAddress,
        polygonWalletAddress: employer.polygonWalletAddress,
        bitcoinWalletprivateKey: employer.bitcoinWalletprivateKey,
        polygonWalletprivateKey: employer.polygonWalletprivateKey,
        polygonAmountInDollars,
        bitcoinAmountInDollars,
        dollarBitcoinBalance,
        dollarMaticBalance,
        uniqueLink: employer.uniqueLink,

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
