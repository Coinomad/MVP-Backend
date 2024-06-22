import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const options = {
  expiresIn: "10y",
};

export const generateJwt = async (email, userId) => {
  try {
    const payload = { email: email, id: userId };
    const token = jwt.sign(payload, process.env.JWT_SECRET, options);
    return { error: false, token: token };
  } catch (error) {
    return { error: true };
  }
};


export const verifyToken = (token) => {
  return jwt.verify(token,process.env.JWT_SECRET);
};

