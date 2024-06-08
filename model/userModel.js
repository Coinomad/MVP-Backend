import mongoose from "mongoose";
import bcrypt from "bcryptjs";
const Schema = mongoose.Schema;

// const userSchema = new Schema(
//   {
//     userId: { type: String, unique: true, required: true },
//     email: { type: String, required: true, unique: true },
//     active: { type: Boolean, default: false },
//     password: { type: String, required: true },
//     resetPasswordToken: { type: String, default: null },
//     resetPasswordExpires: { type: Date, default: null },
//     emailToken: { type: String, required: true, default: null },
//     privateKey: { type: String, default: null },
//     walletAddress: { type: String, default: null },
//     emailTokenExpires: { type: Date, default: null },
//     accessToken: { type: String, default: null },
//   },
//   {
//     timestamps: {
//       createdAt: "createdAt",
//       updatedAt: "updatedAt",
//     },
//   }
// );

const employerSchema = new Schema(
  {
    userId: { type: String, unique: true, required: true },
    email: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    organizationName: { type: String,  required: true },
    password: { type: String, required: true },
    active: { type: Boolean, default: false },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    emailToken: { type: String, default: null },
    emailTokenExpires: { type: Date, default: null },
   
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
    emailToken: { type: String,  default: null },
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

// export const User = mongoose.model("user", userSchema);

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
