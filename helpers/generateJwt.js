import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const options = {
  expiresIn: "1h",
};

export const generateJwt = async (email, userId) => {
  try {
    const payload = { email: email, id: userId };
    const token = await jwt.sign(payload, process.env.JWT_SECRET, options);
    return { error: false, token: token };
  } catch (error) {
    return { error: true };
  }
};
