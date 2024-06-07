// import { generateWallet } from "../helpers/createWallet.js";
// import { generateJwt } from "../helpers/generateJwt.js";
// import { sendEmail } from "../helpers/mailer.js";
// import {
//   userSchema,
//   userSchemaActivate,
//   userSchemaForgotPassword,
//   userSchemaLogin,
//   userSchemaLogout,
//   userSchemaResetPassword,
// } from "../helpers/validation.js";
// // import { comparePasswords, hashPassword, User } from "../model/userModel.js";
// import { v4 as uuid } from "uuid";
// export const Signup = async (req, res) => {
//   try {
//     // validation of data entered
//     const result = userSchema.validate(req.body);
//     if (result.error) {
//       console.log(result.error.message);
//       return res.status(400).json({
//         success: false,
//         message: result.error.message,
//       });
//     }
//     // check if email is already used
//     const user = await User.findOne({
//       email: result.value.email,
//     });
//     if (user) {
//       return res.status(400).json({
//         success: false,
//         message: "Email is already in use",
//       });
//     }

//     const hash = await hashPassword(result.value.password);
//     const id = uuid(); //Generate unique id for the user.
//     result.value.userId = id;
//     delete result.value.confirmPassword;
//     result.value.password = hash;

//     let code = Math.floor(100000 + Math.random() * 900000);

//     let expiry = Date.now() + 60 * 1000 * 15; //15 mins in ms

//     const sendCode = await sendEmail(result.value.email, code);
//     if (sendCode.error) {
//       return res.status(500).json({
//         success: false,
//         message: "Couldn't send verification email.",
//       });
//     }
//     result.value.emailToken = code;
//     result.value.emailTokenExpires = new Date(expiry);

//     // save the user on mongodb
//     const newUser = new User(result.value);
//     await newUser.save();

//     return res.status(201).json({
//       success: true,
//       message: "User registered successfully",
//     });
//   } catch (error) {
//     console.error("signup-error", error);
//     return res.status(500).json({
//       success: false,
//       message: "Cannot Register",
//     });
//   }
// };

// // activate account
// export const Activate = async (req, res) => {
//   try {
//     const result = userSchemaActivate.validate(req.body);
//     if (result.error) {
//       console.log(result.error.message);
//       return res.status(400).json({
//         success: false,
//         message: result.error.message,
//       });
//     }
//     const generatedWallet = await generateWallet(); // to generate wallet address
//     if (generatedWallet.error) {
//       return res.status(400).json({
//         success: false,
//         message: generatedWallet.error.message,
//       });
//     }

//     const user = await User.findOne({
//       email: result.value.email,
//       emailToken: result.value.code,
//       emailTokenExpires: { $gt: Date.now() },
//     });

//     if (!user) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid email or activation code",
//       });
//     }

//     if (user.active) {
//       return res.status(400).json({
//         success: false,
//         message: "Account already activated",
//       });
//     }

//     user.emailToken = "null";
//     user.emailTokenExpires = null;
//     user.active = true;
//     user.privateKey = generatedWallet.privateKey;
//     user.walletAddress = generatedWallet.walletAddress;

//     await user.save();

//     return res.status(200).json({
//       success: true,
//       message: "Account activated",
//     });
//   } catch (error) {
//     console.error("activation-error", error);
//     return res.status(500).json({
//       success: false,
//       message: "An error occurred while activating the account",
//     });
//   }
// };

// export const Login = async (req, res) => {
//   try {
//     const result = userSchemaLogin.validate(req.body);
//     if (result.error) {
//       return res.status(400).json({
//         success: false,
//         message: result.error.message,
//       });
//     }

//     //1. Find if any account with that email exists in DB
//     const user = await User.findOne({ email: result.value.email });

//     // NOT FOUND - Throw error
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "Account not found",
//       });
//     }

//     //2. Throw error if account is not activated
//     if (!user.active) {
//       return res.status(400).json({
//         success: false,
//         message: "You must verify your email to activate your account",
//       });
//     }

//     //3. Verify the password is valid
//     const isValid = await comparePasswords(
//       result.value.password,
//       user.password
//     );

//     if (!isValid) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid credentials",
//       });
//     }

//     //Generate Access token
//     const { error, token } = await generateJwt(user.email, user.userId);
//     if (error) {
//       return res.status(500).json({
//         success: false,
//         message: "Couldn't create access token. Please try again later",
//       });
//     }
//     user.accessToken = token;
//     user.markModified("accessToken");
//     await user.save();

//     //Success
//     return res.status(200).send({
//       success: true,
//       message: "User logged in successfully",
//       accessToken: token,
//     });
//   } catch (err) {
//     console.error("Login error", err);
//     return res.status(500).json({
//       success: false,
//       message: "Couldn't login. Please try again later.",
//     });
//   }
// };

// export const ForgotPassword = async (req, res) => {
//   try {
//     const result = userSchemaForgotPassword.validate(req.body);
//     if (result.error) {
//       console.log(result.error.message);
//       return res.status(400).json({
//         success: false,
//         message: result.error.message,
//       });
//     }
//     const user = await User.findOne({
//       email: result.value.email,
//     });
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "Account not found",
//       });
//     }

//     let code = Math.floor(100000 + Math.random() * 900000);
//     let response = await sendEmail(user.email, code);

//     if (response.error) {
//       return res.status(500).json({
//         success: false,
//         message: "Couldn't send mail. Please try again later.",
//       });
//     }

//     let expiry = Date.now() + 60 * 1000 * 15;
//     user.resetPasswordToken = code;
//     user.resetPasswordExpires = expiry; // 15 minutes

//     await user.save();

//     return res.status(200).send({
//       success: true,
//       message: "Success",
//     });
//   } catch (error) {
//     console.error("forgot-password-error", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// export const ResetPassword = async (req, res) => {
//   try {
//     const result = userSchemaResetPassword.validate(req.body);
//     if (result.error) {
//       return res.status(400).json({
//         success: false,
//         message: result.error.message,
//       });
//     }

//     const user = await User.findOne({
//       resetPasswordToken: result.value.token,
//       resetPasswordExpires: { $gt: Date.now() },
//     });

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "Account not found",
//       });
//     }

//     const hash = await hashPassword(result.value.newPassword);
//     user.password = hash;
//     user.resetPasswordToken = null;
//     user.resetPasswordExpires = "";
//     user.markModified("password");
//     user.markModified("resetPasswordToken");
//     user.markModified("resetPasswordExpires");

//     await user.save();

//     return res.status(200).send({
//       success: true,
//       message: "Password has been changed",
//     });
//   } catch (error) {
//     console.error("reset-password-error", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// export const Logout = async (req, res) => {
//   try {
//     const result = userSchemaLogout.validate(req.body);
//     if (result.error) {
//       return res.status(400).json({
//         success: false,
//         message: result.error.message,
//       });
//     }

//     let user = await User.findOne({ userId: result.value.id });

//     user.accessToken = "";
//     user.markModified("accessToken");

//     await user.save();

//     return res.status(200).send({ success: true, message: "User Logged out" });
//   } catch (error) {
//     console.error("user-logout-error", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };


