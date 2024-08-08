const { verifyToken } = require("../helpers/generateJwt.js");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ error: true, message: "Access Denied. No token provided." });
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    // console.log("Jwt worked", decoded);
    next();
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "Invalid token" });
  }
};

module.exports = { authMiddleware };
