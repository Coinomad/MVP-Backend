import mongoose from "mongoose";



const Schema = mongoose.Schema;


const waitListSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  }
);

export const WaitListModel = mongoose.model("waitlist", waitListSchema);
