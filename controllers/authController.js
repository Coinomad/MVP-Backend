import { generateWallet } from "../helpers/createWallet.js";
import { sendEmail } from "../helpers/mailer.js";
import { userSchema } from "../helpers/validation.js";
import { hashPassword, User } from "../model/userModel.js";
import { v4 as uuid } from "uuid";
export const Signup = async (req, res) => {
  try {
    // validation of data entered
    const result = userSchema.validate(req.body);
    if (result.error) {
      console.log(result.error.message);
      return res.status(400).json({
        error: true,
        status: 400,
        message: result.error.message,
      });
    }
    // check if email is already used
    const user = await User.findOne({
      email: result.value.email,
    });
    if (user) {
      return res.status(400).json({
        error: true,
        message: "Email is already in use",
      });
    }

    const hash = await hashPassword(result.value.password);
    const id = uuid(); //Generate unique id for the user.
    result.value.userId = id;

    delete result.value.confirmPassword;
    result.value.password = hash;

    let code = Math.floor(100000 + Math.random() * 900000);

    let expiry = Date.now() + 60 * 1000 * 15; //15 mins in ms

    const sendCode = await sendEmail(result.value.email, code);
    if (sendCode.error) {
      return res.status(500).json({
        error: true,
        message: "Couldn't send verification email.",
      });
    }
    result.value.emailToken = code;
    result.value.emailTokenExpires = new Date(expiry);

    // save the user on mongodb
    const newUser = new User(result.value);
    await newUser.save();

    return res.status(201).json({
      error: false,
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("signup-error", error);
    return res.status(500).json({
      error: true,
      message: "Cannot Register",
    });
  }
};

// activate account
export const Activate = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({
        error: true,
        message: "Please provide a valid email and activation code",
      });
    }

    const generatedWallet = await generateWallet(); // to generate wallet address
    if (generatedWallet.error) {
      return res.status(400).json({
        error: true,
        message: generatedWallet.error.message,
      });
    }

    const user = await User.findOne({
      email: email,
      emailToken: code,
      emailTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        error: true,
        message: "Invalid email or activation code",
      });
    }

    if (user.active) {
      return res.status(400).json({
        error: true,
        message: "Account already activated",
      });
    }

    user.emailToken = "null";
    user.emailTokenExpires = null;
    user.active = true;
    user.privateKey = generatedWallet.privateKey;
    user.walletAddress = generatedWallet.walletAddress;

    user.markModified('emailToken');
    user.markModified('emailTokenExpires');
    user.markModified('active');
    user.markModified('privateKey');
    user.markModified('walletAddress');

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Account activated",
    });
  } catch (error) {
    console.error("activation-error", error);
    return res.status(500).json({
      error: true,
      message: "An error occurred while activating the account",
    });
  }
};