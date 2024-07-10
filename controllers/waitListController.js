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
    const waitemail = await WaitListModel.findOne({
      email: result.value.email,
    });
    
    if (waitemail) {
      return res.status(400).json({
        success: false,
        message: "Already part of waitlist",
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

export const getWaitlistUsers = async(req, res) => {
  try {
    const users = await WaitListModel.find();
    const user_count = await WaitListModel.countDocuments();
    if (!users) {
      return res.status(404).json({
        message: "No user in waitlist yet"
      });
    } else {
      return res.status(202).json({
        success: true,
        messsage: users,
        userCount: user_count
      })
    }

  } catch (error) {
    return res.status(500).json({
      success: false, 
      message: error.message
    });
  }
};