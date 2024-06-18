import mongoose from "mongoose";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import cryptoJs from "crypto-js";

dotenv.config();

const Schema = mongoose.Schema;

const employerSchema = new Schema(
  {
    userId: { type: String, unique: true, required: true },
    email: { type: String, required: true, unique: true },
    firstName: { type: String, required: true, default: "nil" },
    lastName: { type: String, required: true, default: "nil" },
    organizationName: {
      type: String,
      required: true,
      default: "nil",
    },
    password: { type: String, required: true, default: "nil" },
    active: { type: Boolean, default: false },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    emailToken: { type: String, default: null },
    emailTokenExpires: { type: Date, default: null },
    privateKey: { type: String, default: null },
    walletAddress: { type: String, default: null },
    uniqueLink: {
      type: String,
      required: true,
      unique: true,
    },
    employees: [
      {
        type: Schema.Types.ObjectId,
        ref: "Employee",
      },
    ],
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  }
);

const employeeSchema = new Schema(
  {
    userId: { type: String, unique: true, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    active: { type: Boolean, default: false },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    emailToken: { type: String, default: null },
    privateKey: { type: String, default: null },
    walletAddress: { type: String, default: null },
    emailTokenExpires: { type: Date, default: null },
    employer: {
      type: Schema.Types.ObjectId,
      ref: "Employer",
    },
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  }
);

export const Employer = mongoose.model("Employer", employerSchema);
export const Employee = mongoose.model("Employee", employeeSchema);

export const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    throw new Error("Hashing failed", error);
  }
};

export const comparePasswords = async (inputPassword, hashedPassword) => {
  try {
    return await bcrypt.compare(inputPassword, hashedPassword);
  } catch (error) {
    throw new Error("Comparison failed", error);
  }
};

// Generate a random key and initialization vector (IV)
const algorithm = "aes-256-cbc";
const key = process.env.ENCRYPTION_KEY;

export const encrypt = (text) => {
  const cipherText = cryptoJs.AES.encrypt(text, key).toString();
 
  return cipherText;
};

export const decrypt = (encryptedText) => {
  try {
    const bytes = cryptoJs.AES.decrypt(encryptedText, key);
    if (bytes.sigBytes > 0) {
      const decryptedData = bytes.toString(cryptoJs.enc.Utf8);
      return decryptedData;
    } else {
      throw new Error("Decryption Failed Invalid Key");
    }
  } catch (error) {
    throw new Error("Decryption Failed Invalid Key", error);
  }
};
