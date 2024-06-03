import { waitListSchema } from "../helpers/validation.js";
import { WaitListModel } from "../model/waitListModel.js";

// WaitList
export const WaitListController = async (req, res) => {
  try {
    const result = waitListSchema.validate(req.body);
    if (result.error) {
      return res.status(400).json({
        success: false,
        message: result.error.message,
      });
    }
    // check if email is already used
    const user = await User.findOne({
      email: result.value.email,
    });
    if (user) {
      return res.status(400).json({
        success: false,
        message: "Email is already in use",
      });
    }
    // save the user on mongodb
    const newUser = new WaitListModel(result.value);
    await newUser.save();

    return res.status(200).send({ success: true, message: "Joined Wait List" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
