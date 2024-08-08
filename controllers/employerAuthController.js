const {
  generateBTCWallet,
  getCryptoPriceInUSD,
  getWalletBTCBalance,
} = require("../helpers/wallets/btcWallet.js");
const { generateJwt } = require("../helpers/generateJwt.js");
const { sendEmail } = require("../helpers/mailer.js");
const {
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
} = require("../helpers/validation.js");
const { Employer } = require("../model/userModel.js");
const { v4: uuid } = require("uuid");
const employerauthRoutes = require("../routes/employerAuthRoutes.js");
const {
  hashPassword,
  comparePasswords,
  decrypt,
  encrypt,
  getBitcoinActualBalance,
  convertWalletAddressToQRCode,
  createWebhookSubscription,
} = require("../helpers/helpers.js");
const {
  generatePolygonWallet,
  getWalletPolygonBalance,
} = require("../helpers/wallets/polygonWallet.js");

const employerEmailSignup = async (req, res) => {
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

const employerVerfiyEmailSignup = async (req, res) => {
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

const employerResendToken = async (req, res) => {
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

    // Find the user by email
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

const employerDetails = async (req, res) => {
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

const employerLogin = async (req, res) => {
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
        message: "Account not activated",
      });
    }

    // Check if the password matches
    const isMatch = await comparePasswords(value.password, employer.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect password",
      });
    }

    // Generate JWT token
    const token = await generateJwt(employer._id, employer.email);
    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
      },
    });
  } catch (error) {
    console.error("signup-error", error);
    return res.status(500).json({
      success: false,
      message: "Cannot Login",
    });
  }
};

const employerForgotPassword = async (req, res) => {
  try {
    // Validate the data entered
    const { error, value } = userSchemaForgotPassword.validate(req.body);

    if (error) {
      console.log(error.message);
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Check if email exists
    const employer = await Employer.findOne({ email: value.email });
    if (!employer) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    // Generate reset token
    const resetToken = uuid();
    const resetTokenExpiry = Date.now() + 60 * 60 * 1000; // 1 hour

    // Update user with reset token and expiry
    employer.resetToken = resetToken;
    employer.resetTokenExpiry = resetTokenExpiry;
    await employer.save();

    // Send reset token via email
    const emailResult = await sendEmail(value.email, resetToken);
    if (emailResult.error) {
      return res.status(500).json({
        success: false,
        message: "Couldn't send reset email.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Reset email sent",
    });
  } catch (error) {
    console.error("forgot-password-error", error);
    return res.status(500).json({
      success: false,
      message: "Error Occurred",
    });
  }
};

const employerResetPassword = async (req, res) => {
  try {
    // Validate the data entered
    const { error, value } = userSchemaResetPassword.validate(req.body);

    if (error) {
      console.log(error.message);
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Find the user by reset token and expiry
    const employer = await Employer.findOne({
      resetToken: value.token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!employer) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    // Hash the new password
    const hashedPassword = await hashPassword(value.password);

    // Update the user's password
    employer.password = hashedPassword;
    employer.resetToken = null;
    employer.resetTokenExpiry = null;

    await employer.save();

    return res.status(200).json({
      success: true,
      message: "Password has been reset",
    });
  } catch (error) {
    console.error("reset-password-error", error);
    return res.status(500).json({
      success: false,
      message: "Error Occurred",
    });
  }
};

const employerLogout = async (req, res) => {
  try {
    // Validate the data entered
    const { error, value } = userSchemaLogout.validate(req.body);
    if (error) {
      console.log(error.message);
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Check if the user exists
    const employer = await Employer.findOne({ email: value.email });
    if (!employer) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    // Perform logout actions (e.g., invalidate tokens)
    // This depends on your token management and auth strategy

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("logout-error", error);
    return res.status(500).json({
      success: false,
      message: "Error Occurred",
    });
  }
};

module.exports = {
  employerEmailSignup,
  employerVerfiyEmailSignup,
  employerResendToken,
  employerDetails,
  employerLogin,
  employerForgotPassword,
  employerResetPassword,
  employerLogout,
};
