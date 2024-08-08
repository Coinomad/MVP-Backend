const mongoose = require("mongoose");

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

const WaitListModel = mongoose.model("waitlist", waitListSchema);

module.exports = WaitListModel;
