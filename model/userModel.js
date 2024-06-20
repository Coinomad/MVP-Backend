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
    btcBalance: { type: Number, required: true, default: 0 },
    polygonBalance: { type: Number, required: true, default: 0 },
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
    transactions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Transaction",
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
    btcBalance: { type: Number, required: true, default: 0 },
    polygonBalance: { type: Number, required: true, default: 0 },
    transactions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Transaction",
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

const transactionSchema = new Schema(
  {
    employer: {
      type: Schema.Types.ObjectId,
      ref: "Employer",
      required: true,
    },
    employee: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    amount: { type: Number, required: true },
    walletType: { type: String, enum: ['BTC', 'Polygon'], required: true },
    timestamp: { type: Date, default: Date.now },
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
export const Transaction = mongoose.model("Transaction", transactionSchema);
