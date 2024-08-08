const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const options = {
  expiresIn: "10y",
};

const generateJwt = async (email, userId) => {
  try {
    const payload = { email: email, id: userId.toHexString() };
    const token = jwt.sign(payload, process.env.JWT_SECRET, options);
    return { error: false, token: token };
  } catch (error) {
    return { error: true };
  }
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = {
  generateJwt,
  verifyToken,
};
