import mongoose from "mongoose";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import cryptoJs from "crypto-js";
import { v4 as uuidv4 } from 'uuid';
dotenv.config();

const Schema = mongoose.Schema;

const employerSchema = new Schema(
  {
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
    bitcoinWalletprivateKey: { type: String, default: null },
    polygonWalletprivateKey: { type: String, default: null },
    bitcoinWalletAddress: { type: String, default: null },
    polygonWalletAddress: { type: String, default: null },
    bitcoinWalletBalance: {
      incoming: { type: String, default: "0" },
      outgoing: { type: String, default: "0" },
      incomingPending: { type: String, default: "0" },
      outgoingPending: { type: String, default: "0" },
    },
    polygonWalletBalance: {
      balance: { type: String, default: "0" },
    },
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
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    walletAddress:{ type: String, required: true,unique: true  },
    asset: { type: String, enum: ["BTC", "Polygon"], required: true },
    employer: {
      type: Schema.Types.ObjectId,
      ref: "Employer",
    },
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
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employer",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    walletType: { type: String, enum: ["BTC", "Polygon"], required: true },
    employerAddress: {
      type: String,
      required: true,
    },
    employees: [
      {
        employeeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
          required: true,
        },
        employeeWalletAddress: {
          type: String,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        employerAddress: {
          type: String,
          required: true,
        },
      },
    ],
  
    transactionId: { type: String, required: true, unique: true },
    status: {
      type: String,
      required: true,
      enum: ["Pending", "Completed", "Failed"],
      default: "Pending",
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
export const Transaction = mongoose.model("Transaction", transactionSchema);
